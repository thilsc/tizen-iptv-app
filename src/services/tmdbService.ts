import axios from 'axios';
import { TMDBMovie, TMDBSeries, TMDBCast, TmdbMovieDetails, TmdbSeriesDetails } from '../types';

class TMDBService {
  private readonly API_KEY = (import.meta as { env?: Record<string, string> }).env?.VITE_TMDB_API_KEY || '42125c682636b68d10d70b487c692685';
  private readonly ACCESS_TOKEN = (import.meta as { env?: Record<string, string> }).env?.VITE_TMDB_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0MjEyNWM2ODI2MzZiNjhkMTBkNzBiNDg3YzY5MjY4NSIsIm5iZiI6MS42NDM4MjA2NjA2OTUwMDAyZSs5LCJzdWIiOiI2MWZhYjY3NGI3YWJiNTAwNjY1YWQ4MzAiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.e06dzH5trScMiz7obFbCFip5dO1XQp-bUC3lecJ8sxU';
  private readonly BASE_URL = 'https://api.themoviedb.org/3';
  private readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

  private api = axios.create({
    baseURL: this.BASE_URL,
    headers: {
      Authorization: `Bearer ${this.ACCESS_TOKEN}`,
      'Content-Type': 'application/json;charset=utf-8',
    },
  });

  // Helper method to get image URL with appropriate size
  public getImageUrl(path: string | null, size: 'original' | 'w500' | 'w300' | 'w185' = 'w500'): string | null {
    if (!path) return null;
    return `${this.IMAGE_BASE_URL}/${size}${path}`;
  }

  // Search for movies
  public async searchMovies(query: string, year?: string, language: string = 'tr-TR'): Promise<TMDBMovie[]> {
    try {
      const params: Record<string, unknown> = {
        query,
        language,
        include_adult: false,
      };
      
      if (year) {
        params.year = year;
      }
      
      const response = await this.api.get('/search/movie', { params });
      return response.data.results;
    } catch (error) {
      console.error('TMDB search movies error:', error);
      throw new Error('Failed to search for movies.');
    }
  }

  // Search for TV shows/series
  public async searchSeries(query: string, year?: string, language: string = 'tr-TR'): Promise<TMDBSeries[]> {
    try {
      const params: Record<string, unknown> = {
        query,
        language,
        include_adult: false,
      };
      
      if (year) {
        params.first_air_date_year = year;
      }
      
      const response = await this.api.get('/search/tv', { params });
      return response.data.results;
    } catch (error) {
      console.error('TMDB search TV shows error:', error);
      throw new Error('Failed to search for TV shows.');
    }
  }
  
  // Alias for backward compatibility
  public async searchTVShows(query: string, year?: string, language: string = 'tr-TR'): Promise<TMDBSeries[]> {
    return this.searchSeries(query, year, language);
  }

  // Get movie details
  public async getMovieDetails(movieId: number, language: string = 'tr-TR'): Promise<TmdbMovieDetails> {
    try {
      const response = await this.api.get(`/movie/${movieId}`, {
        params: {
          language,
          append_to_response: 'credits,videos,external_ids',
        },
      });
      return response.data;
    } catch (error) {
      console.error('TMDB get movie details error:', error);
      throw new Error('Failed to get movie details.');
    }
  }

  // Get TV show/series details
  public async getSeriesDetails(seriesId: number, language: string = 'tr-TR'): Promise<TmdbSeriesDetails> {
    try {
      const response = await this.api.get(`/tv/${seriesId}`, {
        params: {
          language,
          append_to_response: 'credits,videos,external_ids',
        },
      });
      return response.data;
    } catch (error) {
      console.error('TMDB get TV show details error:', error);
      throw new Error('Failed to get TV show details.');
    }
  }
  
  // Alias for backward compatibility
  public async getTVShowDetails(tvId: number, language: string = 'tr-TR'): Promise<TmdbSeriesDetails> {
    return this.getSeriesDetails(tvId, language);
  }

  // Get movie cast
  public async getMovieCast(movieId: number, language: string = 'tr-TR'): Promise<TMDBCast[]> {
    try {
      const response = await this.api.get(`/movie/${movieId}/credits`, {
        params: {
          language,
        },
      });
      return response.data.cast.slice(0, 10); // Return only the first 10 cast members
    } catch (error) {
      console.error('TMDB get movie cast error:', error);
      throw new Error('Failed to get movie cast.');
    }
  }

