import React from 'react';
import styled from 'styled-components';
import { Card } from '../ui';
import { Channel } from '../../types';
import { formatTime } from '../../utils';

interface ChannelCardProps {
  channel: Channel;
  onClick: (channel: Channel) => void;
  className?: string;
  autoFocus?: boolean;
}

const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onClick,
  className,
  autoFocus = false,
}) => {
  const { name, stream_icon, epg_now, epg_next } = channel;
  
  const handleClick = () => {
    onClick(channel);
  };
  
  return (
    <StyledCard
      onClick={handleClick}
      className={className}
      autoFocus={autoFocus}
      poster={stream_icon || undefined}
      title={name}
    >
      <ChannelInfo>
        {epg_now && (
          <EpgInfo>
            <EpgTitle>
              {epg_now.title}
              <EpgTime>{epg_now.start_timestamp ? formatTime(epg_now.start_timestamp) : ''} - {epg_now.stop_timestamp ? formatTime(epg_now.stop_timestamp) : ''}</EpgTime>
            </EpgTitle>
            {epg_next && (
              <EpgNext>
                {epg_next.title}
                <EpgTime>{epg_next.start_timestamp ? formatTime(epg_next.start_timestamp) : ''} - {epg_next.stop_timestamp ? formatTime(epg_next.stop_timestamp) : ''}</EpgTime>
              </EpgNext>
            )}
          </EpgInfo>
        )}
      </ChannelInfo>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  height: 100px;
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--color-background-card);
  border-radius: 8px;
  margin-bottom: 8px;
  
  img {
    width: 64px;
    height: 64px;
    object-fit: contain;
    margin-right: 16px;
  }
`;

const ChannelInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EpgInfo = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
`;

const EpgTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  justify-content: space-between;
`;

const EpgNext = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
`;

const EpgTime = styled.span`
  margin-left: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
`;

export default ChannelCard;