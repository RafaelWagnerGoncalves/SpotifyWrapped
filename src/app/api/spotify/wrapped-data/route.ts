import { NextRequest, NextResponse } from "next/server";
import {
  getPlaylistTracks,
  getRecentlyPlayed,
  getSeveralArtists,
  refreshAccessToken,
} from "@/lib/spotify";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshToken = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const selectionId = request.nextUrl.searchParams.get("playlist_id") || "";

  try {
    const data = await fetchWrappedData(accessToken, selectionId);
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TOKEN_EXPIRED" && refreshToken) {
      const tokenData = await refreshAccessToken(refreshToken);
      const data = await fetchWrappedData(tokenData.access_token, selectionId);
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

interface SimpleArtist {
  id: string;
  name: string;
}

interface TrackItem {
  id: string;
  name: string;
  artists: SimpleArtist[];
  album: { name?: string; images?: { url: string }[] };
  duration_ms: number;
}

interface PlaylistEntry {
  added_at?: string | null;
  track?: TrackItem | null;
  item?: TrackItem | null;
}

interface RecentlyPlayedItem {
  played_at: string;
  track: TrackItem | null;
}

interface ArtistDetails {
  id: string;
  name: string;
  images?: { url: string }[];
  genres?: string[];
}

interface WrappedArtist {
  name: string;
  trackCount: number;
  image?: string;
  genres?: string[];
}

interface WrappedTrack {
  name: string;
  artist: string;
  albumImage?: string;
  duration_ms: number;
}

function isCurrentYearSelection(selectionId: string) {
  return selectionId.startsWith("current_year:");
}

function getTrackFromPlaylistEntry(entry: PlaylistEntry): TrackItem | null {
  return entry.track || entry.item || null;
}

function formatTrack(track: TrackItem): WrappedTrack {
  return {
    name: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    albumImage: track.album?.images?.[0]?.url,
    duration_ms: track.duration_ms,
  };
}

async function fetchArtistDetails(accessToken: string, artistIds: string[]) {
  const uniqueArtistIds = Array.from(new Set(artistIds.filter(Boolean)));
  const artistMap = new Map<string, ArtistDetails>();

  for (let i = 0; i < uniqueArtistIds.length; i += 50) {
    const batchIds = uniqueArtistIds.slice(i, i + 50);
    try {
      const result = await getSeveralArtists(accessToken, batchIds) as { artists?: ArtistDetails[] };

      for (const artist of result.artists || []) {
        if (artist?.id) {
          artistMap.set(artist.id, artist);
        }
      }
    } catch (error) {
      console.warn("Failed to fetch artist details batch for wrapped data:", error);
    }
  }

  return artistMap;
}

function buildGenreList(genreCounts: Record<string, number>) {
  return Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);
}

async function fetchWrappedData(accessToken: string, selectionId: string) {
  if (!selectionId) {
    throw new Error("Missing wrapped selection");
  }

  if (isCurrentYearSelection(selectionId)) {
    const year = Number(selectionId.split(":")[1]);
    return fetchCurrentYearData(accessToken, year);
  }

  return fetchPlaylistYearData(accessToken, selectionId);
}

async function fetchPlaylistYearData(accessToken: string, playlistId: string) {
  const tracks: TrackItem[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await getPlaylistTracks(accessToken, playlistId, 100, offset) as {
      items?: PlaylistEntry[];
      next?: string | null;
    };

    const pageTracks = (data.items || [])
      .map(getTrackFromPlaylistEntry)
      .filter((track): track is TrackItem => Boolean(track?.id));

    tracks.push(...pageTracks);
    hasMore = Boolean(data.next);
    offset += 100;
  }

  const artistMap = await fetchArtistDetails(
    accessToken,
    tracks.flatMap((track) => track.artists.map((artist) => artist.id))
  );

  const artistCounts: Record<string, { name: string; count: number }> = {};
  const genreCounts: Record<string, number> = {};

  for (const track of tracks) {
    for (const artist of track.artists) {
      if (!artistCounts[artist.id]) {
        artistCounts[artist.id] = { name: artist.name, count: 0 };
      }

      artistCounts[artist.id].count += 1;

      for (const genre of artistMap.get(artist.id)?.genres || []) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    }
  }

  const sortedArtists = Object.entries(artistCounts)
    .map(([artistId, data]) => ({ artistId, ...data }))
    .sort((a, b) => b.count - a.count);

  const totalMinutes = Math.round(
    tracks.reduce((sum, track) => sum + (track.duration_ms || 0), 0) / 60000
  );

  return {
    source: "playlist" as const,
    totalTracks: tracks.length,
    totalMinutes,
    totalArtists: sortedArtists.length,
    topGenres: buildGenreList(genreCounts),
    topTrack: tracks[0] ? formatTrack(tracks[0]) : null,
    top5Tracks: tracks.slice(0, 5).map(formatTrack),
    top5Artists: sortedArtists.slice(0, 5).map((artist): WrappedArtist => ({
      name: artist.name,
      trackCount: artist.count,
      image: artistMap.get(artist.artistId)?.images?.[0]?.url,
      genres: artistMap.get(artist.artistId)?.genres?.slice(0, 2) || [],
    })),
  };
}

