// server/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { markAttendance } = require('../controllers/attendanceController');
// Optional: import { protect } from '../middleware/authMiddleware';

// @route   POST /api/attendance/mark
// @desc    Mark student attendance
router.post('/mark', markAttendance);

module.exports = router;