import { create } from 'zustand';
import { 
  Category, 
  LiveStream, 
  Movie, 
  Series, 
  EPGProgram,
  Channel,
  Season,
  Episode
} from '../types';
import xtreamService from '../services/xtreamService';

interface ContentState {
  // Live TV
  liveCategories: Category[];
  liveStreams: LiveStream[];
  liveChannels: Channel[];
  selectedLiveCategory: Category | null;
  currentEPG: Record<number, EPGProgram[]>;
  channelStream: string | null;
  
  // Movies
  movieCategories: Category[];
  movies: Movie[];
  selectedMovieCategory: Category | null;
  movieStream: string | null;
  
  // Series
  seriesCategories: Category[];
  seriesList: Series[];
  series: Series[];
  selectedSeriesCategory: Category | null;
  seasons: Season[];
  episodes: Episode[];
  episodeStream: string | null;
  
  // Featured content
  featuredContent: Array<{id: number, type: 'movie' | 'series' | 'live', streamId: number}>;
  
  // Loading states
  isLoadingLive: boolean;
  isLoadingMovies: boolean;
  isLoadingSeries: boolean;
  isLoadingEPG: boolean;
  isLoading: boolean;
  
  // Error states
  liveError: string | null;
  moviesError: string | null;
  seriesError: string | null;
  epgError: string | null;
  
  // Actions
  fetchLiveCategories: () => Promise<void>;
  fetchLiveStreams: (categoryId?: string) => Promise<void>;
  setSelectedLiveCategory: (category: Category | null) => void;
  fetchShortEPG: (streamId: number) => Promise<void>;
  fetchChannelStream: (streamId: number) => Promise<void>;
  
  fetchMovieCategories: () => Promise<void>;
  fetchMovies: (categoryId?: string) => Promise<void>;
  setSelectedMovieCategory: (category: Category | null) => void;
  fetchMovieStream: (streamId: number) => Promise<void>;
  
  fetchSeriesCategories: () => Promise<void>;
  fetchSeries: (categoryId?: string) => Promise<void>;
  setSelectedSeriesCategory: (category: Category | null) => void;
  fetchSeriesSeasons: (seriesId: number) => Promise<void>;
  fetchSeriesEpisodes: (seriesId: number, seasonNum: number) => Promise<void>;
  fetchEpisodeStream: (episodeId: number) => Promise<void>;
  
  fetchFeaturedContent: () => Promise<void>;
  
  clearContent: () => void;
}

