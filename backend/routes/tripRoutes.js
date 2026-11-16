const express = require('express');
const router = express.Router();
const {
  startTrip,
  updateTripStop,
  completeTrip,
  getAllTrips
} = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/start', protect, authorize('DRIVER'), startTrip);
router.patch('/:id/stop', protect, authorize('DRIVER'), updateTripStop);
router.patch('/:id/complete', protect, authorize('DRIVER'), completeTrip);
router.get('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER', 'DRIVER'), getAllTrips);

module.exports = router;
