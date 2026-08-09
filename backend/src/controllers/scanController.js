const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const db = require('../config/db');

// 🪄 ฟังก์ชันสำหรับตัดเกรด A-F ตามระดับความรุนแรงของช่องโหว่ที่พบจริง (ไม่ใช้แค่ตัวเลขคะแนนอย่างเดียว)
//   A ดีมาก           : ไม่พบ Critical, High หรือ Medium และการสแกนครบถ้วน
//   B ดี              : ไม่พบ Critical หรือ High อาจพบ Low
//   C ปานกลาง         : ไม่พบ Critical อาจพบ Medium
//   D มีความเสี่ยงสูง   : อาจพบ High แต่ต้องไม่พบ Critical
//   F มีความเสี่ยงร้ายแรง: พบ Critical อย่างน้อย 1 รายการ หรือคะแนนอยู่ในช่วง 0-29
const calculateGrade = (score, { hasCritical, hasHigh, hasMedium, hasLow, scanComplete } = {}) => {
  if (hasCritical || score <= 29) return 'F';
  if (hasHigh) return 'D';
  if (hasMedium) return 'C';
  if (hasLow) return 'B';
  // ไม่พบช่องโหว่เลย — ต้องสแกนครบทุกเอนจินก่อนถึงจะให้เกรด A ได้ ไม่งั้นให้ B ไว้ก่อนเผื่อมีจุดที่ตรวจไม่ถึง
  return scanComplete ? 'A' : 'B';
};

// 📋 ข้อความสรุประดับความเสี่ยงแบบสั้นๆ ต่อเกรด (แสดงแทนตัวเลข Raw Score/Ceiling เดิม)
const RISK_LEVEL_TEXT = {
  A: 'ดีมาก',
  B: 'ดี',
  C: 'ปานกลาง',
  D: 'มีความเสี่ยงสูง',
  F: 'มีความเสี่ยงร้ายแรง'
};

// 🔒 Validate โดเมนก่อนนำไปใช้กับคำสั่งระบบ ป้องกัน Command Injection
const isValidDomain = (domain) => {
  if (!domain || domain.length > 253) return false;
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return domainRegex.test(domain);
};

// 🎯 รายการพอร์ตเฉพาะที่ต้องการให้ Nmap ตรวจสอบ (แทนการสแกน Top 100 พอร์ตแบบ -F)
const NMAP_TARGET_PORTS = '21,22,23,80,135,139,443,445,1433,3000,3306,3389,5000,5432,6379,8000,8080,8443,9200,27017';

// 🛠️ เติม path ของ Git for Windows (usr/bin) เข้าไปใน PATH ของ child process เพื่อให้หา perl.exe เจอ
// แม้ backend จะถูกสั่งรันจากบริบทที่ไม่มี Git Bash อยู่ใน PATH (เช่น cmd/PowerShell/nodemon)
const GIT_USR_BIN = 'C:\\Program Files\\Git\\usr\\bin';
const extendedEnv = {
  ...process.env,
  PATH: `${process.env.PATH || ''};${GIT_USR_BIN}`
};

// 🎯 รันคำสั่ง CLI แบบปลอดภัย ใช้ execFile + มี timeout ป้องกันค้าง
const runCommand = (command, args = [], timeoutMs = 60000) => {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, env: extendedEnv }, (error, stdout, stderr) => {
      if (error) {
        // หากโปรแกรมรันเก็บข้อมูลได้บางส่วนแล้วก่อนที่จะถึง Timeout ให้ใช้ข้อมูลที่สแกนได้แทนที่จะส่งเป็นเออร์เรอร์ล้วน
        if (stdout && stdout.trim().length > 30) {
          return resolve(stdout);
        }
        if (error.killed || error.signal === 'SIGTERM') {
          return resolve(`COMMAND_ERROR: Timeout - คำสั่งใช้เวลานานเกินกำหนด (${Math.round(timeoutMs/1000)} วินาที) | ${stderr || ''}`);
        }
        return resolve(`COMMAND_ERROR: ${error.message} | ${stderr || ''}`);
      }
      resolve(stdout || stderr);
    });
  });
};

// 📊 แมปเก็บสถานะความคืบหน้าแบบ Real-time ราย Scan ID
const activeScanProgress = new Map();

// ============================================================================
// 🔌 ตรวจสถานะเอนจินสแกนแบบเรียลไทม์ (ยิงคำสั่งเช็คจริงว่าเครื่องมือพร้อมใช้งานไหม)
// เก็บผลไว้ในแคชสั้นๆ เพื่อไม่ให้หน้า Dashboard ต้องรอ probe ใหม่ทุกครั้งที่โหลด
// ============================================================================
const ENGINE_STATUS_TTL_MS = 60000; // แคช 1 นาที
let engineStatusCache = { at: 0, data: null };

const probeEngines = async () => {
  const niktoScriptPath = path.join(__dirname, '../../tools/nikto/program/nikto.pl');
  const niktoConfigPath = path.join(__dirname, '../../tools/nikto/program/nikto.conf.default');

  const [nmapOut, sslyzeOut, niktoOut, zapOut] = await Promise.all([
    runCommand('nmap', ['--version'], 10000),
    // ต้องให้ python พิมพ์ค่ายืนยันออกมา เพราะ import เฉยๆ จะไม่มี output ทำให้แยกไม่ออกว่าสำเร็จหรือล้มเหลว
    runCommand('python', ['-c', 'import sslyze; print("SSLYZE_OK")'], 20000),
    fs.existsSync(niktoScriptPath)
      ? runCommand('perl', [niktoScriptPath, '-Version', '-config', niktoConfigPath], 20000)
      : Promise.resolve('COMMAND_ERROR: ไม่พบไฟล์ nikto.pl'),
    runCommand('docker', ['image', 'inspect', 'zaproxy/zap-stable', '--format', '{{.Id}}'], 15000)
  ]);

  return [
    {
      key: 'nmap',
      name: 'Nmap',
      layer: 'Network Layer',
      online: /nmap version/i.test(nmapOut),
      detail: (nmapOut.match(/Nmap version [\d.]+/i) || ['ไม่พร้อมใช้งาน'])[0]
    },
    {
      key: 'sslyze',
      name: 'SSLyze',
      layer: 'Transport Layer',
      online: /SSLYZE_OK/.test(sslyzeOut || ''),
      detail: /SSLYZE_OK/.test(sslyzeOut || '') ? 'โมดูล sslyze พร้อมใช้งาน' : 'ไม่พบโมดูล sslyze ใน Python'
    },
    {
      key: 'nikto',
      name: 'Nikto',
      layer: 'Web Server Layer',
      online: /nikto v?[\d.]+/i.test(niktoOut),
      detail: (niktoOut.match(/Nikto v?[\d.]+/i) || ['ไม่พร้อมใช้งาน'])[0]
    },
    {
      key: 'zap',
      name: 'OWASP ZAP',
      layer: 'Application Layer (DAST)',
      online: /^sha256:/i.test((zapOut || '').trim()),
      detail: /^sha256:/i.test((zapOut || '').trim())
        ? 'Docker image พร้อมใช้งาน'
        : 'Docker ไม่ทำงาน หรือยังไม่ได้ดึง image'
    }
  ];
};

