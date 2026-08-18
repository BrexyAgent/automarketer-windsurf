// AutoMarketer — Workflows: Supabase Edge Functions Manager


// ═══════════════════════════════════════════
// WORKFLOWS — Supabase Edge Functions Manager
// ═══════════════════════════════════════════

var WORKFLOWS = [
  {
    id: 'daily-generate',
    name: 'Daily Content Generation',
    desc: 'Generates posts for all active brands every morning at 8AM. Scrapes trends, calls Claude, generates images, saves to Supabase, sends Telegram notifications.',
    schedule: 'Every day at 8AM UTC (2:30 PM IST)',
    icon: '✦',
    color: 'var(--acc)',
    envVars: ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ANTHROPIC_API_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','SERPER_API_KEY'],
  },
  {
    id: 'auto-approve',
    name: 'Auto Approve',
    desc: 'Every 30 minutes checks for posts that have passed their approval deadline and auto-approves them, then notifies via Telegram.',
    schedule: 'Every 30 minutes',
    icon: '✓',
    color: 'var(--grn)',
    envVars: ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID'],
  },
  {
    id: 'publisher',
    name: 'Social Media Publisher',
    desc: 'Every 15 minutes posts approved content to LinkedIn, Instagram, and Facebook. Sends confirmation via Telegram after each post.',
    schedule: 'Every 15 minutes',
    icon: '📤',
    color: 'var(--blu)',
    envVars: ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','LINKEDIN_ACCESS_TOKEN','FACEBOOK_ACCESS_TOKEN','FACEBOOK_PAGE_ID','INSTAGRAM_ACCOUNT_ID'],
  },
  {
    id: 'weekly-report',
    name: 'Weekly Report',
    desc: 'Every Monday at 9AM generates a plain English performance report for each brand using Claude, saves to Supabase, and sends via Telegram.',
    schedule: 'Every Monday at 9AM UTC',
    icon: '📊',
    color: '#F59E0B',
    envVars: ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ANTHROPIC_API_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID'],
  }
];

var WF_CODE = {
  'daily-generate': `// ─────────────────────────────────────────────────────────
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
  await fetch(\`https://api.telegram.org/bot\${TELEGRAM_TOKEN}/sendMessage\`, {
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
        body: JSON.stringify({ q: \`trending \${brand.industry} news today\`, num: 3 }),
      })
      const sd = await sr.json()
      trendCtx = (sd.organic || []).slice(0, 3)
        .map((r: any) => r.title + ': ' + r.snippet).join('. ')
    } catch (e) { /* silent */ }
  }

  // Generate posts for each platform
  const profile = \`Business: \${brand.name}\\nIndustry: \${brand.industry}\\nProducts: \${brand.products || ''}\\nAudience: \${brand.target_audience || ''}\\nTone: \${intel?.voice_profile?.slice(0, 200) || 'Professional'}\\nKeywords: \${(intel?.keywords || []).slice(0, 5).join(', ')}\\nTrending: \${trendCtx.slice(0, 300)}\`

  const postsJson = await claudeCall(
    \`Create 1 social media post for EACH platform: \${platforms.join(', ')}.\\n\\n\${profile}\\n\\nReturn ONLY a JSON array:\\n[{"platform":"linkedin","content":"full post","hashtags":["t1","t2"],"best_time":"09:00","pillar":"pillar name","image_concept":"brief visual description"}]\`,
    2000
  )

  let posts: any[] = []
  try {
    const clean = postsJson.replace(/\`\`\`json|\`\`\`/g, '').trim()
    const s = clean.indexOf('['), e = clean.lastIndexOf(']')
    posts = JSON.parse(s >= 0 && e > s ? clean.slice(s, e + 1) : clean)
  } catch {
    posts = [{ platform: 'linkedin', content: \`\${brand.name} update\`, hashtags: [], best_time: '09:00', pillar: 'General' }]
  }

  const now = new Date()
  const approvalDeadline = new Date(now.getTime() + (brand.auto_approve_hours || 24) * 3600000)

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const scheduled = new Date(now.getTime() + (i + 1) * 86400000)

    // Generate image via Pollinations
    let imageUrl = ''
    try {
      const imgPrompt = await claudeCall(\`Image prompt (60 words, NO text) for social cover: \${brand.name}, Platform: \${post.platform}, Concept: \${post.image_concept || post.content?.slice(0, 100)}. Return ONLY prompt.\`, 150)
      imageUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(imgPrompt)}?width=800&height=800&model=flux&nologo=true&seed=\${Math.floor(Math.random() * 99999)}\`
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
      \`🚀 *New posts ready — \${brand.name}*\\n\\n*\${posts.length} posts generated* across \${platforms.join(', ')}\\n\\n*Preview:*\\n\${preview}...\\n\\n✅ Reply YES to approve\\n✏️ Reply EDIT: [notes]\\n❌ Reply NO to reject\\n\\n_Auto-approves in \${brand.auto_approve_hours || 24}h_\`
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
        console.error(\`Error for brand \${brand.name}:\`, e)
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
`,
  'auto-approve': `// ─────────────────────────────────────────────────────────
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
    await fetch(\`https://api.telegram.org/bot\${TELEGRAM_TOKEN}/sendMessage\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: \`⚡ *Auto-approved \${expired.length} post\${expired.length !== 1 ? 's' : ''}*\\n\\nDeadline passed — added to publish queue.\`,
        parse_mode: 'Markdown',
      }),
    })
  }

  return new Response(JSON.stringify({ success: true, approved: expired.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
`,
  'publisher': `// ─────────────────────────────────────────────────────────
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
    headers: { Authorization: \`Bearer \${LI_ACCESS_TOKEN}\` }
  }).then(r => r.json())
  
  const text = post.content + (post.hashtags?.length ? '\\n\\n' + post.hashtags.map((h: string) => '#' + h).join(' ') : '')
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: \`Bearer \${LI_ACCESS_TOKEN}\`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify({
      author: \`urn:li:person:\${profile.id}\`,
      lifecycleState: 'PUBLISHED',
      specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text }, shareMediaCategory: 'NONE' } },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    })
  })
  if (!res.ok) throw new Error(\`LinkedIn error: \${res.status}\`)
  const data = await res.json()
  return data.id || 'posted'
}

async function postToFacebook(post: any): Promise<string> {
  if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) throw new Error('No Facebook credentials')
  const text = post.content + (post.hashtags?.length ? '\\n\\n' + post.hashtags.map((h: string) => '#' + h).join(' ') : '')
  const res = await fetch(\`https://graph.facebook.com/v21.0/\${FB_PAGE_ID}/feed\`, {
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
  const caption = post.content + (post.hashtags?.length ? '\\n\\n' + post.hashtags.map((h: string) => '#' + h).join(' ') : '')
  // Create container
  const c = await fetch(\`https://graph.facebook.com/v21.0/\${IG_ACCOUNT_ID}/media?image_url=\${encodeURIComponent(post.image_url)}&caption=\${encodeURIComponent(caption)}&access_token=\${FB_ACCESS_TOKEN}\`, { method: 'POST' }).then(r => r.json())
  if (c.error) throw new Error(c.error.message)
  // Publish
  const p = await fetch(\`https://graph.facebook.com/v21.0/\${IG_ACCOUNT_ID}/media_publish?creation_id=\${c.id}&access_token=\${FB_ACCESS_TOKEN}\`, { method: 'POST' }).then(r => r.json())
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
        await fetch(\`https://api.telegram.org/bot\${TELEGRAM_TOKEN}/sendMessage\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: \`📤 *Published!*\\n\\n*Platform:* \${post.platform.toUpperCase()}\\n*Brand:* \${post.brands?.name || 'Unknown'}\\n✅ Post is now live\`,
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
`,
  'weekly-report': `// ─────────────────────────────────────────────────────────
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
      \`Write a SHORT weekly social media report in plain English (like talking to a friend, no jargon). Data: \${JSON.stringify(posts)}.\\n\\nCover: 1) Posts published and platforms, 2) Best performing post, 3) What content worked best, 4) ONE specific thing to do MORE next week, 5) ONE thing to do LESS. Under 180 words. Be direct.\`
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
      const weekStr = \`\${new Date(Date.now() - 7*86400000).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – \${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}\`
      await fetch(\`https://api.telegram.org/bot\${TELEGRAM_TOKEN}/sendMessage\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: \`📊 *Weekly Report — \${brand.name}*\\n_\${weekStr}_\\n\\n\${report}\`,
          parse_mode: 'Markdown'
        })
      })
    }
  }

  return new Response(JSON.stringify({ success: true, brandsReported: (brands || []).length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
`,
};

function vWorkflows(){
  var sbUrl = localStorage.getItem('am_sb_url')||'';
  var sbSvc = localStorage.getItem('am_sb_svc')||'';
  var allKeysSet = sbUrl && sbSvc && localStorage.getItem('am_ant_key') && localStorage.getItem('am_tg_token');

  return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">'+
  '<div><div class="pg-title">Automation Workflows</div>'+
  '<div class="pg-sub">4 Supabase Edge Functions that replace n8n completely — run in the cloud on schedule</div></div>'+
  '<button class="btn bp" onclick="showDeployGuide()">Deploy Guide</button></div>'+

  // Status banner
  (allKeysSet?
    '<div class="al al-g" style="margin-bottom:18px">✓ All required keys are set. Follow the Deploy Guide to activate workflows — takes about 10 minutes.</div>'
  : '<div class="al al-a" style="margin-bottom:18px">⚠ Some API keys are missing. <button class="btn bam bsm" onclick=\"go(\'apikeys\')\" style=\"margin-left:8px\">Add API Keys \u2192</button></div>')+

  // Architecture diagram
  '<div class="card" style="margin-bottom:18px"><div class="clbl">How It Works — Zero n8n Required</div>'+
  '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">'+
  [['AutoMarketer','Browser app · Generate, approve and manage content','var(--acc)'],['Supabase DB','Stores brands, posts, analytics and reports','#3ECF8E'],['Edge Functions','Run on schedule in Supabase cloud · No server needed','#F59E0B'],['Social APIs','LinkedIn, Instagram, Facebook, Telegram connected','#E1306C']].join('')+'</div></div>'+

  // Workflow cards
  '<div style="display:flex;flex-direction:column;gap:12px">'+
  WORKFLOWS.map(function(wf){
    var keysOk = wf.envVars.every(function(k){
      var storageKey = 'am_'+k.toLowerCase().replace(/_/g,'_');
      var keyMap = {'SUPABASE_URL':'am_sb_url','SUPABASE_SERVICE_ROLE_KEY':'am_sb_svc','ANTHROPIC_API_KEY':'am_ant_key','TELEGRAM_BOT_TOKEN':'am_tg_token','TELEGRAM_CHAT_ID':'am_tg_chat','SERPER_API_KEY':'am_serp_key','LINKEDIN_ACCESS_TOKEN':'am_li_id','FACEBOOK_ACCESS_TOKEN':'am_fb_token','FACEBOOK_PAGE_ID':'am_fb_page','INSTAGRAM_ACCOUNT_ID':'am_ig_acct'};
      return !!localStorage.getItem(keyMap[k]||storageKey);
    });
    return '<div class="card">'+
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">'+
    '<div style="width:44px;height:44px;border-radius:10px;background:'+wf.color+'22;color:'+wf.color+';display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+wf.icon+'</div>'+
    '<div style="flex:1"><div style="font-size:14px;font-weight:600">'+wf.name+'</div>'+
    '<div style="font-size:11px;color:var(--t2);margin-top:2px">⏱ '+wf.schedule+'</div></div>'+
    '<span class="bdg" style="background:'+(keysOk?'var(--grn-bg)':'var(--amb-bg)')+';color:'+(keysOk?'var(--grn2)':'var(--amb2)')+'">'+( keysOk?'Keys Ready':'Missing Keys')+'</span>'+
    '</div>'+
    '<div style="font-size:12px;color:var(--t2);line-height:1.65;margin-bottom:12px">'+wf.desc+'</div>'+
    '<div style="margin-bottom:12px"><div style="font-size:10px;color:var(--t2);font-weight:500;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Required Environment Variables</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:5px">'+
    wf.envVars.map(function(v){
      var keyMap={'SUPABASE_URL':'am_sb_url','SUPABASE_SERVICE_ROLE_KEY':'am_sb_svc','ANTHROPIC_API_KEY':'am_ant_key','TELEGRAM_BOT_TOKEN':'am_tg_token','TELEGRAM_CHAT_ID':'am_tg_chat','SERPER_API_KEY':'am_serp_key','LINKEDIN_ACCESS_TOKEN':'am_li_id','FACEBOOK_ACCESS_TOKEN':'am_fb_token','FACEBOOK_PAGE_ID':'am_fb_page','INSTAGRAM_ACCOUNT_ID':'am_ig_acct'};
      var set=!!localStorage.getItem(keyMap[v]||'');
      return '<span style="padding:3px 8px;border-radius:4px;font-size:10px;font-weight:500;background:'+(set?'var(--grn-bg)':'var(--red-bg)')+';color:'+(set?'var(--grn2)':'var(--red2)')+'">'+v+'</span>';
    }).join('')+
    '</div></div>'+
    '<div style="display:flex;gap:8px">'+
    '<button class="btn bp bsm" onclick="wfDownload(\''+wf.id+'\')">↓ Download Function</button>'+
    '<button class="btn ba bsm" onclick="wfTest(\''+wf.id+'\')">▶ Test Run</button>'+
    '<button class="btn bg bsm" onclick="showDeployGuide(\''+wf.id+'\')">Deploy Guide</button>'+
    '</div></div>';
  }).join('')+'</div>';
}

