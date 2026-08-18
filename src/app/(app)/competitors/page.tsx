"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";

type Intel = Database["public"]["Tables"]["brand_intelligence"]["Row"];

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function CompetitorsPage() {
  const supabase = createClient();
  const { brand } = useBrand();
  const [intel, setIntel] = useState<Intel | null>(null);
  const [loading, setLoading] = useState(true);

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
      setIntel((i || null) as unknown as Intel | null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntel();
  }, [brand]);

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">Competitor Monitor</h1>
          <p className="mt-1 text-sm text-t2">AI-researched competitive landscape</p>
        </div>
        <button onClick={() => alert("Refresh is run from the Intelligence Pipeline.")} className="rounded-lg bg-acc px-3 py-2 text-sm font-medium text-white">
          ⟳ Refresh
        </button>
      </div>

      {intel?.competitor_analysis ? (
        <div className="mb-6 rounded-xl border border-b1 bg-c1 p-5">
          <div className="mb-2 text-sm font-semibold text-t1">AI Competitive Intelligence</div>
          <div className="whitespace-pre-wrap text-sm leading-7 text-t1">{escapeHtml(intel.competitor_analysis)}</div>
        </div>
      ) : (
        <div className="rounded-xl border border-b1 bg-c1 p-8 text-center">
          <div className="mb-2 text-3xl">🏁</div>
          <div className="text-base font-semibold text-t1">No competitor analysis yet</div>
          <p className="mt-1 text-sm text-t2">Run the Intelligence Pipeline to research your competitors.</p>
        </div>
      )}
    </div>
  );
}
