"use client";

import { useState } from "react";
import { useBrand } from "@/components/brand-provider";
import { Clapperboard, Copy, Download, Wand2 } from "lucide-react";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

const PL = [
  { id: "instagram", name: "Instagram Reels", color: "#E1306C" },
  { id: "tiktok", name: "TikTok", color: "#2FD6E0" },
  { id: "youtube", name: "YouTube Shorts", color: "#CC0000" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2" },
  { id: "twitter", name: "Twitter / X", color: "#1A8CD8" },
  { id: "facebook", name: "Facebook", color: "#1877F2" },
];

const AI_PROVIDERS = [
  { id: "claude", name: "Claude (Anthropic)" },
  { id: "openai", name: "ChatGPT (OpenAI)" },
  { id: "manual", name: "Manual" },
];

const VIDEO_PROVIDERS = [
  { id: "runway", name: "Runway ML" },
  { id: "pika", name: "Pika" },
  { id: "kling", name: "Kling" },
  { id: "pollinations", name: "Pollinations (free image preview)" },
  { id: "custom", name: "Custom URL" },
];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard"));
}

export default function VideoGeneratorPage() {
  const { brand } = useBrand();
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("15");
  const [platform, setPlatform] = useState("instagram");
  const [aiProvider, setAiProvider] = useState("claude");
  const [videoProvider, setVideoProvider] = useState("runway");
  const [script, setScript] = useState("");
  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<"script" | "video" | "done">("script");

  function buildScript() {
    if (!brand) return;
    const t = topic.trim() || brand.content_pillars?.[0] || brand.name;
    const m = message.trim() || brand.products || `a better way to solve ${t}`;
    const audience = brand.target_audience || "your audience";
    const s = [
      `Platform: ${PL.find((p) => p.id === platform)?.name || platform}`,
      `Duration: ${duration} seconds`,
      ``,
      `HOOK (0-3s):`,
      `${t} — the one thing ${audience} needs to know.`,
      ``,
      `BODY (3-${Math.max(3, parseInt(duration, 10) - 3)}s):`,
      `${m}`,
      ``,
      `CTA (last 2s):`,
      `Follow ${brand.name} for more ${brand.industry} insights.`,
      ``,
      `AI provider: ${AI_PROVIDERS.find((a) => a.id === aiProvider)?.name}`,
    ].join("\n");
    setScript(s);
  }

  function buildPrompt() {
    if (!brand) return;
    const t = topic.trim() || brand.content_pillars?.[0] || brand.name;
    const p = `Cinematic motion product video, ${brand.name}, ${brand.industry}, ${t}, clean modern lighting, subtle camera push-in, premium brand aesthetic, 16:9, no text overlays, photorealistic`;
    setPrompt(p);
  }

  async function generate() {
    if (!brand) return;
    setGenerating(true);
    setVideoUrl("");
    buildScript();
    buildPrompt();

    if (videoProvider === "custom") {
      setVideoUrl("");
      setGenerating(false);
      setStep("done");
      return;
    }

    // Simulated provider behavior — real calls need API keys
    if (videoProvider === "pollinations") {
      const seed = Math.floor(Math.random() * 99999);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt || buildPromptString())}?width=1280&height=720&model=flux&nologo=true&seed=${seed}`;
      setVideoUrl(url);
    }

    // Runway / Pika / Kling: only prompt is generated; actual video needs key
    setTimeout(() => {
      setGenerating(false);
      setStep("done");
    }, 800);
  }

  function buildPromptString() {
    if (!brand) return "";
    const t = topic.trim() || brand.content_pillars?.[0] || brand.name;
    return `Cinematic motion product video, ${brand.name}, ${brand.industry}, ${t}, clean modern lighting, subtle camera push-in, premium brand aesthetic, 16:9, no text overlays, photorealistic`;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Clapperboard className="h-6 w-6 text-acc" />
          <h1 className="text-xl font-semibold text-t1">AI Video Generator</h1>
        </div>
        <p className="mt-1 text-sm text-t2">Create scripts and prompts for product videos</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Video Brief</div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-t2">Topic / Product</label>
                <input
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  placeholder={brand?.content_pillars?.[0] || "Product update"}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Key Message</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  placeholder="What should the viewer remember?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-t2">Duration</label>
                  <select
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  >
                    <option value="15">15 sec</option>
                    <option value="30">30 sec</option>
                    <option value="60">60 sec</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-t2">Platform</label>
                  <select
                    className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    {PL.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">AI Script Provider</div>
            <div className="grid grid-cols-3 gap-2">
              {AI_PROVIDERS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAiProvider(a.id)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    aiProvider === a.id
                      ? "border-transparent bg-acc/15 text-acc2"
                      : "border-b1 bg-c2 text-t2 hover:text-t1"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
            {aiProvider !== "manual" && (
              <div className="mt-3 text-xs text-amb">
                Requires an API key in Integrations. Script will be templated until the key is added.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Video Provider</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VIDEO_PROVIDERS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVideoProvider(v.id)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    videoProvider === v.id
                      ? "border-transparent bg-acc/15 text-acc2"
                      : "border-b1 bg-c2 text-t2 hover:text-t1"
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
            {videoProvider !== "pollinations" && videoProvider !== "custom" && (
              <div className="mt-3 text-xs text-amb">
                {VIDEO_PROVIDERS.find((v) => v.id === videoProvider)?.name} needs an API key in Integrations. A prompt will be generated now; the actual video is produced after the key is added.
              </div>
            )}
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-acc px-4 py-3 text-sm font-medium text-white hover:bg-acc2 disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {generating ? "Generating..." : "Generate Script & Video Prompt"}
          </button>
        </div>

        <div className="space-y-5">
          {script && (
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-t1">Generated Script</div>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(script)} className="rounded bg-c2 p-1.5 text-t2 hover:text-t1" title="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-b1 bg-c2 p-3 text-xs text-t1">{escapeHtml(script)}</pre>
            </div>
          )}

          {prompt && (
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-t1">Video Prompt</div>
                <button onClick={() => copyToClipboard(prompt)} className="rounded bg-c2 p-1.5 text-t2 hover:text-t1" title="Copy">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="whitespace-pre-wrap rounded-lg border border-b1 bg-c2 p-3 text-xs text-t1">{escapeHtml(prompt)}</div>
            </div>
          )}

          {step === "done" && videoProvider === "pollinations" && videoUrl && (
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 text-sm font-semibold text-t1">Preview Cover Frame</div>
              <img src={videoUrl} alt="Preview" className="mb-3 w-full rounded-lg" />
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-c2 px-3 py-2 text-xs text-t1 hover:bg-b1"
              >
                <Download className="h-3.5 w-3.5" />
                Open / Download
              </a>
              <p className="mt-2 text-xs text-t2">
                Pollinations currently gives a still image. For real motion video, connect Runway, Pika, or Kling in Integrations.
              </p>
            </div>
          )}

          {step === "done" && videoProvider !== "pollinations" && (
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="text-sm font-semibold text-t1">{VIDEO_PROVIDERS.find((v) => v.id === videoProvider)?.name} Output</div>
              <p className="mt-2 text-sm text-t2">
                Add the {VIDEO_PROVIDERS.find((v) => v.id === videoProvider)?.name} API key in Integrations, then this page will generate the actual video file.
              </p>
              {videoProvider === "custom" && (
                <input
                  className="mt-3 w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  placeholder="Paste video URL..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
