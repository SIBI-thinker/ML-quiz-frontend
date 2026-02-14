import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Login() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password) return setError('Password is required');
        setLoading(true);
        setError('');

        const data = await apiCall('/api/admin/login', {
            method: 'POST',
            auth: false,
            body: { password },
        });

        if (data.success) {
            localStorage.setItem('admin_token', data.token);
            navigate('/admin/dashboard');
        } else {
            setError(data.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
            <div className="w-full max-w-sm animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'var(--gradient-primary)' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Admin Portal</h1>
                    <p className="page-subtitle mt-1">Enter the admin password to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="glass-card-static p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="input-label">Password</label>
                            <input type="password" value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder="Enter admin password" className="input-field" autoFocus />
                        </div>
                        {error && <div className="msg-error">❌ {error}</div>}
                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                            {loading ? <><span className="spinner" /> Verifying...</> : 'Login →'}
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                    <Link to="/student" className="text-sm text-slate-500 hover:text-slate-400">← Back to Student Portal</Link>
                </div>
            </div>
        </div>
    );
}
