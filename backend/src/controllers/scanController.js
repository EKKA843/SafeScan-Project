const { execFile } = require('child_process');
const db = require('../config/db');

// 🪄 ฟังก์ชันสำหรับตัดเกรด A-F ตามช่วงคะแนน มทส.
const calculateGrade = (score) => {
  if (score >= 90) return 'A'; // ปลอดภัย - ผ่านมาตรฐาน OWASP 2025
  if (score >= 70) return 'B'; // พอใช้ได้ - มีจุดเล็กน้อยที่ควรแก้ไข
  if (score >= 50) return 'C'; // ควรแก้ไข - มีความเสี่ยงที่ชัดเจน
  if (score >= 30) return 'D'; // เสี่ยงสูง - ต้องเร่งแก้ไขโดยด่วน
  return 'F';                  // อันตราย - ห้ามใช้งานใน Production
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

// 🌐 เช็ค HTTP Security Headers เบื้องต้น (ช่วยครอบคลุม A05: Security Misconfiguration)
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

    return { success: true, missingHeaders: missing, statusCode: response.status };
  } catch (err) {
    return { success: false, error: err.message, missingHeaders: [] };
  }
};

exports.startScan = async (req, res) => {
  let scanId;
  try {
    const { url } = req.body;
    
    // 🔍 1. ส่องโครงสร้างเพื่อหาพิกัดตัวแปรใน Console หลังบ้านอย่างละเอียด
    console.log("=== [DEBUG] ส่องหาตำแหน่งข้อมูลผู้ใช้งานจากตรรกะ Middleware ===");
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

    // 3. บันทึกคิวเริ่มต้นใน MySQL ดึงไอดีที่ถูกต้องไปลงตาราง
    const [result] = await db.execute(
      'INSERT INTO scan_results (user_id, target_url, status) VALUES (?, ?, ?)',
      [userId, url, 'scanning']
    );
    scanId = result.insertId;

    res.json({ success: true, message: 'ระบบกำลังเริ่มสแกนช่องโหว่เบื้องหลัง...', scanId });

    // 4. 🚀 Run Tools 
    console.log(`[Scan #${scanId}] เริ่มต้นสแกนเป้าหมาย: ${targetDomain}`);
    const nmapOutput = await runCommand('nmap', ['-Pn', '-F', '-sV', targetDomain], 90000);
    const sslyzeOutput = await runCommand('python', ['-m', 'sslyze', '--json_out', '-', targetDomain], 120000);
    const headerResult = await checkSecurityHeaders(url);
    const zapOutput = "ZAP Scan Result Dummy (รอการคอนฟิกเพิ่มเติม)";

    // 🧠 5. ADVANCED PARSER ENGINE
    let criticalCount = 0; let highCount = 0; let mediumCount = 0; let lowCount = 0;
    let hasA02Vulnerability = false; let hasA04Vulnerability = false; let hasA05Vulnerability = false;

    const nmapLower = nmapOutput.toLowerCase();
    const sslyzeLower = sslyzeOutput.toLowerCase(); 

    // --- 🔍 5.1 แกะวิเคราะห์ Nmap หาจำนวนพอร์ตเปิดจริงก่อนเป็นอันดับแรก ---
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

    // --- 🚨 5.2 ตรวจจับ BLOCK FIREWALL ตัวจริง (ต้องไม่มีพอร์ตเปิดเลย และพบ Keyword บล็อก) ---
    const hasIgnoredStates = nmapLower.includes('ignored states') || nmapLower.includes('all 100 scanned ports');
    const isHostDown = nmapLower.includes('host seems down') || nmapLower.includes('0 hosts up');

    if (totalOpenPorts === 0 && (hasIgnoredStates || isHostDown)) {
      console.log(`[Scan #${scanId}] 🚫 สแกนไม่สำเร็จแบบ 100%: ปลายทางปิดกั้นระบบ`);
      
      const owaspMapping = {
        summary: { 
          finalScore: 0, 
          grade: 'N/A', 
          error_reason: hasIgnoredStates 
            ? 'ไม่สามารถตรวจสอบพอร์ตได้เนื่องจาก Firewall (เช่น Cloudflare, AWS WAF) ของเว็บไซต์ปลายทางปิดกั้นไอพีสแกนเนอร์โดยสมบูรณ์ (100 Filtered Ports)' 
            : 'การเชื่อมต่อขัดข้อง: โฮสต์ปลายทางอาจปิดอยู่ หรือบล็อกแพ็กเก็ตตรวจสอบการเชื่อมต่ออย่างสมบูรณ์'
        },
        vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
        details: {
          open_ports_detected: 0, risky_ports: [], is_nmap_success: false, is_sslyze_success: false, missing_security_headers: [],
          A02: 'ล้มเหลว: โดน Firewall บล็อก', A04: 'ไม่สามารถระบุได้', A05: 'ไม่สามารถระบุได้'
        }
      };

      await db.execute(
        `UPDATE scan_results SET status = 'failed', nmap_raw_output = ?, sslyze_raw_output = ?, zap_raw_output = ?, owasp_mapping = ? WHERE id = ?`,
        [nmapOutput, sslyzeOutput, zapOutput, JSON.stringify(owaspMapping), scanId]
      );
      return; 
    }

    // --- 🔍 5.3 ประมวลผลคะแนน Nmap ต่อ (กรณีที่มีพอร์ตเปิดปกติ) ---
    if (riskyPortsFound.length > 0) {
      highCount += 1;
      hasA02Vulnerability = true;
    } else if (totalOpenPorts > 0) {
      hasA02Vulnerability = true;
      if (totalOpenPorts > 3) mediumCount += 1; else lowCount += 1;
    }

    // --- 🔍 วิเคราะห์ประมวลผลฝั่ง SSLyze ---
    const isSSLyzeError = sslyzeLower.includes('command_error') || sslyzeLower.includes('unrecognized arguments');
    let sslyzeParsed = null;
    if (!isSSLyzeError) { try { sslyzeParsed = JSON.parse(sslyzeOutput); } catch (e) { sslyzeParsed = null; } }

    if (!isSSLyzeError && sslyzeParsed) {
      try {
        const serverResult = sslyzeParsed.server_scan_results?.[0];
        const connError = serverResult?.connectivity_error_trigger || serverResult?.scan_status;
        if (!serverResult || connError === 'ERROR' || sslyzeOutput.length < 150) {
          highCount += 1; hasA04Vulnerability = true;
        } else {
          const commands = serverResult.scan_result || {};
          const certInfo = commands.certificate_info?.result;
          const deployments = certInfo?.certificate_deployments || [];
          const hasExpiredOrUntrusted = deployments.some(dep => dep.path_validation_results?.some(pv => !pv.was_validation_successful));
          if (hasExpiredOrUntrusted) { highCount += 1; hasA04Vulnerability = true; }
          const weakProtocols = ['ssl_2_0_cipher_suites', 'ssl_3_0_cipher_suites', 'tls_1_0_cipher_suites', 'tls_1_1_cipher_suites'];
          const hasWeakProtocol = weakProtocols.some(proto => commands[proto]?.result?.accepted_cipher_suites?.length > 0);
          if (hasWeakProtocol) { mediumCount += 1; hasA04Vulnerability = true; }
        }
      } catch (parseErr) { console.log(`[Scan #${scanId}] SSLyze JSON structure error`); }
    } else if (!isSSLyzeError) {
      if (sslyzeLower.includes('could not connect') || sslyzeLower.includes('rejected') || sslyzeLower.length < 150) { highCount += 1; hasA04Vulnerability = true; }
      else if (sslyzeLower.includes('vulnerable') || sslyzeLower.includes('any_vulnerability_found')) { criticalCount += 1; hasA04Vulnerability = true; }
      else if (sslyzeLower.includes('expired') || sslyzeLower.includes('not trusted') || sslyzeLower.includes('failed - certificate')) { highCount += 1; hasA04Vulnerability = true; }
      else if (sslyzeLower.includes('failed') || sslyzeLower.includes('tls versions') || sslyzeLower.includes('weak')) { mediumCount += 1; hasA04Vulnerability = true; }
    }

    // --- 🔍 วิเคราะห์ HTTP Security Headers ---
    if (headerResult.success && headerResult.missingHeaders.length > 0) {
      hasA05Vulnerability = true;
      if (headerResult.missingHeaders.length >= 3) mediumCount += 1; else lowCount += 1;
    }

    // คำนวณ Base Score & Penalty
    const minusCritical = Math.min(90, criticalCount * 30); 
    const minusHigh = Math.min(60, highCount * 15);         
    const minusMedium = Math.min(35, mediumCount * 7);       
    const minusLow = Math.min(15, lowCount * 3);             
    const baseScore = Math.max(0, 100 - (minusCritical + minusHigh + minusMedium + minusLow)); 

    let totalPenalty = 0;
    if (hasA04Vulnerability) totalPenalty += 12; 
    if (hasA05Vulnerability) totalPenalty += 8;  

    const finalScore = Math.min(100, Math.max(0, baseScore - totalPenalty));
    const grade = calculateGrade(finalScore);

    const owaspMapping = {
      summary: { finalScore, grade, baseScore, totalPenalty},
      vulnerabilities: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
      details: {
        open_ports_detected: totalOpenPorts, risky_ports: riskyPortsFound, is_nmap_success: !isNmapError, is_sslyze_success: !isSSLyzeError, missing_security_headers: headerResult.missingHeaders,
        A02: isNmapError ? 'ขัดข้อง' : (hasA02Vulnerability ? `พบการเปิดพอร์ต ${totalOpenPorts} พอร์ต` : 'ปลอดภัย'),
        A04: hasA04Vulnerability ? 'พบปัญหาการเข้ารหัส SSL/TLS' : 'ปลอดภัย',
        A05: hasA05Vulnerability ? `ขาด Headers: ${headerResult.missingHeaders.join(', ')}` : 'ปลอดภัย'
      }
    };

    await db.execute(
      `UPDATE scan_results SET status = 'completed', nmap_raw_output = ?, sslyze_raw_output = ?, zap_raw_output = ?, owasp_mapping = ? WHERE id = ?`,
      [nmapOutput, sslyzeOutput, zapOutput, JSON.stringify(owaspMapping), scanId]
    );
    console.log(`[Scan #${scanId}] เสร็จสิ้น คะแนน: ${finalScore} | [${grade}]`);

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

    // --- วิเคราะห์ Nmap ---
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

    // 🚨 ดักจับตัวบล็อกของฝั่ง Public Scan
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

    // --- วิเคราะห์ SSLyze ---
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

    const baseScore = Math.max(0, 100 - (criticalCount*30 + highCount*15 + mediumCount*7 + lowCount*3));
    const finalScore = Math.min(100, Math.max(0, baseScore - (hasA04Vulnerability?12:0) - (hasA05Vulnerability?8:0)));
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

// 🎯 ฟังก์ชันส่องสเตตัสเวอร์ชันเคลียร์บั๊ก [object Object]
exports.getScanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT status, target_url, owasp_mapping, nmap_raw_output, sslyze_raw_output FROM scan_results WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบข้อมูล' });
    let parsedData = rows[0].owasp_mapping;
    if (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);
    res.json({ success: true, status: rows[0].status, targetUrl: rows[0].target_url, data: parsedData, rawOutputs: { nmap: rows[0].nmap_raw_output, sslyze: rows[0].sslyze_raw_output } });
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