  // Get TV show cast
  public async getTVShowCast(tvId: number, language: string = 'tr-TR'): Promise<TMDBCast[]> {
    try {
      const response = await this.api.get(`/tv/${tvId}/credits`, {
        params: {
          language,
        },
      });
      return response.data.cast.slice(0, 10); // Return only the first 10 cast members
    } catch (error) {
      console.error('TMDB get TV show cast error:', error);
      throw new Error('Failed to get TV show cast.');
    }
  }
  
  // Alias for backward compatibility
  public async getSeriesCast(seriesId: number, language: string = 'tr-TR'): Promise<TMDBCast[]> {
    return this.getTVShowCast(seriesId, language);
  }

  // Get movie videos (trailers)
  public async getMovieVideos(movieId: number, language: string = 'tr-TR'): Promise<unknown[]> {
    try {
      const response = await this.api.get(`/movie/${movieId}/videos`, {
        params: {
          language,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('TMDB get movie videos error:', error);
      throw new Error('Failed to get movie videos.');
    }
  }

  // Get TV show videos (trailers)
  public async getTVShowVideos(tvId: number, language: string = 'tr-TR'): Promise<unknown[]> {
    try {
      const response = await this.api.get(`/tv/${tvId}/videos`, {
        params: {
          language,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('TMDB get TV show videos error:', error);
      throw new Error('Failed to get TV show videos.');
    }
  }
  
  // Alias for backward compatibility
  public async getSeriesVideos(seriesId: number, language: string = 'tr-TR'): Promise<unknown[]> {
    return this.getTVShowVideos(seriesId, language);
  }

  // Get similar movies
  public async getSimilarMovies(movieId: number, language: string = 'tr-TR'): Promise<TMDBMovie[]> {
    try {
      const response = await this.api.get(`/movie/${movieId}/similar`, {
        params: {
          language,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('TMDB get similar movies error:', error);
      throw new Error('Failed to get similar movies.');
    }
  }

  // Get similar TV shows/series
  public async getSimilarSeries(seriesId: number, language: string = 'tr-TR'): Promise<TMDBSeries[]> {
    try {
      const response = await this.api.get(`/tv/${seriesId}/similar`, {
        params: {
          language,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('TMDB get similar TV shows error:', error);
      throw new Error('Failed to get similar TV shows.');
    }
  }
  
  // Alias for backward compatibility
  public async getSimilarTVShows(tvId: number, language: string = 'tr-TR'): Promise<TMDBSeries[]> {
    return this.getSimilarSeries(tvId, language);
  }
  
  // Get movie by ID (useful when we already know the TMDB ID)
  public async getMovieById(movieId: number, language: string = 'tr-TR'): Promise<TMDBMovie> {
    try {
      const response = await this.api.get(`/movie/${movieId}`, {
        params: {
          language,
        },
      });
      return response.data;
    } catch (error) {
      console.error('TMDB get movie by ID error:', error);
      throw new Error('Failed to get movie by ID.');
    }
  }
  
  // Get series by ID (useful when we already know the TMDB ID)
  public async getSeriesById(seriesId: number, language: string = 'tr-TR'): Promise<TMDBSeries> {
    try {
      const response = await this.api.get(`/tv/${seriesId}`, {
        params: {
          language,
        },
      });
      return response.data;
    } catch (error) {
      console.error('TMDB get series by ID error:', error);
      throw new Error('Failed to get series by ID.');
    }
  }
  
  // Get trending content
  public async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', language: string = 'tr-TR'): Promise<TMDBMovie[]> {
    try {
      const response = await this.api.get(`/trending/movie/${timeWindow}`, {
        params: {
          language,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('TMDB get trending movies error:', error);
      throw new Error('Failed to get trending movies.');
    }
  }
  
  public async getTrendingSeries(timeWindow: 'day' | 'week' = 'week', language: string = 'tr-TR'): Promise<TMDBSeries[]> {
    try {
      const response = await this.api.get(`/trending/tv/${timeWindow}`, {
        params: {
          language,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('TMDB get trending series error:', error);
      throw new Error('Failed to get trending series.');
    }
  }
}

// Create a singleton instance
const tmdbService = new TMDBService();
export default tmdbService;