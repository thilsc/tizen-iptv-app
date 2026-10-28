import { create } from 'zustand';
import { Favorite, PlaybackHistory, UserData } from '../types';

interface UserDataState {
  favorites: Favorite[];
  watchHistory: PlaybackHistory[];
  
  // Favorites actions
  addToFavorites: (favorite: Omit<Favorite, 'id' | 'addedAt'>) => void;
  removeFromFavorites: (id: number) => void;
  addFavorite: (favorite: Omit<Favorite, 'id' | 'addedAt'>) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (type: 'movie' | 'series' | 'live', streamId: number) => boolean;
  getFavoritesByType: (type: 'movie' | 'series' | 'live') => Favorite[];
  toggleFavorite: (favorite: Omit<Favorite, 'id' | 'addedAt'>) => boolean;
  
  // Watch history actions
  addToWatchHistory: (history: Omit<PlaybackHistory, 'id' | 'lastWatched'>) => void;
  updateWatchProgress: (id: number, position: number, duration: number) => void;
  removeFromWatchHistory: (id: number) => void;
  getWatchProgress: (type: 'movie' | 'series' | 'live', streamId: number, seasonNumber?: number, episodeNumber?: number) => PlaybackHistory | undefined;
  getRecentlyWatched: (limit?: number) => PlaybackHistory[];
  getContinueWatching: (limit?: number) => PlaybackHistory[];
  
  // Clear user data
  clearUserData: () => void;
  
  // Export/Import user data
  exportUserData: () => UserData;
  importUserData: (userData: UserData) => void;
}

// Monotonic counter for unique favorite ids
let favoriteIdCounter = Date.now();

// Load data from localStorage
const loadFavorites = (): Favorite[] => {
  const savedFavorites = localStorage.getItem('favorites');
  return savedFavorites ? JSON.parse(savedFavorites) : [];
};

const loadWatchHistory = (): PlaybackHistory[] => {
  const savedHistory = localStorage.getItem('watch_history');
  return savedHistory ? JSON.parse(savedHistory) : [];
};

// Save data to localStorage
const saveFavorites = (favorites: Favorite[]) => {
  localStorage.setItem('favorites', JSON.stringify(favorites));
};

const saveWatchHistory = (history: PlaybackHistory[]) => {
  localStorage.setItem('watch_history', JSON.stringify(history));
};

