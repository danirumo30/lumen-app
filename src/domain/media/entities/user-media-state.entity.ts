import { MediaId } from "../../shared/value-objects/media-id";
import type { MediaType, UserMediaStatusFlag, UserMediaRating, MediaProgressMinutes } from "../../shared/value-objects/media-id";

export class InvalidUserMediaStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUserMediaStateError";
  }
}

export class UserMediaState {
  private readonly _userId: string;
  private readonly _mediaId: MediaId;
  private readonly _mediaType: MediaType;
  private _isFavorite: boolean;
  private _isWatched: boolean;
  private _isPlanned: boolean;
  private _rating?: UserMediaRating;
  private _progressMinutes?: MediaProgressMinutes;
  private _hasPlatinum: boolean;

  // Los statusFlags se calculan dinámicamente
  constructor(
    userId: string,
    mediaId: MediaId,
    mediaType: MediaType,
    isFavorite: boolean = false,
    isWatched: boolean = false,
    isPlanned: boolean = false,
    rating?: UserMediaRating,
    progressMinutes?: MediaProgressMinutes,
    hasPlatinum?: boolean
  ) {
    this._userId = userId;
    this._mediaId = mediaId;
    this._mediaType = mediaType;
    this._isFavorite = isFavorite;
    this._isWatched = isWatched;
    this._isPlanned = isPlanned;
    this._rating = rating;
    this._progressMinutes = progressMinutes;
    this._hasPlatinum = hasPlatinum || false;

    this.validateInvariants();
  }

  static fromDatabase(data: {
    userId: string;
    mediaId: string;
    mediaType: MediaType;
    isFavorite: boolean;
    isWatched: boolean;
    isPlanned: boolean;
    rating?: UserMediaRating;
    progressMinutes?: MediaProgressMinutes;
    hasPlatinum?: boolean;
  }): UserMediaState {
    return new UserMediaState(
      data.userId,
      MediaId.fromString(data.mediaId),
      data.mediaType,
      data.isFavorite,
      data.isWatched,
      data.isPlanned,
      data.rating,
      data.progressMinutes,
      data.hasPlatinum
    );
  }

  get userId(): string {
    return this._userId;
  }

  get mediaId(): MediaId {
    return this._mediaId;
  }

  get mediaType(): MediaType {
    return this._mediaType;
  }

  get isFavorite(): boolean {
    return this._isFavorite;
  }

  get isWatched(): boolean {
    return this._isWatched;
  }

  get isPlanned(): boolean {
    return this._isPlanned;
  }

  get rating(): UserMediaRating | undefined {
    return this._rating;
  }

  get progressMinutes(): MediaProgressMinutes | undefined {
    return this._progressMinutes;
  }

  get hasPlatinum(): boolean {
    return this._hasPlatinum;
  }

  get statusFlags(): readonly UserMediaStatusFlag[] {
    const flags: UserMediaStatusFlag[] = [];
    if (this._isFavorite) flags.push("favorite");
    if (this._isWatched) flags.push("watched");
    if (this._isPlanned) flags.push("planned");
    return flags;
  }

  // Invariants validation
  private validateInvariants(): void {
    // Only one flag can be true at a time (business rule)
    const flags = [this._isFavorite, this._isWatched, this._isPlanned].filter(Boolean);
    if (flags.length > 1) {
      throw new InvalidUserMediaStateError(
        `Only one status flag (favorite, watched, planned) can be set at a time. Found ${flags.length}.`
      );
    }

    // If platinum, must be watched
    if (this._hasPlatinum && !this._isWatched) {
      throw new InvalidUserMediaStateError("Cannot have platinum without being watched");
    }
  }

  // Business methods (mutations)
  markAsWatched(runtimeMinutes?: number): void {
    this._isWatched = true;
    this._isFavorite = false;
    this._isPlanned = false;
    if (runtimeMinutes !== undefined) {
      this._progressMinutes = runtimeMinutes;
    }
    this.validateInvariants();
  }

  markAsFavorite(flag: boolean = true): void {
    this._isFavorite = flag;
    if (flag) {
      this._isWatched = false;
      this._isPlanned = false;
    }
    this.validateInvariants();
  }

  markAsPlanned(flag: boolean = true): void {
    this._isPlanned = flag;
    if (flag) {
      this._isFavorite = false;
      this._isWatched = false;
    }
    this.validateInvariants();
  }

  setProgress(minutes: MediaProgressMinutes): void {
    if (minutes < 0) {
      throw new InvalidUserMediaStateError("Progress minutes cannot be negative");
    }
    this._progressMinutes = minutes;
  }

  setRating(rating: UserMediaRating): void {
    if (rating < 1 || rating > 10) {
      throw new InvalidUserMediaStateError("Rating must be between 1 and 10");
    }
    this._rating = rating;
  }

  setPlatinum(flag: boolean = true): void {
    if (flag && !this._isWatched) {
      throw new InvalidUserMediaStateError("Cannot set platinum without being watched");
    }
    this._hasPlatinum = flag;
  }

  // Equality
  equals(other: UserMediaState): boolean {
    return this._userId === other._userId && this._mediaId.equals(other._mediaId);
  }

  toPlainObject(): {
    userId: string;
    mediaId: string;
    mediaType: MediaType;
    isFavorite: boolean;
    isWatched: boolean;
    isPlanned: boolean;
    rating?: UserMediaRating;
    progressMinutes?: MediaProgressMinutes;
    hasPlatinum: boolean;
  } {
    return {
      userId: this._userId,
      mediaId: this._mediaId.toString(),
      mediaType: this._mediaType,
      isFavorite: this._isFavorite,
      isWatched: this._isWatched,
      isPlanned: this._isPlanned,
      rating: this._rating,
      progressMinutes: this._progressMinutes,
      hasPlatinum: this._hasPlatinum,
    };
  }
}
