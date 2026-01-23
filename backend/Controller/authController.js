const User=require('../Models/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');

exports.register=async(req,res)=>{
    const {name,email,phone,dept,year}=req.body;
    if (!name||!email||!phone||!dept||!year) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword=await bcrypt.hash(phone,10);

  

    try{
        const user=await User.create({name,email,phone:hashedPassword,dept,year,isApproved: false});
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS  // Your App Password
            },
            tls: {
        rejectUnauthorized: false // Fixes the certificate error you had
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

        res.status(200).json({ 
            message: "Registration requested! Please wait for Admin approval before logging in." 
        });
    }
    catch(err){ 

        console.log("Error in user registration",err);
        return res.status(500).json({message:"Error in user registration"});
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

