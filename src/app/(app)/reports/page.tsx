"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";

type Report = Database["public"]["Tables"]["weekly_reports"]["Row"];
type Post = Database["public"]["Tables"]["posts"]["Row"];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
  } catch {
    return d;
  }
}

export default function ReportsPage() {
  const supabase = createClient();
  const { brand, orgId } = useBrand();
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!brand || !orgId) return;
    setLoading(true);
    try {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("posts").select("*").eq("organization_id", orgId).eq("brand_id", brand.id),
        supabase
          .from("weekly_reports")
          .select("*")
          .eq("organization_id", orgId)
          .eq("brand_id", brand.id)
          .order("week_start", { ascending: false }),
      ]);
      setPosts((p || []) as unknown as Post[]);
      setReports((r || []) as unknown as Report[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [brand]);

  async function generateReport() {
    if (!orgId || !brand) {
      alert("No active brand found.");
      return;
    }
    setLoading(true);
    try {
      const today = new Date();
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      const weekEnd = today;
      const startISO = weekStart.toISOString();
      const endISO = weekEnd.toISOString();

      const published = posts.filter((p) => {
        if (p.status !== "published") return false;
        const d = new Date((p as any).published_at || p.scheduled_at || p.created_at || 0);
        return d >= weekStart && d <= weekEnd;
      });

      const totalPosts = published.length;
      const totalReach = published.reduce((a, p) => a + (p.reach || 0), 0);
      const totalLikes = published.reduce((a, p) => a + (p.likes || 0), 0);
      const totalComments = published.reduce((a, p) => a + (((p as any).comments || 0) as number), 0);
      const totalReposts = published.reduce(
        (a, p) => a + (((p as any).reposts || (p as any).shares || 0) as number),
        0
      );

      const byPlatform: Record<
        string,
        { posts: number; reach: number; likes: number; comments: number; reposts: number; engagement: number }
      > = {};
      for (const p of published) {
        const plat = p.platform || "unknown";
        if (!byPlatform[plat]) byPlatform[plat] = { posts: 0, reach: 0, likes: 0, comments: 0, reposts: 0, engagement: 0 };
        byPlatform[plat].posts++;
        byPlatform[plat].reach += p.reach || 0;
        byPlatform[plat].likes += p.likes || 0;
        byPlatform[plat].comments += ((p as any).comments || 0) as number;
        byPlatform[plat].reposts += ((p as any).reposts || (p as any).shares || 0) as number;
        byPlatform[plat].engagement += p.engagement_rate || 0;
      }

      let bestPlatform = "";
      let bestValue = 0;
      for (const [k, v] of Object.entries(byPlatform)) {
        const score = v.engagement / (v.posts || 1);
        if (score > bestValue) {
          bestValue = score;
          bestPlatform = k;
        }
      }

      const avgEngagement = totalPosts
        ? (published.reduce((a, p) => a + (p.engagement_rate || 0), 0) / totalPosts).toFixed(1)
        : "0";
      const topPosts = [...published]
        .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
        .slice(0, 3);

      const platformLines = Object.entries(byPlatform)
        .map(([k, v]) => {
          const avg = v.posts ? (v.engagement / v.posts).toFixed(1) : "0";
          return `- ${k}: ${v.posts} posts, reach ${v.reach}, likes ${v.likes}, comments ${v.comments}, reposts ${v.reposts}, avg engagement ${avg}%`;
        })
        .join("\n");

      const topLines = topPosts
        .map((p, i) => {
          const content = String(p.content || "").slice(0, 80);
          return `${i + 1}. ${p.platform} — reach ${p.reach || 0}, likes ${p.likes || 0}, engagement ${(p.engagement_rate || 0).toFixed(1)}%\n   "${content}${(p.content || "").length > 80 ? "..." : ""}"`;
        })
        .join("\n\n");

      const recommendations = bestPlatform
        ? `Recommendations: Keep doubling down on ${bestPlatform} — it had the strongest engagement this week. Repurpose top posts into ${bestPlatform}-style formats for other channels.`
        : "Recommendations: Publish consistently and vary posting times to gather more engagement data.";

      const reportText = `Weekly Marketing Report — ${brand.name}
Week: ${weekStart.toDateString()} to ${weekEnd.toDateString()}

Overall
- Total published posts: ${totalPosts}
- Total reach: ${totalReach}
- Total likes: ${totalLikes}
- Total comments: ${totalComments}
- Total reposts/shares: ${totalReposts}
- Average engagement rate: ${avgEngagement}%

Performance by platform
${platformLines || "No published posts this week."}

Top performing posts
${topLines || "No top posts yet."}

${recommendations}`;

      const newReport: any = {
        organization_id: orgId,
        brand_id: brand.id,
        week_start: startISO,
        week_end: endISO,
        total_posts: totalPosts,
        avg_engagement: parseFloat(avgEngagement),
        best_platform: bestPlatform || brand.platforms?.[0] || "none",
        report_text: reportText,
      };

      const { error } = await (supabase.from("weekly_reports") as any).insert(newReport);
      if (error) {
        alert("Error saving report: " + error.message);
      } else {
        loadData();
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">Weekly Reports</h1>
          <p className="mt-1 text-sm text-t2">Plain English — what worked, what did not, what to do next week</p>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="rounded-lg bg-acc px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "⟳ Generating..." : "Generate Weekly Report"}
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-b1 bg-c1 p-8 text-center">
          <div className="mb-2 text-3xl">📊</div>
          <div className="text-base font-semibold text-t1">No reports yet</div>
          <p className="mt-1 text-sm text-t2">
            Reports are auto-generated every Monday at 9AM by n8n and sent to your Telegram + email
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-acc/15 text-lg text-acc2">📊</div>
                <div>
                  <div className="text-sm font-semibold text-t1">
                    Week of {formatDate(r.week_start)} — {formatDate(r.week_end)}
                  </div>
                  <div className="text-xs text-t2">
                    {r.total_posts || 0} posts · Avg engagement: {(r.avg_engagement || 0).toFixed(1)}%
                    {r.best_platform ? ` · Best: ${r.best_platform}` : ""}
                  </div>
                </div>
                <div className="ml-auto flex gap-2">
                  <span className="rounded-md bg-[#229ED9]/10 px-2 py-1 text-[10px] font-medium text-[#229ED9]">Telegram</span>
                  <span className="rounded-md bg-acc/15 px-2 py-1 text-[10px] font-medium text-acc2">Email</span>
                </div>
              </div>
              <div className="whitespace-pre-wrap rounded-lg border border-b1 bg-c2 p-4 text-sm leading-relaxed text-t1">
                {escapeHtml(r.report_text || "")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
