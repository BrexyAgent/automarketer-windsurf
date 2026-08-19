"use client";

import { useEffect, useState } from "react";
import { useBrand } from "@/components/brand-provider";
import { getCredentials, saveCredential, removeCredential } from "./actions";

interface Service {
  key: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  placeholder: string;
  link?: string;
}

const SERVICES: Service[] = [
  {
    key: "buffer",
    name: "Buffer",
    desc: "One-click publish to all social platforms (recommended)",
    icon: "Bf",
    color: "#6C5CE7",
    placeholder: "Paste your Buffer Access Token",
    link: "https://buffer.com/developers/apps",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    desc: "Direct posting via LinkedIn OAuth token",
    icon: "in",
    color: "#0A66C2",
    placeholder: "Paste LinkedIn access token",
  },
  {
    key: "twitter",
    name: "Twitter / X",
    desc: "Direct posting via X API Bearer / access token",
    icon: "X",
    color: "#1A8CD8",
    placeholder: "Paste X API token",
  },
  {
    key: "facebook",
    name: "Facebook",
    desc: "Direct posting via Facebook Graph API token",
    icon: "fb",
    color: "#1877F2",
    placeholder: "Paste Facebook access token",
  },
  {
    key: "instagram",
    name: "Instagram",
    desc: "Direct posting via Instagram Graph token",
    icon: "IG",
    color: "#C13584",
    placeholder: "Paste Instagram access token",
  },
  {
    key: "telegram",
    name: "Telegram",
    desc: "Approval notifications — bot token + chat ID",
    icon: "TG",
    color: "#229ED9",
    placeholder: "Paste Telegram bot token",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    desc: "Approval via WhatsApp Business token",
    icon: "WA",
    color: "#25D366",
    placeholder: "Paste WhatsApp Business token",
  },
  {
    key: "gmail",
    name: "Gmail / Email",
    desc: "Weekly reports and approval emails",
    icon: "GM",
    color: "#EA4335",
    placeholder: "Paste email service API key",
  },
  {
    key: "anthropic",
    name: "Anthropic Claude",
    desc: "AI content and strategy engine",
    icon: "AI",
    color: "#7C3AED",
    placeholder: "Paste Anthropic API key",
  },
  {
    key: "serper",
    name: "Serper.dev",
    desc: "Live SEO & SERP trend data",
    icon: "SEO",
    color: "#FF4500",
    placeholder: "Paste Serper API key",
  },
  {
    key: "apify",
    name: "Apify",
    desc: "Competitor and web scraping data",
    icon: "AP",
    color: "#FF6B6B",
    placeholder: "Paste Apify API token",
  },
];

export default function IntegrationsPage() {
  const { orgId } = useBrand();
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    getCredentials(orgId).then((map) => setConfigured(map));
  }, [orgId]);

  async function save(key: string) {
    if (!orgId || !inputs[key]?.trim()) return;
    setSaving(key);
    try {
      await saveCredential({ orgId, service: key, value: inputs[key].trim() });
      setConfigured((m) => ({ ...m, [key]: true }));
      setInputs((v) => ({ ...v, [key]: "" }));
    } catch (e: any) {
      alert("Error saving: " + e.message);
    } finally {
      setSaving(null);
    }
  }

  async function remove(key: string) {
    if (!orgId) return;
    if (!confirm(`Remove ${key} credentials?`)) return;
    try {
      await removeCredential({ orgId, service: key });
      setConfigured((m) => ({ ...m, [key]: false }));
    } catch (e: any) {
      alert("Error removing: " + e.message);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">Integrations</h1>
        <p className="mt-1 text-sm text-t2">Connect your platforms and APIs</p>
      </div>

      <div className="mb-5 rounded-lg bg-blu/10 p-3 text-sm text-blu">
        <b>One-click publish</b> is currently powered by <b>Buffer</b>. Add your Buffer token below, then go to Approval Queue and click Publish on any approved post.
      </div>

      <div className="mb-5 rounded-lg border border-b1 bg-c1 p-4">
        <div className="mb-2 text-sm font-semibold text-t1">Quick status</div>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <span
              key={s.key}
              className="rounded-md px-2 py-1 text-[10px] font-medium"
              style={{
                backgroundColor: (configured[s.key] ? "#22C55E" : "#EF4444") + "22",
                color: configured[s.key] ? "#22C55E" : "#EF4444",
              }}
            >
              {s.name} {configured[s.key] ? "●" : "○"}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {SERVICES.map((s) => (
          <div key={s.key} className="rounded-xl border border-b1 bg-c1 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ backgroundColor: s.color + "22", color: s.color }}
              >
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-t1">{s.name}</div>
                <div className="text-xs text-t2">{s.desc}</div>
              </div>
              <span
                className="rounded-md px-2 py-1 text-[10px] font-medium"
                style={{
                  backgroundColor: (configured[s.key] ? "#22C55E" : "#EF4444") + "22",
                  color: configured[s.key] ? "#22C55E" : "#EF4444",
                }}
              >
                {configured[s.key] ? "Configured" : "Not connected"}
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                className="flex-1 rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                placeholder={s.placeholder}
                value={inputs[s.key] || ""}
                onChange={(e) => setInputs((v) => ({ ...v, [s.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && save(s.key)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => save(s.key)}
                  disabled={saving === s.key || !inputs[s.key]?.trim()}
                  className="rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving === s.key ? "..." : "Save"}
                </button>
                {configured[s.key] && (
                  <button
                    onClick={() => remove(s.key)}
                    className="rounded-lg border border-b1 px-3 py-2 text-sm text-t2 hover:text-red"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            {s.link && (
              <a
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[11px] text-acc2 hover:underline"
              >
                Get {s.name} API token →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
