const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    managerName: {
      type: String,
      required: true,
      trim: true
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true
    },
    department: {
      type: String,
      default: 'Transportation & Logistics'
    },
    assignedRoutes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransportManager', managerSchema);
