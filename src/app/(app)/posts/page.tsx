"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import Link from "next/link";
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

const TABS = [
  { id: "all", label: "All" },
  { id: "pending_approval", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
];

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
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return d;
  }
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

export default function PostsPage() {
  const supabase = createClient();
  const { brand, orgId } = useBrand();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<Post | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function loadPosts() {
    if (!brand || !orgId) return;
    setLoading(true);
    try {
      const { data: p } = await supabase
        .from("posts")
        .select("*")
        .eq("organization_id", orgId)
        .eq("brand_id", brand.id);
      setPosts((p || []) as unknown as Post[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [brand]);

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  function regenerateImage() {
    if (!view || !view.image_prompt) return;
    const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(view.image_prompt)}?width=800&height=800&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
    setView({ ...view, image_url: newUrl });
  }

  async function uploadImage(file: File) {
    if (!view) return;
    setUploadingImage(true);
    const path = `posts/${view.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file);
    if (error) {
      setUploadingImage(false);
      return alert("Upload error: " + error.message);
    }
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    setView({ ...view, image_url: data.publicUrl });
    setUploadingImage(false);
  }

  async function saveImage() {
    if (!view) return;
    const { error } = await (supabase.from("posts") as any)
      .update({ image_url: view.image_url, image_prompt: view.image_prompt })
      .eq("id", view.id);
    if (error) { alert("Error: " + error.message); return; }
    setPosts(posts.map((p) => (p.id === view.id ? { ...p, image_url: view.image_url, image_prompt: view.image_prompt } : p)));
    setView(null);
  }

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">All Posts</h1>
          <p className="mt-1 text-sm text-t2">{posts.length} total posts</p>
        </div>
        <Link href="/generate" className="rounded-lg bg-acc px-3 py-2 text-sm font-medium text-white">+ Generate</Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-b1 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t.id ? "bg-acc text-white" : "bg-c2 text-t2 hover:text-t1"
            }`}
          >
            {t.label} ({t.id === "all" ? posts.length : posts.filter((p) => p.status === t.id).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-b1 bg-c1 p-8 text-center">
          <div className="mb-2 text-3xl">📝</div>
          <div className="text-base font-semibold text-t1">No posts found</div>
          <p className="mt-1 text-sm text-t2">Generate content from the pipeline to see posts here.</p>
          <Link href="/generate" className="mt-4 inline-block rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white">
            Generate
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.slice(0, 30).map((p) => (
            <div
              key={p.id}
              onClick={() => setView(p)}
              className="cursor-pointer overflow-hidden rounded-xl border border-b1 bg-c1 transition-colors hover:border-acc"
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt="post"
                  className="aspect-video w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-c3 text-2xl" style={{ color: PCOL[p.platform] || "#6C5CE7" }}>
                  {(p.platform || "?").slice(0, 3)}
                </div>
              )}
              <div className="p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <PlatformBadge platform={p.platform} />
                  <StatusBadge status={p.status} />
                  {p.scheduled_at && <span className="ml-auto text-[10px] text-t2">{formatDate(p.scheduled_at)}</span>}
                </div>
                <p className="text-xs leading-relaxed text-t1">
                  {escapeHtml((p.content || "").slice(0, 90))}
                  {p.content && p.content.length > 90 && "..."}
                </p>
                {p.hashtags && p.hashtags.length > 0 && (
                  <p className="mt-2 text-[11px] text-acc2">
                    {p.hashtags.slice(0, 4).map((h) => "#" + h).join(" ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-b1 bg-c1 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-semibold text-t1">Post Preview <PlatformBadge platform={view.platform} /></div>
              <button onClick={() => setView(null)} className="rounded-md px-2 py-1 text-sm text-t2 hover:bg-c2">✕</button>
            </div>
            {view.image_url && (
              <img src={view.image_url} alt="post" className="mb-4 max-h-64 w-full rounded-lg object-contain" onError={(e) => (e.currentTarget.style.display = "none")} />
            )}
            <div className="mb-4">
              <label className="mb-1 block text-xs text-t2">Direct Image URL</label>
              <input
                className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                value={view.image_url || ""}
                onChange={(e) => setView({ ...view, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-t2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 file:mr-2 file:rounded file:border-0 file:bg-acc file:px-2 file:py-1 file:text-xs file:text-white"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
              />
              {uploadingImage && <span className="text-xs text-t2">Uploading...</span>}
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-t2">Image Prompt</label>
              <div className="flex gap-2">
                <textarea
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  rows={2}
                  value={view.image_prompt || ""}
                  onChange={(e) => setView({ ...view, image_prompt: e.target.value })}
                />
                <button
                  onClick={regenerateImage}
                  className="shrink-0 rounded-lg bg-acc px-3 py-2 text-xs font-medium text-white"
                >
                  Regenerate
                </button>
              </div>
            </div>
            <div className="mb-4 max-h-52 overflow-y-auto rounded-lg border border-b1 bg-c2 p-3 text-sm leading-relaxed text-t1 whitespace-pre-wrap">
              {escapeHtml(view.content || "")}
            </div>
            {view.hashtags && view.hashtags.length > 0 && (
              <p className="mb-4 text-sm text-acc2">{view.hashtags.map((h) => "#" + h).join(" ")}</p>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-t2">Scheduled</div>
                <div className="text-t1">{formatDate(view.scheduled_at)}</div>
              </div>
              <div>
                <div className="text-xs text-t2">Status</div>
                <div className="font-semibold text-t1">{view.status.replace(/_/g, " ")}</div>
              </div>
            </div>
            <button
              onClick={saveImage}
              className="mt-4 w-full rounded-lg bg-grn py-2.5 text-sm font-medium text-white"
            >
              ✓ Save Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
