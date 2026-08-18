const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// 🔒 จำกัดความถี่การยิง Login แยกตาม IP ป้องกัน Brute-force / Password Guessing
// (แก้ตามผลทดสอบ Security — เดิมยิง Login ผิดซ้ำกี่ครั้งก็ได้ ไม่มีการชะลอหรือปฏิเสธเลย)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10, // ไม่เกิน 10 ครั้ง/IP ต่อช่วงเวลา
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'พยายามเข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณาลองใหม่อีกครั้งภายหลัง' },
  handler: (req, res, next, options) => {
    // 📝 บันทึกเหตุการณ์ Login ผิดซ้ำเกินกำหนดไว้ใน Security Log (console เบื้องต้น)
    console.warn(`🚨 [Security Log] Login rate limit exceeded — IP: ${req.ip} · ${new Date().toISOString()}`);
    res.status(options.statusCode).json(options.message);
  }
});

// 1. เส้นทางสมัครสมาชิก (อันเดิมที่รันผ่าน)
router.post('/register', authController.registerUser);

// 2. 🪄 เส้นทางล็อกอิน (เช็กว่าสะกดตัวพิมพ์เล็กทั้งหมดตรงนี้ไหม)
router.post('/login', loginLimiter, authController.loginUser);

module.exports = router;