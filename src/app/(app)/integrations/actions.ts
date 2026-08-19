"use server";

import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/crypto";

export async function getCredentials(orgId: string) {
  const supabase = (await createClient()) as any;
  const { data, error } = await supabase
    .from("organization_credentials")
    .select("service, encrypted_value")
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  const map: Record<string, boolean> = {};
  (data || []).forEach((c: any) => {
    map[c.service] = true;
  });
  return map;
}

export async function saveCredential({
  orgId,
  service,
  value,
}: {
  orgId: string;
  service: string;
  value: string;
}) {
  const supabase = (await createClient()) as any;
  const encrypted = encrypt(value);
  const { error } = await supabase.from("organization_credentials").upsert(
    {
      organization_id: orgId,
      service,
      encrypted_value: encrypted,
    },
    {
      onConflict: "organization_id,service",
    }
  );

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function removeCredential({
  orgId,
  service,
}: {
  orgId: string;
  service: string;
}) {
  const supabase = (await createClient()) as any;
  const { error } = await supabase
    .from("organization_credentials")
    .delete()
    .eq("organization_id", orgId)
    .eq("service", service);

  if (error) throw new Error(error.message);
  return { ok: true };
}
