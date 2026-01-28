"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { initiateSpotifyAuth } from "@/lib/spotify/auth";
import type { SpotifyTokenRecord } from "@/lib/spotify/types";

const supabase = createClient();

interface SpotifyAuthState {
  isConnected: boolean;
  isLoading: boolean;
  accessToken: string | null;
  expiresAt: Date | null;
  error: string | null;
}

/**
 * Hook for managing Spotify authentication state
 */
export function useSpotifyAuth() {
  const queryClient = useQueryClient();

  // Fetch current token status
  const {
    data: tokenRecord,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["spotify-token"],
    queryFn: async (): Promise<SpotifyTokenRecord | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("spotify_tokens")
        .select("*")
        .eq("user_id", user.id)
        .single<SpotifyTokenRecord>();

      if (error) {
        // No token found is not an error state
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("spotify_tokens")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["spotify-token"], null);
    },
  });

  // Check if token is expired or about to expire (5 min buffer)
  const isExpired = tokenRecord
    ? new Date(tokenRecord.expires_at) < new Date(Date.now() + 5 * 60 * 1000)
    : true;

  // Get a valid access token, refreshing if needed
  const getValidToken = async (): Promise<string | null> => {
    if (!tokenRecord) return null;

    // If not expired, return current token
    if (!isExpired) {
      return tokenRecord.access_token;
    }

    // Refresh the token
    try {
      const response = await fetch("/api/auth/spotify/refresh", {
        method: "POST",
      });

      if (!response.ok) {
        // Token refresh failed, invalidate the cache
        queryClient.setQueryData(["spotify-token"], null);
        return null;
      }

      const { accessToken, expiresAt } = await response.json();

      // Update local cache with new token
      queryClient.setQueryData(["spotify-token"], {
        ...tokenRecord,
        access_token: accessToken,
        expires_at: expiresAt,
      });

      return accessToken;
    } catch {
      return null;
    }
  };

  // Connect to Spotify (initiates OAuth flow)
  const connect = (returnPath?: string) => {
    initiateSpotifyAuth(returnPath);
  };

  // Disconnect from Spotify
  const disconnect = () => {
    disconnectMutation.mutate();
  };

  const state: SpotifyAuthState = {
    isConnected: !!tokenRecord && !isExpired,
    isLoading,
    accessToken: tokenRecord?.access_token ?? null,
    expiresAt: tokenRecord ? new Date(tokenRecord.expires_at) : null,
    error: fetchError?.message ?? null,
  };

  return {
    ...state,
    connect,
    disconnect,
    getValidToken,
    isDisconnecting: disconnectMutation.isPending,
  };
}
