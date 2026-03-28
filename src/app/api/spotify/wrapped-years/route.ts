import { NextRequest, NextResponse } from "next/server";
import { getUserPlaylists, refreshAccessToken } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshToken = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await fetchWrappedYears(accessToken);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TOKEN_EXPIRED" && refreshToken) {
      const tokenData = await refreshAccessToken(refreshToken);
      const result = await fetchWrappedYears(tokenData.access_token);
      const response = NextResponse.json(result);
      response.cookies.set("spotify_access_token", tokenData.access_token, {
        httpOnly: true, secure: false, sameSite: "lax", maxAge: tokenData.expires_in, path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

interface WrappedOption {
  playlistId: string;
  trackCount: number;
  image?: string;
  label: string;
  subtitle: string;
  type: "playlist" | "current_year";
}

interface PlaylistSummary {
  id: string;
  name: string;
  owner?: { id?: string; display_name?: string };
  images?: { url: string }[];
  tracks?: { total?: number };
  items?: { total?: number };
}

function getPlaylistTrackTotal(playlist: PlaylistSummary) {
  return playlist.tracks?.total ?? playlist.items?.total ?? 0;
}

function extractYear(name: string) {
  const match = name.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function isSpotifyOwnedPlaylist(playlist: PlaylistSummary) {
  const ownerId = playlist.owner?.id?.toLowerCase() || "";
  const ownerName = playlist.owner?.display_name?.toLowerCase() || "";

  return ownerId.includes("spotify") || ownerName.includes("spotify");
}

function isYearWrappedPlaylist(playlist: PlaylistSummary) {
  if (!playlist.name) {
    return false;
  }

  const lowerName = playlist.name.toLowerCase();
  const year = extractYear(playlist.name);
  const yearlyMarkers = [
    "your top songs",
    "top songs",
    "wrapped",
    "as tuas musicas mais ouvidas",
    "as tuas músicas mais ouvidas",
    "as musicas que voce mais ouviu",
    "as músicas que você mais ouviu",
    "as mais tocadas no seu",
    "o teu top de",
    "retrospectiva",
    "flashback",
  ];

  return Boolean(
    year &&
    isSpotifyOwnedPlaylist(playlist) &&
    yearlyMarkers.some((marker) => lowerName.includes(marker))
  );
}

async function fetchWrappedYears(accessToken: string) {
  const allPlaylists: PlaylistSummary[] = [];
  let offset = 0;
  const limit = 50;
  let apiTotal = Infinity;

  while (offset < apiTotal) {
    const data = await getUserPlaylists(accessToken, limit, offset) as {
      total?: number;
      items?: PlaylistSummary[];
    };

    apiTotal = data.total || 0;
    allPlaylists.push(...(data.items || []).filter(Boolean));
    offset += limit;

    if (!data.items || data.items.length === 0) {
      break;
    }
  }

  const currentYear = new Date().getFullYear();

  const currentYearOption: WrappedOption = {
    playlistId: `current_year:${currentYear}`,
    trackCount: 0,
    label: `${currentYear} Wrapped`,
    subtitle: `Based on your listening from January 1, ${currentYear} until today`,
    type: "current_year",
  };

  const yearOptions: WrappedOption[] = allPlaylists
    .filter(isYearWrappedPlaylist)
    .map((playlist) => {
      const year = extractYear(playlist.name) || currentYear;

        return {
          playlistId: playlist.id,
          trackCount: getPlaylistTrackTotal(playlist),
          image: playlist.images?.[0]?.url,
          label: `${year} Wrapped`,
          subtitle: `${playlist.name} · ${getPlaylistTrackTotal(playlist)} tracks`,
          type: "playlist" as const,
        };
      })
    .sort((a, b) => Number(b.label.slice(0, 4)) - Number(a.label.slice(0, 4)));

  const playlistOptions: WrappedOption[] = allPlaylists
    .filter((playlist) => playlist?.name && !isYearWrappedPlaylist(playlist))
    .map((playlist) => ({
      playlistId: playlist.id,
      trackCount: getPlaylistTrackTotal(playlist),
      image: playlist.images?.[0]?.url,
      label: playlist.name,
      subtitle: `${getPlaylistTrackTotal(playlist)} tracks · ${playlist.owner?.display_name || playlist.owner?.id || "Unknown"}`,
      type: "playlist" as const,
    }));

  return { currentYearOption, yearOptions, playlistOptions };
}
