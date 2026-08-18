"use client";

import { useEffect, useState } from "react";

export default function ApiKeysPage() {
  const [sbUrl, setSbUrl] = useState("");
  const [sbKey, setSbKey] = useState("");
  const [antKey, setAntKey] = useState("");
  const [serpKey, setSerpKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSbUrl(localStorage.getItem("am_sb_url") || "");
    setSbKey(localStorage.getItem("am_sb_key") || "");
    setAntKey(localStorage.getItem("am_ant_key") || "");
    setSerpKey(localStorage.getItem("am_serp_key") || "");
  }, []);

  function save() {
    localStorage.setItem("am_sb_url", sbUrl.trim());
    localStorage.setItem("am_sb_key", sbKey.trim());
    localStorage.setItem("am_ant_key", antKey.trim());
    localStorage.setItem("am_serp_key", serpKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">API Settings</h1>
        <p className="mt-1 text-sm text-t2">Credentials used by the AI pipeline and automations</p>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-b1 bg-c1 p-6">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-t2">Supabase URL</label>
            <input
              className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-t2">Supabase Anon Key</label>
            <input
              type="password"
              className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-t2">Anthropic API Key</label>
            <input
              type="password"
              className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
              value={antKey}
              onChange={(e) => setAntKey(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-t2">Serper.dev API Key</label>
            <input
              className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
              value={serpKey}
              onChange={(e) => setSerpKey(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={save}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors ${
              saved ? "bg-grn" : "bg-acc hover:bg-acc2"
            }`}
          >
            {saved ? "✓ Saved!" : "Save"}
          </button>
          <button
            onClick={() => {
              if (confirm("Clear all locally stored keys and reset?")) {
                localStorage.removeItem("am_sb_url");
                localStorage.removeItem("am_sb_key");
                localStorage.removeItem("am_ant_key");
                localStorage.removeItem("am_serp_key");
                setSbUrl(""); setSbKey(""); setAntKey(""); setSerpKey("");
              }
            }}
            className="rounded-lg border border-b1 px-4 py-3 text-sm font-medium text-t1 hover:bg-c2"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
