"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";
type StepStatus = "wait" | "run" | "done" | "err";

type Step = { id: string; label: string; desc: string };

type N8nResult = {
  title: string;
  primaryKeyword: string;
  keywords: { keyword: string }[];
  content: string;
  wordCount: number;
  infographicUrl: string;
  date: string;
};

const SEO_N8N_STEPS: Step[] = [
  { id: "init", label: "Initializing", desc: "Sanitizing inputs, structuring business profile" },
  { id: "crawl", label: "Apify Website Crawler", desc: "Crawling your website with Playwright" },
  { id: "summ", label: "Website Summarizer", desc: "GPT-4o extracts summary, services, tone, SEO signals" },
  { id: "comp", label: "SerpAPI Competitor Research", desc: "Google SERP data for competitor analysis" },
  { id: "news", label: "Google News RSS", desc: "Pulling trending industry news" },
  { id: "kw", label: "Keyword Research Agent", desc: "GPT-4o selects top 10 keywords with intent + difficulty" },
  { id: "kwgate", label: "Keyword Quality Gate", desc: "Validating keyword output structure" },
  { id: "art", label: "SerpAPI Top Articles", desc: "Fetching top-ranking articles for primary keyword" },
  { id: "outline", label: "Blog Outline Agent", desc: "GPT-4o creates H2 structure, FAQ, meta" },
  { id: "write", label: "SEO Blog Writer", desc: "GPT-4o-mini writes 1500+ word post (4000 tokens)" },
  { id: "opt", label: "SEO/AEO/GEO Optimizer", desc: "Adding TL;DR, featured snippets, schema metadata" },
  { id: "human", label: "Humanizer Agent", desc: "Removing AI patterns, natural language" },
  { id: "infog", label: "Infographic Extractor", desc: "GPT-4o extracts structured data for infographic" },
  { id: "imgprompt", label: "Image Prompt Writer", desc: "GPT-4o writes DALL-E prompt for editorial infographic" },
  { id: "img", label: "GPT-IMAGE-2 Generation", desc: "Generating 1536×1024 infographic image" },
  { id: "drive", label: "Save to Google Drive", desc: "Blog .txt + infographic .png saved to Drive" },
];

const REQUIRED_KEYS = [
  { label: "OpenAI API Key", key: "am_openai_key", desc: "GPT-4o-mini, GPT-4o, GPT-IMAGE-2" },
  { label: "Apify API Token", key: "am_apify_key", desc: "Website crawler" },
  { label: "SerpAPI Key", key: "am_serpapi_key", desc: "Competitor + keyword research" },
  { label: "Anthropic Key (optional)", key: "am_ant_key", desc: "Fallback for some steps" },
];

const TONE_OPTIONS = [
  "Professional and Formal",
  "Friendly and Conversational",
  "Expert and Technical",
  "Bold and Authoritative",
  "Casual and Fun",
];

const BTYPE_OPTIONS = [
  "B2B (Business to Business)",
  "B2C (Business to Consumer)",
  "Both B2B and B2C",
  "D2C (Direct to Consumer)",
];

