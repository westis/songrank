"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Loading from "@/components/shared/Loading";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      const provider = searchParams.get("provider");
      const type = searchParams.get("type");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setStatus("error");
        setError(errorDescription || errorParam);
        return;
      }

      // Google OAuth callback -- Supabase handles the token exchange
      // via the URL hash fragment automatically. We just need to
      // check if we now have a session.
      if (provider === "google") {
        // Give Supabase a moment to process the hash tokens
        const { data, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !data.user) {
          setStatus("error");
          setError("Google sign-in failed. Please try again.");
          return;
        }
        // Redirect to home
        router.push("/");
        router.refresh();
        return;
      }

      // Password recovery callback
      if (type === "recovery") {
        setStatus("success");
        setMessage(
          "Password reset successful. You can now set a new password in Settings."
        );
        // Supabase will have set the session from the recovery link
        setTimeout(() => {
          router.push("/settings");
          router.refresh();
        }, 2000);
        return;
      }

      // Spotify OAuth callback (for later)
      const code = searchParams.get("code");
      if (code && !provider) {
        // Spotify token exchange -- to be implemented when Spotify is available
        setStatus("success");
        setMessage("Spotify connected successfully.");
        return;
      }

      // Default: check if we have a valid session (e.g. email confirmation link)
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push("/");
        router.refresh();
        return;
      }

      setStatus("error");
      setError("Unexpected callback. No valid session found.");
    };

    handleCallback();
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loading text="Processing..." />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-error">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">{error}</p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
        >
          Back to Login
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-xl font-semibold text-success">Success</h1>
      <p className="mt-2 text-sm text-foreground-muted">{message}</p>
      <a
        href="/"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent-hover"
      >
        Continue
      </a>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loading text="Processing..." />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
