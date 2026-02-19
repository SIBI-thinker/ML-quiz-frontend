import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiCall from '../../api/api';
import { getQuizConfig } from '../../api/quizConfig';

export default function TeamRegister() {
    const navigate = useNavigate();

    // Leader fields
    const [name, setName] = useState('');
    const [registerId, setRegisterId] = useState('');
    const [college, setCollege] = useState('');
    const [mobile, setMobile] = useState('');
    const [batchCode, setBatchCode] = useState('');

    // Team fields
    const [teamName, setTeamName] = useState('');
    const [minSize, setMinSize] = useState(2);
    const [maxSize, setMaxSize] = useState(4);
    const [teamMembers, setTeamMembers] = useState([]);

    // UI state
    const [isAvailable, setIsAvailable] = useState(null);
    const [availabilityMsg, setAvailabilityMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [quizTitle, setQuizTitle] = useState('Quiz Challenge');

    useEffect(() => {
        getQuizConfig(true).then(config => {
            // If switched back to individual mode, redirect to individual register
            if (config.registration_type !== 'team') {
                navigate('/student', { replace: true });
                return;
            }

            if (config.quiz_title) setQuizTitle(config.quiz_title);

            const min = config.min_team_size !== undefined ? parseInt(config.min_team_size) : 0;
            const max = config.max_team_size !== undefined ? parseInt(config.max_team_size) : 4;
            setMinSize(min);
            setMaxSize(max);

            // Initialize with min size
            setTeamMembers(Array.from({ length: min }, () => ({ name: '', register_id: '' })));
        });
    }, [navigate]);

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
                `/api/student/check-availability?register_id=${encodeURIComponent(registerId)}&mobile=${encodeURIComponent(mobile)}&batch_code=${encodeURIComponent(batchCode)}`,
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

    const updateTeamMember = (index, field, value) => {
        setTeamMembers(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    };

    const addMember = () => {
        if (teamMembers.length < maxSize) {
            setTeamMembers(prev => [...prev, { name: '', register_id: '' }]);
        }
    };

    const removeMember = (index) => {
        if (teamMembers.length > minSize) {
            setTeamMembers(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) return setError('Team leader name is required');
        if (!registerId.trim()) return setError('Leader Register ID is required');
        if (!college.trim()) return setError('College name is required');
        if (!/^\d{10}$/.test(mobile)) return setError('Mobile must be exactly 10 digits');
        if (!batchCode.trim()) return setError('Batch code is required');
        if (!teamName.trim()) return setError('Team name is required');

        for (let i = 0; i < teamMembers.length; i++) {
            if (!teamMembers[i].name.trim()) return setError(`Member ${i + 1} name is required`);
            if (!teamMembers[i].register_id.trim()) return setError(`Member ${i + 1} Register ID is required`);
        }

        setLoading(true);
        const data = await apiCall('/api/student/register', {
            method: 'POST',
            auth: false,
            body: {
                name,
                register_id: registerId,
                college,
                mobile,
                batch_code: batchCode,
                team_name: teamName,
                team_members: teamMembers,
            },
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
    }, [name, registerId, college, mobile, batchCode, teamName, navigate, teamMembers]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 student-bg">
            <div className="w-full animate-fade-in" style={{ maxWidth: '48rem' }}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg shadow-blue-500/20" style={{ background: 'var(--gradient-primary)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <h1 className="page-title">{quizTitle}</h1>
                    <p className="page-subtitle mt-2">Team Registration — Fill in all member details</p>
                </div>

                {/* Two-column form */}
                <form onSubmit={handleSubmit} className="glass-card p-6 animate-fade-in animate-delay-200">
                    <div className="register-grid">
                        {/* Left: Team Leader & Team Name */}
                        <div>
                            {/* Team Name moved here */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">Team Name</label>
                                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Enter your team name" className="input-field" />
                            </div>

                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                👑 Team Leader
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="input-label">Full Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                        placeholder="Leader's full name" className="input-field" autoComplete="name" />
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
                                        placeholder="College name" className="input-field" />
                                </div>
                                <div>
                                    <label className="input-label">Mobile Number</label>
                                    <input type="tel" value={mobile} onChange={handleMobile}
                                        placeholder="10-digit mobile"
                                        className={`input-field ${mobile.length === 10 ? 'success' : mobile.length > 0 ? 'error' : ''}`}
                                        maxLength={10} />
                                </div>
                                <div>
                                    <label className="input-label">Batch Code</label>
                                    <input type="text" value={batchCode}
                                        onChange={(e) => { setBatchCode(e.target.value.replace(/\s/g, '').toUpperCase()); setError(''); }}
                                        placeholder="Code from the board" className="input-field" />
                                </div>

                                {(checking || isAvailable !== null) && (
                                    <div className={checking ? 'msg-info' : isAvailable ? 'msg-success' : 'msg-error'}>
                                        {checking ? '⏳ Checking...' : isAvailable ? `✅ ${availabilityMsg}` : `❌ ${availabilityMsg}`}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Team Members */}
                        <div className="animate-fade-in animate-delay-200" style={{ animationDelay: '400ms' }}>
                            <div className="msg-info mb-4" style={{ fontSize: '0.9rem' }}>
                                ℹ️ If team members are available, please enter their details below.
                            </div>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                                <span>👥 Team Members ({teamMembers.length})</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Min: {minSize} | Max: {maxSize}</span>
                            </h3>
                            <div className="space-y-3">
                                {teamMembers.map((member, i) => (
                                    <div key={i} className="team-member-card" style={{ position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <div className="team-member-label">Member {i + 1}</div>
                                            {teamMembers.length > minSize && (
                                                <button type="button" onClick={() => removeMember(i)} style={{ color: '#ef4444', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    Remove ✕
                                                </button>
                                            )}
                                        </div>
                                        <div className="team-member-fields">
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Full Name"
                                                value={member.name}
                                                onChange={(e) => updateTeamMember(i, 'name', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Register ID"
                                                value={member.register_id}
                                                onChange={(e) => updateTeamMember(i, 'register_id', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {teamMembers.length < maxSize && (
                                    <button
                                        type="button"
                                        onClick={addMember}
                                        className="btn btn-outline w-full py-3 text-base transition-all duration-300 hover:border-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:-translate-y-0.5"
                                        style={{ borderStyle: 'dashed', marginTop: '1rem' }}
                                    >
                                        + Add Team Member
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="mt-6 space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
                        {error && <div className="msg-error">❌ {error}</div>}
                        <button type="submit" disabled={loading || isAvailable === false}
                            className="btn btn-primary btn-lg w-full btn-shine">
                            {loading ? <><span className="spinner" /> Registering Team...</> : '🚀 Register Team & Join Quiz'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <Link to="/ranks" className="text-sm text-blue-400 hover:underline block">📊 View Rankings</Link>
                </div>
            </div>
        </div>
    );
}
