"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import Link from "next/link";
import type { Database } from "@/types/database";
import { publishPostAction } from "./actions";

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
  const label = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "?";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium text-white"
      style={{ backgroundColor: color }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {label}
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
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase ${colors[status] || "bg-b2 text-t2"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const COLS = [
  { id: "pending_approval", label: "Pending", color: "#FDCB6E" },
  { id: "approved", label: "Approved", color: "#00B894" },
  { id: "published", label: "Published", color: "#0984E3" },
  { id: "rejected", label: "Rejected", color: "#E17055" },
];

export default function ApprovalPage() {
  const supabase = createClient();
  const { brand, orgId } = useBrand();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Post | null>(null);
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
      setPosts(((p || []) as unknown as Post[]).filter((p) => p.brand_id === brand.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [brand]);

  const filtered = useMemo(() => posts, [posts]);
  const grouped = useMemo(() => {
    const res: Record<string, Post[]> = { pending_approval: [], approved: [], published: [], rejected: [] };
    for (const p of filtered) {
      if (p.status === "auto_approved") {
        res.approved.push(p);
      } else if (res[p.status]) {
        res[p.status].push(p);
      } else {
        res.pending_approval.push(p);
      }
    }
    return res;
  }, [filtered]);

  const pendCount = grouped.pending_approval.length;
  const apprCount = grouped.approved.length;
  const pubCount = grouped.published.length;
  const rejCount = grouped.rejected.length;
  const overdue = grouped.pending_approval.filter((p) => p.approval_deadline && new Date(p.approval_deadline) < new Date());

  async function updateStatus(id: string, status: string) {
    const update: any = { status };
    if (status === "approved") update.approved_at = new Date().toISOString();
    if (status === "published") {
      update.published_at = new Date().toISOString();
    }
    const { error } = await (supabase.from("posts") as any).update(update).eq("id", id);
    if (error) alert("Error: " + error.message);
    loadPosts();
  }

  async function approveAll() {
    const ids = grouped.pending_approval.map((p) => p.id);
    for (const id of ids) {
      await (supabase.from("posts") as any).update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
    }
    loadPosts();
  }

  async function publish(p: Post) {
    const res = await publishPostAction(p.id);
    if (res.error) return alert(res.error);
    loadPosts();
  }

  function regenerateImage() {
    if (!editing || !editing.image_prompt) return;
    const prompt = editing.image_prompt;
    const newUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
    setEditing({ ...editing, image_url: newUrl });
  }

  async function uploadImage(file: File) {
    if (!editing) return;
    setUploadingImage(true);
    const path = `posts/${editing.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file);
    if (error) {
      setUploadingImage(false);
      return alert("Upload error: " + error.message);
    }
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    setEditing({ ...editing, image_url: data.publicUrl });
    setUploadingImage(false);
  }

  async function saveEdit() {
    if (!editing) return;
    const ht = editing.hashtags || [];
    const { error } = await (supabase.from("posts") as any)
      .update({
        content: editing.content,
        hashtags: ht,
        scheduled_at: editing.scheduled_at,
        status: editing.status,
        image_url: editing.image_url,
        image_prompt: editing.image_prompt,
        approved_at: editing.status === "approved" || editing.status === "published" ? new Date().toISOString() : undefined,
        published_at: editing.status === "published" ? new Date().toISOString() : undefined,
      })
      .eq("id", editing.id);
    if (error) alert("Error: " + error.message);
    setEditing(null);
    loadPosts();
  }

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">Approval Queue</h1>
          <p className="mt-1 text-sm text-t2">Review posts · Approve via dashboard, Telegram, or WhatsApp</p>
        </div>
        <div className="flex gap-2">
          {pendCount > 0 && (
            <button onClick={approveAll} className="rounded-lg bg-grn px-3 py-2 text-sm font-medium text-white">
              ✓ Approve All ({pendCount})
            </button>
          )}
          <Link href="/generate" className="rounded-lg bg-acc px-3 py-2 text-sm font-medium text-white">
            + Generate More
          </Link>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="mb-5 rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red">
          ⚠ <b>{overdue.length} post{overdue.length > 1 ? "s" : ""} past auto-approve deadline</b> — n8n will publish them automatically soon. Edit now if needed.
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="text-xs text-t2">Pending Review</div>
          <div className="mt-1 text-2xl font-semibold text-amb">{pendCount}</div>
          <div className="text-[10px] text-t2">Reply YES on Telegram</div>
        </div>
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="text-xs text-t2">Approved</div>
          <div className="mt-1 text-2xl font-semibold text-grn">{apprCount}</div>
          <div className="text-[10px] text-t2">Ready to publish</div>
        </div>
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="text-xs text-t2">Published</div>
          <div className="mt-1 text-2xl font-semibold text-blu">{pubCount}</div>
          <div className="text-[10px] text-t2">Live on platforms</div>
        </div>
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="text-xs text-t2">Rejected</div>
          <div className="mt-1 text-2xl font-semibold text-red">{rejCount}</div>
          <div className="text-[10px] text-t2">Need revision</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {COLS.map((col) => (
          <div key={col.id} className="rounded-xl border border-b1/40 bg-c1 p-4">
            <div className="mb-3 flex items-center gap-2 border-b pb-2" style={{ borderColor: col.color + "22" }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-xs font-semibold" style={{ color: col.color }}>
                {col.label}
              </span>
              <span
                className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: col.color + "22", color: col.color }}
              >
                {grouped[col.id].length}
              </span>
            </div>
            <div className="space-y-3">
              {grouped[col.id].map((p) => {
                const dl = p.approval_deadline ? new Date(p.approval_deadline) : null;
                const hours = dl && col.id === "pending_approval" ? Math.round((dl.getTime() - Date.now()) / 3600000) : null;
                const isOverdue = dl && dl < new Date() && col.id === "pending_approval";
                return (
                  <div
                    key={p.id}
                    onClick={() => setEditing(p)}
                    className="cursor-pointer rounded-lg border border-b1 bg-c2 p-3 transition-colors hover:border-acc"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <PlatformBadge platform={p.platform} />
                      {p.scheduled_at && <span className="ml-auto text-[10px] text-t2">{formatDate(p.scheduled_at)}</span>}
                    </div>
                    {isOverdue && (
                      <div className="mb-2 inline-block rounded bg-red/15 px-2 py-0.5 text-[10px] font-medium text-red">
                        OVERDUE
                      </div>
                    )}
                    {hours !== null && !isOverdue && hours > -1 && (
                      <div className="mb-2 text-[10px] text-amb">⏱ {hours}h to auto-approve</div>
                    )}
                    <p className="mb-2 text-xs leading-relaxed text-t1">
                      {escapeHtml((p.content || "").slice(0, 100))}
                      {p.content && p.content.length > 100 && "..."}
                    </p>
                    {p.hashtags && p.hashtags.length > 0 && (
                      <p className="mb-2 text-[10px] text-acc2">
                        {p.hashtags.slice(0, 3).map((h) => "#" + h).join(" ")}
                      </p>
                    )}
                    <p className="mb-3 text-[10px] text-t2">by {escapeHtml(p.author || "AI")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {col.id === "pending_approval" && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, "approved"); }} className="rounded bg-grn px-2 py-1 text-[10px] text-white">
                            ✓
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(p.id, "rejected"); }} className="rounded bg-red px-2 py-1 text-[10px] text-white">
                            ✕
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditing(p); }} className="rounded bg-b1 px-2 py-1 text-[10px] text-t1">
                            ✏
                          </button>
                        </>
                      )}
                      {(col.id === "approved" || col.id === "auto_approved") && (
                        <button onClick={(e) => { e.stopPropagation(); publish(p); }} className="rounded bg-acc px-2 py-1 text-[10px] text-white">
                          Publish →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-b1 bg-c1 p-6">
            <div className="mb-4 text-base font-semibold text-t1">Edit & Review Post</div>
            <div className="mb-3 flex items-center gap-2">
              <PlatformBadge platform={editing.platform} />
              <span className="text-xs text-t2">by {escapeHtml(editing.author || "AI")}</span>
            </div>
            {editing.image_url && (
              <img
                src={editing.image_url}
                alt="post"
                className="mb-3 max-h-64 w-full rounded-lg object-contain"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-t2">Direct Image URL</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={editing.image_url || ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
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
              <div>
                <label className="mb-1 block text-xs text-t2">Image Prompt</label>
                <div className="flex gap-2">
                  <textarea
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    rows={2}
                    value={editing.image_prompt || ""}
                    onChange={(e) => setEditing({ ...editing, image_prompt: e.target.value })}
                  />
                  <button
                    onClick={regenerateImage}
                    className="shrink-0 rounded-lg bg-acc px-3 py-2 text-xs font-medium text-white"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Edit Content</label>
                <textarea
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  rows={5}
                  value={editing.content || ""}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Hashtags (comma separated)</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={(editing.hashtags || []).join(", ")}
                  onChange={(e) => setEditing({ ...editing, hashtags: e.target.value.split(",").map((h) => h.trim().replace(/^#/, "")).filter(Boolean) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-t2">Publish Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={(editing.scheduled_at || "").split("T")[0]}
                    onChange={(e) => setEditing({ ...editing, scheduled_at: e.target.value + "T" + (editing.best_time || "09:00") + ":00" })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-t2">Status</label>
                  <select
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                  >
                    <option value="pending_approval">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={saveEdit} className="flex-1 rounded-lg bg-grn py-2.5 text-sm font-medium text-white">
                ✓ Save
              </button>
              <button onClick={() => setEditing(null)} className="rounded-lg bg-b1 px-4 py-2.5 text-sm text-t2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
