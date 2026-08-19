"use client";

import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user } = useBrand();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">Settings</h1>
        <p className="mt-1 text-sm text-t2">Manage your account and preferences</p>
      </div>

      <div className="rounded-lg border border-b1 bg-c1 p-4">
        <div className="text-sm text-t2">Signed in as</div>
        <div className="text-base font-medium text-t1">{user?.email ?? "Unknown"}</div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={logout}
          className="rounded-lg bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red/90"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
