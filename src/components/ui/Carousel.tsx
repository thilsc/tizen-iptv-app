import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useKeyboardNavigation } from '../../hooks';

interface CarouselProps {
  children: React.ReactNode[];
  title?: string;
  seeAllLink?: string;
  onSeeAllClick?: () => void;
  itemWidth?: string;
  itemHeight?: string;
  itemAspectRatio?: string;
  gap?: string;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  className?: string;
}

const Carousel: React.FC<CarouselProps> = ({
  children,
  title,
  seeAllLink,
  onSeeAllClick,
  itemWidth = '200px',
  itemHeight = 'auto',
  itemAspectRatio = '16/9',
  gap = '16px',
  autoScroll = false,
  autoScrollInterval = 5000,
  className,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  
  // Handle keyboard navigation (only when focused)
  useKeyboardNavigation(
    isFocused
      ? {
          onLeft: () => {
            if (currentIndex > 0) {
              scrollToIndex(currentIndex - 1);
            }
          },
          onRight: () => {
            if (currentIndex < children.length - 1) {
              scrollToIndex(currentIndex + 1);
            }
          },
        }
      : {}
  );
  
  // Auto scroll effect
  useEffect(() => {
    if (!autoScroll || isFocused) return;
    
    const interval = setInterval(() => {
      if (currentIndex < children.length - 1) {
        scrollToIndex(currentIndex + 1);
      } else {
        scrollToIndex(0);
      }
    }, autoScrollInterval);
    
    return () => clearInterval(interval);
  }, [autoScroll, autoScrollInterval, currentIndex, children.length, isFocused]);
  
  // Scroll to a specific index
  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const items = container.querySelectorAll('.carousel-item');
    
    if (index >= 0 && index < items.length) {
      const item = items[index] as HTMLElement;
      const containerWidth = container.clientWidth;
      const itemLeft = item.offsetLeft;
      const itemWidth = item.clientWidth;
      
      // Calculate the scroll position to center the item
      const scrollPosition = itemLeft - (containerWidth / 2) + (itemWidth / 2);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      });
      
      setCurrentIndex(index);
    }
  };
  
  // Handle scroll event to update current index
  const handleScroll = () => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const items = container.querySelectorAll('.carousel-item');
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    
    // Find the item that is most visible in the viewport
    let bestVisibleIndex = 0;
    let bestVisibleArea = 0;
    
    items.forEach((item, index) => {
      const itemElement = item as HTMLElement;
      const itemLeft = itemElement.offsetLeft;
      const itemWidth = itemElement.clientWidth;
      const itemRight = itemLeft + itemWidth;
      
      const visibleLeft = Math.max(itemLeft, scrollLeft);
      const visibleRight = Math.min(itemRight, scrollLeft + containerWidth);
      
      if (visibleRight > visibleLeft) {
        const visibleArea = visibleRight - visibleLeft;
        if (visibleArea > bestVisibleArea) {
          bestVisibleArea = visibleArea;
          bestVisibleIndex = index;
        }
      }
    });
    
    setCurrentIndex(bestVisibleIndex);
  };
  
  return (
    <CarouselContainer className={className}>
      {title && (
        <CarouselHeader>
          <CarouselTitle>{title}</CarouselTitle>
          {seeAllLink && (
            <SeeAllButton onClick={onSeeAllClick}>
              See All
            </SeeAllButton>
          )}
        </CarouselHeader>
      )}
      
      <CarouselWrapper
        ref={carouselRef}
        isFocused={isFocused}
        onScroll={handleScroll}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {children.map((child, index) => (
          <CarouselItem
            key={index}
            className="carousel-item"
            width={itemWidth}
            height={itemHeight}
            aspectRatio={itemAspectRatio}
            gap={gap}
            onClick={() => scrollToIndex(index)}
          >
            {child}
          </CarouselItem>
        ))}
      </CarouselWrapper>
      
      <Indicators>
        {children.map((_, index) => (
          <Indicator
            key={index}
            active={index === currentIndex}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </Indicators>
    </CarouselContainer>
  );
};

const CarouselContainer = styled.div`
  width: 100%;
  margin-bottom: 32px;
`;

const CarouselHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CarouselTitle = styled.h2`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
`;

const SeeAllButton = styled.button`
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  
  &:hover, &:focus {
    background-color: rgba(var(--color-primary-rgb), 0.1);
    outline: none;
  }
`;

const CarouselWrapper = styled.div<{ isFocused: boolean }>`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  outline: ${({ isFocused }) => (isFocused ? '2px solid var(--color-primary)' : 'none')};
  outline-offset: 4px;
  border-radius: 8px;
  transition: outline 0.2s ease;

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

interface CarouselItemProps {
  width: string;
  height: string;
  aspectRatio: string;
  gap: string;
}

const CarouselItem = styled.div<CarouselItemProps>`
  flex: 0 0 auto;
  width: ${props => props.width};
  height: ${props => props.height};
  aspect-ratio: ${props => props.aspectRatio};
  margin-right: ${props => props.gap};
  scroll-snap-align: start;
  
  &:last-child {
    margin-right: 0;
  }
`;

const Indicators = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 16px;
`;

interface IndicatorProps {
  active: boolean;
}

const Indicator = styled.button<IndicatorProps>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? 'var(--color-primary)' : 'var(--color-text-disabled)'};
  margin: 0 4px;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover, &:focus {
    background-color: var(--color-primary);
    outline: none;
  }
`;

export default Carousel;