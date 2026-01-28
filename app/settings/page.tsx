import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="animate-fade-slide-up text-3xl font-bold tracking-tight">
        Settings
      </h1>
      <SettingsForm userEmail={user.email ?? ""} />
    </div>
  );
}
