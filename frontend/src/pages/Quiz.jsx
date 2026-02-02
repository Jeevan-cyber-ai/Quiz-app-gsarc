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
            return remaining > 0 ? remaining : 60; // default to 60 if expired
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

    const shuffleOptions = (options) => [...options].sort(() => Math.random() - 0.5);

    // --- SECURITY LOGIC ---
    const handleAutoSubmit = useCallback(async () => {
        if (isSubmitting.current || isTransitioning) return;
        console.warn("Security violation detected: Saving partial marks and finishing.");
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

    
        // --- FETCH QUESTIONS WITH PERSISTENCE ---
useEffect(() => {
    const fetchQuestions = async () => {
        try {
            setLoading(true);
            setQuestions([]);
            
            // Check if we already have this phase's questions saved locally
            const savedQuestions = localStorage.getItem(`quiz_questions_${phase}`);
            
            if (savedQuestions) {
                setQuestions(JSON.parse(savedQuestions));
                setLoading(false);
            } else {
                const endpoint = phase === 'general' ? '/student/general-apti' : '/student/technical-apti';
                const res = await api.get(endpoint);
                
                // Shuffle options ONCE when they arrive from the server
                const data = (res.data.questions || []).map(q => ({
                    ...q, 
                    options: [...q.options].sort(() => Math.random() - 0.5) 
                }));

                // Save to state and localStorage so refresh doesn't re-randomize
                setQuestions(data);
                localStorage.setItem(`quiz_questions_${phase}`, JSON.stringify(data));
                
                setLoading(false);
            }

            if (!localStorage.getItem('quiz_expiry')) {
                resetTimer(60);
            }
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
                    handleNext(); // Auto-move to next question
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
            localStorage.removeItem('quiz_expiry'); // Clean up before submit
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
            // 1. Clear LocalStorage IMMEDIATELY
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
                // 2. Prepare for next phase
                setTimeout(() => {
                    setAnswers([]);
                    localStorage.removeItem('quiz_questions_general');
                    setAnswers([]);
                    setCurrentIndex(0);
                    setPhase('technical');
                    resetTimer(60); // This triggers the useEffect to fetch new questions
                    setIsTransitioning(false);
                    isSubmitting.current = false; // Reset for next section
                }, 3000);
            }
        }
    }catch (err) {

            console.error("Submission failed", err);

            // Even if the network fails, if it's a proxy, kick them to results

            if (isProxy) {

                localStorage.clear();

                navigate('/view-my-result', { replace: true });

            }

            isSubmitting.current = false;

        }
};

    if (isTransitioning) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center bg-slate-50">
                <div className="bg-white p-12 rounded-3xl shadow-2xl border-t-8 border-blue-600">
                    <h2 className="text-3xl font-black text-slate-800">Section Saved!</h2>
                    <p className="text-slate-500 mt-4 text-lg">Preparing Technical Questions...</p>
                    <div className="mt-6 animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    if (loading) return <div className="p-10 text-center font-bold">Resuming {phase} questions...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 select-none">
            <div className="bg-white shadow-2xl rounded-2xl p-8 border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <span className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold uppercase">{phase} Phase</span>
                        <p className="text-slate-500 mt-1 font-medium text-sm">Question {currentIndex + 1} of {questions.length}</p>
                    </div>
                    <div className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                        00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                    </div>
                </div>

                <h2 className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">{questions[currentIndex]?.questionText}</h2>

                <div className="grid grid-cols-1 gap-4">
                    {questions[currentIndex]?.options?.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(questions[currentIndex]._id, option)}
                            className={`p-4 text-left rounded-xl border-2 transition-all ${
                                answers.find(a => a.qId === questions[currentIndex]._id)?.selected === option
                                ? 'border-blue-500 bg-blue-50 font-bold shadow-sm'
                                : 'border-slate-100 hover:border-blue-200'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                <div className="mt-10 flex justify-end">
                    <button onClick={handleNext} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg active:scale-95">
                        {currentIndex === questions.length - 1 ? 'Finish Section' : 'Next Question'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Quiz;