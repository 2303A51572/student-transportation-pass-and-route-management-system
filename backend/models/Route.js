const mongoose = require('mongoose');

const stopSubSchema = new mongoose.Schema({
  stopName: {
    type: String,
    required: true,
    trim: true
  },
  stopOrder: {
    type: Number,
    required: true
  },
  morningPickupTime: {
    type: String,
    required: true
  },
  eveningDropTime: {
    type: String,
    required: true
  },
  landmark: {
    type: String,
    default: ''
  },
  farePerSemester: {
    type: Number,
    default: 12000
  }
});

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true
    },
    routeCode: {
      type: String,
      required: [true, 'Route code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    startPoint: {
      type: String,
      required: true
    },
    endPoint: {
      type: String,
      required: true
    },
    distanceKm: {
      type: Number,
      default: 25
    },
    estimatedDurationMin: {
      type: Number,
      default: 55
    },
    morningStartTime: {
      type: String,
      default: '07:30 AM'
    },
    eveningReturnTime: {
      type: String,
      default: '04:45 PM'
    },
    stops: [stopSubSchema],
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null
    },
    totalStudentsAllocated: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
