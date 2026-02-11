import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api.jsx'; // Adjust path if needed
import '../index.css';

function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dept: "",
        year: ""
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/register", formData);
            alert(res.data.message);
            setFormData({ name: "", email: "", phone: "", dept: "", year: "" }); // Reset form
            setTimeout(() => {
                navigate("/"); // Redirect to login after success
            }, 500); // Small delay to ensure alert is visible
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-black rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-semibold text-blue-700">CREATE ACCOUNT</h1>
                    <p className="text-slate-500 mt-2">Enter your details to register for the quiz</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Name Field */}
                    <div>
                        <label className="block text-bg font-black text-slate-100 mb-1">Full Name</label>
                        <input 
                            type="text" 
                            name="name"
                            placeholder="John Doe"
                            className="w-full px-4 py-2 rounded-lg border text-white border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-bg font-bold text-slate-100 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            name="email"
                            placeholder="john@example.com"
                            className="w-full px-4 py-2 rounded-lg border text-white border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Phone (Used as Password based on your backend) */}
                    <div>
                        <label className="block text-bg font-bold text-slate-100 mb-1">Phone Number</label>
                        <input 
                            type="text" 
                            name="phone"
                            placeholder="10-digit mobile number"
                            className="w-full px-4 py-2 rounded-lg border text-white border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <p className="text-[10px] text-slate-400 mt-1">*This will be used as your login password.</p>
                    </div>

                    {/* Department and Year Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-100 mb-1">Department</label>
                            <select 
                                name="dept"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-800 text-white"
                                value={formData.dept}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select</option>
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="IT">IT</option>
                                <option value="MECH">MECH</option>
                                <option value="CSE">CIVIL</option>
                                <option value="ECE">EEE</option>
                                <option value="IT">EIE</option>
                                <option value="MECH">IBT</option>
                                <option value="IT">PROD</option>
                                <option value="MECH">AI&ML</option>


                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-100 mb-1">Year</label>
                            <select 
                                name="year"
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-800 text-white"
                                value={formData.year}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select</option>
                                <option value="1">1st</option>
                                <option value="2">2nd</option>
                                <option value="3">3rd</option>
                                <option value="4">4th</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all mt-4 active:scale-95"
                    >
                        Register Now
                    </button>

                    <p className="text-center text-green-600 text-sm mt-4">
                        Already registered? <Link to="/" className="text-blue-600 font-bold hover:underline">Login here</Link>
                    </p>
                </form> 
            </div>
        </div>
    );
}

export default Register;