import React from 'react';
import styled, { css } from 'styled-components';
import { useFocusable } from '../../hooks';

interface CardProps {
  children?: React.ReactNode; // Making children optional
  onClick?: () => void;
  width?: string;
  height?: string;
  aspectRatio?: string;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  poster?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  progress?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  onClick,
  width,
  height,
  aspectRatio,
  className,
  onFocus,
  onBlur,
  autoFocus = false,
  poster,
  title,
  subtitle,
  badge,
  progress,
}) => {
  const { ref, isFocused } = useFocusable({
    onEnter: onClick,
    focusOnMount: autoFocus,
  });

  return (
    <StyledCard
      ref={ref as React.RefObject<HTMLDivElement>}
      onClick={onClick}
      width={width}
      height={height}
      aspectRatio={aspectRatio}
      isFocused={isFocused}
      className={className}
      onFocus={onFocus}
      onBlur={onBlur}
      tabIndex={0}
    >
      {poster && (
        <PosterWrapper>
          <Poster src={poster} alt={title || 'Poster'} loading="lazy" />
          {badge && <Badge>{badge}</Badge>}
          {progress !== undefined && progress > 0 && (
            <ProgressBar>
              <Progress width={`${Math.min(progress, 100)}%`} />
            </ProgressBar>
          )}
        </PosterWrapper>
      )}
      
      {(title || subtitle) && (
        <CardContent>
          {title && <Title>{title}</Title>}
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </CardContent>
      )}
      
      {!poster && !title && !subtitle && children}
    </StyledCard>
  );
};

interface StyledCardProps {
  width?: string;
  height?: string;
  aspectRatio?: string;
  isFocused: boolean;
}

const StyledCard = styled.div<StyledCardProps>`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-background-card);
  transition: all 0.2s ease;
  cursor: pointer;
  width: ${props => props.width || '100%'};
  height: ${props => props.height || 'auto'};
  aspect-ratio: ${props => props.aspectRatio || 'auto'};
  
  ${props => props.isFocused && css`
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    border: 2px solid var(--color-primary);
  `}
  
  &:focus {
    outline: none;
  }
`;

const PosterWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Poster = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Badge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.5);
`;

interface ProgressProps {
  width: string;
}

const Progress = styled.div<ProgressProps>`
  height: 100%;
  background-color: var(--color-primary);
  width: ${props => props.width};
`;

const CardContent = styled.div`
  padding: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default Card;