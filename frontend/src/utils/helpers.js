export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatShortDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const CATEGORIES = ['Food', 'Transport', 'Housing', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Utilities', 'Travel', 'Other'];

export const CATEGORY_COLORS = {
  Food: '#fb923c',
  Transport: '#60a5fa',
  Housing: '#a78bfa',
  Healthcare: '#34d399',
  Entertainment: '#facc15',
  Shopping: '#f97316',
  Education: '#0ea5e9',
  Utilities: '#94a3b8',
  Travel: '#ef4444',
  Other: '#64748b',
};

export const CATEGORY_ICONS = {
  Food: '🍔',
  Transport: '🚗',
  Housing: '🏠',
  Healthcare: '💊',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Education: '📚',
  Utilities: '⚡',
  Travel: '✈️',
  Other: '📦',
};

export const SAVINGS_CATEGORIES = ['Emergency Fund', 'Vacation', 'Education', 'Home', 'Car', 'Retirement', 'Investment', 'Other'];
export const SAVINGS_ICONS = ['🎯', '✈️', '📚', '🏠', '🚗', '💰', '📈', '⭐', '🎉', '💎', '🌟', '🏖️'];

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const getCategoryClass = (category) => {
  const map = {
    Food: 'cat-food', Transport: 'cat-transport', Housing: 'cat-housing',
    Healthcare: 'cat-healthcare', Entertainment: 'cat-entertainment',
    Shopping: 'cat-shopping', Education: 'cat-education',
    Utilities: 'cat-utilities', Travel: 'cat-travel', Other: 'cat-other',
  };
  return map[category] || 'cat-other';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const getMonthLabel = (month, year) => {
  return `${MONTHS[month - 1]} ${year}`;
};
