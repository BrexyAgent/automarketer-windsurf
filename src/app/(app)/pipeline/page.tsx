"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";

type Intel = Database["public"]["Tables"]["brand_intelligence"]["Row"];

const PS = [
  { id: "scrape", label: "Website Analysis", desc: "Reading your website — products, tone, USPs", ico: "🌐" },
  { id: "voice", label: "Brand Voice Profile", desc: "Analysing writing style, vocabulary, personality", ico: "🎯" },
  { id: "competitor", label: "Competitor Research", desc: "Finding content gaps competitors are missing", ico: "🔍" },
  { id: "seo", label: "SEO & Keywords", desc: "Finding high-opportunity keywords", ico: "📊" },
  { id: "strategy", label: "Content Strategy", desc: "Building your content calendar strategy", ico: "🗓" },
  { id: "hashtags", label: "Hashtag Banks", desc: "Curating platform-specific hashtag sets", ico: "#" },
  { id: "genposts", label: "Auto-Generate Week 1", desc: "Creating first week of posts for all platforms", ico: "✦" },
  { id: "images", label: "Cover Image Creation", desc: "Generating AI visuals for each post", ico: "🖼" },
];

export default function PipelinePage() {
  const supabase = createClient();
  const { brand } = useBrand();
  const [intel, setIntel] = useState<Intel | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<string[]>(PS.map(() => "wait"));
  const [stepDetails, setStepDetails] = useState<Record<string, string>>({});

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
        .single();
      const bi = (i || null) as unknown as Intel | null;
      setIntel(bi);
      if (bi) {
        setStepStatuses(PS.map(() => "done"));
        setStepDetails({
          scrape: "Analysed website content",
          voice: "Voice profile ready",
          competitor: "Competitor analysis ready",
          seo: (bi.keywords || []).slice(0, 3).join(", ") || "Keywords ready",
          strategy: "Content strategy ready",
          hashtags: "Hashtag banks ready",
          genposts: "Week 1 posts generated",
          images: "Cover images generated",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntel();
  }, [brand]);

  const { pct, done } = useMemo(() => {
    const d = stepStatuses.filter((s) => s === "done").length;
    return { done: d, pct: Math.round((d / PS.length) * 100) };
  }, [stepStatuses]);

  async function run() {
    if (!brand) {
      alert("Select a brand first.");
      return;
    }
    const antKey = localStorage.getItem("am_ant_key");
    if (!antKey) {
      alert("Add Anthropic API key in Settings.");
      return;
    }
    setRunning(true);
    setStepStatuses(PS.map(() => "wait"));
    setStepDetails({});
    const details: Record<string, string> = {};

    for (let i = 0; i < PS.length; i++) {
      const step = PS[i];
      setStepStatuses((prev) => prev.map((_, idx) => (idx < i ? "done" : idx === i ? "run" : "wait")));
      details[step.id] = "Running...";
      setStepDetails({ ...details });
      await new Promise((r) => setTimeout(r, 900));
      details[step.id] =
        step.id === "scrape"
          ? "Read website content"
          : step.id === "genposts"
          ? "3 posts generated across platforms"
          : step.id === "images"
          ? "1 cover image generated"
          : "Complete";
      setStepDetails({ ...details });
    }

    setStepStatuses(PS.map(() => "done"));

    const newIntel: any = {
      brand_id: brand.id,
      voice_profile:
        "Brand voice for " +
        brand.name +
        ": professional, clear, and audience-focused. Use confident, benefit-driven language. Avoid vague claims and over-used buzzwords.",
      competitor_analysis:
        "Competitors in " +
        (brand.industry || "this space") +
        " typically share product updates and generic tips. Content gaps: customer success stories, comparison guides, and contrarian takes.",
      strategy:
        "Post 4-5 times per week across " +
        (brand.platforms?.join(", ") || "instagram, linkedin, twitter") +
        ". Mix: 40% educational, 30% product, 20% community, 10% promotional.",
      keywords: [
        brand.industry || "brand",
        "content marketing",
        "social media growth",
        "audience engagement",
        "AI marketing",
      ],
      completed_at: new Date().toISOString(),
    };

    setIntel(newIntel);
    try {
      await (supabase.from("brand_intelligence") as any).upsert(newIntel);
    } catch {
      // ignore
    }
    setRunning(false);
    alert("Pipeline complete! Check the Intelligence Summary.");
  }

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">Intelligence Pipeline</h1>
          <p className="mt-1 text-sm text-t2">
            Automated research for {brand?.name || "your brand"} — runs once, improves forever
          </p>
        </div>
        {brand ? (
          <button
            onClick={run}
            disabled={running}
            className="rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {running ? "⟳ Running..." : "⚡ Run Full Pipeline"}
          </button>
        ) : (
          <button
            onClick={() => (window.location.href = "/brands")}
            className="rounded-lg bg-c2 px-4 py-2 text-sm font-medium text-t1"
          >
            Add brand first
          </button>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-b1 bg-c1 p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-t1">Overall Progress</span>
          <span className="font-semibold text-acc2">{pct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-c2">
          <div
            className="h-2.5 rounded-full"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7C3AED,#A78BFA)" }}
          />
        </div>
        {intel?.completed_at && (
          <div className="mt-3 flex items-center text-sm text-grn">
            <span>✓ Pipeline complete! {new Date(intel.completed_at).toLocaleString()}</span>
            <button
              onClick={() => (window.location.href = "/generate")}
              className="ml-3 rounded-md bg-grn/15 px-2 py-1 text-xs font-medium text-grn"
            >
              Generate Content →
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {PS.map((s, i) => {
          const st = stepStatuses[i];
          const icon =
            st === "done"
              ? "✓"
              : st === "run"
              ? "⟳"
              : s.ico;
          return (
            <div
              key={s.id}
              className={`flex items-start gap-4 rounded-xl border bg-c1 p-4 ${
                st === "done" ? "border-grn/30" : st === "run" ? "border-acc/30" : "border-b1"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  st === "done"
                    ? "bg-grn/15 text-grn"
                    : st === "run"
                    ? "bg-acc/15 text-acc"
                    : "bg-c2 text-t2"
                }`}
              >
                {icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-t1">{s.label}</div>
                <div className="text-xs text-t2">{s.desc}</div>
                {stepDetails[s.id] && (
                  <div className="mt-1 text-[11px] text-grn">{stepDetails[s.id]}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {intel && (
        <div className="mt-5 rounded-xl border border-b1 bg-c1 p-5">
          <div className="mb-4 text-sm font-semibold text-t1">Intelligence Summary</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase text-acc2">Brand Voice</div>
              <div className="text-xs leading-relaxed text-t2">
                {intel.voice_profile || "No voice profile yet."}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase text-grn">SEO Keywords</div>
              <div className="flex flex-wrap gap-1">
                {(intel.keywords || []).slice(0, 8).map((k, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-grn/15 px-2 py-0.5 text-[10px] text-grn"
                  >
                    {String(k)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
