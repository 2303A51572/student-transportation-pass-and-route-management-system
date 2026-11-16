const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus number/identifier is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration plate number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    model: {
      type: String,
      default: 'Tata Starbus Ultra 40S'
    },
    capacity: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
      default: 40
    },
    availableSeats: {
      type: Number,
      required: true,
      default: 40
    },
    assignedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    insuranceExpiry: {
      type: Date
    },
    fitnessExpiry: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bus', busSchema);
