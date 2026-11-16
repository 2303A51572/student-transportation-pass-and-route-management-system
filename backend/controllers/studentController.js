const Student = require('../models/Student');
const User = require('../models/User');
const TransportationPass = require('../models/TransportationPass');
const Payment = require('../models/Payment');

// @desc    Get all students (with search, department, year filters)
// @route   GET /api/students
// @access  Private (Admin, Transport Manager)
exports.getAllStudents = async (req, res, next) => {
  try {
    const { search, department, year, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { enrolmentNo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) query.department = department;
    if (year) query.year = year;
    if (status) query.status = status;

    const students = await Student.find(query)
      .populate('user', 'isActive avatar')
      .populate({
        path: 'currentPass',
        populate: [{ path: 'route', select: 'routeName routeCode' }, { path: 'bus', select: 'busNumber' }]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'isActive avatar role')
      .populate({
        path: 'currentPass',
        populate: [{ path: 'route' }, { path: 'bus' }]
      });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const passes = await TransportationPass.find({ student: student._id })
      .populate('route')
      .populate('bus')
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ student: student._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      student,
      passes,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin, Transport Manager)
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      student
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle student active/deactivate status
// @route   PATCH /api/students/:id/status
// @access  Private (Admin)
exports.toggleStudentStatus = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    student.status = newStatus;
    await student.save();

    await User.findByIdAndUpdate(student.user, {
      isActive: newStatus === 'ACTIVE'
    });

    res.status(200).json({
      success: true,
      message: `Student account set to ${newStatus}`,
      student
    });
  } catch (error) {
    next(error);
  }
};
