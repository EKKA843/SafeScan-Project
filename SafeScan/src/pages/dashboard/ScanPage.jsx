import React, { useState, useEffect } from 'react';
import { Search, Zap, Info, ShieldAlert, Loader2, CheckCircle2, Server, ShieldCheck, FileCheck2, Bug, Terminal, Activity, Globe, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ScanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const scanSteps = [
    { 
      id: 0, 
      title: '1. สแกนพอร์ตและบริการระบบเครือข่าย (Nmap Network Layer)', 
      desc: 'สำรวจพอร์ตเครือข่ายที่เปิดสู่สาธารณะ ค้นหาพอร์ตบริหารจัดการและฐานข้อมูลที่สุ่มเสี่ยง',
      owasp: 'OWASP A02: Security Misconfiguration',
      subtasks: [
        'ส่งแพ็กเก็ต TCP SYN สแกนหาพอร์ตที่มีสถานะเปิด (Port 1-65535)',
        'ตรวจสอบประเภทและเลขเวอร์ชันของบริการ (Service Version Detection)',
        'เช็กพอร์ตสุ่มเสี่ยงสูง (SSH 22, Telnet 23, MySQL 3306, RDP 3389)'
      ]
    },
    { 
      id: 1, 
      title: '2. วิเคราะห์การเข้ารหัสและใบรับรอง (SSLyze Transport Layer)', 
      desc: 'ตรวจสอบมาตรฐานโปรโตคอล TLS/SSL และความถูกต้องของใบรับรองอิเล็กทรอนิกส์',
      owasp: 'OWASP A04: Cryptographic Failures',
      subtasks: [
        'ตรวจสอบความน่าเชื่อถือ วันหมดอายุ และห่วงโซ่ใบรับรอง (Certificate Chain)',
        'วิเคราะห์การรองรับ Protocol ล้าสมัย (SSLv2, SSLv3, TLS 1.0, TLS 1.1)',
        'สแกนชุด Cipher Suites และตรวจหาช่องโหว่ Heartbleed / POODLE'
      ]
    },
    { 
      id: 2, 
      title: '3. สแกนโครงสร้างเว็บเซิร์ฟเวอร์และไฟล์สำคัญ (Nikto Web Server Layer)', 
      desc: 'สแกนหาไฟล์สำรอง ไฟล์คอนฟิกเปิดเผย และการเปิดใช้ HTTP Methods ที่อันตราย',
      owasp: 'OWASP A02: Security Misconfiguration',
      subtasks: [
        'สแกนหาไฟล์ตกค้างและไฟล์สำรอง (.env, .bak, /admin, /config)',
        'ตรวจเช็กการเปิดใช้งาน HTTP Methods ที่สุ่มเสี่ยง (PUT, DELETE, TRACE)',
        'ตรวจสอบการรั่วไหลของ Server Version Banner บนเว็บเซิร์ฟเวอร์'
      ]
    },
    { 
      id: 3, 
      title: '4. ตรวจสอบความครบถ้วนของ HTTP Security Headers (Header Verification)', 
      desc: 'ตรวจสอบ Headers สำคัญที่เซิร์ฟเวอร์ตอบกลับ เพื่อป้องกันการโจมตีทางเว็บเบื้องต้น',
      owasp: 'OWASP A02: Security Misconfiguration',
      subtasks: [
        'ตรวจสอบการบังคับใช้ HTTPS ผ่าน Strict-Transport-Security (HSTS)',
        'วิเคราะห์นโยบายควบคุมการรันสคริปต์ Content-Security-Policy (CSP)',
        'ตรวจเช็กการป้องกัน Clickjacking (X-Frame-Options) และ X-Content-Type-Options'
      ]
    },
    { 
      id: 4, 
      title: '5. สแกนช่องโหว่แอปพลิเคชันเชิงลึก (OWASP ZAP DAST Container)', 
      desc: 'จำลองการโจมตีขณะรันไทม์เพื่อค้นหาช่องโหว่ระดับโค้ดและ Business Logic',
      owasp: 'OWASP A01 / A03 / A05 / A07 / A10',
      subtasks: [
        'ตรวจหาช่องโหว่การแทรกคำสั่งอันตราย (SQL Injection, XSS)',
        'สแกนหาข้อผิดพลาดของระบบยืนยันตัวตน และ Cookie Security Flags',
        'ตรวจเช็กการรั่วไหลของข้อมูลภายใน (Stack Trace / Verbose Error Messages)'
      ]
    },
    { 
      id: 5, 
      title: '6. ประมวลผล Scoring Engine และสรุปผลรายงาน', 
      desc: 'คำนวณคะแนนตาม 3 มิติ (Base Score + Category Penalty + Bonus Points) และตัดเกรด A-F',
      owasp: 'Finalizing Security Report',
      subtasks: [
        'สรุปจำนวนและระดับความรุนแรงของช่องโหว่ (CVSS v3.1 Severity Score)',
        'คำนวณคะแนนโบนัสและตรวจสอบเกณฑ์ Auto-fail (Broken Access Control)',
        'บันทึกผลสแกนลงฐานข้อมูล MySQL และจัดเตรียม UI Dashboard'
      ]
    }
  ];

  const [scanPercent, setScanPercent] = useState(0);
  const [versionInput, setVersionInput] = useState('');

  const handleStartScan = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return alert('กรุณากรอก URL ของเว็บไซต์ก่อน');

    try {
      setIsScanning(true);
      setCurrentStep(0);
      setScanPercent(10);

      const response = await axios.post('http://localhost:5000/api/scan/start', {
        url: urlInput,
        versionName: versionInput
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const scanId = response.data.scanId;

        const checkStatusLoop = async () => {
          try {
            const statusRes = await axios.get(`http://localhost:5000/api/scan/status/${scanId}`);

            if (statusRes.data.status === 'completed') {
              setCurrentStep(5);
              setScanPercent(100);
              setIsScanning(false);
              navigate(`/scan-result/${scanId}`);
            } else if (statusRes.data.status === 'failed') {
              setIsScanning(false);
              alert('❌ ระบบสแกนล้มเหลว หรือเป้าหมายปิดกั้นการสแกน กรุณาตรวจสอบประวัติ');
              navigate(`/scan-result/${scanId}`);
            } else {
              if (statusRes.data.currentStep !== undefined) {
                setCurrentStep(statusRes.data.currentStep);
              }
              if (statusRes.data.percent !== undefined) {
                setScanPercent(statusRes.data.percent);
              }
              setTimeout(checkStatusLoop, 1500);
            }
          } catch (err) {
            console.error('Error checking status:', err);
            setTimeout(checkStatusLoop, 1500);
          }
        };

        setTimeout(checkStatusLoop, 1500);
      }

    } catch (error) {
      console.error('Scan Error:', error);
      if (error.response && error.response.status === 401) {
        alert('❌ สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      } else {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบสแกน');
      }
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 font-sans text-slate-800 space-y-8">
      
      {/* Header Banner */}
      <div className="text-center space-y-2 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-extrabold shadow-xs mb-1">
          <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Multi-Layer Scanning Engine (OWASP 2025)</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          ตรวจสอบความปลอดภัยเว็บไซต์
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
          กรอก URL เว็บไซต์เพื่อเริ่มสแกนวิเคราะห์ช่องโหว่เชิงลึกผ่าน 4 เอนจินสแกนหลักตามมาตรฐานสากล
        </p>
      </div>

      {/* Main Form Input Box */}
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl shadow-blue-500/10 p-6 md:p-8">
        <div className="flex border-b border-slate-100 mb-6 justify-center gap-8 text-xs font-bold">
          <button 
            onClick={() => setActiveTab('url')} 
            className={`pb-3 relative transition-all ${activeTab === 'url' ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-600'}`}
          >
            กรอก URL
            {activeTab === 'url' && <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-blue-600 rounded-full" />}
          </button>
        </div>

        {activeTab === 'url' && (
          <form onSubmit={handleStartScan} className="space-y-4">
            <div className="w-full bg-slate-50/90 rounded-2xl border border-slate-200 p-4 flex items-center gap-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all shadow-inner">
              <Globe className="w-5 h-5 text-blue-600 shrink-0" />
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isScanning}
                placeholder="https://example.com"
                className="w-full text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none bg-transparent"
              />
            </div>

            <div className="w-full bg-slate-50/90 rounded-2xl border border-slate-200 p-3.5 flex items-center gap-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all shadow-inner">
              <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md shrink-0">VERSION</span>
              <input 
                type="text" 
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                disabled={isScanning}
                placeholder="ชื่อเวอร์ชัน (ระบุได้ เช่น v1.0 Baseline, v1.1 Fix XSS / ปล่อยว่างเพื่อใส่อัตโนมัติ)"
                className="w-full text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none bg-transparent"
              />
            </div>

            <button 
              type="submit"
              disabled={isScanning}
              className={`w-full py-4 text-white font-bold text-sm md:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                isScanning 
                  ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.99]'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังสแกนวิเคราะห์ความปลอดภัย...</span>
                </>
              ) : (
                <>
                  <span>เริ่มสแกนระบบ</span>
                  <Zap className="w-4 h-4 fill-white" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* 📡 Live Scanning Status Dashboard */}
      {isScanning && (
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-blue-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-500/10 space-y-6 animate-in fade-in duration-300">
          
          {/* Header Status Bar */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">กำลังดำเนินการสแกนสด</p>
                <h3 className="text-sm font-extrabold text-white truncate max-w-xs md:max-w-md">
                  {scanSteps[currentStep].title}
                </h3>
              </div>
            </div>
            <span className="text-xs font-black text-white bg-blue-600 px-3 py-1.5 rounded-xl shrink-0 shadow-xs">
              {currentStep + 1} / {scanSteps.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-700">ความคืบหน้ารวม</span>
              <span className="text-blue-700">{scanPercent > 0 ? scanPercent : Math.round(((currentStep + 1) / scanSteps.length) * 100)}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 rounded-full" 
                style={{ width: `${scanPercent > 0 ? scanPercent : Math.round(((currentStep + 1) / scanSteps.length) * 100)}%` }}
              />
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {scanSteps.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col p-4 rounded-2xl transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-blue-50/90 border border-blue-300 shadow-md ring-2 ring-blue-500/10' 
                      : isDone 
                      ? 'bg-slate-50/80 border border-slate-200/60 opacity-90' 
                      : 'opacity-40 bg-slate-50/30 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs font-bold ${isCurrent ? 'text-blue-950 font-black' : 'text-slate-800'}`}>
                          {step.title}
                        </p>
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full shrink-0">
                          {step.owasp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{step.desc}</p>
                    </div>
                  </div>

                  {/* Sub-tasks breakdown when active */}
                  {isCurrent && (
                    <div className="mt-3 ml-8 pt-3 border-t border-blue-200/60 space-y-1.5 animate-in fade-in duration-200">
                      <p className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-blue-600" /> รายการที่กำลังวิเคราะห์เชิงลึก:
                      </p>
                      <ul className="space-y-1 pl-1">
                        {step.subtasks.map((sub, sIdx) => (
                          <li key={sIdx} className="text-[11px] text-blue-900 flex items-center gap-2 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📌 Scope of Scanning Engines (4 Main Tools) */}
      <div className="w-full max-w-2xl mb-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-1">
          ขอบเขตเครื่องมือสแกนทั้ง 4 เลเยอร์ (4-Layer Scanning Engine Suite)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-sm space-y-1 hover:border-purple-300 transition-all">
            <Server className="w-5 h-5 text-purple-600 mb-1" />
            <h4 className="text-xs font-extrabold text-slate-900">1. Nmap Engine</h4>
            <p className="text-[10px] text-slate-500 font-medium">Network Layer: พอร์ต & บริการเครือข่าย</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-sm space-y-1 hover:border-blue-300 transition-all">
            <ShieldCheck className="w-5 h-5 text-blue-600 mb-1" />
            <h4 className="text-xs font-extrabold text-slate-900">2. SSLyze Engine</h4>
            <p className="text-[10px] text-slate-500 font-medium">Transport Layer: SSL/TLS & Ciphers</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-sm space-y-1 hover:border-cyan-300 transition-all">
            <Globe className="w-5 h-5 text-cyan-600 mb-1" />
            <h4 className="text-xs font-extrabold text-slate-900">3. Nikto Scanner</h4>
            <p className="text-[10px] text-slate-500 font-medium">Web Server Layer: เซิร์ฟเวอร์ & ไฟล์สำคัญ</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-4 rounded-2xl shadow-sm space-y-1 hover:border-amber-300 transition-all">
            <Bug className="w-5 h-5 text-amber-500 mb-1" />
            <h4 className="text-xs font-extrabold text-slate-900">4. OWASP ZAP</h4>
            <p className="text-[10px] text-slate-500 font-medium">App Layer: DAST & Business Logic</p>
          </div>

        </div>
      </div>

    </div>
  );
}