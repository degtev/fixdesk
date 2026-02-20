export const BUG_STATUSES = [
  {
    value: 'open',
    label: 'Открыт',
    color: '#ff6b35',
    icon: '🔴',
    bg: 'rgba(255, 107, 53, 0.15)',
    border: 'rgba(255, 107, 53, 0.6)'
  },
  {
    value: 'in_progress',
    label: 'В работе',
    color: '#4ecdc4',
    icon: '🔄',
    bg: 'rgba(78, 205, 196, 0.15)',
    border: 'rgba(78, 205, 196, 0.6)'
  },
  {
    value: 'resolved',
    label: 'Решен',
    color: '#45b7d1',
    icon: '✅',
    bg: 'rgba(69, 183, 209, 0.15)',
    border: 'rgba(69, 183, 209, 0.6)'
  },
  {
    value: 'closed',
    label: 'Закрыт',
    color: '#96ceb4',
    icon: '🔒',
    bg: 'rgba(150, 206, 180, 0.15)',
    border: 'rgba(150, 206, 180, 0.6)'
  }
];

export const BUG_PRIORITIES = [
  {
    value: 'low',
    label: 'Низкий',
    color: '#4caf50',
    icon: '🟢',
    bg: 'rgba(76, 175, 80, 0.25)',
    border: 'rgba(76, 175, 80, 0.6)'
  },
  {
    value: 'medium',
    label: 'Средний',
    color: '#ff9800',
    icon: '🟡',
    bg: 'rgba(255, 152, 0, 0.25)',
    border: 'rgba(255, 152, 0, 0.6)'
  },
  {
    value: 'high',
    label: 'Высокий',
    color: '#f44336',
    icon: '🔴',
    bg: 'rgba(244, 67, 54, 0.25)',
    border: 'rgba(244, 67, 54, 0.6)'
  },
  {
    value: 'critical',
    label: 'Критический',
    color: '#9c27b0',
    icon: '💀',
    bg: 'rgba(156, 39, 176, 0.25)',
    border: 'rgba(156, 39, 176, 0.6)'
  }
]; 