async function fetchCurrentYearData(accessToken: string, year: number) {
  const startOfYear = Date.UTC(year, 0, 1, 0, 0, 0, 0);
  const now = Date.now();
  const plays: RecentlyPlayedItem[] = [];
  let before = now;
  let hasMore = true;

  while (hasMore) {
    const data = await getRecentlyPlayed(accessToken, 50, { before }) as {
      items?: RecentlyPlayedItem[];
      next?: string | null;
    };

    const items = data.items || [];

    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      const playedAtMs = item.played_at ? new Date(item.played_at).getTime() : 0;

      if (playedAtMs >= startOfYear) {
        plays.push(item);
      }
    }

    const oldestItem = items[items.length - 1];
    const oldestPlayedAtMs = oldestItem?.played_at ? new Date(oldestItem.played_at).getTime() : 0;

    if (!oldestPlayedAtMs || oldestPlayedAtMs < startOfYear) {
      break;
    }

    before = oldestPlayedAtMs - 1;
    hasMore = Boolean(data.next);
  }

  const trackCounts = new Map<string, { track: TrackItem; count: number }>();
  const artistCounts = new Map<string, { name: string; count: number }>();
  let totalMinutes = 0;

  for (const play of plays) {
    const track = play.track;

    if (!track?.id) {
      continue;
    }

    totalMinutes += (track.duration_ms || 0) / 60000;

    const existingTrack = trackCounts.get(track.id);
    if (existingTrack) {
      existingTrack.count += 1;
    } else {
      trackCounts.set(track.id, { track, count: 1 });
    }

    for (const artist of track.artists) {
      const existingArtist = artistCounts.get(artist.id);
      if (existingArtist) {
        existingArtist.count += 1;
      } else {
        artistCounts.set(artist.id, { name: artist.name, count: 1 });
      }
    }
  }

  const sortedTracks = Array.from(trackCounts.values()).sort((a, b) => b.count - a.count);
  const sortedArtists = Array.from(artistCounts.entries())
    .map(([artistId, artist]) => ({ artistId, ...artist }))
    .sort((a, b) => b.count - a.count);

  const artistMap = await fetchArtistDetails(accessToken, sortedArtists.map((artist) => artist.artistId));
  const genreCounts: Record<string, number> = {};

  for (const artist of sortedArtists) {
    for (const genre of artistMap.get(artist.artistId)?.genres || []) {
      genreCounts[genre] = (genreCounts[genre] || 0) + artist.count;
    }
  }

  return {
    source: "current_year" as const,
    totalTracks: sortedTracks.length,
    totalMinutes: Math.round(totalMinutes),
    totalArtists: sortedArtists.length,
    topGenres: buildGenreList(genreCounts),
    topTrack: sortedTracks[0] ? formatTrack(sortedTracks[0].track) : null,
    top5Tracks: sortedTracks.slice(0, 5).map(({ track }) => formatTrack(track)),
    top5Artists: sortedArtists.slice(0, 5).map((artist): WrappedArtist => ({
      name: artist.name,
      trackCount: artist.count,
      image: artistMap.get(artist.artistId)?.images?.[0]?.url,
      genres: artistMap.get(artist.artistId)?.genres?.slice(0, 2) || [],
    })),
  };
}
