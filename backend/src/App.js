const express = require('express');
const cors = require('cors');

// 1. เรียกใช้งาน dotenv ไว้เป็นบรรทัดแรกๆ ก่อนโหลด db
require('dotenv').config(); 

// 2. เรียกใช้งานฐานข้อมูลหลังจาก dotenv โหลดค่าเสร็จแล้ว
const db = require('./config/db'); 

const app = express();

// เปิดประตูเชื่อมต่อกับหน้าบ้าน (React) และทำให้อ่านข้อมูล JSON ได้
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');

const scanRoutes = require('./routes/scanRoutes');

// เปิดท่อเรียกใช้งานระบบสแกน
app.use('/api/scan', scanRoutes);

// เปิดท่อเรียกใช้งาน
app.use('/api/auth', authRoutes);

// ลองทำ Route ทดสอบระบบเบื้องต้น
app.get('/api/test', (req, res) => {
  res.json({ message: 'หลังบ้าน SafeScan พร้อมทำงาน' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});