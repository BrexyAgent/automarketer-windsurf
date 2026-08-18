// ─────────────────────────────────────────────────────────
// AutoMarketer — Daily Content Generation
// Supabase Edge Function
// Schedule: 0 8 * * *  (every day at 8AM UTC)
//
// Deploy: supabase functions deploy daily-generate
// Schedule via Supabase Dashboard → Edge Functions → Schedules
// ─────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const TELEGRAM_CHAT = Deno.env.get('TELEGRAM_CHAT_ID')!
const SERPER_KEY = Deno.env.get('SERPER_API_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function claudeCall(prompt: string, maxTokens = 1500): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}

async function sendTelegram(chatId: string, message: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
  })
}

async function generateForBrand(brand: any) {
  const platforms = brand.platforms || ['linkedin', 'instagram', 'twitter']

  // Get brand intelligence
  const { data: intel } = await supabase
    .from('brand_intelligence')
    .select('*')
    .eq('brand_id', brand.id)
    .single()

  // Get trending topics via Serper
  let trendCtx = ''
  if (SERPER_KEY) {
    try {
      const sr = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': SERPER_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `trending ${brand.industry} news today`, num: 3 }),
      })
      const sd = await sr.json()
      trendCtx = (sd.organic || []).slice(0, 3)
        .map((r: any) => r.title + ': ' + r.snippet).join('. ')
    } catch (e) { /* silent */ }
  }

  // Generate posts for each platform
  const profile = `Business: ${brand.name}\nIndustry: ${brand.industry}\nProducts: ${brand.products || ''}\nAudience: ${brand.target_audience || ''}\nTone: ${intel?.voice_profile?.slice(0, 200) || 'Professional'}\nKeywords: ${(intel?.keywords || []).slice(0, 5).join(', ')}\nTrending: ${trendCtx.slice(0, 300)}`

  const postsJson = await claudeCall(
    `Create 1 social media post for EACH platform: ${platforms.join(', ')}.\n\n${profile}\n\nReturn ONLY a JSON array:\n[{"platform":"linkedin","content":"full post","hashtags":["t1","t2"],"best_time":"09:00","pillar":"pillar name","image_concept":"brief visual description"}]`,
    2000
  )

  let posts: any[] = []
  try {
    const clean = postsJson.replace(/```json|```/g, '').trim()
    const s = clean.indexOf('['), e = clean.lastIndexOf(']')
    posts = JSON.parse(s >= 0 && e > s ? clean.slice(s, e + 1) : clean)
  } catch {
    posts = [{ platform: 'linkedin', content: `${brand.name} update`, hashtags: [], best_time: '09:00', pillar: 'General' }]
  }

  const now = new Date()
  const approvalDeadline = new Date(now.getTime() + (brand.auto_approve_hours || 24) * 3600000)

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const scheduled = new Date(now.getTime() + (i + 1) * 86400000)

    // Generate image via Pollinations
    let imageUrl = ''
    try {
      const imgPrompt = await claudeCall(`Image prompt (60 words, NO text) for social cover: ${brand.name}, Platform: ${post.platform}, Concept: ${post.image_concept || post.content?.slice(0, 100)}. Return ONLY prompt.`, 150)
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=800&height=800&model=flux&nologo=true&seed=${Math.floor(Math.random() * 99999)}`
    } catch { /* silent */ }

    await supabase.from('posts').insert({
      brand_id: brand.id,
      platform: post.platform,
      content: post.content,
      hashtags: post.hashtags || [],
      image_url: imageUrl,
      content_pillar: post.pillar,
      best_time: post.best_time || '09:00',
      status: 'pending_approval',
      approval_deadline: approvalDeadline.toISOString(),
      scheduled_at: scheduled.toISOString(),
      author: 'AutoMarketer AI',
      generated_by: 'ai',
    })
  }

  // Send Telegram notification
  const chatId = brand.telegram_chat_id || TELEGRAM_CHAT
  if (chatId && posts.length > 0) {
    const preview = posts[0].content?.slice(0, 150) || ''
    await sendTelegram(chatId,
      `🚀 *New posts ready — ${brand.name}*\n\n*${posts.length} posts generated* across ${platforms.join(', ')}\n\n*Preview:*\n${preview}...\n\n✅ Reply YES to approve\n✏️ Reply EDIT: [notes]\n❌ Reply NO to reject\n\n_Auto-approves in ${brand.auto_approve_hours || 24}h_`
    )
  }

  return posts.length
}

serve(async (req) => {
  try {
    const { data: brands, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)

    if (error) throw error

    let totalPosts = 0
    for (const brand of brands || []) {
      try {
        const count = await generateForBrand(brand)
        totalPosts += count
      } catch (e) {
        console.error(`Error for brand ${brand.name}:`, e)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      brandsProcessed: (brands || []).length,
      postsGenerated: totalPosts,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
