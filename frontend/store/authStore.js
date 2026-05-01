import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    set({ token });
    if (token) {
      global.authToken = token;
    } else {
      delete global.authToken;
    }
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    delete global.authToken;
  },
}));
