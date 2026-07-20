import React, { useState } from 'react';
import { Shield, BookOpen, Key, Server, FileCode, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

export default function SecurityPolicyPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 font-sans text-sm">
      {/* 🚀 Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-blue-950 flex items-center gap-2">
          นโยบายและมาตรฐานความปลอดภัย <Shield className="w-7 h-7 text-blue-600" />
        </h1>
        <p className="text-slate-500 font-medium mt-1">เกณฑ์การประเมินผลและกรอบมาตรฐานสากลที่ระบบ SafeScan ใช้ในการวิเคราะห์ช่องโหว่</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* 📑 เมนูแถบข้างสำหรับการเลือกหัวข้อ */}
        <div className="md:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left p-3.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview' ? 'bg-blue-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" /> ภาพรวมเกณฑ์ประเมิน
          </button>
          <button
            onClick={() => setActiveTab('A02')}
            className={`w-full text-left p-3.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'A02' ? 'bg-blue-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Server className="w-4 h-4" /> A02: Ports & Services
          </button>
          <button
            onClick={() => setActiveTab('A04')}
            className={`w-full text-left p-3.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'A04' ? 'bg-blue-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <Key className="w-4 h-4" /> A04: SSL/TLS Encryption
          </button>
          <button
            onClick={() => setActiveTab('A05')}
            className={`w-full text-left p-3.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'A05' ? 'bg-blue-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <FileCode className="w-4 h-4" /> A05: Security Headers
          </button>
        </div>

        {/* 📄 ส่วนแสดงเนื้อหาตามแท็บที่เลือก */}
        <div className="md:col-span-9 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_10px_30px_rgba(148,163,184,0.02)]">
          
          {/* TAB 1: ภาพรวม */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-extrabold text-blue-950 mb-1">กรอบแนวคิดการประเมินผล (Scoring Framework)</h3>
                <p className="text-slate-400 text-xs font-medium">SafeScan คำนวณคะแนนสุทธิจากคะแนนเต็ม 100 คะแนน โดยอ้างอิงผลกระทบความรุนแรงตามมาตรฐาน OWASP</p>
              </div>

              {/* ตารางเกรด */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold text-xs border-b border-slate-100">
                      <th className="p-3.5 pl-5">ระดับคะแนน</th>
                      <th className="p-3.5 text-center">เกรด</th>
                      <th className="p-3.5">ความหมายและความเสี่ยง</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium text-slate-700 divide-y divide-slate-50">
                    <tr>
                      <td className="p-3.5 pl-5 font-bold text-slate-900">85 - 100</td>
                      <td className="p-3.5 text-center"><span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black">A</span></td>
                      <td className="p-3.5 text-xs text-slate-500">ยอดเยี่ยม ระบบมีการเข้ารหัสและปิดพอร์ตเสี่ยงตามข้อกำหนดครบถ้วน</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-5 font-bold text-slate-900">70 - 84</td>
                      <td className="p-3.5 text-center"><span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-black">B</span></td>
                      <td className="p-3.5 text-xs text-slate-500">ปลอดภัยดี มีการป้องกันพื้นฐานครบ แต่อาจขาดการตั้งค่าขั้นสูงบางจุด</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-5 font-bold text-slate-900">55 - 69</td>
                      <td className="p-3.5 text-center"><span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 rounded font-black">C</span></td>
                      <td className="p-3.5 text-xs text-slate-500">เฝ้าระวัง พบช่องโหว่ระดับต่ำหรือระดับปานกลางที่ควรได้รับการแก้ไข</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-5 font-bold text-slate-900">40 - 54</td>
                      <td className="p-3.5 text-center"><span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 rounded font-black">D</span></td>
                      <td className="p-3.5 text-xs text-slate-500">ความเสี่ยงสูง พบข้อบกพร่องในระบบเข้ารหัส หรือมีการเปิดพอร์ตสาธารณะค้างไว้</td>
                    </tr>
                    <tr>
                      <td className="p-3.5 pl-5 font-bold text-slate-900">ต่ำกว่า 40</td>
                      <td className="p-3.5 text-center"><span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded font-black">F</span></td>
                      <td className="p-3.5 text-xs text-slate-500">วิกฤต ช่องโหว่ความร้ายแรงสูงมาก ขาดโครงสร้างความปลอดภัยพื้นฐานอย่างรุนแรง</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: A02 */}
          {activeTab === 'A02' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded tracking-wider uppercase">OWASP A02:2021</span>
                <h3 className="text-lg font-extrabold text-blue-950 mt-1">Ports & Infrastructure Services</h3>
                <p className="text-slate-400 text-xs mt-0.5">การตรวจสอบความปลอดภัยของพอร์ตเชื่อมต่อและบริการแปลกปลอมบนระบบเครือข่าย</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-slate-600 leading-relaxed font-medium text-xs">
                <p><strong>พอร์ตปลอดภัยมาตรฐาน:</strong> ระบบอนุญาตให้เปิดเผยพอร์ตบริการสาธารณะปกติได้ เช่น พอร์ต 80 (HTTP) และพอร์ต 443 (HTTPS)</p>
                <p className="text-rose-600"><strong>พอร์ตอันตราย/ความเสี่ยงสูง:</strong> หากตรวจพบการเปิดพอร์ตจัดการระบบทิ้งไว้สู่สาธารณะ เช่น 21 (FTP), 23 (Telnet), 445 (SMB), หรือ 3389 (RDP) ระบบจะทำการหักคะแนนความปลอดภัยทันที เนื่องจากเสี่ยงต่อการถูกแทรกแซงและโจมตีผ่านช่องโหว่บริการเก่า</p>
              </div>
            </div>
          )}

          {/* TAB 3: A04 */}
          {activeTab === 'A04' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded tracking-wider uppercase">OWASP A04:2021</span>
                <h3 className="text-lg font-extrabold text-blue-950 mt-1">Cryptographic Failures (SSL/TLS)</h3>
                <p className="text-slate-400 text-xs mt-0.5">มาตรฐานการตรวจสอบใบรับรองความปลอดภัยและการเข้ารหัสลับข้อมูลระหว่างขนส่ง</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 text-slate-600 leading-relaxed font-medium text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>ข้อกำหนดที่ผ่านเกณฑ์:</strong> ใบรับรองดิจิทัล (SSL Certificate) ต้องไม่หมดอายุ, ออกโดยหน่วยงานที่น่าเชื่อถือ (CA), และต้องรองรับโปรโตคอลการเข้ารหัสสมัยใหม่ระดับสูง ได้แก่ <strong>TLS 1.2 หรือ TLS 1.3</strong> เท่านั้น</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>จุดที่ถูกหักคะแนน:</strong> การปล่อยให้ระบบปลายทางรองรับโปรโตคอลเก่าที่ถูกพิสูจน์แล้วว่ามีช่องโหว่ร้ายแรง เช่น SSL v2, SSL.v3, TLS 1.0 หรือ TLS 1.1</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: A05 */}
          {activeTab === 'A05' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded tracking-wider uppercase">OWASP A05:2021</span>
                <h3 className="text-lg font-extrabold text-blue-950 mt-1">Security Misconfiguration (HTTP Headers)</h3>
                <p className="text-slate-400 text-xs mt-0.5">การตรวจสอบการตั้งค่าส่วนหัวของ HTTP (Security Headers) เพื่อเสริมเกราะฝั่งเบราว์เซอร์</p>
              </div>

              <div className="space-y-3 font-medium text-xs text-slate-600">
                <p>SafeScan จะสแกนเพื่อตรวจสอบหาเกราะป้องกันหลัก 3 ตัว ซึ่งหากขาดตัวใดตัวหนึ่งไปจะส่งผลต่อการประเมินคะแนนภาพรวม:</p>
                
                <div className="border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <strong className="text-slate-800 block">1. Strict-Transport-Security (HSTS)</strong>
                  <span className="text-slate-500 text-[11px]">บังคับให้ผู้ใช้เชื่อมต่อผ่าน HTTPS เสมอ ป้องกันการดักรับแพ็กเก็ตข้อมูลในระบบเครือข่ายสาธารณะ (MitM Attack)</span>
                </div>

                <div className="border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <strong className="text-slate-800 block">2. X-Frame-Options</strong>
                  <span className="text-slate-500 text-[11px]">ป้องกันการนำเว็บไซต์ไปครอบใน iframe บนเว็บของผู้อื่น เพื่อป้องกันภัยคุกคามประเภทหลอกคลิกจี้จอมืด (Clickjacking)</span>
                </div>

                <div className="border border-slate-100 rounded-xl p-3.5 space-y-1">
                  <strong className="text-slate-800 block">3. X-Content-Type-Options</strong>
                  <span className="text-slate-500 text-[11px]">สั่งการให้เบราว์เซอร์ปฏิบัติตาม Content-Type ที่ส่งมาจากเซิร์ฟเวอร์อย่างเคร่งครัด ป้องกันการโจมตีประเภท MIME Sniffing</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}