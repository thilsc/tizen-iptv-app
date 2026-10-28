import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, FocusProvider } from './providers';
import { useAuthStore, useSettingsStore } from './store';
import {
  LoginPage,
  HomePage,
  LiveTVPage,
  MoviesPage,
  SeriesPage,
  MovieDetailPage,
  SeriesDetailPage,
  LiveTVPlayerPage,
  SettingsPage,
  SearchPage,
  FavoritesPage,
  ProfilePage
} from './pages';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, autoLogin } = useAuthStore();
  const { initializeSettings } = useSettingsStore();
  
  // Initialize app on mount
  useEffect(() => {
    // Initialize settings from local storage
    initializeSettings();
    
    // Try auto login if credentials are stored
    if (typeof autoLogin === 'function') {
      autoLogin();
    }
  }, [initializeSettings, autoLogin]);
  
  return (
    <ThemeProvider>
      <FocusProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            
            <Route path="/live" element={
              <ProtectedRoute>
                <LiveTVPage />
              </ProtectedRoute>
            } />
            
            <Route path="/live/:id" element={
              <ProtectedRoute>
                <LiveTVPlayerPage />
              </ProtectedRoute>
            } />
            
            <Route path="/movies" element={
              <ProtectedRoute>
                <MoviesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/movie/:id" element={
              <ProtectedRoute>
                <MovieDetailPage />
              </ProtectedRoute>
            } />
            
            <Route path="/series" element={
              <ProtectedRoute>
                <SeriesPage />
              </ProtectedRoute>
            } />
            
            <Route path="/series/:id" element={
              <ProtectedRoute>
                <SeriesDetailPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/search" element={
              <ProtectedRoute>
                <SearchPage />
              </ProtectedRoute>
            } />

            <Route path="/favorites" element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </FocusProvider>
    </ThemeProvider>
  );
};

export default App;
