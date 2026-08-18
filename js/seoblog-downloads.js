// AutoMarketer — SEO Blog: Edit, Copy, Download (Word/PDF/txt)


// ═══════════════════════════════════════════════════════
// SEO BLOG — EDIT, DOWNLOAD AS WORD & PDF
// ═══════════════════════════════════════════════════════

// Override seoShowResult to include editing + Word/PDF download
var _origSeoShowResult = seoShowResult;
seoShowResult = function(r){
  var wrap = document.getElementById('seo-wrap');
  if(!wrap)return;
  var wc = (r.content||'').split(/\s+/).length;

  wrap.innerHTML =
  '<div class="al al-g" style="margin-bottom:14px">✓ Blog post ready — '+wc+' words — <b>'+ec(r.title||'')+'</b></div>'+

  // Stats
  '<div class="g4" style="margin-bottom:14px">'+
  '<div class="stat"><div class="clbl">Word Count</div><div style="font-size:22px;font-weight:600;color:var(--acc2)">'+wc+'</div></div>'+
  '<div class="stat"><div class="clbl">Primary Keyword</div><div style="font-size:12px;font-weight:600;margin-top:4px">'+ec(r.primaryKeyword||'')+'</div></div>'+
  '<div class="stat"><div class="clbl">Keywords Found</div><div style="font-size:22px;font-weight:600;color:var(--grn2)">'+(r.keywords||[]).length+'</div></div>'+
  '<div class="stat"><div class="clbl">Business</div><div style="font-size:12px;font-weight:600;margin-top:4px">'+ec(r.businessName||'')+'</div></div>'+
  '</div>'+

  // Tabs: Preview / Edit
  '<div class="tabs" style="max-width:320px">'+
  '<button class="tab on" id="tab-preview" onclick="seoTabSwitch(\'preview\',this)">Preview</button>'+
  '<button class="tab" id="tab-edit" onclick="seoTabSwitch(\'edit\',this)">Edit</button>'+
  '</div>'+

  // Action buttons
  '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">'+
  '<button class="btn bp" onclick="seoCopy()">Copy Text</button>'+
  '<button class="btn ba" onclick="seoDownloadWord()">Download Word (.doc)</button>'+
  '<button class="btn ba" onclick="seoDownloadPDF()">Download / Print PDF</button>'+
  '<button class="btn bg" onclick="seoDownload()">Download .txt</button>'+
  '<button class="btn bg" onclick="go(\'seoblog\')">Write Another</button>'+
  '</div>'+

  // Keywords
  ((r.keywords||[]).length?
  '<div class="card" style="margin-bottom:14px"><div class="clbl">Top 10 SEO Keywords</div>'+
  '<div style="display:flex;flex-wrap:wrap;gap:6px">'+
  (r.keywords||[]).map(function(k){
    var col=k.difficulty==='low'?'var(--grn2)':k.difficulty==='medium'?'var(--amb2)':'var(--red2)';
    return '<div style="padding:5px 10px;background:var(--c2);border:1px solid var(--b1);border-radius:7px;font-size:11px">'+
    '<div style="font-weight:600">'+ec(k.keyword||'')+'</div>'+
    '<div style="color:'+col+';font-size:10px">'+ec(k.intent||'')+' · '+ec(k.difficulty||'')+'</div></div>';
  }).join('')+
  '</div></div>':'') +

  // Preview panel
  '<div id="seo-panel-preview" class="card">'+
  '<div style="font-size:13px;line-height:1.85;white-space:pre-wrap;max-height:650px;overflow-y:auto;background:var(--c2);padding:16px;border-radius:8px;border:1px solid var(--b1)" id="seo-content">'+ec(r.content||'')+'</div>'+
  '</div>'+

  // Edit panel (hidden by default)
  '<div id="seo-panel-edit" class="card" style="display:none">'+
  '<div style="font-size:12px;color:var(--t2);margin-bottom:10px">Edit your blog post directly. Changes save automatically when you download or copy.</div>'+
  '<textarea class="ta" id="seo-editor" rows="30" style="font-size:13px;line-height:1.8;font-family:inherit">'+ec(r.content||'')+'</textarea>'+
  '<div style="display:flex;gap:8px;margin-top:10px">'+
  '<button class="btn bs" onclick="seoSaveEdit()">✓ Save Edits</button>'+
  '<button class="btn bg bsm" onclick="seoRevertEdit()">Revert to Original</button>'+
  '</div></div>';

  SEO_STATE.result = r;
  SEO_STATE.originalContent = r.content;
};

