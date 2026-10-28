import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { MovieCard } from '../components/content';
import { Loading, Tabs, Grid } from '../components/ui';
import { useContentStore } from '../store';
import { Movie, MovieCategory } from '../types';

const MoviesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    fetchMovieCategories,
    fetchMovies,
    movieCategories,
    movies,
    isLoading
  } = useContentStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  
  useEffect(() => {
    fetchMovieCategories();
    fetchMovies();
  }, []);
  
  useEffect(() => {
    if (movieCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(movieCategories[0].category_id);
    }
  }, [movieCategories, selectedCategory]);
  
  useEffect(() => {
    if (selectedCategory) {
      if (selectedCategory === 'all') {
        setFilteredMovies(movies);
      } else {
        setFilteredMovies(
          movies.filter(movie => movie.category_id === selectedCategory)
        );
      }
    }
  }, [selectedCategory, movies]);
  
  const handleMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.stream_id}`);
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
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
  
  // Prepare tabs from categories
  const tabs = [
    { id: 'all', label: t('movies.allMovies') },
    ...movieCategories.map((category: MovieCategory) => ({
      id: category.category_id,
      label: category.category_name
    }))
  ];
  
  return (
    <Layout>
      <PageContainer>
        <PageHeader>
          <PageTitle>{t('movies.title')}</PageTitle>
        </PageHeader>
        
        <Tabs
          tabs={tabs}
          activeTab={selectedCategory || 'all'}
          onChange={handleCategoryChange}
        />
        
        {filteredMovies.length > 0 ? (
          <Grid columns={5} gap={16}>
            {filteredMovies.map((movie, index) => (
              <MovieCard
                key={movie.stream_id}
                movie={movie}
                onClick={handleMovieClick}
                autoFocus={index === 0}
              />
            ))}
          </Grid>
        ) : (
          <NoMovies>{t('movies.noMovies')}</NoMovies>
        )}
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

const NoMovies = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 16px;
`;

export default MoviesPage;