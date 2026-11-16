const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Driver = require('../models/Driver');
const TransportManager = require('../models/TransportManager');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'transport_secret_jwt_key_2026', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      enrolmentNo,
      phone,
      department,
      year,
      semester,
      address,
      guardianName,
      emergencyContact
    } = req.body;

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    // Check existing enrolment
    const existingEnrolment = await Student.findOne({ enrolmentNo: enrolmentNo.toUpperCase() });
    if (existingEnrolment) {
      return res.status(400).json({ success: false, message: 'Enrolment number already registered.' });
    }

    // Create user account
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'STUDENT',
      phone
    });

    // Create student profile
    const student = await Student.create({
      user: user._id,
      enrolmentNo: enrolmentNo.toUpperCase(),
      studentName: name,
      email: email.toLowerCase(),
      phone,
      department,
      year,
      semester,
      address,
      guardianName: guardianName || 'Guardian',
      emergencyContact: emergencyContact || phone
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile: student
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact administrator.' });
    }

    // Fetch role-specific profile details
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await Student.findOne({ user: user._id }).populate({
        path: 'currentPass',
        populate: [{ path: 'route' }, { path: 'bus' }]
      });
    } else if (user.role === 'DRIVER') {
      profile = await Driver.findOne({ user: user._id }).populate({
        path: 'assignedBus',
        populate: { path: 'assignedRoute' }
      });
    } else if (user.role === 'TRANSPORT_MANAGER') {
      profile = await TransportManager.findOne({ user: user._id }).populate('assignedRoutes');
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user & profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === 'STUDENT') {
      profile = await Student.findOne({ user: user._id }).populate({
        path: 'currentPass',
        populate: [{ path: 'route' }, { path: 'bus' }]
      });
    } else if (user.role === 'DRIVER') {
      profile = await Driver.findOne({ user: user._id }).populate({
        path: 'assignedBus',
        populate: { path: 'assignedRoute' }
      });
    } else if (user.role === 'TRANSPORT_MANAGER') {
      profile = await TransportManager.findOne({ user: user._id }).populate('assignedRoutes');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, emergencyContact } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();

    let profile = null;
    if (user.role === 'STUDENT') {
      profile = await Student.findOne({ user: user._id });
      if (profile) {
        if (name) profile.studentName = name;
        if (phone) profile.phone = phone;
        if (address) profile.address = address;
        if (emergencyContact) profile.emergencyContact = emergencyContact;
        await profile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password simulation
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account with that email address exists.' });
    }

    // Demo password reset acknowledgement
    res.status(200).json({
      success: true,
      message: 'Password reset link has been dispatched to your email address (Demo simulation).'
    });
  } catch (error) {
    next(error);
  }
};
