import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="animate-scale-in w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-accent">
            SongRank
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Rank your music through pairwise battles
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
