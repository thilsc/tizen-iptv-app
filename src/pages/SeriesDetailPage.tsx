import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { VideoPlayer, EpisodeCard } from '../components/content';
import { Button, Loading, Tabs } from '../components/ui';
import { useContentStore, useUserDataStore, useTmdbStore } from '../store';
import { Series, Season, Episode, TmdbSeriesDetails } from '../types';

const SeriesDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { 
    series,
    fetchSeries,
    fetchSeriesSeasons,
    fetchSeriesEpisodes,
    fetchEpisodeStream,
    seasons,
    episodes,
    episodeStream,
    isLoading
  } = useContentStore();
  const { fetchSeriesDetails, seriesDetails, isLoading: isTmdbLoading } = useTmdbStore();
  const { addToFavorites, removeFromFavorites, favorites, watchHistory } = useUserDataStore();
  const addFavorite = addToFavorites;
  const removeFavorite = removeFromFavorites;
  
  const [seriesData, setSeriesData] = useState<Series | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    if (series.length === 0) {
      fetchSeries();
    }
  }, [series.length, fetchSeries]);

  // Find the series from the store
  useEffect(() => {
    if (id && series.length > 0) {
      const foundSeries = series.find(s => s.series_id.toString() === id);
      if (foundSeries) {
        setSeriesData(foundSeries);
        
        // Check if it's in favorites
        const isFav = favorites.some(f => f.type === 'series' && f.streamId === foundSeries.series_id);
        setIsFavorite(isFav);
        
        // Fetch seasons
        fetchSeriesSeasons(foundSeries.series_id);
        
        // Fetch TMDB details if available
        if (foundSeries.name) {
          fetchSeriesDetails(foundSeries.name, foundSeries.year);
        }
      }
    }
  }, [id, series, favorites, fetchSeriesDetails, fetchSeriesSeasons]);
  
  // When seasons are loaded, select the first one
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0].season_number.toString());
    }
  }, [seasons, selectedSeason]);
  
  // When a season is selected, fetch its episodes
  useEffect(() => {
    if (seriesData && selectedSeason) {
      fetchSeriesEpisodes(seriesData.series_id, parseInt(selectedSeason));
    }
  }, [seriesData, selectedSeason, fetchSeriesEpisodes]);
  
  // Toggle favorite status
  const toggleFavorite = () => {
    if (!seriesData) return;
    
    if (isFavorite) {
      const fav = favorites.find(f => f.type === 'series' && f.streamId === seriesData.series_id);
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite({
        type: 'series',
        streamId: seriesData.series_id,
        name: seriesData.name,
        poster: seriesData.cover || seriesData.backdrop_path
      });
    }
    
    setIsFavorite(!isFavorite);
  };
  
  // Handle episode selection
  const handleEpisodeClick = async (episode: Episode) => {
    setSelectedEpisode(episode);
    await fetchEpisodeStream(episode.id);
    setIsPlaying(true);
  };
  
  // Handle season change
  const handleSeasonChange = (seasonNumber: string) => {
    setSelectedSeason(seasonNumber);
  };
  
  // Handle back button
  const handleBack = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setSelectedEpisode(null);
    } else {
      navigate(-1);
    }
  };
  
  if (isLoading || !seriesData) {
    return (
      <Layout>
        <LoadingContainer>
          <Loading size="large" text={t('common.loading')} />
        </LoadingContainer>
      </Layout>
    );
  }
  
  // If playing, show the video player
  if (isPlaying && selectedEpisode && episodeStream) {
    return (
      <VideoPlayerContainer>
        <VideoPlayer
          url={episodeStream as string}
          title={seriesData.name}
          subtitle={`S${selectedEpisode.season_number} E${selectedEpisode.episode_num}: ${selectedEpisode.title}`}
          poster={selectedEpisode.info?.movie_image || seriesData.cover}
          onBack={handleBack}
          contentType="series"
          streamId={selectedEpisode.id}
          seriesId={seriesData.series_id}
          seasonNumber={selectedEpisode.season_number}
          episodeNumber={selectedEpisode.episode_num}
          startPosition={
            watchHistory.find(
              h =>
                h.type === 'series' &&
                h.streamId === selectedEpisode.id &&
                h.seasonNumber === selectedEpisode.season_number &&
                h.episodeNumber === selectedEpisode.episode_num &&
                !h.completed
            )?.position || 0
          }
        />
      </VideoPlayerContainer>
    );
  }
  
  // Get details from TMDB if available, otherwise use the series data
  const details: TmdbSeriesDetails | null = seriesDetails;
  const backdropUrl = details?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : seriesData.cover;
  const posterUrl = details?.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : seriesData.cover;
  
  // Prepare season tabs
  const seasonTabs = seasons.map((season: Season) => ({
    id: season.season_number.toString(),
    label: `${t('seriesDetail.season')} ${season.season_number}`
  }));
  
  return (
    <Layout>
      <DetailContainer>
        <BackdropContainer style={{ backgroundImage: `url(${backdropUrl})` }}>
          <BackdropOverlay />
          
          <ContentContainer>
            <PosterContainer>
              <Poster src={posterUrl} alt={seriesData.name} />
            </PosterContainer>
            
            <InfoContainer>
              <Title>{seriesData.name}</Title>
              
              <MetaInfo>
                {seriesData.year && <MetaItem>{seriesData.year}</MetaItem>}
                {details?.number_of_seasons && (
                  <MetaItem>
                    {details.number_of_seasons} {t('seriesDetail.seasons')}
                  </MetaItem>
                )}
                {details?.vote_average && <MetaItem>⭐ {details.vote_average.toFixed(1)}/10</MetaItem>}
                {seriesData.rating && !details?.vote_average && <MetaItem>⭐ {seriesData.rating}</MetaItem>}
              </MetaInfo>
              
              <GenreContainer>
                {details?.genres?.map(genre => (
                  <Genre key={genre.id}>{genre.name}</Genre>
                ))}
                {!details?.genres && seriesData.genre && (
                  <Genre>{seriesData.genre}</Genre>
                )}
              </GenreContainer>
              
              {isTmdbLoading && <Loading size="small" text={t('common.loading')} />}

              <Overview>
                {details?.overview || seriesData.plot || t('seriesDetail.noDescription')}
              </Overview>
              
              <ButtonContainer>
                <FavoriteButton 
                  variant={isFavorite ? "secondary" : "outline"} 
                  size="large" 
                  onClick={toggleFavorite}
                >
                  {isFavorite ? t('actions.removeFromFavorites') : t('actions.addToFavorites')}
                </FavoriteButton>
              </ButtonContainer>
              
              {details?.credits?.cast && details.credits.cast.length > 0 && (
                <CastContainer>
                  <SectionTitle>{t('seriesDetail.cast')}</SectionTitle>
                  <CastList>
                    {details.credits.cast.slice(0, 5).map(person => (
                      <CastItem key={person.id}>
                        {person.profile_path && (
                          <CastImage 
                            src={`https://image.tmdb.org/t/p/w200${person.profile_path}`} 
                            alt={person.name}
                            loading="lazy"
                          />
                        )}
                        <CastName>{person.name}</CastName>
                        <CastCharacter>{person.character}</CastCharacter>
                      </CastItem>
                    ))}
                  </CastList>
                </CastContainer>
              )}
            </InfoContainer>
          </ContentContainer>
        </BackdropContainer>
        
        <EpisodesContainer>
          <SectionTitle>{t('seriesDetail.episodes')}</SectionTitle>
          
          {seasonTabs.length > 0 && (
            <Tabs
              tabs={seasonTabs}
              activeTab={selectedSeason || '1'}
              onChange={handleSeasonChange}
            />
          )}
          
          <EpisodesList>
            {isLoading ? (
              <LoadingContainer>
                <Loading size="large" text={t('common.loading')} />
              </LoadingContainer>
            ) : episodes.length > 0 ? (
              episodes.map((episode, index) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  onClick={handleEpisodeClick}
                  autoFocus={index === 0}
                />
              ))
            ) : (
              <NoEpisodes>{t('seriesDetail.noEpisodes')}</NoEpisodes>
            )}
          </EpisodesList>
        </EpisodesContainer>
      </DetailContainer>
    </Layout>
  );
};

