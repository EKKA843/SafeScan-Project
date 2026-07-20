const mysql = require('mysql2');
require('dotenv').config({ path: './config.env' });

// 1. สร้าง Connection Pool ตัวดิบปกติ
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'safescan',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 2. ใช้ pool ตัวดิบในการดัก Test Connection (แก้ไขตรงนี้ให้เรียกจาก pool ตรงๆ)
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ MySQL:', err.message);
  } else {
    console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
    connection.release(); // คืนสายเข้ากล่อง
  }
});

// 3. แปลงร่างเป็นแบบ Promise เพื่อส่งออกไปเขียน Async/Await ในโฟลเดอร์อื่น
const db = pool.promise();

module.exports = db;