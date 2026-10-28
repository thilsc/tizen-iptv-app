import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, FocusProvider } from './providers';
import { useAuthStore, useSettingsStore, useContentStore } from './store';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LiveTVPage = lazy(() => import('./pages/LiveTVPage'));
const MoviesPage = lazy(() => import('./pages/MoviesPage'));
const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage'));
const LiveTVPlayerPage = lazy(() => import('./pages/LiveTVPlayerPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  const { isAuthenticated, autoLogin } = useAuthStore();
  const { initializeSettings } = useSettingsStore();
  const {
    fetchLiveCategories,
    fetchLiveStreams,
    fetchMovieCategories,
    fetchMovies,
    fetchSeriesCategories,
    fetchSeries,
    fetchFeaturedContent,
  } = useContentStore();

  // Initialize app on mount
  useEffect(() => {
    // Initialize settings from local storage
    initializeSettings();
    
    // Try auto login if credentials are stored
    if (typeof autoLogin === 'function') {
      autoLogin();
    }
  }, [initializeSettings, autoLogin]);

  // Centralized initial content loading after authentication
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadContent = async () => {
      await Promise.all([
        fetchLiveCategories(),
        fetchLiveStreams(),
        fetchMovieCategories(),
        fetchMovies(),
        fetchSeriesCategories(),
        fetchSeries(),
      ]);
      await fetchFeaturedContent();
    };

    loadContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
  
  return (
    <ThemeProvider>
      <FocusProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<div style={{ padding: 48, color: 'var(--color-text-primary)' }}>Loading...</div>}>
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
          </Suspense>
        </Router>
      </FocusProvider>
    </ThemeProvider>
  );
};

export default App;
