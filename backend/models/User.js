const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- Main User Schema ---
const userSchema = new mongoose.Schema({
    userId: { // NEW PRIMARY LOGIN FIELD
        type: String,
        required: [true, 'Please provide a User ID'],
        unique: true, // Enforce uniqueness for login
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: { // Retained but not strictly enforced for login
        type: String,
        required: [true, 'Please provide an email'],
        // REMOVED: unique: true, and email regex match
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'hod'],
        required: true,
    },
    faceDescriptor: {
    type: [Number], // Storing the array of numbers (128 floats)
    default: null
    },
    // --- Role-Specific Fields ---
    department: {
        type: String,
        // Department is required for faculty and hod
        required: function() { return this.role === 'faculty' || this.role === 'hod'; },
        trim: true,
    },
    // REMOVED: studentId field
}, {
    timestamps: true,
});

// --- Middleware to Hash the Password (Pre-Save Hook) ---
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// --- Custom Method to Compare Passwords ---
userSchema.methods.matchPassword = async function(enteredPassword) {
    // Ensure this.password is not null/undefined before comparing
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// --- Create and Export the User Model ---
const User = mongoose.model('User', userSchema);

module.exports = User;