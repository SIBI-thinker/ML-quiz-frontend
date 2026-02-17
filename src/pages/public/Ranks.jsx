import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Ranks() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [ranks, setRanks] = useState([]);
    const [batches, setBatches] = useState([]);
    const [batchLabel, setBatchLabel] = useState('All Batches');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
    const [selectedBatch, setSelectedBatch] = useState(searchParams.get('batch_id') || '');
    const [selectedRound, setSelectedRound] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const selectedBatchRef = useRef(selectedBatch);

    // Auto-logout countdown (only for logged-in students)
    const isStudent = !!localStorage.getItem('student_token');
    const [logoutCountdown, setLogoutCountdown] = useState(isStudent ? 30 : null);

    useEffect(() => {
        if (logoutCountdown === null) return;
        if (logoutCountdown <= 0) {
            // Perform logout
            localStorage.removeItem('student_token');
            localStorage.removeItem('student_user');
            localStorage.removeItem('batch_info');
            localStorage.removeItem('session_id');
            localStorage.removeItem('start_time');
            localStorage.removeItem('duration_minutes');
            localStorage.removeItem('total_questions');
            navigate('/');
            return;
        }
        const timer = setTimeout(() => setLogoutCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [logoutCountdown, navigate]);

    // Keep ref in sync
    useEffect(() => { selectedBatchRef.current = selectedBatch; }, [selectedBatch]);

    // Load published batches
    useEffect(() => {
        (async () => {
            const data = await apiCall('/api/public/batches', { auth: false });
            if (data.success) {
                setBatches(data.batches);
                // Don't auto-select — show "All Batches" by default
            }
        })();
    }, []);

    // Load ranks (paginated + filtered)
    const loadRanks = useCallback(async () => {
        setLoading(true);
        setError('');
        let url = `/api/public/ranks?page=${page}&limit=50`;
        if (selectedBatch) url += `&batch_id=${selectedBatch}`;
        if (selectedRound) url += `&round=${selectedRound}`;

        const data = await apiCall(url, { auth: false });
        if (data.success) {
            setRanks(data.ranks || []);
            setTotal(data.total || 0);
            setBatchLabel(data.batch_label || 'Rankings');
            setLastUpdated(new Date());
        } else {
            setRanks([]);
            setTotal(0);
            setError(data.message || '');
        }
        setLoading(false);
    }, [selectedBatch, selectedRound, page]);

    // Initial load + auto-refresh every 30s
    useEffect(() => {
        if (!isSearching) {
            loadRanks();
            const interval = setInterval(loadRanks, 30000);
            return () => clearInterval(interval);
        }
    }, [loadRanks, isSearching]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length > 0) {
                setLoading(true);
                setError('');
                let url = `/api/public/search?query=${encodeURIComponent(searchQuery)}`;
                if (selectedBatchRef.current) url += `&batch_id=${selectedBatchRef.current}`;

                const data = await apiCall(url, { auth: false });
                if (data.success) {
                    setRanks(data.results || []);
                    setTotal(data.results?.length || 0);
                    setIsSearching(true);
                } else {
                    setRanks([]);
                    setTotal(0);
                    setError(data.message || 'Search failed');
                }
                setLoading(false);
            } else if (isSearching) {
                setIsSearching(false);
                // loadRanks will be triggered by the isSearching change in the other effect
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Sync URL params
    useEffect(() => {
        const params = {};
        if (selectedBatch) params.batch_id = selectedBatch;
        if (searchQuery) params.query = searchQuery;
        setSearchParams(params, { replace: true });
    }, [selectedBatch, searchQuery, setSearchParams]);

    const handleBatchChange = (e) => {
        setSelectedBatch(e.target.value);
        setPage(1);
        setIsSearching(false);
        setSearchQuery('');
    };

    const handleRoundChange = (e) => {
        setSelectedRound(e.target.value);
        setPage(1);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
    };

    const formatTime = (s) => {
        if (!s && s !== 0) return '—';
        return `${Math.floor(s / 60)}m ${s % 60}s`;
    };
    const rankEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };
    const rankClass = (rank) => {
        if (rank === 1) return 'rank-gold';
        if (rank === 2) return 'rank-silver';
        if (rank === 3) return 'rank-bronze';
        return '';
    };
    const statusBadge = (s) => {
        if (s === 'qualified_r2') return <span className="badge badge-green">Qualified ✅</span>;
        return <span className="badge badge-blue">Completed</span>;
    };
    const totalPages = Math.ceil(total / 50);
    const isAllBatches = !selectedBatch;

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
            {/* Auto-logout countdown banner */}
            {logoutCountdown !== null && logoutCountdown > 0 && (
                <div className="logout-banner" style={{
                    background: 'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.15) 100%)',
                    borderBottom: '1px solid rgba(245,158,11,0.3)',
                    padding: '0.625rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#fbbf24',
                    animation: 'fadeIn 0.4s ease',
                }}>
                    <span>⏱️ Auto-logout in <strong style={{ fontSize: '1rem' }}>{logoutCountdown}s</strong></span>
                    <button
                        onClick={() => {
                            setLogoutCountdown(0);
                        }}
                        style={{
                            background: 'rgba(239,68,68,0.2)',
                            border: '1px solid rgba(239,68,68,0.4)',
                            color: '#fca5a5',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Logout Now
                    </button>
                </div>
            )}
            {/* Header */}
            <header style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: '1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
                <h1 className="page-title" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}>🏆 Quiz Rankings</h1>
                <p className="page-subtitle" style={{ marginTop: '0.5rem' }}>{batchLabel} • {total} participants</p>
                {lastUpdated && <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>Last updated {lastUpdated.toLocaleTimeString()}</p>}
            </header>

            <div className="page-container" style={{ paddingTop: 0 }}>
                {/* Search + Filter */}
                <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem 0', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 280px' }}>
                            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by Register ID, Name, or Mobile..." className="input-field"
                                style={{ paddingLeft: '2.5rem' }} />
                            <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            {searchQuery && (
                                <button onClick={clearSearch}
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.875rem' }}>✕</button>
                            )}
                        </div>
                        <select value={selectedBatch} onChange={handleBatchChange} className="input-field" style={{ width: 'auto', minWidth: 180 }}>
                            <option value="">All Batches</option>
                            {batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>
                        <select value={selectedRound} onChange={handleRoundChange} className="input-field" style={{ width: 'auto', minWidth: 120 }}>
                            <option value="">All Rounds</option>
                            <option value="1">Round 1</option>
                            <option value="2">Round 2</option>
                        </select>
                    </div>
                    {isSearching && (
                        <p style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.5rem' }}>
                            Showing search results for "{searchQuery}" —{' '}
                            <button onClick={clearSearch} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', font: 'inherit' }}>Clear</button>
                        </p>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div className="spinner spinner-lg" style={{ borderTopColor: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)', margin: '0 auto 0.75rem' }} />
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading rankings...</p>
                    </div>
                ) : error && ranks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</p>
                        <p style={{ color: '#94a3b8' }}>{error}</p>
                        <button onClick={loadRanks} className="btn btn-outline" style={{ marginTop: '1rem' }}>🔄 Retry</button>
                    </div>
                ) : ranks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</p>
                        <p style={{ color: '#94a3b8' }}>{isSearching ? 'No results found for your search' : 'No rankings available yet'}</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table (hidden on mobile via media query) */}
                        <div className="ranks-desktop" style={{ marginTop: '0.75rem' }}>
                            <div className="glass-card-static" style={{ overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr><th>Rank</th><th>Name</th><th>Register ID</th>{isAllBatches && <th>Batch</th>}<th>College</th><th>Score</th><th>Time</th><th>Status</th></tr>
                                        </thead>
                                        <tbody>
                                            {ranks.map((r) => (
                                                <tr key={r.register_id || r.user_id || r.rank} className={rankClass(r.rank)}>
                                                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>{rankEmoji(r.rank)}</td>
                                                    <td style={{ color: 'white', fontWeight: 500, fontSize: '0.8125rem' }}>{r.name}</td>
                                                    <td style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.8125rem' }}>{r.register_id}</td>
                                                    {isAllBatches && <td style={{ color: '#a78bfa', fontSize: '0.8125rem' }}>{r.batch}</td>}
                                                    <td style={{ color: '#94a3b8', fontSize: '0.8125rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.college}</td>
                                                    <td style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{r.score}/{r.total_questions}</td>
                                                    <td style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>{formatTime(r.time_taken)}</td>
                                                    <td>{statusBadge(r.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Cards (hidden on desktop via media query) */}
                        <div className="ranks-mobile" style={{ marginTop: '0.75rem' }}>
                            {ranks.map((r) => (
                                <div key={r.register_id || r.user_id || r.rank} className={`glass-card-static ${rankClass(r.rank)}`}
                                    style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <span style={{ fontSize: '1.125rem', fontWeight: 700, marginRight: '0.5rem' }}>{rankEmoji(r.rank)}</span>
                                            <span style={{ color: 'white', fontWeight: 600 }}>{r.name}</span>
                                        </div>
                                        {statusBadge(r.status)}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', fontSize: '0.8125rem' }}>
                                        <div><span style={{ color: '#64748b' }}>ID: </span><span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{r.register_id}</span></div>
                                        <div><span style={{ color: '#64748b' }}>Score: </span><span style={{ color: 'white', fontWeight: 600 }}>{r.score}/{r.total_questions}</span></div>
                                        {isAllBatches && <div><span style={{ color: '#64748b' }}>Batch: </span><span style={{ color: '#a78bfa' }}>{r.batch}</span></div>}
                                        <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748b' }}>College: </span><span style={{ color: '#cbd5e1' }}>{r.college}</span></div>
                                        <div><span style={{ color: '#64748b' }}>Time: </span><span style={{ color: '#94a3b8' }}>{formatTime(r.time_taken)}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && !isSearching && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-outline btn-sm">← Prev</button>
                                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#64748b', padding: '0 0.75rem' }}>Page {page} of {totalPages}</span>
                                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="btn btn-outline btn-sm">Next →</button>
                            </div>
                        )}
                    </>
                )}

                {/* Footer */}
                <div style={{ marginTop: '2rem', textAlign: 'center', paddingBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#475569' }}>Auto-refreshes every 30 seconds</p>
                    <Link to="/student" style={{ fontSize: '0.875rem', color: '#60a5fa', display: 'inline-block', marginTop: '0.5rem', textDecoration: 'none' }}>← Join the Quiz</Link>
                </div>
            </div>
        </div>
    );
}
