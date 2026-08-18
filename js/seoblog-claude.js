// AutoMarketer — SEO Blog Writer (Claude version)


// ═══════════════════════════════════════════════════════
// SEO BLOG WRITER AGENT — full page + pipeline
// ═══════════════════════════════════════════════════════

var SEO_STATE = {
  running: false, result: null, originalContent: null,
  history: JSON.parse(localStorage.getItem('seo_blog_history')||'[]')
};

var SEO_STEPS = [
  {id:'crawl',    label:'Website Analysis',       desc:'Reading your website — products, services, tone'},
  {id:'research', label:'Competitor Research',     desc:'Analysing what competitors rank for'},
  {id:'keywords', label:'Keyword Research',        desc:'Finding top 10 SEO keywords for your business'},
  {id:'outline',  label:'Blog Outline',            desc:'Creating H2 structure, FAQ, TL;DR'},
  {id:'write',    label:'Writing Full Blog Post',  desc:'Writing a 1500+ word SEO article'},
  {id:'optimise', label:'SEO / AEO / GEO Polish',  desc:'Snippets, metadata, schema'},
  {id:'humanise', label:'Humanising Content',      desc:'Removing AI patterns — sounding human'},
  {id:'done',     label:'Complete',                desc:'Ready to publish'}
];

function vSEOBlog(){
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px">'+
  '<div><div class="pg-title">SEO Blog Writer Agent</div>'+
  '<div class="pg-sub">AI pipeline: Brief → Keyword Research → Full Blog Post → SEO Optimised → Humanised</div></div>'+
  '<button class="btn bg bsm" onclick="seoShowHistory()">History ('+SEO_STATE.history.length+')</button></div>'+
  '<div id="seo-wrap">'+seoFormHtml()+'</div>';
}

function seoFormHtml(){
  return '<div style="display:grid;grid-template-columns:1fr 360px;gap:16px;align-items:start">'+
  '<div class="card"><div class="clbl">Business Brief</div>'+
  '<div style="display:flex;flex-direction:column;gap:11px">'+
  '<div class="g2" style="gap:9px"><div><label class="lbl">Business Name *</label><input class="inp" id="seo-name" placeholder="e.g. WAISABI"></div>'+
  '<div><label class="lbl">Website URL *</label><input class="inp" id="seo-url" placeholder="https://yoursite.com"></div></div>'+
  '<div class="g2" style="gap:9px"><div><label class="lbl">Industry / Niche *</label><input class="inp" id="seo-niche" placeholder="e.g. AI Finance"></div>'+
  '<div><label class="lbl">Business Type *</label><select class="sel" id="seo-btype"><option>B2B (Business to Business)</option><option>B2C (Business to Consumer)</option><option>Both B2B and B2C</option><option>D2C (Direct to Consumer)</option></select></div></div>'+
  '<div><label class="lbl">Products / Services *</label><textarea class="ta" id="seo-services" rows="2" placeholder="Describe your main products or services..."></textarea></div>'+
  '<div><label class="lbl">Target Audience *</label><textarea class="ta" id="seo-audience" rows="2" placeholder="e.g. Investment bankers aged 30-50 looking for AI tools"></textarea></div>'+
  '<div><label class="lbl">Top 3 Competitors *</label><textarea class="ta" id="seo-competitors" rows="2" placeholder="e.g. rogo.ai, hebbia.com, v7labs.com"></textarea></div>'+
  '<div class="g2" style="gap:9px"><div><label class="lbl">Geographic Focus *</label><select class="sel" id="seo-geo"><option>International or Global</option><option>National</option><option>Local (City or Region)</option></select></div>'+
  '<div><label class="lbl">City / Region (if local)</label><input class="inp" id="seo-city" placeholder="e.g. Delhi, Singapore"></div></div>'+
  '<div class="g2" style="gap:9px"><div><label class="lbl">Brand Tone *</label><select class="sel" id="seo-tone"><option>Professional and Formal</option><option>Friendly and Conversational</option><option>Expert and Technical</option><option>Bold and Authoritative</option><option>Casual and Fun</option></select></div>'+
  '<div><label class="lbl">Target Keywords (optional)</label><input class="inp" id="seo-keywords" placeholder="e.g. investment banking AI"></div></div>'+
  '<div><label class="lbl">What Makes You Different (USP) *</label><textarea class="ta" id="seo-usp" rows="2" placeholder="What sets you apart from competitors?"></textarea></div>'+
  '<div><label class="lbl">Blog Topic (blank = AI picks best topic)</label><input class="inp" id="seo-topic" placeholder="e.g. How AI is changing investment banking in 2025"></div>'+
  '<button class="btn bp bfw" onclick="runSEOBlog()" id="seo-run-btn" style="padding:12px;font-size:13px">✍ Generate SEO Blog Post</button>'+
  '</div></div>'+
  '<div style="display:flex;flex-direction:column;gap:10px">'+
  '<div class="card"><div class="clbl">AI Pipeline — 7 Steps</div>'+
  SEO_STEPS.map(function(s,i){
    return '<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--b1)" id="seo-step-'+s.id+'">'+
    '<div style="width:28px;height:28px;border-radius:50%;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--t3);flex-shrink:0" id="seo-dot-'+s.id+'">'+(i+1)+'</div>'+
    '<div><div style="font-size:12px;color:var(--t2)">'+s.label+'</div><div style="font-size:10px;color:var(--t3)">'+s.desc+'</div></div></div>';
  }).join('')+'</div>'+
  '<div class="card" style="background:var(--c2)"><div class="clbl">Output Includes</div>'+
  '<div style="font-size:12px;color:var(--t2);line-height:1.85">'+
  '✓ 1,500–2,500 word blog post<br>✓ H1 / H2 / H3 structure<br>✓ TL;DR at the top<br>'+
  '✓ Featured snippet answer<br>✓ 5-question FAQ section<br>✓ 100% human-sounding<br>'+
  '✓ SEO metadata (title, desc, slug)<br>✓ Copy / Edit / Word / PDF download'+
  '</div></div>'+
  '<div class="card" style="background:var(--c2)"><div class="clbl">Keys Needed</div>'+
  '<div style="font-size:12px;line-height:1.85">'+
  (CFG.antKey?'<span style="color:var(--grn2)">✓</span>':'<span style="color:var(--red2)">✗</span>')+' Anthropic API Key<br>'+
  (localStorage.getItem('am_serp_key')?'<span style="color:var(--grn2)">✓</span>':'<span style="color:var(--t3)">○</span>')+' <span style="color:var(--t2)">Serper.dev (optional)</span><br>'+
  '<span style="color:var(--grn2)">✓</span> <span style="color:var(--t2)">Jina AI — free, no key needed</span>'+
  '</div></div></div></div>';
}

