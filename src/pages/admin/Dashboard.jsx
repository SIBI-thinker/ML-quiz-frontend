import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Dashboard() {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [newLabel, setNewLabel] = useState('');
    const [newRound, setNewRound] = useState(1);
    const [newDuration, setNewDuration] = useState(15);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState('');

    const loadBatches = async () => {
        const data = await apiCall('/api/admin/batch/list');
        if (data.success) {
            setBatches(data.batches);
            if (data.batches.length > 0 && !selectedBatch) setSelectedBatch(data.batches[0].id);
        }
    };

    useEffect(() => { loadBatches(); }, []);

    // Live stats polling
    useEffect(() => {
        if (!selectedBatch) return;
        const fetchStats = async () => {
            const data = await apiCall(`/api/admin/stats?batch_id=${selectedBatch}`);
            if (data.success) setStats(data);
        };
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [selectedBatch]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newLabel.trim()) return;
        setCreating(true);
        const data = await apiCall('/api/admin/batch/create', {
            method: 'POST',
            body: { label: newLabel, round: newRound, duration_minutes: newDuration },
        });
        if (data.success) {
            setMessage(`✅ ${data.message}`);
            setNewLabel('');
            loadBatches();
        } else {
            setMessage(`❌ ${data.message}`);
        }
        setCreating(false);
        setTimeout(() => setMessage(''), 4000);
    };

    const handleToggleLock = async (batchId, currentActive) => {
        await apiCall(`/api/admin/batch/${batchId}/lock`, {
            method: 'PUT',
            body: { is_active: !currentActive },
        });
        loadBatches();
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen" style={{ background: '#0f172a' }}>
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h1 className="page-title" style={{ fontSize: '1.125rem' }}>🎓 Admin Dashboard</h1>
                <div className="flex items-center gap-2">
                    <Link to="/admin/questions" className="btn btn-ghost btn-sm">📝 Questions</Link>
                    <Link to="/admin/results" className="btn btn-ghost btn-sm">📊 Results</Link>
                    <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
                </div>
            </nav>

            <div className="page-container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    {/* Create Batch */}
                    <div className="glass-card-static p-5">
                        <h2 className="text-base font-semibold text-white mb-4">➕ Create New Batch</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px auto', gap: '0.75rem', alignItems: 'end' }}>
                                <div>
                                    <label className="input-label">Batch Label</label>
                                    <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                                        placeholder="e.g., Class 3B — 10 AM" className="input-field" />
                                </div>
                                <div>
                                    <label className="input-label">Round</label>
                                    <select value={newRound} onChange={(e) => setNewRound(Number(e.target.value))} className="input-field">
                                        <option value={1}>Round 1</option>
                                        <option value={2}>Round 2</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Duration</label>
                                    <input type="number" value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))}
                                        className="input-field" min={1} max={120} />
                                </div>
                                <button type="submit" disabled={creating} className="btn btn-primary">
                                    {creating ? 'Creating...' : 'Create Batch'}
                                </button>
                            </div>
                        </form>
                        {message && <div className="mt-3 msg-success">{message}</div>}
                    </div>

                    {/* Live Stats */}
                    {stats && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                            {[
                                { label: 'Registered', value: stats.total_registered, color: '#3b82f6' },
                                { label: 'Active', value: stats.active_users, color: '#10b981' },
                                { label: 'Submitted', value: stats.submitted_users, color: '#8b5cf6' },
                                { label: 'Status', value: stats.batch_status === 'open' ? 'Open' : 'Locked', color: stats.batch_status === 'open' ? '#10b981' : '#ef4444' },
                            ].map((s) => (
                                <div key={s.label} className="glass-card-static p-4 text-center">
                                    <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Batches Table */}
                    <div className="glass-card-static overflow-hidden">
                        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <h2 className="text-base font-semibold text-white">📋 All Batches</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Code</th><th>Label</th><th>Round</th><th>Students</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {batches.map((b) => (
                                        <tr key={b.id} style={{ background: selectedBatch === b.id ? 'rgba(59,130,246,0.05)' : undefined }}>
                                            <td>
                                                <code style={{ color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                                                    {b.code}
                                                </code>
                                            </td>
                                            <td className="text-white text-sm">{b.label}</td>
                                            <td><span className="badge badge-purple">R{b.round}</span></td>
                                            <td className="text-sm">{b.registered_count ?? 0} / {b.submitted_count ?? 0}</td>
                                            <td><span className={`badge ${b.is_active ? 'badge-green' : 'badge-red'}`}>{b.is_active ? 'Open' : 'Locked'}</span></td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleToggleLock(b.id, b.is_active)}
                                                        className={`btn btn-sm ${b.is_active ? 'btn-danger' : 'btn-success'}`}>
                                                        {b.is_active ? '🔒 Lock' : '🔓 Unlock'}
                                                    </button>
                                                    <button onClick={() => setSelectedBatch(b.id)} className="btn btn-sm btn-outline">📊 Stats</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {batches.length === 0 && (
                                        <tr><td colSpan={6} className="text-center text-slate-500" style={{ padding: '2rem' }}>No batches yet. Create one!</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
