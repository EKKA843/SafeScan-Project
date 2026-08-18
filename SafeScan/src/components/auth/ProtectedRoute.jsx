import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// 🔒 Route Guard: ตรวจสอบ Token ก่อนปล่อยให้เข้าหน้าภายในระบบ (Dashboard, History, Scan ฯลฯ)
// เดิมหน้าพวกนี้ไม่มีการเช็คเลย ทำให้โครงสร้างหน้า UI ยังโผล่ขึ้นมาได้ชั่วขณะแม้จะ Logout ไปแล้ว
// ก่อนที่ API แต่ละตัวจะตอบ 401 กลับมาทีหลัง (แก้ตามผลทดสอบ Security)
export default function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}
