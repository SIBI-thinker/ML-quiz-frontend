import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiCall from '../../api/api';

export default function Questions() {
    const [questions, setQuestions] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterRound, setFilterRound] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
        correct_option: 'A', difficulty: 'easy', marks: 1, round: 1, batch_tag: '',
    });
    const [message, setMessage] = useState('');

    const loadQuestions = async (page = 1) => {
        let url = `/api/admin/questions?page=${page}&limit=20`;
        if (filterRound) url += `&round=${filterRound}`;
        if (filterDifficulty) url += `&difficulty=${filterDifficulty}`;

        const data = await apiCall(url);
        if (data.success) {
            setQuestions(data.questions);
            setTotal(data.total);
            setCurrentPage(data.page);
        }
    };

    useEffect(() => { loadQuestions(); }, [filterRound, filterDifficulty]);

    const resetForm = () => {
        setForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', difficulty: 'easy', marks: 1, round: 1, batch_tag: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
            return setMessage('❌ All fields are required');
        }

        let data;
        if (editingId) {
            data = await apiCall(`/api/admin/question/${editingId}`, { method: 'PUT', body: form });
            if (data.success) setMessage('✅ Question updated');
        } else {
            data = await apiCall('/api/admin/question', { method: 'POST', body: { ...form, batch_tag: form.batch_tag || null } });
            if (data.success) setMessage('✅ Question added');
        }
        if (data.success) { resetForm(); loadQuestions(currentPage); }
        else setMessage(`❌ ${data.message}`);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleEdit = (q) => {
        setForm({
            question_text: q.question_text, option_a: q.option_a, option_b: q.option_b,
            option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option,
            difficulty: q.difficulty || 'easy', marks: q.marks || 1,
            round: q.round, batch_tag: q.batch_tag || '',
        });
        setEditingId(q.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        const data = await apiCall(`/api/admin/question/${id}`, { method: 'DELETE' });
        if (data.success) { loadQuestions(currentPage); setMessage('✅ Question deleted'); }
        setTimeout(() => setMessage(''), 2000);
    };

    const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

    return (
        <div className="min-h-screen" style={{ background: '#0f172a' }}>
            <nav className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <h1 className="page-title" style={{ fontSize: '1.125rem' }}>📝 Question Manager</h1>
                <div className="flex items-center gap-2">
                    <Link to="/admin/dashboard" className="btn btn-ghost btn-sm">🏠 Dashboard</Link>
                    <Link to="/admin/results" className="btn btn-ghost btn-sm">📊 Results</Link>
                </div>
            </nav>

            <div className="page-container">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <select value={filterRound} onChange={(e) => setFilterRound(e.target.value)} className="input-field" style={{ width: 'auto' }}>
                            <option value="">All Rounds</option>
                            <option value="1">Round 1</option>
                            <option value="2">Round 2</option>
                        </select>
                        <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="input-field" style={{ width: 'auto' }}>
                            <option value="">All Difficulty</option>
                            <option value="easy">🟢 Easy</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="hard">🔴 Hard</option>
                        </select>
                        <span className="text-sm text-slate-500">{total} questions</span>
                    </div>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">+ Add Question</button>
                </div>

                {message && <div className="mb-4 msg-success">{message}</div>}

                {/* Form */}
                {showForm && (
                    <div className="glass-card-static p-5 mb-6 animate-fade-in">
                        <h3 className="text-base font-semibold text-white mb-4">{editingId ? 'Edit Question' : 'Add New Question'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-3">
                                <div>
                                    <label className="input-label">Question Text</label>
                                    <textarea value={form.question_text} onChange={(e) => updateField('question_text', e.target.value)}
                                        className="input-field" rows={2} placeholder="Enter the question..." />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                    {['A', 'B', 'C', 'D'].map((opt) => (
                                        <div key={opt}>
                                            <label className="input-label">Option {opt}</label>
                                            <input value={form[`option_${opt.toLowerCase()}`]}
                                                onChange={(e) => updateField(`option_${opt.toLowerCase()}`, e.target.value)}
                                                className="input-field" placeholder={`Option ${opt}`} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    <div>
                                        <label className="input-label">Correct Answer</label>
                                        <select value={form.correct_option} onChange={(e) => updateField('correct_option', e.target.value)} className="input-field">
                                            {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Difficulty</label>
                                        <select value={form.difficulty} onChange={(e) => {
                                            const diff = e.target.value;
                                            updateField('difficulty', diff);
                                            const defaultMarks = { easy: 1, medium: 2, hard: 3 };
                                            updateField('marks', defaultMarks[diff]);
                                        }} className="input-field">
                                            <option value="easy">🟢 Easy</option>
                                            <option value="medium">🟡 Medium</option>
                                            <option value="hard">🔴 Hard</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Marks</label>
                                        <input type="number" value={form.marks} onChange={(e) => updateField('marks', Number(e.target.value))} className="input-field" min={1} max={10} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    <div>
                                        <label className="input-label">Round</label>
                                        <select value={form.round} onChange={(e) => updateField('round', Number(e.target.value))} className="input-field">
                                            <option value={1}>Round 1</option>
                                            <option value={2}>Round 2</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Batch Tag (optional)</label>
                                        <input value={form.batch_tag} onChange={(e) => updateField('batch_tag', e.target.value)} className="input-field" placeholder="Optional" />
                                    </div>
                                </div>
                                <div className="flex gap-2" style={{ paddingTop: '0.25rem' }}>
                                    <button type="submit" className="btn btn-success">{editingId ? 'Update' : 'Add'} Question</button>
                                    <button type="button" onClick={resetForm} className="btn btn-outline">Cancel</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="glass-card-static overflow-hidden">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>#</th><th>Question</th><th>Answer</th><th>Difficulty</th><th>Marks</th><th>Round</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {questions.map((q, i) => (
                                    <tr key={q.id}>
                                        <td className="text-slate-500 text-sm">{(currentPage - 1) * 20 + i + 1}</td>
                                        <td className="text-white text-sm" style={{ maxWidth: 400 }}>{q.question_text}</td>
                                        <td><span className="badge badge-green">{q.correct_option}</span></td>
                                        <td><span className={`badge ${q.difficulty === 'hard' ? 'badge-red' : q.difficulty === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                                            {q.difficulty === 'hard' ? '🔴 Hard' : q.difficulty === 'medium' ? '🟡 Medium' : '🟢 Easy'}
                                        </span></td>
                                        <td><span className="badge badge-blue">{q.marks || 1}</span></td>
                                        <td><span className="badge badge-purple">R{q.round}</span></td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(q)} className="btn btn-sm btn-outline">✏️ Edit</button>
                                                <button onClick={() => handleDelete(q.id)} className="btn btn-sm btn-danger">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {questions.length === 0 && (
                                    <tr><td colSpan={7} className="text-center text-slate-500" style={{ padding: '2rem' }}>No questions yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {total > 20 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button onClick={() => loadQuestions(currentPage - 1)} disabled={currentPage <= 1} className="btn btn-outline btn-sm">← Prev</button>
                        <span className="flex items-center text-sm text-slate-500 px-3">Page {currentPage} of {Math.ceil(total / 20)}</span>
                        <button onClick={() => loadQuestions(currentPage + 1)} disabled={currentPage * 20 >= total} className="btn btn-outline btn-sm">Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
