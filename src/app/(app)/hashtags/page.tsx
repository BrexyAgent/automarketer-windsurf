"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];
type Intel = Database["public"]["Tables"]["brand_intelligence"]["Row"];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function TagChip({ tag, colorClass, bgClass, borderClass }: { tag: string; colorClass: string; bgClass: string; borderClass: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText("#" + tag);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }
  return (
    <button
      onClick={copy}
      title="Click to copy"
      className={`m-1 inline-block cursor-pointer rounded-full border px-3 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80 ${colorClass} ${bgClass} ${borderClass}`}
    >
      #{copied ? "copied" : escapeHtml(tag)}
    </button>
  );
}

function Section({ title, colorClass, tags, color }: { title: string; colorClass: string; tags: string[]; color: "acc" | "blu" | "amb" | "grn" }) {
  const colorMap = {
    acc: { text: "text-acc2", bg: "bg-acc-bg", border: "border-acc2/20" },
    blu: { text: "text-blu", bg: "bg-blu-bg", border: "border-blu/20" },
    amb: { text: "text-amb", bg: "bg-amb-bg", border: "border-amb/20" },
    grn: { text: "text-grn", bg: "bg-grn-bg", border: "border-grn/20" },
  };
  const c = colorMap[color];
  return (
    <div className="rounded-xl border border-b1 bg-c1 p-4">
      <div className={`mb-3 text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}>{title}</div>
      <div className="-m-1 flex flex-wrap">
        {tags.length > 0 ? (
          tags.map((t, i) => <TagChip key={i} tag={t} colorClass={c.text} bgClass={c.bg} borderClass={c.border} />)
        ) : (
          <span className="m-1 text-[11px] text-t3">No tags yet — regenerate to build this bank.</span>
        )}
      </div>
    </div>
  );
}

function slugify(s: string) {
  return String(s).replace(/[^a-zA-Z0-9]/g, "");
}

function buildHashtagBanks(brand: Brand) {
  const name = slugify(brand.name || "Brand");
  const industry = slugify(brand.industry || "Industry");
  const year = new Date().getFullYear();

  const daily = `#${name} #${name}${industry} #${industry} #${industry}Trends #${name}Daily #${industry}Insights #${name}News #${industry}Community #${name}${industry} #${industry}Best`;

  const brandTags = [name, `${name}${industry}`];
  if (brand.content_pillars) {
    brand.content_pillars.forEach((p) => brandTags.push(slugify(String(p))));
  }

  const industryTags = [industry, `${industry}Trends`, `${industry}News`, `${industry}Insights`];
  const trending = [`${industry}Now`, `${industry}${year}`, `Best${industry}`];
  const niche = [`${name}Daily`, `Inside${name}`, `${industry}Tips`];

  const byPlatform = {
    instagram: [...brandTags, ...industryTags].slice(0, 8),
    linkedin: [...industryTags, ...trending].slice(0, 5),
    twitter: [...brandTags, ...trending, ...niche].slice(0, 8),
  };

  return { daily_set: daily, brand: brandTags, industry: industryTags, trending, niche, byPlatform };
}

export default function HashtagsPage() {
  const supabase = createClient();
  const { brand, orgId } = useBrand();
  const [intel, setIntel] = useState<Intel | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  async function loadIntel() {
    if (!brand) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: i } = await supabase
        .from("brand_intelligence")
        .select("*")
        .eq("brand_id", brand.id)
        .maybeSingle();
      setIntel((i || null) as unknown as Intel | null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntel();
  }, [brand]);

  const banks = useMemo(() => {
    const raw = intel?.hashtag_banks as any;
    if (raw && raw.daily_set) return raw as { daily_set: string; brand: string[]; industry: string[]; trending: string[]; niche: string[]; byPlatform: Record<string, string[]> };
    return null;
  }, [intel]);

  async function regenerate() {
    if (!brand) {
      alert("Select a brand first.");
      return;
    }
    setRunning(true);
    const newBanks = buildHashtagBanks(brand);

    const { data: existing } = await supabase
      .from("brand_intelligence")
      .select("id")
      .eq("brand_id", brand.id)
      .maybeSingle();

    if (existing) {
      await (supabase.from("brand_intelligence") as any).update({ hashtag_banks: newBanks }).eq("id", (existing as any).id);
    } else {
      await supabase.from("brand_intelligence").insert({
        organization_id: orgId,
        brand_id: brand.id,
        hashtag_banks: newBanks,
        completed_at: new Date().toISOString(),
      } as any);
    }

    await loadIntel();
    setRunning(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-t2">
        <span className="spin inline-block">⟳</span> Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">Hashtag Intelligence</h1>
          <p className="mt-1 text-sm text-t2">Auto-generated from your brand intelligence</p>
        </div>
        {brand ? (
          <button
            onClick={regenerate}
            disabled={running}
            className="rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {running ? "⟳ Generating..." : "⟳ Regenerate"}
          </button>
        ) : (
          <button onClick={() => (window.location.href = "/brands")} className="rounded-lg bg-c2 px-4 py-2 text-sm font-medium text-t1">
            Add brand first
          </button>
        )}
      </div>

      {running ? (
        <div className="rounded-xl border border-b1 bg-c1 p-8 text-center text-sm text-t2">
          <span className="spin inline-block">⟳</span> Generating hashtag banks...
        </div>
      ) : banks ? (
        <>
          {banks.daily_set && (
            <div
              className="mb-4 cursor-pointer rounded-xl border border-acc/30 bg-c1 p-5"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(banks.daily_set);
                } catch {}
              }}
              title="Click to copy"
            >
              <div className="mb-2 text-[11px] font-semibold text-acc2">📅 DAILY USE SET — Click to copy</div>
              <div className="break-words text-[13px] leading-relaxed text-t1">{banks.daily_set}</div>
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Section title="Brand Tags" colorClass="text-acc2" tags={banks.brand || []} color="acc" />
            <Section title="Industry" colorClass="text-blu" tags={banks.industry || []} color="blu" />
            <Section title="Trending" colorClass="text-amb" tags={banks.trending || []} color="amb" />
            <Section title="Niche" colorClass="text-grn" tags={banks.niche || []} color="grn" />
          </div>

          {banks.byPlatform && Object.keys(banks.byPlatform).length > 0 && (
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-t2">Platform-Specific Sets</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(banks.byPlatform).map(([pl, tags]) => {
                  const title = pl.charAt(0).toUpperCase() + pl.slice(1);
                  return (
                    <div key={pl} className="rounded-lg border border-b1 bg-c2 p-3">
                      <div className="mb-2 text-[11px] font-semibold text-t1">{title}</div>
                      <div className="-m-1 flex flex-wrap">
                        {(tags || []).map((t, i) => (
                          <TagChip key={i} tag={t} colorClass="text-t2" bgClass="bg-c3" borderClass="border-b1" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-b1 bg-c1 p-8 text-center">
          <div className="mb-2 text-3xl">#</div>
          <div className="text-base font-semibold text-t1">No hashtag banks yet</div>
          <p className="mt-1 text-sm text-t2">Click Regenerate to build hashtag sets for this brand.</p>
        </div>
      )}
    </div>
  );
}
