import { describe, test, expect } from "vitest";

function validatePassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

describe("Password Validation", () => {
  test("should reject passwords shorter than 8 characters", () => {
    expect(validatePassword("Abc12")).toBe(false);
    expect(validatePassword("Abc1234")).toBe(false);
  });

  test("should reject passwords without uppercase letters", () => {
    expect(validatePassword("abc12345")).toBe(false);
  });

  test("should reject passwords without lowercase letters", () => {
    expect(validatePassword("ABC12345")).toBe(false);
  });

  test("should reject passwords without numbers", () => {
    expect(validatePassword("Abcdefgh")).toBe(false);
  });

  test("should accept valid passwords", () => {
    expect(validatePassword("Abc12345")).toBe(true);
    expect(validatePassword("SecurePass123")).toBe(true);
    expect(validatePassword("Test1234")).toBe(true);
  });

  test("should reject common weak patterns", () => {
    const weakPatterns = ["123456", "password", "qwerty", "abc123", "111111"];
    weakPatterns.forEach((pattern) => {
      expect(validatePassword(pattern)).toBe(false);
    });
  });
});

