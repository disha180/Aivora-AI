import { create } from 'zustand';

interface User {
  user_id: string;
  email: string;
  name?: string;
  phone?: string;
  age?: number;
  gender?: string;
  preferences?: string;
  picture?: string;
  role: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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