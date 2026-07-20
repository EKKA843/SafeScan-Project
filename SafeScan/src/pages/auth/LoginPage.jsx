import React, { useState } from 'react';
import { Shield, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 👈 ดึงมารีไดเรกต์ย้ายหน้า
import axios from 'axios'; // 👈 อิมพอร์ต Axios มาใช้ยิงหาหลังบ้าน
import Navbar from '../../components/layout/Navbar';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // เก็บข้อความแจ้งเตือนความผิดพลาด

  // 🎯 ฟังก์ชันจัดการล็อกอินเมื่อกดปุ่ม เข้าสู่ระบบ
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(''); // รีเซ็ตข้อความแจ้งเตือน

    try {
      // 🚀 ยิง Axios POST นำส่งข้อมูลไปตรวจสอบที่หลังบ้าน พอร์ต 5000
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: password
      });

      if (response.data.success) {
        // 💾 บันทึก JWT Token และข้อมูลโปรไฟล์ผู้ใช้ลงในความจำเบราว์เซอร์
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        alert('เข้าสู่ระบบสำเร็จ');
        
        // 🔄 สั่งเด้งข้ามมิติมาที่หน้าตรวจสอบเว็บไซต์ทันที
        navigate('/scan');
      }

    } catch (err) {
      // ดักจับ Error กรณีรหัสผ่านไม่ตรง หรือไม่พบอีเมลใน MySQL
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้ในขณะนี้');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased relative overflow-hidden flex flex-col">
      <Navbar />

      {/* 🔵 ลูกเล่นวงกลมสีจาง (Glow Blur) */}
      <div className="absolute bottom-[-10%] left-[-10%] w-200 h-200 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-[10%] right-[-10%] w-500 h-500 bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-120 bg-white rounded-3xl p-10 border border-slate-50 shadow-[0_20px_50px_rgba(148,163,184,0.15)] flex flex-col items-center">
          
          <div className="flex flex-col items-center text-center gap-3 w-full mb-8">
            <div className="flex items-center gap-2 text-blue-900 font-extrabold text-2xl">
              <Shield className="w-7 h-7 text-blue-600 fill-blue-600/10" />
              <span className="tracking-tight text-slate-900">Safe<span className="text-blue-600">Scan</span></span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-2">ยินดีต้อนรับกลับมา</h2>
            <p className="text-sm text-slate-500 max-w-[320px]">
              เข้าสู่แดชบอร์ดความปลอดภัยเพื่อเฝ้าระวังภัยคุกคาม
            </p>

            {/* ⚠️ กล่องแดงโชว์ Error แจ้งเตือนถ้ารหัสผ่านผิดหรือไม่มีผู้ใช้งานในระบบ */}
            {errorMsg && (
              <div className="w-full mt-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">อีเมล</label>
              <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3.5 flex items-center gap-3 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <Mail className="w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gmail@com.com"
                  className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">รหัสผ่าน</label>
              <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3.5 flex items-center gap-3 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <Lock className="w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-500 cursor-pointer"
                />
                จดจำฉัน
              </label>
              <a href="#forgot" className="text-blue-600 font-semibold hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-900/10 transition-all active:scale-[0.99] mt-2"
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <div className="w-full flex items-center justify-center gap-3 mt-8">
            <div className="h-0.5 bg-slate-100 flex-1" />
            <span className="text-xs font-semibold text-slate-400 bg-white px-2 tracking-wider uppercase">
              LOG IN
            </span>
            <div className="h-0.5 bg-slate-100 flex-1" />
          </div>

        </div>
      </div>
    </div>
  );
}