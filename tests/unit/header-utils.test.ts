import { describe, test, expect } from "vitest";

interface UserMetadata {
  username?: string;
  full_name?: string;
}

function getUsernameDisplay(userMetadata: UserMetadata, email?: string): string {
  return (
    userMetadata?.username ||
    userMetadata?.full_name ||
    email?.split("@")[0] ||
    "User"
  );
}

function getInitialDisplay(userMetadata: UserMetadata, email?: string): string {
  return (
    userMetadata?.username?.charAt(0) ||
    userMetadata?.full_name?.charAt(0) ||
    email?.charAt(0)?.toUpperCase() ||
    "U"
  );
}

describe("Header Username Display", () => {
  test("should display username when available", () => {
    const userMetadata = { username: "testuser", full_name: "Test User" };
    expect(getUsernameDisplay(userMetadata, "test@example.com")).toBe("testuser");
  });

  test("should fallback to full_name when username is not available", () => {
    const userMetadata = { full_name: "Test User" };
    expect(getUsernameDisplay(userMetadata, "test@example.com")).toBe("Test User");
  });

  test("should fallback to email local part when neither username nor full_name is available", () => {
    const userMetadata = {};
    expect(getUsernameDisplay(userMetadata, "testuser@example.com")).toBe("testuser");
  });

  test("should return 'User' when no user data is available", () => {
    const userMetadata = {};
    expect(getUsernameDisplay(userMetadata)).toBe("User");
  });

  test("should use username initial for avatar when available", () => {
    const userMetadata = { username: "testuser", full_name: "Test User" };
    expect(getInitialDisplay(userMetadata, "test@example.com")).toBe("t");
  });

  test("should fallback to full_name initial for avatar when username is not available", () => {
    const userMetadata = { full_name: "Test User" };
    expect(getInitialDisplay(userMetadata, "test@example.com")).toBe("T");
  });

  test("should fallback to email initial for avatar when neither username nor full_name is available", () => {
    const userMetadata = {};
    expect(getInitialDisplay(userMetadata, "test@example.com")).toBe("T");
  });

  test("should return 'U' when no user data is available", () => {
    const userMetadata = {};
    expect(getInitialDisplay(userMetadata)).toBe("U");
  });
});

