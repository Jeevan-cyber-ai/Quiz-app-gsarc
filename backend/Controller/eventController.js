const events = require('../Models/Events');
const xlsx = require('xlsx');
const Question = require('../Models/Questions');
const User = require('../Models/User');
const createEvent = async (req, res) => {
    try{
        const { title, date, time, description, location } = req.body;

        if (!title || !date || !time || !description || !location) {
            return res.status(400).json({ message: "Title, date, time, description, and location are required" });
        }

        const event = await events.create({ title, date, time, description, location });

        return res.status(201).json({ message: "Event created successfully", event });
    }

    catch(err){
        console.log("Error creating event", err);
        res.status(500).json({ message: "Error creating event" });
    }   


}

const getEvents = async (req, res) => {
    try{
        const {search} = req.query;
        let query = {};
        if(search){
            query.title = { $regex: search, $options: 'i' };
        }
        const eventList = await events.find(query).sort({ date: -1 }); 
        if(eventList.length===0){
            return res.status(404).json({ message: "No events found" });
        }      
        return res.status(200).json({ events: eventList });
    }

    catch(err){
        console.log("Error fetching events", err);
        res.status(500).json({ message: "Error fetching events" });
    }   
}

const uploadStudents = async (req, res) => {
    try {
      
        const { id } = req.params; 

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded. Please upload an Excel file." });
        }

        // 2. Parse the Excel file from the buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      console.log("Parsed data:", data);
        const students = data.map(row => ({
            name: row.Name,       // Header in Excel must be 'Name'
            email: row.Email,     // Header in Excel must be 'Email'
            phone: row.Phone.toString(), // Header in Excel must be 'Phone'
            dept: row.Dept,       // Header in Excel must be 'Dept'
            year: Number(row.Year), // Header in Excel must be 'Year'
            eventId: id,          // Attached from the URL
            role: 'student',      // Default role
            attempt: 0,           // Initialize attempt count
            marks: 0,
            isApproved:true              // Initialize marks
        }));

        
        await User.insertMany(students, { ordered: false });

        return res.status(200).json({ 
            message: `Successfully uploaded ${students.length} students to event ${id}` 
        });

    } catch (err) {
        console.error("Upload Error:", err);
        
      
        if (err.code === 11000) {
            return res.status(400).json({ message: "Some students already exist (Duplicate Email or Phone)" });
        }

        return res.status(500).json({ message: "Internal Server Error during upload" });
    }
};

const uploadQuestions = async (req, res) => {
    try {
        const eventId = req.params.id; // Now coming from the URL!
        
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if(data.length === 0) {
            return res.status(400).json({ message: "Uploaded file is empty" });
        }   
        console.log("Parsed data:", data);

        const questionList = data.map(row => ({
            questionText: row.Question,
            options: [row.Opt1, row.Opt2, row.Opt3, row.Opt4],
            correctAnswer: row.Answer,
            year: row.Year,
            dept: row.Dept,
            category: row.Category,
            eventId: eventId // Linked via URL ID
        }));

        await Question.insertMany(questionList);
        res.status(200).json({ message: "Questions uploaded to event " + eventId });
    } catch (err) {
        res.status(500).json({ message: "Error uploading questions" });
    }
};

const clearStudents = async (req, res) => {

    try{
        const { id } = req.params;
        const result = await User.deleteMany({ eventId: id, role: 'student' });
        return res.status(200).json({ message: `Deleted ${result.deletedCount} students from event ${id}` });

    }
    catch(err){
        console.log("Error clearing students", err);
        res.status(500).json({ message: "Error clearing students" });   
    }
}

const clearQuestions = async (req, res) => {

    try{
        const { id } = req.params;
        const result = await Question.deleteMany({ eventId: id });
        return res.status(200).json({ message: `Deleted ${result.deletedCount} questions from event ${id}` });      

    }
    catch(err){
        console.log("Error clearing questions", err);
        res.status(500).json({ message: "Error clearing questions" });   
    }

}

const deleteEvent = async (req, res) => {

    try{
        const { id } = req.params;
        logger.warn({
            event: "ADMIN_DELETE_EVENT",
            adminId: req.user.id,
            eventId: id,
            timestamp: new Date()
        });
        await events.findByIdAndDelete(id);         
        await Question.deleteMany({ eventId: id });     
        await User.deleteMany({ eventId:id, role: 'student' });
        return res.status(200).json({ message: `Event ${id} and all associated data deleted` });      

    }
    catch(err){
        logger.error({ event: "EVENT_DELETE_FAILED", error: err.message });
        console.log("Error deleting event", err);
        res.status(500).json({ message: "Error deleting event" });   
    }
}


const viewResults = async (req, res) => {   
    try{
        const { id } = req.params;
        const students = await User.find({ eventId: id, role: 'student' }).select('name marks marks_general marks_technical attempt');
        return res.status(200).json({ students });
    }
    catch(err){
        console.log("Error viewing results", err);
        res.status(500).json({ message: "Error viewing results" });   
    }       
}


module.exports = { createEvent, getEvents, uploadStudents, uploadQuestions,clearStudents,clearQuestions,deleteEvent,viewResults };