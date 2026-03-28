import { NextRequest, NextResponse } from "next/server";
import { fetchSpotifyPage, getUserPlaylists, refreshAccessToken } from "@/lib/spotify";

interface PlaylistApiItem {
  id: string;
  name?: string;
  owner?: { id?: string; display_name?: string };
  images?: { url: string }[];
  tracks?: { total?: number };
  items?: { total?: number };
}

function normalizePlaylist(item: PlaylistApiItem) {
  return {
    ...item,
    tracks: {
      total: item.tracks?.total ?? item.items?.total ?? 0,
    },
  };
}

async function fetchAllPlaylists(accessToken: string) {
  const allItems: PlaylistApiItem[] = [];
  let nextUrl: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";
  let total = 0;

  while (nextUrl) {
    const data = (
      nextUrl.startsWith("http")
        ? await fetchSpotifyPage(nextUrl, accessToken)
        : await getUserPlaylists(accessToken, 50, 0)
    ) as { total?: number; items?: PlaylistApiItem[]; next?: string | null };

    total = data.total || total;
    const items = (data.items || []).filter((item): item is PlaylistApiItem => Boolean(item?.id));
    allItems.push(...items.map(normalizePlaylist));
    nextUrl = data.next || null;
  }

  const firstItem = allItems[0];
  console.log("[DEBUG] Total playlists:", allItems.length, "API total:", total);
  console.log("[DEBUG] First playlist:", firstItem?.name, "tracks:", firstItem?.tracks);

  return { items: allItems, total: allItems.length, apiTotal: total };
}

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshToken = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await fetchAllPlaylists(accessToken);
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TOKEN_EXPIRED" && refreshToken) {
      const tokenData = await refreshAccessToken(refreshToken);
      const data = await fetchAllPlaylists(tokenData.access_token);
      const response = NextResponse.json(data);
      response.cookies.set("spotify_access_token", tokenData.access_token, {
        httpOnly: true, secure: false, sameSite: "lax", maxAge: tokenData.expires_in, path: "/",
      });
      return response;
    }
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
