import React from 'react';
import { SearchCheck,ChartColumnBig,ShieldCheck } from 'lucide-react';

export default function FeatureCard({ icon, title, description }) {
  return (
    <div className="cursor-pointer bg-white rounded-3xl p-8 border border-slate-50 shadow-xl shadow-slate-100/50 flex flex-col items-center text-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60">
      
      {/* Container ไอคอนสี่เหลี่ยมมุมมนสีฟ้าจางๆ */}
      <div className="w-14 h-14 bg-blue-50/70 rounded-2xl flex items-center justify-center text-blue-900">
        <span className="material-icons-outlined text-2xl font-bold">{icon == 'search' ? <SearchCheck />:icon == 'bar_chart' ?  <ChartColumnBig /> :icon == 'verified_user' ? <ShieldCheck />: icon}</span>
      </div>

      {/* ข้อความหัวข้อและการ์ด */}
      <div className="space-y-3">
        <h3 className="text-xl font-extrabold text-slate-800">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-260">
          {description}
        </p>
      </div>

    </div>
  );
}