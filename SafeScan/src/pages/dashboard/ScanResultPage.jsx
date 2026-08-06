import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Server,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  Terminal,
  Activity,
  Award,
  RefreshCw,
  Bug,
  Flame,
  MinusCircle,
  PlusCircle,
  Globe
} from 'lucide-react';

const SEVERITY_LEGEND = [
  {
    key: 'Critical', label: 'Critical', cvss: 'CVSS 9.0 - 10.0', deduction: 'หัก 0.3 × CVSS² (หัก 24.3 - 30.0 คะแนน/รายการ | เพดานคะแนนสูงสุด 29)', dot: 'bg-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700',
    meaning: 'ผู้โจมตีเข้าถึงหรือรันโค้ดบนระบบได้โดยไม่ต้อง Authentication เช่น SQL Injection, RCE หากพบ จะส่งผลให้ Severity Ceiling ไม่เกิน 29 (เกรด F)'
  },
  {
    key: 'High', label: 'High', cvss: 'CVSS 7.0 - 8.9', deduction: 'หัก 0.3 × CVSS² (หัก 14.7 - 23.8 คะแนน/รายการ | เพดานคะแนนสูงสุด 49)', dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700',
    meaning: 'ผลกระทบรุนแรงแต่ต้องมีเงื่อนไข เช่น XSS, Auth Bypass หากพบ จะส่งผลให้ Severity Ceiling ไม่เกิน 49 (เกรด D)'
  },
  {
    key: 'Medium', label: 'Medium', cvss: 'CVSS 4.0 - 6.9', deduction: 'หัก 0.3 × CVSS² (หัก 4.8 - 14.3 คะแนน/รายการ | เพดานคะแนนสูงสุด 69)', dot: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700',
    meaning: 'ความเสี่ยงปานกลาง เช่น CSRF, Sensitive File, Weak TLS หากพบ จะส่งผลให้ Severity Ceiling ไม่เกิน 69 (เกรด C)'
  },
  {
    key: 'Low', label: 'Low', cvss: 'CVSS 0.1 - 3.9', deduction: 'หัก 0.3 × CVSS² (หัก 0.1 - 4.6 คะแนน/รายการ | เพดานคะแนนสูงสุด 89)', dot: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600',
    meaning: 'ผลกระทบน้อย เช่น Missing Security Header, Banner Disclosure หากพบ จะส่งผลให้ Severity Ceiling ไม่เกิน 89 (เกรด B)'
  },
];

