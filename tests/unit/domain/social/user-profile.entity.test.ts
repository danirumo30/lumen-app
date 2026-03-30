 import { describe, it, expect } from "vitest";
 import { UserProfile } from "@/domain/social/entities/user-profile.entity";
 import { Username } from "@/domain/shared/value-objects/username.vo";
 import { UserStats } from "@/domain/social/value-objects/user-stats";
 import type { Media } from "@/domain/shared/value-objects/media-id";

describe("UserProfile Entity", () => {
  const mockStatsData = {
    totalMovieMinutes: 1200,
    totalTvMinutes: 3600,
    totalGameMinutes: 1800,
    totalMinutes: 6600,
    totalEpisodesWatched: 50,
    totalMoviesWatched: 20,
    totalGamesPlayed: 10,
    totalGamesPlatinum: 3,
  };

  const createProfile = (overrides?: Partial<{
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    stats: typeof mockStatsData;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isFollower: boolean;
  }>) => {
    return UserProfile.fromDatabase({
      id: "123e4567-e89b-12d3-a456-426614174000",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      avatarUrl: "https://example.com/avatar.jpg",
      bannerUrl: "https://example.com/banner.jpg",
      stats: mockStatsData,
      followersCount: 100,
      followingCount: 50,
      isFollowing: false,
      isFollower: true,
      ...overrides,
    });
  };

   it("should create a profile with all fields", () => {
     const profile = createProfile();

     expect(profile.id).toBe("123e4567-e89b-12d3-a456-426614174000");
     expect(profile.username).toBe("johndoe");
     expect(profile.firstName).toBe("John");
     expect(profile.lastName).toBe("Doe");
     expect(profile.avatarUrl).toBe("https://example.com/avatar.jpg");
     expect(profile.followersCount).toBe(100);
     expect(profile.followingCount).toBe(50);
     expect(profile.isFollowing).toBe(false);
     expect(profile.isFollower).toBe(true);
   });

  it("should allow null values for optional fields", () => {
    const profile = createProfile({
      firstName: null,
      lastName: null,
      avatarUrl: null,
      bannerUrl: null,
    });

    expect(profile.firstName).toBeNull();
    expect(profile.avatarUrl).toBeNull();
  });

   it("should expose stats via UserStats VO", () => {
     const profile = createProfile();
     expect(profile.stats.totalMovieMinutes).toBe(1200);
     expect(profile.stats.totalMinutes).toBe(6600);
     expect(profile.stats.totalGamesPlatinum).toBe(3);
   });

   it("should compare equality based on id", () => {
    const profile1 = createProfile();
    const profile2 = createProfile(); // same id
    const profile3 = createProfile({ id: "different-id" });

    // Simple equality: same id means equal
    expect(profile1.id).toBe(profile2.id);
    expect(profile1.id).not.toBe(profile3.id);
  });
});

describe("UserProfile Compatibility Types", () => {
  it("should still be assignable to legacy UserProfile interface (with string username)", () => {
    // This verifies backward compatibility: any UserProfile instance
    // can be used where old { username: string } was expected by using .username.value
    const profile = UserProfile.fromDatabase({
      id: "1",
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      avatarUrl: null,
      bannerUrl: null,
      stats: {
        totalMovieMinutes: 0,
        totalTvMinutes: 0,
        totalGameMinutes: 0,
        totalMinutes: 0,
        totalEpisodesWatched: 0,
        totalMoviesWatched: 0,
        totalGamesPlayed: 0,
        totalGamesPlatinum: 0,
      },
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      isFollower: false,
    });

     // Consumers needing string can use profile.username (getter)
     const usernameString: string = profile.username;
     expect(usernameString).toBe("johndoe");
  });

  it("should support Media interface with MediaId", () => {
    const media: Media = {
      id: { value: "tmdb_123" } as any, // casting for test
      type: "movie",
      title: "Test",
    };
    expect(media.id.value).toBe("tmdb_123");
  });
});
