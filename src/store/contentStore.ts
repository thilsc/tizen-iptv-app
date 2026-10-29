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
import { decodeEpgText, toEpgTimestamp } from '../utils';

// Cache TTL for EPG responses (5 minutes)
const EPG_CACHE_TTL = 5 * 60 * 1000;
// Number of concurrent EPG requests per batch
const EPG_BATCH_SIZE = 5;

// In-flight EPG requests to avoid duplicate calls for the same channel
const epgInFlight = new Map<number, Promise<EPGProgram[]>>();

/**
 * Normalize raw EPG listings: decode base64 text, coerce timestamps
 * and sort programs by start time.
 */
const normalizeEpgPrograms = (
  listings: EPGProgram[] | undefined,
  streamId: number
): EPGProgram[] => {
  if (!Array.isArray(listings)) return [];

  return listings
    .map((listing, index) => {
      const startTimestamp = toEpgTimestamp(listing.start_timestamp, listing.start);
      const stopTimestamp = toEpgTimestamp(listing.stop_timestamp, listing.end);
      const title = decodeEpgText(listing.title);

      return {
        ...listing,
        id: listing.id ? String(listing.id) : `${streamId}-${index}`,
        title: title || '—',
        description: decodeEpgText(listing.description),
        channel_id: listing.channel_id ? String(listing.channel_id) : String(streamId),
        start_timestamp: startTimestamp,
        stop_timestamp: stopTimestamp
      };
    })
    .filter(program => program.start_timestamp > 0 && program.stop_timestamp > program.start_timestamp)
    .sort((a, b) => a.start_timestamp - b.start_timestamp);
};

// Fetch full EPG for a single channel, deduplicating concurrent requests
const fetchSingleEPG = (streamId: number): Promise<EPGProgram[]> => {
  const inFlight = epgInFlight.get(streamId);
  if (inFlight) return inFlight;

  const request = xtreamService
    .getEPG(streamId)
    .then(listings => normalizeEpgPrograms(listings, streamId))
    .finally(() => epgInFlight.delete(streamId));

  epgInFlight.set(streamId, request);
  return request;
};

interface ContentState {
  // Live TV
  liveCategories: Category[];
  liveStreams: LiveStream[];
  liveChannels: Channel[];
  selectedLiveCategory: Category | null;
  currentEPG: Record<number, EPGProgram[]>;
  epgLastFetched: Record<number, number>;
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
  fetchEPG: (streamId: number, force?: boolean) => Promise<void>;
  fetchEPGForChannels: (streamIds: number[], force?: boolean) => Promise<void>;
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
  epgLastFetched: {},
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
        currentEPG: { ...state.currentEPG, [streamId]: normalizeEpgPrograms(epg, streamId) },
        isLoadingEPG: false 
      }));
    } catch (error) {
      set({ 
        isLoadingEPG: false, 
        epgError: error instanceof Error ? error.message : 'Failed to fetch EPG' 
      });
    }
  },
  
  // Full EPG for a single channel (cached)
  fetchEPG: async (streamId: number, force = false) => {
    const { currentEPG, epgLastFetched } = get();
    const isCached =
      !!currentEPG[streamId] &&
      Date.now() - (epgLastFetched[streamId] ?? 0) < EPG_CACHE_TTL;
    if (!force && isCached) return;

    set({ isLoadingEPG: true, epgError: null });
    try {
      const programs = await fetchSingleEPG(streamId);
      set(state => ({
        currentEPG: { ...state.currentEPG, [streamId]: programs },
        epgLastFetched: { ...state.epgLastFetched, [streamId]: Date.now() },
        isLoadingEPG: false
      }));
    } catch (error) {
      set({
        isLoadingEPG: false,
        epgError: error instanceof Error ? error.message : 'Failed to fetch EPG'
      });
    }
  },
  
  // Full EPG for multiple channels, fetched in small concurrent batches
  fetchEPGForChannels: async (streamIds: number[], force = false) => {
    const { currentEPG, epgLastFetched } = get();
    const now = Date.now();
    const targets = Array.from(new Set(streamIds)).filter(streamId =>
      force || !currentEPG[streamId] || now - (epgLastFetched[streamId] ?? 0) >= EPG_CACHE_TTL
    );
    if (targets.length === 0) return;

    set({ isLoadingEPG: true, epgError: null });

    let failed = 0;
    let lastError: string | null = null;

    for (let i = 0; i < targets.length; i += EPG_BATCH_SIZE) {
      const batch = targets.slice(i, i + EPG_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(streamId => fetchSingleEPG(streamId))
      );

      const programsUpdate: Record<number, EPGProgram[]> = {};
      const fetchedAtUpdate: Record<number, number> = {};

      results.forEach((result, index) => {
        const streamId = batch[index];
        if (result.status === 'fulfilled') {
          programsUpdate[streamId] = result.value;
          fetchedAtUpdate[streamId] = Date.now();
        } else {
          failed += 1;
          lastError = result.reason instanceof Error
            ? result.reason.message
            : 'Failed to fetch EPG';
        }
      });

      if (Object.keys(programsUpdate).length > 0) {
        set(state => ({
          currentEPG: { ...state.currentEPG, ...programsUpdate },
          epgLastFetched: { ...state.epgLastFetched, ...fetchedAtUpdate }
        }));
      }
    }

    set({
      isLoadingEPG: false,
      // Only surface an error when every request failed
      epgError: failed === targets.length && lastError ? lastError : null
    });
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
      epgLastFetched: {},
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