import { useRef, useState, useEffect } from 'react';
// @ts-expect-error shaka-player has no type declarations
import shaka from 'shaka-player';
import { useUserDataStore } from '../store';

interface PlayerOptions {
  autoPlay?: boolean;
  startPosition?: number;
  title?: string;
  seriesId?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: unknown) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onSeeking?: () => void;
  onSeeked?: () => void;
  onRateChange?: (rate: number) => void;
  saveProgress?: boolean;
  contentType?: 'movie' | 'series' | 'live';
  streamId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

export const usePlayer = (options: PlayerOptions = {}) => {
  const {
    autoPlay = true,
    startPosition = 0,
    title,
    seriesId,
    onTimeUpdate,
    onEnded,
    onError,
    onPlay,
    onPause,
    onLoadStart,
    onLoadedData,
    onSeeking,
    onSeeked,
    onRateChange,
    saveProgress = true,
    contentType,
    streamId,
    seasonNumber,
    episodeNumber
  } = options;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<shaka.Player | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [availableSubtitles, setAvailableSubtitles] = useState<{ id: string; language: string }[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
  const [availableAudioTracks, setAvailableAudioTracks] = useState<{ id: string; language: string }[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<string | null>(null);
  
  const { addToWatchHistory } = useUserDataStore();
  
  // Initialize Shaka Player
  useEffect(() => {
    // Check browser support
    if (!shaka.Player.isBrowserSupported()) {
      setError('Browser not supported for video playback');
      return;
    }
    
    const video = videoRef.current;
    if (!video) return;
    
    // Create player instance
    const player = new shaka.Player(video);
    playerRef.current = player;
    
    // Add event listeners
    player.addEventListener('error', (event) => {
      console.error('Shaka player error:', event);
      setError('Video playback error: ' + event.detail.message);
      if (onError) onError(event.detail);
    });
    
    // Configure player
    player.configure({
      streaming: {
        bufferingGoal: 60,
        rebufferingGoal: 2,
        bufferBehind: 30,
        retryParameters: {
          maxAttempts: 5,
          baseDelay: 1000,
          backoffFactor: 2,
          fuzzFactor: 0.5
        }
      },
      abr: {
        enabled: true,
        defaultBandwidthEstimate: 1000000, // 1Mbps
        switchInterval: 8,
        bandwidthUpgradeTarget: 0.85,
        bandwidthDowngradeTarget: 0.95
      }
    });
    
    // Set initial position if provided
    if (startPosition > 0) {
      video.currentTime = startPosition;
    }
    
    // Set autoplay
    video.autoplay = autoPlay;
    
    // Clean up
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Add video element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration || 0);
      }
      
      // Save progress if needed
      if (saveProgress && contentType && streamId !== undefined && !isNaN(video.duration) && video.duration > 0) {
        // Only save progress every 5 seconds to avoid excessive updates
        if (Math.floor(video.currentTime) % 5 === 0) {
          const historyItem = {
            type: contentType,
            streamId,
            name: title || 'Unknown',
            position: video.currentTime,
            duration: video.duration,
            seasonNumber,
            episodeNumber,
            seriesId,
            completed: false
          };
          
          addToWatchHistory(historyItem);
        }
      }
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      if (onPlay) onPlay();
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      
      // Mark as completed in watch history
      if (saveProgress && contentType && streamId !== undefined) {
        const historyItem = {
          type: contentType,
          streamId,
          name: title || 'Unknown',
          position: video.duration || 0,
          duration: video.duration || 0,
          seasonNumber,
          episodeNumber,
          seriesId,
          completed: true
        };

        addToWatchHistory(historyItem);
      }
      
      if (onEnded) onEnded();
    };
    
    const handleLoadStart = () => {
      setIsLoading(true);
      if (onLoadStart) onLoadStart();
    };
    
    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(video.duration || 0);
      if (onLoadedData) onLoadedData();
    };
    
    const handleSeeking = () => {
      setIsLoading(true);
      if (onSeeking) onSeeking();
    };
    
    const handleSeeked = () => {
      setIsLoading(false);
      if (onSeeked) onSeeked();
    };
    
    const handleRateChange = () => {
      setPlaybackRate(video.playbackRate);
      if (onRateChange) onRateChange(video.playbackRate);
    };
    
    const handleError = () => {
      setError('Video playback error');
      if (onError) onError(video.error);
    };
    
    // Add event listeners
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('error', handleError);
    
    // Clean up
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('error', handleError);
    };
  }, [
    onTimeUpdate,
    onEnded,
    onPlay,
    onPause,
    onLoadStart,
    onLoadedData,
    onSeeking,
    onSeeked,
    onRateChange,
    onError,
    saveProgress,
    contentType,
    streamId,
    seasonNumber,
    episodeNumber,
    seriesId,
    title,
    addToWatchHistory
  ]);
  
  // Load media source
  const loadSource = async (url: string, drmInfo?: {
    licenseUrl: string;
    serverCertificateUrl?: string;
  }) => {
    if (!playerRef.current || !videoRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Configure DRM if provided
      if (drmInfo) {
        playerRef.current.configure({
          drm: {
            servers: {
              'com.widevine.alpha': drmInfo.licenseUrl
            }
          }
        });
        
        // Load server certificate if provided
        if (drmInfo.serverCertificateUrl) {
          try {
            const response = await fetch(drmInfo.serverCertificateUrl);
            const certificate = await response.arrayBuffer();
            await playerRef.current.configure({
              drm: {
                advanced: {
                  'com.widevine.alpha': {
                    serverCertificate: new Uint8Array(certificate)
                  }
                }
              }
            });
          } catch (error) {
            console.error('Failed to load server certificate:', error);
          }
        }
      }
      
      // Load the source
      await playerRef.current.load(url);
      
      // Get available tracks
      updateAvailableTracks();
      
      // Start playback if autoPlay is true
      if (autoPlay) {
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error loading video source:', error);
      setError('Failed to load video: ' + (error instanceof Error ? error.message : String(error)));
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update available tracks (quality, subtitles, audio)
  const updateAvailableTracks = () => {
    if (!playerRef.current) return;
    
    try {
      // Get video tracks (qualities)
      const tracks = playerRef.current.getVariantTracks();
      const qualities = tracks
        .filter(track => track.videoBandwidth)
        .map(track => ({
          id: track.id.toString(),
          bandwidth: track.videoBandwidth || 0,
          height: track.height || 0,
          label: track.height ? `${track.height}p` : 'Unknown'
        }))
        .sort((a, b) => b.height - a.height);
      
      // Remove duplicates by height
      const uniqueQualities = qualities
        .filter((quality, index, self) => 
          index === self.findIndex(q => q.height === quality.height)
        )
        .map(quality => quality.label);
      
      setAvailableQualities(['auto', ...uniqueQualities]);
      
      // Get text tracks (subtitles)
      const textTracks = playerRef.current.getTextTracks();
      setAvailableSubtitles(
        textTracks.map(track => ({
          id: track.id.toString(),
          language: track.language || 'unknown'
        }))
      );
      
      // Get audio tracks
      const audioTracks = playerRef.current.getAudioLanguagesAndRoles();
      setAvailableAudioTracks(
        audioTracks.map(track => ({
          id: track.language,
          language: track.language || 'unknown'
        }))
      );
    } catch (error) {
      console.error('Error updating available tracks:', error);
    }
  };
  
  // Player controls
  const play = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };
  
  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };
  
  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };
  
  const seekRelative = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };
  
  const setPlaybackSpeed = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };
  
  const setQuality = (quality: string) => {
    if (!playerRef.current) return;
    
    try {
      const tracks = playerRef.current.getVariantTracks();
      
      if (quality === 'auto') {
        // Enable ABR for automatic quality selection
        playerRef.current.configure({ abr: { enabled: true } });
        setCurrentQuality('auto');
        return;
      }
      
      // Disable ABR for manual quality selection
      playerRef.current.configure({ abr: { enabled: false } });
      
      // Find the track with the selected quality
      const selectedTrack = tracks.find(track => 
        track.height ? `${track.height}p` === quality : false
      );
      
      if (selectedTrack) {
        playerRef.current.selectVariantTrack(selectedTrack, /* clearBuffer */ false);
        setCurrentQuality(quality);
      }
    } catch (error) {
      console.error('Error setting quality:', error);
    }
  };
  
  const setSubtitle = (subtitleId: string | null) => {
    if (!playerRef.current) return;
    
    try {
      if (subtitleId === null) {
        // Disable subtitles
        playerRef.current.setTextTrackVisibility(false);
        setCurrentSubtitle(null);
        return;
      }
      
      const tracks = playerRef.current.getTextTracks();
      const selectedTrack = tracks.find(track => track.id.toString() === subtitleId);
      
      if (selectedTrack) {
        playerRef.current.selectTextTrack(selectedTrack);
        playerRef.current.setTextTrackVisibility(true);
        setCurrentSubtitle(subtitleId);
      }
    } catch (error) {
      console.error('Error setting subtitle:', error);
    }
  };
  
  const setAudioTrack = (audioId: string | null) => {
    if (!playerRef.current) return;
    
    try {
      if (audioId === null) return;
      
      const tracks = playerRef.current.getVariantTracks();
      const selectedTracks = tracks.filter(track => track.language === audioId);
      
      if (selectedTracks.length > 0) {
        // Select the first track with the selected language
        playerRef.current.selectVariantTrack(selectedTracks[0], /* clearBuffer */ false);
        setCurrentAudioTrack(audioId);
      }
    } catch (error) {
      console.error('Error setting audio track:', error);
    }
  };
  
  return {
    videoRef,
    playerRef,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    playbackRate,
    error,
    availableQualities,
    currentQuality,
    availableSubtitles,
    currentSubtitle,
    availableAudioTracks,
    currentAudioTrack,
    loadSource,
    play,
    pause,
    togglePlay,
    seek,
    seekRelative,
    setPlaybackSpeed,
    setQuality,
    setSubtitle,
    setAudioTrack
  };
};