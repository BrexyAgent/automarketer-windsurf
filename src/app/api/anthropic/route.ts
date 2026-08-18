import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { NextResponse } from "next/server";

/**
 * Example server-side API route pattern.
 *
 * 1. Get the authenticated user from Supabase.
 * 2. Load the org's encrypted API key from the database.
 * 3. Decrypt server-side (never expose keys to the browser).
 * 4. Call the external API.
 * 5. Return the result to the client.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's organization
  const { data: orgMember } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!orgMember) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 });
  }

  const orgId = (orgMember as unknown as { organization_id: string }).organization_id;

  // Load the encrypted Anthropic API key
  const { data: cred } = await supabase
    .from("organization_credentials")
    .select("encrypted_value")
    .eq("organization_id", orgId)
    .eq("service", "anthropic")
    .single();

  if (!cred) {
    return NextResponse.json(
      { error: "Anthropic API key not configured. Add it in Settings → API Keys." },
      { status: 400 }
    );
  }

  // Decrypt the key server-side
  const apiKey = decrypt((cred as unknown as { encrypted_value: string }).encrypted_value);

  // Parse the request body
  const { prompt, system } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Missing 'prompt' in request body" }, { status: 400 });
  }

  // Call Anthropic API
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: system || "You are a helpful marketing assistant.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: `Anthropic API error: ${err}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";

  return NextResponse.json({ text });
}
