import { api } from '../api/http';

export const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }

    const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
    const cleanPath = path.startsWith('/') ? path : '/' + path;

    if (cleanPath.startsWith('/uploads')) {
        return baseUrl + '/api' + cleanPath;
    }

    return baseUrl + cleanPath;
};
