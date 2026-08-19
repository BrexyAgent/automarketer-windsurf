"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { setSelectedBrand, getSelectedBrandId } from "@/lib/brand";
import {
  LayoutDashboard,
  Building2,
  Zap,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  FileText,
  BarChart3,
  FileBarChart,
  Target,
  Hash,
  Smile,
  PenTool,
  Settings,
  BookOpen,
  Workflow,
  Gem,
  Bell,
  Plug,
  KeyRound,
} from "lucide-react";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  brands: <Building2 className="h-4 w-4" />,
  pipeline: <Zap className="h-4 w-4" />,
  generate: <Sparkles className="h-4 w-4" />,
  approval: <CheckCircle2 className="h-4 w-4" />,
  calendar: <CalendarDays className="h-4 w-4" />,
  posts: <FileText className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  reports: <FileBarChart className="h-4 w-4" />,
  competitor: <Target className="h-4 w-4" />,
  hashtag: <Hash className="h-4 w-4" />,
  sentiment: <Smile className="h-4 w-4" />,
  seoblog: <PenTool className="h-4 w-4" />,
  seoblog_n8n: <Settings className="h-4 w-4" />,
  bloglibrary: <BookOpen className="h-4 w-4" />,
  workflows: <Workflow className="h-4 w-4" />,
  brand: <Gem className="h-4 w-4" />,
  notifications: <Bell className="h-4 w-4" />,
  integrations: <Plug className="h-4 w-4" />,
  apikeys: <KeyRound className="h-4 w-4" />,
};

const NAV = [
  {
    g: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", i: "◉" },
      { id: "brands", label: "All Brands", i: "◈" },
    ],
  },
  {
    g: "Automation",
    items: [
      { id: "pipeline", label: "Intelligence Pipeline", i: "⚡" },
      { id: "generate", label: "Auto Generate", i: "✦" },
    ],
  },
  {
    g: "Content",
    items: [
      { id: "approval", label: "Approval Queue", i: "✓", b: "approval" },
      { id: "calendar", label: "Calendar", i: "▦" },
      { id: "posts", label: "All Posts", i: "◻" },
    ],
  },
  {
    g: "Analytics",
    items: [
      { id: "analytics", label: "Analytics", i: "◈" },
      { id: "reports", label: "Weekly Reports", i: "📊" },
      { id: "competitor", label: "Competitors", i: "🔍" },
      { id: "hashtag", label: "Hashtags", i: "#" },
      { id: "sentiment", label: "Sentiment", i: "◎" },
    ],
  },
  {
    g: "AI Agents",
    items: [
      { id: "seoblog", label: "SEO Blog (Claude)", i: "✍" },
      { id: "seoblog_n8n", label: "SEO Blog (n8n)", i: "⚙" },
      { id: "bloglibrary", label: "Blog Library", i: "◻" },
    ],
  },
  {
    g: "Automation",
    items: [{ id: "workflows", label: "Workflows", i: "⚡" }],
  },
  {
    g: "Settings",
    items: [
      { id: "brand", label: "Brand Voice", i: "◆" },
      { id: "notifications", label: "Notifications", i: "🔔" },
      { id: "integrations", label: "Integrations", i: "⚙" },
      { id: "apikeys", label: "API Keys", i: "⚿" },
    ],
  },
];

const HREF_MAP: Record<string, string> = {
  brand: "/brand-voice",
  competitor: "/competitors",
  hashtag: "/hashtags",
  seoblog: "/seo-blog",
  seoblog_n8n: "/seo-blog-n8n",
  bloglibrary: "/blog-library",
  apikeys: "/api-keys",
  workflows: "/workflows",
};

function hrefFor(id: string) {
  return HREF_MAP[id] ?? `/${id}`;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ brands }: { orgName: string; userEmail: string; brands: Brand[] }) {
  const pathname = usePathname() ?? "/";
  const selectedId = getSelectedBrandId(brands);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("posts").select("id").eq("status", "pending_approval");
      setPendingCount(data?.length ?? 0);
    };
    load();
  }, []);

  return (
    <aside className="flex w-60 min-w-[236px] flex-col border-r border-b1 bg-c1">
      <div className="flex items-center gap-2.5 border-b border-b1 p-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-acc to-acc2 text-[13px] font-semibold text-white">
          A
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-[13px] font-semibold text-t1">AutoMarketer</div>
          <div className="text-[10px] text-t2">
            {brands.length} brand{brands.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button className="text-t3 hover:text-t2">≡</button>
      </div>

      <div className="border-b border-b1 p-2">
        <select
          className="w-full cursor-pointer rounded-md border border-b1 bg-c2 p-2 text-xs text-t1 outline-none focus:border-acc"
          value={selectedId ?? brands[0]?.id ?? ""}
          onChange={(e) => {
            setSelectedBrand(e.target.value);
            window.location.reload();
          }}
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {NAV.map((group) => (
          <div key={group.g} className="mb-2">
            <div className="px-2.5 pb-1 pt-3 text-[9px] font-medium uppercase tracking-widest text-t3">
              {group.g}
            </div>
            {group.items.map((item) => {
              const href = hrefFor(item.id);
              const active = isActive(pathname, href);
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                    active
                      ? "border border-acc/20 bg-[rgba(108,92,231,0.12)] font-medium text-acc2"
                      : "border border-transparent text-t2 hover:bg-c2 hover:text-t1"
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center">{ICONS[item.id]}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.b === "approval" && pendingCount > 0 && (
                    <span className="ml-auto rounded-full bg-red px-1.5 py-0 text-[10px] font-medium text-white">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex flex-shrink-0 items-center gap-2 border-t border-b1 p-3 text-[11px] text-grn">
        <span className="h-2 w-2 rounded-full bg-grn" />
        System Active
      </div>
    </aside>
  );
}
