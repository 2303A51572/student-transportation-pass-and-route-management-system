const express = require('express');
const router = express.Router();
const {
  getAllBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus
} = require('../controllers/busController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllBuses);
router.get('/:id', getBusById);
router.post('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), createBus);
router.put('/:id', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), updateBus);
router.delete('/:id', protect, authorize('ADMIN'), deleteBus);

module.exports = router;
