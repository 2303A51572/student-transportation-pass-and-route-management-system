const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    enrolmentNo: {
      type: String,
      required: [true, 'Enrolment number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['Computer Science and Engineering', 'Information Technology', 'Electronics and Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'DevOps & Cloud Systems', 'Data Science'],
      default: 'Computer Science and Engineering'
    },
    year: {
      type: String,
      required: true,
      enum: ['I Year', 'II Year', 'III Year', 'IV Year'],
      default: 'IV Year'
    },
    semester: {
      type: String,
      required: true,
      enum: ['I Semester', 'II Semester'],
      default: 'I Semester'
    },
    address: {
      type: String,
      required: true
    },
    guardianName: {
      type: String,
      default: 'Guardian'
    },
    emergencyContact: {
      type: String,
      default: ''
    },
    currentPass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportationPass',
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

studentSchema.index({ enrolmentNo: 1, email: 1 });

module.exports = mongoose.model('Student', studentSchema);
