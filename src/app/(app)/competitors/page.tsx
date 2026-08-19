"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import { searchSerpAction } from "./actions";
import type { Database } from "@/types/database";

type Intel = Database["public"]["Tables"]["brand_intelligence"]["Row"];

type SerpResult = {
  title: string;
  link: string;
  snippet: string;
};

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function CompetitorsPage() {
  const supabase = createClient();
  const { brand, orgId } = useBrand();
  const [intel, setIntel] = useState<Intel | null>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SerpResult[] | null>(null);
  const [related, setRelated] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!orgId || !query.trim()) return;
    setSearching(true);
    setResults(null);
    setSearchError(null);
    const res = await searchSerpAction({ orgId, query: query.trim() });
    setSearching(false);
    if (res.error) {
      setSearchError(res.error);
    } else {
      setResults(res.results || []);
      setRelated(res.related || []);
    }
  }

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">Competitor Monitor</h1>
          <p className="mt-1 text-sm text-t2">AI-researched competitive landscape + live SERP data</p>
        </div>
        <button onClick={() => loadIntel()} className="rounded-lg bg-acc px-3 py-2 text-sm font-medium text-white">
          ⟳ Refresh
        </button>
      </div>

      <form onSubmit={search} className="mb-6 rounded-xl border border-b1 bg-c1 p-4">
        <div className="mb-2 text-sm font-semibold text-t1">Live SERP search</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            className="flex-1 rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
            placeholder="Competitor name, keyword, or topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {searching ? "..." : "Search SERP"}
          </button>
        </div>
        {searchError && (
          <div className="mt-3 rounded-lg bg-red/10 p-3 text-sm text-red">{searchError}</div>
        )}
      </form>

      {results && results.length > 0 && (
        <div className="mb-6 rounded-xl border border-b1 bg-c1 p-4">
          <div className="mb-3 text-sm font-semibold text-t1">Top search results for “{query}”</div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-b1 bg-c2 p-3">
                <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blu hover:underline">
                  {r.title}
                </a>
                <div className="text-[11px] text-t3">{r.link}</div>
                <p className="mt-1 text-xs leading-relaxed text-t2">{r.snippet}</p>
              </div>
            ))}
          </div>
          {related.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-[11px] font-semibold text-t2">Related searches</div>
              <div className="flex flex-wrap gap-2">
                {related.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setQuery(q); }}
                    className="rounded-md border border-b1 px-2 py-1 text-[11px] text-t2 hover:text-t1"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
