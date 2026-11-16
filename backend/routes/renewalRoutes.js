const express = require('express');
const router = express.Router();
const {
  requestRenewal,
  getAllRenewals,
  getMyRenewals,
  reviewRenewal
} = require('../controllers/renewalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('STUDENT'), requestRenewal);
router.get('/my', protect, authorize('STUDENT'), getMyRenewals);
router.get('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getAllRenewals);
router.patch('/:id/review', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), reviewRenewal);

module.exports = router;
