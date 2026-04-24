// server/server.js

// --- Load environment variables FIRST ---
require('dotenv').config();

// --- Import necessary packages ---
const express = require('express');
const cors = require('cors'); 
const connectDB = require('./config/db');

// --- Import Route Modules ---
const authRoutes = require('./routes/auth'); 
const hodRoutes = require('./routes/hod');   
const eventRoutes = require('./routes/eventRoutes');
const faceRoutes = require('./routes/faceRoutes'); // Ensure this file exists
const attendanceRoutes = require('./routes/attendanceRoutes'); // Ensure this file exists

// --- Connect to MongoDB Database ---
connectDB();

// --- Initialize Express App ---
const app = express();

// --- Middlewares ---
// Secure CORS configuration for your React frontend
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
}));

// Parse incoming JSON payloads
app.use(express.json()); 

// --- API Routes ---
// Health Check Route
app.get('/', (req, res) => {
    res.send('SPAV-SmartEvent API is running...');
});

// Mount modular routes
app.use('/api/auth', authRoutes); 
app.use('/api/hod', hodRoutes);   
app.use('/api/events', eventRoutes); 
app.use('/api/face', faceRoutes);
app.use('/api/attendance', attendanceRoutes);

// --- Global Error Handler (Optional but recommended) ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong on the server!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// --- Define the Port ---
const PORT = process.env.PORT || 5000;

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});