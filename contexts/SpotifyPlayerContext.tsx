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

  // Reset state when disconnected
  useEffect(() => {
    if (!isConnected) {
      // Clean up existing player
      if (playerRef.current) {
        console.log("Disconnecting Spotify player...");
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      // Reset state
      setState({
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
    }
  }, [isConnected]);

  // Define initializePlayer BEFORE the useEffect that uses it
  const initializePlayer = useCallback(async () => {
    if (playerRef.current) return;

    const token = await getValidToken();
    if (!token) {
      setState((prev) => ({ ...prev, error: "No access token available" }));
      return;
    }

    console.log("Initializing Spotify player...");

    const player = new window.Spotify.Player({
      name: "SongRank Player",
      getOAuthToken: async (cb) => {
        const freshToken = await getValidToken();
        cb(freshToken || "");
      },
      volume: 0.5,
    });

    playerRef.current = player;

    // Track if we've received the ready event
    let hasReceivedReady = false;

    // Error handling
    player.addListener("initialization_error", ({ message }) => {
      console.error("Spotify initialization error:", message);
      setState((prev) => ({ ...prev, error: `Initialization error: ${message}` }));
    });

    player.addListener("authentication_error", ({ message }) => {
      console.error("Spotify authentication error:", message);
      setState((prev) => ({ ...prev, error: `Authentication error: ${message}` }));
    });

    player.addListener("account_error", ({ message }) => {
      console.error("Spotify account error:", message);
      setState((prev) => ({
        ...prev,
        error: `Spotify Premium required for playback`,
        isPremium: false,
      }));
    });

    player.addListener("playback_error", ({ message }) => {
      console.error("Playback error:", message);
    });

    // Ready
    player.addListener("ready", ({ device_id }) => {
      console.log("Spotify Player ready with device ID:", device_id);
      hasReceivedReady = true;
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

    // Connect player with timeout
    console.log("Connecting to Spotify...");
    try {
      // Race between connect() and a timeout
      const connectPromise = player.connect();
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error("Connection timeout")), 15000);
      });

      const connected = await Promise.race([connectPromise, timeoutPromise]);
      console.log("Spotify connect result:", connected);

      if (!connected) {
        setState((prev) => ({ ...prev, error: "Failed to connect to Spotify" }));
        return;
      }
    } catch (connectError) {
      console.error("Spotify connect error:", connectError);
      setState((prev) => ({
        ...prev,
        error: connectError instanceof Error && connectError.message === "Connection timeout"
          ? "Spotify connection timed out. Try refreshing the page."
          : "Failed to connect to Spotify player"
      }));
      return;
    }

    // Timeout: if we don't get "ready" within 10 seconds after connect, show error
    setTimeout(() => {
      if (!hasReceivedReady && playerRef.current === player) {
        console.error("Spotify player timeout - never received ready event");
        setState((prev) => {
          // Only set error if we don't already have one
          if (prev.error) return prev;
          return {
            ...prev,
            error: "Spotify Premium required for web playback. Use the Spotify link on each song instead.",
            isPremium: false,
          };
        });
      }
    }, 10000);
  }, [getValidToken]);

  // Load Spotify SDK script and initialize player
  useEffect(() => {
    if (!isConnected) return;

    // Small delay to ensure clean state after reconnection
    const initTimeout = setTimeout(() => {
      // Check if script already loaded
      if (window.Spotify) {
        initializePlayer();
        return;
      }

      // Define callback before loading script
      window.onSpotifyWebPlaybackSDKReady = () => {
        initializePlayer();
      };

      // Check if script element already exists
      if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
        // Load SDK script
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
    };
  }, [isConnected, initializePlayer]);

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
