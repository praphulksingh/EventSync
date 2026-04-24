// server/controllers/faceController.js
const User = require('../models/User');

exports.saveFaceDescriptor = async (req, res) => {
    const { userId, descriptor } = req.body;
    await User.findByIdAndUpdate(userId, { faceDescriptor: descriptor });
    res.status(200).json({ success: true });
};

exports.getAllFaceDescriptors = async (req, res) => {
    // Fetch all students who have registered their face
    const students = await User.find({ role: 'student', faceDescriptor: { $ne: null } }, 'name faceDescriptor');
    res.status(200).json(students);
};