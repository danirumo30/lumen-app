import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "vitest";

type TestUser = {
  id: string;
  email: string;
};

let supabase: SupabaseClient;
let firstUser: TestUser | null = null;
let secondUser: TestUser | null = null;

function getSupabaseClient(): SupabaseClient {
  dotenv.config({ path: ".env.local" });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase test client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function buildRandomEmail(base: string): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${base}.${suffix}@example.com`;
}

async function createAuthUser(email: string, fullName: string): Promise<TestUser> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      avatar_url: "https://example.com/avatar.png",
    },
  });

  if (error || !data?.user) {
    throw error ?? new Error("User creation failed without error payload");
  }

  return {
    id: data.user.id,
    email: data.user.email ?? email,
  };
}

describe("Auth & Profiles trigger and stats integration", () => {
  beforeAll(() => {
    supabase = getSupabaseClient();
  });

  afterAll(async () => {
    if (firstUser) {
      await supabase.auth.admin.deleteUser(firstUser.id);
    }
    if (secondUser) {
      await supabase.auth.admin.deleteUser(secondUser.id);
    }
  });

  test("Trigger & Normalization - creates profile with normalized username and split names", async () => {
    const email = buildRandomEmail("test.user-99");

    const user = await createAuthUser(email, "Test User");
    firstUser = user;

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, username, avatar_url, banner_url")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(user.id);
    expect(profile?.username).toBe("testuser99");
    expect(profile?.first_name).toBe("Test");
    expect(profile?.last_name).toBe("User");
  });

  test("Collisions - assigns suffixed username on base handle collision", async () => {
    if (!firstUser) {
      throw new Error("First user must be created before running collision test");
    }

    // Different raw email, but same normalized local part "testuser99"
    const email = buildRandomEmail("test-user.99");

    const user = await createAuthUser(email, "Test User");
    secondUser = user;

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("id, username")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(user.id);
    expect(profile?.username).toMatch(/^testuser99(_[a-z0-9]{4})?$/);
  });

  test("Statistics - aggregates minutes correctly in user_global_stats view", async () => {
    if (!firstUser) {
      throw new Error("First user must be created before running stats test");
    }

    const userId = firstUser.id;

    const { error: insertError } = await supabase.from("user_media_tracking").insert([
      {
        user_id: userId,
        media_id: "tmdb_test_movie",
        media_type: "movie",
        is_favorite: false,
        is_watched: true,
        is_planned: false,
        progress_minutes: 120,
      },
      {
        user_id: userId,
        media_id: "tmdb_test_tv",
        media_type: "tv",
        is_favorite: false,
        is_watched: true,
        is_planned: false,
        progress_minutes: 60,
      },
    ]);

    if (insertError) {
      throw insertError;
    }

    const { data: stats, error: statsError } = await supabase
      .from("user_global_stats")
      .select("user_id, total_movie_minutes, total_tv_minutes, total_game_minutes, total_minutes")
      .eq("user_id", userId)
      .maybeSingle();

    if (statsError) {
      throw statsError;
    }

    expect(stats).not.toBeNull();
    expect(stats?.user_id).toBe(userId);
    expect(stats?.total_movie_minutes).toBe(120);
    expect(stats?.total_tv_minutes).toBe(60);
    expect(stats?.total_game_minutes).toBe(0);
    expect(stats?.total_minutes).toBe(180);
  });
});

