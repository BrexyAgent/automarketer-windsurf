import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import SessionProvider from "@/components/SessionProvider";
import { BrandProvider } from "@/components/brand-provider";
import "../globals.css";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: { session } } = await supabase.auth.getSession();

  const { data: orgMember } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, plan)")
    .eq("user_id", user.id)
    .single();

  const org = (orgMember as unknown as { organizations: { id: string; name: string; plan: string } } | null)?.organizations ?? null;
  const orgId = (orgMember as unknown as { organization_id: string } | null)?.organization_id ?? "";

  const { data: brandsData } = await supabase
    .from("brands")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true);
  const brands = (brandsData || []) as unknown as Brand[];

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar orgName={org?.name ?? "Organization"} userEmail={user.email ?? ""} brands={brands} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar brands={brands} />
        <div className="flex-1 overflow-y-auto p-6">
          <BrandProvider user={user} brands={brands} orgId={orgId}>
            <SessionProvider session={session}>{children}</SessionProvider>
          </BrandProvider>
        </div>
      </main>
    </div>
  );
}
