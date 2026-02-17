const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let cachedConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Fetch quiz config from backend. Returns cached version if fresh enough.
 * @param {boolean} forceRefresh — bypass cache
 * @returns {{ quiz_title, event_name, college_logo_url, event_poster_url, registration_type, team_size }}
 */
export async function getQuizConfig(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedConfig && now - cacheTimestamp < CACHE_TTL) {
        return cachedConfig;
    }

    try {
        const res = await fetch(`${BASE_URL}/api/public/config`);
        const data = await res.json();
        if (data.success && data.config) {
            // Resolve image URLs to absolute if they start with /
            const config = { ...data.config };
            if (config.college_logo_url?.startsWith('/')) {
                config.college_logo_url = `${BASE_URL}${config.college_logo_url}`;
            }
            if (config.event_poster_url?.startsWith('/')) {
                config.event_poster_url = `${BASE_URL}${config.event_poster_url}`;
            }
            config.team_size = parseInt(config.team_size) || 0;
            cachedConfig = config;
            cacheTimestamp = now;
            return config;
        }
    } catch (err) {
        console.error('Failed to fetch quiz config:', err);
    }

    // Defaults if fetch fails
    return cachedConfig || {
        quiz_title: 'Quiz Challenge',
        event_name: '',
        college_logo_url: '',
        event_poster_url: '',
        registration_type: 'individual',
        team_size: 0,
    };
}

/** Clear cached config (useful after admin saves changes) */
export function clearConfigCache() {
    cachedConfig = null;
    cacheTimestamp = 0;
}
