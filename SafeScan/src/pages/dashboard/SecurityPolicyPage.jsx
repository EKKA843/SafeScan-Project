import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Server, 
  Globe, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Layers, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function SecurityPolicyPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 font-sans text-slate-700 space-y-8">
      
      {/* 🟢 Header หน้า นโยบายและมาตรฐานความปลอดภัย */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-10 -translate-y-10 pointer-events-none">
          <ShieldCheck className="w-96 h-96" />
        </div>
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5" /> ISO/IEC 27001:2022 & OWASP Top 10 (2025)
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">นโยบายและมาตรฐานความปลอดภัยระบบ SafeScan</h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            รายละเอียดเชิงนโยบาย ขอบเขตการประเมิน 4-Layer Security Architecture และเกณฑ์การตัดสินความปลอดภัยตามมาตรฐานสากล
          </p>
        </div>
      </div>

      {/* 🎯 Tabs สลับหมวดหมู่การรับชม */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" /> 1. OWASP 2025 & Scoring Workflow
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'tools'
              ? 'border-blue-600 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Cpu className="w-4 h-4" /> 2. 4-Layer Assessment Criteria
        </button>
        <button
          onClick={() => setActiveTab('sdlc')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'sdlc'
              ? 'border-blue-600 text-blue-900 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Lock className="w-4 h-4" /> 3. Secure SDLC & PDPA Guidelines
        </button>
      </div>

      {/* ==================== TAB 1: OWASP & SCORING WORKFLOW ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* OWASP Top 10 Mapping */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-950">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold">1. กรอบการประเมิน OWASP Top 10 (2025)</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              วิเคราะห์จาก CVE กว่า 175,000 รายการ และ CWE 589 ประเภท ใช้เป็นกรอบหลักในการประเมินและ Map เครื่องมือสแกนทั้ง 4 ตัว
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">ชื่อช่องโหว่ (Vulnerability Category)</th>
                    <th className="p-3">เครื่องมือสแกน</th>
                    <th className="p-3">ระดับความเสี่ยง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A01</td><td className="p-3">Broken Access Control</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold text-[13px]">Critical</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A02</td><td className="p-3">Security Misconfiguration</td><td className="p-3">Nikto, Nmap</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[13px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A03</td><td className="p-3">Software Supply Chain Failures</td><td className="p-3">Nikto</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[13px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A04</td><td className="p-3">Cryptographic Failures</td><td className="p-3">SSLyze</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[13px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A05</td><td className="p-3">Injection (SQL, XSS, Command)</td><td className="p-3">ZAP, Nikto</td><td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold text-[13px]">Critical</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A06</td><td className="p-3">Insecure Design</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[13px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A07</td><td className="p-3">Authentication Failures</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[13px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A08</td><td className="p-3">Data Integrity Failures</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[13px]">Medium</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A09</td><td className="p-3">Security Logging & Alerting Failures</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[13px]">Low</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A10</td><td className="p-3">Mishandling of Exceptional Conditions</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[13px]">Medium</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scoring Formula */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-950">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold">2. นิยามระดับความรุนแรง และการหักคะแนน (CVSS v3.1 Basis)</h2>
            </div>

            <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-950">สูตรคำนวณคะแนนที่ระบบใช้จริง</p>
              <div className="bg-white p-3 rounded-xl border border-blue-100 font-mono text-[16px] text-blue-900 font-bold space-y-1">
                <p>Finding Penalty = round(0.3 × CVSS², 1)</p>
                <p>Total Risk Points = Σ Finding Penalty (ไม่มีการจำกัดจำนวนสูงสุด)</p>
                <p>Raw Score = max(0, 100 − Total Risk Points)</p>
                <p>Final Score = min(Raw Score, Severity Ceiling)</p>
              </div>
              <p className="text-[16px] text-slate-500 leading-relaxed">
                คะแนนหักต่อรายการเพิ่มขึ้นแบบต่อเนื่องตามค่า CVSS (ยกกำลังสอง) ไม่ใช่ค่าคงที่ตายตัวต่อ Severity
                จึงไม่มีการกระโดดคะแนนกะทันหันเมื่อ CVSS ขยับข้าม Severity เพียงเล็กน้อย
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-red-100 border border-red-200">
                <span className="text-[13px] font-extrabold uppercase text-red-800">Critical</span>
                <p className="text-lg font-black text-red-900 my-1">-24.3 ถึง -30.0</p>
                <p className="text-[16px] text-red-700 font-medium">CVSS 9.0-10.0 · เพดานคะแนนสุดท้ายไม่เกิน 29</p>
              </div>
              <div className="p-4 rounded-2xl bg-orange-100 border border-orange-200">
                <span className="text-[13px] font-extrabold uppercase text-orange-800">High</span>
                <p className="text-lg font-black text-orange-900 my-1">-14.7 ถึง -23.8</p>
                <p className="text-[16px] text-orange-700 font-medium">CVSS 7.0-8.9 · เพดานคะแนนสุดท้ายไม่เกิน 49</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-100 border border-amber-200">
                <span className="text-[13px] font-extrabold uppercase text-amber-800">Medium</span>
                <p className="text-lg font-black text-amber-900 my-1">-4.8 ถึง -14.3</p>
                <p className="text-[16px] text-amber-700 font-medium">CVSS 4.0-6.9 · เพดานคะแนนสุดท้ายไม่เกิน 69</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-100 border border-blue-200">
                <span className="text-[13px] font-extrabold uppercase text-blue-800">Low</span>
                <p className="text-lg font-black text-blue-900 my-1">-0.1 ถึง -4.6</p>
                <p className="text-[16px] text-blue-700 font-medium">CVSS 0.1-3.9 · เพดานคะแนนสุดท้ายไม่เกิน 89</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-400 font-medium italic">
              * ไม่พบช่องโหว่ที่มีผลต่อคะแนนเลย → ไม่มีเพดาน มีสิทธิ์ได้คะแนนสูงสุด 100
            </p>
          </div>

          {/* Grade Table */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800">ตารางเกณฑ์การตัดเกรดความปลอดภัย (Grade Table)</h2>
            <p className="text-xs text-slate-500 -mt-2">
              เกรดตัดสินจากระดับความรุนแรงของช่องโหว่ที่ตรวจพบจริง ไม่ใช่แค่ดูช่วงคะแนนเพียงอย่างเดียว
            </p>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">เกรด</th>
                    <th className="p-3">ระดับ</th>
                    <th className="p-3">เงื่อนไขด้านช่องโหว่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr><td className="p-3 font-extrabold text-emerald-600">A</td><td className="p-3">ดีมาก</td><td className="p-3">ไม่พบ Critical, High หรือ Medium และการสแกนครบถ้วนทุกเอนจิน</td></tr>
                  <tr><td className="p-3 font-extrabold text-blue-600">B</td><td className="p-3">ดี</td><td className="p-3">ไม่พบ Critical หรือ High อาจพบ Low</td></tr>
                  <tr><td className="p-3 font-extrabold text-amber-600">C</td><td className="p-3">ปานกลาง</td><td className="p-3">ไม่พบ Critical อาจพบ Medium</td></tr>
                  <tr><td className="p-3 font-extrabold text-orange-600">D</td><td className="p-3">มีความเสี่ยงสูง</td><td className="p-3">อาจพบ High แต่ต้องไม่พบ Critical</td></tr>
                  <tr><td className="p-3 font-extrabold text-red-600">F</td><td className="p-3">มีความเสี่ยงร้ายแรง</td><td className="p-3">พบ Critical อย่างน้อย 1 รายการ หรือคะแนนอยู่ในช่วง 0-29</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Score Level Table — เกณฑ์ชั้นที่ 2 แยกจาก Grade */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800">ตารางระดับ Total Risk Score (ชั้นที่ 2)</h2>
            <p className="text-xs text-slate-500 -mt-2">
              เกณฑ์เสริมจาก Total Risk Points (ผลรวม CVSS Penalty แบบไม่มีเพดาน) เพื่อสะท้อน "ปริมาณ" ปัญหาที่พบทั้งหมด
              แยกจาก Grade ซึ่งดูแค่ Severity สูงสุดที่พบเพียงอย่างเดียว — เว็บ 2 แห่งอาจได้เกรดเดียวกัน แต่ Risk Score Level ต่างกันได้ถ้าจำนวนช่องโหว่ต่างกันมาก
            </p>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">Total Risk Score</th>
                    <th className="p-3">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr><td className="p-3 font-mono font-extrabold text-emerald-600">0 - 10</td><td className="p-3">ต่ำมาก (Very Low)</td></tr>
                  <tr><td className="p-3 font-mono font-extrabold text-blue-600">&gt;10 - 30</td><td className="p-3">ต่ำ (Low)</td></tr>
                  <tr><td className="p-3 font-mono font-extrabold text-amber-600">&gt;30 - 60</td><td className="p-3">ปานกลาง (Moderate)</td></tr>
                  <tr><td className="p-3 font-mono font-extrabold text-orange-600">&gt;60 - 100</td><td className="p-3">สูง (High)</td></tr>
                  <tr><td className="p-3 font-mono font-extrabold text-red-600">&gt;100</td><td className="p-3">สูงมาก (Very High)</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 2: 4-LAYER ASSESSMENT ==================== */}
      {activeTab === 'tools' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Nmap Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-800">1. Nmap - Network Layer Scan Criteria</h3>
              </div>
              <span className="text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-full">ISO/IEC 27001: A.8.9, A.8.20</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ปลอดภัย (Compliant)                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>เปิดเฉพาะพอร์ต HTTP (80) และ HTTPS (443)</li>
                  <li>พอร์ต SSH (22), RDP (3389) ปิด หรือเข้าได้ผ่าน VPN เท่านั้น</li>
                  <li>พอร์ต Database (3306 MySQL, 6379 Redis) ปิดการต่อภายนอก</li>
                  <li>ซอฟต์แวร์อัปเดตปัจจุบัน ไม่มี CVE ระดับ Critical/High</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" /> ไม่ปลอดภัย (Non-Compliant)                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>มีการเปิดพอร์ตอื่นที่ไม่เกี่ยวกับการให้บริการเว็บ</li>
                  <li>พอร์ต SSH / RDP เปิดโล่งสู่ Public Internet</li>
                  <li>พอร์ต DB หรือ Queue หลุดออกมาให้ภายนอกต่อตรงได้</li>
                  <li>เปิดบริการที่ไม่เข้ารหัส เช่น Telnet (23), FTP (21)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* OWASP ZAP Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">2. OWASP ZAP - Application Layer Criteria</h3>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full">ISO/IEC 27001: A.8.28, A.8.8</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ปลอดภัย (Compliant)                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>ไม่พบช่องโหว่ Injection, SQLi, XSS หรือ SSRF</li>
                  <li>มี Authorization Check ทุก Endpoint (ป้องกัน IDOR)</li>
                  <li>พบ Security Headers ครบถ้วน (CSP, HSTS, X-Frame-Options)</li>
                  <li>คุกกี้ตั้งค่า Secure, HttpOnly, SameSite ครบถ้วน</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" /> ไม่ปลอดภัย (Non-Compliant)                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>พบช่องโหว่ระดับ High/Critical (เช่น SQLi, XSS)</li>
                  <li>ผู้ใช้สิทธิ์ต่ำสามารถแอบเข้าถึงข้อมูล/API สิทธิ์สูงได้</li>
                  <li>ขาด Security Headers หลัก เปิดช่องทาง Clickjacking</li>
                  <li>พ่น Stack Trace หรือ เวอร์ชันระบบหลุดมาใน Error Log</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SSLyze Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-slate-800">3. SSLyze - Transport Layer Criteria</h3>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full">ISO/IEC 27001: A.8.24, A.8.8</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ปลอดภัย (Compliant)
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>เปิดใช้งานเฉพาะ TLS 1.2 หรือ TLS 1.3 เท่านั้น</li>
                  <li>ใช้ Cipher Suites แข็งแกร่ง (AES-GCM, ChaCha20-Poly1305) และรองรับ Perfect Forward Secrecy (ECDHE)</li>
                  <li>ใบรับรองยังไม่หมดอายุ ชื่อโดเมนตรงกับใบรับรอง ออกโดย CA ที่น่าเชื่อถือ</li>
                  <li>ไม่พบช่องโหว่ระดับโปรโตคอล เช่น Heartbleed, ROBOT, POODLE, CRIME</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" /> ไม่ปลอดภัย (Non-Compliant)
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>ยังรองรับโปรโตคอลเก่า เช่น SSLv2, SSLv3, TLS 1.0, TLS 1.1</li>
                  <li>รองรับ Cipher ที่อ่อนแอ เช่น RC4, 3DES, DES หรือ RSA Key ต่ำกว่า 2048 bits</li>
                  <li>ใบรับรองหมดอายุ ใช้ Self-Signed หรือโดเมนไม่ตรงกับใบรับรอง</li>
                  <li>พบช่องโหว่ระดับวิกฤต เช่น Heartbleed (CVE-2014-0160)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Nikto Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-bold text-slate-800">4. Nikto - Web Server Layer Criteria</h3>
              </div>
              <span className="text-xs bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-full">ISO/IEC 27001: A.8.9, A.8.20</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ปลอดภัย (Compliant)
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>อนุญาตเฉพาะ HTTP Methods ที่จำเป็น (GET, POST, OPTIONS) ปิด PUT/DELETE/TRACE</li>
                  <li>ไม่พบไฟล์ตกค้าง เช่น .bak, .env, /.git/, phpinfo.php</li>
                  <li>ซ่อน Server Banner และเลขเวอร์ชันแบบละเอียด</li>
                  <li>ใช้ Web Server เวอร์ชันอัปเดตล่าสุด ไม่พบ CVE ระดับ High/Critical</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" /> ไม่ปลอดภัย (Non-Compliant)
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>พบไฟล์ซอร์สโค้ดหรือไฟล์ตั้งค่าหลุดสู่ภายนอก</li>
                  <li>เปิดใช้งาน HTTP Methods อันตราย เช่น TRACE/TRACK, PUT, DELETE โดยไม่ตรวจสอบสิทธิ์</li>
                  <li>พบพาธผู้ดูแลระบบเปิดสู่ Public เช่น /phpmyadmin, /admin โดยไม่จำกัดสิทธิ์</li>
                  <li>ใช้ Web Server เวอร์ชันเก่าที่มีช่องโหว่ร้ายแรง (RCE, Memory Leak)</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 3: SECURE SDLC & PDPA ==================== */}
      {activeTab === 'sdlc' && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-800">การจัดประเภทข้อมูลและแนวทางปฏิบัติ Secure Coding</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                <span className="text-[13px] font-extrabold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Restricted (PII Data)</span>
                <h4 className="text-xs font-bold text-slate-800">ข้อมูลหน้าสมัครสมาชิก (ชื่อ, อีเมล, รหัสผ่าน)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ต้องได้รับการคุ้มครองตาม **PDPA มาตรา 26** และ **ISO/IEC 27001:2022 (Control A.8.11 Data Masking)** บังคับเข้ารหัสรหัสผ่านด้วย Argon2id หรือ Bcrypt                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                <span className="text-[13px] font-extrabold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Confidential Data</span>
                <h4 className="text-xs font-bold text-slate-800">ข้อมูล URL และ ผลลัพธ์การสแกน</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  อ้างอิงเกณฑ์ **NIST SP 800-53 Rev. 5** เนื่องจากระบุช่องโหว่เชิงลึก ห้ามเปิดเผยสาธารณะ และต้องทำ Object-Level Checking คุมสิทธิ์ผู้ใช้                </p>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">มาตรการป้องกันเชิงเทคนิคสำคัญ (Technical Controls)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <p className="font-bold text-blue-900 mb-1">SQL Injection Prevention</p>
                  <p className="text-slate-500">บังคับใช้ Prepared Statements / ORM ทุกจุด ห้ามต่อ String SQL โดยตรง และจำกัดสิทธิ์ DB User</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <p className="font-bold text-blue-900 mb-1">SSRF Protection</p>
                  <p className="text-slate-500">ทำ Strict Blacklisting บล็อก IP ภายใน (RFC 1918 เช่น 10.x, 192.168.x) ไม่ให้ส่งคำสั่งสแกนเซิร์ฟเวอร์ตัวเอง</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <p className="font-bold text-blue-900 mb-1">Rate Limiting & DoS</p>
                  <p className="text-slate-500">ติดตั้ง Rate Limiting บน API Gateway เพื่อจำกัดจำนวน Request ต่อ Session ป้องกัน Click Flooding ถล่มคิว</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}