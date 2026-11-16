const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getMyPayments,
  createDemoPayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getAllPayments);
router.get('/my', protect, authorize('STUDENT'), getMyPayments);
router.post('/demo-pay', protect, createDemoPayment);

module.exports = router;
