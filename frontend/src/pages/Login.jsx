import { React, useState } from "react";
import api from "../utils/api.jsx";
import { useNavigate } from "react-router-dom";
import '../index.css';

function Login() {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/auth/login", { email, phone });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", res.data.role);
            
            if (res.data.role === "admin") {
                window.location.href = "/admin/dashboard";
            } else {
                window.location.href = "/student/dashboard";
            }
        } catch (err) {
            alert(err.response?.data?.message || "Login failed");
        }
    };

    return (
        /* Main Background - Using a deep neutral black */
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            
            {/* Login Card */}
            <div className="w-full max-w-md bg-[#141414] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-10 border border-zinc-800">
                
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="inline-block p-3 bg-blue-600/10 rounded-full mb-4">
                        <span className="text-3xl">🔑</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                    <p className="text-zinc-500 mt-2 font-medium">Examination Portal Access</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Username Input */}
                    <div>
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 ml-1">
                            Email Address
                        </label>
                        <input 
                            type="email" 
                            placeholder="name@company.com" 
                            autoComplete="on"
                            className="w-full px-4 py-3 bg-[#1c1c1c] rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={email} 
                            required 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 ml-1">
                            Password
                        </label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            className="w-full px-4 py-3 bg-[#1c1c1c] rounded-xl border border-zinc-800 text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            value={phone} 
                            required 
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    {/* Login Button */}
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:shadow-blue-600/20 active:scale-[0.98]"
                    >
                        Sign In
                    </button>
                </form>

                {/* Optional Footer */}
                <p className="text-center text-zinc-600 text-sm mt-8">
                    Need help? <a href="#" className="text-blue-500 hover:underline">Contact Administrator</a>
                </p>
            </div>
        </div>
    );
}

export default Login;