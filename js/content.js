// AutoMarketer — Generate, Approval Queue, Calendar, All Posts


// AUTO GENERATE
function vGenerate(){
  var b=S.cur;
  if(!b||!S.intel)return '<div class="card"><div class="empty" style="min-height:200px"><div style="font-size:36px">⚡</div><div style="font-size:14px;font-weight:600">Run Intelligence Pipeline First</div><div style="color:var(--t2);margin-top:5px">Pipeline analyses your brand before generating</div><button class="btn bp" onclick="go(\'pipeline\')" style="margin-top:14px">Run Pipeline</button></div></div>';
  var plats=b.platforms||['instagram','linkedin','twitter'];
  return '<div style="margin-bottom:24px"><div class="pg-title">Auto Generate Content</div><div class="pg-sub">One click — posts for every platform using your brand intelligence</div></div>'+
  '<div class="g2" style="margin-bottom:14px">'+
  '<div class="card"><div class="clbl">Generate Settings</div><div style="display:flex;flex-direction:column;gap:11px">'+
  '<div><label class="lbl">Platforms</label><div style="display:flex;flex-wrap:wrap;gap:6px" id="gen-plats">'+plats.map(function(p){var pl=PL.find(function(x){return x.id===p;})||{color:'#7C6AF7',abbr:'??',name:p};return '<button class="gpb on" data-id="'+p+'" onclick="this.classList.toggle(\'on\')" style="display:inline-flex;align-items:center;gap:7px"><span style="width:7px;height:7px;border-radius:50%;background:'+pl.color+';display:inline-block"></span>'+pl.name+'</button>';}).join('')+'</div></div>'+
  '<div><label class="lbl">Topic (blank = auto-pick from pillars)</label><textarea class="ta" id="gen-topic" rows="2" placeholder="e.g. Weekend special, new product launch, industry insight..."></textarea></div>'+
  '<div class="g2" style="gap:8px"><div><label class="lbl">Tone</label><select class="sel" id="gen-tone"><option>professional</option><option>casual</option><option>bold</option><option>educational</option><option>inspirational</option></select></div><div><label class="lbl">Posts per platform</label><select class="sel" id="gen-count"><option value="1">1 post</option><option value="3" selected>3 posts</option><option value="5">5 posts</option></select></div></div>'+
  '<div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="gen-img" checked style="accent-color:var(--acc)"><label for="gen-img" style="font-size:12px;cursor:pointer">Auto-generate cover images (Pollinations AI — free)</label></div>'+
  '<button class="btn bp bfw" onclick="doGen()" id="gen-btn">✦ Generate Content for All Platforms</button></div></div>'+
  '<div class="card"><div class="clbl">Last Generated</div><div id="gen-recent"></div></div></div><div id="gen-res"></div>';
  setTimeout(function(){var el=document.getElementById('gen-recent');if(!el)return;var bl=S.posts.filter(function(p){return p.brand_id===b.id;});if(!bl.length){el.innerHTML='<div class="empty" style="min-height:80px"><div>No posts yet</div></div>';return;}el.innerHTML=bl.slice(-6).reverse().map(function(p){var pe=(PL.find(function(x){return x.id===p.platform;})||{abbr:'??'}).abbr;var stc=p.status==='published'?'var(--grn)':p.status==='pending_approval'?'var(--amb)':'var(--acc2)';var stb=p.status==='published'?'var(--grn-bg)':p.status==='pending_approval'?'var(--amb-bg)':'var(--acc-bg)';return '<div class="qi"><div style="width:44px;height:44px;border-radius:8px;background:var(--c3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;overflow:hidden">'+(p.image_url?'<img src="'+p.image_url+'" style="width:44px;height:44px;object-fit:cover">':pe)+'</div><div style="flex:1;min-width:0"><div style="display:flex;gap:6px;margin-bottom:3px">'+pb(p.platform)+'<span class="bdg" style="background:'+stb+';color:'+stc+'">'+ec(p.status||'')+'</span></div><div style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ec((p.content||'').slice(0,65))+'</div></div></div>';}).join('');},50);
}
async function doGen(){
  var btn=document.getElementById('gen-btn');btn.disabled=true;btn.textContent='⟳ Generating...';
  var b=S.cur,pl=[];
  document.querySelectorAll('#gen-plats .gpb.on').forEach(function(el){pl.push(el.getAttribute('data-id'));});
  if(!pl.length){alert('Select at least one platform.');btn.disabled=false;btn.textContent='✦ Generate Content for All Platforms';return;}
  var topic=document.getElementById('gen-topic').value.trim();
  var tone=document.getElementById('gen-tone').value;
  var count=parseInt(document.getElementById('gen-count').value)||3;
  var doImg=document.getElementById('gen-img').checked;
  var res=document.getElementById('gen-res');
  res.innerHTML='<div class="card" style="margin-top:14px"><div class="lbox"><span class="spin">⟳</span> Generating posts...</div></div>';
  var vp=S.intel?S.intel.voiceProfile.slice(0,300):'Professional and engaging';
  var kw=S.intel&&S.intel.keywords?(S.intel.keywords||[]).slice(0,5).join(', '):'';
  var newPosts=[];
  try{
    for(var pi=0;pi<pl.length;pi++){
      var p=pl[pi];
      res.innerHTML='<div class="card" style="margin-top:14px"><div class="lbox"><span class="spin">⟳</span> Writing for '+p+'... ('+(pi+1)+'/'+pl.length+')</div></div>';
      var tl=topic?'Topic: '+topic:'Pick a content pillar from: '+(b.content_pillars||['Product Updates','Industry Insights']).join(', ');
      var r=await ai('Create '+count+' posts for '+p+' for '+b.name+' ('+b.industry+'). Voice: '+vp+'. '+tl+'. Tone: '+tone+'. Keywords: '+kw+'. Return ONLY JSON array of '+count+' objects: [{"content":"full post","hashtags":["t1","t2"],"best_time":"HH:MM","pillar":"pillar name"}]','Return only valid JSON array.',1400);
      var clean=r.replace(/```json|```/g,'').trim();var s2=clean.indexOf('['),e2=clean.lastIndexOf(']');var arr;
      try{arr=JSON.parse(s2>=0&&e2>s2?clean.slice(s2,e2+1):clean);}catch(ex){arr=[{content:b.name+' — '+(topic||'Update'),hashtags:[],best_time:'09:00',pillar:'General'}];}
      var now2=new Date();
      arr.forEach(function(post,idx){
        var sd=new Date(now2.getTime()+(idx+pi+1+S.posts.length)*86400000);
        newPosts.push({id:'g-'+Date.now()+'-'+Math.random(),brand_id:b.id,platform:p,content:post.content||'',hashtags:post.hashtags||[],image_url:'',image_prompt:'',best_time:post.best_time||'09:00',content_pillar:post.pillar,status:'pending_approval',approval_deadline:new Date(now2.getTime()+(b.auto_approve_hours||24)*3600000).toISOString(),scheduled_at:sd.toISOString(),author:'AutoMarketer AI',created_at:new Date().toISOString()});
      });
    }
    if(doImg){
      res.innerHTML='<div class="card" style="margin-top:14px"><div class="lbox"><span class="spin">⟳</span> Generating cover images...</div></div>';
      for(var j=0;j<Math.min(newPosts.length,6);j++){
        try{
          var ip=await ai('DALL-E image prompt (60 words, NO text) for social cover for '+b.name+'. Platform: '+newPosts[j].platform+'. Post: '+newPosts[j].content.slice(0,120)+'. Return ONLY the prompt.');
          newPosts[j].image_prompt=ip;
          newPosts[j].image_url='https://image.pollinations.ai/prompt/'+encodeURIComponent(ip)+'?width=800&height=800&model=flux&nologo=true&seed='+Math.floor(Math.random()*99999);
        }catch(e4){}
      }
    }
    if(!S.demo&&SB){
      var toIns=newPosts.map(function(p){var o=Object.assign({},p);delete o.id;return o;});
      var {data:ins}=await SB.from('posts').insert(toIns).select();
      if(ins)newPosts=ins;
    }
    S.posts=S.posts.concat(newPosts);S.approval=S.approval.concat(newPosts);buildNav();
    res.innerHTML='<div class="al al-g" style="margin-top:14px">✓ '+newPosts.length+' posts ready — sent to Approval Queue. <button class="btn bs bsm" onclick="go(\'approval\')" style="margin-left:8px">Review Now →</button></div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-top:12px">'+newPosts.slice(0,6).map(function(p){return mkCard(p);}).join('')+'</div>';
  }catch(e){res.innerHTML='<div class="al al-r" style="margin-top:14px">Error: '+ec(e.message)+'</div>';}
  btn.disabled=false;btn.textContent='✦ Generate Content for All Platforms';
}
function mkCard(p){
  var stCol=p.status==='published'?'var(--grn)':p.status==='approved'||p.status==='auto_approved'?'var(--grn)':p.status==='pending_approval'?'var(--amb)':p.status==='rejected'?'var(--red)':'var(--acc2)';
  var stBg=p.status==='published'?'var(--grn-bg)':p.status==='approved'||p.status==='auto_approved'?'var(--grn-bg)':p.status==='pending_approval'?'var(--amb-bg)':p.status==='rejected'?'var(--red-bg)':'var(--acc-bg)';
  return '<div class="post-card" onclick="viewPost(\''+ec(p.id)+'\')">'+(p.image_url?'<img src="'+p.image_url+'" style="width:100%;aspect-ratio:16/9;object-fit:cover" onerror="this.style.display=\'none\'">':'<div style="width:100%;height:80px;background:var(--c3);display:flex;align-items:center;justify-content:center;font-size:28px">'+(PL.find(function(x){return x.id===p.platform;})||{abbr:'??'}).abbr+'</div>')+'<div style="padding:11px 13px"><div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;flex-wrap:wrap">'+pb(p.platform)+'<span class="bdg" style="background:'+stBg+';color:'+stCol+'">'+ec(p.status||'')+'</span>'+(p.scheduled_at?'<span style="font-size:10px;color:var(--t2);margin-left:auto">'+fD(p.scheduled_at)+'</span>':'')+'</div><div style="font-size:12px;line-height:1.5">'+ec((p.content||'').slice(0,90))+((p.content||'').length>90?'...':'')+'</div>'+(p.hashtags&&p.hashtags.length?'<div style="margin-top:5px;font-size:11px;color:var(--acc2)">'+ec(p.hashtags.slice(0,4).map(function(h){return '#'+h;}).join(' '))+'</div>':'')+'</div></div>';
}
function viewPost(id){
  var p=S.posts.find(function(x){return String(x.id)===String(id);})||S.approval.find(function(x){return String(x.id)===String(id);});
  if(!p)return;
  showModal('<div class="mt"><span>Post Preview &nbsp; '+pb(p.platform)+'</span><button class="btn bg bsm" onclick="closeModal()">✕</button></div>'+
  '<div style="display:flex;gap:14px;flex-wrap:wrap">'+
  (p.image_url?'<img src="'+p.image_url+'" style="width:180px;height:180px;object-fit:cover;border-radius:10px;flex-shrink:0" onerror="this.style.display=\'none\'">':'')+
  '<div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:10px">'+
  '<div class="card-sm" style="font-size:13px;line-height:1.75;white-space:pre-wrap;max-height:200px;overflow-y:auto">'+ec(p.content||'')+'</div>'+
  (p.hashtags&&p.hashtags.length?'<div style="font-size:12px;color:var(--acc2)">'+ec(p.hashtags.map(function(h){return '#'+h;}).join(' '))+'</div>':'')+
  '<div class="g2" style="gap:7px"><div><div class="lbl">Scheduled</div><div style="font-size:12px">'+fD(p.scheduled_at)+'</div></div><div><div class="lbl">Status</div><div style="font-size:12px;font-weight:600">'+ec(p.status||'')+'</div></div></div>'+
  (p.status==='pending_approval'?'<div style="display:flex;gap:8px"><button class="btn bs" style="flex:1" onclick="qApprove(\''+id+'\')">✓ Approve</button><button class="btn bd" onclick="qReject(\''+id+'\')">Reject</button></div>':'')+'</div></div>');
}
// APPROVAL
function vApproval(){
  var b=S.cur;
  var ba=S.approval.filter(function(p){return !b||p.brand_id===b.id;});
  var pend=ba.filter(function(p){return p.status==='pending_approval';});
  var appr=ba.filter(function(p){return p.status==='approved'||p.status==='auto_approved';});
  var pub=ba.filter(function(p){return p.status==='published';});
  var rej=ba.filter(function(p){return p.status==='rejected';});
  var ov=pend.filter(function(p){return isOv(p.approval_deadline);});
  var now=new Date();
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px"><div><div class="pg-title">Approval Queue</div><div class="pg-sub">Review posts · Approve via dashboard, Telegram, or WhatsApp</div></div><div style="display:flex;gap:8px">'+(pend.length?'<button class="btn bs bsm" onclick="approveAll()">✓ Approve All ('+pend.length+')</button>':'')+'<button class="btn bp bsm" onclick="go(\'generate\')">+ Generate More</button></div></div>'+
  (ov.length?'<div class="al al-r">⚠ <b>'+ov.length+' post'+(ov.length>1?'s':'')+' past auto-approve deadline</b> — n8n will publish them automatically soon. Edit now if needed.</div>':'')+
  '<div class="g4" style="margin-bottom:20px"><div class="stat"><div class="clbl">Pending Review</div><div style="font-size:26px;font-weight:600;color:var(--amb)">'+pend.length+'</div><div style="font-size:11px;color:var(--t2)">Reply YES on Telegram</div></div><div class="stat"><div class="clbl">Approved</div><div style="font-size:26px;font-weight:600;color:var(--grn)">'+appr.length+'</div><div style="font-size:11px;color:var(--t2)">Ready to publish</div></div><div class="stat"><div class="clbl">Published</div><div style="font-size:26px;font-weight:600;color:var(--blu)">'+pub.length+'</div><div style="font-size:11px;color:var(--t2)">Live on platforms</div></div><div class="stat"><div class="clbl">Rejected</div><div style="font-size:26px;font-weight:600;color:var(--red)">'+rej.length+'</div><div style="font-size:11px;color:var(--t2)">Need revision</div></div></div>'+
  '<div class="k-board">'+[['pending_approval','Pending',pend,'var(--amb)'],['approved','Approved',appr.concat(ba.filter(function(p){return p.status==='auto_approved';})),'var(--grn)'],['published','Published',pub,'var(--blu)'],['rejected','Rejected',rej,'var(--red)']].map(function(col){
    var stage=col[0],lbl=col[1],items=col[2],clr=col[3];
    return '<div><div class="k-col-h" style="border:1px solid '+clr+'44"><span style="width:7px;height:7px;border-radius:50%;background:'+clr+';display:inline-block"></span><span style="font-size:11px;font-weight:600;color:'+clr+'">'+lbl+'</span><span style="margin-left:auto;font-size:10px;background:'+clr+'22;color:'+clr+';padding:2px 7px;border-radius:10px">'+items.length+'</span></div>'+
    items.map(function(p){
      var ovi=isOv(p.approval_deadline)&&stage==='pending_approval';
      var dl=p.approval_deadline?new Date(p.approval_deadline):null;
      var hl=dl?Math.round((dl-now)/3600000):null;
      return '<div class="k-card'+(ovi?' ov':'')+'" onclick="aprEdit(\''+ec(p.id)+'\')">'+
      '<div style="display:flex;gap:6px;margin-bottom:7px;flex-wrap:wrap;align-items:center">'+pb(p.platform)+(p.scheduled_at?'<span style="font-size:10px;color:var(--t2);margin-left:auto">'+fD(p.scheduled_at)+'</span>':'')+'</div>'+
      (ovi?'<div class="bdg" style="background:var(--red-bg);color:var(--red);margin-bottom:5px;display:inline-block;font-size:10px">OVERDUE</div>':'')+
      (hl!==null&&!ovi&&stage==='pending_approval'?'<div style="font-size:10px;color:var(--amb);margin-bottom:5px">⏱ '+hl+'h to auto-approve</div>':'')+
      '<div style="font-size:12px;line-height:1.45;margin-bottom:6px">'+ec((p.content||'').slice(0,100))+(p.content&&p.content.length>100?'...':'')+'</div>'+
      (p.hashtags&&p.hashtags.length?'<div style="font-size:10px;color:var(--acc2);margin-bottom:6px">'+ec(p.hashtags.slice(0,3).map(function(h){return '#'+h;}).join(' '))+'</div>':'')+
      '<div style="font-size:10px;color:var(--t2);margin-bottom:7px">by '+ec(p.author||'AI')+'</div>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap">'+
      (stage==='pending_approval'?'<button class="btn bs bsm" onclick="event.stopPropagation();qApprove(\''+ec(p.id)+'\')">✓</button><button class="btn bd bsm" onclick="event.stopPropagation();qReject(\''+ec(p.id)+'\')">✕</button><button class="btn bg bsm" onclick="event.stopPropagation();aprEdit(\''+ec(p.id)+'\')">✏</button>':'')+
      (stage==='approved'||stage==='auto_approved'?'<button class="btn bp bsm" onclick="event.stopPropagation();pubPost(\''+ec(p.id)+'\')">Publish →</button>':'')+
      '</div></div>';
    }).join('')+'</div>';
  }).join('')+'</div>';
}
async function qApprove(id){
  var p=S.approval.find(function(x){return String(x.id)===String(id);})||S.posts.find(function(x){return String(x.id)===String(id);});
  if(p){p.status='approved';p.approved_at=new Date().toISOString();}
  if(!S.demo&&SB)await SB.from('posts').update({status:'approved',approved_at:new Date().toISOString()}).eq('id',id);
  closeModal();buildNav();go('approval');
}
async function qReject(id){
  var p=S.approval.find(function(x){return String(x.id)===String(id);})||S.posts.find(function(x){return String(x.id)===String(id);});
  if(p)p.status='rejected';
  if(!S.demo&&SB)await SB.from('posts').update({status:'rejected'}).eq('id',id);
  closeModal();buildNav();go('approval');
}
async function pubPost(id){
  var p=S.approval.find(function(x){return String(x.id)===String(id);})||S.posts.find(function(x){return String(x.id)===String(id);});
  if(p){p.status='published';p.published_at=new Date().toISOString();}
  if(!S.demo&&SB)await SB.from('posts').update({status:'published',published_at:new Date().toISOString()}).eq('id',id);
  closeModal();buildNav();go('approval');
}
async function approveAll(){
  var b=S.cur;
  var pend=S.approval.filter(function(p){return p.status==='pending_approval'&&(!b||p.brand_id===b.id);});
  pend.forEach(function(p){p.status='approved';p.approved_at=new Date().toISOString();});
  if(!S.demo&&SB){for(var i=0;i<pend.length;i++)await SB.from('posts').update({status:'approved',approved_at:new Date().toISOString()}).eq('id',pend[i].id);}
  buildNav();go('approval');
}
function aprEdit(id){
  var p=S.approval.find(function(x){return String(x.id)===String(id);})||S.posts.find(function(x){return String(x.id)===String(id);});
  if(!p)return;
  showModal('<div class="mt"><span>Edit &amp; Review Post</span><button class="btn bg bsm" onclick="closeModal()">✕</button></div>'+
  '<div style="display:flex;flex-direction:column;gap:11px">'+
  '<div style="display:flex;gap:8px;align-items:center">'+pb(p.platform)+'<span style="font-size:12px;color:var(--t2)">by '+ec(p.author||'AI')+'</span></div>'+
  (p.image_url?'<img src="'+p.image_url+'" style="width:100%;border-radius:8px;max-height:160px;object-fit:cover" onerror="this.style.display=\'none\'">':'')+
  '<div><label class="lbl">Edit Content</label><textarea class="ta" id="ae-txt" rows="7">'+ec(p.content||'')+'</textarea></div>'+
  '<div><label class="lbl">Hashtags (comma separated)</label><input class="inp" id="ae-ht" value="'+ec((p.hashtags||[]).join(', '))+'"></div>'+
  '<div class="g2" style="gap:8px"><div><label class="lbl">Publish Date</label><input class="inp" type="date" id="ae-d" value="'+(p.scheduled_at||td()).split('T')[0]+'"></div><div><label class="lbl">Status</label><select class="sel" id="ae-st"><option value="pending_approval"'+(p.status==='pending_approval'?' selected':'')+'>Pending</option><option value="approved"'+(p.status==='approved'?' selected':'')+'>Approved</option><option value="published"'+(p.status==='published'?' selected':'')+'>Published</option><option value="rejected"'+(p.status==='rejected'?' selected':'')+'>Rejected</option></select></div></div>'+
  '<div style="display:flex;gap:8px"><button class="btn bs" style="flex:1" onclick="saveAprEdit(\''+id+'\')">✓ Save &amp; Approve</button><button class="btn bd" onclick="qReject(\''+id+'\');closeModal()">Reject</button></div></div>');
  window.saveAprEdit=async function(pid){
    var p2=S.approval.find(function(x){return String(x.id)===String(pid);})||S.posts.find(function(x){return String(x.id)===String(pid);});
    if(!p2)return;
    p2.content=document.getElementById('ae-txt').value;
    p2.hashtags=document.getElementById('ae-ht').value.split(',').map(function(h){return h.trim().replace(/^#/,'');}).filter(Boolean);
    var d2=document.getElementById('ae-d').value;if(d2)p2.scheduled_at=d2+'T'+(p2.best_time||'09:00')+':00';
    p2.status=document.getElementById('ae-st').value;p2.approved_at=new Date().toISOString();
    if(!S.demo&&SB)await SB.from('posts').update({content:p2.content,hashtags:p2.hashtags,scheduled_at:p2.scheduled_at,status:p2.status,approved_at:p2.approved_at}).eq('id',pid);
    closeModal();buildNav();go('approval');
  };
}
// CALENDAR
var _cm=new Date().getMonth(),_cy=new Date().getFullYear();
function vCalendar(){
  var b=S.cur;var bp=S.posts.filter(function(p){return !b||p.brand_id===b.id;});
  var MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dim=new Date(_cy,_cm+1,0).getDate(),fd=new Date(_cy,_cm,1).getDay(),tds=td();
  var cells='';
  for(var i=0;i<fd;i++)cells+='<div></div>';
  for(var d=1;d<=dim;d++){
    var ds=_cy+'-'+String(_cm+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var dp=bp.filter(function(p){return (p.scheduled_at||'').split('T')[0]===ds;});
    var isT=ds===tds;
    cells+='<div class="cal-cell'+(isT?' tod':'')+'" data-date="'+ds+'" onclick="calDay(this)">'+
    '<div style="font-size:11px;font-weight:'+(isT?700:400)+';color:'+(isT?'var(--acc2)':'var(--t2)')+';margin-bottom:2px">'+d+'</div>'+
    dp.slice(0,3).map(function(p){var col=PCOL[p.platform]||'#8B5CF6';return '<div class="cal-post" style="background:'+col+'22;color:'+col+'" onclick="event.stopPropagation();viewPost(\''+ec(p.id)+'\')" title="'+ec(p.content||'')+'">'+p.platform.slice(0,3)+'</div>';}).join('')+
    (dp.length>3?'<div style="font-size:9px;color:var(--t2)">+'+( dp.length-3)+'</div>':'')+
    '</div>';
  }
  var sched=bp.filter(function(p){return p.status==='pending_approval'||p.status==='approved'||p.status==='scheduled';}).length;
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px"><div><div class="pg-title">Content Calendar</div><div class="pg-sub">'+bp.length+' total &nbsp;·&nbsp; '+sched+' scheduled</div></div><button class="btn bp bsm" onclick="calAdd()">+ Add Post</button></div>'+
  '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><button class="btn bg bsm" onclick="calNav(-1)">&#8592;</button><span style="font-size:15px;font-weight:600;min-width:160px;text-align:center">'+MN[_cm]+' '+_cy+'</span><button class="btn bg bsm" onclick="calNav(1)">&#8594;</button>'+
  '<div style="margin-left:auto;display:flex;gap:12px">'+[['pending_approval','var(--amb)'],['approved','var(--grn)'],['published','var(--blu)']].map(function(s){return '<span style="font-size:11px;color:'+s[1]+';display:flex;align-items:center;gap:4px"><span style="width:7px;height:7px;border-radius:50%;background:'+s[1]+';display:inline-block"></span>'+s[0]+'</span>';}).join('')+'</div></div>'+
  '<div class="card" style="padding:14px"><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px">'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(function(d){return '<div style="text-align:center;font-size:10px;color:var(--t2);font-weight:600;padding:5px 0">'+d+'</div>';}).join('')+'</div>'+
  '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">'+cells+'</div></div>'+
  '<div class="card" style="margin-top:12px"><div class="clbl">Upcoming Posts</div><table class="dt"><thead><tr><th>Date</th><th>Platform</th><th>Content</th><th>Status</th><th></th></tr></thead><tbody>'+
  bp.filter(function(p){return p.scheduled_at;}).sort(function(a,b){return (a.scheduled_at||'').localeCompare(b.scheduled_at||'');}).slice(0,15).map(function(p){
    return '<tr><td style="white-space:nowrap;color:var(--t2)">'+fD(p.scheduled_at)+'</td><td>'+pb(p.platform)+'</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ec((p.content||'').slice(0,55))+'</td>'+
    stBdgHtml(p.status)+'</td>'+'<td><button class="btn bg bsm" onclick="viewPost(\''+ec(p.id)+'\')" >View</button></td></tr>';
  }).join('')+'</tbody></table></div>';
}
function calNav(d){_cm+=d;if(_cm>11){_cm=0;_cy++;}else if(_cm<0){_cm=11;_cy--;}go('calendar');}
function calDay(el){calAdd(el.getAttribute('data-date'));}
function calAdd(ds){
  showModal('<div class="mt"><span>Add Post to Calendar</span><button class="btn bg bsm" onclick="closeModal()">X</button></div>'+
  '<div style="display:flex;flex-direction:column;gap:10px"><div><label class="lbl">Platform</label><select class="sel" id="cal-pl">'+PL.map(function(p){return '<option value="'+p.id+'">'+p.name+'</option>';}).join('')+'</select></div>'+
  '<div class="g2" style="gap:8px"><div><label class="lbl">Date</label><input class="inp" type="date" id="cal-d" value="'+(ds||td())+'"></div><div><label class="lbl">Time</label><input class="inp" type="time" id="cal-t" value="09:00"></div></div>'+
  '<div><label class="lbl">Content</label><textarea class="ta" id="cal-txt" rows="5" placeholder="Write your post content..."></textarea></div>'+
  '<button class="btn bp bfw" onclick="calSave()">Add to Calendar</button></div>');
  window.calSave=async function(){var pl=document.getElementById('cal-pl').value,d2=document.getElementById('cal-d').value,t2=document.getElementById('cal-t').value,txt=document.getElementById('cal-txt').value;if(!txt||!d2){alert('Fill date and content.');return;}var b=S.cur;var post={id:'m-'+Date.now(),brand_id:b?b.id:'demo',platform:pl,content:txt,hashtags:[],image_url:'',scheduled_at:d2+'T'+t2+':00',status:'approved',generated_by:'manual',author:'Manual',created_at:new Date().toISOString()};if(!S.demo&&SB){var {data}=await SB.from('posts').insert({...post,id:undefined}).select();if(data&&data[0])post=data[0];}S.posts.push(post);closeModal();go('calendar');};
}



// ALL POSTS
function vPosts(){
  var b=S.cur;var bp=S.posts.filter(function(p){return !b||p.brand_id===b.id;});
  return '<div style="display:flex;justify-content:space-between;margin-bottom:24px"><div><div class="pg-title">All Posts</div><div class="pg-sub">'+bp.length+' total posts</div></div><button class="btn bp bsm" onclick="go(\'generate\')">+ Generate</button></div>'+
  '<div class="tabs"><button class="tab on" onclick="filterP(\'all\',this)">All ('+bp.length+')</button><button class="tab" onclick="filterP(\'pending_approval\',this)">Pending ('+bp.filter(function(p){return p.status==='pending_approval';}).length+')</button><button class="tab" onclick="filterP(\'approved\',this)">Approved</button><button class="tab" onclick="filterP(\'published\',this)">Published ('+bp.filter(function(p){return p.status==='published';}).length+')</button><button class="tab" onclick="filterP(\'rejected\',this)">Rejected</button></div>'+
  '<div id="posts-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px">'+bp.slice(0,30).map(function(p){return mkCard(p);}).join('')+'</div>';
}
function filterP(st,btn){
  document.querySelectorAll('.tabs .tab').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');
  var b=S.cur;var all=S.posts.filter(function(p){return !b||p.brand_id===b.id;});
  var f=st==='all'?all:all.filter(function(p){return p.status===st;});
  document.getElementById('posts-grid').innerHTML=f.slice(0,30).map(function(p){return mkCard(p);}).join('');
}
