import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Server,
  ShieldCheck,
  Globe,
  Flame,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

// 🎯 เกณฑ์ตัดเกรดและสีประจำเกรด (ใช้ร่วมกันทั้งวงกลมคะแนนและป้ายเกรด)
const GRADE_SCALE = [
  { min: 90, grade: 'A', text: 'ปลอดภัยดีเยี่ยม', stroke: '#0E9F6E', pill: 'bg-emerald-50 text-emerald-700' },
  { min: 70, grade: 'B', text: 'อยู่ในเกณฑ์ดี', stroke: '#2F6FED', pill: 'bg-blue-50 text-blue-700' },
  { min: 50, grade: 'C', text: 'ควรปรับปรุง', stroke: '#D9A209', pill: 'bg-amber-50 text-amber-700' },
  { min: 30, grade: 'D', text: 'ความเสี่ยงสูง', stroke: '#D98209', pill: 'bg-orange-50 text-orange-700' },
  { min: 0, grade: 'F', text: 'สุ่มเสี่ยงอันตราย', stroke: '#DC3A52', pill: 'bg-red-50 text-red-700' }
];

const getGradeMeta = (score) => GRADE_SCALE.find((g) => score >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];

// 📈 กราฟเส้นแนวโน้มคะแนนความปลอดภัย — วาดด้วย SVG ธรรมดา ไม่พึ่ง library ภายนอก
function TrendChart({ points }) {
  const W = 640, H = 190, PAD_X = 8, PAD_Y = 18;

  if (points.length < 2) {
    return (
      <div className="h-[190px] flex flex-col items-center justify-center text-center gap-1.5">
        <p className="text-sm font-bold text-slate-600">ข้อมูลยังไม่พอสำหรับแสดงแนวโน้ม</p>
        <p className="text-xs text-slate-400">ต้องมีผลสแกนสำเร็จอย่างน้อย 2 วันขึ้นไปในช่วงเวลานี้</p>
      </div>
    );
  }

  const xStep = (W - PAD_X * 2) / (points.length - 1);
  const yFor = (score) => PAD_Y + (1 - score / 100) * (H - PAD_Y * 2);
  const coords = points.map((p, i) => ({ x: PAD_X + i * xStep, y: yFor(p.avgScore) }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${H - PAD_Y} L ${coords[0].x.toFixed(1)} ${H - PAD_Y} Z`;

  // แสดง label วันที่แค่บางจุดถ้ามีเยอะ ไม่งั้นจะทับกันอ่านไม่ออก
  const labelEvery = Math.ceil(points.length / 7);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[190px]" preserveAspectRatio="none">
      <line x1={PAD_X} y1={H - PAD_Y} x2={W - PAD_X} y2={H - PAD_Y} stroke="#EEF2FA" strokeWidth="1" />
      <path d={areaPath} fill="url(#trendFill)" />
      <path d={linePath} fill="none" stroke="#2F6FED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle
          key={i} cx={c.x} cy={c.y}
          r={i === coords.length - 1 ? 4.5 : 3}
          fill={i === coords.length - 1 ? '#2F6FED' : '#FFFFFF'}
          stroke="#2F6FED" strokeWidth="2"
        />
      ))}
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2F6FED" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#2F6FED" stopOpacity="0" />
        </linearGradient>
      </defs>
      {coords.map((c, i) => (
        (i % labelEvery === 0 || i === coords.length - 1) && (
          <text key={i} x={c.x} y={H - 2} fontSize="9" fill="#94A3B8" textAnchor="middle" fontWeight="600">
            {new Date(points[i].date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
          </text>
        )
      ))}
    </svg>
  );
}

// 🌐 ตัดโปรโตคอล/www/พาธออก เพื่อนับจำนวน "โดเมน" ที่ไม่ซ้ำกันจริงๆ
const toDomain = (url = '') =>
  url.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0].split(':')[0].toLowerCase();

// 🛡️ ไอคอน/สีประจำเอนจินแต่ละตัว (ชื่อ ชั้นที่ตรวจ และสถานะ ดึงมาจากหลังบ้านแบบเรียลไทม์)
const ENGINE_META = {
  nmap: { Icon: Server, color: 'text-purple-600 bg-purple-50' },
  sslyze: { Icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
  nikto: { Icon: Globe, color: 'text-cyan-600 bg-cyan-50' },
  zap: { Icon: Flame, color: 'text-amber-600 bg-amber-50' }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [engines, setEngines] = useState([]);
  const [enginesLoading, setEnginesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState([]);
  const [trendRange, setTrendRange] = useState(30);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchEngineStatus();
  }, []);

  useEffect(() => {
    fetchTrend(trendRange);
  }, [trendRange]);

  const authHeader = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/scan/history', authHeader());
      if (response.data?.success) {
        setHistoryList(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสถานะเอนจินจริงจากหลังบ้าน (แยกจากข้อมูลสแกน เพราะ probe ใช้เวลานานกว่า)
  const fetchEngineStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/scan/engine-status', authHeader());
      if (response.data?.success) {
        setEngines(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching engine status:', error);
    } finally {
      setEnginesLoading(false);
    }
  };

  // แนวโน้มคะแนนความปลอดภัยย้อนหลัง — คำนวณอัตโนมัติจากประวัติสแกนจริงในหลังบ้าน
  const fetchTrend = async (range) => {
    try {
      setTrendLoading(true);
      const response = await axios.get(`http://localhost:5000/api/scan/trend?range=${range}`, authHeader());
      if (response.data?.success) {
        setTrend(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching security trend:', error);
    } finally {
      setTrendLoading(false);
    }
  };

  // ---- สรุปสถิติจากข้อมูลจริง ----
  const completedScans = historyList.filter((i) => i.status === 'completed');
  // "พบข้อผิดพลาด" = สแกนล้มทั้งกระบวนการ (status failed) รวมกับสแกนที่เสร็จแต่มีเอนจินย่อย error/timeout/ถูกข้าม
  const failedScans = historyList.filter((i) => i.status === 'failed' || i.hasEngineIssue);
  const totalDomains = new Set(historyList.map((i) => toDomain(i.targetUrl))).size;

  const avgScore = completedScans.length > 0
    ? Math.round(completedScans.reduce((acc, cur) => acc + (cur.score ?? 0), 0) / completedScans.length)
    : 0;

  const gradeMeta = getGradeMeta(avgScore);

  // 🚨 โดเมนที่อยู่ในระดับเสี่ยงสูง — ยุบให้เหลือโดเมนละ 1 รายการ (ใช้ผลสแกนล่าสุดของโดเมนนั้น)
  // เพื่อไม่ให้โดเมนเดียวกันขึ้นซ้ำหลายใบ และให้ตรงกับจำนวนโดเมนที่แสดงด้านบน
  const criticalByDomain = completedScans
    .filter((i) => i.grade === 'D' || i.grade === 'F' || (i.score ?? 100) < 50)
    .reduce((acc, scan) => {
      const key = toDomain(scan.targetUrl);
      const prev = acc[key];
      if (!prev || new Date(scan.createdAt) > new Date(prev.createdAt)) acc[key] = scan;
      return acc;
    }, {});

  const criticalList = Object.values(criticalByDomain)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0)); // เรียงคะแนนต่ำสุดขึ้นก่อน = เร่งด่วนที่สุด
  const criticalDomains = criticalList.length;

  // 📊 สัดส่วนเกรดของทุกโดเมน (ใช้ผลสแกนล่าสุดของแต่ละโดเมน ไม่นับซ้ำ)
  const latestScanByDomain = historyList
    .filter((i) => i.status === 'completed')
    .reduce((acc, scan) => {
      const key = toDomain(scan.targetUrl);
      const prev = acc[key];
      if (!prev || new Date(scan.createdAt) > new Date(prev.createdAt)) acc[key] = scan;
      return acc;
    }, {});
  const latestScans = Object.values(latestScanByDomain);
  const gradeCounts = ['A', 'B', 'C', 'D', 'F'].map((g) => ({
    grade: g,
    count: latestScans.filter((s) => (s.grade || 'F') === g).length,
    meta: GRADE_SCALE.find((gs) => gs.grade === g)
  }));

  // ⏰ โดเมนที่ไม่ได้สแกนซ้ำเกิน 30 วัน (จากผลสแกนล่าสุดของแต่ละโดเมน)
  const STALE_DAYS = 30;
  const staleDomains = latestScans
    .filter((s) => (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24) > STALE_DAYS)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // วงกลมคะแนน: เส้นรอบวง = 2πr (r = 80)
  const CIRCUMFERENCE = 2 * Math.PI * 80;
  const dashOffset = CIRCUMFERENCE * (1 - avgScore / 100);

  const todayLabel = new Date().toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[65vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-extrabold animate-pulse">
          SafeScan กำลังโหลดข้อมูลสถิติ...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 text-slate-800">

      {/* ── ส่วนหัวหน้า ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">แดชบอร์ด</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            ภาพรวมทุกโดเมนที่คุณดูแล · {todayLabel}
          </p>
        </div>
        <button
          onClick={() => navigate('/scan')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-white" /> สแกนโดเมนใหม่
        </button>
      </div>

      {/* ── การ์ดคะแนนรวม + สรุป KPI 4 ช่อง วางคู่กัน ── */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl px-6 py-8 text-center">
          <p className="text-[16px] font-black uppercase tracking-[0.09em] text-blue-600">
            Global Posture Score
          </p>
          <p className="text-[18px] text-slate-500 font-semibold mt-1.5 mb-5">
            ตรวจสอบทั้งหมด <b className="text-slate-900 text-lg font-black">{totalDomains}</b> โดเมน
          </p>

          <div className="relative w-[190px] h-[190px] mx-auto mb-5">
            <svg width="190" height="190" viewBox="0 0 190 190" className="-rotate-90">
              <circle cx="95" cy="95" r="80" fill="none" stroke="#E7EDF8" strokeWidth="16" />
              <circle
                cx="95" cy="95" r="80" fill="none"
                stroke={gradeMeta.stroke} strokeWidth="16" strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black tracking-tight leading-none text-slate-900">
                {avgScore}
              </span>
              <span className="text-xs text-slate-500 font-semibold mt-1">จาก 100 คะแนน</span>
            </div>
          </div>

          <span className={`inline-block px-5 py-2 rounded-full text-[16px] font-black ${gradeMeta.pill}`}>
            เกรด {gradeMeta.grade} · {gradeMeta.text}
          </span>

          <p className="text-[16px] text-slate-500 mt-3">
            {criticalDomains > 0
              ? `มี ${criticalDomains} โดเมนที่ควรเร่งแก้ไขโดยด่วน`
              : completedScans.length > 0
                ? 'ยังไม่พบโดเมนที่อยู่ในระดับความเสี่ยงสูง'
                : 'ยังไม่มีผลการสแกน เริ่มตรวจสอบโดเมนแรกของคุณได้เลย'}
          </p>
        </div>

        {/* สรุปภาพรวมแบบ KPI 4 ช่อง (ดูปุ๊บเข้าใจปั๊บ ไม่ต้องไล่อ่านตาราง) */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black leading-none text-slate-900">{totalDomains}</p>
            <p className="text-[15px] text-slate-500 font-semibold mt-1.5">โดเมนที่ดูแล</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black leading-none text-slate-900">{completedScans.length}</p>
            <p className="text-[15px] text-slate-500 font-semibold mt-1.5">ตรวจสอบสำเร็จ</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-3">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black leading-none text-slate-900">{failedScans.length}</p>
            <p className="text-[15px] text-slate-500 font-semibold mt-1.5">พบข้อผิดพลาด</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black leading-none text-slate-900">{criticalDomains}</p>
            <p className="text-[15px] text-slate-500 font-semibold mt-1.5">โดเมนเสี่ยงสูง</p>
          </div>
        </div>
      </section>

      {/* ── แนวโน้มความปลอดภัย (คำนวณอัตโนมัติจากประวัติการสแกนจริง) ── */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div>
            <h3 className="text-[18px] font-black text-slate-900">แนวโน้มความปลอดภัย</h3>
            <p className="text-xs text-slate-500 mt-1">
              คะแนนเฉลี่ยรายวันจากผลสแกนจริงในช่วง {trendRange} วันที่ผ่านมา
            </p>
          </div>
          <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1 shrink-0">
            {[30, 90].map((r) => (
              <button
                key={r}
                onClick={() => setTrendRange(r)}
                className={`px-3 py-1.5 rounded-md text-[16px] font-bold transition-all cursor-pointer ${
                  trendRange === r ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r} วัน
              </button>
            ))}
          </div>
        </div>

        {trendLoading ? (
          <div className="h-[190px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <TrendChart points={trend} />
        )}
      </section>

      {/* ── สัดส่วนเกรด + โดเมนที่ควรสแกนซ้ำ: ภาพรวมเพิ่มเติมของทุกโดเมน ── */}
      {latestScans.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6">
            <h3 className="text-[18px] font-black text-slate-900">สัดส่วนเกรดของทุกโดเมน</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              นับจากผลสแกนล่าสุดของแต่ละโดเมน (ทั้งหมด {latestScans.length} โดเมน)
            </p>
            <div className="space-y-3">
              {gradeCounts.map(({ grade, count, meta }) => {
                const pct = latestScans.length > 0 ? Math.round((count / latestScans.length) * 100) : 0;
                return (
                  <div key={grade} className="flex items-center gap-3">
                    <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[15px] font-black ${meta?.pill}`}>
                      {grade}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: meta?.stroke }}
                      />
                    </div>
                    <span className="shrink-0 w-16 text-right text-[14px] font-bold text-slate-500 tabular-nums">
                      {count} โดเมน
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
            <h3 className="text-[18px] font-black text-slate-900">ควรสแกนซ้ำ</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">โดเมนที่ไม่ได้สแกนซ้ำเกิน {STALE_DAYS} วัน</p>
            {staleDomains.length === 0 ? (
              <p className="py-6 text-center text-[15px] text-slate-400 font-semibold">
                ทุกโดเมนสแกนซ้ำสม่ำเสมอดีแล้ว ✅
              </p>
            ) : (
              <div className="space-y-2.5">
                {staleDomains.slice(0, 5).map((item) => {
                  const daysAgo = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/scan-result/${item.id}`)}
                      className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
                    >
                      <span className="text-[15px] font-bold text-slate-800 truncate group-hover:text-blue-600">
                        {toDomain(item.targetUrl)}
                      </span>
                      <span className="shrink-0 text-[13px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {daysAgo} วันที่แล้ว
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── โดเมนที่ต้องเร่งแก้ไข: สรุปสั้นๆ แค่ชื่อ+เกรด กดเข้าไปดูรายละเอียดที่หน้ารายงาน ── */}
      {criticalList.length > 0 && (
        <section className="bg-white border border-red-200 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-700 shrink-0" />
              <h3 className="text-[18px] font-black text-slate-900">
                โดเมนที่ควรเร่งแก้ไข ({criticalDomains})
              </h3>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-[15px] font-bold text-blue-600 hover:text-blue-700 shrink-0 cursor-pointer"
            >
              ดูทั้งหมด ➔
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {criticalList.slice(0, 6).map((item) => {
              const meta = getGradeMeta(item.score ?? 0);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/scan-result/${item.id}`)}
                  className="group inline-flex items-center gap-2.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl pl-3.5 pr-2.5 py-2 transition-all cursor-pointer"
                >
                  <span className={`px-2 py-0.5 rounded text-[13px] font-black ${meta.pill}`}>
                    {item.grade || meta.grade}
                  </span>
                  <span className="text-[15px] font-bold text-slate-800 truncate max-w-[160px]">
                    {toDomain(item.targetUrl)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── กิจกรรมล่าสุด + เอนจินที่ใช้ตรวจสอบ: สรุปแบบภาพรวม กดเข้าไปดูรายละเอียดทีหลัง ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="text-[18px] font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> กิจกรรมล่าสุด
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="text-[15px] font-bold text-blue-600 hover:text-blue-700 shrink-0 cursor-pointer"
            >
              ดูทั้งหมด ➔
            </button>
          </div>

          {historyList.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700">ยังไม่มีประวัติการสแกน</p>
              <p className="text-xs text-slate-500">กดปุ่ม "สแกนโดเมนใหม่" เพื่อเริ่มตรวจสอบครั้งแรก</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyList.slice(0, 5).map((item) => {
                const meta = getGradeMeta(item.score ?? 0);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/scan-result/${item.id}`)}
                    className="w-full flex items-center gap-3 py-3.5 text-left hover:bg-blue-50/40 transition-colors cursor-pointer rounded-lg px-1.5"
                  >
                    {item.status === 'completed' ? (
                      <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-[15px] font-black ${meta.pill}`}>
                        {item.grade || meta.grade}
                      </span>
                    ) : (
                      <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-400">
                        <AlertOctagon className="w-4 h-4" />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{toDomain(item.targetUrl)}</p>
                      <p className="text-[14px] text-slate-400 font-medium mt-0.5">
                        {item.status === 'completed' ? `${item.score ?? 0}/100 คะแนน` : 'สแกนล้มเหลว'}
                        {' · '}
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                          : '—'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6">
          <h3 className="text-[18px] font-black text-slate-900">เอนจินตรวจสอบ</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">4 Layer Engine Suite</p>

          {enginesLoading ? (
            <div className="py-8 flex flex-col items-center gap-2.5">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[15px] text-slate-400 font-semibold">กำลังตรวจสถานะ...</p>
            </div>
          ) : engines.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400 font-medium">
              ไม่สามารถตรวจสอบสถานะเครื่องมือได้
            </p>
          ) : (
            <div className="space-y-2.5">
              {engines.map((eng) => {
                const meta = ENGINE_META[eng.key] || { Icon: Server, color: 'text-slate-600 bg-slate-100' };
                return (
                  <div key={eng.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                      <meta.Icon className="w-4 h-4" />
                    </div>
                    <p className="flex-1 min-w-0 text-[15px] font-bold text-slate-800 truncate">{eng.name}</p>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${eng.online ? 'bg-emerald-500' : 'bg-red-500'}`}
                      title={eng.online ? 'ONLINE' : 'OFFLINE'}
                    />
                  </div>
                );
              })}
              <button
                onClick={() => navigate('/security-policy')}
                className="w-full mt-2 text-[14px] font-bold text-blue-600 hover:text-blue-700 text-center cursor-pointer"
              >
                ดูรายละเอียดเกณฑ์การตรวจสอบ ➔
              </button>
            </div>
          )}
        </div>

      </section>
    </div>
  );
}