const useContentStore = create<ContentState>((set, get) => ({
  // Initial states
  liveCategories: [],
  liveStreams: [],
  liveChannels: [],
  selectedLiveCategory: null,
  currentEPG: {},
  channelStream: null,
  
  movieCategories: [],
  movies: [],
  selectedMovieCategory: null,
  movieStream: null,
  
  seriesCategories: [],
  seriesList: [],
  series: [],
  selectedSeriesCategory: null,
  seasons: [],
  episodes: [],
  episodeStream: null,
  
  featuredContent: [],
  
  isLoadingLive: false,
  isLoadingMovies: false,
  isLoadingSeries: false,
  isLoadingEPG: false,
  isLoading: false,
  
  liveError: null,
  moviesError: null,
  seriesError: null,
  epgError: null,
  
  // Live TV actions
  fetchLiveCategories: async () => {
    set({ isLoadingLive: true, liveError: null });
    try {
      const categories = await xtreamService.getLiveCategories();
      set({ liveCategories: categories, isLoadingLive: false });
    } catch (error) {
      set({ 
        isLoadingLive: false, 
        liveError: error instanceof Error ? error.message : 'Failed to fetch live categories' 
      });
    }
  },
  
  fetchLiveStreams: async (categoryId?: string) => {
    set({ isLoadingLive: true, liveError: null });
    try {
      const streams = await xtreamService.getLiveStreams(categoryId);
      set({ liveStreams: streams, liveChannels: streams, isLoadingLive: false });
    } catch (error) {
      set({ 
        isLoadingLive: false, 
        liveError: error instanceof Error ? error.message : 'Failed to fetch live streams' 
      });
    }
  },
  
  setSelectedLiveCategory: (category: Category | null) => {
    set({ selectedLiveCategory: category });
    if (category) {
      get().fetchLiveStreams(category.category_id);
    } else {
      get().fetchLiveStreams();
    }
  },
  
  fetchShortEPG: async (streamId: number) => {
    set({ isLoadingEPG: true, epgError: null });
    try {
      const epg = await xtreamService.getShortEPG(streamId);
      set(state => ({ 
        currentEPG: { ...state.currentEPG, [streamId]: epg },
        isLoadingEPG: false 
      }));
    } catch (error) {
      set({ 
        isLoadingEPG: false, 
        epgError: error instanceof Error ? error.message : 'Failed to fetch EPG' 
      });
    }
  },
  
  // Movies actions
  fetchMovieCategories: async () => {
    set({ isLoadingMovies: true, moviesError: null });
    try {
      const categories = await xtreamService.getVodCategories();
      set({ movieCategories: categories, isLoadingMovies: false });
    } catch (error) {
      set({ 
        isLoadingMovies: false, 
        moviesError: error instanceof Error ? error.message : 'Failed to fetch movie categories' 
      });
    }
  },
  
  fetchMovies: async (categoryId?: string) => {
    set({ isLoadingMovies: true, moviesError: null });
    try {
      const movies = await xtreamService.getVodStreams(categoryId);
      set({ movies, isLoadingMovies: false });
    } catch (error) {
      set({ 
        isLoadingMovies: false, 
        moviesError: error instanceof Error ? error.message : 'Failed to fetch movies' 
      });
    }
  },
  
  setSelectedMovieCategory: (category: Category | null) => {
    set({ selectedMovieCategory: category });
    if (category) {
      get().fetchMovies(category.category_id);
    } else {
      get().fetchMovies();
    }
  },
  
  // Series actions
  fetchSeriesCategories: async () => {
    set({ isLoadingSeries: true, seriesError: null });
    try {
      const categories = await xtreamService.getSeriesCategories();
      set({ seriesCategories: categories, isLoadingSeries: false });
    } catch (error) {
      set({ 
        isLoadingSeries: false, 
        seriesError: error instanceof Error ? error.message : 'Failed to fetch series categories' 
      });
    }
  },
  
  fetchSeries: async (categoryId?: string) => {
    set({ isLoadingSeries: true, seriesError: null });
    try {
      const series = await xtreamService.getSeries(categoryId);
      set({ seriesList: series, series: series, isLoadingSeries: false });
    } catch (error) {
      set({ 
        isLoadingSeries: false, 
        seriesError: error instanceof Error ? error.message : 'Failed to fetch series' 
      });
    }
  },
  
  setSelectedSeriesCategory: (category: Category | null) => {
    set({ selectedSeriesCategory: category });
    if (category) {
      get().fetchSeries(category.category_id);
    } else {
      get().fetchSeries();
    }
  },
  
  // Additional actions for streams
  fetchChannelStream: async (streamId: number) => {
    set({ isLoading: true });
    try {
      const streamUrl = await xtreamService.getLiveStreamUrl(streamId);
      set({ channelStream: streamUrl, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        liveError: error instanceof Error ? error.message : 'Failed to fetch channel stream' 
      });
    }
  },
  
  fetchMovieStream: async (streamId: number) => {
    set({ isLoading: true });
    try {
      const streamUrl = await xtreamService.getMovieStreamUrl(streamId);
      set({ movieStream: streamUrl, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        moviesError: error instanceof Error ? error.message : 'Failed to fetch movie stream' 
      });
    }
  },
  
  fetchSeriesSeasons: async (seriesId: number) => {
    set({ isLoading: true });
    try {
      const seasons = await xtreamService.getSeriesSeasons(seriesId);
      set({ seasons, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        seriesError: error instanceof Error ? error.message : 'Failed to fetch series seasons' 
      });
    }
  },
  
  fetchSeriesEpisodes: async (seriesId: number, seasonNum: number) => {
    set({ isLoading: true });
    try {
      const episodes = await xtreamService.getSeriesEpisodes(seriesId, seasonNum);
      set({ episodes, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        seriesError: error instanceof Error ? error.message : 'Failed to fetch series episodes' 
      });
    }
  },
  
  fetchEpisodeStream: async (episodeId: number) => {
    set({ isLoading: true });
    try {
      const streamUrl = await xtreamService.getEpisodeStreamUrl(episodeId);
      set({ episodeStream: streamUrl, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        seriesError: error instanceof Error ? error.message : 'Failed to fetch episode stream' 
      });
    }
  },
  
  fetchFeaturedContent: async () => {
    set({ isLoading: true });
    try {
      // This would typically come from the server, but we'll simulate it
      // by selecting random content from our existing lists
      const featured = [];
      
      // Add some movies
      const { movies } = get();
      if (movies.length > 0) {
        const randomMovies = [...movies]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(movie => ({
            id: movie.stream_id,
            type: 'movie' as const,
            streamId: movie.stream_id
          }));
        featured.push(...randomMovies);
      }
      
      // Add some series
      const { seriesList } = get();
      if (seriesList.length > 0) {
        const randomSeries = [...seriesList]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(series => ({
            id: series.series_id,
            type: 'series' as const,
            streamId: series.series_id
          }));
        featured.push(...randomSeries);
      }
      
      // Add some live channels
      const { liveStreams } = get();
      if (liveStreams.length > 0) {
        const randomChannels = [...liveStreams]
          .sort(() => 0.5 - Math.random())
          .slice(0, 2)
          .map(channel => ({
            id: channel.stream_id,
            type: 'live' as const,
            streamId: channel.stream_id
          }));
        featured.push(...randomChannels);
      }
      
      // Shuffle the final list
      const shuffledFeatured = [...featured].sort(() => 0.5 - Math.random());
      
      set({ featuredContent: shuffledFeatured, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch featured content', error);
    }
  },
  
  // Clear all content (e.g., on logout)
  clearContent: () => {
    set({
      liveCategories: [],
      liveStreams: [],
      liveChannels: [],
      selectedLiveCategory: null,
      currentEPG: {},
      channelStream: null,
      
      movieCategories: [],
      movies: [],
      selectedMovieCategory: null,
      movieStream: null,
      
      seriesCategories: [],
      seriesList: [],
      series: [],
      selectedSeriesCategory: null,
      seasons: [],
      episodes: [],
      episodeStream: null,
      
      featuredContent: [],
      
      liveError: null,
      moviesError: null,
      seriesError: null,
      epgError: null
    });
  }
}));

export default useContentStore;