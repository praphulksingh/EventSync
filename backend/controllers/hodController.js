// server/controllers/hodController.js
const User = require('../models/User');

// --- Controller for HOD to create a new user (Faculty/Student) ---
// This route is protected by HOD role authorization middleware.
exports.signupUserByHOD = async (req, res) => {
    console.log("HOD Controller received payload:", req.body);
    const { userId, name, email, password, role, department } = req.body;

    // 1. Basic validation
    if (!userId || !name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Please provide userId, name, email, password, and role' });
    }
    
    // 2. Role-specific validation
    if ((role === 'faculty' || role === 'hod') && !department) {
         return res.status(400).json({ success: false, message: 'Department is required for Faculty and HOD roles' });
    }

    try {
        // 3. Check if a user with this userId already exists
        // We use toUpperCase() for consistency in lookup and storage
        const userExists = await User.findOne({ userId: userId.toUpperCase() });

        if (userExists) {
            return res.status(400).json({ success: false, message: `User with ID ${userId} already exists` });
        }

        // 4. Create a new user (password is auto-hashed by pre-save hook)
        const newUserPayload = {
            userId: userId.toUpperCase(),
            name,
            email,
            password,
            role,
            department,
        };
        
        const user = await User.create(newUserPayload);

        // 5. Send back a success response
        if (user) {
            res.status(201).json({
                success: true,
                message: `${user.role} with ID ${user.userId} registered successfully`,
                user: {
                    _id: user._id,
                    userId: user.userId,
                    name: user.name,
                    role: user.role,
                },
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data received' });
        }
    } catch (error) {
        console.error("HOD SIGNUP ERROR:", error);
        // Mongoose validation errors are caught here
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};