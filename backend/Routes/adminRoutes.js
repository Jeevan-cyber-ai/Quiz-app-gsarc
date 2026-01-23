const express=require('express');
const adminRoutes=express.Router();
const multer = require('multer');
const authMiddleware=require('../middleware/authMiddleware');
const adminOnly=require('../middleware/adminOnly');
const eventController=require('../Controller/eventController');
const authController=require('../Controller/authController');
adminRoutes.get('/dashboard',authMiddleware,adminOnly,(req,res)=>{

   return res.json({instructions:"Welcome to the Admin Dashboard API. Here are the steps to follow: 1. Register an account using your name, email, phone number, department, and year of study. 2. Log in with your registered email and phone number to receive an authentication token. 3. Use the token to access protected routes and resources. 4. Follow any additional instructions provided after logging in. If you encounter any issues, please contact support."});

});
const upload = multer({ storage: multer.memoryStorage() });
adminRoutes.post('/create-event',authMiddleware,adminOnly,eventController.createEvent);

adminRoutes.get('/events',authMiddleware,adminOnly,eventController.getEvents);

adminRoutes.post(
    '/events/:id/upload-students', 
    authMiddleware, 
    adminOnly, 
    upload.single('file'), 
    eventController.uploadStudents
);

adminRoutes.post(
    '/events/:id/upload-questions', 
    authMiddleware, 
    adminOnly, 
    upload.single('file'), 
    eventController.uploadQuestions
);
// authRoutes.js or adminRoutes.js
adminRoutes.get('/pending-approvals', authMiddleware, adminOnly, authController.getPendingUsers);
adminRoutes.post('/approve-user', authMiddleware, adminOnly, authController.handleApproval);
adminRoutes.get('/events/:id/clear-students',authMiddleware,adminOnly,eventController.clearStudents);
adminRoutes.get('/events/:id/clear-questions',authMiddleware,adminOnly,eventController.clearQuestions);
adminRoutes.get('/events/:id/delete',authMiddleware,adminOnly,eventController.deleteEvent);

adminRoutes.get('/events/:id/view-results',authMiddleware,adminOnly,eventController.viewResults);
module.exports=adminRoutes;

