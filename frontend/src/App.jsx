import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Instructions from './pages/Instructions.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Quiz from './pages/Quiz.jsx';
import MyResultPage from './pages/MyResultPage.jsx';
import './index.css';

const ProtectedRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) return <Navigate to="/" replace />;

    if (allowedRole && role !== allowedRole) {
        const dest = role === 'admin' ? "/admin/dashboard" : "/student/dashboard";
        return <Navigate to={dest} replace />;
    }

    return children;
};

function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const handleLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to logout? Your current progress might be lost.");

        if (confirmLogout) {
            localStorage.clear(); // Clears everything: token, role, and quiz progress
            window.location.href = "/"; 
        }
    };

    return (
        <Router>
            {/* Main Wrapper - Changed to deep black bg-[#0a0a0a] */}
            <div className="min-h-screen bg-[#0a0a0a] text-zinc-300">
                
                {/* --- NAVBAR --- */}
                <nav className="bg-[#141414] border-b border-zinc-800 shadow-2xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20 items-center">
                            
                            {/* Brand Logo */}
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-3 text-white">
                                    <span className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">🎓</span> 
                                    <span>QUIZ<span className="text-blue-500">PORTAL</span></span>
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-8">
                                {!token ? (
                                    <>
                                        <Link to="/" className="text-sm font-bold hover:text-white transition">LOGIN</Link>
                                        <Link to="/register" className="bg-white text-black px-5 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition shadow-lg">
                                            REGISTER
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        {role === 'student' && (
                                            <Link to="/student/dashboard" className="text-sm font-bold hover:text-white">INSTRUCTIONS</Link>
                                        )}
                                        {role === 'admin' && (
                                            <Link to="/admin/dashboard" className="text-sm font-bold hover:text-white">ADMIN PANEL</Link>
                                        )}
                                        <button 
                                            onClick={handleLogout}
                                            className="bg-zinc-800 hover:bg-red-600/20 hover:text-red-500 border border-zinc-700 hover:border-red-500/50 px-5 py-2 rounded-xl text-sm font-bold transition-all"
                                        >
                                            LOGOUT
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <div className="md:hidden">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-zinc-400 hover:text-white">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {isMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden bg-[#141414] border-t border-zinc-800 px-4 py-6 space-y-4 animate-in slide-in-from-top">
                            {!token ? (
                                <>
                                    <Link to="/" className="block py-3 text-lg font-bold" onClick={() => setIsMenuOpen(false)}>Login</Link>
                                    <Link to="/register" className="block py-3 text-lg font-bold text-blue-500" onClick={() => setIsMenuOpen(false)}>Register</Link>
                                </>
                            ) : (
                                <>
                                    {role === 'student' && (
                                        <Link to="/student/dashboard" className="block py-3 text-lg font-bold" onClick={() => setIsMenuOpen(false)}>Instructions</Link>
                                    )}
                                    {role === 'admin' && (
                                        <Link to="/admin/dashboard" className="block py-3 text-lg font-bold" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>
                                    )}
                                    <button onClick={handleLogout} className="block w-full text-left py-3 text-red-500 font-bold">Logout</button>
                                </>
                            )}
                        </div>
                    )}
                </nav>

              
                <main className="container mx-auto py-10 px-4">
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        <Route path="/student/dashboard" element={
                            <ProtectedRoute allowedRole="student">
                                <Instructions/>
                            </ProtectedRoute>
                        } />

                        <Route path="/admin/dashboard" element={
                            <ProtectedRoute allowedRole="admin">
                                <AdminDashboard/>
                            </ProtectedRoute>
                        } />

                        <Route path='/quiz-starts' element={
                            <ProtectedRoute allowedRole="student">
                                <Quiz/>
                            </ProtectedRoute>
                        }/>

                        <Route path='/view-my-result' element={
                            <ProtectedRoute allowedRole="student">
                                <MyResultPage/>
                            </ProtectedRoute>
                        }/>

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;