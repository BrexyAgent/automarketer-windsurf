"use client";

import { useEffect, useState } from "react";

interface Integration {
  name: string;
  desc: string;
  icon: string;
  color: string;
  status: "connected" | "demo" | "setup_needed" | "optional" | "n8n" | "local";
}

const ST = {
  connected: { t: "Connected", c: "#22C55E", bg: "#22C55E22" },
  demo: { t: "Demo Mode", c: "#F59E0B", bg: "#F59E0B22" },
  setup_needed: { t: "Setup needed", c: "#EF4444", bg: "#EF444422" },
  optional: { t: "Optional", c: "#A78BFA", bg: "#A78BFA22" },
  n8n: { t: "Via n8n", c: "#22C55E", bg: "#22C55E22" },
  local: { t: "Self-hosted", c: "#22C55E", bg: "#22C55E22" },
};

const BASE: Integration[] = [
  { name: "Supabase", desc: "Database — all brands, posts, analytics", icon: "DB", color: "#3ECF8E", status: "connected" },
  { name: "Anthropic Claude", desc: "AI engine — content, analysis, strategy", icon: "AI", color: "#7C3AED", status: "setup_needed" },
  { name: "Pollinations AI", desc: "Image generation — completely free, no key needed", icon: "IMG", color: "#FF6B6B", status: "connected" },
  { name: "Serper.dev", desc: "Live SEO & trend data", icon: "SEO", color: "#FF4500", status: "optional" },
  { name: "n8n (self-hosted)", desc: "Automation — runs all 4 workflows automatically", icon: "N8N", color: "#EA4B71", status: "local" },
  { name: "LinkedIn", desc: "Auto-posting via n8n native node", icon: "in", color: "#0A66C2", status: "n8n" },
  { name: "Instagram", desc: "Auto-posting via Facebook Graph API", icon: "IG", color: "#C13584", status: "n8n" },
  { name: "Facebook", desc: "Auto-posting via Graph API", icon: "fb", color: "#1877F2", status: "n8n" },
  { name: "Twitter / X", desc: "Auto-posting via Buffer free tier", icon: "X", color: "#1A8CD8", status: "n8n" },
  { name: "Telegram", desc: "Approval notifications — reply YES/NO", icon: "TG", color: "#229ED9", status: "n8n" },
  { name: "WhatsApp Business", desc: "Approval via WhatsApp — needs Meta Business", icon: "WA", color: "#25D366", status: "n8n" },
  { name: "Gmail / Email", desc: "Weekly reports and backup notifications", icon: "GM", color: "#EA4335", status: "n8n" },
];

export default function IntegrationsPage() {
  const [intgs, setIntgs] = useState<Integration[]>(BASE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ant = localStorage.getItem("am_ant_key");
    const serp = localStorage.getItem("am_serp_key");
    setIntgs(
      BASE.map((i) => {
        if (i.name === "Anthropic Claude") return { ...i, status: ant ? "connected" : "setup_needed" };
        if (i.name === "Serper.dev") return { ...i, status: serp ? "connected" : "optional" };
        return i;
      })
    );
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">Integrations</h1>
        <p className="mt-1 text-sm text-t2">All connected services and their status</p>
      </div>

      <div className="mb-5 rounded-lg bg-amb/10 p-3 text-sm text-amb">
        LinkedIn, Instagram, Facebook, Twitter, Telegram and WhatsApp are all connected via your n8n self-hosted workflows. Import the 4 JSON workflow files from the Setup Guide and everything works automatically.
      </div>

      <div className="space-y-2">
        {intgs.map((i) => {
          const st = ST[i.status];
          return (
            <div key={i.name} className="flex items-center gap-4 rounded-xl border border-b1 bg-c1 p-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ backgroundColor: i.color + "22", color: i.color }}
              >
                {i.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-t1">{i.name}</div>
                <div className="text-xs text-t2">{i.desc}</div>
              </div>
              <span
                className="rounded-md px-2 py-1 text-[10px] font-medium"
                style={{ backgroundColor: st.bg, color: st.c }}
              >
                {st.t}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
