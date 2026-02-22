import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api.jsx'; 
import '../index.css';
import { UserPlus, Mail, Phone, BookOpen, GraduationCap, Loader2 } from 'lucide-react';

function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dept: "",
        year: "",
        eventId: ""
    });
    const [events, setEvents] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await api.post("/auth/register", formData);
            
            // Log for debugging
            console.log("Success:", res.data);

            if (res.status === 200 || res.status === 201) {
                // Use a slight delay before the alert to ensure the UI isn't locked
                let successMsg = res.data.message || "Registration requested! Please wait for Admin approval.";
            if (res.data.emailWarning) {
                successMsg += "\n(Notice: " + res.data.emailWarning + ")";
            }
            alert(successMsg);
                
                // Clear form
                setFormData({ name: "", email: "", phone: "", dept: "", year: "", eventId: "" });
                
                // Redirect
                navigate("/");
            }
        } catch (err) {
            console.error("Registration error:", err);
            console.error("Error response data:", err.response?.data);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Registration failed. Please try again.";
            alert(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        // load available events for dropdown
        const fetch = async () => {
            try {
                const res = await api.get('/auth/events');
                setEvents(res.data.events || []);
            } catch (err) {
                console.error('Could not fetch events', err);
            }
        };
        fetch();
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 selection:bg-blue-500/30">
            <div className="w-full max-w-lg bg-[#141414] rounded-[2.5rem] shadow-2xl p-10 border border-zinc-800 animate-in fade-in zoom-in duration-500">
                
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 rounded-2xl bg-blue-600/10 mb-4">
                        <UserPlus className="text-blue-500" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Create Account</h1>
                    <p className="text-zinc-500 mt-2 text-sm font-medium tracking-wide">Enter your details for assessment access</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Name Field */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                name="name"
                                placeholder="John Doe"
                                className="w-full bg-black/50 px-5 py-3 rounded-xl border border-zinc-800 text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-zinc-700"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                            type="email" 
                            name="email"
                            placeholder="john@university.edu"
                            className="w-full bg-black/50 px-5 py-3 rounded-xl border border-zinc-800 text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-zinc-700"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Phone Number</label>
                        <input 
                            type="text" 
                            name="phone"
                            placeholder="10-digit mobile number"
                            className="w-full bg-black/50 px-5 py-3 rounded-xl border border-zinc-800 text-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all placeholder:text-zinc-700"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <p className="text-[9px] text-blue-500/70 font-bold mt-1 uppercase tracking-tighter italic">* This will be used as your login password.</p>
                    </div>

                    {/* Event Selection */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Event</label>
                        <select
                            name="eventId"
                            className="w-full bg-black/50 px-4 py-3 rounded-xl border border-zinc-800 text-white focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                            value={formData.eventId}
                            onChange={handleChange}
                            required
                        >
                            <option value="" className="bg-zinc-900">Select Event</option>
                            {events.map(ev => (
                                <option key={ev._id} value={ev._id} className="bg-zinc-900">
                                    {ev.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Dept and Year */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Dept</label>
                            <select 
                                name="dept"
                                className="w-full bg-black/50 px-4 py-3 rounded-xl border border-zinc-800 text-white focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                                value={formData.dept}
                                onChange={handleChange}
                                required
                            >
                                <option value="" className="bg-zinc-900">Select</option>
                                <option value="CSE" className="bg-zinc-900">CSE</option>
                                <option value="ECE" className="bg-zinc-900">ECE</option>
                                <option value="IT" className="bg-zinc-900">IT</option>
                                <option value="MECH" className="bg-zinc-900">MECH</option>
                                <option value="CIVIL" className="bg-zinc-900">CIVIL</option>
                                <option value="EEE" className="bg-zinc-900">EEE</option>
                                <option value="AI&ML" className="bg-zinc-900">AI & ML</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Year</label>
                            <select 
                                name="year"
                                className="w-full bg-black/50 px-4 py-3 rounded-xl border border-zinc-800 text-white focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
                                value={formData.year}
                                onChange={handleChange}
                                required
                            >
                                <option value="" className="bg-zinc-900">Select</option>
                                <option value="1" className="bg-zinc-900">1st Year</option>
                                <option value="2" className="bg-zinc-900">2nd Year</option>
                                <option value="3" className="bg-zinc-900">3rd Year</option>
                                <option value="4" className="bg-zinc-900">4th Year</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all mt-6 uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            "Request Registration"
                        )}
                    </button>

                    <p className="text-center text-[11px] font-medium mt-6 text-zinc-500 uppercase tracking-widest">
                        Joined before? <Link to="/" className="text-white font-black hover:text-blue-500 transition-colors">Login</Link>
                    </p>
                </form> 
            </div>
        </div>
    );
}

export default Register;