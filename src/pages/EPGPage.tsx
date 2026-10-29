import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';
import { Layout } from '../components/layout';
import { Loading, Tabs, Button } from '../components/ui';
import { useFocusable } from '../hooks';
import { useContentStore, useSettingsStore } from '../store';
import { Channel, EPGProgram, LiveCategory } from '../types';
import { formatDate, formatTime, isEpgNowPlaying } from '../utils';

// Number of channels rendered (and fetched) per page
const CHANNELS_PER_PAGE = 20;

interface ProgramRowProps {
  channel: Channel;
  programs: EPGProgram[];
  isLoading: boolean;
  onSelect: (channel: Channel) => void;
}

const ProgramRow: React.FC<ProgramRowProps> = ({ channel, programs, isLoading, onSelect }) => {
  const { t, i18n } = useTranslation();
  const { ref, isFocused } = useFocusable({ onEnter: () => onSelect(channel) });
  const locale = i18n.language.startsWith('tr') ? 'tr-TR' : 'en-US';

  return (
    <ChannelRow
      ref={ref as React.RefObject<HTMLDivElement>}
      focused={isFocused}
      onClick={() => onSelect(channel)}
    >
      <ChannelInfo>
        {channel.stream_icon && (
          <ChannelLogo src={channel.stream_icon} alt={channel.name} loading="lazy" />
        )}
        <ChannelName>{channel.name}</ChannelName>
      </ChannelInfo>
      <ProgramsTrack>
        {programs.length > 0 ? (
          programs.map(program => {
            const isNow = isEpgNowPlaying(program);
            return (
              <ProgramCard key={program.id} isNow={isNow}>
                {isNow && <NowBadge>{t('epg.nowPlaying')}</NowBadge>}
                <ProgramTime>
                  {formatTime(program.start_timestamp, locale)} - {formatTime(program.stop_timestamp, locale)}
                </ProgramTime>
                <ProgramTitle>{program.title}</ProgramTitle>
                {program.description && (
                  <ProgramDescription>{program.description}</ProgramDescription>
                )}
              </ProgramCard>
            );
          })
        ) : (
          <ProgramPlaceholder>
            {isLoading ? t('common.loading') : t('epg.noPrograms')}
          </ProgramPlaceholder>
        )}
      </ProgramsTrack>
    </ChannelRow>
  );
};

const EPGPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    fetchLiveStreams,
    fetchEPGForChannels,
    currentEPG,
    isLoadingEPG,
    epgError,
    liveChannels,
    liveCategories,
    isLoadingLive,
    liveError
  } = useContentStore();
  const { isContentBlocked } = useSettingsStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(CHANNELS_PER_PAGE);
  const locale = i18n.language.startsWith('tr') ? 'tr-TR' : 'en-US';

  const filteredChannels = useMemo(() => {
    const base =
      selectedCategory === 'all'
        ? liveChannels
        : liveChannels.filter(channel => channel.category_id === selectedCategory);
    return base.filter(
      channel => !isContentBlocked(channel.stream_id, Number(channel.category_id))
    );
  }, [liveChannels, selectedCategory, isContentBlocked]);

  const visibleChannels = useMemo(
    () => filteredChannels.slice(0, visibleCount),
    [filteredChannels, visibleCount]
  );

  const visibleChannelIds = useMemo(
    () => visibleChannels.map(channel => channel.stream_id),
    [visibleChannels]
  );

  // Fetch the full EPG for the visible channels (batched/cached in the store)
  useEffect(() => {
    if (visibleChannelIds.length > 0) {
      fetchEPGForChannels(visibleChannelIds);
    }
  }, [visibleChannelIds, fetchEPGForChannels]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setVisibleCount(CHANNELS_PER_PAGE);
  };

  const handleChannelSelect = (channel: Channel) => {
    navigate(`/live/${channel.stream_id}`);
  };

  const handleRefresh = () => {
    if (visibleChannelIds.length > 0) {
      fetchEPGForChannels(visibleChannelIds, true);
    }
  };

  const tabs = [
    { id: 'all', label: t('epg.allChannels') },
    ...liveCategories.map((category: LiveCategory) => ({
      id: category.category_id,
      label: category.category_name
    }))
  ];

  // Channels themselves not loaded yet
  if (liveChannels.length === 0) {
    return (
      <Layout>
        <PageContainer>
          <PageHeader>
            <PageTitle>{t('epg.title')}</PageTitle>
          </PageHeader>
          {liveError ? (
            <ErrorState>
              <span>{liveError}</span>
              <Button variant="primary" onClick={() => fetchLiveStreams()}>
                {t('common.retry')}
              </Button>
            </ErrorState>
          ) : isLoadingLive ? (
            <LoadingContainer>
              <Loading size="large" text={t('common.loading')} />
            </LoadingContainer>
          ) : (
            <EmptyState>{t('epg.noChannels')}</EmptyState>
          )}
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader>
          <HeaderRow>
            <div>
              <PageTitle>{t('epg.title')}</PageTitle>
              <PageSubtitle>{formatDate(new Date().toISOString(), locale)}</PageSubtitle>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              {t('epg.refresh')}
            </Button>
          </HeaderRow>
        </PageHeader>

        <Tabs tabs={tabs} activeTab={selectedCategory} onChange={handleCategoryChange} />

        <ChannelsContainer>
          {epgError ? (
            <ErrorState>
              <span>{epgError}</span>
              <Button variant="primary" onClick={handleRefresh}>
                {t('common.retry')}
              </Button>
            </ErrorState>
          ) : visibleChannels.length > 0 ? (
            <>
              {visibleChannels.map(channel => (
                <ProgramRow
                  key={channel.stream_id}
                  channel={channel}
                  programs={currentEPG[channel.stream_id] ?? []}
                  isLoading={isLoadingEPG}
                  onSelect={handleChannelSelect}
                />
              ))}
              {visibleCount < filteredChannels.length && (
                <LoadMoreContainer>
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(count => count + CHANNELS_PER_PAGE)}
                  >
                    {t('epg.loadMore')}
                  </Button>
                </LoadMoreContainer>
              )}
            </>
          ) : (
            <EmptyState>{t('epg.noChannels')}</EmptyState>
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

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
`;

const PageSubtitle = styled.p`
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
`;

const ChannelsContainer = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

interface ChannelRowProps {
  focused: boolean;
}

const ChannelRow = styled.div<ChannelRowProps>`
  display: flex;
  gap: 16px;
  padding: 12px;
  background-color: var(--color-background-card);
  border-radius: 8px;
  cursor: pointer;
  outline: none;

  ${props => props.focused && css`
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  `}
`;

const ChannelInfo = styled.div`
  width: 220px;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
`;

const ChannelLogo = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 4px;
  flex-shrink: 0;
`;

const ChannelName = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProgramsTrack = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 6px;
  }
`;

interface ProgramCardProps {
  isNow: boolean;
}

const ProgramCard = styled.div<ProgramCardProps>`
  min-width: 200px;
  max-width: 260px;
  padding: 10px 12px;
  border-radius: 6px;
  background-color: rgba(128, 128, 128, 0.12);
  border: 1px solid rgba(128, 128, 128, 0.2);
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;

  ${props => props.isNow && css`
    background-color: rgba(var(--color-primary-rgb), 0.15);
    border-color: var(--color-primary);
  `}
`;

const NowBadge = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary);
`;

const ProgramTime = styled.span`
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
`;

const ProgramTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  padding-right: 32px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProgramDescription = styled.span`
  font-size: 12px;
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProgramPlaceholder = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  text-align: center;
  color: var(--color-error);
  font-size: 16px;
`;

const EmptyState = styled.div`
  padding: 48px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 16px;
`;

const LoadMoreContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 16px 0;
`;

export default EPGPage;
