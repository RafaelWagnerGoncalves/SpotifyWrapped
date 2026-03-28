import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/spotify";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const url = getAuthUrl(origin);
  return NextResponse.redirect(url);
}
