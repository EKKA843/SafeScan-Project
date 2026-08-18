import axios from 'axios';

// 🔒 เมื่อ API ตัวไหนก็ตามตอบ 401 (Token หมดอายุ/ไม่ถูกต้อง) ให้ล้าง Token ทิ้งทันที
// แล้วเด้งกลับไปหน้า Login โดยอัตโนมัติ แทนที่จะปล่อยให้หน้าเดิมค้างพร้อมข้อมูลที่ดึงไม่ได้
// (แก้ตามผลทดสอบ Security คู่กับ ProtectedRoute)
export function setupAxiosAuthInterceptor() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
}
