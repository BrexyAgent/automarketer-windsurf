"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchSerpAction({
  orgId,
  query,
}: {
  orgId: string;
  query: string;
}) {
  const supabase = (await createClient()) as any;

  const { data: cred } = await supabase
    .from("organization_credentials")
    .select("encrypted_value")
    .eq("organization_id", orgId)
    .eq("service", "serper")
    .maybeSingle();

  if (!cred) {
    return { error: "Serper API key not found. Add it in Integrations." };
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": cred.encrypted_value,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Serper error: ${text || res.statusText}` };
    }

    const json = await res.json();
    const organic = (json.organic || []).map((r: any) => ({
      title: r.title || "",
      link: r.link || "",
      snippet: r.snippet || "",
    }));

    return {
      results: organic,
      related: json.relatedSearches?.map((r: any) => r.query) || [],
    };
  } catch (e: any) {
    return { error: e.message || "SERP search failed." };
  }
}
