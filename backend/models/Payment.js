const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    pass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportationPass',
      default: null
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['ONLINE_UPI', 'NET_BANKING', 'DEBIT_CREDIT_CARD', 'CAMPUS_CHALLAN'],
      default: 'ONLINE_UPI'
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'FAILED'],
      default: 'PAID'
    },
    feeType: {
      type: String,
      enum: ['SEMESTER_TRANSPORT_FEE', 'ANNUAL_FEE', 'RENEWAL_FEE', 'LATE_FEE'],
      default: 'SEMESTER_TRANSPORT_FEE'
    },
    academicYear: {
      type: String,
      default: '2026–2027'
    },
    semester: {
      type: String,
      default: 'I Semester'
    },
    isDemo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
