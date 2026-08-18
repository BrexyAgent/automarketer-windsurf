"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useBrand } from "@/components/brand-provider";
import type { Database } from "@/types/database";

export default function NotificationsPage() {
  const supabase = createClient();
  const { brand } = useBrand();
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [autoApprove, setAutoApprove] = useState(24);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  async function loadBrand() {
    if (!brand) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: b } = await supabase.from("brands").select("*").eq("id", brand.id).single();
      const fresh = (b || brand) as any;
      setTelegram(fresh?.telegram_chat_id || "");
      setWhatsapp(fresh?.whatsapp_number || "");
      setEmail(fresh?.notification_email || "");
      setAutoApprove(fresh?.auto_approve_hours ?? 24);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrand();
  }, [brand]);

  async function save() {
    if (!brand) return;
    const { error } = await (supabase.from("brands") as any)
      .update({
        telegram_chat_id: telegram.trim() || null,
        whatsapp_number: whatsapp.trim() || null,
        notification_email: email.trim() || null,
        auto_approve_hours: autoApprove,
      })
      .eq("id", brand.id);
    if (error) alert("Error: " + error.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadBrand();
    }
  }

  if (loading) return <div className="text-sm text-t2">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-t1">Notification Settings</h1>
        <p className="mt-1 text-sm text-t2">Where approval requests and reports are sent</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#229ED9]/10 text-lg">✈</div>
              <div>
                <div className="text-sm font-semibold text-t1">Telegram</div>
                <div className="text-xs text-t2">Fastest — approve with one reply YES/NO</div>
              </div>
              <span className="ml-auto rounded-md bg-grn/15 px-2 py-1 text-[10px] font-medium text-grn">Recommended</span>
            </div>
            <label className="mb-1 block text-xs text-t2">Telegram Chat ID</label>
            <input
              className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="Get from @userinfobot"
            />
            <p className="mt-2 text-xs text-t2 leading-relaxed">How: Open Telegram → search @userinfobot → Start it → copy your Chat ID</p>
          </div>

          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#25D366]/10 text-lg">💬</div>
              <div>
                <div className="text-sm font-semibold text-t1">WhatsApp</div>
                <div className="text-xs text-t2">Requires Meta Business verification</div>
              </div>
              <span className="ml-auto rounded-md bg-amb/15 px-2 py-1 text-[10px] font-medium text-amb">Setup needed</span>
            </div>
            <label className="mb-1 block text-xs text-t2">WhatsApp Number (with country code)</label>
            <input
              className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+919876543210"
            />
            <div className="mt-2 rounded-lg bg-amb/10 p-2 text-xs text-amb">
              Requires Meta Business account. See Setup Guide step 8. Start with Telegram — it works instantly.
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-acc/10 text-lg">✉</div>
              <div>
                <div className="text-sm font-semibold text-t1">Email</div>
                <div className="text-xs text-t2">Weekly reports + backup notifications</div>
              </div>
              <span className="ml-auto rounded-md bg-grn/15 px-2 py-1 text-[10px] font-medium text-grn">Active</span>
            </div>
            <label className="mb-1 block text-xs text-t2">Notification Email</label>
            <input
              className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>

          <div className="rounded-xl border border-b1 bg-c1 p-5">
            <div className="mb-4 text-sm font-semibold text-t1">Schedule Settings</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-t2">Auto-approve after</label>
                <select
                  className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc"
                  value={autoApprove}
                  onChange={(e) => setAutoApprove(Number(e.target.value))}
                >
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={0}>Never (manual only)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-t2">Weekly report day</label>
                <select className="w-full rounded-lg border border-b1 bg-c2 px-3 py-2 text-sm text-t1 outline-none focus:border-acc">
                  <option value={1}>Monday 9AM</option>
                  <option value={5}>Friday 5PM</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={save}
            className={`w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors ${
              saved ? "bg-grn" : "bg-acc hover:bg-acc2"
            }`}
          >
            {saved ? "✓ Saved!" : "Save Notification Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
