import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { Input, Grid } from '../components/ui';
import { MovieCard, SeriesCard, ChannelCard } from '../components/content';
import { useContentStore } from '../store';
import { Movie, Series, Channel } from '../types';

const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { movies, series, liveChannels } = useContentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    movies: Movie[];
    series: Series[];
    channels: Channel[];
  }>({
    movies: [],
    series: [],
    channels: [],
  });
  
  // Perform search when query changes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({
        movies: [],
        series: [],
        channels: [],
      });
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Search in movies
    const filteredMovies = movies.filter(movie => 
      movie.name.toLowerCase().includes(query)
    );
    
    // Search in series
    const filteredSeries = series.filter(seriesItem => 
      seriesItem.name.toLowerCase().includes(query)
    );
    
    // Search in channels
    const filteredChannels = liveChannels.filter(channel => 
      channel.name.toLowerCase().includes(query)
    );
    
    setSearchResults({
      movies: filteredMovies,
      series: filteredSeries,
      channels: filteredChannels,
    });
  }, [searchQuery, movies, series, liveChannels]);
  
  // Handle item clicks
  const handleMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.stream_id}`);
  };
  
  const handleSeriesClick = (series: Series) => {
    navigate(`/series/${series.series_id}`);
  };
  
  const handleChannelClick = (channel: Channel) => {
    navigate(`/live/${channel.stream_id}`);
  };
  
  // Calculate total results
  const totalResults = 
    searchResults.movies.length + 
    searchResults.series.length + 
    searchResults.channels.length;
  
  return (
    <Layout>
      <SearchContainer>
        <SearchHeader>
          <SearchTitle>{t('search.title')}</SearchTitle>
          
          <SearchInputContainer>
            <SearchInput
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              autoFocus
            />
          </SearchInputContainer>
        </SearchHeader>
        
        <SearchContent>
          {searchQuery.trim().length < 2 ? (
            <SearchPrompt>{t('search.enterQuery')}</SearchPrompt>
          ) : totalResults === 0 ? (
            <NoResults>{t('search.noResults')}</NoResults>
          ) : (
            <>
              {searchResults.channels.length > 0 && (
                <ResultSection>
                  <SectionTitle>
                    {t('search.channelsResults')} ({searchResults.channels.length})
                  </SectionTitle>
                  
                  <ChannelsContainer>
                    {searchResults.channels.map(channel => (
                      <ChannelCard
                        key={channel.stream_id}
                        channel={channel}
                        onClick={handleChannelClick}
                      />
                    ))}
                  </ChannelsContainer>
                </ResultSection>
              )}
              
              {searchResults.movies.length > 0 && (
                <ResultSection>
                  <SectionTitle>
                    {t('search.moviesResults')} ({searchResults.movies.length})
                  </SectionTitle>
                  
                  <Grid columns={5} gap={16}>
                    {searchResults.movies.map(movie => (
                      <MovieCard
                        key={movie.stream_id}
                        movie={movie}
                        onClick={handleMovieClick}
                      />
                    ))}
                  </Grid>
                </ResultSection>
              )}
              
              {searchResults.series.length > 0 && (
                <ResultSection>
                  <SectionTitle>
                    {t('search.seriesResults')} ({searchResults.series.length})
                  </SectionTitle>
                  
                  <Grid columns={5} gap={16}>
                    {searchResults.series.map(seriesItem => (
                      <SeriesCard
                        key={seriesItem.series_id}
                        series={seriesItem}
                        onClick={handleSeriesClick}
                      />
                    ))}
                  </Grid>
                </ResultSection>
              )}
            </>
          )}
        </SearchContent>
      </SearchContainer>
    </Layout>
  );
};

const SearchContainer = styled.div`
  padding: 24px;
`;

const SearchHeader = styled.div`
  margin-bottom: 32px;
`;

const SearchTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 16px;
`;

const SearchInputContainer = styled.div`
  max-width: 600px;
`;

const SearchInput = styled(Input)`
  font-size: 18px;
  padding: 12px 16px;
`;

const SearchContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const SearchPrompt = styled.div`
  text-align: center;
  padding: 48px;
  color: var(--color-text-secondary);
  font-size: 18px;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 48px;
  color: var(--color-text-secondary);
  font-size: 18px;
`;

const ResultSection = styled.section`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
`;

const ChannelsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export default SearchPage;