function seoTabSwitch(tab, btn){
  document.querySelectorAll('.tabs .tab').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  document.getElementById('seo-panel-preview').style.display = tab==='preview'?'block':'none';
  document.getElementById('seo-panel-edit').style.display = tab==='edit'?'block':'none';
  if(tab==='edit'){
    var ed = document.getElementById('seo-editor');
    if(ed && SEO_STATE.result) ed.value = SEO_STATE.result.content;
  }
}

function seoSaveEdit(){
  var ed = document.getElementById('seo-editor');
  if(!ed||!SEO_STATE.result)return;
  SEO_STATE.result.content = ed.value;
  SEO_STATE.result.wordCount = ed.value.split(/\s+/).length;
  // Update preview
  var prev = document.getElementById('seo-content');
  if(prev) prev.textContent = ed.value;
  // Save to history
  var idx = SEO_STATE.history.findIndex(function(h){return h.id===SEO_STATE.result.id;});
  if(idx>=0) SEO_STATE.history[idx] = SEO_STATE.result;
  localStorage.setItem('seo_blog_history', JSON.stringify(SEO_STATE.history));
  var btn = event.target;
  btn.textContent='✓ Saved!';btn.className='btn bs';
  setTimeout(function(){btn.textContent='✓ Save Edits';btn.className='btn bs';},1800);
}

function seoRevertEdit(){
  if(!SEO_STATE.originalContent)return;
  if(!confirm('Revert to the original AI-generated version? Your edits will be lost.'))return;
  var ed = document.getElementById('seo-editor');
  if(ed) ed.value = SEO_STATE.originalContent;
  SEO_STATE.result.content = SEO_STATE.originalContent;
}

function seoCopy(){
  if(!SEO_STATE.result)return;
  var content = SEO_STATE.result.content;
  // Get edited version if in edit mode
  var ed = document.getElementById('seo-editor');
  if(ed && document.getElementById('seo-panel-edit') && document.getElementById('seo-panel-edit').style.display!=='none'){
    content = ed.value;
  }
  navigator.clipboard.writeText(content).then(function(){
    var btn=event.target;var orig=btn.textContent;btn.textContent='✓ Copied!';btn.className='btn bs';
    setTimeout(function(){btn.textContent=orig;btn.className='btn bp';},2000);
  }).catch(function(){alert('Copy failed — select text manually from the preview box.');});
}

