"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";

type Intel = Database["public"]["Tables"]["brand_intelligence"]["Row"];

interface SentimentData {
  score: number;
  positive: number;
  neutral: number;
  negative: number;
  overall: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  by_platform?: { platform: string; score: number; note: string }[];
}

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseSentiment(s: string | null | undefined): SentimentData | null {
  if (!s) return null;
  try {
    const d = JSON.parse(s) as Partial<SentimentData>;
    if (typeof d.score === "number") return d as SentimentData;
  } catch {}
  return null;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#22C55E" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[5px]" style={{ borderColor: color }}>
      <div className="text-2xl font-semibold" style={{ color }}>{score}</div>
      <div className="text-[9px] text-t2 font-semibold">SCORE</div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-xs" style={{ color }}>{label}</span>
      <div className="flex-1 rounded-full bg-c2 h-2.5">
        <div className="h-2.5 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function SentimentPage() {
  const supabase = createClient();
  const { brand } = useBrand();
  const [intel, setIntel] = useState<Intel | null>(null);
  const [data, setData] = useState<SentimentData | null>(null);
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
      setData(parseSentiment((i || null as any)?.strategy));
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
          <h1 className="text-xl font-semibold text-t1">Sentiment Monitor</h1>
          <p className="mt-1 text-sm text-t2">AI-powered brand sentiment analysis</p>
        </div>
        <button onClick={() => alert("Sentiment is refreshed from the Intelligence Pipeline.")} className="rounded-lg bg-acc px-3 py-2 text-sm font-medium text-white">
          ⟳ Refresh
        </button>
      </div>

      {!data ? (
        <div className="rounded-xl border border-b1 bg-c1 p-8 text-center">
          <div className="mb-2 text-3xl">🎭</div>
          <div className="text-base font-semibold text-t1">No sentiment analysis yet</div>
          <p className="mt-1 text-sm text-t2">Run the Intelligence Pipeline to generate brand sentiment data.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="flex items-center gap-6 rounded-xl border border-b1 bg-c1 p-5">
              <ScoreRing score={data.score} />
              <div>
                <div className="text-base font-semibold capitalize text-t1">{data.overall} Sentiment</div>
                <p className="mt-1 text-sm leading-relaxed text-t2">{escapeHtml(data.summary)}</p>
              </div>
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <Bar label="Positive" value={data.positive} color="#22C55E" />
              <div className="my-3" />
              <Bar label="Neutral" value={data.neutral} color="#8080A0" />
              <div className="my-3" />
              <Bar label="Negative" value={data.negative} color="#EF4444" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase text-grn">Strengths</div>
              {(data.strengths || []).map((s, i) => (
                <div key={i} className="mb-2 text-sm text-t1">· {escapeHtml(s)}</div>
              ))}
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase text-amb">Concerns</div>
              {(data.concerns || []).map((s, i) => (
                <div key={i} className="mb-2 text-sm text-t1">· {escapeHtml(s)}</div>
              ))}
            </div>
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-3 text-[10px] font-semibold uppercase text-acc2">Recommendations</div>
              {(data.recommendations || []).map((s, i) => (
                <div key={i} className="mb-2 text-sm text-t1">· {escapeHtml(s)}</div>
              ))}
            </div>
          </div>

          {data.by_platform && data.by_platform.length > 0 && (
            <div className="rounded-xl border border-b1 bg-c1 p-5">
              <div className="mb-4 text-sm font-semibold text-t1">By Platform</div>
              <div className="flex flex-wrap gap-3">
                {data.by_platform.map((p) => {
                  const c = p.score >= 70 ? "#22C55E" : p.score >= 50 ? "#F59E0B" : "#EF4444";
                  return (
                    <div key={p.platform} className="min-w-[120px] flex-1 rounded-lg border border-b1 bg-c2 p-3 text-center">
                      <div className="text-xs font-semibold text-t1">{p.platform}</div>
                      <div className="my-1 text-xl font-semibold" style={{ color: c }}>{p.score}</div>
                      <div className="text-[11px] text-t2">{escapeHtml(p.note)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
