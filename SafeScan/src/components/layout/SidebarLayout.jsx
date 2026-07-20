import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Shield, LayoutDashboard, Globe, History, 
  BarChart3, ShieldCheck, User, Bell, ChevronDown, Search, LogOut 
} from 'lucide-react';

export default function SidebarLayout() {
  const navigate = useNavigate();
  
  // 🧠 เปลี่ยนจาก Static เป็น State เพื่อดึงข้อมูลผู้ใช้ที่ล็อกอินจริงจาก localStorage
  const [user, setUser] = useState({ fullName: 'Beam', email: '' });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        // ดึงค่ามาสแตนด์บาย ถ้าหาไม่เจอให้ใส่ค่าเริ่มต้นตามที่นายกำหนดไว้
        setUser({
          fullName: parsed.name || parsed.fullName || parsed.username || 'Beam',
          email: parsed.email || 'beam@sut.ac.th'
        });
      } catch (e) {
        console.error("Error parsing user in SidebarLayout:", e);
      }
    }
  }, []);

  // 🚪 ฟังก์ชันออกจากระบบและทำลาย Token
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
    <div className="min-h-screen bg-slate-50/50 flex font-sans antialiased">
      
      {/* 🧭 Left Sidebar (แถบเมนูด้านซ้าย) */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between fixed h-full z-20">
        <div>
          {/* Logo Brand */}
          <div className="p-6 pb-2">
            <div className="flex items-center gap-2 text-blue-950 font-black text-xl">
              <Shield className="w-6 h-6 text-blue-600 fill-blue-600/10" />
              <div className="flex flex-col leading-tight">
                <div>
                    <span className="tracking-tight">Safe</span>
                    <span className='text-blue-700'>Scan</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">ระบบรักษาความปลอดภัยอัจฉริยะ</span>
              </div>
            </div>
          </div>

          {/* Menu Lists */}
          <nav className="p-4 space-y-1 mt-6">
            {menuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50/50 text-blue-600 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {item.icon}
                {item.text}
              </NavLink>
            ))}

            <div className="h-0.5 bg-slate-100 my-4 mx-2" />

            {/* ปุ่มตรวจสอบเว็บไซต์ สีน้ำเงินเด่นด้านล่าง */}
            <NavLink
              to="/scan"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-blue-600/10'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`
              }
            >
              <Search className="w-5 h-5" />
              ตรวจสอบเว็บไซต์
            </NavLink>
          </nav>
        </div>

        {/* ส่วนท้ายเมนู */}
        <div className="p-4 border-t border-slate-50">
          <p className="text-[11px] font-semibold text-slate-400 text-center">SafeScan © 2026</p>
        </div>
      </aside>

      {/* 🖥️ Right Content Area (พื้นที่ฝั่งขวา) */}
      <div className="flex-1 pl-64 flex flex-col">
        
        {/* Top Mini Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-end gap-6 sticky top-0 z-10">
          <button className="text-slate-400 hover:text-slate-600 relative p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          
          {/* User Profile Tab */}
          <div className="relative">
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-4 border-l border-slate-100 cursor-pointer group select-none"
            >
              {/* ตัวอักษรตัวแรกของชื่อผู้ใช้จริง */}
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-950/10">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                {user.fullName}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-all ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* ดรอปดาวน์จัดการบัญชีเมื่อกดจิ้มที่โปรไฟล์ */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 z-50 font-medium animate-fade-in">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 text-xs font-bold text-left transition-all"
                >
                  <User className="w-4 h-4 text-slate-400" /> ข้อมูลส่วนตัว
                </button>
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
        </header>

        {/* ส่วนเนื้อหาหลักที่จะเปลี่ยนไปตาม Route */}
        <main className="flex-1 p-8 md:p-12 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>

      </div>
    </div>
  );
}