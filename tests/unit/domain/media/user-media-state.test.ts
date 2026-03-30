import { describe, it, expect } from 'vitest';
import { UserMediaState } from '@/domain/media/entities/user-media-state.entity';
import { MediaId } from '@/domain/shared/value-objects/media-id';
import { InvalidUserMediaStateError } from '@/domain/media/entities/user-media-state.entity';

describe('UserMediaState Entity', () => {
  const userId = 'user-123';
  const mediaId = MediaId.fromString('tmdb_603692');
  const mediaType = 'movie' as const;

  it('should create a minimal valid state', () => {
    const state = new UserMediaState(userId, mediaId, mediaType);
    
    expect(state.userId).toBe(userId);
    expect(state.mediaId.equals(mediaId)).toBe(true);
    expect(state.mediaType).toBe(mediaType);
    expect(state.isFavorite).toBe(false);
    expect(state.isWatched).toBe(false);
    expect(state.isPlanned).toBe(false);
    expect(state.hasPlatinum).toBe(false);
  });

  it('should create with all options', () => {
    const state = new UserMediaState(
      userId,
      mediaId,
      mediaType,
      true, // isFavorite
      false,
      false,
      8,
      90,
      false // hasPlatinum - debe ser false cuando no se está viendo
    );
    
    expect(state.isFavorite).toBe(true);
    expect(state.rating).toBe(8);
    expect(state.progressMinutes).toBe(90);
    expect(state.hasPlatinum).toBe(false);
  });

  it('should enforce only one status flag at a time', () => {
    expect(() => {
      new UserMediaState(userId, mediaId, mediaType, true, true, false);
    }).toThrow(InvalidUserMediaStateError);
    
    expect(() => {
      new UserMediaState(userId, mediaId, mediaType, false, true, true);
    }).toThrow(InvalidUserMediaStateError);
    
    expect(() => {
      new UserMediaState(userId, mediaId, mediaType, true, false, true);
    }).toThrow(InvalidUserMediaStateError);
  });

  it('should allow platinum only if watched', () => {
    expect(() => {
      const state = new UserMediaState(userId, mediaId, mediaType, false, false, false, undefined, undefined, true);
      // should throw
    }).toThrow(InvalidUserMediaStateError);
  });

  it('should mark as watched with optional runtime', () => {
    const state = new UserMediaState(userId, mediaId, mediaType, false, false, false);
    state.markAsWatched(120);
    
    expect(state.isWatched).toBe(true);
    expect(state.isFavorite).toBe(false);
    expect(state.isPlanned).toBe(false);
    expect(state.progressMinutes).toBe(120);
  });

  it('should mark as favorite', () => {
    const state = new UserMediaState(userId, mediaId, mediaType, false, false, false);
    state.markAsFavorite(true);
    
    expect(state.isFavorite).toBe(true);
    expect(state.isWatched).toBe(false);
    expect(state.isPlanned).toBe(false);
  });

  it('should unmark favorite', () => {
    const state = new UserMediaState(userId, mediaId, mediaType, true, false, false);
    state.markAsFavorite(false);
    
    expect(state.isFavorite).toBe(false);
  });

  it('should mark as planned', () => {
    const state = new UserMediaState(userId, mediaId, mediaType, false, false, false);
    state.markAsPlanned(true);
    
    expect(state.isPlanned).toBe(true);
    expect(state.isFavorite).toBe(false);
    expect(state.isWatched).toBe(false);
  });

  it('should set progress with validation', () => {
    const state = new UserMediaState(userId, mediaId, mediaType);
    state.setProgress(50);
    expect(state.progressMinutes).toBe(50);
    
    expect(() => state.setProgress(-10)).toThrow(InvalidUserMediaStateError);
  });

  it('should set rating with validation', () => {
    const state = new UserMediaState(userId, mediaId, mediaType);
    state.setRating(9);
    expect(state.rating).toBe(9);
    
    expect(() => state.setRating(0)).toThrow(InvalidUserMediaStateError);
    expect(() => state.setRating(11)).toThrow(InvalidUserMediaStateError);
  });

  it('should set platinum only when watched', () => {
    const state = new UserMediaState(userId, mediaId, mediaType, false, true, false);
    state.setPlatinum(true);
    expect(state.hasPlatinum).toBe(true);
    
    const state2 = new UserMediaState(userId, mediaId, mediaType, false, false, false);
    expect(() => state2.setPlatinum(true)).toThrow(InvalidUserMediaStateError);
  });

  it('should increment followers (if applicable)', () => {
    // UserMediaState doesn't have followers; that's for UserProfile. Skip.
  });

  it('should equality based on userId and mediaId', () => {
    const state1 = new UserMediaState(userId, mediaId, mediaType);
    const sameMediaId = MediaId.fromString('tmdb_603692');
    const state2 = new UserMediaState(userId, sameMediaId, mediaType);
    const otherUserState = new UserMediaState('other-user', mediaId, mediaType);
    
    expect(state1.equals(state2)).toBe(true);
    expect(state1.equals(otherUserState)).toBe(false);
  });

  it('should convert to plain object', () => {
    const state = new UserMediaState(
      userId,
      mediaId,
      mediaType,
      true,
      false,
      false,
      7,
      45,
      false
    );
    
    const plain = state.toPlainObject();
    expect(plain.userId).toBe(userId);
    expect(plain.mediaId).toBe(mediaId.toString());
    expect(plain.mediaType).toBe(mediaType);
    expect(plain.isFavorite).toBe(true);
    expect(plain.rating).toBe(7);
  });
});
