import type {
  UpdateProfileData,
  UserProfile,
  UserProfileContentQuery,
  UserProfileWithContent,
  UserProfileWithStats,
} from "../entities/user-profile.entity";


export interface UserProfileRepository {
  
  getProfileById(userId: string): Promise<UserProfileWithStats | null>;

  
  getProfileByUsername(username: string): Promise<UserProfileWithStats | null>;

  
  getProfileContent(query: UserProfileContentQuery): Promise<UserProfileWithContent>;

  
  updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile>;

  
  isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean>;

  
  searchUsers(query: string, limit?: number): Promise<UserProfile[]>;

  
  followUser(followerId: string, followingId: string): Promise<void>;

  
  unfollowUser(followerId: string, followingId: string): Promise<void>;

  
  getFollowers(userId: string, limit?: number): Promise<UserProfile[]>;

  
  getFollowing(userId: string, limit?: number): Promise<UserProfile[]>;

  
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  
  getFollowersCount(userId: string): Promise<number>;

  
  getFollowingCount(userId: string): Promise<number>;
}




