import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Quiz() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: optionId }
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [finished, setFinished] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const questionStartRef = useRef(Date.now());
    const timerRef = useRef(null);

    // Load questions from real API
    useEffect(() => {
        (async () => {
            const data = await apiCall('/api/student/questions');
            if (data.success) {
                setQuestions(data.questions);
                setSessionId(data.session_id);

                // Calculate remaining time from server start_time
                const startTime = new Date(data.start_time);
                const now = new Date();
                const elapsed = Math.floor((now - startTime) / 1000);
                const totalSeconds = data.duration_minutes * 60;
                setTimerSeconds(Math.max(0, totalSeconds - elapsed));
            } else if (data.message && data.message.toLowerCase().includes('already')) {
                // Quiz already submitted
                setAlreadySubmitted(true);
            }
            setLoading(false);
        })();
    }, []);

    // Request fullscreen on mount
    useEffect(() => {
        requestFullscreen();
    }, []);

    // Re-enter fullscreen when tab becomes visible again
    useEffect(() => {
        const handler = () => {
            if (document.hidden && !finished) {
                setTabSwitchCount(c => c + 1);
                setShowWarning(true);
            } else if (!document.hidden && !finished) {
                // Re-enter fullscreen when user returns
                requestFullscreen();
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [finished]);

    // Also re-enter fullscreen when exiting it (e.g., pressing Escape)
    useEffect(() => {
        const handler = () => {
            if (!document.fullscreenElement && !finished) {
                // Small delay to avoid browser blocking repeated requests
                setTimeout(() => requestFullscreen(), 300);
            }
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, [finished]);

    function requestFullscreen() {
        try { document.documentElement.requestFullscreen?.(); } catch { }
    }

    // Countdown timer
    useEffect(() => {
        if (loading || finished || timerSeconds <= 0) return;
        timerRef.current = setInterval(() => {
            setTimerSeconds(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleFinish(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [loading, finished]);

    const handleFinish = useCallback(async (isAutoSubmit = false) => {
        if (finished) return;
        setFinished(true);
        clearInterval(timerRef.current);
        try { document.exitFullscreen?.(); } catch { }

        const sid = sessionId || localStorage.getItem('session_id');
        const data = await apiCall('/api/student/finish', {
            method: 'POST',
            body: { session_id: Number(sid), tab_switch_count: tabSwitchCount },
        });

        if (!data.success && data.message && data.message.toLowerCase().includes('already')) {
            setAlreadySubmitted(true);
            return;
        }

        localStorage.removeItem('session_id');
        localStorage.removeItem('start_time');
        navigate('/student/result', { state: { result: data, autoSubmitted: isAutoSubmit } });
    }, [finished, sessionId, tabSwitchCount, navigate]);

    const handleSelectOption = (optionId) => {
        if (submitting) return;
        setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: optionId }));
    };

    const submitCurrentAnswer = async () => {
        const qId = questions[currentIndex].id;
        const selected = answers[qId];
        if (!selected) return;

        const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
        const sid = sessionId || localStorage.getItem('session_id');

        await apiCall('/api/student/submit-answer', {
            method: 'POST',
            body: {
                session_id: Number(sid),
                question_id: qId,
                selected_option: selected,
                time_spent_seconds: timeSpent,
            },
        });
    };

    const handleNext = async () => {
        const currentAnswer = answers[questions[currentIndex].id];
        if (!currentAnswer || submitting) return;
        setSubmitting(true);

        await submitCurrentAnswer();

        if (currentIndex === questions.length - 1) {
            await handleFinish(false);
        } else {
            setCurrentIndex(i => i + 1);
            questionStartRef.current = Date.now();
        }
        setSubmitting(false);
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            questionStartRef.current = Date.now();
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const timerColor = timerSeconds <= 60 ? '#ef4444' : timerSeconds <= 180 ? '#f59e0b' : '#10b981';
    const question = questions[currentIndex];
    const currentAnswer = question ? answers[question.id] : null;
    const answeredCount = Object.keys(answers).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
                <div className="text-center animate-fade-in">
                    <div className="spinner spinner-lg mx-auto mb-4" style={{ borderTopColor: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }} />
                    <p className="text-slate-400">Loading quiz...</p>
                </div>
            </div>
        );
    }

    // Already submitted screen
    if (alreadySubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
                <div className="w-full max-w-md text-center animate-fade-in">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>Quiz Already Submitted</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>
                        You have already submitted this quiz. You cannot submit again.
                    </p>
                    <button onClick={() => navigate('/student/result')} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                        📊 View Your Result
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-4 sm:px-6 py-3" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.95)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-blue">Q {currentIndex + 1}/{questions.length}</span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{answeredCount} answered</span>
                </div>
                <div className="font-mono font-bold text-lg px-4 py-1.5 rounded-lg"
                    style={{ color: timerColor, background: `${timerColor}15`, border: `1px solid ${timerColor}30` }}>
                    ⏱ {formatTime(timerSeconds)}
                </div>
                {tabSwitchCount > 0 && (
                    <span className="badge badge-red">⚠ {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}</span>
                )}
            </header>

            {/* Progress */}
            <div style={{ height: 4, background: '#1e293b' }}>
                <div style={{ height: '100%', width: `${((currentIndex + 1) / questions.length) * 100}%`, background: 'var(--gradient-primary)', transition: 'width 0.5s ease' }} />
            </div>

            {/* Question */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-2xl animate-fade-in" key={currentIndex}>
                    <div className="glass-card-static p-6 sm:p-8 mb-6">
                        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Question {currentIndex + 1}</p>
                        <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed">{question?.text}</h2>
                    </div>

                    <div className="space-y-3">
                        {question?.options.map((opt) => (
                            <button key={opt.id} onClick={() => handleSelectOption(opt.id)} disabled={submitting}
                                className="w-full text-left p-4 rounded-xl transition-all duration-200"
                                style={{
                                    border: `1px solid ${currentAnswer === opt.id ? '#3b82f6' : '#334155'}`,
                                    background: currentAnswer === opt.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                                }}>
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                        style={{
                                            background: currentAnswer === opt.id ? '#3b82f6' : '#334155',
                                            color: currentAnswer === opt.id ? 'white' : '#94a3b8',
                                        }}>{opt.id}</span>
                                    <span style={{ color: currentAnswer === opt.id ? 'white' : '#cbd5e1', fontSize: '0.9375rem' }}>{opt.text}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={handlePrev} disabled={currentIndex === 0}
                            className="btn btn-outline btn-lg" style={{ minWidth: 120, opacity: currentIndex === 0 ? 0.3 : 1 }}>
                            ← Previous
                        </button>
                        <button onClick={handleNext} disabled={!currentAnswer || submitting}
                            className={`btn btn-lg ${currentIndex === questions.length - 1 ? 'btn-success' : 'btn-primary'}`} style={{ minWidth: 140 }}>
                            {submitting ? <span className="spinner" /> : currentIndex === questions.length - 1 ? 'Submit Quiz →' : 'Next →'}
                        </button>
                    </div>
                </div>
            </main>

            {/* Warning Modal — with fullscreen re-entry */}
            {showWarning && (
                <div className="modal-overlay" onClick={() => { setShowWarning(false); requestFullscreen(); }}>
                    <div className="modal-content text-center" onClick={e => e.stopPropagation()}>
                        <div className="text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-white mb-2">Tab Switch Detected!</h3>
                        <p className="text-slate-400 mb-4 text-sm">Switching tabs is not allowed. This has been recorded and will be visible to the admin.</p>
                        <p className="text-red-400 text-sm font-medium mb-6">Tab switches: {tabSwitchCount}</p>
                        <button onClick={() => { setShowWarning(false); requestFullscreen(); }} className="btn btn-primary">I Understand, Continue Quiz</button>
                    </div>
                </div>
            )}
        </div>
    );
}
