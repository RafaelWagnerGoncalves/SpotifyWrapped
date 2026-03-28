const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

// Increment this when scopes change to force users to re-authenticate
export const SCOPE_VERSION = "2";

const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    prompt: "consent", // Force re-authorization to get new scopes
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function getAccessToken(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${error}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh token");
  }

  return res.json();
}

// Typed error for Spotify API errors
export class SpotifyApiError extends Error {
  status: number;
  spotifyMessage: string;

  constructor(status: number, message: string) {
    super(`Spotify API error ${status}: ${message}`);
    this.status = status;
    this.spotifyMessage = message;
  }
}

// Rate limiting with exponential backoff and Retry-After support
async function fetchSpotifyWithRetry(
  endpoint: string,
  accessToken: string,
  retries = 3,
  baseDelay = 1000
): Promise<unknown> {
  const url = `${SPOTIFY_API_BASE}${endpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    // Success
    if (res.ok) {
      return res.json();
    }

    // Token expired - throw special error for upstream handling
    if (res.status === 401) {
      throw new Error("TOKEN_EXPIRED");
    }

    // Rate limited - respect Retry-After header
    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : baseDelay * Math.pow(2, attempt);

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
    }

    // Parse Spotify error response
    let errorMessage = `HTTP ${res.status}`;
    try {
      const errorBody = await res.json();
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message;
      } else if (errorBody.error_description) {
        errorMessage = errorBody.error_description;
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = res.statusText || errorMessage;
    }

    throw new SpotifyApiError(res.status, errorMessage);
  }

  throw new SpotifyApiError(500, "Max retries exceeded");
}

// Wrapper that handles token refresh automatically
export async function withTokenRefresh<T>(
  accessToken: string | undefined,
  refreshToken: string | undefined,
  operation: (token: string) => Promise<T>,
  onTokenRefreshed?: (newToken: string) => void
): Promise<T> {
  if (!accessToken) {
    throw new Error("TOKEN_EXPIRED");
  }

  try {
    return await operation(accessToken);
  } catch (err) {
    if (err instanceof Error && err.message === "TOKEN_EXPIRED" && refreshToken) {
      const tokenData = await refreshAccessToken(refreshToken);
      if (onTokenRefreshed) {
        onTokenRefreshed(tokenData.access_token);
      }
      return await operation(tokenData.access_token);
    }
    throw err;
  }
}

// Helper to check if user needs to re-authenticate due to scope changes
export function needsReauthentication(scopeVersionCookie: string | undefined): boolean {
  return !scopeVersionCookie || scopeVersionCookie !== SCOPE_VERSION;
}

async function fetchSpotify(endpoint: string, accessToken: string) {
  return fetchSpotifyWithRetry(endpoint, accessToken);
}

export async function getUserProfile(accessToken: string) {
  return fetchSpotify("/me", accessToken);
}

export async function getTopArtists(accessToken: string, timeRange = "medium_term", limit = 20) {
  return fetchSpotify(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, accessToken);
}

export async function getTopTracks(accessToken: string, timeRange = "medium_term", limit = 20) {
  return fetchSpotify(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, accessToken);
}

export async function getRecentlyPlayed(
  accessToken: string,
  limit = 20,
  cursors?: { after?: number; before?: number }
) {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (typeof cursors?.after === "number") {
    params.set("after", String(cursors.after));
  }

  if (typeof cursors?.before === "number") {
    params.set("before", String(cursors.before));
  }

  return fetchSpotify(`/me/player/recently-played?${params.toString()}`, accessToken);
}

export async function getUserPlaylists(accessToken: string, limit = 20, offset = 0) {
  return fetchSpotify(`/me/playlists?limit=${limit}&offset=${offset}`, accessToken);
}

export async function getSeveralArtists(accessToken: string, artistIds: string[]) {
  const ids = artistIds.filter(Boolean).slice(0, 50);

  if (ids.length === 0) {
    return { artists: [] };
  }

  return fetchSpotify(`/artists?ids=${ids.join(",")}`, accessToken);
}

// Use the current playlist-items route and keep both "track" and "item" fields for compatibility.
export async function getPlaylistItems(accessToken: string, playlistId: string, limit = 100, offset = 0) {
  return fetchSpotify(
    `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&additional_types=track&fields=items(added_at,track(id,name,artists(id,name),album(name,images),duration_ms),item(id,name,artists(id,name),album(name,images),duration_ms)),total,next`,
    accessToken
  );
}

// Keep old name for backward compatibility during migration
export async function getPlaylistTracks(accessToken: string, playlistId: string, limit = 100, offset = 0) {
  return getPlaylistItems(accessToken, playlistId, limit, offset);
}
