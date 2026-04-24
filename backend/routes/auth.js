// server/routes/auth.js (Add this new route)

const express = require('express');
const router = express.Router();

// Import controller functions and middleware
const { 
    loginUser,
    changePassword,
    getUserInfo // <--- NEW IMPORT
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); 

// --- Define Public Authentication Routes (Retained) ---
router.post('/login', loginUser);

// --- Define Protected User Routes ---
// @route   GET /api/auth/userinfo
router.get('/userinfo', protect, getUserInfo); // <--- NEW PROTECTED ROUTE
router.put('/change-password', protect, changePassword);

module.exports = router;