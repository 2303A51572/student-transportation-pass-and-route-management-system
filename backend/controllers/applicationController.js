const TransportationApplication = require('../models/TransportationApplication');
const Student = require('../models/Student');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const TransportationPass = require('../models/TransportationPass');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// Helper to generate unique Pass ID (e.g. PASS-2026-0042)
const generatePassId = async () => {
  const count = await TransportationPass.countDocuments();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `PASS-2026-${nextNum}`;
};

// Helper to generate unique Receipt number
const generateReceiptNo = async () => {
  const count = await Payment.countDocuments();
  const nextNum = (count + 1).toString().padStart(5, '0');
  return `REC-2026-${nextNum}`;
};

// @desc    Student submits transportation pass application
// @route   POST /api/applications
// @access  Private (Student)
exports.applyForPass = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found for logged in user' });
    }

    // Check if student already has a pending application
    const existingPending = await TransportationApplication.findOne({
      student: student._id,
      status: 'PENDING'
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending transportation application under review.'
      });
    }

    // Check if student already has an active pass
    const activePass = await TransportationPass.findOne({
      student: student._id,
      status: 'ACTIVE'
    });

    if (activePass) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active transportation pass. Please use the renewal feature.'
      });
    }

    const { routeId, stopName, idProofType, idProofNumber, academicYear, semester, documentUrl } = req.body;

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Selected transportation route does not exist' });
    }

    const application = await TransportationApplication.create({
      student: student._id,
      route: route._id,
      stopName,
      academicYear: academicYear || '2026–2027',
      semester: semester || 'I Semester',
      idProofType: idProofType || 'College ID Card',
      idProofNumber,
      documentUrl: documentUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
      status: 'PENDING'
    });

    // Notify student
    await Notification.create({
      recipient: req.user.id,
      title: 'Application Submitted Successfully',
      message: `Your transportation pass application for ${route.routeName} (${stopName}) has been received and is under review.`,
      type: 'APPLICATION',
      link: '/applications'
    });

    res.status(201).json({
      success: true,
      message: 'Transportation application submitted successfully',
      application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications (with status, route filter, search)
// @route   GET /api/applications
// @access  Private (Admin, Transport Manager)
exports.getAllApplications = async (req, res, next) => {
  try {
    const { status, route, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (route) query.route = route;

    let applications = await TransportationApplication.find(query)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .populate('route', 'routeName routeCode')
      .populate('assignedBus', 'busNumber registrationNumber capacity')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      applications = applications.filter((app) => {
        return (
          app.student?.studentName?.toLowerCase().includes(term) ||
          app.student?.enrolmentNo?.toLowerCase().includes(term) ||
          app.route?.routeName?.toLowerCase().includes(term)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student applications
// @route   GET /api/applications/my
// @access  Private (Student)
exports.getMyApplications = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    const applications = await TransportationApplication.find({ student: student._id })
      .populate('route')
      .populate('assignedBus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review application (Approve or Reject)
// @route   PATCH /api/applications/:id/review
// @access  Private (Admin, Transport Manager)
exports.reviewApplication = async (req, res, next) => {
  try {
    const { status, rejectionReason, busId, validityMonths } = req.body;
    const application = await TransportationApplication.findById(req.params.id)
      .populate('student')
      .populate('route');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Application has already been reviewed (${application.status}).`
      });
    }

    if (status === 'REJECTED') {
      application.status = 'REJECTED';
      application.rejectionReason = rejectionReason || 'Documents or eligibility criteria not satisfied';
      application.reviewedBy = req.user.id;
      application.reviewedAt = new Date();
      await application.save();

      // Create notification for student
      await Notification.create({
        recipient: application.student.user,
        title: 'Application Rejected',
        message: `Your transportation pass application was rejected. Reason: ${application.rejectionReason}`,
        type: 'APPLICATION',
        link: '/applications'
      });

      return res.status(200).json({
        success: true,
        message: 'Application rejected',
        application
      });
    }

    if (status === 'APPROVED') {
      // Find bus: either requested busId or default assigned bus for route
      let busToAssign = null;
      if (busId) {
        busToAssign = await Bus.findById(busId);
      } else if (application.route.assignedBus) {
        busToAssign = await Bus.findById(application.route.assignedBus);
      } else {
        busToAssign = await Bus.findOne({ status: 'ACTIVE' });
      }

      if (!busToAssign) {
        return res.status(400).json({
          success: false,
          message: 'No available bus found for this route. Please register a bus first.'
        });
      }

      // Check bus seat capacity
      const currentPassengerCount = await TransportationPass.countDocuments({
        bus: busToAssign._id,
        status: 'ACTIVE'
      });

      if (currentPassengerCount >= busToAssign.capacity) {
        return res.status(400).json({
          success: false,
          message: `Bus ${busToAssign.busNumber} has reached maximum seat capacity (${busToAssign.capacity}/${busToAssign.capacity}). Please allocate another bus.`
        });
      }

      // Update application
      application.status = 'APPROVED';
      application.assignedBus = busToAssign._id;
      application.reviewedBy = req.user.id;
      application.reviewedAt = new Date();
      await application.save();

      // Calculate pass validity
      const months = validityMonths || 6;
      const validFrom = new Date();
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + months);

      const passId = await generatePassId();

      // Digital payload for QR verification (secure JSON format, verifiable by Driver)
      const qrPayload = JSON.stringify({
        passId,
        enrolmentNo: application.student.enrolmentNo,
        routeCode: application.route.routeCode,
        busNumber: busToAssign.busNumber,
        stopName: application.stopName,
        validUntil: validUntil.toISOString().split('T')[0],
        signature: crypto.createHash('sha256').update(`${passId}:${application.student.enrolmentNo}:${validUntil}`).digest('hex').substring(0, 16)
      });

      // Create Pass
      const pass = await TransportationPass.create({
        passId,
        student: application.student._id,
        application: application._id,
        route: application.route._id,
        bus: busToAssign._id,
        stopName: application.stopName,
        validFrom,
        validUntil,
        status: 'ACTIVE',
        qrCodeData: qrPayload,
        qrSignature: crypto.createHash('sha256').update(passId).digest('hex').substring(0, 12),
        issueDate: new Date()
      });

      // Update student currentPass
      await Student.findByIdAndUpdate(application.student._id, {
        currentPass: pass._id
      });

      // Create Payment record
      const feeAmount = 12000;
      const receiptNumber = await generateReceiptNo();
      const txnId = `TXN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      await Payment.create({
        student: application.student._id,
        pass: pass._id,
        transactionId: txnId,
        receiptNumber,
        amount: feeAmount,
        paidAmount: feeAmount,
        pendingAmount: 0,
        paymentDate: new Date(),
        paymentMethod: 'ONLINE_UPI',
        paymentStatus: 'PAID',
        feeType: 'SEMESTER_TRANSPORT_FEE',
        academicYear: application.academicYear,
        semester: application.semester,
        isDemo: true
      });

      // Send notification to student
      await Notification.create({
        recipient: application.student.user,
        title: 'Transportation Pass Approved!',
        message: `Congratulations! Your pass ${passId} for ${application.route.routeName} has been issued. You can view and download your pass now.`,
        type: 'PASS',
        link: '/pass'
      });

      return res.status(200).json({
        success: true,
        message: 'Application approved and transportation pass generated successfully',
        application,
        pass
      });
    }

    res.status(400).json({ success: false, message: 'Invalid status specified' });
  } catch (error) {
    next(error);
  }
};
