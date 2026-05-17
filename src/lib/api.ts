import axios from 'axios';
import { getToken } from '@/lib/tokenStorage';

// IMPORTANT: In production (Vercel), NEXT_PUBLIC_API_URL must be set in Vercel Dashboard.
// If not set, fallback to the localhost backend URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://apex-backend-theta.vercel.app/api' : 'http://localhost:5000/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 30000, // 30 second timeout to prevent hanging requests
});


api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Track if we're already redirecting to prevent duplicate navigation
let isRedirecting = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined' && !isRedirecting) {
            if (error.response?.status === 401) {
                // Prevent any further API error handling from showing error screens
                isRedirecting = true;
                localStorage.clear();
                window.location.href = '/login';
                // Return a promise that never resolves — stops all downstream catch blocks
                return new Promise(() => {});
            }
            if (error.response?.status === 403 && error.response?.data?.code === 'PASSWORD_RESET_REQUIRED') {
                isRedirecting = true;
                window.location.href = '/auth/change-password';
                return new Promise(() => {});
            }
        }
        return Promise.reject(error);
    }
);

export default api;