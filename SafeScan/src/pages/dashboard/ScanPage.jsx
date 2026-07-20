import React, { useState } from 'react';
import { Search, Zap, Info, ShieldAlert, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 🎯 1. ดึง useNavigate เข้ามาจัดการเปลี่ยนหน้า
import axios from 'axios';

export default function ScanPage() {
  const navigate = useNavigate(); // 🎯 2. เรียกใช้งานตัวแปรนำทาง
  const [activeTab, setActiveTab] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false); 
  const [scanStatusMessage, setScanStatusMessage] = useState('');

  const handleStartScan = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return alert('กรุณากรอก URL ของเว็บไซต์ก่อนครับ');

    try {
      setIsScanning(true);
      setScanStatusMessage('กำลังส่งข้อมูลลิงก์ไปที่ระบบตรวจสอบ...');

      // 1. 🚀 นำส่ง URL ไปให้หลังบ้านสั่งเปิดโปรแกรมสแกน (เพิ่ม Headers ยืนยันสิทธิ์คนล็อกอิน)
      const response = await axios.post('http://localhost:5000/api/scan/start', {
        url: urlInput
      }, {
        headers: {
          // 🎯 ดึงเอา Token ของคนที่ล็อกอินเข้ามาแนบสายส่งข้ามท่อไปด้วยเพื่อเคลียร์บั๊ก 401
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const scanId = response.data.scanId; 
        setScanStatusMessage('เซิร์ฟเวอร์กำลังรัน Nmap, SSLyze และวิเคราะห์ระบบ... ระบบจะอัปเดตสถานะอัตโนมัติ');

        // 2. ⏳ สืบค้นสเตตัส วิ่งไปเช็กกับ MySQL ทุกๆ 3 วินาที
        const checkStatusLoop = async () => {
          try {
            const statusRes = await axios.get(`http://localhost:5000/api/scan/status/${scanId}`);
            console.log("สเตตัสปัจจุบันจากหลังบ้าน:", statusRes.data.status);

            if (statusRes.data.status === 'completed') {
              // 🎉 เป้าหมายสำเร็จ! หลังบ้านคำนวณคะแนนและลงตารางเรียบร้อย
              setIsScanning(false);        
              setScanStatusMessage('');
              
              // 🚀 3. เด้งหน้าจอข้ามเฟรมไปที่รายงาน Dashboard แยกตามซอฟต์แวร์ทันทีตัวนาย!
              navigate(`/scan-result/${scanId}`);
            } else if (statusRes.data.status === 'failed') {
              setIsScanning(false);
              alert('❌ ระบบสแกนขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง');
            } else {
              // ถ้าสถานะยังเป็น 'scanning' อยู่ ให้รออีก 3 วินาทีแล้วเรียกตัวเองขึ้นมาตรวจใหม่
              setTimeout(checkStatusLoop, 3000);
            }
          } catch (err) {
            console.error('Error checking status:', err);
            setTimeout(checkStatusLoop, 3000);
          }
        };

        // สั่งเริ่มเดินลูปหลังจากยิงคิวสำเร็จ
        setTimeout(checkStatusLoop, 3000);
      }

    } catch (error) {
      console.error('Scan Error:', error);
      if (error.response && error.response.status === 401) {
        alert('❌ สิทธิ์การตรวจสอบไม่ถูกต้อง กรุณาล็อกเอาท์แล้วเข้าสู่ระบบใหม่อีกครั้งครับตัวนาย');
      } else {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบสแกน');
      }
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-6">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight">ตรวจสอบเว็บไซต์</h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto font-medium">
          กรอก URL เพื่อเริ่มการตรวจสอบความปลอดภัยช่องโหว่ระบบ
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
              className={`w-full py-4.5 text-white font-bold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isScanning ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-900 hover:bg-blue-950 shadow-blue-900/10 active:scale-[0.99]'
              }`}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังตรวจสอบความปลอดภัย...
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

      {isScanning && (
        <div className="w-full max-w-2xl bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 text-amber-800 mb-6 animate-pulse">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold leading-relaxed">{scanStatusMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
        <div className="bg-blue-50/60 border border-blue-100/50 rounded-2xl p-5 flex gap-4 text-slate-700">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Info className="w-5 h-5" /></div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-950">คำแนะนำการใช้งาน</h4>
            <p className="text-xs text-slate-500 font-medium">กรุณากรอก URL ให้ถูกต้อง (เช่น https://example.com) ระบบจะใช้ซอฟต์แวร์หลังบ้านทำการตรวจเช็ก</p>
          </div>
        </div>
        <div className="bg-blue-50/60 border border-blue-100/50 rounded-2xl p-5 flex gap-4 text-slate-700">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><ShieldAlert className="w-5 h-5" /></div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-950">ความปลอดภัยมาตรฐานสากล</h4>
            <p className="text-xs text-slate-500 font-medium">ข้อมูลช่องโหว่ทั้งหมดจะถูกจัดเก็บเข้าตาราง MySQL ส่วนบุคคลอย่างปลอดภัย</p>
          </div>
        </div>
      </div>
    </div>
  );
}