import dayjs from 'dayjs';
import 'dayjs/locale/id';

// Set default locale to Indonesian
dayjs.locale('id');

/**
 * Format date string or Date object to standard Indonesian date display (e.g. 14 Agu 2026)
 */
export const formatDate = (date?: string | Date | null, formatStr = 'DD MMM YYYY'): string => {
    if (!date) return '-';
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format(formatStr) : '-';
};

/**
 * Format date & time (e.g. 14 Agu 2026, 21:00)
 */
export const formatDateTime = (date?: string | Date | null): string => {
    return formatDate(date, 'DD MMM YYYY, HH:mm');
};

/**
 * Relative time display (e.g. 2 jam yang lalu)
 */
export const formatRelativeTime = (date?: string | Date | null): string => {
    if (!date) return '-';
    const parsed = dayjs(date);
    if (!parsed.isValid()) return '-';
    
    const now = dayjs();
    const diffHours = now.diff(parsed, 'hour');
    const diffDays = now.diff(parsed, 'day');

    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 30) return `${diffDays} hari yang lalu`;
    
    return parsed.format('DD MMM YYYY');
};

export default dayjs;
