/**
 * Entidad de Dominio: User
 * Clase pura de TypeScript sin dependencias de infraestructura
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly emailVerified: boolean,
    public readonly username?: string,
    public readonly fullName?: string,
    public readonly avatarUrl?: string,
  ) {}

  /**
   * Valida si el usuario tiene email verificado
   */
  get isEmailVerified(): boolean {
    return this.emailVerified;
  }

  /**
   * Crea una instancia de User desde datos crudos
   */
  static fromRaw(raw: {
    id: string;
    email: string;
    emailVerified: boolean;
    username?: string;
    fullName?: string;
    avatarUrl?: string;
  }): User {
    return new User(
      raw.id,
      raw.email,
      raw.emailVerified,
      raw.username,
      raw.fullName,
      raw.avatarUrl,
    );
  }
}
