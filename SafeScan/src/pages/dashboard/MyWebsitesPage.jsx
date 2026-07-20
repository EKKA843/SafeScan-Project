import React, { useEffect, useState } from 'react';
import { Shield, Plus, Trash2, ShieldCheck, ShieldAlert, Play, ExternalLink, Loader2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MyWebsitesPage() {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับฟอร์มเพิ่มเว็บไซต์
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanningId, setScanningId] = useState(null); // เก็บ ID ของแถวที่กำลังกด Quick Scan

  // 📥 ดึงรายการเว็บไซต์ทั้งหมด
  const fetchWebsites = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/scan/my-websites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data.success) {
        setWebsites(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  // ➕ บันทึกเว็บไซต์ใหม่
  const handleAddWebsite = async (e) => {
    e.preventDefault();
    if (!newName || !newUrl) return alert('กรุณากรอกข้อมูลให้ครบถ้วนครับนาย!');

    try {
      setSubmitting(true);
      const response = await axios.post('http://localhost:5000/api/scan/my-websites', 
        { name: newName, url: newUrl },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.data.success) {
        setNewName('');
        setNewUrl('');
        fetchWebsites(); // ดึงข้อมูลใหม่มาอัปเดตตาราง
      }
    } catch (error) {
      console.error('Error adding website:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มเว็บไซต์');
    } finally {
      setSubmitting(false);
    }
  };

  // ❌ ลบเว็บไซต์ออกจากการเฝ้าระวัง
  const handleDeleteWebsite = async (id) => {
    if (!window.confirm('คุณมั่นใจที่จะลบเว็บไซต์นี้ออกจากระบบเฝ้าระวังใช่หรือไม่?')) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/scan/my-websites/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data.success) {
        fetchWebsites();
      }
    } catch (error) {
      console.error('Error deleting website:', error);
      alert('ไม่สามารถลบเว็บไซต์ได้ในขณะนี้');
    }
  };

  // ⚡ ฟังก์ชัน Quick Scan (ยิงสแกนด่วนทันทีไม่ต้องพิมพ์โดเมนใหม่)
  const handleQuickScan = async (item) => {
    try {
      setScanningId(item.id);
      const response = await axios.post('http://localhost:5000/api/scan/start', 
        { url: item.url },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.data.success) {
        alert('ระบบเริ่มทำ Quick Scan เบื้องหลังแล้ว! กำลังพานายไปหน้าเฝ้าส่องสถานะ...');
        navigate(`/scan-result/${response.data.scanId}`);
      }
    } catch (error) {
      console.error('Quick scan error:', error);
      alert('ไม่สามารถเริ่มสแกนด่วนได้ กรุณาตรวจสอบสถานะเซิร์ฟเวอร์หลังบ้าน');
    } finally {
      setScanningId(null);
    }
  };

  const getGradeBadge = (grade) => {
    if (grade === 'N/A') return 'bg-slate-100 text-slate-500';
    if (grade === 'A' || grade === 'B') return 'bg-emerald-100 text-emerald-800 font-extrabold';
    return 'bg-rose-100 text-rose-800 font-extrabold';
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 font-sans text-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-blue-950">เว็บไซต์ของฉัน</h1>
        <p className="text-slate-500 font-medium mt-1">บันทึกโดเมนและไอพีระบบส่วนตัวเพื่อเฝ้าระวังช่องโหว่ความปลอดภัยแบบรวมศูนย์</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ➕ ฝั่งซ้าย: ฟอร์มลงทะเบียนเพิ่มเว็บไซต์ใหม่ */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_10px_30px_rgba(148,163,184,0.03)] sticky top-6">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> เพิ่มเว็บไซต์เฝ้าระวัง
            </h3>
            
            <form onSubmit={handleAddWebsite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">ชื่อเรียกเว็บไซต์</label>
                <input 
                  type="text" 
                  placeholder="เช่น เว็บไซต์ผลงานนักศึกษา" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-medium transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">URL / โดเมนเป้าหมาย</label>
                <input 
                  type="text" 
                  placeholder="เช่น scanme.nmap.org" 
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-medium transition-all"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>บันทึกเว็บไซต์</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 📋 ฝั่งขวา: รายชื่อโดเมน Watchlist เฝ้าระวังความปลอดภัย */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-slate-500 font-semibold">กำลังดึงรายการเว็บไซต์ในระเบียนระบบ...</p>
            </div>
          ) : websites.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
              <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-700">ไม่มีเว็บไซต์เฝ้าระวัง</h3>
              <p className="text-slate-400 mt-1 max-w-xs mx-auto">ลงทะเบียนเว็บไซต์ของนายด้านซ้าย เพื่อเฝ้าระวังความปลอดภัยสะสมเป็นระเบียนประวัติส่วนบุคคล</p>
            </div>
          ) : (
            <div className="space-y-4">
              {websites.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_10px_25px_rgba(148,163,184,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-100 transition-all duration-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-base">{item.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getGradeBadge(item.grade)}`}>
                        เกรด {item.grade}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-semibold select-all break-all">{item.url}</p>
                    
                    {/* ข้อมูลสถิติล่าสุด */}
                    <div className="text-[11px] text-slate-400 font-medium pt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      <span>คะแนนล่าสุด: <strong className="text-slate-700">{item.score !== null ? `${item.score}/100` : 'ไม่มีผลสแกน'}</strong></span>
                      <span>บันทึกเมื่อ: <span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString('th-TH')}</span></span>
                    </div>
                  </div>

                  {/* ⚡ ปุ่มจัดการ (Quick Scan, ลบ, เปิดผล) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {item.lastScanId && (
                      <button 
                        onClick={() => navigate(`/scan-result/${item.lastScanId}`)}
                        className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 border border-slate-200 cursor-pointer"
                        title="ดูรายงานผลล่าสุด"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> รายงาน
                      </button>
                    )}

                    <button 
                      onClick={() => handleQuickScan(item)}
                      disabled={scanningId !== null}
                      className="px-3.5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-900/10 cursor-pointer disabled:opacity-50"
                      title="กดเริ่มสแกนด่วนโดเมนนี้ทันที"
                    >
                      {scanningId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3 fill-white" />
                      )}
                      Quick Scan
                    </button>

                    <button 
                      onClick={() => handleDeleteWebsite(item.id)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition-all border border-rose-100 cursor-pointer"
                      title="ลบออกเฝ้าระวัง"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}