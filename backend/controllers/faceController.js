// server/controllers/faceController.js
const User = require('../models/User');


exports.getAllFaceDescriptors = async (req, res) => {
    // Fetch all students who have registered their face
    const students = await User.find({ role: 'student', faceDescriptor: { $ne: null } }, 'name faceDescriptor');
    res.status(200).json(students);
};
exports.saveFaceDescriptor = async (req, res) => {
    try {
        // I recommend using 'faceDescriptor' to match the schema exactly
        const { userId, faceDescriptor } = req.body; 

        if (!faceDescriptor || faceDescriptor.length !== 128) {
            return res.status(400).json({ message: "Invalid face data. Must be 128 data points." });
        }

        // CRITICAL FIX: Use findOneAndUpdate to search by your custom string 'userId'
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId }, 
            { faceDescriptor: faceDescriptor },
            { new: true } // Returns the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "Student ID not found in database." });
        }

        res.status(200).json({ success: true, message: "Face registered securely!" });
    } catch (error) {
        console.error("Face Save Error:", error);
        res.status(500).json({ success: false, message: "Server error saving face", error: error.message });
    }
};