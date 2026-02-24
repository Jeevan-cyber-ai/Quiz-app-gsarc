const Question=require('../Models/Questions');
const User=require('../Models/User');
const getGeneralAptiQuestions = async (req, res) => {
    try {
        const QUESTION_COUNT = 20; 
      const user = await User.findById(req.user.id);
if (user.isDisqualified || user.attempt === 1) {
    return res.status(403).json({ message: "You are no longer allowed to access this quiz." });
}

        const questions = await Question.aggregate([
            { 
                $match: { category: "General Aptitude" } 
            },
            { 
                $sample: { size: QUESTION_COUNT } 
            },
            {
                $project: {
                    questionText: 1,
                    options: 1
                    
                }
            }
        ]);

        if (questions.length === 0) {
            return res.status(404).json({ message: "No questions found" });
        }

        return res.status(200).json({ questions });
    } catch (err) {
        console.log("Error fetching questions", err);
        res.status(500).json({ message: "Error fetching questions" });
    }
};const getTechnicalAptiQuestions = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("dept year");
if (user.isDisqualified || user.attempt === 1) {
    return res.status(403).json({ message: "You are no longer allowed to access this quiz." });
}
        if (!user || !user.dept || !user.year) {
            return res.status(400).json({ message: "User profile incomplete (dept/year missing)" });
        }

        const QUESTION_COUNT = 20;

        const questions = await Question.aggregate([
            {
                $match: {
                    category: "Technical Aptitude",
                    dept: user.dept,
                    year: Number(user.year) // Ensures the year matches the number type in DB
                }
            },
            { $sample: { size: QUESTION_COUNT } }, // Randomize
            {
                $project: {
                    questionText: 1,
                    options: 1
                }
            }
        ]);

        if (questions.length === 0) {
            return res.status(404).json({ message: "No technical questions found for your dept/year" });
        }

        return res.status(200).json({ questions });
    } catch (err) {
        console.log("Error fetching technical questions", err);
        res.status(500).json({ message: "Error fetching questions" });
    }
};
const calculateScore = async (answers, expectedCategory) => {
    let score = 0;
    for (const item of answers) {
        const question = await Question.findById(item.qId);
        // Only count points if the question matches the section being submitted
        if (question && 
            question.category === expectedCategory && 
            question.correctAnswer === item.selected) {
            score++;
        }
    }
    return score;
};
// Updated calculateScore to verify category
const submitGeneral = async (req, res) => {
    try {
        const { answers, isProxy } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const score = await calculateScore(answers, "General Aptitude");
        
        user.marks_general = score;
        user.marks = (user.marks_technical || 0) + score;
        user.q_attended = answers.length + (user.q_attended_tech || 0);
        
        // Use a Set or specific logic to prevent duplicate answer entries
        user.submitted_answers = answers; // For general, just overwrite to be safe

        if (isProxy) user.attempt = 1;
        await user.save();

        // ALWAYS return a clear status
        return res.status(200).json({ success: true, message: "General submitted", score });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }
};

const submitTechnical = async (req, res) => {
    try {
        const { answers, isProxy } = req.body;
        // 1. Calculate the score for the Technical section
        const score = await calculateScore(answers, "Technical Aptitude");
       
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // 2. Update individual marks
        user.marks_technical = score;
        
        // 3. Update total marks (General + Technical)
        user.marks = (user.marks_general || 0) + score;
        
        // 4. Update total questions attended (Cumulative)
        user.q_attended = (user.q_attended || 0) + answers.length;
        
        // 5. STORE ANSWERS FOR REVIEW:
        // We spread existing answers (from General) and add these new Technical ones
        user.submitted_answers = [...(user.submitted_answers || []), ...answers];

        // 6. Mark the attempt as complete
        user.attempt = 1; 

        await user.save();
        res.json({ message: "Technical submitted", score });
    } catch (err) {
        console.error("Technical Submission Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
const getFinalResults = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("marks marks_general marks_technical q_attended submitted_answers");

        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch the questions to get the correct answers
        const questionIds = user.submitted_answers.map(ans => ans.qId);
        const questions = await Question.find({ _id: { $in: questionIds } });

        // Map the answers for the review section
        const review = user.submitted_answers.map(ans => {
            const question = questions.find(q => q._id.toString() === ans.qId.toString());
            return {
                questionText: question ? question.questionText : "Question no longer available",
                correctAnswer: question ? question.correctAnswer : "N/A",
                selectedAnswer: ans.selected
            };
        });

        res.json({
            marks: user.marks,
            marks_general: user.marks_general,
            marks_technical: user.marks_technical,
            q_attended: user.q_attended,
            review: review
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching final results" });
    }
};
// Controller/questionController.js
const addWarning = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.warningCount += 1;

        if (user.warningCount >= 2) {
            user.isDisqualified = true;
            user.attempt = 1; // Mark attempt as finished
            await user.save();
            return res.status(200).json({ 
                warningCount: user.warningCount, 
                action: "terminate",
                message: "Disqualified due to multiple security violations." 
            });
        }

        await user.save();
        return res.status(200).json({ 
            warningCount: user.warningCount, 
            action: "continue",
            message: "Warning issued." 
        });
    } catch (err) {
        console.error("Warning Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Don't forget to add addWarning to your module.exports at the bottom


module.exports={addWarning,getGeneralAptiQuestions,getTechnicalAptiQuestions,submitGeneral,submitTechnical,getFinalResults};   