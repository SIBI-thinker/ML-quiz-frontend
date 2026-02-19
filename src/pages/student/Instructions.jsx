import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import apiCall from '../../api/api';

export default function Instructions() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const user = (() => { try { return JSON.parse(localStorage.getItem('student_user')); } catch { return null; } })();
    const batch = (() => { try { return JSON.parse(localStorage.getItem('batch_info')); } catch { return null; } })();

    const handleStart = async () => {
        setLoading(true);
        setError('');
        const data = await apiCall('/api/student/start', { method: 'POST', body: {} });

        if (data.success) {
            localStorage.setItem('session_id', data.session_id);
            localStorage.setItem('start_time', data.start_time);
            localStorage.setItem('duration_minutes', data.duration_minutes);
            localStorage.setItem('total_questions', data.total_questions);
            navigate('/student/quiz');
        } else {
            // "Quiz already started" — go to quiz page
            if (data.session_id) localStorage.setItem('session_id', data.session_id);
            setError(data.message);
            setTimeout(() => navigate('/student/quiz'), 1000);
        }
        setLoading(false);
    };

    const rules = [
        { icon: '🚫', text: 'Do not switch tabs — you will be warned and tracked.' },
        { icon: '⏱️', text: `Total time: ${batch?.duration_minutes || 15} minutes. Timer is non-pausable.` },
        { icon: '✅', text: 'Each question has only one correct answer.' },
        { icon: '💾', text: 'Your answers are auto-saved after each question.' },
        { icon: '⏰', text: 'If the timer runs out, your quiz auto-submits.' },
        { icon: '📵', text: 'The quiz will run in fullscreen mode.' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 student-bg">
            <div className="w-full max-w-lg animate-fade-in">
                <div className="text-center mb-6">
                    <h1 className="page-title">Welcome, {user?.name || 'Student'}!</h1>
                    <p className="page-subtitle mt-1">{batch?.label || 'Quiz'} • {batch?.duration_minutes || 15} minutes</p>
                </div>

                <div className="glass-card-static p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'var(--gradient-primary)' }}>📋</span>
                        Quiz Rules
                    </h2>

                    <div className="space-y-3 mb-6">
                        {rules.map((rule, i) => (
                            <div key={i} className="flex items-start gap-3 text-base">
                                <span className="text-xl flex-shrink-0">{rule.icon}</span>
                                <span className="text-slate-300">{rule.text}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1.5rem' }}>
                        <p className="text-amber-300 text-sm font-medium">
                            ⚠️ Once you start, you cannot pause or restart the quiz. Make sure you're ready!
                        </p>
                    </div>

                    {error && <div className="msg-error mb-4">{error}</div>}

                    <button onClick={handleStart} disabled={loading} className="btn btn-success btn-lg w-full btn-shine">
                        {loading ? <><span className="spinner" /> Starting...</> : '🚀 Start Quiz'}
                    </button>

                    <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '1rem', color: '#ffffff', fontWeight: 'bold', opacity: 1 }}>
                        For any help, please call the event coordinator.
                    </p>
                </div>
            </div>
        </div>
    );
}
