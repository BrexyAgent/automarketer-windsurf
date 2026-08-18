import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name, plan)")
    .eq("user_id", user.id)
    .single();

  const org = (member as any)?.organizations ?? null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">Profile</h1>
        <p className="mt-1 text-sm text-t2">Account and organization information</p>
      </div>
      <div className="rounded-xl border border-b1 bg-c1 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-[10px] font-semibold uppercase text-t2">Email</div>
            <div className="mt-1 text-sm text-t1">{user.email}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-t2">Organization</div>
            <div className="mt-1 text-sm text-t1">{org?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-t2">Plan</div>
            <div className="mt-1 text-sm text-t1">{org?.plan ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase text-t2">Role</div>
            <div className="mt-1 text-sm text-t1">{(member as any)?.role ?? "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