function seoSetStep(id,st,det){
  var dot=document.getElementById('seo-dot-'+id);
  var row=document.getElementById('seo-step-'+id);
  if(!dot||!row)return;
  var bg={wait:'var(--c3)',run:'var(--acc-bg)',done:'var(--grn-bg)',err:'var(--red-bg)'};
  var tc={wait:'var(--t3)',run:'var(--acc2)',done:'var(--grn2)',err:'var(--red2)'};
  dot.style.background=bg[st]||bg.wait;dot.style.color=tc[st]||tc.wait;
  if(st==='run')dot.innerHTML='<span class="spin" style="font-size:10px">⟳</span>';
  else if(st==='done')dot.innerHTML='✓';
  else if(st==='err')dot.innerHTML='✗';
  if(det){
    var ex=row.querySelector('.seo-det');
    if(!ex){ex=document.createElement('div');ex.className='seo-det';ex.style.cssText='font-size:10px;color:var(--grn2);margin-top:2px';row.querySelector('div:last-child').appendChild(ex);}
    ex.textContent=det;
  }
}

async function runSEOBlog(){
  if(!CFG.antKey){alert('Add your Anthropic API key in Settings → API Keys first.');go('apikeys');return;}
  var btn=document.getElementById('seo-run-btn');
  btn.disabled=true;btn.textContent='⟳ Generating...';
  var inp={
    name:document.getElementById('seo-name').value.trim(),
    url:document.getElementById('seo-url').value.trim(),
    niche:document.getElementById('seo-niche').value.trim(),
    btype:document.getElementById('seo-btype').value,
    services:document.getElementById('seo-services').value.trim(),
    audience:document.getElementById('seo-audience').value.trim(),
    competitors:document.getElementById('seo-competitors').value.trim(),
    geo:document.getElementById('seo-geo').value,
    city:document.getElementById('seo-city').value.trim(),
    tone:document.getElementById('seo-tone').value,
    keywords:document.getElementById('seo-keywords').value.trim(),
    usp:document.getElementById('seo-usp').value.trim(),
    topic:document.getElementById('seo-topic').value.trim()
  };
  if(!inp.name||!inp.niche||!inp.services){alert('Fill in Business Name, Industry and Services.');btn.disabled=false;btn.textContent='✍ Generate SEO Blog Post';return;}
  var profile='Business: '+inp.name+'\nWebsite: '+inp.url+'\nNiche: '+inp.niche+'\nType: '+inp.btype+'\nServices: '+inp.services+'\nAudience: '+inp.audience+'\nCompetitors: '+inp.competitors+'\nGeo: '+inp.geo+(inp.city?' — '+inp.city:'')+'\nTone: '+inp.tone+'\nKeywords: '+inp.keywords+'\nUSP: '+inp.usp+'\nTopic: '+inp.topic;
  try{
    seoSetStep('crawl','run');
    var webCtx='';
    if(inp.url){try{var wr=await fetch('https://r.jina.ai/'+inp.url,{headers:{'Accept':'text/plain'}});webCtx=(await wr.text()).slice(0,3000);seoSetStep('crawl','done','Read '+webCtx.length+' chars from website');}catch(e){webCtx='Brand: '+inp.name+'. '+inp.services;seoSetStep('crawl','done','Used manual details');}}
    else{webCtx='Business: '+inp.name+'. '+inp.services;seoSetStep('crawl','done','No URL — using manual details');}
    seoSetStep('research','run');
    var serpKey=localStorage.getItem('am_serp_key');
    var compData='Competitors listed: '+inp.competitors;
    if(serpKey){try{var sr=await fetch('https://google.serper.dev/search',{method:'POST',headers:{'X-API-KEY':serpKey,'Content-Type':'application/json'},body:JSON.stringify({q:inp.niche+' top blog articles',num:5})});var sd=await sr.json();compData=(sd.organic||[]).slice(0,5).map(function(r){return r.title+': '+r.snippet;}).join('\n');seoSetStep('research','done','Found '+(sd.organic||[]).length+' competitor articles');}catch(e){seoSetStep('research','done','Used manual competitor list');}}
    else{seoSetStep('research','done','No Serper key — used manual data');}
    seoSetStep('keywords','run');
    var kwRes=await ai('Senior SEO keyword researcher.\n\nBusiness:\n'+profile+'\n\nWebsite:\n'+webCtx.slice(0,400)+'\n\nCompetitors:\n'+compData+'\n\nFind BEST 10 keywords. Return ONLY valid JSON:\n{"top10Keywords":[{"keyword":"","intent":"","difficulty":"low|medium|high","reason":""}],"recommendedPrimaryKeyword":"","clusterGroups":{"group1":[],"group2":[]}}','Return only valid JSON. No backticks.',1200);
    var kwData;try{kwData=JSON.parse(kwRes.replace(/```json|```/g,'').trim());}catch(e){kwData={recommendedPrimaryKeyword:inp.niche,top10Keywords:[]};}
    var primaryKw=kwData.recommendedPrimaryKeyword||inp.niche;
    seoSetStep('keywords','done','Primary: '+primaryKw);
    seoSetStep('outline','run');
    var outRes=await ai('SEO blog outline architect.\n\nKeyword: '+primaryKw+'\nProfile:\n'+profile+'\n\nCreate outline. Return ONLY valid JSON:\n{"title":"","metaDescription":"","introduction":"","h2Sections":[{"heading":"","subPoints":[""]}],"faqSection":[{"question":"","answer":""}],"conclusion":"","estimatedWordCount":0}','Return only valid JSON.',1200);
    var outData;try{outData=JSON.parse(outRes.replace(/```json|```/g,'').trim());}catch(e){outData={title:'The Complete Guide to '+primaryKw,h2Sections:[],faqSection:[]};}
    seoSetStep('outline','done',outData.title||'Outline ready');
    seoSetStep('write','run');
    var draft=await ai('Professional SEO blog writer.\n\nTitle: '+outData.title+'\nOutline: '+JSON.stringify(outData).slice(0,600)+'\nProfile:\n'+profile+'\nKeyword: '+primaryKw+'\n\nWrite a complete 1500-2000 word SEO blog post. Use the H2 sections. Write like a human expert. No AI filler.','Write the full blog post. Be specific and expert.',3000);
    seoSetStep('write','done',draft.length+' characters written');
    seoSetStep('optimise','run');
    var opt=await ai('Elite SEO editor and AEO/GEO specialist.\n\nPost:\n'+draft.slice(0,2500)+'\n\nKeyword: '+primaryKw+'\nBusiness: '+inp.name+'\n\nOptimize:\n1. Add TL;DR at very start (2-3 sentences)\n2. Add featured snippet answer after first H2\n3. Improve or add FAQ (5 questions)\n4. End with SEO METADATA:\n   - Title Tag (60 chars)\n   - Meta Description (155 chars)\n   - URL Slug\n   - Focus Keyword\n   - Secondary Keywords\n   - Schema Type\n\nReturn complete optimized post.','Improve with SEO best practices.',3000);
    seoSetStep('optimise','done','TL;DR, snippets, metadata added');
    seoSetStep('humanise','run');
    var final=await ai('Content humanizer.\n\nPost:\n'+opt.slice(0,2500)+'\n\nRules:\n1. Vary sentence length\n2. Add transitions: "Here\'s the thing", "In reality"\n3. Remove: "In conclusion", "It is important to note"\n4. Add rhetorical questions\n5. Use contractions\n6. Keep all SEO keywords\n7. Keep all headings\n8. Output full rewritten post only','Make it 100% human. Never change SEO keywords.',3000);
    seoSetStep('humanise','done','Content humanized');
    seoSetStep('done','done','Ready to publish');
    var r={id:Date.now(),date:new Date().toISOString(),businessName:inp.name,primaryKeyword:primaryKw,title:outData.title||'SEO Blog Post',keywords:kwData.top10Keywords||[],content:final,wordCount:final.split(/\s+/).length};
    SEO_STATE.result=r;SEO_STATE.originalContent=final;
    SEO_STATE.history.unshift(r);if(SEO_STATE.history.length>20)SEO_STATE.history=SEO_STATE.history.slice(0,20);
    localStorage.setItem('seo_blog_history',JSON.stringify(SEO_STATE.history));
    seoRenderResult(r);
  }catch(e){
    seoSetStep('crawl','err','Error: '+e.message);
    var errDiv=document.getElementById('seo-wrap');
    if(errDiv)errDiv.insertAdjacentHTML('beforeend','<div class="al al-r" style="margin-top:14px">Error: '+ec(e.message)+'</div>');
  }
  btn.disabled=false;btn.textContent='✍ Generate SEO Blog Post';
}

