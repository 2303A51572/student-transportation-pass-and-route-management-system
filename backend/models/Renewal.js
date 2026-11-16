const mongoose = require('mongoose');

const renewalSchema = new mongoose.Schema(
  {
    pass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportationPass',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    previousExpiryDate: {
      type: Date,
      required: true
    },
    requestedPeriodMonths: {
      type: Number,
      enum: [6, 12],
      default: 6
    },
    newExpiryDate: {
      type: Date,
      required: true
    },
    renewalFee: {
      type: Number,
      required: true,
      default: 12000
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING'],
      default: 'PENDING'
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    remarks: {
      type: String,
      default: ''
    },
    requestedDate: {
      type: Date,
      default: Date.now
    },
    approvedDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Renewal', renewalSchema);
