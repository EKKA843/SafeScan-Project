import React from 'react';
import ScanBar from './ScanBar';
import heroimg from '../../../assets/heroimg.png'

export default function HeroSection() {
  return (
    <section className="relative w-full py-20 md:py-32 overflow-hidden">
        
      
      {/* Background Glow Effect จากรูปฝั่งขวา */}
      <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-500px h-500px bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-start gap-8">
        {/* {Hero IMG} */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-90 h-90 bg-blue-400/30 rounded-full blur-[70px] pointer-events-none z-0" />
          <img 
              src= {heroimg}
              className="absolute top-1/2 left-270 -translate-x-1/2 -translate-y-1/2 w-150 h-auto object-contain"
              alt="Hero Graphic"
            />
        {/* Headings */}
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            ตรวจสอบความปลอดภัย<br />
            ของเว็บไซต์<span className="text-blue-900 font-black">ภายในไม่กี่วินาที</span>
          </h1>
          <p className="text-base md:text-lg text-slate-500 font-normal leading-relaxed">
            วิเคราะห์ช่องโหว่เว็บไซต์ ประเมินความเสี่ยง และคำแนะนำในการแก้ไขที่ใช้งานง่ายและแม่นยำ
          </p>
        </div>
        {/* Scan Input Bar Component */}
        <ScanBar />

      </div>
    </section>
  );
}