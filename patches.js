(function(){
  let chartLoader=null;
  function ensureChartJs(){
    if(window.Chart) return Promise.resolve();
    if(chartLoader) return chartLoader;
    chartLoader=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      s.onload=resolve;
      s.onerror=()=>reject(new Error('Chart.js yüklenemedi'));
      document.head.appendChild(s);
    });
    return chartLoader;
  }
  function resetCanvas(id){
    const c=document.getElementById(id);
    if(!c) return;
    c.style.width='100%';
    c.style.height='100%';
    c.removeAttribute('width');
    c.removeAttribute('height');
  }
  function repairCharts(){
    ['daily-follower-chart','mrr-chart','revenue-chart','cr-chart','ig-followers-chart','ig-ads-chart'].forEach(resetCanvas);
    try{ if(typeof buildDailyFollowerChart==='function' && document.getElementById('page-daily')?.classList.contains('active')) buildDailyFollowerChart(); }catch(e){  }
    try{ if(typeof renderMusterierChart==='function' && document.getElementById('page-musteriler')?.classList.contains('active')) renderMusterierChart(); }catch(e){  }
    try{ if(typeof buildChart==='function' && document.getElementById('page-dashboard')?.classList.contains('active')) buildChart(typeof data6ay!=='undefined'?data6ay:{labels:[],values:[]}); }catch(e){  }
    try{ if(typeof buildCRChart==='function' && document.getElementById('page-client-reports')?.classList.contains('active')) buildCRChart(); }catch(e){  }
    try{ if(typeof igRenderFollowersChart==='function' && document.getElementById('page-instagram')?.classList.contains('active')) igRenderFollowersChart(); }catch(e){  }
  }
  function scheduleRepair(){
    ensureChartJs().then(()=>{
      requestAnimationFrame(()=>setTimeout(repairCharts,80));
      setTimeout(repairCharts,350);
    }).catch(e=>
  }
  const oldGo=window.go;
  if(typeof oldGo==='function'){
    window.go=function(){
      const result=oldGo.apply(this,arguments);
      scheduleRepair();
      return result;
    };
  }
  window.addEventListener('resize',scheduleRepair);
  window.addEventListener('orientationchange',scheduleRepair);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scheduleRepair);
  else scheduleRepair();
})();

function toggleSidebarAccountMenu(e){
  if(e) e.stopPropagation();
  const footer=document.querySelector('.sidebar-footer');
  const btn=document.querySelector('.sidebar-account-toggle');
  if(!footer||!btn) return;
  const open=!footer.classList.contains('account-open');
  footer.classList.toggle('account-open',open);
  btn.setAttribute('aria-expanded',open?'true':'false');
}
document.addEventListener('click',function(e){
  const footer=document.querySelector('.sidebar-footer');
  const btn=document.querySelector('.sidebar-account-toggle');
  if(!footer||!btn) return;
  if(!footer.contains(e.target)){
    footer.classList.remove('account-open');
    btn.setAttribute('aria-expanded','false');
  }
});

