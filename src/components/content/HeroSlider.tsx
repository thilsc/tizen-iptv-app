import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { Movie, Series, Channel } from '../../types';

interface HeroSliderProps {
  items: (Movie | Series | Channel)[];
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

const HeroSlider: React.FC<HeroSliderProps> = ({
  items,
  className,
  autoPlay = true,
  interval = 5000,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Auto play effect
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    
    const timer = setInterval(() => {
      goToNext();
    }, interval);
    
    return () => clearInterval(timer);
  }, [autoPlay, interval, currentIndex, items.length]);
  
  const goToNext = () => {
    setIsTransitioning(true);
    setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  const goToPrev = () => {
    setIsTransitioning(true);
    setCurrentIndex(prevIndex => (prevIndex - 1 + items.length) % items.length);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  const goToIndex = (index: number) => {
    if (index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  const handlePlay = () => {
    const item = items[currentIndex];
    
    if ('stream_id' in item) {
      // It's a movie
      navigate(`/movie/${item.stream_id}`);
    } else if ('series_id' in item) {
      // It's a series
      navigate(`/series/${item.series_id}`);
    } else if ('stream_type' in item) {
      // It's a channel
      navigate(`/live/${(item as { stream_id: number }).stream_id}`);
    }
  };
  
  const handleInfo = () => {
    const item = items[currentIndex];

    if ('stream_id' in item) {
      // It's a movie or channel
      if ('stream_type' in item) {
        navigate(`/live/${(item as { stream_id: number }).stream_id}`);
      } else {
        navigate(`/movie/${item.stream_id}`);
      }
    } else if ('series_id' in item) {
      // It's a series
      navigate(`/series/${item.series_id}`);
    }
  };
  
  if (items.length === 0) return null;
  
  const currentItem = items[currentIndex];
  const itemType = 'stream_id' in currentItem ? 'movie' : 'series_id' in currentItem ? 'series' : 'channel';
  
  return (
    <HeroContainer className={className}>
      <HeroBackground
        style={{
          backgroundImage: `url(${
            'cover' in currentItem 
              ? currentItem.cover 
              : 'stream_icon' in currentItem 
                ? currentItem.stream_icon 
                : ''
          })`,
        }}
        isTransitioning={isTransitioning}
      />
      
      <HeroContent>
        <HeroTitle>
          {'name' in currentItem ? currentItem.name : ''}
        </HeroTitle>
        
        <HeroInfo>
          {'year' in currentItem && currentItem.year && (
            <HeroInfoItem>{currentItem.year}</HeroInfoItem>
          )}
          
          {'genre' in currentItem && currentItem.genre && (
            <HeroInfoItem>{currentItem.genre}</HeroInfoItem>
          )}
          
          {'rating' in currentItem && currentItem.rating && (
            <HeroInfoItem>⭐ {currentItem.rating}</HeroInfoItem>
          )}
        </HeroInfo>
        
        {'plot' in currentItem && currentItem.plot && (
          <HeroDescription>
            {currentItem.plot}
          </HeroDescription>
        )}
        
        <HeroActions>
          <Button 
            variant="primary" 
            size="large" 
            onClick={handlePlay}
            autoFocus
          >
            {itemType === 'channel' ? t('actions.watch') : t('actions.play')}
          </Button>
          
          <Button 
            variant="outline" 
            size="large" 
            onClick={handleInfo}
          >
            {t('actions.moreInfo')}
          </Button>
        </HeroActions>
      </HeroContent>
      
      <HeroControls>
        <ControlButton onClick={goToPrev}>
          ◀
        </ControlButton>
        
        <Indicators>
          {items.map((_, index) => (
            <Indicator
              key={index}
              active={index === currentIndex}
              onClick={() => goToIndex(index)}
            />
          ))}
        </Indicators>
        
        <ControlButton onClick={goToNext}>
          ▶
        </ControlButton>
      </HeroControls>
    </HeroContainer>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const HeroContainer = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 32px;
`;

interface HeroBackgroundProps {
  isTransitioning: boolean;
}

const HeroBackground = styled.div<HeroBackgroundProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: opacity 0.5s ease;
  opacity: ${props => props.isTransitioning ? 0.5 : 1};
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.2) 0%,
      rgba(0, 0, 0, 0.8) 100%
    );
  }
`;

const HeroContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 32px;
  z-index: 1;
  animation: ${fadeIn} 0.5s ease;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: 48px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 16px;
`;

const HeroInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const HeroInfoItem = styled.div`
  font-size: 16px;
  color: white;
  margin-right: 16px;
  
  &:last-child {
    margin-right: 0;
  }
`;

const HeroDescription = styled.p`
  margin: 0 0 24px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  max-width: 600px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeroActions = styled.div`
  display: flex;
  gap: 16px;
`;

const HeroControls = styled.div`
  position: absolute;
  bottom: 32px;
  right: 32px;
  display: flex;
  align-items: center;
  z-index: 1;
`;

const ControlButton = styled.button`
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    background: rgba(255, 255, 255, 0.2);
    outline: none;
  }
`;

const Indicators = styled.div`
  display: flex;
  align-items: center;
  margin: 0 16px;
`;

interface IndicatorProps {
  active: boolean;
}

const Indicator = styled.button<IndicatorProps>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.5)'};
  margin: 0 4px;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    background-color: white;
    outline: none;
  }
`;

export default HeroSlider;