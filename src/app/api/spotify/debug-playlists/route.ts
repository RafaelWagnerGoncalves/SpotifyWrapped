import { NextRequest, NextResponse } from "next/server";
import { getUserPlaylists, refreshAccessToken } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshToken = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await debugPlaylists(accessToken);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TOKEN_EXPIRED" && refreshToken) {
      const tokenData = await refreshAccessToken(refreshToken);
      const result = await debugPlaylists(tokenData.access_token);
      const response = NextResponse.json(result);
      response.cookies.set("spotify_access_token", tokenData.access_token, {
        httpOnly: true, secure: false, sameSite: "lax", maxAge: tokenData.expires_in, path: "/",
      });
      return response;
    }
    return NextResponse.json({ error: "Failed to fetch", details: String(err) }, { status: 500 });
  }
}

async function debugPlaylists(accessToken: string) {
  // Direct raw fetch to Spotify - bypass all wrappers
  const rawRes = await fetch("https://api.spotify.com/v1/me/playlists?limit=3&offset=0", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const rawJson = await rawRes.json();

  // Also fetch via our wrapper for comparison
  const wrapperData = await getUserPlaylists(accessToken, 3, 0);

  // Extract first item from each for comparison
  const rawFirst = rawJson.items?.[0] ? {
    name: rawJson.items[0].name,
    tracks: rawJson.items[0].tracks,
    items: rawJson.items[0].items,
  } : null;

  const wrapperFirst = wrapperData.items?.[0] ? {
    name: wrapperData.items[0].name,
    tracks: wrapperData.items[0].tracks,
    items: wrapperData.items[0].items,
  } : null;

  // Full pagination using raw fetch
  const allPlaylists: { name: string; id: string; owner: string; trackCount: number }[] = [];
  let offset = 0;
  const limit = 50;
  let apiTotal = Infinity;

  while (offset < apiTotal) {
    const res = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const data = await res.json();
    apiTotal = data.total || 0;

    for (const pl of (data.items || [])) {
      if (pl) {
        allPlaylists.push({
          name: pl.name,
          id: pl.id,
          owner: pl.owner?.display_name || pl.owner?.id || "unknown",
          trackCount: pl.tracks?.total || 0,
        });
      }
    }

    offset += limit;
    if (!data.items || data.items.length === 0) break;
  }

  return {
    apiTotal,
    collectedTotal: allPlaylists.length,
    comparison: {
      rawTotal: rawJson.total,
      wrapperTotal: wrapperData.total,
      rawFirstPlaylist: rawFirst,
      wrapperFirstPlaylist: wrapperFirst,
    },
    playlists: allPlaylists,
  };
}
