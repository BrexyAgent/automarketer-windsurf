"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Blog = {
  id: number;
  date: string;
  businessName: string;
  primaryKeyword: string;
  title: string;
  keywords: { keyword: string }[];
  content: string;
  wordCount: number;
  source: string;
};

function escapeHtml(s: string | null | undefined) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function BlogLibraryPage() {
  const [history, setHistory] = useState<Blog[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Blog | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("seo_blog_history");
    const parsed: Blog[] = raw ? JSON.parse(raw) : [];
    setHistory(parsed);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q
      ? history.filter((r) =>
          `${r.title} ${r.businessName} ${r.primaryKeyword}`.toLowerCase().includes(q)
        )
      : history;
  }, [history, query]);

  const totalWords = useMemo(() => history.reduce((a, b) => a + (b.wordCount || 0), 0), [history]);

  function save(parsed: Blog[]) {
    localStorage.setItem("seo_blog_history", JSON.stringify(parsed));
    setHistory(parsed);
  }

  function deleteOne(id: number) {
    if (!confirm("Delete this blog post?")) return;
    const next = history.filter((r) => r.id !== id);
    save(next);
    if (selected?.id === id) setSelected(null);
  }

  function clearAll() {
    if (!confirm("Delete ALL saved blog posts? This cannot be undone.")) return;
    localStorage.removeItem("seo_blog_history");
    setHistory([]);
    setSelected(null);
  }

  function downloadTxt(b: Blog) {
    const blob = new Blob([b.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Blog-${(b.businessName || "post").replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadDoc(b: Blog) {
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${b.title}</title></head>
      <body style="font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#111;">
        <h1>${b.title}</h1>
        <p><b>Business:</b> ${b.businessName}<br><b>Keyword:</b> ${b.primaryKeyword}<br><b>Date:</b> ${formatDate(b.date)}</p>
        <hr>
        <div>${b.content.replace(/\n/g, "<br>")}</div>
      </body>
    </html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Blog-${(b.businessName || "post").replace(/\s+/g, "-")}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-t1">Blog Library</h1>
          <p className="mt-1 text-sm text-t2">All AI-generated blog posts — saved in your browser</p>
        </div>
        {history.length > 0 ? (
          <div className="flex gap-2">
            <Link
              href="/seo-blog-n8n"
              className="rounded-lg bg-acc px-3 py-2 text-xs font-medium text-white"
            >
              + Write New Blog
            </Link>
            <button
              onClick={clearAll}
              className="rounded-lg border border-b1 bg-c2 px-3 py-2 text-xs font-medium text-t2 transition hover:border-b2 hover:text-t1"
            >
              Clear All
            </button>
          </div>
        ) : (
          <Link
            href="/seo-blog-n8n"
            className="rounded-lg bg-acc px-3 py-2 text-xs font-medium text-white"
          >
            Write Your First Blog
          </Link>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-b1 bg-c1 p-8">
          <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">✍</div>
            <div className="text-base font-semibold text-t1">No blogs yet</div>
            <p className="mt-1 max-w-[300px] text-sm text-t2">
              Generate your first SEO blog post using the SEO Blog Writer. All posts are automatically saved here.
            </p>
            <Link
              href="/seo-blog-n8n"
              className="mt-4 rounded-lg bg-acc px-4 py-2 text-sm font-medium text-white"
            >
              Write First Blog Post
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-b1 bg-c1 p-4">
            <div className="flex items-center gap-3">
              <input
                className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                placeholder="Search by title, keyword, business..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="whitespace-nowrap text-xs text-t2">
                {history.length} blog{history.length !== 1 ? "s" : ""} · {totalWords.toLocaleString()} total words
              </div>
            </div>
          </div>

          {filtered.length === 0 && query && (
            <div className="flex min-h-[80px] items-center justify-center rounded-xl border border-b1 bg-c1 text-sm text-t2">
              No results for &quot;{escapeHtml(query)}&quot;
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((r) => {
              const wc = r.wordCount || (r.content || "").split(/\s+/).filter(Boolean).length;
              const date = formatDate(r.date);
              const excerpt = (r.content || "").slice(0, 180);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer rounded-xl border border-b1 bg-c1 p-4 transition hover:border-acc"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-acc-bg text-lg text-acc2">
                      ✍
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 truncate text-sm font-semibold text-t1">{r.title || "Untitled Blog"}</div>
                      <div className="mb-2 text-xs text-t2">
                        {r.businessName || ""} &nbsp;·&nbsp; Keyword: <b className="text-t1">{r.primaryKeyword || ""}</b>{" "}
                        &nbsp;·&nbsp; {date}
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-t2">{excerpt}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="rounded-md bg-acc-bg px-2 py-0.5 text-[10px] font-medium text-acc2">
                        {wc} words
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(r);
                          }}
                          className="rounded-md bg-acc px-2 py-1 text-[10px] font-medium text-white"
                        >
                          Open
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadTxt(r);
                          }}
                          className="rounded-md border border-b1 bg-c2 px-2 py-1 text-[10px] font-medium text-t2 hover:border-b2"
                        >
                          ↓ txt
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadDoc(r);
                          }}
                          className="rounded-md border border-b1 bg-c2 px-2 py-1 text-[10px] font-medium text-t2 hover:border-b2"
                        >
                          ↓ doc
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOne(r.id);
                          }}
                          className="rounded-md border border-b1 bg-c2 px-2 py-1 text-[10px] font-medium text-red2 hover:border-red"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selected && (
        <div className="mt-5 rounded-xl border border-b1 bg-c1 p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="text-base font-semibold text-t1">{selected.title}</div>
              <div className="text-xs text-t2">
                {selected.businessName} · Keyword: {selected.primaryKeyword} · {formatDate(selected.date)}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-xs text-t2 hover:text-t1">
              Close
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(selected.content)}
              className="rounded-md bg-acc px-3 py-1.5 text-xs font-medium text-white"
            >
              Copy
            </button>
            <button
              onClick={() => downloadTxt(selected)}
              className="rounded-md border border-b1 bg-c2 px-3 py-1.5 text-xs font-medium text-t1 hover:border-b2"
            >
              ↓ txt
            </button>
            <button
              onClick={() => downloadDoc(selected)}
              className="rounded-md border border-b1 bg-c2 px-3 py-1.5 text-xs font-medium text-t1 hover:border-b2"
            >
              ↓ doc
            </button>
          </div>
          <div className="mt-4 max-h-[500px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-b1 bg-c2 p-4 text-sm leading-relaxed text-t1">
            {selected.content}
          </div>
        </div>
      )}
    </div>
  );
}
