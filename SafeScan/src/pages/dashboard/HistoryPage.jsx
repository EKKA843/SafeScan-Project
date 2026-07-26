import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Globe, 
  ExternalLink, 
  ArrowRightLeft, 
  Calendar, 
  Filter, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import axios from 'axios';

export default function ScanHistoryPage() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับการค้นหาและจัดหมวดหมู่ (Filter)
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'risky', 'safe'
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'score-asc', 'score-desc'

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
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
      console.error('Error fetching scan history:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Logic คัดกรองหมวดหมู่และค้นหาข้อมูล
  const filteredList = historyList
    .filter((item) => {
      // 1. ค้นหาตาม URL หรือ Scan ID
      const matchesSearch = 
        item.targetUrl?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.id).includes(searchTerm);

      // 2. จัดหมวดหมู่ตามความเสี่ยง
      if (categoryFilter === 'risky') {
        return matchesSearch && (item.grade === 'D' || item.grade === 'F' || (item.finalScore ?? 100) < 50);
      }
      if (categoryFilter === 'safe') {
        return matchesSearch && (item.grade === 'A' || item.grade === 'B');
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      // 3. เรียงลำดับข้อมูล
      if (sortBy === 'score-asc') return (a.finalScore ?? 0) - (b.finalScore ?? 0);
      if (sortBy === 'score-desc') return (b.finalScore ?? 0) - (a.finalScore ?? 0);
      return new Date(b.createdAt) - new Date(a.createdAt); // latest
    });

  // สถิติสรุปภาพรวม (Metrics Summary)
  const totalScans = historyList.length;
  const safeScans = historyList.filter(i => i.grade === 'A' || i.grade === 'B').length;
  const riskyScans = historyList.filter(i => i.grade === 'D' || i.grade === 'F' || (i.finalScore ?? 100) < 50).length;

  const getGradeBadge = (grade) => {
    switch (grade) {
      case 'A': return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'B': return 'bg-blue-600 text-white shadow-blue-600/20';
      case 'C': return 'bg-amber-500 text-white shadow-amber-500/20';
      case 'D': return 'bg-orange-500 text-white shadow-orange-500/20';
      default: return 'bg-rose-600 text-white shadow-rose-600/20';
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-bold animate-pulse">กำลังโหลดประวัติการตรวจสอบความปลอดภัย...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 font-sans text-slate-800 space-y-8">
      
      {/* 🚀 Header ประวัติการสแกนสไตล์ Cyber Security */}
      <div className="relative bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-slate-800 overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <History className="w-3.5 h-3.5" /> Security Audit Records
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              ประวัติการสแกนระบบ
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed font-medium">
              คลังบันทึกรายงานประวัติการตรวจสอบช่องโหว่ความปลอดภัย และผลการประเมินคะแนนเชิงลึกย้อนหลัง
            </p>
          </div>
        </div>
      </div>

      {/* 📊 Stat Cards ภาพรวมสถิติ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">การสแกนทั้งหมด</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalScans} <span className="text-xs text-slate-400 font-normal">รายการ</span></h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">ผ่านเกณฑ์ความปลอดภัย</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{safeScans} <span className="text-xs text-slate-400 font-normal">โดเมน</span></h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">พบจุดเสี่ยงอันตราย</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{riskyScans} <span className="text-xs text-slate-400 font-normal">โดเมน</span></h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 🎯 ส่วนควบคุมการค้นหา และ Filter แถบหมวดหมู่ (Clean Category Controls) */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* ช่องค้นหา */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ URL เว็บไซต์ หรือ Scan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* เรียงลำดับ */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 shrink-0">เรียงตาม:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="latest">ล่าสุดไปเก่าสุด</option>
              <option value="score-desc">คะแนนสูงสุด ➔ ต่ำสุด</option>
              <option value="score-asc">คะแนนต่ำสุด ➔ สูงสุด</option>
            </select>
          </div>

        </div>

        {/* แถบเปลี่ยนหมวดหมู่ (Category Filter Tabs) */}
        <div className="flex border-t border-slate-100 pt-4 gap-2 overflow-x-auto text-xs font-extrabold">
          <button 
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              categoryFilter === 'all' 
                ? 'bg-blue-900 text-white shadow-md' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> ประวัติทั้งหมด ({totalScans})
          </button>

          <button 
            onClick={() => setCategoryFilter('risky')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              categoryFilter === 'risky' 
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' 
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> สแกนพบจุดเสี่ยง ({riskyScans})
          </button>

          <button 
            onClick={() => setCategoryFilter('safe')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              categoryFilter === 'safe' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> ผ่านเกณฑ์ความปลอดภัย ({safeScans})
          </button>
        </div>

      </div>

      {/* 📋 ตารางแสดงประวัติแบบละเอียดยิบ (History Data Table) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">ไม่พบประวัติการสแกนตามเงื่อนไขที่เลือก</h4>
            <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหาหรือสลับหมวดหมู่ตัวกรองดูนะครับ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Scan ID & โดเมนเป้าหมาย</th>
                  <th className="p-4 text-center">คะแนนความปลอดภัย</th>
                  <th className="p-4 text-center">เกรด</th>
                  <th className="p-4">วันที่ทำการสแกน</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filteredList.map((item) => {
                  const score = item.finalScore ?? 0;
                  const formattedDate = item.createdAt 
                    ? new Date(item.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '-';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID & Target URL */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                            #{item.id}
                          </span>
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-900 text-xs break-all">{item.targetUrl}</p>
                            <span className="text-[10px] text-slate-400 font-medium block">Status: {item.status}</span>
                          </div>
                        </div>
                      </td>

                      {/* Score & Progress */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1 min-w-[100px]">
                          <span className="font-black text-slate-800 text-sm">{score} / 100</span>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Grade Badge */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs shadow-sm ${getGradeBadge(item.grade)}`}>
                          {item.grade || '-'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/scan-result/${item.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold transition-all text-[11px]"
                          >
                            รายงาน <ExternalLink className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={() => navigate('/comparison')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-all text-[11px]"
                          >
                            เทียบ <ArrowRightLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}