(function(){
  if(window.__egitimMehmetAiV13) return;
  window.__egitimMehmetAiV13=true;

  let lessonAiLessonId=null;
  let lessonAiSessionId=null;
  let lessonAiMessages=[];
  let lessonAiBusy=false;
  let lessonAiDocState='';

  function safeHtml(value){
    if(typeof escHtml==='function') return escHtml(value);
    return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function richInline(text){
    return safeHtml(text)
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/~~(.+?)~~/g,'<s>$1</s>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  }
  function isRichHeading(line){
    const trimmed=String(line||'').trim();
    if(!trimmed) return false;
    if(/^#{1,3}\s+/.test(trimmed)) return true;
    if(trimmed.endsWith(':')) return true;
    return false;
  }
  function renderRichLessonText(text){
    const lines=String(text||'').replace(/\r\n/g,'\n').split('\n');
    const parts=[];
    for(let i=0;i<lines.length;i++){
      const line=lines[i].trim();
      if(!line) continue;
      if(/^-{3,}$/.test(line)){
        parts.push('<hr class="eg-rich-divider">');
        continue;
      }
      const img=line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if(img){
        const alt=safeHtml(img[1]||'Ders görseli');
        const src=safeHtml(img[2]||'');
        parts.push(`<figure class="eg-rich-image"><img src="${src}" alt="${alt}"><figcaption>${alt}</figcaption></figure>`);
        continue;
      }
      if(/^[•*-]\s+/.test(line)){
        const items=[];
        while(i<lines.length && /^[•*-]\s+/.test(lines[i].trim())){
          items.push(`<li>${richInline(lines[i].trim().replace(/^[•*-]\s+/,''))}</li>`);
          i++;
        }
        i--;
        parts.push(`<ul class="eg-rich-list">${items.join('')}</ul>`);
        continue;
      }
      if(isRichHeading(line)){
        parts.push(`<div class="eg-rich-heading">${richInline(line.replace(/^#{1,3}\s+/,''))}</div>`);
      }else if(/^https?:\/\//i.test(line)){
        const href=safeHtml(line);
        parts.push(`<p class="eg-rich-link"><a href="${href}" target="_blank">${href}</a></p>`);
      }else{
        parts.push(`<p>${richInline(line)}</p>`);
      }
    }
    return `<div class="eg-rich-content">${parts.join('')}</div>`;
  }
  function getLessons(){ return window.egitimLessons || (typeof egitimLessons!=='undefined'?egitimLessons:[]); }
  function getTopics(){ return window.egitimTopics || (typeof egitimTopics!=='undefined'?egitimTopics:[]); }
  function getModules(){ return window.egitimModules || (typeof egitimModules!=='undefined'?egitimModules:[]); }
  function getLesson(id){ return getLessons().find(x=>String(x.id)===String(id)); }
  function getLessonContext(lesson){
    const topic=getTopics().find(t=>String(t.id)===String(lesson.topic_id));
    const module=topic?getModules().find(m=>String(m.id)===String(topic.module_id)):null;
    return {topic,module};
  }
  function cleanAiText(text){
    let t=String(text||'');
    if(typeof cleanAssistantText==='function') t=cleanAssistantText(t);
    t=t.replace(/^#{1,6}\s*/gm,'').replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/^\s*[-*]\s+/gm,'- ');
    return t.trim();
  }
  function youtubeEmbedUrl(rawUrl){
    const raw=String(rawUrl||'').trim();
    if(!raw) return '';
    let id='';
    let list='';
    let startSeconds='';
    try{
      const u=new URL(raw);
      const host=u.hostname.replace(/^www\./,'').replace(/^m\./,'');
      if(host==='youtu.be') id=u.pathname.split('/').filter(Boolean)[0]||'';
      else if(host.endsWith('youtube.com')||host.endsWith('youtube-nocookie.com')){
        if(u.pathname.startsWith('/watch')) id=u.searchParams.get('v')||'';
        else if(u.pathname.startsWith('/embed/')) id=u.pathname.split('/').filter(Boolean)[1]||'';
        else if(u.pathname.startsWith('/shorts/')||u.pathname.startsWith('/live/')) id=u.pathname.split('/').filter(Boolean)[1]||'';
      }
      list=u.searchParams.get('list')||'';
      const start=u.searchParams.get('start') || u.searchParams.get('t') || '';
      startSeconds=start ? String(start).replace(/s$/,'') : '';
    }catch(e){}
    if(!id){
      const fallback=raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{6,})/);
      if(fallback) id=fallback[1];
    }
    if(id){
      const qs=new URLSearchParams({rel:'0',modestbranding:'1',playsinline:'1'});
      if(location.protocol.startsWith('http')) qs.set('origin',location.origin);
      if(list) qs.set('list',list);
      if(startSeconds && /^\d+$/.test(startSeconds)) qs.set('start',startSeconds);
      return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${qs.toString()}`;
    }
    return '';
  }
  function youtubeWatchUrl(rawUrl){
    const embed=youtubeEmbedUrl(rawUrl);
    const id=(embed.match(/\/embed\/([^?]+)/)||[])[1];
    return id ? `https://www.youtube.com/watch?v=${decodeURIComponent(id)}` : rawUrl;
  }
  function videoHtml(lesson){
    const url=(lesson.video_url||'').trim();
    if(!url) return '';
    const safe=safeHtml(url);
    const wistia=url.match(/wistia\.(?:com|net)\/(?:medias|embed\/iframe)\/([a-zA-Z0-9]+)/);
    if(wistia) return `<iframe src="https://fast.wistia.net/embed/iframe/${wistia[1]}?playerColor=f6934d&videoFoam=false" allowfullscreen allowtransparency style="width:100%;height:100%;border:0;display:block;background:#000"></iframe>`;
    if(url.includes('vimeo.com')){
      const id=url.split('/').filter(Boolean).pop();
      return `<iframe src="https://player.vimeo.com/video/${safeHtml(id)}" allowfullscreen></iframe>`;
    }
    const youtubeSrc=youtubeEmbedUrl(url);
    if(youtubeSrc){
      if(location.protocol==='file:'){
        const localUrl='http://localhost:8765/adminpage-seviye0-guncel.html';
        return `<div class="eg-youtube-file-fallback">
          <strong>YouTube videosunu oynatmak için sayfayı yerel sunucuda aç</strong>
          <span>Chrome, bazı YouTube embed videolarını file:// üzerinden engelliyor.</span>
          <div class="eg-youtube-actions">
            <a href="${safeHtml(localUrl)}">Yerel sunucuda aç</a>
            <a href="${safeHtml(youtubeWatchUrl(url))}" target="_blank" rel="noopener noreferrer">YouTube'da izle</a>
          </div>
        </div>`;
      }
      return `<iframe src="${safeHtml(youtubeSrc)}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }
    return `<video src="${safe}" controls></video>`;
  }
  function adminActions(lesson){
    if(!(typeof egitimIsAdmin==='function'&&egitimIsAdmin())) return '';
    return `<div class="ec-admin-actions" style="margin-left:auto">
      <button class="ec-admin-btn" title="Dersi düzenle" onclick="openEgitimDersModal(${lesson.topic_id},${lesson.id})">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2l3 3-8 8H3v-3z"/></svg>
      </button>
      <button class="ec-admin-btn red" title="Dersi sil" onclick="deleteEgitimDers(${lesson.id})">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9"/></svg>
      </button>
    </div>`;
  }
  function renderLesson(lessonId){
    const lesson=getLesson(lessonId);
    const panel=document.getElementById('egitim-content-panel');
    if(!lesson||!panel) return;
    const ctx=getLessonContext(lesson);
    const resourceCount=lesson.resource_url?1:0;
    const transcriptText=(lesson.description||'').trim();
    const videoBlock=(lesson.video_url||'').trim()
      ? `<div class="eg-video-card"><div class="eg-video-frame">${videoHtml(lesson)}</div></div>`
      : '';
    const contentBlock=transcriptText
      ? `<details class="eg-acc" open>
          <summary><span class="eg-chevron">›</span><span>İçerik</span><span class="eg-ready">Hazır</span></summary>
          <div class="eg-acc-body">${renderRichLessonText(transcriptText)}</div>
        </details>`
      : '';
    const resourcesBlock=lesson.resource_url
      ? `<details class="eg-acc" open>
          <summary><span class="eg-chevron">›</span><span>Kaynaklar</span><span class="eg-ready">Kaynak mevcut</span></summary>
          <div class="eg-acc-body" style="white-space:normal">
            <a class="eg-resource-item" href="${safeHtml(lesson.resource_url)}" target="_blank" rel="noopener noreferrer"><span>Kaynaklar & Şablonlar</span><span>→</span></a>
          </div>
        </details>`
      : '';
    panel.innerHTML=`
      <div class="eg-lesson-page">
        <div class="eg-lesson-topbar">
          <button type="button" class="eg-back-btn" onclick="egitimCurrentLesson=null;renderEgitimNav(egitimCurrentModule);renderEgitimModuleIntro(egitimCurrentModule)">← Sınıfa dön</button>
          <div class="eg-lesson-title-line">${safeHtml(ctx.module?.title||'Dersler')}</div>
          ${adminActions(lesson)}
        </div>
        <div class="eg-current-lesson-head">
          <div>${safeHtml(ctx.topic?.title||ctx.module?.title||'Ders')}</div>
          <h1>${safeHtml(lesson.title||'Ders')}</h1>
        </div>
        ${videoBlock}
        <div class="eg-content-meta">
          <button type="button" class="eg-ai-button" onclick="openLessonMehmetAi(${lesson.id})">
            <span>▣</span><span>Mehmet AI'ya bu dersi sor</span>
          </button>
        </div>
        <div class="eg-accordion-stack">
          ${contentBlock}
          ${resourcesBlock}
        </div>
      </div>
      <div id="lesson-ai-root"></div>`;
  }
  window.renderEgitimLessonContent=renderLesson;

  function renderLessonAi(){
    const lesson=getLesson(lessonAiLessonId);
    const root=document.getElementById('lesson-ai-root')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'lesson-ai-root'}));
    if(!lesson){ root.innerHTML=''; return; }
    const uploadControls=(typeof egitimIsAdmin==='function'&&egitimIsAdmin())?`
      <div class="eg-ai-doc-row">
        <button class="eg-ai-doc-btn" type="button" onclick="document.getElementById('lesson-ai-doc-input')?.click()">Doküman yükle</button>
        <span class="eg-ai-doc-state">${safeHtml(lessonAiDocState||'Bu dersin Mehmet AI dokümanları')}</span>
        <input id="lesson-ai-doc-input" type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" style="display:none" onchange="lessonAiUploadDocument(this)">
      </div>`:'';
    const messages=lessonAiMessages.length?lessonAiMessages.map(m=>`<div class="eg-ai-bubble ${m.role==='user'?'user':'assistant'}">${safeHtml(m.text)}</div>`).join(''):`<div class="eg-ai-empty">Mehmet AI'ya sadece bu dersin dokümanlarına göre soru sor.</div>`;
    root.innerHTML=`
      <div class="eg-ai-backdrop" onclick="closeLessonMehmetAi()"></div>
      <aside class="eg-ai-drawer" aria-label="Mehmet AI">
        <div class="eg-ai-head">
          <div class="eg-ai-avatar">AI</div>
          <div style="min-width:0">
            <div class="eg-ai-title">Mehmet AI</div>
            <div class="eg-ai-subtitle">${safeHtml(lesson.title)}</div>
          </div>
          <button class="eg-ai-close" type="button" onclick="closeLessonMehmetAi()">×</button>
        </div>
        <div class="eg-ai-messages" id="lesson-ai-messages">
          ${messages}
          ${lessonAiBusy?`<div class="eg-ai-bubble assistant"><span class="eg-ai-typing"><i></i><i></i><i></i></span></div>`:''}
        </div>
        <div class="eg-ai-foot">
          ${uploadControls}
          <div class="eg-ai-inputbar">
            <textarea id="lesson-ai-input" placeholder="Bu ders hakkında sor..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();lessonAiSend();}"></textarea>
            <button class="eg-ai-send" type="button" onclick="lessonAiSend()" ${lessonAiBusy?'disabled':''}>↑</button>
          </div>
        </div>
      </aside>`;
    setTimeout(()=>{
      const box=document.getElementById('lesson-ai-messages');
      if(box) box.scrollTop=box.scrollHeight;
      const input=document.getElementById('lesson-ai-input');
      if(input&&!lessonAiBusy) input.focus();
    },0);
  }
  window.openLessonMehmetAi=function(lessonId){
    lessonAiLessonId=lessonId;
    lessonAiSessionId=lessonAiSessionId||('lesson-'+lessonId+'-'+Date.now());
    lessonAiMessages=[];
    lessonAiDocState='';
    lessonAiBusy=false;
    renderLessonAi();
  };
  window.closeLessonMehmetAi=function(){
    const root=document.getElementById('lesson-ai-root');
    if(root) root.innerHTML='';
  };

  async function ensureLessonAiBot(lessonId){
    const lesson=getLesson(lessonId);
    if(!lesson) throw new Error('Ders bulunamadı.');
    const key='lessonAi.chatbotId.'+lessonId;
    const cached=localStorage.getItem(key);
    if(cached) return cached;
    const name='Mehmet AI - Ders '+lessonId;
    const db=window.sb || (typeof sb!=='undefined'?sb:null);
    if(!db) throw new Error('Supabase bağlantısı bulunamadı.');
    try{
      const existing=await db.from('chatbots').select('id').eq('name',name).limit(1);
      if(existing.data&&existing.data[0]&&existing.data[0].id){
        localStorage.setItem(key,existing.data[0].id);
        return existing.data[0].id;
      }
    }catch(e){  }
    const systemPrompt=[
      'Sen Mehmet AI adında ders içi yardımcı asistansın.',
      'Sadece bu derse yüklenen dokümanlara ve transkript/kaynak bağlamına dayanarak cevap ver.',
      'Cevap dokümanlarda yoksa bunu kısa ve net söyle; tahmin üretme.',
      'Günlük mesajlaşma gibi doğal yaz. Markdown başlıkları, yıldızlı kalın yazılar ve yapay hissettiren emojiler kullanma.'
    ].join(' ');
    const payload={
      name,
      description:(lesson.title||'Ders')+' için Mehmet AI',
      system_prompt:systemPrompt,
      avatar_emoji:'AI',
      starter_questions:[],
      categories:['Dersler','Mehmet AI'],
      is_active:false,
      status:'lesson_ai'
    };
    const variants=[
      payload,
      {name,description:payload.description,system_prompt:systemPrompt,starter_questions:[],categories:['Dersler','Mehmet AI'],is_active:false},
      {name,description:payload.description,system_prompt:systemPrompt,is_active:false},
      {name,description:payload.description,system_prompt:systemPrompt}
    ];
    let lastError=null;
    for(const item of variants){
      const inserted=await db.from('chatbots').insert(item).select('id').single();
      if(!inserted.error&&inserted.data&&inserted.data.id){
        localStorage.setItem(key,inserted.data.id);
        return inserted.data.id;
      }
      lastError=inserted.error;
    }
    throw lastError || new Error('Mehmet AI kaydı oluşturulamadı.');
  }
  async function ensurePdf(){
    if(window.pdfjsLib) return window.pdfjsLib;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload=resolve;
      s.onerror=reject;
      document.head.appendChild(s);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return window.pdfjsLib;
  }
  async function readLessonAiFile(file){
    if(!file) return '';
    const isPdf=file.type==='application/pdf'||/\.pdf$/i.test(file.name);
    if(!isPdf) return await file.text();
    const pdfjs=await ensurePdf();
    const buffer=await file.arrayBuffer();
    const pdf=await pdfjs.getDocument({data:buffer}).promise;
    const pages=[];
    for(let p=1;p<=pdf.numPages;p++){
      const page=await pdf.getPage(p);
      const content=await page.getTextContent();
      pages.push(content.items.map(item=>item.str).join(' '));
    }
    return pages.join('\n\n');
  }
  window.lessonAiUploadDocument=async function(input){
    const file=input&&input.files&&input.files[0];
    if(!file||!lessonAiLessonId) return;
    lessonAiDocState='Yükleniyor: '+file.name;
    renderLessonAi();
    try{
      const chatbotId=await ensureLessonAiBot(lessonAiLessonId);
      const content=(await readLessonAiFile(file)).trim();
      if(!content) throw new Error('Belgeden okunabilir metin çıkmadı.');
      const fn=window.CHATBOT_INGEST_FN || (typeof CHATBOT_INGEST_FN!=='undefined'?CHATBOT_INGEST_FN:null);
      if(!fn) throw new Error('chatbot-ingest fonksiyonu bulunamadı.');
      const res=await fetch(fn,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_ANON_KEY},
        body:JSON.stringify({chatbot_id:chatbotId,filename:file.name,content})
      });
      const json=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(json.error||'Doküman kaydedilemedi.');
      lessonAiDocState='Yüklendi: '+file.name;
    }catch(err){
      lessonAiDocState='Yüklenemedi: '+(err.message||err);
    }
    renderLessonAi();
  };
  window.lessonAiSend=async function(){
    const input=document.getElementById('lesson-ai-input');
    const message=(input?.value||'').trim();
    if(!message||lessonAiBusy||!lessonAiLessonId) return;
    if(input) input.value='';
    lessonAiMessages.push({role:'user',text:message});
    lessonAiBusy=true;
    renderLessonAi();
    try{
      const chatbotId=await ensureLessonAiBot(lessonAiLessonId);
      const fn=window.CHATBOT_CHAT_FN || (typeof CHATBOT_CHAT_FN!=='undefined'?CHATBOT_CHAT_FN:null);
      if(!fn) throw new Error('chatbot-chat fonksiyonu bulunamadı.');
      const userId=(window.currentUser&&window.currentUser.id) || (typeof currentUser!=='undefined'&&currentUser?currentUser.id:null);
      const res=await fetch(fn,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_ANON_KEY},
        body:JSON.stringify({chatbot_id:chatbotId,session_id:lessonAiSessionId,user_id:userId,message:(window.withJourneyContext?window.withJourneyContext(message):message),journey_context:(window.getJourneyContext?window.getJourneyContext():'')})
      });
      const json=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(json.error||'Cevap alınamadı.');
      lessonAiMessages.push({role:'assistant',text:cleanAiText(json.answer||json.reply||json.message||'Bu soruya yanıt bulamadım.')});
    }catch(err){
      lessonAiMessages.push({role:'assistant',text:'Şu an cevap alamadım. Dokümanın yüklü olduğundan ve chatbot fonksiyonunun çalıştığından emin olalım.'});
    }finally{
      lessonAiBusy=false;
      renderLessonAi();
    }
  };
})();

