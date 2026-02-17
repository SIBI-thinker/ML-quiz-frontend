import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Result() {
    const location = useLocation();
    const navigate = useNavigate();
    const passedResult = location.state?.result;
    const autoSubmitted = location.state?.autoSubmitted;
    const [result, setResult] = useState(passedResult?.success ? passedResult : null);
    const [published, setPublished] = useState(!!passedResult?.success);
    const [loading, setLoading] = useState(!passedResult?.success);

    useEffect(() => {
        async function loadResult() {
            const data = await apiCall('/api/student/result');
            if (data.success) {
                setPublished(data.published);
                if (data.published) setResult(data.result);
            }
            setLoading(false);
        }

        if (!passedResult?.success) {
            loadResult();
        } else {
            setLoading(false);
        }

        // Poll every 10 seconds until results are published
        const interval = setInterval(async () => {
            const data = await apiCall('/api/student/result');
            if (data.success && data.published) {
                setPublished(true);
                setResult(data.result);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [passedResult]);

    const score = result?.score ?? 0;
    const totalMarks = result?.total_marks ?? result?.total_questions ?? 0;
    const total = result?.total_questions ?? 0;
    const timeTaken = result?.time_taken ?? 0;
    const rank = result?.rank ?? null;
    const status = result?.status ?? 'completed';
    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

    const handleLogout = () => {
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_user');
        localStorage.removeItem('batch_info');
        localStorage.removeItem('session_id');
        localStorage.removeItem('start_time');
        localStorage.removeItem('duration_minutes');
        localStorage.removeItem('total_questions');
        navigate('/student');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
                <div className="spinner spinner-lg" style={{ borderTopColor: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">{pct >= 80 ? '🏆' : pct >= 50 ? '✅' : '📝'}</div>
                    <h1 className="text-2xl font-bold text-white">{autoSubmitted ? "Time's Up!" : 'Quiz Submitted!'}</h1>
                    {autoSubmitted && <p className="text-amber-400 text-sm mt-1">Your quiz was auto-submitted because the timer ran out.</p>}
                </div>

                {/* Score Card */}
                <div className="glass-card-static p-6 mb-4">
                    <div className="text-center mb-6">
                        <div className="text-5xl font-bold" style={{
                            background: pct >= 80 ? 'var(--gradient-success)' : pct >= 50 ? 'var(--gradient-primary)' : 'var(--gradient-danger)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>{score}/{totalMarks}</div>
                        <p className="text-slate-400 text-sm mt-1">{pct}% • {total} questions</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                            <p className="text-xs text-slate-500 mb-1">Time Taken</p>
                            <p className="text-white font-semibold">{formatTime(timeTaken)}</p>
                        </div>
                        <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center' }}>
                            <p className="text-xs text-slate-500 mb-1">Status</p>
                            <span className={`badge ${status === 'qualified_r2' ? 'badge-green' : 'badge-blue'}`}>
                                {status === 'qualified_r2' ? 'Qualified ✅' : 'Completed'}
                            </span>
                        </div>
                        {rank && (
                            <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center', gridColumn: 'span 2' }}>
                                <p className="text-xs text-slate-500 mb-1">Your Rank</p>
                                <p className="text-2xl font-bold text-white">#{rank}</p>
                            </div>
                        )}
                    </div>
                </div>

                {!published && (
                    <div className="glass-card-static p-4 mb-4 text-center">
                        <p className="text-slate-400 text-sm">Results have not been published yet. This page will auto-refresh.</p>
                    </div>
                )}

                <div className="space-y-3">
                    <Link to="/student/feedback" className="btn btn-primary btn-lg w-full">📝 Give Feedback</Link>
                </div>
            </div>
        </div>
    );
}
