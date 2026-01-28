// Spotify OAuth with PKCE flow utilities

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
];

/**
 * Generate a random code verifier for PKCE
 * Must be between 43-128 characters, using unreserved URI characters
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64 URL encode (RFC 4648)
 */
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Build the Spotify authorization URL
 */
export function buildAuthUrl(codeChallenge: string, state?: string): string {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Spotify client ID or redirect URI not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    show_dialog: "true",
  });

  if (state) {
    params.set("state", state);
  }

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Store PKCE verifier in sessionStorage (survives redirect)
 */
export function storeCodeVerifier(verifier: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("spotify_code_verifier", verifier);
  }
}

/**
 * Retrieve and clear PKCE verifier from sessionStorage
 */
export function retrieveCodeVerifier(): string | null {
  if (typeof window !== "undefined") {
    const verifier = sessionStorage.getItem("spotify_code_verifier");
    sessionStorage.removeItem("spotify_code_verifier");
    return verifier;
  }
  return null;
}

/**
 * Initiate Spotify OAuth flow with PKCE
 */
export async function initiateSpotifyAuth(returnPath?: string): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Store verifier for callback
  storeCodeVerifier(verifier);

  // Store return path if provided
  if (returnPath && typeof window !== "undefined") {
    sessionStorage.setItem("spotify_return_path", returnPath);
  }

  // Redirect to Spotify
  const authUrl = buildAuthUrl(challenge);
  window.location.href = authUrl;
}

/**
 * Get stored return path after OAuth callback
 */
export function getReturnPath(): string {
  if (typeof window !== "undefined") {
    const path = sessionStorage.getItem("spotify_return_path");
    sessionStorage.removeItem("spotify_return_path");
    return path || "/settings";
  }
  return "/settings";
}
