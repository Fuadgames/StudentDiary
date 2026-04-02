import { create } from 'zustand';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  role: 'student' | 'teacher';
  name: string;
  surname: string;
  email: string;
  classCode: string;
  points?: number;
  avatarUrl?: string;
  theme?: 'light' | 'dark';
  language?: string;
}

interface AppState {
  user: User | null;
  profile: UserProfile | null;
  isAuthReady: boolean;
  theme: 'light' | 'dark';
  language: string;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setAuthReady: (ready: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  isAuthReady: false,
  theme: 'light',
  language: 'ru',
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  setTheme: (theme) => {
    set({ theme });
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  setLanguage: (language) => set({ language }),
}));
