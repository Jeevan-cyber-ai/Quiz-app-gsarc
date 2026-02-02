import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Instructions from './pages/Instructions.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Quiz from './pages/Quiz.jsx';
import MyResultPage from './pages/MyResultPage.jsx';
import './index.css';
// 1. Protected Route Logic
// 1. Updated Protected Route Logic
const ProtectedRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // If no token, always go to login
    if (!token) return <Navigate to="/" replace />;

    // If the user's role doesn't match the required role for this route, 
    // send them to their own correct dashboard ONCE.
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

    // 2. Only proceed if the user clicks "OK"
    if (confirmLogout) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        
        // Optional: Clear quiz-specific data as well if you want a full reset
        localStorage.removeItem("quiz_answers");
        localStorage.removeItem("quiz_phase");
        localStorage.removeItem("quiz_index");
        localStorage.removeItem("quiz_expiry");
        localStorage.removeItem("quiz_questions_general");
        localStorage.removeItem("quiz_questions_technical");

        window.location.href = "/"; // Refresh to clear state
    };
    }
    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                {/* --- TAILWIND NAVBAR --- */}
                <nav className="bg-black shadow-lg text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16 items-center">
                            
                            {/* Brand Logo */}
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/" className="text-3xl font-bold tracking-wider flex items-center gap-2">
                                    <span className="text-4xl">🎓</span> 
                                    QUIZ PORTAL
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-6">
                                {!token ? (
                                    <>
                                        <Link to="/" className="hover:text-blue-200 transition">Login</Link>
                                        <Link to="/register" className="bg-white text-blue-700 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition shadow-md">
                                            Register
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        {role === 'student' && (
                                            <Link to="/student/dashboard" className="hover:text-blue-200">Instructions</Link>
                                        )}
                                        
                                        {role === 'admin' && (
                                            <Link to="/admin/dashboard" className="hover:text-blue-200">Admin Panel</Link>
                                        )}
                                        <button 
                                            onClick={handleLogout}
                                            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition shadow-md"
                                        >
                                            Logout
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <div className="md:hidden">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 focus:outline-none">
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
                        <div className="md:hidden bg-gray-500 px-4 pt-2 pb-4 space-y-1 border-t border-blue-600">
                            {!token ? (
                                <>
                                    <Link to="/" className="block py-2 hover:bg-slate-100 text-bold text-black rounded px-2" onClick={() => setIsMenuOpen(false)}>Login</Link>
                                    <Link to="/register" className="block py-2 hover:bg-slate-100 text-bold text-black rounded px-2" onClick={() => setIsMenuOpen(false)}>Register</Link>
                                </>
                            ) : (
                                <>
                                    {role === 'student' && (
                                            <Link to="/student/dashboard" className="hover:text-z-200">Instructions</Link>
                                        )}
                                        
                                        {role === 'admin' && (
                                            <Link to="/admin/dashboard" className="hover:text-blue-200">Admin Panel</Link>
                                        )}
                                    <button onClick={handleLogout} className="block w-full text-left py-2 text-red-300 hover:bg-blue-700 rounded px-2">Logout</button>
                                </>
                            )}
                        </div>
                    )}
                </nav>

                {/* --- MAIN PAGE CONTENT --- */}
                <div className="container mx-auto mt-8 px-4">
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Student Routes */}
                        <Route 
                            path="/student/dashboard" 
                            element={
                                <ProtectedRoute allowedRole="student">
                                  <Instructions/>
                                </ProtectedRoute>
                            } 
                        />

                        {/* Admin Dashboard */}
                        <Route 
                            path="/admin/dashboard" 
                            element={
                                <ProtectedRoute allowedRole="admin">
                                   <AdminDashboard/>
                                </ProtectedRoute>
                            } 
                        />
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
                        

                        {/* Catch-all: Redirect to Login */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;