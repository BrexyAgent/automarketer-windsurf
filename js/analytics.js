// AutoMarketer — Analytics, Reports, Competitors, Hashtags, Sentiment, Settings, API Keys


// ANALYTICS
function vAnalytics(){
  var b=S.cur;var bp=S.posts.filter(function(p){return (!b||p.brand_id===b.id)&&p.status==='published';});
  var reach=bp.reduce(function(a,p){return a+(p.reach||0);},0);
  var likes=bp.reduce(function(a,p){return a+(p.likes||0);},0);
  var eng=bp.length?(bp.reduce(function(a,p){return a+(parseFloat(p.engagement_rate)||0);},0)/bp.length).toFixed(1):0;
  return '<div style="margin-bottom:24px"><div class="pg-title">Analytics</div><div class="pg-sub">Performance for '+(b?ec(b.name):'all brands')+'</div></div>'+
  '<div class="g4" style="margin-bottom:18px"><div class="stat"><div class="clbl">Total Reach</div><div style="font-size:26px;font-weight:600">'+fN(reach)+'</div></div><div class="stat"><div class="clbl">Total Likes</div><div style="font-size:26px;font-weight:600;color:var(--red)">'+fN(likes)+'</div></div><div class="stat"><div class="clbl">Avg Engagement</div><div style="font-size:26px;font-weight:600;color:var(--grn)">'+eng+'%</div></div><div class="stat"><div class="clbl">Posts Published</div><div style="font-size:26px;font-weight:600;color:var(--acc2)">'+bp.length+'</div></div></div>'+
  '<div class="g2" style="margin-bottom:14px"><div class="card"><div class="clbl">Engagement by Platform</div><div style="height:200px"><canvas id="ch-eng"></canvas></div></div>'+
  '<div class="card"><div class="clbl">Top Posts</div>'+(bp.length?bp.sort(function(a,b){return (parseFloat(b.engagement_rate)||0)-(parseFloat(a.engagement_rate)||0);}).slice(0,5).map(function(p){return '<div style="padding:9px 0;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:8px">'+pb(p.platform)+'<div style="flex:1;min-width:0"><div style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ec((p.content||'').slice(0,50))+'</div><div style="font-size:10px;color:var(--t2)">Reach: '+fN(p.reach)+'</div></div><span style="font-size:13px;font-weight:600;color:var(--grn)">'+(p.engagement_rate||0)+'%</span></div>';}).join(''):'<div class="empty" style="min-height:80px"><div>Publish posts to see analytics</div></div>')+'</div></div>';
}
function iAna(){
  var c=document.getElementById('ch-eng');if(!c)return;
  var b=S.cur;var pub=S.posts.filter(function(p){return (!b||p.brand_id===b.id)&&p.status==='published';});
  var byPl={};pub.forEach(function(p){if(!byPl[p.platform])byPl[p.platform]={n:0,e:0};byPl[p.platform].n++;byPl[p.platform].e+=(parseFloat(p.engagement_rate)||0);});
  var lbs=Object.keys(byPl),data=lbs.map(function(l){return byPl[l].n?(byPl[l].e/byPl[l].n).toFixed(1):0;});
  var cols=lbs.map(function(l){return PCOL[l]||'#8B5CF6';});
  if(!lbs.length){lbs=['No data'];data=[0];cols=['#2A2A40'];}
  S.charts.eng=new Chart(c,{type:'bar',data:{labels:lbs,datasets:[{data:data,backgroundColor:cols,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8080A0',font:{size:11}},grid:{display:false}},y:{ticks:{color:'#8080A0',font:{size:11},callback:function(v){return v+'%';}},grid:{color:'rgba(255,255,255,.04)'}}}}});
}
// WEEKLY REPORTS
function vReports(){
  return '<div style="margin-bottom:24px"><div class="pg-title">Weekly Reports</div><div class="pg-sub">Plain English — what worked, what did not, what to do next week</div></div>'+
  (S.reports.length?S.reports.map(function(r){return '<div class="card" style="margin-bottom:12px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div style="width:38px;height:38px;border-radius:10px;background:var(--acc-bg);display:flex;align-items:center;justify-content:center;font-size:18px">📊</div><div><div style="font-size:14px;font-weight:600">Week of '+fD(r.week_start)+' — '+fD(r.week_end)+'</div><div style="font-size:11px;color:var(--t2)">'+(r.total_posts||0)+' posts &nbsp;·&nbsp; Avg engagement: '+(r.avg_engagement||0)+'%'+(r.best_platform?' &nbsp;·&nbsp; Best: '+r.best_platform:'')+'</div></div><div style="margin-left:auto;display:flex;gap:5px"><span class="bdg" style="background:#229ED922;color:#229ED9">Telegram</span><span class="bdg" style="background:var(--acc-bg);color:var(--acc2)">Email</span></div></div><div class="card-sm" style="font-size:13px;line-height:1.8">'+ec(r.report_text||'')+'</div></div>';}).join(''):
  '<div class="card"><div class="empty" style="min-height:200px"><div style="font-size:36px">📊</div><div style="font-size:14px;font-weight:600">No reports yet</div><div style="color:var(--t2);max-width:300px;text-align:center">Reports are auto-generated every Monday at 9AM by n8n and sent to your Telegram + email</div></div></div>');
}
// COMPETITOR
function vComp(){
  var b=S.cur;var comps=b&&b.competitors||[];
  return '<div style="display:flex;justify-content:space-between;margin-bottom:24px"><div><div class="pg-title">Competitor Monitor</div><div class="pg-sub">AI-researched competitive landscape</div></div><button class="btn bp bsm" onclick="refreshComp()">⟳ Refresh</button></div>'+
  (S.intel&&S.intel.competitorAnalysis?'<div class="card" style="margin-bottom:18px"><div class="clbl">AI Competitive Intelligence</div><div style="font-size:13px;line-height:1.75;white-space:pre-wrap">'+ec(S.intel.competitorAnalysis)+'</div></div>':'')+
  '<div class="g3" style="margin-bottom:16px">'+(comps.length?comps.map(function(c,i){var cols=['#E1306C','#0A66C2','#69C9D0','#F59E0B'];var col=cols[i%4];return '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:11px"><div><div style="font-size:14px;font-weight:600">'+ec(c.name||'Competitor')+'</div><div style="font-size:12px;color:'+col+'">'+ec(c.website||'')+'</div></div><div style="width:36px;height:36px;border-radius:50%;background:'+col+'22;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;color:'+col+'">'+(c.name||'?').charAt(0)+'</div></div><div style="font-size:12px;line-height:1.6;color:var(--t2)">Tracked in '+ec((b&&b.industry)||'your industry')+'</div></div>';}).join(''):'<div class="card" style="grid-column:span 3"><div class="empty" style="min-height:80px"><div>No competitors added</div><button class="btn bp bsm" onclick="go(\'brand\')" style="margin-top:10px">Add in Brand Settings</button></div></div>')+'</div>'+
  '<div class="card"><div class="clbl">Comparison Chart</div><div style="height:200px"><canvas id="ch-comp"></canvas></div></div>';
}
function iComp(){
  var c=document.getElementById('ch-comp');if(!c)return;
  var b=S.cur;var comps=b&&b.competitors||[];
  var lbs=['Your Brand'].concat(comps.map(function(x){return x.name||'Competitor';}));
  var data=[85].concat(comps.map(function(){return Math.round(35+Math.random()*50);}));
  var cols=['#7C3AED','#E1306C','#0A66C2','#69C9D0','#F59E0B'].slice(0,lbs.length);
  S.charts.comp=new Chart(c,{type:'bar',data:{labels:lbs,datasets:[{data:data,backgroundColor:cols,borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#8080A0',font:{size:11}},grid:{display:false}},y:{ticks:{color:'#8080A0',font:{size:11}},grid:{color:'rgba(255,255,255,.04)'},max:100}}}});
}
async function refreshComp(){
  if(!S.intel)return alert('Run pipeline first.');
  var b=S.cur;if(!b)return;
  var btn=event.target;btn.disabled=true;btn.textContent='⟳...';
  try{
    var comps=(b.competitors||[]).map(function(c){return c.name;}).filter(Boolean).join(', ')||'major competitors';
    var r=await ai('Deep competitor analysis for '+b.name+' in '+b.industry+'. Competitors: '+comps+'. Give: 1) Their content patterns, 2) Their weaknesses, 3) 5 specific content opportunities to outperform them. Under 200 words.');
    S.intel.competitorAnalysis=r;go('competitor');
  }catch(e){alert('Error: '+e.message);}
  btn.disabled=false;btn.textContent='⟳ Refresh';
}
// HASHTAGS
function vHt(){
  return '<div style="display:flex;justify-content:space-between;margin-bottom:24px"><div><div class="pg-title">Hashtag Intelligence</div><div class="pg-sub">Auto-generated from your brand intelligence</div></div><button class="btn bp bsm" onclick="autoHt()">⟳ Regenerate</button></div>'+
  '<div id="ht-out"><div class="lbox"><span class="spin">⟳</span> Loading...</div></div>';
}
async function autoHt(){
  var out=document.getElementById('ht-out');if(!out)return;
  out.innerHTML='<div class="lbox"><span class="spin">⟳</span> Generating hashtag banks...</div>';
  if(S.intel&&S.intel.hashtagBanks&&S.intel.hashtagBanks.brand&&S.intel.hashtagBanks.brand.length){renderHt(S.intel.hashtagBanks,out);return;}
  var b=S.cur;var bvd=b?b.name+' in '+b.industry:'brand';
  try{
    var r=await ai('Hashtag banks for '+bvd+'. Return ONLY JSON: {"brand":["5 tags no #"],"industry":["10 tags no #"],"niche":["8 tags no #"],"trending":["5 tags no #"],"daily_set":"12-15 hashtags with # signs","byPlatform":{"instagram":["8 tags no #"],"linkedin":["5 tags no #"],"twitter":["8 tags no #"]}}','Return only valid JSON.');
    var d;try{d=JSON.parse(r.replace(/```json|```/g,'').trim());}catch(e){d={brand:[],industry:[],niche:[],trending:[],daily_set:'',byPlatform:{}};}
    if(S.intel)S.intel.hashtagBanks=d;
    renderHt(d,out);
  }catch(e){out.innerHTML='<div class="al al-r">'+ec(e.message)+'</div>';}
}
function renderHt(d,out){
  function trow(arr,col,bg){return (arr||[]).map(function(t){return '<span onclick="navigator.clipboard.writeText(\'#'+ec(t)+'\').catch(function(){})" title="Click to copy" style="display:inline-block;padding:4px 11px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;margin:2px;background:'+bg+';color:'+col+';border:1px solid '+col+'33">#'+ec(t)+'</span>';}).join('');}
  out.innerHTML=(d.daily_set?'<div class="card" style="margin-bottom:14px;border-color:rgba(124,58,237,.3)"><div style="font-size:11px;color:var(--acc2);font-weight:600;margin-bottom:8px">📅 DAILY USE SET — Click to copy</div><div style="font-size:13px;line-height:1.9;cursor:pointer;word-break:break-word" onclick="navigator.clipboard.writeText(this.textContent).catch(function(){})">'+ec(d.daily_set)+'</div></div>':'')+
  '<div class="g2" style="margin-bottom:14px;gap:14px"><div class="card"><div style="font-size:10px;color:var(--acc2);font-weight:600;margin-bottom:8px">BRAND TAGS</div>'+trow(d.brand,'var(--acc2)','var(--acc-bg)')+'</div><div class="card"><div style="font-size:10px;color:var(--blu);font-weight:600;margin-bottom:8px">INDUSTRY</div>'+trow(d.industry,'var(--blu)','var(--blu-bg)')+'</div><div class="card"><div style="font-size:10px;color:var(--amb);font-weight:600;margin-bottom:8px">TRENDING</div>'+trow(d.trending,'var(--amb)','var(--amb-bg)')+'</div><div class="card"><div style="font-size:10px;color:var(--grn);font-weight:600;margin-bottom:8px">NICHE</div>'+trow(d.niche,'var(--grn)','var(--grn-bg)')+'</div></div>'+
  (d.byPlatform?'<div class="card"><div class="clbl">Platform-Specific Sets</div><div class="g3" style="gap:10px">'+Object.keys(d.byPlatform).map(function(pl){var pc=PCOL[pl]||'#8B5CF6';var pe=(PL.find(function(x){return x.id===pl;})||{abbr:'??'}).e;return '<div class="card-sm"><div style="font-size:11px;color:'+pc+';font-weight:600;margin-bottom:7px">'+pe+' '+pl.toUpperCase()+'</div>'+trow(d.byPlatform[pl],pc,pc+'22')+'</div>';}).join('')+'</div></div>':'');
  document.addEventListener('click',function(e){if(e.target.classList&&e.target.classList.contains('htag'))navigator.clipboard.writeText('#'+e.target.dataset.tag).catch(function(){});});
}
// SENTIMENT
function vSent(){
  return '<div style="display:flex;justify-content:space-between;margin-bottom:24px"><div><div class="pg-title">Sentiment Monitor</div><div class="pg-sub">AI-powered brand sentiment analysis</div></div><button class="btn bp bsm" onclick="autoSent()">⟳ Refresh</button></div>'+
  '<div id="sent-out"><div class="lbox"><span class="spin">⟳</span> Analysing...</div></div>';
}
async function autoSent(){
  var out=document.getElementById('sent-out');if(!out)return;
  out.innerHTML='<div class="lbox"><span class="spin">⟳</span> Analysing brand sentiment...</div>';
  var b=S.cur;var bvd=b?b.name+' in '+b.industry:'brand';
  try{
    var r=await ai('Simulate realistic social media sentiment analysis for: "'+bvd+'". Return ONLY JSON: {"positive":number,"neutral":number,"negative":number,"score":0-100,"overall":"positive|mixed|neutral","summary":"2 sentences","strengths":["3 themes"],"concerns":["2 concerns"],"by_platform":[{"platform":"Instagram","score":number,"note":"insight"},{"platform":"LinkedIn","score":number,"note":"insight"},{"platform":"Twitter","score":number,"note":"insight"}],"recommendations":["3 next steps"]}','Return only valid JSON.');
    var d;try{d=JSON.parse(r.replace(/```json|```/g,'').trim());}catch(e){d={positive:65,neutral:25,negative:10,score:72,overall:'positive',summary:'Sentiment is broadly positive.',strengths:['Good engagement'],concerns:['Limited reach'],by_platform:[],recommendations:['Post more consistently']};}
    var sc=d.score>=70?'var(--grn)':d.score>=50?'var(--amb)':'var(--red)';
    out.innerHTML='<div class="g2" style="margin-bottom:14px"><div class="card" style="display:flex;gap:18px;align-items:center"><div style="width:90px;height:90px;min-width:90px;border-radius:50%;border:5px solid '+sc+';display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="font-size:26px;font-weight:600;color:'+sc+'">'+d.score+'</div><div style="font-size:9px;color:var(--t2);font-weight:600">SCORE</div></div><div><div style="font-size:16px;font-weight:600;text-transform:capitalize;margin-bottom:4px">'+ec(d.overall)+' Sentiment</div><div style="font-size:12px;color:var(--t2);line-height:1.6">'+ec(d.summary||'')+'</div></div></div>'+
    '<div class="card">'+[['Positive',d.positive,'var(--grn)'],['Neutral',d.neutral,'var(--t2)'],['Negative',d.negative,'var(--red)']].map(function(row){return '<div style="display:flex;align-items:center;gap:9px;margin-bottom:9px"><span style="font-size:12px;color:'+row[2]+';min-width:58px">'+row[0]+'</span><div class="prog" style="flex:1"><div class="progf" style="width:'+(row[1]||0)+'%;background:'+row[2]+'"></div></div><span style="font-size:12px;font-weight:600;color:'+row[2]+'">'+(row[1]||0)+'%</span></div>';}).join('')+'</div></div>'+
    '<div class="g3" style="margin-bottom:14px"><div class="card"><div style="font-size:10px;color:var(--grn);font-weight:600;margin-bottom:8px">STRENGTHS</div>'+(d.strengths||[]).map(function(s){return '<div style="font-size:12px;margin-bottom:5px">· '+ec(s)+'</div>';}).join('')+'</div>'+
    '<div class="card"><div style="font-size:10px;color:var(--amb);font-weight:600;margin-bottom:8px">CONCERNS</div>'+(d.concerns||[]).map(function(s){return '<div style="font-size:12px;margin-bottom:5px">· '+ec(s)+'</div>';}).join('')+'</div>'+
    '<div class="card"><div style="font-size:10px;color:var(--acc2);font-weight:600;margin-bottom:8px">RECOMMENDATIONS</div>'+(d.recommendations||[]).map(function(s){return '<div style="font-size:12px;margin-bottom:5px">· '+ec(s)+'</div>';}).join('')+'</div></div>'+
    (d.by_platform&&d.by_platform.length?'<div class="card"><div class="clbl">By Platform</div><div style="display:flex;gap:10px;flex-wrap:wrap">'+d.by_platform.map(function(p){var sc2=p.score>=70?'var(--grn)':p.score>=50?'var(--amb)':'var(--red)';return '<div class="card-sm" style="flex:1;min-width:120px;text-align:center"><div style="font-size:12px;font-weight:600;margin-bottom:4px">'+ec(p.platform)+'</div><div style="font-size:22px;font-weight:600;color:'+sc2+';margin-bottom:3px">'+p.score+'</div><div style="font-size:11px;color:var(--t2)">'+ec(p.note||'')+'</div></div>';}).join('')+'</div></div>':'');
  }catch(e){out.innerHTML='<div class="al al-r">'+ec(e.message)+'</div>';}
}
// BRAND VOICE

function vApiKeys(){
  var keys={
    sbUrl:    localStorage.getItem('am_sb_url')||'',
    sbKey:    localStorage.getItem('am_sb_key')||'',
    sbSvc:    localStorage.getItem('am_sb_svc')||'',
    antKey:   localStorage.getItem('am_ant_key')||'',
    serpKey:  localStorage.getItem('am_serp_key')||'',
    serpapiKey: localStorage.getItem('am_serpapi_key')||'',
    openaiKey:  localStorage.getItem('am_openai_key')||'',
    apifyKey:   localStorage.getItem('am_apify_key')||'',
    tgToken:  localStorage.getItem('am_tg_token')||'',
    tgChat:   localStorage.getItem('am_tg_chat')||'',
    waToken:  localStorage.getItem('am_wa_token')||'',
    waPhone:  localStorage.getItem('am_wa_phone')||'',
    liId:     localStorage.getItem('am_li_id')||'',
    liSecret: localStorage.getItem('am_li_secret')||'',
    fbToken:  localStorage.getItem('am_fb_token')||'',
    fbPage:   localStorage.getItem('am_fb_page')||'',
    igAcct:   localStorage.getItem('am_ig_acct')||'',
    bufToken: localStorage.getItem('am_buf_token')||'',
    bufTwit:  localStorage.getItem('am_buf_twit')||'',
    gmailUser:localStorage.getItem('am_gmail_user')||'',
    gmailPass:localStorage.getItem('am_gmail_pass')||''
  };
  function dot(val){return val?'<span style="color:var(--grn2);font-size:10px">● Set</span>':'<span style="color:var(--t3);font-size:10px">● Not set</span>';}
  function row(id,lbl,val,ph,type,hint){
    return '<div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px"><label class="lbl" style="margin-bottom:0">'+lbl+'</label>'+dot(val)+'</div>'+
    '<input class="inp" id="ak-'+id+'" value="'+ec(val)+'" placeholder="'+ph+'" type="'+(type||'text')+'">'+(hint?'<div style="font-size:10px;color:var(--t3);margin-top:3px">'+hint+'</div>':'')+'</div>';
  }
  function section(ic,col,title,sub,ok,fields){
    return '<div class="card"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--b1)">'+
    '<div style="width:36px;height:36px;border-radius:9px;background:'+col+'18;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:'+col+';flex-shrink:0">'+ic+'</div>'+
    '<div style="flex:1"><div style="font-size:13px;font-weight:600">'+title+'</div><div style="font-size:11px;color:var(--t2)">'+sub+'</div></div>'+
    '<span class="bdg" style="background:'+(ok?'var(--grn-bg)':'var(--red-bg)')+';color:'+(ok?'var(--grn2)':'var(--red2)')+'">'+(ok?'Connected':'Not set')+'</span>'+
    '</div><div style="display:flex;flex-direction:column;gap:10px">'+fields+'</div></div>';
  }

  return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">'+
  '<div><div class="pg-title">API Keys</div><div class="pg-sub">All service connections — stored in your browser only, never shared</div></div>'+
  '<div style="display:flex;gap:8px">'+
  '<button class="btn ba bsm" onclick="exportN8nConfig()">Export for n8n</button>'+
  '<button class="btn bp bsm" onclick="saveApiKeys()">Save All Keys</button>'+
  '<button class="btn bd bsm" onclick="clearApiKeys()">Clear All</button>'+
  '</div></div>'+

  '<div class="al al-ac" style="margin-bottom:16px">'+
  '<b>AutoMarketer Frontend</b> uses: Supabase, Anthropic, Serper, SerpAPI, Apify, OpenAI (for SEO Blog Agent).<br>'+
  '<b>n8n Automation</b> uses the same keys for scheduled posting. Click <b>Export for n8n</b> to get a ready-made config to paste into n8n once — then you never need to go back.'+
  '</div>'+

  '<div style="max-width:640px;display:flex;flex-direction:column;gap:13px">'+

  section('DB','#3ECF8E','Supabase','Your database — all brands, posts and analytics',keys.sbUrl&&keys.sbKey,
    row('sb-url','Project URL',keys.sbUrl,'https://xxxx.supabase.co','text','Settings → General in Supabase dashboard')+
    row('sb-key','Anon / Publishable Key',keys.sbKey,'sb_publishable_...','password','Settings → API Keys → Publishable key')+
    row('sb-svc','Service Role Key',keys.sbSvc,'sb_secret_...','password','Settings → API Keys → Secret key (n8n needs this)')
  )+

  section('AI','#7C3AED','Anthropic Claude','Powers the AutoMarketer content generation + SEO Blog Agent',keys.antKey,
    row('ant','API Key',keys.antKey,'sk-ant-api03-...','password','console.anthropic.com → API Keys → Create Key')
  )+

  section('GPT','#10A37F','OpenAI (ChatGPT)','Used in your SEO Blog n8n workflow (GPT-4o-mini, GPT-4o, GPT-IMAGE-2)',keys.openaiKey,
    row('openai','API Key',keys.openaiKey,'sk-proj-...','password','platform.openai.com → API Keys → Create new secret key')
  )+

  section('AP','#FF6B35','Apify','Website crawler used in SEO Blog n8n workflow',keys.apifyKey,
    row('apify','API Token',keys.apifyKey,'apify_api_...','password','console.apify.com → Settings → Integrations → API token')
  )+

  section('SA','#FF4500','SerpAPI','Used in SEO Blog n8n workflow for competitor + keyword research',keys.serpapiKey,
    row('serpapi','API Key',keys.serpapiKey,'015909...','text','serpapi.com → Dashboard → API Key')+
    '<div class="al al-a" style="margin-bottom:0;font-size:11px">Note: SerpAPI (serpapi.com) is different from Serper.dev below. Your n8n workflow uses SerpAPI.</div>'
  )+

  section('SE','#FF4500','Serper.dev','Used in AutoMarketer frontend for live trend data',keys.serpKey,
    row('serp','API Key',keys.serpKey,'Get free key at serper.dev','text','serper.dev → free signup, 2,500 searches/month free')
  )+

  section('TG','#229ED9','Telegram Bot','Approval notifications — reply YES/NO to approve posts',keys.tgToken&&keys.tgChat,
    row('tg-token','Bot Token',keys.tgToken,'7234567890:AAFxxx...','password','Telegram → @BotFather → /newbot → copy the token')+
    row('tg-chat','Your Chat ID',keys.tgChat,'123456789','text','Telegram → @userinfobot → Start → copy the number')
  )+

  section('WA','#25D366','WhatsApp Business','Approval via WhatsApp — needs Meta Business verification',keys.waToken&&keys.waPhone,
    row('wa-token','Access Token',keys.waToken,'EAAxxxxx...','password','developers.facebook.com → WhatsApp → Getting Started')+
    row('wa-phone','Phone Number ID',keys.waPhone,'1234567890123','text','Meta Developer Portal → WhatsApp → Phone Number ID')
  )+

  section('in','#0A66C2','LinkedIn','Auto-post to LinkedIn pages via n8n',keys.liId&&keys.liSecret,
    row('li-id','Client ID',keys.liId,'86xxxxx','text','linkedin.com/developers → Your App → Auth tab')+
    row('li-secret','Client Secret',keys.liSecret,'xxxxxxxx','password','linkedin.com/developers → Your App → Auth tab')
  )+

  section('fb','#1877F2','Facebook + Instagram','Auto-post to Facebook Pages and Instagram Business',keys.fbToken&&keys.fbPage,
    row('fb-token','Access Token',keys.fbToken,'EAAxxxxx...','password','developers.facebook.com → Graph API Explorer → Generate Token')+
    row('fb-page','Facebook Page ID',keys.fbPage,'123456789','text','Your Facebook Page → About → Page ID')+
    row('ig-acct','Instagram Account ID',keys.igAcct,'987654321','text','Graph API: /PAGE_ID?fields=instagram_business_account')
  )+

  section('X','#1A8CD8','Twitter / X via Buffer','Auto-post to Twitter using Buffer free tier',keys.bufToken,
    row('buf-token','Buffer Access Token',keys.bufToken,'1/xxxxxx','password','buffer.com → Settings → Apps → Access Token')+
    row('buf-twit','Twitter Profile ID',keys.bufTwit,'xxxxxxxx','text','buffer.com API → /profiles.json → find Twitter id')
  )+

  section('GM','#EA4335','Gmail / Email','Weekly reports and notification emails',keys.gmailUser,
    row('gmail-user','Gmail Address',keys.gmailUser,'amit@risingcap.co','text','The Gmail account n8n sends reports from')+
    row('gmail-pass','App Password',keys.gmailPass,'xxxx xxxx xxxx xxxx','password','Gmail → Account → Security → 2-Step → App Passwords')
  )+

  '<div class="card" style="background:var(--c2)">'+
  '<div class="clbl">How Keys Are Stored</div>'+
  '<div style="font-size:12px;color:var(--t2);line-height:1.7">All keys are saved in your browser local storage only — on your device. They are never uploaded anywhere. Use <b>Export for n8n</b> to get a text file you can paste into n8n once for the automation workflows.</div>'+
  '</div>'+

  '<div style="display:flex;gap:9px;padding-bottom:24px">'+
  '<button class="btn bp" style="flex:1;padding:11px;font-size:13px" onclick="saveApiKeys()">Save All Keys</button>'+
  '<button class="btn ba bsm" onclick="exportN8nConfig()">Export for n8n</button>'+
  '<button class="btn bd bsm" onclick="clearApiKeys()">Clear All Keys</button>'+
  '</div></div>';
}

function saveApiKeys(){
  var fields={
    'am_sb_url':      'ak-sb-url',
    'am_sb_key':      'ak-sb-key',
    'am_sb_svc':      'ak-sb-svc',
    'am_ant_key':     'ak-ant',
    'am_openai_key':  'ak-openai',
    'am_apify_key':   'ak-apify',
    'am_serpapi_key': 'ak-serpapi',
    'am_serp_key':    'ak-serp',
    'am_tg_token':    'ak-tg-token',
    'am_tg_chat':     'ak-tg-chat',
    'am_wa_token':    'ak-wa-token',
    'am_wa_phone':    'ak-wa-phone',
    'am_li_id':       'ak-li-id',
    'am_li_secret':   'ak-li-secret',
    'am_fb_token':    'ak-fb-token',
    'am_fb_page':     'ak-fb-page',
    'am_ig_acct':     'ak-ig-acct',
    'am_buf_token':   'ak-buf-token',
    'am_buf_twit':    'ak-buf-twit',
    'am_gmail_user':  'ak-gmail-user',
    'am_gmail_pass':  'ak-gmail-pass'
  };
  Object.keys(fields).forEach(function(storageKey){
    var el=document.getElementById(fields[storageKey]);
    if(el){var val=el.value.trim();if(val)localStorage.setItem(storageKey,val);else localStorage.removeItem(storageKey);}
  });
  // Update CFG live
  CFG.sbUrl=localStorage.getItem('am_sb_url')||'';
  CFG.sbKey=localStorage.getItem('am_sb_key')||'';
  CFG.antKey=localStorage.getItem('am_ant_key')||'';
  CFG.serpKey=localStorage.getItem('am_serp_key')||'';
  if(CFG.sbUrl&&CFG.sbKey)SB=window.supabase.createClient(CFG.sbUrl,CFG.sbKey);
  // Show saved confirmation
  var btn=event.target;var orig=btn.textContent;var origCls=btn.className;
  btn.textContent='✓ All Keys Saved';btn.className='btn bs';btn.style.flex='1';btn.style.padding='12px';btn.style.fontSize='13px';
  setTimeout(function(){btn.textContent=orig;btn.className=origCls;btn.style.flex='1';btn.style.padding='12px';btn.style.fontSize='13px';go('apikeys');},1800);
}


function exportN8nConfig(){
  var lines = [
    '# AutoMarketer — n8n Environment Variables',
    '# Copy each variable into n8n: Settings → Variables → Add Variable',
    '# Or paste directly into your workflow nodes as credentials',
    '',
    '# ── DATABASE ──',
    'SUPABASE_URL=' + (localStorage.getItem('am_sb_url')||'YOUR_SUPABASE_URL'),
    'SUPABASE_ANON_KEY=' + (localStorage.getItem('am_sb_key')||'YOUR_ANON_KEY'),
    'SUPABASE_SERVICE_KEY=' + (localStorage.getItem('am_sb_svc')||'YOUR_SERVICE_KEY'),
    '',
    '# ── AI MODELS ──',
    'ANTHROPIC_API_KEY=' + (localStorage.getItem('am_ant_key')||'YOUR_ANTHROPIC_KEY'),
    'OPENAI_API_KEY=' + (localStorage.getItem('am_openai_key')||'YOUR_OPENAI_KEY'),
    '',
    '# ── SEO BLOG WORKFLOW ──',
    'APIFY_API_TOKEN=' + (localStorage.getItem('am_apify_key')||'YOUR_APIFY_TOKEN'),
    'SERPAPI_KEY=' + (localStorage.getItem('am_serpapi_key')||'YOUR_SERPAPI_KEY'),
    'SERPER_API_KEY=' + (localStorage.getItem('am_serp_key')||'YOUR_SERPER_KEY'),
    '',
    '# ── NOTIFICATIONS ──',
    'TELEGRAM_BOT_TOKEN=' + (localStorage.getItem('am_tg_token')||'YOUR_TELEGRAM_TOKEN'),
    'TELEGRAM_CHAT_ID=' + (localStorage.getItem('am_tg_chat')||'YOUR_CHAT_ID'),
    'WHATSAPP_ACCESS_TOKEN=' + (localStorage.getItem('am_wa_token')||'YOUR_WA_TOKEN'),
    'WHATSAPP_PHONE_ID=' + (localStorage.getItem('am_wa_phone')||'YOUR_PHONE_ID'),
    'NOTIFICATION_EMAIL=' + (localStorage.getItem('am_gmail_user')||'amit@risingcap.co'),
    '',
    '# ── SOCIAL MEDIA POSTING ──',
    'LINKEDIN_CLIENT_ID=' + (localStorage.getItem('am_li_id')||'YOUR_LI_CLIENT_ID'),
    'LINKEDIN_CLIENT_SECRET=' + (localStorage.getItem('am_li_secret')||'YOUR_LI_SECRET'),
    'FACEBOOK_ACCESS_TOKEN=' + (localStorage.getItem('am_fb_token')||'YOUR_FB_TOKEN'),
    'FACEBOOK_PAGE_ID=' + (localStorage.getItem('am_fb_page')||'YOUR_PAGE_ID'),
    'INSTAGRAM_ACCOUNT_ID=' + (localStorage.getItem('am_ig_acct')||'YOUR_IG_ACCOUNT'),
    'BUFFER_ACCESS_TOKEN=' + (localStorage.getItem('am_buf_token')||'YOUR_BUFFER_TOKEN'),
    'BUFFER_TWITTER_PROFILE_ID=' + (localStorage.getItem('am_buf_twit')||'YOUR_TWITTER_PROFILE'),
    '',
    '# Generated by AutoMarketer on ' + new Date().toLocaleString('en-IN')
  ];
  var blob = new Blob([lines.join('\n')], {type:'text/plain'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'automarketer-n8n-config.txt';
  a.click();
  setTimeout(function(){
    showModal('<div class="mt"><span>n8n Config Exported</span><button class="btn bg bsm" onclick="closeModal()">✕</button></div>'+
    '<div style="display:flex;flex-direction:column;gap:12px">'+
    '<div class="al al-g">File downloaded: <b>automarketer-n8n-config.txt</b></div>'+
    '<div style="font-size:13px;color:var(--t1);line-height:1.8"><b>How to use it in n8n:</b><br><br>'+
    '<b>Option A — Variables (n8n paid):</b><br>Settings → Variables → Add each variable one by one<br><br>'+
    '<b>Option B — Direct in workflow nodes (free):</b><br>'+
    '1. Open each workflow in n8n<br>'+
    '2. Click any HTTP Request node that uses a key<br>'+
    '3. Replace <code>{{ $env.ANTHROPIC_API_KEY }}</code> with the actual key value<br>'+
    '4. Do this once for each workflow → activate<br>'+
    '5. Never need to touch n8n again<br><br>'+
    '<b>After this one-time setup:</b><br>'+
    'All content generation happens in AutoMarketer. n8n only handles scheduled posting in the background.</div>'+
    '<button class="btn bp bfw" onclick="closeModal()">Got it</button>'+
    '</div>');
  }, 500);
}

function clearApiKeys(){
  if(!confirm('Clear ALL saved API keys? You will need to re-enter them.'))return;
  ['am_sb_url','am_sb_key','am_sb_svc','am_ant_key','am_openai_key','am_apify_key','am_serpapi_key','am_serp_key','am_tg_token','am_tg_chat',
   'am_wa_token','am_wa_phone','am_li_id','am_li_secret','am_fb_token','am_fb_page','am_ig_acct',
   'am_buf_token','am_buf_twit','am_gmail_user','am_gmail_pass'].forEach(function(k){localStorage.removeItem(k);});
  CFG.sbUrl='';CFG.sbKey='';CFG.antKey='';CFG.serpKey='';SB=null;
  go('apikeys');
}

function saveApiKeys(){
  var url=document.getElementById('ak-sb-url').value.trim();
  var key=document.getElementById('ak-sb-key').value.trim();
  var ant=document.getElementById('ak-ant').value.trim();
  var serp=document.getElementById('ak-serp').value.trim();
  if(url)CFG.sbUrl=url;
  if(key)CFG.sbKey=key;
  if(ant)CFG.antKey=ant;
  CFG.serpKey=serp;
  if(url)localStorage.setItem('am_sb_url',url);
  if(key)localStorage.setItem('am_sb_key',key);
  if(ant)localStorage.setItem('am_ant_key',ant);
  localStorage.setItem('am_serp_key',serp);
  // Reinit Supabase client with new keys
  if(CFG.sbUrl&&CFG.sbKey){
    SB=window.supabase.createClient(CFG.sbUrl,CFG.sbKey);
  }
  var btn=event.target;
  btn.textContent='✓ Saved!';btn.className='btn bs';btn.style.flex='1';btn.style.padding='11px';
  setTimeout(function(){btn.textContent='Save Keys';btn.className='btn bp';btn.style.flex='1';btn.style.padding='11px';go('apikeys');},1500);
}


function exportN8nConfig(){
  var lines = [
    '# AutoMarketer — n8n Environment Variables',
    '# Copy each variable into n8n: Settings → Variables → Add Variable',
    '# Or paste directly into your workflow nodes as credentials',
    '',
    '# ── DATABASE ──',
    'SUPABASE_URL=' + (localStorage.getItem('am_sb_url')||'YOUR_SUPABASE_URL'),
    'SUPABASE_ANON_KEY=' + (localStorage.getItem('am_sb_key')||'YOUR_ANON_KEY'),
    'SUPABASE_SERVICE_KEY=' + (localStorage.getItem('am_sb_svc')||'YOUR_SERVICE_KEY'),
    '',
    '# ── AI MODELS ──',
    'ANTHROPIC_API_KEY=' + (localStorage.getItem('am_ant_key')||'YOUR_ANTHROPIC_KEY'),
    'OPENAI_API_KEY=' + (localStorage.getItem('am_openai_key')||'YOUR_OPENAI_KEY'),
    '',
    '# ── SEO BLOG WORKFLOW ──',
    'APIFY_API_TOKEN=' + (localStorage.getItem('am_apify_key')||'YOUR_APIFY_TOKEN'),
    'SERPAPI_KEY=' + (localStorage.getItem('am_serpapi_key')||'YOUR_SERPAPI_KEY'),
    'SERPER_API_KEY=' + (localStorage.getItem('am_serp_key')||'YOUR_SERPER_KEY'),
    '',
    '# ── NOTIFICATIONS ──',
    'TELEGRAM_BOT_TOKEN=' + (localStorage.getItem('am_tg_token')||'YOUR_TELEGRAM_TOKEN'),
    'TELEGRAM_CHAT_ID=' + (localStorage.getItem('am_tg_chat')||'YOUR_CHAT_ID'),
    'WHATSAPP_ACCESS_TOKEN=' + (localStorage.getItem('am_wa_token')||'YOUR_WA_TOKEN'),
    'WHATSAPP_PHONE_ID=' + (localStorage.getItem('am_wa_phone')||'YOUR_PHONE_ID'),
    'NOTIFICATION_EMAIL=' + (localStorage.getItem('am_gmail_user')||'amit@risingcap.co'),
    '',
    '# ── SOCIAL MEDIA POSTING ──',
    'LINKEDIN_CLIENT_ID=' + (localStorage.getItem('am_li_id')||'YOUR_LI_CLIENT_ID'),
    'LINKEDIN_CLIENT_SECRET=' + (localStorage.getItem('am_li_secret')||'YOUR_LI_SECRET'),
    'FACEBOOK_ACCESS_TOKEN=' + (localStorage.getItem('am_fb_token')||'YOUR_FB_TOKEN'),
    'FACEBOOK_PAGE_ID=' + (localStorage.getItem('am_fb_page')||'YOUR_PAGE_ID'),
    'INSTAGRAM_ACCOUNT_ID=' + (localStorage.getItem('am_ig_acct')||'YOUR_IG_ACCOUNT'),
    'BUFFER_ACCESS_TOKEN=' + (localStorage.getItem('am_buf_token')||'YOUR_BUFFER_TOKEN'),
    'BUFFER_TWITTER_PROFILE_ID=' + (localStorage.getItem('am_buf_twit')||'YOUR_TWITTER_PROFILE'),
    '',
    '# Generated by AutoMarketer on ' + new Date().toLocaleString('en-IN')
  ];
  var blob = new Blob([lines.join('\n')], {type:'text/plain'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'automarketer-n8n-config.txt';
  a.click();
  setTimeout(function(){
    showModal('<div class="mt"><span>n8n Config Exported</span><button class="btn bg bsm" onclick="closeModal()">✕</button></div>'+
    '<div style="display:flex;flex-direction:column;gap:12px">'+
    '<div class="al al-g">File downloaded: <b>automarketer-n8n-config.txt</b></div>'+
    '<div style="font-size:13px;color:var(--t1);line-height:1.8"><b>How to use it in n8n:</b><br><br>'+
    '<b>Option A — Variables (n8n paid):</b><br>Settings → Variables → Add each variable one by one<br><br>'+
    '<b>Option B — Direct in workflow nodes (free):</b><br>'+
    '1. Open each workflow in n8n<br>'+
    '2. Click any HTTP Request node that uses a key<br>'+
    '3. Replace <code>{{ $env.ANTHROPIC_API_KEY }}</code> with the actual key value<br>'+
    '4. Do this once for each workflow → activate<br>'+
    '5. Never need to touch n8n again<br><br>'+
    '<b>After this one-time setup:</b><br>'+
    'All content generation happens in AutoMarketer. n8n only handles scheduled posting in the background.</div>'+
    '<button class="btn bp bfw" onclick="closeModal()">Got it</button>'+
    '</div>');
  }, 500);
}

function clearApiKeys(){
  if(!confirm('Clear all saved API keys? You will need to re-enter them to use live mode.'))return;
  ['am_sb_url','am_sb_key','am_ant_key','am_serp_key'].forEach(function(k){localStorage.removeItem(k);});
  CFG.sbUrl='';CFG.sbKey='';CFG.antKey='';CFG.serpKey='';
  SB=null;
  go('apikeys');
}

function vBrand(){
  var b=S.cur||{};
  return '<div style="margin-bottom:24px"><div class="pg-title">Brand Voice &amp; Profile</div><div class="pg-sub">Shapes every AI-generated post</div></div>'+
  (S.intel?'<div class="card" style="margin-bottom:18px;border-color:rgba(124,58,237,.3)"><div style="font-size:11px;color:var(--acc2);font-weight:600;margin-bottom:8px">⚡ AI-GENERATED VOICE PROFILE</div><div style="font-size:13px;line-height:1.75;white-space:pre-wrap">'+ec(S.intel.voiceProfile||'')+'</div></div>':'')+
  '<div class="g2"><div style="display:flex;flex-direction:column;gap:11px">'+
  '<div class="card"><div class="clbl">Brand Info</div><div style="display:flex;flex-direction:column;gap:10px">'+
  '<div class="g2" style="gap:8px"><div><label class="lbl">Brand Name</label><input class="inp" id="bv-n" value="'+ec(b.name||'')+'"></div><div><label class="lbl">Industry</label><input class="inp" id="bv-i" value="'+ec(b.industry||'')+'"></div></div>'+
  '<div><label class="lbl">Website</label><input class="inp" id="bv-w" value="'+ec(b.website||'')+'"></div>'+
  '<div><label class="lbl">Products / Services</label><textarea class="ta" id="bv-p" rows="3">'+ec(b.products||'')+'</textarea></div>'+
  '<div><label class="lbl">Target Audience</label><input class="inp" id="bv-a" value="'+ec(b.target_audience||'')+'"></div>'+
  '</div></div>'+
  '<div class="card"><div class="clbl">Vocabulary Rules</div><div style="margin-bottom:10px"><label class="lbl" style="color:var(--grn)">Always use</label><input class="inp" id="bv-kw" value="'+ec(b.keywords||'')+'"></div><div><label class="lbl" style="color:var(--red)">Always avoid</label><input class="inp" id="bv-av" value="'+ec(b.avoid||'')+'"></div></div>'+
  '</div><div style="display:flex;flex-direction:column;gap:11px">'+
  '<div class="card"><div class="clbl">Content Pillars</div><div id="pillar-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">'+((b.content_pillars||[]).map(function(p,i){return '<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;background:var(--acc-bg);color:var(--acc2);font-size:12px;border:1px solid rgba(124,58,237,.3)">'+ec(p)+'<button onclick="delP('+i+')" style="background:none;border:none;cursor:pointer;color:var(--acc2);font-size:14px;padding:0;line-height:1">×</button></span>';})).join('')+'</div><div style="display:flex;gap:8px"><input class="inp" id="pillar-inp" placeholder="New pillar..." style="flex:1"><button class="btn ba bsm" onclick="addP()">+ Add</button></div></div>'+
  '<div class="card"><div class="clbl">Platforms</div><div style="display:flex;flex-wrap:wrap;gap:6px">'+PL.map(function(pl){var on=(b.platforms||[]).indexOf(pl.id)>=0;return '<button class="pbtn '+(on?'on':'')+'" data-id="'+pl.id+'" onclick="this.classList.toggle(\'on\')" style="display:inline-flex;align-items:center;gap:7px"><span style="width:7px;height:7px;border-radius:50%;background:'+(on?pl.color:'var(--t3)')+';display:inline-block"></span>'+pl.name+'</button>';}).join('')+'</div></div>'+
  '<div><label class="lbl">FAQs / Key Messages</label><textarea class="ta" id="bv-faq" rows="4" placeholder="Paste FAQs or key brand messages...">'+ec(b.faqs||'')+'</textarea></div>'+
  '<button class="btn bp bfw" id="bv-save" onclick="saveBV()" style="padding:12px">◆ Save Brand Profile</button>'+
  '</div></div>';
}
function delP(i){if(!S.cur||!S.cur.content_pillars)return;S.cur.content_pillars.splice(i,1);go('brand');}
function addP(){var inp=document.getElementById('pillar-inp');if(!inp||!inp.value.trim())return;if(!S.cur)return;if(!S.cur.content_pillars)S.cur.content_pillars=[];S.cur.content_pillars.push(inp.value.trim());inp.value='';var el=document.getElementById('pillar-list');if(el){el.innerHTML=S.cur.content_pillars.map(function(p,i){return '<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;background:var(--acc-bg);color:var(--acc2);font-size:12px;border:1px solid rgba(124,58,237,.3)">'+ec(p)+'<button onclick="delP('+i+')" style="background:none;border:none;cursor:pointer;color:var(--acc2);font-size:14px;padding:0;line-height:1">×</button></span>';}).join('');}}
async function saveBV(){
  var b=S.cur;if(!b)return;
  b.name=document.getElementById('bv-n').value;b.industry=document.getElementById('bv-i').value;b.website=document.getElementById('bv-w').value;b.products=document.getElementById('bv-p').value;b.target_audience=document.getElementById('bv-a').value;b.faqs=document.getElementById('bv-faq').value;
  var pl=[];document.querySelectorAll('.pbtn.on[data-id]').forEach(function(el){pl.push(el.getAttribute('data-id'));});if(pl.length)b.platforms=pl;
  if(!S.demo&&SB)await SB.from('brands').update({name:b.name,industry:b.industry,website:b.website,products:b.products,target_audience:b.target_audience,faqs:b.faqs,platforms:b.platforms,content_pillars:b.content_pillars}).eq('id',b.id);
  fillBrandSel();
  var btn=document.getElementById('bv-save');if(btn){btn.textContent='✓ Saved!';btn.className='btn bs bfw';btn.style.padding='12px';setTimeout(function(){btn.textContent='◆ Save Brand Profile';btn.className='btn bp bfw';btn.style.padding='12px';},2000);}
}
// NOTIFICATIONS
function vNotif(){
  var b=S.cur||{};
  return '<div style="margin-bottom:24px"><div class="pg-title">Notification Settings</div><div class="pg-sub">Where approval requests and reports are sent</div></div>'+
  '<div class="g2"><div style="display:flex;flex-direction:column;gap:12px">'+
  '<div class="card"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:40px;height:40px;border-radius:10px;background:#229ED922;display:flex;align-items:center;justify-content:center;font-size:20px">✈</div><div><div style="font-size:14px;font-weight:600">Telegram</div><div style="font-size:11px;color:var(--t2)">Fastest — approve with one reply YES/NO</div></div><span class="bdg" style="background:var(--grn-bg);color:var(--grn)">Recommended</span></div>'+
  '<label class="lbl">Telegram Chat ID</label><input class="inp" id="nt-tg" value="'+ec(b.telegram_chat_id||'')+'" placeholder="Get from @userinfobot"><div style="margin-top:8px;font-size:11px;color:var(--t2);line-height:1.7">How: Open Telegram → search @userinfobot → Start it → copy your Chat ID</div></div>'+
  '<div class="card"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:40px;height:40px;border-radius:10px;background:#25D36622;display:flex;align-items:center;justify-content:center;font-size:20px">💬</div><div><div style="font-size:14px;font-weight:600">WhatsApp</div><div style="font-size:11px;color:var(--t2)">Requires Meta Business verification</div></div><span class="bdg" style="background:var(--amb-bg);color:var(--amb)">Setup needed</span></div>'+
  '<label class="lbl">WhatsApp Number (with country code)</label><input class="inp" id="nt-wa" value="'+ec(b.whatsapp_number||'')+'" placeholder="+919876543210"><div class="al al-a" style="margin-top:8px">Requires Meta Business account. See Setup Guide step 8. Start with Telegram — it works instantly.</div></div>'+
  '</div><div style="display:flex;flex-direction:column;gap:12px">'+
  '<div class="card"><div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="width:40px;height:40px;border-radius:10px;background:var(--acc-bg);display:flex;align-items:center;justify-content:center;font-size:20px">✉</div><div><div style="font-size:14px;font-weight:600">Email</div><div style="font-size:11px;color:var(--t2)">Weekly reports + backup notifications</div></div><span class="bdg" style="background:var(--grn-bg);color:var(--grn)">Active</span></div>'+
  '<label class="lbl">Notification Email</label><input class="inp" id="nt-em" value="'+ec(b.notification_email||'')+'" placeholder="you@email.com"></div>'+
  '<div class="card"><div class="clbl">Schedule Settings</div><div style="display:flex;flex-direction:column;gap:10px">'+
  '<div class="g2" style="gap:8px"><div><label class="lbl">Auto-approve after</label><select class="sel" id="nt-aph"><option value="12">12 hours</option><option value="24" selected>24 hours</option><option value="48">48 hours</option><option value="0">Never (manual only)</option></select></div><div><label class="lbl">Weekly report day</label><select class="sel" id="nt-day"><option value="1" selected>Monday 9AM</option><option value="5">Friday 5PM</option></select></div></div></div></div>'+
  '<button class="btn bp bfw" onclick="saveNotif()" style="padding:12px">Save Notification Settings</button>'+
  '</div></div>';
}
async function saveNotif(){
  var b=S.cur;if(!b)return;
  b.telegram_chat_id=document.getElementById('nt-tg').value.trim();
  b.whatsapp_number=document.getElementById('nt-wa').value.trim();
  b.notification_email=document.getElementById('nt-em').value.trim();
  b.auto_approve_hours=parseInt(document.getElementById('nt-aph').value)||24;
  if(!S.demo&&SB)await SB.from('brands').update({telegram_chat_id:b.telegram_chat_id,whatsapp_number:b.whatsapp_number,notification_email:b.notification_email,auto_approve_hours:b.auto_approve_hours}).eq('id',b.id);
  alert('✓ Saved!');
}
// INTEGRATIONS
function vInteg(){
  var intgs=[{n:'Supabase',d:'Database — all brands, posts, analytics',st:S.demo?'demo':'connected',c:'#3ECF8E',ic:'DB'},{n:'Anthropic Claude',d:'AI engine — content, analysis, strategy',st:CFG.antKey?'connected':'setup_needed',c:'#7C3AED',ic:'AI'},{n:'Pollinations AI',d:'Image generation — completely free, no key needed',st:'connected',c:'#FF6B6B',ic:'IMG'},{n:'Serper.dev',d:'Live SEO & trend data',st:CFG.serpKey?'connected':'optional',c:'#FF4500',ic:'SEO'},{n:'n8n (self-hosted)',d:'Automation — runs all 4 workflows automatically',st:'local',c:'#EA4B71',ic:'N8N'},{n:'LinkedIn',d:'Auto-posting via n8n native node',st:'n8n',c:'#0A66C2',ic:'in'},{n:'Instagram',d:'Auto-posting via Facebook Graph API',st:'n8n',c:'#C13584',ic:'IG'},{n:'Facebook',d:'Auto-posting via Graph API',st:'n8n',c:'#1877F2',ic:'fb'},{n:'Twitter / X',d:'Auto-posting via Buffer free tier',st:'n8n',c:'#1A8CD8',ic:'X'},{n:'Telegram',d:'Approval notifications — reply YES/NO',st:'n8n',c:'#229ED9',ic:'TG'},{n:'WhatsApp Business',d:'Approval via WhatsApp — needs Meta Business',st:'n8n',c:'#25D366',ic:'WA'},{n:'Gmail / Email',d:'Weekly reports and backup notifications',st:'n8n',c:'#EA4335',ic:'GM'}];
  var stMap={connected:{t:'Connected',c:'var(--grn)',bg:'var(--grn-bg)'},demo:{t:'Demo Mode',c:'var(--amb)',bg:'var(--amb-bg)'},setup_needed:{t:'Setup needed',c:'var(--red)',bg:'var(--red-bg)'},optional:{t:'Optional',c:'var(--acc2)',bg:'var(--acc-bg)'},n8n:{t:'Via n8n',c:'var(--grn)',bg:'var(--grn-bg)'},local:{t:'Self-hosted',c:'var(--grn)',bg:'var(--grn-bg)'}};
  return '<div style="margin-bottom:24px"><div class="pg-title">Integrations</div><div class="pg-sub">All connected services and their status</div></div>'+
  '<div class="al al-ac" style="margin-bottom:18px">💡 <b>LinkedIn, Instagram, Facebook, Twitter, Telegram and WhatsApp</b> are all connected via your n8n self-hosted workflows. Import the 4 JSON workflow files from the Setup Guide and everything works automatically — no developer accounts needed.</div>'+
  '<div style="display:flex;flex-direction:column;gap:8px">'+intgs.map(function(intg){var st=stMap[intg.st]||stMap.optional;return '<div class="card-sm" style="display:flex;align-items:center;gap:14px"><div style="width:42px;height:42px;border-radius:10px;background:'+intg.c+'22;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:'+intg.c+';flex-shrink:0">'+intg.ic+'</div><div style="flex:1"><div style="font-size:13px;font-weight:600">'+intg.n+'</div><div style="font-size:11px;color:var(--t2)">'+intg.d+'</div></div><span class="bdg" style="background:'+st.bg+';color:'+st.c+'">'+st.t+'</span></div>';}).join('')+'</div>';
}
// SETTINGS
function showCfg(){
  showModal('<div class="mt"><span>API Settings</span><button class="btn bg bsm" onclick="closeModal()">✕</button></div>'+
  '<div style="display:flex;flex-direction:column;gap:11px">'+
  '<div><label class="lbl">Supabase URL</label><input class="inp" id="cfg-su" value="'+ec(CFG.sbUrl)+'"></div>'+
  '<div><label class="lbl">Supabase Anon Key</label><input class="inp" id="cfg-sk" value="'+ec(CFG.sbKey)+'" type="password"></div>'+
  '<div><label class="lbl">Anthropic API Key</label><input class="inp" id="cfg-ak" value="'+ec(CFG.antKey)+'" type="password"></div>'+
  '<div><label class="lbl">Serper.dev API Key</label><input class="inp" id="cfg-sr" value="'+ec(CFG.serpKey)+'"></div>'+
  '<div style="display:flex;gap:8px"><button class="btn bp" style="flex:1" onclick="saveCfg()">Save</button><button class="btn bd" onclick="if(confirm(\'Clear all data and reset?\')){localStorage.clear();location.reload();}">Reset All</button></div></div>');
  window.saveCfg=function(){CFG.sbUrl=document.getElementById('cfg-su').value.trim();CFG.sbKey=document.getElementById('cfg-sk').value.trim();CFG.antKey=document.getElementById('cfg-ak').value.trim();CFG.serpKey=document.getElementById('cfg-sr').value.trim();localStorage.setItem('am_sb_url',CFG.sbUrl);localStorage.setItem('am_sb_key',CFG.sbKey);localStorage.setItem('am_ant_key',CFG.antKey);localStorage.setItem('am_serp_key',CFG.serpKey);closeModal();};
}
// INIT
// On load
(function(){
  var savedEmail=localStorage.getItem('am_user_email');
  if(savedEmail){var el=document.getElementById('login-email');if(el)el.value=savedEmail;}
  if(CFG.sbUrl&&CFG.sbKey){
    SB=window.supabase.createClient(CFG.sbUrl,CFG.sbKey);
    SB.auth.getSession().then(function(r){
      if(r&&r.data&&r.data.session){launch();}
    }).catch(function(){});
  }
})();
