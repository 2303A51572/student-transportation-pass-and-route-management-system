const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  updateStudent,
  toggleStudentStatus
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), getAllStudents);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, authorize('ADMIN', 'TRANSPORT_MANAGER'), updateStudent);
router.patch('/:id/status', protect, authorize('ADMIN'), toggleStudentStatus);

module.exports = router;
