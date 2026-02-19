import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import apiCall, { BASE_URL } from '../../api/api';

export default function Results() {
    const [results, setResults] = useState([]);
    const [batches, setBatches] = useState([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ batch_id: '', college: '', status: '', round: '' });
    const [topN, setTopN] = useState(5);
    const [message, setMessage] = useState('');
    const [expandedTeam, setExpandedTeam] = useState(null);

    const loadBatches = async () => {
        const data = await apiCall('/api/admin/batch/list');
        if (data.success) setBatches(data.batches);
    };

    const loadResults = async (page = 1) => {
        let url = `/api/admin/results?page=${page}&limit=50`;
        if (filters.batch_id) url += `&batch_id=${filters.batch_id}`;
        if (filters.college) url += `&college=${encodeURIComponent(filters.college)}`;
        if (filters.status) url += `&status=${filters.status}`;
        if (filters.round) url += `&round=${filters.round}`;

        const data = await apiCall(url);
        if (data.success) { setResults(data.results); setTotal(data.total); }
    };

    useEffect(() => { loadBatches(); }, []);
    useEffect(() => { loadResults(); }, [filters]);

    const showMsg = (m) => { setMessage(m); setTimeout(() => setMessage(''), 3000); };

    const handlePromote = async (userId) => {
        const data = await apiCall(`/api/admin/promote/${userId}`, {
            method: 'PUT',
            body: { status: 'qualified_r2' },
        });
        if (data.success) { showMsg(`✅ ${data.message}`); loadResults(); }
        else showMsg(`❌ ${data.message}`);
    };

    const handleForceExit = async (userId, name) => {
        if (!confirm(`Force exit "${name}" from quiz? They will be marked as disqualified.`)) return;
        const data = await apiCall(`/api/admin/force-exit/${userId}`, { method: 'PUT' });
        if (data.success) { showMsg(`✅ ${data.message}`); loadResults(); }
        else showMsg(`❌ ${data.message}`);
    };

    const handleDeleteUser = async (userId, name) => {
        if (!confirm(`Permanently delete "${name}" and ALL their records? This cannot be undone!`)) return;
        const data = await apiCall(`/api/admin/user/${userId}`, { method: 'DELETE' });
        if (data.success) { showMsg(`✅ ${data.message}`); loadResults(); }
        else showMsg(`❌ ${data.message}`);
    };

    const handleBulkPromote = async () => {
        if (!filters.batch_id) return showMsg('❌ Select a batch first');
        const data = await apiCall('/api/admin/promote-bulk', {
            method: 'PUT',
            body: { batch_id: Number(filters.batch_id), top_n: topN },
        });
        if (data.success) { showMsg(`✅ ${data.promoted_count} students promoted!`); loadResults(); }
        else showMsg(`❌ ${data.message}`);
    };

    const handlePublish = async () => {
        if (!filters.batch_id) return showMsg('❌ Select a batch first');
        const data = await apiCall('/api/admin/publish-results', {
            method: 'PUT',
            body: { batch_id: Number(filters.batch_id) },
        });
        if (data.success) { showMsg('✅ Results published! Students can now see their ranks.'); loadBatches(); }
        else showMsg(`❌ ${data.message}`);
    };

    const handleExportCSV = async () => {
        if (!filters.batch_id) return showMsg('❌ Select a batch first');
        const token = localStorage.getItem('admin_token');
        try {
            const response = await fetch(
                `${BASE_URL}/api/admin/export-csv?batch_id=${filters.batch_id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `results_batch_${filters.batch_id}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            showMsg('❌ Export failed');
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

    const statusBadge = (s) => {
        const map = { qualified_r2: 'badge-green', completed: 'badge-blue', started: 'badge-yellow', disqualified: 'badge-red' };
        const label = { qualified_r2: 'Qualified ✅', completed: 'Completed', started: 'In Progress', disqualified: 'DQ' };
        return <span className={`badge ${map[s] || 'badge-blue'}`}>{label[s] || s}</span>;
    };

    const updateFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

    return (
        <div className="min-h-screen" style={{ background: '#0f172a' }}>
            <nav className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h1 className="page-title" style={{ fontSize: '1.125rem' }}>📊 Results & Leaderboard</h1>
                <div className="flex items-center gap-2">
                    <Link to="/admin/dashboard" className="btn btn-ghost btn-sm">🏠 Dashboard</Link>
                    <Link to="/admin/questions" className="btn btn-ghost btn-sm">📝 Questions</Link>
                </div>
            </nav>

            <div className="page-container">
                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3 mb-4">
                    <div>
                        <label className="input-label">Batch</label>
                        <select value={filters.batch_id} onChange={(e) => updateFilter('batch_id', e.target.value)} className="input-field" style={{ width: 'auto', minWidth: 180 }}>
                            <option value="">All Batches</option>
                            {batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="input-label">College</label>
                        <input value={filters.college} onChange={(e) => updateFilter('college', e.target.value)} className="input-field" style={{ width: 200 }} placeholder="Filter by college" />
                    </div>
                    <div>
                        <label className="input-label">Status</label>
                        <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="input-field" style={{ width: 'auto' }}>
                            <option value="">All</option>
                            <option value="completed">Completed</option>
                            <option value="qualified_r2">Qualified</option>
                            <option value="disqualified">Disqualified</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Round</label>
                        <select value={filters.round} onChange={(e) => updateFilter('round', e.target.value)} className="input-field" style={{ width: 'auto' }}>
                            <option value="">All</option>
                            <option value="1">Round 1</option>
                            <option value="2">Round 2</option>
                        </select>
                    </div>
                    <span className="text-sm text-slate-500" style={{ paddingBottom: '0.5rem' }}>{total} results</span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Top</label>
                        <input type="number" value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="input-field" style={{ width: 60 }} min={1} max={100} />
                        <button onClick={handleBulkPromote} className="btn btn-success btn-sm">🏆 Promote Top {topN}</button>
                    </div>
                    <button onClick={handlePublish} className="btn btn-primary btn-sm">📢 Publish Results</button>
                    <button onClick={handleExportCSV} className="btn btn-outline btn-sm">📥 Export CSV</button>
                </div>

                {message && <div className="mb-4 msg-success">{message}</div>}

                {/* Table */}
                <div className="glass-card-static overflow-hidden">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Rank</th><th>Name</th><th>Register ID</th><th>College</th><th>Score</th><th>Time</th><th>Tabs</th><th>Status</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {results.map((r) => (
                                    <Fragment key={r.user_id}>
                                        <tr className={r.rank <= 3 ? ['', 'rank-gold', 'rank-silver', 'rank-bronze'][r.rank] : ''}
                                            style={r.team_name ? { cursor: 'pointer' } : {}}
                                            onClick={() => r.team_name && setExpandedTeam(expandedTeam === r.user_id ? null : r.user_id)}>
                                            <td className="font-bold text-sm">{r.rank <= 3 ? ['', '🥇', '🥈', '🥉'][r.rank] : `#${r.rank}`}</td>
                                            <td className="text-white text-sm font-medium">
                                                {r.team_name ? (
                                                    <div>
                                                        <span style={{ color: '#a78bfa', fontWeight: 600 }}>👥 {r.team_name}</span>
                                                        <br />
                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.name} (Leader)</span>
                                                        {expandedTeam !== r.user_id && r.team_members?.length > 0 && (
                                                            <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: '0.5rem' }}>+{r.team_members.length} members ▼</span>
                                                        )}
                                                    </div>
                                                ) : r.name}
                                            </td>
                                            <td className="text-sm" style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{r.register_id}</td>
                                            <td className="text-sm text-slate-400" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.college}</td>
                                            <td className="font-semibold text-sm">{r.score}/{r.total_questions}</td>
                                            <td className="text-sm text-slate-400">{formatTime(r.time_taken)}</td>
                                            <td className="text-sm">{r.tab_switch_count > 0 ? <span className="text-amber-400">⚠ {r.tab_switch_count}</span> : <span className="text-slate-600">0</span>}</td>
                                            <td>{statusBadge(r.status)}</td>
                                            <td>
                                                <div className="flex gap-1">
                                                    {r.status === 'completed' && <button onClick={(e) => { e.stopPropagation(); handlePromote(r.user_id); }} className="btn btn-sm btn-success">Promote</button>}
                                                    {r.status === 'started' && <button onClick={(e) => { e.stopPropagation(); handleForceExit(r.user_id, r.name); }} className="btn btn-sm btn-danger" title="Force exit">⛔ Kick</button>}
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(r.user_id, r.name); }} className="btn btn-sm btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '0.7rem' }} title="Delete user">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded team members row */}
                                        {expandedTeam === r.user_id && r.team_members?.length > 0 && (
                                            <tr>
                                                <td colSpan={9} style={{ padding: 0, background: 'rgba(139, 92, 246, 0.05)', borderLeft: '3px solid #a78bfa' }}>
                                                    <div style={{ padding: '0.75rem 1.5rem' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            👥 Team Members
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
                                                            {r.team_members.map((m, i) => (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', minWidth: '1.25rem' }}>{m.order || i + 1}.</span>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.8125rem', color: '#e2e8f0', fontWeight: 500 }}>{m.name}</div>
                                                                        {m.reg_id && <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#60a5fa' }}>{m.reg_id}</div>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                                {results.length === 0 && (
                                    <tr><td colSpan={9} className="text-center text-slate-500" style={{ padding: '2rem' }}>No results yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
