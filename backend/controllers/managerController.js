const TransportManager = require('../models/TransportManager');
const User = require('../models/User');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const TransportationApplication = require('../models/TransportationApplication');
const TransportationPass = require('../models/TransportationPass');

// @desc    Get all transport managers
// @route   GET /api/transport-managers
// @access  Private (Admin)
exports.getAllManagers = async (req, res, next) => {
  try {
    const managers = await TransportManager.find()
      .populate('user', 'email isActive avatar')
      .populate('assignedRoutes', 'routeName routeCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: managers.length,
      managers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create transport manager
// @route   POST /api/transport-managers
// @access  Private (Admin)
exports.createManager = async (req, res, next) => {
  try {
    const { name, email, password, phone, employeeId, department, assignedRoutes } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const existingEmployee = await TransportManager.findOne({ employeeId: employeeId.toUpperCase() });
    if (existingEmployee) {
      return res.status(400).json({ success: false, message: 'Employee ID already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Manager@123',
      role: 'TRANSPORT_MANAGER',
      phone
    });

    const manager = await TransportManager.create({
      user: user._id,
      managerName: name,
      employeeId: employeeId.toUpperCase(),
      phone,
      department: department || 'Transportation & Logistics',
      assignedRoutes: assignedRoutes || []
    });

    res.status(201).json({
      success: true,
      message: 'Transport manager created successfully',
      manager
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system dashboard stats
// @route   GET /api/transport-managers/stats
// @access  Private (Admin, Transport Manager)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalBuses,
      totalRoutes,
      activePasses,
      expiredPasses,
      pendingApplications,
      approvedApplications,
      totalDrivers
    ] = await Promise.all([
      require('../models/Student').countDocuments(),
      Bus.countDocuments(),
      Route.countDocuments(),
      TransportationPass.countDocuments({ status: 'ACTIVE' }),
      TransportationPass.countDocuments({ status: 'EXPIRED' }),
      TransportationApplication.countDocuments({ status: 'PENDING' }),
      TransportationApplication.countDocuments({ status: 'APPROVED' }),
      require('../models/Driver').countDocuments()
    ]);

    const payments = await require('../models/Payment').find({ paymentStatus: 'PAID' });
    const totalFeeCollection = payments.reduce((sum, p) => sum + p.paidAmount, 0);

    // Recent 5 applications
    const recentApplications = await TransportationApplication.find()
      .populate('student', 'studentName enrolmentNo department')
      .populate('route', 'routeName routeCode')
      .sort({ createdAt: -1 })
      .limit(5);

    // Route wise allocation chart data
    const routes = await Route.find().select('routeName routeCode');
    const routeAllocationData = await Promise.all(
      routes.map(async (rt) => {
        const count = await TransportationPass.countDocuments({ route: rt._id, status: 'ACTIVE' });
        return {
          name: rt.routeCode,
          routeName: rt.routeName,
          students: count
        };
      })
    );

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalBuses,
        totalRoutes,
        activePasses,
        expiredPasses,
        pendingApplications,
        approvedApplications,
        totalDrivers,
        totalFeeCollection
      },
      recentApplications,
      routeAllocationData
    });
  } catch (error) {
    next(error);
  }
};
