const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema(
  {
    stopName: {
      type: String,
      required: true,
      trim: true
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stop', stopSchema);
