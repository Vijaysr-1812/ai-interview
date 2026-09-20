import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/interview"];

// Routes that should redirect to home if already authenticated
const authRoutes = ["/sign-in", "/sign-up", "/verify-email"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get("session")?.value;

    // Allow static files, API routes, and Next.js internals
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/favicon") ||
        pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2)$/)
    ) {
        return NextResponse.next();
    }

    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
    );
    const isAuthRoute = authRoutes.some((route) => pathname === route);

    // If accessing a protected route without a session, redirect to sign-in
    if (isProtectedRoute && !sessionCookie) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(signInUrl);
    }

    // If accessing an auth route with an active session, redirect to home
    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
