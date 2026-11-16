const TransportationPass = require('../models/TransportationPass');
const Student = require('../models/Student');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const QRCode = require('qrcode');

// @desc    Get current student's active transportation pass
// @route   GET /api/passes/my
// @access  Private (Student)
exports.getMyPass = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const pass = await TransportationPass.findOne({
      student: student._id
    })
      .sort({ createdAt: -1 })
      .populate('student')
      .populate('route')
      .populate({
        path: 'bus',
        populate: { path: 'assignedDriver', select: 'driverName phone' }
      });

    if (!pass) {
      return res.status(404).json({
        success: false,
        message: 'No transportation pass found. Please apply for a new pass.'
      });
    }

    // Check if pass has expired
    const now = new Date();
    if (new Date(pass.validUntil) < now && pass.status === 'ACTIVE') {
      pass.status = 'EXPIRED';
      await pass.save();
    }

    // Generate high quality QR code Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(pass.qrCodeData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff'
      }
    });

    res.status(200).json({
      success: true,
      pass,
      qrCodeDataUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all passes (Admin/Transport Manager)
// @route   GET /api/passes
// @access  Private (Admin, Transport Manager)
exports.getAllPasses = async (req, res, next) => {
  try {
    const { status, route, bus, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (route) query.route = route;
    if (bus) query.bus = bus;

    let passes = await TransportationPass.find(query)
      .populate('student')
      .populate('route', 'routeName routeCode')
      .populate('bus', 'busNumber registrationNumber')
      .sort({ createdAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      passes = passes.filter((p) => {
        return (
          p.passId?.toLowerCase().includes(term) ||
          p.student?.studentName?.toLowerCase().includes(term) ||
          p.student?.enrolmentNo?.toLowerCase().includes(term) ||
          p.bus?.busNumber?.toLowerCase().includes(term)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: passes.length,
      passes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pass by ID
// @route   GET /api/passes/:id
// @access  Private
exports.getPassById = async (req, res, next) => {
  try {
    const pass = await TransportationPass.findById(req.params.id)
      .populate('student')
      .populate('route')
      .populate({
        path: 'bus',
        populate: { path: 'assignedDriver' }
      });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    const qrCodeDataUrl = await QRCode.toDataURL(pass.qrCodeData, {
      errorCorrectionLevel: 'H',
      width: 300
    });

    res.status(200).json({
      success: true,
      pass,
      qrCodeDataUrl
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate QR code pass by Driver or Administrator
// @route   POST /api/passes/validate-qr
// @access  Private (Driver, Admin, Transport Manager)
exports.validateQRCode = async (req, res, next) => {
  try {
    const { qrData, passId: inputPassId } = req.body;

    let passId = inputPassId;

    // If scanned JSON QR string
    if (qrData) {
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.passId) {
          passId = parsed.passId;
        }
      } catch (e) {
        // Raw string might directly be passId
        passId = qrData.trim();
      }
    }

    if (!passId) {
      return res.status(400).json({
        success: false,
        validationStatus: 'INVALID',
        message: 'No Pass ID or QR payload provided for verification.'
      });
    }

    const pass = await TransportationPass.findOne({ passId: passId.toUpperCase() })
      .populate('student')
      .populate('route')
      .populate('bus');

    if (!pass) {
      return res.status(200).json({
        success: true,
        isValid: false,
        validationStatus: 'INVALID',
        message: `Pass ID '${passId}' does not exist in university records.`,
        details: null
      });
    }

    // Check expiration
    const now = new Date();
    let currentStatus = pass.status;

    if (new Date(pass.validUntil) < now) {
      currentStatus = 'EXPIRED';
      if (pass.status !== 'EXPIRED') {
        pass.status = 'EXPIRED';
        await pass.save();
      }
    }

    if (currentStatus === 'REVOKED') {
      return res.status(200).json({
        success: true,
        isValid: false,
        validationStatus: 'REVOKED',
        message: `Pass ${pass.passId} has been revoked by the transport administration.`,
        details: {
          passId: pass.passId,
          studentName: pass.student?.studentName,
          enrolmentNo: pass.student?.enrolmentNo,
          route: pass.route?.routeName,
          busNumber: pass.bus?.busNumber,
          validUntil: pass.validUntil
        }
      });
    }

    if (currentStatus === 'EXPIRED') {
      return res.status(200).json({
        success: true,
        isValid: false,
        validationStatus: 'EXPIRED',
        message: `Pass ${pass.passId} expired on ${new Date(pass.validUntil).toLocaleDateString()}. Renewal required.`,
        details: {
          passId: pass.passId,
          studentName: pass.student?.studentName,
          enrolmentNo: pass.student?.enrolmentNo,
          route: pass.route?.routeName,
          busNumber: pass.bus?.busNumber,
          validUntil: pass.validUntil
        }
      });
    }

    // Active pass! If driver is calling, log into active trip
    if (req.user.role === 'DRIVER') {
      const driver = await Driver.findOne({ user: req.user.id });
      if (driver && driver.assignedBus) {
        let activeTrip = await Trip.findOne({
          driver: driver._id,
          status: 'IN_PROGRESS'
        });

        if (activeTrip) {
          activeTrip.validatedPasses.push({
            passId: pass.passId,
            studentName: pass.student?.studentName || 'Student',
            enrolmentNo: pass.student?.enrolmentNo || '',
            status: 'ACTIVE',
            validatedAt: new Date()
          });
          activeTrip.passengerCount = activeTrip.validatedPasses.length;
          await activeTrip.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      isValid: true,
      validationStatus: 'ACTIVE',
      message: `Pass ${pass.passId} is VALID and ACTIVE. Boarding authorized.`,
      details: {
        passId: pass.passId,
        studentName: pass.student?.studentName,
        enrolmentNo: pass.student?.enrolmentNo,
        department: pass.student?.department,
        year: pass.student?.year,
        route: pass.route?.routeName,
        routeCode: pass.route?.routeCode,
        busNumber: pass.bus?.busNumber,
        stopName: pass.stopName,
        validFrom: pass.validFrom,
        validUntil: pass.validUntil,
        status: pass.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke a pass (Admin)
// @route   PATCH /api/passes/:id/revoke
// @access  Private (Admin)
exports.revokePass = async (req, res, next) => {
  try {
    const pass = await TransportationPass.findById(req.params.id);
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    pass.status = 'REVOKED';
    await pass.save();

    res.status(200).json({
      success: true,
      message: `Pass ${pass.passId} has been revoked`,
      pass
    });
  } catch (error) {
    next(error);
  }
};
