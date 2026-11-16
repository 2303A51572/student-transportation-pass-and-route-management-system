const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['APPLICATION', 'PASS', 'RENEWAL', 'PAYMENT', 'TRIP', 'GENERAL'],
      default: 'GENERAL'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    link: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
