import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, SCOPE_VERSION } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?error=access_denied", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", origin));
  }

  try {
    const tokenData = await getAccessToken(code, origin);

    const response = NextResponse.redirect(new URL("/", origin));

    response.cookies.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: tokenData.expires_in,
      path: "/",
    });

    response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    // Store scope version to detect when we need to re-authenticate
    response.cookies.set("spotify_scope_version", SCOPE_VERSION, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? encodeURIComponent(err.message) : "unknown";
    return NextResponse.redirect(new URL(`/?error=${message}`, origin));
  }
}
