import React from 'react';
import ScanBar from './ScanBar';
import heroimg from '../../../assets/heroimg.png';
import { ShieldCheck, Zap, Lock } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative w-full py-16 md:py-28 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-slate-50">
      {/* Background Radial Glow Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial-grid opacity-70 pointer-events-none z-0" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-400/15 rounded-full blur-[90px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Heading & Scanner Input */}
        <div className="lg:col-span-7 flex flex-col items-start gap-6">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-extrabold tracking-wide shadow-xs animate-float">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>ระบบวิเคราะห์และตรวจสอบความปลอดภัยระดับพรีเมียม</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight">
              ตรวจสอบความปลอดภัย<br />
              ของเว็บไซต์{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                ภายในไม่กี่วินาที
              </span>
            </h1>
            <p className="text-slate-600 text-base md:text-lg font-medium leading-relaxed max-w-xl">
              วิเคราะห์ช่องโหว่ภัยคุกคาม ประเมินความเสี่ยงด้วย AI และรับคำแนะนำทางเทคนิคในการป้องกันเว็บไซต์ของคุณอย่างแม่นยำ
            </p>
          </div>

          {/* Scan Bar Component */}
          <div className="w-full pt-2">
            <ScanBar />
          </div>

          {/* Highlights Metrics */}
          <div className="pt-4 grid grid-cols-3 gap-6 border-t border-slate-200/60 w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">สแกนรวดเร็ว</p>
                <p className="text-[11px] font-medium text-slate-500">ผลลัพธ์แบบเรียลไทม์</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">ปลอดภัย 100%</p>
                <p className="text-[11px] font-medium text-slate-500">ไม่เก็บรหัสผ่าน</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900">รายงานแม่นยำ</p>
                <p className="text-[11px] font-medium text-slate-500">วิเคราะห์เชิงลึก</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Hero Graphic Illustration */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-xl animate-pulse-slow" />
            <div className="relative bg-white/70 backdrop-blur-xl border border-blue-100 rounded-3xl p-6 shadow-2xl shadow-blue-500/10">
              <img 
                src={heroimg}
                alt="SafeScan Hero Graphic"
                className="w-full h-auto object-contain rounded-2xl drop-shadow-md transition-transform duration-500 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}