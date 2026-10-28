import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { Layout } from '../components/layout';
import { VideoPlayer } from '../components/content';
import { Button, Loading, Carousel } from '../components/ui';
import { MovieCard } from '../components/content';
import { useContentStore, useUserDataStore, useTmdbStore } from '../store';
import { Movie, TmdbMovieDetails } from '../types';

const MovieDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { movies, fetchMovies, fetchMovieStream, movieStream, isLoading } = useContentStore();
  const { fetchMovieDetails, movieDetails } = useTmdbStore();
  const { addToFavorites, removeFromFavorites, favorites } = useUserDataStore();
  const addFavorite = addToFavorites;
  const removeFavorite = removeFromFavorites;
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  
  useEffect(() => {
    if (movies.length === 0) {
      fetchMovies();
    }
  }, [movies.length]);

  // Find the movie from the store
  useEffect(() => {
    if (id && movies.length > 0) {
      const foundMovie = movies.find(m => m.stream_id.toString() === id);
      if (foundMovie) {
        setMovie(foundMovie);
        
        // Check if it's in favorites
        const isFav = favorites.some(f => f.type === 'movie' && f.streamId === foundMovie.stream_id);
        setIsFavorite(isFav);
        
        // Find similar movies (same category)
        const similar = movies
          .filter(m => m.category_id === foundMovie.category_id && m.stream_id !== foundMovie.stream_id)
          .slice(0, 10);
        setSimilarMovies(similar);
        
        // Fetch TMDB details if available
        if (foundMovie.name) {
          fetchMovieDetails(foundMovie.name, foundMovie.year);
        }
      }
    }
  }, [id, movies, favorites]);
  
  // Fetch stream when play is clicked
  const handlePlay = async () => {
    if (movie) {
      await fetchMovieStream(movie.stream_id);
      setIsPlaying(true);
    }
  };
  
  // Toggle favorite status
  const toggleFavorite = () => {
    if (!movie) return;
    
    if (isFavorite) {
      const fav = favorites.find(f => f.type === 'movie' && f.streamId === movie.stream_id);
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite({
        type: 'movie',
        streamId: movie.stream_id,
        name: movie.name,
        poster: movie.stream_icon
      });
    }
    
    setIsFavorite(!isFavorite);
  };
  
  // Handle similar movie click
  const handleSimilarMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.stream_id}`);
  };
  
  // Handle back button
  const handleBack = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      navigate(-1);
    }
  };
  
  if (isLoading || !movie) {
    return (
      <Layout>
        <LoadingContainer>
          <Loading size="large" text={t('common.loading')} />
        </LoadingContainer>
      </Layout>
    );
  }
  
  // If playing, show the video player
  if (isPlaying && movieStream) {
    return (
      <VideoPlayerContainer>
        <VideoPlayer
          url={movieStream as string}
          title={movie.name}
          poster={movie.cover || movie.stream_icon}
          onBack={handleBack}
          contentType="movie"
          streamId={movie.stream_id}
        />
      </VideoPlayerContainer>
    );
  }
  
  // Get details from TMDB if available, otherwise use the movie data
  const details: TmdbMovieDetails | null = movieDetails;
  const backdropUrl = details?.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
    : movie.cover || movie.stream_icon;
  const posterUrl = details?.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : movie.cover || movie.stream_icon;
  
  return (
    <Layout>
      <DetailContainer>
        <BackdropContainer style={{ backgroundImage: `url(${backdropUrl})` }}>
          <BackdropOverlay />
          
          <ContentContainer>
            <PosterContainer>
              <Poster src={posterUrl} alt={movie.name} />
            </PosterContainer>
            
            <InfoContainer>
              <Title>{movie.name}</Title>
              
              <MetaInfo>
                {movie.year && <MetaItem>{movie.year}</MetaItem>}
                {details?.runtime && <MetaItem>{Math.floor(details.runtime / 60)}h {details.runtime % 60}m</MetaItem>}
                {details?.vote_average && <MetaItem>⭐ {details.vote_average.toFixed(1)}/10</MetaItem>}
                {movie.rating && !details?.vote_average && <MetaItem>⭐ {movie.rating}</MetaItem>}
              </MetaInfo>
              
              <GenreContainer>
                {details?.genres?.map(genre => (
                  <Genre key={genre.id}>{genre.name}</Genre>
                ))}
                {!details?.genres && movie.genre && (
                  <Genre>{movie.genre}</Genre>
                )}
              </GenreContainer>
              
              <Overview>
                {details?.overview || movie.plot || t('movieDetail.noDescription')}
              </Overview>
              
              <ButtonContainer>
                <PlayButton variant="primary" size="large" onClick={handlePlay}>
                  {t('actions.play')}
                </PlayButton>
                
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
                  <SectionTitle>{t('movieDetail.cast')}</SectionTitle>
                  <CastList>
                    {details.credits.cast.slice(0, 5).map(person => (
                      <CastItem key={person.id}>
                        {person.profile_path && (
                          <CastImage 
                            src={`https://image.tmdb.org/t/p/w200${person.profile_path}`} 
                            alt={person.name} 
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
        
        {similarMovies.length > 0 && (
          <SimilarContainer>
            <SectionTitle>{t('movieDetail.similar')}</SectionTitle>
            <Carousel>
              {similarMovies.map(movie => (
                <MovieCard
                  key={movie.stream_id}
                  movie={movie}
                  onClick={handleSimilarMovieClick}
                  width="200px"
                />
              ))}
            </Carousel>
          </SimilarContainer>
        )}
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

const PlayButton = styled(Button)`
  min-width: 150px;
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

const SimilarContainer = styled.div`
  padding: 48px;
`;

export default MovieDetailPage;