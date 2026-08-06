import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom"; 
import { User, LayoutDashboard, LogOut, ChevronDown, Shield, Sparkles } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setMenuOpen(false);
    alert("ออกจากระบบสำเร็จแล้ว");
    navigate("/");
  };

  const navLinkStyles = ({ isActive }) => {
    return `text-sm font-semibold transition-all duration-200 relative py-1.5 px-3 rounded-lg ${
      isActive
        ? "text-blue-600 bg-blue-50/80 font-bold shadow-xs" 
        : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
    }`;
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Left Side: Brand Logo */}
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
            <Shield className="w-5 h-5 fill-white/20 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              Safe<span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">Scan</span>
            </span>
            <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase mt-0.5">
              Cyber Security
            </span>
          </div>
        </Link>

        {/* Center Side: Nav items */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100/60 p-1.5 rounded-xl border border-slate-200/50">
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

        {/* Right Side: Auth actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/80 cursor-pointer shadow-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {currentUser.fullName}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180 text-blue-600" : ""}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">บัญชีใช้งาน</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser.fullName}</p>
                  </div>

                  <Link 
                    to="/dashboard" 
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-blue-50/70 hover:text-blue-600 text-xs font-bold transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" /> เข้าสู่ระบบแดชบอร์ด
                  </Link>

                  <Link 
                    to="/profile" 
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-blue-50/70 hover:text-blue-600 text-xs font-bold transition-all"
                  >
                    <User className="w-4 h-4 text-slate-500" /> ข้อมูลส่วนตัว
                  </Link>
                  
                  <div className="h-px bg-slate-100 my-1" />
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 text-xs font-bold text-left transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <NavLink
                to="/login"
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition-all"
              >
                เข้าสู่ระบบ
              </NavLink>

              <Link
                to="/register"
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}