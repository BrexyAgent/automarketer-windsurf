export interface BufferProfile {
  id: string;
  service: string;
  service_username?: string;
}

export interface BufferUpdate {
  id?: string;
  text?: string;
  due_at?: number;
  status?: string;
}

export async function getBufferProfiles(token: string): Promise<BufferProfile[]> {
  const res = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Buffer profiles error: ${text || res.statusText}`);
  }
  return (await res.json()) as BufferProfile[];
}

export async function createBufferUpdate(
  token: string,
  profileId: string,
  text: string,
  imageUrl?: string | null
): Promise<BufferUpdate> {
  const params = new URLSearchParams();
  params.append("text", text);
  params.append("profile_ids[]", profileId);
  if (imageUrl) {
    params.append("media[link]", imageUrl);
  }

  const res = await fetch(`https://api.bufferapp.com/1/updates/create.json?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Buffer publish error: ${err || res.statusText}`);
  }
  return (await res.json()) as BufferUpdate;
}

export function formatPostText(content: string, hashtags: string[] = []): string {
  const tagLine = hashtags.length ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "";
  return (content || "") + tagLine;
}
