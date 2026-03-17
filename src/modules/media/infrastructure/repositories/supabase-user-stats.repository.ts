import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserGlobalStats } from "@/modules/shared/domain/media";

interface UserGlobalStatsRow {
  user_id: string;
  total_movie_minutes: number;
  total_tv_minutes: number;
  total_game_minutes: number;
  total_minutes: number;
}

export class SupabaseUserStatsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getGlobalStatsForUser(userId: string): Promise<UserGlobalStats | null> {
    const { data, error } = await this.client
      .from("user_global_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<UserGlobalStatsRow>();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      userId: data.user_id,
      totalMovieMinutes: data.total_movie_minutes,
      totalTvMinutes: data.total_tv_minutes,
      totalGameMinutes: data.total_game_minutes,
      totalMinutes: data.total_minutes,
    };
  }
}

