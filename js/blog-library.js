// AutoMarketer — Blog Library


// ═══════════════════════════════════════════
// BLOG LIBRARY
// ═══════════════════════════════════════════
function vBlogLibrary(){
  var history = SEO_STATE && SEO_STATE.history ? SEO_STATE.history : JSON.parse(localStorage.getItem('seo_blog_history')||'[]');
  var q = '';
  return '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:22px">'+
  '<div><div class="pg-title">Blog Library</div><div class="pg-sub">All AI-generated blog posts — saved in your browser</div></div>'+
  (history.length?'<div style="display:flex;gap:8px"><button class="btn bp bsm" onclick="go(\'seoblog\')">+ Write New Blog</button><button class="btn bd bsm" onclick="clearBlogLibrary()">Clear All</button></div>':'<button class="btn bp bsm" onclick="go(\'seoblog\')">Write Your First Blog</button>')+
  '</div>'+
  (history.length?
  // Search + stats
  '<div class="card" style="margin-bottom:16px"><div style="display:flex;align-items:center;gap:12px">'+
  '<input class="inp" id="blog-search" placeholder="Search by title, keyword, business..." style="flex:1" oninput="blogFilter(this.value)">'+
  '<div style="font-size:12px;color:var(--t2);white-space:nowrap">'+history.length+' blog'+(history.length!==1?'s':'')+' · '+history.reduce(function(a,b){return a+(b.wordCount||0);},0).toLocaleString()+' total words</div></div></div>'+
  '<div id="blog-grid" style="display:flex;flex-direction:column;gap:10px">'+
  history.map(function(r){ return blogCard(r); }).join('')+
  '</div>'
  :
  '<div class="card"><div class="empty" style="min-height:240px">'+
  '<div style="font-size:40px">✍</div>'+
  '<div style="font-size:15px;font-weight:600;color:var(--t1)">No blogs yet</div>'+
  '<div style="color:var(--t2);max-width:300px;text-align:center">Generate your first SEO blog post using the SEO Blog Writer. All posts are automatically saved here.</div>'+
  '<button class="btn bp" onclick="go(\'seoblog\')" style="margin-top:14px">Write First Blog Post</button>'+
  '</div></div>'
  );
}
function blogCard(r){
  var wc = r.wordCount || (r.content||'').split(/\s+/).length;
  var date = new Date(r.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  return '<div class="card" style="cursor:pointer;transition:border-color .15s" id="blog-'+r.id+'" onmouseenter="this.style.borderColor=\'var(--acc)\'" onmouseleave="this.style.borderColor=\'var(--b1)\'">'+
  '<div style="display:flex;align-items:flex-start;gap:14px">'+
  '<div style="width:44px;height:44px;border-radius:10px;background:var(--acc-bg);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;color:var(--acc2)">✍</div>'+
  '<div style="flex:1;min-width:0">'+
  '<div style="font-size:14px;font-weight:600;color:var(--t1);margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+ec(r.title||'Untitled Blog')+'</div>'+
  '<div style="font-size:12px;color:var(--t2);margin-bottom:8px">'+ec(r.businessName||'')+' &nbsp;·&nbsp; Keyword: <b style="color:var(--t1)">'+ec(r.primaryKeyword||'')+'</b> &nbsp;·&nbsp; '+date+'</div>'+
  '<div style="font-size:12px;color:var(--t2);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">'+ec((r.content||'').slice(0,180))+'</div>'+
  '</div>'+
  '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">'+
  '<span class="bdg" style="background:var(--acc-bg);color:var(--acc2)">'+wc+' words</span>'+
  '<div style="display:flex;gap:6px">'+
  '<button class="btn bp bsm" onclick="event.stopPropagation();openBlog('+r.id+')">Open</button>'+
  '<button class="btn bg bsm" onclick="event.stopPropagation();downloadBlogTxt('+r.id+')">↓ txt</button>'+
  '<button class="btn ba bsm" onclick="event.stopPropagation();downloadBlogWord('+r.id+')">↓ doc</button>'+
  '<button class="btn bd bsm" onclick="event.stopPropagation();deleteBlogEntry('+r.id+')">x</button>'+
  '</div></div></div></div>';
}
function blogFilter(q){
  var history = SEO_STATE.history||[];
  var filtered = q ? history.filter(function(r){var s=(r.title+r.businessName+r.primaryKeyword).toLowerCase();return s.indexOf(q.toLowerCase())>=0;}) : history;
  var grid = document.getElementById('blog-grid');
  if(grid) grid.innerHTML = filtered.map(function(r){return blogCard(r);}).join('') || '<div class="empty" style="min-height:80px"><div>No results for "'+ec(q)+'"</div></div>';
}
function openBlog(id){
  var r = (SEO_STATE.history||[]).find(function(x){return x.id===id;});
  if(!r)return;
  SEO_STATE.result = r; SEO_STATE.originalContent = r.content;
  go('seoblog');
  setTimeout(function(){ seoRenderResult(r); }, 100);
}
function downloadBlogTxt(id){
  var r=(SEO_STATE.history||[]).find(function(x){return x.id===id;});if(!r)return;
  var blob=new Blob([r.content],{type:'text/plain'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Blog-'+(r.businessName||'post').replace(/\s+/g,'-')+'.txt';a.click();
}
function downloadBlogWord(id){
  var r=(SEO_STATE.history||[]).find(function(x){return x.id===id;});if(!r)return;
  var orig=SEO_STATE.result;SEO_STATE.result=r;seoWord();SEO_STATE.result=orig;
}
function deleteBlogEntry(id){
  if(!confirm('Delete this blog post?'))return;
  SEO_STATE.history=(SEO_STATE.history||[]).filter(function(x){return x.id!==id;});
  localStorage.setItem('seo_blog_history',JSON.stringify(SEO_STATE.history));
  go('bloglibrary');
}
function clearBlogLibrary(){
  if(!confirm('Delete ALL saved blog posts? This cannot be undone.'))return;
  SEO_STATE.history=[];localStorage.removeItem('seo_blog_history');go('bloglibrary');
}
