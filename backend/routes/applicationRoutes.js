const express = require('express');
const router = express.Router();
const {
  applyForPass,
  getAllApplications,
  getMyApplications,
  reviewApplication
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('STUDENT'), applyForPass);
router.get('/my', protect, authorize('STUDENT'), getMyApplications);
router.get('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getAllApplications);
router.patch('/:id/review', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), reviewApplication);

module.exports = router;
