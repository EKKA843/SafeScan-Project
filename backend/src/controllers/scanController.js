const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const db = require('../config/db');

// 🪄 ฟังก์ชันสำหรับตัดเกรด A-F ตามเอกสาร Security Planning มทส.[cite: 1]
const calculateGrade = (score, isAutoFail = false) => {
  if (isAutoFail || score < 30) return 'F'; // 0-29 หรือโดน A01 Auto-fail[cite: 1]
  if (score >= 90) return 'A';              // 90-100 ปลอดภัย[cite: 1]
  if (score >= 70) return 'B';              // 70-89 พอใช้ได้[cite: 1]
  if (score >= 50) return 'C';              // 50-69 ควรแก้ไข[cite: 1]
  return 'D';                               // 30-49 เสี่ยงสูง[cite: 1]
};

// 🔒 Validate โดเมนก่อนนำไปใช้กับคำสั่งระบบ ป้องกัน Command Injection
const isValidDomain = (domain) => {
  if (!domain || domain.length > 253) return false;
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return domainRegex.test(domain);
};

// 🎯 รันคำสั่ง CLI แบบปลอดภัย ใช้ execFile + มี timeout ป้องกันค้าง
const runCommand = (command, args = [], timeoutMs = 60000) => {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        if (stdout && (stderr.includes('Warning') || stderr.includes('DeprecationWarning'))) {
          return resolve(stdout);
        }
        if (error.killed || error.signal === 'SIGTERM') {
          return resolve(`COMMAND_ERROR: Timeout - คำสั่งใช้เวลานานเกินไป | ${stderr}`);
        }
        return resolve(`COMMAND_ERROR: ${error.message} | ${stderr}`);
      }
      resolve(stdout || stderr);
    });
  });
};

// ⚡ 🐝 ฟังก์ชันรัน OWASP ZAP ผ่าน Docker และส่งออกผลลัพธ์เป็น JSON
const runZapDocker = (targetUrl, scanId) => {
  return new Promise((resolve) => {
    const reportDir = path.join(os.tmpdir(), 'safescan_reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    const reportFileName = `zap_${scanId}.json`;
    const reportPath = path.join(reportDir, reportFileName);
    const normalizedReportDir = reportDir.replace(/\\/g, '/');

    const args = [
      'run', '--rm',
      '-v', `${normalizedReportDir}:/zap/wrk/:rw`,
      '-t', 'zaproxy/zap-stable',
      'zap-baseline.py',
      '-t', targetUrl,
      '-J', reportFileName
    ];

    console.log(`[Scan #${scanId}] ⚡ สั่งรัน OWASP ZAP Docker...`);

    execFile('docker', args, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (fs.existsSync(reportPath)) {
        try {
          const rawData = fs.readFileSync(reportPath, 'utf-8');
          const zapJson = JSON.parse(rawData);
          fs.unlinkSync(reportPath);
          return resolve({ success: true, data: zapJson, rawOutput: stdout || stderr });
        } catch (e) {
          return resolve({ success: false, data: null, rawOutput: stderr || e.message });
        }
      }
      resolve({ success: false, data: null, rawOutput: stderr || error?.message || 'ZAP Report Not Found' });
    });
  });
};

// 🌐 เช็ค HTTP Security Headers เบื้องต้น
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
    if (!headers.get('x-frame-options') && !headers.get('content-security-policy')) missing.push('Clickjacking-Protection');
    if (!headers.get('content-security-policy')) missing.push('CSP');

    const serverBanner = headers.get('server');
    const isBannerHidden = !serverBanner || !/\d/.test(serverBanner); // เช็คว่าซ่อนเวอร์ชันเซิร์ฟเวอร์หรือไม่

    return { success: true, missingHeaders: missing, statusCode: response.status, isBannerHidden };
  } catch (err) {
    return { success: false, error: err.message, missingHeaders: [], isBannerHidden: false };
  }
};

