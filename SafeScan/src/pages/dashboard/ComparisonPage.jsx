import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRightLeft, 
  Loader2, 
  Key, 
  Server, 
  FileCode, 
  Trophy, 
  Zap, 
  AlertOctagon, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Sparkles 
} from 'lucide-react';
import axios from 'axios';

export default function ComparisonPage() {
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [selectedId1, setSelectedId1] = useState('');
  const [selectedId2, setSelectedId2] = useState('');
  
  const [compareData, setCompareData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/scan/history', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data?.success) {
          setHistoryList(response.data.data.filter(item => item.status === 'completed'));
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleCompare = async () => {
    if (!selectedId1 || !selectedId2) return alert('กรุณาเลือกโดเมนที่ต้องการเปรียบเทียบให้ครบทั้ง 2 ช่องครับ!');
    if (selectedId1 === selectedId2) return alert('กรุณาเลือกผลสแกนที่ต่างกันเพื่อเปรียบเทียบครับ!');

    try {
      setLoadingCompare(true);
      const response = await axios.get(`http://localhost:5000/api/scan/compare?id1=${selectedId1}&id2=${selectedId2}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data?.success) {
        setCompareData(response.data.data);
      }
    } catch (error) {
      console.error('Compare error:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูลเปรียบเทียบ');
    } finally {
      setLoadingCompare(false);
    }
  };

  const getGradeStyle = (grade) => {
    switch (grade) {
      case 'A': return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20' };
      case 'B': return { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' };
      case 'C': return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', shadow: 'shadow-amber-500/20' };
      case 'D': return { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30', shadow: 'shadow-orange-500/20' };
      default: return { bg: 'bg-rose-600', text: 'text-rose-400', border: 'border-rose-500/30', shadow: 'shadow-rose-500/20' };
    }
  };

  // วิเคราะห์หาผู้ชนะ (Winner Analysis)
  const score1 = compareData?.item1?.summary?.finalScore ?? 0;
  const score2 = compareData?.item2?.summary?.finalScore ?? 0;
  const scoreDiff = Math.abs(score1 - score2);
  const winner = score1 > score2 ? 'item1' : score2 > score1 ? 'item2' : 'tie';

  const renderRemediationForTarget = (item, targetName, colorClass) => {
    if (!item) return null;
    const details = item.details || {};
    
    const hasPortIssue = details.A02 && details.A02 !== 'ปลอดภัย' && !details.A02.includes('ขัดข้อง');
    const hasSslIssue = details.A04 && details.A04 !== 'ปลอดภัย' && !details.A04.includes('ขัดข้อง');
    const hasHeaderIssue = details.A05 && details.A05 !== 'ปลอดภัย';
    const isAllSafe = !hasPortIssue && !hasSslIssue && !hasHeaderIssue;

    return (
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${colorClass}`}>
              {targetName}
            </span>
            <h4 className="font-extrabold text-slate-100 mt-2 break-all text-sm">{item.targetUrl}</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">Auto Remediation</span>
        </div>

        {isAllSafe ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-emerald-400 text-xs">เว็บไซต์นี้ปลอดภัยสมบูรณ์แบบ!</h5>
            <p className="text-slate-500 text-[11px]">ไม่พบความเสี่ยงเชิงโครงสร้างจากการตรวจสอบ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hasPortIssue && (
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <Server className="w-4 h-4 shrink-0" />
                  <span>วิธีปิดพอร์ตสุ่มเสี่ยง ({details.A02})</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4 font-medium">
                  <li>ย้ายพอร์ต SSH/RDP หนีจากพอร์ตมาตรฐาน</li>
                  <li>ตั้งค่า Firewall จำกัดการเข้าถึงเฉพาะ Trusted IP</li>
                </ul>
                <div className="bg-black/90 text-emerald-400 font-mono text-[10px] p-2.5 rounded-xl border border-slate-800 select-all">
                  sudo ufw deny 21/tcp && sudo ufw deny 3389/tcp
                </div>
              </div>
            )}

            {hasSslIssue && (
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Key className="w-4 h-4 shrink-0" />
                  <span>วิธีปรับปรุงมาตรฐาน SSL/TLS</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4 font-medium">
                  <li>ยกเลิกการรองรับ TLS 1.0 / TLS 1.1 ที่ล้าสมัย</li>
                  <li>บังคับใช้เฉพาะมาตรฐาน TLS 1.2 / TLS 1.3 เท่านั้น</li>
                </ul>
                <div className="bg-black/90 text-emerald-400 font-mono text-[10px] p-2.5 rounded-xl border border-slate-800 select-all">
                  ssl_protocols TLSv1.2 TLSv1.3;
                </div>
              </div>
            )}

            {hasHeaderIssue && (
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-blue-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <FileCode className="w-4 h-4 shrink-0" />
                  <span>วิธีเติม HTTP Security Headers</span>
                </div>
                <p className="text-[10px] text-blue-300 bg-blue-950/60 p-2 rounded-lg border border-blue-800/40 font-semibold">
                  ปัญหา: {details.A05}
                </p>
                <div className="bg-black/90 text-slate-300 font-mono text-[10px] p-2.5 rounded-xl border border-slate-800 space-y-0.5 select-all">
                  <p className="text-slate-500">// Node.js Express (Helmet Security)</p>
                  <p className="text-emerald-400">const helmet = require('helmet');</p>
                  <p className="text-white">app.use(helmet());</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 font-sans text-slate-800">
      
      {/* 🚀 Header ล้ำยุค สไตล์ Cyber Dashboard */}
      <div className="relative bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-slate-800 mb-8 overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Security Benchmark Intelligence
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Cyber Security Battle Arena
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed font-medium">
              เปรียบเทียบมิติความเสี่ยงและช่องโหว่ทางเทคนิคระหว่าง 2 เว็บไซต์แบบ Head-to-Head ตามเกณฑ์มาตรฐานสากล OWASP Top 10
            </p>
          </div>
        </div>
      </div>

      {/* 📥 1. ส่วนเลือกตัวแปรโดเมน */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_15px_35px_rgba(148,163,184,0.08)] mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
              🎯 เลือกเว็บไซต์เป้าหมายที่ 1 (Target A)
            </label>
            {loadingHistory ? (
              <div className="py-3 text-slate-400 text-xs font-medium animate-pulse">กำลังโหลดประวัติ...</div>
            ) : (
              <select 
                value={selectedId1}
                onChange={(e) => setSelectedId1(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white text-slate-800 font-bold text-xs transition-all cursor-pointer shadow-inner"
              >
                <option value="">-- เลือกเว็บไซต์รายการแรก --</option>
                {historyList.map(item => (
                  <option key={item.id} value={item.id} disabled={item.id === selectedId2}>
                    {item.targetUrl} (เกรด {item.grade} - Score {item.finalScore})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">
              🎯 เลือกเว็บไซต์เป้าหมายที่ 2 (Target B)
            </label>
            {loadingHistory ? (
              <div className="py-3 text-slate-400 text-xs font-medium animate-pulse">กำลังโหลดประวัติ...</div>
            ) : (
              <select 
                value={selectedId2}
                onChange={(e) => setSelectedId2(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white text-slate-800 font-bold text-xs transition-all cursor-pointer shadow-inner"
              >
                <option value="">-- เลือกเว็บไซต์รายการที่สอง --</option>
                {historyList.map(item => (
                  <option key={item.id} value={item.id} disabled={item.id === selectedId1}>
                    {item.targetUrl} (เกรด {item.grade} - Score {item.finalScore})
                  </option>
                ))}
              </select>
            )}
          </div>

        </div>

        <button 
          onClick={handleCompare}
          disabled={loadingCompare || !selectedId1 || !selectedId2}
          className="w-full mt-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-950 hover:to-slate-950 disabled:from-slate-200 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
        >
          {loadingCompare ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              กำลังประมวลผลดวลเปรียบเทียบเชิงลึก...
            </>
          ) : (
            <>
              เริ่มการดวลประเมินความปลอดภัย (Start Battle)
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            </>
          )}
        </button>
      </div>

      {/* 🆚 2. บอร์ดแสดงผลลัพธ์ประชันสุดว้าว */}
      {compareData && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* 🏆 Winner Banner แจ้งเตือนผู้ชนะ */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Comparison Conclusion</span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  {winner === 'tie' 
                    ? 'ทั้งสองเว็บไซต์มีระดับความปลอดภัยเท่ากันพอดี!' 
                    : `${winner === 'item1' ? compareData.item1.targetUrl : compareData.item2.targetUrl} มีความปลอดภัยสูงกว่า!`}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  ส่วนต่างคะแนนความมั่นคงปลอดภัย: <span className="text-emerald-400 font-bold">+{scoreDiff} คะแนน</span>
                </p>
              </div>
            </div>
          </div>

          {/* 📊 Cards เปรียบเทียบคะแนนคู่ขนาน (Side-by-Side Hero Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Target A Card */}
            <div className={`bg-white rounded-3xl border ${winner === 'item1' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100'} p-6 shadow-lg relative overflow-hidden flex flex-col justify-between`}>
              {winner === 'item1' && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                  Winner
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Target A</span>
                    <h3 className="text-lg font-black text-slate-900 mt-2 break-all">{compareData.item1?.targetUrl}</h3>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center font-black ${getGradeStyle(compareData.item1?.summary?.grade).bg} text-white shadow-lg`}>
                    <span className="text-2xl leading-none">{compareData.item1?.summary?.grade}</span>
                    <span className="text-[8px] font-bold uppercase opacity-80 mt-1">Grade</span>
                  </div>
                </div>

                {/* Progress Bar Score */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Security Score:</span>
                    <span className="text-slate-900 font-black text-base">{compareData.item1?.summary?.finalScore} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${getGradeStyle(compareData.item1?.summary?.grade).bg}`}
                      style={{ width: `${compareData.item1?.summary?.finalScore}%` }}
                    />
                  </div>
                </div>

                {/* Vulnerability Counts */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black mb-6">
                  <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl border border-rose-100">Critical: {compareData.item1?.vulnerabilities?.critical}</div>
                  <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-orange-100">High: {compareData.item1?.vulnerabilities?.high}</div>
                  <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl border border-amber-100">Med: {compareData.item1?.vulnerabilities?.medium}</div>
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100">Low: {compareData.item1?.vulnerabilities?.low}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs space-y-2 font-medium">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-bold">Port Check:</span>
                  <span className="text-slate-800 font-bold">{compareData.item1?.details?.A02}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-bold">SSL/TLS Cert:</span>
                  <span className="text-slate-800 font-bold">{compareData.item1?.details?.A04}</span>
                </div>
              </div>
            </div>

            {/* Target B Card */}
            <div className={`bg-white rounded-3xl border ${winner === 'item2' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100'} p-6 shadow-lg relative overflow-hidden flex flex-col justify-between`}>
              {winner === 'item2' && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                  Winner
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Target B</span>
                    <h3 className="text-lg font-black text-slate-900 mt-2 break-all">{compareData.item2?.targetUrl}</h3>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center font-black ${getGradeStyle(compareData.item2?.summary?.grade).bg} text-white shadow-lg`}>
                    <span className="text-2xl leading-none">{compareData.item2?.summary?.grade}</span>
                    <span className="text-[8px] font-bold uppercase opacity-80 mt-1">Grade</span>
                  </div>
                </div>

                {/* Progress Bar Score */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">Security Score:</span>
                    <span className="text-slate-900 font-black text-base">{compareData.item2?.summary?.finalScore} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${getGradeStyle(compareData.item2?.summary?.grade).bg}`}
                      style={{ width: `${compareData.item2?.summary?.finalScore}%` }}
                    />
                  </div>
                </div>

                {/* Vulnerability Counts */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black mb-6">
                  <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl border border-rose-100">Critical: {compareData.item2?.vulnerabilities?.critical}</div>
                  <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-orange-100">High: {compareData.item2?.vulnerabilities?.high}</div>
                  <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl border border-amber-100">Med: {compareData.item2?.vulnerabilities?.medium}</div>
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100">Low: {compareData.item2?.vulnerabilities?.low}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs space-y-2 font-medium">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-bold">Port Check:</span>
                  <span className="text-slate-800 font-bold">{compareData.item2?.details?.A02}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-bold">SSL/TLS Cert:</span>
                  <span className="text-slate-800 font-bold">{compareData.item2?.details?.A04}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ⚔️ Head-to-Head Feature Matrix Table (ตารางดวลฟีเจอร์) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 md:p-8">
            <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> ตารางเปรียบเทียบคุณสมบัติความปลอดภัย (1-on-1 Matrix)
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-100 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">หมวดการประเมิน</th>
                    <th className="p-4 text-center">Target A ({compareData.item1?.targetUrl})</th>
                    <th className="p-4 text-center">Target B ({compareData.item2?.targetUrl})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  <tr>
                    <td className="p-4 text-slate-700">1. การเปิดพอร์ตระบบ (Nmap Port Scan)</td>
                    <td className="p-4 text-center">
                      {compareData.item1?.details?.A02?.includes('ปลอดภัย') ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> ปลอดภัย</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="w-4 h-4" /> พบพอร์ตเสี่ยง</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {compareData.item2?.details?.A02?.includes('ปลอดภัย') ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> ปลอดภัย</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="w-4 h-4" /> พบพอร์ตเสี่ยง</span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 text-slate-700">2. ใบรับรอง SSL/TLS (SSLyze Analysis)</td>
                    <td className="p-4 text-center">
                      {compareData.item1?.details?.A04?.includes('ปลอดภัย') ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> ปลอดภัย</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="w-4 h-4" /> ใบรับรองมีปัญหา</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {compareData.item2?.details?.A04?.includes('ปลอดภัย') ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> ปลอดภัย</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="w-4 h-4" /> ใบรับรองมีปัญหา</span>
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 text-slate-700">3. HTTP Security Headers (CSP, HSTS)</td>
                    <td className="p-4 text-center">
                      {compareData.item1?.details?.A05?.includes('ปลอดภัย') ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> มีครบถ้วน</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="w-4 h-4" /> ขาด Header สำคัญ</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {compareData.item2?.details?.A05?.includes('ปลอดภัย') ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> มีครบถ้วน</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="w-4 h-4" /> ขาด Header สำคัญ</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 🛠️ 4. Dynamic Remediation Section สไตล์ Cyber Security Dark Console */}
          <div className="bg-slate-950 rounded-3xl p-8 border border-slate-800 shadow-2xl text-white">
            <div className="border-b border-slate-800 pb-5 mb-6">
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-widest">
                AI Cyber Remediation Engine
              </span>
              <h3 className="text-xl font-black text-white mt-3">คำแนะนำการปิดช่องโหว่เฉพาะโดเมน (Specific Remediation)</h3>
              <p className="text-slate-400 text-xs mt-1">
                สร้างสคริปต์แก้ไขเฉพาะเจาะจงตามผลลัพธ์การสแกนจริงของแต่ละเซิร์ฟเวอร์
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderRemediationForTarget(compareData.item1, "Target A", "bg-blue-500/20 text-blue-400 border border-blue-500/30")}
              {renderRemediationForTarget(compareData.item2, "Target B", "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30")}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}