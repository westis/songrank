"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Mode = "sign_in" | "sign_up" | "forgot_password";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("sign_in");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback?provider=google`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "forgot_password") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/callback?type=recovery` }
      );
      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage(
          "Password reset email sent. Check your inbox and follow the link to reset your password."
        );
      }
      setLoading(false);
      return;
    }

    if (mode === "sign_up") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // User created but no session = email confirmation required
        setMessage(
          "Account created! Check your email for a confirmation link. You need to confirm your email before signing in."
        );
        setLoading(false);
        return;
      }

      // If session exists, user is auto-confirmed
      router.push("/");
      router.refresh();
      return;
    }

    // Sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-foreground-subtle">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email/password form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-surface p-6"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-foreground-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="you@example.com"
            />
          </div>

          {mode !== "forgot_password" && (
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-foreground-muted"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="Min. 6 characters"
              />
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        {message && (
          <div className="mt-3 rounded-lg border border-success/30 bg-success/10 p-3">
            <p className="text-sm text-success">{message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading
            ? mode === "sign_up"
              ? "Creating account..."
              : mode === "forgot_password"
                ? "Sending reset email..."
                : "Signing in..."
            : mode === "sign_up"
              ? "Create Account"
              : mode === "forgot_password"
                ? "Send Reset Link"
                : "Sign In"}
        </button>

        {/* Mode toggle links */}
        <div className="mt-4 space-y-2 text-center text-xs text-foreground-muted">
          {mode === "sign_in" && (
            <>
              <p>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("sign_up");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-accent hover:underline"
                >
                  Sign up
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </p>
            </>
          )}
          {mode === "sign_up" && (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("sign_in");
                  setError(null);
                  setMessage(null);
                }}
                className="text-accent hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === "forgot_password" && (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("sign_in");
                  setError(null);
                  setMessage(null);
                }}
                className="text-accent hover:underline"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
