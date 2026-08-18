// AutoMarketer — Core: Config, Utils, Navigation, Router


var CFG={
  sbUrl:   localStorage.getItem('am_sb_url')||'',
  sbKey:   localStorage.getItem('am_sb_key')||'',
  antKey:  localStorage.getItem('am_ant_key')||'',
  serpKey: localStorage.getItem('am_serp_key')||''
};
var SB=null;
var S={view:'dashboard',sbc:false,brands:[],cur:null,posts:[],approval:[],intel:null,reports:[],charts:{},demo:false};
var PCOL={instagram:'#E1306C',linkedin:'#0A66C2',twitter:'#1DA1F2',facebook:'#1877F2',tiktok:'#69C9D0',youtube:'#FF0000'};
var PL=[{id:'instagram',name:'Instagram',color:'#E1306C',abbr:'IG'},{id:'linkedin',name:'LinkedIn',color:'#0A66C2',abbr:'in'},{id:'twitter',name:'Twitter / X',color:'#1DA1F2',abbr:'X'},{id:'facebook',name:'Facebook',color:'#1877F2',abbr:'fb'},{id:'tiktok',name:'TikTok',color:'#2FD6E0',abbr:'TT'},{id:'youtube',name:'YouTube',color:'#FF4444',abbr:'YT'}];
var NAV=[
  {g:'Overview',items:[{id:'dashboard',label:'Dashboard',i:'◉'},{id:'brands',label:'All Brands',i:'◈'}]},
  {g:'Automation',items:[{id:'pipeline',label:'Intelligence Pipeline',i:'⚡'},{id:'generate',label:'Auto Generate',i:'✦'}]},
  {g:'Content',items:[{id:'approval',label:'Approval Queue',i:'✓',b:'approval'},{id:'calendar',label:'Calendar',i:'▦'},{id:'posts',label:'All Posts',i:'◻'}]},
  {g:'Analytics',items:[{id:'analytics',label:'Analytics',i:'◈'},{id:'reports',label:'Weekly Reports',i:'📊'},{id:'competitor',label:'Competitors',i:'🔍'},{id:'hashtag',label:'Hashtags',i:'#'},{id:'sentiment',label:'Sentiment',i:'◎'}]},
  {g:'AI Agents',items:[{id:'seoblog',label:'SEO Blog (Claude)',i:'✍'},{id:'seoblog_n8n',label:'SEO Blog (n8n)',i:'⚙'},{id:'bloglibrary',label:'Blog Library',i:'◻'}]},{g:'Automation',items:[{id:'workflows',label:'Workflows',i:'⚡'}]},{g:'Settings',items:[{id:'brand',label:'Brand Voice',i:'◆'},{id:'notifications',label:'Notifications',i:'🔔'},{id:'integrations',label:'Integrations',i:'⚙'},{id:'apikeys',label:'API Keys',i:'⚿'}]}
];

function stBdgCls(st){
  var m={published:'background:#00B894',pending_approval:'background:#D4A017',approved:'background:#6C5CE7',auto_approved:'background:#0984E3',rejected:'background:#E17055',draft:'background:#555570',scheduled:'background:#00B894'};
  return m[st]||'background:#555570';
}
function stBdgHtml(st){
  return '<span class="bdg" style="'+stBdgCls(st)+'">'+ec(st||'')+'</span>';
}
function pb(pl){
  var MAP={
    instagram:{bg:'#C13584',label:'Instagram'},
    linkedin:{bg:'#0A66C2',label:'LinkedIn'},
    twitter:{bg:'#1A8CD8',label:'Twitter / X'},
    facebook:{bg:'#1877F2',label:'Facebook'},
    tiktok:{bg:'#2FD6E0',label:'TikTok'},
    youtube:{bg:'#CC0000',label:'YouTube'},
  };
  var m=MAP[pl]||{bg:'#6C5CE7',label:(pl||'?')};
  return '<span class="pchip" style="background:'+m.bg+'"><span class="pc-dot"></span>'+ec(m.label)+'</span>';
}

