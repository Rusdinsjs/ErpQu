import axios from 'axios';
import { showToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/useAuthStore';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
    const { token, activeCompanyId } = useAuthStore.getState();
    if (token) {
        config.headers.set('Authorization', 'Bearer ' + token);
    }
    if (activeCompanyId && !config.headers.get('X-Company-ID')) {
        config.headers.set('X-Company-ID', activeCompanyId);
    }

    const method = config.method?.toUpperCase();
    const isSalesInvoiceCommand =
        config.url?.startsWith('/finance/sales/invoices') && (method === 'POST' || method === 'PUT');
    if (isSalesInvoiceCommand && !config.headers.get('Idempotency-Key')) {
        config.headers.set('Idempotency-Key', crypto.randomUUID());
    }

    return config;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const headers = error.config?.headers;
        const hasSuppressHeader = headers && (headers['X-Suppress-Toast'] || headers['x-suppress-toast']);

        if (
            hasSuppressHeader ||
            error.config?.url?.includes('/public-settings') ||
            error.config?.url?.includes('/audit/sessions/active')
        ) {
            return Promise.reject(error);
        }

        const message = error.response?.data?.error || error.response?.data?.message;

        // Auto-refresh token if 401 Unauthorized and not already refreshing or login/refresh endpoint
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/refresh')
        ) {
            const { refreshToken, setTokens, logout } = useAuthStore.getState();

            if (refreshToken) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((newToken) => {
                            originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                            return api(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshRes = await axios.post(
                        (import.meta.env.VITE_API_URL || '/api') + '/auth/refresh',
                        { refresh_token: refreshToken }
                    );

                    const newToken = refreshRes.data?.token;
                    const newRefreshToken = refreshRes.data?.refresh_token;

                    if (newToken) {
                        setTokens(newToken, newRefreshToken);
                        processQueue(null, newToken);
                        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                        return api(originalRequest);
                    }
                } catch (refreshErr) {
                    processQueue(refreshErr, null);
                    logout();
                    showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'error', 'Sesi Berakhir');
                    return Promise.reject(refreshErr);
                } finally {
                    isRefreshing = false;
                }
            } else {
                logout();
                showToast('Session expired. Please login again.', 'error', 'Authentication Error');
            }
        } else if (error.response?.status >= 400) {
            if (message) {
                showToast(message, 'error', 'Error');
            }
        } else if (!error.response && !axios.isCancel(error)) {
            if (error.config?.method?.toUpperCase() !== 'GET') {
                showToast('Tidak dapat terhubung ke server backend', 'error', 'Koneksi Gagal');
            }
        }

        return Promise.reject(error);
    }
);

export default api;

