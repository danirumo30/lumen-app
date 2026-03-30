export class Username {
  public readonly value: string;

  constructor(raw: string) {
    if (!raw) {
      throw new Error("Username cannot be empty");
    }
    if (raw.length < 3 || raw.length > 30) {
      throw new Error(`Username must be between 3 and 30 characters: ${raw.length} chars`);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(raw)) {
      throw new Error(`Username contains invalid characters: ${raw}. Only alphanumeric and underscore allowed.`);
    }
    this.value = raw;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }
}
