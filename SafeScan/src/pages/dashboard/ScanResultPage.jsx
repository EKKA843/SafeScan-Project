import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  ArrowLeft,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Server,
  HelpCircle,
  Info,
  X,
  Bug,
  Flame,
  MinusCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* ข้อมูลอ้างอิงเกณฑ์การให้คะแนน (ตามเอกสาร Security Planning)          */
/* ------------------------------------------------------------------ */

const SEVERITY_LEGEND = [
  { key: 'critical', label: 'Critical', cvss: 'CVSS 9.0 - 10.0', deduction: 'หัก 30 คะแนน (ต่อระดับ ไม่คูณตามจำนวน)', dot: 'bg-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700',
    meaning: 'ผู้โจมตีเข้าถึงหรือรันโค้ดบนระบบได้โดยไม่ต้อง Authentication เช่น SQL Injection, RCE ต้องแก้ไขทันทีก่อนขึ้น Production' },
  { key: 'high', label: 'High', cvss: 'CVSS 7.0 - 8.9', deduction: 'หัก 15 คะแนน (ต่อระดับ ไม่คูณตามจำนวน)', dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700',
    meaning: 'ผลกระทบรุนแรงแต่ต้องมีเงื่อนไขบางส่วน เช่น XSS, Auth Bypass, Supply Chain ที่ล้าสมัย ควรแก้ไขโดยเร็ว' },
  { key: 'medium', label: 'Medium', cvss: 'CVSS 4.0 - 6.9', deduction: 'หัก 7 คะแนน (ต่อระดับ ไม่คูณตามจำนวน)', dot: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700',
    meaning: 'ต้องอาศัยเงื่อนไขพิเศษ เช่น CSRF, Data Integrity หรือผู้ใช้ต้องคลิกลิงก์ ความเสี่ยงปานกลาง วางแผนแก้ไขได้' },
  { key: 'low', label: 'Low', cvss: 'CVSS 0.1 - 3.9', deduction: 'หัก 3 คะแนน (ต่อระดับ ไม่คูณตามจำนวน)', dot: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700',
    meaning: 'ผลกระทบน้อย ส่วนใหญ่เป็นการเปิดเผยข้อมูลทั่วไปที่ไม่ส่งผลโดยตรง เช่น Missing Header, Banner Disclosure' },
  { key: 'info', label: 'Info', cvss: 'CVSS 0.0', deduction: 'ไม่หักคะแนน', dot: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600',
    meaning: 'ไม่ใช่ช่องโหว่ แต่เป็นข้อสังเกตทั่วไปที่ควรรับทราบไว้ เช่น เวอร์ชัน Server ที่หลุดออกมา' },
];

