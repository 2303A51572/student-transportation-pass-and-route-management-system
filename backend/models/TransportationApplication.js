const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    stopName: {
      type: String,
      required: true
    },
    academicYear: {
      type: String,
      default: '2026–2027'
    },
    semester: {
      type: String,
      default: 'I Semester'
    },
    documentUrl: {
      type: String,
      default: ''
    },
    idProofType: {
      type: String,
      enum: ['College ID Card', 'Aadhaar Card', 'Driving License', 'Passport'],
      default: 'College ID Card'
    },
    idProofNumber: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportationApplication', applicationSchema);