function ec(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function td(){return new Date().toISOString().split('T')[0];}
function fN(n){return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n||0);}
function fD(d){if(!d)return '';try{return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short'});}catch(e){return d;}}
function isOv(d){return d&&new Date(d)<new Date();}
// API
async function ai(prompt,sys,maxT){
  if(!CFG.antKey)throw new Error('No API key. Go to Settings.');
  var r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':CFG.antKey.trim(),'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:maxT||1000,messages:[{role:'user',content:prompt}],...(sys?{system:sys}:{})})});
  var d=await r.json();
  if(d.error)throw new Error(d.error.message);
  return d.content[0].text;
}
// Setup
// ── Auth ──────────────────────────────────────────────
function showLogin(){
  document.getElementById('login-box').parentElement.style.display='block';
  document.getElementById('signup-box').style.display='none';
  document.getElementById('login-box').parentElement.style.display='';
  var lb=document.querySelector('#setup-screen > div:first-child');
  if(lb){lb.style.display='block';}
  var sb=document.getElementById('signup-box');
  if(sb)sb.style.display='none';
}
function showSignup(){
  var lb=document.querySelector('#setup-screen > div:first-child');
  if(lb)lb.style.display='none';
  var sb=document.getElementById('signup-box');
  if(sb)sb.style.display='block';
}
async function doLogin(){
  var email=document.getElementById('login-email').value.trim();
  var pass=document.getElementById('login-pass').value;
  var err=document.getElementById('login-err');
  err.style.color='var(--red)';
  if(!email||!pass){err.textContent='Enter your email and password.';return;}
  err.style.color='var(--t2)';err.textContent='Signing in...';
  try{
    if(!SB)SB=window.supabase.createClient(CFG.sbUrl,CFG.sbKey);
    var {data,error}=await SB.auth.signInWithPassword({email:email,password:pass});
    if(error)throw new Error(error.message);
    localStorage.setItem('am_user_email',email);
    launch();
  }catch(e){
    // Fallback: check local credentials
    var lp=localStorage.getItem('am_lp');
    if(localStorage.getItem('am_le')===email&&lp===btoa(pass)){launch();return;}
    err.style.color='var(--red)';err.textContent='Incorrect email or password.';
  }
}
async function doSignup(){
  var fname=document.getElementById('su-fname').value.trim();
  var agency=document.getElementById('su-agency').value.trim();
  var email=document.getElementById('su-email').value.trim();
  var pass=document.getElementById('su-pass').value;
  var err=document.getElementById('su-err');
  if(!email||!pass){err.style.color='var(--red)';err.textContent='Email and password required.';return;}
  if(pass.length<8){err.style.color='var(--red)';err.textContent='Password must be at least 8 characters.';return;}
  err.style.color='var(--t2)';err.textContent='Creating account...';
  try{
    if(!SB)SB=window.supabase.createClient(CFG.sbUrl,CFG.sbKey);
    var {data,error}=await SB.auth.signUp({email:email,password:pass,options:{data:{full_name:fname,agency_name:agency}}});
    if(error)throw new Error(error.message);
    localStorage.setItem('am_le',email);localStorage.setItem('am_lp',btoa(pass));
    localStorage.setItem('am_user_email',email);
    err.style.color='var(--grn2)';err.textContent='Account created! Signing you in...';
    setTimeout(function(){launch();},1000);
  }catch(e){
    // Save locally if Supabase auth unavailable
    localStorage.setItem('am_le',email);localStorage.setItem('am_lp',btoa(pass));
    localStorage.setItem('am_user_email',email);
    err.style.color='var(--grn2)';err.textContent='Account created. Signing you in...';
    setTimeout(function(){launch();},800);
  }
}
function connectDB(){launch();}
function showConfig(){}
function saveConfig(){}
function launchDemo(){
  S.demo=true;
  var now=new Date();
  S.brands=[
    {id:'w1',name:'Waisabi',website:'https://waisabi.com',industry:'Food & Beverage',platforms:['instagram','linkedin','twitter','facebook'],is_active:true,notification_email:'hello@waisabi.com',telegram_chat_id:'123456789',content_pillars:['Signature Dishes','Chef Stories','Food Culture','Events','Sustainability']},
    {id:'x1',name:'XLNC AI',website:'https://xlnc.ai',industry:'Enterprise AI',platforms:['linkedin','twitter','instagram'],is_active:true,notification_email:'hello@xlnc.ai',telegram_chat_id:'987654321',content_pillars:['AI Agents','Product Updates','Thought Leadership','Customer Success','Industry Insights']}
  ];
  S.posts=[
    {id:'p1',brand_id:'w1',platform:'instagram',content:'Sushi night done right. Our chef\'s special rolls are back this weekend only. Reserve your table before they\'re gone!\n\n#Waisabi #SushiNight',hashtags:['Waisabi','SushiNight'],image_url:'https://image.pollinations.ai/prompt/professional%20sushi%20platter%20dark%20moody%20restaurant%20cinematic?width=600&height=600&nologo=true&seed=1',status:'published',likes:342,comments:28,reach:4200,engagement_rate:4.8,scheduled_at:new Date(now-2*86400000).toISOString(),content_pillar:'Signature Dishes',author:'AutoMarketer AI'},
    {id:'p2',brand_id:'w1',platform:'linkedin',content:'3 lessons from running a Japanese restaurant in India for 5 years:\n\n1/ Authenticity is non-negotiable. People can tell.\n2/ The team is the product. Train them like it.\n3/ Consistency beats viral every single time.',hashtags:['Restaurant','Entrepreneurship'],image_url:'',status:'published',likes:89,comments:34,reach:2800,engagement_rate:5.2,scheduled_at:new Date(now-1*86400000).toISOString(),content_pillar:'Chef Stories',author:'AutoMarketer AI'},
    {id:'p3',brand_id:'w1',platform:'twitter',content:'Hot take: The best sushi in Delhi is not in any 5-star hotel.\n\nIt\'s at Waisabi, Vasant Kunj.\n\nFight me. 🍣',hashtags:['Delhi','Sushi'],image_url:'',status:'pending_approval',approval_deadline:new Date(now+8*3600000).toISOString(),scheduled_at:new Date(now+86400000).toISOString(),content_pillar:'Brand',author:'AutoMarketer AI'},
    {id:'p4',brand_id:'w1',platform:'instagram',content:'Our signature Wagyu Beef Ramen. 12-hour slow cooked broth. Available daily from 6PM.\n\n#Waisabi #Ramen #WagyuBeef',hashtags:['Waisabi','Ramen','WagyuBeef'],image_url:'https://image.pollinations.ai/prompt/wagyu%20beef%20ramen%20bowl%20steam%20dark%20background?width=600&height=600&nologo=true&seed=2',status:'pending_approval',approval_deadline:new Date(now+14*3600000).toISOString(),scheduled_at:new Date(now+2*86400000).toISOString(),content_pillar:'Signature Dishes',author:'AutoMarketer AI'},
    {id:'p5',brand_id:'w1',platform:'facebook',content:'Weekend brunch is here! Saturday & Sunday 11AM-3PM. Special menu, bottomless matcha, live jazz.\n\nBook: waisabi.com/brunch',hashtags:['WaisabiBrunch','DelhiBrunch'],image_url:'',status:'approved',scheduled_at:new Date(now+3*86400000).toISOString(),content_pillar:'Events',author:'AutoMarketer AI'},
    {id:'p6',brand_id:'x1',platform:'linkedin',content:'AI agents are changing enterprise workflows faster than most realize.\n\nHere is what forward-thinking companies are doing right now:\n\n• Automating repetitive content tasks\n• Using AI for competitive research\n• Building self-improving marketing systems\n\nHappy to share our approach.',hashtags:['AIAgents','Enterprise','Automation'],image_url:'',status:'pending_approval',approval_deadline:new Date(now+6*3600000).toISOString(),scheduled_at:new Date(now+86400000).toISOString(),content_pillar:'Thought Leadership',author:'AutoMarketer AI'},
  ];
  S.approval=S.posts.filter(function(p){return p.status==='pending_approval'||p.status==='approved';});
  S.intel={voiceProfile:'Warm, authentic, food-forward. Celebrates Japanese culture with an Indian heart. Sensory language. Avoids pretension.',keywords:['Waisabi Delhi','Japanese restaurant Delhi','sushi Delhi','ramen Delhi'],hashtagBanks:{brand:['Waisabi','WaisabiDelhi'],industry:['DelhiFood','FoodieDelhi'],daily_set:'#Waisabi #WaisabiDelhi #DelhiFood #SushiLovers #JapaneseFood #FoodieDelhi #RestaurantDelhi'},competitorAnalysis:'Competitors focus on premium pricing messaging. Gap: authentic chef storytelling and behind-the-scenes content.',completedAt:new Date().toISOString()};
  S.reports=[{id:'r1',week_start:'2025-05-12',week_end:'2025-05-18',report_text:'Strong week! 14 posts published across 4 platforms. Your LinkedIn post about restaurant lessons got the best engagement at 5.2% — double your average. Instagram reels outperformed static posts 3x this week. Recommendation: post more behind-the-scenes content and fewer promotional posts next week. Consider reducing Facebook to 2x/week — it is your lowest-performing platform.',total_posts:14,avg_engagement:4.1,best_platform:'linkedin',sent_at:new Date(now-7*86400000).toISOString()}];
  launch();
}
function launch(){
  document.getElementById('setup-screen').classList.add('h');
  document.getElementById('shell').style.display='flex';
  loadBrands();
}
async function loadBrands(){
  if(!S.demo&&SB){
    try{
      var {data}=await SB.from('brands').select('*,brand_intelligence(*)').eq('is_active',true);
      S.brands=data||[];
      if(S.brands.length){S.cur=S.brands[0];S.intel=S.cur.brand_intelligence?.[0]||null;await loadPosts();}
    }catch(e){S.demo=true;launchDemo();return;}
  }
  S.cur=S.brands[0]||null;
  fillBrandSel();buildNav();go('dashboard');
}
async function loadPosts(){
  if(!S.cur||S.demo)return;
  try{
    var {data}=await SB.from('posts').select('*').eq('brand_id',S.cur.id).order('created_at',{ascending:false}).limit(100);
    S.posts=data||[];S.approval=S.posts.filter(function(p){return p.status==='pending_approval'||p.status==='approved';});
  }catch(e){}
}
function fillBrandSel(){
  var sel=document.getElementById('brand-sel');
  sel.innerHTML=S.brands.map(function(b){return '<option value="'+b.id+'">'+ec(b.name)+'</option>';}).join('');
  if(S.cur)sel.value=S.cur.id;
  document.getElementById('sb-sub').textContent=S.brands.length+' brand'+(S.brands.length!==1?'s':'');
  document.getElementById('bar-brand').textContent=S.cur?S.cur.name:'No brand';
  document.getElementById('bar-av').textContent=S.cur?(S.cur.name||'AM').substring(0,2).toUpperCase():'AM';
}
async function switchBrand(id){
  S.cur=S.brands.find(function(b){return b.id===id;})||S.brands[0];
  if(!S.demo&&SB)await loadPosts();
  else{S.approval=S.posts.filter(function(p){return p.brand_id===S.cur.id&&(p.status==='pending_approval'||p.status==='approved');});}
  document.getElementById('bar-brand').textContent=S.cur?S.cur.name:'';
  document.getElementById('bar-av').textContent=S.cur?(S.cur.name||'AM').substring(0,2).toUpperCase():'AM';
  buildNav();go(S.view);
}
// Modal
function showModal(html){document.getElementById('mbody').innerHTML=html;document.getElementById('mov').classList.remove('h');}
function closeModal(){document.getElementById('mov').classList.add('h');}
document.addEventListener('click',function(e){if(e.target.id==='mov')closeModal();});
// Nav
function buildNav(){
  var w=document.getElementById('nav'),html='';
  var pend=S.approval.filter(function(p){return p.status==='pending_approval'&&(!S.cur||p.brand_id===S.cur.id);}).length;
  NAV.forEach(function(g){
    html+='<div class="ng">'+(S.sbc?'·':g.g)+'</div>';
    g.items.forEach(function(n){
      var badge=n.b==='approval'&&pend>0?'<span class="ni-badge">'+pend+'</span>':'';
      html+='<button class="ni '+(S.view===n.id?'on':'')+'" onclick="go(\''+n.id+'\')"><span class="ni-ic">'+n.i+'</span>'+(S.sbc?'':'<span>'+n.label+'</span>'+badge)+'</button>';
    });
  });
  w.innerHTML=html;
  var bi=document.getElementById('bar-intel');
  if(bi)bi.innerHTML=S.intel?'<span class="bdg" style="background:var(--grn-bg);color:var(--grn)">● Intelligence Ready</span>':'<button class="btn bam bsm" onclick="go(\'pipeline\')">⚡ Run Pipeline</button>';
}
function go(id){
  S.view=id;Object.values(S.charts).forEach(function(c){try{c.destroy();}catch(e){}});S.charts={};
  buildNav();
  var all=NAV.flatMap(function(g){return g.items;});var cur=all.find(function(n){return n.id===id;});var grp=NAV.find(function(g){return g.items.some(function(i){return i.id===id;});});
  document.getElementById('bc').innerHTML=(grp?grp.g:'')+' &rsaquo; <span style="color:var(--t1);font-weight:600">'+(cur?cur.label:'')+'</span>';
  var vs={dashboard:vDash,brands:vBrands,pipeline:vPipeline,generate:vGenerate,approval:vApproval,calendar:vCalendar,posts:vPosts,analytics:vAnalytics,reports:vReports,competitor:vComp,hashtag:vHt,sentiment:vSent,brand:vBrand,notifications:vNotif,integrations:vInteg,apikeys:vApiKeys,seoblog:vSEOBlog,seoblog_n8n:vSEOBlogN8n,bloglibrary:vBlogLibrary,workflows:vWorkflows};
  document.getElementById('pg').innerHTML=(vs[id]||vDash)();
  if(id==='dashboard')iDash();if(id==='analytics')iAna();if(id==='competitor')iComp();
  if(id==='hashtag')autoHt();if(id==='sentiment')autoSent();
  document.getElementById('pg').scrollTop=0;
}
function toggleSB(){S.sbc=!S.sbc;var s=document.getElementById('sb');S.sbc?s.classList.add('col'):s.classList.remove('col');document.getElementById('logo-txt').style.display=S.sbc?'none':'block';buildNav();}
