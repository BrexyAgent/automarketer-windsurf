"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import { setSelectedBrand } from "@/lib/brand";
import { addBrand } from "./actions";
import Link from "next/link";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];
type Post = Database["public"]["Tables"]["posts"]["Row"];

const PLATFORMS = [
  { id: "instagram", abbr: "IG", color: "#C13584" },
  { id: "linkedin", abbr: "LI", color: "#0A66C2" },
  { id: "twitter", abbr: "X", color: "#1A8CD8" },
  { id: "facebook", abbr: "FB", color: "#1877F2" },
  { id: "tiktok", abbr: "TT", color: "#2FD6E0" },
  { id: "youtube", abbr: "YT", color: "#CC0000" },
];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function useBrands() {
  const supabase = createClient();
  const { orgId } = useBrand();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!orgId) return;
    setLoading(true);
    try {
      const [{ data: b }, { data: p }] = await Promise.all([
        supabase
          .from("brands")
          .select("*")
          .eq("organization_id", orgId)
          .eq("is_active", true),
        supabase
          .from("posts")
          .select("*")
          .eq("organization_id", orgId),
      ]);
      setBrands((b || []) as unknown as Brand[]);
      setPosts((p || []) as unknown as Post[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orgId]);

  return { supabase, orgId, brands, posts, loading, refresh: load };
}

function PlatformChip({ id }: { id: string }) {
  const p = PLATFORMS.find((x) => x.id === id);
  if (!p) return null;
  return (
    <span
      className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-md text-[11px] font-semibold text-white"
      style={{ backgroundColor: p.color + "22", color: p.color }}
    >
      {p.abbr}
    </span>
  );
}

export default function BrandsPage() {
  const { supabase, orgId, brands, posts, loading, refresh } = useBrands();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    industry: "",
    website: "",
    products: "",
    targetAudience: "",
    platforms: "instagram, linkedin, twitter, facebook",
    notificationEmail: "",
    telegramChatId: "",
  });

  const countsByBrand = useMemo(() => {
    const map: Record<string, { posts: number; pending: number }> = {};
    for (const b of brands) {
      const bp = posts.filter((p) => p.brand_id === b.id);
      map[b.id] = {
        posts: bp.length,
        pending: bp.filter((p) => p.status === "pending_approval").length,
      };
    }
    return map;
  }, [brands, posts]);

  async function saveBrand() {
    if (!form.name.trim() || !form.industry.trim()) return;

    setSaving(true);
    try {
      const pl = form.platforms
        .split(",")
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);

      const { brand } = await addBrand({
        name: form.name.trim(),
        industry: form.industry.trim(),
        website: form.website.trim(),
        products: form.products.trim(),
        targetAudience: form.targetAudience.trim(),
        platforms: pl.length ? pl : ["instagram", "linkedin", "twitter"],
        notificationEmail: form.notificationEmail.trim(),
        telegramChatId: form.telegramChatId.trim(),
      });

      setSelectedBrand((brand as any)?.id ?? "");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Failed to save brand. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBrand(id: string, name: string) {
    if (!confirm('Delete "' + name + '"? This will remove all its posts and cannot be undone.')) return;
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">All Brands</h1>
          <p className="mt-1 text-sm text-t2">{brands.length} client{brands.length !== 1 ? "s" : ""} managed</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={saving}
          className="rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          + Add Brand
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-t2">Loading...</div>
      ) : brands.length === 0 ? (
        <div className="rounded-xl border border-b1 bg-c1 p-8 text-center">
          <div className="mb-2 text-3xl">🏷</div>
          <div className="text-base font-semibold text-t1">No Brands Yet</div>
          <p className="mt-1 text-sm text-t2">Add your first client brand to get started.</p>
          <button
            onClick={() => setShowModal(true)}
            disabled={saving}
            className="mt-4 rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Add Brand
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => {
            const c = countsByBrand[b.id] || { posts: 0, pending: 0 };
            return (
              <Link
                key={b.id}
                href="/dashboard"
                className="group rounded-xl border border-b1 bg-c1 p-5 transition-colors hover:border-acc"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-acc-bg text-lg font-semibold text-acc2">
                    {escapeHtml((b.name || "?").charAt(0).toUpperCase())}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-t1">{escapeHtml(b.name)}</div>
                    <div className="truncate text-xs text-t2">{escapeHtml(b.industry || "")}</div>
                  </div>
                  <span className="rounded-md bg-grn/15 px-2 py-0.5 text-[10px] font-medium text-grn">Active</span>
                </div>

                {b.website && (
                  <div className="mb-3 truncate text-xs text-t2">{escapeHtml(b.website)}</div>
                )}

                <div className="mb-3 flex gap-1.5">
                  {(b.platforms || []).map((pl) => (
                    <PlatformChip key={pl} id={pl} />
                  ))}
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-b1 bg-c2 py-2 text-center">
                    <div className="text-lg font-semibold text-t1">{c.posts}</div>
                    <div className="text-[10px] text-t2">Posts</div>
                  </div>
                  <div className="rounded-lg border border-b1 bg-c2 py-2 text-center">
                    <div className={`text-lg font-semibold ${c.pending ? "text-amb" : "text-grn"}`}>{c.pending}</div>
                    <div className="text-[10px] text-t2">Pending</div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    deleteBrand(b.id, b.name);
                  }}
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-1.5 text-xs font-medium text-t2 transition-colors hover:border-red hover:text-red"
                >
                  Delete Brand
                </button>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-b1 bg-c1 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-base font-semibold text-t1">Add New Brand / Client</div>
              <button onClick={() => setShowModal(false)} className="rounded-md px-2 py-1 text-sm text-t2 hover:bg-c2">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-t2">Brand Name *</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Brexy"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Industry *</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="e.g. Food & Beverage"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-t2">Website URL</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://yoursite.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-t2">Products / Services</label>
                <textarea
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  rows={2}
                  value={form.products}
                  onChange={(e) => setForm({ ...form, products: e.target.value })}
                  placeholder="Briefly describe what this brand sells..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Target Audience</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  placeholder="Food lovers in Delhi, 25-45"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Platforms (comma separated)</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.platforms}
                  onChange={(e) => setForm({ ...form, platforms: e.target.value })}
                  placeholder="instagram, linkedin, twitter, facebook"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Notification Email</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.notificationEmail}
                  onChange={(e) => setForm({ ...form, notificationEmail: e.target.value })}
                  placeholder="client@email.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Telegram Chat ID</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.telegramChatId}
                  onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                  placeholder="123456789"
                />
              </div>
            </div>

            <button
              onClick={saveBrand}
              disabled={saving || !form.name.trim() || !form.industry.trim()}
              className="mt-5 w-full rounded-lg bg-acc py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Brand & Start"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