function seoDownload(){
  if(!SEO_STATE.result)return;
  var c = SEO_STATE.result.content;
  var ed = document.getElementById('seo-editor');
  if(ed && document.getElementById('seo-panel-edit') && document.getElementById('seo-panel-edit').style.display!=='none') c = ed.value;
  var blob = new Blob([c], {type:'text/plain'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'SEO-Blog-'+( SEO_STATE.result.businessName||'post').replace(/\s+/g,'-')+'-'+new Date().toISOString().split('T')[0]+'.txt';
  a.click();
}

function seoDownloadWord(){
  if(!SEO_STATE.result)return;
  var c = SEO_STATE.result.content;
  var ed = document.getElementById('seo-editor');
  if(ed && document.getElementById('seo-panel-edit') && document.getElementById('seo-panel-edit').style.display!=='none') c = ed.value;

  // Convert markdown-style text to basic HTML for Word
  var lines = c.split('\n');
  var htmlLines = lines.map(function(line){
    var l = line.trim();
    if(!l) return '<p style="margin:8px 0">&nbsp;</p>';
    if(l.startsWith('# ')) return '<h1 style="font-size:22pt;font-weight:bold;margin:14px 0 8px;color:#1a1a2e">'+l.slice(2)+'</h1>';
    if(l.startsWith('## ')) return '<h2 style="font-size:16pt;font-weight:bold;margin:12px 0 6px;color:#2c2c54">'+l.slice(3)+'</h2>';
    if(l.startsWith('### ')) return '<h3 style="font-size:13pt;font-weight:bold;margin:10px 0 4px">'+l.slice(4)+'</h3>';
    if(l.startsWith('**') && l.endsWith('**')) return '<p style="font-weight:bold;margin:6px 0">'+l.slice(2,-2)+'</p>';
    if(l.startsWith('- ') || l.startsWith('• ')) return '<li style="margin:4px 0;margin-left:20px">'+l.slice(2)+'</li>';
    if(/^\d+\.\s/.test(l)) return '<li style="margin:4px 0;margin-left:20px">'+l.replace(/^\d+\.\s/,'')+'</li>';
    // Bold inline: **text**
    l = l.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return '<p style="margin:6px 0;line-height:1.7">'+l+'</p>';
  });

  var title = SEO_STATE.result.title || 'SEO Blog Post';
  var biz = SEO_STATE.result.businessName || '';
  var kw = SEO_STATE.result.primaryKeyword || '';
  var date = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});

  var wordHtml = '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+title+'</title>'+
  '<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>'+
  '<style>'+
  'body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1a1a1a;max-width:720px;margin:0 auto;padding:40px;}'+
  'h1{font-size:22pt;color:#1a1a2e;margin:16px 0 8px;}'+
  'h2{font-size:15pt;color:#2c2c54;margin:14px 0 6px;border-bottom:1px solid #e0e0e0;padding-bottom:4px;}'+
  'h3{font-size:12pt;color:#333;margin:10px 0 4px;}'+
  'p{line-height:1.7;margin:7px 0;}'+
  'li{line-height:1.7;margin:4px 0;}'+
  '.meta{background:#f5f5f5;padding:12px 16px;border-left:4px solid #6c5ce7;margin-bottom:20px;font-size:10pt;color:#555;}'+
  '</style></head><body>'+
  '<div class="meta"><b>Business:</b> '+biz+' &nbsp;|&nbsp; <b>Primary Keyword:</b> '+kw+' &nbsp;|&nbsp; <b>Generated:</b> '+date+'</div>'+
  htmlLines.join('\n')+
  '</body></html>';

  var blob = new Blob(['\ufeff'+wordHtml], {type:'application/msword'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'SEO-Blog-'+(SEO_STATE.result.businessName||'post').replace(/\s+/g,'-')+'-'+new Date().toISOString().split('T')[0]+'.doc';
  a.click();
}

function seoDownloadPDF(){
  if(!SEO_STATE.result)return;
  var c = SEO_STATE.result.content;
  var ed = document.getElementById('seo-editor');
  if(ed && document.getElementById('seo-panel-edit') && document.getElementById('seo-panel-edit').style.display!=='none') c = ed.value;

  var title = SEO_STATE.result.title || 'SEO Blog Post';
  var biz = SEO_STATE.result.businessName || '';
  var kw = SEO_STATE.result.primaryKeyword || '';
  var date = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});

  var lines = c.split('\n');
  var htmlLines = lines.map(function(line){
    var l = line.trim();
    if(!l) return '<br>';
    if(l.startsWith('# ')) return '<h1>'+l.slice(2)+'</h1>';
    if(l.startsWith('## ')) return '<h2>'+l.slice(3)+'</h2>';
    if(l.startsWith('### ')) return '<h3>'+l.slice(4)+'</h3>';
    if(l.startsWith('- ')||l.startsWith('• ')) return '<li>'+l.slice(2)+'</li>';
    l = l.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    return '<p>'+l+'</p>';
  });

  var win = window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+title+'</title>'+
  '<style>'+
  '@page{size:A4;margin:2cm;}'+
  'body{font-family:Georgia,serif;font-size:11pt;color:#1a1a1a;line-height:1.7;max-width:680px;margin:0 auto;}'+
  'h1{font-size:20pt;color:#1a1a2e;margin:14px 0 8px;line-height:1.3;}'+
  'h2{font-size:14pt;color:#2c2c54;margin:16px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px;}'+
  'h3{font-size:12pt;font-weight:bold;margin:12px 0 4px;}'+
  'p{margin:6px 0;}li{margin:3px 0;}'+
  '.header{background:#f7f7fb;border-left:4px solid #6c5ce7;padding:10px 14px;margin-bottom:18px;font-size:9pt;color:#666;}'+
  '.footer{text-align:center;font-size:8pt;color:#999;margin-top:24px;border-top:1px solid #eee;padding-top:8px;}'+
  '@media print{.no-print{display:none!important}body{margin:0}}'+
  '</style></head><body>'+
  '<div class="no-print" style="background:#e8e8f8;padding:10px 16px;margin-bottom:16px;border-radius:6px;font-family:sans-serif;font-size:12px">'+
  '<b>To save as PDF:</b> Press Ctrl+P (or Cmd+P on Mac) → Change destination to "Save as PDF" → Save &nbsp;'+
  '<button onclick="window.print()" style="background:#6c5ce7;color:#fff;border:none;padding:5px 14px;border-radius:5px;cursor:pointer;font-size:12px">Print / Save PDF</button></div>'+
  '<div class="header"><b>'+biz+'</b> &nbsp;·&nbsp; Keyword: <b>'+kw+'</b> &nbsp;·&nbsp; Generated: '+date+'</div>'+
  htmlLines.join('\n')+
  '<div class="footer">Generated by AutoMarketer AI · '+date+'</div>'+
  '</body></html>');
  win.document.close();
  setTimeout(function(){win.focus();},300);
}
