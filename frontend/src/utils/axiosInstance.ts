import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_REACT_APP_API_URL || 'https://vplite-stg.voiceplug.ai/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false
});

export function getAuthHeaders(): Record<string, string> {
    const rawToken = localStorage.getItem('token') || localStorage.getItem('authToken') || (import.meta.env?.VITE_API_TOKEN as string | undefined);
    const rawRefresh = localStorage.getItem('refreshToken') || (import.meta.env?.VITE_REFRESH_TOKEN as string | undefined);
    const token = rawToken && rawToken !== 'undefined' ? rawToken : undefined;
    const refresh = rawRefresh && rawRefresh !== 'undefined' ? rawRefresh : undefined;
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    if (token) headers['authorization'] = token;
    if (refresh) headers['x-refresh-token'] = refresh;
    return headers;
}

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            console.warn('Unauthorized! Redirecting to login...');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
