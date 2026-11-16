const express = require('express');
const router = express.Router();
const {
  getMyPass,
  getAllPasses,
  getPassById,
  validateQRCode,
  revokePass
} = require('../controllers/passController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my', protect, authorize('STUDENT'), getMyPass);
router.post('/validate-qr', protect, authorize('DRIVER', 'ADMIN', 'TRANSPORT_MANAGER'), validateQRCode);
router.get('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getAllPasses);
router.get('/:id', protect, getPassById);
router.patch('/:id/revoke', protect, authorize('ADMIN'), revokePass);

module.exports = router;
