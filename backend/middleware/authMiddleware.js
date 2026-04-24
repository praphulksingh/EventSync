// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

/**
 * Middleware to protect routes by verifying JWT
 */
exports.protect = async (req, res, next) => {
    let token;

    // 1. Check for token in Authorization Header (Standard API call)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    // 2. CRITICAL FIX: Check for token in URL Query Parameter (For file downloads)
    else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        // This rejection happens when the token is not found anywhere
        return res.status(401).json({ message: 'Not authorized, no token' }); 
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //console.log("JWT Decoded:", decoded);

        // Find user by ID and attach to request object
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        next();
    } catch (error) {
        //console.error('JWT ERROR:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

/**
 * Middleware to restrict access to certain roles (e.g., 'hod') (RETAINED)
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role || 'unauthorized'} is not authorized to access this route` 
            });
        }
        next();
    };
};

/**
 * Middleware to restrict access to certain roles (e.g., 'hod')
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role || 'unauthorized'} is not authorized to access this route` 
            });
        }
        next();
    };
};