const useUserDataStore = create<UserDataState>((set, get) => ({
  favorites: loadFavorites(),
  watchHistory: loadWatchHistory(),
  
  // Favorites methods
  addToFavorites: (favorite) => {
    const newFavorite: Favorite = {
      ...favorite,
      id: ++favoriteIdCounter,
      addedAt: new Date().toISOString()
    };
    
    set(state => {
      const updatedFavorites = [...state.favorites, newFavorite];
      saveFavorites(updatedFavorites);
      return { favorites: updatedFavorites };
    });
  },
  
  removeFromFavorites: (id) => {
    set(state => {
      const updatedFavorites = state.favorites.filter(fav => fav.id !== id);
      saveFavorites(updatedFavorites);
      return { favorites: updatedFavorites };
    });
  },
  
  // Legacy methods for compatibility
  addFavorite: (favorite) => {
    get().addToFavorites(favorite);
  },
  
  removeFavorite: (id) => {
    get().removeFromFavorites(id);
  },
  
  isFavorite: (type, streamId) => {
    return get().favorites.some(fav => fav.type === type && fav.streamId === streamId);
  },
  
  getFavoritesByType: (type) => {
    return get().favorites.filter(fav => fav.type === type);
  },
  
  toggleFavorite: (favorite) => {
    const { type, streamId } = favorite;
    const isFav = get().isFavorite(type, streamId);
    
    if (isFav) {
      // Find the favorite to remove
      const favToRemove = get().favorites.find(
        fav => fav.type === type && fav.streamId === streamId
      );
      if (favToRemove) {
        get().removeFromFavorites(favToRemove.id);
      }
      return false; // No longer a favorite
    } else {
      get().addToFavorites(favorite);
      return true; // Now a favorite
    }
  },
  
  // Watch history methods
  addToWatchHistory: (history) => {
    // Check if this content is already in history
    const existingEntry = get().watchHistory.find(
      h => h.type === history.type && 
           h.streamId === history.streamId && 
           (history.type !== 'series' || 
            (h.seasonNumber === history.seasonNumber && 
             h.episodeNumber === history.episodeNumber))
    );
    
    if (existingEntry) {
      // Update existing entry
      get().updateWatchProgress(existingEntry.id, history.position, history.duration);
      return;
    }
    
    // Add new entry
    const newHistoryEntry: PlaybackHistory = {
      ...history,
      id: Date.now(),
      lastWatched: new Date().toISOString()
    };
    
    set(state => {
      // Limit history to 100 items
      const updatedHistory = [newHistoryEntry, ...state.watchHistory].slice(0, 100);
      saveWatchHistory(updatedHistory);
      return { watchHistory: updatedHistory };
    });
  },
  
  updateWatchProgress: (id, position, duration) => {
    set(state => {
      const updatedHistory = state.watchHistory.map(item => {
        if (item.id === id) {
          const completed = position / duration > 0.9; // Mark as completed if watched more than 90%
          return {
            ...item,
            position,
            duration,
            completed,
            lastWatched: new Date().toISOString()
          };
        }
        return item;
      });
      
      // Move the updated item to the top of the list
      const updatedItem = updatedHistory.find(item => item.id === id);
      if (updatedItem) {
        const filteredHistory = updatedHistory.filter(item => item.id !== id);
        const reorderedHistory = [updatedItem, ...filteredHistory];
        saveWatchHistory(reorderedHistory);
        return { watchHistory: reorderedHistory };
      }
      
      saveWatchHistory(updatedHistory);
      return { watchHistory: updatedHistory };
    });
  },
  
  removeFromWatchHistory: (id) => {
    set(state => {
      const updatedHistory = state.watchHistory.filter(item => item.id !== id);
      saveWatchHistory(updatedHistory);
      return { watchHistory: updatedHistory };
    });
  },
  
  getWatchProgress: (type, streamId, seasonNumber, episodeNumber) => {
    return get().watchHistory.find(
      h => h.type === type && 
           h.streamId === streamId && 
           (type !== 'series' || 
            (h.seasonNumber === seasonNumber && 
             h.episodeNumber === episodeNumber))
    );
  },
  
  getRecentlyWatched: (limit = 20) => {
    // Return the most recently watched items, sorted by lastWatched
    return [...get().watchHistory]
      .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
      .slice(0, limit);
  },
  
  getContinueWatching: (limit = 10) => {
    // Return items that are not completed and have been watched recently
    return [...get().watchHistory]
      .filter(item => !item.completed && (item.position / item.duration) > 0.05) // More than 5% watched but not completed
      .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
      .slice(0, limit);
  },
  
  // Clear all user data
  clearUserData: () => {
    localStorage.removeItem('favorites');
    localStorage.removeItem('watch_history');
    set({ favorites: [], watchHistory: [] });
  },
  
  // Export user data (for backup)
  exportUserData: (): UserData => {
    const { favorites, watchHistory } = get();
    
    // Get only non-completed items for continue watching
    const continueWatching = watchHistory
      .filter(item => !item.completed && (item.position / item.duration) > 0.05)
      .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime());
    
    // Get recently watched items
    const recentlyWatched = [...watchHistory]
      .sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime())
      .slice(0, 20);
    
    return {
      favorites,
      watchHistory,
      continueWatching,
      recentlyWatched
    };
  },
  
  // Import user data (from backup)
  importUserData: (userData: UserData) => {
    set({
      favorites: userData.favorites || [],
      watchHistory: userData.watchHistory || []
    });
    
    saveFavorites(userData.favorites || []);
    saveWatchHistory(userData.watchHistory || []);
  }
}));

export default useUserDataStore;