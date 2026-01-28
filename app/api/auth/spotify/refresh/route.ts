import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SPOTIFY_TOKEN_URL } from "@/lib/spotify/auth";
import type {
  SpotifyRefreshResponse,
  SpotifyError,
  SpotifyTokenRecord,
} from "@/lib/spotify/types";

export async function POST() {
  try {
    // Get the current user from Supabase session
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get current tokens from database
    const { data: tokenRecord, error: fetchError } = await supabase
      .from("spotify_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single<SpotifyTokenRecord>();

    if (fetchError || !tokenRecord) {
      return NextResponse.json(
        { error: "No Spotify connection found" },
        { status: 404 }
      );
    }

    // Refresh the token with Spotify
    const refreshResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenRecord.refresh_token,
        client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      }),
    });

    const refreshData = await refreshResponse.json();

    if (!refreshResponse.ok) {
      const errorData = refreshData as SpotifyError;
      console.error("Spotify token refresh failed:", errorData);

      // If refresh token is invalid, delete the connection
      if (refreshResponse.status === 400 || refreshResponse.status === 401) {
        await supabase
          .from("spotify_tokens")
          .delete()
          .eq("user_id", user.id);
        return NextResponse.json(
          { error: "Spotify connection expired. Please reconnect." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: errorData.error?.message || "Token refresh failed" },
        { status: refreshResponse.status }
      );
    }

    const tokens = refreshData as SpotifyRefreshResponse;

    // Calculate new expiration timestamp
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Update tokens in database
    // Note: Spotify may or may not return a new refresh_token
    const updateData: {
      access_token: string;
      expires_at: string;
      scope: string;
      refresh_token?: string;
    } = {
      access_token: tokens.access_token,
      expires_at: expiresAt.toISOString(),
      scope: tokens.scope,
    };

    // Only update refresh_token if a new one was provided
    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }

    const { error: updateError } = await supabase
      .from("spotify_tokens")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update Spotify tokens:", updateError);
      return NextResponse.json(
        { error: "Failed to update tokens" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accessToken: tokens.access_token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Spotify refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
