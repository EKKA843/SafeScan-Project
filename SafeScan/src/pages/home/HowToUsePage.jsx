import React from 'react';
import { UserPlus, Search, Cpu, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
// 🎯 1. นำเข้า Navbar เข้ามาใช้งาน (เช็กพาร์ทระดับโฟลเดอร์ให้ตรงกับที่นายเก็บไฟล์ไว้นะครับ)
import Navbar from '../../components/layout/Navbar'; 

export default function HowToUsePage() {
  const steps = [
    {
      icon: <UserPlus className="w-8 h-8 text-blue-600" />,
      title: "1. สมัครสมาชิกและเข้าสู่ระบบ",
      description: "เริ่มต้นสร้างบัญชีผู้ใช้งานของคุณเพื่อเปิดใช้งานระบบแดชบอร์ดสถิติ และจัดเก็บประวัติผลการสแกนความปลอดภัยแยกส่วนบุคคล"
    },
    {
      icon: <Search className="w-8 h-8 text-blue-600" />,
      title: "2. ระบุโดเมนที่ต้องการตรวจสอบ",
      description: "ไปที่เมนู 'ตรวจสอบเว็บไซต์' จากนั้นพิมพ์ URL ของเว็บไซต์หรือ IP Address ของระบบที่นายต้องการทดสอบ"
    },
    {
      icon: <Cpu className="w-8 h-8 text-blue-600" />,
      title: "3. ระบบประมวลผลอัจฉริยะ",
      description: "SafeScan จะสั่งรันคำสั่งเบื้องหลังด้วย Nmap และ SSLyze แบบเรียลไทม์ เพื่อตรวจสอบพอร์ต, ใบรับรอง SSL, และโครงสร้างหลัก"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-blue-600" />,
      title: "4. รับรายงานและคู่มือแก้ไข",
      description: "ระบบจะสรุปผลคะแนนออกมาเป็นเกรด A-F พร้อมทั้งบอกจุดบกพร่อง และคัดเลือกโค้ดตัวอย่างวิธีแก้ไขเฉพาะจุดให้ทำตามได้ทันที"
    }
  ];

  return (
    // 🎯 2. สวมแท็ก <Navbar /> ไว้บนสุด และใช้ Fragment คลุมเนื้อหาทั้งหมด
    <>
      <Navbar />

      <div className="bg-slate-50/50 min-h-screen py-16 px-6 font-sans text-sm">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">User Guide</span>
            <h1 className="text-4xl font-extrabold text-blue-950 mt-3">วิธีการใช้งาน SafeScan</h1>
            <p className="text-slate-500 font-medium mt-2 text-base">เรียนรู้ขั้นตอนง่าย ๆ ในการเริ่มต้นเฝ้าระวังและปิดช่องโหว่ความปลอดภัยระบบของคุณ</p>
          </div>

          {/* 🗺️ Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {steps.map((step, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.02)] flex flex-col justify-between hover:border-blue-100 transition-all">
                <div>
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 🚀 Call to Action */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-[0_15px_40px_rgba(148,163,184,0.03)]">
            <h3 className="text-xl font-extrabold text-slate-900">พร้อมเริ่มต้นตรวจสอบระบบของคุณหรือยัง?</h3>
            <p className="text-slate-400 mt-1 mb-6">เข้าสู่ระบบเพื่อลองสั่งสแกนฟรี และวิเคราะห์ข้อมูลโครงสร้างความปลอดภัยทันที</p>
            <div className="flex justify-center gap-4">
              <Link to="/login" className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2">
                เข้าสู่ระบบเพื่อใช้งาน <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}