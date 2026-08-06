import React from 'react';
import { SearchCheck, ChartColumnBig, ShieldCheck } from 'lucide-react';

export default function FeatureCard({ icon, title, description }) {
  const getIcon = () => {
    if (icon === 'search') return <SearchCheck className="w-7 h-7 text-blue-600" />;
    if (icon === 'bar_chart') return <ChartColumnBig className="w-7 h-7 text-blue-600" />;
    if (icon === 'verified_user') return <ShieldCheck className="w-7 h-7 text-blue-600" />;
    return <ShieldCheck className="w-7 h-7 text-blue-600" />;
  };

  return (
    <div className="group bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/70 shadow-xl shadow-blue-500/5 flex flex-col items-center text-center gap-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/15 hover:border-blue-300">
      
      {/* Icon Badge container with gradient effect on hover */}
      <div className="w-16 h-16 bg-gradient-to-tr from-blue-100/80 via-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm group-hover:scale-110 group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
        <div className="group-hover:text-white transition-colors duration-300">
          {getIcon()}
        </div>
      </div>

      {/* Feature Title & Description */}
      <div className="space-y-3">
        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-slate-600 text-sm font-medium leading-relaxed">
          {description}
        </p>
      </div>

    </div>
  );
}