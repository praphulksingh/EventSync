import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('authToken') || null,
  role: localStorage.getItem('userRole') || null,
  setAuth: (token, role) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    set({ token, role });
  },
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    set({ token: null, role: null });
  }
}));