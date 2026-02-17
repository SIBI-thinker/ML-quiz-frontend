import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Feedback() {
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        setSubmitting(true);
        setError('');
        const data = await apiCall('/api/student/feedback', {
            method: 'POST',
            body: { rating, comment: comment.trim() || '' },
        });
        setSubmitting(false);
        if (data.success) {
            navigate('/ranks');
        } else {
            setError(data.message || 'Failed to submit feedback');
        }
    };

    const handleSkip = () => {
        navigate('/ranks');
    };

    const activeRating = hoveredStar || rating;

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
            <div className="w-full max-w-md animate-fade-in">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">💬</div>
                    <h1 className="text-2xl font-bold text-white">How was the quiz?</h1>
                    <p className="text-slate-400 text-sm mt-1">Your feedback helps us improve</p>
                </div>

                {/* Feedback Card */}
                <div className="glass-card-static p-6 mb-4">
                    {/* Star Rating */}
                    <div className="text-center mb-5">
                        <p className="text-sm text-slate-400 mb-3">Rate your experience</p>
                        <div className="feedback-stars" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(0)}
                                    className="feedback-star-btn"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '2.5rem',
                                        transition: 'transform 0.15s ease, filter 0.15s ease',
                                        transform: activeRating >= star ? 'scale(1.15)' : 'scale(1)',
                                        filter: activeRating >= star ? 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.5))' : 'none',
                                        padding: '0.25rem',
                                    }}
                                    aria-label={`Rate ${star} stars`}
                                >
                                    {activeRating >= star ? '⭐' : '☆'}
                                </button>
                            ))}
                        </div>
                        {activeRating > 0 && (
                            <p className="feedback-label" style={{
                                marginTop: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: activeRating >= 4 ? '#34d399' : activeRating >= 3 ? '#fbbf24' : '#fb923c',
                                transition: 'color 0.2s ease',
                            }}>
                                {labels[activeRating]}
                            </p>
                        )}
                    </div>

                    {/* Optional Comment */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Comments (optional)</label>
                        <textarea
                            className="input-field"
                            placeholder="Share your thoughts about the quiz..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            style={{ resize: 'vertical', minHeight: '80px' }}
                        />
                        {comment.length > 0 && (
                            <p style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'right', marginTop: '0.25rem' }}>
                                {comment.length}/1000
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && <div className="msg-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || rating === 0}
                        className="btn btn-primary btn-lg w-full"
                        style={{ marginBottom: '0.75rem' }}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                                Submitting...
                            </>
                        ) : (
                            '✨ Submit Feedback'
                        )}
                    </button>

                    {/* Skip */}
                    <button onClick={handleSkip} className="btn btn-ghost w-full" style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        Skip → View Rankings
                    </button>
                </div>
            </div>
        </div>
    );
}
