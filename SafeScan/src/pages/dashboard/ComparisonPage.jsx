import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRightLeft, 
  Loader2, 
  Globe, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Tag,
  Edit3,
  Calendar,
  AlertTriangle,
  Server,
  Flame,
  Zap,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';

export default function ComparisonPage() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  
  const [websiteVersions, setWebsiteVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const [selectedVer1, setSelectedVer1] = useState('');
  const [selectedVer2, setSelectedVer2] = useState('');

  // กดที่การ์ดเวอร์ชันเพื่อเลือก Baseline/Target โดยตรง แทนที่จะต้องเลือกจาก dropdown เท่านั้น
  const handleSelectVersionCard = (id) => {
    const idStr = id.toString();
    if (selectedVer1 === idStr) {
      setSelectedVer1('');
    } else if (selectedVer2 === idStr) {
      setSelectedVer2('');
    } else if (!selectedVer1) {
      setSelectedVer1(idStr);
    } else if (!selectedVer2) {
      setSelectedVer2(idStr);
    } else {
      // เลือกครบ 2 อันแล้ว กดอันใหม่ = แทนที่ Baseline ตัวเดิม แล้วเคลียร์ Target ให้เลือกใหม่
      setSelectedVer1(idStr);
      setSelectedVer2('');
    }
  };

  const [compareData, setCompareData] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Modal สำหรับแก้ไขชื่อเวอร์ชัน (Edit Version Tag Modal)
  const [editingScan, setEditingScan] = useState(null);
  const [newVersionNameInput, setNewVersionNameInput] = useState('');
  const [updatingVersion, setUpdatingVersion] = useState(false);

  // 1. ดึงรายการเว็บไซต์ของผู้ใช้ทั้งหมด
  useEffect(() => {
    fetchUserWebsites();
  }, []);

  const fetchUserWebsites = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/scan/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data?.success) {
        // จัดกลุ่มประวัติแยกตาม targetUrl
        const uniqueUrls = Array.from(new Set(response.data.data.map(item => item.targetUrl)));
        setWebsites(uniqueUrls);
        if (uniqueUrls.length > 0) {
          setSelectedWebsite(uniqueUrls[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // 2. เมื่อผู้ใช้เลือกเว็บไซต์ ให้ดึงประวัติเวอร์ชันสแกนทั้งหมดของเว็บนั้น
  useEffect(() => {
    if (selectedWebsite) {
      fetchWebsiteVersions(selectedWebsite);
    }
  }, [selectedWebsite]);

  const fetchWebsiteVersions = async (url) => {
    try {
      setLoadingVersions(true);
      setCompareData(null);
      const response = await axios.get(`http://localhost:5000/api/scan/website-versions?url=${encodeURIComponent(url)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data?.success) {
        const versions = response.data.data;
        setWebsiteVersions(versions);
        if (versions.length >= 2) {
          setSelectedVer1(versions[0].id.toString());
          setSelectedVer2(versions[versions.length - 1].id.toString());
        } else if (versions.length === 1) {
          setSelectedVer1(versions[0].id.toString());
          setSelectedVer2('');
        } else {
          setSelectedVer1('');
          setSelectedVer2('');
        }
      }
    } catch (error) {
      console.error('Error fetching website versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  };

  // 3. เมื่อเลือก 2 เวอร์ชันครบ ให้เปรียบเทียบผลสแกน
  const handleCompare = async () => {
    if (!selectedVer1 || !selectedVer2) return alert('กรุณาเลือกเวอร์ชันการสแกนให้ครบทั้ง 2 เวอร์ชันก่อนเปรียบเทียบ');
    if (selectedVer1 === selectedVer2) return alert('กรุณาเลือกเวอร์ชันที่แตกต่างกันเพื่อเปรียบเทียบ');

    try {
      setLoadingCompare(true);
      const response = await axios.get(`http://localhost:5000/api/scan/compare?id1=${selectedVer1}&id2=${selectedVer2}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data?.success) {
        setCompareData(response.data.data);
      }
    } catch (error) {
      console.error('Compare error:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูลเปรียบเทียบ');
    } finally {
      setLoadingCompare(false);
    }
  };

  // 4. บันทึกแก้ไขชื่อเวอร์ชัน (Update Version Tag)
  const handleUpdateVersionName = async () => {
    if (!editingScan || !newVersionNameInput.trim()) return;
    try {
      setUpdatingVersion(true);
      const response = await axios.put(`http://localhost:5000/api/scan/version/${editingScan.id}`, {
        versionName: newVersionNameInput
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data?.success) {
        setEditingScan(null);
        fetchWebsiteVersions(selectedWebsite);
        if (compareData) handleCompare();
      }
    } catch (error) {
      console.error('Update version error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกเวอร์ชัน');
    } finally {
      setUpdatingVersion(false);
    }
  };

  const getGradeBadgeClass = (grade) => {
    switch (grade) {
      case 'A': return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'B': return 'bg-blue-600 text-white shadow-blue-600/20';
      case 'C': return 'bg-amber-500 text-white shadow-amber-500/20';
      case 'D': return 'bg-orange-500 text-white shadow-orange-500/20';
      default: return 'bg-red-600 text-white shadow-red-600/20';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-4 font-sans text-slate-800 space-y-8">
      
      {/* Header Banner */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-extrabold shadow-xs mb-1">
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
          <span>Version Comparison & Progress Tracking</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          เปรียบเทียบผลการสแกนตามเวอร์ชัน
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
          เลือกเว็บไซต์และเวอร์ชันการสแกนเพื่อติดตามพัฒนาการความปลอดภัย ตรวจสอบช่องโหว่ที่ถูกแก้ไข และคะแนนที่เพิ่มขึ้น
        </p>
      </div>

      {/* STEP 1: Select Website */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-500/5 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">1. เลือกเว็บไซต์ที่ต้องการเปรียบเทียบ</h3>
            <p className="text-xs text-slate-400 font-medium">เลือกเว็บไซต์ของท่านเพื่อดึงประวัติเวอร์ชันสแกนทั้งหมด</p>
          </div>
        </div>

        {websites.length > 0 ? (
          <div className="w-full max-w-md">
            <select
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
            >
              {websites.map((url, idx) => (
                <option key={idx} value={url}>{url}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-400 text-xs font-bold">
            ยังไม่มีประวัติการสแกนเว็บไซต์ กรุณาทำการสแกนเว็บไซต์อย่างน้อย 1 ครั้ง
          </div>
        )}

        {/* STEP 2: Version Timeline */}
        {selectedWebsite && (
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                ประวัติเวอร์ชันการสแกนทั้งหมดของ ({selectedWebsite})
              </h4>
              <span className="text-[13px] font-bold text-slate-400">
                พบทั้งหมด {websiteVersions.length} เวอร์ชัน
              </span>
            </div>

            {loadingVersions ? (
              <div className="flex items-center justify-center p-8 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : websiteVersions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {websiteVersions.map((v, idx) => (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVersionCard(v.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative space-y-2 ${
                      selectedVer1 === v.id.toString()
                        ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20'
                        : selectedVer2 === v.id.toString()
                        ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/80 border-slate-200/80 hover:border-blue-300'
                    }`}
                  >
                    {(selectedVer1 === v.id.toString() || selectedVer2 === v.id.toString()) && (
                      <span
                        className={`absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[13px] font-black text-white shadow-sm ${
                          selectedVer1 === v.id.toString() ? 'bg-blue-600' : 'bg-indigo-600'
                        }`}
                      >
                        {selectedVer1 === v.id.toString() ? 'Baseline' : 'Target'}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-900 bg-blue-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-3 h-3 text-blue-600" />
                        {v.versionName}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingScan(v);
                          setNewVersionNameInput(v.versionName);
                        }}
                        className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                        title="แก้ไขชื่อเวอร์ชัน"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <p className="text-xl font-black text-slate-900">{v.score} <span className="text-[13px] text-slate-400 font-normal">คะแนน</span></p>
                        <p className="text-[13px] text-slate-400">{new Date(v.createdAt).toLocaleDateString('th-TH')}</p>
                      </div>
                      <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ${getGradeBadgeClass(v.grade)}`}>
                        {v.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-amber-800 text-xs font-bold">
                ไม่พบประวัติเวอร์ชันสแกนสำหรับเว็บไซต์นี้
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Version Selection Controls */}
        {websiteVersions.length >= 2 && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                เวอร์ชันแรก / Baseline (เวอร์ชันฐานเดิม)
              </label>
              <select
                value={selectedVer1}
                onChange={(e) => setSelectedVer1(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {websiteVersions.map((v) => (
                  <option key={v.id} value={v.id.toString()}>
                    {v.versionName} — คะแนน: {v.score} | เกรด: {v.grade} ({new Date(v.createdAt).toLocaleDateString('th-TH')})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                เวอร์ชันเปรียบเทียบ / Target (เวอร์ชันถัดมา/ใหม่ล่าสุด)
              </label>
              <select
                value={selectedVer2}
                onChange={(e) => setSelectedVer2(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                {websiteVersions.map((v) => (
                  <option key={v.id} value={v.id.toString()}>
                    {v.versionName} — คะแนน: {v.score} | เกรด: {v.grade} ({new Date(v.createdAt).toLocaleDateString('th-TH')})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                onClick={handleCompare}
                disabled={loadingCompare}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingCompare ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังประมวลผลเปรียบเทียบเวอร์ชัน...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    เริ่มเปรียบเทียบความแตกต่างทั้ง 2 เวอร์ชัน
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COMPARISON RESULTS SECTION */}
      {compareData && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Banner Score Progression */}
          <div className={`rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${
            compareData.isImproved 
              ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-500/30' 
              : compareData.scoreDiff < 0
              ? 'bg-gradient-to-r from-red-900 via-red-900 to-slate-900 border border-red-500/30'
              : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/30'
          }`}>
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[13px] font-extrabold uppercase tracking-widest text-emerald-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                Version Progress Analytics
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                {compareData.isImproved 
                  ? `คะแนนเพิ่มขึ้น +${compareData.scoreDiff} คะแนน! 🚀` 
                  : compareData.scoreDiff < 0
                  ? `คะแนนลดลง ${compareData.scoreDiff} คะแนน ⚠️`
                  : 'คะแนนคงเดิม ไม่พบความเปลี่ยนแปลง'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                เปรียบเทียบจาก {compareData.item1.versionName} ({compareData.item1.summary.finalScore} แต้ม) ➔ {compareData.item2.versionName} ({compareData.item2.summary.finalScore} แต้ม)
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
              <div className="text-center">
                <p className="text-[14px] font-bold text-slate-300 uppercase">Baseline</p>
                <div className={`w-10 h-10 rounded-xl text-xs font-black flex items-center justify-center mt-1 ${getGradeBadgeClass(compareData.item1.summary.grade)}`}>
                  {compareData.item1.summary.grade}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/70" />
              <div className="text-center">
                <p className="text-[14px] font-bold text-slate-300 uppercase">Target</p>
                <div className={`w-10 h-10 rounded-xl text-xs font-black flex items-center justify-center mt-1 ${getGradeBadgeClass(compareData.item2.summary.grade)}`}>
                  {compareData.item2.summary.grade}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Vulnerability Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Fixed Vulnerabilities */}
            <div className="bg-white/90 backdrop-blur-xl border border-emerald-200/80 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-xs font-extrabold text-slate-900">
                  ช่องโหว่ที่แก้ไขสำเร็จ ({compareData.fixedIssues.length} รายการ)
                </h4>
              </div>
              {compareData.fixedIssues.length > 0 ? (
                <ul className="space-y-2">
                  {compareData.fixedIssues.map((item, idx) => (
                    <li key={idx} className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60 text-xs font-semibold text-emerald-950 flex items-start justify-between">
                      <span>{item.label}</span>
                      <span className="text-[13px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">FIXED</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[16px] text-slate-400 font-medium text-center py-3">ไม่มีรายการช่องโหว่เดิมที่ถูกแก้ไขเพิ่มเติม</p>
              )}
            </div>

            {/* Card 2: New Vulnerabilities */}
            <div className="bg-white/90 backdrop-blur-xl border border-red-200/80 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="text-xs font-extrabold text-slate-900">
                  ช่องโหว่ใหม่ที่ตรวจพบ ({compareData.newIssues.length} รายการ)
                </h4>
              </div>
              {compareData.newIssues.length > 0 ? (
                <ul className="space-y-2">
                  {compareData.newIssues.map((item, idx) => (
                    <li key={idx} className="bg-red-50/80 p-2.5 rounded-xl border border-red-200/60 text-xs font-semibold text-red-950 flex items-start justify-between">
                      <span>{item.label}</span>
                      <span className="text-[13px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-md shrink-0">NEW</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[16px] text-emerald-600 font-bold text-center py-3">🎉 ไม่พบช่องโหว่เกิดขึ้นใหม่ในเวอร์ชันนี้</p>
              )}
            </div>

            {/* Card 3: Unresolved Vulnerabilities */}
            <div className="bg-white/90 backdrop-blur-xl border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-100">
                <Clock className="w-5 h-5 text-amber-500" />
                <h4 className="text-xs font-extrabold text-slate-900">
                  ช่องโหว่ที่ยังค้างอยู่ ({compareData.unresolvedIssues.length} รายการ)
                </h4>
              </div>
              {compareData.unresolvedIssues.length > 0 ? (
                <ul className="space-y-2">
                  {compareData.unresolvedIssues.map((item, idx) => (
                    <li key={idx} className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 text-xs font-semibold text-amber-950 flex items-start justify-between">
                      <span>{item.label}</span>
                      <span className="text-[13px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">PENDING</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[16px] text-emerald-600 font-bold text-center py-3">ไม่มีรายการช่องโหว่ค้างชำระ</p>
              )}
            </div>

          </div>

          {/* Detailed Version Matrix Comparison */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-500/5 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4.5 h-4.5 text-blue-600" />
              ตารางเปรียบเทียบรายละเอียดรายหมวด (Detailed Version Matrix)
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200/80 uppercase">
                  <tr>
                    <th className="p-3.5">หมวดการประเมิน</th>
                    <th className="p-3.5 bg-blue-50/50 text-blue-900">{compareData.item1.versionName} (Baseline)</th>
                    <th className="p-3.5 bg-indigo-50/50 text-indigo-900">{compareData.item2.versionName} (Target)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  <tr>
                    <td className="p-3.5 font-bold text-slate-900">คะแนนสุทธิ (Final Score)</td>
                    <td className="p-3.5 bg-blue-50/20 font-black text-blue-900 text-sm">{compareData.item1.summary.finalScore} แต้ม (เกรด {compareData.item1.summary.grade})</td>
                    <td className="p-3.5 bg-indigo-50/20 font-black text-indigo-900 text-sm">{compareData.item2.summary.finalScore} แต้ม (เกรด {compareData.item2.summary.grade})</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-slate-900">พอร์ตเปิดสุ่มเสี่ยง (Nmap)</td>
                    <td className="p-3.5 bg-blue-50/20">{compareData.item1.details.open_ports_detected ?? 0} พอร์ตเปิด</td>
                    <td className="p-3.5 bg-indigo-50/20">{compareData.item2.details.open_ports_detected ?? 0} พอร์ตเปิด</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-slate-900">สถานะ SSL/TLS (SSLyze)</td>
                    <td className="p-3.5 bg-blue-50/20">{compareData.item1.details.is_sslyze_success ? 'ผ่านเกณฑ์ ปลอดภัย' : 'พบข้อผิดพลาด'}</td>
                    <td className="p-3.5 bg-indigo-50/20">{compareData.item2.details.is_sslyze_success ? 'ผ่านเกณฑ์ ปลอดภัย' : 'พบข้อผิดพลาด'}</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-slate-900">ไฟล์และคอนฟิกเสี่ยง (Nikto)</td>
                    <td className="p-3.5 bg-blue-50/20">{compareData.item1.details.is_nikto_success ? 'สแกนผ่านเรียบร้อย' : 'พบประเด็นเสี่ยง'}</td>
                    <td className="p-3.5 bg-indigo-50/20">{compareData.item2.details.is_nikto_success ? 'สแกนผ่านเรียบร้อย' : 'พบประเด็นเสี่ยง'}</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-slate-900">Security Headers ที่ขาด</td>
                    <td className="p-3.5 bg-blue-50/20">{compareData.item1.details.missing_security_headers?.join(', ') || 'ครบถ้วน'}</td>
                    <td className="p-3.5 bg-indigo-50/20">{compareData.item2.details.missing_security_headers?.join(', ') || 'ครบถ้วน'}</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-bold text-slate-900">OWASP ZAP Alerts ตรวจพบ</td>
                    <td className="p-3.5 bg-blue-50/20">{compareData.item1.details.zap_alerts?.length ?? 0} Alerts</td>
                    <td className="p-3.5 bg-indigo-50/20">{compareData.item2.details.zap_alerts?.length ?? 0} Alerts</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* EDIT VERSION TAG MODAL */}
      {editingScan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" /> แก้ไขชื่อเวอร์ชัน (Version Tag)
              </h3>
              <button onClick={() => setEditingScan(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500 font-medium">
                ระบุชื่อหรือแท็กเวอร์ชันใหม่สำหรับการสแกนของเว็บ <strong>{selectedWebsite}</strong>
              </p>
              <input
                type="text"
                value={newVersionNameInput}
                onChange={(e) => setNewVersionNameInput(e.target.value)}
                placeholder="เช่น v1.0 Baseline, v1.1 Fix SQLi, v2.0 Hardened"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setEditingScan(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateVersionName}
                disabled={updatingVersion}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {updatingVersion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'บันทึกเวอร์ชัน'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}