import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, refreshAccessToken } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshToken = request.cookies.get("spotify_refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    if (!accessToken && refreshToken) {
      const tokenData = await refreshAccessToken(refreshToken);
      accessToken = tokenData.access_token;

      const response = NextResponse.json({
        authenticated: true,
        user: await getUserProfile(accessToken!),
      });

      response.cookies.set("spotify_access_token", tokenData.access_token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: tokenData.expires_in,
        path: "/",
      });

      if (tokenData.refresh_token) {
        response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }

      return response;
    }

    const user = await getUserProfile(accessToken!);
    return NextResponse.json({ authenticated: true, user });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TOKEN_EXPIRED" && refreshToken) {
      try {
        const tokenData = await refreshAccessToken(refreshToken);
        const user = await getUserProfile(tokenData.access_token);

        const response = NextResponse.json({ authenticated: true, user });

        response.cookies.set("spotify_access_token", tokenData.access_token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: tokenData.expires_in,
          path: "/",
        });

        if (tokenData.refresh_token) {
          response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
          });
        }

        return response;
      } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
