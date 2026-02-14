import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Quiz() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [finished, setFinished] = useState(false);
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
            }
            setLoading(false);
        })();
    }, []);

    // Request fullscreen
    useEffect(() => {
        try { document.documentElement.requestFullscreen?.(); } catch { }
    }, []);

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

    // Anti-cheat: tab switch detection
    useEffect(() => {
        const handler = () => {
            if (document.hidden && !finished) {
                setTabSwitchCount(c => c + 1);
                setShowWarning(true);
            }
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [finished]);

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

        localStorage.removeItem('session_id');
        localStorage.removeItem('start_time');
        navigate('/student/result', { state: { result: data, autoSubmitted: isAutoSubmit } });
    }, [finished, sessionId, tabSwitchCount, navigate]);

    const handleSelectOption = (optionId) => {
        if (submitting) return;
        setSelectedOption(optionId);
    };

    const handleNext = async () => {
        if (!selectedOption || submitting) return;
        setSubmitting(true);

        const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
        const sid = sessionId || localStorage.getItem('session_id');

        await apiCall('/api/student/submit-answer', {
            method: 'POST',
            body: {
                session_id: Number(sid),
                question_id: questions[currentIndex].id,
                selected_option: selectedOption,
                time_spent_seconds: timeSpent,
            },
        });

        if (currentIndex === questions.length - 1) {
            await handleFinish(false);
        } else {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            questionStartRef.current = Date.now();
        }
        setSubmitting(false);
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const timerColor = timerSeconds <= 60 ? '#ef4444' : timerSeconds <= 180 ? '#f59e0b' : '#10b981';
    const question = questions[currentIndex];

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

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-4 sm:px-6 py-3" style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.95)' }}>
                <span className="badge badge-blue">Q {currentIndex + 1}/{questions.length}</span>
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
                                    border: `1px solid ${selectedOption === opt.id ? '#3b82f6' : '#334155'}`,
                                    background: selectedOption === opt.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                                }}>
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                        style={{
                                            background: selectedOption === opt.id ? '#3b82f6' : '#334155',
                                            color: selectedOption === opt.id ? 'white' : '#94a3b8',
                                        }}>{opt.id}</span>
                                    <span style={{ color: selectedOption === opt.id ? 'white' : '#cbd5e1', fontSize: '0.9375rem' }}>{opt.text}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button onClick={handleNext} disabled={!selectedOption || submitting}
                            className={`btn btn-lg min-w-[140px] ${currentIndex === questions.length - 1 ? 'btn-success' : 'btn-primary'}`}>
                            {submitting ? <span className="spinner" /> : currentIndex === questions.length - 1 ? 'Submit Quiz →' : 'Next →'}
                        </button>
                    </div>
                </div>
            </main>

            {/* Warning Modal */}
            {showWarning && (
                <div className="modal-overlay" onClick={() => setShowWarning(false)}>
                    <div className="modal-content text-center" onClick={e => e.stopPropagation()}>
                        <div className="text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-white mb-2">Tab Switch Detected!</h3>
                        <p className="text-slate-400 mb-4 text-sm">Switching tabs is not allowed. This has been recorded and will be visible to the admin.</p>
                        <p className="text-red-400 text-sm font-medium mb-6">Tab switches: {tabSwitchCount}</p>
                        <button onClick={() => setShowWarning(false)} className="btn btn-primary">I Understand, Continue Quiz</button>
                    </div>
                </div>
            )}
        </div>
    );
}