exports.getEngineStatus = async (req, res) => {
  try {
    const now = Date.now();
    if (engineStatusCache.data && now - engineStatusCache.at < ENGINE_STATUS_TTL_MS) {
      return res.json({ success: true, cached: true, data: engineStatusCache.data });
    }

    const data = await probeEngines();
    engineStatusCache = { at: now, data };
    res.json({ success: true, cached: false, data });
  } catch (error) {
    console.error('Engine Status Error:', error);
    res.status(500).json({ message: 'ไม่สามารถตรวจสอบสถานะเอนจินได้' });
  }
};

// ⏱️ เวลาสูงสุดที่ยอมให้ ZAP Docker รัน ก่อนถูก kill (เป็นแค่เพดานบน ไม่ได้ทำให้สแกนที่เสร็จเร็วอยู่แล้วช้าลง)
const ZAP_TIMEOUT_MS = 300000; // 5 นาที (3 นาทียังไม่พอสำหรับเว็บไซต์ขนาดใหญ่มากอย่าง youtube.com)

// ⚡ 🐝 ฟังก์ชันรัน OWASP ZAP ผ่าน Docker และส่งออกผลลัพธ์เป็น JSON
const runZapDocker = (targetUrl, scanId) => {
  return new Promise((resolve) => {
    const reportDir = path.join(__dirname, '../../temp_reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    const reportFileName = `zap_${scanId}.json`;
    const reportPath = path.join(reportDir, reportFileName);
    const normalizedReportDir = reportDir.replace(/\\/g, '/');

    // 🏷️ ตั้งชื่อ container ไว้แน่นอน เพื่อให้ล้าง (force remove) ได้ตรงตัวเวลา Node kill คำสั่ง docker ฝั่ง client
    // ไม่งั้น --rm จะไม่ทำงาน (มันลบ container ตอน container เอง exit เท่านั้น) กลายเป็น container ค้างกิน CPU/RAM ไปเรื่อยๆ
    const containerName = `zap-scan-${scanId}`;
    const args = [
      'run', '--rm',
      '--name', containerName,
      '-v', `${normalizedReportDir}:/zap/wrk/:rw`,
      '-t', 'zaproxy/zap-stable',
      'zap-baseline.py',
      '-t', targetUrl,
      '-m', '1',
      '-I',
      '-J', reportFileName
    ];

    console.log(`[Scan #${scanId}] ⚡ สั่งรัน OWASP ZAP Docker: ${targetUrl}`);

    execFile('docker', args, { timeout: ZAP_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      // 🧹 ถ้า Node สั่ง kill คำสั่ง docker ฝั่ง client (timeout) ต้องล้าง container ที่อาจยังค้างรันอยู่จริงด้วยตัวเอง
      if (error && (error.killed || error.signal === 'SIGTERM')) {
        execFile('docker', ['rm', '-f', containerName], () => {});
      }

      if (fs.existsSync(reportPath)) {
        try {
          const rawData = fs.readFileSync(reportPath, 'utf-8');
          const zapJson = JSON.parse(rawData);
          try { fs.unlinkSync(reportPath); } catch (e) {}
          return resolve({ success: true, data: zapJson, rawOutput: stdout || stderr });
        } catch (e) {
          return resolve({ success: false, data: null, rawOutput: stderr || e.message, skipReason: 'report_parse_error' });
        }
      }

      // 🔍 วิเคราะห์สาเหตุที่แท้จริงที่ ZAP ไม่สามารถสแกนได้สำเร็จ แทนที่จะเหมาว่าเป็น WAF เสมอ
      const combinedOutput = `${stdout || ''}\n${stderr || ''}`.toLowerCase();
      const cleanStdout = (stdout || '').trim();
      let skipReason = 'waf_or_ssl';
      let reasonText = `เซิร์ฟเวอร์ปลายทาง (${targetUrl}) บล็อกการไต่ข้อมูล (SSL/TLS Renegotiation หรือ Web Application Firewall - WAF)`;

      if (
        (error && error.code === 'ENOENT') ||
        combinedOutput.includes('cannot connect to the docker daemon') ||
        combinedOutput.includes('failed to connect to the docker api') ||
        combinedOutput.includes('docker daemon is not running')
      ) {
        skipReason = 'docker_unavailable';
        reasonText = 'ไม่สามารถเชื่อมต่อกับ Docker ได้ กรุณาตรวจสอบว่า Docker Desktop เปิดใช้งานอยู่';
      } else if (error && (error.killed || error.signal === 'SIGTERM')) {
        skipReason = 'timeout';
        reasonText = `การสแกนใช้เวลานานเกินกำหนด (Timeout ${Math.round(ZAP_TIMEOUT_MS / 1000)} วินาที) เป้าหมายอาจมีขนาดใหญ่หรือซับซ้อนเกินไป`;
      } else if (
        combinedOutput.includes('network is unreachable') ||
        combinedOutput.includes('failed to access url') ||
        combinedOutput.includes('connection refused')
      ) {
        skipReason = 'unreachable';
        reasonText = `ไม่สามารถเชื่อมต่อไปยังเป้าหมาย (${targetUrl}) ได้ (Network unreachable / Connection refused) อาจเป็นเพราะพอร์ตดังกล่าวไม่ได้เปิดให้บริการจริง`;
      }

      const infoMsg = `Using the Automation Framework\n\n[OWASP ZAP Status]: ${reasonText}\nระบบได้ข้ามขั้นตอน ZAP DAST และใช้ผลประเมินจาก Nmap, SSLyze, Nikto และ Security Headers ในการคำนวณคะแนนตามมาตรฐาน OWASP 2025`;
      const finalLog = (cleanStdout && cleanStdout !== 'Using the Automation Framework') ? `${cleanStdout}\n\n${infoMsg}` : infoMsg;

      resolve({ success: false, data: null, rawOutput: finalLog, skipReason });
    });
  });
};

// 🔍 🕷️ ฟังก์ชันรัน Nikto Web Server Scanner
const runNikto = (urlOrDomain) => {
  return new Promise(async (resolve) => {
    const isHttps = urlOrDomain.startsWith('https://');
    const targetDomain = urlOrDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];
    
    console.log(`[Nikto Engine] 🕷️ เริ่มสแกนเว็บเซิร์ฟเวอร์: ${targetDomain} (SSL: ${isHttps ? 'On' : 'Auto'})`);
    const niktoScriptPath = path.join(__dirname, '../../tools/nikto/program/nikto.pl');
    // 🛠️ ระบุ -config ตรงๆ เพราะ nikto.pl หาไฟล์ config เองไม่เจอเวลารันข้าม working directory (เช่นผ่าน nodemon)
    const niktoConfigPath = path.join(__dirname, '../../tools/nikto/program/nikto.conf.default');

    const baseArgs = isHttps
      ? ['-h', targetDomain, '-ssl', '-Tuning', '123b', '-maxtime', '25s', '-config', niktoConfigPath]
      : ['-h', targetDomain, '-Tuning', '123b', '-maxtime', '25s', '-config', niktoConfigPath];

    let niktoOutput = '';
    if (fs.existsSync(niktoScriptPath)) {
      niktoOutput = await runCommand('perl', [niktoScriptPath, ...baseArgs], 35000);
      // ถ้ารันพอร์ต 80 ปกติแล้วล้มเหลวเนื่องจากเซิร์ฟเวอร์ปลายทางบังคับใช้ HTTPS ให้ลองอีกครั้งด้วยคำสั่ง -ssl
      if (!isHttps && (niktoOutput.includes('Unable to connect') || niktoOutput.includes('COMMAND_ERROR'))) {
        console.log(`[Nikto Engine] 🔄 เปลี่ยนโหมดลองสแกนด้วย SSL (-ssl) บนพอร์ต 443...`);
        niktoOutput = await runCommand('perl', [niktoScriptPath, '-h', targetDomain, '-ssl', '-Tuning', '123b', '-maxtime', '25s', '-config', niktoConfigPath], 35000);
      }
    } else {
      niktoOutput = await runCommand('nikto', baseArgs, 35000);
    }

    const niktoLower = niktoOutput.toLowerCase();
    let isNiktoSuccess = niktoOutput.length > 50 && !niktoLower.includes('command_error') && !niktoLower.includes('unable to connect');
    let hasServerBanner = false;
    let hasSensitiveFiles = false;
    let hasDangerousMethods = false;

    if (isNiktoSuccess) {
      if (niktoLower.includes('server:') || niktoLower.includes('apache/') || niktoLower.includes('nginx/') || niktoLower.includes('iis/')) {
        hasServerBanner = true;
      }
      if (niktoLower.includes('.env') || niktoLower.includes('.bak') || niktoLower.includes('admin') || niktoLower.includes('config')) {
        hasSensitiveFiles = true;
      }
      if (niktoLower.includes('put') || niktoLower.includes('delete') || niktoLower.includes('trace')) {
        hasDangerousMethods = true;
      }
    }

    resolve({
      success: isNiktoSuccess,
      rawOutput: niktoOutput,
      hasServerBanner,
      hasSensitiveFiles,
      hasDangerousMethods
    });
  });
};

