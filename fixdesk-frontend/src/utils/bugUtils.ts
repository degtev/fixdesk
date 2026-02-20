import { BUG_STATUSES, BUG_PRIORITIES } from './bugStatusConfig';
import { CustomStatus, CustomPriority } from '../types/project';

const colorToBgColor = (color: string): string => {
    return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.15)`;
};

const colorToBorderColor = (color: string): string => {
    return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.6)`;
};

export const getCustomStatusColor = (status: string, customStatuses?: CustomStatus[]): string => {
    if (customStatuses) {
        const found = customStatuses.find(s => s.code === status);
        if (found) return found.color;
    }
    return BUG_STATUSES.find(s => s.value === status)?.color || '#9e9e9e';
};

export const getCustomStatusText = (status: string, customStatuses?: CustomStatus[]): string => {
    if (customStatuses) {
        const found = customStatuses.find(s => s.code === status);
        if (found) return found.name;
    }
    return BUG_STATUSES.find(s => s.value === status)?.label || 'Неизвестно';
};

export const getCustomStatusBgColor = (status: string, customStatuses?: CustomStatus[]): string => {
    const color = getCustomStatusColor(status, customStatuses);
    if (color.startsWith('#')) {
        return colorToBgColor(color);
    }
    return BUG_STATUSES.find(s => s.value === status)?.bg || 'rgba(158, 158, 158, 0.15)';
};

export const getCustomStatusBorderColor = (status: string, customStatuses?: CustomStatus[]): string => {
    const color = getCustomStatusColor(status, customStatuses);
    if (color.startsWith('#')) {
        return colorToBorderColor(color);
    }
    return BUG_STATUSES.find(s => s.value === status)?.border || 'rgba(158, 158, 158, 0.6)';
};

export const getCustomPriorityColor = (priority: string, customPriorities?: CustomPriority[]): string => {
    if (customPriorities) {
        const found = customPriorities.find(p => p.code === priority);
        if (found) return found.color;
    }
    return BUG_PRIORITIES.find(p => p.value === priority)?.color || '#9e9e9e';
};

export const getCustomPriorityText = (priority: string, customPriorities?: CustomPriority[]): string => {
    if (customPriorities) {
        const found = customPriorities.find(p => p.code === priority);
        if (found) return found.name;
    }
    return BUG_PRIORITIES.find(p => p.value === priority)?.label || 'Неизвестно';
};

export const getCustomPriorityBgColor = (priority: string, customPriorities?: CustomPriority[]): string => {
    const color = getCustomPriorityColor(priority, customPriorities);
    if (color.startsWith('#')) {
        return colorToBgColor(color);
    }
    return BUG_PRIORITIES.find(p => p.value === priority)?.bg || 'rgba(158, 158, 158, 0.25)';
};

export const getCustomPriorityBorderColor = (priority: string, customPriorities?: CustomPriority[]): string => {
    const color = getCustomPriorityColor(priority, customPriorities);
    if (color.startsWith('#')) {
        return colorToBorderColor(color);
    }
    return BUG_PRIORITIES.find(p => p.value === priority)?.border || 'rgba(158, 158, 158, 0.6)';
};

export const getStatusColor = (status: string): string => {
    return BUG_STATUSES.find(s => s.value === status)?.color || '#9e9e9e';
};

export const getStatusText = (status: string): string => {
    return BUG_STATUSES.find(s => s.value === status)?.label || 'Неизвестно';
};

export const getStatusIcon = (status: string): string => {
    return BUG_STATUSES.find(s => s.value === status)?.icon || '❓';
};

export const getStatusBgColor = (status: string): string => {
    return BUG_STATUSES.find(s => s.value === status)?.bg || 'rgba(158, 158, 158, 0.15)';
};

export const getStatusBorderColor = (status: string): string => {
    return BUG_STATUSES.find(s => s.value === status)?.border || 'rgba(158, 158, 158, 0.6)';
};

export const getPriorityColor = (priority: string): string => {
    return BUG_PRIORITIES.find(p => p.value === priority)?.color || '#9e9e9e';
};

export const getPriorityText = (priority: string): string => {
    return BUG_PRIORITIES.find(p => p.value === priority)?.label || 'Неизвестно';
};

export const getPriorityIcon = (priority: string): string => {
    return BUG_PRIORITIES.find(p => p.value === priority)?.icon || '❓';
};

export const getPriorityBgColor = (priority: string): string => {
    return BUG_PRIORITIES.find(p => p.value === priority)?.bg || 'rgba(158, 158, 158, 0.25)';
};

export const getPriorityBorderColor = (priority: string): string => {
    return BUG_PRIORITIES.find(p => p.value === priority)?.border || 'rgba(158, 158, 158, 0.6)';
};

export const getPriorityValue = (priority: string): number => {
    switch (priority) {
        case 'low': return 1;
        case 'medium': return 2;
        case 'high': return 3;
        case 'critical': return 4;
        default: return 0;
    }
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType === 'text/plain') return '📄';
    return '📎';
};

export const getSafeFileName = (fileName: string): string => {
    try {
        return decodeURIComponent(fileName);
    } catch {
        return fileName;
    }
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }) + ', ' + date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDateTimeShort = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const time = date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    });
    return `${day}.${month}.${year} ${time}`;
};


export const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'только что';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} мин. назад`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ч. назад`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} дн. назад`;
    } else {
        return formatDate(timestamp);
    }
}; 