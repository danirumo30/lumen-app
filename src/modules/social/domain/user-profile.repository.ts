import type {
  UpdateProfileData,
  UserProfile,
  UserProfileContentQuery,
  UserProfileWithContent,
  UserProfileWithStats,
} from "./user-profile";

/**
 * Repositorio para operaciones de perfil de usuario
 * Patrón Repository en arquitectura hexagonal
 */
export interface UserProfileRepository {
  /**
   * Obtiene un perfil de usuario por su ID
   */
  getProfileById(userId: string): Promise<UserProfileWithStats | null>;

  /**
   * Obtiene un perfil de usuario por su nombre de usuario
   */
  getProfileByUsername(username: string): Promise<UserProfileWithStats | null>;

  /**
   * Obtiene el contenido asociado a un perfil según los filtros especificados
   */
  getProfileContent(query: UserProfileContentQuery): Promise<UserProfileWithContent>;

  /**
   * Actualiza los datos de un perfil de usuario
   */
  updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile>;

  /**
   * Verifica si un nombre de usuario está disponible
   */
  isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean>;

  /**
   * Busca usuarios por username
   */
  searchUsers(query: string, limit?: number): Promise<UserProfile[]>;

  /**
   * Seguir a un usuario
   */
  followUser(followerId: string, followingId: string): Promise<void>;

  /**
   * Dejar de seguir a un usuario
   */
  unfollowUser(followerId: string, followingId: string): Promise<void>;

  /**
   * Obtener seguidores de un usuario
   */
  getFollowers(userId: string, limit?: number): Promise<UserProfile[]>;

  /**
   * Obtener usuarios seguidos por un usuario
   */
  getFollowing(userId: string, limit?: number): Promise<UserProfile[]>;

  /**
   * Verificar si un usuario sigue a otro
   */
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Obtener conteo de seguidores
   */
  getFollowersCount(userId: string): Promise<number>;

  /**
   * Obtener conteo de usuarios seguidos
   */
  getFollowingCount(userId: string): Promise<number>;
}
