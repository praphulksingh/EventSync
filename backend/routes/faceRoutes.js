// server/routes/faceRoutes.js
const express = require('express');
const router = express.Router();
const { saveFaceDescriptor, getAllFaceDescriptors } = require('../controllers/faceController');
// Optional: import { protect } from '../middleware/authMiddleware'; 

// @route   POST /api/face/save
// @desc    Save student face descriptor
router.post('/save', saveFaceDescriptor);

// @route   GET /api/face/get-all
// @desc    Get all students with registered faces
router.get('/get-all', getAllFaceDescriptors);

module.exports = router;