import { NextRequest, NextResponse } from "next/server";

function clearCookies(response: NextResponse) {
  response.cookies.set("spotify_access_token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("spotify_refresh_token", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("spotify_scope_version", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearCookies(response);
  return response;
}

export async function GET() {
  // Force redirect to 127.0.0.1 to avoid localhost cookie domain issues
  const response = NextResponse.redirect(new URL("http://127.0.0.1:3000/"));
  clearCookies(response);
  return response;
}
