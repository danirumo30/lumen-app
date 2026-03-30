/**
 * Unit Tests: Movie Domain Logic
 * Following hexagonal architecture - pure domain, no infrastructure
 */

import { describe, it, expect } from 'vitest';

// Pure function: validate media ID format
function isValidMediaId(id: string): boolean {
  return /^(\w+)_(\d+)$/.test(id);
}

// Pure function: extract provider from media ID
function getProvider(mediaId: string): string | null {
  const match = mediaId.match(/^(\w+)_(\d+)$/);
  return match ? match[1] : null;
}

// Pure function: extract numeric ID from media ID
function getNumericId(mediaId: string): string | null {
  const match = mediaId.match(/^(\w+)_(\d+)$/);
  return match ? match[2] : null;
}

// Pure function: strip provider prefix
function stripPrefix(mediaId: string): string {
  return mediaId.replace(/^(\w+)_/, '');
}

// Pure function: create media ID
function createMediaId(provider: string, numericId: number): string {
  return `${provider}_${numericId}`;
}

// Pure function: validate movie runtime
function isValidRuntime(runtime: number | null | undefined): boolean {
  if (runtime === null || runtime === undefined) return true;
  return runtime >= 0 && runtime <= 600; // Max 10 hours
}

// Pure function: calculate movie length category
function getMovieLengthCategory(runtime: number): string {
  if (runtime < 90) return 'short';
  if (runtime < 150) return 'standard';
  return 'long';
}

describe('Media ID Validation', () => {
  it('should validate TMDB movie ID format', () => {
    expect(isValidMediaId('tmdb_550')).toBe(true);
    expect(isValidMediaId('movie_550')).toBe(true);
  });

  it('should validate IGDB game ID format', () => {
    expect(isValidMediaId('igdb_12345')).toBe(true);
  });

  it('should reject invalid ID formats', () => {
    expect(isValidMediaId('550')).toBe(false);
    expect(isValidMediaId('tmdb550')).toBe(false);
    expect(isValidMediaId('')).toBe(false);
  });

  it('should extract provider from ID', () => {
    expect(getProvider('tmdb_550')).toBe('tmdb');
    expect(getProvider('movie_550')).toBe('movie');
    expect(getProvider('igdb_12345')).toBe('igdb');
    expect(getProvider('invalid')).toBeNull();
  });

  it('should extract numeric ID from media ID', () => {
    expect(getNumericId('tmdb_550')).toBe('550');
    expect(getNumericId('movie_603692')).toBe('603692');
    expect(getNumericId('igdb_12345')).toBe('12345');
  });

  it('should strip prefix from media ID', () => {
    expect(stripPrefix('tmdb_550')).toBe('550');
    expect(stripPrefix('movie_603692')).toBe('603692');
    expect(stripPrefix('igdb_12345')).toBe('12345');
  });

  it('should create media ID from parts', () => {
    expect(createMediaId('tmdb', 550)).toBe('tmdb_550');
    expect(createMediaId('movie', 603692)).toBe('movie_603692');
    expect(createMediaId('igdb', 12345)).toBe('igdb_12345');
  });
});

describe('Movie Runtime', () => {
  it('should accept null/undefined runtime', () => {
    expect(isValidRuntime(null)).toBe(true);
    expect(isValidRuntime(undefined)).toBe(true);
  });

  it('should accept valid runtime', () => {
    expect(isValidRuntime(90)).toBe(true);
    expect(isValidRuntime(120)).toBe(true);
    expect(isValidRuntime(0)).toBe(true);
  });

  it('should reject negative runtime', () => {
    expect(isValidRuntime(-1)).toBe(false);
  });

  it('should reject unreasonably long runtime', () => {
    expect(isValidRuntime(601)).toBe(false);
    expect(isValidRuntime(720)).toBe(false);
  });

  it('should categorize movie length', () => {
    expect(getMovieLengthCategory(80)).toBe('short');
    expect(getMovieLengthCategory(90)).toBe('standard');
    expect(getMovieLengthCategory(120)).toBe('standard');
    expect(getMovieLengthCategory(149)).toBe('standard');
    expect(getMovieLengthCategory(150)).toBe('long');
    expect(getMovieLengthCategory(180)).toBe('long');
    expect(getMovieLengthCategory(200)).toBe('long');
  });
});

describe('Media State Transitions', () => {
  interface MediaState {
    isWatched: boolean;
    isFavorite: boolean;
    isPlanned: boolean;
    rating?: number;
  }

  // Pure function: toggle watched state
  function toggleWatched(state: MediaState): MediaState {
    return {
      ...state,
      isWatched: !state.isWatched,
    };
  }

  // Pure function: toggle favorite state
  function toggleFavorite(state: MediaState): MediaState {
    return {
      ...state,
      isFavorite: !state.isFavorite,
    };
  }

  // Pure function: mark as watched
  function markAsWatched(state: MediaState): MediaState {
    return {
      ...state,
      isWatched: true,
    };
  }

  // Pure function: is state consistent
  function isStateConsistent(state: MediaState): boolean {
    if (state.isWatched && !state.isFavorite && !state.isPlanned && !state.rating) {
      return true; // Watched-only is valid
    }
    return true;
  }

  it('should toggle watched state', () => {
    const initial: MediaState = { isWatched: false, isFavorite: false, isPlanned: false };
    const after = toggleWatched(initial);
    
    expect(after.isWatched).toBe(true);
    expect(after.isFavorite).toBe(false);
  });

  it('should toggle favorite state', () => {
    const initial: MediaState = { isWatched: false, isFavorite: false, isPlanned: false };
    const after = toggleFavorite(initial);
    
    expect(after.isFavorite).toBe(true);
    expect(after.isWatched).toBe(false);
  });

  it('should mark as watched', () => {
    const initial: MediaState = { isWatched: false, isFavorite: false, isPlanned: false };
    const after = markAsWatched(initial);
    
    expect(after.isWatched).toBe(true);
  });

  it('should preserve other states when toggling watched', () => {
    const initial: MediaState = { isWatched: false, isFavorite: true, isPlanned: true };
    const after = toggleWatched(initial);
    
    expect(after.isWatched).toBe(true);
    expect(after.isFavorite).toBe(true);
    expect(after.isPlanned).toBe(true);
  });
});

