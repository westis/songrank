"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { User, SupabaseClient } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<SupabaseClient | null>(null);

  // Lazily create the Supabase client on the browser only
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      setClient(supabase);

      supabase.auth.getUser().then(({ data }) => setUser(data.user));

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    if (client) {
      await client.auth.signOut();
    }
  }, [client]);

  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center border-b border-border bg-surface/80 px-6 backdrop-blur-md">
      <Link
        href="/"
        className="mr-8 text-lg font-bold tracking-tight text-accent"
      >
        SongRank
      </Link>

      {user && (
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            Projects
          </Link>
          <Link
            href="/settings"
            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            Settings
          </Link>
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        {user ? (
          <>
            <span className="text-xs text-foreground-subtle">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:border-accent hover:text-accent"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-accent-hover"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
