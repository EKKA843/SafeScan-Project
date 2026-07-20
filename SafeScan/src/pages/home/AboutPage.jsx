import React from 'react';
import { Shield, Server, Cpu, Database, Award } from 'lucide-react';
// 🎯 1. นำเข้า Navbar เข้ามาใช้งาน (เช็กพาร์ทระดับโฟลเดอร์ให้ตรงกับที่นายเก็บไฟล์ไว้นะครับ)
import Navbar from '../../components/layout/Navbar'; 

export default function AboutPage() {
  const techs = [
    { name: "React (Vite)", role: "Frontend UI", desc: "โครงสร้างหน้าจอแอปพลิเคชันที่รวดเร็ว ลื่นไหล และตอบสนองทุกอุปกรณ์" },
    { name: "Node.js & Express", role: "Backend API", desc: "เซิร์ฟเวอร์หลักที่คอยเชื่อมประสาน จัดระเบียบท่อ API และควบคุมคิวคำสั่งสแกน" },
    { name: "MySQL", role: "Database", desc: "จัดเก็บระเบียนผู้ใช้งาน ประวัติการสแกนอย่างเป็นระบบ และบันทึกข้อมูลเว็บไซต์เฝ้าระวัง" },
    { name: "Nmap & SSLyze", role: "Scanner Tools", desc: "เครื่องมือวิเคราะห์ระดับลึก เพื่อแกะพอร์ตบริการ และตรวจสอบการเข้ารหัส SSL/TLS" }
  ];

  return (
    // 🎯 2. สวมแท็ก <Navbar /> ไว้ด้านบนสุดของหน้าจอ
    <>
      <Navbar />
      
      <div className="bg-slate-50/50 min-h-screen py-16 px-6 font-sans text-sm">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">About Us</span>
            <h1 className="text-4xl font-extrabold text-blue-950 mt-3">เกี่ยวกับ SafeScan</h1>
            <p className="text-slate-500 font-medium mt-2 text-base">ระบบรักษาความปลอดภัยอัจฉริยะที่พัฒนาขึ้นเพื่อสนับสนุนวิศวกรรมความปลอดภัยเว็บแอปพลิเคชัน</p>
          </div>

          {/* 🛡️ Mission section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(148,163,184,0.02)] mb-12">
            <h2 className="text-xl font-extrabold text-blue-950 mb-3 flex items-center gap-2">
              วิสัยทัศน์โปรเจกต์ <Award className="w-5 h-5 text-blue-600" />
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              SafeScan ได้รับการพัฒนาขึ้นโดยมีวัตถุประสงค์เพื่อยกระดับและช่วยอำนวยความสะดวกให้แก่นักพัฒนาเว็บแอปพลิเคชัน ในการตรวจสอบหาจุดบกพร่องพื้นฐานด้านความปลอดภัยบนเซิร์ฟเวอร์ โดยทีมพัฒนาได้อ้างอิงกรอบมาตรฐานและกฎเกณฑ์ความรุนแรงตามมาตรฐานสากลของ <strong>OWASP Top 10</strong> เพื่อให้คำแนะนำและพ่นแนวทางการแก้ไขปัญหาที่สามารถนำไปปรับใช้ได้จริงอย่างมีประสิทธิภาพ
            </p>
          </div>

          {/* 🛠️ Tech Stack section */}
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-6 text-center">เทคโนโลยีที่เบื้องหลังระบบ (Tech Stack)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {techs.map((tech, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{tech.name}</h4>
                    <span className="text-[10px] font-bold text-blue-600 block mb-1.5 uppercase">{tech.role}</span>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">{tech.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}