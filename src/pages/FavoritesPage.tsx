import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { MovieCard, SeriesCard, ChannelCard } from '../components/content';
import { Grid } from '../components/ui';
import { useContentStore, useUserDataStore } from '../store';
import { Movie, Series, Channel } from '../types';

const FavoritesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { movies, series, liveChannels, fetchMovies, fetchSeries, fetchLiveStreams } = useContentStore();
  const { favorites } = useUserDataStore();

  useEffect(() => {
    if (movies.length === 0) fetchMovies();
    if (series.length === 0) fetchSeries();
    if (liveChannels.length === 0) fetchLiveStreams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const favMovies = favorites.filter(f => f.type === 'movie');
  const favSeries = favorites.filter(f => f.type === 'series');
  const favChannels = favorites.filter(f => f.type === 'live');

  const handleMovieClick = (movie: Movie) => navigate(`/movie/${movie.stream_id}`);
  const handleSeriesClick = (seriesItem: Series) => navigate(`/series/${seriesItem.series_id}`);
  const handleChannelClick = (channel: Channel) => navigate(`/live/${channel.stream_id}`);

  return (
    <Layout>
      <PageContainer>
        <PageTitle>{t('navigation.favorites')}</PageTitle>

        {favChannels.length > 0 && (
          <Section>
            <SectionTitle>{t('navigation.liveTV')}</SectionTitle>
            <ChannelsContainer>
              {favChannels.map(fav => {
                const channel = liveChannels.find(c => c.stream_id === fav.streamId);
                if (!channel) return null;
                return (
                  <ChannelCard
                    key={fav.id}
                    channel={channel}
                    onClick={handleChannelClick}
                  />
                );
              })}
            </ChannelsContainer>
          </Section>
        )}

        {favMovies.length > 0 && (
          <Section>
            <SectionTitle>{t('navigation.movies')}</SectionTitle>
            <Grid columns={5} gap={16}>
              {favMovies.map(fav => {
                const movie = movies.find(m => m.stream_id === fav.streamId);
                if (!movie) return null;
                return (
                  <MovieCard
                    key={fav.id}
                    movie={movie}
                    onClick={handleMovieClick}
                  />
                );
              })}
            </Grid>
          </Section>
        )}

        {favSeries.length > 0 && (
          <Section>
            <SectionTitle>{t('navigation.series')}</SectionTitle>
            <Grid columns={5} gap={16}>
              {favSeries.map(fav => {
                const seriesItem = series.find(s => s.series_id === fav.streamId);
                if (!seriesItem) return null;
                return (
                  <SeriesCard
                    key={fav.id}
                    series={seriesItem}
                    onClick={handleSeriesClick}
                  />
                );
              })}
            </Grid>
          </Section>
        )}

        {favorites.length === 0 && (
          <EmptyState>{t('common.noResults')}</EmptyState>
        )}
      </PageContainer>
    </Layout>
  );
};

const PageContainer = styled.div`padding: 24px;`;
const PageTitle = styled.h1`font-size: 32px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 24px;`;
const Section = styled.section`margin-bottom: 40px;`;
const SectionTitle = styled.h2`font-size: 24px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 16px;`;
const ChannelsContainer = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const EmptyState = styled.div`padding: 48px; text-align: center; color: var(--color-text-secondary); font-size: 18px;`;

export default FavoritesPage;