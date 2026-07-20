import React, { useState } from 'react';
import { Globe, Loader2, ShieldCheck, ShieldAlert, Info } from 'lucide-react';
import axios from 'axios';

export default function ScanBar() {
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return alert('กรุณากรอก URL ก่อนครับนาย!');

    try {
      setScanResult(null);
      setIsScanning(true);

      // 🚀 ยิงตรงเข้าท่อตรวจสอบความปลอดภัยสาธารณะ
      // 🎯 หมายเหตุ: เช็กที่ไฟล์ src/routes/scanRoutes.js หรือ server.js ของนายด้วยนะ
      // ว่าใช้พาร์ท 'http://localhost:5000/api/scan/public-scan' หรือ 'http://localhost:5000/public-scan'
      const response = await axios.post('http://localhost:5000/api/scan/public-scan', {
        url: urlInput
      }, {
        timeout: 180000 // ยืดเวลารอ 3 นาที
      });

      if (response.data.success) {
        setIsScanning(false);
        setScanResult(response.data); 
      }
    } catch (error) {
      console.error("Scan Error Log:", error);
      setIsScanning(false);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        alert('❌ หน้าบ้านรอนานเกินไป (Timeout) แต่หลังบ้านอาจจะยังรันสแกนอยู่ครับตัวนาย');
      } else if (error.response && error.response.status === 404) {
        // 💡 ดักแอร์ดนตรีบอกทางกรณีหา Endpoint ไม่เจอ จะได้แก้ถูกจุด
        alert('❌ เกิดข้อผิดพลาด 404: หาเส้นทางสแกนสาธารณะไม่พบ กรุณาเช็กการผูกท่อ router.post("/public-scan") ที่หลังบ้านครับ');
      } else {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบตรวจสอบสาธารณะ');
      }
    }
  };

  const isSafe = scanResult?.data?.summary?.grade === 'A' || scanResult?.data?.summary?.grade === 'B';

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4 font-sans text-sm">
      
      <form 
        onSubmit={handleSubmit}
        className="w-full bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-2 flex items-center gap-2 border border-slate-100"
      >
        <div className="flex items-center gap-3 pl-4 flex-1">
          <Globe className="w-5 h-5 text-slate-400 shrink-0" />
          <input 
            type="text" 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isScanning}
            placeholder="กรอก URL ของเว็บไซต์ (เช่น google.com)"
            className="w-full text-slate-700 placeholder-slate-400 text-base focus:outline-none bg-transparent font-medium"
          />
        </div>
        
        <button 
          type="submit"
          disabled={isScanning}
          className={`px-8 py-4 text-white font-bold text-base rounded-xl transition-all flex items-center gap-2 shadow-md ${
            isScanning 
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-blue-900 hover:bg-blue-950 shadow-blue-900/10 cursor-pointer active:scale-[0.98]'
          }`}
        >
          {isScanning && <Loader2 className="w-5 h-5 animate-spin" />}
          {isScanning ? 'กำลังตรวจสอบด่วน...' : 'เริ่มตรวจสอบ'}
        </button>
      </form>

      {/* ⏳ สถานะตอนรอหลังบ้านรันคำสั่ง CLI */}
      {isScanning && (
        <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2.5 text-amber-800 animate-pulse font-semibold text-xs">
          <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
          <p>ระบบกำลังสแกนสดผ่าน CLI (อาจใช้เวลาประมาณ 30-60 วินาที)...</p>
        </div>
      )}

      {/* 🎉 ผลลัพธ์ที่ดึงออกมาแสดงสั้นๆ บนหน้า Landing */}
      {scanResult && (
        <div className={`w-full border rounded-2xl p-5 flex flex-col gap-3 shadow-sm ${
          isSafe ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950' : 'bg-rose-50/60 border-rose-100 text-rose-950'
        }`}>
          <div className="flex items-center gap-2 font-extrabold text-base">
            {isSafe ? <ShieldCheck className="w-6 h-6 text-emerald-600" /> : <ShieldAlert className="w-6 h-6 text-rose-600" />}
            <h4>ผลการตรวจสอบ: เว็บไซต์นี้ <span className={isSafe ? 'text-emerald-600' : 'text-rose-600'}>{isSafe ? 'ปลอดภัย' : 'มีความเสี่ยง ไม่ปลอดภัย'}</span></h4>
          </div>

          <div className="text-xs space-y-1.5 font-medium text-slate-600">
            <p>• โดเมนที่ตรวจสอบ: <strong className="text-slate-800">{scanResult.targetUrl}</strong></p>
            <p>• ระบบตรวจสอบพอร์ต: <span className="text-slate-800">{scanResult.data?.details?.A02}</span></p>
            <p>• ระบบตรวจสอบใบรับรอง SSL/TLS: <span className="text-slate-800">{scanResult.data?.details?.A04}</span></p>
          </div>

          <div className="border-t border-slate-200/50 pt-2.5 mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Info className="w-3.5 h-3.5" />
            <span>หากต้องการดูบันทึก Log ดิบ และสูตรคะแนนประเมิน OWASP อย่างละเอียด กรุณาเข้าสู่ระบบก่อนครับนาย</span>
          </div>
        </div>
      )}

    </div>
  );
}