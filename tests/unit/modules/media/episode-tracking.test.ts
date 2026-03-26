/**
 * Unit Tests: Episode Tracking Domain Logic
 * Following hexagonal architecture - pure domain, no infrastructure
 */

import { describe, it, expect } from 'vitest';

// Episode key format: "season_episode"
type EpisodeKey = string;

// Pure function to create episode key
function createEpisodeKey(season: number, episode: number): EpisodeKey {
  return `${season}_${episode}`;
}

// Pure function to parse episode key
function parseEpisodeKey(key: EpisodeKey): { season: number; episode: number } {
  const [s, e] = key.split('_').map(Number);
  return { season: s, episode: e };
}

// Pure function: check if all episodes in a season are watched
function isSeasonComplete(
  seasonNumber: number,
  episodes: { seasonNumber: number; episodeNumber: number }[],
  watchedEpisodes: Set<EpisodeKey>
): boolean {
  return episodes
    .filter(ep => ep.seasonNumber === seasonNumber)
    .every(ep => watchedEpisodes.has(createEpisodeKey(ep.seasonNumber, ep.episodeNumber)));
}

// Pure function: check if series is complete
function isSeriesComplete(
  episodes: { seasonNumber: number; episodeNumber: number }[],
  watchedEpisodes: Set<EpisodeKey>
): boolean {
  return episodes.every(ep => watchedEpisodes.has(createEpisodeKey(ep.seasonNumber, ep.episodeNumber)));
}

// Pure function: mark all episodes in a season
function markSeason(
  seasonNumber: number,
  episodes: { seasonNumber: number; episodeNumber: number }[],
  watched: boolean
): Set<EpisodeKey> {
  const result = new Set<EpisodeKey>();
  
  for (const ep of episodes) {
    const key = createEpisodeKey(ep.seasonNumber, ep.episodeNumber);
    if (ep.seasonNumber === seasonNumber) {
      if (watched) result.add(key);
    }
  }
  
  return result;
}

// Pure function: toggle single episode
function toggleEpisode(
  watchedEpisodes: Set<EpisodeKey>,
  seasonNumber: number,
  episodeNumber: number,
  watched: boolean
): Set<EpisodeKey> {
  const key = createEpisodeKey(seasonNumber, episodeNumber);
  const newSet = new Set(watchedEpisodes);
  
  if (watched) {
    newSet.add(key);
  } else {
    newSet.delete(key);
  }
  
  return newSet;
}

// Pure function: get completion percentage
function getCompletionPercentage(
  totalEpisodes: number,
  watchedEpisodes: Set<EpisodeKey>
): number {
  if (totalEpisodes === 0) return 0;
  return Math.round((watchedEpisodes.size / totalEpisodes) * 100);
}

describe('Episode Key Management', () => {
  it('should create consistent episode keys', () => {
    expect(createEpisodeKey(1, 1)).toBe('1_1');
    expect(createEpisodeKey(3, 12)).toBe('3_12');
    expect(createEpisodeKey(1, 99)).toBe('1_99');
  });

  it('should parse episode keys correctly', () => {
    const parsed = parseEpisodeKey('1_5');
    expect(parsed.season).toBe(1);
    expect(parsed.episode).toBe(5);
  });

  it('should round-trip through create and parse', () => {
    const original = { season: 2, episode: 8 };
    const key = createEpisodeKey(original.season, original.episode);
    const parsed = parseEpisodeKey(key);
    
    expect(parsed.season).toBe(original.season);
    expect(parsed.episode).toBe(original.episode);
  });
});

describe('Season Completion', () => {
  const episodes = [
    { seasonNumber: 1, episodeNumber: 1 },
    { seasonNumber: 1, episodeNumber: 2 },
    { seasonNumber: 1, episodeNumber: 3 },
    { seasonNumber: 2, episodeNumber: 1 },
    { seasonNumber: 2, episodeNumber: 2 },
  ];

  it('should detect incomplete season', () => {
    const watched = new Set<EpisodeKey>(['1_1', '1_2']); // Missing 1_3
    expect(isSeasonComplete(1, episodes, watched)).toBe(false);
  });

  it('should detect complete season', () => {
    const watched = new Set<EpisodeKey>(['1_1', '1_2', '1_3']);
    expect(isSeasonComplete(1, episodes, watched)).toBe(true);
  });

  it('should only check episodes from specified season', () => {
    const watched = new Set<EpisodeKey>(['1_1', '1_2', '1_3', '2_1']);
    expect(isSeasonComplete(2, episodes, watched)).toBe(false); // Missing 2_2
  });

  it('should return true for empty season episodes', () => {
    const watched = new Set<EpisodeKey>();
    const emptySeasonEpisodes = episodes.filter(ep => ep.seasonNumber === 99);
    expect(isSeasonComplete(99, emptySeasonEpisodes, watched)).toBe(true);
  });
});

describe('Series Completion', () => {
  const episodes = [
    { seasonNumber: 1, episodeNumber: 1 },
    { seasonNumber: 1, episodeNumber: 2 },
    { seasonNumber: 2, episodeNumber: 1 },
  ];

  it('should detect incomplete series', () => {
    const watched = new Set<EpisodeKey>(['1_1', '1_2']); // Missing 2_1
    expect(isSeriesComplete(episodes, watched)).toBe(false);
  });

  it('should detect complete series', () => {
    const watched = new Set<EpisodeKey>(['1_1', '1_2', '2_1']);
    expect(isSeriesComplete(episodes, watched)).toBe(true);
  });

  it('should return true for empty series', () => {
    expect(isSeriesComplete([], new Set())).toBe(true);
  });
});

