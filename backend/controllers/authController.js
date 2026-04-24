// server/controllers/authController.js

const User = require('../models/User'); // Import the User model
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for creating tokens

// --- Helper Function to Generate a Token ---
const generateToken = (user) => {
    // JWT payload includes userId, role, and department
    return jwt.sign(
        { 
            id: user._id, 
            userId: user.userId, 
            role: user.role, 
            department: user.department 
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: '30d',
        }
    );
};

// --- Controller for User Login (Retained) ---
// @desc    Authenticate (log in) a user
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    const { userId, password } = req.body;

    if (!userId || !password) {
        return res.status(400).json({ success: false, message: 'Please provide a User ID and password' });
    }

    try {
        const user = await User.findOne({ userId: userId.toUpperCase() }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.status(200).json({
                success: true,
                message: 'Logged in successfully',
                user: {
                    _id: user._id,
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department 
                },
                token: generateToken(user),
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid User ID or password' });
        }
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- Controller for Changing Password (NEW) ---
// @desc    Change user password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
    // req.user is populated by the 'protect' middleware using the JWT token
    const userId = req.user._id; 
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    try {
        // 1. Fetch user, explicitly selecting the password field
        // We need the password hash to compare the current password
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Check if the current password matches
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // 3. Update the password
        user.password = newPassword; 
        
        // The pre-save hook in User.js automatically handles hashing the new password.
        await user.save(); 

        // 4. Respond with success
        res.status(200).json({ success: true, message: 'Password updated successfully. Please log in again.' });

    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
exports.getUserInfo = async (req, res) => {
    // req.user is populated by the 'protect' middleware
    if (req.user) {
        res.status(200).json({ success: true, user: req.user });
    } else {
        // This case indicates token verification failed inside the middleware
        res.status(401).json({ success: false, message: 'Not authorized: Invalid token' });
    }
};