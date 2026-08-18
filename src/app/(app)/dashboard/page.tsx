import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PlatformChart from "@/components/dashboard/platform-chart";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];
type Post = Database["public"]["Tables"]["posts"]["Row"];

const PCOL: Record<string, string> = {
  instagram: "#C13584",
  linkedin: "#0A66C2",
  twitter: "#1A8CD8",
  facebook: "#1877F2",
  tiktok: "#2FD6E0",
  youtube: "#CC0000",
};

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNumber(n: number | null | undefined) {
  const v = n || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(v);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

function statusColor(st: string) {
  switch (st) {
    case "published":
    case "approved":
    case "auto_approved":
      return "bg-grn/15 text-grn";
    case "pending_approval":
      return "bg-amb/15 text-amb";
    case "rejected":
      return "bg-red/15 text-red";
    case "scheduled":
      return "bg-blu/15 text-blu";
    default:
      return "bg-b2 text-t2";
  }
}

function PlatformBadge({ platform }: { platform: string }) {
  const m = (PCOL as Record<string, string>)[platform] || "#6C5CE7";
  const label = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "?";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white"
      style={{ backgroundColor: m }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${statusColor(status)}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orgMember } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!orgMember) {
    redirect("/brands");
  }

  const orgId = (orgMember as unknown as { organization_id: string }).organization_id;

  const [{ data: brands }, { data: posts }] = await Promise.all([
    supabase.from("brands").select("*").eq("organization_id", orgId).eq("is_active", true),
    supabase.from("posts").select("*").eq("organization_id", orgId),
  ]);

  const brandList = (brands || []) as unknown as Brand[];
  const postList = (posts || []) as unknown as Post[];
  const brand = brandList[0] || null;

  const { data: brandIntel } = brand
    ? await supabase.from("brand_intelligence").select("id").eq("brand_id", brand.id).maybeSingle()
    : { data: null };

  const brandPosts = brand ? postList.filter((p) => p.brand_id === brand.id) : [];
  const published = brandPosts.filter((p) => p.status === "published");
  const pending = brandPosts.filter((p) => p.status === "pending_approval");
  const avg = published.length
    ? (published.reduce((a, p) => a + (p.engagement_rate || 0), 0) / published.length).toFixed(1)
    : "0";

  if (!brand) {
    return (
      <div className="rounded-xl border border-b1 bg-c1 p-8 text-center">
        <div className="mb-4 text-4xl">◈</div>
        <div className="text-base font-semibold text-t1">No Brand Selected</div>
        <Link href="/brands" className="mt-4 inline-block rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white">
          Add Brand
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">{escapeHtml(brand.name)}</h1>
          <p className="mt-1 text-sm text-t2">
            {escapeHtml(brand.industry || "")} &nbsp;·&nbsp; {(brand.platforms || []).length} platforms active
          </p>
        </div>
        {brandIntel ? (
          <span className="rounded-md bg-grn/15 px-2.5 py-1 text-[11px] font-medium text-grn">
            ● AI Intelligence Active
          </span>
        ) : (
          <Link
            href="/pipeline"
            className="rounded-md border border-amb/30 bg-amb/10 px-2.5 py-1 text-[11px] font-medium text-amb"
          >
            ⚡ Run Pipeline First
          </Link>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mb-6 rounded-lg border border-amb/30 bg-amb/10 px-4 py-3 text-sm text-amb">
          <span className="font-semibold">{pending.length} posts waiting for approval.</span>{" "}
          <Link href="/approval" className="ml-2 rounded-md bg-amb/20 px-2 py-1 text-xs font-medium hover:bg-amb/30">
            Review Now →
          </Link>
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="text-xs text-t2">Total Posts</div>
          <div className="mt-1 text-2xl font-semibold text-acc2">{brandPosts.length}</div>
        </div>
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="text-xs text-t2">Published</div>
          <div className="mt-1 text-2xl font-semibold text-grn">{published.length}</div>
        </div>
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="text-xs text-t2">Pending Approval</div>
          <div className="mt-1 text-2xl font-semibold text-amb">{pending.length}</div>
        </div>
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="text-xs text-t2">Avg Engagement</div>
          <div className="mt-1 text-2xl font-semibold text-blu">{avg}%</div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-b1 bg-c1 p-5">
          <div className="mb-3 text-sm font-medium text-t1">Posts by Platform</div>
          <div className="h-[180px]">
            <PlatformChart platforms={brandPosts.map((p) => p.platform)} />
          </div>
        </div>

        <div className="rounded-xl border border-b1 bg-c1 p-5">
          <div className="mb-3 text-sm font-medium text-t1">Recent Activity</div>
          {brandPosts.length === 0 ? (
            <div className="flex min-h-[80px] items-center justify-center rounded-lg bg-c2 text-sm text-t2">
              Run the pipeline to generate your first posts
            </div>
          ) : (
            <div className="divide-y divide-b1">
              {brandPosts.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <PlatformBadge platform={p.platform} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-t1">{escapeHtml((p.content || "").slice(0, 55))}</div>
                    <div className="text-[10px] text-t2">{formatDate(p.scheduled_at || p.created_at)}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-b1 bg-c1 p-5">
        <div className="mb-3 text-sm font-medium text-t1">Top Performing Posts</div>
        {published.length === 0 ? (
          <div className="flex min-h-[60px] items-center justify-center rounded-lg bg-c2 text-sm text-t2">
            Publish posts to see performance here
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-b1 text-[10px] uppercase tracking-wide text-t2">
                <th className="pb-2 pl-2">Platform</th>
                <th className="pb-2">Content</th>
                <th className="pb-2">Reach</th>
                <th className="pb-2 pr-2">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {published
                .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
                .slice(0, 5)
                .map((p) => (
                  <tr key={p.id} className="border-b border-b1 last:border-0">
                    <td className="py-3 pl-2">
                      <PlatformBadge platform={p.platform} />
                    </td>
                    <td className="max-w-[220px] truncate py-3 text-t1">
                      {escapeHtml((p.content || "").slice(0, 55))}
                    </td>
                    <td className="py-3 text-t2">{formatNumber(p.reach)}</td>
                    <td className="py-3 pr-2 font-semibold text-grn">
                      {(p.engagement_rate || 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
