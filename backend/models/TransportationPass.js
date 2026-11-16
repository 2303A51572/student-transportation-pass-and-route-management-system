const mongoose = require('mongoose');

const passSchema = new mongoose.Schema(
  {
    passId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportationApplication',
      default: null
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true
    },
    stopName: {
      type: String,
      required: true
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'REVOKED'],
      default: 'ACTIVE'
    },
    qrCodeData: {
      type: String,
      required: true
    },
    qrSignature: {
      type: String,
      default: ''
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    renewalStatus: {
      type: String,
      enum: ['NONE', 'REQUESTED', 'RENEWED'],
      default: 'NONE'
    }
  },
  { timestamps: true }
);

passSchema.index({ passId: 1, status: 1 });

module.exports = mongoose.model('TransportationPass', passSchema);
