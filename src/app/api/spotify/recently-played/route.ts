import { NextRequest, NextResponse } from "next/server";
import { getRecentlyPlayed, refreshAccessToken } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshToken = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

  try {
    const data = await getRecentlyPlayed(accessToken, limit);
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TOKEN_EXPIRED" && refreshToken) {
      const tokenData = await refreshAccessToken(refreshToken);
      const data = await getRecentlyPlayed(tokenData.access_token, limit);
      const response = NextResponse.json(data);
      response.cookies.set("spotify_access_token", tokenData.access_token, {
        httpOnly: true, secure: false, sameSite: "lax", maxAge: tokenData.expires_in, path: "/",
      });
      return response;
    }
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
