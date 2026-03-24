import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?error=access_denied", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const tokenData = await getAccessToken(code);

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: tokenData.expires_in,
      path: "/",
    });

    response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? encodeURIComponent(err.message) : "unknown";
    return NextResponse.redirect(new URL(`/?error=${message}`, request.url));
  }
}
