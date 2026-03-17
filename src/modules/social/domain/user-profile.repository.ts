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
}