exports.startScan = async (req, res) => {
  let scanId;
  try {
    const { url } = req.body;
    
    const activeUserObject = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUserObject 
      ? (activeUserObject.id || activeUserObject.userId || activeUserObject._id || activeUserObject.memberId) 
      : null;

    if (!userId) {
      return res.status(401).json({ message: 'สิทธิ์การเข้าถึงไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อสะสมประวัติ' });
    }

    if (!url) {
      return res.status(400).json({ message: 'กรุณาระบุ URL ที่ต้องการสแกน' });
    }

    const targetDomain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];

    if (!isValidDomain(targetDomain)) {
      return res.status(400).json({ message: 'รูปแบบ URL ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
    }

    const [result] = await db.execute(
      'INSERT INTO scan_results (user_id, target_url, status) VALUES (?, ?, ?)',
      [userId, url, 'scanning']
    );
    scanId = result.insertId;

    res.json({ success: true, message: 'ระบบกำลังเริ่มสแกนช่องโหว่เบื้องหลัง...', scanId });

    // 🚀 สแกนจริงผ่านเอนจินทั้งสาม
    console.log(`[Scan #${scanId}] เริ่มต้นสแกนเป้าหมาย: ${targetDomain}`);
    
    const nmapOutput = await runCommand('nmap', ['-Pn', '-F', '-sV', targetDomain], 90000);
    const sslyzeOutput = await runCommand('python', ['-m', 'sslyze', '--json_out', '-', targetDomain], 120000);
    const headerResult = await checkSecurityHeaders(url);
    const zapTargetUrl = url.startsWith('http') ? url : `https://${url}`;
    const zapRes = await runZapDocker(zapTargetUrl, scanId);

    // 🧠 ADVANCED SCORING ENGINE (อ้างอิงตามเอกสาร Security Planning มทส.)[cite: 1]
    let criticalCount = 0; let highCount = 0; let mediumCount = 0; let lowCount = 0;
    
    // ตัวแปรหมวด OWASP Top 10 (2025)[cite: 1]
    let hasA01Vulnerability = false; // Broken Access Control (Auto-fail F)[cite: 1]
    let hasA02Vulnerability = false; // Security Misconfiguration (0)[cite: 1]
    let hasA03Vulnerability = false; // Software Supply Chain Failures (-15)[cite: 1]
    let hasA04Vulnerability = false; // Cryptographic Failures (-12)[cite: 1]
    let hasA05Vulnerability = false; // Injection (SQL, XSS, Command) (-25)[cite: 1]
    let hasA07Vulnerability = false; // Authentication Failures (-20)[cite: 1]
    let hasA10Vulnerability = false; // Mishandling Exception (-8)[cite: 1]

    const nmapLower = nmapOutput.toLowerCase();
    const sslyzeLower = sslyzeOutput.toLowerCase(); 

    // --- 1. วิเคราะห์ Nmap ---
    const isNmapError = nmapLower.includes('command_error') || nmapLower.includes('not recognized');
    let totalOpenPorts = 0;
    let riskyPortsFound = [];
    const HIGH_RISK_PORTS = ['21', '23', '3389', '445', '135', '139'];

    if (!isNmapError) {
      const openPortLines = nmapOutput.match(/(\d+)\/tcp\s+open[^\n]*/g) || [];
      totalOpenPorts = openPortLines.length;

      openPortLines.forEach((line) => {
        const portMatch = line.match(/^(\d+)\/tcp/);
        if (portMatch && HIGH_RISK_PORTS.includes(portMatch[1])) {
          riskyPortsFound.push(portMatch[1]);
        }
      });
    }

    // ตรวจจับ Block Firewall
    const hasIgnoredStates = nmapLower.includes('ignored states') || nmapLower.includes('all 100 scanned ports');
    const isHostDown = nmapLower.includes('host seems down') || nmapLower.includes('0 hosts up');

    if (totalOpenPorts === 0 && (hasIgnoredStates || isHostDown)) {
      console.log(`[Scan #${scanId}] 🚫 ปลายทางปิดกั้นระบบ (Firewall Blocked)`);
      const owaspMapping = {
        summary: { finalScore: 0, grade: 'N/A', error_reason: 'โฮสต์ปลายทางบล็อกแพ็กเก็ตสแกนเนอร์โดยสมบูรณ์' },
        vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
        details: { open_ports_detected: 0, risky_ports: [], A02: 'โดน Firewall บล็อก' }
      };

      await db.execute(
        `UPDATE scan_results SET status = 'failed', nmap_raw_output = ?, sslyze_raw_output = ?, zap_raw_output = ?, owasp_mapping = ? WHERE id = ?`,
        [nmapOutput, sslyzeOutput, "Firewall Blocked", JSON.stringify(owaspMapping), scanId]
      );
      return; 
    }

    if (riskyPortsFound.length > 0) {
      highCount += 1;
      hasA02Vulnerability = true;
    } else if (totalOpenPorts > 0) {
      hasA02Vulnerability = true;
      if (totalOpenPorts > 3) mediumCount += 1; else lowCount += 1;
    }

    // --- 2. วิเคราะห์ SSLyze (A04 Cryptographic Failures) ---[cite: 1]
    const isSSLyzeError = sslyzeLower.includes('command_error') || sslyzeLower.includes('unrecognized arguments');
    let isSslValid = false;

    if (!isSSLyzeError) {
      if (sslyzeLower.includes('vulnerable') || sslyzeLower.includes('heartbleed') || sslyzeLower.includes('poodle')) {
        criticalCount += 1;
        hasA04Vulnerability = true; // -12 Penalty[cite: 1]
      } else if (sslyzeLower.includes('expired') || sslyzeLower.includes('not trusted')) {
        highCount += 1;
        hasA04Vulnerability = true; // -12 Penalty[cite: 1]
      } else if (sslyzeLower.includes('tls 1.0') || sslyzeLower.includes('tls 1.1') || sslyzeLower.includes('weak')) {
        mediumCount += 1;
        hasA04Vulnerability = true; // -12 Penalty[cite: 1]
      } else {
        isSslValid = true; // SSL สมบูรณ์
      }
    }

    // --- 3. วิเคราะห์ Security Headers ---
    if (headerResult.success && headerResult.missingHeaders.length > 0) {
      hasA02Vulnerability = true;
      if (headerResult.missingHeaders.length >= 3) mediumCount += 1; else lowCount += 1;
    }

    // --- 4. วิเคราะห์ OWASP ZAP Alerts ---[cite: 1]
    let zapAlertsSummary = [];
    if (zapRes.success && zapRes.data) {
      const alerts = zapRes.data.site?.[0]?.alerts || [];
      alerts.forEach(alert => {
        const risk = alert.riskcode;
        const nameLower = alert.name.toLowerCase();
        zapAlertsSummary.push({ name: alert.name, risk: alert.riskdesc });

        // แยกหมวดหมู่ตาม OWASP 2025 ในเอกสาร[cite: 1]
        if (nameLower.includes('access control') || nameLower.includes('ssrf') || nameLower.includes('idor')) {
          hasA01Vulnerability = true; // A01: Auto-fail F[cite: 1]
        }
        if (nameLower.includes('sql') || nameLower.includes('xss') || nameLower.includes('command injection')) {
          hasA05Vulnerability = true; // A05: Injection (-25)[cite: 1]
        }
        if (nameLower.includes('authentication') || nameLower.includes('session')) {
          hasA07Vulnerability = true; // A07: Auth Failures (-20)[cite: 1]
        }
        if (nameLower.includes('outdated') || nameLower.includes('library') || nameLower.includes('vulnerable component')) {
          hasA03Vulnerability = true; // A03: Supply Chain (-15)[cite: 1]
        }
        if (nameLower.includes('stack trace') || nameLower.includes('error handling') || nameLower.includes('exception')) {
          hasA10Vulnerability = true; // A10: Exception Leak (-8)[cite: 1]
        }

        // สะสมระดับความรุนแรง (CVSS Severity Count)[cite: 1]
        if (risk === '3') criticalCount += 1;
        else if (risk === '2') highCount += 1;
        else if (risk === '1') mediumCount += 1;
        else lowCount += 1;
      });
    }

    // 🧮 5. SCORING FORMULA (ตามเอกสาร 3 มิติ)[cite: 1]

    // มิติที่ 1: Base Score Deduction (หักครั้งเดียวต่อระดับความรุนแรง ไม่คูณตามจำนวนที่เจอ)
    const minusCritical = criticalCount > 0 ? 30 : 0; // เจอ critical กี่ตัวก็หักแค่ -30
    const minusHigh = highCount > 0 ? 15 : 0;         // เจอ high กี่ตัวก็หักแค่ -15
    const minusMedium = mediumCount > 0 ? 7 : 0;      // เจอ medium กี่ตัวก็หักแค่ -7
    const minusLow = lowCount > 0 ? 3 : 0;            // เจอ low กี่ตัวก็หักแค่ -3

    const totalBaseDeduction = minusCritical + minusHigh + minusMedium + minusLow;
    const baseScore = Math.max(0, 100 - totalBaseDeduction); //[cite: 1]

    // มิติที่ 2: Category Penalty[cite: 1]
    let totalPenalty = 0;
    let isAutoFail = false;

    if (hasA01Vulnerability) isAutoFail = true;          // A01 Broken Access Control -> F[cite: 1]
    if (hasA05Vulnerability) totalPenalty += 25;         // A05 Injection -> -25[cite: 1]
    if (hasA07Vulnerability) totalPenalty += 20;         // A07 Authentication Failures -> -20[cite: 1]
    if (hasA03Vulnerability) totalPenalty += 15;         // A03 Supply Chain Failures -> -15[cite: 1]
    if (hasA04Vulnerability) totalPenalty += 12;         // A04 Cryptographic Failures -> -12[cite: 1]
    if (hasA10Vulnerability) totalPenalty += 8;          // A10 Exception Handling -> -8[cite: 1]

    const categoryScore = Math.max(0, baseScore - totalPenalty); //[cite: 1]

    // มิติที่ 3: Bonus Points (สูงสุดรวมไม่เกิน +15)[cite: 1]
    let bonusPoints = 0;
    if (url.startsWith('https') && isSslValid) bonusPoints += 5; // +5 HTTPS/SSL ผ่านทุก Check[cite: 1]
    if (headerResult.missingHeaders.length === 0) bonusPoints += 5; // +5 Security Headers ครบ[cite: 1]
    if (riskyPortsFound.length === 0 && totalOpenPorts <= 2) bonusPoints += 3; // +3 ไม่มีพอร์ตไม่จำเป็น[cite: 1]
    if (headerResult.isBannerHidden) bonusPoints += 2; // +2 ซ่อน Server Banner[cite: 1]

    // คะแนนสรุปสุดท้าย (Final Score)[cite: 1]
    const finalScore = isAutoFail ? 0 : Math.min(100, categoryScore + bonusPoints); //[cite: 1]
    const grade = calculateGrade(finalScore, isAutoFail); //[cite: 1]

    const owaspMapping = {
      summary: { 
        finalScore, 
        grade, 
        baseScore, 
        totalBaseDeduction,
        totalPenalty, 
        bonusPoints, 
        isAutoFail 
      },
      vulnerabilities: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
      details: {
        open_ports_detected: totalOpenPorts, 
        risky_ports: riskyPortsFound, 
        is_nmap_success: !isNmapError, 
        is_sslyze_success: !isSSLyzeError, 
        is_zap_success: zapRes.success,
        missing_security_headers: headerResult.missingHeaders,
        zap_alerts: zapAlertsSummary,
        A01: hasA01Vulnerability ? 'พบความเสี่ยงร้ายแรง (Auto-fail F)' : 'ปลอดภัย',
        A02: hasA02Vulnerability ? `พบการเปิดพอร์ต/ตั้งค่าเสี่ยง (${totalOpenPorts} พอร์ต)` : 'ปลอดภัย',
        A03: hasA03Vulnerability ? 'พบซอฟต์แวร์/ไลบรารีล้าสมัย (Supply Chain Risk)' : 'ปลอดภัย',
        A04: hasA04Vulnerability ? 'พบปัญหาการเข้ารหัส SSL/TLS' : 'ปลอดภัย',
        A05: hasA05Vulnerability ? 'พบช่องโหว่ Injection (SQL/XSS/Command)' : 'ปลอดภัย',
        A07: hasA07Vulnerability ? 'พบจุดเสี่ยงระบบยืนยันตัวตน' : 'ปลอดภัย',
        A10: hasA10Vulnerability ? 'พบข้อความ Error/Stack Trace หลุดออกมา' : 'ปลอดภัย'
      }
    };

    await db.execute(
      `UPDATE scan_results SET status = 'completed', nmap_raw_output = ?, sslyze_raw_output = ?, zap_raw_output = ?, owasp_mapping = ? WHERE id = ?`,
      [nmapOutput, sslyzeOutput, zapRes.rawOutput || JSON.stringify(zapAlertsSummary), JSON.stringify(owaspMapping), scanId]
    );
    console.log(`[Scan #${scanId}] เสร็จสิ้นสมบูรณ์ คะแนนสุทธิ: ${finalScore} | เกรด: [${grade}]`);

  } catch (error) {
    console.error('Scan Process Error:', error);
    if (scanId) { try { await db.execute(`UPDATE scan_results SET status = 'failed' WHERE id = ?`, [scanId]); } catch (e) {} }
  }
};

// 🎯 ฟังก์ชันสำหรับสแกนสาธารณะโดยเฉพาะ
exports.publicScan = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'กรุณาระบุ URL ที่ต้องการสแกน' });
    const targetDomain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0];
    if (!isValidDomain(targetDomain)) return res.status(400).json({ message: 'รูปแบบ URL ไม่ถูกต้อง' });

    console.log(`[Public Scan] เป้าหมาย: ${targetDomain}`);
    const nmapOutput = await runCommand('nmap', ['-Pn', '-F', '-sV', targetDomain], 90000);
    const sslyzeOutput = await runCommand('python', ['-m', 'sslyze', '--json_out', '-', targetDomain], 120000);
    const headerResult = await checkSecurityHeaders(url);

    let criticalCount = 0; let highCount = 0; let mediumCount = 0; let lowCount = 0;
    let hasA02Vulnerability = false; let hasA04Vulnerability = false; let hasA05Vulnerability = false;

    const nmapLower = nmapOutput.toLowerCase();
    const sslyzeLower = sslyzeOutput.toLowerCase();

    const isNmapError = nmapLower.includes('command_error') || nmapLower.includes('not recognized');
    let totalOpenPorts = 0; let riskyPortsFound = [];
    const HIGH_RISK_PORTS = ['21', '23', '3389', '445', '135', '139'];

    if (!isNmapError) {
      const openPortLines = nmapOutput.match(/(\d+)\/tcp\s+open[^\n]*/g) || [];
      totalOpenPorts = openPortLines.length;
      openPortLines.forEach((line) => {
        const portMatch = line.match(/^(\d+)\/tcp/);
        if (portMatch && HIGH_RISK_PORTS.includes(portMatch[1])) riskyPortsFound.push(portMatch[1]);
      });
    }

    const hasIgnoredStates = nmapLower.includes('ignored states') || nmapLower.includes('all 100 scanned ports');
    if (totalOpenPorts === 0 && (hasIgnoredStates || nmapLower.includes('host seems down'))) {
      return res.json({
        success: false,
        status: 'failed',
        message: 'ไม่สามารถสแกนได้เนื่องจากโฮสต์ปลายทางบล็อกการเข้าถึงพอร์ต (Firewall Blocked)'
      });
    }

    if (riskyPortsFound.length > 0) { highCount += 1; hasA02Vulnerability = true; }
    else if (totalOpenPorts > 0) {
      hasA02Vulnerability = true;
      if (totalOpenPorts > 3) mediumCount += 1; else lowCount += 1;
    }

    const isSSLyzeError = sslyzeLower.includes('command_error') || sslyzeLower.includes('unrecognized arguments');
    let sslyzeParsed = null;
    if (!isSSLyzeError) { try { sslyzeParsed = JSON.parse(sslyzeOutput); } catch (e) { sslyzeParsed = null; } }
    if (!isSSLyzeError && sslyzeParsed) {
      try {
        const serverResult = sslyzeParsed.server_scan_results?.[0];
        if (!serverResult || sslyzeOutput.length < 150) { highCount += 1; hasA04Vulnerability = true; }
        else {
          const commands = serverResult.scan_result || {};
          const hasExpired = commands.certificate_info?.result?.certificate_deployments?.some(dep => dep.path_validation_results?.some(pv => !pv.was_validation_successful));
          if (hasExpired) { highCount += 1; hasA04Vulnerability = true; }
        }
      } catch (e) {}
    }

    if (headerResult.success && headerResult.missingHeaders.length > 0) {
      hasA05Vulnerability = true;
      if (headerResult.missingHeaders.length >= 3) mediumCount += 1; else lowCount += 1;
    }

    // หักคะแนนครั้งเดียวต่อระดับความรุนแรง (ไม่คูณตามจำนวนที่เจอ) ให้สอดคล้องกับ startScan
    const minusCritical = criticalCount > 0 ? 30 : 0;
    const minusHigh = highCount > 0 ? 15 : 0;
    const minusMedium = mediumCount > 0 ? 7 : 0;
    const minusLow = lowCount > 0 ? 3 : 0;

    const baseScore = Math.max(0, 100 - (minusCritical + minusHigh + minusMedium + minusLow));
    const finalScore = Math.min(100, Math.max(0, baseScore - (hasA04Vulnerability?12:0) - (hasA05Vulnerability?25:0)));
    const grade = calculateGrade(finalScore);

    res.json({
      success: true,
      status: 'completed',
      targetUrl: url,
      data: {
        summary: { finalScore, grade },
        details: {
          A02: hasA02Vulnerability ? `พบพอร์ตเปิด ${totalOpenPorts}` : 'ปลอดภัย',
          A04: hasA04Vulnerability ? 'พบปัญหา SSL/TLS' : 'ปลอดภัย'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// 🎯 ฟังก์ชันส่องสเตตัส
exports.getScanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT status, target_url, owasp_mapping, nmap_raw_output, sslyze_raw_output, zap_raw_output FROM scan_results WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
    let parsedData = rows[0].owasp_mapping;
    if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);
    res.json({ 
      success: true, 
      status: rows[0].status, 
      targetUrl: rows[0].target_url, 
      data: parsedData, 
      rawOutputs: { 
        nmap: rows[0].nmap_raw_output, 
        sslyze: rows[0].sslyze_raw_output,
        zap: rows[0].zap_raw_output
      } 
    });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

// 🎯 ดึงประวัติการสแกนเฉพาะของผู้ใช้งานที่ล็อกอินอยู่
exports.getScanHistory = async (req, res) => {
  try {
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนครับนาย' });
    const [rows] = await db.execute('SELECT id, target_url, status, created_at, owasp_mapping FROM scan_results WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const historyData = rows.map(row => {
      let parsedMapping = row.owasp_mapping;
      if (typeof parsedMapping === 'string') { try { parsedMapping = JSON.parse(parsedMapping); } catch(e){} }
      return { id: row.id, targetUrl: row.target_url, status: row.status, createdAt: row.created_at, grade: parsedMapping?.summary?.grade || 'N/A', score: parsedMapping?.summary?.finalScore || 0 };
    });
    res.json({ success: true, data: historyData });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

// 📊 ดึงข้อมูลสถิติภาพรวมเพื่อแสดงผลบน Dashboard หน้าแรก
exports.getDashboardStats = async (req, res) => {
  try {
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนครับนาย' });
    const [scans] = await db.execute('SELECT status, owasp_mapping FROM scan_results WHERE user_id = ?', [userId]);
    let totalScans = scans.length, completedScans = 0, failedScans = 0, safeCount = 0, riskyCount = 0;
    let vulnStats = { critical: 0, high: 0, medium: 0, low: 0 };
    let gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    scans.forEach(scan => {
      if (scan.status === 'completed') {
        completedScans++;
        let mapping = scan.owasp_mapping;
        if (typeof mapping === 'string') { try { mapping = JSON.parse(mapping); } catch(e){} }
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

// 🆚 ดึงข้อมูลผลการสแกน 2 รายการเพื่อนำมาเปรียบเทียบกัน
exports.compareScans = async (req, res) => {
  try {
    const { id1, id2 } = req.query;
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนครับนาย' });
    if (!id1 || !id2) return res.status(400).json({ message: 'กรุณาระบุไอดีให้ครบ' });
    const [rows] = await db.execute('SELECT id, target_url, status, created_at, owasp_mapping FROM scan_results WHERE id IN (?, ?) AND user_id = ?', [id1, id2, userId]);
    if (rows.length < 2) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
    const formatData = (row) => {
      let mapping = row.owasp_mapping;
      if (typeof mapping === 'string') mapping = JSON.parse(mapping);
      return { id: row.id, targetUrl: row.target_url, status: row.status, createdAt: row.created_at, summary: mapping?.summary || { finalScore: 0, grade: 'F' }, vulnerabilities: mapping?.vulnerabilities || { critical: 0, high: 0, medium: 0, low: 0 }, details: mapping?.details || {} };
    };
    res.json({ success: true, data: { item1: formatData(rows.find(r => r.id == id1)), item2: formatData(rows.find(r => r.id == id2)) } });
  } catch (error) { res.status(500).json({ message: 'เกิดข้อผิดพลาด' }); }
};

// 🌐 ระบบจัดการเว็บไซต์ของฉัน (My Websites)
exports.getMyWebsites = async (req, res) => {
  try {
    const activeUser = req.user || req.userData || req.user_info || req.auth;
    const userId = activeUser ? (activeUser.id || activeUser.userId || activeUser._id || activeUser.memberId) : null;
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนครับนาย' });
    const [rows] = await db.execute(`SELECT uw.id, uw.website_name, uw.website_url, uw.created_at, sr.id AS last_scan_id, sr.owasp_mapping, sr.status AS scan_status FROM user_websites uw LEFT JOIN scan_results sr ON sr.id = (SELECT id FROM scan_results WHERE user_id = ? AND target_url LIKE CONCAT('%', uw.website_url, '%') AND status = 'completed' ORDER BY created_at DESC LIMIT 1) WHERE uw.user_id = ? ORDER BY uw.created_at DESC`, [userId, userId]);
    const formattedWebsites = rows.map(row => {
      let parsedMapping = row.owasp_mapping;
      if (typeof parsedMapping === 'string') { try { parsedMapping = JSON.parse(parsedMapping); } catch(e){} }
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
    if (!userId) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนครับนาย' });
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