import { create } from 'zustand';
import { UserProfile } from '../types';
import xtreamService from '../services/xtreamService';

interface AuthState {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  autoLogin: boolean | (() => Promise<boolean>);
  login: (server: string, username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  userProfile: null,
  isLoading: false,
  error: null,
  autoLogin: async () => {
    return await get().checkAuth();
  },
  
  login: async (server: string, username: string, password: string, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const userProfile = await xtreamService.authenticate(server, username, password);
      // Persist credentials only when requested
      xtreamService.saveCredentials(server, username, password, !!rememberMe);
      set({ isAuthenticated: true, userProfile, isLoading: false });

      return true;
    } catch (error) {
      set({ 
        isAuthenticated: false, 
        userProfile: null, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      });
      return false;
    }
  },
  
  logout: () => {
    xtreamService.clearCredentials();
    localStorage.removeItem('xtream_credentials');
    set({ isAuthenticated: false, userProfile: null, error: null });
  },
  
  checkAuth: async () => {
    // First check if we're already logged in
    if (xtreamService.isLoggedIn()) {
      set({ isLoading: true, error: null });
      try {
        const userProfile = await xtreamService.getUserInfo();
        set({ isAuthenticated: true, userProfile, isLoading: false });
        return true;
      } catch (error) {
        set({ 
          isAuthenticated: false, 
          userProfile: null, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Authentication check failed' 
        });
        // Clear any stored credentials as they might be invalid
        localStorage.removeItem('xtream_credentials');
        return false;
      }
    }
    
    // Try auto login from stored credentials
    try {
      const credentialsJson = localStorage.getItem('xtream_credentials');
      if (credentialsJson) {
        const credentials = JSON.parse(credentialsJson);
        if (credentials && credentials.server && credentials.username && credentials.password) {
          // We have stored credentials, proceed with login
          return await get().login(credentials.server, credentials.username, credentials.password, true);
        }
      }
    } catch (error) {
      console.error('Auto login failed:', error);
      localStorage.removeItem('xtream_credentials');
    }
    
    return false;
  }
}));

export default useAuthStore;