describe('Episode Toggle', () => {
  it('should add episode to watched set', () => {
    const initial = new Set<EpisodeKey>();
    const result = toggleEpisode(initial, 1, 1, true);
    
    expect(result.has('1_1')).toBe(true);
    expect(result.size).toBe(1);
  });

  it('should remove episode from watched set', () => {
    const initial = new Set<EpisodeKey>(['1_1', '1_2']);
    const result = toggleEpisode(initial, 1, 1, false);
    
    expect(result.has('1_1')).toBe(false);
    expect(result.has('1_2')).toBe(true);
    expect(result.size).toBe(1);
  });

  it('should not modify original set (immutability)', () => {
    const initial = new Set<EpisodeKey>(['1_1']);
    toggleEpisode(initial, 1, 2, true);
    
    expect(initial.size).toBe(1);
    expect(initial.has('1_2')).toBe(false);
  });

  it('should handle multiple toggles correctly', () => {
    let watched = new Set<EpisodeKey>();
    
    watched = toggleEpisode(watched, 1, 1, true);
    watched = toggleEpisode(watched, 1, 2, true);
    watched = toggleEpisode(watched, 1, 1, false); // Unwatch 1_1
    
    expect(watched.has('1_1')).toBe(false);
    expect(watched.has('1_2')).toBe(true);
    expect(watched.size).toBe(1);
  });
});

describe('Mark Season', () => {
  const episodes = [
    { seasonNumber: 1, episodeNumber: 1 },
    { seasonNumber: 1, episodeNumber: 2 },
    { seasonNumber: 2, episodeNumber: 1 },
    { seasonNumber: 2, episodeNumber: 2 },
    { seasonNumber: 2, episodeNumber: 3 },
  ];

  it('should mark all episodes in season', () => {
    const result = markSeason(1, episodes, true);
    
    expect(result.has('1_1')).toBe(true);
    expect(result.has('1_2')).toBe(true);
    expect(result.has('2_1')).toBe(false); // Different season
    expect(result.has('2_2')).toBe(false);
  });

  it('should return empty set when marking with false', () => {
    const result = markSeason(1, episodes, false);
    expect(result.size).toBe(0);
  });

  it('should handle non-existent season', () => {
    const result = markSeason(99, episodes, true);
    expect(result.size).toBe(0);
  });
});

describe('Completion Percentage', () => {
  it('should calculate 0% for empty watched', () => {
    expect(getCompletionPercentage(10, new Set())).toBe(0);
  });

  it('should calculate 100% for complete', () => {
    const watched = new Set(['1_1', '1_2', '1_3', '1_4', '1_5']);
    expect(getCompletionPercentage(5, watched)).toBe(100);
  });

  it('should calculate partial percentage', () => {
    const watched = new Set(['1_1', '1_2', '1_3']);
    expect(getCompletionPercentage(10, watched)).toBe(30);
  });

  it('should handle 0 total episodes', () => {
    expect(getCompletionPercentage(0, new Set())).toBe(0);
  });

  it('should round to nearest integer', () => {
    const watched = new Set(['1_1', '1_2']);
    expect(getCompletionPercentage(3, watched)).toBe(67); // 66.6... rounds to 67
  });
});

describe('Chaining Logic', () => {
  const allEpisodes = [
    { seasonNumber: 1, episodeNumber: 1 },
    { seasonNumber: 1, episodeNumber: 2 },
    { seasonNumber: 2, episodeNumber: 1 },
    { seasonNumber: 2, episodeNumber: 2 },
  ];

  it('should cascade: mark series -> all seasons marked', () => {
    let watched = new Set<EpisodeKey>();
    
    // Mark all episodes (series marked)
    for (const ep of allEpisodes) {
      watched = toggleEpisode(watched, ep.seasonNumber, ep.episodeNumber, true);
    }
    
    expect(isSeriesComplete(allEpisodes, watched)).toBe(true);
    expect(isSeasonComplete(1, allEpisodes, watched)).toBe(true);
    expect(isSeasonComplete(2, allEpisodes, watched)).toBe(true);
  });

  it('should cascade: unmark episode -> series no longer complete', () => {
    let watched = new Set<EpisodeKey>();
    
    for (const ep of allEpisodes) {
      watched = toggleEpisode(watched, ep.seasonNumber, ep.episodeNumber, true);
    }
    
    watched = toggleEpisode(watched, 1, 1, false);
    
    expect(isSeriesComplete(allEpisodes, watched)).toBe(false);
    expect(isSeasonComplete(1, allEpisodes, watched)).toBe(false);
    expect(isSeasonComplete(2, allEpisodes, watched)).toBe(true); // Season 2 still complete
  });

  it('should cascade: unmark season -> series no longer complete', () => {
    let watched = new Set<EpisodeKey>();
    
    for (const ep of allEpisodes) {
      watched = toggleEpisode(watched, ep.seasonNumber, ep.episodeNumber, true);
    }
    
    for (const ep of allEpisodes.filter(ep => ep.seasonNumber === 2)) {
      watched = toggleEpisode(watched, ep.seasonNumber, ep.episodeNumber, false);
    }
    
    expect(isSeriesComplete(allEpisodes, watched)).toBe(false);
    expect(isSeasonComplete(1, allEpisodes, watched)).toBe(true);
    expect(isSeasonComplete(2, allEpisodes, watched)).toBe(false);
  });

  it('should handle edge: unwatch last episode in series', () => {
    let watched = new Set<EpisodeKey>();
    
    watched = toggleEpisode(watched, 1, 1, true);
    
    expect(isSeriesComplete(allEpisodes, watched)).toBe(false);
    expect(getCompletionPercentage(allEpisodes.length, watched)).toBe(25);
  });
});

