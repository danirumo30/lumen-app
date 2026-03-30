import { Email } from "../../shared/value-objects/email.vo";
import { Username } from "../../shared/value-objects/username.vo";

export class User {
  private _id: string;
  private _email: Email;
  private _emailVerified: boolean;
  private _username?: Username;
  private _fullName?: string;
  private _avatarUrl?: string;
  private _isActive: boolean = true;

  constructor(
    id: string,
    email: string, // accept string, validate internally
    emailVerified: boolean,
    username?: string,
    fullName?: string,
    avatarUrl?: string
  ) {
    this._id = id;
    this._email = new Email(email);
    this._emailVerified = emailVerified;
    if (username) this._username = new Username(username);
    this._fullName = fullName;
    this._avatarUrl = avatarUrl;
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
      raw.avatarUrl
    );
  }

  get id(): string {
    return this._id;
  }

  // External view: string
  get email(): string {
    return this._email.value;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  // External view: string | undefined
  get username(): string | undefined {
    return this._username?.value;
  }

  get fullName(): string | undefined {
    return this._fullName;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Business methods using VO internally
  changeEmail(newEmailStr: string): void {
    const newEmail = new Email(newEmailStr);
    this._email = newEmail;
    this._emailVerified = false;
  }

  verifyEmail(): void {
    this._emailVerified = true;
  }

  updateProfile(avatarUrl?: string, fullName?: string, usernameStr?: string): void {
    if (avatarUrl !== undefined) this._avatarUrl = avatarUrl;
    if (fullName !== undefined) this._fullName = fullName;
    if (usernameStr !== undefined) this._username = usernameStr ? new Username(usernameStr) : undefined;
  }

  deactivate(): void {
    this._isActive = false;
  }

  equals(other: User): boolean {
    return this._id === other._id;
  }

  toString(): string {
    return `User(id=${this._id}, email=${this._email.value}, verified=${this._emailVerified})`;
  }
}
