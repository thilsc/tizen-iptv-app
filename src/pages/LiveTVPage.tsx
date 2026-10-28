import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { ChannelCard } from '../components/content';
import { Loading, Tabs } from '../components/ui';
import { useContentStore, useSettingsStore } from '../store';
import { Channel, LiveCategory } from '../types';

const LiveTVPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    fetchLiveCategories,
    fetchLiveStreams,
    liveCategories,
    liveChannels,
    isLoading
  } = useContentStore();
  const { isContentBlocked } = useSettingsStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  
  useEffect(() => {
    fetchLiveCategories();
    fetchLiveStreams();
  }, []);
  
  useEffect(() => {
    if (liveCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(liveCategories[0].category_id);
    }
  }, [liveCategories, selectedCategory]);
  
  useEffect(() => {
    if (selectedCategory) {
      if (selectedCategory === 'all') {
        setFilteredChannels(liveChannels);
      } else {
        setFilteredChannels(
          liveChannels.filter(channel => channel.category_id === selectedCategory)
        );
      }
    }
  }, [selectedCategory, liveChannels]);
  
  const handleChannelClick = (channel: Channel) => {
    navigate(`/live/${channel.stream_id}`);
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  const visibleChannels = filteredChannels.filter(
    channel => !isContentBlocked(channel.stream_id, Number(channel.category_id))
  );

  if (isLoading) {
    return (
      <Layout>
        <LoadingContainer>
          <Loading size="large" text={t('common.loading')} />
        </LoadingContainer>
      </Layout>
    );
  }
  
  // Prepare tabs from categories
  const tabs = [
    { id: 'all', label: t('liveTV.allChannels') },
    ...liveCategories.map((category: LiveCategory) => ({
      id: category.category_id,
      label: category.category_name
    }))
  ];
  
  return (
    <Layout>
      <PageContainer>
        <PageHeader>
          <PageTitle>{t('liveTV.title')}</PageTitle>
        </PageHeader>
        
        <Tabs
          tabs={tabs}
          activeTab={selectedCategory || 'all'}
          onChange={handleCategoryChange}
        />
        
        <ChannelsContainer>
          {visibleChannels.length > 0 ? (
            visibleChannels.map((channel, index) => (
              <ChannelCard
                key={channel.stream_id}
                channel={channel}
                onClick={handleChannelClick}
                autoFocus={index === 0}
              />
            ))
          ) : (
            <NoChannels>{t('liveTV.noChannels')}</NoChannels>
          )}
        </ChannelsContainer>
      </PageContainer>
    </Layout>
  );
};

const PageContainer = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const ChannelsContainer = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NoChannels = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 16px;
`;

export default LiveTVPage;