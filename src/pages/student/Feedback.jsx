import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Feedback() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [hoveredStars, setHoveredStars] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    useEffect(() => {
        (async () => {
            const data = await apiCall('/api/public/feedback-questions', { auth: false });
            if (data.success && data.questions?.length > 0) {
                setQuestions(data.questions);
            }
            setLoading(false);
        })();
    }, []);

    const setAnswer = (qId, field, value) => {
        setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], question_id: qId, [field]: value } }));
    };

    const handleSubmit = async () => {
        for (const q of questions) {
            if (q.question_type === 'rating' && (!answers[q.id]?.rating_value || answers[q.id].rating_value < 1)) {
                setError(`Please rate: "${q.question_text}"`);
                return;
            }
            if (q.question_type === 'paragraph' && (!answers[q.id]?.text_value || !answers[q.id].text_value.trim())) {
                setError(`Please answer: "${q.question_text}"`);
                return;
            }
        }

        setSubmitting(true);
        setError('');

        const answersList = questions.map(q => ({
            question_id: q.id,
            rating_value: answers[q.id]?.rating_value || null,
            text_value: answers[q.id]?.text_value || null,
        }));

        const data = await apiCall('/api/student/feedback', {
            method: 'POST',
            body: { answers: answersList },
        });

        setSubmitting(false);
        if (data.success) {
            navigate('/ranks');
        } else {
            setError(data.message || 'Failed to submit feedback');
        }
    };

    if (loading) {
        return (
            <div className="student-bg min-h-screen flex items-center justify-center">
                <div className="spinner spinner-lg border-blue-500 border-t-transparent" />
            </div>
        );
    }

    if (questions.length === 0) {
        navigate('/ranks');
        return null;
    }

    return (
        <div className="student-bg min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg animate-scale-in">
                {/* Header */}
                <div className="text-center mb-8 relative z-10">
                    <div className="text-6xl mb-4 drop-shadow-md filter hover:scale-110 transition-transform duration-300 inline-block">💬</div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">How was the quiz?</h1>
                    <p className="text-blue-200/80 text-base mt-2 font-medium">Your feedback helps us improve the experience.</p>
                </div>

                {/* Feedback Card */}
                <div className="glass-card p-8 mb-6 relative z-10 border border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="space-y-8">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="group">
                                {/* Question Label */}
                                <p className="text-base font-semibold text-slate-200 mb-3 flex items-start gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">{idx + 1}</span>
                                    {q.question_text}
                                </p>

                                {q.question_type === 'rating' ? (
                                    <div className="text-center bg-slate-900/30 rounded-xl p-4 border border-white/5 mx-2">
                                        <div className="flex justify-center gap-2 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const active = (hoveredStars[q.id] || answers[q.id]?.rating_value || 0) >= star;
                                                return (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setAnswer(q.id, 'rating_value', star)}
                                                        onMouseEnter={() => setHoveredStars(h => ({ ...h, [q.id]: star }))}
                                                        onMouseLeave={() => setHoveredStars(h => ({ ...h, [q.id]: 0 }))}
                                                        className="transition-all duration-200 focus:outline-none"
                                                        style={{
                                                            fontSize: '3.5rem',
                                                            transform: active ? 'scale(1.2)' : 'scale(1)',
                                                            filter: active ? 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.6))' : 'grayscale(100%) opacity(0.3)',
                                                        }}
                                                        aria-label={`Rate ${star} stars`}
                                                    >
                                                        {active ? '⭐' : '⭐'}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {(hoveredStars[q.id] || answers[q.id]?.rating_value) > 0 && (
                                            <p className="text-base font-bold transition-colors duration-300"
                                                style={{
                                                    color: (hoveredStars[q.id] || answers[q.id]?.rating_value) >= 4 ? '#4ade80'
                                                        : (hoveredStars[q.id] || answers[q.id]?.rating_value) >= 3 ? '#facc15' : '#fb923c',
                                                }}>
                                                {labels[hoveredStars[q.id] || answers[q.id]?.rating_value]}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <textarea
                                            className="input-field w-full rounded-xl bg-slate-900/50 border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all p-4 text-slate-200 placeholder-slate-500"
                                            placeholder="Descriptive answer..."
                                            value={answers[q.id]?.text_value || ''}
                                            onChange={(e) => setAnswer(q.id, 'text_value', e.target.value)}
                                            maxLength={2000}
                                            rows={3}
                                            style={{ resize: 'vertical', minHeight: '100px' }}
                                        />
                                        <div className="absolute bottom-3 right-3 text-xs text-slate-500 font-mono pointer-events-none">
                                            {answers[q.id]?.text_value?.length || 0}/2000
                                        </div>
                                    </div>
                                )}

                                {idx < questions.length - 1 && (
                                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mt-8" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Error */}
                    {error && <div className="msg-error mt-6 bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg text-center text-sm">{error}</div>}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="btn btn-primary btn-lg w-full mt-8 rounded-xl shadow-lg shadow-blue-600/20 btn-shine relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="spinner w-5 h-5 border-2" />
                                Submitting...
                            </span>
                        ) : (
                            <span className="font-bold tracking-wide">Submit Feedback ✨</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
