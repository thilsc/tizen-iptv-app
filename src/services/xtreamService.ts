import axios from 'axios';
import { 
  Category, 
  LiveStream, 
  Movie, 
  Series, 
  Season, 
  Episode, 
  EPGProgram,
  UserProfile
} from '../types';

const CREDENTIALS_KEY = 'xtream_credentials';
const OBFUSCATION_KEY = 'tizen-iptv-app::local';

const xorString = (input: string): string =>
  Array.from(input)
    .map((char, index) =>
      String.fromCharCode(char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(index % OBFUSCATION_KEY.length))
    )
    .join('');

const encodeCredentials = (credentials: { server: string; username: string; password: string }): string =>
  btoa(encodeURIComponent(xorString(JSON.stringify(credentials))));

const decodeCredentials = (value: string): { server: string; username: string; password: string } =>
  JSON.parse(decodeURIComponent(xorString(atob(value))));

class XtreamService {
  private baseUrl: string = '';
  private username: string = '';
  private password: string = '';
  private isAuthenticated: boolean = false;

  constructor() {
    // Try to load credentials from localStorage
    this.loadCredentials();
  }

  private loadCredentials(): void {
    try {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      if (stored) {
        let parsed: { server: string; username: string; password: string };
        try {
          // Backward compatibility with previously stored plaintext credentials
          parsed = JSON.parse(stored);
        } catch {
          parsed = decodeCredentials(stored);
        }
        const { server, username, password } = parsed;
        this.baseUrl = server;
        this.username = username;
        this.password = password;
        this.isAuthenticated = true;
      }
    } catch (error) {
      console.error('Failed to load stored credentials:', error);
      localStorage.removeItem(CREDENTIALS_KEY);
    }
  }

  public saveCredentials(server: string, username: string, password: string, persist: boolean = true): void {
    this.baseUrl = server;
    this.username = username;
    this.password = password;
    this.isAuthenticated = true;

    if (persist) {
      localStorage.setItem(CREDENTIALS_KEY, encodeCredentials({ server, username, password }));
    } else {
      localStorage.removeItem(CREDENTIALS_KEY);
    }
  }

  public clearCredentials(): void {
    localStorage.removeItem('xtream_credentials');
    this.baseUrl = '';
    this.username = '';
    this.password = '';
    this.isAuthenticated = false;
  }

