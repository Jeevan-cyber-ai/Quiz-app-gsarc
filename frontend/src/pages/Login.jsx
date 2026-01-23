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
            // Inside your login success handler
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("role", res.data.role);
            const role = res.data.role;
            console.log("User role:", role);
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
      
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white-100 rounded-2xl shadow-2xl p-10 border border-slate-200">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-semibold text-blue-500 mb-4">LOGIN</h2>
                    <p className="text-slate-500 font-medium">Examination Portal</p>
                </div>
                 

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">USERNAME</label>
                        <input 
                            type="email" 
                            placeholder="Enter email (ex@gmail.com)" 
                            autoComplete="on"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={email} 
                            required 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                        <input 
                            type="password" 
                            placeholder="Enter password  (phone number)" 
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={phone} 
                            required 
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-700 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-transform active:scale-95"
                    >
                        Login
                    </button>
                </form> 
            </div>
        </div>
    );
}

export default Login;