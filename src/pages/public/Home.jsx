import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuizConfig } from '../../api/quizConfig';

export default function Home() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getQuizConfig(true).then(c => {
            setConfig(c);
            setTimeout(() => setLoading(false), 400);
        });
    }, []);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            }}>
                <div className="spinner spinner-lg" style={{ borderTopColor: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }} />
            </div>
        );
    }

    const hasPoster = config?.event_poster_url;
    const hasLogo = config?.college_logo_url;
    const isTeam = config?.registration_type === 'team';

    return (
        <div className="home-page">
            {/* ── Full-screen poster background (blurred) ── */}
            {hasPoster && (
                <div className="home-bg-poster">
                    <img
                        src={config.event_poster_url}
                        alt=""
                        className="home-bg-poster-img"
                        loading="eager"
                        decoding="async"
                    />
                    <div className="home-bg-poster-overlay" />
                </div>
            )}

            {/* ── Background Animated Orbs ── */}
            <div className="home-orb home-orb-1" />
            <div className="home-orb home-orb-2" />
            <div className="home-orb home-orb-3" />

            {/* ── Floating particles ── */}
            <div className="home-particles">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={`home-particle home-particle-${i + 1}`} />
                ))}
            </div>

            {/* ── Top Header Bar: Logo left, Event name center ── */}
            {(hasLogo || config?.event_name) && (
                <header className="home-header">
                    <div className="home-header-left">
                        {hasLogo && (
                            <img
                                src={config.college_logo_url}
                                alt="Logo"
                                className="home-header-logo"
                                loading="eager"
                                decoding="async"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                    </div>
                    <div className="home-header-center">
                        {config?.event_name && (
                            <span className="home-header-event">{config.event_name}</span>
                        )}
                    </div>
                    <div className="home-header-right">
                        <div className="home-header-dept">
                            Computer Science Engineering<br />(Artificial Intelligence & Machine Learning)
                        </div>
                    </div>
                </header>
            )}

            {/* ── Main Content (overlays the blurred poster) ── */}
            <main className="home-main">
                <div className="home-content">
                    {/* Quiz Title */}
                    <h1 className="home-quiz-title home-anim-fade-up" style={{ animationDelay: '0.2s' }}>
                        {config?.quiz_title || 'Quiz Challenge'}
                    </h1>

                    {/* Subtitle tagline */}
                    <p className="home-tagline home-anim-fade-up" style={{ animationDelay: '0.3s' }}>
                        Test your knowledge • Compete • Win
                    </p>

                    {/* CTA Button */}
                    <Link to="/student" className="home-cta home-anim-fade-up" style={{ animationDelay: '0.4s' }}>
                        Enter Quiz <span style={{ fontSize: '1.25rem' }}>→</span>
                    </Link>

                    {/* Info Badges */}
                    <div className="home-info-badges home-anim-fade-up" style={{ animationDelay: '0.55s' }}>
                        <span className="home-badge">
                            {isTeam ? (
                                config.min_team_size === config.max_team_size
                                    ? `👥 Team of ${Number(config.min_team_size) + 1}`
                                    : `👥 Team of ${Number(config.min_team_size) + 1}-${Number(config.max_team_size) + 1}`
                            ) : '👤 Individual'}
                        </span>
                        <span className="home-badge">📝 Timed Quiz</span>
                        <span className="home-badge">🏆 Live Ranks</span>
                    </div>

                    {/* Footer links */}
                    <div className="home-links home-anim-fade-up" style={{ animationDelay: '0.65s' }}>
                        <Link to="/ranks" className="home-link">📊 View Rankings</Link>
                    </div>
                </div>
            </main >

            {/* ── Bottom accent line ── */}
            < div className="home-bottom-accent" />
        </div >
    );
}
