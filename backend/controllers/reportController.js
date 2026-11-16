const TransportationPass = require('../models/TransportationPass');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Payment = require('../models/Payment');
const Student = require('../models/Student');

// 1. PASS ISSUANCE REPORT
// @route   GET /api/reports/pass-issuance
exports.getPassIssuanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status, routeId, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (routeId) query.route = routeId;
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    let passes = await TransportationPass.find(query)
      .populate('student', 'studentName enrolmentNo department year phone email')
      .populate('route', 'routeName routeCode')
      .populate('bus', 'busNumber registrationNumber')
      .sort({ issueDate: -1 });

    if (search) {
      const term = search.toLowerCase();
      passes = passes.filter((p) => {
        return (
          p.passId.toLowerCase().includes(term) ||
          p.student?.studentName?.toLowerCase().includes(term) ||
          p.student?.enrolmentNo?.toLowerCase().includes(term) ||
          p.bus?.busNumber?.toLowerCase().includes(term)
        );
      });
    }

    const reportData = passes.map((p) => ({
      passId: p.passId,
      studentName: p.student?.studentName || 'N/A',
      enrolmentNo: p.student?.enrolmentNo || 'N/A',
      department: p.student?.department || 'N/A',
      routeName: p.route?.routeName || 'N/A',
      routeCode: p.route?.routeCode || 'N/A',
      busNumber: p.bus?.busNumber || 'N/A',
      stopName: p.stopName,
      issueDate: p.issueDate,
      validFrom: p.validFrom,
      validUntil: p.validUntil,
      status: p.status
    }));

    res.status(200).json({
      success: true,
      reportName: 'Pass Issuance Report',
      generatedAt: new Date(),
      count: reportData.length,
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

// 2. ROUTE-WISE PASSENGERS REPORT
// @route   GET /api/reports/route-passengers
exports.getRoutePassengersReport = async (req, res, next) => {
  try {
    const { routeId } = req.query;
    let query = {};
    if (routeId) query._id = routeId;

    const routes = await Route.find(query)
      .populate({
        path: 'assignedBus',
        populate: { path: 'assignedDriver', select: 'driverName phone licenseNumber' }
      })
      .sort({ routeCode: 1 });

    const reportData = await Promise.all(
      routes.map(async (rt) => {
        const passes = await TransportationPass.find({
          route: rt._id,
          status: 'ACTIVE'
        }).populate('student', 'studentName enrolmentNo department year phone email address');

        const bus = rt.assignedBus;
        const capacity = bus ? bus.capacity : 40;
        const allocated = passes.length;
        const availableSeats = Math.max(0, capacity - allocated);

        return {
          routeId: rt._id,
          routeName: rt.routeName,
          routeCode: rt.routeCode,
          startPoint: rt.startPoint,
          endPoint: rt.endPoint,
          busNumber: bus ? bus.busNumber : 'Unassigned',
          busModel: bus ? bus.model : 'N/A',
          driverName: bus?.assignedDriver ? bus.assignedDriver.driverName : 'Unassigned',
          driverPhone: bus?.assignedDriver ? bus.assignedDriver.phone : 'N/A',
          totalCapacity: capacity,
          totalAllocatedStudents: allocated,
          availableSeats,
          passengers: passes.map((p) => ({
            studentId: p.student?._id,
            studentName: p.student?.studentName,
            enrolmentNo: p.student?.enrolmentNo,
            department: p.student?.department,
            year: p.student?.year,
            phone: p.student?.phone,
            stopName: p.stopName,
            passId: p.passId
          }))
        };
      })
    );

    res.status(200).json({
      success: true,
      reportName: 'Route-wise Passengers Report',
      generatedAt: new Date(),
      count: reportData.length,
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

// 3. RENEWAL DUE REPORT
// @route   GET /api/reports/renewal-due
exports.getRenewalDueReport = async (req, res, next) => {
  try {
    const { daysThreshold = 60, search } = req.query;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + Number(daysThreshold));

    // Passes that are active but expiring within threshold, or already expired
    let passes = await TransportationPass.find({
      validUntil: { $lte: thresholdDate }
    })
      .populate('student', 'studentName enrolmentNo department year phone email')
      .populate('route', 'routeName routeCode')
      .populate('bus', 'busNumber')
      .sort({ validUntil: 1 });

    const now = new Date();

    let reportData = passes.map((p) => {
      const expDate = new Date(p.validUntil);
      const diffTime = expDate - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let renewalUrgency = 'NORMAL';
      if (daysRemaining < 0) renewalUrgency = 'EXPIRED';
      else if (daysRemaining <= 7) renewalUrgency = 'CRITICAL';
      else if (daysRemaining <= 30) renewalUrgency = 'UPCOMING';

      return {
        passId: p.passId,
        studentName: p.student?.studentName || 'N/A',
        enrolmentNo: p.student?.enrolmentNo || 'N/A',
        phone: p.student?.phone || 'N/A',
        department: p.student?.department || 'N/A',
        routeName: p.route?.routeName || 'N/A',
        busNumber: p.bus?.busNumber || 'N/A',
        expirationDate: p.validUntil,
        daysRemaining,
        renewalUrgency,
        passStatus: p.status,
        renewalStatus: p.renewalStatus
      };
    });

    if (search) {
      const term = search.toLowerCase();
      reportData = reportData.filter((r) => {
        return (
          r.studentName.toLowerCase().includes(term) ||
          r.enrolmentNo.toLowerCase().includes(term) ||
          r.passId.toLowerCase().includes(term)
        );
      });
    }

    res.status(200).json({
      success: true,
      reportName: 'Renewal Due Report',
      generatedAt: new Date(),
      count: reportData.length,
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

// 4. TRANSPORT FEE COLLECTION REPORT
// @route   GET /api/reports/fee-collection
exports.getFeeCollectionReport = async (req, res, next) => {
  try {
    const { startDate, endDate, paymentStatus, feeType, search } = req.query;
    let query = {};

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (feeType) query.feeType = feeType;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    let payments = await Payment.find(query)
      .populate('student', 'studentName enrolmentNo department year phone email')
      .populate({
        path: 'pass',
        populate: [{ path: 'route', select: 'routeName routeCode' }, { path: 'bus', select: 'busNumber' }]
      })
      .sort({ paymentDate: -1 });

    if (search) {
      const term = search.toLowerCase();
      payments = payments.filter((p) => {
        return (
          p.student?.studentName?.toLowerCase().includes(term) ||
          p.student?.enrolmentNo?.toLowerCase().includes(term) ||
          p.transactionId?.toLowerCase().includes(term) ||
          p.receiptNumber?.toLowerCase().includes(term)
        );
      });
    }

    let totalFeeAmount = 0;
    let totalPaidAmount = 0;
    let totalPendingAmount = 0;

    const reportData = payments.map((p) => {
      totalFeeAmount += p.amount;
      totalPaidAmount += p.paidAmount;
      totalPendingAmount += p.pendingAmount;

      return {
        paymentId: p._id,
        receiptNumber: p.receiptNumber,
        transactionId: p.transactionId,
        studentName: p.student?.studentName || 'N/A',
        enrolmentNo: p.student?.enrolmentNo || 'N/A',
        department: p.student?.department || 'N/A',
        routeName: p.pass?.route?.routeName || 'Campus Shuttle',
        totalFee: p.amount,
        amountPaid: p.paidAmount,
        pendingAmount: p.pendingAmount,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        feeType: p.feeType,
        academicYear: p.academicYear,
        semester: p.semester
      };
    });

    res.status(200).json({
      success: true,
      reportName: 'Transport Fee Collection Report',
      generatedAt: new Date(),
      count: reportData.length,
      summary: {
        totalFeeAmount,
        totalPaidAmount,
        totalPendingAmount,
        collectionRatePercentage: totalFeeAmount > 0 ? ((totalPaidAmount / totalFeeAmount) * 100).toFixed(1) : 100
      },
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};
