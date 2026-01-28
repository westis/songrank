"use client";

import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";

interface SettingsFormProps {
  userEmail: string;
}

export default function SettingsForm({ userEmail }: SettingsFormProps) {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name]);

  const handleSave = () => {
    if (!displayName.trim()) return;
    updateProfile.mutate(
      { displayName: displayName.trim() },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  };

  return (
    <>
      {/* Account info */}
      <div className="animate-fade-slide-up stagger-1 mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Signed in as{" "}
          <span className="text-foreground">{userEmail}</span>
        </p>
      </div>

      {/* Display name */}
      <div className="animate-fade-slide-up stagger-2 mt-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Display Name</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          This name is shown to collaborators on shared projects.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={isLoading ? "Loading..." : "Enter your name"}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSave}
            disabled={
              updateProfile.isPending ||
              !displayName.trim() ||
              displayName.trim() === profile?.display_name
            }
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {updateProfile.isPending ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
        {updateProfile.isError && (
          <p className="mt-2 text-sm text-red-400">
            Failed to save. Make sure the user_profiles table exists (run the
            migration).
          </p>
        )}
      </div>

      {/* Spotify connection */}
      <div className="animate-fade-slide-up stagger-3 mt-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Spotify Connection</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Connect your Spotify account to enable playback during battles.
        </p>
        <button className="mt-4 rounded-lg bg-[#1DB954] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          Connect Spotify
        </button>
      </div>
    </>
  );
}
