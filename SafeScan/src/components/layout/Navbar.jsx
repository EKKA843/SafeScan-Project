import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom"; 
import { User, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // 📥 ดึงข้อมูลสถานะผู้ใช้งานจาก localStorage ทันทีที่หน้าเว็บโหลด
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser({
          fullName: parsed.name || parsed.fullName || parsed.username || "Beam",
          email: parsed.email || ""
        });
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }, []);

  // 🚪 ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setMenuOpen(false);
    alert("ออกจากระบบสำเร็จแล้ว");
    navigate("/");
  };

  // ฟังก์ชันช่วยจัดคลาสแบบไดนามิกสำหรับเมนูตรงกลาง
  const navLinkStyles = ({ isActive }) => {
    return `text-sm font-medium transition-all duration-200 pb-1 ${
      isActive
        ? "text-blue-600 border-b-2 border-blue-600 font-bold" 
        : "text-slate-600 hover:text-blue-600"
    }`;
  };

  return (
    <nav className="w-full bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Left Side: Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="text-blue-600 text-2xl font-bold flex items-center gap-1.5">
            <span className="tracking-tight text-slate-900 font-extrabold">
              Safe<span className="text-blue-600">Scan</span>
            </span>
          </div>
        </Link>

        {/* Center Side: Menus */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/" className={navLinkStyles}>
            หน้าแรก
          </NavLink>
          <NavLink to="/how-to-use" className={navLinkStyles}>
            วิธีใช้งาน
          </NavLink>
          <NavLink to="/about" className={navLinkStyles}>
            เกี่ยวกับเรา
          </NavLink>
        </div>

        {/* Right Side: Dynamic Auth Buttons & Profile Tab */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            /* 👤 1. กรณีผู้ใช้ทำการล็อกอินแล้ว (แสดงกล่องบัญชีพร้อมชื่อจริง) */
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-all border border-slate-100 cursor-pointer group"
              >
                {/* วงกลมตัวอักษรย่อ */}
                <div className="w-8 h-8 bg-blue-900 text-white font-black text-xs rounded-full flex items-center justify-center shadow-sm">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                  {currentUser.fullName}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* 📂 ดรอปดาวน์จัดการบัญชีด่วน */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-50 animate-fade-in font-medium">
                  <Link 
                    to="/dashboard" 
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" /> เข้าสู่ระบบแดชบอร์ด
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                  >
                    <User className="w-4 h-4 text-slate-500" /> ข้อมูลส่วนตัว
                  </Link>
                  
                  <div className="h-px bg-slate-100 my-1" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-bold text-left transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* 🔑 2. กรณีที่ยังไม่มีข้อมูลล็อกอิน (แสดงปุ่มแบบดั้งเดิม) */
            <>
              <NavLink
                to="/login"
                className="px-5 py-2.5 text-sm font-medium text-blue-900 bg-white hover:bg-slate-100/80 rounded-lg shadow-sm border border-slate-100 transition-colors text-center"
              >
                เข้าสู่ระบบ
              </NavLink>

              <Link
                to="/register"
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-sm transition-colors text-center"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}