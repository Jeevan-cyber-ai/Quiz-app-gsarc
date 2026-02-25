const events = require('../Models/Events');
const xlsx = require('xlsx');
const Question = require('../Models/Questions');
const User = require('../Models/User');
const bcrypt = require("bcryptjs");
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

// GET /api/admin/events/:eventId/marksheet
const getEventMarksheet = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Fetching marksheet for event ID:", id);
        // Logic: Find all users who are associated with this eventId
        // Including their year of study for reporting
        const users = await User.find({ eventId: id })
                                .select("name dept year marks_technical marks_general marks");
        
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const getEvents = async (req, res) => {
    try{
        const {search} = req.query;
        let query = {};
        if(search){
            query.title = { $regex: search, $options: 'i' };
        }
        const eventList = await events.find(query).sort({ date: -1 }); 
        // always return list, even if empty
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
            return res.status(400).json({ message: "No file uploaded." });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // CRITICAL FIX: Use Promise.all to hash all phone numbers in parallel
        const students = await Promise.all(data.map(async (row) => {
            const rawPhone = row.Phone.toString();
            // Hash the phone number exactly like the register function does
            const hashedPassword = await bcrypt.hash(rawPhone, 10);

            return {
                name: row.Name,
                email: row.Email,
                phone: hashedPassword, // Store the hash, not the plain text
                dept: row.Dept,
                year: Number(row.Year),
                eventId: id,
                role: 'student',
                attempt: 0,
                marks: 0,
                isApproved: true
            };
        }));

        // Use ordered: false so if one email is a duplicate, the rest still upload
        await User.insertMany(students, { ordered: false });

        return res.status(200).json({ 
            message: `Successfully uploaded ${students.length} students.` 
        });

    } catch (err) {
        console.error("Upload Error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "Upload finished. Some duplicates were skipped." });
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
        console.log({
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
        console.error({ event: "EVENT_DELETE_FAILED", error: err.message });
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
 
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        // remove any attempt to change protected fields
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.eventId;
        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: "Update failed" });
    }
};

const resetAttempt = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndUpdate(id, { 
            attempt: 0, 
            isDisqualified: false, 
            warningCount: 0,
            marks: 0,
            marks_general: 0,
            marks_technical: 0,
            submitted_answers: [] 
        });
        res.status(200).json({ message: "Student reset successfully" });
    } catch (err) {
        res.status(500).json({ message: "Reset failed" });
    }
};
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData._id;
        const updatedEvent = await events.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json({ message: "Event updated", updatedEvent });
    } catch (err) {
        res.status(500).json({ message: "Event update failed" });
    }
};
module.exports = { createEvent,getEventMarksheet, getEvents, uploadStudents, uploadQuestions,clearStudents,clearQuestions,deleteEvent,viewResults, updateStudent, resetAttempt, updateEvent };