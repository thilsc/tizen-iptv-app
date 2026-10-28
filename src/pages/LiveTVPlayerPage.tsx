import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { VideoPlayer } from '../components/content';
import { Loading } from '../components/ui';
import { useContentStore } from '../store';
import { Channel } from '../types';

const LiveTVPlayerPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { liveChannels, fetchLiveStreams, fetchChannelStream, channelStream, isLoading } = useContentStore();
  
  const [channel, setChannel] = useState<Channel | null>(null);
  
  // Find the channel from the store
  useEffect(() => {
    if (liveChannels.length === 0) {
      fetchLiveStreams();
      return;
    }
    if (id) {
      const foundChannel = liveChannels.find(c => c.stream_id.toString() === id);
      if (foundChannel) {
        setChannel(foundChannel);
        fetchChannelStream(foundChannel.stream_id);
      }
    }
  }, [id, liveChannels]);
  
  // Handle back button
  const handleBack = () => {
    navigate(-1);
  };
  
  if (isLoading) {
    return (
      <LoadingContainer>
        <Loading size="large" text={t('common.loading')} />
      </LoadingContainer>
    );
  }

  if (!channel) {
    return (
      <ErrorContainer>
        <ErrorMessage>{t('liveTV.noChannels')}</ErrorMessage>
      </ErrorContainer>
    );
  }
  
  if (!channelStream) {
    return (
      <ErrorContainer>
        <ErrorMessage>{t('liveTV.streamError')}</ErrorMessage>
      </ErrorContainer>
    );
  }
  
  // Get current program info from EPG if available
  const currentProgram = channel.epg_now 
    ? `${channel.epg_now.title} (${channel.epg_now.start} - ${channel.epg_now.end})`
    : '';
  
  return (
    <PlayerContainer>
      <VideoPlayer
        url={channelStream as string}
        title={channel.name}
        subtitle={currentProgram}
        poster={channel.stream_icon}
        onBack={handleBack}
        contentType="live"
        streamId={channel.stream_id}
      />
    </PlayerContainer>
  );
};

const PlayerContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: black;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--color-background);
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--color-background);
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: 18px;
  text-align: center;
  max-width: 600px;
  padding: 24px;
`;

export default LiveTVPlayerPage;