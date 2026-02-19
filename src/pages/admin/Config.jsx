import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall, { BASE_URL } from '../../api/api';

export default function Config() {
    const navigate = useNavigate();
    const logoInputRef = useRef(null);
    const posterInputRef = useRef(null);

    const [config, setConfig] = useState({
        quiz_title: '',
        event_name: '',
        registration_type: 'individual',
        team_size: '0',
        min_team_size: '0',
        max_team_size: '4',
    });
    const [logoPreview, setLogoPreview] = useState('');
    const [posterPreview, setPosterPreview] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [posterFile, setPosterFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // Feedback questions state
    const [feedbackQuestions, setFeedbackQuestions] = useState([]);
    const [newFbQuestion, setNewFbQuestion] = useState({ question_text: '', question_type: 'rating', display_order: 1 });
    const [fbSaving, setFbSaving] = useState(false);
    const [fbMessage, setFbMessage] = useState('');
    const [editingFbId, setEditingFbId] = useState(null);
    const [editingFbText, setEditingFbText] = useState('');

    useEffect(() => {
        loadConfig();
        loadFeedbackQuestions();
    }, []);

    const loadConfig = async () => {
        const data = await apiCall('/api/admin/config');
        if (data.success && data.config) {
            setConfig(prev => ({
                ...prev,
                quiz_title: data.config.quiz_title || '',
                event_name: data.config.event_name || '',
                registration_type: data.config.registration_type || 'individual',
                team_size: data.config.team_size || '0',
                min_team_size: data.config.min_team_size ?? '0',
                max_team_size: data.config.max_team_size ?? '4',
            }));
            if (data.config.college_logo_url) {
                setLogoPreview(data.config.college_logo_url.startsWith('/')
                    ? `${BASE_URL}${data.config.college_logo_url}`
                    : data.config.college_logo_url);
            }
            if (data.config.event_poster_url) {
                setPosterPreview(data.config.event_poster_url.startsWith('/')
                    ? `${BASE_URL}${data.config.event_poster_url}`
                    : data.config.event_poster_url);
            }
        }
        setLoading(false);
    };

    const loadFeedbackQuestions = async () => {
        const data = await apiCall('/api/admin/feedback-questions');
        if (data.success) setFeedbackQuestions(data.questions || []);
    };

    const handleAddFbQuestion = async () => {
        if (!newFbQuestion.question_text.trim()) return setFbMessage('❌ Question text is required');
        setFbSaving(true);
        const data = await apiCall('/api/admin/feedback-questions', {
            method: 'POST',
            body: newFbQuestion,
        });
        if (data.success) {
            setNewFbQuestion({ question_text: '', question_type: 'rating', display_order: feedbackQuestions.length + 1 });
            setFbMessage('✅ Question added');
            loadFeedbackQuestions();
        } else {
            setFbMessage(`❌ ${data.message}`);
        }
        setFbSaving(false);
        setTimeout(() => setFbMessage(''), 2500);
    };

    const handleToggleFbActive = async (q) => {
        await apiCall(`/api/admin/feedback-questions/${q.id}`, {
            method: 'PUT',
            body: { is_active: !q.is_active },
        });
        loadFeedbackQuestions();
    };

    const handleDeleteFbQuestion = async (id) => {
        if (!confirm('Delete this feedback question? Existing answers will be removed.')) return;
        await apiCall(`/api/admin/feedback-questions/${id}`, { method: 'DELETE' });
        loadFeedbackQuestions();
    };

    const handleSaveFbEdit = async (id) => {
        if (!editingFbText.trim()) return;
        await apiCall(`/api/admin/feedback-questions/${id}`, {
            method: 'PUT',
            body: { question_text: editingFbText },
        });
        setEditingFbId(null);
        loadFeedbackQuestions();
    };

    const handleFileSelect = (type, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (type === 'logo') {
                setLogoFile(file);
                setLogoPreview(e.target.result);
            } else {
                setPosterFile(file);
                setPosterPreview(e.target.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const uploadFile = async (type, file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);

        const token = localStorage.getItem('admin_token');
        const res = await fetch(`${BASE_URL}/api/admin/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        return res.json();
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            // Upload files if selected
            if (logoFile) {
                const r = await uploadFile('logo', logoFile);
                if (!r.success) throw new Error(r.message);
                setLogoFile(null);
            }
            if (posterFile) {
                const r = await uploadFile('poster', posterFile);
                if (!r.success) throw new Error(r.message);
                setPosterFile(null);
            }

            // Save config values
            const data = await apiCall('/api/admin/config', {
                method: 'PUT',
                body: {
                    configs: {
                        quiz_title: config.quiz_title,
                        event_name: config.event_name,
                        registration_type: config.registration_type,
                        team_size: config.team_size,
                        min_team_size: config.min_team_size,
                        max_team_size: config.max_team_size,
                    },
                },
            });

            if (data.success) {
                setMessage('✅ Configuration saved successfully!');
                // Reload to get fresh image URLs
                await loadConfig();
            } else {
                setMessage(`❌ ${data.message}`);
            }
        } catch (err) {
            setMessage(`❌ ${err.message}`);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="config-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div className="config-page animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title">⚙️ Quiz Configuration</h1>
                    <p className="page-subtitle">Configure your quiz before the event starts</p>
                </div>
                <button className="btn btn-outline" onClick={() => navigate('/admin/dashboard')}>
                    ← Dashboard
                </button>
            </div>

            <div className="config-grid">
                {/* Quiz Settings Card */}
                <div className="config-card">
                    <h3 className="config-card-title">📝 Quiz Settings</h3>
                    <div className="config-fields">
                        <div className="config-row">
                            <div>
                                <label className="input-label">Quiz Title</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. AI Quiz Challenge 2026"
                                    value={config.quiz_title}
                                    onChange={(e) => setConfig(c => ({ ...c, quiz_title: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="input-label">Event Name</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. TechFest 2026"
                                    value={config.event_name}
                                    onChange={(e) => setConfig(c => ({ ...c, event_name: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding Card */}
                <div className="config-card">
                    <h3 className="config-card-title">🎨 Branding</h3>
                    <div className="config-row">
                        <div>
                            <label className="input-label">College / Organization Logo</label>
                            <div
                                className={`upload-zone ${logoPreview ? 'upload-zone-active' : ''}`}
                                onClick={() => logoInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleFileSelect('logo', e.dataTransfer.files[0]);
                                }}
                            >
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo preview" className="upload-preview" />
                                ) : null}
                                <p className="upload-text">
                                    {logoPreview ? 'Click or drop to replace' : (<><strong>Click to upload</strong> or drag & drop</>)}
                                </p>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileSelect('logo', e.target.files[0])}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Event Poster</label>
                            <div
                                className={`upload-zone ${posterPreview ? 'upload-zone-active' : ''}`}
                                onClick={() => posterInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleFileSelect('poster', e.dataTransfer.files[0]);
                                }}
                            >
                                {posterPreview ? (
                                    <img src={posterPreview} alt="Poster preview" className="upload-preview" />
                                ) : null}
                                <p className="upload-text">
                                    {posterPreview ? 'Click or drop to replace' : (<><strong>Click to upload</strong> or drag & drop</>)}
                                </p>
                                <input
                                    ref={posterInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleFileSelect('poster', e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Card */}
                <div className="config-card">
                    <h3 className="config-card-title">👥 Registration Type</h3>
                    <div className="config-fields">
                        <div className="config-row">
                            <div>
                                <label className="input-label">Registration Mode</label>
                                <select
                                    className="input-field"
                                    value={config.registration_type}
                                    onChange={(e) => setConfig(c => ({ ...c, registration_type: e.target.value }))}
                                >
                                    <option value="individual">👤 Individual</option>
                                    <option value="team">👥 Team</option>
                                </select>
                            </div>
                            {config.registration_type === 'team' && (
                                <div className="config-row">
                                    <div>
                                        <label className="input-label">Min Team Members</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            min="0"
                                            max="10"
                                            value={config.min_team_size ?? '0'}
                                            onChange={(e) => setConfig(c => ({ ...c, min_team_size: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Max Team Members</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            min="1"
                                            max="10"
                                            value={config.max_team_size || '4'}
                                            onChange={(e) => setConfig(c => ({ ...c, max_team_size: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        {config.registration_type === 'team' && (
                            <div className="msg-info" style={{ marginTop: '0.5rem' }}>
                                💡 Team registration will collect the leader's info plus {config.min_team_size || 2} to {config.max_team_size || 4} additional members.
                            </div>
                        )}
                    </div>
                </div>

                {/* Feedback Questions Card */}
                <div className="config-card">
                    <h3 className="config-card-title">💬 Feedback Questions</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                        Add questions shown after quiz. Two types: ⭐ Rating (1-5 stars) and 📝 Paragraph (text answer).
                    </p>

                    {/* Existing Questions */}
                    {feedbackQuestions.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            {feedbackQuestions.map((q, i) => (
                                <div key={q.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                                    borderRadius: '0.5rem', marginBottom: '0.5rem',
                                    background: q.is_active ? 'rgba(59, 130, 246, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                                    border: `1px solid ${q.is_active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.15)'}`,
                                    opacity: q.is_active ? 1 : 0.6,
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', minWidth: '1.5rem' }}>
                                        {i + 1}.
                                    </span>
                                    <span style={{ fontSize: '1.25rem', minWidth: '1.5rem' }}>
                                        {q.question_type === 'rating' ? '⭐' : '📝'}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        {editingFbId === q.id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input className="input-field" value={editingFbText}
                                                    onChange={(e) => setEditingFbText(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveFbEdit(q.id)}
                                                    style={{ flex: 1, padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                                                    autoFocus />
                                                <button className="btn btn-success btn-sm" onClick={() => handleSaveFbEdit(q.id)}>Save</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingFbId(null)}>Cancel</button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.8125rem', color: '#e2e8f0', cursor: 'pointer' }}
                                                onClick={() => { setEditingFbId(q.id); setEditingFbText(q.question_text); }}>
                                                {q.question_text}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`badge ${q.question_type === 'rating' ? 'badge-yellow' : 'badge-blue'}`}
                                        style={{ fontSize: '0.65rem' }}>
                                        {q.question_type}
                                    </span>
                                    <button onClick={() => handleToggleFbActive(q)}
                                        className={`btn btn-sm ${q.is_active ? 'btn-outline' : 'btn-success'}`}
                                        style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                                        {q.is_active ? 'Disable' : 'Enable'}
                                    </button>
                                    <button onClick={() => handleDeleteFbQuestion(q.id)}
                                        className="btn btn-sm btn-outline"
                                        style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {feedbackQuestions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                            No feedback questions yet. Add one below.
                        </div>
                    )}

                    {/* Add New Question */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label className="input-label">New Question</label>
                            <input className="input-field" placeholder="e.g. How was the quiz experience?"
                                value={newFbQuestion.question_text}
                                onChange={(e) => setNewFbQuestion(q => ({ ...q, question_text: e.target.value }))} />
                        </div>
                        <div style={{ minWidth: '130px' }}>
                            <label className="input-label">Type</label>
                            <select className="input-field" value={newFbQuestion.question_type}
                                onChange={(e) => setNewFbQuestion(q => ({ ...q, question_type: e.target.value }))}>
                                <option value="rating">⭐ Rating</option>
                                <option value="paragraph">📝 Paragraph</option>
                            </select>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleAddFbQuestion} disabled={fbSaving}
                            style={{ height: '38px', whiteSpace: 'nowrap' }}>
                            {fbSaving ? '...' : '+ Add'}
                        </button>
                    </div>
                    {fbMessage && (
                        <div className={fbMessage.startsWith('✅') ? 'msg-success' : 'msg-error'} style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
                            {fbMessage}
                        </div>
                    )}
                </div>

                {/* Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
                    {message && (
                        <span className={message.startsWith('✅') ? 'msg-success' : 'msg-error'}>
                            {message}
                        </span>
                    )}
                    <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                        {saving ? <><div className="spinner" /> Saving...</> : '💾 Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
