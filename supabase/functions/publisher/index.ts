// ─────────────────────────────────────────────────────────
// AutoMarketer — Publisher
// Runs every 15 minutes
// Schedule: */15 * * * *
// ─────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const TELEGRAM_CHAT = Deno.env.get('TELEGRAM_CHAT_ID')!
const LI_ACCESS_TOKEN = Deno.env.get('LINKEDIN_ACCESS_TOKEN') || ''
const FB_ACCESS_TOKEN = Deno.env.get('FACEBOOK_ACCESS_TOKEN') || ''
const FB_PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID') || ''
const IG_ACCOUNT_ID = Deno.env.get('INSTAGRAM_ACCOUNT_ID') || ''

async function postToLinkedIn(post: any): Promise<string> {
  if (!LI_ACCESS_TOKEN) throw new Error('No LinkedIn token')
  const profile = await fetch('https://api.linkedin.com/v2/me', {
    headers: { Authorization: `Bearer ${LI_ACCESS_TOKEN}` }
  }).then(r => r.json())
  
  const text = post.content + (post.hashtags?.length ? '\n\n' + post.hashtags.map((h: string) => '#' + h).join(' ') : '')
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LI_ACCESS_TOKEN}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({
      author: `urn:li:person:${profile.id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text }, shareMediaCategory: 'NONE' } },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    })
  })
  if (!res.ok) throw new Error(`LinkedIn error: ${res.status}`)
  const data = await res.json()
  return data.id || 'posted'
}

async function postToFacebook(post: any): Promise<string> {
  if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) throw new Error('No Facebook credentials')
  const text = post.content + (post.hashtags?.length ? '\n\n' + post.hashtags.map((h: string) => '#' + h).join(' ') : '')
  const res = await fetch(`https://graph.facebook.com/v21.0/${FB_PAGE_ID}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, access_token: FB_ACCESS_TOKEN })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id
}

async function postToInstagram(post: any): Promise<string> {
  if (!FB_ACCESS_TOKEN || !IG_ACCOUNT_ID) throw new Error('No Instagram credentials')
  if (!post.image_url) throw new Error('Instagram requires an image')
  const caption = post.content + (post.hashtags?.length ? '\n\n' + post.hashtags.map((h: string) => '#' + h).join(' ') : '')
  // Create container
  const c = await fetch(`https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media?image_url=${encodeURIComponent(post.image_url)}&caption=${encodeURIComponent(caption)}&access_token=${FB_ACCESS_TOKEN}`, { method: 'POST' }).then(r => r.json())
  if (c.error) throw new Error(c.error.message)
  // Publish
  const p = await fetch(`https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media_publish?creation_id=${c.id}&access_token=${FB_ACCESS_TOKEN}`, { method: 'POST' }).then(r => r.json())
  if (p.error) throw new Error(p.error.message)
  return p.id
}

serve(async () => {
  const now = new Date()
  const { data: posts } = await supabase
    .from('posts')
    .select('*, brands(name, telegram_chat_id)')
    .in('status', ['approved', 'auto_approved'])
    .lte('scheduled_at', now.toISOString())

  if (!posts?.length) {
    return new Response(JSON.stringify({ published: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  let published = 0
  for (const post of posts) {
    let platformPostId = ''
    let publishError = ''
    try {
      if (post.platform === 'linkedin') platformPostId = await postToLinkedIn(post)
      else if (post.platform === 'facebook') platformPostId = await postToFacebook(post)
      else if (post.platform === 'instagram') platformPostId = await postToInstagram(post)
      else platformPostId = 'platform-not-configured'

      await supabase.from('posts').update({
        status: 'published', published_at: now.toISOString(), platform_post_id: platformPostId
      }).eq('id', post.id)
      published++

      // Notify
      const chatId = post.brands?.telegram_chat_id || TELEGRAM_CHAT
      if (chatId) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `📤 *Published!*\n\n*Platform:* ${post.platform.toUpperCase()}\n*Brand:* ${post.brands?.name || 'Unknown'}\n✅ Post is now live`,
            parse_mode: 'Markdown'
          })
        })
      }
    } catch (e: any) {
      publishError = e.message
      await supabase.from('posts').update({ publish_error: publishError }).eq('id', post.id)
    }
  }

  return new Response(JSON.stringify({ success: true, published, total: posts.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
