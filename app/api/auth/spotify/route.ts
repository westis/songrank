import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SPOTIFY_TOKEN_URL } from "@/lib/spotify/auth";
import type { SpotifyTokenResponse, SpotifyError } from "@/lib/spotify/types";

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier } = await request.json();

    if (!code || !codeVerifier) {
      return NextResponse.json(
        { error: "Missing code or code_verifier" },
        { status: 400 }
      );
    }

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

    // Exchange code for tokens with Spotify
    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
        client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      const errorData = tokenData as SpotifyError;
      console.error("Spotify token exchange failed:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Token exchange failed" },
        { status: tokenResponse.status }
      );
    }

    const tokens = tokenData as SpotifyTokenResponse;

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in database (upsert to handle reconnection)
    const { error: dbError } = await supabase.from("spotify_tokens").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
      },
      { onConflict: "user_id" }
    );

    if (dbError) {
      console.error("Failed to store Spotify tokens:", dbError);
      return NextResponse.json(
        { error: "Failed to store tokens" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Spotify auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