function seoRenderResult(r){
  var wrap=document.getElementById('seo-wrap');if(!wrap)return;
  var wc=(r.content||'').split(/\s+/).length;
  wrap.innerHTML=
  '<div class="al al-g" style="margin-bottom:14px">✓ Blog ready — '+wc+' words — <b>'+ec(r.title||'')+'</b></div>'+
  '<div class="g4" style="margin-bottom:14px">'+
  '<div class="stat"><div class="clbl">Words</div><div style="font-size:22px;font-weight:600;color:var(--acc2)">'+wc+'</div></div>'+
  '<div class="stat"><div class="clbl">Primary Keyword</div><div style="font-size:12px;font-weight:600;margin-top:4px">'+ec(r.primaryKeyword||'')+'</div></div>'+
  '<div class="stat"><div class="clbl">Keywords</div><div style="font-size:22px;font-weight:600;color:var(--grn2)">'+(r.keywords||[]).length+'</div></div>'+
  '<div class="stat"><div class="clbl">Business</div><div style="font-size:12px;font-weight:600;margin-top:4px">'+ec(r.businessName||'')+'</div></div>'+
  '</div>'+
  '<div class="tabs" style="max-width:280px"><button class="tab on" id="tab-prev" onclick="seoTab(\'prev\',this)">Preview</button><button class="tab" id="tab-edit" onclick="seoTab(\'edit\',this)">Edit</button></div>'+
  '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">'+
  '<button class="btn bp" onclick="seoCopy()">Copy</button>'+
  '<button class="btn ba" onclick="seoWord()">Download Word</button>'+
  '<button class="btn ba" onclick="seoPDF()">Download PDF</button>'+
  '<button class="btn bg" onclick="seoTxt()">Download .txt</button>'+
  '<button class="btn bg" onclick="go(\'seoblog\')">Write Another</button>'+
  '</div>'+
  ((r.keywords||[]).length?'<div class="card" style="margin-bottom:14px"><div class="clbl">Top Keywords Found</div><div style="display:flex;flex-wrap:wrap;gap:6px">'+
  (r.keywords||[]).map(function(k){var col=k.difficulty==='low'?'var(--grn2)':k.difficulty==='medium'?'var(--amb2)':'var(--red2)';return '<div style="padding:5px 10px;background:var(--c2);border:1px solid var(--b1);border-radius:7px;font-size:11px"><div style="font-weight:600">'+ec(k.keyword||'')+'</div><div style="color:'+col+';font-size:10px">'+ec(k.intent||'')+' · '+ec(k.difficulty||'')+'</div></div>';}).join('')+'</div></div>':'')+
  '<div id="seo-prev" class="card"><div style="font-size:13px;line-height:1.85;white-space:pre-wrap;max-height:600px;overflow-y:auto;background:var(--c2);padding:16px;border-radius:8px;border:1px solid var(--b1)">'+ec(r.content||'')+'</div></div>'+
  '<div id="seo-edit" class="card" style="display:none"><div style="font-size:11px;color:var(--t2);margin-bottom:10px">Edit directly — changes are reflected in all downloads.</div>'+
  '<textarea class="ta" id="seo-editor" rows="28" style="font-size:13px;line-height:1.8">'+ec(r.content||'')+'</textarea>'+
  '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn bs" onclick="seoSave()">✓ Save Edits</button><button class="btn bg bsm" onclick="seoRevert()">Revert to Original</button></div></div>';
  SEO_STATE.result=r;
}
function seoTab(t,btn){document.querySelectorAll('.tabs .tab').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');document.getElementById('seo-prev').style.display=t==='prev'?'block':'none';document.getElementById('seo-edit').style.display=t==='edit'?'block':'none';if(t==='edit'){var ed=document.getElementById('seo-editor');if(ed&&SEO_STATE.result)ed.value=SEO_STATE.result.content;}}
function seoSave(){var ed=document.getElementById('seo-editor');if(!ed||!SEO_STATE.result)return;SEO_STATE.result.content=ed.value;SEO_STATE.result.wordCount=ed.value.split(/\s+/).length;var p=document.getElementById('seo-prev');if(p)p.querySelector('div').textContent=ed.value;var idx=SEO_STATE.history.findIndex(function(h){return h.id===SEO_STATE.result.id;});if(idx>=0)SEO_STATE.history[idx]=SEO_STATE.result;localStorage.setItem('seo_blog_history',JSON.stringify(SEO_STATE.history));var btn=event.target;btn.textContent='✓ Saved!';setTimeout(function(){btn.textContent='✓ Save Edits';},1800);}
function seoRevert(){if(!SEO_STATE.originalContent||!confirm('Revert to original? Edits will be lost.'))return;var ed=document.getElementById('seo-editor');if(ed)ed.value=SEO_STATE.originalContent;if(SEO_STATE.result)SEO_STATE.result.content=SEO_STATE.originalContent;}
function seoCopy(){if(!SEO_STATE.result)return;var c=SEO_STATE.result.content;var ed=document.getElementById('seo-editor');if(ed&&document.getElementById('seo-edit')&&document.getElementById('seo-edit').style.display!=='none')c=ed.value;navigator.clipboard.writeText(c).then(function(){var btn=event.target;var orig=btn.textContent;btn.textContent='✓ Copied!';btn.className='btn bs';setTimeout(function(){btn.textContent=orig;btn.className='btn bp';},2000);}).catch(function(){alert('Select text manually from the preview box.');});}
function seoTxt(){if(!SEO_STATE.result)return;var c=SEO_STATE.result.content;var blob=new Blob([c],{type:'text/plain'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SEO-Blog-'+(SEO_STATE.result.businessName||'post').replace(/\s+/g,'-')+'.txt';a.click();}
function seoWord(){
  if(!SEO_STATE.result)return;
  var c=SEO_STATE.result.content;var ed=document.getElementById('seo-editor');
  if(ed&&document.getElementById('seo-edit')&&document.getElementById('seo-edit').style.display!=='none')c=ed.value;
  var lines=c.split('\n');
  var html=lines.map(function(l){l=l.trim();if(!l)return '<p>&nbsp;</p>';if(l.startsWith('# '))return '<h1>'+l.slice(2)+'</h1>';if(l.startsWith('## '))return '<h2>'+l.slice(3)+'</h2>';if(l.startsWith('### '))return '<h3>'+l.slice(4)+'</h3>';if(l.startsWith('- ')||l.startsWith('• '))return '<li>'+l.slice(2)+'</li>';l=l.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');return '<p>'+l+'</p>';}).join('\n');
  var doc='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.7;color:#1a1a1a;max-width:700px;margin:0 auto;padding:40px}h1{font-size:22pt;color:#1a1a2e;margin:14px 0 8px}h2{font-size:15pt;color:#2c2c54;margin:14px 0 6px;border-bottom:1px solid #e0e0e0;padding-bottom:4px}h3{font-size:12pt;margin:10px 0 4px}li{margin:4px 0}p{margin:6px 0}.meta{background:#f5f5f5;padding:10px 14px;border-left:4px solid #6c5ce7;margin-bottom:18px;font-size:9pt;color:#555}</style></head><body>'+
  '<div class="meta"><b>'+(SEO_STATE.result.businessName||'')+'</b> · Keyword: <b>'+(SEO_STATE.result.primaryKeyword||'')+'</b> · '+new Date().toLocaleDateString('en-IN')+'</div>'+
  html+'</body></html>';
  var blob=new Blob(['\ufeff'+doc],{type:'application/msword'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='SEO-Blog-'+(SEO_STATE.result.businessName||'post').replace(/\s+/g,'-')+'.doc';a.click();
}
function seoPDF(){
  if(!SEO_STATE.result)return;
  var c=SEO_STATE.result.content;var ed=document.getElementById('seo-editor');
  if(ed&&document.getElementById('seo-edit')&&document.getElementById('seo-edit').style.display!=='none')c=ed.value;
  var lines=c.split('\n');
  var html=lines.map(function(l){l=l.trim();if(!l)return '<br>';if(l.startsWith('# '))return '<h1>'+l.slice(2)+'</h1>';if(l.startsWith('## '))return '<h2>'+l.slice(3)+'</h2>';if(l.startsWith('### '))return '<h3>'+l.slice(4)+'</h3>';if(l.startsWith('- ')||l.startsWith('• '))return '<li>'+l.slice(2)+'</li>';l=l.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');return '<p>'+l+'</p>';}).join('\n');
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+(SEO_STATE.result.title||'Blog')+'</title>'+
  '<style>@page{size:A4;margin:2cm}body{font-family:Georgia,serif;font-size:11pt;line-height:1.75;color:#1a1a1a;max-width:680px;margin:0 auto}h1{font-size:20pt;color:#1a1a2e;margin:12px 0 8px}h2{font-size:14pt;color:#2c2c54;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px}h3{font-size:12pt;margin:10px 0 4px}p{margin:6px 0}li{margin:3px 0}.hdr{background:#f7f7fb;border-left:4px solid #6c5ce7;padding:10px 14px;margin-bottom:16px;font-size:9pt;color:#666}.ftr{text-align:center;font-size:8pt;color:#999;margin-top:20px;border-top:1px solid #eee;padding-top:8px}.bar{background:#e8e8f8;padding:10px 16px;margin-bottom:16px;border-radius:6px;font-family:sans-serif;font-size:12px}@media print{.bar{display:none}}</style></head><body>'+
  '<div class="bar"><b>To save as PDF:</b> Press Cmd+P (Mac) or Ctrl+P → Destination: Save as PDF <button onclick="window.print()" style="background:#6c5ce7;color:#fff;border:none;padding:4px 14px;border-radius:5px;cursor:pointer;margin-left:10px">Print / Save PDF</button></div>'+
  '<div class="hdr"><b>'+(SEO_STATE.result.businessName||'')+'</b> · '+( SEO_STATE.result.primaryKeyword||'')+' · '+new Date().toLocaleDateString('en-IN')+'</div>'+
  html+'<div class="ftr">Generated by AutoMarketer AI</div></body></html>');
  win.document.close();setTimeout(function(){win.focus();},300);
}
function seoShowHistory(){
  if(!SEO_STATE.history.length){alert('No blog posts yet.');return;}
  showModal('<div class="mt"><span>Blog History</span><button class="btn bg bsm" onclick="closeModal()">✕</button></div>'+
  '<div style="display:flex;flex-direction:column;gap:8px">'+
  SEO_STATE.history.map(function(r){
    return '<div class="card-sm" style="cursor:pointer" onclick="SEO_STATE.result=SEO_STATE.history.find(function(x){return x.id==='+r.id+'});seoRenderResult(SEO_STATE.result);closeModal()">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><div style="font-size:13px;font-weight:600">'+ec(r.title||'')+'</div><span class="bdg" style="background:var(--acc-bg);color:var(--acc2)">'+r.wordCount+' words</span></div>'+
    '<div style="font-size:11px;color:var(--t2)">'+ec(r.businessName||'')+' · '+ec(r.primaryKeyword||'')+' · '+new Date(r.date).toLocaleDateString('en-IN')+'</div></div>';
  }).join('')+'</div>');
}
