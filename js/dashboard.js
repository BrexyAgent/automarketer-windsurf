// AutoMarketer — Dashboard, Brands, Intelligence Pipeline


// DASHBOARD
function buildRecentActivity(bp){
  if(!bp.length)return '<div class="empty" style="min-height:80px"><div>Run the pipeline to generate your first posts</div></div>';
  return bp.slice(0,5).map(function(p){
    return '<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--b1)">'+
    pb(p.platform)+
    '<div style="flex:1;min-width:0">'+
    '<div style="font-size:12px;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ec((p.content||'').slice(0,55))+'</div>'+
    '<div style="font-size:10px;color:var(--t2);margin-top:2px">'+fD(p.scheduled_at||p.created_at)+'</div>'+
    '</div>'+
    stBdgHtml(p.status)+
    '</div>';
  }).join('');
}
function vDash(){
  var b=S.cur;if(!b)return '<div class="card"><div class="empty"><div style="font-size:36px">◈</div><div style="font-size:14px;font-weight:600">No Brand Selected</div><button class="btn bp bsm" onclick="go(\'brands\')" style="margin-top:10px">Add Brand</button></div></div>';
  var bp=S.posts.filter(function(p){return p.brand_id===b.id;});
  var pub=bp.filter(function(p){return p.status==='published';});
  var pend=bp.filter(function(p){return p.status==='pending_approval';});
  var avg=pub.length?(pub.reduce(function(a,p){return a+(parseFloat(p.engagement_rate)||0);},0)/pub.length).toFixed(1):0;
  return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px"><div><div class="pg-title">'+ec(b.name)+'</div><div class="pg-sub">'+ec(b.industry||'')+' &nbsp;·&nbsp; '+(b.platforms||[]).length+' platforms active</div></div>'+(S.intel?'<span class="bdg" style="background:var(--grn-bg);color:var(--grn)">● AI Intelligence Active</span>':'<button class="btn bam" onclick="go(\'pipeline\')">⚡ Run Pipeline First</button>')+'</div>'+
  (pend.length?'<div class="al al-a">⚡ <b>'+pend.length+' posts waiting for approval.</b> <button class="btn bam bsm" onclick="go(\'approval\')" style="margin-left:8px">Review Now →</button></div>':'')+
  '<div class="g4" style="margin-bottom:18px"><div class="stat"><div class="clbl">Total Posts</div><div style="font-size:26px;font-weight:600;color:var(--acc2)">'+bp.length+'</div></div>'+
  '<div class="stat"><div class="clbl">Published</div><div style="font-size:26px;font-weight:600;color:var(--grn)">'+pub.length+'</div></div>'+
  '<div class="stat"><div class="clbl">Pending Approval</div><div style="font-size:26px;font-weight:600;color:var(--amb)">'+pend.length+'</div></div>'+
  '<div class="stat"><div class="clbl">Avg Engagement</div><div style="font-size:26px;font-weight:600;color:var(--blu)">'+avg+'%</div></div></div>'+
  '<div class="g2" style="margin-bottom:14px"><div class="card"><div class="clbl">Posts by Platform</div><div style="height:180px"><canvas id="ch-pl"></canvas></div></div>'+
  '<div class="card"><div class="clbl">Recent Activity</div>'+buildRecentActivity(bp)+'</div></div>'+
  '<div class="card"><div class="clbl">Top Performing Posts</div>'+
  (pub.length?'<table class="dt"><thead><tr><th>Platform</th><th>Content</th><th>Reach</th><th>Engagement</th></tr></thead><tbody>'+pub.sort(function(a,b){return (parseFloat(b.engagement_rate)||0)-(parseFloat(a.engagement_rate)||0);}).slice(0,5).map(function(p){return '<tr><td>'+pb(p.platform)+'</td><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ec((p.content||'').slice(0,55))+'</td><td>'+fN(p.reach)+'</td><td style="color:var(--grn);font-weight:600">'+(p.engagement_rate||0)+'%</td></tr>';}).join('')+'</tbody></table>':'<div class="empty" style="min-height:60px"><div>Publish posts to see performance here</div></div>')+
  '</div>';
}
function iDash(){
  var c=document.getElementById('ch-pl');if(!c)return;
  var b=S.cur;var bp=S.posts.filter(function(p){return !b||p.brand_id===b.id;});
  var cnt={};bp.forEach(function(p){cnt[p.platform]=(cnt[p.platform]||0)+1;});
  var lbs=Object.keys(cnt),data=Object.values(cnt),cols=lbs.map(function(l){return PCOL[l]||'#8B5CF6';});
  if(!lbs.length){lbs=['No posts'];data=[1];cols=['#2A2A40'];}
  S.charts.pl=new Chart(c,{type:'doughnut',data:{labels:lbs,datasets:[{data:data,backgroundColor:cols,borderWidth:2,borderColor:'#0D0D12'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#8080A0',font:{size:11},boxWidth:10}}}}});
}
// ALL BRANDS
function vBrands(){
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px"><div><div class="pg-title">All Brands</div><div class="pg-sub">'+S.brands.length+' client'+(S.brands.length!==1?'s':'')+' managed</div></div><button class="btn bp" onclick="addBrandModal()">+ Add Brand</button></div>'+
  '<div class="g3">'+S.brands.map(function(b){
    var bp=S.posts.filter(function(p){return p.brand_id===b.id;});
    var pend=bp.filter(function(p){return p.status==='pending_approval';}).length;
    return '<div class="card" style="cursor:pointer" onclick="switchBrand(\''+b.id+'\');go(\'dashboard\')" onmouseenter="this.style.borderColor=\'var(--acc)\'" onmouseleave="this.style.borderColor=\'var(--b1)\'">'+
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:40px;height:40px;border-radius:10px;background:var(--acc-bg);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:600;color:var(--acc2)">'+ec((b.name||'?').charAt(0))+'</div><div><div style="font-size:14px;font-weight:600">'+ec(b.name)+'</div><div style="font-size:11px;color:var(--t2)">'+ec(b.industry||'')+'</div></div><span class="bdg" style="background:var(--grn-bg);color:var(--grn);margin-left:auto">Active</span></div>'+
    '<div style="font-size:12px;color:var(--t2);margin-bottom:10px">'+ec(b.website||'')+'</div>'+
    '<div style="display:flex;gap:5px;margin-bottom:12px">'+(b.platforms||[]).map(function(pl){var p=PL.find(function(x){return x.id===pl;})||{color:'#8B5CF6',e:'📱'};return '<span style="width:26px;height:26px;border-radius:6px;background:'+p.color+'22;display:inline-flex;align-items:center;justify-content:center;font-size:13px">'+p.abbr+'</span>';}).join('')+'</div>'+
    '<div class="g2" style="gap:8px"><div class="card-sm" style="text-align:center"><div style="font-size:18px;font-weight:600">'+bp.length+'</div><div style="font-size:10px;color:var(--t2)">Posts</div></div><div class="card-sm" style="text-align:center"><div style="font-size:18px;font-weight:600;color:'+(pend?'var(--amb)':'var(--grn)')+'">'+pend+'</div><div style="font-size:10px;color:var(--t2)">Pending</div></div></div>'+
    '<div style="display:flex;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid var(--b1)">'+
    '<button class="btn bd bsm" onclick="event.stopPropagation();deleteBrand(\''+b.id+'\',\''+ec(b.name)+'\')">Delete Brand</button>'+
    '</div></div>';
  }).join('')+'</div>';
}

async function deleteBrand(id, name){
  if(!confirm('Delete "'+name+'"? This will remove the brand and all its posts. This cannot be undone.'))return;
  if(!S.demo && SB){
    await SB.from('posts').delete().eq('brand_id', id);
    await SB.from('brand_intelligence').delete().eq('brand_id', id);
    await SB.from('brands').delete().eq('id', id);
  }
  S.brands = S.brands.filter(function(b){return b.id !== id;});
  S.posts = S.posts.filter(function(p){return p.brand_id !== id;});
  S.approval = S.approval.filter(function(p){return p.brand_id !== id;});
  S.cur = S.brands[0] || null;
  fillBrandSel();
  buildNav();
  go('brands');
}
function addBrandModal(){
  showModal('<div class="mt"><span>Add New Brand / Client</span><button class="btn bg bsm" onclick="closeModal()">✕</button></div>'+
    '<div style="display:flex;flex-direction:column;gap:11px">'+
    '<div class="g2" style="gap:9px"><div><label class="lbl">Brand Name *</label><input class="inp" id="nb-n" placeholder="e.g. Waisabi"></div><div><label class="lbl">Industry *</label><input class="inp" id="nb-i" placeholder="e.g. Food & Beverage"></div></div>'+
    '<div><label class="lbl">Website URL</label><input class="inp" id="nb-w" placeholder="https://yoursite.com"></div>'+
    '<div><label class="lbl">Products / Services</label><textarea class="ta" id="nb-p" rows="2" placeholder="Briefly describe what this brand sells..."></textarea></div>'+
    '<div><label class="lbl">Target Audience</label><input class="inp" id="nb-a" placeholder="e.g. Food lovers in Delhi, 25-45 years old"></div>'+
    '<div><label class="lbl">Platforms (comma separated)</label><input class="inp" id="nb-pl" placeholder="instagram, linkedin, twitter, facebook" value="instagram, linkedin, twitter, facebook"></div>'+
    '<div class="g2" style="gap:9px"><div><label class="lbl">Notification Email</label><input class="inp" id="nb-em" placeholder="client@email.com"></div><div><label class="lbl">Telegram Chat ID</label><input class="inp" id="nb-tg" placeholder="123456789"></div></div>'+
    '<button class="btn bp bfw" onclick="saveBrand()">Add Brand & Start</button></div>');
  window.saveBrand=async function(){
    var n=document.getElementById('nb-n').value.trim(),ind=document.getElementById('nb-i').value.trim();
    if(!n){alert('Brand name required.');return;}
    var pl=document.getElementById('nb-pl').value.split(',').map(function(p){return p.trim().toLowerCase();}).filter(Boolean);
    var brand={name:n,industry:ind,website:document.getElementById('nb-w').value.trim(),products:document.getElementById('nb-p').value.trim(),target_audience:document.getElementById('nb-a').value.trim(),platforms:pl.length?pl:['instagram','linkedin','twitter'],notification_email:document.getElementById('nb-em').value.trim(),telegram_chat_id:document.getElementById('nb-tg').value.trim(),is_active:true,content_pillars:['Product Updates','Industry Insights','Customer Success','Behind the Scenes','Educational']};
    if(!S.demo&&SB){var {data,error}=await SB.from('brands').insert(brand).select();if(error){alert('Error: '+error.message);return;}if(data&&data[0])brand=data[0];}else{brand.id='b-'+Date.now();}
    S.brands.push(brand);closeModal();fillBrandSel();go('brands');
  };
}
// PIPELINE
var PS=[{id:'scrape',l:'Website Analysis',d:'Reading your website — products, tone, USPs',ico:'🌐'},{id:'voice',l:'Brand Voice Profile',d:'Analysing writing style, vocabulary, personality',ico:'🎯'},{id:'competitor',l:'Competitor Research',d:'Finding content gaps competitors are missing',ico:'🔍'},{id:'seo',l:'SEO & Keywords',d:'Finding high-opportunity keywords',ico:'📊'},{id:'strategy',l:'Content Strategy',d:'Building your content calendar strategy',ico:'🗓'},{id:'hashtags',l:'Hashtag Banks',d:'Curating platform-specific hashtag sets',ico:'#'},{id:'genposts',l:'Auto-Generate Week 1',d:'Creating first week of posts for all platforms',ico:'✦'},{id:'images',l:'Cover Image Creation',d:'Generating AI visuals for each post',ico:'🖼'}];
var pStatus={};
function vPipeline(){
  var done=PS.filter(function(s){return pStatus[s.id]==='done';}).length;
  var pct=S.intel?100:Math.round((done/PS.length)*100);
  var b=S.cur;
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px"><div><div class="pg-title">Intelligence Pipeline</div><div class="pg-sub">Automated research for '+(b?ec(b.name):'your brand')+' — runs once, improves forever</div></div>'+(b?'<button class="btn bp" onclick="runPipeline()" id="run-btn">⚡ Run Full Pipeline</button>':'<button class="btn bg" onclick="go(\'brands\')">Add brand first</button>')+'</div>'+
  '<div class="card" style="margin-bottom:18px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><span style="font-size:13px;font-weight:600">Overall Progress</span><span style="font-size:14px;font-weight:600;color:var(--acc2)">'+pct+'%</span></div><div class="prog"><div class="progf" id="ppf" style="width:'+pct+'%;background:linear-gradient(90deg,var(--acc),var(--acc2))"></div></div>'+(S.intel?'<div class="al al-g" style="margin-top:10px;margin-bottom:0">✓ Pipeline complete! <button class="btn bs bsm" onclick="go(\'generate\')" style="margin-left:8px">Generate Content →</button></div>':'')+
  '</div><div id="psteps">'+PS.map(function(s){var st=pStatus[s.id]||'wait';var ico=st==='done'?'✓':st==='run'?'<span class="spin">⟳</span>':st==='err'?'✗':s.ico;var det=pStatus[s.id+'_d']||'';return '<div class="pipe-step '+st+'" id="ps-'+s.id+'"><div class="ps-dot '+st+'">'+ico+'</div><div style="flex:1"><div style="font-size:13px;font-weight:600">'+s.l+'</div><div style="font-size:11px;color:var(--t2);margin-top:2px">'+s.d+'</div>'+(det?'<div style="font-size:11px;color:var(--grn);margin-top:3px">'+ec(det)+'</div>':'')+'</div></div>';}).join('')+'</div>'+
  (S.intel?'<div class="card" style="margin-top:18px"><div class="clbl">Intelligence Summary</div><div class="g2" style="gap:14px"><div><div style="font-size:10px;color:var(--acc2);font-weight:600;margin-bottom:6px">BRAND VOICE</div><div style="font-size:12px;line-height:1.6">'+ec((S.intel.voiceProfile||'').slice(0,200))+'</div></div><div><div style="font-size:10px;color:var(--grn);font-weight:600;margin-bottom:6px">SEO KEYWORDS</div><div style="display:flex;flex-wrap:wrap;gap:4px">'+((S.intel.keywords||[]).slice(0,8).map(function(k){return '<span class="bdg" style="background:var(--grn-bg);color:var(--grn)">'+ec(k)+'</span>';})).join('')+'</div></div></div></div>':'');
}
function setPS(id,st,det){
  pStatus[id]=st;if(det)pStatus[id+'_d']=det;
  var el=document.getElementById('ps-'+id);if(!el)return;
  el.className='pipe-step '+st;
  var dot=el.querySelector('.ps-dot');if(dot){dot.className='ps-dot '+st;dot.innerHTML=st==='done'?'✓':st==='run'?'<span class="spin">⟳</span>':st==='err'?'✗':(PS.find(function(s){return s.id===id;})||{ico:''}).ico;}
  if(det){var ex=el.querySelector('.pd');if(ex)ex.textContent=det;else{var nd=document.createElement('div');nd.className='pd';nd.style.cssText='font-size:11px;color:var(--grn);margin-top:3px';nd.textContent=det;el.querySelector('div:last-child').appendChild(nd);}}
  var done=PS.filter(function(s){return pStatus[s.id]==='done';}).length;
  var pf=document.getElementById('ppf');if(pf)pf.style.width=Math.round((done/PS.length)*100)+'%';
}
async function runPipeline(){
  var b=S.cur;if(!b){alert('Select a brand first.');return;}
  if(!CFG.antKey){alert('Add Anthropic API key in Settings.');showCfg();return;}
  var btn=document.getElementById('run-btn');if(btn){btn.disabled=true;btn.textContent='⟳ Running...';}
  pStatus={};S.intel=null;
  try{
    setPS('scrape','run');
    var wCtx='';try{var wr=await fetch('https://r.jina.ai/'+b.website,{headers:{'Accept':'text/plain'}});wCtx=(await wr.text()).slice(0,3000);}catch(e){wCtx='Brand: '+b.name+'. Industry: '+b.industry+'. Products: '+(b.products||'');}
    setPS('scrape','done',wCtx.slice(0,80)+'...');
    setPS('voice','run');
    var vr=await ai('Create a brand voice profile for '+b.name+' ('+b.industry+'). Context: '+wCtx.slice(0,400)+'. Products: '+(b.products||'')+'. Audience: '+(b.target_audience||'')+'. Cover: tone, style, vocabulary to use, vocabulary to avoid, personality. Under 150 words.');
    setPS('voice','done',vr.slice(0,80)+'...');
    setPS('competitor','run');
    var cr=await ai('Competitive content analysis for '+b.name+' in '+b.industry+'. Identify: 1) What competitors typically post, 2) Their weak spots, 3) 3 content gaps to exploit. Under 150 words.');
    setPS('competitor','done',cr.slice(0,80)+'...');
    setPS('seo','run');
    var sr=await ai('SEO research for '+b.name+' in '+b.industry+'. Return ONLY JSON: {"primary":["8 keywords"],"long_tail":["8 keywords"],"trending":["5 topics"]}','Return only valid JSON.');
    var seo;try{seo=JSON.parse(sr.replace(/```json|```/g,'').trim());}catch(e){seo={primary:[b.industry],long_tail:[],trending:[]};}
    setPS('seo','done',(seo.primary||[]).slice(0,3).join(', '));
    setPS('strategy','run');
    var strat=await ai('Weekly content strategy for '+b.name+' on '+(b.platforms||[]).join(', ')+'. Audience: '+(b.target_audience||'')+'. Pillars: '+(b.content_pillars||[]).join(', ')+'. Give specific posting rhythm and mix. Under 120 words.');
    setPS('strategy','done',strat.slice(0,80)+'...');
    setPS('hashtags','run');
    var hr=await ai('Hashtag banks for '+b.name+' in '+b.industry+'. Return ONLY JSON: {"brand":["5 tags"],"industry":["10 tags"],"niche":["8 tags"],"trending":["5 tags"],"daily_set":"12-15 hashtags with # signs","byPlatform":{"instagram":["8 tags"],"linkedin":["5 tags"],"twitter":["8 tags"]}}','Return only valid JSON.');
    var ht;try{ht=JSON.parse(hr.replace(/```json|```/g,'').trim());}catch(e){ht={brand:[],industry:[],niche:[],trending:[],daily_set:'',byPlatform:{}};}
    setPS('hashtags','done','Hashtag banks ready');
    setPS('genposts','run');
    var plats=b.platforms||['instagram','linkedin','twitter'];
    var newPosts=[];
    for(var pi=0;pi<plats.length;pi++){
      var pl=plats[pi];
      try{
        var pr=await ai('Create 3 posts for '+pl+' for '+b.name+'. Voice: '+vr.slice(0,200)+'. Industry: '+b.industry+'. Keywords: '+(seo.primary||[]).slice(0,3).join(', ')+'. Return ONLY JSON array: [{"content":"full post","hashtags":["t1","t2"],"best_time":"HH:MM","pillar":"name","image_concept":"brief visual"}]','Return only valid JSON array.',1400);
        var pc=pr.replace(/```json|```/g,'').trim();var ps=pc.indexOf('['),pe=pc.lastIndexOf(']');var arr;
        try{arr=JSON.parse(ps>=0&&pe>ps?pc.slice(ps,pe+1):pc);}catch(e){arr=[{content:b.name+' update',hashtags:[],best_time:'09:00',pillar:'General',image_concept:'brand image'}];}
        var now2=new Date();
        arr.forEach(function(post,idx){
          var sd=new Date(now2.getTime()+(idx+pi+1+newPosts.length)*86400000);
          newPosts.push({id:'g-'+Date.now()+'-'+Math.random(),brand_id:b.id,platform:pl,content:post.content||'',hashtags:post.hashtags||[],image_url:'',image_prompt:'',best_time:post.best_time||'09:00',content_pillar:post.pillar,image_concept:post.image_concept||'',status:'pending_approval',approval_deadline:new Date(now2.getTime()+(b.auto_approve_hours||24)*3600000).toISOString(),scheduled_at:sd.toISOString(),author:'AutoMarketer AI',created_at:new Date().toISOString()});
        });
      }catch(e2){console.log('Gen error:',e2.message);}
    }
    setPS('genposts','done',newPosts.length+' posts generated across '+plats.length+' platforms');
    setPS('images','run');
    var imaged=0;
    for(var j=0;j<Math.min(newPosts.length,4);j++){
      try{
        var ip=await ai('DALL-E image prompt (60 words, NO text in image) for social cover for '+b.name+'. Platform: '+newPosts[j].platform+'. Concept: '+(newPosts[j].image_concept||'')+'. Post: '+newPosts[j].content.slice(0,100)+'. Return ONLY the prompt.');
        newPosts[j].image_prompt=ip;
        newPosts[j].image_url='https://image.pollinations.ai/prompt/'+encodeURIComponent(ip)+'?width=800&height=800&model=flux&nologo=true&seed='+Math.floor(Math.random()*99999);
        imaged++;
      }catch(e3){}
    }
    setPS('images','done',imaged+' images generated');
    S.intel={voiceProfile:vr,competitorAnalysis:cr,strategy:strat,keywords:seo.primary||[],hashtagBanks:ht,completedAt:new Date().toISOString()};
    if(!S.demo&&SB){
      await SB.from('brand_intelligence').upsert({brand_id:b.id,...S.intel});
      var toIns=newPosts.map(function(p){var o=Object.assign({},p);delete o.id;return o;});
      var {data:ins}=await SB.from('posts').insert(toIns).select();
      if(ins)newPosts=ins;
    }
    S.posts=S.posts.concat(newPosts);S.approval=S.approval.concat(newPosts);
    buildNav();go('pipeline');
    alert('Pipeline complete! '+newPosts.length+' posts generated. Check Approval Queue — reply YES on Telegram to approve.');
  }catch(e){setPS('scrape','err','Error: '+e.message);}
  if(btn){btn.disabled=false;btn.textContent='⚡ Run Full Pipeline';}
}
