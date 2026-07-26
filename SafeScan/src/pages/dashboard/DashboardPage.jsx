import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  Activity, 
  Zap, 
  ArrowUpRight, 
  TrendingUp, 
  AlertOctagon, 
  Server, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  Search,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/scan/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data?.success) {
        setHistoryList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 การคำนวณสถิติภาพรวม (Global Metrics Engine)
  const totalScans = historyList.length;
  const completedScans = historyList.filter(i => i.status === 'completed');
  
  // คะแนนเฉลี่ยรวมภาพรวม
  const avgScore = completedScans.length > 0 
    ? Math.round(completedScans.reduce((acc, curr) => acc + (curr.finalScore ?? 0), 0) / completedScans.length)
    : 0;

  // ตัดเกรดภาพรวมระบบ (Global Security Grade)
  const getGlobalGrade = (score) => {
    if (score >= 90) return { grade: 'A', text: 'ระดับความปลอดภัยดีเยี่ยม (Secure)', color: 'text-emerald-400', bg: 'bg-emerald-500' };
    if (score >= 70) return { grade: 'B', text: 'ระดับความปลอดภัยพอใช้ (Acceptable)', color: 'text-blue-400', bg: 'bg-blue-600' };
    if (score >= 50) return { grade: 'C', text: 'ควรได้รับการปรับปรุง (Warning)', color: 'text-amber-400', bg: 'bg-amber-500' };
    if (score >= 30) return { grade: 'D', text: 'มีความเสี่ยงสูง (High Risk)', color: 'text-orange-400', bg: 'bg-orange-500' };
    return { grade: 'F', text: 'สุ่มเสี่ยงอันตราย (Critical)', color: 'text-rose-400', bg: 'bg-rose-600' };
  };

  const globalStatus = getGlobalGrade(avgScore);

  // กรองรายการเสี่ยงด่วน (Critical Domain Alerts)
  const criticalList = completedScans.filter(i => i.grade === 'D' || i.grade === 'F' || (i.finalScore ?? 100) < 50);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[75vh] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-extrabold animate-pulse">SafeScan Command Center กำลังโหลดสถิติภาพรวม...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 font-sans text-slate-800 space-y-8">
      
      {/* 🚀 1. Command Center Banner & Welcome Header */}
      <div className="relative bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-slate-800 overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Security Monitoring
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Cyber Command Dashboard
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed font-medium">
              สรุปภาพรวมดัชนีความปลอดภัย การจัดอันดับภัยคุกคาม และสถิติการสแกนระบบเว็บแอปพลิเคชันตามมาตรฐาน OWASP
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/scan')}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" /> สแกนโดเมนใหม่
            </button>
          </div>
        </div>
      </div>

      {/* 📊 2. Global Security Index Grid (การ์ดสรุปมิติคะแนน) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* การ์ดที่ 1: วงกลมดัชนีความปลอดภัยภาพรวม (Posture Index) */}
        <div className="md:col-span-5 bg-white border border-slate-100 rounded-3xl shadow-lg p-6 flex flex-col justify-between items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block self-start">
            Global Posture Score
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center my-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={globalStatus.color}
                strokeDasharray={`${avgScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 tracking-tight">{avgScore}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">/ 100 AVG</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold text-white ${globalStatus.bg}`}>
              Grade {globalStatus.grade}
            </span>
            <p className="text-xs font-bold text-slate-700">{globalStatus.text}</p>
          </div>
        </div>

        {/* การ์ดที่ 2: สถิติย่อย 4 ช่อง */}
        <div className="md:col-span-7 grid grid-cols-2 gap-4">
          
          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">สแกนสำเร็จแล้ว</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Globe className="w-4 h-4" /></div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">{totalScans}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">ประวัติการตรวจสอบย้อนหลัง</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">พบจุดเสี่ยงอันตราย</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertOctagon className="w-4 h-4" /></div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-rose-600">{criticalList.length}</h3>
              <p className="text-[10px] text-rose-500 font-bold mt-1">โดเมนที่ต้องเร่งแก้ไขด่วน (Grade D/F)</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">ผ่านเกณฑ์สมบูรณ์</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck className="w-4 h-4" /></div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-emerald-600">
                {completedScans.filter(i => i.grade === 'A' || i.grade === 'B').length}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">โดเมนความเสี่ยงต่ำ (Grade A/B)</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">เครื่องมือที่เปิดรัน</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Server className="w-4 h-4" /></div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-purple-900">4 Layer Engine</h3>
              <p className="text-[10px] text-purple-600 font-bold mt-1">Nmap, SSLyze, ZAP, Nikto</p>
            </div>
          </div>

        </div>

      </div>

      {/* 🚨 3. Critical Threat Alert List (รายการโดเมนเสี่ยงที่ต้องเร่งแก้ไข) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 md:p-8 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Urgent Attention Required
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1">โดเมนที่พบช่องโหว่ระดับสูง (Critical Risks)</h3>
          </div>
          <button 
            onClick={() => navigate('/history')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            ดูทั้งหมด <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {criticalList.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">ไม่มีโดเมนที่ติดระดับความเสี่ยงอันตราย!</h4>
            <p className="text-[11px] text-slate-400">ระบบของคุณอยู่ในสถานะปลอดภัยและผ่านเกณฑ์มาตรฐานพื้นฐาน</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalList.slice(0, 4).map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded uppercase">
                    Grade {item.grade} • Score {item.finalScore}
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-900 break-all">{item.targetUrl}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Scan ID: #{item.id}</p>
                </div>
                <button
                  onClick={() => navigate(`/scan-result/${item.id}`)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl transition-all shadow-md shrink-0"
                >
                  แก้ไขช่องโหว่
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📋 4. Recent Activity Log (ตารางการสแกนล่าสุด) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 md:p-8 space-y-4">
        <div className="flex justify-between items-center pb-2">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> ประวัติการสแกนล่าสุด (Recent Activity)
          </h3>
          <button 
            onClick={() => navigate('/history')}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            เปิดดูคลังประวัติทั้งหมด ➔
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-100 uppercase">
              <tr>
                <th className="p-3.5">โดเมนเป้าหมาย</th>
                <th className="p-3.5 text-center">คะแนน</th>
                <th className="p-3.5 text-center">เกรด</th>
                <th className="p-3.5 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {historyList.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <p className="font-extrabold text-slate-900 break-all">{item.targetUrl}</p>
                    <span className="text-[10px] text-slate-400 font-mono">Scan ID: #{item.id}</span>
                  </td>
                  <td className="p-3.5 text-center font-black text-slate-800">{item.finalScore ?? 0}/100</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-white font-black text-[10px] ${
                      item.grade === 'A' ? 'bg-emerald-500' :
                      item.grade === 'B' ? 'bg-blue-600' :
                      item.grade === 'C' ? 'bg-amber-500' :
                      item.grade === 'D' ? 'bg-orange-500' : 'bg-rose-600'
                    }`}>
                      {item.grade || '-'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => navigate(`/scan-result/${item.id}`)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      เปิดรายงาน <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}