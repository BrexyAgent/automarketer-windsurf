"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import { getBestTime } from "@/lib/schedule";
import type { Database } from "@/types/database";

type Post = Database["public"]["Tables"]["posts"]["Row"];

const PCOL: Record<string, string> = {
  instagram: "#C13584",
  linkedin: "#0A66C2",
  twitter: "#1A8CD8",
  facebook: "#1877F2",
  tiktok: "#2FD6E0",
  youtube: "#CC0000",
};

const MN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function PlatformChip({ platform }: { platform: string }) {
  const c = PCOL[platform] || "#6C5CE7";
  return (
    <span
      className="inline-flex w-6 items-center justify-center rounded-md text-[10px] font-semibold"
      style={{ backgroundColor: c + "22", color: c }}
    >
      {platform.slice(0, 3)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending_approval: "bg-amb/15 text-amb",
    approved: "bg-grn/15 text-grn",
    auto_approved: "bg-grn/15 text-grn",
    published: "bg-blu/15 text-blu",
    rejected: "bg-red/15 text-red",
    scheduled: "bg-acc/15 text-acc2",
    draft: "bg-b2 text-t2",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${colors[status] || "bg-b2 text-t2"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return d;
  }
}

export default function CalendarPage() {
  const supabase = createClient();
  const { brand, orgId } = useBrand();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [addPlatform, setAddPlatform] = useState("instagram");
  const [addDate, setAddDate] = useState(new Date().toISOString().split("T")[0]);
  const [addTime, setAddTime] = useState(getBestTime("instagram"));
  const [addContent, setAddContent] = useState("");

  useEffect(() => {
    setAddTime(getBestTime(addPlatform));
  }, [addPlatform]);

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

  const { daysInMonth, firstDay, currentMonth, currentYear } = useMemo(() => {
    const y = date.getFullYear();
    const m = date.getMonth();
    return {
      daysInMonth: new Date(y, m + 1, 0).getDate(),
      firstDay: new Date(y, m, 1).getDay(),
      currentMonth: m,
      currentYear: y,
    };
  }, [date]);

  const upcoming = useMemo(() => {
    return [...posts]
      .filter((p) => p.scheduled_at)
      .sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || ""))
      .slice(0, 15);
  }, [posts]);

  const scheduled = useMemo(() => posts.filter((p) => ["pending_approval", "approved", "scheduled"].includes(p.status)).length, [posts]);

  function nav(dir: number) {
    setDate((d) => {
      const next = new Date(d);
      next.setMonth(d.getMonth() + dir);
      return next;
    });
  }

  async function savePost() {
    if (!addDate || !addContent.trim()) {
      alert("Fill date and content.");
      return;
    }
    if (!brand) {
      alert("No active brand.");
      return;
    }
    try {
      await (supabase.from("posts") as any).insert({
        organization_id: brand.organization_id,
        brand_id: brand.id,
        platform: addPlatform,
        content: addContent.trim(),
        hashtags: [],
        image_prompt: "",
        image_url: "",
        best_time: addTime,
        content_pillar: "Calendar",
        status: "approved",
        scheduled_at: `${addDate}T${addTime}:00`,
        author: "Manual",
      });
      setAddContent("");
      setAddOpen(false);
      loadPosts();
    } catch {
      alert("Failed to save post.");
    }
  }

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">Content Calendar</h1>
          <p className="mt-1 text-sm text-t2">{posts.length} total · {scheduled} scheduled</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="rounded-lg bg-acc px-3 py-2 text-sm font-medium text-white">+ Add Post</button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => nav(-1)} className="rounded-lg border border-b1 bg-c2 px-3 py-1.5 text-t1 hover:bg-b1">←</button>
        <span className="min-w-[160px] text-center text-sm font-semibold text-t1">{MN[currentMonth]} {currentYear}</span>
        <button onClick={() => nav(1)} className="rounded-lg border border-b1 bg-c2 px-3 py-1.5 text-t1 hover:bg-b1">→</button>
        <div className="ml-auto flex gap-4">
          {[
            ["pending_approval", "#FDCB6E"],
            ["approved", "#00B894"],
            ["published", "#0984E3"],
          ].map(([s, c]) => (
            <span key={s} className="flex items-center gap-1.5 text-[11px]" style={{ color: c }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-b1 bg-c1 p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-t2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 rounded-md bg-c2/30" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dp = posts.filter((p) => (p.scheduled_at || "").split("T")[0] === ds);
            const isToday = new Date().toISOString().split("T")[0] === ds;
            return (
              <div
                key={d}
                className={`h-20 rounded-md border p-1 ${isToday ? "border-acc/50 bg-acc/5" : "border-b1 bg-c2"}`}
              >
                <div className={`text-[11px] ${isToday ? "font-bold text-acc2" : "text-t2"}`}>{d}</div>
                <div className="mt-1 flex flex-wrap gap-1 overflow-hidden">
                  {dp.slice(0, 3).map((p, idx) => (
                    <PlatformChip key={idx} platform={p.platform} />
                  ))}
                  {dp.length > 3 && <span className="text-[9px] text-t2">+{dp.length - 3}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-b1 bg-c1 p-5">
        <div className="mb-3 text-sm font-medium text-t1">Upcoming Posts</div>
        {upcoming.length === 0 ? (
          <div className="flex min-h-[80px] items-center justify-center rounded-lg bg-c2 text-sm text-t2">
            No scheduled posts yet
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-b1 text-[10px] uppercase tracking-wide text-t2">
                <th className="pb-2 pl-2">Date</th>
                <th className="pb-2">Platform</th>
                <th className="pb-2">Content</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((p) => (
                <tr key={p.id} className="border-b border-b1 last:border-0">
                  <td className="whitespace-nowrap py-3 pl-2 text-t2">{formatDate(p.scheduled_at)}</td>
                  <td className="py-3"><PlatformChip platform={p.platform} /></td>
                  <td className="max-w-[240px] truncate py-3 text-t1">{escapeHtml((p.content || "").slice(0, 55))}</td>
                  <td className="py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-b1 bg-c1 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-t1">Add Post to Calendar</span>
              <button onClick={() => setAddOpen(false)} className="rounded-lg bg-c2 px-2 py-1 text-xs text-t2">
                X
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-t2">Platform</label>
                <select
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={addPlatform}
                  onChange={(e) => setAddPlatform(e.target.value)}
                >
                  {Object.keys(PCOL).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-t2">Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-t2">Time</label>
                  <input
                    type="time"
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={addTime}
                    onChange={(e) => setAddTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Content</label>
                <textarea
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  rows={5}
                  value={addContent}
                  onChange={(e) => setAddContent(e.target.value)}
                  placeholder="Write your post content..."
                />
              </div>
              <button
                onClick={savePost}
                className="w-full rounded-lg bg-acc px-4 py-3 text-sm font-medium text-white"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
