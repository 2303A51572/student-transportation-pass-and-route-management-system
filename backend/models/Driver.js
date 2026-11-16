const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    driverName: {
      type: String,
      required: true,
      trim: true
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null
    },
    experienceYears: {
      type: Number,
      default: 5
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
