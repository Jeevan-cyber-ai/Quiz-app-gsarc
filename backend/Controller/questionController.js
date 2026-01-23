const Question=require('../Models/Questions');
const User=require('../Models/User');

const getGeneralAptiQuestions=async(req,res)=>{
     try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
   
   
    const questions = await Question.find({ category: "General Aptitude" })
     if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found" });
    }

    return res.status(200).json({questions});
    }
    catch(err){
        console.log("Error fetching questions",err);
        res.status(500).json({message:"Error fetching questions"}); 

    }


}
const getTechnicalAptiQuestions=async(req,res)=>{
     try {
    const userId = req.user.id;
    console.log("User ID from token:", userId);

    const user = await User.findById(userId).select("dept year");   
   console.log("User details:", user);
    if (!user) {
        
      return res.status(404).json({ message: "User not found" });
    }
    const { dept, year } = user;
    const QUESTION_COUNT = 20;
   if (!dept || !year) {
    console.log(req.body.dept);
    console.log(req.body.year); 
    return res.status(400).json({ message: "dept and year required" });
  }
    const questions = await Question.aggregate([
      {
        $match: {
          category: "Technical Aptitude",
          dept: dept,
          year: Number(year)
        }
      },
      { $sample: { size: QUESTION_COUNT } },
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

    return res.status(200).json({questions});
    }
    catch(err){
        console.log("Error fetching questions",err);
        res.status(500).json({message:"Error fetching questions"}); 

    }


}
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
        // Pass "General Aptitude" as the expected category
        const score = await calculateScore(answers, "General Aptitude");
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update individual mark
        user.marks_general = score;
        // Correct total: Current Tech Marks + New General Marks
        user.marks = (user.marks_technical || 0) + score;
        // Total attended: whatever they submitted now + whatever they attended in tech before
        user.q_attended = answers.length + (user.q_attended_tech || 0);

        if (isProxy) user.attempt = 1;

        await user.save();
        res.json({ message: "General submitted", score });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

const submitTechnical = async (req, res) => {
    try {
        const { answers, isProxy } = req.body;
        // Pass "Technical Aptitude" as the expected category
        const score = await calculateScore(answers, "Technical Aptitude");
       
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update individual mark
        user.marks_technical = score;
        // Correct total: Current General Marks + New Technical Marks
        user.marks = (user.marks_general || 0) + score;
        // Aggregate total questions attended
        user.q_attended = (user.q_attended || 0) + answers.length;
        
        user.attempt = 1; 

        await user.save();
        res.json({ message: "Technical submitted", score });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
const getFinalResults = async (req, res) => {
    const user = await User.findById(req.user.id).select("marks marks_general marks_technical q_attended");
    res.json(user);
};

module.exports={getGeneralAptiQuestions,getTechnicalAptiQuestions,submitGeneral,submitTechnical,getFinalResults};   