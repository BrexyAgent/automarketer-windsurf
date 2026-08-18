"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSelectedBrandId } from "@/lib/brand";
import type { Database } from "@/types/database";

type Brand = Database["public"]["Tables"]["brands"]["Row"];

const NAV = [
  { g: "Overview", items: [{ href: "/dashboard", label: "Dashboard" }, { href: "/brands", label: "All Brands" }] },
  { g: "Automation", items: [{ href: "/pipeline", label: "Intelligence Pipeline" }, { href: "/generate", label: "Auto Generate" }] },
  { g: "Content", items: [{ href: "/approval", label: "Approval Queue" }, { href: "/calendar", label: "Calendar" }, { href: "/posts", label: "All Posts" }] },
  { g: "Analytics", items: [{ href: "/analytics", label: "Analytics" }, { href: "/reports", label: "Weekly Reports" }, { href: "/competitors", label: "Competitors" }, { href: "/hashtags", label: "Hashtags" }, { href: "/sentiment", label: "Sentiment" }] },
  { g: "AI Agents", items: [{ href: "/seo-blog", label: "SEO Blog (Claude)" }, { href: "/seo-blog-n8n", label: "SEO Blog (n8n)" }, { href: "/blog-library", label: "Blog Library" }] },
  { g: "Automation", items: [{ href: "/workflows", label: "Workflows" }] },
  { g: "Settings", items: [{ href: "/brand-voice", label: "Brand Voice" }, { href: "/notifications", label: "Notifications" }, { href: "/integrations", label: "Integrations" }, { href: "/api-keys", label: "API Keys" }] },
];

function initials(name: string) {
  return (name || "AM").slice(0, 2).toUpperCase();
}

export default function TopBar({ brands }: { brands: Brand[] }) {
  const pathname = usePathname() ?? "/";

  const match = useMemo(() => {
    const flat = NAV.flatMap((g) => g.items.map((i) => ({ ...i, g: g.g })));
    return flat.find((i) => pathname === i.href || (i.href !== "/" && pathname.startsWith(`${i.href}/`)));
  }, [pathname]);

  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  useEffect(() => {
    setSelectedBrandId(getSelectedBrandId(brands) ?? "");
  }, [brands]);

  const brand = useMemo(
    () => brands.find((b) => b.id === selectedBrandId) ?? brands[0] ?? null,
    [brands, selectedBrandId]
  );

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-b1 bg-c1 px-6 py-3">
      <div className="text-[11px] text-t2">
        {match?.g ?? "Overview"} &rsaquo;{" "}
        <span className="font-semibold text-t1">{match?.label ?? "Dashboard"}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-md bg-grn-bg px-2.5 py-1 text-[11px] font-medium text-grn">
          ● Intelligence Ready
        </span>

        <Link
          href="/settings"
          className="rounded-md border border-b2 px-3 py-1.5 text-[11px] text-t2 transition-colors hover:border-b1 hover:text-t1"
        >
          Settings
        </Link>

        <div className="h-[18px] w-px bg-b1" />

        <span className="text-[11px] text-t2">{brand?.name ?? "No brand"}</span>

        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-acc-bg text-xs font-semibold text-acc2">
          {initials(brand?.name ?? "AM")}
        </div>
      </div>
    </div>
  );
}
