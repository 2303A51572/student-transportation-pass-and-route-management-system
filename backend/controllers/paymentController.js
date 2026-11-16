const Payment = require('../models/Payment');
const Student = require('../models/Student');
const TransportationPass = require('../models/TransportationPass');

// @desc    Get all payments (Admin, Transport Manager)
// @route   GET /api/payments
// @access  Private (Admin, Transport Manager)
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, feeType, search } = req.query;
    let query = {};

    if (status) query.paymentStatus = status;
    if (feeType) query.feeType = feeType;

    let payments = await Payment.find(query)
      .populate('student', 'studentName enrolmentNo department year phone email')
      .populate({
        path: 'pass',
        populate: [{ path: 'route', select: 'routeName routeCode' }, { path: 'bus', select: 'busNumber' }]
      })
      .sort({ createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      payments = payments.filter((p) => {
        return (
          p.transactionId?.toLowerCase().includes(term) ||
          p.receiptNumber?.toLowerCase().includes(term) ||
          p.student?.studentName?.toLowerCase().includes(term) ||
          p.student?.enrolmentNo?.toLowerCase().includes(term)
        );
      });
    }

    // Summary statistics
    const totalCollected = payments
      .filter((p) => p.paymentStatus === 'PAID')
      .reduce((sum, p) => sum + p.paidAmount, 0);

    const totalPending = payments
      .filter((p) => p.paymentStatus === 'PENDING')
      .reduce((sum, p) => sum + p.pendingAmount, 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      summary: {
        totalCollected,
        totalPending,
        totalTransactions: payments.length
      },
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's payment history
// @route   GET /api/payments/my
// @access  Private (Student)
exports.getMyPayments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const payments = await Payment.find({ student: student._id })
      .populate({
        path: 'pass',
        populate: [{ path: 'route' }, { path: 'bus' }]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate Demo Payment
// @route   POST /api/payments/demo-pay
// @access  Private (Student, Admin)
exports.createDemoPayment = async (req, res, next) => {
  try {
    const { passId, amount, paymentMethod, feeType } = req.body;
    let studentId;

    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ user: req.user.id });
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      studentId = student._id;
    } else {
      studentId = req.body.studentId;
    }

    const txnId = `TXN-DEMO-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;

    const payment = await Payment.create({
      student: studentId,
      pass: passId || null,
      transactionId: txnId,
      receiptNumber: receiptNo,
      amount: Number(amount) || 12000,
      paidAmount: Number(amount) || 12000,
      pendingAmount: 0,
      paymentDate: new Date(),
      paymentMethod: paymentMethod || 'ONLINE_UPI',
      paymentStatus: 'PAID',
      feeType: feeType || 'SEMESTER_TRANSPORT_FEE',
      academicYear: '2026–2027',
      semester: 'I Semester',
      isDemo: true
    });

    res.status(201).json({
      success: true,
      message: 'Demo payment processed successfully (Simulated Payment - No real money charged)',
      payment
    });
  } catch (error) {
    next(error);
  }
};
