export class Email {
  public readonly value: string;

  constructor(value: string) {
    if (!value) {
      throw new Error("Email cannot be empty");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
    this.value = value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
