import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api'; 
import { useNavigate } from 'react-router-dom';

const Quiz = () => {
    // 1. Persistence Initialization
    const [phase, setPhase] = useState(() => localStorage.getItem('quiz_phase') || 'general'); 
    const [currentIndex, setCurrentIndex] = useState(() => parseInt(localStorage.getItem('quiz_index')) || 0);
    const [answers, setAnswers] = useState(() => JSON.parse(localStorage.getItem('quiz_answers')) || []);
    
    const [questions, setQuestions] = useState([]);
    const [timeLeft, setTimeLeft] = useState(() => {
        const savedExpiry = localStorage.getItem('quiz_expiry');
        if (savedExpiry) {
            const remaining = Math.floor((parseInt(savedExpiry) - Date.now()) / 1000);
            return remaining > 0 ? remaining : 60; 
        }
        return 60;
    });

    const resetTimer = useCallback((seconds = 60) => {
        const expiryTime = Date.now() + seconds * 1000;
        localStorage.setItem('quiz_expiry', expiryTime.toString());
        setTimeLeft(seconds);
    }, []);

    const [loading, setLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const navigate = useNavigate();

    const answersRef = useRef(answers);
    const phaseRef = useRef(phase);
    const isSubmitting = useRef(false);

    // 2. State Persistence
    useEffect(() => {
        answersRef.current = answers;
        phaseRef.current = phase;
        localStorage.setItem('quiz_answers', JSON.stringify(answers));
        localStorage.setItem('quiz_phase', phase);
        localStorage.setItem('quiz_index', currentIndex.toString());
    }, [answers, phase, currentIndex]);

    // --- SECURITY LOGIC ---
    const handleAutoSubmit = useCallback(async () => {
        if (isSubmitting.current || isTransitioning) return;
        console.warn("Security violation: Tab switched or blurred.");
        await submitSection(true); 
    }, [isTransitioning]);

    useEffect(() => {
        const handleVisibility = () => { if (document.hidden) handleAutoSubmit(); };
        const handleBlur = () => { handleAutoSubmit(); };
        window.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('blur', handleBlur);
        };
    }, [handleAutoSubmit]);

    // --- FETCH QUESTIONS ---
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);
                setQuestions([]);
                const savedQuestions = localStorage.getItem(`quiz_questions_${phase}`);
                
                if (savedQuestions) {
                    setQuestions(JSON.parse(savedQuestions));
                    setLoading(false);
                } else {
                    const endpoint = phase === 'general' ? '/student/general-apti' : '/student/technical-apti';
                    const res = await api.get(endpoint);
                    const data = (res.data.questions || []).map(q => ({
                        ...q, 
                        options: [...q.options].sort(() => Math.random() - 0.5) 
                    }));
                    setQuestions(data);
                    localStorage.setItem(`quiz_questions_${phase}`, JSON.stringify(data));
                    setLoading(false);
                }

                if (!localStorage.getItem('quiz_expiry')) resetTimer(60);
                isSubmitting.current = false;
            } catch (err) {
                setLoading(false);
                if (err.response?.status === 403 || err.response?.status === 401) {
                    navigate('/view-my-result', { replace: true });
                }
            }
        };
        fetchQuestions();
    }, [phase, navigate, resetTimer]);

    // --- TIMER ---
    useEffect(() => {
        if (loading || questions.length === 0 || isTransitioning) return;
        const timer = setInterval(() => {
            const savedExpiry = localStorage.getItem('quiz_expiry');
            if (savedExpiry) {
                const remaining = Math.floor((parseInt(savedExpiry) - Date.now()) / 1000);
                if (remaining <= 0) {
                    clearInterval(timer);
                    setTimeLeft(0);
                    handleNext(); 
                } else {
                    setTimeLeft(remaining);
                }
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, loading, questions, isTransitioning]);

    const handleAnswerSelect = (qId, selected) => {
        setAnswers(prev => {
            const otherAnswers = prev.filter(a => a.qId !== qId);
            return [...otherAnswers, { qId, selected }];
        });
    };

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            resetTimer(60);
        } else {
            localStorage.removeItem('quiz_expiry');
            await submitSection(false);
        }
    };

    const submitSection = async (isProxy = false) => {
        if (isSubmitting.current) return;
        isSubmitting.current = true;
        try {
            const endpoint = phaseRef.current === 'general' ? '/student/submit-general' : '/student/submit-technical';
            const response = await api.post(endpoint, { 
                answers: answersRef.current, 
                isProxy: isProxy 
            });

            if (response.status === 200) {
                localStorage.removeItem('quiz_answers');
                localStorage.removeItem('quiz_index');
                localStorage.removeItem('quiz_expiry');

                if (isProxy || phaseRef.current === 'technical') {
                    localStorage.removeItem('quiz_phase');
                    navigate('/view-my-result', { replace: true });
                    return;
                }

                if (phaseRef.current === 'general') {
                    setIsTransitioning(true);
                    setTimeout(() => {
                        setAnswers([]);
                        localStorage.removeItem('quiz_questions_general');
                        setCurrentIndex(0);
                        setPhase('technical');
                        resetTimer(60);
                        setIsTransitioning(false);
                        isSubmitting.current = false;
                    }, 3000);
                }
            }
        } catch (err) {
            if (isProxy) {
                localStorage.clear();
                navigate('/view-my-result', { replace: true });
            }
            isSubmitting.current = false;
        }
    };

    // Transition State UI
    if (isTransitioning) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
                <div className="bg-[#141414] border border-zinc-800 p-12 rounded-[2.5rem] shadow-2xl max-w-md">
                    <div className="text-6xl mb-6">🎯</div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">SECTION COMPLETE</h2>
                    <p className="text-zinc-500 mt-4 text-lg font-medium">Loading <span className="text-blue-500">Technical Phase</span> questions...</p>
                    <div className="mt-8 flex justify-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-zinc-500 font-black animate-pulse tracking-widest uppercase">Initializing Quiz Environment...</div>
        </div>
    );

    const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto p-4 select-none animate-in fade-in duration-700">
            {/* PROGRESS BAR */}
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mb-8 overflow-hidden border border-zinc-800">
                <div 
                    className="bg-blue-600 h-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            <div className="bg-[#141414] shadow-2xl rounded-[2.5rem] p-8 md:p-12 border border-zinc-800 relative overflow-hidden">
                {/* TIMER GLOW BACKGROUND */}
                {timeLeft <= 10 && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse shadow-[0_0_20px_#dc2626]"></div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {phase} PHASE
                            </span>
                            <span className="text-zinc-600 font-black text-[10px] uppercase tracking-widest">
                                SECURED SESSION
                            </span>
                        </div>
                        <p className="text-zinc-400 mt-3 font-bold text-lg">
                            Question <span className="text-white">{currentIndex + 1}</span> <span className="text-zinc-600">/ {questions.length}</span>
                        </p>
                    </div>
                    
                    <div className={`px-6 py-3 rounded-2xl border font-mono text-3xl font-black transition-all duration-300 ${
                        timeLeft <= 10 
                        ? 'bg-red-600/10 border-red-500 text-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : 'bg-zinc-900 border-zinc-800 text-white'
                    }`}>
                        00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                    </div>
                </div>

                {/* QUESTION TEXT */}
                <h2 className="text-xl md:text-2xl font-bold text-white mb-10 leading-snug tracking-tight">
                    {questions[currentIndex]?.questionText}
                </h2>

                {/* OPTIONS GRID */}
                <div className="grid grid-cols-1 gap-4">
                    {questions[currentIndex]?.options?.map((option, index) => {
                        const isSelected = answers.find(a => a.qId === questions[currentIndex]._id)?.selected === option;
                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(questions[currentIndex]._id, option)}
                                className={`group p-5 text-left rounded-2xl border-2 transition-all duration-200 flex items-center justify-between ${
                                    isSelected
                                    ? 'border-blue-600 bg-blue-600/5 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800'
                                }`}
                            >
                                <span className={`font-bold transition-colors ${isSelected ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                    {option}
                                </span>
                                {isSelected && (
                                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white">
                                        ✓
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ACTION BUTTON */}
                <div className="mt-12 flex justify-end">
                    <button 
                        onClick={handleNext} 
                        className="group flex items-center gap-3 bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        <span>{currentIndex === questions.length - 1 ? 'FINISH SECTION' : 'NEXT QUESTION'}</span>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>
            </div>

            {/* SECURITY WARNING */}
            <p className="mt-6 text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
                ⚠️ Warning: Do not switch tabs or minimize window. Session is being monitored.
            </p>
        </div>
    );
};

export default Quiz;