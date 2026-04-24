// server/routes/hod.js

const express = require('express');
const router = express.Router();
const { signupUserByHOD } = require('../controllers/hodController');
const { protect, authorize } = require('../middleware/authMiddleware');

// The route that should handle your POST request
router.post('/signup', protect, authorize('hod'), signupUserByHOD);


module.exports = router;