const DetailContainer = styled.div`
  width: 100%;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const VideoPlayerContainer = styled.div`
  width: 100%;
  height: 100vh;
  background-color: black;
`;

const BackdropContainer = styled.div`
  position: relative;
  width: 100%;
  height: 80vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const BackdropOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
`;

const ContentContainer = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  padding: 48px;
  height: 100%;
`;

const PosterContainer = styled.div`
  flex: 0 0 300px;
  margin-right: 48px;
`;

const Poster = styled.img`
  width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
`;

const InfoContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const MetaItem = styled.div`
  color: white;
  font-size: 16px;
  margin-right: 16px;
  
  &:last-child {
    margin-right: 0;
  }
`;

const GenreContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const Genre = styled.div`
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  margin-right: 8px;
  margin-bottom: 8px;
`;

const Overview = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 32px;
  max-width: 800px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
`;

const FavoriteButton = styled(Button)`
  min-width: 200px;
`;

const CastContainer = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;
`;

const CastList = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
`;

const CastItem = styled.div`
  width: 120px;
  text-align: center;
`;

const CastImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
`;

const CastName = styled.div`
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const CastCharacter = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
`;

const EpisodesContainer = styled.div`
  padding: 48px;
  background-color: var(--color-background);
`;

const EpisodesList = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NoEpisodes = styled.div`
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 16px;
`;

export default SeriesDetailPage;