import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ft_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ft_token');
      // Dispatch custom event so AuthContext can react without a hard redirect
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/me', data);

// Expenses
export const getExpenses = (params) => API.get('/expenses', { params });
export const getExpenseSummary = (params) => API.get('/expenses/summary', { params });
export const createExpense = (data) => API.post('/expenses', data);
export const updateExpense = (id, data) => API.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

// Budgets
export const getBudgets = (params) => API.get('/budgets', { params });
export const createBudget = (data) => API.post('/budgets', data);
export const deleteBudget = (id) => API.delete(`/budgets/${id}`);

// Savings
export const getSavingsGoals = () => API.get('/savings');
export const createSavingsGoal = (data) => API.post('/savings', data);
export const updateSavingsGoal = (id, data) => API.put(`/savings/${id}`, data);
export const contributeToGoal = (id, data) => API.post(`/savings/${id}/contribute`, data);
export const deleteSavingsGoal = (id) => API.delete(`/savings/${id}`);

export default API;
