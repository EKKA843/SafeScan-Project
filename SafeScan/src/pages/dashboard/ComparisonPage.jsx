import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, ArrowRightLeft, Loader2, Key, Server, FileCode, CheckCircle2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function ComparisonPage() {
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [selectedId1, setSelectedId1] = useState('');
  const [selectedId2, setSelectedId2] = useState('');
  
  const [compareData, setCompareData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // ดึงประวัติการสแกนมาใส่ Dropdown
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/scan/history', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data.success) {
          setHistoryList(response.data.data.filter(item => item.status === 'completed'));
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleCompare = async () => {
    if (!selectedId1 || !selectedId2) return alert('กรุณาเลือกโดเมนที่ต้องการเปรียบเทียบให้ครบทั้ง 2 ช่องครับนาย!');
    if (selectedId1 === selectedId2) return alert('กรุณาเลือกผลสแกนที่ต่างกันเพื่อเปรียบเทียบครับ!');

    try {
      setLoadingCompare(true);
      const response = await axios.get(`http://localhost:5000/api/scan/compare?id1=${selectedId1}&id2=${selectedId2}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data.success) {
        setCompareData(response.data.data);
      }
    } catch (error) {
      console.error('Compare error:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูลเปรียบเทียบ');
    } finally {
      setLoadingCompare(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === 'A' || grade === 'B') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  // 🧠 ฟังก์ชันวิเคราะห์และคัดกรองวิธีแก้ไขปัญหาแบบไดนามิกเฉพาะเว็บ
  const renderRemediationForTarget = (item, targetName) => {
    // เช็กสถานะของแต่ละด้านจากรายละเอียด details
    const hasPortIssue = item.details?.A02 && item.details.A02 !== 'ปลอดภัย' && !item.details.A02.includes('ขัดข้อง');
    const hasSslIssue = item.details?.A04 && item.details.A04 !== 'ปลอดภัย' && !item.details.A04.includes('ขัดข้อง');
    const hasHeaderIssue = item.details?.A05 && item.details.A05 !== 'ปลอดภัย';

    const isAllSafe = !hasPortIssue && !hasSslIssue && !hasHeaderIssue;

    return (
      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div>
            <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{targetName}</span>
            <h4 className="font-extrabold text-slate-800 mt-1 break-all">{item.targetUrl}</h4>
          </div>
          <span className="text-xs text-slate-400 font-semibold">สรุปปัญหาที่ตรวจพบ</span>
        </div>

        {isAllSafe ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-emerald-800 text-xs">สุดยอด! เว็บไซต์นี้ปลอดภัยดีแล้ว</h5>
            <p className="text-slate-400 text-[11px] mt-0.5">ไม่พบช่องโหว่ความเสี่ยงสูงจากการตรวจสอบมาตรฐานพื้นฐาน</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 🔴 วิธีแก้ A02: พอร์ต */}
            {hasPortIssue && (
              <div className="bg-white p-4 rounded-xl border border-red-100 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                  <Server className="w-4 h-4 shrink-0" />
                  <span>วิธีปิดพอร์ตระบบที่ไม่ปลอดภัย ({item.details.A02})</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                  <li>เปลี่ยนพอร์ตการเชื่อมต่อ SSH/RDP หนีพอร์ตมาตรฐาน เพื่อหลบเลี่ยงการสแกนอัตโนมัติ</li>
                  <li>ใช้ไฟร์วอลล์บล็อกพอร์ตการจัดการจากภายนอกที่ไม่ใช่ไอพีของทีมพัฒนา</li>
                </ul>
                <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-2.5 rounded-lg">
                  sudo ufw deny 21/tcp && sudo ufw deny 3389/tcp
                </div>
              </div>
            )}

            {/* 🔴 วิธีแก้ A04: SSL/TLS */}
            {hasSslIssue && (
              <div className="bg-white p-4 rounded-xl border border-orange-100 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                  <Key className="w-4 h-4 shrink-0" />
                  <span>วิธีปรับปรุงมาตรฐานการเข้ารหัส SSL/TLS</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                  <li>สั่งปิดการเชื่อมต่อผ่าน TLS 1.0 และ TLS 1.1 ที่ล้าสมัยบนเว็บเซิร์ฟเวอร์</li>
                  <li>บังคับทราฟฟิกคุยผ่านเฉพาะมาตรฐานระดับสูง <strong className="text-slate-800">TLS 1.2 / TLS 1.3</strong> เท่านั้น</li>
                </ul>
                <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-2.5 rounded-lg">
                  ssl_protocols TLSv1.2 TLSv1.3;
                </div>
              </div>
            )}

            {/* 🔴 วิธีแก้ A05: Headers */}
            {hasHeaderIssue && (
              <div className="bg-white p-4 rounded-xl border border-yellow-100 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-600">
                  <FileCode className="w-4 h-4 shrink-0" />
                  <span>วิธีเติม HTTP Security Headers ที่ขาดหาย</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold bg-amber-50 text-amber-800 p-2 rounded-md">
                  ปัญหา: {item.details.A05}
                </p>
                <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                  <li>ติดตั้งแพ็กเกจรักษาความปลอดภัยดักหัวข้อการส่งข้อมูล</li>
                  <li>ป้อนคำสั่งบังคับส่งพารามิเตอร์ความปลอดภัยไปกับเบราว์เซอร์ของผู้ใช้</li>
                </ul>
                <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-2.5 rounded-lg space-y-0.5">
                  <p className="text-slate-500">// Node.js Express Helmet</p>
                  <p className="text-white">app.use(require('helmet')());</p>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 font-sans text-sm">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-blue-950 flex items-center gap-2">
          เปรียบเทียบข้อมูล <ArrowRightLeft className="w-7 h-7 text-blue-600" />
        </h1>
        <p className="text-slate-500 font-medium mt-1">เลือกเว็บไซต์จากประวัติการสแกนเพื่อนำมาประชันคะแนนความปลอดภัยเชิงโครงสร้างสากล</p>
      </div>

      {/* 📥 1. ส่วนเลือกโดเมนเพื่อเปรียบเทียบ */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">เว็บไซต์รายการที่ 1</label>
            {loadingHistory ? (
              <div className="py-2.5 text-slate-400 font-medium animate-pulse">กำลังโหลดประวัติ...</div>
            ) : (
              <select 
                value={selectedId1}
                onChange={(e) => setSelectedId1(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold transition-all"
              >
                <option value="">-- เลือกเว็บไซต์รายการที่ 1 --</option>
                {historyList.map(item => (
                  <option key={item.id} value={item.id}>{item.targetUrl} (เกรด {item.grade} - {new Date(item.createdAt).toLocaleDateString('th-TH')})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">เว็บไซต์รายการที่ 2</label>
            <select 
              value={selectedId2}
              onChange={(e) => setSelectedId2(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-700 font-semibold transition-all"
            >
              <option value="">-- เลือกเว็บไซต์รายการที่ 2 --</option>
              {historyList.map(item => (
                <option key={item.id} value={item.id}>{item.targetUrl} (เกรด {item.grade} - {new Date(item.createdAt).toLocaleDateString('th-TH')})</option>
              ))}
            </select>
          </div>

        </div>

        <button 
          onClick={handleCompare}
          disabled={loadingCompare}
          className="w-full mt-6 py-4 bg-blue-900 hover:bg-blue-950 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {loadingCompare ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังคำนวณข้อมูลเปรียบเทียบด่วน...
            </>
          ) : (
            <>
              เปรียบเทียบผลลัพธ์ทันที
              <ArrowRightLeft className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* 🆚 2. บอร์ดแสดงผลลัพธ์เปรียบเทียบ */}
      {compareData && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ฝั่งเว็บที่ 1 */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_15px_40px_rgba(148,163,184,0.05)] p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Target A</span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1.5 break-all">{compareData.item1.targetUrl}</h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl font-black ${getGradeColor(compareData.item1.summary.grade)}`}>
                    {compareData.item1.summary.grade}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">คะแนนรวมความปลอดภัย:</span>
                    <span className="text-slate-900 font-extrabold text-base">{compareData.item1.summary.finalScore}/100</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 font-bold block">จุดบกพร่องตามระดับความเสี่ยง:</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                      <div className="bg-red-50 text-red-600 p-2 rounded-lg">Critical: {compareData.item1.vulnerabilities.critical}</div>
                      <div className="bg-orange-50 text-orange-600 p-2 rounded-lg">High: {compareData.item1.vulnerabilities.high}</div>
                      <div className="bg-yellow-50 text-yellow-600 p-2 rounded-lg">Med: {compareData.item1.vulnerabilities.medium}</div>
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">Low: {compareData.item1.vulnerabilities.low}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <span className="text-slate-400 font-bold">ผลสแกนเชิงโครงสร้าง:</span>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 leading-relaxed font-medium"><strong>Ports:</strong> {compareData.item1.details.A02}</p>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 leading-relaxed font-medium"><strong>SSL/TLS:</strong> {compareData.item1.details.A04}</p>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 leading-relaxed font-medium"><strong>Headers:</strong> {compareData.item1.details.A05}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ฝั่งเว็บที่ 2 */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_15px_40px_rgba(148,163,184,0.05)] p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Target B</span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1.5 break-all">{compareData.item2.targetUrl}</h3>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl font-black ${getGradeColor(compareData.item2.summary.grade)}`}>
                    {compareData.item2.summary.grade}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">คะแนนรวมความปลอดภัย:</span>
                    <span className="text-slate-900 font-extrabold text-base">{compareData.item2.summary.finalScore}/100</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400 font-bold block">จุดบกพร่องตามระดับความเสี่ยง:</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                      <div className="bg-red-50 text-red-600 p-2 rounded-lg">Critical: {compareData.item2.vulnerabilities.critical}</div>
                      <div className="bg-orange-50 text-orange-600 p-2 rounded-lg">High: {compareData.item2.vulnerabilities.high}</div>
                      <div className="bg-yellow-50 text-yellow-600 p-2 rounded-lg">Med: {compareData.item2.vulnerabilities.medium}</div>
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">Low: {compareData.item2.vulnerabilities.low}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <span className="text-slate-400 font-bold">ผลสแกนเชิงโครงสร้าง:</span>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 leading-relaxed font-medium"><strong>Ports:</strong> {compareData.item2.details.A02}</p>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 leading-relaxed font-medium"><strong>SSL/TLS:</strong> {compareData.item2.details.A04}</p>
                    <p className="bg-slate-50 p-3 rounded-lg text-slate-700 leading-relaxed font-medium"><strong>Headers:</strong> {compareData.item2.details.A05}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 🛡️ 3. ส่วนพ่นวิธีแก้ไขแบบไดนามิกเฉพาะเจาะจงรายเว็บไซต์ */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_15px_40px_rgba(148,163,184,0.03)] p-8">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">Dynamic Remediation</span>
              <h3 className="text-lg font-extrabold text-blue-950 mt-2.5">คำแนะนำการปิดช่องโหว่เฉพาะโดเมน</h3>
              <p className="text-slate-400 text-xs mt-1">คัดเลือกวิธีการตั้งค่าแก้ไขระบบเฉพาะเจาะจงตามระดับช่องโหว่จริงที่สแกนพบบนเว็บไซต์ที่เลือก</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderRemediationForTarget(compareData.item1, "Target A")}
              {renderRemediationForTarget(compareData.item2, "Target B")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}