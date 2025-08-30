

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("github_token");
  const protectedPaths = ["/profile-analyzer", "/repository-analyzer", "/battle"];

  if (protectedPaths.includes(request.nextUrl.pathname) && !token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  return NextResponse.next();
}