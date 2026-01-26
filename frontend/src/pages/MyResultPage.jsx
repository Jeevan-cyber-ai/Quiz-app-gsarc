import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const MyResultPage = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReview, setShowReview] = useState(false); // New state for review toggle

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get('/student/final-results');
                setResult(res.data);
            } catch (err) {
                console.error("Error fetching results", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    if (loading) return <div className="text-center mt-20 font-bold">Calculating your score...</div>;
    if (!result) return <div className="text-center mt-20">No result found.</div>;

    const chartData = [
        { name: 'General Aptitude', value: result.marks_general },
        { name: 'Technical Aptitude', value: result.marks_technical },
    ];

    const COLORS = ['#3b82f6', '#10b981'];

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* --- YOUR ORIGINAL DESIGN START --- */}
            <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
                <div className="bg-blue-700 p-8 text-white text-center">
                    <h1 className="text-3xl font-bold uppercase tracking-widest">Quiz Report Card</h1>
                    <p className="opacity-80 mt-2">Congratulations on completing the assessment!</p>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <p className="text-blue-600 font-semibold text-sm uppercase">Total Score</p>
                            <h2 className="text-5xl font-black text-blue-900">{result.marks}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-gray-500 text-xs font-bold uppercase">Questions Attended</p>
                                <p className="text-2xl font-bold text-gray-800">{result.q_attended}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-gray-500 text-xs font-bold uppercase">Attempt Number</p>
                                <p className="text-2xl font-bold text-gray-800">1</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white border rounded-lg">
                                <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    General Aptitude
                                </span>
                                <span className="font-bold text-blue-600">{result.marks_general}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white border rounded-lg">
                                <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    Technical Aptitude
                                </span>
                                <span className="font-bold text-emerald-600">{result.marks_technical}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-64 md:h-80">
                        <h3 className="text-center text-gray-600 font-bold mb-4 uppercase text-sm">Score Distribution</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex justify-center gap-6 border-t border-gray-200">
                    <button 
                        onClick={() => window.print()}
                        className="text-blue-600 font-bold hover:underline"
                    >
                        Download as PDF
                    </button>
                    {/* NEW REVIEW BUTTON */}
                    <button 
                        onClick={() => setShowReview(!showReview)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition"
                    >
                        {showReview ? 'Hide Review' : 'Check Real Answers'}
                    </button>
                </div>
            </div>
            {/* --- YOUR ORIGINAL DESIGN END --- */}

            {/* NEW REVIEW SECTION */}
            {showReview && result.review && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <h2 className="text-2xl font-bold text-slate-800 px-2">Detailed Answer Review</h2>
                    {result.review.map((item, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                            <p className="font-bold text-slate-800 mb-3">{index + 1}. {item.questionText}</p>
                            <div className="flex flex-wrap gap-4">
                                <div className={`flex-1 p-3 rounded-xl border ${item.selectedAnswer === item.correctAnswer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Your Answer</span>
                                    <span className={`font-bold ${item.selectedAnswer === item.correctAnswer ? 'text-green-700' : 'text-red-700'}`}>
                                        {item.selectedAnswer || "Not Answered"}
                                    </span>
                                </div>
                                <div className="flex-1 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Correct Answer</span>
                                    <span className="font-bold text-blue-700">{item.correctAnswer}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyResultPage;