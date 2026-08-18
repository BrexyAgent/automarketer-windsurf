// ─────────────────────────────────────────────────────────
// AutoMarketer — Auto Approve
// Runs every 30 minutes
// Schedule: */30 * * * *
// ─────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const TELEGRAM_CHAT = Deno.env.get('TELEGRAM_CHAT_ID')!

serve(async () => {
  // Find all posts past their approval deadline
  const { data: expired, error } = await supabase
    .from('posts')
    .select('id, brand_id, platform, content')
    .eq('status', 'pending_approval')
    .lt('approval_deadline', new Date().toISOString())

  if (error || !expired?.length) {
    return new Response(JSON.stringify({ approved: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  // Bulk approve
  const ids = expired.map((p: any) => p.id)
  await supabase
    .from('posts')
    .update({ status: 'auto_approved', approved_by: 'system', approved_at: new Date().toISOString() })
    .in('id', ids)

  // Notify via Telegram
  if (TELEGRAM_TOKEN && TELEGRAM_CHAT) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: `⚡ *Auto-approved ${expired.length} post${expired.length !== 1 ? 's' : ''}*\n\nDeadline passed — added to publish queue.`,
        parse_mode: 'Markdown',
      }),
    })
  }

  return new Response(JSON.stringify({ success: true, approved: expired.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
