const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute
} = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAllRoutes);
router.get('/:id', getRouteById);
router.post('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), createRoute);
router.put('/:id', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), updateRoute);
router.delete('/:id', protect, authorize('ADMIN'), deleteRoute);

module.exports = router;
