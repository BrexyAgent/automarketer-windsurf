"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];
type Intel = Database["public"]["Tables"]["brand_intelligence"]["Row"];

const PL = [
  { id: "instagram", name: "Instagram", color: "#E1306C" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2" },
  { id: "twitter", name: "Twitter / X", color: "#1A8CD8" },
  { id: "facebook", name: "Facebook", color: "#1877F2" },
  { id: "tiktok", name: "TikTok", color: "#2FD6E0" },
  { id: "youtube", name: "YouTube", color: "#CC0000" },
];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function BrandVoicePage() {
  const supabase = createClient();
  const { brand } = useBrand();
  const [intel, setIntel] = useState<Intel | null>(null);
  const [form, setForm] = useState<Partial<Brand>>({});
  const [pillars, setPillars] = useState<string[]>([]);
  const [newPillar, setNewPillar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  async function loadBrand() {
    if (!brand) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: b }, { data: i }] = await Promise.all([
        supabase.from("brands").select("*").eq("id", brand.id).single(),
        supabase.from("brand_intelligence").select("*").eq("brand_id", brand.id).single(),
      ]);
      const fresh = (b || brand) as unknown as Partial<Brand>;
      setForm(fresh);
      setPillars(fresh.content_pillars || []);
      setIntel((i || null) as unknown as Intel | null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrand();
  }, [brand]);

  function togglePlatform(id: string) {
    const current = (form.platforms || []) as string[];
    setForm({ ...form, platforms: current.includes(id) ? current.filter((p) => p !== id) : [...current, id] });
  }

  function addPillar() {
    if (!newPillar.trim()) return;
    setPillars([...pillars, newPillar.trim()]);
    setNewPillar("");
  }

  function delPillar(i: number) {
    setPillars(pillars.filter((_, idx) => idx !== i));
  }

  async function loadAttachments() {
    if (!brand) {
      setAttachments([]);
      return;
    }
    const { data, error } = await supabase.storage
      .from("post-images")
      .list(`brand-attachments/${brand.id}`);
    if (error) {
      console.error(error);
      return;
    }
    const items = (data || []).filter((x) => x.name !== ".emptyFolderPlaceholder");
    setAttachments(
      items.map((x) => ({
        name: x.name,
        url: supabase.storage
          .from("post-images")
          .getPublicUrl(`brand-attachments/${brand.id}/${x.name}`).data.publicUrl,
      }))
    );
  }

  useEffect(() => {
    loadAttachments();
  }, [brand]);

  async function uploadAttachment(file: File) {
    if (!brand) return;
    setUploadingAttachment(true);
    const path = `brand-attachments/${brand.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file);
    setUploadingAttachment(false);
    if (error) {
      alert("Upload failed: " + error.message);
    } else {
      loadAttachments();
    }
  }

  async function deleteAttachment(name: string) {
    if (!brand) return;
    const { error } = await supabase.storage
      .from("post-images")
      .remove([`brand-attachments/${brand.id}/${name}`]);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      loadAttachments();
    }
  }

  async function save() {
    if (!brand) return;
    const update: any = {
      name: form.name,
      industry: form.industry,
      website: form.website,
      products: form.products,
      target_audience: form.target_audience,
      faqs: form.faqs,
      keywords: form.keywords,
      avoid: form.avoid,
      platforms: form.platforms,
      content_pillars: pillars,
    };
    const { error } = await (supabase.from("brands") as any)
      .update(update)
      .eq("id", brand.id);
    if (error) alert("Error: " + error.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadBrand();
    }
  }

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">Brand Voice &amp; Profile</h1>
        <p className="mt-1 text-sm text-t2">Shapes every AI-generated post</p>
      </div>

      {intel?.voice_profile && (
        <div className="mb-6 rounded-xl border border-acc/30 bg-c1 p-5">
          <div className="mb-2 text-[11px] font-semibold uppercase text-acc2">AI-Generated Voice Profile</div>
          <div className="whitespace-pre-wrap text-sm leading-7 text-t1">{escapeHtml(intel.voice_profile)}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Brand Info</div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-t2">Brand Name</label>
                  <input
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-t2">Industry</label>
                  <input
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={form.industry || ""}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Website</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.website || ""}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Products / Services</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.products || ""}
                  onChange={(e) => setForm({ ...form, products: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Target Audience</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.target_audience || ""}
                  onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Vocabulary Rules</div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-grn">Always use</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.keywords || ""}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-red">Always avoid</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.avoid || ""}
                  onChange={(e) => setForm({ ...form, avoid: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Content Pillars</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {pillars.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full border border-acc/30 bg-acc/10 px-3 py-1 text-xs text-acc2"
                >
                  {p}
                  <button onClick={() => delPillar(i)} className="text-acc2 hover:text-t1">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                placeholder="New pillar..."
                value={newPillar}
                onChange={(e) => setNewPillar(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPillar())}
              />
              <button onClick={addPillar} className="rounded-lg bg-c2 px-3 py-2 text-sm font-medium text-t1 hover:bg-b1">
                + Add
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Platforms</div>
            <div className="flex flex-wrap gap-2">
              {PL.map((pl) => {
                const on = (form.platforms || []).includes(pl.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => togglePlatform(pl.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      on
                        ? "border-transparent bg-acc/15 text-acc2"
                        : "border-b1 bg-c2 text-t2 hover:text-t1"
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
            <label className="mb-1 block text-xs text-t2">FAQs / Key Messages</label>
            <textarea
              rows={4}
              placeholder="Paste FAQs or key brand messages..."
              className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
              value={form.faqs || ""}
              onChange={(e) => setForm({ ...form, faqs: e.target.value })}
            />
          </div>

          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Attachments & Documents</div>
            <div className="space-y-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAttachment(f);
                  e.target.value = "";
                }}
                className="block w-full text-xs text-t2 file:mr-3 file:rounded-lg file:border-0 file:bg-acc file:px-3 file:py-2 file:text-sm file:text-white"
                disabled={uploadingAttachment}
              />
              {uploadingAttachment && <div className="text-xs text-t2">Uploading...</div>}
              {attachments.length === 0 ? (
                <div className="text-xs text-t2">No attachments yet. Upload decks, docs, or guides.</div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((a) => (
                    <div key={a.name} className="flex items-center justify-between rounded-lg border border-b1 bg-c2 p-2">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[200px] truncate text-xs text-blu hover:underline"
                      >
                        {a.name}
                      </a>
                      <button
                        onClick={() => deleteAttachment(a.name)}
                        className="text-xs text-red hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={save}
            className={`w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors ${
              saved ? "bg-grn" : "bg-acc hover:bg-acc2"
            }`}
          >
            {saved ? "✓ Saved!" : "◆ Save Brand Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
