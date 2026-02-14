const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Generic API call helper
 * Automatically attaches JWT token & handles errors
 */
async function apiCall(endpoint, options = {}) {
    const { method = 'GET', body = null, auth = true } = options;

    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
        const studentToken = localStorage.getItem('student_token');
        const adminToken = localStorage.getItem('admin_token');
        // Pick token based on endpoint: admin endpoints use admin_token
        const token = endpoint.startsWith('/api/admin') ? adminToken : studentToken || adminToken;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const config = { method, headers };
    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false, message: 'Network error. Please check your connection.' };
    }
}

export default apiCall;
export { BASE_URL };
