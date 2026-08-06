import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, Globe, History, 
  BarChart3, ShieldCheck, User, Bell, ChevronDown, Search, LogOut 
} from 'lucide-react';

export default function SidebarLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullName: 'Beam', email: '' });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser({
          fullName: parsed.name || parsed.fullName || parsed.username || 'Beam',
          email: parsed.email || 'beam@sut.ac.th'
        });
      } catch (e) {
        console.error("Error parsing user in SidebarLayout:", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('ออกจากระบบสำเร็จแล้ว');
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, text: 'แดชบอร์ด', to: '/dashboard' },
    { icon: <Globe className="w-5 h-5" />, text: 'เว็บไซต์ของฉัน', to: '/my-websites' },
    { icon: <History className="w-5 h-5" />, text: 'ประวัติการสแกน', to: '/history' },
    { icon: <BarChart3 className="w-5 h-5" />, text: 'เปรียบเทียบข้อมูล', to: '/compare' },
    { icon: <ShieldCheck className="w-5 h-5" />, text: 'นโยบายความปลอดภัย', to: '/security-policy' },
    { icon: <User className="w-5 h-5" />, text: 'ข้อมูลส่วนตัว', to: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans antialiased">
      
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/70 flex flex-col justify-between fixed h-full z-20 shadow-xs">
        <div>
          {/* Logo Brand */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <Shield className="w-5 h-5 fill-white/20 stroke-[2.5]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Safe<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Scan</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">ระบบรักษาความปลอดภัยอัจฉริยะ</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-2">
            <div className="h-px bg-slate-100" />
          </div>

          {/* Menu Lists */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50/90 text-blue-700 font-bold border-r-4 border-blue-600 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`
                }
              >
                {item.icon}
                <span>{item.text}</span>
              </NavLink>
            ))}

            <div className="py-2">
              <div className="h-px bg-slate-100 mx-2" />
            </div>

            {/* Glowing CTA Button inside Sidebar */}
            <NavLink
              to="/scan"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50/60 text-blue-700 hover:from-blue-100 hover:to-indigo-100 border border-blue-100'
                }`
              }
            >
              <Search className="w-5 h-5 text-blue-600" />
              <span>ตรวจสอบเว็บไซต์</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 text-center tracking-wide">
            SafeScan Security © 2026
          </p>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ระบบทำงานปกติ (System Operational)</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-blue-600 relative p-2 rounded-xl hover:bg-slate-100/80 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
            </button>
            
            {/* User Profile Tab */}
            <div className="relative">
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 pl-4 border-l border-slate-200/60 cursor-pointer group select-none"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">ผู้ใช้งานทั่วไป</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform ${dropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 font-medium animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">บัญชีผู้ใช้</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-blue-50/70 hover:text-blue-600 text-xs font-bold text-left transition-all"
                  >
                    <User className="w-4 h-4 text-slate-500" /> ข้อมูลส่วนตัว
                  </button>
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
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>

      </div>
    </div>
  );
}