const Renewal = require('../models/Renewal');
const TransportationPass = require('../models/TransportationPass');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

// @desc    Student requests pass renewal
// @route   POST /api/renewals
// @access  Private (Student)
exports.requestRenewal = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { passId, requestedPeriodMonths } = req.body;
    const pass = await TransportationPass.findOne({
      _id: passId,
      student: student._id
    });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Specified transportation pass not found' });
    }

    // Check if there is already a pending renewal for this pass
    const existingRenewal = await Renewal.findOne({
      pass: pass._id,
      status: 'PENDING'
    });

    if (existingRenewal) {
      return res.status(400).json({
        success: false,
        message: 'A renewal request for this pass is already pending review.'
      });
    }

    const months = Number(requestedPeriodMonths) || 6;
    const baseDate = new Date(pass.validUntil) > new Date() ? new Date(pass.validUntil) : new Date();
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

    const renewalFee = months === 12 ? 22000 : 12000;

    const renewal = await Renewal.create({
      pass: pass._id,
      student: student._id,
      previousExpiryDate: pass.validUntil,
      requestedPeriodMonths: months,
      newExpiryDate,
      renewalFee,
      paymentStatus: 'PAID', // Simulated immediate demo payment
      status: 'PENDING'
    });

    pass.renewalStatus = 'REQUESTED';
    await pass.save();

    await Notification.create({
      recipient: req.user.id,
      title: 'Pass Renewal Request Submitted',
      message: `Your renewal request for pass ${pass.passId} (${months} months) has been submitted for administrative verification.`,
      type: 'RENEWAL',
      link: '/renewal'
    });

    res.status(201).json({
      success: true,
      message: 'Renewal request submitted successfully',
      renewal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all renewal requests
// @route   GET /api/renewals
// @access  Private (Admin, Transport Manager)
exports.getAllRenewals = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const renewals = await Renewal.find(query)
      .populate('student', 'studentName enrolmentNo department year phone email')
      .populate({
        path: 'pass',
        populate: [{ path: 'route', select: 'routeName routeCode' }, { path: 'bus', select: 'busNumber' }]
      })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: renewals.length,
      renewals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's renewals
// @route   GET /api/renewals/my
// @access  Private (Student)
exports.getMyRenewals = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const renewals = await Renewal.find({ student: student._id })
      .populate({
        path: 'pass',
        populate: [{ path: 'route' }, { path: 'bus' }]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      renewals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review renewal request (Approve / Reject)
// @route   PATCH /api/renewals/:id/review
// @access  Private (Admin, Transport Manager)
exports.reviewRenewal = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const renewal = await Renewal.findById(req.params.id)
      .populate('pass')
      .populate('student');

    if (!renewal) {
      return res.status(404).json({ success: false, message: 'Renewal request not found' });
    }

    if (renewal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Renewal has already been reviewed (${renewal.status}).`
      });
    }

    if (status === 'APPROVED') {
      renewal.status = 'APPROVED';
      renewal.approvedDate = new Date();
      renewal.reviewedBy = req.user.id;
      renewal.remarks = remarks || 'Approved by transport administration';
      await renewal.save();

      // Update pass expiration and status
      const pass = await TransportationPass.findById(renewal.pass._id);
      pass.validUntil = renewal.newExpiryDate;
      pass.status = 'ACTIVE';
      pass.renewalStatus = 'RENEWED';
      await pass.save();

      // Create Payment transaction
      const txnId = `TXN-REN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const receiptNo = `REC-REN-${Date.now().toString().slice(-5)}`;

      await Payment.create({
        student: renewal.student._id,
        pass: pass._id,
        transactionId: txnId,
        receiptNumber: receiptNo,
        amount: renewal.renewalFee,
        paidAmount: renewal.renewalFee,
        pendingAmount: 0,
        paymentDate: new Date(),
        paymentMethod: 'ONLINE_UPI',
        paymentStatus: 'PAID',
        feeType: 'RENEWAL_FEE',
        academicYear: '2026–2027',
        semester: 'II Semester',
        isDemo: true
      });

      // Notify student
      await Notification.create({
        recipient: renewal.student.user,
        title: 'Pass Renewal Approved!',
        message: `Your transportation pass ${pass.passId} renewal has been approved. New validity until: ${new Date(pass.validUntil).toLocaleDateString()}.`,
        type: 'RENEWAL',
        link: '/pass'
      });

      return res.status(200).json({
        success: true,
        message: 'Pass renewed successfully',
        renewal,
        pass
      });
    }

    if (status === 'REJECTED') {
      renewal.status = 'REJECTED';
      renewal.remarks = remarks || 'Renewal rejected by transport administration';
      renewal.reviewedBy = req.user.id;
      await renewal.save();

      const pass = await TransportationPass.findById(renewal.pass._id);
      if (pass) {
        pass.renewalStatus = 'NONE';
        await pass.save();
      }

      await Notification.create({
        recipient: renewal.student.user,
        title: 'Pass Renewal Rejected',
        message: `Your pass renewal request was rejected. Remarks: ${renewal.remarks}`,
        type: 'RENEWAL',
        link: '/renewal'
      });

      return res.status(200).json({
        success: true,
        message: 'Renewal request rejected',
        renewal
      });
    }

    res.status(400).json({ success: false, message: 'Invalid status specified' });
  } catch (error) {
    next(error);
  }
};