const GRADE_LEGEND = [
  { grade: 'A', range: '90 - 100', dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'ปลอดภัย — ผ่านมาตรฐาน OWASP 2025 และ ISO 27001' },
  { grade: 'B', range: '70 - 89', dot: 'bg-blue-600', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', desc: 'พอใช้ได้ — มีจุดเล็กน้อยที่ควรแก้ไข' },
  { grade: 'C', range: '50 - 69', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', desc: 'ควรแก้ไข — มีความเสี่ยงที่ชัดเจน' },
  { grade: 'D', range: '30 - 49', dot: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', desc: 'เสี่ยงสูง — ต้องเร่งแก้ไขโดยด่วน' },
  { grade: 'F', range: '0 - 29', dot: 'bg-rose-600', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', desc: 'อันตราย — ห้ามใช้งานใน Production' },
];

const CATEGORY_PENALTY_TABLE = [
  { id: 'A01', name: 'Broken Access Control (รวม SSRF)', penalty: 'F (Auto-fail)' },
  { id: 'A05', name: 'Injection (SQL, XSS, Command)', penalty: '-25' },
  { id: 'A07', name: 'Authentication Failures', penalty: '-20' },
  { id: 'A03', name: 'Software Supply Chain Failures', penalty: '-15' },
  { id: 'A04', name: 'Cryptographic Failures', penalty: '-12' },
  { id: 'A10', name: 'Mishandling of Exceptional Conditions', penalty: '-8' },
  { id: 'อื่นๆ', name: 'A02, A06, A08, A09', penalty: '0' },
];

// 🎁 เกณฑ์คะแนนโบนัส — ให้เมื่อเว็บไซต์ตั้งค่าด้านความปลอดภัยไว้ดีเกินมาตรฐานขั้นต่ำ (รวมสูงสุด +15)
const BONUS_POINTS_TABLE = [
  { key: 'https', label: 'HTTPS / SSL ผ่านทุก Check', points: '+5', condition: 'ใช้ HTTPS และผล SSLyze ไม่พบปัญหาด้าน Certificate หรือ Protocol เลย' },
  { key: 'headers', label: 'Security Headers ครบถ้วน', points: '+5', condition: 'มี HSTS, X-Content-Type-Options, CSP และการป้องกัน Clickjacking ครบทุกตัว ไม่ขาดแม้แต่หัวเดียว' },
  { key: 'ports', label: 'ไม่เปิดพอร์ตเกินความจำเป็น', points: '+3', condition: 'ไม่มีพอร์ตกลุ่มเสี่ยง (FTP/Telnet/RDP/SMB ฯลฯ) และเปิดพอร์ตรวมไม่เกิน 2 พอร์ต' },
  { key: 'banner', label: 'ซ่อน Server Banner', points: '+2', condition: 'ไม่เปิดเผยเลขเวอร์ชันซอฟต์แวร์เซิร์ฟเวอร์ใน HTTP Header ทำให้ผู้โจมตีเดางานยากขึ้น' },
];

// 🏷️ ใช้จำแนกคีย์เวิร์ดของ ZAP Alert แต่ละตัว ว่าเข้าข่ายหมวด OWASP ไหนบ้าง
// (ใช้ชุดคีย์เวิร์ดเดียวกับที่ backend ใช้ตอนคำนวณคะแนน เพื่อให้คำอธิบายตรงกับตัวเลขจริง)
const classifyAlertCategory = (nameLower) => {
  if (nameLower.includes('access control') || nameLower.includes('ssrf') || nameLower.includes('idor')) return 'A01';
  if (nameLower.includes('sql') || nameLower.includes('xss') || nameLower.includes('command injection')) return 'A05';
  if (nameLower.includes('authentication') || nameLower.includes('session')) return 'A07';
  if (nameLower.includes('outdated') || nameLower.includes('library') || nameLower.includes('vulnerable component')) return 'A03';
  if (nameLower.includes('stack trace') || nameLower.includes('error handling') || nameLower.includes('exception')) return 'A10';
  return null;
};

const RISK_LEVEL_META = {
  High: { label: 'High', dot: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50' },
  Medium: { label: 'Medium', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
  Low: { label: 'Low', dot: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
  Informational: { label: 'Info', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-50' },
};

const getRiskMeta = (riskDesc) => {
  if (!riskDesc) return RISK_LEVEL_META.Informational;
  if (riskDesc.includes('High')) return RISK_LEVEL_META.High;
  if (riskDesc.includes('Medium')) return RISK_LEVEL_META.Medium;
  if (riskDesc.includes('Low')) return RISK_LEVEL_META.Low;
  return RISK_LEVEL_META.Informational;
};

const ScanResultPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRawTab, setActiveRawTab] = useState('nmap');
  const [showScoringModal, setShowScoringModal] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/scan/status/${scanId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await response.json();

        if (json.success && json.status === 'completed') {
          setScanResult(json);
          setLoading(false);
        } else if (json.status === 'scanning') {
          setTimeout(fetchResult, 3000);
        } else {
          alert('การสแกนล้มเหลว หรือไม่พบข้อมูล');
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchResult();
  }, [scanId]);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[80vh] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-semibold animate-pulse">SafeScan กำลังประมวลผลวิเคราะห์ช่องโหว่เชิงลึกด้วย Nmap, SSLyze และ OWASP ZAP...</p>
      </div>
    );
  }

  const summary = scanResult?.data?.summary || {};
  const vulns = scanResult?.data?.vulnerabilities || {};
  const details = scanResult?.data?.details || {};
  const zapAlerts = details.zap_alerts || [];

  // 🧮 ค่าหักตามระดับความรุนแรง — หักครั้งเดียวต่อระดับ (ไม่คูณตามจำนวนที่เจอ)
  // ต้องตรงกับสูตรฝั่ง backend เป๊ะๆ ไม่งั้นตัวเลขที่โชว์จะไม่ตรงกับคะแนนจริงที่คำนวณมา
  const minusCritical = (vulns.critical || 0) > 0 ? 30 : 0;
  const minusHigh = (vulns.high || 0) > 0 ? 15 : 0;
  const minusMedium = (vulns.medium || 0) > 0 ? 7 : 0;
  const minusLow = (vulns.low || 0) > 0 ? 3 : 0;
  // ใช้ค่าจาก backend เป็นหลักถ้ามีส่งมา (กันกรณี backend ปรับสูตรอีกในอนาคตแล้ว frontend ลืมตาม)
  const totalBaseDeduction = summary.totalBaseDeduction ?? (minusCritical + minusHigh + minusMedium + minusLow);

  // 🔎 จับคู่ ZAP Alert แต่ละตัวเข้ากับหมวด OWASP ที่มันไปกระตุ้น category penalty
  const alertsByCategory = { A01: [], A03: [], A05: [], A07: [], A10: [] };
  zapAlerts.forEach((alert) => {
    const cat = classifyAlertCategory((alert.name || '').toLowerCase());
    if (cat) alertsByCategory[cat].push(alert);
  });

  // 📝 สร้างรายการจำแนกสาเหตุการโดนหักคะแนนแต่ละข้อ (ระดับสรุปตามความรุนแรง)
  const deductionList = [];

  if (vulns.critical > 0) {
    deductionList.push({
      tool: 'OWASP ZAP / Scanner',
      category: 'Critical Vulnerabilities',
      owasp: 'A03 / A05',
      reason: `พบช่องโหว่ระดับอันตรายร้ายแรง ${vulns.critical} รายการ (ผู้โจมตีอาจเข้าถึงระบบได้โดยตรง) — หักครั้งเดียว ไม่คูณตามจำนวน`,
      score: `- ${minusCritical} คะแนน`
    });
  }
  if (vulns.high > 0) {
    deductionList.push({
      tool: 'OWASP ZAP / Nmap',
      category: 'High Risks',
      owasp: 'A02 / A03',
      reason: `พบความเสี่ยงระดับสูง ${vulns.high} รายการ (พบการเปิดพอร์ตอันตราย หรือช่องโหว่แอปพลิเคชัน) — หักครั้งเดียว ไม่คูณตามจำนวน`,
      score: `- ${minusHigh} คะแนน`
    });
  }
  if (vulns.medium > 0) {
    deductionList.push({
      tool: 'OWASP ZAP / Nmap',
      category: 'Medium Risks',
      owasp: 'A02 / A05',
      reason: `พบความเสี่ยงระดับปานกลาง ${vulns.medium} รายการ (เช่น เปิดพอร์ตให้บริการทั่วไปหลายพอร์ต หรือตั้งค่า Caching/Policy ไม่รัดกุม) — หักครั้งเดียว ไม่คูณตามจำนวน`,
      score: `- ${minusMedium} คะแนน`
    });
  }
  if (vulns.low > 0) {
    deductionList.push({
      tool: 'OWASP ZAP',
      category: 'Low / Informational Risks',
      owasp: 'A05 / Caching',
      reason: `พบข้อสังเกตระดับต่ำ ${vulns.low} รายการ (เช่น ขาด Cookie SameSite, การตั้งค่า Cache Control หรือ Header เล็กน้อย) — หักครั้งเดียว ไม่คูณตามจำนวน`,
      score: `- ${minusLow} คะแนน`
    });
  }
  if (details.A04 && !details.A04.includes('ปลอดภัย')) {
    deductionList.push({
      tool: 'SSLyze',
      category: 'Cryptographic Failures',
      owasp: 'OWASP A04:2025',
      reason: 'พบปัญหาการรับรองความถูกต้องของ SSL/TLS เช่น ใบรับรองหมดอายุ ไม่ได้รับความเชื่อถือ หรือรองรับ Protocol ที่ไม่ปลอดภัย',
      score: '- 12 คะแนน (Category Penalty)'
    });
  }
  if (details.A05 && !details.A05.includes('ปลอดภัย')) {
    deductionList.push({
      tool: 'Fetch Security Headers',
      category: 'Security Misconfiguration',
      owasp: 'OWASP A05:2025',
      reason: `ขาด HTTP Security Headers สำคัญ ได้แก่: ${details.missing_security_headers?.join(', ') || 'HSTS, CSP'}`,
      score: '- 8 คะแนน (Category Penalty)'
    });
  }
  if (details.A03 && details.A03.includes('พบความเสี่ยง')) {
    deductionList.push({
      tool: 'OWASP ZAP Container',
      category: 'Application Security Risks',
      owasp: 'OWASP A03:2025',
      reason: 'ตรวจพบความเสี่ยงระดับแอปพลิเคชันจาก ZAP Scan Engine (ส่งผลกระทบต่อความปลอดภัยฝั่งเว็บแอป)',
      score: '- 10 คะแนน (Penalty)'
    });
  }

  const getGradeBadgeClass = (grade) => {
    if (grade === 'A') return 'bg-emerald-500 shadow-emerald-500/20';
    if (grade === 'B') return 'bg-blue-600 shadow-blue-600/20';
    if (grade === 'C') return 'bg-amber-500 shadow-amber-500/20';
    if (grade === 'D') return 'bg-orange-500 shadow-orange-500/20';
    return 'bg-rose-500 shadow-rose-500/20';
  };

  const getGradeTextClass = (grade) => {
    if (grade === 'A') return 'text-emerald-500';
    if (grade === 'B') return 'text-blue-600';
    if (grade === 'C') return 'text-amber-500';
    if (grade === 'D') return 'text-orange-500';
    return 'text-rose-500';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 font-sans text-slate-700">

      {/* Header หัวข้อใหญ่ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-950">
            <LayoutDashboard className="w-6 h-6 text-blue-900" />
            <h1 className="text-2xl font-extrabold tracking-tight">รายงานผลการตรวจสอบความปลอดภัย</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            เป้าหมาย: <span className="text-blue-600 font-bold break-all">{scanResult?.targetUrl || '-'}</span>
            <span className="text-slate-300">|</span>
            Scan ID: <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">#{scanId}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowScoringModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2.5 rounded-xl transition-all"
          >
            <HelpCircle className="w-4 h-4" /> เกณฑ์การให้คะแนน & ความหมายของสี
          </button>
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            สแกนโดเมนอื่น
          </button>
        </div>
      </div>

      {/* SECTION 1: กล่องสรุปคะแนนภาพรวม & รายละเอียดการหักคะแนน */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* วงกลมโชว์เกรด */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-slate-500 mb-4">ระดับความเสี่ยงระบบ</h3>
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-lg ${getGradeBadgeClass(summary.grade)}`}>
            {summary.grade || 'N/A'}
          </div>
          <p className="mt-4 text-base font-extrabold text-slate-800">
            คะแนนสุทธิ: <span className={getGradeTextClass(summary.grade)}>{summary.finalScore ?? 0}</span> / 100
          </p>
        </div>

        {/* ตารางแจกแจงสูตรคะแนน */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-blue-950 mb-3 flex items-center gap-1.5">
               รายละเอียดการคำนวณคะแนน <span className="text-xs font-medium text-slate-400">(Scoring Breakdown)</span>
            </h3>
            <div className="w-full text-xs font-semibold space-y-2.5 mb-4">
              <div className="flex justify-between pb-2 border-b border-slate-50">
                <span className="text-slate-400">คะแนนตั้งต้นจากระบบ</span>
                <span className="text-slate-800">100 คะแนน</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-50">
                <span className="text-slate-400">หักตามระดับความรุนแรงที่พบ (Base Deduction)</span>
                <span className="text-rose-500 font-bold">-{totalBaseDeduction} คะแนน</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-50">
                <span className="text-slate-400">หักเพิ่มตามหมวดความเสี่ยงพิเศษ (Category Penalty)</span>
                <span className="text-orange-500 font-bold">-{summary.totalPenalty ?? 0} คะแนน</span>
              </div>
              {summary.bonusPoints > 0 && (
                <div className="flex justify-between pb-2 border-b border-slate-50">
                  <span className="text-slate-400">คะแนนโบนัสจากการตั้งค่าที่ปลอดภัย (Bonus Points)</span>
                  <span className="text-emerald-500 font-bold">+{summary.bonusPoints} คะแนน</span>
                </div>
              )}
            </div>

            {/* สรุปสาเหตุการหักคะแนนย่อยแบบแสดงผลลัพธ์ตรงกับความเป็นจริง */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-[11px] space-y-1.5">
              <span className="font-extrabold text-slate-700 flex items-center gap-1">
                <MinusCircle className="w-3.5 h-3.5 text-rose-500" /> สรุปสาเหตุการหักคะแนนย่อย (หักครั้งเดียวต่อระดับความรุนแรง):
              </span>
              <ul className="list-disc pl-5 text-slate-600 space-y-1 font-medium">
                {vulns.critical > 0 && (
                  <li>
                    พบช่องโหว่ระดับ Critical ({vulns.critical} รายการ): <span className="text-rose-600 font-bold">-{minusCritical} คะแนน</span>
                    <span className="text-slate-400 text-[10px]"> (หักครั้งเดียว ไม่ว่าจะเจอกี่รายการ)</span>
                  </li>
                )}
                {vulns.high > 0 && (
                  <li>
                    พบช่องโหว่ระดับ High ({vulns.high} รายการ): <span className="text-orange-600 font-bold">-{minusHigh} คะแนน</span>
                    <span className="text-slate-400 text-[10px]"> (หักครั้งเดียว ไม่ว่าจะเจอกี่รายการ)</span>
                  </li>
                )}
                {vulns.medium > 0 && (
                  <li>
                    พบช่องโหว่ระดับ Medium ({vulns.medium} รายการ): <span className="text-amber-600 font-bold">-{minusMedium} คะแนน</span>
                    <span className="text-slate-400 text-[10px]"> (หักครั้งเดียว ไม่ว่าจะเจอกี่รายการ)</span>
                  </li>
                )}
                {vulns.low > 0 && (
                  <li>
                    พบข้อสังเกตระดับ Low ({vulns.low} รายการ): <span className="text-blue-600 font-bold">-{minusLow} คะแนน</span>
                    <span className="text-slate-400 text-[10px]"> (หักครั้งเดียว ไม่ว่าจะเจอกี่รายการ)</span>
                  </li>
                )}
                {details.A04 && !details.A04.includes('ปลอดภัย') && (
                  <li>พบปัญหาด้าน SSL/TLS (OWASP A04 Penalty): <span className="text-rose-600 font-bold">-12 คะแนน</span></li>
                )}
                {details.A05 && !details.A05.includes('ปลอดภัย') && (
                  <li>ขาด HTTP Security Headers (OWASP A05 Penalty): <span className="text-orange-600 font-bold">-8 คะแนน</span></li>
                )}
                {details.A03 && details.A03.includes('พบความเสี่ยง') && (
                  <li>พบความเสี่ยง Web Application จาก ZAP (OWASP A03 Penalty): <span className="text-amber-600 font-bold">-10 คะแนน</span></li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-sm font-black mt-2">
            <span className="text-slate-800">คะแนนสรุปสุดท้าย (Final Score)</span>
            <span className={`text-base ${getGradeTextClass(summary.grade)}`}>{summary.finalScore ?? 0} คะแนน</span>
          </div>
        </div>
      </div>

      {/* SECTION 1.8: ตารางวิเคราะห์สาเหตุการโดนหักคะแนนเชิงลึก (Detailed Deduction Table) */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6 mb-8">
        <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <MinusCircle className="w-4 h-4 text-rose-500" />
          ตารางวิเคราะห์สาเหตุการโดนหักคะแนนเชิงลึก <span className="text-xs font-medium text-slate-400">(Detailed Deduction Breakdown)</span>
        </h3>

        {deductionList.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">เครื่องมือสแกน</th>
                  <th className="p-3">หมวดความเสี่ยง</th>
                  <th className="p-3">OWASP 2025</th>
                  <th className="p-3">สาเหตุทำไมถึงโดนหักคะแนน</th>
                  <th className="p-3 text-right">คะแนนที่โดนหัก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                {deductionList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-3 font-bold text-slate-800">{item.tool}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-600">{item.owasp}</td>
                    <td className="p-3 text-slate-600 leading-relaxed">{item.reason}</td>
                    <td className="p-3 text-right font-black text-rose-600">{item.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ไม่พบรายการหักคะแนน! เว็บไซต์ของคุณผ่านเกณฑ์ความปลอดภัยเต็ม 100 คะแนน
          </div>
        )}
      </div>

      {/* SECTION 1.9: รายการช่องโหว่แต่ละรายการแบบละเอียด (Itemized Findings) */}
      {(zapAlerts.length > 0 || (details.risky_ports && details.risky_ports.length > 0) || (details.missing_security_headers && details.missing_security_headers.length > 0)) && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6 mb-8">
          <h3 className="text-sm font-extrabold text-slate-800 mb-1 flex items-center gap-2">
            <Bug className="w-4 h-4 text-blue-600" />
            รายการช่องโหว่แต่ละรายการที่ตรวจพบ <span className="text-xs font-medium text-slate-400">(Itemized Findings)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
            รายการทั้งหมดด้านล่างนี้คือ "ของจริง" ที่ระบบตรวจเจอ — เป็นชุดเดียวกับที่ถูกนับรวมในยอด Critical/High/Medium/Low ด้านบน และเป็นตัวกระตุ้น Category Penalty ในหมวด A01/A03/A05/A07/A10 (ดูป้ายกำกับ OWASP ต่อรายการ)
          </p>

          <div className="space-y-2">
            {zapAlerts.map((alert, idx) => {
              const meta = getRiskMeta(alert.risk);
              const cat = classifyAlertCategory((alert.name || '').toLowerCase());
              return (
                <div key={`zap-${idx}`} className={`flex items-start justify-between gap-3 border ${meta.bg} border-slate-100 p-3 rounded-2xl text-xs`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${meta.dot}`} />
                    <div>
                      <p className="font-bold text-slate-800">{alert.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">ตรวจพบโดย OWASP ZAP · นับรวมในยอดความรุนแรงระดับ {meta.label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cat && (
                      <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-rose-100 text-rose-700">
                        {cat} Penalty
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${meta.bg} ${meta.text}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {details.risky_ports && details.risky_ports.length > 0 && (
              <div className="flex items-start justify-between gap-3 border bg-orange-50 border-slate-100 p-3 rounded-2xl text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-orange-500" />
                  <div>
                    <p className="font-bold text-slate-800">พบพอร์ตเสี่ยงเปิดอยู่: {details.risky_ports.join(', ')}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">ตรวจพบโดย Nmap · พอร์ตกลุ่มนี้มักถูกใช้โจมตี (FTP, Telnet, RDP, SMB) นับรวมในยอดความรุนแรงระดับ High</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-orange-100 text-orange-700 shrink-0">High</span>
              </div>
            )}

            {details.missing_security_headers && details.missing_security_headers.map((header, idx) => (
              <div key={`hdr-${idx}`} className="flex items-start justify-between gap-3 border bg-blue-50 border-slate-100 p-3 rounded-2xl text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                  <div>
                    <p className="font-bold text-slate-800">ขาด HTTP Header: {header}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">ตรวจพบโดยการ Fetch Headers โดยตรง · ส่งผลต่อ OWASP A05 Category Penalty</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-700 shrink-0">Low</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1.5: คำอธิบายความหมายของสี */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6 mb-8">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">สีบนหน้ารายงานนี้สื่อถึงอะไร (Color System)</h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-4 pl-3.5 leading-relaxed">
          ระบบใช้สีสัญญาณไฟจราจร (Traffic Light System) เพื่อให้เห็นระดับความรุนแรงได้ทันทีโดยไม่ต้องอ่านตัวเลข ช่วยลดเวลาการวิเคราะห์ของผู้ดูแลระบบ
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {SEVERITY_LEGEND.map((s) => (
            <div key={s.key} className={`rounded-2xl border ${s.border} ${s.bg} p-3 space-y-1`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                <span className={`text-xs font-extrabold ${s.text}`}>{s.label}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold">{s.cvss} · {s.deduction}</p>
              <p className="text-[10px] text-slate-500 leading-snug">{s.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: ระบุชัดเจนรายซอฟต์แวร์ว่าตรวจอะไร ได้ผลลัพธ์อะไร */}
      <div className="mb-8">
        <h3 className="text-sm font-extrabold text-slate-500 mb-4 flex items-center gap-1.5">
          🔍 ผลลัพธ์แยกตามซอฟต์แวร์ตรวจสอบ <span className="text-xs font-medium text-slate-400">(Software Security Engines)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* กล่องที่ 1: ซอฟต์แวร์ Nmap */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_20px_rgba(148,163,184,0.03)] p-5 border-t-4 border-t-purple-500 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-purple-500" />
                  Software: Nmap
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${details.is_nmap_success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {details.is_nmap_success ? 'SUCCESS' : 'ERROR'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                <strong>สิ่งที่สแกน:</strong> เปิดหาพอร์ตที่เสี่ยง (OWASP A02: Security Misconfiguration)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs font-semibold text-slate-600 space-y-1.5">
              <p className="flex justify-between"><span>• พอร์ตเปิด:</span> <strong className="text-slate-800">{details.open_ports_detected ?? 0} พอร์ต</strong></p>
              <div className="flex justify-between items-center">
                <span>• พอร์ตเสี่ยง:</span>
                {details.risky_ports && details.risky_ports.length > 0 ? (
                  <span className="text-rose-500 font-bold flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3" /> พบอันตราย ({details.risky_ports.join(', ')})
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> ปลอดภัย
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* กล่องที่ 2: ซอฟต์แวร์ SSLyze */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_20px_rgba(148,163,184,0.03)] p-5 border-t-4 border-t-blue-500 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span className="text-blue-500 font-mono text-sm">🐍</span>
                  Software: SSLyze
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${details.is_sslyze_success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {details.is_sslyze_success ? 'SUCCESS' : 'ERROR'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                <strong>สิ่งที่สแกน:</strong> ความปลอดภัยของ SSL/TLS (OWASP A04: Cryptographic Failures)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs font-semibold text-slate-600 flex items-start gap-1 min-h-[48px]">
              <span className="shrink-0">• ผลลัพธ์:</span>
              <span className={details.A04 && details.A04.includes('ปลอดภัย') ? 'text-emerald-600 font-bold' : 'text-orange-500 font-bold'}>
                {details.A04 || 'ไม่พบข้อมูล'}
              </span>
            </div>
          </div>

          {/* กล่องที่ 3: ระบบตรวจสอบ HTTP Security Headers */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_20px_rgba(148,163,184,0.03)] p-5 border-t-4 border-t-teal-500 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                  Fetch Headers
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">READY</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                <strong>สิ่งที่สแกน:</strong> ความครบถ้วนของ HTTP Headers (OWASP A05)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs font-semibold text-slate-600 min-h-[48px] flex items-center">
              {details.missing_security_headers && details.missing_security_headers.length > 0 ? (
                <p className="text-rose-500 font-bold flex items-start gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>ขาด: {details.missing_security_headers.join(', ')}</span>
                </p>
              ) : (
                <p className="text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> ครบถ้วนปลอดภัย!
                </p>
              )}
            </div>
          </div>

          {/* กล่องที่ 4: OWASP ZAP (Docker Container) */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_20px_rgba(148,163,184,0.03)] p-5 border-t-4 border-t-amber-500 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  OWASP ZAP (Docker)
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${details.is_zap_success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {details.is_zap_success ? 'SUCCESS' : 'ERROR'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                <strong>สิ่งที่สแกน:</strong> ตรวจจับช่องโหว่ Web App ในระดับเชิงลึก (Injection, XSS, Caching, Cookies)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs font-semibold text-slate-600 min-h-[48px] flex items-center justify-between">
              <span>• Alerts ตรวจพบ:</span>
              <span className={zapAlerts.length > 0 ? 'text-amber-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                {zapAlerts.length} รายการ
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2.5: ส่วนแสดงผลข้อมูล OWASP ZAP Alerts รายการแจ้งเตือนความเสี่ยง */}
      {zapAlerts.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6 mb-8">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-500" />
            รายการแจ้งเตือนความเสี่ยงจาก OWASP ZAP <span className="text-xs font-medium text-slate-400">({zapAlerts.length} Alerts Detected)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {zapAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-start justify-between bg-slate-50 border border-slate-100 p-3 rounded-2xl text-xs">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-slate-800">{alert.name}</p>
                  <p className="text-[10px] text-slate-400">OWASP Web Vulnerability Assessment</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${
                  alert.risk?.includes('High') ? 'bg-rose-100 text-rose-700' :
                  alert.risk?.includes('Medium') ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {alert.risk || 'Low Risk'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: กล่องกางดูรายงานดิบ (Raw Output Log) */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6">
        <h3 className="text-sm font-extrabold text-blue-950 mb-4 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-slate-500" />
          บันทึกรายงานดิบจากระบบหลังบ้าน <span className="text-xs font-medium text-slate-400">(Raw Console Outputs)</span>
        </h3>

        {/* แท็บปุ่มกดสลับระหว่าง Nmap, SSLyze และ ZAP */}
        <div className="flex border-b border-slate-100 mb-4 text-xs font-bold gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveRawTab('nmap')}
            className={`pb-2.5 px-4 rounded-t-xl transition-all ${activeRawTab === 'nmap' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
          >
            Nmap Raw Output
          </button>
          <button
            onClick={() => setActiveRawTab('sslyze')}
            className={`pb-2.5 px-4 rounded-t-xl transition-all ${activeRawTab === 'sslyze' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
          >
            SSLyze Raw Output
          </button>
          <button
            onClick={() => setActiveRawTab('zap')}
            className={`pb-2.5 px-4 rounded-t-xl transition-all ${activeRawTab === 'zap' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
          >
            OWASP ZAP Raw Output
          </button>
        </div>

        {/* พื้นหลังสีดำสไตล์ Terminal */}
        <pre className="bg-[#1e272e] text-emerald-400 p-5 rounded-2xl overflow-x-auto text-xs font-mono max-h-[280px] shadow-inner leading-relaxed">
          {activeRawTab === 'nmap' && (scanResult?.rawOutputs?.nmap || 'No raw output available for Nmap')}
          {activeRawTab === 'sslyze' && (scanResult?.rawOutputs?.sslyze || 'No raw output available for SSLyze')}
          {activeRawTab === 'zap' && (scanResult?.rawOutputs?.zap || 'No raw output available for OWASP ZAP')}
        </pre>
      </div>

      {/* MODAL: เกณฑ์การให้คะแนนแบบเต็ม + ความหมายของสีทั้งหมด */}
      {showScoringModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">เกณฑ์การให้คะแนน & ความหมายของสี</h3>
                <p className="text-xs text-slate-400 mt-0.5">Scoring Framework & Color System Reference</p>
              </div>
              <button
                onClick={() => setShowScoringModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. สูตรคำนวณคะแนน */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">1. ที่มาของคะแนน (Weighted Multi-Dimensional Scoring)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบเริ่มต้นที่ <strong>100 คะแนนเต็ม</strong> แล้วหักคะแนนตามระดับความรุนแรง (<strong>CVSS v3.1</strong>) ของช่องโหว่ที่พบ โดยหักเพียงครั้งเดียวต่อระดับความรุนแรง (ไม่คูณตามจำนวนที่เจอ) ร่วมกับค่าปรับเพิ่มตามหมวดความเสี่ยงเชิงธุรกิจ (<strong>OWASP Top 10: 2025</strong>)
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 border border-slate-100">
                {SEVERITY_LEGEND.filter((s) => s.key !== 'info').map((s) => (
                  <div key={s.key} className="flex justify-between font-bold text-slate-700">
                    <span>• {s.label} Vulnerability ({s.cvss})</span>
                    <span className={s.text}>{s.deduction}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Category Penalty */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">2. ค่าปรับตามหมวดความเสี่ยงเชิงธุรกิจ (Category Penalty)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                หากพบช่องโหว่ในหมวดวิกฤต เช่น <strong>A01 (Broken Access Control/SSRF)</strong> หรือ <strong>A05 (Injection)</strong> ระบบจะหักคะแนนเพิ่มอีกชั้น
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                    <tr><th className="p-2.5">ID</th><th className="p-2.5">หมวด OWASP 2025</th><th className="p-2.5">Penalty</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {CATEGORY_PENALTY_TABLE.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2.5 font-bold">{c.id}</td>
                        <td className="p-2.5">{c.name}</td>
                        <td className="p-2.5 font-bold text-rose-600">{c.penalty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. คะแนนโบนัส */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">3. คะแนนโบนัส (Bonus Points)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                นอกจากหักคะแนน ระบบยังให้ <strong>คะแนนโบนัสคืน</strong> เมื่อเว็บไซต์ตั้งค่าด้านความปลอดภัยไว้ดีกว่ามาตรฐานขั้นต่ำ เพื่อชดเชยคะแนนที่โดนหักไปจากข้อสังเกตเล็กๆ น้อยๆ โดยรวมกันได้ <strong>สูงสุดไม่เกิน +15 คะแนน</strong> และจะถูกบวกเข้ากับคะแนนหลังหัก Category Penalty แล้วเป็นขั้นตอนสุดท้ายก่อนสรุปผล
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-50 text-emerald-700 font-bold border-b border-slate-100">
                    <tr><th className="p-2.5">เงื่อนไข</th><th className="p-2.5">รายละเอียด</th><th className="p-2.5 text-right">โบนัส</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {BONUS_POINTS_TABLE.map((b) => (
                      <tr key={b.key}>
                        <td className="p-2.5 font-bold whitespace-nowrap">{b.label}</td>
                        <td className="p-2.5 text-slate-500 leading-relaxed">{b.condition}</td>
                        <td className="p-2.5 font-bold text-emerald-600 text-right whitespace-nowrap">{b.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed pl-1">
                * หมายเหตุ: ถ้าเว็บไซต์โดนหมวด A01 (Broken Access Control) จนตัดเกรดเป็น F ทันที คะแนนโบนัสจะไม่ถูกนำมาคิดรวม เพราะคะแนนสุทธิถูกล็อกไว้ที่ 0
              </p>
            </div>

            {/* 4. ตารางตัดเกรด */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">4. ตารางตัดเกรดความปลอดภัย (Grade Table)</h4>
              <div className="space-y-2">
                {GRADE_LEGEND.map((g) => (
                  <div key={g.grade} className={`flex items-center justify-between rounded-2xl border ${g.border} ${g.bg} px-4 py-2.5`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full ${g.dot} text-white text-xs font-black flex items-center justify-center shrink-0`}>{g.grade}</span>
                      <span className="text-xs font-bold text-slate-700">{g.range} คะแนน</span>
                    </div>
                    <span className={`text-xs font-semibold ${g.text}`}>{g.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowScoringModal(false)}
                className="px-6 py-2.5 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-all shadow-md"
              >
                เข้าใจแล้วปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScanResultPage;