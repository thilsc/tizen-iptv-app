import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { SeriesCard } from '../components/content';
import { Loading, Tabs, Grid, Button } from '../components/ui';
import { useContentStore, useSettingsStore } from '../store';
import { Series, SeriesCategory } from '../types';

const SeriesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    fetchSeries,
    seriesCategories,
    series,
    isLoading,
    seriesError
  } = useContentStore();
  const { isContentBlocked } = useSettingsStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  
  useEffect(() => {
    if (seriesCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(seriesCategories[0].category_id);
    }
  }, [seriesCategories, selectedCategory]);
  
  useEffect(() => {
    if (selectedCategory) {
      if (selectedCategory === 'all') {
        setFilteredSeries(series);
      } else {
        setFilteredSeries(
          series.filter(s => s.category_id === selectedCategory)
        );
      }
    }
  }, [selectedCategory, series]);
  
  const handleSeriesClick = (series: Series) => {
    navigate(`/series/${series.series_id}`);
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  const visibleSeries = filteredSeries.filter(
    s => !isContentBlocked(s.series_id, Number(s.category_id))
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
    { id: 'all', label: t('series.allSeries') },
    ...seriesCategories.map((category: SeriesCategory) => ({
      id: category.category_id,
      label: category.category_name
    }))
  ];
  
  return (
    <Layout>
      <PageContainer>
        <PageHeader>
          <PageTitle>{t('series.title')}</PageTitle>
        </PageHeader>
        
        <Tabs
          tabs={tabs}
          activeTab={selectedCategory || 'all'}
          onChange={handleCategoryChange}
        />
        
        {seriesError ? (
          <ErrorState>
            <span>{seriesError}</span>
            <Button variant="primary" onClick={() => fetchSeries()}>{t('common.retry')}</Button>
          </ErrorState>
        ) : visibleSeries.length > 0 ? (
          <Grid columns={5} gap={16}>
            {visibleSeries.map((seriesItem, index) => (
              <SeriesCard
                key={seriesItem.series_id}
                series={seriesItem}
                onClick={handleSeriesClick}
                autoFocus={index === 0}
              />
            ))}
          </Grid>
        ) : (
          <NoSeries>{t('series.noSeries')}</NoSeries>
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

const NoSeries = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 16px;
`;

export default SeriesPage;