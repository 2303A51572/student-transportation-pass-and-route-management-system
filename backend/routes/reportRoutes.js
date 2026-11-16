const express = require('express');
const router = express.Router();
const {
  getPassIssuanceReport,
  getRoutePassengersReport,
  getRenewalDueReport,
  getFeeCollectionReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/pass-issuance', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getPassIssuanceReport);
router.get('/route-passengers', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getRoutePassengersReport);
router.get('/renewal-due', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getRenewalDueReport);
router.get('/fee-collection', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getFeeCollectionReport);

module.exports = router;