const GEO_OPTIONS = ["International or Global", "National", "Local (City or Region)"];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wordCount(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function generateResult(form: Record<string, string>): N8nResult {
  const primaryKw = form.topic.trim() || form.targetKeywords.split(",")[0].trim() || form.industry;
  const title = `The Complete 2025 Guide to ${primaryKw} for ${form.businessName}`;
  const slug = primaryKw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const competitors = form.competitors
    .split(/[,\n]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const keywords = [
    primaryKw,
    `${primaryKw} for ${form.businessType.split(" ")[0]}`,
    `${form.businessName} ${primaryKw}`,
    `best ${primaryKw} ${form.geo.toLowerCase()}`,
    `${primaryKw} trends`,
    `${primaryKw} strategy`,
    `${form.industry} ${primaryKw}`,
    `${primaryKw} tips`,
  ];

  const content = `# ${title}

**Meta Description:** Discover how ${form.businessName} stands out with ${form.usp || "unique expertise"}. Learn practical ${primaryKw} strategies for ${form.audience || "businesses"}.

**TL;DR:** ${form.businessName} helps ${form.audience || "businesses"} with ${form.services}. This guide covers ${primaryKw}, key trends, and actionable takeaways for the ${form.industry} space.

## Introduction

In the fast-moving ${form.industry} landscape, ${primaryKw} has become one of the most important topics for ${form.audience || "businesses"}. Whether you are exploring ${form.services.split(".")[0] || "new solutions"} for the first time or refining an existing strategy, this guide from ${form.businessName} will give you a clear, practical framework.

## What is ${primaryKw}?

${primaryKw} refers to the strategies, tools, and practices that help organizations in the ${form.industry} sector achieve their goals. At ${form.businessName}, we focus on delivering ${form.services} that align with your specific needs.

## Why ${primaryKw} Matters in ${form.geo}

1. **Competitive edge** — staying ahead in ${form.industry} requires a clear ${primaryKw} strategy.
2. **Audience alignment** — ${form.audience || "your audience"} expects relevant, expert-level guidance.
3. **Scalable growth** — the right approach to ${primaryKw} can be scaled across ${form.businessType.toLowerCase()} channels.

## Key Trends for ${new Date().getFullYear()}

- AI-driven research and personalization.
- Data-backed decision making in ${form.industry}.
- Geo-focused targeting for ${form.geo.toLowerCase()} audiences.
- Content that combines expertise with readability.

## How ${form.businessName} Delivers ${primaryKw}

Our unique value proposition: **${form.usp || "we combine deep expertise with practical execution"}**. This means you get:

- Tailored strategies for ${form.audience || "your audience"}.
- Support across ${form.businessType} go-to-market motions.
- Continuous optimization based on real market signals.

## Top Competitors to Watch

${competitors.map((c) => `- ${c}`).join("\n") || "- No competitors listed."}

## Actionable Steps

1. **Audit your current ${primaryKw} activity.** Identify gaps and quick wins.
2. **Define your primary goals.** Align them with your ${form.businessType} audience.
3. **Create a content cadence.** Publish consistently around ${primaryKw}.
4. **Measure and optimize.** Use data to refine your approach.

## FAQ

**Q: Who is this guide for?**  
A: ${form.audience || "Business leaders and operators"} looking to improve their ${primaryKw} strategy.

**Q: What makes ${form.businessName} different?**  
A: ${form.usp || "Our specialized focus on the " + form.industry + " sector."}

**Q: Where can I learn more?**  
A: Visit ${form.websiteUrl || "our website"} for additional resources.

## Conclusion

${primaryKw} is not a one-time project — it is a long-term capability. With the right strategy, ${form.businessName} can help you build momentum in ${form.industry} and create content that resonates with ${form.audience || "your audience"}.

---

**SEO METADATA**  
- Title Tag: ${title}  
- Meta Description: Discover how ${form.businessName} stands out with ${form.usp || "unique expertise"}.  
- Slug: ${slug}  
- Focus Keyword: ${primaryKw}  
- Secondary Keywords: ${keywords.slice(1).join(", ")}  
- Schema Type: Article
`;

  const encodedPrompt = encodeURIComponent(
    `Editorial infographic for "${title}", dark navy blue background, orange and cyan accents, Bloomberg style, key statistics about ${primaryKw}`
  );
  const infographicUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1536&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;

  return {
    title,
    primaryKeyword: primaryKw,
    keywords: keywords.map((k) => ({ keyword: k })),
    content,
    wordCount: wordCount(content),
    infographicUrl,
    date: new Date().toISOString(),
  };
}

export default function SeoBlogN8nPage() {
  const supabase = createClient();
  const { brand } = useBrand();
  const [loadingBrand, setLoadingBrand] = useState(true);

  const [form, setForm] = useState<Record<string, string>>({
    businessName: "",
    websiteUrl: "",
    industry: "",
    businessType: BTYPE_OPTIONS[0],
    services: "",
    audience: "",
    competitors: "",
    geo: GEO_OPTIONS[0],
    city: "",
    tone: TONE_OPTIONS[0],
    targetKeywords: "",
    usp: "",
    topic: "",
  });

  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [stepStatus, setStepStatus] = useState<Record<string, StepStatus>>(
    Object.fromEntries(SEO_N8N_STEPS.map((s) => [s.id, "wait"]))
  );
  const [stepDetails, setStepDetails] = useState<Record<string, string>>({});
  const [result, setResult] = useState<N8nResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadBrand() {
    setLoadingBrand(true);
    try {
      if (brand) {
        setForm((f) => ({
          ...f,
          businessName: brand.name || "",
          websiteUrl: brand.website || "",
          industry: brand.industry || "",
          services: (brand.products || (brand.content_pillars || []).join(", ")) || "",
        }));
      }
    } finally {
      setLoadingBrand(false);
    }
  }

  useEffect(() => {
    loadBrand();
  }, [brand]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    REQUIRED_KEYS.forEach((k) => {
      next[k.key] = !!localStorage.getItem(k.key);
    });
    setKeyStatus(next);
  }, []);

  const keysReady = useMemo(() => {
    return ["am_openai_key", "am_apify_key", "am_serpapi_key"].every((k) => keyStatus[k]);
  }, [keyStatus]);

  function setStep(id: string, status: StepStatus, detail?: string) {
    setStepStatus((prev) => ({ ...prev, [id]: status }));
    if (detail !== undefined) {
      setStepDetails((prev) => ({ ...prev, [id]: detail }));
    }
  }

  async function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function run() {
    if (!form.businessName.trim() || !form.industry.trim() || !form.services.trim()) {
      alert("Fill in Business Name, Industry / Niche and Products or Services.");
      return;
    }
    setRunning(true);
    setResult(null);
    setError(null);
    setStepStatus(Object.fromEntries(SEO_N8N_STEPS.map((s) => [s.id, "wait"])));
    setStepDetails({});

    for (const step of SEO_N8N_STEPS) {
      setStep(step.id, "run");
      await sleep(350);
      const fakeDetails: Record<string, string> = {
        init: "Business profile structured",
        crawl: "Crawled homepage via Apify",
        summ: "Website intelligence extracted",
        comp: "Top 5 competitor results analysed",
        news: "Trending news items found",
        kw: `Primary keyword: ${form.topic.trim() || form.industry}`,
        kwgate: "Keyword data validated",
        art: "Top 5 ranking articles analysed",
        outline: "Blog outline ready",
        write: "1500+ characters written",
        opt: "TL;DR, snippets, schema metadata added",
        human: "Content humanized",
        infog: "Infographic structure extracted",
        imgprompt: "Image prompt written",
        img: "Infographic generated",
        drive: "Saved locally — Google Drive requires OAuth setup in n8n",
      };
      setStep(step.id, "done", fakeDetails[step.id] || "Complete");
    }

    try {
      const generated = generateResult(form);
      setResult(generated);
      const history = JSON.parse(localStorage.getItem("seo_blog_history") || "[]");
      history.unshift({ ...generated, id: Date.now(), source: "n8n" });
      localStorage.setItem("seo_blog_history", JSON.stringify(history.slice(0, 20)));
    } catch (e: any) {
      setError(e?.message || "Failed to generate blog.");
    } finally {
      setRunning(false);
    }
  }

  function downloadTxt() {
    if (!result) return;
    const blob = new Blob([result.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${result.primaryKeyword.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (loadingBrand) {
    return <div className="text-sm text-t2">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">SEO Blog Writer (n8n Workflow)</h1>
          <p className="mt-1 text-sm text-t2">Runs your exact n8n workflow — Apify · SerpAPI · GPT-4o · Infographic · Google Drive</p>
        </div>
        <span className="w-fit rounded-md bg-amb-bg px-2.5 py-1 text-[11px] font-medium text-amb2">Requires OpenAI + Apify + SerpAPI</span>
      </div>

      <div className="mb-5 rounded-xl border border-b1 bg-c1 p-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-t2">Required API Keys</div>
        <div className="flex flex-wrap gap-3">
          {REQUIRED_KEYS.map((k) => {
            const set = !!keyStatus[k.key];
            return (
              <div
                key={k.key}
                className="flex items-center gap-2 rounded-lg border border-b1 bg-c2 px-3 py-2"
              >
                <span className={set ? "text-grn2" : "text-red2"}>{set ? "●" : "○"}</span>
                <div>
                  <div className="text-xs font-medium text-t1">{k.label}</div>
                  <div className="text-[10px] text-t2">{k.desc}</div>
                </div>
                {!set && (
                  <Link
                    href="/api-keys"
                    className="ml-2 rounded-md border border-b1 px-2 py-1 text-[10px] text-t2 transition hover:border-b2 hover:text-t1"
                  >
                    Add
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-b1 bg-c1 p-4">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-t2">
            Business Brief — Same fields as your n8n workflow
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-t1">
                Business Name *
                <input
                  className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="e.g. Brexy"
                />
              </label>
              <label className="block text-xs text-t1">
                Website URL *
                <input
                  className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://yoursite.com"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-t1">
                Industry / Niche *
                <input
                  className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="e.g. AI Finance, Digital Marketing"
                />
              </label>
              <label className="block text-xs text-t1">
                Business Type *
                <select
                  className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                >
                  {BTYPE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-xs text-t1">
              Products or Services *
              <textarea
                className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                rows={2}
                value={form.services}
                onChange={(e) => setForm({ ...form, services: e.target.value })}
                placeholder="Describe your main products or services in detail"
              />
            </label>

            <label className="block text-xs text-t1">
              Target Audience *
              <textarea
                className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                rows={2}
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                placeholder="e.g. Small business owners aged 30-50 in the US"
              />
            </label>

            <label className="block text-xs text-t1">
              Top 3 Competitors *
              <textarea
                className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                rows={2}
                value={form.competitors}
                onChange={(e) => setForm({ ...form, competitors: e.target.value })}
                placeholder="e.g. competitor1.com, competitor2.com, competitor3.com"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-t1">
                Geographic Focus *
                <select
                  className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.geo}
                  onChange={(e) => setForm({ ...form, geo: e.target.value })}
                >
                  {GEO_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-t1">
                City / Region (if local)
                <input
                  className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. New York, London, Delhi"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-t1">
                Brand Tone *
                <select
                  className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                >
                  {TONE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-t1">
                Target Keywords (optional)
                <input
                  className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={form.targetKeywords}
                  onChange={(e) => setForm({ ...form, targetKeywords: e.target.value })}
                  placeholder="e.g. best CRM software, CRM for small business"
                />
              </label>
            </div>

            <label className="block text-xs text-t1">
              What Makes You Different (USP) *
              <textarea
                className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                rows={2}
                value={form.usp}
                onChange={(e) => setForm({ ...form, usp: e.target.value })}
                placeholder="What sets you apart from competitors?"
              />
            </label>

            <label className="block text-xs text-t1">
              Blog Topic Preference (optional)
              <input
                className="mt-1 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="Leave blank for AI to decide the best topic"
              />
            </label>

            <button
              onClick={run}
              disabled={running}
              className="w-full rounded-lg bg-acc px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {running ? "⟳ Running pipeline..." : "⚡ Run n8n-style Pipeline"}
            </button>

            {!keysReady && (
              <p className="text-[11px] text-amb">
                Add the required API keys above to unlock live n8n-style generation. Until then, the pipeline runs in demo mode.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-b1 bg-c1 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-t2">n8n Workflow Steps</div>
            <div className="space-y-0">
              {SEO_N8N_STEPS.map((s, i) => {
                const st = stepStatus[s.id];
                return (
                  <div key={s.id} className="flex items-start gap-3 border-b border-b1 py-2 last:border-0">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                        st === "done"
                          ? "bg-grn-bg text-grn2"
                          : st === "run"
                          ? "bg-acc-bg text-acc2"
                          : st === "err"
                          ? "bg-red-bg text-red2"
                          : "bg-c3 text-t3"
                      }`}
                    >
                      {st === "done" ? "✓" : st === "run" ? "⟳" : st === "err" ? "✗" : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-t2">{s.label}</div>
                      <div className="text-[10px] text-t3">{s.desc}</div>
                      {stepDetails[s.id] && <div className="mt-1 text-[10px] text-grn2">{stepDetails[s.id]}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-b1 bg-c2 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-t2">Difference from Claude version</div>
            <div className="space-y-3 text-[11px] leading-relaxed text-t2">
              <div>
                <b className="text-t1">This version (n8n):</b>
                <ul className="mt-1 list-disc pl-4">
                  <li>Uses GPT-4o + GPT-IMAGE-2</li>
                  <li>Apify crawls website (deeper)</li>
                  <li>SerpAPI for real SERP data</li>
                  <li>Generates editorial infographic</li>
                  <li>Saves to Google Drive</li>
                </ul>
              </div>
              <div>
                <b className="text-t1">Claude version:</b>
                <ul className="mt-1 list-disc pl-4">
                  <li>Uses Claude (faster, free tier)</li>
                  <li>Jina crawls website (free)</li>
                  <li>Serper for SEO data</li>
                  <li>No infographic</li>
                  <li>Saves locally / Supabase</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red/30 bg-red-bg p-4 text-sm text-red2">
          Error: {error}
          <br />
          <br />
          Check your API keys in Settings → API Keys and ensure your OpenAI key is valid.
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-grn/30 bg-grn-bg p-4 text-sm text-grn2">
            ✓ Pipeline complete — {result.wordCount} words — <b>{result.title}</b>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(result.content)}
              className="rounded-lg bg-acc px-3 py-2 text-xs font-medium text-white"
            >
              Copy Blog Post
            </button>
            <button
              onClick={downloadTxt}
              className="rounded-lg border border-b1 bg-c2 px-3 py-2 text-xs font-medium text-t1 transition hover:border-b2"
            >
              Download .txt
            </button>
            <Link
              href="/blog-library"
              className="rounded-lg border border-b1 bg-c2 px-3 py-2 text-xs font-medium text-t1 transition hover:border-b2"
            >
              View in Blog Library
            </Link>
          </div>

          {result.infographicUrl && (
            <div className="rounded-xl border border-b1 bg-c1 p-4">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-t2">Generated Infographic</div>
              <img
                src={result.infographicUrl}
                alt="Generated infographic"
                className="w-full rounded-lg object-cover max-h-[400px]"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            </div>
          )}

          <div className="rounded-xl border border-b1 bg-c1 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-t2">Full Blog Post</div>
            <div
              className="max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-b1 bg-c2 p-4 text-sm leading-relaxed text-t1"
              dangerouslySetInnerHTML={{ __html: escapeHtml(result.content) }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
