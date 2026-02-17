import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Students() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ q: '', batch_id: '', college: '', status: '' });
    const [debouncedQ, setDebouncedQ] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadBatches = async () => {
            const data = await apiCall('/api/admin/batch/list');
            if (data.success) setBatches(data.batches);
        };
        loadBatches();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQ(filters.q);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.q]);

    useEffect(() => {
        fetchStudents();
    }, [debouncedQ, filters.batch_id, filters.college, filters.status]);

    const fetchStudents = async () => {
        setLoading(true);
        let url = `/api/admin/students?q=${encodeURIComponent(debouncedQ)}`;
        if (filters.batch_id) url += `&batch_id=${filters.batch_id}`;
        if (filters.college) url += `&college=${encodeURIComponent(filters.college)}`;
        if (filters.status) url += `&status=${filters.status}`;

        const data = await apiCall(url);
        if (data.success) {
            setStudents(data.students);
        }
        setLoading(false);
    };

    const updateFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

    const handleUpdateStatus = async (id, newStatus) => {
        if (!confirm(`Change status to ${newStatus}?`)) return;
        const data = await apiCall(`/api/admin/student/${id}/status`, {
            method: 'PUT',
            body: { status: newStatus },
        });
        if (data.success) {
            setMessage(`✅ ${data.message}`);
            fetchStudents();
        } else {
            setMessage(`❌ ${data.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen" style={{ background: '#0f172a' }}>
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h1 className="page-title" style={{ fontSize: '1.125rem' }}>🎓 Student Management</h1>
                <div className="flex items-center gap-2">
                    <Link to="/admin/dashboard" className="btn btn-ghost btn-sm">🏠 Dashboard</Link>
                    <Link to="/admin/config" className="btn btn-ghost btn-sm">⚙️ Config</Link>
                    <Link to="/admin/questions" className="btn btn-ghost btn-sm">📝 Questions</Link>
                    <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
                </div>
            </nav>

            <div className="page-container">
                <div className="glass-card-static p-5 mb-6">
                    <h2 className="text-base font-semibold text-white mb-4">🔍 Search & Filter</h2>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-grow">
                            <label className="input-label">Search</label>
                            <input
                                type="text"
                                placeholder="Name, Register ID, Mobile..."
                                className="input-field"
                                value={filters.q}
                                onChange={(e) => updateFilter('q', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="input-label">Batch</label>
                            <select value={filters.batch_id} onChange={(e) => updateFilter('batch_id', e.target.value)} className="input-field" style={{ minWidth: 150 }}>
                                <option value="">All Batches</option>
                                {batches.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="input-label">College</label>
                            <input
                                type="text"
                                placeholder="College name..."
                                className="input-field"
                                value={filters.college}
                                onChange={(e) => updateFilter('college', e.target.value)}
                                style={{ width: 180 }}
                            />
                        </div>
                        <div>
                            <label className="input-label">Status</label>
                            <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="input-field" style={{ minWidth: 140 }}>
                                <option value="">All Statuses</option>
                                <option value="registered">Registered</option>
                                <option value="started">Started</option>
                                <option value="completed">Completed</option>
                                <option value="disqualified">Disqualified</option>
                            </select>
                        </div>
                    </div>
                </div>

                {message && <div className="msg-success mb-4">{message}</div>}

                <div className="glass-card-static overflow-hidden">
                    <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <h2 className="text-base font-semibold text-white">📋 Student List ({students.length})</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name / Team</th>
                                    <th>Register ID</th>
                                    <th>College / Mobile</th>
                                    <th>Batch</th>
                                    <th>Status</th>
                                    <th>Joined At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center p-8 text-slate-400">Loading...</td></tr>
                                ) : students.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center p-8 text-slate-500">No students found</td></tr>
                                ) : (
                                    students.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="text-white font-medium">{u.name}</div>
                                                {u.team_members && u.team_members.length > 0 && (
                                                    <div className="text-slate-500 text-xs mt-1">
                                                        <span className="badge badge-purple text-[10px] mr-1">TEAM</span>
                                                        {u.team_members.length} Members
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <code className="text-blue-400 font-mono">{u.register_id}</code>
                                            </td>
                                            <td>
                                                <div className="text-slate-400 text-sm truncate max-w-[150px]">{u.college}</div>
                                                <div className="text-slate-500 text-xs">{u.mobile}</div>
                                            </td>
                                            <td className="text-slate-400 text-sm">{u.batch_label}</td>
                                            <td>
                                                <span className={`badge ${u.status === 'disqualified' ? 'badge-red' :
                                                        u.status === 'completed' ? 'badge-green' :
                                                            u.status === 'started' ? 'badge-blue' : 'badge-purple'
                                                    }`}>
                                                    {u.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="text-slate-500 text-sm">{new Date(u.created_at).toLocaleString()}</td>
                                            <td>
                                                {u.status === 'disqualified' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(u.id, 'registered')}
                                                        className="btn btn-sm btn-success"
                                                    >
                                                        ✅ Re-Qualify
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateStatus(u.id, 'disqualified')}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        🚫 Disqualify
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
