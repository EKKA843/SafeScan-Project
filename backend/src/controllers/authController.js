const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.registerUser = async (req, res) => {
  try {
    const { fullName, company, email, password } = req.body;

    // 1. ตรวจสอบว่ากรอกข้อมูลครบถ้วนหรือไม่
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    // 2. เช็กว่าอีเมลนี้เคยสมัครไปหรือยังใน MySQL
    const [existingUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานไปแล้วในระบบ' });
    }

    // 3. เข้ารหัสผ่าน (Password Hashing) ด้วย bcrypt ป้องกันแฮกเกอร์ดูฐานข้อมูล
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. บันทึกข้อมูลลงฐานข้อมูล MySQL จริง
    await db.execute(
      'INSERT INTO users (full_name, company, email, password) VALUES (?, ?, ?, ?)',
      [fullName, company, email, hashedPassword]
    );

    res.status(201).json({ success: true, message: 'ลงทะเบียนองค์กรสำเร็จแล้ว!' });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// 🎯 เพิ่มฟังก์ชัน loginUser ต่อท้ายลงในไฟล์เดิมได้เลยครับตัวนาย
const jwt = require('jsonwebtoken');

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. ตรวจสอบว่ากรอกข้อมูลครบไหม
    if (!email || !password) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    // 2. ค้นหาผู้ใช้จากอีเมลใน MySQL
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'ไม่พบอีเมลนี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = users[0];

    // 3. ตรวจสอบรหัสผ่านโดยเทียบค่าตระกูล Hash ด้วย bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'ไม่พบอีเมลนี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // 4. สร้างสิทธิ์ยืนยันตัวตน (JWT Token) เก็บข้อมูล id เอาไว้ใช้ต่อในระบบสแกน
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'safescan_secret',
      { expiresIn: '1d' } // สิทธิ์หมดอายุภายใน 1 วัน
    );

    // 5. ส่งข้อมูลความสำเร็จกลับไปให้หน้าบ้าน React
    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ!',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};