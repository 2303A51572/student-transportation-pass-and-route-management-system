const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Student = require('../models/Student');
const Driver = require('../models/Driver');
const TransportManager = require('../models/TransportManager');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const TransportationApplication = require('../models/TransportationApplication');
const TransportationPass = require('../models/TransportationPass');
const Payment = require('../models/Payment');
const Renewal = require('../models/Renewal');
const Notification = require('../models/Notification');
const Trip = require('../models/Trip');

const runSeed = async () => {
  try {
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Driver.deleteMany({}),
      TransportManager.deleteMany({}),
      Bus.deleteMany({}),
      Route.deleteMany({}),
      Stop.deleteMany({}),
      TransportationApplication.deleteMany({}),
      TransportationPass.deleteMany({}),
      Payment.deleteMany({}),
      Renewal.deleteMany({}),
      Notification.deleteMany({}),
      Trip.deleteMany({})
    ]);

    console.log('[Seed] 1. Creating Admin User...');
    const adminUser = await User.create({
      name: 'Dr. K. Srinivas Rao (Transport Dean)',
      email: 'admin@university.edu',
      password: 'Admin@123',
      role: 'ADMIN',
      phone: '+91 98480 11223',
      isActive: true
    });

    console.log('[Seed] 2. Creating Transport Manager...');
    const managerUser = await User.create({
      name: 'M. Raghunath Verma',
      email: 'manager@university.edu',
      password: 'Manager@123',
      role: 'TRANSPORT_MANAGER',
      phone: '+91 98480 22334',
      isActive: true
    });

    const manager = await TransportManager.create({
      user: managerUser._id,
      managerName: 'M. Raghunath Verma',
      employeeId: 'TM-2024-001',
      department: 'Logistics and Fleet Operations',
      phone: '+91 98480 22334'
    });

    console.log('[Seed] 3. Creating 3 Drivers...');
    const driverData = [
      { name: 'S. Ramesh Kumar', email: 'driver.ramesh@university.edu', phone: '+91 98480 33441', license: 'DL-04-2015-00192', exp: 8 },
      { name: 'G. Venkat Reddy', email: 'driver.venkat@university.edu', phone: '+91 98480 33442', license: 'DL-04-2017-00438', exp: 6 },
      { name: 'P. Krishna Moorthy', email: 'driver.krishna@university.edu', phone: '+91 98480 33443', license: 'DL-04-2012-00711', exp: 12 }
    ];

    const drivers = [];
    for (const d of driverData) {
      const u = await User.create({
        name: d.name,
        email: d.email,
        password: 'Driver@123',
        role: 'DRIVER',
        phone: d.phone,
        isActive: true
      });
      const drv = await Driver.create({
        user: u._id,
        driverName: d.name,
        licenseNumber: d.license,
        phone: d.phone,
        experienceYears: d.exp,
        status: 'ACTIVE'
      });
      drivers.push(drv);
    }

    console.log('[Seed] 4. Creating 5 Transportation Routes with Multiple Stops...');
    const routesData = [
      {
        routeName: 'Route 1: Central Station to Campus Express',
        routeCode: 'RT-01',
        startPoint: 'Central Railway Station',
        endPoint: 'University Main Gate',
        distanceKm: 28,
        estimatedDurationMin: 50,
        morningStartTime: '07:15 AM',
        eveningReturnTime: '04:45 PM',
        stops: [
          { stopName: 'Central Railway Station', stopOrder: 1, morningPickupTime: '07:15 AM', eveningDropTime: '05:40 PM', landmark: 'Platform 1 Gate', farePerSemester: 12000 },
          { stopName: 'City Bus Terminal', stopOrder: 2, morningPickupTime: '07:25 AM', eveningDropTime: '05:30 PM', landmark: 'Clock Tower Bay 4', farePerSemester: 12000 },
          { stopName: 'Metro Junction Circle', stopOrder: 3, morningPickupTime: '07:38 AM', eveningDropTime: '05:15 PM', landmark: 'Opposite State Bank', farePerSemester: 11000 },
          { stopName: 'Cyber Towers Flyover', stopOrder: 4, morningPickupTime: '07:50 AM', eveningDropTime: '05:00 PM', landmark: 'Underpass Pillar 28', farePerSemester: 10000 },
          { stopName: 'University Main Gate', stopOrder: 5, morningPickupTime: '08:10 AM', eveningDropTime: '04:45 PM', landmark: 'Administrative Block', farePerSemester: 10000 }
        ]
      },
      {
        routeName: 'Route 2: Green Hills to Tech Park Campus',
        routeCode: 'RT-02',
        startPoint: 'Green Hills Colony',
        endPoint: 'Engineering Block 3',
        distanceKm: 24,
        estimatedDurationMin: 45,
        morningStartTime: '07:25 AM',
        eveningReturnTime: '04:50 PM',
        stops: [
          { stopName: 'Green Hills Main Arch', stopOrder: 1, morningPickupTime: '07:25 AM', eveningDropTime: '05:35 PM', landmark: 'Community Hall', farePerSemester: 12000 },
          { stopName: 'Botanical Garden Cross', stopOrder: 2, morningPickupTime: '07:35 AM', eveningDropTime: '05:25 PM', landmark: 'Forest Office Junction', farePerSemester: 11500 },
          { stopName: 'Kondapur Signal', stopOrder: 3, morningPickupTime: '07:45 AM', eveningDropTime: '05:15 PM', landmark: 'Near Reliance Fresh', farePerSemester: 11000 },
          { stopName: 'Gachibowli Stadium Road', stopOrder: 4, morningPickupTime: '07:55 AM', eveningDropTime: '05:05 PM', landmark: 'Gate No. 3', farePerSemester: 10000 },
          { stopName: 'Engineering Block 3', stopOrder: 5, morningPickupTime: '08:15 AM', eveningDropTime: '04:50 PM', landmark: 'West Campus Porch', farePerSemester: 10000 }
        ]
      },
      {
        routeName: 'Route 3: Old City & Charminar Shuttle',
        routeCode: 'RT-03',
        startPoint: 'Charminar Bus Depot',
        endPoint: 'University Main Gate',
        distanceKm: 34,
        estimatedDurationMin: 60,
        morningStartTime: '07:00 AM',
        eveningReturnTime: '04:40 PM',
        stops: [
          { stopName: 'Charminar Bus Depot', stopOrder: 1, morningPickupTime: '07:00 AM', eveningDropTime: '05:55 PM', landmark: 'Monument North Bay', farePerSemester: 13500 },
          { stopName: 'Afzal Gunj Circle', stopOrder: 2, morningPickupTime: '07:15 AM', eveningDropTime: '05:40 PM', landmark: 'General Hospital Gate', farePerSemester: 13000 },
          { stopName: 'Koti Women’s College', stopOrder: 3, morningPickupTime: '07:25 AM', eveningDropTime: '05:25 PM', landmark: 'Bus Stand Shade', farePerSemester: 12500 },
          { stopName: 'Chikkadpally Junction', stopOrder: 4, morningPickupTime: '07:40 AM', eveningDropTime: '05:10 PM', landmark: 'City Central Library', farePerSemester: 11500 },
          { stopName: 'University Main Gate', stopOrder: 5, morningPickupTime: '08:05 AM', eveningDropTime: '04:40 PM', landmark: 'Security Booth 1', farePerSemester: 10000 }
        ]
      },
      {
        routeName: 'Route 4: Uppal & Habsiguda Academic Ring',
        routeCode: 'RT-04',
        startPoint: 'Uppal Metro Station',
        endPoint: 'University Main Gate',
        distanceKm: 22,
        estimatedDurationMin: 40,
        morningStartTime: '07:35 AM',
        eveningReturnTime: '04:45 PM',
        stops: [
          { stopName: 'Uppal Metro Station', stopOrder: 1, morningPickupTime: '07:35 AM', eveningDropTime: '05:25 PM', landmark: 'Pillar 142', farePerSemester: 11000 },
          { stopName: 'Survey of India Cross', stopOrder: 2, morningPickupTime: '07:45 AM', eveningDropTime: '05:15 PM', landmark: 'CCMB Main Entrance', farePerSemester: 10500 },
          { stopName: 'Tarnaka Flyover Down', stopOrder: 3, morningPickupTime: '07:55 AM', eveningDropTime: '05:05 PM', landmark: 'Aradhana Theater Lane', farePerSemester: 10000 },
          { stopName: 'University Main Gate', stopOrder: 4, morningPickupTime: '08:15 AM', eveningDropTime: '04:45 PM', landmark: 'Administrative Block', farePerSemester: 10000 }
        ]
      },
      {
        routeName: 'Route 5: Secunderabad Cantonment Connector',
        routeCode: 'RT-05',
        startPoint: 'JBS Jubilee Bus Stand',
        endPoint: 'University Science Complex',
        distanceKm: 26,
        estimatedDurationMin: 48,
        morningStartTime: '07:20 AM',
        eveningReturnTime: '04:45 PM',
        stops: [
          { stopName: 'Jubilee Bus Station (JBS)', stopOrder: 1, morningPickupTime: '07:20 AM', eveningDropTime: '05:35 PM', landmark: 'Counter 6', farePerSemester: 12000 },
          { stopName: 'Marredpally Post Office', stopOrder: 2, morningPickupTime: '07:32 AM', eveningDropTime: '05:22 PM', landmark: 'Nehru Statue', farePerSemester: 11500 },
          { stopName: 'Karkhana Police Station', stopOrder: 3, morningPickupTime: '07:44 AM', eveningDropTime: '05:10 PM', landmark: 'Military Quarters', farePerSemester: 11000 },
          { stopName: 'Trimulgherry X Road', stopOrder: 4, morningPickupTime: '07:55 AM', eveningDropTime: '04:58 PM', landmark: 'Lal Bazar Junction', farePerSemester: 10500 },
          { stopName: 'University Science Complex', stopOrder: 5, morningPickupTime: '08:12 AM', eveningDropTime: '04:45 PM', landmark: 'Bio-Tech Lab Gate', farePerSemester: 10000 }
        ]
      }
    ];

    const routes = [];
    for (const r of routesData) {
      const createdRoute = await Route.create(r);
      routes.push(createdRoute);
      for (const s of r.stops) {
        await Stop.create({
          stopName: s.stopName,
          route: createdRoute._id,
          stopOrder: s.stopOrder,
          morningPickupTime: s.morningPickupTime,
          eveningDropTime: s.eveningDropTime,
          landmark: s.landmark,
          farePerSemester: s.farePerSemester
        });
      }
    }

    console.log('[Seed] 5. Creating 4 University Buses...');
    const busesData = [
      { busNumber: 'BUS-101', registrationNumber: 'TS-09-UB-4021', model: 'Tata Starbus Ultra 40S', capacity: 40, routeIndex: 0, driverIndex: 0 },
      { busNumber: 'BUS-102', registrationNumber: 'TS-09-UB-4022', model: 'Ashok Leyland Sunshine 45S', capacity: 45, routeIndex: 1, driverIndex: 1 },
      { busNumber: 'BUS-103', registrationNumber: 'TS-09-UB-4023', model: 'Eicher Skyline Pro 40S', capacity: 40, routeIndex: 2, driverIndex: 2 },
      { busNumber: 'BUS-104', registrationNumber: 'TS-09-UB-4024', model: 'BharatBenz 1017 City 35S', capacity: 35, routeIndex: 3, driverIndex: null }
    ];

    const buses = [];
    for (const b of busesData) {
      const bus = await Bus.create({
        busNumber: b.busNumber,
        registrationNumber: b.registrationNumber,
        model: b.model,
        capacity: b.capacity,
        availableSeats: b.capacity,
        assignedRoute: routes[b.routeIndex]._id,
        assignedDriver: b.driverIndex !== null ? drivers[b.driverIndex]._id : null,
        status: 'ACTIVE',
        insuranceExpiry: new Date('2027-08-31'),
        fitnessExpiry: new Date('2027-11-15')
      });
      buses.push(bus);

      // Attach back to route and driver
      await Route.findByIdAndUpdate(routes[b.routeIndex]._id, { assignedBus: bus._id });
      if (b.driverIndex !== null) {
        await Driver.findByIdAndUpdate(drivers[b.driverIndex]._id, { assignedBus: bus._id });
      }
    }

    // Attach routes to manager
    await TransportManager.findByIdAndUpdate(manager._id, {
      assignedRoutes: [routes[0]._id, routes[1]._id, routes[2]._id, routes[3]._id, routes[4]._id]
    });

    console.log('[Seed] 6. Creating 20 Sample Students (including ETURI BALAJI 2303A51572)...');
    const studentsMaster = [
      { name: 'ETURI BALAJI', enrolmentNo: '2303A51572', email: 'balaji.eturi@student.university.edu', phone: '+91 98491 55671', dept: 'DevOps & Cloud Systems', year: 'IV Year', sem: 'I Semester', address: 'Flat 402, Sai Balaji Enclave, Metro Junction Circle', routeIdx: 0, stopName: 'Metro Junction Circle' },
      { name: 'Ananya Sharma', enrolmentNo: '2303A51501', email: 'ananya.sharma@student.university.edu', phone: '+91 98491 55001', dept: 'Computer Science and Engineering', year: 'IV Year', sem: 'I Semester', address: 'Plot 12, Green Hills Colony', routeIdx: 1, stopName: 'Green Hills Main Arch' },
      { name: 'B. Karthik Varma', enrolmentNo: '2303A51502', email: 'karthik.varma@student.university.edu', phone: '+91 98491 55002', dept: 'Information Technology', year: 'IV Year', sem: 'I Semester', address: '5-9-102, Central Railway Station Lane', routeIdx: 0, stopName: 'Central Railway Station' },
      { name: 'Ch. Divya Sree', enrolmentNo: '2303A51503', email: 'divya.sree@student.university.edu', phone: '+91 98491 55003', dept: 'Electronics and Communication', year: 'III Year', sem: 'I Semester', address: 'B-14, Botanical Garden Cross', routeIdx: 1, stopName: 'Botanical Garden Cross' },
      { name: 'D. Sai Teja', enrolmentNo: '2303A51504', email: 'sai.teja@student.university.edu', phone: '+91 98491 55004', dept: 'Data Science', year: 'IV Year', sem: 'I Semester', address: '22/B, Charminar Bus Depot Area', routeIdx: 2, stopName: 'Charminar Bus Depot' },
      { name: 'E. Sneha Reddy', enrolmentNo: '2303A51505', email: 'sneha.reddy@student.university.edu', phone: '+91 98491 55005', dept: 'Computer Science and Engineering', year: 'III Year', sem: 'I Semester', address: '8-3-201, City Bus Terminal Road', routeIdx: 0, stopName: 'City Bus Terminal' },
      { name: 'F. Mohammed Imran', enrolmentNo: '2303A51506', email: 'imran.md@student.university.edu', phone: '+91 98491 55006', dept: 'Mechanical Engineering', year: 'IV Year', sem: 'I Semester', address: 'Flat 101, Afzal Gunj Circle', routeIdx: 2, stopName: 'Afzal Gunj Circle' },
      { name: 'G. Harish Chandra', enrolmentNo: '2303A51507', email: 'harish.c@student.university.edu', phone: '+91 98491 55007', dept: 'Civil Engineering', year: 'II Year', sem: 'I Semester', address: 'Uppal Metro Station Pillar 140', routeIdx: 3, stopName: 'Uppal Metro Station' },
      { name: 'H. Pooja Patel', enrolmentNo: '2303A51508', email: 'pooja.patel@student.university.edu', phone: '+91 98491 55008', dept: 'Information Technology', year: 'III Year', sem: 'I Semester', address: 'Jubilee Bus Station Quarters', routeIdx: 4, stopName: 'Jubilee Bus Station (JBS)' },
      { name: 'I. K. Rohit Kumar', enrolmentNo: '2303A51509', email: 'rohit.kumar@student.university.edu', phone: '+91 98491 55009', dept: 'Electronics and Communication', year: 'IV Year', sem: 'I Semester', address: 'Cyber Towers Flyover Colony', routeIdx: 0, stopName: 'Cyber Towers Flyover' },
      { name: 'J. Mounika Rao', enrolmentNo: '2303A51510', email: 'mounika.rao@student.university.edu', phone: '+91 98491 55010', dept: 'Data Science', year: 'II Year', sem: 'I Semester', address: 'Kondapur Signal Heights', routeIdx: 1, stopName: 'Kondapur Signal' },
      { name: 'K. Tharun Goud', enrolmentNo: '2303A51511', email: 'tharun.goud@student.university.edu', phone: '+91 98491 55011', dept: 'Computer Science and Engineering', year: 'I Year', sem: 'I Semester', address: 'Koti Women’s College Road', routeIdx: 2, stopName: 'Koti Women’s College' },
      { name: 'L. Bhavana Nair', enrolmentNo: '2303A51512', email: 'bhavana.nair@student.university.edu', phone: '+91 98491 55012', dept: 'Electrical Engineering', year: 'III Year', sem: 'I Semester', address: 'Survey of India CCMB Gate', routeIdx: 3, stopName: 'Survey of India Cross' },
      { name: 'M. Naveen Yadav', enrolmentNo: '2303A51513', email: 'naveen.yadav@student.university.edu', phone: '+91 98491 55013', dept: 'Mechanical Engineering', year: 'IV Year', sem: 'I Semester', address: 'Marredpally Post Office Lane', routeIdx: 4, stopName: 'Marredpally Post Office' },
      { name: 'N. Sandhya Rani', enrolmentNo: '2303A51514', email: 'sandhya.rani@student.university.edu', phone: '+91 98491 55014', dept: 'Civil Engineering', year: 'III Year', sem: 'I Semester', address: 'Metro Junction Circle Tower 3', routeIdx: 0, stopName: 'Metro Junction Circle' },
      { name: 'O. Vikas Singhania', enrolmentNo: '2303A51515', email: 'vikas.s@student.university.edu', phone: '+91 98491 55015', dept: 'Computer Science and Engineering', year: 'II Year', sem: 'I Semester', address: 'Gachibowli Stadium Road Enclave', routeIdx: 1, stopName: 'Gachibowli Stadium Road' },
      { name: 'P. Aravind Swamy', enrolmentNo: '2303A51516', email: 'aravind.swamy@student.university.edu', phone: '+91 98491 55016', dept: 'Information Technology', year: 'I Year', sem: 'I Semester', address: 'Chikkadpally Junction Library Rd', routeIdx: 2, stopName: 'Chikkadpally Junction' },
      { name: 'Q. Keerthi Suresh', enrolmentNo: '2303A51517', email: 'keerthi.suresh@student.university.edu', phone: '+91 98491 55017', dept: 'Data Science', year: 'IV Year', sem: 'I Semester', address: 'Tarnaka Flyover Down Bus Stop', routeIdx: 3, stopName: 'Tarnaka Flyover Down' },
      { name: 'R. Manoj Bajpayee', enrolmentNo: '2303A51518', email: 'manoj.b@student.university.edu', phone: '+91 98491 55018', dept: 'Electronics and Communication', year: 'II Year', sem: 'I Semester', address: 'Karkhana Police Station Colony', routeIdx: 4, stopName: 'Karkhana Police Station' },
      { name: 'S. Swathi Krishna', enrolmentNo: '2303A51519', email: 'swathi.k@student.university.edu', phone: '+91 98491 55019', dept: 'Computer Science and Engineering', year: 'IV Year', sem: 'I Semester', address: 'Trimulgherry X Road Junction', routeIdx: 4, stopName: 'Trimulgherry X Road' }
    ];

    const students = [];
    for (const sm of studentsMaster) {
      const u = await User.create({
        name: sm.name,
        email: sm.email,
        password: 'Student@123',
        role: 'STUDENT',
        phone: sm.phone,
        isActive: true
      });

      const s = await Student.create({
        user: u._id,
        enrolmentNo: sm.enrolmentNo,
        studentName: sm.name,
        email: sm.email,
        phone: sm.phone,
        department: sm.dept,
        year: sm.year,
        semester: sm.sem,
        address: sm.address,
        guardianName: 'Parent of ' + sm.name.split(' ')[0],
        emergencyContact: sm.phone
      });
      students.push({ doc: s, user: u, meta: sm });
    }

    console.log('[Seed] 7. Creating Applications, Passes (Active & Expired), Payments & Renewals...');

    // Student 0: ETURI BALAJI (Active Pass on Route 1, Bus 101)
    const balaji = students[0];
    const bRoute = routes[0];
    const bBus = buses[0];

    const balajiApp = await TransportationApplication.create({
      student: balaji.doc._id,
      route: bRoute._id,
      stopName: balaji.meta.stopName,
      academicYear: '2026–2027',
      semester: 'I Semester',
      idProofType: 'College ID Card',
      idProofNumber: 'ID-2303A51572',
      status: 'APPROVED',
      assignedBus: bBus._id,
      reviewedBy: adminUser._id,
      reviewedAt: new Date('2026-08-01')
    });

    const balajiValidUntil = new Date('2027-02-28');
    const balajiQr = JSON.stringify({
      passId: 'PASS-2026-0001',
      enrolmentNo: '2303A51572',
      routeCode: bRoute.routeCode,
      busNumber: bBus.busNumber,
      stopName: balaji.meta.stopName,
      validUntil: '2027-02-28',
      signature: crypto.createHash('sha256').update('PASS-2026-0001:2303A51572').digest('hex').substring(0, 16)
    });

    const balajiPass = await TransportationPass.create({
      passId: 'PASS-2026-0001',
      student: balaji.doc._id,
      application: balajiApp._id,
      route: bRoute._id,
      bus: bBus._id,
      stopName: balaji.meta.stopName,
      validFrom: new Date('2026-08-01'),
      validUntil: balajiValidUntil,
      status: 'ACTIVE',
      qrCodeData: balajiQr,
      qrSignature: 'sig-balaji-001',
      issueDate: new Date('2026-08-01')
    });

    await Student.findByIdAndUpdate(balaji.doc._id, { currentPass: balajiPass._id });

    await Payment.create({
      student: balaji.doc._id,
      pass: balajiPass._id,
      transactionId: 'TXN-2026-88001',
      receiptNumber: 'REC-2026-0001',
      amount: 12000,
      paidAmount: 12000,
      pendingAmount: 0,
      paymentDate: new Date('2026-08-01'),
      paymentMethod: 'ONLINE_UPI',
      paymentStatus: 'PAID',
      feeType: 'SEMESTER_TRANSPORT_FEE',
      academicYear: '2026–2027',
      semester: 'I Semester',
      isDemo: true
    });

    await Notification.create({
      recipient: balaji.user._id,
      title: 'Transportation Pass Active',
      message: 'Your official transportation pass PASS-2026-0001 is active for Route 1 (BUS-101). Have a safe journey!',
      type: 'PASS',
      link: '/pass'
    });

    // Create passes for other students: mix of ACTIVE, EXPIRED, PENDING applications, and RENEWALS
    for (let i = 1; i < students.length; i++) {
      const sItem = students[i];
      const assignedRoute = routes[sItem.meta.routeIdx];
      const assignedBus = buses[Math.min(sItem.meta.routeIdx, buses.length - 1)];
      const passNum = (i + 1).toString().padStart(4, '0');
      const passId = `PASS-2026-${passNum}`;

      if (i <= 12) {
        // Active Passes
        const app = await TransportationApplication.create({
          student: sItem.doc._id,
          route: assignedRoute._id,
          stopName: sItem.meta.stopName,
          status: 'APPROVED',
          assignedBus: assignedBus._id,
          idProofType: 'College ID Card',
          idProofNumber: `ID-${sItem.meta.enrolmentNo}`,
          reviewedBy: adminUser._id,
          reviewedAt: new Date('2026-08-02')
        });

        const validUntil = new Date('2027-03-31');
        const qr = JSON.stringify({
          passId,
          enrolmentNo: sItem.meta.enrolmentNo,
          routeCode: assignedRoute.routeCode,
          busNumber: assignedBus.busNumber,
          stopName: sItem.meta.stopName,
          validUntil: '2027-03-31'
        });

        const pass = await TransportationPass.create({
          passId,
          student: sItem.doc._id,
          application: app._id,
          route: assignedRoute._id,
          bus: assignedBus._id,
          stopName: sItem.meta.stopName,
          validFrom: new Date('2026-08-01'),
          validUntil,
          status: 'ACTIVE',
          qrCodeData: qr,
          issueDate: new Date('2026-08-02')
        });

        await Student.findByIdAndUpdate(sItem.doc._id, { currentPass: pass._id });

        await Payment.create({
          student: sItem.doc._id,
          pass: pass._id,
          transactionId: `TXN-2026-880${passNum}`,
          receiptNumber: `REC-2026-00${passNum}`,
          amount: 12000,
          paidAmount: 12000,
          pendingAmount: 0,
          paymentDate: new Date('2026-08-02'),
          paymentMethod: 'ONLINE_UPI',
          paymentStatus: 'PAID',
          feeType: 'SEMESTER_TRANSPORT_FEE',
          academicYear: '2026–2027',
          semester: 'I Semester',
          isDemo: true
        });

        // Add renewal due or renewal request for student 11 & 12
        if (i === 11 || i === 12) {
          await Renewal.create({
            pass: pass._id,
            student: sItem.doc._id,
            previousExpiryDate: validUntil,
            requestedPeriodMonths: 6,
            newExpiryDate: new Date('2027-09-30'),
            renewalFee: 12000,
            paymentStatus: 'PAID',
            status: 'PENDING',
            remarks: 'Semester II continuation request'
          });
          pass.renewalStatus = 'REQUESTED';
          await pass.save();
        }
      } else if (i <= 15) {
        // Expired Passes (to demonstrate Renewal Due Report & Expiration features)
        const app = await TransportationApplication.create({
          student: sItem.doc._id,
          route: assignedRoute._id,
          stopName: sItem.meta.stopName,
          status: 'APPROVED',
          assignedBus: assignedBus._id,
          idProofType: 'Aadhaar Card',
          idProofNumber: '3344-5566-7788',
          reviewedBy: adminUser._id,
          reviewedAt: new Date('2025-08-01')
        });

        const expiredDate = new Date('2026-05-31');
        const qr = JSON.stringify({
          passId,
          enrolmentNo: sItem.meta.enrolmentNo,
          routeCode: assignedRoute.routeCode,
          busNumber: assignedBus.busNumber,
          stopName: sItem.meta.stopName,
          validUntil: '2026-05-31'
        });

        const pass = await TransportationPass.create({
          passId,
          student: sItem.doc._id,
          application: app._id,
          route: assignedRoute._id,
          bus: assignedBus._id,
          stopName: sItem.meta.stopName,
          validFrom: new Date('2025-08-01'),
          validUntil: expiredDate,
          status: 'EXPIRED',
          qrCodeData: qr,
          issueDate: new Date('2025-08-01')
        });

        await Student.findByIdAndUpdate(sItem.doc._id, { currentPass: pass._id });

        await Payment.create({
          student: sItem.doc._id,
          pass: pass._id,
          transactionId: `TXN-2025-770${passNum}`,
          receiptNumber: `REC-2025-00${passNum}`,
          amount: 11000,
          paidAmount: 11000,
          pendingAmount: 0,
          paymentDate: new Date('2025-08-01'),
          paymentMethod: 'NET_BANKING',
          paymentStatus: 'PAID',
          feeType: 'SEMESTER_TRANSPORT_FEE',
          academicYear: '2025–2026',
          semester: 'II Semester',
          isDemo: true
        });
      } else if (i <= 17) {
        // Pending Applications (for Admin/Manager approval testing)
        await TransportationApplication.create({
          student: sItem.doc._id,
          route: assignedRoute._id,
          stopName: sItem.meta.stopName,
          academicYear: '2026–2027',
          semester: 'I Semester',
          idProofType: 'College ID Card',
          idProofNumber: `ID-${sItem.meta.enrolmentNo}`,
          status: 'PENDING',
          appliedAt: new Date()
        });

        // Partial fee record pending
        await Payment.create({
          student: sItem.doc._id,
          transactionId: `TXN-PENDING-${passNum}`,
          receiptNumber: `REC-PENDING-${passNum}`,
          amount: 12000,
          paidAmount: 0,
          pendingAmount: 12000,
          paymentDate: new Date(),
          paymentMethod: 'ONLINE_UPI',
          paymentStatus: 'PENDING',
          feeType: 'SEMESTER_TRANSPORT_FEE',
          academicYear: '2026–2027',
          semester: 'I Semester',
          isDemo: true
        });
      } else {
        // Rejected Application (for reason display testing)
        await TransportationApplication.create({
          student: sItem.doc._id,
          route: assignedRoute._id,
          stopName: sItem.meta.stopName,
          academicYear: '2026–2027',
          semester: 'I Semester',
          idProofType: 'College ID Card',
          idProofNumber: `ID-${sItem.meta.enrolmentNo}`,
          status: 'REJECTED',
          rejectionReason: 'ID card image not clear. Incomplete residential address proof.',
          reviewedBy: managerUser._id,
          reviewedAt: new Date(),
          appliedAt: new Date('2026-08-10')
        });
      }
    }

    console.log('[Seed] 8. Creating Driver Active Trip Simulation...');
    const driver1 = drivers[0];
    const bus1 = buses[0];
    const route1 = routes[0];

    const activeTrip = await Trip.create({
      bus: bus1._id,
      route: route1._id,
      driver: driver1._id,
      tripType: 'MORNING_PICKUP',
      tripDate: new Date(),
      status: 'IN_PROGRESS',
      currentStop: 'Metro Junction Circle',
      passengerCount: 1,
      startedAt: new Date(),
      validatedPasses: [
        {
          passId: 'PASS-2026-0001',
          studentName: 'ETURI BALAJI',
          enrolmentNo: '2303A51572',
          status: 'ACTIVE',
          validatedAt: new Date()
        }
      ]
    });

    console.log('==================================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY');
    console.log('==================================================================');
    console.log(' Demonstration Accounts (Password for all accounts listed below):');
    console.log(' 1. ADMIN:              admin@university.edu           / Admin@123');
    console.log(' 2. TRANSPORT MANAGER:  manager@university.edu         / Manager@123');
    console.log(' 3. STUDENT (BALAJI):   balaji.eturi@student.university.edu / Student@123');
    console.log(' 4. DRIVER (RAMESH):    driver.ramesh@university.edu   / Driver@123');
    console.log('==================================================================');

    return true;
  } catch (err) {
    console.error(`[Seed Error] Seeding failed: ${err.message}`, err);
    throw err;
  }
};

// Allow running directly via `node seed/seedData.js`
if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    try {
      await connectDB();
      await runSeed();
      await disconnectDB();
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}

module.exports = { runSeed };
