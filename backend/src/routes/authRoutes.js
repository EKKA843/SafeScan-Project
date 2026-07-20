const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 1. เส้นทางสมัครสมาชิก (อันเดิมที่รันผ่าน)
router.post('/register', authController.registerUser);

// 2. 🪄 เส้นทางล็อกอิน (เช็กว่าสะกดตัวพิมพ์เล็กทั้งหมดตรงนี้ไหม)
router.post('/login', authController.loginUser);

module.exports = router;