"use server";

import { createClient } from "@/lib/supabase/server";
import { createBufferUpdate, getBufferProfiles, formatPostText } from "@/lib/publish";

export async function publishPostAction(postId: string) {
  const supabase = (await createClient()) as any;

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return { error: "Post not found." };
  }

  const { data: cred, error: credError } = await supabase
    .from("organization_credentials")
    .select("*")
    .eq("organization_id", post.organization_id)
    .eq("service", "buffer")
    .maybeSingle();

  if (credError || !cred) {
    return { error: `No Buffer token found. Add it in Integrations to publish ${post.platform}.` };
  }

  try {
    const profiles = await getBufferProfiles(cred.encrypted_value);
    const profile = profiles.find(
      (p) => p.service === post.platform || (p.service || "").toLowerCase() === (post.platform || "").toLowerCase()
    );

    if (!profile) {
      return { error: `No connected ${post.platform} profile in this Buffer account.` };
    }

    const update = await createBufferUpdate(
      cred.encrypted_value,
      profile.id,
      formatPostText(post.content || "", post.hashtags || []),
      post.image_url
    );

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_post_id: update.id || null,
      })
      .eq("id", postId);

    if (updateError) {
      return { error: updateError.message };
    }

    return { ok: true, message: `Published to ${post.platform}.` };
  } catch (e: any) {
    return { error: e.message || "Publishing failed." };
  }
}
