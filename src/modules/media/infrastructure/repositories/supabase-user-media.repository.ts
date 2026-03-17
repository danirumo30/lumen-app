import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  MediaId,
  MediaType,
  UserMediaState,
  UserMediaStatusFlag,
  UserGlobalStats,
} from "@/modules/shared/domain/media";
import type { UserMediaRepository } from "@/modules/media/domain/user-media.repository";

interface UserMediaTrackingRow {
  user_id: string;
  media_id: string;
  media_type: string;
  is_favorite: boolean;
  is_watched: boolean;
  is_planned: boolean;
  rating: number | null;
  progress_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export class SupabaseUserMediaRepository implements UserMediaRepository {
  constructor(private readonly client: SupabaseClient) {}

  async save(state: UserMediaState): Promise<void> {
    const row = this.toPersistence(state);

    const { error } = await this.client
      .from("user_media_tracking")
      .upsert(row, { onConflict: "user_id,media_id" });

    if (error) {
      throw error;
    }
  }

  async findByUserAndMedia(userId: string, mediaId: MediaId): Promise<UserMediaState | null> {
    const { data, error } = await this.client
      .from("user_media_tracking")
      .select("*")
      .eq("user_id", userId)
      .eq("media_id", mediaId)
      .maybeSingle<UserMediaTrackingRow>();

    if (error) throw error;
    if (!data) return null;

    return this.toDomain(data);
  }

  async getUserMedia(userId: string, mediaType?: MediaType): Promise<UserMediaState[]> {
    let query = this.client
      .from("user_media_tracking")
      .select("*")
      .eq("user_id", userId);

    if (mediaType) {
      query = query.eq("media_type", mediaType);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map(row => this.toDomain(row));
  }

  async getUserStats(userId: string): Promise<UserGlobalStats> {
    const { data, error } = await this.client
      .from("user_global_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    return {
      userId,
      totalMovieMinutes: data?.total_movie_minutes ?? 0,
      totalTvMinutes: data?.total_tv_minutes ?? 0,
      totalGameMinutes: data?.total_game_minutes ?? 0,
      totalMinutes: data?.total_minutes ?? 0,
    };
  }

  private toPersistence(state: UserMediaState): UserMediaTrackingRow {
    return {
      user_id: state.userId,
      media_id: state.mediaId,
      media_type: state.mediaType,
      is_favorite: state.isFavorite,
      is_watched: state.isWatched,
      is_planned: state.isPlanned,
      rating: state.rating ?? null,
      progress_minutes: state.progressMinutes ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private toDomain(row: UserMediaTrackingRow): UserMediaState {
    return {
      userId: row.user_id,
      mediaId: row.media_id as MediaId,
      mediaType: row.media_type as MediaType,
      isFavorite: row.is_favorite,
      isWatched: row.is_watched,
      isPlanned: row.is_planned,
      rating: row.rating ?? undefined,
      progressMinutes: row.progress_minutes ?? undefined,
      statusFlags: this.buildStatusFlags(row),
    };
  }

  private buildStatusFlags(row: UserMediaTrackingRow): readonly UserMediaStatusFlag[] {
    const flags: UserMediaStatusFlag[] = [];
    if (row.is_favorite) flags.push("favorite");
    if (row.is_watched) flags.push("watched");
    if (row.is_planned) flags.push("planned");
    return flags;
  }
}
