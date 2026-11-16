async function test() {
  // Login as driver
  const driverLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver.ramesh@university.edu', password: 'Driver@123' })
  });
  const driverData = await driverLogin.json();
  const token = driverData.token;

  // Validate active pass
  const qrRes = await fetch('http://localhost:5000/api/passes/validate-qr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ passId: 'PASS-2026-0001' })
  });
  const qrData = await qrRes.json();
  console.log(`[QR PASS TEST] Valid=${qrData.isValid}, Status=${qrData.validationStatus}, Student=${qrData.details?.studentName}, Enrolment=${qrData.details?.enrolmentNo}`);

  // Test expired pass
  const expRes = await fetch('http://localhost:5000/api/passes/validate-qr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ passId: 'PASS-2026-0013' })
  });
  const expData = await expRes.json();
  console.log(`[EXPIRED PASS TEST] Valid=${expData.isValid}, Status=${expData.validationStatus}, Message=${expData.message}`);

  // Test non-existent pass
  const fakeRes = await fetch('http://localhost:5000/api/passes/validate-qr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ passId: 'PASS-9999-FAKE' })
  });
  const fakeData = await fakeRes.json();
  console.log(`[INVALID PASS TEST] Valid=${fakeData.isValid}, Status=${fakeData.validationStatus}`);

  // Test Admin report
  const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@university.edu', password: 'Admin@123' })
  });
  const adminData = await adminLogin.json();
  const adminToken = adminData.token;

  const repRes = await fetch('http://localhost:5000/api/reports/pass-issuance', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const repData = await repRes.json();
  console.log(`[REPORT 1: PASS ISSUANCE] Count=${repData.count}, ReportName='${repData.reportName}'`);

  const rep2Res = await fetch('http://localhost:5000/api/reports/route-passengers', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const rep2Data = await rep2Res.json();
  console.log(`[REPORT 2: ROUTE PASSENGERS] Routes=${rep2Data.count}, Route1SeatsAvail=${rep2Data.data[0]?.availableSeats}`);

  const rep3Res = await fetch('http://localhost:5000/api/reports/renewal-due', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const rep3Data = await rep3Res.json();
  console.log(`[REPORT 3: RENEWAL DUE] DueCount=${rep3Data.count}`);

  const rep4Res = await fetch('http://localhost:5000/api/reports/fee-collection', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const rep4Data = await rep4Res.json();
  console.log(`[REPORT 4: FEE COLLECTION] TotalFee=${rep4Data.summary?.totalFeeAmount}, Paid=${rep4Data.summary?.totalPaidAmount}`);
}

test();