// 🌐 เช็ค HTTP Security Headers
const checkSecurityHeaders = async (url) => {
  try {
    const target = url.startsWith('http') ? url : `https://${url}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const headers = response.headers;
    const missing = [];

    if (!headers.get('strict-transport-security')) missing.push('HSTS');
    if (!headers.get('x-content-type-options')) missing.push('X-Content-Type-Options');
    if (!headers.get('x-frame-options') && !headers.get('content-security-policy')) missing.push('X-Frame-Options');
    if (!headers.get('content-security-policy')) missing.push('CSP');

    const serverBanner = headers.get('server');
    const isBannerHidden = !serverBanner || !/\d/.test(serverBanner);

    return { success: true, missingHeaders: missing, statusCode: response.status, isBannerHidden };
  } catch (err) {
    return { success: false, error: err.message, missingHeaders: [], isBannerHidden: false };
  }
};

// ============================================================================
// 🧮 SCORING ENGINE (v2 — แก้ปัญหาหักคะแนนซ้ำซ้อน / Double Deduction)
//
// แนวคิดใหม่:
//   - ทุกช่องโหว่ที่พบ ("finding") จะถูกเก็บเป็นรายการเดียว {severity, category, label, source}
//   - หักคะแนน "ครั้งเดียว" ตาม severity เท่านั้น (ไม่มีการหักซ้ำตาม OWASP category อีกต่อไป)
//   - OWASP category ใช้แค่สำหรับ "แสดงผล/รายงาน" ว่าช่องโหว่นี้จัดอยู่หมวดไหน ไม่ใช่ตัวคูณคะแนน
// ============================================================================
// 🧮 SCORING ENGINE (v3 — Formula: 0.3 * CVSS^2 & Severity Ceiling)
//
// ข้อกำหนดสูตรใหม่:
//   - Finding Penaltyᵢ = round(0.3 * CVSSᵢ², 1)
//   - Total Risk Points = Σ Finding Penaltyᵢ (ไม่มีการกำหนดจำนวนสูงสุด / No Cap)
//   - Raw Score = max(0, 100 - Total Risk Points)
//   - Severity Ceiling ตามระดับความรุนแรงสูงสุดที่ตรวจพบ:
//       Critical ➔ สูงสุดไม่เกิน 29
//       High     ➔ สูงสุดไม่เกิน 49
//       Medium   ➔ สูงสุดไม่เกิน 69
//       Low      ➔ สูงสุดไม่เกิน 89
//       Info/None ➔ สูงสุด 100
//   - Final Score = min(Raw Score, Severity Ceiling)
// ============================================================================

/**
 * คำนวณคะแนนจากรายการ findings ที่เก็บระหว่างสแกน
 * @param {Array} findings - [{ source, category, severity, cvss, label }]
 * @param {Object} bonusInputs - ข้อมูลเพิ่มเติม
 */
const evaluateOwaspScores = (findings, bonusInputs) => {
  const deductionBreakdown = [];
  let totalRiskPointsRaw = 0;

  let hasCritical = false;
  let hasHigh = false;
  let hasMedium = false;
  let hasLow = false;

  findings.forEach((finding) => {
    // กำหนด CVSS เริ่มต้นตาม Severity หากไม่ได้ถูกระบุมาเฉพาะ
    let cvss = typeof finding.cvss === 'number' ? finding.cvss : 0;
    if (!cvss) {
      if (finding.severity === 'critical') cvss = 9.0;
      else if (finding.severity === 'high') cvss = 7.5;
      else if (finding.severity === 'medium') cvss = 5.0;
      else if (finding.severity === 'low') cvss = 3.9;
    }

    const sevLower = (finding.severity || 'low').toLowerCase();
    if (sevLower === 'critical') hasCritical = true;
    else if (sevLower === 'high') hasHigh = true;
    else if (sevLower === 'medium') hasMedium = true;
    else if (sevLower === 'low') hasLow = true;

    // Finding Penalty = round(0.3 * CVSS^2, 1)
    const penalty = Math.round(0.3 * Math.pow(cvss, 2) * 10) / 10;
    totalRiskPointsRaw += penalty;

    const sevLabel = sevLower.charAt(0).toUpperCase() + sevLower.slice(1);

    deductionBreakdown.push({
      source: finding.source,
      category: finding.category,
      severity: sevLabel,
      label: finding.label,
      cvss: cvss,
      pointsDeducted: penalty,
      counted: true,
      reason: `หักตามสูตร 0.3 × CVSS² (CVSS ${cvss.toFixed(1)} ➔ -${penalty.toFixed(1)} คะแนน)`
    });
  });

  const totalRiskPoints = Math.round(totalRiskPointsRaw * 10) / 10;
  const rawScore = Math.max(0, Math.round(100 - totalRiskPoints));

  // เพดานคะแนนสูงสุดตาม Severity สูงสุดที่ตรวจพบ
  let severityCeiling = 100;
  if (hasCritical) severityCeiling = 29;
  else if (hasHigh) severityCeiling = 49;
  else if (hasMedium) severityCeiling = 69;
  else if (hasLow) severityCeiling = 89;

  const finalScore = Math.min(rawScore, severityCeiling);
  const grade = calculateGrade(finalScore, {
    hasCritical, hasHigh, hasMedium, hasLow,
    scanComplete: bonusInputs?.scanComplete
  });
  const riskLevel = RISK_LEVEL_TEXT[grade];

  return {
    basePoints: 100,
    totalDeduction: totalRiskPoints,
    totalRiskPoints,
    rawScore,
    severityCeiling,
    finalScore,
    grade,
    riskLevel,
    deductionBreakdown,
    bonusPoints: 0,
    bonusBreakdown: []
  };
};

/**
 * รวบรวม findings จากผลลัพธ์ของทุกเครื่องมือ (nmap/sslyze/nikto/headers/zap)
 */
const collectFindings = ({ nmapOutput, sslyzeOutput, niktoRes, headerResult, zapRes }) => {
  const findings = [];
  const nmapLower = nmapOutput.toLowerCase();
  const sslyzeLower = sslyzeOutput.toLowerCase();

  // --- 1. Nmap: เปิดพอร์ต ---
  const isNmapError = nmapLower.includes('command_error') || nmapLower.includes('not recognized');
  let totalOpenPorts = 0;
  let riskyPortsFound = [];
  const HIGH_RISK_PORTS = ['21', '23', '3389', '445', '135', '139', '1433', '3306', '5432', '6379', '27017', '9200'];

  if (!isNmapError) {
    const openPortLines = nmapOutput.match(/(\d+)\/tcp\s+open[^\n]*/g) || [];
    totalOpenPorts = openPortLines.length;
    openPortLines.forEach((line) => {
      const portMatch = line.match(/^(\d+)\/tcp/);
      if (portMatch && HIGH_RISK_PORTS.includes(portMatch[1])) riskyPortsFound.push(portMatch[1]);
    });
  }

  const hasIgnoredStates = nmapLower.includes('ignored states') || nmapLower.includes('all 100 scanned ports');
  const isHostDown = nmapLower.includes('host seems down') || nmapLower.includes('0 hosts up');

  if (riskyPortsFound.length > 0) {
    findings.push({
      source: 'Nmap',
      category: 'A02',
      severity: 'high',
      cvss: 8.0,
      label: `เปิดพอร์ตกลุ่มเสี่ยงสูง (${riskyPortsFound.join(', ')})`
    });
  } else if (totalOpenPorts > 0) {
    findings.push({
      source: 'Nmap',
      category: 'A02',
      severity: totalOpenPorts > 3 ? 'medium' : 'low',
      cvss: totalOpenPorts > 3 ? 5.0 : 2.0,
      label: `เปิดพอร์ตทั้งหมด ${totalOpenPorts} พอร์ต`
    });
  }

  // --- 2. SSLyze ---
  const isSSLyzeError = sslyzeLower.includes('command_error') || sslyzeLower.includes('unrecognized arguments');
  let isSslValid = false;

  if (!isSSLyzeError) {
    if (sslyzeLower.includes('vulnerable') || sslyzeLower.includes('heartbleed') || sslyzeLower.includes('poodle')) {
      findings.push({ source: 'SSLyze', category: 'A04', severity: 'critical', cvss: 9.5, label: 'พบช่องโหว่ร้ายแรงระดับวิกฤต (Heartbleed/POODLE)' });
    } else if (sslyzeLower.includes('expired') || sslyzeLower.includes('not trusted')) {
      findings.push({ source: 'SSLyze', category: 'A04', severity: 'high', cvss: 7.5, label: 'ใบรับรอง SSL หมดอายุ หรือไม่น่าเชื่อถือ' });
    } else if (sslyzeLower.includes('tls 1.0') || sslyzeLower.includes('tls 1.1') || sslyzeLower.includes('weak')) {
      findings.push({ source: 'SSLyze', category: 'A04', severity: 'medium', cvss: 5.0, label: 'ใช้ TLS เวอร์ชันเก่า/การเข้ารหัสที่ไม่ปลอดภัย' });
    } else {
      isSslValid = true;
    }
  }

  // --- 3. Nikto ---
  if (niktoRes.hasSensitiveFiles) {
    findings.push({ source: 'Nikto', category: 'A02', severity: 'medium', cvss: 5.0, label: 'พบไฟล์/พาธที่ละเอียดอ่อน (.env, .bak, config, admin)' });
  }
  if (niktoRes.hasDangerousMethods) {
    findings.push({ source: 'Nikto', category: 'A02', severity: 'medium', cvss: 5.0, label: 'เปิดใช้งาน HTTP Method ที่มีความเสี่ยง (PUT/DELETE/TRACE)' });
  }

  // --- 4. Security Headers ---
  if (headerResult.success && headerResult.missingHeaders.length > 0) {
    const isMediumHeader = headerResult.missingHeaders.length >= 3;
    findings.push({
      source: 'Security Headers',
      category: 'A02',
      severity: isMediumHeader ? 'medium' : 'low',
      cvss: isMediumHeader ? 5.0 : 3.9,
      label: `ขาด Security Headers: ${headerResult.missingHeaders.join(', ')}`
    });
  }

  // --- 5. OWASP ZAP ---
  // 🔔 Alerts ของ ZAP ส่วนใหญ่เป็นแค่ "การแจ้งเตือน" (เช่น Missing Header ที่หลากหลายรูปแบบ) ไม่ใช่ช่องโหว่แยกกันจริงๆ
  // จึงเก็บไว้แสดงผลเป็นรายการแจ้งเตือนทั้งหมดใน zapAlertsSummary แต่หักคะแนนแค่ครั้งเดียวจาก Alert ที่รุนแรงที่สุดเท่านั้น (ไม่หักซ้ำทีละ Alert)
  const zapAlertsSummary = [];
  const ZAP_SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 };
  let worstZapFinding = null;
  if (zapRes.success && zapRes.data) {
    const alerts = zapRes.data.site?.[0]?.alerts || [];
    alerts.forEach(alert => {
      const risk = alert.riskcode;
      const nameLower = alert.name.toLowerCase();

      let category = 'A02';
      if (nameLower.includes('access control') || nameLower.includes('ssrf') || nameLower.includes('idor')) {
        category = 'A01';
      } else if (nameLower.includes('sql') || nameLower.includes('xss') || nameLower.includes('command injection')) {
        category = 'A05';
      } else if (nameLower.includes('authentication') || nameLower.includes('session') || nameLower.includes('validation')) {
        category = 'A07';
      } else if (nameLower.includes('outdated') || nameLower.includes('library') || nameLower.includes('vulnerable component') || nameLower.includes('supply chain')) {
        category = 'A03';
      } else if (nameLower.includes('stack trace') || nameLower.includes('error handling') || nameLower.includes('exception')) {
        category = 'A10';
      }

      let severity = 'low';
      let cvss = 3.9;
      if (nameLower.includes('sql injection') || nameLower.includes('remote code execution')) {
        severity = 'critical';
        cvss = 9.5;
      } else if (nameLower.includes('access control') || nameLower.includes('auth bypass')) {
        severity = 'high';
        cvss = 8.9;
      } else if (nameLower.includes('xss')) {
        severity = 'high';
        cvss = 8.0;
      } else if (risk === '3') {
        severity = 'critical';
        cvss = 9.0;
      } else if (risk === '2') {
        severity = 'high';
        cvss = 7.5;
      } else if (risk === '1') {
        severity = 'medium';
        cvss = 5.0;
      }

      zapAlertsSummary.push({ name: alert.name, risk: alert.riskdesc, category, severity, cvss });

      if (!worstZapFinding || ZAP_SEVERITY_RANK[severity] > ZAP_SEVERITY_RANK[worstZapFinding.severity]) {
        worstZapFinding = { source: 'OWASP ZAP', category, severity, cvss, label: alert.name };
      }
    });

    // 🎯 หักคะแนนจาก ZAP แค่ครั้งเดียว โดยใช้ Alert ที่รุนแรงที่สุดเป็นตัวแทน ส่วนที่เหลือแสดงเป็นแจ้งเตือนอย่างเดียว
    if (worstZapFinding) {
      findings.push({
        ...worstZapFinding,
        label: alerts.length > 1
          ? `${worstZapFinding.label} (และอีก ${alerts.length - 1} รายการแจ้งเตือนจาก ZAP)`
          : worstZapFinding.label
      });
    }
  }

  return {
    findings,
    totalOpenPorts,
    riskyPortsFound,
    isSslValid,
    isNmapError,
    isSSLyzeError,
    hasIgnoredStates,
    isHostDown,
    zapAlertsSummary
  };
};

exports.startScan = async (req, res) => {
  let scanId;
  try {
    const { url, versionName, versionTag } = req.body;

    const activeUserObject = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUserObject
      ? (activeUserObject.id || activeUserObject.userId || activeUserObject._id || activeUserObject.memberId)
      : null;

    if (!userId) {
      return res.status(401).json({ message: 'สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง' });
    }

    if (!url) {
      return res.status(400).json({ message: 'กรุณาระบุ URL ที่ต้องการสแกน' });
    }

    const targetDomain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];

    if (!isValidDomain(targetDomain)) {
      return res.status(400).json({ message: 'รูปแบบ URL ไม่ถูกต้อง' });
    }

    // คำนวณเลขเวอร์ชันเริ่มต้นหากผู้ใช้ไม่ได้ตั้งมา (เช่น v1.0, v1.1)
    const [prevScans] = await db.execute(
      'SELECT COUNT(*) as count FROM scan_results WHERE user_id = ? AND target_url LIKE CONCAT("%", ?, "%")',
      [userId, targetDomain]
    );
    const scanCount = prevScans[0]?.count || 0;
    const assignedVersionName = (versionName || versionTag || '').trim() || (scanCount === 0 ? 'v1.0 (Baseline)' : `v1.${scanCount}`);

    const [result] = await db.execute(
      'INSERT INTO scan_results (user_id, target_url, status) VALUES (?, ?, ?)',
      [userId, url, 'scanning']
    );
    scanId = result.insertId;

    res.json({ success: true, message: 'ระบบกำลังเริ่มสแกน 4 Layer เอนจิน...', scanId, versionName: assignedVersionName });

    console.log(`[Scan #${scanId}] ⚡ เริ่มต้นสแกน 4-Layer Suite (Parallel Engine): ${targetDomain}`);
    activeScanProgress.set(scanId, { currentStep: 0, percent: 15, message: 'กำลังสแกนวิเคราะห์ Nmap, SSLyze, Nikto และ Headers ในระดับขนาน...' });

    // ⚡ รันเอนจิน Nmap, SSLyze, Nikto และ Header Check แบบขนาน (Parallel Execution) เพื่อความเร็วสูงสุด
    const [nmapOutput, sslyzeOutput, niktoRes, headerResult] = await Promise.all([
      runCommand('nmap', ['-Pn', '-p', NMAP_TARGET_PORTS, '-T4', '--host-timeout', '20s', '--max-retries', '1', targetDomain], 25000),
      runCommand('python', ['-m', 'sslyze', '--json_out', '-', targetDomain], 50000),
      runNikto(url),
      checkSecurityHeaders(url)
    ]);

    activeScanProgress.set(scanId, { currentStep: 4, percent: 65, message: 'กำลังรัน OWASP ZAP DAST Container...' });

    // 🌐 เลือกโปรโตคอลให้ ZAP ตาม Nmap ที่สแกนไปแล้ว แทนที่จะยัด https:// เสมอ
    // เพราะถ้าเป้าหมายไม่มีพอร์ต 443 เปิดอยู่ ZAP จะต่อ HTTPS ไม่ติด ("Network unreachable")
    // ซึ่งไม่ใช่การโดน WAF บล็อกจริงๆ แค่โปรโตคอลที่เลือกผิด
    const hasOpenPort = (output, port) => new RegExp(`${port}\\/tcp\\s+open`).test(output);
    let zapTargetUrl;
    if (url.startsWith('http')) {
      zapTargetUrl = url;
    } else if (!hasOpenPort(nmapOutput, 443) && hasOpenPort(nmapOutput, 80)) {
      zapTargetUrl = `http://${url}`;
    } else {
      zapTargetUrl = `https://${url}`;
    }
    const zapRes = await runZapDocker(zapTargetUrl, scanId);

    activeScanProgress.set(scanId, { currentStep: 5, percent: 95, message: 'กำลังประมวลผลคะแนนตามมาตรฐาน OWASP 2025...' });

    const collected = collectFindings({ nmapOutput, sslyzeOutput, niktoRes, headerResult, zapRes });

    if (collected.totalOpenPorts === 0 && collected.isHostDown && !headerResult.success && !niktoRes.success) {
      console.log(`[Scan #${scanId}] 🚫 โฮสต์ปลายทางบล็อกการเข้าถึง (Firewall Blocked)`);
      const owaspMapping = {
        summary: { finalScore: 0, grade: 'F', isAutoFail: true, error_reason: 'โฮสต์ปลายทางบล็อกแพ็กเก็ตสแกนเนอร์โดยสมบูรณ์' },
        deductionBreakdown: [],
        bonusBreakdown: [],
        details: { open_ports_detected: 0, risky_ports: [], A02: 'โดน Firewall บล็อก' }
      };

      await db.execute(
        `UPDATE scan_results SET status = 'failed', nmap_raw_output = ?, sslyze_raw_output = ?, zap_raw_output = ?, owasp_mapping = ? WHERE id = ?`,
        [nmapOutput, sslyzeOutput, "Firewall Blocked", JSON.stringify(owaspMapping), scanId]
      );
      activeScanProgress.delete(scanId);
      return;
    }

    const evalResult = evaluateOwaspScores(collected.findings, {
      isSslValid: collected.isSslValid,
      missingHeadersCount: headerResult.missingHeaders.length,
      riskyPortsLength: collected.riskyPortsFound.length,
      totalOpenPorts: collected.totalOpenPorts,
      isBannerHidden: headerResult.isBannerHidden && !niktoRes.hasServerBanner,
      // ครบถ้วน = ทั้ง 4 เอนจินรันสำเร็จ (ใช้ตัดสินเกรด A ตามเกณฑ์ใหม่)
      scanComplete: !collected.isNmapError && !collected.isSSLyzeError && niktoRes.success && zapRes.success,
      url
    });

    // นับจำนวนช่องโหว่ต่อ severity ไว้แสดงผลสรุป (นับทุกรายการที่พบ ไม่ใช่แค่ที่ถูกนับคะแนน)
    const vulnCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    collected.findings.forEach(f => { if (vulnCounts[f.severity] !== undefined) vulnCounts[f.severity]++; });

    const owaspMapping = {
      version_name: assignedVersionName,
      summary: {
        finalScore: evalResult.finalScore,
        grade: evalResult.grade,
        riskLevel: evalResult.riskLevel,
        basePoints: evalResult.basePoints,
        totalDeduction: evalResult.totalDeduction,
        totalRiskPoints: evalResult.totalRiskPoints,
        rawScore: evalResult.rawScore,
        severityCeiling: evalResult.severityCeiling,
        bonusPoints: evalResult.bonusPoints,
        isAutoFail: evalResult.isAutoFail
      },
      vulnerabilities: vulnCounts,
      // 🔎 รายละเอียดการหักคะแนนทุกจุด: มาจากเครื่องมือไหน หมวดอะไร หักกี่แต้ม และถูกนับหรือไม่
      deductionBreakdown: evalResult.deductionBreakdown,
      bonusBreakdown: evalResult.bonusBreakdown,
      details: {
        open_ports_detected: collected.totalOpenPorts,
        risky_ports: collected.riskyPortsFound,
        is_nmap_success: !collected.isNmapError,
        is_sslyze_success: !collected.isSSLyzeError,
        is_nikto_success: niktoRes.success,
        nikto_raw: niktoRes.rawOutput || 'No raw output from Nikto',
        is_zap_success: zapRes.success,
        zap_skip_reason: zapRes.success ? null : (zapRes.skipReason || 'waf_or_ssl'),
        missing_security_headers: headerResult.missingHeaders,
        zap_alerts: collected.zapAlertsSummary
      }
    };

    const combinedRawLog = `=== NMAP ===\n${nmapOutput}\n\n=== SSLYZE ===\n${sslyzeOutput}\n\n=== NIKTO ===\n${niktoRes.rawOutput}`;

    await db.execute(
      `UPDATE scan_results SET status = 'completed', nmap_raw_output = ?, sslyze_raw_output = ?, zap_raw_output = ?, owasp_mapping = ? WHERE id = ?`,
      [nmapOutput, sslyzeOutput, zapRes.rawOutput || JSON.stringify(collected.zapAlertsSummary), JSON.stringify(owaspMapping), scanId]
    );
    activeScanProgress.delete(scanId);
    console.log(`[Scan #${scanId}] เสร็จสิ้นสมบูรณ์ คะแนนสุทธิ: ${evalResult.finalScore} | เกรด: [${evalResult.grade}]`);

  } catch (error) {
    console.error('Scan Process Error:', error);
    if (scanId) { 
      activeScanProgress.delete(scanId);
      try { await db.execute(`UPDATE scan_results SET status = 'failed' WHERE id = ?`, [scanId]); } catch (e) { } 
    }
  }
};

// 🎯 ฟังก์ชันสำหรับสแกนสาธารณะโดยเฉพาะ (Public Scan Endpoint)
exports.publicScan = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'กรุณาระบุ URL ที่ต้องการสแกน' });
    const targetDomain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];
    if (!isValidDomain(targetDomain)) return res.status(400).json({ message: 'รูปแบบ URL ไม่ถูกต้อง' });

    console.log(`[Public Scan] เป้าหมาย: ${targetDomain}`);
    const [nmapOutput, sslyzeOutput, niktoRes, headerResult] = await Promise.all([
      runCommand('nmap', ['-Pn', '-p', NMAP_TARGET_PORTS, '-T4', '--host-timeout', '20s', '--max-retries', '1', targetDomain], 25000),
      runCommand('python', ['-m', 'sslyze', '--json_out', '-', targetDomain], 50000),
      runNikto(url),
      checkSecurityHeaders(url)
    ]);
    const zapRes = { success: false, data: null }; // Public scan ไม่รัน ZAP (ใช้เวลานาน)

    const collected = collectFindings({ nmapOutput, sslyzeOutput, niktoRes, headerResult, zapRes });

    if (collected.totalOpenPorts === 0 && collected.isHostDown && !headerResult.success && !niktoRes.success) {
      return res.json({
        success: false,
        status: 'failed',
        message: 'ไม่สามารถสแกนได้เนื่องจากโฮสต์ปลายทางบล็อกการเข้าถึงพอร์ต (Firewall Blocked)'
      });
    }

    const evalResult = evaluateOwaspScores(collected.findings, {
      isSslValid: collected.isSslValid,
      missingHeadersCount: headerResult.missingHeaders.length,
      riskyPortsLength: collected.riskyPortsFound.length,
      totalOpenPorts: collected.totalOpenPorts,
      isBannerHidden: headerResult.isBannerHidden && !niktoRes.hasServerBanner,
      // Public scan ไม่รัน ZAP โดยตั้งใจ จึงนับครบถ้วนจากแค่ nmap/sslyze/nikto/headers
      scanComplete: !collected.isNmapError && !collected.isSSLyzeError && niktoRes.success && headerResult.success,
      url
    });

    res.json({
      success: true,
      status: 'completed',
      targetUrl: url,
      data: {
        summary: { finalScore: evalResult.finalScore, grade: evalResult.grade, riskLevel: evalResult.riskLevel },
        deductionBreakdown: evalResult.deductionBreakdown,
        bonusBreakdown: evalResult.bonusBreakdown,
        details: {
          open_ports_detected: collected.totalOpenPorts,
          risky_ports: collected.riskyPortsFound,
          missing_security_headers: headerResult.missingHeaders
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// 🎯 ฟังก์ชันส่องสเตตัสพร้อมบอกเปอร์เซ็นต์ความคืบหน้าเรียลไทม์
exports.getScanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT status, target_url, owasp_mapping, nmap_raw_output, sslyze_raw_output, zap_raw_output FROM scan_results WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });

    const numericId = Number(id);
    const progress = activeScanProgress.get(numericId) || activeScanProgress.get(id) || null;

    let parsedData = rows[0].owasp_mapping;
    if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);
    res.json({
      success: true,
      status: rows[0].status,
      targetUrl: rows[0].target_url,
      currentStep: progress ? progress.currentStep : (rows[0].status === 'completed' ? 5 : 0),
      percent: progress ? progress.percent : (rows[0].status === 'completed' ? 100 : 0),
      message: progress ? progress.message : '',
      data: parsedData,
      rawOutputs: {
        nmap: rows[0].nmap_raw_output,
        sslyze: rows[0].sslyze_raw_output,
        zap: rows[0].zap_raw_output,
        nikto: parsedData?.details?.nikto_raw || 'No raw output available for Nikto'
      }
    });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

// 🎯 ดึงประวัติการสแกนเฉพาะของผู้ใช้งานที่ล็อกอินอยู่
exports.getScanHistory = async (req, res) => {
  try {
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    const [rows] = await db.execute('SELECT id, target_url, status, created_at, owasp_mapping FROM scan_results WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const historyData = rows.map((row, index) => {
      let parsedMapping = row.owasp_mapping;
      if (typeof parsedMapping === 'string') { try { parsedMapping = JSON.parse(parsedMapping); } catch (e) { } }
      const versionName = parsedMapping?.version_name || `v1.${rows.length - index - 1}`;

      // 🩺 สแกนอาจปิดเป็น 'completed' ได้แม้บางเอนจินย่อยจะ error/timeout/ถูกข้าม
      // เก็บ flag นี้ไว้แยกต่างหาก เพื่อให้หน้าแดชบอร์ดนับ "สแกนที่มีปัญหา" ได้ครบ ไม่ใช่แค่ status ล้มทั้งกระบวนการ
      const d = parsedMapping?.details;
      const hasEngineIssue = row.status === 'completed' && !!d && (
        d.is_nmap_success === false ||
        d.is_sslyze_success === false ||
        d.is_nikto_success === false ||
        d.is_zap_success === false
      );

      return {
        id: row.id,
        targetUrl: row.target_url,
        status: row.status,
        createdAt: row.created_at,
        versionName,
        grade: parsedMapping?.summary?.grade || 'N/A',
        score: parsedMapping?.summary?.finalScore || 0,
        hasEngineIssue
      };
    });
    res.json({ success: true, data: historyData });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

// 🏷️ อัปเดตเปลี่ยนชื่อเวอร์ชันการสแกน (Version Tag)
exports.updateScanVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { versionName } = req.body;
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    if (!versionName) return res.status(400).json({ message: 'กรุณาระบุชื่อเวอร์ชัน' });

    const [rows] = await db.execute('SELECT owasp_mapping FROM scan_results WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });

    let parsedMapping = rows[0].owasp_mapping;
    if (typeof parsedMapping === 'string') parsedMapping = JSON.parse(parsedMapping) || {};
    parsedMapping.version_name = versionName.trim();

    await db.execute('UPDATE scan_results SET owasp_mapping = ? WHERE id = ?', [JSON.stringify(parsedMapping), id]);
    res.json({ success: true, message: 'อัปเดตเวอร์ชันสำเร็จ', versionName: parsedMapping.version_name });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตเวอร์ชัน' }); }
};

// 🌐 ดึงประวัติเวอร์ชันทั้งหมดของเว็บไซต์เฉพาะเว็บ (Website Version Timeline)
exports.getWebsiteVersions = async (req, res) => {
  try {
    const { url } = req.query;
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });

    let query = 'SELECT id, target_url, status, created_at, owasp_mapping FROM scan_results WHERE user_id = ? AND status = "completed"';
    const params = [userId];
    if (url) {
      const cleanedDomain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];
      query += ' AND target_url LIKE CONCAT("%", ?, "%")';
      params.push(cleanedDomain);
    }
    query += ' ORDER BY created_at ASC';

    const [rows] = await db.execute(query, params);
    const versions = rows.map((row, idx) => {
      let mapping = row.owasp_mapping;
      if (typeof mapping === 'string') { try { mapping = JSON.parse(mapping); } catch (e) { } }
      return {
        id: row.id,
        targetUrl: row.target_url,
        createdAt: row.created_at,
        versionName: mapping?.version_name || (idx === 0 ? 'v1.0 (Baseline)' : `v1.${idx}`),
        score: mapping?.summary?.finalScore ?? 0,
        grade: mapping?.summary?.grade || 'F',
        vulnerabilities: mapping?.vulnerabilities || {},
        deductionBreakdown: mapping?.deductionBreakdown || [],
        bonusBreakdown: mapping?.bonusBreakdown || [],
        details: mapping?.details || {}
      };
    });

    res.json({ success: true, data: versions });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

// 📊 ดึงข้อมูลสถิติภาพรวมเพื่อแสดงผลบน Dashboard หน้าแรก
exports.getDashboardStats = async (req, res) => {
  try {
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    const [scans] = await db.execute('SELECT status, owasp_mapping FROM scan_results WHERE user_id = ?', [userId]);
    let totalScans = scans.length, completedScans = 0, failedScans = 0, safeCount = 0, riskyCount = 0;
    let vulnStats = { critical: 0, high: 0, medium: 0, low: 0 };
    let gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    scans.forEach(scan => {
      if (scan.status === 'completed') {
        completedScans++;
        let mapping = scan.owasp_mapping;
        if (typeof mapping === 'string') { try { mapping = JSON.parse(mapping); } catch (e) { } }
        if (mapping) {
          const grade = mapping.summary?.grade || 'F';
          const vulns = mapping.vulnerabilities || {};
          if (gradeDistribution[grade] !== undefined) gradeDistribution[grade]++;
          if (grade === 'A' || grade === 'B') safeCount++; else riskyCount++;
          vulnStats.critical += (vulns.critical || 0); vulnStats.high += (vulns.high || 0); vulnStats.medium += (vulns.medium || 0); vulnStats.low += (vulns.low || 0);
        }
      } else if (scan.status === 'failed') { failedScans++; }
    });
    res.json({ success: true, data: { summary: { totalScans, completedScans, failedScans, safeCount, riskyCount }, vulnStats, gradeDistribution } });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

// 📈 แนวโน้มคะแนนความปลอดภัยย้อนหลัง — คำนวณอัตโนมัติจากประวัติการสแกนจริงที่มีอยู่แล้ว
// (ไม่ใช่การสแกนใหม่ แค่สรุปคะแนนเฉลี่ยรายวันของสแกนที่เคยรันไปแล้วในช่วงเวลาที่ขอ)
exports.getSecurityTrend = async (req, res) => {
  try {
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });

    const rangeDays = req.query.range === '90' ? 90 : 30;

    const [scans] = await db.execute(
      `SELECT owasp_mapping, created_at FROM scan_results
       WHERE user_id = ? AND status = 'completed' AND created_at >= (NOW() - INTERVAL ? DAY)
       ORDER BY created_at ASC`,
      [userId, rangeDays]
    );

    // จัดกลุ่มตามวันที่ (เวลาไทย) แล้วเฉลี่ยคะแนนของวันนั้น เผื่อวันเดียวกันสแกนหลายครั้ง
    const byDate = new Map();
    scans.forEach((row) => {
      let mapping = row.owasp_mapping;
      if (typeof mapping === 'string') { try { mapping = JSON.parse(mapping); } catch (e) { mapping = null; } }
      const score = mapping?.summary?.finalScore;
      if (score === undefined || score === null) return;

      const dateKey = new Date(row.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // YYYY-MM-DD
      if (!byDate.has(dateKey)) byDate.set(dateKey, { total: 0, count: 0 });
      const bucket = byDate.get(dateKey);
      bucket.total += score;
      bucket.count += 1;
    });

    const trend = Array.from(byDate.entries())
      .map(([date, { total, count }]) => ({ date, avgScore: Math.round(total / count), scans: count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, rangeDays, data: trend });
  } catch (error) {
    console.error('Security Trend Error:', error);
    res.status(500).json({ message: 'ไม่สามารถโหลดแนวโน้มความปลอดภัยได้' });
  }
};

// 🆚 เปรียบเทียบผลการสแกนระหว่าง 2 เวอร์ชัน (Version Comparison Analytics)
exports.compareScans = async (req, res) => {
  try {
    const { id1, id2 } = req.query;
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    if (!id1 || !id2) return res.status(400).json({ message: 'กรุณาระบุไอดีสแกน 2 เวอร์ชันที่ต้องการเปรียบเทียบ' });

    const [rows] = await db.execute('SELECT id, target_url, status, created_at, owasp_mapping FROM scan_results WHERE id IN (?, ?) AND user_id = ?', [id1, id2, userId]);
    if (rows.length < 2) return res.status(404).json({ message: 'ไม่พบข้อมูลสแกนตามไอดีที่ระบุ' });

    const raw1 = rows.find(r => r.id == id1);
    const raw2 = rows.find(r => r.id == id2);

    const parseRow = (row, defaultVerName) => {
      let mapping = row.owasp_mapping;
      if (typeof mapping === 'string') { try { mapping = JSON.parse(mapping); } catch (e) { } }
      return {
        id: row.id,
        targetUrl: row.target_url,
        createdAt: row.created_at,
        versionName: mapping?.version_name || defaultVerName,
        summary: mapping?.summary || { finalScore: 0, grade: 'F' },
        vulnerabilities: mapping?.vulnerabilities || { critical: 0, high: 0, medium: 0, low: 0 },
        deductionBreakdown: mapping?.deductionBreakdown || [],
        bonusBreakdown: mapping?.bonusBreakdown || [],
        details: mapping?.details || {}
      };
    };

    const item1 = parseRow(raw1, 'v1.0 (Baseline)');
    const item2 = parseRow(raw2, 'v1.1 (Updated)');

    // 🧠 คำนวณความแตกต่างของช่องโหว่ (Fixed / New / Unresolved)
    const list1 = item1.deductionBreakdown || [];
    const list2 = item2.deductionBreakdown || [];

    // ช่องโหว่ที่เคยมีในเวอร์ชันแรก แต่ไม่พบในเวอร์ชันถัดมา (แก้ไขสำเร็จ!)
    const fixedIssues = list1.filter(d1 => !list2.some(d2 => d2.label === d1.label));
    // ช่องโหว่ที่เกิดขึ้นใหม่ในเวอร์ชันล่าสุด
    const newIssues = list2.filter(d2 => !list1.some(d1 => d1.label === d2.label));
    // ช่องโหว่ที่ยังคงค้างอยู่ทั้ง 2 เวอร์ชัน
    const unresolvedIssues = list2.filter(d2 => list1.some(d1 => d1.label === d2.label));

    const score1 = item1.summary.finalScore ?? 0;
    const score2 = item2.summary.finalScore ?? 0;
    const scoreDiff = score2 - score1;

    res.json({
      success: true,
      data: {
        item1,
        item2,
        scoreDiff,
        isImproved: scoreDiff > 0,
        fixedIssues,
        newIssues,
        unresolvedIssues
      }
    });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปรียบเทียบเวอร์ชัน' }); }
};

// 🌐 ระบบจัดการเว็บไซต์ของฉัน (My Websites)
exports.getMyWebsites = async (req, res) => {
  try {
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    const [rows] = await db.execute(`SELECT uw.id, uw.website_name, uw.website_url, uw.created_at, sr.id AS last_scan_id, sr.owasp_mapping, sr.status AS scan_status FROM user_websites uw LEFT JOIN scan_results sr ON sr.id = (SELECT id FROM scan_results WHERE user_id = ? AND target_url LIKE CONCAT('%', uw.website_url, '%') AND status = 'completed' ORDER BY created_at DESC LIMIT 1) WHERE uw.user_id = ? ORDER BY uw.created_at DESC`, [userId, userId]);
    const formattedWebsites = rows.map(row => {
      let parsedMapping = row.owasp_mapping;
      if (typeof parsedMapping === 'string') { try { parsedMapping = JSON.parse(parsedMapping); } catch (e) { } }
      return { id: row.id, name: row.website_name, url: row.website_url, createdAt: row.created_at, lastScanId: row.last_scan_id || null, scanStatus: row.scan_status || 'never_scanned', grade: parsedMapping?.summary?.grade || 'N/A', score: parsedMapping?.summary?.finalScore !== undefined ? parsedMapping.summary.finalScore : null };
    });
    res.json({ success: true, data: formattedWebsites });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

exports.addMyWebsite = async (req, res) => {
  try {
    const { name, url } = req.body;
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    if (!name || !url) return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    const cleanedUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];
    const [result] = await db.execute('INSERT INTO user_websites (user_id, website_name, website_url) VALUES (?, ?, ?)', [userId, name, cleanedUrl]);
    res.json({ success: true, message: 'บันทึกสำเร็จ!', data: { id: result.insertId, name, url: cleanedUrl } });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

exports.deleteMyWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    const [result] = await db.execute('DELETE FROM user_websites WHERE id = ? AND user_id = ?', [id, userId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
    res.json({ success: true, message: 'ลบสำเร็จ' });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

const bcrypt = require('bcryptjs');
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
    const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    const isMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!isMatch) return res.status(400).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ!' });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};