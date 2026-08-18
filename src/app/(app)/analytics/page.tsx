"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import { Chart as ChartJS, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import type { Database } from "@/types/database";

ChartJS.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

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

function PlatformBadge({ platform }: { platform: string }) {
  const color = PCOL[platform] || "#6C5CE7";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: color }}>
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "?"}
    </span>
  );
}

function TabIcon({ platform }: { platform: string }) {
  const props = { className: "h-4 w-4" };
  switch (platform) {
    case "overview":
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V8.77h3.41v1.58h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.45v6.5zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zm1.78 13.02H3.56V8.77h3.56v11.68z" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.83-5.98 6.83H1.68l7.73-8.84L1.14 2.25h6.81l4.72 6.24 5.57-6.24zM17.05 19.5h1.83L7.03 4.36H5.09l11.96 15.14z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.81zM9.55 15.5V8.5l6.23 3.5-6.23 3.5z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 15.82a6.34 6.34 0 0011.14-4.18V9.13a8.16 8.16 0 004.8 1.55V7.49a4.82 4.82 0 01-1.35-.8z" />
        </svg>
      );
    case "website":
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    default:
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const { brand, orgId } = useBrand();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview");

  async function loadPosts() {
    if (!brand || !orgId) return;
    setLoading(true);
    try {
      const { data: p } = await supabase
        .from("posts")
        .select("*")
        .eq("organization_id", orgId)
        .eq("brand_id", brand.id);
      setPosts(((p || []) as unknown as Post[]).filter((p) => p.brand_id === brand.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [brand]);

  const bp = useMemo(() => posts.filter((p) => p.status === "published"), [posts]);
  const reach = useMemo(() => bp.reduce((a, p) => a + (p.reach || 0), 0), [bp]);
  const likes = useMemo(() => bp.reduce((a, p) => a + (p.likes || 0), 0), [bp]);
  const avgEng = useMemo(() => (bp.length ? (bp.reduce((a, p) => a + (p.engagement_rate || 0), 0) / bp.length).toFixed(1) : "0"), [bp]);

  const byPl = useMemo(() => {
    const res: Record<string, { n: number; e: number }> = {};
    bp.forEach((p) => {
      if (!res[p.platform]) res[p.platform] = { n: 0, e: 0 };
      res[p.platform].n++;
      res[p.platform].e += p.engagement_rate || 0;
    });
    return res;
  }, [bp]);

  const labels = useMemo(() => Object.keys(byPl), [byPl]);
  const data = useMemo(() => labels.map((l) => (byPl[l].n ? byPl[l].e / byPl[l].n : 0)), [byPl, labels]);
  const colors = useMemo(() => labels.map((l) => PCOL[l] || "#8B5CF6"), [labels]);

  const chartData = labels.length
    ? {
        labels,
        datasets: [{ data, backgroundColor: colors, borderRadius: 5 }],
      }
    : {
        labels: ["No data"],
        datasets: [{ data: [0], backgroundColor: ["#2A2A40"], borderRadius: 5 }],
      };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#8080A0", font: { size: 11 } }, grid: { display: false } },
      y: { ticks: { color: "#8080A0", font: { size: 11 }, callback: (v: number | string) => String(v) + "%" }, grid: { color: "rgba(255,255,255,.04)" } },
    },
  };

  const topLiked = useMemo(() => (bp.length ? bp.reduce((a, b) => ((b.likes || 0) > (a.likes || 0) ? b : a), bp[0]) : null), [bp]);
  const topEngagement = useMemo(
    () => (bp.length ? bp.reduce((a, b) => ((b.engagement_rate || 0) > (a.engagement_rate || 0) ? b : a), bp[0]) : null),
    [bp]
  );
  const topReach = useMemo(() => (bp.length ? bp.reduce((a, b) => ((b.reach || 0) > (a.reach || 0) ? b : a), bp[0]) : null), [bp]);
  const last7 = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 86400000);
    return bp
      .filter((p) => new Date((p as any).published_at || p.scheduled_at || p.created_at || 0) >= cutoff)
      .sort((a, b) => +new Date((a as any).published_at || a.scheduled_at || a.created_at) - +new Date((b as any).published_at || b.scheduled_at || b.created_at));
  }, [bp]);
  const reach7d = useMemo(() => last7.reduce((a, p) => a + (p.reach || 0), 0), [last7]);
  const likes7d = useMemo(() => last7.reduce((a, p) => a + (p.likes || 0), 0), [last7]);
  const likesTrendData = useMemo(() => {
    const labels = last7.map((_, i) => `Day ${i + 1}`);
    const data = last7.map((p) => p.likes || 0);
    return {
      labels,
      datasets: [
        {
          label: "Likes",
          data,
          borderColor: "#7C3AED",
          backgroundColor: "rgba(124,58,237,0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#7C3AED",
        },
      ],
    };
  }, [last7]);
  const likesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#8080A0", font: { size: 11 } }, grid: { display: false } },
      y: { ticks: { color: "#8080A0", font: { size: 11 } }, grid: { color: "rgba(255,255,255,.04)" } },
    },
  };

  const platformStats = useMemo(() => {
    const stats: Record<
      string,
      { posts: Post[]; reach: number; likes: number; comments: number; reposts: number; engagement: number; topPost: Post | null }
    > = {};
    for (const p of bp) {
      const plat = p.platform || "unknown";
      if (!stats[plat])
        stats[plat] = { posts: [], reach: 0, likes: 0, comments: 0, reposts: 0, engagement: 0, topPost: null };
      stats[plat].posts.push(p);
      stats[plat].reach += p.reach || 0;
      stats[plat].likes += p.likes || 0;
      stats[plat].comments += ((p as any).comments || 0) as number;
      stats[plat].reposts += ((p as any).reposts || (p as any).shares || 0) as number;
      stats[plat].engagement += p.engagement_rate || 0;
      if (!stats[plat].topPost || (p.engagement_rate || 0) > (stats[plat].topPost.engagement_rate || 0)) stats[plat].topPost = p;
    }
    return Object.entries(stats).sort((a, b) => b[1].engagement - a[1].engagement);
  }, [bp]);

  const viewPosts = useMemo(() => {
    if (view === "overview") return bp;
    if (view === "website") return [];
    return bp.filter((p) => p.platform === view);
  }, [view, bp]);

  const vReach = useMemo(() => viewPosts.reduce((a, p) => a + (p.reach || 0), 0), [viewPosts]);
  const vLikes = useMemo(() => viewPosts.reduce((a, p) => a + (p.likes || 0), 0), [viewPosts]);
  const vAvgEng = useMemo(
    () => (viewPosts.length ? (viewPosts.reduce((a, p) => a + (p.engagement_rate || 0), 0) / viewPosts.length).toFixed(1) : "0"),
    [viewPosts]
  );
  const vTopLiked = useMemo(
    () => (viewPosts.length ? viewPosts.reduce((a, b) => ((b.likes || 0) > (a.likes || 0) ? b : a), viewPosts[0]) : null),
    [viewPosts]
  );
  const vTopEngagement = useMemo(
    () => (viewPosts.length ? viewPosts.reduce((a, b) => ((b.engagement_rate || 0) > (a.engagement_rate || 0) ? b : a), viewPosts[0]) : null),
    [viewPosts]
  );
  const vTopReach = useMemo(
    () => (viewPosts.length ? viewPosts.reduce((a, b) => ((b.reach || 0) > (a.reach || 0) ? b : a), viewPosts[0]) : null),
    [viewPosts]
  );
  const vLast7 = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 86400000);
    return viewPosts
      .filter((p) => new Date((p as any).published_at || p.scheduled_at || p.created_at || 0) >= cutoff)
      .sort((a, b) => +new Date((a as any).published_at || a.scheduled_at || a.created_at) - +new Date((b as any).published_at || b.scheduled_at || b.created_at));
  }, [viewPosts]);
  const vReach7d = useMemo(() => vLast7.reduce((a, p) => a + (p.reach || 0), 0), [vLast7]);
  const vLikes7d = useMemo(() => vLast7.reduce((a, p) => a + (p.likes || 0), 0), [vLast7]);
  const vLikesTrendData = useMemo(() => {
    const labels = vLast7.map((_, i) => `Day ${i + 1}`);
    const data = vLast7.map((p) => p.likes || 0);
    return {
      labels,
      datasets: [
        {
          label: "Likes",
          data,
          borderColor: "#7C3AED",
          backgroundColor: "rgba(124,58,237,0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#7C3AED",
        },
      ],
    };
  }, [vLast7]);
  const vByPl = useMemo(() => {
    const res: Record<string, { n: number; e: number }> = {};
    viewPosts.forEach((p) => {
      if (!res[p.platform]) res[p.platform] = { n: 0, e: 0 };
      res[p.platform].n++;
      res[p.platform].e += p.engagement_rate || 0;
    });
    return res;
  }, [viewPosts]);
  const vLabels = useMemo(() => Object.keys(vByPl), [vByPl]);
  const vData = useMemo(() => vLabels.map((l) => (vByPl[l].n ? vByPl[l].e / vByPl[l].n : 0)), [vByPl, vLabels]);
  const vColors = useMemo(() => vLabels.map((l) => PCOL[l] || "#8B5CF6"), [vLabels]);
  const vChartData = vLabels.length
    ? { labels: vLabels, datasets: [{ data: vData, backgroundColor: vColors, borderRadius: 5 }] }
    : { labels: ["No data"], datasets: [{ data: [0], backgroundColor: ["#2A2A40"], borderRadius: 5 }] };

  const topPlat = platformStats[0]?.[0] ?? "your top platform";

  const printStyles = `
    @media print {
      body * { visibility: hidden !important; }
      #analytics-report, #analytics-report * { visibility: visible !important; }
      #analytics-report { display: block !important; position: absolute; left: 0; top: 0; width: 100%; min-height: 100%; background: white; color: black; }
      .no-print { display: none !important; }
      @page { margin: 20mm; }
    }
  `;

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "twitter", label: "Twitter / X" },
    { id: "instagram", label: "Instagram" },
    { id: "facebook", label: "Facebook" },
    { id: "youtube", label: "YouTube" },
    { id: "tiktok", label: "TikTok" },
    { id: "website", label: "Website" },
  ];

  return (
    <>
    <div className="no-print">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">Analytics</h1>
        <p className="mt-1 text-sm text-t2">Performance for {escapeHtml(brand?.name || "all brands")}</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              view === t.id ? "border-transparent bg-acc text-white" : "border-b1 bg-c2 text-t2 hover:text-t1"
            }`}
          >
            <TabIcon platform={t.id} />
            {t.label}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <div className="mb-5 flex items-center justify-end no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            ⬇ Download / Print Report
          </button>
        </div>
      )}

      {view === "website" ? (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-t1">Website Traffic</h2>
            <p className="mt-1 text-sm text-t2">
              {brand?.website
                ? `Tracking ${escapeHtml(brand.website)} — connect Google Analytics or a Google Sheet to populate these numbers.`
                : "Connect your website, Google Analytics or a Google Sheet to see demo clicks, visitors and sources."}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Website Visitors</div>
              <div className="mt-1 text-2xl font-semibold text-t1">—</div>
              <div className="text-[10px] text-t2">Connect GA or Sheet</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Demo Clicks</div>
              <div className="mt-1 text-2xl font-semibold text-t1">—</div>
              <div className="text-[10px] text-t2">Track CTA clicks</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Top Source</div>
              <div className="mt-1 text-2xl font-semibold text-t1">—</div>
              <div className="text-[10px] text-t2">Organic / Direct / Social</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Bounce Rate</div>
              <div className="mt-1 text-2xl font-semibold text-t1">—</div>
              <div className="text-[10px] text-t2">Connect GA or Sheet</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Total Reach</div>
              <div className="mt-1 text-2xl font-semibold text-t1">{formatNumber(vReach)}</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Total Likes</div>
              <div className="mt-1 text-2xl font-semibold text-red">{formatNumber(vLikes)}</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Avg Engagement</div>
              <div className="mt-1 text-2xl font-semibold text-grn">{vAvgEng}%</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Posts Published</div>
              <div className="mt-1 text-2xl font-semibold text-acc2">{viewPosts.length}</div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Most Liked Post</div>
              <div className="mt-1 text-sm font-semibold leading-snug text-t1">{vTopLiked ? escapeHtml((vTopLiked.content || "").slice(0, 40)) : "—"}</div>
              <div className="text-[10px] text-t2">{vTopLiked ? `${formatNumber(vTopLiked.likes)} likes` : ""}</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Highest Engagement Post</div>
              <div className="mt-1 text-sm font-semibold leading-snug text-t1">{vTopEngagement ? escapeHtml((vTopEngagement.content || "").slice(0, 40)) : "—"}</div>
              <div className="text-[10px] text-t2">{vTopEngagement ? `${(vTopEngagement.engagement_rate || 0).toFixed(1)}%` : ""}</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Highest Reach Post</div>
              <div className="mt-1 text-sm font-semibold leading-snug text-t1">{vTopReach ? escapeHtml((vTopReach.content || "").slice(0, 40)) : "—"}</div>
              <div className="text-[10px] text-t2">{vTopReach ? `Reach: ${formatNumber(vTopReach.reach)}` : ""}</div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="text-xs text-t2">Last 7 Days</div>
              <div className="mt-1 text-2xl font-semibold text-t1">{formatNumber(vReach7d)}</div>
              <div className="text-[10px] text-t2">{formatNumber(vLikes7d)} likes</div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 text-sm font-medium text-t1">Engagement by Platform</div>
              <div className="h-[200px]">
                <Bar data={vChartData} options={options} />
              </div>
            </div>

            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 text-sm font-medium text-t1">Top Posts</div>
              {viewPosts.length === 0 ? (
                <div className="flex min-h-[80px] items-center justify-center rounded-lg bg-c2 text-sm text-t2">
                  {view === "overview" ? "Publish posts to see analytics" : `No published ${view} posts yet`}
                </div>
              ) : (
                <div className="divide-y divide-b1">
                  {viewPosts
                    .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
                    .slice(0, 5)
                    .map((p) => (
                      <div key={p.id} className="flex items-center gap-3 py-3">
                        <PlatformBadge platform={p.platform} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs text-t1">{escapeHtml((p.content || "").slice(0, 50))}</div>
                          <div className="text-[10px] text-t2">Reach: {formatNumber(p.reach)}</div>
                        </div>
                        <span className="text-sm font-semibold text-grn">{(p.engagement_rate || 0).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 text-sm font-medium text-t1">Likes Trend (Last 7 Days)</div>
              <div className="h-[200px]">
                <Line data={vLikesTrendData} options={likesOptions} />
              </div>
            </div>
          </div>

          {view === "overview" && (
            <>
              <div className="mb-6 mt-8">
                <h2 className="text-lg font-semibold text-t1">Platform Breakdown</h2>
                <p className="mt-1 text-sm text-t2">Per-channel stats and top posts</p>
              </div>

              {platformStats.length === 0 ? (
                <div className="mb-5 rounded-xl border border-b1 bg-c1 p-8 text-center text-sm text-t2">
                  Publish posts to see a per-channel breakdown.
                </div>
              ) : (
                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {platformStats.map(([plat, s]) => (
                    <div key={plat} className="rounded-xl border border-b1 bg-c1 p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <PlatformBadge platform={plat} />
                        <span className="text-sm font-semibold text-t1 capitalize">{plat}</span>
                      </div>
                      <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded bg-c2 p-2">
                          <div className="text-[10px] text-t2">Posts</div>
                          <div className="font-semibold text-t1">{s.posts.length}</div>
                        </div>
                        <div className="rounded bg-c2 p-2">
                          <div className="text-[10px] text-t2">Reach</div>
                          <div className="font-semibold text-t1">{formatNumber(s.reach)}</div>
                        </div>
                        <div className="rounded bg-c2 p-2">
                          <div className="text-[10px] text-t2">Likes</div>
                          <div className="font-semibold text-t1">{formatNumber(s.likes)}</div>
                        </div>
                        <div className="rounded bg-c2 p-2">
                          <div className="text-[10px] text-t2">Avg Eng</div>
                          <div className="font-semibold text-t1">{(s.engagement / (s.posts.length || 1)).toFixed(1)}%</div>
                        </div>
                        <div className="rounded bg-c2 p-2">
                          <div className="text-[10px] text-t2">Comments</div>
                          <div className="font-semibold text-t1">{formatNumber(s.comments)}</div>
                        </div>
                        <div className="rounded bg-c2 p-2">
                          <div className="text-[10px] text-t2">Reposts</div>
                          <div className="font-semibold text-t1">{formatNumber(s.reposts)}</div>
                        </div>
                      </div>
                      <div className="rounded bg-c2 p-2 text-xs">
                        <div className="mb-1 text-[10px] text-t2">Top post</div>
                        <div className="truncate font-medium text-t1">{s.topPost ? escapeHtml((s.topPost.content || "").slice(0, 50)) : "—"}</div>
                        <div className="text-[10px] text-t2">{s.topPost ? `${(s.topPost.engagement_rate || 0).toFixed(1)}% · reach ${formatNumber(s.topPost.reach)}` : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
    <style dangerouslySetInnerHTML={{ __html: printStyles }} />
    <div id="analytics-report" className="hidden bg-white p-8 text-black" style={{ backgroundColor: "white", color: "black" }}>
      <div className="mb-6 flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <div className="text-2xl font-bold text-black">{escapeHtml(brand?.name || "Brand Name")}</div>
          <div className="text-sm text-gray-700">Analytics Report</div>
        </div>
        {(brand as any)?.logo ? (
          <img src={(brand as any).logo} alt="logo" className="h-12 w-auto object-contain" />
        ) : (
          <div className="text-xl font-bold text-black">AutoMarketer</div>
        )}
      </div>

      <div className="mb-6 text-sm text-gray-700">Generated on {new Date().toLocaleDateString()}</div>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-black">Social Performance Summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Total Reach</div>
            <div className="text-lg font-bold text-black">{formatNumber(vReach)}</div>
          </div>
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Total Likes</div>
            <div className="text-lg font-bold text-black">{formatNumber(vLikes)}</div>
          </div>
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Avg Engagement</div>
            <div className="text-lg font-bold text-black">{vAvgEng}%</div>
          </div>
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Posts Published</div>
            <div className="text-lg font-bold text-black">{viewPosts.length}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Last 7 Days Reach</div>
            <div className="text-lg font-bold text-black">{formatNumber(vReach7d)}</div>
          </div>
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Last 7 Days Likes</div>
            <div className="text-lg font-bold text-black">{formatNumber(vLikes7d)}</div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-black">Platform Breakdown</h2>
        {platformStats.length === 0 ? (
          <p className="text-sm text-gray-700">No platform data available.</p>
        ) : (
          <table className="w-full text-left text-sm text-black">
            <thead>
              <tr className="border-b border-black">
                <th className="pb-2">Platform</th>
                <th className="pb-2">Posts</th>
                <th className="pb-2">Reach</th>
                <th className="pb-2">Likes</th>
                <th className="pb-2">Comments</th>
                <th className="pb-2">Reposts</th>
                <th className="pb-2">Avg Eng</th>
              </tr>
            </thead>
            <tbody>
              {platformStats.map(([plat, s]) => (
                <tr key={plat} className="border-b border-gray-300">
                  <td className="py-2 capitalize">{plat}</td>
                  <td className="py-2">{s.posts.length}</td>
                  <td className="py-2">{formatNumber(s.reach)}</td>
                  <td className="py-2">{formatNumber(s.likes)}</td>
                  <td className="py-2">{formatNumber(s.comments)}</td>
                  <td className="py-2">{formatNumber(s.reposts)}</td>
                  <td className="py-2">{(s.engagement / (s.posts.length || 1)).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-black">Top Performing Posts</h2>
        {bp.length === 0 ? (
          <p className="text-sm text-gray-700">No published posts yet.</p>
        ) : (
          <table className="w-full text-left text-sm text-black">
            <thead>
              <tr className="border-b border-black">
                <th className="pb-2">Platform</th>
                <th className="pb-2">Post</th>
                <th className="pb-2">Reach</th>
                <th className="pb-2">Likes</th>
                <th className="pb-2">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {[...bp]
                .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
                .slice(0, 5)
                .map((p) => (
                  <tr key={p.id} className="border-b border-gray-300">
                    <td className="py-2 capitalize">{p.platform || "—"}</td>
                    <td className="py-2 max-w-[250px] truncate">{escapeHtml((p.content || "").slice(0, 60))}</td>
                    <td className="py-2">{formatNumber(p.reach)}</td>
                    <td className="py-2">{formatNumber(p.likes)}</td>
                    <td className="py-2">{(p.engagement_rate || 0).toFixed(1)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-black">Website Traffic</h2>
        <p className="text-sm text-gray-700">
          {brand?.website
            ? `Tracking ${escapeHtml(brand.website)} — connect Google Analytics or a Google Sheet to populate these numbers.`
            : "Connect your website, Google Analytics or a Google Sheet to see demo clicks, visitors and sources."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Website Visitors</div>
            <div className="text-lg font-bold text-black">—</div>
          </div>
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Demo Clicks</div>
            <div className="text-lg font-bold text-black">—</div>
          </div>
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Top Source</div>
            <div className="text-lg font-bold text-black">—</div>
          </div>
          <div className="rounded border border-black p-3">
            <div className="text-xs text-gray-700">Bounce Rate</div>
            <div className="text-lg font-bold text-black">—</div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-black">Recommendations</h2>
        <ul className="list-disc pl-5 text-sm text-gray-800">
          <li>Double down on <strong>{topPlat}</strong> — it currently has the highest engagement.</li>
          <li>Post more consistently on underperforming channels to grow reach.</li>
          <li>Repurpose the top-performing post into long-form content or video.</li>
          <li>Track website CTAs to tie social engagement to business outcomes.</li>
        </ul>
      </section>
    </div>
    </>
  );
}
