import { describe, it, expect } from "vitest";
import type {
  UserProfile,
  UserProfileWithStats,
  UserProfileWithContent,
  UpdateProfileData,
  UserProfileContentQuery,
} from "@/modules/social/domain/user-profile";
import type { Media } from "@/modules/shared/domain/media";

describe("UserProfile Domain", () => {
  describe("UserProfile interface", () => {
    it("should have required properties", () => {
      const profile: UserProfile = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        avatarUrl: "https://example.com/avatar.jpg",
        bannerUrl: "https://example.com/banner.jpg",
      };

      expect(profile.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(profile.username).toBe("johndoe");
    });

    it("should allow null values for optional fields", () => {
      const profile: UserProfile = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        firstName: null,
        lastName: null,
        username: "johndoe",
        avatarUrl: null,
        bannerUrl: null,
      };

      expect(profile.firstName).toBeNull();
      expect(profile.avatarUrl).toBeNull();
    });
  });

  describe("UserProfileWithStats interface", () => {
    it("should include all stats properties", () => {
      const profile: UserProfileWithStats = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        avatarUrl: "https://example.com/avatar.jpg",
        bannerUrl: "https://example.com/banner.jpg",
        totalMovieMinutes: 1200,
        totalTvMinutes: 3600,
        totalGameMinutes: 1800,
        totalMinutes: 6600,
        totalEpisodesWatched: 50,
        totalMoviesWatched: 20,
        totalGamesPlayed: 10,
        totalGamesPlatinum: 3,
      };

      expect(profile.totalMovieMinutes).toBe(1200);
      expect(profile.totalTvMinutes).toBe(3600);
      expect(profile.totalGameMinutes).toBe(1800);
      expect(profile.totalMinutes).toBe(6600);
      expect(profile.totalEpisodesWatched).toBe(50);
      expect(profile.totalMoviesWatched).toBe(20);
      expect(profile.totalGamesPlayed).toBe(10);
      expect(profile.totalGamesPlatinum).toBe(3);
    });
  });

  describe("UserProfileContentQuery interface", () => {
    it("should have required properties", () => {
      const query: UserProfileContentQuery = {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        includeFavorites: true,
        includeWatched: true,
        mediaTypes: ["movie", "tv", "game"],
      };

      expect(query.userId).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(query.includeFavorites).toBe(true);
      expect(query.mediaTypes).toContain("movie");
      expect(query.mediaTypes).toContain("tv");
      expect(query.mediaTypes).toContain("game");
    });
  });

  describe("UserProfileWithContent interface", () => {
    it("should include all media lists", () => {
      const movie: Media = {
        id: "tmdb_123",
        type: "movie",
        title: "The Matrix",
        releaseYear: 1999,
      };

      const tvShow: Media = {
        id: "tmdb_456",
        type: "tv",
        title: "Breaking Bad",
      };

      const game: Media = {
        id: "igdb_789",
        type: "game",
        title: "The Last of Us",
      };

      const content: UserProfileWithContent = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        avatarUrl: "https://example.com/avatar.jpg",
        bannerUrl: "https://example.com/banner.jpg",
        totalMovieMinutes: 1200,
        totalTvMinutes: 3600,
        totalGameMinutes: 1800,
        totalMinutes: 6600,
        totalEpisodesWatched: 50,
        totalMoviesWatched: 20,
        totalGamesPlayed: 10,
        totalGamesPlatinum: 3,
        favoriteMovies: [movie],
        watchedMovies: [movie],
        favoriteTvShows: [tvShow],
        watchedTvShows: [tvShow],
        favoriteGames: [game],
        watchedGames: [game],
        followersCount: 100,
        followingCount: 50,
        isFollowing: false,
        isFollower: true,
      };

      expect(content.favoriteMovies).toHaveLength(1);
      expect(content.favoriteMovies[0].title).toBe("The Matrix");
      expect(content.watchedTvShows).toHaveLength(1);
      expect(content.watchedGames[0].type).toBe("game");
    });

    it("should allow empty media lists", () => {
      const content: UserProfileWithContent = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        avatarUrl: "https://example.com/avatar.jpg",
        bannerUrl: "https://example.com/banner.jpg",
        totalMovieMinutes: 0,
        totalTvMinutes: 0,
        totalGameMinutes: 0,
        totalMinutes: 0,
        totalEpisodesWatched: 0,
        totalMoviesWatched: 0,
        totalGamesPlayed: 0,
        totalGamesPlatinum: 0,
        favoriteMovies: [],
        watchedMovies: [],
        favoriteTvShows: [],
        watchedTvShows: [],
        favoriteGames: [],
        watchedGames: [],
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
        isFollower: false,
      };

      expect(content.favoriteMovies).toHaveLength(0);
      expect(content.favoriteGames).toHaveLength(0);
    });
  });

  describe("UpdateProfileData interface", () => {
    it("should allow partial updates", () => {
      const data: UpdateProfileData = {
        username: "newusername",
      };

      expect(data.username).toBe("newusername");
      expect(data.avatarUrl).toBeUndefined();
      expect(data.bannerUrl).toBeUndefined();
    });

    it("should allow null values for optional fields", () => {
      const data: UpdateProfileData = {
        avatarUrl: null,
        bannerUrl: null,
      };

      expect(data.avatarUrl).toBeNull();
      expect(data.bannerUrl).toBeNull();
    });

    it("should allow undefined values", () => {
      const data: UpdateProfileData = {};

      expect(data.avatarUrl).toBeUndefined();
      expect(data.bannerUrl).toBeUndefined();
      expect(data.username).toBeUndefined();
    });
  });
});

describe("Media Domain", () => {
  describe("Media interface", () => {
    it("should support movie type", () => {
      const media: Media = {
        id: "tmdb_123",
        type: "movie",
        title: "The Matrix",
        releaseYear: 1999,
      };

      expect(media.type).toBe("movie");
    });

    it("should support tv type", () => {
      const media: Media = {
        id: "tmdb_456",
        type: "tv",
        title: "Breaking Bad",
      };

      expect(media.type).toBe("tv");
    });

    it("should support game type", () => {
      const media: Media = {
        id: "igdb_789",
        type: "game",
        title: "The Last of Us",
      };

      expect(media.type).toBe("game");
    });
  });
});