const GRADE_LEGEND = [
  { grade: 'A', range: '90 - 100', dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'ปลอดภัยดีเยี่ยม — ผ่านมาตรฐาน OWASP 2025' },
  { grade: 'B', range: '70 - 89', dot: 'bg-blue-600', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', desc: 'พอใช้ — มีประเด็นเล็กน้อยที่ควรปรับปรุง' },
  { grade: 'C', range: '50 - 69', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', desc: 'ควรปรับปรุง — มีช่องโหว่เสี่ยงปานกลางหลายจุด' },
  { grade: 'D', range: '30 - 49', dot: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', desc: 'ความเสี่ยงสูง — ควรเร่งแก้ไขโดยด่วน' },
  { grade: 'F', range: '0 - 29', dot: 'bg-rose-600', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', desc: 'อันตราย — ห้ามใช้งานใน Production' },
];

const BONUS_POINTS_TABLE = [
  { key: 'https', label: 'HTTPS / SSL ผ่านทุก Check', points: '+5', condition: 'ใช้ HTTPS และผล SSLyze ไม่พบปัญหาด้าน Certificate หรือ Protocol เลย' },
  { key: 'headers', label: 'Security Headers ครบถ้วน', points: '+5', condition: 'มี HSTS, X-Content-Type-Options, CSP และการป้องกัน Clickjacking ครบทุกตัว ไม่ขาดแม้แต่หัวเดียว' },
  { key: 'ports', label: 'ไม่เปิดพอร์ตสุ่มเสี่ยง', points: '+3', condition: 'ผลสแกน Nmap ไม่เจอการเปิดพอร์ตบริหารจัดการหรือฐานข้อมูล (เช่น SSH, MySQL, RDP)' },
  { key: 'banner', label: 'ซ่อน Server Banner', points: '+2', condition: 'ไม่เปิดเผยเลขเวอร์ชันซอฟต์แวร์เซิร์ฟเวอร์ใน HTTP Header หรือ Nikto Scan' },
];

const SEVERITY_META = {
  Critical: { dot: 'bg-rose-600', text: 'text-rose-700', bg: 'bg-rose-50' },
  High: { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
  Medium: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  Low: { dot: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
};

const getSeverityMeta = (severity) => SEVERITY_META[severity] || SEVERITY_META.Low;

const ScanResultPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();

  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRawTab, setActiveRawTab] = useState('nmap');
  const [showScoringModal, setShowScoringModal] = useState(false);

  useEffect(() => {
    fetchScanStatus();
  }, [scanId]);

  const fetchScanStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/scan/status/${scanId}`);

      if (response.data.success) {
        setScanResult(response.data);
      } else {
        setError('ไม่สามารถดึงข้อมูลผลการสแกนได้');
      }
    } catch (err) {
      console.error('Error fetching scan result:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-bold animate-pulse">กำลังโหลดผลการสแกนความปลอดภัย...</p>
      </div>
    );
  }

  if (error || !scanResult) {
    return (
      <div className="w-full max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xl space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">{error || 'ไม่พบข้อมูลผลการสแกนนี้'}</h3>
        <button
          onClick={() => navigate('/history')}
          className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700 transition-all"
        >
          กลับไปหน้าประวัติการสแกน
        </button>
      </div>
    );
  }

  const summary = scanResult?.data?.summary || {};
  const details = scanResult?.data?.details || {};
  const zapAlerts = details.zap_alerts || [];

  const deductionBreakdown = scanResult?.data?.deductionBreakdown || [];
  const bonusBreakdown = scanResult?.data?.bonusBreakdown || [];

  const countedDeductions = deductionBreakdown.filter((d) => d.counted);
  const uncountedDeductions = deductionBreakdown.filter((d) => !d.counted);

  const countedBySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  countedDeductions.forEach((d) => { if (countedBySeverity[d.severity] !== undefined) countedBySeverity[d.severity]++; });

  const getGradeBadgeClass = (grade) => {
    if (grade === 'A') return 'bg-emerald-500 shadow-emerald-500/20';
    if (grade === 'B') return 'bg-blue-600 shadow-blue-600/20';
    if (grade === 'C') return 'bg-amber-500 shadow-amber-500/20';
    if (grade === 'D') return 'bg-orange-500 shadow-orange-500/20';
    return 'bg-rose-600 shadow-rose-600/20';
  };

  const getGradeTextClass = (grade) => {
    if (grade === 'A') return 'text-emerald-600';
    if (grade === 'B') return 'text-blue-600';
    if (grade === 'C') return 'text-amber-600';
    if (grade === 'D') return 'text-orange-600';
    return 'text-rose-600';
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-4 font-sans text-slate-800 space-y-8">
      
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับไปประวัติสแกน
        </button>
        <span className="text-xs font-mono text-slate-400">Scan ID: #{scanId}</span>
      </div>

      {/* SECTION 1: Summary Header Card */}
      <div className="relative bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 rounded-3xl p-8 text-white shadow-2xl border border-blue-900/40 overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-extrabold border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>OWASP 2025 Comprehensive Assessment</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight break-all">
              {scanResult.targetUrl}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
              รายงานผลการประเมินภัยคุกคามไซเบอร์และช่องโหว่ความปลอดภัย ผ่านเอนจินสแกน 4 Layer (Nmap, SSLyze, Nikto, OWASP ZAP)
            </p>

            <button
              onClick={() => setShowScoringModal(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white transition-colors cursor-pointer pt-2"
            >
              <Info className="w-4 h-4 text-blue-400" /> ดูคำอธิบายสูตรคำนวณคะแนน & ความหมายของเกรด
            </button>
          </div>

          {/* Grade Badge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-inner text-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">
              Overall Security Grade
            </span>
            <div className={`w-20 h-20 rounded-2xl ${getGradeBadgeClass(summary.grade)} text-white font-black text-4xl flex items-center justify-center shadow-lg mb-2`}>
              {summary.grade || 'N/A'}
            </div>
            <p className="text-xl font-black text-white">
              {summary.finalScore ?? 0} <span className="text-xs text-slate-400 font-normal">/ 100 Points</span>
            </p>
            {summary.totalRiskPoints !== undefined && (
              <div className="mt-2 text-[10px] font-medium text-slate-300 space-y-0.5 border-t border-white/10 pt-2 w-full text-center">
                <p>Total Risk Points: <strong className="text-rose-300 font-bold">{summary.totalRiskPoints}</strong></p>
                <p>Raw Score: <strong className="text-blue-200 font-bold">{summary.rawScore ?? 100}</strong> | Ceiling: <strong className="text-amber-300 font-bold">{summary.severityCeiling ?? 100}</strong></p>
              </div>
            )}
            {summary.isAutoFail && (
              <span className="mt-2 text-[10px] font-extrabold text-rose-300 bg-rose-500/30 px-2.5 py-0.5 rounded-full border border-rose-400/40">
                Auto-fail (A01 Broken Access Control)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: 5-Tool Status Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
          ผลการทำงานของเอนจินสแกนทั้ง 5 ระบบ (5-Engine Status Suite)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Card 1: Nmap */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm border-t-4 border-t-purple-500 flex flex-col justify-between space-y-3 hover:border-purple-300 transition-all">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-purple-600" /> Nmap
                </h4>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${details.is_nmap_success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {details.is_nmap_success ? 'SUCCESS' : 'ERROR'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Network Layer (OWASP A02)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-xs font-semibold text-slate-700 space-y-1">
              <p className="flex justify-between text-[11px]"><span>• พอร์ตเปิด:</span> <strong className="text-slate-900">{details.open_ports_detected ?? 0}</strong></p>
              {details.risky_ports && details.risky_ports.length > 0 ? (
                <p className="text-rose-600 font-bold text-[10px]">พบพอร์ตเสี่ยง: {details.risky_ports.join(', ')}</p>
              ) : (
                <p className="text-emerald-600 font-bold text-[10px]">ไม่พบพอร์ตเสี่ยง</p>
              )}
            </div>
          </div>

          {/* Card 2: SSLyze */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm border-t-4 border-t-blue-500 flex flex-col justify-between space-y-3 hover:border-blue-300 transition-all">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> SSLyze
                </h4>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${details.is_sslyze_success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {details.is_sslyze_success ? 'SUCCESS' : 'ERROR'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Transport Layer (OWASP A04)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-xs font-semibold text-slate-700">
              {(() => {
                const sslFinding = deductionBreakdown.find((d) => d.source === 'SSLyze');
                return sslFinding ? (
                  <p className="text-orange-600 font-bold text-[10px]">{sslFinding.label}</p>
                ) : (
                  <p className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ไม่พบปัญหา SSL/TLS
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Card 3: Nikto Web Server Scanner */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm border-t-4 border-t-cyan-500 flex flex-col justify-between space-y-3 hover:border-cyan-300 transition-all">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-600" /> Nikto
                </h4>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${details.is_nikto_success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {details.is_nikto_success ? 'SUCCESS' : 'ERROR'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Web Server Layer (OWASP A02)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-xs font-semibold text-slate-700">
              {(() => {
                const niktoFindings = deductionBreakdown.filter((d) => d.source === 'Nikto');
                return niktoFindings.length > 0 ? (
                  <p className="text-orange-600 font-bold text-[10px]">
                    พบข้อสังเกต: {niktoFindings.map(f => f.label).join(', ')}
                  </p>
                ) : (
                  <p className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ไม่พบไฟล์เสี่ยงบนเซิร์ฟเวอร์
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Card 4: Fetch Security Headers */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm border-t-4 border-t-teal-500 flex flex-col justify-between space-y-3 hover:border-teal-300 transition-all">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> Headers
                </h4>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">READY</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                HTTP Security Headers
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-xs font-semibold text-slate-700">
              {details.missing_security_headers && details.missing_security_headers.length > 0 ? (
                <p className="text-rose-600 font-bold text-[10px] truncate">
                  ขาด: {details.missing_security_headers.join(', ')}
                </p>
              ) : (
                <p className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> ครบถ้วนปลอดภัย
                </p>
              )}
            </div>
          </div>

          {/* Card 5: OWASP ZAP */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 shadow-sm border-t-4 border-t-amber-500 flex flex-col justify-between space-y-3 hover:border-amber-300 transition-all">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> OWASP ZAP
                </h4>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${details.is_zap_success ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                  {details.is_zap_success ? 'SUCCESS' : 'SKIPPED (WAF)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                Application Layer (DAST)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 text-xs font-semibold text-slate-700 flex justify-between items-center">
              <span className="text-[10px]">Alerts ตรวจพบ:</span>
              {details.is_zap_success ? (
                <strong className={zapAlerts.length > 0 ? 'text-amber-600 font-black' : 'text-emerald-600 font-black'}>
                  {zapAlerts.length} รายการ
                </strong>
              ) : (
                <span className="text-amber-700 font-bold text-[10px]">บล็อกโดย WAF / SSL</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: Detailed Deduction Breakdown Table */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-blue-500/5 p-6 md:p-8 space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <MinusCircle className="w-4.5 h-4.5 text-rose-500" />
            ตารางวิเคราะห์สาเหตุการโดนหักคะแนนเชิงลึก (Detailed Deduction Breakdown)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            รายการช่องโหว่ที่ระบบตรวจพบจริง พร้อมระบุว่าคะแนนถูกหักจากส่วนไหนเท่าใด (แถวสีเทาคือรายการที่เจอแต่ไม่ถูกหักเพิ่มเนื่องจากถึงเพดานเพดานระดับแล้ว)
          </p>
        </div>

        {deductionBreakdown.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200/80 uppercase">
                <tr>
                  <th className="p-3.5">เครื่องมือสแกน</th>
                  <th className="p-3.5">หมวด OWASP</th>
                  <th className="p-3.5">ระดับความรุนแรง</th>
                  <th className="p-3.5">CVSS</th>
                  <th className="p-3.5">รายละเอียดช่องโหว่</th>
                  <th className="p-3.5 text-right">หักคะแนน (Penalty)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {deductionBreakdown.map((item, idx) => {
                  const meta = getSeverityMeta(item.severity);
                  return (
                    <tr key={idx} className={`hover:bg-blue-50/40 transition-all ${!item.counted ? 'bg-slate-50/70 opacity-60' : ''}`}>
                      <td className="p-3.5 font-bold text-slate-900">{item.source}</td>
                      <td className="p-3.5 font-mono font-bold text-blue-600">{item.category}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md font-black text-[10px] ${meta.bg} ${meta.text}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-extrabold text-slate-800">
                        {item.cvss !== undefined ? item.cvss.toFixed(1) : '-'}
                      </td>
                      <td className="p-3.5 text-slate-700 leading-relaxed font-medium">
                        {item.label}
                        <span className="block text-[10px] text-slate-400 mt-0.5">{item.reason}</span>
                      </td>
                      <td className={`p-3.5 text-right font-black ${item.counted ? 'text-rose-600' : 'text-slate-400'}`}>
                        -{item.pointsDeducted ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-center text-emerald-800 text-xs font-bold">
            🎉 ยอดเยี่ยม! ไม่พบรายการช่องโหว่ที่ต้องถูกหักคะแนน
          </div>
        )}
      </div>

      {/* SECTION 4: Bonus Points Breakdown */}
      {bonusBreakdown.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-blue-500/5 p-6 md:p-8 space-y-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4.5 h-4.5 text-emerald-600" />
            รายการคะแนนโบนัสที่ได้รับ (Bonus Points Breakdown)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bonusBreakdown.map((b, idx) => (
              <div key={idx} className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl text-xs">
                <span className="font-bold text-emerald-950">{b.label}</span>
                <span className="font-black text-emerald-600 text-sm">+{b.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: Raw Output Console Logs (Tabs for Nmap, SSLyze, Nikto, ZAP) */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-blue-500/5 p-6 md:p-8 space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Terminal className="w-4.5 h-4.5 text-slate-600" />
          บันทึกรายงานดิบจากระบบหลังบ้าน (Raw Console Log Outputs)
        </h3>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200/80 text-xs font-bold gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveRawTab('nmap')}
            className={`pb-2.5 px-4 rounded-xl transition-all cursor-pointer ${activeRawTab === 'nmap' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 bg-slate-100/60'}`}
          >
            Nmap Output
          </button>
          <button
            onClick={() => setActiveRawTab('sslyze')}
            className={`pb-2.5 px-4 rounded-xl transition-all cursor-pointer ${activeRawTab === 'sslyze' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 bg-slate-100/60'}`}
          >
            SSLyze Output
          </button>
          <button
            onClick={() => setActiveRawTab('nikto')}
            className={`pb-2.5 px-4 rounded-xl transition-all cursor-pointer ${activeRawTab === 'nikto' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 bg-slate-100/60'}`}
          >
            Nikto Output 🕷️
          </button>
          <button
            onClick={() => setActiveRawTab('zap')}
            className={`pb-2.5 px-4 rounded-xl transition-all cursor-pointer ${activeRawTab === 'zap' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-500 hover:text-blue-600 bg-slate-100/60'}`}
          >
            OWASP ZAP Output
          </button>
        </div>

        {/* Terminal Screen */}
        <pre className="bg-[#0f172a] text-emerald-400 p-5 rounded-2xl overflow-x-auto text-xs font-mono max-h-[300px] shadow-inner leading-relaxed border border-slate-800">
          {activeRawTab === 'nmap' && (scanResult?.rawOutputs?.nmap || 'No raw output available for Nmap')}
          {activeRawTab === 'sslyze' && (scanResult?.rawOutputs?.sslyze || 'No raw output available for SSLyze')}
          {activeRawTab === 'nikto' && (scanResult?.rawOutputs?.nikto || details?.nikto_raw || 'No raw output available for Nikto')}
          {activeRawTab === 'zap' && (scanResult?.rawOutputs?.zap || 'No raw output available for OWASP ZAP')}
        </pre>
      </div>

      {/* Modal: Scoring Legend */}
      {showScoringModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">นโยบายความปลอดภัย & สูตรคำนวณคะแนน (Scoring Specification)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Weighted Multi-Dimensional Framework (OWASP 2025 Standard)</p>
              </div>
              <button onClick={() => setShowScoringModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs">
              
              {/* Formula Overview Box */}
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 space-y-2">
                <h4 className="font-black text-blue-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" /> สูตรคำนวณคะแนนสุทธิ (Final Score Formula)
                </h4>
                <div className="bg-white p-3 rounded-xl border border-blue-100 font-mono text-[11px] text-blue-900 font-bold space-y-1">
                  <p>• Finding Penaltyᵢ = round(0.3 × CVSSᵢ², 1)</p>
                  <p>• Total Risk Points = Σ Finding Penaltyᵢ (ไม่มีการจำกัดเพดานคะแนนหักรวม)</p>
                  <p>• Raw Score = max(0, 100 - Total Risk Points)</p>
                  <p>• Final Score = min(Raw Score, Severity Ceiling)</p>
                  <p className="text-rose-600 font-sans">• เพดานคะแนน (Severity Ceiling): Critical ≤ 29 | High ≤ 49 | Medium ≤ 69 | Low ≤ 89 | None = 100</p>
                </div>
              </div>

              {/* Dimension 1 */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MinusCircle className="w-4 h-4 text-rose-500" />
                  [มิติที่ 1] เกณฑ์การหักคะแนนตามระดับความรุนแรง (CVSS v3.1 Severity Caps)
                </h4>
                <div className="space-y-2">
                  {SEVERITY_LEGEND.map((s) => (
                    <div key={s.key} className={`rounded-xl border ${s.border} ${s.bg} p-3 space-y-1`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${s.text}`}>{s.label} ({s.cvss})</span>
                        <span className="font-black text-rose-600">{s.deduction}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed font-medium">{s.meaning}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic">
                  * หมายเหตุ: เพดานยอดหักรวมสูงสุดกำหนดไม่เกิน -90 คะแนน เพื่อป้องกันคะแนนติดลบเกินจริง
                </p>
              </div>

              {/* Dimension 2: Bonus Points */}
              <div className="space-y-2 pt-1">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  [มิติที่ 2] ตารางคะแนนโบนัสเพิ่มเติม (Bonus Points — สูงสุด +15 คะแนน)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BONUS_POINTS_TABLE.map((b) => (
                    <div key={b.key} className="bg-emerald-50/60 border border-emerald-200/60 p-3 rounded-xl space-y-1">
                      <div className="flex justify-between items-center font-bold text-emerald-950">
                        <span>{b.label}</span>
                        <span className="font-black text-emerald-600">{b.points}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{b.condition}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dimension 3: Grade Scale */}
              <div className="space-y-2 pt-1">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  [มิติที่ 3] ตารางเกณฑ์การตัดเกรดความปลอดภัย (Security Grade Scale)
                </h4>
                <div className="space-y-1.5">
                  {GRADE_LEGEND.map((g) => (
                    <div key={g.grade} className={`flex items-center justify-between rounded-xl border ${g.border} ${g.bg} px-3.5 py-2`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg ${g.dot} text-white text-xs font-black flex items-center justify-center shrink-0`}>{g.grade}</span>
                        <span className="text-xs font-bold text-slate-800">{g.range} คะแนน</span>
                      </div>
                      <span className={`text-xs font-bold ${g.text}`}>{g.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowScoringModal(false)}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                เข้าใจแล้ว ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ScanResultPage;