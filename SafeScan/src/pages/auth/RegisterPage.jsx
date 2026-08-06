import React, { useState } from 'react';
import { Shield, User, Building, Mail, Lock, Info, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/layout/Navbar';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        fullName: formData.fullName,
        company: formData.company,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        alert('สมัครสมาชิกสำเร็จ');
        navigate('/login');
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

      {/* Ambient background glow */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/15 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-[110px] pointer-events-none z-0" />
      
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-slate-200/80 shadow-2xl shadow-blue-500/10 flex flex-col items-center">
          
          <div className="flex flex-col items-center text-center gap-2 w-full mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-1">
              <Shield className="w-6 h-6 fill-white/20 stroke-[2.5]" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900">สร้างบัญชีผู้ใช้ใหม่</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              ลงทะเบียนเพื่อใช้งานระบบสแกนความปลอดภัยเว็บไซต์
            </p>
            
            {errorMsg && (
              <div className="w-full mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold text-center animate-in fade-in duration-200">
                {errorMsg}
              </div>
            )}
          </div>

          <form onSubmit={handleRegister} className="w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อ-นามสกุล</label>
                <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="ชื่อ นามสกุล" className="w-full text-slate-800 placeholder-slate-400 text-xs md:text-sm focus:outline-none bg-transparent font-medium" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อบริษัท / องค์กร</label>
                <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="บริษัทของคุณ (ถ้ามี)" className="w-full text-slate-800 placeholder-slate-400 text-xs md:text-sm focus:outline-none bg-transparent font-medium" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">อีเมล (Email)</label>
              <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" className="w-full text-slate-800 placeholder-slate-400 text-xs md:text-sm focus:outline-none bg-transparent font-medium" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">รหัสผ่าน</label>
                <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full text-slate-800 placeholder-slate-400 text-xs md:text-sm focus:outline-none bg-transparent font-medium" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ยืนยันรหัสผ่าน</label>
                <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full text-slate-800 placeholder-slate-400 text-xs md:text-sm focus:outline-none bg-transparent font-medium" required />
                </div>
              </div>
            </div>

            <div className="w-full bg-blue-50/80 text-xs text-blue-900 rounded-xl p-3.5 flex items-start gap-2.5 border border-blue-200/60 leading-relaxed font-medium">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>เมื่อลงทะเบียนถือว่าตกลงยอมรับ <a href="#terms" className="underline font-bold text-blue-700 hover:text-blue-900">เงื่อนไขการใช้งาน</a> และ <a href="#privacy" className="underline font-bold text-blue-700 hover:text-blue-900">นโยบายความเป็นส่วนตัว</a></p>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>สร้างบัญชีใช้งาน</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="w-full flex items-center justify-center gap-3 mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500">
              มีบัญชีใช้งานอยู่แล้ว?{' '}
              <Link to="/login" className="text-blue-600 font-extrabold hover:underline">
                เข้าสู่ระบบที่นี่
              </Link>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}