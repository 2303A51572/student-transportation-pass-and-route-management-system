const express = require('express');
const router = express.Router();
const {
  getAllManagers,
  createManager,
  getDashboardStats
} = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getDashboardStats);
router.get('/', protect, authorize('ADMIN'), getAllManagers);
router.post('/', protect, authorize('ADMIN'), createManager);

module.exports = router;
