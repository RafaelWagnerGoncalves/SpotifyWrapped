const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

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
    show_dialog: "true",
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

async function fetchSpotify(endpoint: string, accessToken: string) {
  const res = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new Error("TOKEN_EXPIRED");
  }

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Spotify API error: ${error}`);
  }

  return res.json();
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

export async function getRecentlyPlayed(accessToken: string, limit = 20) {
  return fetchSpotify(`/me/player/recently-played?limit=${limit}`, accessToken);
}

export async function getUserPlaylists(accessToken: string, limit = 20, offset = 0) {
  return fetchSpotify(`/me/playlists?limit=${limit}&offset=${offset}`, accessToken);
}

export async function getPlaylistTracks(accessToken: string, playlistId: string, limit = 100, offset = 0) {
  return fetchSpotify(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(track(id,name,artists(id,name),album(name,images),duration_ms)),total,next`, accessToken);
}
