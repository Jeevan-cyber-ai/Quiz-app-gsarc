const express=require('express');
const studentRoutes=express.Router();
const authMiddleware=require('../middleware/authMiddleware');
const studentOnly=require('../middleware/studentOnly');
const questionController=require('../Controller/questionController');  
const authController=require('../Controller/authController');
studentRoutes.get('/instruction',authMiddleware,studentOnly,(req,res)=>{

   return res.json({instructions:"Welcome to the Student Instructions API. Here are the steps to follow: 1. Register an account using your name, email, phone number, department, and year of study. 2. Log in with your registered email and phone number to receive an authentication token. 3. Use the token to access protected routes and resources. 4. Follow any additional instructions provided after logging in. If you encounter any issues, please contact support."});

});

studentRoutes.get('/start-quiz',authMiddleware,studentOnly,authController.canEnterQuiz);

studentRoutes.post('/add-warning', authMiddleware, studentOnly, questionController.addWarning);
studentRoutes.get('/general-apti',authMiddleware,studentOnly,questionController.getGeneralAptiQuestions);
studentRoutes.get('/technical-apti',authMiddleware,studentOnly,questionController.getTechnicalAptiQuestions);

studentRoutes.post('/submit-general', authMiddleware, studentOnly, questionController.submitGeneral);
studentRoutes.post('/submit-technical', authMiddleware, studentOnly, questionController.submitTechnical);

// 4. Final Result Route
studentRoutes.get('/final-results', authMiddleware, studentOnly, questionController.getFinalResults);

module.exports=studentRoutes;


