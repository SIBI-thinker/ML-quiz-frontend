import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Register() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [registerId, setRegisterId] = useState('');
    const [college, setCollege] = useState('');
    const [mobile, setMobile] = useState('');
    const [batchCode, setBatchCode] = useState('');
    const [isAvailable, setIsAvailable] = useState(null);
    const [availabilityMsg, setAvailabilityMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (localStorage.getItem('student_token')) {
            navigate('/student/instructions', { replace: true });
        }
    }, [navigate]);

    // Debounced availability check
    useEffect(() => {
        if (!registerId || !mobile || !batchCode) {
            setIsAvailable(null);
            setAvailabilityMsg('');
            return;
        }
        setChecking(true);
        const timer = setTimeout(async () => {
            const data = await apiCall(
                `/api/student/check-availability?register_id=${registerId}&mobile=${mobile}&batch_code=${batchCode}`,
                { auth: false }
            );
            setIsAvailable(data.available ?? null);
            setAvailabilityMsg(data.message || '');
            setChecking(false);
        }, 500);
        return () => { clearTimeout(timer); setChecking(false); };
    }, [registerId, mobile, batchCode]);

    const handleMobile = (e) => {
        const v = e.target.value;
        if (v === '' || /^\d{0,10}$/.test(v)) setMobile(v);
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) return setError('Name is required');
        if (!registerId.trim()) return setError('Register ID is required');
        if (!college.trim()) return setError('College name is required');
        if (!/^\d{10}$/.test(mobile)) return setError('Mobile must be exactly 10 digits');
        if (!batchCode.trim()) return setError('Batch code is required');

        setLoading(true);
        const data = await apiCall('/api/student/register', {
            method: 'POST',
            auth: false,
            body: { name, register_id: registerId, college, mobile, batch_code: batchCode },
        });

        if (data.success) {
            localStorage.setItem('student_token', data.token);
            localStorage.setItem('student_user', JSON.stringify(data.user));
            localStorage.setItem('batch_info', JSON.stringify(data.batch));
            navigate('/student/instructions');
        } else {
            setError(data.message);
        }
        setLoading(false);
    }, [name, registerId, college, mobile, batchCode, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
            <div className="w-full max-w-md animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'var(--gradient-primary)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            <path d="M9 10h6" /><path d="M9 14h4" />
                        </svg>
                    </div>
                    <h1 className="page-title" style={{ fontSize: '1.875rem' }}>ML Quiz Challenge</h1>
                    <p className="page-subtitle mt-2">Enter your details to join the quiz</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="glass-card-static p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="input-label">Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name" className="input-field" autoComplete="name" />
                        </div>

                        <div>
                            <label className="input-label">Register ID</label>
                            <input type="text" value={registerId} onChange={(e) => { setRegisterId(e.target.value); setError(''); }}
                                placeholder="e.g., REG-2026-001"
                                className={`input-field ${isAvailable === true ? 'success' : isAvailable === false ? 'error' : ''}`} />
                        </div>

                        <div>
                            <label className="input-label">College Name</label>
                            <input type="text" value={college} onChange={(e) => setCollege(e.target.value)}
                                placeholder="Enter your college name" className="input-field" />
                        </div>

                        <div>
                            <label className="input-label">Mobile Number</label>
                            <input type="tel" value={mobile} onChange={handleMobile}
                                placeholder="10-digit mobile number"
                                className={`input-field ${mobile.length === 10 ? 'success' : mobile.length > 0 ? 'error' : ''}`}
                                maxLength={10} />
                        </div>

                        <div>
                            <label className="input-label">Batch Code</label>
                            <input type="text" value={batchCode}
                                onChange={(e) => { setBatchCode(e.target.value.toUpperCase()); setError(''); }}
                                placeholder="Enter code from the board" className="input-field" />
                        </div>

                        {/* Availability */}
                        {(checking || isAvailable !== null) && (
                            <div className={checking ? 'msg-info' : isAvailable ? 'msg-success' : 'msg-error'}>
                                {checking ? '⏳ Checking availability...' : isAvailable ? `✅ ${availabilityMsg}` : `❌ ${availabilityMsg}`}
                            </div>
                        )}

                        {error && <div className="msg-error">❌ {error}</div>}

                        <button type="submit" disabled={loading || isAvailable === false}
                            className="btn btn-primary btn-lg w-full">
                            {loading ? <><span className="spinner" /> Registering...</> : 'Join Quiz'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <Link to="/ranks" className="text-sm text-blue-400 hover:underline block">📊 View Rankings</Link>
                    <Link to="/admin/login" className="text-sm text-gray-500 hover:text-gray-400 block">Admin Login →</Link>
                </div>
            </div>
        </div>
    );
}
