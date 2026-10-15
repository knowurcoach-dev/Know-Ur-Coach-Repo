"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: "PARENT" | "COACH" | "ADMIN";
}

/**
 * AuthGuard — client-side route protection.
 * Wraps dashboard layouts to enforce authentication + role-based access.
 * The proxy.ts file handles server-side redirects; this is a backup
 * that also handles cases where the session state changes client-side.
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && Boolean(session?.user);
  const userRole = (session?.user as any)?.role || "GUEST";

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const loginUrl = requiredRole === "ADMIN" ? "/admin/login" : "/login";
      router.replace(`${loginUrl}?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Strict role check: only ADMIN can access ADMIN routes; ADMIN can also inspect parent/coach dashboards
    const isAllowed = userRole === requiredRole || (requiredRole !== "ADMIN" && userRole === "ADMIN");
    if (!isAllowed) {
      // Wrong role — redirect to their respective portal
      if (userRole === "PARENT") router.replace("/parent/bookings");
      else if (userRole === "COACH") router.replace("/coach/dashboard");
      else if (userRole === "ADMIN") router.replace("/admin");
      else router.replace(requiredRole === "ADMIN" ? "/admin/login" : "/login");
    }
  }, [isLoading, isAuthenticated, userRole, requiredRole, router, pathname]);

  // Show spinner while resolving session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse">
            <span className="text-xl">🎯</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin w-4 h-4 text-violet-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm text-slate-500">Loading…</span>
          </div>
        </div>
      </div>
    );
  }

  // Correct role or platform Admin — render children
  if (isAuthenticated && (userRole === requiredRole || userRole === "ADMIN")) {
    return <>{children}</>;
  }

  // Rendering nothing while redirect is in progress
  return null;
}
