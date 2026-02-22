const User=require('../Models/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');

exports.register=async(req,res)=>{
    const {name,email,phone,dept,year,eventId}=req.body;
    if (!name||!email||!phone||!dept||!year||!eventId) {
    return res.status(400).json({ message: "All fields are required including selected event" });
  }

  const hashedPassword=await bcrypt.hash(phone,10);

    try{
        // Prevent duplicate registrations by checking for existing email
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "Email already registered" });
        }
        // verify event exists
        // easier: require Events model here
        const Events = require('../Models/Events');
        const ev = await Events.findById(eventId);
        if (!ev) {
            return res.status(400).json({ message: "Selected event does not exist" });
        }

        const user = await User.create({ name, email, phone: hashedPassword, dept, year, eventId, isApproved: false });
        
        // Try to send email, but don't block registration if it fails
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER, // Your email
                    pass: process.env.EMAIL_PASS  // Your App Password or app-specific password
                },
                tls: {
                    rejectUnauthorized: false // may help with certificate issues
                }
            });

            // verify transport config before sending - useful for debugging
            transporter.verify((err, success) => {
                if (err) {
                    console.error('Mail transporter verification failed:', err);
                } else {
                    console.log('Mail transporter verified');
                }
            });

            // 2. EMAIL CONTENT
            const mailOptions = {
                from: `Quiz Registration System <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL, // Admin's Email
                subject: `Action Required: New Registration Request - ${name}`,
                html: `
                    <h3>New External Registration Request</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Department:</strong> ${dept}</p>
                    <p>Please log in to the Admin Dashboard to approve or reject this user.</p>
                `
            };

            // 3. SEND EMAIL
            await transporter.sendMail(mailOptions);
            console.log("Approval email sent successfully to", process.env.ADMIN_EMAIL);
        } catch (emailErr) {
            console.error("Email sending failed:", emailErr);
            // Don't block registration if email fails but warn in response
            emailError = emailErr.message || String(emailErr);
        }

        let responseObj = { 
            message: "Registration requested! Please wait for Admin approval before logging in." 
        };
       
        res.status(200).json(responseObj);
    }
    catch(err){ 

        console.log("Error in user registration:", err.message);
        console.log("Full error:", err);
        
        // Handle Mongo duplicate-key error if it slips through
        if (err && err.code === 11000) {
            return res.status(409).json({ message: "Email already registered" });
        }
        
        // Return more detailed error info for debugging
        return res.status(500).json({
            message: "Error in user registration",
            error: err.message
        });
    }           


}
// exports.login in Controller/authController.js
exports.login = async (req, res) => {
    const { email, phone } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or phone" });

        // BLOCK IF NOT APPROVED
        if (!user.isApproved) {
            return res.status(403).json({ 
                message: "Your registration is still pending approval from the Admin." 
            });
        }

        const isMatch = await bcrypt.compare(phone, user.phone);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or phone" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        return res.status(200).json({ message: "Login successful", token, role: user.role });

    } catch (err) {
        return res.status(500).json({ message: "Error in user login" });
    }
};
// Add to authController.js
exports.getPendingUsers = async (req, res) => {
    try {
        const pending = await User.find({ isApproved: false, role: 'student' });
        res.status(200).json(pending);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch requests" });
    }
};

exports.handleApproval = async (req, res) => {
    const { userId, status } = req.body; // status: 'approved' or 'rejected'
    try {
        if (status === 'approved') {
            await User.findByIdAndUpdate(userId, { isApproved: true });
            res.status(200).json({ message: "User approved successfully!" });
        } else {
            await User.findByIdAndDelete(userId);
            res.status(200).json({ message: "Registration request rejected and deleted." });
        }
    } catch (err) {
        res.status(500).json({ message: "Action failed" });
    }
};


exports.canEnterQuiz = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select("attempt");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

       
        if (user.attempt < 1) {
            return res.status(200).json({ 
                canEnter: true, 
                message: "You are eligible to start the quiz." 
            });
        } else {
            return res.status(403).json({ 
                canEnter: false, 
                message: "Access Denied: You have already completed your attempt." 
            });
        }

    } catch (err) {
        console.error("Error checking quiz eligibility:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

