
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly emailVerified: boolean,
    public readonly username?: string,
    public readonly fullName?: string,
    public readonly avatarUrl?: string,
  ) {}

  
  get isEmailVerified(): boolean {
    return this.emailVerified;
  }

  
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
