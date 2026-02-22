const express = require('express');
const adminRoutes = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');
const eventController = require('../Controller/eventController');
const authController = require('../Controller/authController');

// Multer setup for Excel uploads
const upload = multer({ storage: multer.memoryStorage() });

// --- DASHBOARD & INFO ---
adminRoutes.get('/dashboard', authMiddleware, adminOnly, (req, res) => {
    return res.json({ message: "Admin Access Granted" });
});

// --- EVENT MANAGEMENT ---
adminRoutes.get('/events', authMiddleware, adminOnly, eventController.getEvents);
adminRoutes.post('/create-event', authMiddleware, adminOnly, eventController.createEvent);

// Using PATCH for updates and DELETE for deletions (RESTful standards)
adminRoutes.patch('/events/:id/update', authMiddleware, adminOnly, eventController.updateEvent);
adminRoutes.delete('/events/:id/delete', authMiddleware, adminOnly, eventController.deleteEvent);

// --- STUDENT & ATTEMPT MANAGEMENT ---
adminRoutes.get('/events/:id/students', authMiddleware, adminOnly, eventController.viewResults);
adminRoutes.get('/events/:id/marksheet', authMiddleware, adminOnly, eventController.getEventMarksheet);

// Student specific actions
adminRoutes.patch('/students/:id/update', authMiddleware, adminOnly, eventController.updateStudent);
adminRoutes.post('/students/:id/reset', authMiddleware, adminOnly, eventController.resetAttempt);

// --- BULK UPLOADS (Excel) ---
adminRoutes.post('/events/:id/upload-students', authMiddleware, adminOnly, upload.single('file'), eventController.uploadStudents);
adminRoutes.post('/events/:id/upload-questions', authMiddleware, adminOnly, upload.single('file'), eventController.uploadQuestions);

// --- USER APPROVALS ---
adminRoutes.get('/pending-approvals', authMiddleware, adminOnly, authController.getPendingUsers);
adminRoutes.post('/approve-user', authMiddleware, adminOnly, authController.handleApproval);

// --- CLEANUP ROUTES ---
// Changed to DELETE methods for better security/semantics
adminRoutes.delete('/events/:id/clear-students', authMiddleware, adminOnly, eventController.clearStudents);
adminRoutes.delete('/events/:id/clear-questions', authMiddleware, adminOnly, eventController.clearQuestions);

module.exports = adminRoutes;