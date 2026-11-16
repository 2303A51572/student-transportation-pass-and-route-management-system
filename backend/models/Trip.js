const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: true
    },
    tripType: {
      type: String,
      enum: ['MORNING_PICKUP', 'EVENING_DROP'],
      default: 'MORNING_PICKUP'
    },
    tripDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED'
    },
    currentStop: {
      type: String,
      default: 'Depot'
    },
    passengerCount: {
      type: Number,
      default: 0
    },
    validatedPasses: [
      {
        passId: { type: String, required: true },
        studentName: { type: String, required: true },
        enrolmentNo: { type: String },
        status: { type: String, default: 'ACTIVE' },
        validatedAt: { type: Date, default: Date.now }
      }
    ],
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
