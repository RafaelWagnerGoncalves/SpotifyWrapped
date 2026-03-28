import { NextRequest, NextResponse } from "next/server";
import { getUserPlaylists, refreshAccessToken } from "@/lib/spotify";

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
  let offset = 0;
  const limit = 50;
  let total = Infinity;

  while (offset < total) {
    const data = await getUserPlaylists(accessToken, limit, offset) as { total?: number; items?: PlaylistApiItem[] };
    total = data.total || 0;
    const items = (data.items || []).filter((item): item is PlaylistApiItem => Boolean(item?.id));
    allItems.push(...items.map(normalizePlaylist));
    offset += limit;
    if (!data.items || data.items.length === 0) break;
  }

  const firstItem = allItems[0];
  console.log("[DEBUG] Total playlists:", allItems.length, "API total:", total);
  console.log("[DEBUG] First playlist:", firstItem?.name, "tracks:", firstItem?.tracks);

  return { items: allItems, total: allItems.length };
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
