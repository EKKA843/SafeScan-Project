import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Activity, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/scan/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-semibold text-sm">กำลังคำนวณและประมวลผลสถิติจากฐานข้อมูล...</p>
      </div>
    );
  }

  const summary = stats?.summary || { totalScans: 0, completedScans: 0, failedScans: 0, safeCount: 0, riskyCount: 0 };
  const vulns = stats?.vulnStats || { critical: 0, high: 0, medium: 0, low: 0 };
  const grades = stats?.gradeDistribution || { A: 0, B: 0, C: 0, D: 0, F: 0 };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 font-sans text-sm">
      {/* 🚀 Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-950">แดชบอร์ดสถิติรวม</h1>
          <p className="text-slate-500 font-medium mt-1">สรุปภาพรวมและวิเคราะห์สถิติจุดบกพร่องระบบรักษาความปลอดภัยส่วนบุคคล</p>
        </div>
        <button 
          onClick={fetchStats}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-600 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> รีเฟรชข้อมูล
        </button>
      </div>

      {/* 📊 1. การ์ด KPIs สรุปหลัก */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.03)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">สแกนทั้งหมด</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.totalScans} <span className="text-xs font-semibold text-slate-400">ครั้ง</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.03)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">ระบบที่ปลอดภัย</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{summary.safeCount} <span className="text-xs font-semibold text-slate-400">เว็บ</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.03)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">ระบบที่มีความเสี่ยง</p>
            <h3 className="text-2xl font-black text-rose-600 mt-0.5">{summary.riskyCount} <span className="text-xs font-semibold text-slate-400">เว็บ</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.03)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">สแกนขัดข้อง</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{summary.failedScans} <span className="text-xs font-semibold text-slate-400">ครั้ง</span></h3>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* ⚠️ 2. สรุปยอดช่องโหว่สะสมที่ตรวจเจอ (OWASP Vuln Counts) */}
        <div className="md:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-blue-950 mb-1">ช่องโหว่สะสมที่ตรวจพบ</h3>
            <p className="text-slate-400 text-xs font-medium mb-6">สรุปจำนวนภัยคุกคามตามระดับความร้ายแรงที่เคยตรวจเจอในระบบ</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-red-600">วิกฤต (Critical)</span>
                <span className="text-slate-700">{vulns.critical} รายการ</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${Math.min(100, (vulns.critical * 10) || 0)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-orange-500">สูง (High Risk)</span>
                <span className="text-slate-700">{vulns.high} รายการ</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${Math.min(100, (vulns.high * 8) || 0)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-yellow-500">ปานกลาง (Medium Risk)</span>
                <span className="text-slate-700">{vulns.medium} รายการ</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${Math.min(100, (vulns.medium * 5) || 0)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-blue-500">ต่ำ (Low Risk)</span>
                <span className="text-slate-700">{vulns.low} รายการ</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, (vulns.low * 3) || 0)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 🏅 3. การกระจายตัวของเกรดความปลอดภัยที่ได้ (Grade Summary) */}
        <div className="md:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.03)] flex flex-col">
          <h3 className="text-base font-extrabold text-blue-950 mb-1">สัดส่วนเกรดสะสม</h3>
          <p className="text-slate-400 text-xs font-medium mb-6">ความถี่เกรดจากการประเมินมาตรฐาน OWASP</p>

          <div className="flex-1 flex flex-col justify-center gap-3">
            {Object.entries(grades).map(([grade, count]) => (
              <div key={grade} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <span className="inline-flex w-7 h-7 bg-slate-100 text-slate-800 font-extrabold rounded-lg items-center justify-center">{grade}</span>
                  <span className="text-slate-500">ระดับความปลอดภัยเกรด {grade}</span>
                </div>
                <span className="text-slate-900 font-bold">{count} ครั้ง</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}