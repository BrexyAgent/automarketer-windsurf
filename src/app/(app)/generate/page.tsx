"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import { applyBestTime, getBestTime } from "@/lib/schedule";
import Link from "next/link";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];
type Post = Database["public"]["Tables"]["posts"]["Row"];

const PL = [
  { id: "instagram", name: "Instagram", color: "#E1306C", abbr: "IG" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", abbr: "in" },
  { id: "twitter", name: "Twitter / X", color: "#1A8CD8", abbr: "X" },
  { id: "facebook", name: "Facebook", color: "#1877F2", abbr: "fb" },
  { id: "tiktok", name: "TikTok", color: "#2FD6E0", abbr: "TT" },
  { id: "youtube", name: "YouTube", color: "#CC0000", abbr: "YT" },
];

const TONES = ["professional", "casual", "bold", "educational", "inspirational"];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function PlatformBadge({ platform }: { platform: string }) {
  const p = PL.find((x) => x.id === platform) || { color: "#7C3AED", name: platform };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: p.color }}>
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {p.name}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending_approval: "bg-amb/15 text-amb",
    approved: "bg-grn/15 text-grn",
    published: "bg-blu/15 text-blu",
    rejected: "bg-red/15 text-red",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${colors[status] || "bg-c2 text-t2"}`}>
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

export default function GeneratePage() {
  const supabase = createClient();
  const { brand } = useBrand();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selected, setSelected] = useState<string[]>(brand?.platforms || ["instagram", "linkedin", "twitter"]);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [count, setCount] = useState(3);
  const [doImage, setDoImage] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Post[] | null>(null);

  async function loadPosts() {
    if (!brand) {
      setLoadingPosts(false);
      return;
    }
    setLoadingPosts(true);
    try {
      const { data: p } = await supabase
        .from("posts")
        .select("*")
        .eq("organization_id", brand.organization_id);
      setPosts((p || []) as unknown as Post[]);
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [brand]);

  const recent = useMemo(() => posts.slice(-6).reverse(), [posts]);

  function makeContent(platform: string, topic: string, tone: string, brand: Brand, idx: number) {
    const t = topic || brand.content_pillars?.[idx % (brand.content_pillars?.length || 1)] || "update";
    const kws = brand.keywords ? brand.keywords.split(/,\s*/) : [];
    const kw = kws.length ? kws[idx % kws.length] : t;
    const fragments: Record<string, string> = {
      instagram: `${brand.name} — ${t}. Swipe to see why this matters. ✨`,
      linkedin: `${brand.name} is exploring ${t} in the ${brand.industry} space. Here is what leaders should know.`,
      twitter: `${t} in ${brand.industry}: a quick thread from ${brand.name}. 🧵 1/`,
      facebook: `A ${tone} update from ${brand.name}: ${t}. Let us know your thoughts.`,
      tiktok: `POV: you just discovered ${t} with ${brand.name}. #${kw}`,
      youtube: `Everything you need to know about ${t} for ${brand.industry} — from ${brand.name}.`,
    };
    return fragments[platform] || `${brand.name} — ${t}`;
  }

  async function generate() {
    if (!brand) return;
    if (selected.length === 0) return alert("Select at least one platform.");
    setGenerating(true);
    setResult(null);
    const now = new Date();
    const newPosts: any[] = [];
    const words = (brand.keywords ? brand.keywords.split(/,\s*/) : []).filter(Boolean);
    const pillars = brand.content_pillars?.length ? brand.content_pillars : ["Product Updates", "Industry Insights"];

    for (let pi = 0; pi < selected.length; pi++) {
      const platform = selected[pi];
      for (let i = 0; i < count; i++) {
        const idx = newPosts.length;
        const t = topic.trim() || pillars[(idx + pi) % pillars.length];
        const ht = [...words, t.replace(/\s/g, "").toLowerCase()].slice(0, 5);
        const scheduled = applyBestTime(new Date(now.getTime() + (idx + 1) * 86400000), platform);
        const approval = new Date(now.getTime() + (brand.auto_approve_hours || 24) * 3600000);
        const content = makeContent(platform, t, tone, brand, i);
        const imagePrompt = doImage
          ? `A modern, clean social media cover image for ${brand.name}, ${brand.industry}, ${t}, no text, professional photography style`
          : "";
        const imageUrl = doImage
          ? `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=800&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`
          : "";
        newPosts.push({
          organization_id: brand.organization_id,
          brand_id: brand.id,
          platform,
          content,
          hashtags: ht,
          image_url: imageUrl,
          image_prompt: imagePrompt,
          best_time: getBestTime(platform),
          content_pillar: t,
          status: "pending_approval",
          approval_deadline: approval.toISOString(),
          scheduled_at: scheduled,
          author: "AutoMarketer AI",
          reach: 0,
          likes: 0,
          engagement_rate: 0,
        });
      }
    }

    try {
      const { data, error } = await (supabase.from("posts") as any).insert(newPosts).select();
      if (error) throw new Error(error.message);
      const inserted = (data || []) as unknown as Post[];
      setResult(inserted);
      setPosts([...posts, ...inserted]);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setGenerating(false);
  }

  if (!brand) {
    return (
      <div className="rounded-xl border border-b1 bg-c1 p-8 text-center">
        <div className="mb-2 text-3xl">⚡</div>
        <div className="text-base font-semibold text-t1">Add a brand first</div>
        <p className="mt-1 text-sm text-t2">Add a brand to generate content.</p>
        <Link href="/brands" className="mt-4 inline-block rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white">
          Add Brand
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">Auto Generate Content</h1>
        <p className="mt-1 text-sm text-t2">One click — posts for every platform using your brand intelligence</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-b1 bg-c1 p-5">
          <div className="mb-4 text-sm font-semibold text-t1">Generate Settings</div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-t2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PL.filter((p) => (brand.platforms || []).includes(p.id)).map((pl) => {
                  const on = selected.includes(pl.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={() => setSelected(on ? selected.filter((s) => s !== pl.id) : [...selected, pl.id])}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        on ? "border-transparent bg-acc/15 text-acc2" : "border-b1 bg-c2 text-t2 hover:text-t1"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: on ? pl.color : "#3A3A50" }} />
                      {pl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-t2">Topic (blank = auto-pick from pillars)</label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                placeholder="e.g. Weekend special, new product launch, industry insight..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-t2">Tone</label>
                <select
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Posts per platform</label>
                <select
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  <option value={1}>1 post</option>
                  <option value={3}>3 posts</option>
                  <option value={5}>5 posts</option>
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-t2">
              <input
                type="checkbox"
                className="accent-acc"
                checked={doImage}
                onChange={(e) => setDoImage(e.target.checked)}
              />
              Auto-generate cover images (Pollinations AI — free)
            </label>

            <button
              onClick={generate}
              disabled={generating || selected.length === 0}
              className="w-full rounded-lg bg-acc px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {generating ? "⟳ Generating..." : "✦ Generate Content for All Platforms"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-b1 bg-c1 p-5">
          <div className="mb-4 text-sm font-semibold text-t1">Last Generated</div>
          {recent.length === 0 ? (
            <div className="flex min-h-[80px] items-center justify-center text-sm text-t2">No posts yet</div>
          ) : (
            <div className="space-y-3">
              {recent.map((p) => {
                const pe = PL.find((x) => x.id === p.platform)?.abbr || "??";
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-c3 text-xs font-semibold">
                      {p.image_url ? <img src={p.image_url} alt="" className="h-11 w-11 rounded-lg object-cover" onError={(e) => (e.currentTarget.style.display = "none")} /> : pe}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex gap-1.5">
                        <PlatformBadge platform={p.platform} />
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="truncate text-xs text-t1">{escapeHtml((p.content || "").slice(0, 65))}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="rounded-lg bg-grn/10 p-3 text-sm text-grn">
          ✓ {result.length} posts ready — sent to Approval Queue.
          <Link href="/approval" className="ml-2 inline-block rounded-md bg-grn px-2 py-1 text-xs text-white">
            Review Now →
          </Link>
        </div>
      )}

      {result && result.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.slice(0, 6).map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-b1 bg-c1">
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt=""
                  className="aspect-video w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2">
                  <PlatformBadge platform={p.platform} />
                  <span className="text-[10px] text-t2">{formatDate(p.scheduled_at)}</span>
                </div>
                <p className="text-xs leading-relaxed text-t1">{escapeHtml((p.content || "").slice(0, 90))}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
