// server/routes/eventRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
    // HOD Functions (Retained)
    getDashboardMetrics,
    getPendingEvents,
    updateEventStatus,
    getOverallAttendance,
    generateCertificates,
    getCertificateListing,
    getHODEventDetails,
    
    // Faculty Functions
    getFacultyDashboardMetrics,
    getFacultyEvents,
    createEvent,
    getEventRegistrations,
    updateAttendance,
    getEventDetails,
    deleteEvent,
    updateEvent, // Used for the Edit button action
    
    // Student Functions (NEW IMPORTS)
    getStudentDashboardMetrics,
    getAllApprovedEvents,
    registerForEvent,
    getStudentRegisteredEvents,
    cancelRegistration,
    getStudentAttendanceHistory,
    getStudentCertificates,
    downloadCertificate
} = require('../controllers/eventController');

// All event routes require login/protection
router.use(protect);

// =======================================================
// HOD ROUTES 
// =======================================================
router.get('/hod/metrics', authorize('hod'), getDashboardMetrics);
router.get('/hod/approvals', authorize('hod'), getPendingEvents);
router.put('/hod/approvals/:eventId', authorize('hod'), updateEventStatus);
router.get('/hod/attendance', authorize('hod'), getOverallAttendance);
router.get('/hod/certificates/list', authorize('hod'), getCertificateListing);
router.post('/hod/certificates/:eventId', authorize('hod'), generateCertificates);
router.get('/hod/events/:eventId', authorize('hod'), getHODEventDetails);


// =======================================================
// FACULTY ROUTES 
// =======================================================
router.get('/faculty/metrics', authorize('faculty'), getFacultyDashboardMetrics);
router.get('/faculty/events', authorize('faculty'), getFacultyEvents);
router.post('/faculty/events', authorize('faculty'), createEvent);
router.put('/faculty/events/:eventId', authorize('faculty'), updateEvent); // Handles Edit submission
router.get('/faculty/events/:eventId', authorize('faculty'), getEventDetails); 
router.delete('/faculty/events/:eventId', authorize('faculty'), deleteEvent); 
router.get('/faculty/registrations/:eventId', authorize('faculty'), getEventRegistrations);
router.put('/faculty/attendance/:eventId/:studentId', authorize('faculty'), updateAttendance);


// =======================================================
// STUDENT ROUTES (CRITICAL ADDITION) 🚀
// =======================================================
router.get('/student/metrics', authorize('student'), getStudentDashboardMetrics);
router.get('/student/all', authorize('student'), getAllApprovedEvents); // View Events

router.post('/student/register/:eventId', authorize('student'), registerForEvent); // Register button
router.get('/student/registered', authorize('student'), getStudentRegisteredEvents); // My Registered Events list
router.delete('/student/registered/:attendanceId', authorize('student'), cancelRegistration); // Cancel button

router.get('/student/attendance', authorize('student'), getStudentAttendanceHistory); // My Attendance
router.get('/student/certificates', authorize('student'), getStudentCertificates); // Download Certificates
router.get('/student/download/certificate/:eventId', authorize('student'), downloadCertificate);

module.exports = router;