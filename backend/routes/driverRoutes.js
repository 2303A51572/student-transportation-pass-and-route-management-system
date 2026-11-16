const express = require('express');
const router = express.Router();
const {
  getAllDrivers,
  getMyDriverProfile,
  createDriver,
  updateDriver
} = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/me', protect, authorize('DRIVER'), getMyDriverProfile);
router.get('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getAllDrivers);
router.post('/', protect, authorize('ADMIN'), createDriver);
router.put('/:id', protect, authorize('ADMIN'), updateDriver);

module.exports = router;
