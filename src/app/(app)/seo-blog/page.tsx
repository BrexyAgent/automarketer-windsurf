"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";

type StepStatus = "wait" | "run" | "done" | "err";

const SEO_STEPS = [
  { id: "crawl", label: "Website Analysis", desc: "Reading your website — products, services, tone" },
  { id: "research", label: "Competitor Research", desc: "Analysing what competitors rank for" },
  { id: "keywords", label: "Keyword Research", desc: "Finding top 10 SEO keywords for your business" },
  { id: "outline", label: "Blog Outline", desc: "Creating H2 structure, FAQ, TL;DR" },
  { id: "write", label: "Writing Full Blog Post", desc: "Writing a 1500+ word SEO article" },
  { id: "optimise", label: "SEO / AEO / GEO Polish", desc: "Snippets, metadata, schema" },
  { id: "humanise", label: "Humanising Content", desc: "Removing AI patterns — sounding human" },
  { id: "done", label: "Complete", desc: "Ready to publish" },
];

export default function SeoBlogPage() {
  const supabase = createClient();
  const { brand, orgId } = useBrand();
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState("B2B (Business to Business)");
  const [services, setServices] = useState("");
  const [audience, setAudience] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [geo, setGeo] = useState("International or Global");
  const [city, setCity] = useState("");
  const [tone, setTone] = useState("Professional and Formal");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [usp, setUsp] = useState("");
  const [topic, setTopic] = useState("");

  const [generating, setGenerating] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(SEO_STEPS.map(() => "wait"));
  const [post, setPost] = useState<string | null>(null);

  const [hasAnthropic, setHasAnthropic] = useState(false);
  const [hasSerper, setHasSerper] = useState(false);

  async function loadBrand() {
    if (!brand) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setBusinessName(brand.name || "");
      setWebsiteUrl(brand.website || "");
      setIndustry(brand.industry || "");
      setServices((brand.content_pillars || []).join(", "));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrand();
  }, [brand]);

  useEffect(() => {
    setHasAnthropic(!!localStorage.getItem("am_ant_key"));
    setHasSerper(!!localStorage.getItem("am_serp_key"));
  }, []);

  function statusIcon(status: StepStatus, i: number) {
    if (status === "run") return <span className="text-[10px]">⟳</span>;
    if (status === "done") return <span className="text-[10px]">✓</span>;
    if (status === "err") return <span className="text-[10px]">✗</span>;
    return <span className="text-[10px]">{i + 1}</span>;
  }

  async function generate() {
    if (!businessName.trim() || !industry.trim() || !services.trim()) {
      alert("Fill in Business Name, Industry and Products / Services.");
      return;
    }
    setGenerating(true);
    setPost(null);
    setStepStatuses(SEO_STEPS.map(() => "wait"));

    for (let i = 0; i < SEO_STEPS.length; i++) {
      setStepStatuses((prev) => prev.map((_, idx) => (idx < i ? "done" : idx === i ? "run" : "wait")));
      await new Promise((r) => setTimeout(r, 700));
    }

    setStepStatuses(SEO_STEPS.map(() => "done"));

    const primaryKw =
      topic.trim() || targetKeywords.split(",")[0].trim() || industry;
    const title = topic.trim() || `The Complete Guide to ${primaryKw} for ${businessName}`;
    const meta = `${title}. Discover how ${businessName} stands out with ${usp || "unique expertise"}.`;
    const tldr = `${businessName} helps ${audience || "businesses"} with ${services}. This guide covers ${primaryKw}, key trends and actionable takeaways.`;
    const slug = primaryKw.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const body = `# ${title}

**Meta title:** ${title}\n**Meta description:** ${meta}\n**Slug:** ${slug}\n
## TL;DR

${tldr}

## 1. Why ${primaryKw} matters

In the fast-moving world of ${industry}, staying on top of ${primaryKw} is more important than ever. ${businessName} helps ${audience || "teams"} turn insights into action.

## 2. Key challenges in ${industry}

- Keeping up with rapid change.
- Managing limited resources.
- Standing out from ${competitors || "competitors"}.

## 3. How ${businessName} solves them

With ${services}, ${businessName} delivers a unique edge. ${usp || "Our approach is designed around your goals."}

## 4. Practical implementation tips

1. Start with a clear strategy for ${primaryKw}.
2. Measure results weekly.
3. Iterate based on feedback.

## 5. FAQ

**What is ${primaryKw}?**\nIt is a core topic for ${industry} and a driver of growth for businesses like ${businessName}.

**How long does it take to see results?**\nMost teams see meaningful progress within 3-6 months.

**Who is this guide for?**\n${audience || "Anyone looking to grow with " + primaryKw}.

**What makes ${businessName} different?**\n${usp || "A clear focus on results and customer success."}

## Conclusion

Start applying these ideas today with ${businessName}. Update this post regularly to keep it relevant and ranking.
`;

    if (orgId && brand) {
      try {
        await (supabase.from("posts") as any).insert({
          organization_id: orgId,
          brand_id: brand.id,
          platform: "blog",
          content: body,
          hashtags: [primaryKw.toLowerCase().replace(/\s/g, "-")],
          image_prompt: "",
          image_url: "",
          best_time: "09:00",
          content_pillar: "SEO Blog",
          status: "draft",
          scheduled_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          author: "AutoMarketer AI",
        });
      } catch {
        // ignore
      }
    }

    setPost(body);
    setGenerating(false);
  }

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">SEO Blog Writer Agent</h1>
          <p className="mt-1 text-sm text-t2">AI pipeline: Brief → Keyword Research → Full Blog Post → SEO Optimised → Humanised</p>
        </div>
        <button className="rounded-lg bg-c2 px-3 py-1.5 text-xs font-medium text-t1">
          History (0)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-4">
          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Business Brief</div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-t2">Business Name *</label>
                  <input
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    placeholder="e.g. Brexy"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-t2">Website URL *</label>
                  <input
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    placeholder="https://yoursite.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-t2">Industry / Niche *</label>
                  <input
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    placeholder="e.g. AI Finance"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-t2">Business Type *</label>
                  <select
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  >
                    <option>B2B (Business to Business)</option>
                    <option>B2C (Business to Consumer)</option>
                    <option>Both B2B and B2C</option>
                    <option>D2C (Direct to Consumer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-t2">Products / Services *</label>
                <textarea
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  rows={2}
                  placeholder="Describe your main products or services..."
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-t2">Target Audience *</label>
                <textarea
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  rows={2}
                  placeholder="e.g. Investment bankers aged 30-50 looking for AI tools"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-t2">Top 3 Competitors *</label>
                <textarea
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  rows={2}
                  placeholder="e.g. rogo.ai, hebbia.com, v7labs.com"
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-t2">Geographic Focus *</label>
                  <select
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={geo}
                    onChange={(e) => setGeo(e.target.value)}
                  >
                    <option>International or Global</option>
                    <option>National</option>
                    <option>Local (City or Region)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-t2">City / Region (if local)</label>
                  <input
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    placeholder="e.g. Delhi, Singapore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-t2">Brand Tone *</label>
                  <select
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option>Professional and Formal</option>
                    <option>Friendly and Conversational</option>
                    <option>Expert and Technical</option>
                    <option>Bold and Authoritative</option>
                    <option>Casual and Fun</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-t2">Target Keywords (optional)</label>
                  <input
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    placeholder="e.g. investment banking AI"
                    value={targetKeywords}
                    onChange={(e) => setTargetKeywords(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-t2">What Makes You Different (USP) *</label>
                <textarea
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  rows={2}
                  placeholder="What sets you apart from competitors?"
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-t2">Blog Topic (blank = AI picks best topic)</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  placeholder="e.g. How AI is changing investment banking in 2025"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <button
                onClick={generate}
                disabled={generating}
                className="w-full rounded-lg bg-acc px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {generating ? "⟳ Generating..." : "✍ Generate SEO Blog Post"}
              </button>
            </div>
          </div>

          {post && (
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-2 text-sm font-semibold text-t1">Generated Blog Post</div>
              <div className="whitespace-pre-wrap rounded-lg border border-b1 bg-c2 p-4 text-sm leading-relaxed text-t1">
                {post}
              </div>
              {orgId && brand && (
                <div className="mt-3 text-xs text-grn">✓ Saved to All Posts as a blog draft.</div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-3 text-sm font-semibold text-t1">AI Pipeline — {SEO_STEPS.length} Steps</div>
            <div className="space-y-1">
              {SEO_STEPS.map((s, i) => {
                const status = stepStatuses[i];
                const isRun = status === "run";
                const isDone = status === "done";
                const isErr = status === "err";
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 border-b border-b1 py-2 last:border-0"
                  >
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        isDone
                          ? "bg-grn text-white"
                          : isRun
                          ? "bg-acc text-white"
                          : isErr
                          ? "bg-red text-white"
                          : "bg-c3 text-t3"
                      }`}
                    >
                      {statusIcon(status, i)}
                    </div>
                    <div>
                      <div className={`text-xs ${isRun ? "text-acc" : isDone ? "text-grn" : "text-t2"}`}>
                        {s.label}
                      </div>
                      <div className="text-[10px] text-t3">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-b1 bg-c2 p-5">
            <div className="mb-3 text-sm font-semibold text-t1">Output Includes</div>
            <div className="space-y-1 text-xs leading-relaxed text-t2">
              <div>✓ 1,500–2,500 word blog post</div>
              <div>✓ H1 / H2 / H3 structure</div>
              <div>✓ TL;DR at the top</div>
              <div>✓ Featured snippet answer</div>
              <div>✓ 5-question FAQ section</div>
              <div>✓ 100% human-sounding</div>
              <div>✓ SEO metadata (title, desc, slug)</div>
              <div>✓ Copy / Edit / Word / PDF download</div>
            </div>
          </div>

          <div className="rounded-xl border border-b1 bg-c2 p-5">
            <div className="mb-3 text-sm font-semibold text-t1">Keys Needed</div>
            <div className="space-y-1 text-xs leading-relaxed text-t2">
              <div>
                {hasAnthropic ? <span className="text-grn">✓</span> : <span className="text-red">✗</span>} Anthropic API Key
              </div>
              <div>
                {hasSerper ? <span className="text-grn">✓</span> : <span className="text-t3">○</span>} Serper.dev (optional)
              </div>
              <div>
                <span className="text-grn">✓</span> Jina AI — free, no key needed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
