import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await decrypt(request.cookies.get("session")?.value);

  const homeFor = (role: string) => (role === "CUSTOMER" ? "/dashboard" : "/staff");

  if (!session) {
    if (pathname.startsWith("/staff") || pathname.startsWith("/dashboard") || pathname === "/change-password") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (session.mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  if (!session.mustChangePassword && pathname === "/change-password") {
    return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  }

  if (pathname.startsWith("/staff") && session.role === "CUSTOMER") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard") && session.role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/staff", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
