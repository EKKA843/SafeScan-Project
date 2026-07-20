import React, { useEffect, useState } from 'react';
import { Search, Calendar, ShieldAlert, ShieldCheck, ArrowUpRight, Loader2, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/scan/history', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data.success) {
          setHistoryList(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
        alert('ไม่สามารถดึงข้อมูลประวัติได้ กรุณาล็อกอินใหม่อีกครั้งครับ');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // ฟังก์ชันจัดฟอร์แมตเวลาให้อ่านง่ายสไตล์ มทส.
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // กรองรายการตามคำค้นหา (Search)
  const filteredHistory = historyList.filter(item => 
    item.targetUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 font-sans text-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-950">ประวัติการสแกน</h1>
          <p className="text-slate-500 font-medium mt-1">ตรวจสอบประวัติความปลอดภัยและการคำนวณคะแนนย้อนหลังของระบบ</p>
        </div>

        {/* 🔍 ช่องค้นหาอัจฉริยะ */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหาโดเมนที่เคยตรวจสอบ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-medium transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-semibold">กำลังดึงข้อมูลฐานข้อมูลประวัติ...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-700">ไม่พบประวัติการสแกน</h3>
          <p className="text-slate-400 mt-1 max-w-xs mx-auto">ยังไม่มีผลลัพธ์ความปลอดภัยจัดเก็บอยู่ในระบบประวัติการสแกนส่วนบุคคลของคุณ</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="py-4.5 px-6">โดเมนที่ตรวจสอบ</th>
                  <th className="py-4.5 px-6">วันที่ตรวจ</th>
                  <th className="py-4.5 px-6">สถานะ</th>
                  <th className="py-4.5 px-6 text-center">เกรด</th>
                  <th className="py-4.5 px-6 text-center">คะแนน</th>
                  <th className="py-4.5 px-6 text-center">รายงาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredHistory.map((item) => {
                  const isSafe = item.grade === 'A' || item.grade === 'B';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">{item.targetUrl}</td>
                      <td className="py-4 px-6 text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {item.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" /> สำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
                            <ShieldAlert className="w-3.5 h-3.5" /> ล้มเหลว
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block w-8 py-1 rounded-md text-xs font-extrabold text-center ${
                          isSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.grade}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-900 font-bold">{item.score}/100</td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => navigate(`/scan-result/${item.id}`)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition-all"
                        >
                          ส่องผล <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}