  public isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  private getApiUrl(action: string, params: Record<string, string | number> = {}): string {
    const baseApiUrl = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}`;
    const actionParam = action ? `&action=${action}` : '';
    
    const queryParams = Object.entries(params)
      .map(([key, value]) => `&${key}=${value}`)
      .join('');
    
    return `${baseApiUrl}${actionParam}${queryParams}`;
  }

  // Authentication and User Profile
  public async authenticate(server: string, username: string, password: string): Promise<UserProfile> {
    try {
      const url = `${server}/player_api.php?username=${username}&password=${password}`;
      const response = await axios.get(url);
      
      if (response.data.user_info) {
        this.saveCredentials(server, username, password, false);
        return response.data.user_info as UserProfile;
      }
      
      throw new Error('Authentication failed');
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Failed to authenticate. Please check your credentials.');
    }
  }

  public async getUserInfo(): Promise<UserProfile> {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated');
      }
      
      const url = this.getApiUrl('');
      const response = await axios.get(url);
      
      if (response.data.user_info) {
        return response.data.user_info as UserProfile;
      }
      
      throw new Error('Failed to get user info');
    } catch (error) {
      console.error('Get user info error:', error);
      throw new Error('Failed to get user information.');
    }
  }

  // Live TV Methods
  public async getLiveCategories(): Promise<Category[]> {
    try {
      const url = this.getApiUrl('get_live_categories');
      const response = await axios.get(url);
      return response.data as Category[];
    } catch (error) {
      console.error('Get live categories error:', error);
      throw new Error('Failed to get live TV categories.');
    }
  }

  public async getLiveStreams(categoryId?: string): Promise<LiveStream[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      
      const url = this.getApiUrl('get_live_streams', params);
      const response = await axios.get(url);
      return response.data as LiveStream[];
    } catch (error) {
      console.error('Get live streams error:', error);
      throw new Error('Failed to get live streams.');
    }
  }

  // VOD (Movies) Methods
  public async getVodCategories(): Promise<Category[]> {
    try {
      const url = this.getApiUrl('get_vod_categories');
      const response = await axios.get(url);
      return response.data as Category[];
    } catch (error) {
      console.error('Get VOD categories error:', error);
      throw new Error('Failed to get movie categories.');
    }
  }

  public async getVodStreams(categoryId?: string): Promise<Movie[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      
      const url = this.getApiUrl('get_vod_streams', params);
      const response = await axios.get(url);
      return response.data as Movie[];
    } catch (error) {
      console.error('Get VOD streams error:', error);
      throw new Error('Failed to get movies.');
    }
  }

  public async getVodInfo(vodId: number): Promise<Movie> {
    try {
      const url = this.getApiUrl('get_vod_info', { vod_id: vodId });
      const response = await axios.get(url);
      return response.data.info as Movie;
    } catch (error) {
      console.error('Get VOD info error:', error);
      throw new Error('Failed to get movie information.');
    }
  }

  // Series Methods
  public async getSeriesCategories(): Promise<Category[]> {
    try {
      const url = this.getApiUrl('get_series_categories');
      const response = await axios.get(url);
      return response.data as Category[];
    } catch (error) {
      console.error('Get series categories error:', error);
      throw new Error('Failed to get series categories.');
    }
  }

  public async getSeries(categoryId?: string): Promise<Series[]> {
    try {
      const params: Record<string, string | number> = {};
      if (categoryId) {
        params.category_id = categoryId;
      }
      
      const url = this.getApiUrl('get_series', params);
      const response = await axios.get(url);
      return response.data as Series[];
    } catch (error) {
      console.error('Get series error:', error);
      throw new Error('Failed to get series.');
    }
  }

  public async getSeriesInfo(seriesId: number): Promise<{ info: Series; episodes: Record<string, Episode[]> }> {
    try {
      const url = this.getApiUrl('get_series_info', { series_id: seriesId });
      const response = await axios.get(url);
      return {
        info: response.data.info as Series,
        episodes: response.data.episodes as Record<string, Episode[]>
      };
    } catch (error) {
      console.error('Get series info error:', error);
      throw new Error('Failed to get series information.');
    }
  }

  // EPG Methods
  public async getShortEPG(streamId: number, limit: number = 2): Promise<EPGProgram[]> {
    try {
      const url = this.getApiUrl('get_short_epg', { stream_id: streamId, limit });
      const response = await axios.get(url);
      return response.data.epg_listings as EPGProgram[];
    } catch (error) {
      console.error('Get short EPG error:', error);
      throw new Error('Failed to get EPG information.');
    }
  }

  public async getEPG(streamId: number): Promise<EPGProgram[]> {
    try {
      const url = this.getApiUrl('get_simple_data_table', { stream_id: streamId });
      const response = await axios.get(url);
      return response.data.epg_listings as EPGProgram[];
    } catch (error) {
      console.error('Get EPG error:', error);
      throw new Error('Failed to get EPG information.');
    }
  }

  // Stream URL Generators
  public getLiveStreamUrl(streamId: number, format: 'ts' | 'm3u8' = 'ts'): string {
    return `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.${format}`;
  }

  public getMovieStreamUrl(vodId: number, format: 'mp4' | 'mkv' = 'mp4'): string {
    return `${this.baseUrl}/movie/${this.username}/${this.password}/${vodId}.${format}`;
  }

  public getEpisodeStreamUrl(episodeId: number, format: 'mp4' | 'mkv' = 'mp4'): string {
    return `${this.baseUrl}/series/${this.username}/${this.password}/${episodeId}.${format}`;
  }
  
  // Alias methods for backward compatibility
  public getVodStreamUrl(vodId: number, format: 'mp4' | 'mkv' = 'mp4'): string {
    return this.getMovieStreamUrl(vodId, format);
  }

  public getSeriesStreamUrl(episodeId: number, format: 'mp4' | 'mkv' = 'mp4'): string {
    return this.getEpisodeStreamUrl(episodeId, format);
  }
  
  // HLS Stream URLs
  public getLiveHlsStreamUrl(streamId: number): string {
    return this.getLiveStreamUrl(streamId, 'm3u8');
  }
  
  // Get stream URL based on content type
  public getStreamUrl(type: 'live' | 'movie' | 'series', id: number, format?: 'ts' | 'm3u8' | 'mp4' | 'mkv'): string {
    switch (type) {
      case 'live':
        return this.getLiveStreamUrl(id, format as 'ts' | 'm3u8');
      case 'movie':
        return this.getMovieStreamUrl(id, format as 'mp4' | 'mkv');
      case 'series':
        return this.getEpisodeStreamUrl(id, format as 'mp4' | 'mkv');
      default:
        throw new Error(`Unknown content type: ${type}`);
    }
  }
  
  // Additional methods for series
  public async getSeriesSeasons(seriesId: number): Promise<Season[]> {
    try {
      const seriesInfo = await this.getSeriesInfo(seriesId);
      const seasonNumbers = Object.keys(seriesInfo.episodes).map(Number);
      
      return seasonNumbers.map(seasonNumber => ({
        id: seasonNumber,
        season_number: seasonNumber,
        name: `Season ${seasonNumber}`,
        series_id: seriesId,
        air_date: '',
        episode_count: seriesInfo.episodes[seasonNumber.toString()].length,
        overview: '',
        poster_path: seriesInfo.info.cover || ''
      }));
    } catch (error) {
      console.error('Get series seasons error:', error);
      throw new Error('Failed to get series seasons.');
    }
  }
  
  public async getSeriesEpisodes(seriesId: number, seasonNumber: number): Promise<Episode[]> {
    try {
      const seriesInfo = await this.getSeriesInfo(seriesId);
      const seasonKey = seasonNumber.toString();
      
      if (!seriesInfo.episodes[seasonKey]) {
        return [];
      }
      
      // Sort episodes by episode number
      return seriesInfo.episodes[seasonKey].sort((a, b) => {
        const aNum = parseInt(a.episode_num.toString());
        const bNum = parseInt(b.episode_num.toString());
        return aNum - bNum;
      });
    } catch (error) {
      console.error('Get series episodes error:', error);
      throw new Error('Failed to get series episodes.');
    }
  }
  
  // Search methods
  public async searchLiveStreams(query: string): Promise<LiveStream[]> {
    try {
      const allStreams = await this.getLiveStreams();
      return allStreams.filter(stream => 
        stream.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Search live streams error:', error);
      throw new Error('Failed to search live streams.');
    }
  }
  
  public async searchVodStreams(query: string): Promise<Movie[]> {
    try {
      const allMovies = await this.getVodStreams();
      return allMovies.filter(movie => 
        movie.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Search VOD streams error:', error);
      throw new Error('Failed to search movies.');
    }
  }
  
  public async searchSeries(query: string): Promise<Series[]> {
    try {
      const allSeries = await this.getSeries();
      return allSeries.filter(series => 
        series.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Search series error:', error);
      throw new Error('Failed to search series.');
    }
  }
  
  public async searchAll(query: string): Promise<{
    liveStreams: LiveStream[];
    movies: Movie[];
    series: Series[];
  }> {
    try {
      const [liveStreams, movies, series] = await Promise.all([
        this.searchLiveStreams(query),
        this.searchVodStreams(query),
        this.searchSeries(query)
      ]);
      
      return { liveStreams, movies, series };
    } catch (error) {
      console.error('Search all error:', error);
      throw new Error('Failed to search content.');
    }
  }

  // XMLTV EPG
  public getXmltvUrl(): string {
    return `${this.baseUrl}/xmltv.php?username=${this.username}&password=${this.password}`;
  }
}

// Create a singleton instance
const xtreamService = new XtreamService();
export default xtreamService;