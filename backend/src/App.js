const express = require('express');
const cors = require('cors');

// 1. เรียกใช้งาน dotenv ไว้เป็นบรรทัดแรกๆ ก่อนโหลด db
require('dotenv').config(); 

// 2. เรียกใช้งานฐานข้อมูลหลังจาก dotenv โหลดค่าเสร็จแล้ว
const db = require('./config/db'); 

const app = express();

// 🔒 จำกัด CORS เหลือเฉพาะโดเมน Frontend ที่ได้รับอนุญาต แทน app.use(cors()) เดิม
// ซึ่งเปิดรับทุก Origin (Access-Control-Allow-Origin: *) — แก้ตามผลทดสอบ Security
// ตั้งค่าโดเมน production เพิ่มได้ผ่าน .env ตัวแปร FRONTEND_URL (คั่นหลายโดเมนด้วย comma)
const allowedOrigins = [
  'http://localhost:5173',
  ...((process.env.FRONTEND_URL || '').split(',').map((o) => o.trim()).filter(Boolean))
];
app.use(cors({
  origin: (origin, callback) => {
    // อนุญาตคำขอที่ไม่มี Origin (เช่น curl/Postman) และโดเมนที่อยู่ใน allowlist เท่านั้น
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS_NOT_ALLOWED'));
  }
}));
// ปฏิเสธ Origin ที่ไม่ได้รับอนุญาตด้วย 403 + JSON ที่อ่านง่าย แทนที่จะปล่อยให้หลุดเป็น 500 ทั่วไป
app.use((err, req, res, next) => {
  if (err && err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({ message: 'Origin นี้ไม่ได้รับอนุญาตให้เข้าถึง API' });
  }
  next(err);
});
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