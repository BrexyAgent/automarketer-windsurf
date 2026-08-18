# AutoMarketer — AI Marketing Platform

Single-page app for AI-powered social media marketing automation. Built for Shangari Group / Waisabi.

## Project Structure

```
automarketer/
├── index.html                        ← Main app entry point
├── css/
│   └── styles.css                    ← All styles
├── js/
│   ├── core.js                       ← Config, utils, navigation, router
│   ├── dashboard.js                  ← Dashboard, Brands, Intelligence Pipeline
│   ├── content.js                    ← Generate, Approval Queue, Calendar, Posts
│   ├── analytics.js                  ← Analytics, Reports, Settings, API Keys
│   ├── seoblog-claude.js             ← SEO Blog Writer (Claude version)
│   ├── seoblog-downloads.js          ← SEO Blog: edit, copy, Word/PDF download
│   ├── blog-library.js               ← Blog Library
│   ├── seoblog-n8n.js                ← SEO Blog Writer (n8n workflow version)
│   └── workflows.js                  ← Supabase Edge Functions manager
└── supabase/
    └── functions/
        ├── daily-generate/index.ts   ← Runs 8AM daily
        ├── auto-approve/index.ts     ← Runs every 30 min
        ├── publisher/index.ts        ← Runs every 15 min
        └── weekly-report/index.ts    ← Runs Monday 9AM
```

## Running Locally

Just open `index.html` in your browser. No build step needed.

For live reload in Windsurf: right-click `index.html` → Open with Live Server.

## First Time Setup

1. Open the app → Create Account (your email + password)
2. Go to **Settings → API Keys** → enter:
   - Supabase URL: `https://hcgctngrfuquikjipnsc.supabase.co`
   - Supabase Anon Key
   - Anthropic API Key
3. Add your first brand → Run Intelligence Pipeline

## Deploying Edge Functions (replaces n8n)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login
supabase login

# Deploy all 4 functions
supabase functions deploy daily-generate --project-ref hcgctngrfuquikjipnsc
supabase functions deploy auto-approve --project-ref hcgctngrfuquikjipnsc
supabase functions deploy publisher --project-ref hcgctngrfuquikjipnsc
supabase functions deploy weekly-report --project-ref hcgctngrfuquikjipnsc
```

Then set schedules in Supabase Dashboard → Edge Functions → Schedules:
- `daily-generate`  → `0 8 * * *`
- `auto-approve`    → `*/30 * * * *`
- `publisher`       → `*/15 * * * *`
- `weekly-report`   → `0 9 * * 1`

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS — no framework, no build step
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude (content), OpenAI GPT-4o (n8n SEO blog)
- **Automation**: Supabase Edge Functions (Deno/TypeScript)
- **Images**: Pollinations AI (free)
- **Notifications**: Telegram Bot API

## Supabase Project

- Project: `marketing agent`
- ID: `hcgctngrfuquikjipnsc`
- Region: Singapore (ap-southeast-1)
- URL: `https://hcgctngrfuquikjipnsc.supabase.co`
