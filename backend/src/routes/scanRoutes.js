const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // 🎯 ใช้โปรแกรม JWT แกะรหัสสดๆ ตรงนี้เลย
const scanController = require('../controllers/scanController');

// 🔒 มินิ-middleware ดักแกะ Token แบบจบในตระกูล ไม่ต้องพึ่งพาไฟล์นอก
const localProtect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'ไม่มี Token ส่งมาจากหน้าบ้าน กรุณาเข้าสู่ระบบใหม่' });
    }

    const token = authHeader.split(' ')[1];
    
    // 🔑 แกะรหัสผ่าน Secret Key ของโปรเจกต์นาย 
    // (ถ้ากลุ่มนายใช้คำอื่นใน .env เช่น JWT_SECRET ให้เปลี่ยนให้ตรงกันนะครับ)
    const secretKey = process.env.JWT_SECRET || 'secret'; 
    const decoded = jwt.verify(token, secretKey);
    
    // 🧠 ฝากข้อมูลที่แกะได้ลงตัวแปรครอบจักรวาล เพื่อส่งต่อให้ scanController เอาไอดีไปใช้
    req.user = decoded; 
    
    next(); // เดินหน้าต่อไป
  } catch (error) {
    console.error("🔒 [Local Auth Error]:", error.message);
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุแล้วครับตัวนาย' });
  }
};

// 🎯 1. สั่งเริ่มสแกน (ต้องผ่านดัก Token เพื่อเก็บสถิติแยกรายบุคคล)
router.post('/start', localProtect, scanController.startScan);

// 🎯 2. ส่องดูสเตตัสสแกนระหว่างรัน CLI (รัน Nmap / SSLyze)
router.get('/status/:id', scanController.getScanStatus);

// 🎯 3. ดึงรายการประวัติการสแกนทั้งหมดของคนที่ล็อกอิน
router.get('/history', localProtect, scanController.getScanHistory);

// 🎯 4. สแกนด่วนแบบสาธารณะ (ท่อแยกอิสระ ไม่ดัก Token ไม่ลงตารางฐานข้อมูล)
router.post('/public-scan', scanController.publicScan);

// 🎯 ดึงสถิติวิเคราะห์ภาพรวม Dashboard หน้าแรก
router.get('/stats', localProtect, scanController.getDashboardStats);

// 🎯 เปรียบเทียบข้อมูลผลการสแกน 2 รายการ
router.get('/compare', localProtect, scanController.compareScans);

// 🌐 เส้นทางจัดการระบบเว็บไซต์ของฉัน (My Websites)
router.get('/my-websites', localProtect, scanController.getMyWebsites);
router.post('/my-websites', localProtect, scanController.addMyWebsite);
router.delete('/my-websites/:id', localProtect, scanController.deleteMyWebsite);  

// 🎯 อัปเดตเปลี่ยนรหัสผ่านส่วนบุคคล
router.post('/change-password', localProtect, scanController.changePassword);

module.exports = router;