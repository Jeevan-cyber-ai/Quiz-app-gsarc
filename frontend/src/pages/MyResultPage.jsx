import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, FileText, BarChart3, ChevronDown, ChevronUp, Download } from 'lucide-react';

const MyResultPage = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReview, setShowReview] = useState(false);

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

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a]">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-zinc-500 font-black tracking-[0.3em] animate-pulse uppercase text-xs">Generating Report Dossier...</p>
        </div>
    );

    if (!result) return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-zinc-500 font-black uppercase tracking-widest">
            Session Data Not Found.
        </div>
    );

    const chartData = [
        { name: 'General', value: result.marks_general },
        { name: 'Technical', value: result.marks_technical },
    ];

    const COLORS = ['#2563eb', '#10b981'];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-4 md:p-10 selection:bg-blue-500/30">
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                
                {/* --- CENTRAL ACHIEVEMENT HEADER --- */}
                <div className="text-center space-y-6 pt-10">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-blue-600 blur-[80px] opacity-20 rounded-full"></div>
                        <div className="relative bg-[#141414] border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl inline-flex items-center justify-center">
                            <Trophy size={64} className="text-blue-500" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                            Performance <span className="text-blue-600">Analysis</span>
                        </h1>
                        <p className="text-zinc-500 font-bold tracking-widest text-xs uppercase">Official Certification of Completion</p>
                    </div>
                </div>

                {/* --- MAIN SCORE HUB (CENTRALIZED) --- */}
                <div className="bg-[#141414] border border-zinc-800 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <BarChart3 size={200} />
                    </div>

                    <div className="relative grid md:grid-cols-2 gap-12 items-center">
                        {/* Final Score Circle */}
                        <div className="flex flex-col items-center justify-center space-y-4 py-6 border-b md:border-b-0 md:border-r border-zinc-800/50">
                            <span className="text-zinc-500 text-[10px] font-black tracking-[0.4em] uppercase">Aggregate Points</span>
                            <div className="relative">
                                <div className="text-[120px] leading-none font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                    {result.marks}
                                </div>
                                <div className="absolute -bottom-2 -right-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                    Verified
                                </div>
                            </div>
                            <div className="flex gap-8 pt-6">
                                <div className="text-center">
                                    <p className="text-zinc-600 text-[9px] font-black uppercase mb-1">Attempt</p>
                                    <p className="text-xl font-bold">#01</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-zinc-600 text-[9px] font-black uppercase mb-1">Attended</p>
                                    <p className="text-xl font-bold">{result.q_attended}</p>
                                </div>
                            </div>
                        </div>

                        {/* Chart and Breakdown */}
                        <div className="space-y-8">
                            <div className="h-48 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={chartData} 
                                            innerRadius={65} outerRadius={85} 
                                            paddingAngle={10} dataKey="value" stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #27272a', borderRadius: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase">Spread</span>
                                    <span className="text-sm font-bold text-zinc-400">Sectional</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between items-center p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                        <span className="text-xs font-bold text-zinc-400 uppercase">General Aptitude</span>
                                    </div>
                                    <span className="font-black text-blue-500">{result.marks_general}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-xs font-bold text-zinc-400 uppercase">Technical Aptitude</span>
                                    </div>
                                    <span className="font-black text-emerald-500">{result.marks_technical}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ACTION BUTTONS --- */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button 
                        onClick={() => window.print()}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all group"
                    >
                        <Download size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                        Download Report
                    </button>
                    <button 
                        onClick={() => setShowReview(!showReview)}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-900/10"
                    >
                        {showReview ? <ChevronUp size={16} /> : <FileText size={16} />}
                        {showReview ? 'Collapse Analysis' : 'Deep Analytics'}
                    </button>
                </div>

                {/* --- REVIEW SECTION --- */}
                {showReview && result.review && (
                    <div className="space-y-6 pt-10 animate-in slide-in-from-top-10 duration-700">
                        <div className="flex items-center gap-6 px-4">
                            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Detailed Review</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent"></div>
                        </div>
                        
                        <div className="grid gap-4">
                            {result.review.map((item, index) => {
                                const isCorrect = item.selectedAnswer === item.correctAnswer;
                                return (
                                    <div key={index} className="bg-[#141414] p-8 rounded-[2rem] border border-zinc-800 group hover:border-zinc-700 transition-all">
                                        <div className="flex gap-6">
                                            <span className="text-zinc-800 font-black text-3xl">0{index + 1}</span>
                                            <div className="space-y-6 flex-1">
                                                <p className="text-lg font-bold text-zinc-200 leading-snug">{item.questionText}</p>
                                                
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className={`p-4 rounded-xl border-2 ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' : 'bg-rose-500/5 border-rose-500/10 text-rose-500'}`}>
                                                        <span className="text-[8px] uppercase font-black text-zinc-600 block mb-1">Your Choice</span>
                                                        <p className="font-bold text-sm uppercase tracking-tight">{item.selectedAnswer || "NOT_ATTEMPTED"}</p>
                                                    </div>
                                                    {!isCorrect && (
                                                        <div className="p-4 bg-blue-500/5 border-2 border-blue-500/10 rounded-xl text-blue-400">
                                                            <span className="text-[8px] uppercase font-black text-zinc-600 block mb-1">Correct Key</span>
                                                            <p className="font-bold text-sm uppercase tracking-tight">{item.correctAnswer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- FOOTER --- */}
                <footer className="text-center py-12 border-t border-zinc-900">
                    <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.5em]">
                        System Timestamp: {new Date().toLocaleDateString()} • Dossier ID: {result._id?.substring(0,12)}
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default MyResultPage;