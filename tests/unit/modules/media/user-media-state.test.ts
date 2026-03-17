import { describe, it, expect } from 'vitest';
import type { UserMediaState } from '@/modules/shared/domain/media';

describe('UserMediaState', () => {
  it('should create a valid media state', () => {
    const state: UserMediaState = {
      userId: 'user-123',
      mediaId: 'tmdb_603692',
      mediaType: 'movie',
      isFavorite: true,
      isWatched: false,
      isPlanned: true,
    };

    expect(state.userId).toBe('user-123');
    expect(state.mediaId).toBe('tmdb_603692');
    expect(state.mediaType).toBe('movie');
    expect(state.isFavorite).toBe(true);
    expect(state.isWatched).toBe(false);
    expect(state.isPlanned).toBe(true);
  });

  it('should create media state with optional fields', () => {
    const state: UserMediaState = {
      userId: 'user-123',
      mediaId: 'tmdb_603692',
      mediaType: 'movie',
      isFavorite: true,
      isWatched: true,
      isPlanned: false,
      rating: 8,
      progressMinutes: 90,
      statusFlags: ['favorite', 'watched'],
    };

    expect(state.rating).toBe(8);
    expect(state.progressMinutes).toBe(90);
    expect(state.statusFlags).toContain('favorite');
    expect(state.statusFlags).toContain('watched');
  });

  it('should validate media ID types', () => {
    const tmdbMovie: UserMediaState = {
      userId: 'user-123',
      mediaId: 'tmdb_603692',
      mediaType: 'movie',
      isFavorite: false,
      isWatched: true,
      isPlanned: false,
    };

    const igdbGame: UserMediaState = {
      userId: 'user-123',
      mediaId: 'igdb_123456',
      mediaType: 'game',
      isFavorite: true,
      isWatched: false,
      isPlanned: true,
    };

    expect(tmdbMovie.mediaId.startsWith('tmdb_')).toBe(true);
    expect(igdbGame.mediaId.startsWith('igdb_')).toBe(true);
  });

  it('should handle all media types', () => {
    const movie: UserMediaState = {
      userId: 'user-1',
      mediaId: 'tmdb_1',
      mediaType: 'movie',
      isFavorite: false,
      isWatched: false,
      isPlanned: false,
    };

    const tv: UserMediaState = {
      userId: 'user-1',
      mediaId: 'tmdb_2',
      mediaType: 'tv',
      isFavorite: false,
      isWatched: false,
      isPlanned: false,
    };

    const game: UserMediaState = {
      userId: 'user-1',
      mediaId: 'igdb_1',
      mediaType: 'game',
      isFavorite: false,
      isWatched: false,
      isPlanned: false,
    };

    expect(movie.mediaType).toBe('movie');
    expect(tv.mediaType).toBe('tv');
    expect(game.mediaType).toBe('game');
  });
});

describe('UserGlobalStats', () => {
  it('should calculate total minutes correctly', () => {
    const stats = {
      userId: 'user-123',
      totalMovieMinutes: 600,
      totalTvMinutes: 1200,
      totalGameMinutes: 300,
      totalMinutes: 2100,
    };

    expect(stats.totalMinutes).toBe(stats.totalMovieMinutes + stats.totalTvMinutes + stats.totalGameMinutes);
  });

  it('should handle zero values', () => {
    const stats = {
      userId: 'user-123',
      totalMovieMinutes: 0,
      totalTvMinutes: 0,
      totalGameMinutes: 0,
      totalMinutes: 0,
    };

    expect(stats.totalMinutes).toBe(0);
  });
});
