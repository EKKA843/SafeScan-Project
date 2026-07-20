import React, { useState, useEffect } from 'react';
import { User, Mail, Key, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ fullName: 'User', email: '' });
  
  // State สำหรับฟอร์มเปลี่ยนรหัสผ่าน
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ดึงข้อมูลผู้ใช้ที่เซฟไว้ตอนล็อกอินมาแสดงผล
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // แมตช์ชื่อตัวแปรให้ตรงตามโครงสร้างที่หลังบ้านพ่นมา (เช่น name หรือ fullName)
        setProfile({
          fullName: parsed.name || parsed.fullName || parsed.username || 'Beam',
          email: parsed.email || 'beam@sut.ac.th'
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // ฟังก์ชันจัดการอัปเดตรหัสผ่านใหม่
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert('รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกันครับนาย!');
    if (newPassword.length < 6) return alert('เพื่อความปลอดภัย รหัสผ่านใหม่ควรยาว 6 ตัวอักษรขึ้นไปครับ');

    try {
      setSubmitting(true);
      const response = await axios.post('http://localhost:5000/api/scan/change-password', 
        { oldPassword, newPassword },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.data.success) {
        alert('เปลี่ยนรหัสผ่านสำเร็จ! ระบบจะทำการล็อกเอาท์เพื่อให้ล็อกอินด้วยรหัสผ่านใหม่');
        handleLogout();
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    } finally {
      setSubmitting(false);
    }
  };

  // 🚪 ฟังก์ชันสลายสิทธิ์ ออกจากมิติระบบ
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('ออกจากระบบสำเร็จแล้ว');
    navigate('/login');
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 font-sans text-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-blue-950 flex items-center gap-2">
          ข้อมูลส่วนตัว <User className="w-7 h-7 text-blue-600" />
        </h1>
        <p className="text-slate-500 font-medium mt-1">จัดการข้อมูลระเบียบบัญชีผู้ใช้งานและอัปเดตสิทธิ์ความปลอดภัยส่วนบุคคล</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* 👤 การ์ดฝั่งซ้าย: โชว์โปรไฟล์ผู้ใช้ปัจจุบัน */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 text-center shadow-[0_15px_40px_rgba(148,163,184,0.03)]">
          <div className="w-20 h-20 bg-blue-950 text-white font-black text-3xl rounded-full flex items-center justify-center mx-auto shadow-md shadow-blue-900/10 mb-4">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-xl font-black text-slate-900">{profile.fullName}</h3>
          <p className="text-slate-400 font-medium text-xs mt-1 flex items-center justify-center gap-1">
            <Mail className="w-3.5 h-3.5" /> {profile.email}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-50">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4" /> สิทธิ์ผู้ใช้งานทั่วไป
            </span>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full mt-8 py-3.5 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" /> ออกจากระบบอย่างปลอดภัย
          </button>
        </div>

        {/* 🔑 การ์ดฝั่งขวา: ฟอร์มเปลี่ยนรหัสผ่านเพื่อความปลอดภัย */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_15px_40px_rgba(148,163,184,0.03)]">
          <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" /> เปลี่ยนรหัสผ่านบัญชี
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">รหัสผ่านเดิมปัจจุบัน</label>
              <input 
                type="password" 
                placeholder="********" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">รหัสผ่านใหม่ที่ต้องการตั้ง</label>
              <input 
                type="password" 
                placeholder="********" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
              <input 
                type="password" 
                placeholder="********" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold transition-all"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>ยืนยันอัปเดตรหัสผ่านใหม่</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}