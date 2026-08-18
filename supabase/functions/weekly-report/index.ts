// ─────────────────────────────────────────────────────────
// AutoMarketer — Weekly Report
// Runs every Monday at 9AM UTC
// Schedule: 0 9 * * 1
// ─────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const TELEGRAM_CHAT = Deno.env.get('TELEGRAM_CHAT_ID')!

async function claudeCall(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
  })
  const data = await res.json()
  return data.content[0].text
}

serve(async () => {
  const { data: brands } = await supabase.from('brands').select('*').eq('is_active', true)

  for (const brand of brands || []) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: posts } = await supabase
      .from('posts')
      .select('platform, content, status, likes, comments, shares, reach, engagement_rate, published_at')
      .eq('brand_id', brand.id)
      .gte('created_at', weekAgo)
      .order('engagement_rate', { ascending: false })

    if (!posts?.length) continue

    const report = await claudeCall(
      `Write a SHORT weekly social media report in plain English (like talking to a friend, no jargon). Data: ${JSON.stringify(posts)}.\n\nCover: 1) Posts published and platforms, 2) Best performing post, 3) What content worked best, 4) ONE specific thing to do MORE next week, 5) ONE thing to do LESS. Under 180 words. Be direct.`
    )

    // Save report
    const published = posts.filter((p: any) => p.status === 'published')
    const avgEng = published.length
      ? (published.reduce((a: number, p: any) => a + (parseFloat(p.engagement_rate) || 0), 0) / published.length).toFixed(1)
      : '0'

    await supabase.from('weekly_reports').insert({
      brand_id: brand.id,
      week_start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      week_end: new Date().toISOString().split('T')[0],
      report_text: report,
      total_posts: posts.length,
      avg_engagement: parseFloat(avgEng),
    })

    // Send Telegram
    const chatId = brand.telegram_chat_id || TELEGRAM_CHAT
    if (chatId) {
      const weekStr = `${new Date(Date.now() - 7*86400000).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `📊 *Weekly Report — ${brand.name}*\n_${weekStr}_\n\n${report}`,
          parse_mode: 'Markdown'
        })
      })
    }
  }

  return new Response(JSON.stringify({ success: true, brandsReported: (brands || []).length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
