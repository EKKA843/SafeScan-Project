import React from 'react';
// 🎯 1. เติมคำว่า Navigate เข้ามาในวงเล็บดึงค่ายอดฮิตด้วยครับนาย
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ScanPage from './pages/dashboard/ScanPage';
import SidebarLayout from './components/layout/SidebarLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ComparisonPage from './pages/dashboard/ComparisonPage';
import MyWebsitesPage from './pages/dashboard/MyWebsitesPage';
import SecurityPolicyPage from './pages/dashboard/SecurityPolicyPage';
import ScanResultPage from './pages/dashboard/ScanResultPage'; 
import HistoryPage from './pages/dashboard/HistoryPage'; 
import ProfilePage from './pages/dashboard/ProfilePage';

// 🎯 2. อิมพอร์ตหน้ารายการข้อมูลใหม่ทั้ง 2 ตัวเข้าสู่ระบบหลัก
import HowToUsePage from './pages/home/HowToUsePage';
import AboutPage from './pages/home/AboutPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🌟 หน้าปกติทั่วไป (แสดงตามพาร์ทปกติ ไม่ล็อกขอบเขต Sidebar ซ้ายมือ) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 🎯 3. เสียบ Route ฝั่งหน้าบ้านทั่วไปเพิ่มตรงนี้เพื่อให้เข้าถึงได้จาก Navbar หลัก */}
        <Route path="/how-to-use" element={<HowToUsePage />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* หน้าภายในระบบ Dashboard (ต้องการล็อกขอบเมนู Sidebar ซ้ายมือ) */}
        <Route element={<SidebarLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/my-websites" element={<MyWebsitesPage />} />
          <Route path="/security-policy" element={<SecurityPolicyPage />} />
          <Route path="/profile" element={<ProfilePage />} /> 
          <Route path="/scan-result/:scanId" element={<ScanResultPage />} />
          
          {/* 🎯 4. หยอดบรรทัดนี้ลงไปท้ายสุดในกลุ่ม Sidebar Layout */}
          {/* เพื่อดักจับบั๊กความจำสั้น ใครยิงมาพาร์ท /policy จะถูกส่งไป /security-policy ทันที! */}
          <Route path="/policy" element={<Navigate to="/security-policy" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}