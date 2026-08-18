"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AddBrandPayload = {
  name: string;
  industry: string;
  website?: string;
  products?: string;
  targetAudience?: string;
  platforms: string[];
  notificationEmail?: string;
  telegramChatId?: string;
};

export async function addBrand(payload: AddBrandPayload) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new Error("You are not signed in.");
  }

  const admin = await createAdminClient();

  const { data: member } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  let orgId: string;
  if (member) {
    orgId = (member as any).organization_id;
  } else {
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({
        name: (auth.user.email || "My Organization").split("@")[0] + " Organization",
        plan: "free",
        owner_id: auth.user.id,
      } as any)
      .select()
      .single();

    if (orgError || !org) {
      throw new Error(orgError?.message || "Could not create organization.");
    }

    orgId = (org as any).id;

    const { error: memberError } = await admin.from("organization_members").insert({
      organization_id: orgId,
      user_id: auth.user.id,
      role: "owner",
    } as any);

    if (memberError) {
      console.error("organization_members insert error:", memberError);
    }
  }

  const { data: brand, error } = await admin
    .from("brands")
    .insert({
      organization_id: orgId,
      name: payload.name,
      industry: payload.industry,
      website: payload.website || null,
      products: payload.products || null,
      target_audience: payload.targetAudience || null,
      platforms: payload.platforms,
      content_pillars: ["Product Updates", "Industry Insights", "Customer Success", "Behind the Scenes", "Educational"],
      notification_email: payload.notificationEmail || null,
      telegram_chat_id: payload.telegramChatId || null,
      auto_approve_hours: 24,
      is_active: true,
    } as any)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { brand: brand as any, orgId };
}
