import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/layout/Navbar';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        alert('เข้าสู่ระบบสำเร็จ');
        navigate('/scan');
      }

    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้ในขณะนี้');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative overflow-hidden flex flex-col">
      <Navbar />

      {/* Ambient background glow effects */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/15 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-[110px] pointer-events-none z-0" />

      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-slate-200/80 shadow-2xl shadow-blue-500/10 flex flex-col items-center">
          
          <div className="flex flex-col items-center text-center gap-3 w-full mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-1">
              <Shield className="w-6 h-6 fill-white/20 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl font-black text-slate-900">ยินดีต้อนรับกลับมา</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              เข้าสู่ระบบแดชบอร์ดความปลอดภัย SafeScan
            </p>

            {errorMsg && (
              <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">อีเมล (Email)</label>
              <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex items-center gap-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-slate-800 placeholder-slate-400 text-sm focus:outline-none bg-transparent font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">รหัสผ่าน (Password)</label>
              <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex items-center gap-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-slate-800 placeholder-slate-400 text-sm focus:outline-none bg-transparent font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                จดจำฉัน
              </label>
              <a href="#forgot" className="text-blue-600 font-bold hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="w-full flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500">
              ยังไม่มีบัญชีใช้งาน?{' '}
              <Link to="/register" className="text-blue-600 font-extrabold hover:underline">
                สมัครสมาชิกที่นี่
              </Link>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}