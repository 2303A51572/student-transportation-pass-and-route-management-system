const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const User = require('../models/User');
const TransportationPass = require('../models/TransportationPass');
const Trip = require('../models/Trip');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private (Admin, Transport Manager)
exports.getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find()
      .populate('user', 'email isActive avatar')
      .populate({
        path: 'assignedBus',
        populate: { path: 'assignedRoute' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current driver profile & trip manifest
// @route   GET /api/drivers/me
// @access  Private (Driver)
exports.getMyDriverProfile = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id }).populate({
      path: 'assignedBus',
      populate: { path: 'assignedRoute' }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver record not found for logged-in user' });
    }

    let passengers = [];
    let currentTrip = null;

    if (driver.assignedBus) {
      passengers = await TransportationPass.find({
        bus: driver.assignedBus._id,
        status: 'ACTIVE'
      })
        .populate('student', 'studentName enrolmentNo phone department year')
        .sort({ stopName: 1 });

      currentTrip = await Trip.findOne({
        driver: driver._id,
        status: { $in: ['SCHEDULED', 'IN_PROGRESS'] }
      }).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      driver,
      passengers,
      currentTrip
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create driver
// @route   POST /api/drivers
// @access  Private (Admin)
exports.createDriver = async (req, res, next) => {
  try {
    const { name, email, password, phone, licenseNumber, experienceYears, assignedBus } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const existingLicense = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase() });
    if (existingLicense) {
      return res.status(400).json({ success: false, message: 'License number already registered' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Driver@123',
      role: 'DRIVER',
      phone
    });

    const driver = await Driver.create({
      user: user._id,
      driverName: name,
      licenseNumber: licenseNumber.toUpperCase(),
      phone,
      experienceYears: experienceYears || 5,
      assignedBus: assignedBus || null
    });

    if (assignedBus) {
      await Bus.findByIdAndUpdate(assignedBus, { assignedDriver: driver._id });
    }

    res.status(201).json({
      success: true,
      message: 'Driver profile created successfully',
      driver
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private (Admin)
exports.updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    if (req.body.assignedBus) {
      await Bus.findByIdAndUpdate(req.body.assignedBus, { assignedDriver: driver._id });
    }

    res.status(200).json({
      success: true,
      message: 'Driver profile updated',
      driver
    });
  } catch (error) {
    next(error);
  }
};