(function(){
  if(window.__egitimLessonApprovalGateV1) return;
  window.__egitimLessonApprovalGateV1=true;

  const oldLoadEgitim=window.loadEgitim;
  const oldRenderLesson=window.renderEgitimLessonContent;
  const oldRenderIntro=window.renderEgitimModuleIntro;
  let progressLoaded=false;
  let progressLoading=false;
  let lessonProgress={};

  function h(value){
    if(typeof escHtml==='function') return escHtml(value);
    return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function isAdmin(){ return typeof egitimIsAdmin==='function' && egitimIsAdmin(); }
  function activeUser(){ return (typeof currentUser!=='undefined' && currentUser) ? currentUser : (window.currentUser||null); }
  function allOpen(){ return typeof egitimAllModulesUnlocked==='function' && egitimAllModulesUnlocked(); }
  function needsLevelApproval(){ return typeof egitimNeedsLevelApproval==='function' && egitimNeedsLevelApproval(); }
  function needsModuleApproval(moduleId){ return typeof egitimNeedsModuleApproval==='function' ? egitimNeedsModuleApproval(moduleId) : needsLevelApproval(); }
  function userKey(){ return (activeUser()?.email || 'anon').toLowerCase(); }
  function storageKey(){ return 'egitim.lesson.progress.v1.' + userKey(); }
  function readLocalProgress(){
    try{return JSON.parse(localStorage.getItem(storageKey())||'{}')||{};}catch(e){return {};}
  }
  function writeLocalProgress(){
    try{localStorage.setItem(storageKey(),JSON.stringify(lessonProgress));}catch(e){}
  }
  function lessonProgressKey(lessonId){ return 'lesson:' + String(lessonId); }
  function moduleLevelNum(moduleId){
    const m=(window.egitimModules||egitimModules||[]).find(x=>String(x.id)===String(moduleId));
    const title=String(m?.title||'');
    const match=title.match(/(?:seviye|level)\s*(\d+)/i) || title.match(/\b(\d+)\b/);
    if(match) return Number(match[1]);
    return Number(m?.order_index||0);
  }
  async function loadTrainingProgressFallback(){
    if(!window.sb || !activeUser()?.email) return;
    try{
      const res=await sb.from('training_progress')
        .select('level_num,modules_done')
        .eq('user_id',activeUser().email);
      if(res.error || !Array.isArray(res.data)) return;
      res.data.forEach(row=>{
        (row.modules_done||[]).forEach(key=>{
          const m=String(key).match(/^lesson:(.+)$/);
          if(m) lessonProgress[String(m[1])]='done';
        });
      });
      writeLocalProgress();
    }catch(e){}
  }
  async function saveTrainingProgressFallback(lessonId){
    if(!window.sb || !activeUser()?.email) return false;
    const lesson=(window.egitimLessons||egitimLessons||[]).find(l=>String(l.id)===String(lessonId));
    const topic=lesson ? (window.egitimTopics||egitimTopics||[]).find(t=>String(t.id)===String(lesson.topic_id)) : null;
    const levelNum=moduleLevelNum(topic?.module_id||egitimCurrentModule);
    const key=lessonProgressKey(lessonId);
    try{
      const existing=await sb.from('training_progress')
        .select('id,modules_done')
        .eq('user_id',activeUser().email)
        .eq('level_num',levelNum)
        .maybeSingle();
      if(existing.error && existing.error.code!=='PGRST116') return false;
      if(existing.data?.id){
        const done=Array.from(new Set([...(existing.data.modules_done||[]).map(String),key]));
        const updated=await sb.from('training_progress')
          .update({modules_done:done,status:'in_progress',updated_at:new Date().toISOString()})
          .eq('id',existing.data.id);
        return !updated.error;
      }
      const inserted=await sb.from('training_progress').insert({
        user_id:activeUser().email,
        level_num:levelNum,
        modules_done:[key],
        quiz_done:false,
        status:'in_progress',
        updated_at:new Date().toISOString()
      });
      return !inserted.error;
    }catch(e){
      return false;
    }
  }
  async function loadLessonProgress(){
    if(progressLoaded || progressLoading || isAdmin()) return;
    progressLoading=true;
    lessonProgress=readLocalProgress();
    try{
      if(window.sb && activeUser()?.email){
        const res=await sb.from('training_lesson_progress').select('lesson_id,status,completed_at').eq('user_id',activeUser().email);
        if(!res.error && Array.isArray(res.data)){
          res.data.forEach(r=>{ if(r.status==='done' || r.completed_at) lessonProgress[String(r.lesson_id)]='done'; });
          writeLocalProgress();
        }
      }
    }catch(e){}
    await loadTrainingProgressFallback();
    progressLoaded=true;
    progressLoading=false;
  }
  function topicsForModule(moduleId){
    return (window.egitimTopics||egitimTopics||[])
      .filter(t=>String(t.module_id)===String(moduleId) && (isAdmin() || t.is_visible!==false))
      .sort((a,b)=>(a.order_index||0)-(b.order_index||0));
  }
  function lessonsForTopic(topicId){
    return (window.egitimLessons||egitimLessons||[])
      .filter(l=>String(l.topic_id)===String(topicId) && (isAdmin() || l.is_visible!==false))
      .sort((a,b)=>(a.order_index||0)-(b.order_index||0));
  }
  function orderedLessonsForModule(moduleId){
    return topicsForModule(moduleId).flatMap(t=>lessonsForTopic(t.id));
  }
  function isLessonDone(id){ return lessonProgress[String(id)]==='done'; }
  function moduleLessonsDone(moduleId){
    const all=orderedLessonsForModule(moduleId);
    return !!all.length && all.every(l=>isLessonDone(l.id));
  }
  function currentSubmission(moduleId){
    const email=activeUser()?.email;
    if(typeof egitimLatestSubmissionForModule==='function') return egitimLatestSubmissionForModule(moduleId, email);
    return (window.egitimSubs||egitimSubs||[]).find(s=>String(s.module_id)===String(moduleId) && String(s.user_id).toLowerCase()===String(email||'').toLowerCase());
  }
  function lessonIndexInModule(lessonId){
    const all=orderedLessonsForModule(egitimCurrentModule);
    return all.findIndex(l=>String(l.id)===String(lessonId));
  }
  function canOpenLesson(lessonId){
    if(isAdmin() || allOpen()) return true;
    const all=orderedLessonsForModule(egitimCurrentModule);
    const idx=all.findIndex(l=>String(l.id)===String(lessonId));
    if(idx<=0) return true;
    return isLessonDone(all[idx-1].id);
  }
  function moduleProgress(moduleId){
    const all=orderedLessonsForModule(moduleId);
    if(!all.length) return 0;
    const done=all.filter(l=>isLessonDone(l.id)).length;
    return Math.round((done/all.length)*100);
  }
  function topicProgress(topicId){
    const all=lessonsForTopic(topicId);
    const done=all.filter(l=>isLessonDone(l.id)).length;
    const pct=all.length ? Math.round((done/all.length)*100) : 0;
    return {done,total:all.length,pct};
  }
  function lessonTopic(lessonId){
    const lesson=(window.egitimLessons||egitimLessons||[]).find(l=>String(l.id)===String(lessonId));
    return lesson ? (window.egitimTopics||egitimTopics||[]).find(t=>String(t.id)===String(lesson.topic_id)) : null;
  }
  window.egitimMarkLessonDone=async function(lessonId){
    if(isAdmin()) return;
    const all=orderedLessonsForModule(egitimCurrentModule);
    const idx=all.findIndex(l=>String(l.id)===String(lessonId));
    const isLast=idx>=0 && idx===all.length-1;
    lessonProgress[String(lessonId)]='done';
    writeLocalProgress();
    try{
      if(window.sb && activeUser()?.email){
        const direct=await sb.from('training_lesson_progress').upsert({
          user_id:activeUser().email,
          lesson_id:lessonId,
          status:'done',
          completed_at:new Date().toISOString(),
          updated_at:new Date().toISOString()
        },{onConflict:'user_id,lesson_id'});
        if(direct.error) await saveTrainingProgressFallback(lessonId);
      }
    }catch(e){ await saveTrainingProgressFallback(lessonId); }
    renderEgitimNav(egitimCurrentModule);
    renderEgitimLessonContent(lessonId);
    if(needsModuleApproval(egitimCurrentModule) && isLast && !currentSubmission(egitimCurrentModule) && typeof openEgitimForm==='function'){
      openEgitimForm(egitimCurrentModule);
    }
  };
  window.egitimSelectLesson=function(lessonId){
    if(!canOpenLesson(lessonId)){
      alert('Bu ders için önceki dersi tamamlamanız gerekiyor.');
      return;
    }
    egitimCurrentLesson=lessonId;
    renderEgitimNav(egitimCurrentModule);
    renderEgitimLessonContent(lessonId);
  };
  window.renderEgitimNav=function(moduleId){
    if(!isAdmin() && !progressLoaded && !progressLoading) loadLessonProgress().then(()=>{ if(egitimCurrentModule===moduleId) window.renderEgitimNav(moduleId); });
    const m=(window.egitimModules||egitimModules||[]).find(x=>String(x.id)===String(moduleId));
    const topics=topicsForModule(moduleId);
    const progressPct=isAdmin()?0:moduleProgress(moduleId);
    const chevronSvg=`<svg class="ec-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>`;
    const gripSvg=`<svg width="9" height="13" viewBox="0 0 9 13" fill="rgba(33,26,20,.35)"><circle cx="2.5" cy="2" r="1.2"/><circle cx="6.5" cy="2" r="1.2"/><circle cx="2.5" cy="6.5" r="1.2"/><circle cx="6.5" cy="6.5" r="1.2"/><circle cx="2.5" cy="11" r="1.2"/><circle cx="6.5" cy="11" r="1.2"/></svg>`;
    let html=`<div class="ec-nav-header">
      <button class="ec-back-btn" onclick="egitimShowGrid()">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 3L5 8l5 5"/></svg> Dersler
      </button>
      <div class="ec-module-title">${h(m?.title||'')}</div>
      <div class="ec-progress-label">${isAdmin()?'Admin görünümü':progressPct+'% tamamlandı'}</div>
      <div class="ec-progress-track"><div class="ec-progress-fill" style="width:${isAdmin()?0:progressPct}%"></div></div>
    </div><div class="ec-nav-body">`;

    topics.forEach((t,tIdx)=>{
      const lessons=lessonsForTopic(t.id);
      const tProg=topicProgress(t.id);
      const topicDrag=isAdmin()?`draggable="true" ondragstart="egitimTopicDragStart(event,${t.id})" ondragover="event.preventDefault();this.querySelector('.ec-section-hd').classList.add('drag-over')" ondragleave="this.querySelector('.ec-section-hd').classList.remove('drag-over')" ondrop="egitimTopicDrop(event,${t.id})" ondragend="egitimTopicDragEnd(event)"`:'';
      const topicVis=isAdmin()?`<button type="button" class="eg-vis-dot ${t.is_visible===false?'hidden':'visible'}" title="${t.is_visible===false?'Gizli':'Görünür'}" aria-label="${t.is_visible===false?'Gizli':'Görünür'}"></button>`:`<span class="eg-topic-progress">${tProg.pct}%</span>`;
      const adminTopicBtns=isAdmin()?`<div class="ec-section-admin" style="display:flex;gap:3px;align-items:center;margin-left:4px" onclick="event.stopPropagation()">
        <span style="cursor:grab;line-height:0;margin-right:2px">${gripSvg}</span>
        <button onclick="openEgitimDersModal(${t.id})" class="eg-pill-btn">+ ders</button>
        <button onclick="openEgitimKonuModal(${moduleId},${t.id})" class="eg-pill-btn">duzenle</button>
        <button onclick="deleteEgitimKonu(${t.id})" class="eg-pill-btn red">sil</button>
      </div>`:'';
      html+=`<div class="ec-section" data-open="true" ${topicDrag}>
        <div class="ec-section-hd" onclick="toggleEcSection(this)">
          <span class="ec-section-num">${tIdx+1}.</span>
          <span class="ec-section-name">${h(t.title)}</span>
          ${topicVis}
          ${chevronSvg}
          ${adminTopicBtns}
        </div><div class="ec-section-body">`;
      lessons.forEach(l=>{
        const active=String(egitimCurrentLesson)===String(l.id);
        const done=isLessonDone(l.id);
        const locked=!canOpenLesson(l.id);
        const statusIcon=isAdmin()
          ? `<button type="button" class="eg-vis-dot ${l.is_visible===false?'hidden':'visible'}" title="${l.is_visible===false?'Gizli':'Görünür'}" aria-label="${l.is_visible===false?'Gizli':'Görünür'}"></button>`
          : done ? `<span class="eg-lesson-status done">✓</span>` : locked ? `<span class="eg-lesson-status locked">⌕</span>` : `<span class="eg-lesson-status open">○</span>`;
        const lessonDrag=isAdmin()?`draggable="true" ondragstart="egitimLessonDragStart(event,${l.id})" ondragover="event.preventDefault();event.stopPropagation();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="egitimLessonDrop(event,${l.id})"`:'';
        const adminDersBtns=isAdmin()?`<span style="display:flex;gap:3px;flex-shrink:0" onclick="event.stopPropagation()">
          <button onclick="openEgitimDersModal(${t.id},${l.id})" class="eg-pill-btn">duzenle</button>
          <button onclick="deleteEgitimDers(${l.id})" class="eg-pill-btn red">sil</button>
        </span>`:'';
        html+=`<div class="ec-lesson-row${active?' active':''}${locked?' locked':''}${done?' done':''}" onclick="if(!window._egitimDragging)egitimSelectLesson(${l.id})" ${lessonDrag} ondragend="window._egitimDragging=false">
          <span class="ec-lesson-name">${h(l.title)}</span>
          ${statusIcon}
          ${adminDersBtns}
        </div>`;
      });
      if(!lessons.length && isAdmin()) html+=`<div style="padding:5px 32px;font-size:11px;color:rgba(33,26,20,.35);font-style:italic">Ders yok</div>`;
      html+=`</div></div>`;
    });
    if(!topics.length) html+=`<div style="padding:18px 18px;font-size:12px;color:rgba(33,26,20,.4)">${isAdmin()?'Aşağıdan bölüm ekle':'İçerik yükleniyor...'}</div>`;
    html+='</div>';
    if(isAdmin()){
      html+=`<div class="ec-nav-admin">
        <button onclick="openEgitimKonuModal(${moduleId})" class="ec-add-btn">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg> Bolum Ekle
        </button>
        <button onclick="openEgitimModulModal(${moduleId})" class="ec-add-btn">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2H5a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2z"/><path d="M8 7v4M6 9h4"/></svg> Modulu Duzenle
        </button>
      </div>`;
    }
    document.getElementById('egitim-nav-panel').innerHTML=html;
  };
  window.renderEgitimLessonContent=function(lessonId){
    oldRenderLesson(lessonId);
    const panel=document.getElementById('egitim-content-panel');
    const lesson=(window.egitimLessons||egitimLessons||[]).find(l=>String(l.id)===String(lessonId));
    if(!panel||!lesson) return;
    if(!isAdmin() && !needsModuleApproval(egitimCurrentModule)) return;
    const done=isLessonDone(lessonId);
    const idx=lessonIndexInModule(lessonId);
    const all=orderedLessonsForModule(egitimCurrentModule);
    const next=all[idx+1];
    const isLast=idx>=0 && idx===all.length-1;
    const topic=lessonTopic(lessonId);
    const progress=topic ? topicProgress(topic.id) : {done:0,total:0,pct:0};
    const sub=currentSubmission(egitimCurrentModule);
    const progressHtml=`<div class="eg-approve-progress"><div><span>Bölüm ilerlemesi</span><b>${progress.done}/${progress.total} ders · ${progress.pct}%</b></div><i><em style="width:${progress.pct}%"></em></i></div>`;
    const html=isAdmin()
      ? `<div class="eg-approve-card admin-preview"><div><strong>Kullanıcı tamamlama alanı</strong><span>Kullanıcılar bu dersi inceledikten sonra burada onay verir. Admin görünümünde buton pasiftir.</span></div><button type="button" class="eg-approve-btn admin-preview" disabled>Kullanıcıda aktif</button></div>`
      : sub?.status==='incelemede'
      ? `<div class="eg-approve-card"><div><strong>Kontrol formu gönderildi</strong><span>Bu seviyenin formu admine düştü, inceleniyor.</span>${progressHtml}</div><button type="button" class="eg-approve-btn admin-preview" disabled>İncelemede</button></div>`
      : sub?.status==='revize'
      ? `<div class="eg-approve-card"><div><strong>Revize gerekiyor</strong><span>${h(sub.admin_note||'Formu güncelleyip tekrar gönderebilirsin.')}</span>${progressHtml}</div><button type="button" class="eg-approve-btn" onclick="openEgitimForm(${egitimCurrentModule})">Tekrar gönder</button></div>`
      : done
      ? `<div class="eg-approve-card done"><div><strong>Ders onaylandı</strong><span>${isLast?'Bu seviyenin kontrol formunu doldurabilirsin.':"Bu dersi tamamladın. Sıradaki derse geçebilirsin."}</span>${progressHtml}</div>${isLast?`<button type="button" class="eg-approve-btn" onclick="openEgitimForm(${egitimCurrentModule})">Kontrol formunu doldur</button>`:`<button type="button" class="eg-approve-btn done" disabled>✓ Tamamlandı</button>`}</div>`
      : `<div class="eg-approve-card"><div><strong>${isLast?'Son ders kontrolü':'Dersi bitirdin mi?'}</strong><span>${isLast?'Bu dersi onaylayınca seviye kontrol formu açılacak.':'Devam etmek için bu dersi incelediğini onayla.'}</span>${progressHtml}</div><button type="button" class="eg-approve-btn" onclick="egitimMarkLessonDone(${lesson.id})">${isLast?'Dersi tamamla ve forma geç':'Dersi tamamladım'}</button></div>`;
    const stack=panel.querySelector('.eg-accordion-stack');
    if(stack) stack.insertAdjacentHTML('beforebegin',html);
  };
  window.renderEgitimModuleIntro=function(moduleId){
    if(oldRenderIntro) oldRenderIntro(moduleId);
    if(isAdmin() || !needsModuleApproval(moduleId)) return;
    const panel=document.getElementById('egitim-content-panel');
    const m=(window.egitimModules||egitimModules||[]).find(x=>String(x.id)===String(moduleId));
    if(!panel || !m) return;
    const sub=currentSubmission(moduleId);
    const done=moduleLessonsDone(moduleId);
    const statusHtml=sub?.status==='incelemede'
      ? `<div style="padding:14px 18px;background:rgba(224,165,83,0.08);border:1px solid rgba(224,165,83,0.2);border-radius:10px;font-size:13px;color:var(--color-amber);margin-top:24px">Formun gönderildi, admin inceliyor.</div>`
      : sub?.status==='revize'
      ? `<div style="margin-top:24px"><div style="padding:12px 16px;background:rgba(229,115,115,0.08);border-radius:10px;font-size:13px;color:#e57373;margin-bottom:12px">Revize gerekli${sub.admin_note?`: ${h(sub.admin_note)}`:''}</div><button class="btn btn-primary" onclick="openEgitimForm(${moduleId})">Tekrar Gönder</button></div>`
      : done
      ? `<button class="btn btn-primary" style="margin-top:24px" onclick="openEgitimForm(${moduleId})">Seviye Kontrol Formunu Doldur</button>`
      : `<div style="padding:14px 18px;background:rgba(224,165,83,0.08);border:1px solid rgba(224,165,83,0.18);border-radius:10px;font-size:13px;color:var(--color-amber);margin-top:24px">Seviye kontrol formu son dersi tamamladığında açılacak.</div>`;
    const card=panel.querySelector('.ec-content-card > div:last-child');
    if(card){
      const oldAction=card.querySelector('button.btn-primary, div[style*="margin-top:24px"], div[style*="Seviye kontrol"]');
      if(oldAction) oldAction.remove();
      card.insertAdjacentHTML('beforeend',statusHtml);
    }
  };
  window.loadEgitim=async function(){
    if(oldLoadEgitim) await oldLoadEgitim.apply(this,arguments);
    await loadLessonProgress();
    if(egitimCurrentModule) window.renderEgitimNav(egitimCurrentModule);
  };
})();

(function(){
  if(window.__egitimWistiaLoaderV19) return;
  window.__egitimWistiaLoaderV19=true;
  function ensureWistiaScript(){
    if(!document.querySelector('.eg-wistia-standard')) return;
    window._wq = window._wq || [];
    document.querySelectorAll('.eg-wistia-standard').forEach(el=>{
      const cls=[...el.classList].find(c=>c.startsWith('wistia_async_'));
      const id=cls ? cls.replace('wistia_async_','') : '';
      if(!id) return;
      window._wq.push({
        id,
        options:{
          seo:false,
          videoFoam:true,
          controlsVisibleOnLoad:true,
          playbar:true,
          playButton:true,
          smallPlayButton:true,
          volumeControl:true,
          fullscreenButton:true,
          settingsControl:true,
          playbackRateControl:true,
          playerColor:'f6934d'
        },
        onReady:function(video){
          try{
            video.bind('pause',function(){});
            video.bind('play',function(){});
          }catch(e){}
        }
      });
    });
    document.querySelectorAll('script[data-egitim-wistia-loader="true"]').forEach(s=>s.remove());
    const s=document.createElement('script');
    s.src='https://fast.wistia.net/assets/external/E-v1.js';
    s.async=true;
    s.setAttribute('data-egitim-wistia-loader','true');
    document.head.appendChild(s);
  }
  const oldRender=window.renderEgitimLessonContent;
  if(typeof oldRender==='function'){
    window.renderEgitimLessonContent=function(){
      const result=oldRender.apply(this,arguments);
      setTimeout(ensureWistiaScript,0);
      setTimeout(ensureWistiaScript,250);
      return result;
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensureWistiaScript);
  else ensureWistiaScript();
})();

(function(){
  if(window.__kisiselComingSectionForceV18) return;
  window.__kisiselComingSectionForceV18=true;

  function isSoonRow(row){
    const text=(row.textContent||'').toLocaleLowerCase('tr-TR');
    return row.classList.contains('coming-soon') || text.includes('yakında') || text.includes('üzerinde çalışıyoruz');
  }
  function forceComingSection(){
    const scroll=document.querySelector('#sanal-app .sanal-panel-scroll');
    if(!scroll) return;
    const labels=Array.from(scroll.querySelectorAll('.sanal-list-label'));
    const historyLabel=labels.find(el=>(el.textContent||'').toLocaleLowerCase('tr-TR').includes('yakın zamandakiler'));
    const oldSoonLabels=labels.filter(el=>el.classList.contains('sanal-soon-section-label') || (el.textContent||'').toLocaleLowerCase('tr-TR').includes('yakında geliyor'));
    oldSoonLabels.forEach(el=>el.remove());

    try{localStorage.removeItem('kisisel_baristan_status_overrides_v1');}catch(e){}
    const rows=Array.from(scroll.querySelectorAll('.sanal-bot-row')).filter(row=>!historyLabel || row.compareDocumentPosition(historyLabel)&Node.DOCUMENT_POSITION_FOLLOWING);
    if(!rows.length) return;
    const soonRows=rows.filter(row=>isSoonRow(row));
    const activeRows=rows.filter(row=>!soonRows.includes(row));
    if(!soonRows.length) return;

    soonRows.forEach(row=>{
      row.classList.add('coming-soon');
      const name=row.querySelector('.sanal-bot-name');
      if(name && !name.querySelector('.sanal-soon-badge')) name.insertAdjacentHTML('beforeend','<span class="sanal-soon-badge">Yakında</span>');
      const desc=row.querySelector('.sanal-bot-desc');
      if(desc) desc.textContent='Üzerinde çalışıyoruz';
    });

    const firstLabel=labels.find(el=>(el.textContent||'').toLocaleLowerCase('tr-TR').includes('baristalar'));
    if(firstLabel) firstLabel.textContent='BARİSTALAR '+activeRows.length;

    const soonLabel=document.createElement('div');
    soonLabel.className='sanal-list-label sanal-soon-section-label';
    soonLabel.textContent='YAKINDA GELİYOR '+soonRows.length;
    const anchor=historyLabel || null;
    scroll.insertBefore(soonLabel,anchor);
    soonRows.forEach(row=>scroll.insertBefore(row,anchor));
  }

  const oldRender=window.kisiselRender;
  if(typeof oldRender==='function'){
    window.kisiselRender=function(){
      const result=oldRender.apply(this,arguments);
      requestAnimationFrame(forceComingSection);
      setTimeout(forceComingSection,120);
      return result;
    };
  }
  document.addEventListener('click',function(e){
    const row=e.target.closest('#sanal-app .sanal-bot-row.coming-soon');
    if(row && !e.target.closest('.sanal-row-actions')){
      const id=row.dataset.botId;
      if(id && typeof window.kisiselOpenBot==='function'){ e.preventDefault(); window.kisiselOpenBot(id); }
    }
    if(e.target.closest('.sanal-bot-row, .nav-item, .sanal-new-btn')){
      setTimeout(forceComingSection,80);
    }
  },true);
  const observer=new MutationObserver(()=>requestAnimationFrame(forceComingSection));
  function start(){
    const root=document.getElementById('sanal-app');
    if(root) observer.observe(root,{childList:true,subtree:true,characterData:true});
    forceComingSection();
    setTimeout(forceComingSection,300);
    setTimeout(forceComingSection,900);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();

(function(){
  if(window.__kisiselRowActionFixV19) return;
  window.__kisiselRowActionFixV19=true;
  document.addEventListener('click',function(e){
    const btn=e.target.closest('#sanal-app .sanal-mini-btn[data-action]');
    if(!btn) return;
    const id=btn.dataset.botId || btn.closest('.sanal-bot-row')?.dataset.botId;
    if(!id) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if(btn.dataset.action==='edit' && typeof window.kisiselEditBot==='function') window.kisiselEditBot(id);
    if(btn.dataset.action==='delete' && typeof window.kisiselDeleteBot==='function') window.kisiselDeleteBot(id);
  },true);
})();

(function(){
  if(window.__kisiselRowActionFixV20) return;
  window.__kisiselRowActionFixV20=true;

  function parseIdFromOnclick(value){
    const match=String(value||'').match(/kisisel(?:Edit|Delete|Open)?Bot\(['"]([^'"]+)['"]\)/);
    return match ? match[1] : '';
  }
  function handleActionEvent(e){
    const btn=e.target.closest('#sanal-app .sanal-mini-btn, #sanal-app .sanal-row-actions button');
    if(!btn) return;
    const row=btn.closest('.sanal-bot-row');
    const action=btn.dataset.action || ((btn.title||btn.textContent||'').toLocaleLowerCase('tr-TR').includes('sil') || (btn.textContent||'').includes('×') ? 'delete' : 'edit');
    const id=btn.dataset.botId || row?.dataset.botId || parseIdFromOnclick(btn.getAttribute('onclick')) || parseIdFromOnclick(row?.getAttribute('onclick'));
    if(!id) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    setTimeout(function(){
      if(action==='delete' && typeof window.kisiselDeleteBot==='function') window.kisiselDeleteBot(id);
      else if(typeof window.kisiselEditBot==='function') window.kisiselEditBot(id);
    },0);
  }
  ['pointerdown','mousedown','click'].forEach(function(type){
    document.addEventListener(type,handleActionEvent,true);
  });
})();

(function(){
  if(window.__userDataIsolationV23) return;
  window.__userDataIsolationV23=true;

  function resetUserScopedState(){
    try{
      if(typeof state==='object'&&state){
        state.clients=[];
        state.leads=[];
        state.goals=[];
        state.milestones=[];
        state.daily=[];
        state.offers=[];
        state.ownClient=null;
        state.currentClientId=null;
        state.currentMsId=null;
        state.currentLeadId=null;
        state.currentGoalId=null;
      }
      window._editingDailyId=null;
      if(typeof igDailyFollowers!=='undefined') igDailyFollowers=0;
      if(typeof igDailyAdSpend!=='undefined') igDailyAdSpend=0;
      if(typeof igDailyCPF!=='undefined') igDailyCPF=0;
      if(typeof igAnSnaps!=='undefined') igAnSnaps=[];
      if(typeof igMedia!=='undefined') igMedia=[];
      if(typeof igAdsData!=='undefined') igAdsData=[];
      if(typeof igAdsSnaps!=='undefined') igAdsSnaps=[];
    }catch(e){
    }
  }

  const oldLoadFromSupabase=window.loadFromSupabase;
  if(typeof oldLoadFromSupabase==='function'){
    window.loadFromSupabase=async function(){
      resetUserScopedState();
      return oldLoadFromSupabase.apply(this,arguments);
    };
  }

  window.prefillTakipciFromIG=async function(){
    if(typeof igDailyFollowers!=='undefined') igDailyFollowers=0;
    if(typeof igDailyAdSpend!=='undefined') igDailyAdSpend=0;
    if(typeof igDailyCPF!=='undefined') igDailyCPF=0;
    return null;
  };

  window.loadIgDailyKPIs=async function(){
    const section=document.getElementById('ig-kpi-section');
    if(section) section.style.display='none';
    return null;
  };

  window.syncInstagramSilent=async function(){
    return {disabled:true, reason:'Instagram otomatik senkronizasyonu kapalı.'};
  };
  window.syncInstagram=async function(){
    if(typeof toast==='function') toast('Instagram senkronizasyonu kapalı. Takipçi bilgilerini manuel gir.');
    return {disabled:true};
  };
  window.syncMetaAds=async function(){
    if(typeof toast==='function') toast('Reklam/Instagram senkronizasyonu kapalı. Bilgileri manuel gir.');
    return {disabled:true};
  };
  window.connectInstagram=function(){
    if(typeof toast==='function') toast('Instagram bağlantısı kapalı. Her kullanıcı kendi verisini manuel girecek.');
  };

  const oldShowApp=window.showApp;
  if(typeof oldShowApp==='function'){
    window.showApp=function(){
      resetUserScopedState();
      return oldShowApp.apply(this,arguments);
    };
  }

  const oldLogout=window.doLogout;
  if(typeof oldLogout==='function'){
    window.doLogout=function(){
      resetUserScopedState();
      return oldLogout.apply(this,arguments);
    };
  }
})();

(function(){
  if(window.__journeyBankV25) return;
  window.__journeyBankV25=true;
  const LIMIT=20;
  let stories=[];
  let editingId=null;
  let loadedFor='';

  function userEmail(){
    try{return (typeof currentUser!=='undefined'&&currentUser&&currentUser.email)||window.currentUser?.email||'guest';}
    catch(e){return 'guest';}
  }
  function storageKey(){return 'db_journey_stories_v1_'+userEmail();}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function readLocal(){try{return JSON.parse(localStorage.getItem(storageKey())||'[]')||[];}catch(e){return [];}}
  function writeLocal(){try{localStorage.setItem(storageKey(),JSON.stringify(stories));}catch(e){}}
  function db(){try{return typeof sb!=='undefined'?sb:null;}catch(e){return null;}}
  async function loadRemote(){
    const client=db();
    if(!client || !userEmail() || userEmail()==='guest') return null;
    try{
      const {data,error}=await client.from('user_journey_stories').select('*').eq('user_id',userEmail()).order('created_at',{ascending:false});
      if(error) throw error;
      return (data||[]).map(r=>({id:r.id,title:r.title||'',content:r.content||'',created_at:r.created_at||new Date().toISOString()}));
    }catch(e){
      return null;
    }
  }
  async function saveRemote(story){
    const client=db();
    if(!client || !story || !userEmail() || userEmail()==='guest') return false;
    try{
      const payload={user_id:userEmail(),title:story.title,content:story.content,updated_at:new Date().toISOString()};
      if(story.id && !String(story.id).startsWith('local_')){
        const {error}=await client.from('user_journey_stories').update(payload).eq('id',story.id).eq('user_id',userEmail());
        if(error) throw error;
      }else{
        payload.created_at=story.created_at||new Date().toISOString();
        const {data,error}=await client.from('user_journey_stories').insert(payload).select().single();
        if(error) throw error;
        if(data?.id) story.id=data.id;
      }
      return true;
    }catch(e){
      return false;
    }
  }
  async function deleteRemote(id){
    const client=db();
    if(!client || !id || String(id).startsWith('local_')) return false;
    try{
      const {error}=await client.from('user_journey_stories').delete().eq('id',id).eq('user_id',userEmail());
      if(error) throw error;
      return true;
    }catch(e){
      return false;
    }
  }
  async function loadStories(){
    const email=userEmail();
    if(loadedFor===email && stories.length) return stories;
    loadedFor=email;
    const remote=await loadRemote();
    stories=remote || readLocal();
    writeLocal();
    return stories;
  }
  function render(){
    const count=document.getElementById('journey-count');
    const list=document.getElementById('journey-list');
    if(count) count.textContent=`${stories.length}/${LIMIT}`;
    if(!list) return;
    list.innerHTML=stories.length ? stories.map(s=>`
      <div class="journey-story">
        <div class="journey-story-top">
          <div>
            <div class="journey-story-title">${esc(s.title||'Başlıksız Anı')}</div>
            <div class="journey-story-date">${new Date(s.created_at||Date.now()).toLocaleDateString('tr-TR')}</div>
          </div>
          <button class="journey-delete" title="Sil" onclick="journeyDeleteStory('${esc(s.id)}')">×</button>
        </div>
        <div class="journey-story-content">${esc(s.content)}</div>
      </div>`).join('') : '<div class="journey-empty">Henüz anı yok. Baristaların seni daha iyi tanıması için ilk anını ekle.</div>';
  }
  window.renderJourney=async function(){
    await loadStories();
    render();
  };
  window.journeyToggleComposer=function(open){
    const el=document.getElementById('journey-composer');
    if(!el) return;
    el.style.display=open?'grid':'none';
    if(!open){
      editingId=null;
      const t=document.getElementById('journey-title-input'); if(t)t.value='';
      const c=document.getElementById('journey-content-input'); if(c)c.value='';
    }else{
      setTimeout(()=>document.getElementById('journey-title-input')?.focus(),50);
    }
  };
  window.journeyToggleIdeas=function(){
    const el=document.getElementById('journey-ideas');
    if(el) el.style.display=el.style.display==='none'?'flex':'none';
  };
  window.journeyUseIdea=function(title,body){
    journeyToggleComposer(true);
    const t=document.getElementById('journey-title-input');
    const c=document.getElementById('journey-content-input');
    if(t&&!t.value)t.value=title;
    if(c&&!c.value)c.value=body;
  };
  window.journeySaveStory=async function(){
    await loadStories();
    if(stories.length>=LIMIT && !editingId){alert('En fazla 20 anı ekleyebilirsin.');return;}
    const title=(document.getElementById('journey-title-input')?.value||'').trim();
    const content=(document.getElementById('journey-content-input')?.value||'').trim();
    if(!title || !content){alert('Başlık ve anı metni gerekli.');return;}
    const story={id:editingId||('local_'+Date.now()),title,content,created_at:new Date().toISOString()};
    const idx=stories.findIndex(s=>String(s.id)===String(story.id));
    if(idx>=0) stories[idx]={...stories[idx],...story}; else stories.unshift(story);
    const remoteOk=await saveRemote(story);
    writeLocal();
    if(!remoteOk) alert('Anı Supabase’e kaydedilemedi. Tarayıcıda geçici yedek tutuldu; SQL patch çalıştırılınca tekrar kaydedebilirsin.');
    journeyToggleComposer(false);
    render();
  };
  window.journeyDeleteStory=async function(id){
    if(!confirm('Bu anı silinsin mi?')) return;
    stories=stories.filter(s=>String(s.id)!==String(id));
    const remoteOk=await deleteRemote(id);
    writeLocal();
    if(!remoteOk && !String(id).startsWith('local_')) alert('Anı Supabase’den silinemedi. Bağlantı veya tablo izinlerini kontrol edelim.');
    render();
  };
  window.getJourneyContext=function(){
    const list=stories.length?stories:readLocal();
    if(!list.length) return '';
    return list.slice(0,LIMIT).map((s,i)=>`${i+1}. ${s.title}: ${String(s.content||'').slice(0,900)}`).join('\n');
  };
  window.withJourneyContext=function(message){
    const context=window.getJourneyContext?window.getJourneyContext():'';
    if(!context) return message;
    return `Kullanıcının Yolculuk / Anı Demliği bağlamı:\n${context}\n\nBu bağlamı cevaplarında kişisel yönlendirme için kullan. Kullanıcı özellikle istemedikçe anıları uzun uzun tekrar etme.\n\nKullanıcının mesajı:\n${message}`;
  };
  const oldGo=window.go;
  if(typeof oldGo==='function'){
    window.go=function(id,el){
      const result=oldGo.apply(this,arguments);
      if(id==='journey') setTimeout(window.renderJourney,0);
      return result;
    };
  }
  const oldShowApp=window.showApp;
  if(typeof oldShowApp==='function'){
    window.showApp=function(){
      const result=oldShowApp.apply(this,arguments);
      loadedFor='';
      setTimeout(window.renderJourney,250);
      return result;
    };
  }
})();

(function(){
  if(window.__sanalGapRemovalV24) return;
  window.__sanalGapRemovalV24=true;
  function syncSanalBodyClass(){
    const active=document.getElementById('page-sanal')?.classList.contains('active');
    document.body.classList.toggle('sanal-page-active',!!active);
  }
  const oldGo=window.go;
  if(typeof oldGo==='function'){
    window.go=function(){
      const result=oldGo.apply(this,arguments);
      requestAnimationFrame(syncSanalBodyClass);
      setTimeout(syncSanalBodyClass,80);
      return result;
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',syncSanalBodyClass,{once:true});
  else syncSanalBodyClass();
  const observer=new MutationObserver(syncSanalBodyClass);
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
})();