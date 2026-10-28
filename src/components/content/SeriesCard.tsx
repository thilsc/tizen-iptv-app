import React from 'react';
import styled from 'styled-components';
import { Card } from '../ui';
import { Series } from '../../types';
import { useUserDataStore } from '../../store';

interface SeriesCardProps {
  series: Series;
  onClick: (series: Series) => void;
  className?: string;
  autoFocus?: boolean;
  width?: string;
  height?: string;
  aspectRatio?: string;
}

const SeriesCard: React.FC<SeriesCardProps> = ({
  series,
  onClick,
  className,
  autoFocus = false,
  width,
  height,
  aspectRatio = '2/3',
}) => {
  const { watchHistory } = useUserDataStore();
  
  const handleClick = () => {
    onClick(series);
  };
  
  // Find any watch history for this series
  const hasWatchHistory = watchHistory.some(
    item => item.type === 'series' && (item.seriesId === series.series_id || item.streamId === series.series_id)
  );
  
  return (
    <StyledCard
      onClick={handleClick}
      className={className}
      autoFocus={autoFocus}
      poster={series.cover || undefined}
      title={series.name}
      subtitle={series.year ? `${series.year}` : undefined}
      width={width}
      height={height}
      aspectRatio={aspectRatio}
      badge={hasWatchHistory ? 'Watching' : undefined}
    />
  );
};

const StyledCard = styled(Card)`
  margin-bottom: 8px;
`;

export default SeriesCard;