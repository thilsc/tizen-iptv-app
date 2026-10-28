import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { usePlayer, useKeyboardNavigation } from '../../hooks';
import { Button, Loading } from '../ui';

interface VideoPlayerProps {
  url: string;
  title?: string;
  subtitle?: string;
  poster?: string;
  autoPlay?: boolean;
  startPosition?: number;
  onBack?: () => void;
  onEnded?: () => void;
  contentType?: 'movie' | 'series' | 'live';
  streamId?: number;
  seriesId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  drmInfo?: {
    licenseUrl: string;
    serverCertificateUrl?: string;
  };
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title,
  subtitle,
  poster,
  autoPlay = true,
  startPosition = 0,
  onBack,
  onEnded,
  contentType,
  streamId,
  seriesId,
  seasonNumber,
  episodeNumber,
  drmInfo,
}) => {
  const { t } = useTranslation();
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<number | null>(null);
  
  const {
    videoRef,
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
    togglePlay,
    seek,
    seekRelative,
    setPlaybackSpeed,
    setQuality,
    setSubtitle,
    setAudioTrack
  } = usePlayer({
    autoPlay,
    startPosition,
    title,
    onEnded,
    saveProgress: contentType !== 'live',
    contentType,
    streamId,
    seriesId,
    seasonNumber,
    episodeNumber
  });
  
  // Load the video source
  useEffect(() => {
    loadSource(url, drmInfo);
  }, [url, drmInfo]);
  
  // Handle keyboard navigation
  useKeyboardNavigation({
    onPlayPause: togglePlay,
    onLeft: () => seekRelative(-10),
    onRight: () => seekRelative(10),
    onBack: onBack,
    onExit: onBack,
    onInfo: () => setShowControls(true),
  });
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    if (showControls) {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 5000);
      
      setControlsTimeout(timeout as unknown as number);
    }
    
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [showControls, isPlaying]);
  
  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    setShowControls(true);
  };
  
  // Format time (seconds) to MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    seek(newTime);
  };
  
  return (
    <PlayerContainer onMouseMove={handleMouseMove}>
      <VideoContainer>
        <Video
          ref={videoRef}
          poster={poster}
          onClick={togglePlay}
        />
        
        {isLoading && (
          <LoadingOverlay>
            <Loading size="large" color="white" text={t('player.loading')} />
          </LoadingOverlay>
        )}
        
        {error && (
          <ErrorOverlay>
            <ErrorMessage>{error}</ErrorMessage>
            <Button variant="primary" onClick={() => loadSource(url, drmInfo)}>
              {t('player.retry')}
            </Button>
          </ErrorOverlay>
        )}
        
        {showControls && (
          <Controls>
            <TopControls>
              <TitleContainer>
                {title && <Title>{title}</Title>}
                {subtitle && <Subtitle>{subtitle}</Subtitle>}
              </TitleContainer>
              
              <TopRightControls>
                <Button variant="text" onClick={onBack}>
                  {t('actions.back')}
                </Button>
              </TopRightControls>
            </TopControls>
            
            <BottomControls>
              <ProgressBarContainer onClick={handleProgressClick}>
                <ProgressBar>
                  <Progress style={{ width: `${progressPercentage}%` }} />
                </ProgressBar>
                <TimeDisplay>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </TimeDisplay>
              </ProgressBarContainer>
              
              <ControlButtons>
                <ControlButton onClick={() => seekRelative(-10)}>
                  -10s
                </ControlButton>
                
                <ControlButton onClick={togglePlay}>
                  {isPlaying ? '⏸️' : '▶️'}
                </ControlButton>
                
                <ControlButton onClick={() => seekRelative(10)}>
                  +10s
                </ControlButton>
                
                {availableQualities.length > 1 && (
                  <QualitySelector>
                    <QualityButton>
                      {currentQuality}
                    </QualityButton>
                    
                    <QualityOptions>
                      {availableQualities.map(quality => (
                        <QualityOption
                          key={quality}
                          active={quality === currentQuality}
                          onClick={() => setQuality(quality)}
                        >
                          {quality}
                        </QualityOption>
                      ))}
                    </QualityOptions>
                  </QualitySelector>
                )}
                
                {availableSubtitles.length > 0 && (
                  <SubtitleSelector>
                    <SubtitleButton>
                      {t('player.subtitles')}
                    </SubtitleButton>
                    
                    <SubtitleOptions>
                      <SubtitleOption
                        active={currentSubtitle === null}
                        onClick={() => setSubtitle(null)}
                      >
                        {t('player.subtitlesOff')}
                      </SubtitleOption>
                      
                      {availableSubtitles.map(subtitle => (
                        <SubtitleOption
                          key={subtitle.id}
                          active={subtitle.id === currentSubtitle}
                          onClick={() => setSubtitle(subtitle.id)}
                        >
                          {subtitle.language}
                        </SubtitleOption>
                      ))}
                    </SubtitleOptions>
                  </SubtitleSelector>
                )}
                
                {availableAudioTracks.length > 1 && (
                  <AudioSelector>
                    <AudioButton>
                      {t('player.audio')}
                    </AudioButton>
                    
                    <AudioOptions>
                      {availableAudioTracks.map(audio => (
                        <AudioOption
                          key={audio.id}
                          active={audio.id === currentAudioTrack}
                          onClick={() => setAudioTrack(audio.id)}
                        >
                          {audio.language}
                        </AudioOption>
                      ))}
                    </AudioOptions>
                  </AudioSelector>
                )}
                
                <PlaybackRateSelector>
                  <PlaybackRateButton>
                    {playbackRate}x
                  </PlaybackRateButton>
                  
                  <PlaybackRateOptions>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <PlaybackRateOption
                        key={rate}
                        active={rate === playbackRate}
                        onClick={() => setPlaybackSpeed(rate)}
                      >
                        {rate}x
                      </PlaybackRateOption>
                    ))}
                  </PlaybackRateOptions>
                </PlaybackRateSelector>
              </ControlButtons>
            </BottomControls>
          </Controls>
        )}
      </VideoContainer>
    </PlayerContainer>
  );
};

const PlayerContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: black;
  position: relative;
`;

const VideoContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10;
`;

const ErrorOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 10;
  padding: 32px;
`;

const ErrorMessage = styled.p`
  color: white;
  font-size: 18px;
  margin-bottom: 16px;
  text-align: center;
`;

const Controls = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0) 20%,
    rgba(0, 0, 0, 0) 80%,
    rgba(0, 0, 0, 0.7) 100%
  );
  z-index: 5;
  padding: 24px;
`;

const TopControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  color: white;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 4px 0 0;
  font-size: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const TopRightControls = styled.div`
  display: flex;
  align-items: center;
`;

const BottomControls = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProgressBarContainer = styled.div`
  margin-bottom: 16px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  
  &:hover {
    height: 8px;
  }
`;

const Progress = styled.div`
  height: 100%;
  background-color: var(--color-primary);
  border-radius: 3px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(50%, -50%);
    width: 12px;
    height: 12px;
    background-color: var(--color-primary);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  ${ProgressBar}:hover &::after {
    opacity: 1;
  }
`;

const TimeDisplay = styled.div`
  color: white;
  font-size: 14px;
  margin-top: 8px;
`;

const ControlButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  
  &:hover, &:focus {
    background-color: rgba(255, 255, 255, 0.1);
    outline: none;
  }
`;

const QualitySelector = styled.div`
  position: relative;
  margin-left: auto;
`;

const QualityButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  
  &:hover, &:focus {
    background-color: rgba(255, 255, 255, 0.1);
    outline: none;
  }
`;

const QualityOptions = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  display: none;
  
  ${QualitySelector}:hover & {
    display: block;
  }
`;

interface OptionProps {
  active: boolean;
}

const QualityOption = styled.button<OptionProps>`
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  display: block;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  
  ${props => props.active && `
    background-color: var(--color-primary);
  `}
  
  &:hover, &:focus {
    background-color: ${props => props.active ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'};
    outline: none;
  }
`;

const SubtitleSelector = styled.div`
  position: relative;
`;

const SubtitleButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  
  &:hover, &:focus {
    background-color: rgba(255, 255, 255, 0.1);
    outline: none;
  }
`;

const SubtitleOptions = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  display: none;
  
  ${SubtitleSelector}:hover & {
    display: block;
  }
`;

const SubtitleOption = styled.button<OptionProps>`
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  display: block;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  
  ${props => props.active && `
    background-color: var(--color-primary);
  `}
  
  &:hover, &:focus {
    background-color: ${props => props.active ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'};
    outline: none;
  }
`;

const AudioSelector = styled.div`
  position: relative;
`;

const AudioButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  
  &:hover, &:focus {
    background-color: rgba(255, 255, 255, 0.1);
    outline: none;
  }
`;

const AudioOptions = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  display: none;
  
  ${AudioSelector}:hover & {
    display: block;
  }
`;

const AudioOption = styled.button<OptionProps>`
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  display: block;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  
  ${props => props.active && `
    background-color: var(--color-primary);
  `}
  
  &:hover, &:focus {
    background-color: ${props => props.active ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'};
    outline: none;
  }
`;

const PlaybackRateSelector = styled.div`
  position: relative;
`;

const PlaybackRateButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  
  &:hover, &:focus {
    background-color: rgba(255, 255, 255, 0.1);
    outline: none;
  }
`;

const PlaybackRateOptions = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  display: none;
  
  ${PlaybackRateSelector}:hover & {
    display: block;
  }
`;

const PlaybackRateOption = styled.button<OptionProps>`
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  display: block;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  
  ${props => props.active && `
    background-color: var(--color-primary);
  `}
  
  &:hover, &:focus {
    background-color: ${props => props.active ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'};
    outline: none;
  }
`;

export default VideoPlayer;