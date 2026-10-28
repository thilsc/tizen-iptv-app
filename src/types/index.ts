// User and Authentication Types
export interface LoginCredentials {
  server: string;
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserProfile {
  username: string;
  password: string;
  status: string;
  expDate: string;
  maxConnections: number;
  activeConnections: number;
}

// Content Types
export interface Category {
  category_id: string;
  category_name: string;
  parent_id?: number;
}

export type LiveCategory = Category;
export type MovieCategory = Category;
export type SeriesCategory = Category;

export interface Channel {
  stream_id: number;
  name: string;
  stream_icon: string;
  epg_channel_id?: string;
  added?: string;
  category_id: string;
  custom_sid?: string;
  tv_archive?: 0 | 1;
  direct_source?: string;
  tv_archive_duration?: number;
  epg_now?: EPGProgram;
  epg_next?: EPGProgram;
}

export interface LiveStream {
  stream_id: number;
  name: string;
  stream_icon: string;
  epg_channel_id?: string;
  added?: string;
  category_id: string;
  custom_sid?: string;
  tv_archive?: 0 | 1;
  direct_source?: string;
  tv_archive_duration?: number;
  epg_now?: EPGProgram;
  epg_next?: EPGProgram;
  stream_type?: string;
}

export interface Movie {
  stream_id: number;
  name: string;
  stream_icon: string;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid?: string;
  direct_source?: string;
  cover?: string;
  year?: string;
  genre?: string;
  plot?: string;
  rating?: string;
  director?: string;
  cast?: string;
  duration?: string;
  duration_secs?: number;
  tmdb_id?: number;
  backdrop_path?: string;
  youtube_trailer?: string;
}

export interface Series {
  series_id: number;
  name: string;
  cover: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string;
  rating_5based?: number;
  backdrop_path?: string;
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string;
  year?: string;
  tmdb_id?: number;
  seasons?: number[];
  num_seasons?: number;
  status?: string;
  country?: string;
  network?: string;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  cover?: string;
  poster_path?: string;
  overview?: string;
  air_date?: string;
  episode_count?: number;
  series_id?: number;
}

export interface Episode {
  id: number;
  episode_num: number;
  title: string;
  container_extension: string;
  info?: {
    movie_image?: string;
    plot?: string;
    duration_secs?: number;
    duration?: string;
    releasedate?: string;
    rating?: string;
  };
  added?: string;
  season: number;
  season_number: number; // Making this required
  direct_source?: string;
  seasonNumber?: number;
  still_path?: string;
  overview?: string;
  air_date?: string;
  vote_average?: number;
  episode_number?: number;
  name?: string;
}

// EPG Types
export interface EPGProgram {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  description?: string;
  channel_id: string;
  start_timestamp: number;
  stop_timestamp: number;
}

// TMDB Types
export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime: number;
  imdb_id?: string;
}

export interface TMDBSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  imdb_id?: string;
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime: number;
  imdb_id?: string;
  credits?: {
    cast: TMDBCast[];
  };
  videos?: {
    results: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }[];
  };
}

export interface TmdbSeriesDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  imdb_id?: string;
  credits?: {
    cast: TMDBCast[];
  };
  videos?: {
    results: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }[];
  };
}

// App Settings
export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'tr' | 'en';
  autoLogin: boolean;
  rememberMe: boolean;
  parentalControlEnabled: boolean;
  parentalControlPin?: string;
  blockedCategories?: number[];
  blockedContentIds?: number[];
  videoQualityPreference?: 'auto' | 'high' | 'medium' | 'low';
  subtitleLanguage?: string;
  audioLanguage?: string;
}

// Playback History
export interface PlaybackHistory {
  id: number;
  type: 'movie' | 'series' | 'live';
  name: string;
  streamId: number;
  position: number; // seconds
  duration: number; // seconds
  posterUrl?: string;
  backdropUrl?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  seriesId?: number;
  episodeTitle?: string;
  lastWatched: string; // ISO date string
  completed: boolean;
  tmdbId?: number;
  year?: string;
  categoryId?: string;
}

// Favorites
export interface Favorite {
  id: number;
  type: 'movie' | 'series' | 'live';
  name: string;
  streamId: number;
  posterUrl?: string;
  backdropUrl?: string;
  poster?: string; // For backward compatibility
  addedAt: string; // ISO date string
  tmdbId?: number;
  year?: string;
  categoryId?: string;
  genre?: string;
  rating?: string;
}

// User Data Store Types
export interface UserData {
  favorites: Favorite[];
  watchHistory: PlaybackHistory[];
  continueWatching: PlaybackHistory[];
  recentlyWatched: PlaybackHistory[];
}

// Search Types
export interface SearchResult {
  liveStreams: LiveStream[];
  movies: Movie[];
  series: Series[];
}