function wfDownload(id){
  var code = WF_CODE[id];
  if(!code)return;
  var blob = new Blob([code],{type:'text/typescript'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = id + '.ts';
  a.click();
}

async function wfTest(id){
  var sbUrl = localStorage.getItem('am_sb_url');
  var sbKey = localStorage.getItem('am_sb_svc') || localStorage.getItem('am_sb_key');
  if(!sbUrl||!sbKey){alert('Add Supabase URL and Service Key in Settings → API Keys first.');go('apikeys');return;}
  var fnUrl = sbUrl.replace('supabase.co', 'supabase.co/functions/v1/') + id;
  try{
    var res = await fetch(fnUrl, {method:'POST', headers:{'Authorization':'Bearer '+sbKey,'Content-Type':'application/json'}});
    var data = await res.json();
    if(data.success){alert('Function "'+id+'" ran OK! Check Supabase logs for details.');}
    else{alert('Function error: '+JSON.stringify(data));}

  }catch(e){
    alert('Could not reach function. Deploy to Supabase first. Error: '+e.message);
  }
}

function showDeployGuide(focusId){
  var sbUrl = localStorage.getItem('am_sb_url') || 'YOUR_PROJECT_REF';
  var projectRef = sbUrl.replace('https://','').replace('.supabase.co','').split('.')[0] || 'YOUR_PROJECT_REF';
  
  showModal('<div class="mt"><span>Deploy to Supabase — Step by Step</span><button class="btn bg bsm" onclick="closeModal()">✕</button></div>'+
  '<div style="display:flex;flex-direction:column;gap:14px;font-size:13px">'+

  '<div class="al al-ac">Total time: about 10 minutes. Do this once — then everything runs automatically forever.</div>'+

  '<div><div style="font-weight:600;margin-bottom:8px;font-size:14px">Step 1 — Install Supabase CLI</div>'+
  '<div style="background:var(--c2);border-radius:7px;padding:12px;font-family:monospace;font-size:12px;color:var(--grn2)">brew install supabase/tap/supabase</div>'+
  '<div style="font-size:11px;color:var(--t2);margin-top:5px">On Mac. For Windows/Linux see: supabase.com/docs/guides/cli</div></div>'+

  '<div><div style="font-weight:600;margin-bottom:8px;font-size:14px">Step 2 — Login & Init</div>'+
  '<div style="background:var(--c2);border-radius:7px;padding:12px;font-family:monospace;font-size:12px;color:var(--grn2)">'+
  'supabase login<br>'+
  'mkdir automarketer-functions && cd automarketer-functions<br>'+
  'supabase init</div></div>'+

  '<div><div style="font-weight:600;margin-bottom:8px;font-size:14px">Step 3 — Download all 4 functions</div>'+
  '<div style="font-size:12px;color:var(--t2);margin-bottom:8px">Click each button to download the TypeScript file:</div>'+
  '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
  WORKFLOWS.map(function(wf){return '<button class="btn bp bsm" onclick="wfDownload(\''+wf.id+'\')">&#8595; '+wf.id+'.ts</button>';}).join('')+
  '</div>'+
  '<div style="font-size:11px;color:var(--t2);margin-top:8px">Place each file in: <code>supabase/functions/FUNCTION_NAME/index.ts</code></div></div>'+

  '<div><div style="font-weight:600;margin-bottom:8px;font-size:14px">Step 4 — Set environment variables</div>'+
  '<div style="font-size:12px;color:var(--t2);margin-bottom:8px">Go to your Supabase Dashboard → Project Settings → Edge Functions → Add these secrets:</div>'+
  '<button class="btn ba bsm" onclick="exportN8nConfig()">↓ Download all keys as config file</button>'+
  '<div style="font-size:11px;color:var(--t2);margin-top:6px">Or add manually in Supabase Dashboard → Edge Functions → Secrets</div></div>'+

  '<div><div style="font-weight:600;margin-bottom:8px;font-size:14px">Step 5 — Deploy all 4 functions</div>'+
  '<div style="background:var(--c2);border-radius:7px;padding:12px;font-family:monospace;font-size:12px;color:var(--grn2)">'+
  'supabase functions deploy daily-generate --project-ref '+projectRef+'<br>'+
  'supabase functions deploy auto-approve --project-ref '+projectRef+'<br>'+
  'supabase functions deploy publisher --project-ref '+projectRef+'<br>'+
  'supabase functions deploy weekly-report --project-ref '+projectRef+'</div></div>'+

  '<div><div style="font-weight:600;margin-bottom:8px;font-size:14px">Step 6 — Set schedules in Supabase Dashboard</div>'+
  '<div style="font-size:12px;color:var(--t2);margin-bottom:8px">Supabase Dashboard → Edge Functions → select each function → Schedules tab → Add:</div>'+
  '<div style="background:var(--c2);border-radius:7px;padding:12px;font-family:monospace;font-size:11px;line-height:1.8;color:var(--t1)">'+
  'daily-generate   →  0 8 * * *     (8AM daily)<br>'+
  'auto-approve     →  */30 * * * *  (every 30 min)<br>'+
  'publisher        →  */15 * * * *  (every 15 min)<br>'+
  'weekly-report    →  0 9 * * 1     (Monday 9AM)</div></div>'+

  '<div><div style="font-weight:600;margin-bottom:8px;font-size:14px">Step 7 — Test each function</div>'+
  '<div style="font-size:12px;color:var(--t2);margin-bottom:8px">Once deployed, click Test Run on each workflow card to verify it works.</div>'+
  '<div class="al al-g" style="margin-bottom:0">After Step 7 — you are done. n8n is no longer needed. Everything runs in Supabase automatically.</div></div>'+

  '<button class="btn bp bfw" onclick="closeModal()" style="padding:12px;font-size:13px">Got it, I will set it up</button>'+
  '</div>');
}
