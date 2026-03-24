import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const runtime = "nodejs";

// Get all users in random order
async function getPopularUsers() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get all public user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .eq("is_public", true)
    .limit(50);

  if (profilesError || !profiles) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  // Shuffle array for random order
  const shuffled = [...profiles].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, 20);
}

export async function GET() {
  try {
    const users = await getPopularUsers();

    const results = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching trending users:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending users" },
      { status: 500 }
    );
  }
}
