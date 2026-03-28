import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, refreshAccessToken, needsReauthentication, SCOPE_VERSION } from "@/lib/spotify";

export async function GET(request: NextRequest) {
  let accessToken = request.cookies.get("spotify_access_token")?.value;
  const refreshToken = request.cookies.get("spotify_refresh_token")?.value;
  const scopeVersion = request.cookies.get("spotify_scope_version")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    // If we have a token, try to use it first before forcing re-auth
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

      // Set scope version cookie if missing (upgraded token)
      if (needsReauthentication(scopeVersion)) {
        response.cookies.set("spotify_scope_version", SCOPE_VERSION, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
        });
      }

      return response;
    }

    const user = await getUserProfile(accessToken!);
    const response = NextResponse.json({ authenticated: true, user });

    // Set scope version cookie if missing
    if (needsReauthentication(scopeVersion)) {
      response.cookies.set("spotify_scope_version", SCOPE_VERSION, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    return response;
  } catch (err: unknown) {
    // Only force re-auth if token is invalid/expired AND scopes changed
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

        // Set scope version on refresh too
        if (needsReauthentication(scopeVersion)) {
          response.cookies.set("spotify_scope_version", SCOPE_VERSION, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
          });
        }

        return response;
      } catch {
        // Refresh failed - check if we need scope upgrade
        if (needsReauthentication(scopeVersion)) {
          return NextResponse.json(
            { authenticated: false, reason: "scope_upgrade", currentVersion: SCOPE_VERSION },
            { status: 401 }
          );
        }
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }
    }

    // Check for scope upgrade only if we have no valid token at all
    if (needsReauthentication(scopeVersion)) {
      return NextResponse.json(
        { authenticated: false, reason: "scope_upgrade", currentVersion: SCOPE_VERSION },
        { status: 401 }
      );
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
