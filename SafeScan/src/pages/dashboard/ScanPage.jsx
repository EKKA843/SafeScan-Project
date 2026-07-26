import React, { useState, useEffect } from 'react';
import { Search, Zap, Info, ShieldAlert, Loader2, CheckCircle2, Server, ShieldCheck, FileCheck2, Bug, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ScanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // 🎯 State สำหรับจัดการสเตตัสการสแกนแบบ Step-by-Step
  const [currentStep, setCurrentStep] = useState(0);

  // 📝 รายการสแกนทั้งหมดระบุอย่างละเอียด อ้างอิงตามเอกสาร Security Planning OWASP 2025[cite: 1]
  const scanSteps = [
    { 
      id: 0, 
      title: '1. สแกนโครงสร้างพอร์ตและบริการระบบ (Nmap Network Scanner)', 
      desc: 'สำรวจพอร์ตเครือข่ายที่เปิดสู่สาธารณะ และค้นหาพอร์ตบริหารจัดการ/ฐานข้อมูลที่สุ่มเสี่ยง',
      owasp: 'OWASP A02: Security Misconfiguration',
      subtasks: [
        'ส่งแพ็กเก็ต TCP SYN สแกนหาพอร์ตที่มีสถานะเป็น Open (Port 1-65535)',
        'ตรวจสอบประเภทและเลขเวอร์ชันของบริการ (Service Version Detection)',
        'เช็กพอร์ตบริหารจัดการและฐานข้อมูลสุ่มเสี่ยง (เช่น SSH 22, MySQL 3306, RDP 3389)'
      ]
    },
    { 
      id: 1, 
      title: '2. วิเคราะห์การเข้ารหัสและใบรับรองความปลอดภัย (SSLyze Inspection Engine)', 
      desc: 'ตรวจสอบมาตรฐานโปรโตคอลการเข้ารหัส TLS/SSL และความถูกต้องของใบรับรองอิเล็กทรอนิกส์',
      owasp: 'OWASP A04: Cryptographic Failures',
      subtasks: [
        'ตรวจสอบความน่าเชื่อถือ วันหมดอายุ และห่วงโซ่ใบรับรอง (SSL Certificate Trust Chain)',
        'วิเคราะห์การรองรับ Protocol ล้าสมัย (เช่น SSLv2, SSLv3, TLS 1.0, TLS 1.1)',
        'สแกนชุดอัลกอริทึมการเข้ารหัส (Cipher Suites) และตรวจหาช่องโหว่ Heartbleed / ROBOT'
      ]
    },
    { 
      id: 2, 
      title: '3. ตรวจสอบความครบถ้วนของ HTTP Security Headers (Header Verification)', 
      desc: 'ตรวจสอบ Headers สำคัญที่เซิร์ฟเวอร์ตอบกลับ เพื่อป้องกันการโจมตีทางเว็บเบื้องต้น',
      owasp: 'OWASP A05: Security Misconfiguration',
      subtasks: [
        'ตรวจสอบการบังคับใช้ HTTPS ผ่าน Strict-Transport-Security (HSTS)',
        'วิเคราะห์นโยบายควบคุมการรันสคริปต์ Content-Security-Policy (CSP)',
        'ตรวจเช็กการป้องกัน Clickjacking (X-Frame-Options) และ X-Content-Type-Options'
      ]
    },
    { 
      id: 3, 
      title: '4. สแกนช่องโหว่ระดับแอปพลิเคชันเชิงลึก (OWASP ZAP DAST Container)', 
      desc: 'ทดสอบจำลองการโจมตีขณะรันไทม์เพื่อค้นหาช่องโหว่ระดับโค้ดและ Business Logic',
      owasp: 'OWASP A01 / A03 / A05 / A07 / A10',
      subtasks: [
        'ตรวจหาช่องโหว่การแทรกคำสั่งอันตราย (SQL Injection, Cross-Site Scripting - XSS)',
        'สแกนหาข้อผิดพลาดของระบบยืนยันตัวตน และ Cookie Security Flags (HttpOnly, Secure)',
        'ตรวจเช็กการรั่วไหลของข้อมูลภายใน (Stack Trace / Verbose Error Messages)'
      ]
    },
    { 
      id: 4, 
      title: '5. ประมวลผล Scoring Algorithm และสรุปผลรายงาน', 
      desc: 'คำนวณคะแนนตาม 3 มิติ (Base Score + Category Penalty + Bonus Points) และตัดเกรด A-F',
      owasp: 'Finalizing Report Generation',
      subtasks: [
        'สรุปจำนวนและระดับความรุนแรงของช่องโหว่ (CVSS v3.1 Severity Score)',
        'คำนวณค่าปรับ Category Penalty ตามหมวดความเสี่ยงเชิงธุรกิจ',
        'บันทึกประวัติรายงานผลลงในฐานข้อมูล MySQL และจัดเตรียม UI Dashboard'
      ]
    }
  ];

  // ⏱️ ตัวจำลองการขยับสเต็ปตามช่วงเวลา
  useEffect(() => {
    let timer;
    if (isScanning) {
      timer = setInterval(() => {
        setCurrentStep((prevStep) => {
          if (prevStep < scanSteps.length - 1) {
            return prevStep + 1;
          }
          return prevStep;
        });
      }, 10000); // เปลี่ยนสเต็ปทุกๆ 10 วินาที
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(timer);
  }, [isScanning]);

  const handleStartScan = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return alert('กรุณากรอก URL ของเว็บไซต์ก่อนครับ');

    try {
      setIsScanning(true);
      setCurrentStep(0);

      // 1. นำส่ง URL ไปให้หลังบ้านสั่งเปิดโปรแกรมสแกน
      const response = await axios.post('http://localhost:5000/api/scan/start', {
        url: urlInput
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const scanId = response.data.scanId;

        // 2. สืบค้นสเตตัสวนเช็กกับ MySQL
        const checkStatusLoop = async () => {
          try {
            const statusRes = await axios.get(`http://localhost:5000/api/scan/status/${scanId}`);

            if (statusRes.data.status === 'completed') {
              setIsScanning(false);
              navigate(`/scan-result/${scanId}`);
            } else if (statusRes.data.status === 'failed') {
              setIsScanning(false);
              alert('❌ ระบบสแกนล้มเหลว หรือเป้าหมายปิดกั้นการสแกน กรุณาตรวจสอบผลการสแกนในประวัติ');
              navigate(`/scan-result/${scanId}`);
            } else {
              setTimeout(checkStatusLoop, 3000);
            }
          } catch (err) {
            console.error('Error checking status:', err);
            setTimeout(checkStatusLoop, 3000);
          }
        };

        setTimeout(checkStatusLoop, 3000);
      }

    } catch (error) {
      console.error('Scan Error:', error);
      if (error.response && error.response.status === 401) {
        alert('❌ สิทธิ์การตรวจสอบไม่ถูกต้อง กรุณาล็อกเอาท์แล้วเข้าสู่ระบบใหม่อีกครั้งครับ');
      } else {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบสแกน');
      }
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-6 font-sans text-slate-700">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight">ตรวจสอบความปลอดภัยเว็บไซต์</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
          กรอก URL เพื่อเริ่มการสแกนวิเคราะห์ช่องโหว่เชิงลึกตามมาตรฐาน OWASP Top 10 (2025)
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-[0_15px_40px_rgba(148,163,184,0.08)] p-8 mb-8">
        <div className="flex border-b border-slate-100 mb-8 justify-center gap-12 text-sm font-semibold">
          <button onClick={() => setActiveTab('url')} className={`pb-3 relative ${activeTab === 'url' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            กรอก URL
            {activeTab === 'url' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 rounded-full" />}
          </button>
          <button onClick={() => setActiveTab('qrcode')} className={`pb-3 relative ${activeTab === 'qrcode' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
            สแกน QR Code
          </button>
        </div>

        {activeTab === 'url' && (
          <form onSubmit={handleStartScan} className="space-y-5">
            <div className="w-full bg-slate-50/80 rounded-2xl border border-slate-100 p-4 flex items-center gap-3 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-inner">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isScanning}
                placeholder="https://example.com"
                className="w-full text-slate-700 placeholder-slate-400 text-sm font-medium focus:outline-none bg-transparent"
              />
            </div>

            <button 
              type="submit"
              disabled={isScanning}
              className={`w-full py-4 text-white font-bold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isScanning ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-900 hover:bg-blue-950 shadow-blue-900/10 active:scale-[0.99]'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังดำเนินการสแกนช่องโหว่ความปลอดภัย...
                </>
              ) : (
                <>
                  เริ่มสแกน
                  <Zap className="w-4 h-4 fill-white" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* 🚨 ส่วนแสดงการทำงานแบบ Step-by-Step พร้อมบอกรายละเอียดการสแกนย่อย */}
      {isScanning && (
        <div className="w-full max-w-2xl bg-white border border-blue-100 rounded-3xl p-6 mb-8 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping" />
              <div>
                <h3 className="text-base font-bold text-slate-800">ขั้นตอนการตรวจสอบความปลอดภัย</h3>
                <p className="text-xs text-slate-400">ระบบกำลังวิเคราะห์ข้อมูลแบบ Real-time</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Step {currentStep + 1} of {scanSteps.length}
            </span>
          </div>

          <div className="space-y-4">
            {scanSteps.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div 
                  key={step.id} 
                  className={`flex flex-col p-4 rounded-2xl transition-all ${
                    isCurrent 
                      ? 'bg-blue-50/90 border border-blue-200 shadow-sm' 
                      : isDone 
                      ? 'bg-slate-50/60 border border-transparent opacity-85' 
                      : 'opacity-40 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`text-xs font-bold ${isCurrent ? 'text-blue-950' : 'text-slate-800'}`}>
                          {step.title}
                        </p>
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md shrink-0">
                          {step.owasp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{step.desc}</p>
                    </div>
                  </div>

                  {/* 🔍 รายละเอียด Sub-tasks ย่อย เปิดแสดงเมื่ออยู่ในสเต็ปปัจจุบัน */}
                  {isCurrent && (
                    <div className="mt-3 ml-8 pt-3 border-t border-blue-100/80 space-y-1.5">
                      <p className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-blue-600" /> รายการที่กำลังวิเคราะห์เชิงลึก:
                      </p>
                      <ul className="space-y-1 pl-1">
                        {step.subtasks.map((sub, sIdx) => (
                          <li key={sIdx} className="text-[11px] text-blue-900 flex items-center gap-2 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
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

      {/* 📌 การ์ดแสดง Scope of Scan ครบทั้ง 4 ด้าน */}
      <div className="w-full max-w-2xl mb-6">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 px-1">
          ขอบเขตเครื่องมือในการสแกน (Scope of Scanning Engines)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm space-y-1">
            <Server className="w-4 h-4 text-purple-600 mb-1" />
            <h4 className="text-xs font-bold text-slate-800">1. Nmap Engine</h4>
            <p className="text-[10px] text-slate-400 font-medium">ตรวจพอร์ตและบริการระบบ (OWASP A02)</p>
          </div>
          <div className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm space-y-1">
            <ShieldCheck className="w-4 h-4 text-blue-600 mb-1" />
            <h4 className="text-xs font-bold text-slate-800">2. SSLyze Engine</h4>
            <p className="text-[10px] text-slate-400 font-medium">ตรวจ SSL/TLS & Ciphers (OWASP A04)</p>
          </div>
          <div className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm space-y-1">
            <FileCheck2 className="w-4 h-4 text-teal-600 mb-1" />
            <h4 className="text-xs font-bold text-slate-800">3. Fetch Headers</h4>
            <p className="text-[10px] text-slate-400 font-medium">ตรวจ Security Headers (OWASP A05)</p>
          </div>
          <div className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-sm space-y-1">
            <Bug className="w-4 h-4 text-amber-500 mb-1" />
            <h4 className="text-xs font-bold text-slate-800">4. OWASP ZAP</h4>
            <p className="text-[10px] text-slate-400 font-medium">สแกน Web App DAST (OWASP Top 10)</p>
          </div>
        </div>
      </div>

      {/* การ์ดคำแนะนำ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
        <div className="bg-blue-50/60 border border-blue-100/50 rounded-2xl p-5 flex gap-4 text-slate-700">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Info className="w-5 h-5" /></div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-950">คำแนะนำการใช้งาน</h4>
            <p className="text-xs text-slate-500 font-medium">กรุณากรอก URL ให้ถูกต้อง (เช่น https://example.com) ระบบจะประมวลผลผ่านหลังบ้านอัตโนมัติ</p>
          </div>
        </div>
        <div className="bg-blue-50/60 border border-blue-100/50 rounded-2xl p-5 flex gap-4 text-slate-700">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><ShieldAlert className="w-5 h-5" /></div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-950">มาตรฐานความปลอดภัย</h4>
            <p className="text-xs text-slate-500 font-medium">ผลประเมินถูกประมวลผลตามมาตรฐานสากล CVSS v3.1 และจัดเก็บอย่างปลอดภัย</p>
          </div>
        </div>
      </div>
    </div>
  );
}