import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, ArrowLeft, Terminal, ShieldCheck, AlertTriangle, CheckCircle, Server } from 'lucide-react';

const ScanResultPage = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRawTab, setActiveRawTab] = useState('nmap');

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
        <p className="text-slate-500 text-sm font-semibold animate-pulse">SafeScan กำลังประมวลผลวิเคราะห์ช่องโหว่เชิงลึก...</p>
      </div>
    );
  }

  const { summary, vulnerabilities, details } = scanResult.data;

  // ฟังก์ชันเลือกสีเกรดสไตล์ Tailwind บาร์
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
            <h1 className="text-2xl font-extrabold tracking-tight">รายงานผลการตรวจสอบ</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            เป้าหมาย: <span className="text-blue-600 font-bold break-all">{scanResult.targetUrl}</span> 
            <span className="text-slate-300">|</span> 
            Scan ID: <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">#{scanId}</span>
          </p>
        </div>
        <button 
          onClick={() => navigate('/scan')} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          สแกนโดเมนอื่น
        </button>
      </div>

      {/* SECTION 1: กล่องสรุปคะแนนภาพรวม (Summary Card) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* วงกลมโชว์เกรด */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-slate-500 mb-4">ระดับความเสี่ยงระบบ</h3>
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-lg ${getGradeBadgeClass(summary.grade)}`}>
            {summary.grade}
          </div>
          <p className="mt-4 text-base font-extrabold text-slate-800">
            คะแนนสุทธิ: <span className={getGradeTextClass(summary.grade)}>{summary.finalScore}</span> / 100
          </p>
        </div>

        {/* ตารางแจกแจงสูตรคะแนน มทส. */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-blue-950 mb-3 flex items-center gap-1.5">
            🧮 รายละเอียดการคำนวณคะแนน <span className="text-xs font-medium text-slate-400">(Scoring Breakdown)</span>
          </h3>
          <div className="w-full text-xs font-semibold space-y-2.5">
            <div className="flex justify-between pb-2 border-b border-slate-50">
              <span className="text-slate-400">คะแนนตั้งต้นจากระบบ</span>
              <span className="text-slate-800">100 คะแนน</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-50">
              <span className="text-slate-400">หักตามจำนวนช่องโหว่ที่พบ (Base Deduction)</span>
              <span className="text-rose-500">-{100 - summary.baseScore} คะแนน</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-50">
              <span className="text-slate-400">หักเพิ่มตามกลุ่มเสี่ยงธุรกิจ (Category Penalty)</span>
              <span className="text-orange-500">-{summary.totalPenalty} คะแนน</span>
            </div>
            <div className="flex justify-between items-center pt-2 text-sm font-black">
              <span className="text-slate-800">คะแนนสรุปสุดท้าย (Final Score)</span>
              <span className={`text-base ${getGradeTextClass(summary.grade)}`}>{summary.finalScore} คะแนน</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ระบุชัดเจนรายซอฟต์แวร์ว่าตรวจอะไร ได้ผลลัพธ์อะไร */}
      <div className="mb-8">
        <h3 className="text-sm font-extrabold text-slate-500 mb-4 flex items-center gap-1.5">
          🔍 ผลลัพธ์แยกตามซอฟต์แวร์ตรวจสอบ <span className="text-xs font-medium text-slate-400">(Software Analysis)</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* กล่องที่ 1: ซอฟต์แวร์ Nmap */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_20px_rgba(148,163,184,0.03)] p-5 border-t-4 border-t-purple-500 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-purple-500" />
                  Software: Nmap (v7.9x)
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${details.is_nmap_success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {details.is_nmap_success ? 'SUCCESS' : 'ERROR'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                <strong>สิ่งที่สแกน:</strong> เปิดหาพอร์ตที่เสี่ยงต่อการตั้งค่าผิดพลาด (หมวด OWASP A02: Security Misconfiguration)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 text-xs font-semibold text-slate-600 space-y-1.5">
              <p className="flex justify-between"><span>• ตรวจพบพอร์ตเปิดอยู่:</span> <strong className="text-slate-800">{details.open_ports_detected} พอร์ต</strong></p>
              <div className="flex justify-between items-center">
                <span>• พอร์ตเสี่ยงสูง:</span> 
                {details.risky_ports?.length > 0 ? (
                  <span className="text-rose-500 font-bold flex items-center gap-0.5"><ShieldAlert className="w-3 h-3" /> พบอันตราย ({details.risky_ports.join(', ')})</span>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> ปลอดภัย</span>
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
                  Software: SSLyze (Python)
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${details.is_sslyze_success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {details.is_sslyze_success ? 'SUCCESS' : 'ERROR'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                <strong>สิ่งที่สแกน:</strong> ตรวจสอบความถูกต้องของใบรับรองและโปรโตคอลเข้ารหัส (หมวด OWASP A04: Cryptographic Failures)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 text-xs font-semibold text-slate-600 flex items-start gap-1 min-h-[48px]">
              <span className="shrink-0">• ผลวิเคราะห์:</span>
              <span className={details.A04.includes('ปลอดภัย') ? 'text-emerald-600 font-bold' : 'text-orange-500 font-bold'}>
                {details.A04}
              </span>
            </div>
          </div>

          {/* กล่องที่ 3: ระบบตรวจสอบ HTTP Security Headers */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_8px_20px_rgba(148,163,184,0.03)] p-5 border-t-4 border-t-teal-500 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                  Module: Fetch Headers
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">READY</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                <strong>สิ่งที่สแกน:</strong> ความครบถ้วนของ HTTP Headers เพื่อป้องกันการโจมตีเว็บ (หมวด OWASP A05: Security Misconfiguration)
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 text-xs font-semibold text-slate-600 min-h-[48px] flex items-center">
              {details.missing_security_headers?.length > 0 ? (
                <p className="text-rose-500 font-bold flex items-start gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>ขาด Header: {details.missing_security_headers.join(', ')}</span>
                </p>
              ) : (
                <p className="text-emerald-600 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ได้รับ HTTP Headers ครบถ้วนปลอดภัย!
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: กล่องกางดูรายงานดิบ (Raw Output Log) เอาไว้โชว์อาจารย์ตอนตรวจแล็บ */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_10px_30px_rgba(148,163,184,0.05)] p-6">
        <h3 className="text-sm font-extrabold text-blue-950 mb-4 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-slate-500" />
          บันทึกรายงานดิบจากระบบหลังบ้าน <span className="text-xs font-medium text-slate-400">(Raw Console Outputs)</span>
        </h3>
        
        {/* แท็บปุ่มกดสลับระหว่าง Nmap กับ SSLyze */}
        <div className="flex border-b border-slate-100 mb-4 text-xs font-bold gap-2">
          <button 
            onClick={() => setActiveRawTab('nmap')} 
            className={`pb-2.5 px-4 rounded-t-xl transition-all p-1 ${activeRawTab === 'nmap' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
          >
            Nmap Raw Output
          </button>
          <button 
            onClick={() => setActiveRawTab('sslyze')} 
            className={`pb-2.5 px-4 rounded-t-xl transition-all p-1 ${activeRawTab === 'sslyze' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 bg-transparent'}`}
          >
            SSLyze Raw Output
          </button>
        </div>

        {/* พื้นหลังสีดำสไตล์ Terminal */}
        <pre className="bg-[#1e272e] text-emerald-400 p-5 rounded-2xl overflow-x-auto text-xs font-mono max-h-[280px] shadow-inner leading-relaxed">
          {activeRawTab === 'nmap' ? scanResult.rawOutputs.nmap : scanResult.rawOutputs.sslyze}
        </pre>
      </div>

    </div>
  );
};

export default ScanResultPage;