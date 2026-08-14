import React, { useState } from 'react';
import { Globe, Loader2, ShieldCheck, ShieldAlert, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function ScanBar() {
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return alert('กรุณากรอก URL เว็บไซต์ที่ต้องการสแกน');

    try {
      setScanResult(null);
      setIsScanning(true);

      const response = await axios.post('http://localhost:5000/api/scan/public-scan', {
        url: urlInput
      }, {
        timeout: 180000
      });

      if (response.data.success) {
        setIsScanning(false);
        setScanResult(response.data); 
      }
    } catch (error) {
      console.error("Scan Error Log:", error);
      setIsScanning(false);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        alert('❌ การเชื่อมต่อใช้เวลานานเกินกำหนด (Timeout)');
      } else if (error.response && error.response.status === 404) {
        alert('❌ ไม่พบเส้นทางเชื่อมต่อระบบสแกนสาธารณะ (404 Not Found)');
      } else {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบตรวจสอบความปลอดภัย');
      }
    }
  };

  const isSafe = scanResult?.data?.summary?.grade === 'A' || scanResult?.data?.summary?.grade === 'B';

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4 text-sm">
      
      {/* Floating Input Box */}
      <form 
        onSubmit={handleSubmit}
        className="w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-blue-500/10 p-2.5 flex flex-col sm:flex-row items-center gap-2 border border-blue-100 focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-300"
      >
        <div className="flex items-center gap-3 pl-3.5 pr-2 py-1.5 flex-1 w-full">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isScanning}
            placeholder="กรอก URL เว็บไซต์ (เช่น example.com หรือ https://...)"
            className="w-full text-slate-800 placeholder-slate-400 text-sm md:text-base focus:outline-none bg-transparent font-medium"
          />
        </div>
        
        <button 
          type="submit"
          disabled={isScanning}
          className={`w-full sm:w-auto px-7 py-3.5 text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
            isScanning 
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 cursor-pointer active:scale-95'
          }`}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>กำลังวิเคราะห์...</span>
            </>
          ) : (
            <>
              <span>เริ่มตรวจสอบ</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Progress / Status banner */}
      {isScanning && (
        <div className="w-full bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-center gap-3 text-blue-900 font-semibold text-xs animate-pulse">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
          <div className="space-y-0.5">
            <p className="font-extrabold text-blue-950">กำลังสแกนความปลอดภัยเชิงลึกผ่าน CLI...</p>
            <p className="text-[16px] font-medium text-blue-700">กระบวนการนี้ใช้เวลาประมาณ 30-60 วินาที ระบบกำลังรวบรวมข้อมูล</p>
          </div>
        </div>
      )}

      {/* Scan Results Container */}
      {scanResult && (
        <div className={`w-full border rounded-2xl p-5 flex flex-col gap-4 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
          isSafe 
            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 shadow-emerald-500/5' 
            : 'bg-red-50/70 border-red-200/80 text-red-950 shadow-red-500/5'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-black text-base">
              {isSafe ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-slate-700">ผลการตรวจสอบโดเมน</h4>
                <p className={`text-base font-extrabold ${isSafe ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isSafe ? 'ปลอดภัย (Passed Security Checks)' : 'พบความเสี่ยง (Warning Detected)'}
                </p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isSafe ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {scanResult.data?.summary?.grade ? `Grade ${scanResult.data.summary.grade}` : (isSafe ? 'Safe' : 'Risk')}
            </span>
          </div>

          <div className="bg-white/80 rounded-xl p-3.5 text-xs space-y-2 border border-slate-200/60 font-medium text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">โดเมนที่ตรวจสอบ:</span>
              <strong className="text-blue-700 font-bold">{scanResult.targetUrl}</strong>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">พอร์ตเปิดบริการ:</span>
              <span className="text-slate-800 font-semibold">{scanResult.data?.details?.A02 || 'ปกติ'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ใบรับรอง SSL/TLS:</span>
              <span className="text-slate-800 font-semibold">{scanResult.data?.details?.A04 || 'ถูกต้อง'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[16px] text-slate-500 font-medium pt-1">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>เข้าสู่ระบบเพื่อเข้าถึงแดชบอร์ด ดู Log แบบสมบูรณ์ และบันทึกประวัติการสแกน</span>
          </div>
        </div>
      )}

    </div>
  );
}