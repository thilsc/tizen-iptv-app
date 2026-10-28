import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { Carousel, Loading } from '../components/ui';
import { HeroSlider, MovieCard, SeriesCard, ChannelCard } from '../components/content';
import { useContentStore, useUserDataStore } from '../store';
import { Movie, Series, Channel } from '../types';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    fetchFeaturedContent,
    fetchLiveCategories,
    fetchMovieCategories,
    fetchSeriesCategories,
    fetchLiveStreams,
    fetchMovies,
    fetchSeries,
    featuredContent,
    liveChannels,
    movies,
    series,
    isLoading
  } = useContentStore();
  
  const { watchHistory, favorites } = useUserDataStore();
  
  const [continueWatching, setContinueWatching] = useState<(Movie | Series)[]>([]);
  
  useEffect(() => {
    // Fetch all content
    const loadAll = async () => {
      await Promise.all([
        fetchLiveCategories(),
        fetchMovieCategories(),
        fetchSeriesCategories(),
        fetchLiveStreams(),
        fetchMovies(),
        fetchSeries(),
      ]);
      await fetchFeaturedContent();
    };
    loadAll();
  }, []);
  
  // Prepare continue watching list
  useEffect(() => {
    if (watchHistory.length > 0) {
      const watchingItems: (Movie | Series)[] = [];
      
      // Add movies in progress
      const movieHistory = watchHistory.filter(
        item => item.type === 'movie' && item.position > 0 && item.position < item.duration * 0.95
      );
      
      for (const item of movieHistory) {
        const movie = movies.find(m => m.stream_id === item.streamId);
        if (movie) {
          watchingItems.push(movie);
        }
      }
      
      // Add series in progress
      const seriesHistory = watchHistory.filter(
        item => item.type === 'series' && item.position > 0 && item.position < item.duration * 0.95
      );

      for (const item of seriesHistory) {
        const sid = item.seriesId ?? item.streamId;
        const seriesItem = series.find(s => s.series_id === sid);
        if (seriesItem && !watchingItems.some(w => 'series_id' in w && w.series_id === seriesItem.series_id)) {
          watchingItems.push(seriesItem);
        }
      }
      
      setContinueWatching(watchingItems);
    }
  }, [watchHistory, movies, series]);
  
  // Handle navigation
  const handleMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.stream_id}`);
  };
  
  const handleSeriesClick = (series: Series) => {
    navigate(`/series/${series.series_id}`);
  };
  
  const handleChannelClick = (channel: Channel) => {
    navigate(`/live/${channel.stream_id}`);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <LoadingContainer>
          <Loading size="large" text={t('common.loading')} />
        </LoadingContainer>
      </Layout>
    );
  }
  
  const heroItems = featuredContent
    .map((f: { type: string; streamId: number }) => {
      if (f.type === 'movie') return movies.find(m => m.stream_id === f.streamId);
      if (f.type === 'series') return series.find(s => s.series_id === f.streamId);
      if (f.type === 'live') return liveChannels.find(c => c.stream_id === f.streamId);
      return null;
    })
    .filter(Boolean) as (Movie | Series | Channel)[];

  return (
    <Layout>
      <HomeContainer>
        {heroItems.length > 0 && (
          <HeroSlider items={heroItems} />
        )}
        
        {continueWatching.length > 0 && (
          <Section>
            <SectionTitle>{t('home.continueWatching')}</SectionTitle>
            <Carousel>
              {continueWatching.map(item => (
                'stream_id' in item ? (
                  <MovieCard
                    key={`movie-${item.stream_id}`}
                    movie={item}
                    onClick={handleMovieClick}
                    width="200px"
                  />
                ) : (
                  <SeriesCard
                    key={`series-${item.series_id}`}
                    series={item}
                    onClick={handleSeriesClick}
                    width="200px"
                  />
                )
              ))}
            </Carousel>
          </Section>
        )}
        
        {favorites.length > 0 && (
          <Section>
            <SectionTitle>{t('home.favorites')}</SectionTitle>
            <Carousel>
              {favorites.map(item => {
                if (item.type === 'movie') {
                  const movie = movies.find(m => m.stream_id === item.streamId);
                  if (movie) {
                    return (
                      <MovieCard
                        key={`fav-movie-${movie.stream_id}`}
                        movie={movie}
                        onClick={handleMovieClick}
                        width="200px"
                      />
                    );
                  }
                } else if (item.type === 'series') {
                  const seriesItem = series.find(s => s.series_id === item.streamId);
                  if (seriesItem) {
                    return (
                      <SeriesCard
                        key={`fav-series-${seriesItem.series_id}`}
                        series={seriesItem}
                        onClick={handleSeriesClick}
                        width="200px"
                      />
                    );
                  }
                } else if (item.type === 'live') {
                  const channel = liveChannels.find(c => c.stream_id === item.streamId);
                  if (channel) {
                    return (
                      <ChannelCard
                        key={`fav-channel-${channel.stream_id}`}
                        channel={channel}
                        onClick={handleChannelClick}
                      />
                    );
                  }
                }
                return null;
              })}
            </Carousel>
          </Section>
        )}
        
        {liveChannels.length > 0 && (
          <Section>
            <SectionTitle>{t('home.liveTV')}</SectionTitle>
            <Carousel>
              {liveChannels.slice(0, 10).map(channel => (
                <ChannelCard
                  key={`channel-${channel.stream_id}`}
                  channel={channel}
                  onClick={handleChannelClick}
                />
              ))}
            </Carousel>
          </Section>
        )}
        
        {movies.length > 0 && (
          <Section>
            <SectionTitle>{t('home.movies')}</SectionTitle>
            <Carousel>
              {movies.slice(0, 10).map(movie => (
                <MovieCard
                  key={`movie-${movie.stream_id}`}
                  movie={movie}
                  onClick={handleMovieClick}
                  width="200px"
                />
              ))}
            </Carousel>
          </Section>
        )}
        
        {series.length > 0 && (
          <Section>
            <SectionTitle>{t('home.series')}</SectionTitle>
            <Carousel>
              {series.slice(0, 10).map(seriesItem => (
                <SeriesCard
                  key={`series-${seriesItem.series_id}`}
                  series={seriesItem}
                  onClick={handleSeriesClick}
                  width="200px"
                />
              ))}
            </Carousel>
          </Section>
        )}
      </HomeContainer>
    </Layout>
  );
};

const HomeContainer = styled.div`
  padding: 24px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
`;

export default HomePage;