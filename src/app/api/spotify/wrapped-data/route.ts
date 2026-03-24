import { NextRequest, NextResponse } from "next/server";
import { getTopArtists, getTopTracks, getPlaylistTracks, refreshAccessToken } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshToken = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const playlistId = request.nextUrl.searchParams.get("playlist_id") || "current";

  try {
    const data = await fetchWrappedData(accessToken, playlistId);
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TOKEN_EXPIRED" && refreshToken) {
      const tokenData = await refreshAccessToken(refreshToken);
      const data = await fetchWrappedData(tokenData.access_token, playlistId);
      const response = NextResponse.json(data);
      response.cookies.set("spotify_access_token", tokenData.access_token, {
        httpOnly: true, secure: false, sameSite: "lax", maxAge: tokenData.expires_in, path: "/",
      });
      return response;
    }
    console.error("Wrapped data error:", err);
    return NextResponse.json({ error: "Failed to fetch wrapped data" }, { status: 500 });
  }
}

interface TrackItem {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
}

interface ArtistItem {
  id: string;
  name: string;
  images: { url: string }[];
  genres: string[];
}

const TIME_RANGES = ["short_term", "medium_term", "long_term"];

async function fetchWrappedData(accessToken: string, playlistId: string) {
  if (TIME_RANGES.includes(playlistId)) {
    return fetchTimeRangeData(accessToken, playlistId);
  } else {
    return fetchPlaylistYearData(accessToken, playlistId);
  }
}

async function fetchTimeRangeData(accessToken: string, timeRange: string) {
  // Fetch top tracks and artists for the specified time range
  const [topTracksData, topArtistsData] = await Promise.all([
    getTopTracks(accessToken, timeRange, 50),
    getTopArtists(accessToken, timeRange, 50),
  ]);

  const tracks: TrackItem[] = topTracksData.items || [];
  const artists: ArtistItem[] = topArtistsData.items || [];

  // Top 5 tracks
  const top5Tracks = tracks.slice(0, 5).map((t: TrackItem) => ({
    name: t.name,
    artist: t.artists.map((a: { name: string }) => a.name).join(", "),
    albumImage: t.album?.images?.[0]?.url,
    duration_ms: t.duration_ms,
  }));

  // Top 5 artists
  const top5Artists = artists.slice(0, 5).map((a: ArtistItem) => ({
    name: a.name,
    trackCount: 0,
    image: a.images?.[0]?.url,
    genres: a.genres?.slice(0, 2) || [],
  }));

  // Extract top genres from all artists
  const genreCounts: Record<string, number> = {};
  for (const a of artists) {
    for (const g of (a.genres || [])) {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  const topTrack = tracks[0] || null;

  return {
    source: "api" as const,
    totalTracks: tracks.length,
    totalArtists: artists.length,
    topGenres,
    topTrack: topTrack ? {
      name: topTrack.name,
      artist: topTrack.artists.map((a: { name: string }) => a.name).join(", "),
      albumImage: topTrack.album?.images?.[0]?.url,
      duration_ms: topTrack.duration_ms,
    } : null,
    top5Tracks,
    top5Artists,
  };
}

async function fetchPlaylistYearData(accessToken: string, playlistId: string) {
  // Fetch all tracks from the playlist
  let tracks: TrackItem[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore && tracks.length < 200) {
    const data = await getPlaylistTracks(accessToken, playlistId, 100, offset);
    const items = (data.items || [])
      .map((item: { track: TrackItem | null }) => item.track)
      .filter((t: TrackItem | null): t is TrackItem => t !== null);
    tracks.push(...items);
    hasMore = data.next !== null;
    offset += 100;
  }

  // Derive artists from playlist tracks
  const artistCounts: Record<string, { name: string; count: number }> = {};
  for (const track of tracks) {
    for (const artist of track.artists) {
      if (!artistCounts[artist.id]) {
        artistCounts[artist.id] = { name: artist.name, count: 0 };
      }
      artistCounts[artist.id].count++;
    }
  }
  const sortedArtists = Object.values(artistCounts)
    .sort((a, b) => b.count - a.count);

  const uniqueArtists = new Set<string>();
  for (const track of tracks) {
    for (const artist of track.artists) {
      uniqueArtists.add(artist.id);
    }
  }

  const totalTracks = tracks.length;
  const totalMinutes = Math.round(tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / 60000);

  const topTrack = tracks[0] || null;

  const top5Tracks = tracks.slice(0, 5).map(t => ({
    name: t.name,
    artist: t.artists.map(a => a.name).join(", "),
    albumImage: t.album?.images?.[0]?.url,
    duration_ms: t.duration_ms,
  }));

  const top5Artists = sortedArtists.slice(0, 5).map(a => ({
    name: a.name,
    trackCount: a.count,
    image: undefined as string | undefined,
  }));

  return {
    source: "playlist" as const,
    totalTracks,
    totalMinutes,
    totalArtists: uniqueArtists.size,
    topTrack: topTrack ? {
      name: topTrack.name,
      artist: topTrack.artists.map(a => a.name).join(", "),
      albumImage: topTrack.album?.images?.[0]?.url,
      duration_ms: topTrack.duration_ms,
    } : null,
    top5Tracks,
    top5Artists,
  };
}
