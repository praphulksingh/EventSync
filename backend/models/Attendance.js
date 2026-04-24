// server/models/Attendance.js

const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPresent: { type: Boolean, default: false },
}, { timestamps: true });

// Ensures only one attendance record per student per event
AttendanceSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);