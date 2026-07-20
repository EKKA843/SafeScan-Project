import React, { useState } from 'react';
import { Shield, User, Building, Mail, Lock, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 👈 ดึงมารีไดเรกต์หน้า
import axios from 'axios'; // 👈 อิมพอร์ต Axios เข้ามาใช้งาน
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

  // 🎯 ฟังก์ชันเชื่อมโยงหน้าบ้าน-หลังบ้านด้วย Axios
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกันครับ');
      return;
    }

    try {
      // 🚀 ใช้ Axios ยิง POST Request ส่งข้อมูลพิกัดไปหาหลังบ้าน พอร์ต 5000
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        fullName: formData.fullName,
        company: formData.company,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        alert('สมัครสมาชิกสำเร็จ');
        navigate('/login'); // โอนสัญชาติย้ายหน้าผู้ใช้ไปที่หน้าล็อกอินอัตโนมัติ
      }

    } catch (err) {
      // ดักจับข้อความแอร์เรอร์ที่หลังบ้านส่งกลับมาเตือน (เช่น อีเมลซ้ำ)
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
      <div className="absolute bottom-[-10%] left-[-10%] w-200 h-200 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-[10%] right-[-10%] w-500 h-500 bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-120 bg-white rounded-3xl p-8 border border-slate-50 shadow-[0_20px_50px_rgba(148,163,184,0.15)] flex flex-col items-center">
          
          <div className="flex flex-col items-center text-center gap-2 w-full mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Shield className="w-6 h-6 fill-blue-600/10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-3">สร้างบัญชีใหม่</h2>
            
            {/* ⚠️ โชว์กล่องแจ้งเตือนถ้ามี Error */}
            {errorMsg && (
              <div className="w-full mt-3 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-semibold">
                {errorMsg}
              </div>
            )}
          </div>

          <form onSubmit={handleRegister} className="w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">ชื่อ-นามสกุล</label>
                <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <User className="w-4 h-4 text-slate-400" />
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="your name" className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">บริษัท</label>
                <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Building className="w-4 h-4 text-slate-400" />
                  <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="your company" className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">อีเมล</label>
              <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-slate-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="gmail@safetech.com" className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">รหัสผ่าน</label>
                <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="********" className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">ยืนยันรหัสผ่าน</label>
                <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="********" className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent" required />
                </div>
              </div>
            </div>

            <div className="w-full bg-blue-50 text-[11px] md:text-xs text-blue-800 rounded-xl p-3.5 flex items-start gap-2.5 border border-blue-100/50 leading-relaxed">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>ในการลงทะเบียน คุณตกลงยอมรับ <a href="#terms" className="underline font-bold hover:text-blue-900">ระเบียบการรักษาความปลอดภัย</a> และ <a href="#privacy" className="underline font-bold hover:text-blue-900">นโยบายความเป็นส่วนตัว</a> ของเรา</p>
            </div>

            <button type="submit" className="w-full py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-900/10 transition-all active:scale-[0.99]">
              ลงทะเบียน
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


// import React, { useState } from 'react';
// import { Shield, User, Building, Mail, Lock, Info } from 'lucide-react';
// import Navbar from '../../components/layout/Navbar';

// export default function RegisterPage() {
//   const [formData, setFormData] = useState({
//     fullName: '',
//     company: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleRegister = (e) => {
//     e.preventDefault();
//     if (formData.password !== formData.confirmPassword) {
//       alert('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกันครับ');
//       return;
//     }
//     console.log('ข้อมูลลงทะเบียน:', formData);
//     // TODO: จุดนี้ในอนาคตคุณ Beam ใช้ยิง Axios POST ไปเซฟลง MySQL ได้เลย!
//   };

//   return (
//     <div className="min-h-screen bg-white font-sans antialiased relative overflow-hidden flex flex-col">
//       {/* ดึง Navbar ตัวเนียนสมูทมาครอบส่วนบน */}
//       <Navbar />

//       {/* 🔵 แบ็คกราวด์แสงฟุ้งจางๆ สไตล์ SafeScan */}
//       <div className="absolute bottom-[-10%] left-[-10%] w-200 h-200 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none z-0" />
//       <div className="absolute top-[10%] right-[-10%] w-500 h-500 bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none z-0" />


//       {/* Main Container จัดหน้าจอกึ่งกลาง */}
//       <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        
//         {/* 📦 กล่องการ์ดสีขาวขยายขนาดความกว้างตามรูปต้นฉบับ */}
//          <div className="w-full max-w-120 bg-white rounded-3xl p-10 border border-slate-50 shadow-[0_20px_50px_rgba(148,163,184,0.15)] flex flex-col items-center">
          
//           {/* Logo & Header */}
//           <div className="flex flex-col items-center text-center gap-2 w-full mb-6">
//             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
//               <Shield className="w-6 h-6 fill-blue-600/10" />
//             </div>
//             <h2 className="text-2xl font-extrabold text-slate-900 mt-3">สร้างบัญชีใหม่</h2>
//           </div>

//           {/* Form สมัครสมาชิก */}
//           <form onSubmit={handleRegister} className="w-full space-y-4">
            
//             {/* Row 1: ชื่อ-นามสกุล และ บริษัท (แบ่งแบบ Grid 2 ฝั่ง) */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <div className="space-y-1.5">
//                 <label className="text-xs font-bold text-slate-500">ชื่อ-นามสกุล</label>
//                 <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
//                   <User className="w-4 h-4 text-slate-400" />
//                   <input 
//                     type="text" 
//                     name="fullName"
//                     value={formData.fullName}
//                     onChange={handleChange}
//                     placeholder="Enter YourName" // ใส่ตาม placeholder ของภาพ[cite: 1]
//                     className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="space-y-1.5">
//                 <label className="text-xs font-bold text-slate-500">บริษัท</label>
//                 <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
//                   <Building className="w-4 h-4 text-slate-400" />
//                   <input 
//                     type="text" 
//                     name="company"
//                     value={formData.company}
//                     onChange={handleChange}
//                     placeholder="Your Company"
//                     className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Row 2: อีเมล (ยาวเต็มแถว) */}
//             <div className="space-y-1.5">
//               <label className="text-xs font-bold text-slate-500">อีเมล</label>
//               <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
//                 <Mail className="w-4 h-4 text-slate-400" />
//                 <input 
//                   type="email" 
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="gmail@safetech.com"
//                   className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent"
//                   required
//                 />
//               </div>
//             </div>

//             {/* Row 3: รหัสผ่าน และ ยืนยันรหัสผ่าน (แบ่งแบบ Grid 2 ฝั่ง) */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               <div className="space-y-1.5">
//                 <label className="text-xs font-bold text-slate-500">รหัสผ่าน</label>
//                 <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
//                   <Lock className="w-4 h-4 text-slate-400" />
//                   <input 
//                     type="password" 
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="********"
//                     className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent"
//                     required
//                   />
//                 </div>
//               </div>

//               <div className="space-y-1.5">
//                 <label className="text-xs font-bold text-slate-500">ยืนยันรหัสผ่าน</label>
//                 <div className="w-full bg-[#f1f5f9]/50 rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
//                   <Lock className="w-4 h-4 text-slate-400" />
//                   <input 
//                     type="password" 
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     placeholder="********"
//                     className="w-full text-slate-700 placeholder-slate-400 text-sm focus:outline-none bg-transparent"
//                     required
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* 🟦 กล่องแจ้งเตือนนโยบาย (Policy Info Box) สีฟ้าตามภาพเป๊ะๆ */}
//             <div className="w-full bg-blue-50 text-[11px] md:text-xs text-blue-800 rounded-xl p-3.5 flex items-start gap-2.5 border border-blue-100/50 leading-relaxed">
//               <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
//               <p>
//                 ในการลงทะเบียน คุณตกลงยอมรับ <a href="#terms" className="underline font-bold hover:text-blue-900">ระเบียบการรักษาความปลอดภัย</a> และ <a href="#privacy" className="underline font-bold hover:text-blue-900">นโยบายความเป็นส่วนตัว</a> ของเรา
//               </p>
//             </div>

//             {/* ปุ่มกดลงทะเบียนองค์กรสีน้ำเงินเข้ม */}
//             <button 
//               type="submit"
//               className="w-full py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-900/10 transition-all active:scale-[0.99] pt-4"
//             >
//               ลงทะเบียน
//             </button>

//           </form>

//         </div>
//       </div>
//     </div>
//   );
// }