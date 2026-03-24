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
  type: "playlist" | "timerange";
}

async function fetchWrappedYears(accessToken: string) {
  const allPlaylists: { id: string; name: string; owner?: { id: string; display_name?: string }; images: { url: string }[]; tracks: { total: number } }[] = [];
  let offset = 0;
  const limit = 50;
  let apiTotal = Infinity;

  while (offset < apiTotal) {
    const data = await getUserPlaylists(accessToken, limit, offset);
    apiTotal = data.total || 0;
    const items = (data.items || []).filter((item: unknown) => item !== null);
    console.log(`[wrapped-years] offset=${offset}: items=${data.items?.length}, non-null=${items.length}, apiTotal=${apiTotal}, next=${data.next ? 'YES' : 'NULL'}`);
    allPlaylists.push(...items);
    offset += limit;
    if (!data.items || data.items.length === 0) break;
  }
  console.log(`[wrapped-years] Total collected: ${allPlaylists.length} playlists (API total: ${apiTotal})`);

  // Time-range options (always available)
  const timeRangeOptions: WrappedOption[] = [
    { playlistId: "short_term", trackCount: 0, label: "Last 4 Weeks", subtitle: "Your recent favorites", type: "timerange" },
    { playlistId: "medium_term", trackCount: 0, label: "Last 6 Months", subtitle: "Your mid-year wrapped", type: "timerange" },
    { playlistId: "long_term", trackCount: 0, label: "All Time", subtitle: "Your all-time favorites", type: "timerange" },
  ];

  // All user playlists as options
  const playlistOptions: WrappedOption[] = allPlaylists
    .filter(pl => pl && pl.name)
    .map(pl => ({
      playlistId: pl.id,
      trackCount: pl.tracks?.total || 0,
      image: pl.images?.[0]?.url,
      label: pl.name,
      subtitle: `${pl.tracks?.total || 0} tracks · ${pl.owner?.display_name || pl.owner?.id || "Unknown"}`,
      type: "playlist" as const,
    }));

  return { timeRangeOptions, playlistOptions };
}
