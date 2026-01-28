"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";

// Spotify SDK types are defined in types/spotify-sdk.d.ts

interface SpotifyPlayerState {
  isReady: boolean;
  isPremium: boolean | null;
  deviceId: string | null;
  currentTrack: {
    uri: string;
    name: string;
    artist: string;
    album: string;
    albumArtUrl: string | null;
    duration: number;
  } | null;
  position: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  error: string | null;
}

interface SpotifyPlayerContextValue extends SpotifyPlayerState {
  play: (spotifyUri: string, positionMs?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePlay: () => Promise<void>;
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextValue | null>(null);

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error("useSpotifyPlayer must be used within SpotifyPlayerProvider");
  }
  return context;
}

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const { isConnected, getValidToken } = useSpotifyAuth();
  const playerRef = useRef<Spotify.Player | null>(null);
  const [state, setState] = useState<SpotifyPlayerState>({
    isReady: false,
    isPremium: null,
    deviceId: null,
    currentTrack: null,
    position: 0,
    duration: 0,
    isPlaying: false,
    volume: 0.5,
    error: null,
  });

  // Load Spotify SDK script
  useEffect(() => {
    if (!isConnected) return;

    // Check if script already loaded
    if (window.Spotify) {
      initializePlayer();
      return;
    }

    // Define callback before loading script
    window.onSpotifyWebPlaybackSDKReady = initializePlayer;

    // Load SDK script
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [isConnected]);

  const initializePlayer = useCallback(async () => {
    if (playerRef.current) return;

    const token = await getValidToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: "No access token available" }));
      return;
    }

    const player = new window.Spotify.Player({
      name: "SongRank Player",
      getOAuthToken: async (cb) => {
        const freshToken = await getValidToken();
        cb(freshToken || "");
      },
      volume: 0.5,
    });

    playerRef.current = player;

    // Error handling
    player.addListener("initialization_error", ({ message }) => {
      setState((prev) => ({ ...prev, error: `Initialization error: ${message}` }));
    });

    player.addListener("authentication_error", ({ message }) => {
      setState((prev) => ({ ...prev, error: `Authentication error: ${message}` }));
    });

    player.addListener("account_error", ({ message }) => {
      setState((prev) => ({
        ...prev,
        error: `Account error: ${message}`,
        isPremium: false,
      }));
    });

    player.addListener("playback_error", ({ message }) => {
      console.error("Playback error:", message);
    });

    // Ready
    player.addListener("ready", ({ device_id }) => {
      console.log("Spotify Player ready with device ID:", device_id);
      setState((prev) => ({
        ...prev,
        isReady: true,
        deviceId: device_id,
        isPremium: true,
        error: null,
      }));
    });

    // Not ready
    player.addListener("not_ready", ({ device_id }) => {
      console.log("Device ID has gone offline:", device_id);
      setState((prev) => ({ ...prev, isReady: false, deviceId: null }));
    });

    // State change
    player.addListener("player_state_changed", (playerState) => {
      if (!playerState) {
        setState((prev) => ({
          ...prev,
          currentTrack: null,
          isPlaying: false,
          position: 0,
          duration: 0,
        }));
        return;
      }

      const track = playerState.track_window.current_track;
      setState((prev) => ({
        ...prev,
        currentTrack: track
          ? {
              uri: track.uri,
              name: track.name,
              artist: track.artists.map((a) => a.name).join(", "),
              album: track.album.name,
              albumArtUrl: track.album.images[0]?.url || null,
              duration: track.duration_ms,
            }
          : null,
        position: playerState.position,
        duration: playerState.duration,
        isPlaying: !playerState.paused,
      }));
    });

    // Connect player
    const connected = await player.connect();
    if (!connected) {
      setState((prev) => ({ ...prev, error: "Failed to connect to Spotify" }));
    }
  }, [getValidToken]);

  // Position tracking interval
  useEffect(() => {
    if (!state.isPlaying) return;

    const interval = setInterval(async () => {
      if (playerRef.current) {
        const currentState = await playerRef.current.getCurrentState();
        if (currentState) {
          setState((prev) => ({ ...prev, position: currentState.position }));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isPlaying]);

  // Play a track
  const play = useCallback(
    async (spotifyUri: string, positionMs = 0) => {
      const token = await getValidToken();
      if (!token || !state.deviceId) return;

      try {
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [spotifyUri],
              position_ms: positionMs,
            }),
          }
        );
      } catch (err) {
        console.error("Play error:", err);
      }
    },
    [getValidToken, state.deviceId]
  );

  // Pause
  const pause = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.pause();
    }
  }, []);

  // Resume
  const resume = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.resume();
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.togglePlay();
    }
  }, []);

  // Seek
  const seek = useCallback(async (positionMs: number) => {
    if (playerRef.current) {
      await playerRef.current.seek(positionMs);
    }
  }, []);

  // Set volume
  const setVolumeHandler = useCallback(async (volume: number) => {
    if (playerRef.current) {
      await playerRef.current.setVolume(volume);
      setState((prev) => ({ ...prev, volume }));
    }
  }, []);

  const value: SpotifyPlayerContextValue = {
    ...state,
    play,
    pause,
    resume,
    seek,
    setVolume: setVolumeHandler,
    togglePlay,
  };

  return (
    <SpotifyPlayerContext.Provider value={value}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}
