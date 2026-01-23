import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // Ensure this matches your axios instance path

const InstructionPage = () => {
    const navigate = useNavigate();
    const [isAgreed, setIsAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [accessError, setAccessError] = useState(null);

    const handleStart = async () => {
        if (!isAgreed) return;

        setLoading(true);
        setAccessError(null);

        try {
            // Call the canEnterQuiz controller via the route defined in your studentRoutes
            const res = await api.get('/student/start-quiz');
            
            if (res.data.canEnter) {
                navigate('/quiz-starts');
            }
        } catch (err) {
            // Handle the 403 Forbidden error from your authController
            if (err.response && err.response.status === 403) {
                setAccessError(err.response.data.message);
            } else {
                setAccessError("A connection error occurred. Please refresh and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl w-full space-y-8 bg-white p-2 rounded-3xl shadow-2xl shadow-blue-100 border border-slate-100">
                
                {/* Visual Header */}
                <div className={`rounded-2xl p-8 text-center shadow-lg transition-colors duration-500 ${accessError ? 'bg-red-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                        <span className="text-3xl">{accessError ? '🚫' : '📝'}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                        {accessError ? 'Access Denied' : 'Candidate Guidelines'}
                    </h1>
                    <p className="mt-2 text-blue-100 font-medium">
                        {accessError ? 'Attempt Limit Reached' : 'Please review the protocols for your examination'}
                    </p>
                </div>

                <div className="px-6 py-4 md:px-10">
                    {accessError ? (
                        // Professional Access Denied View
                        <div className="py-10 text-center space-y-4">
                            <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                                <p className="text-red-700 font-semibold text-lg">{accessError}</p>
                                <p className="text-slate-500 mt-2">
                                    Our records show that you have already completed or initiated your examination attempt. 
                                    If you believe this is an error, please contact your department administrator.
                                </p>
                            </div>
                            <button 
                                onClick={() => navigate('/view-my-result')}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                View My Results Instead →
                            </button>
                        </div>
                    ) : (
                        // Standard Instructions View
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="group">
                                    <h2 className="flex items-center text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3 text-sm">01</span>
                                        Quiz Structure
                                    </h2>
                                    <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
                                        <li className="flex items-start"><span className="text-blue-500 mr-2">•</span> <strong>One Attempt:</strong> You are allowed only one login session.</li>
                                        <li className="flex items-start"><span className="text-blue-500 mr-2">•</span> <strong>Sequential Flow:</strong> General must be finished before Technical.</li>
                                    </ul>
                                </div>

                                <div className="group">
                                    <h2 className="flex items-center text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">02</span>
                                        Anti-Cheat System
                                    </h2>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-xs text-slate-500">
                                            Switching tabs or minimizing the browser will trigger an <strong>automatic final submission</strong> and count as your used attempt.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 flex flex-col justify-between">
                                <div>
                                    <h2 className="flex items-center text-lg font-bold text-slate-800 mb-3 uppercase tracking-wider">
                                        <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 text-sm">03</span>
                                        Scoring Policy
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                                            <p className="text-xs text-emerald-600 font-bold uppercase">Correct</p>
                                            <p className="text-xl font-bold text-emerald-800">+1 Mark</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                            <p className="text-xs text-slate-500 font-bold uppercase">Wrong</p>
                                            <p className="text-xl font-bold text-slate-800">0 Mark</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                    <label className="flex items-center p-4 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={isAgreed}
                                            onChange={() => setIsAgreed(!isAgreed)}
                                            className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-sm text-slate-600 font-medium">
                                            I certify that I have read and agree to all exam protocols.
                                        </span>
                                    </label>

                                    <button 
                                        onClick={handleStart}
                                        disabled={!isAgreed || loading}
                                        className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg 
                                            ${isAgreed && !loading 
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl hover:-translate-y-1' 
                                                : 'bg-slate-300 cursor-not-allowed shadow-none'}`}
                                    >
                                        {loading ? "Checking Eligibility..." : "Proceed to Examination"}
                                        {!loading && <span className="text-xl">→</span>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 rounded-b-3xl text-center">
                    <p className="text-xs text-slate-400 italic tracking-widest uppercase">Secure Session Active</p>
                </div>
            </div>
        </div>
    );
};

export default InstructionPage;