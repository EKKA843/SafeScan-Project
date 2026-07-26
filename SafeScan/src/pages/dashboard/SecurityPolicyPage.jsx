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
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A01</td><td className="p-3">Broken Access Control</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Critical</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A02</td><td className="p-3">Security Misconfiguration</td><td className="p-3">Nikto, Nmap</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[10px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A03</td><td className="p-3">Software Supply Chain Failures</td><td className="p-3">Nikto</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[10px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A04</td><td className="p-3">Cryptographic Failures</td><td className="p-3">SSLyze</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[10px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A05</td><td className="p-3">Injection (SQL, XSS, Command)</td><td className="p-3">ZAP, Nikto</td><td className="p-3"><span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Critical</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A06</td><td className="p-3">Insecure Design</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[10px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A07</td><td className="p-3">Authentication Failures</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[10px]">High</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A08</td><td className="p-3">Data Integrity Failures</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Medium</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A09</td><td className="p-3">Security Logging & Alerting Failures</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Low</span></td></tr>
                  <tr><td className="p-3 font-mono font-bold text-blue-600">A10</td><td className="p-3">Mishandling of Exceptional Conditions</td><td className="p-3">ZAP</td><td className="p-3"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Medium</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Severity & Cap Table */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-950">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold">2. นิยามระดับความรุนแรง และการหักคะแนน (CVSS v3.1 Basis)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                <span className="text-[10px] font-extrabold uppercase text-rose-700">Critical</span>
                <p className="text-lg font-black text-rose-800 my-1">-30 คะแนน/ตัว</p>
                <p className="text-[11px] text-rose-600 font-medium">CVSS 9.0-10.0 (Cap 3 ตัว = max -90)</p>
              </div>
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                <span className="text-[10px] font-extrabold uppercase text-orange-700">High</span>
                <p className="text-lg font-black text-orange-800 my-1">-15 คะแนน/ตัว</p>
                <p className="text-[11px] text-orange-600 font-medium">CVSS 7.0-8.9 (Cap 4 ตัว = max -60)</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] font-extrabold uppercase text-amber-700">Medium</span>
                <p className="text-lg font-black text-amber-800 my-1">-7 คะแนน/ตัว</p>
                <p className="text-[11px] text-amber-600 font-medium">CVSS 4.0-6.9 (Cap 5 ตัว = max -35)</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <span className="text-[10px] font-extrabold uppercase text-blue-700">Low</span>
                <p className="text-lg font-black text-blue-800 my-1">-3 คะแนน/ตัว</p>
                <p className="text-[11px] text-blue-600 font-medium">CVSS 0.1-3.9 (Cap 5 ตัว = max -15)</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-600">Info</span>
                <p className="text-lg font-black text-slate-800 my-1">0 คะแนน</p>
                <p className="text-[11px] text-slate-500 font-medium">CVSS 0.0 (ข้อสังเกตทั่วไป)</p>
              </div>
            </div>
          </div>

          {/* Grade Table */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800">ตารางเกณฑ์การตัดเกรดความปลอดภัย (Grade Table)</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-3">ช่วงคะแนน</th>
                    <th className="p-3">เกรด</th>
                    <th className="p-3">ความหมายและสภาวะระบบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr><td className="p-3 text-emerald-600 font-bold">90 - 100</td><td className="p-3 font-extrabold">A</td><td className="p-3">ปลอดภัย - ผ่านมาตรฐาน OWASP 2025 และ ISO 27001</td></tr>
                  <tr><td className="p-3 text-blue-600 font-bold">70 - 89</td><td className="p-3 font-extrabold">B</td><td className="p-3">พอใช้ได้ - มีจุดเล็กน้อยที่ควรแก้ไข[cite: 2]</td></tr>
                  <tr><td className="p-3 text-amber-600 font-bold">50 - 69</td><td className="p-3 font-extrabold">C</td><td className="p-3">ควรแก้ไข - มีความเสี่ยงที่ชัดเจน[cite: 2]</td></tr>
                  <tr><td className="p-3 text-orange-600 font-bold">30 - 49</td><td className="p-3 font-extrabold">D</td><td className="p-3">เสี่ยงสูง – ต้องเร่งแก้ไขโดยด่วน[cite: 2]</td></tr>
                  <tr><td className="p-3 text-rose-600 font-bold">0 - 29</td><td className="p-3 font-extrabold">F</td><td className="p-3">อันตราย - ห้ามใช้งานใน Production[cite: 2]</td></tr>
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
              <span className="text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-full">ISO/IEC 27001: A.8.9, A.8.20[cite: 2]</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ปลอดภัย (Compliant)[cite: 2]
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>เปิดเฉพาะพอร์ต HTTP (80) และ HTTPS (443)[cite: 2]</li>
                  <li>พอร์ต SSH (22), RDP (3389) ปิด หรือเข้าได้ผ่าน VPN เท่านั้น[cite: 2]</li>
                  <li>พอร์ต Database (3306 MySQL, 6379 Redis) ปิดการต่อภายนอก[cite: 2]</li>
                  <li>ซอฟต์แวร์อัปเดตปัจจุบัน ไม่มี CVE ระดับ Critical/High[cite: 2]</li>
                </ul>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> ไม่ปลอดภัย (Non-Compliant)[cite: 2]
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>มีการเปิดพอร์ตอื่นที่ไม่เกี่ยวกับการให้บริการเว็บ[cite: 2]</li>
                  <li>พอร์ต SSH / RDP เปิดโล่งสู่ Public Internet[cite: 2]</li>
                  <li>พอร์ต DB หรือ Queue หลุดออกมาให้ภายนอกต่อตรงได้[cite: 2]</li>
                  <li>เปิดบริการที่ไม่เข้ารหัส เช่น Telnet (23), FTP (21)[cite: 2]</li>
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
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full">ISO/IEC 27001: A.8.28, A.8.8[cite: 2]</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ปลอดภัย (Compliant)[cite: 2]
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>ไม่พบช่องโหว่ Injection, SQLi, XSS หรือ SSRF[cite: 2]</li>
                  <li>มี Authorization Check ทุก Endpoint (ป้องกัน IDOR)[cite: 2]</li>
                  <li>พบ Security Headers ครบถ้วน (CSP, HSTS, X-Frame-Options)[cite: 2]</li>
                  <li>คุกกี้ตั้งค่า Secure, HttpOnly, SameSite ครบถ้วน[cite: 2]</li>
                </ul>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" /> ไม่ปลอดภัย (Non-Compliant)[cite: 2]
                </h4>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                  <li>พบช่องโหว่ระดับ High/Critical (เช่น SQLi, XSS)[cite: 2]</li>
                  <li>ผู้ใช้สิทธิ์ต่ำสามารถแอบเข้าถึงข้อมูล/API สิทธิ์สูงได้[cite: 2]</li>
                  <li>ขาด Security Headers หลัก เปิดช่องทาง Clickjacking[cite: 2]</li>
                  <li>พ่น Stack Trace หรือ เวอร์ชันระบบหลุดมาใน Error Log[cite: 2]</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SSLyze & Nikto Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SSLyze */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-500" /> SSLyze (Transport Layer)[cite: 2]
              </h4>
              <p className="text-xs text-slate-500">รองรับเฉพาะ TLS 1.2 / TLS 1.3, ใช้ Strong Ciphers (AES-GCM, ECDHE) และ ใบรับรอง Valid ไม่หมดอายุ[cite: 2]</p>
              <div className="text-[11px] p-2.5 rounded-xl bg-slate-50 border text-slate-600 font-mono">
                Violation: รองรับ SSLv2/v3, TLS 1.0, 1.1, ใช้ RC4/3DES หรือพบ Heartbleed[cite: 2]
              </div>
            </div>

            {/* Nikto */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-teal-500" /> Nikto (Web Server Layer)[cite: 2]
              </h4>
              <p className="text-xs text-slate-500">ไม่พบไฟล์สำรอง (.bak, .env), อนุญาตเฉพาะ HTTP Methods ที่จำเป็น (GET, POST), ซ่อน Server Banner[cite: 2]</p>
              <div className="text-[11px] p-2.5 rounded-xl bg-slate-50 border text-slate-600 font-mono">
                Violation: เปิด PUT/DELETE, เปิดหน้า /phpmyadmin สู่ Public, Server Outdated[cite: 2]
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
                <span className="text-[10px] font-extrabold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Restricted (PII Data)[cite: 2]</span>
                <h4 className="text-xs font-bold text-slate-800">ข้อมูลหน้าสมัครสมาชิก (ชื่อ, อีเมล, รหัสผ่าน)[cite: 2]</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ต้องได้รับการคุ้มครองตาม **PDPA มาตรา 26** และ **ISO/IEC 27001:2022 (Control A.8.11 Data Masking)** บังคับเข้ารหัสรหัสผ่านด้วย Argon2id หรือ Bcrypt[cite: 2]
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Confidential Data[cite: 2]</span>
                <h4 className="text-xs font-bold text-slate-800">ข้อมูล URL และ ผลลัพธ์การสแกน[cite: 2]</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  อ้างอิงเกณฑ์ **NIST SP 800-53 Rev. 5** เนื่องจากระบุช่องโหว่เชิงลึก ห้ามเปิดเผยสาธารณะ และต้องทำ Object-Level Checking คุมสิทธิ์ผู้ใช้[cite: 2]
                </p>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">มาตรการป้องกันเชิงเทคนิคสำคัญ (Technical Controls)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <p className="font-bold text-blue-900 mb-1">SQL Injection Prevention[cite: 2]</p>
                  <p className="text-slate-500">บังคับใช้ Prepared Statements / ORM ทุกจุด ห้ามต่อ String SQL โดยตรง และจำกัดสิทธิ์ DB User[cite: 2]</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <p className="font-bold text-blue-900 mb-1">SSRF Protection[cite: 2]</p>
                  <p className="text-slate-500">ทำ Strict Blacklisting บล็อก IP ภายใน (RFC 1918 เช่น 10.x, 192.168.x) ไม่ให้ส่งคำสั่งสแกนเซิร์ฟเวอร์ตัวเอง[cite: 2]</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <p className="font-bold text-blue-900 mb-1">Rate Limiting & DoS[cite: 2]</p>
                  <p className="text-slate-500">ติดตั้ง Rate Limiting บน API Gateway เพื่อจำกัดจำนวน Request ต่อ Session ป้องกัน Click Flooding ถล่มคิว[cite: 2]</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}