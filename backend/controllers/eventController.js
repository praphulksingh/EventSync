// server/controllers/eventController.js

const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const User = require('../models/User'); 
const mongoose = require('mongoose');

// =======================================================
//                    HOD FUNCTIONS
// =======================================================

// --- HOD DASHBOARD METRICS ---
// @route   GET /api/events/hod/metrics
exports.getDashboardMetrics = async (req, res) => {
    try {
        const department = req.user.department;
        
        const pendingApprovals = await Event.countDocuments({ 
            department,
            status: 'pending' 
        });

        const totalEventsThisMonth = await Event.countDocuments({
            department,
            status: 'approved',
            date: { 
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            }
        });

        // Simplified calculation for overall attendance
        const totalAttendanceRecords = await Attendance.countDocuments({});
        const totalPresentRecords = await Attendance.countDocuments({ isPresent: true });
        
        const overallAttendance = totalAttendanceRecords > 0 
            ? Math.round((totalPresentRecords / totalAttendanceRecords) * 100)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                pendingApprovals,
                totalEventsThisMonth,
                overallAttendance: `${overallAttendance}%`
            }
        });

    } catch (error) {
        console.error('METRICS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// --- EVENT APPROVALS ---
// @route   GET /api/events/hod/approvals
exports.getPendingEvents = async (req, res) => {
    try {
        const events = await Event.find({ 
            department: req.user.department, 
            status: 'pending' 
        }).populate('proposedBy', 'name userId'); // <-- Requires Event model
        
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        console.error('PENDING EVENTS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   PUT /api/events/hod/approvals/:eventId
exports.updateEventStatus = async (req, res) => {
    const { eventId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    try {
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        // Basic authorization check
        if (event.department !== req.user.department) {
             return res.status(403).json({ success: false, message: 'Not authorized to manage this event.' });
        }

        event.status = status;
        await event.save();

        res.status(200).json({ success: true, message: `Event ${status} successfully.`, data: event });
    } catch (error) {
        console.error('UPDATE EVENT STATUS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// --- ATTENDANCE ---
// @route   GET /api/events/hod/attendance
exports.getOverallAttendance = async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find({})
            .populate('event', 'name date department')
            .populate('student', 'name userId');

        const departmentAttendance = attendanceRecords.filter(record => record.event && record.event.department === req.user.department);

        res.status(200).json({ success: true, data: departmentAttendance });
    } catch (error) {
        console.error('OVERALL ATTENDANCE ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


// --- CERTIFICATES ---
// @route   POST /api/events/hod/certificates/:eventId
exports.generateCertificates = async (req, res) => {
    const { eventId } = req.params;

    try {
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.certificatesGenerated) {
            return res.status(400).json({ success: false, message: 'Certificates already generated for this event.' });
        }
        if (event.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Certificates can only be generated for approved events.' });
        }

        const attendees = await Attendance.find({ event: eventId, isPresent: true })
            .populate('student', 'name userId email');

        if (attendees.length === 0) {
            return res.status(400).json({ success: false, message: 'No students marked present for this event.' });
        }

        event.certificatesGenerated = true;
        await event.save();

        const certifiedUsers = attendees.map(record => ({
            name: record.student.name,
            userId: record.student.userId,
            status: 'Certificate issued/emailed'
        }));

        res.status(200).json({ 
            success: true, 
            message: `Certificates successfully generated for ${certifiedUsers.length} students.`, 
            data: certifiedUsers 
        });

    } catch (error) {
        console.error('CERTIFICATE GENERATION ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// --- CERTIFICATE LISTING ---
// @route   GET /api/events/hod/certificates/list
exports.getCertificateListing = async (req, res) => {
    try {
        // Fetch all APPROVED events matching the HOD's department
        const events = await Event.find({ 
            department: req.user.department,
            status: 'approved' 
        })
        .select('name date certificatesGenerated')
        .sort({ date: 1 });

        res.status(200).json({ success: true, data: events });

    } catch (error) {
        console.error('CERTIFICATE LISTING ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// =======================================================
//                  FACULTY FUNCTIONS
// =======================================================

// --- FACULTY DASHBOARD METRICS ---
// @route   GET /api/events/faculty/metrics
exports.getFacultyDashboardMetrics = async (req, res) => {
    try {
        const proposedBy = req.user._id;
        
        const eventsCreated = await Event.countDocuments({ proposedBy });
        const pendingApproval = await Event.countDocuments({ proposedBy, status: 'pending' });

        const upcomingApprovedEvents = await Event.countDocuments({
            proposedBy,
            status: 'approved',
            date: { $gte: new Date() }
        });

        res.status(200).json({
            success: true,
            data: {
                eventsCreated,
                pendingApproval,
                upcomingApprovedEvents
            }
        });

    } catch (error) {
        console.error('FACULTY METRICS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- MANAGE EVENTS (CREATE/VIEW/EDIT) ---
// @route   GET /api/events/faculty/events
exports.getFacultyEvents = async (req, res) => {
    try {
        const events = await Event.find({ proposedBy: req.user._id }).sort({ date: -1 });
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        console.error('FETCH FACULTY EVENTS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   POST /api/events/faculty/events
exports.createEvent = async (req, res) => {
    try {
        const { name, date, department } = req.body;
        
        if (!name || !date || !department) {
            return res.status(400).json({ success: false, message: 'Please provide name, date, and department.' });
        }

        const event = await Event.create({
            name,
            date: new Date(date),
            department: req.user.department,
            proposedBy: req.user._id,
            status: 'pending'
        });

        res.status(201).json({ success: true, message: 'Event created and sent for HOD approval.', data: event });
    } catch (error) {
        console.error('CREATE EVENT ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- STUDENT REGISTRATIONS ---
// @route   GET /api/events/faculty/registrations/:eventId
exports.getEventRegistrations = async (req, res) => {
    const { eventId } = req.params;
    
    try {
        const event = await Event.findOne({ _id: eventId, proposedBy: req.user._id });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized.' });
        }
        
        // Fetch users who are linked to this event (simulating registration)
        const attendanceRecords = await Attendance.find({ event: eventId })
            .populate('student', 'name userId email');

        res.status(200).json({ success: true, event: event.name, data: attendanceRecords });

    } catch (error) {
        console.error('FETCH REGISTRATIONS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- MANAGE ATTENDANCE ---
// @route   PUT /api/events/faculty/attendance/:eventId/:studentId
exports.updateAttendance = async (req, res) => {
    const { eventId, studentId } = req.params;
    const { isPresent } = req.body;

    if (typeof isPresent !== 'boolean') {
        return res.status(400).json({ success: false, message: 'Invalid attendance status.' });
    }

    try {
        const event = await Event.findOne({ _id: eventId, proposedBy: req.user._id });
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized.' });
        }

        // Find and update the attendance record (upsert: true creates if it doesn't exist)
        const record = await Attendance.findOneAndUpdate(
            { event: eventId, student: studentId },
            { isPresent: isPresent },
            { new: true, upsert: true }
        );

        const status = isPresent ? 'Present' : 'Absent';
        res.status(200).json({ 
            success: true, 
            message: `Student marked ${status} for ${event.name}.`,
            data: record
        });
        
    } catch (error) {
        console.error('UPDATE ATTENDANCE ERROR:', error);
        if (error instanceof mongoose.Error.CastError) {
             return res.status(400).json({ success: false, message: 'Invalid ID format.' });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @route   GET /api/events/faculty/events/:eventId
exports.getEventDetails = async (req, res) => {
    try {
        const event = await Event.findOne({ 
            _id: req.params.eventId, 
            proposedBy: req.user._id // Ensure only the proposing faculty can view
        }).populate('proposedBy', 'name userId');
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized.' });
        }

        res.status(200).json({ success: true, data: event });
    } catch (error) {
        console.error('FETCH EVENT DETAILS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   DELETE /api/events/faculty/events/:eventId
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findOneAndDelete({
            _id: req.params.eventId,
            proposedBy: req.user._id, // Ensure only the proposing faculty can delete
            status: { $ne: 'approved' } // Prevent deletion if the event is already approved
        });

        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found, unauthorized, or cannot be deleted (must be pending/rejected).' 
            });
        }

        res.status(200).json({ success: true, message: 'Event deleted successfully.' });
    } catch (error) {
        console.error('DELETE EVENT ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   PUT /api/events/faculty/events/:eventId
exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const { name, date } = req.body; // Assume faculty can only change name and date

        // 1. Find the existing event and check authorization/status
        const event = await Event.findOne({
            _id: eventId,
            proposedBy: req.user._id, // Must be proposed by the current user
        });

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or unauthorized.' });
        }
        
        // 2. CRITICAL: Prevent editing if already approved
        if (event.status === 'approved') {
            return res.status(403).json({ success: false, message: 'Cannot edit an event that is already approved.' });
        }

        // 3. Update fields
        if (name) event.name = name;
        if (date) event.date = new Date(date);

        await event.save();

        res.status(200).json({ success: true, message: 'Event updated successfully. Still pending HOD approval.', data: event });

    } catch (error) {
        console.error('UPDATE EVENT ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};


exports.getStudentDashboardMetrics = async (req, res) => {
    try {
        const studentId = req.user._id;

        // 1. Registered Events (Events with an attendance record, regardless of presence)
        const registrations = await Attendance.find({ student: studentId })
            .populate('event', 'status');

        const registeredEvents = registrations.length;

        // 2. Attendance History and Rate
        const attendedEvents = registrations.filter(r => r.event.status !== 'pending').length;
        const eventsPresent = registrations.filter(r => r.isPresent).length;

        const attendanceRate = attendedEvents > 0 
            ? `${Math.round((eventsPresent / attendedEvents) * 100)}%`
            : '0%';

        // 3. Certificates Earned (Events where certificateGenerated is true AND student was present)
        const certificatesEarned = registrations.filter(r => 
            r.isPresent && r.event.certificatesGenerated
        ).length;

        res.status(200).json({
            success: true,
            data: {
                registeredEvents,
                attendanceRate,
                certificatesEarned,
            }
        });

    } catch (error) {
        console.error('STUDENT METRICS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- VIEW AVAILABLE EVENTS FOR REGISTRATION ---
// @route   GET /api/events/student/all
exports.getAllApprovedEvents = async (req, res) => {
    const studentId = req.user._id;

    try {
        // 1. Find all events the student is currently registered for (or attended)
        const registeredEventIds = await Attendance.find({ student: studentId }).distinct('event');

        // 2. Find all APPROVED events that the student is NOT registered for
        const availableEvents = await Event.find({
            status: 'approved',
            _id: { $nin: registeredEventIds } // Exclude events the student is already linked to
        }).select('name date department status');

        res.status(200).json({ success: true, data: availableEvents });

    } catch (error) {
        console.error('STUDENT ALL EVENTS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- REGISTER FOR AN EVENT ---
// @route   POST /api/events/student/register/:eventId
exports.registerForEvent = async (req, res) => {
    const { eventId } = req.params;
    const studentId = req.user._id;

    try {
        const event = await Event.findById(eventId);
        if (!event || event.status !== 'approved') {
            return res.status(404).json({ success: false, message: 'Event not found or registration is closed.' });
        }

        // Create the attendance/registration record (isPresent=false by default)
        const registration = await Attendance.create({
            event: eventId,
            student: studentId,
            isPresent: false,
        });

        res.status(200).json({ success: true, message: `Successfully registered for ${event.name}. Awaiting event date.`, data: registration });

    } catch (error) {
        // Handle duplicate registration error (unique index on eventId + studentId)
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You are already registered for this event.' });
        }
        console.error('STUDENT REGISTER ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- VIEW MY REGISTERED EVENTS (for cancel button) ---
// @route   GET /api/events/student/registered
exports.getStudentRegisteredEvents = async (req, res) => {
    const studentId = req.user._id;

    try {
        // Find all attendance records for the student
        const registrations = await Attendance.find({ student: studentId })
            .populate('event', 'name date department status');

        // Map data into a format suitable for the frontend (including registration ID for cancellation)
        const registeredEvents = registrations.map(reg => ({
            attendanceId: reg._id, // Use this ID for the DELETE route
            name: reg.event.name,
            date: reg.event.date,
            department: reg.event.department,
            status: reg.event.status,
            isPresent: reg.isPresent
        }));

        res.status(200).json({ success: true, data: registeredEvents });

    } catch (error) {
        console.error('STUDENT REGISTERED EVENTS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- CANCEL REGISTRATION ---
// @route   DELETE /api/events/student/registered/:attendanceId
exports.cancelRegistration = async (req, res) => {
    const { attendanceId } = req.params;
    const studentId = req.user._id;

    try {
        // Find and delete the attendance record, ensuring the record belongs to the student
        const result = await Attendance.findOneAndDelete({
            _id: attendanceId,
            student: studentId
        });

        if (!result) {
            return res.status(404).json({ success: false, message: 'Registration not found or unauthorized.' });
        }

        res.status(200).json({ success: true, message: 'Registration cancelled successfully.' });

    } catch (error) {
        console.error('CANCEL REGISTRATION ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- VIEW MY ATTENDANCE HISTORY ---
// @route   GET /api/events/student/attendance
exports.getStudentAttendanceHistory = async (req, res) => {
    const studentId = req.user._id;

    try {
        // Get all attendance records for the student where the event status is NOT pending
        const attendanceRecords = await Attendance.find({ student: studentId })
            .populate('event', 'name date'); 
            
        // Filter out records for events that haven't happened/approved yet (if needed, simplified here)
        const history = attendanceRecords.filter(record => record.event.date < new Date() && record.event.status !== 'pending');

        res.status(200).json({ success: true, data: history });

    } catch (error) {
        console.error('STUDENT ATTENDANCE HISTORY ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// --- VIEW MY CERTIFICATES ---
// @route   GET /api/events/student/certificates
exports.getStudentCertificates = async (req, res) => {
    const studentId = req.user._id;

    try {
        // 1. Find all attendance records where the student was present
        const presentRecords = await Attendance.find({ student: studentId, isPresent: true })
            .populate('event', 'name date certificatesGenerated');

        // 2. Filter for events where certificates have been generated by the HOD
        const certificates = presentRecords.filter(r => 
            r.event && r.event.certificatesGenerated
        );

        // 3. CRITICAL FIX: Map the data to include ONLY the necessary event fields
        const certificateList = certificates.map(r => ({
            _id: r.event._id, // Event ID for the download link
            name: r.event.name, // Event Name
            date: r.event.date, // Event Date
        }));
        
        // The frontend will now receive a clean list like: [{_id, name, date}, ...]

        res.status(200).json({ success: true, data: certificateList });

    } catch (error) {
        console.error('STUDENT CERTIFICATES ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.downloadCertificate = async (req, res) => {
    const { eventId } = req.params;
    const studentId = req.user._id;

    // In a real application, you would check the database for the event/attendance
    // and then use a library (like PDFKit) to generate the file.
    
    // MOCK: Simulate success by sending a plain text file.
    if (eventId) {
        res.setHeader('Content-disposition', `attachment; filename=Certificate_Event_${eventId}.txt`);
        res.setHeader('Content-type', 'text/plain');
        return res.send(`Certificate of Participation\n\nThis certifies that ${req.user.name} (ID: ${req.user.userId}) successfully completed the event: ${eventId}.\n\nCertificate issued by SPAV-SmartEvent.`);
    }
    
    res.status(404).json({ success: false, message: 'Certificate not found.' });
};
exports.getHODEventDetails = async (req, res) => {
    try {
        const event = await Event.findOne({ 
            _id: req.params.eventId, 
            department: req.user.department // Must be in HOD's department
        }).populate('proposedBy', 'name userId');
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found or outside your department.' });
        }

        res.status(200).json({ success: true, data: event });
    } catch (error) {
        console.error('FETCH HOD EVENT DETAILS ERROR:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};