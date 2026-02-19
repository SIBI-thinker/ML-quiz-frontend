import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';
import DarkVeil from '../../components/backgrounds/DarkVeil';

export default function Quiz() {
    // ... (keep logic as is)
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
    const [gracePeriod, setGracePeriod] = useState(true); // Ensure gracePeriod state is kept or restored if lost
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

    // Grace period timer
    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setGracePeriod(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    // Request fullscreen on mount
    useEffect(() => {
        requestFullscreen();
    }, []);

    // Re-enter fullscreen when tab becomes visible again
    useEffect(() => {
        if (loading || gracePeriod) return; // Restore grace period check
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
    }, [finished, loading, gracePeriod]);

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
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
                <DarkVeil />
                <div className="text-center animate-fade-in relative z-10 glass-card p-8 rounded-2xl">
                    <div className="spinner spinner-lg mx-auto mb-4 border-blue-500 border-t-transparent" />
                    <p className="text-blue-200 font-medium">Loading quiz...</p>
                </div>
            </div>
        );
    }

    // Already submitted screen
    if (alreadySubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <DarkVeil />
                <div className="w-full max-w-md text-center animate-fade-in glass-card p-10 rounded-2xl border border-white/10 shadow-2xl relative z-10">
                    <div className="text-7xl mb-6 filter drop-shadow-lg">✅</div>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Quiz Completed</h2>
                    <p className="text-slate-300 mb-8 leading-relaxed">
                        You have successfully submitted this quiz. <br />You cannot attempt it again.
                    </p>
                    <button onClick={() => navigate('/student/result')} className="btn btn-primary btn-lg w-full rounded-xl shadow-lg shadow-blue-500/20 btn-shine">
                        📊 View Result
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <DarkVeil />
            {/* Header */}
            <header className="flex items-center justify-between px-4 sm:px-6 py-3 relative z-10" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)' }}>
                {/* ... (Keep header content) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-blue shadow-lg shadow-blue-500/20">Q {currentIndex + 1}/{questions.length}</span>
                    <span className="text-slate-400 text-xs font-medium tracking-wide hidden sm:inline">{answeredCount} answered</span>
                </div>
                <div className="font-mono font-bold text-lg px-4 py-1.5 rounded-xl shadow-lg transition-colors duration-300"
                    style={{ color: timerColor, background: `${timerColor}10`, border: `1px solid ${timerColor}20`, backdropFilter: 'blur(4px)' }}>
                    ⏱ {formatTime(timerSeconds)}
                </div>
                {tabSwitchCount > 0 && (
                    <span className="badge badge-red animate-pulse">⚠ {tabSwitchCount} switch{tabSwitchCount > 1 ? 'es' : ''}</span>
                )}
            </header>

            {/* Progress */}
            <div className="h-1 bg-slate-800/50 backdrop-blur-sm relative z-10 w-full">
                <div className="h-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, background: 'var(--gradient-primary)', transition: 'width 0.5s ease' }} />
            </div>

            {/* Question */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
                <div className="w-full max-w-2xl animate-fade-in" key={currentIndex}>
                    <div className="glass-card p-6 sm:p-8 mb-6 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Question {currentIndex + 1}</p>
                            <div className="flex items-center gap-2">
                                <span className={`badge ${question?.difficulty === 'hard' ? 'badge-red' : question?.difficulty === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                                    {question?.difficulty === 'hard' ? '🔴 Hard' : question?.difficulty === 'medium' ? '🟡 Medium' : '🟢 Easy'}
                                </span>
                                <span className="badge badge-blue">{question?.marks || 1} mark{(question?.marks || 1) > 1 ? 's' : ''}</span>
                            </div>
                        </div>
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
