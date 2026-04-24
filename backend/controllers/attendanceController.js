const Attendance = require('../models/Attendance');

exports.markAttendance = async (req, res) => {
    const { studentId, eventId } = req.body;

    try {
        // Find or create attendance record
        const attendance = await Attendance.findOneAndUpdate(
            { student: studentId, event: eventId },
            { isPresent: true },
            { upsert: true, new: true }
        );
        res.status(200).json({ success: true, message: "Attendance marked!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};