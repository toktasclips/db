(function(){
  const LOCAL_BOTS='kisiselBaristan.bots.v2';
  const LOCAL_HIST='kisiselBaristan.history.v2';
  let botsCache=[];
  let histCache=[];
  let activeBotId=null;
  let activeThreadId=null;
  let activeChatSessionId=null;
  let tempMessages=[];
  let kisiselEditDocs=[];

  const coffeeIcons=['☕','🥛','🍵','🫖','🥤','🧋','☕'];
  const defaults=[
    {id:'onboarding-ai',name:'Onboarding AI',icon:'☕',description:'Başlangıç ve kurulum için yol gösterir',system_prompt:'Kullanıcıyı başlangıç ve kurulum sürecinde sade, net, adım adım yönlendir.',starters:['Başlangıç için beni yönlendir','Hedefimi netleştir','Aklımdakileri toparla','Sonraki adımları çıkar'],is_active:true,sort_order:1,status:'active'},
    {id:'menucard-maker',name:'Menucard Maker',icon:'🫖',description:'Teklifini ve ürün menünü netleştirir',system_prompt:'Kullanıcının teklifini, paketlerini ve değer merdivenini netleştir.',starters:['Teklifimi netleştir','Ürün menümü kur','Paketlerimi sadeleştir','Fiyatlandırmayı düşünelim'],is_active:true,sort_order:2,status:'active'},
    {id:'daily-writer',name:'The Daily Writer',icon:'🍵',description:'Günlük içerik ve email fikirleri üretir',system_prompt:'Kullanıcıya marka diliyle, sade ve satışa bağlanan içerik fikirleri üret.',starters:['Bugünkü içeriğimi yaz','Email fikri ver','Story akışı çıkar','Bir fikri post yap'],is_active:true,sort_order:3,status:'active'},
    {id:'campaign-coach',name:'Campaign Coach',icon:'☕',description:'Kampanya ve satış akışı kurar',system_prompt:'Kullanıcıya kampanya, lansman ve satış süreci konusunda stratejik destek ver.',starters:['Kampanya planı çıkar','Satış mesajımı güçlendir','Lansman akışı kur','Takip mesajları yaz'],is_active:true,sort_order:4,status:'active'}
  ];
  try{localStorage.removeItem(LOCAL_BOTS);localStorage.removeItem(LOCAL_HIST);}catch(e){}
  const esc=(v)=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const cleanBotText=(v)=>String(v??'')
    .replace(/^#{1,6}\s*/gm,'')
    .replace(/\*\*([^*]+)\*\*/g,'$1')
    .replace(/\*([^*]+)\*/g,'$1')
    .replace(/`([^`]+)`/g,'$1')
    .replace(/^\s*[-*]\s+/gm,'')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,'')
    .replace(/[ \t]+\n/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
  const uid=(p='id')=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  const getCurrentUser=()=>typeof currentUser!=='undefined'&&currentUser?currentUser:(window.currentUser||null);
  const getSb=()=>typeof sb!=='undefined'&&sb?sb:(window.sb||null);
  const admin=()=>getCurrentUser()?.role==='admin' || document.body.classList.contains('admin');
  const userKey=()=>getCurrentUser()?.email || getCurrentUser()?.id || 'local-user';
  const userKeys=()=>Array.from(new Set([getCurrentUser()?.email,getCurrentUser()?.id].filter(Boolean).map(String)));
  const botIcon=(b={},i=0)=>b.icon || b.avatar_emoji || b.emoji || coffeeIcons[i%coffeeIcons.length] || '☕';
  const saveDebug=(msg)=>{const el=document.getElementById('sanal-save-debug');if(el){el.style.display='block';el.textContent=msg;}};
  const setDocStatus=(msg)=>{const el=document.getElementById('sanal-doc-status');if(el)el.textContent=msg||'';};
  const normalizeBot=(b,i=0)=>({
    id:b.id,
    name:b.name||'Yeni Barista',
    description:b.description||'',
    icon:b.icon||b.avatar||b.avatar_emoji||b.emoji||coffeeIcons[i%coffeeIcons.length],
    system_prompt:b.system_prompt||'',
    starters:b.starters||b.conversation_starters||b.starter_questions||[],
    is_active:b.is_active!==false,
    coming_soon:b.coming_soon===true || b.is_coming_soon===true || b.status==='coming_soon',
    sort_order:b.sort_order??i,
    status:b.status||'active'
  });
  function setLocalBots(b){}
  function getLocalBots(){return [];}
  function setLocalHist(h){}
  function getLocalHist(){return [];}
  function botById(id){return botsCache.find(b=>b.id===id) || botsCache[0] || null;}
  function timeLabel(ts){const d=new Date(ts||Date.now()),n=new Date();const diff=Math.floor((n-d)/86400000);if(diff<=0)return'Bugün';if(diff===1)return'Dün';if(diff<7)return diff+' gün önce';return d.toLocaleDateString('tr-TR',{day:'numeric',month:'short'});}
  function formatMemoryMessages(list){
    return (list||[]).filter(m=>m&&m.role!=='typing'&&m.text!==undefined&&m.text!==null&&String(m.text).trim()).slice(-14).map(m=>`${m.role==='user'?'Kullanıcı':'Barista'}: ${String(m.text).slice(0,900)}`).join('\n');
  }
  async function loadSavedBotMemory(botId){
    const db=getSb();
    const keys=userKeys();
    if(!db || !botId || !keys.length) return '';
    try{
      let q=db.from('chatbot_conversations').select('id,title,updated_at,created_at').eq('chatbot_id',botId).order('updated_at',{ascending:false}).limit(5);
      q=keys.length>1?q.in('user_id',keys):q.eq('user_id',keys[0]);
      const {data:convs,error:convErr}=await q;
      if(convErr) throw convErr;
      const ids=(convs||[]).map(c=>c.id).filter(Boolean);
      if(!ids.length) return '';
      const {data:msgs,error:msgErr}=await db.from('chatbot_messages').select('conversation_id,role,content,created_at').in('conversation_id',ids).order('created_at',{ascending:true}).limit(80);
      if(msgErr) throw msgErr;
      return (msgs||[]).filter(m=>m.conversation_id!==activeThreadId || m.role!=='typing').slice(-30).map(m=>`${m.role==='user'?'Kullanıcı':'Barista'}: ${String(m.content||'').slice(0,900)}`).join('\n');
    }catch(e){
      return '';
    }
  }
  async function buildBaristaMessage(text, botId){
    const journey=window.getJourneyContext?window.getJourneyContext():'';
    const current=formatMemoryMessages(tempMessages);
    const saved=await loadSavedBotMemory(botId);
    const conversation=[saved,current].filter(Boolean).join('\n\nGüncel konuşma:\n');
    const sections=[];
    if(journey) sections.push(`Kullanıcının Yolculuk / Anı Demliği bağlamı:\n${journey}`);
    if(conversation) sections.push(`Kullanıcının bu barista ile konuşma hafızası:\n${conversation}`);
    if(!sections.length) return {message:text,journey,conversation};
    return {
      message:`${sections.join('\n\n')}\n\nBu bağlamı cevap verirken kişisel yönlendirme için kullan. Kullanıcı özellikle istemedikçe anıları veya eski konuşmaları uzun uzun tekrar etme; doğal bir sohbet gibi cevap ver.\n\nKullanıcının son mesajı:\n${text}`,
      journey,
      conversation
    };
  }

  async function loadBots(){
    botsCache=[];
    const url=(typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:window.SUPABASE_URL);
    const key=(typeof SUPABASE_KEY!=='undefined'?SUPABASE_KEY:window.SUPABASE_KEY);
    const db=getSb();

    if(db){
      try{
        let q=db.from('chatbots').select('*').eq('is_active',true).order('sort_order',{ascending:true});
        const {data,error}=await q;
        if(!error && Array.isArray(data)){ botsCache=data.map(normalizeBot); }
        else{
          let fallback=db.from('chatbots').select('*').eq('is_active',true).order('created_at',{ascending:true});
          const fb=await fallback;
          if(!fb.error && Array.isArray(fb.data)){ botsCache=fb.data.map(normalizeBot); }
        }
      }catch(e){}
    }

    // Supabase client yüklenmezse bile REST ile oku. Böylece localStorage'a düşmez.
    if(!botsCache.length && url && key){
      try{
        const base=String(url).replace(/\/$/,'');
        const res=await fetch(`${base}/rest/v1/chatbots?select=*&is_active=eq.true&order=created_at.asc`,{
          headers:{apikey:key,Authorization:`Bearer ${key}`}
        });
        const data=await res.json().catch(()=>[]);
        if(res.ok && Array.isArray(data)){ botsCache=data.map(normalizeBot); }
        else if(!res.ok){  }
      }catch(e){}
    }

    // Burada bilerek local default basmıyoruz. Supabase'te yoksa boş görünür.
    if(!activeBotId || !botsCache.some(b=>b.id===activeBotId)) activeBotId=(botsCache.find(b=>b.is_active!==false)||botsCache[0]||null)?.id || null;
  }
  async function loadHistory(){
    histCache=[];
    const db=getSb();
    if(db && getCurrentUser()){
      try{
        let q=db.from('chatbot_conversations').select('*').order('updated_at',{ascending:false}).limit(30);
        const keys=userKeys();
        q=keys.length>1?q.in('user_id',keys):q.eq('user_id',userKey());
        const {data,error}=await q;
        if(!error && Array.isArray(data)){
          histCache=data.map(x=>({id:x.id,botId:x.chatbot_id,title:x.title,updatedAt:x.updated_at||x.created_at,messages:[]}));
          setLocalHist(histCache);
        }
      }catch(e){}
    }
  }
  async function loadMessages(threadId){
    const db=getSb();
    if(db && threadId){
      try{
        const {data,error}=await db.from('chatbot_messages').select('*').eq('conversation_id',threadId).order('created_at',{ascending:true});
        if(!error && Array.isArray(data)) return data.map(m=>({role:m.role,text:m.content}));
      }catch(e){}
    }
    return (histCache.find(h=>h.id===threadId)?.messages)||[];
  }
  function ensureUuid(v){
    const str=String(v||'');
    if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) return str;
    return (typeof crypto!=='undefined'&&crypto.randomUUID) ? crypto.randomUUID() : uid('barista');
  }
  function isUuid(v){
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''));
  }
  async function saveBotToDb(item){
    item.id=ensureUuid(item.id);
    const url=(typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:window.SUPABASE_URL);
    const key=(typeof SUPABASE_KEY!=='undefined'?SUPABASE_KEY:window.SUPABASE_KEY);
    window.__lastKisiselBaristanError='';

    if(!url||!key){
      window.__lastKisiselBaristanError='Supabase URL veya anon key bulunamadı. HTML içinde SUPABASE_URL / SUPABASE_KEY görünmüyor.';
      return false;
    }

    const starters=Array.isArray(item.starters)?item.starters.map(x=>String(x||'').trim()).filter(Boolean):[];
    const now=new Date().toISOString();
    const base=String(url).replace(/\/$/,'');

    const fullPayload={
      id:item.id,
      name:item.name||'Yeni Barista',
      description:item.description||'',
      system_prompt:item.system_prompt||'',
      avatar:item.icon||'☕',
      icon:item.icon||'☕',
      avatar_emoji:item.icon||'☕',
      model:item.model||'gpt-4o-mini',
      conversation_starters:starters,
      starters:starters,
      starter_questions:starters,
      is_active:item.is_active!==false,
      coming_soon:item.coming_soon===true,
      is_coming_soon:item.coming_soon===true,
      status:item.coming_soon===true?'coming_soon':(item.is_active!==false?'active':'inactive'),
      sort_order:item.sort_order||0,
      updated_at:now
    };

    const payloadVariants=[
      fullPayload,
      (({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,coming_soon,is_coming_soon,status,updated_at})=>({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,coming_soon,is_coming_soon,status,updated_at}))(fullPayload),
      (({id,name,description,system_prompt,conversation_starters,is_active,coming_soon,is_coming_soon,status,updated_at})=>({id,name,description,system_prompt,conversation_starters,is_active,coming_soon,is_coming_soon,status,updated_at}))(fullPayload),
      (({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,coming_soon,status,updated_at})=>({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,coming_soon,status,updated_at}))(fullPayload),
      (({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,status,updated_at})=>({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,status,updated_at}))(fullPayload),
      (({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,is_coming_soon,updated_at})=>({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,is_coming_soon,updated_at}))(fullPayload),
      (({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,updated_at})=>({id,name,description,system_prompt,avatar,model,conversation_starters,is_active,updated_at}))(fullPayload),
      (({id,name,description,system_prompt,conversation_starters,is_active})=>({id,name,description,system_prompt,conversation_starters,is_active}))(fullPayload),
      (({name,description,system_prompt,conversation_starters,is_active})=>({name,description,system_prompt,conversation_starters,is_active}))(fullPayload),
      (({name,description,system_prompt,is_active})=>({name,description,system_prompt,is_active}))(fullPayload)
    ];

    async function postRest(body,label){
      saveDebug(`${label} deneniyor...`);
      const endpoint=`${base}/rest/v1/chatbots${body.id?'?on_conflict=id':''}`;
      const res=await fetch(endpoint,{
        method:'POST',
        headers:{
          apikey:key,
          Authorization:`Bearer ${key}`,
          'Content-Type':'application/json',
          Prefer:body.id?'resolution=merge-duplicates,return=representation':'return=representation'
        },
        body:JSON.stringify(body)
      });
      const txt=await res.text();
      let data=null;
      try{data=txt?JSON.parse(txt):null;}catch(_){data=txt;}
      if(!res.ok){
        const msg=(data&&(data.message||data.details||data.hint||data.code))||txt||`${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      const row=Array.isArray(data)?data[0]:data;
      if(row && row.id) item.id=row.id;
      return true;
    }

    // 1) Önce supabase-js ile dene.
    const db=getSb();
    if(db){
      for(let i=0;i<payloadVariants.length;i++){
        try{
          saveDebug(`Supabase client kayıt denemesi ${i+1}...`);
          const {data,error}=await db.from('chatbots').upsert(payloadVariants[i],{onConflict:'id'}).select('id').single();
          if(error) throw error;
          if(data?.id) item.id=data.id;
          saveDebug('Supabase client ile kaydedildi.');
          return true;
        }catch(e){
          window.__lastKisiselBaristanError=e?.message||String(e);
        }
      }
    }

    // 2) Client olmazsa / patlarsa REST ile dene.
    for(let i=0;i<payloadVariants.length;i++){
      try{
        await postRest(payloadVariants[i],`Supabase REST kayıt denemesi ${i+1}`);
        saveDebug('Supabase REST ile kaydedildi.');
        return true;
      }catch(e){
        window.__lastKisiselBaristanError=e?.message||String(e);
      }
    }

    saveDebug(`Supabase kayıt başarısız:\n${window.__lastKisiselBaristanError}`);
    return false;
  }
  async function deactivateBot(id){
    botsCache=botsCache.filter(b=>b.id!==id);
    const db=getSb();
    if(db){
      try{
        let res=await db.from('chatbots').update({is_active:false,status:'inactive'}).eq('id',id);
        if(res?.error) res=await db.from('chatbots').update({is_active:false}).eq('id',id);
        if(res?.error) throw res.error;
      }catch(e){
        alert('Kayıt güncellenemedi. Lütfen daha sonra tekrar deneyin.');
      }
    }
  }
  async function ensureConversation(){
    if(activeThreadId) return activeThreadId;
    const bot=botById(activeBotId)||{}; const first=(tempMessages.find(m=>m.role==='user')?.text||bot.name||'Kişisel Baristan').slice(0,70);
    const db=getSb();
    if(db && getCurrentUser()){
      try{
        const {data,error}=await db.from('chatbot_conversations').insert({chatbot_id:activeBotId,user_id:userKey(),title:first}).select().single();
        if(error) throw error;
        if(data?.id){activeThreadId=data.id;return data.id;}
      }catch(e){
        window.__lastKisiselConversationError=e?.message||String(e);
      }
    }
    const url=(typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:window.SUPABASE_URL);
    const key=(typeof SUPABASE_KEY!=='undefined'?SUPABASE_KEY:window.SUPABASE_KEY);
    if(url&&key){
      try{
        const base=String(url).replace(/\/$/,'');
        const res=await fetch(`${base}/rest/v1/chatbot_conversations`,{
          method:'POST',
          headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},
          body:JSON.stringify({chatbot_id:activeBotId,user_id:userKey(),title:first})
        });
        const data=await res.json().catch(()=>null);
        if(!res.ok) throw new Error((data&&(data.message||data.details||data.hint||data.code))||`${res.status} ${res.statusText}`);
        const row=Array.isArray(data)?data[0]:data;
        if(row?.id){activeThreadId=row.id;return row.id;}
      }catch(e){
        window.__lastKisiselConversationError=e?.message||String(e);
      }
    }
    return null;
  }
  async function saveMsg(role,text){
    const cid=await ensureConversation();
    if(!cid) return false;
    const db=getSb();
    let wrote=false;
    if(db && getCurrentUser()){
      try{
        const ins=await db.from('chatbot_messages').insert({conversation_id:cid,role,content:text});
        if(ins?.error) throw ins.error;
        await db.from('chatbot_conversations').update({updated_at:new Date().toISOString(),title:(tempMessages.find(m=>m.role==='user')?.text||botById(activeBotId).name).slice(0,70)}).eq('id',cid);
        wrote=true;
      }catch(e){
        window.__lastKisiselConversationError=e?.message||String(e);
      }
    }
    const url=(typeof SUPABASE_URL!=='undefined'?SUPABASE_URL:window.SUPABASE_URL);
    const key=(typeof SUPABASE_KEY!=='undefined'?SUPABASE_KEY:window.SUPABASE_KEY);
    if(!wrote&&url&&key){
      try{
        const base=String(url).replace(/\/$/,'');
        const ins=await fetch(`${base}/rest/v1/chatbot_messages`,{
          method:'POST',
          headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
          body:JSON.stringify({conversation_id:cid,role,content:text})
        });
        if(!ins.ok){
          const data=await ins.json().catch(()=>null);
          throw new Error((data&&(data.message||data.details||data.hint||data.code))||`${ins.status} ${ins.statusText}`);
        }
        await fetch(`${base}/rest/v1/chatbot_conversations?id=eq.${encodeURIComponent(cid)}`,{
          method:'PATCH',
          headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
          body:JSON.stringify({updated_at:new Date().toISOString(),title:(tempMessages.find(m=>m.role==='user')?.text||botById(activeBotId).name).slice(0,70)})
        });
      }catch(e){
        window.__lastKisiselConversationError=e?.message||String(e);
        return false;
      }
    }
    const bot=botById(activeBotId)||{}; const item={id:cid,botId:activeBotId,title:(tempMessages.find(m=>m.role==='user')?.text||bot.name||'Kişisel Baristan').slice(0,70),updatedAt:Date.now(),messages:tempMessages.filter(m=>m.role!=='typing')};
    histCache=[item,...histCache.filter(h=>h.id!==cid)];
    return true;
  }
  async function readKisiselFile(file){
    if(!file) return null;
    const name=String(file.name||'belge').toLowerCase();
    if(name.endsWith('.pdf')){
      if(!window.pdfjsLib){
        setDocStatus('PDF okuyucu yükleniyor...');
        await new Promise((resolve,reject)=>{
          const s=document.createElement('script');
          s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          s.onload=resolve;
          s.onerror=()=>reject(new Error('PDF okuyucu yüklenemedi.'));
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      setDocStatus('PDF metni okunuyor...');
      const buf=await file.arrayBuffer();
      const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;
      const pages=[];
      for(let i=1;i<=pdf.numPages;i++){
        const page=await pdf.getPage(i);
        const content=await page.getTextContent();
        pages.push(content.items.map(item=>item.str).join(' '));
      }
      const content=pages.join('\n\n').trim();
      if(!content) throw new Error('PDF içinden metin okunamadı. Bu dosya taranmış/görsel PDF olabilir.');
      return {filename:file.name,content};
    }
    const content=(await file.text()).trim();
    if(!content) throw new Error('Dosya boş görünüyor.');
    return {filename:file.name,content};
  }
  function renderKisiselPendingDocs(){
    const list=document.getElementById('sanal-doc-list');
    if(!list) return;
    list.innerHTML=kisiselEditDocs.map((d,i)=>`<span class="cb-doc-chip">📄 ${esc(d.filename)} (${Math.round((d.content||'').length/1000)}k kr)<button type="button" onclick="kisiselRemovePendingDoc(${i})">×</button></span>`).join('');
  }
  async function renderKisiselSavedDocs(botId){
    const box=document.getElementById('sanal-saved-docs');
    if(!box) return;
    if(!botId || !isUuid(botId)){
      box.innerHTML='<span style="font-size:12px;color:#9D9186">Belgeler barista ilk kez kaydedildikten sonra burada kalıcı görünür.</span>';
      return;
    }
    const db=getSb();
    if(!db){
      box.innerHTML='<span style="font-size:12px;color:#9D9186">Supabase bağlantısı bulunamadı.</span>';
      return;
    }
    box.innerHTML='<span style="font-size:12px;color:#9D9186">Belgeler yükleniyor...</span>';
    try{
      const {data,error}=await db.from('chatbot_documents').select('id, filename, created_at').eq('chatbot_id',botId).order('created_at',{ascending:false});
      if(error) throw error;
      const docs=Array.isArray(data)?data:[];
      box.innerHTML=docs.length ? docs.map(d=>`<span class="cb-doc-chip" style="background:#FFFFFF">📄 ${esc(d.filename)}<button type="button" title="Sil" onclick="kisiselDeleteDoc('${esc(d.id)}',this)">×</button></span>`).join('') : '<span style="font-size:12px;color:#9D9186">Henüz belge yok.</span>';
    }catch(e){
      box.innerHTML='<span style="font-size:12px;color:#B83232">Belgeler okunamadı: '+esc(e.message||e)+'</span>';
    }
  }
  async function ingestKisiselDocs(botId){
    if(!kisiselEditDocs.length) return true;
    if(!botId){window.__lastKisiselBaristanError='Belge yüklemek için önce barista kaydı oluşmalı.';return false;}
    const fn=(typeof CHATBOT_INGEST_FN!=='undefined'?CHATBOT_INGEST_FN:window.CHATBOT_INGEST_FN);
    const key=(typeof SUPABASE_KEY!=='undefined'?SUPABASE_KEY:window.SUPABASE_KEY);
    if(!fn||!key){window.__lastKisiselBaristanError='chatbot-ingest Edge Function veya Supabase key bulunamadı.';return false;}
    for(const doc of kisiselEditDocs){
      setDocStatus(`${doc.filename} Supabase'e yükleniyor...`);
      const res=await fetch(fn,{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},
        body:JSON.stringify({chatbot_id:botId,filename:doc.filename,content:doc.content})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok){
        window.__lastKisiselBaristanError=`Belge yükleme hatası (${doc.filename}): ${data.message||data.error||JSON.stringify(data)||res.status}`;
        return false;
      }
    }
    kisiselEditDocs=[];
    renderKisiselPendingDocs();
    setDocStatus('Belgeler kaydedildi.');
    return true;
  }
  async function refresh(){await loadBots();await loadHistory();renderShell();}
  const SANAL_STATUS_OVERRIDES='kisisel_baristan_status_overrides_v1';
  function readStatusOverrides(){try{localStorage.removeItem(SANAL_STATUS_OVERRIDES);}catch(e){} return {};}
  function writeStatusOverride(id,status){try{localStorage.removeItem(SANAL_STATUS_OVERRIDES);}catch(e){}}
  function applyStatusOverrides(list){
    readStatusOverrides();
    return list||[];
  }
  function botRows(){
    botsCache=applyStatusOverrides(botsCache);
    const visible=botsCache.filter(b=>b.is_active!==false);
    const active=visible.filter(b=>!b.coming_soon);
    const soon=visible.filter(b=>b.coming_soon);
    const row=(b,i)=>`<div class="sanal-bot-row ${activeBotId===b.id?'active':''} ${b.coming_soon?'coming-soon':''}" data-bot-id="${esc(b.id)}" onclick="kisiselOpenBot('${esc(b.id)}')"><div class="sanal-bot-icon">${esc(botIcon(b,i))}</div><div style="min-width:0;flex:1"><div class="sanal-bot-name">${esc(b.name)}${b.coming_soon?'<span class="sanal-soon-badge">Yakında</span>':''}</div><div class="sanal-bot-desc">${esc(b.coming_soon?'Üzerinde çalışıyoruz':(b.description||'Konuşma başlat'))}</div></div><div class="sanal-row-actions"><button class="sanal-mini-btn" type="button" title="Düzenle" data-action="edit" data-bot-id="${esc(b.id)}" onclick="event.preventDefault();event.stopPropagation();kisiselEditBot('${esc(b.id)}')">✎</button><button class="sanal-mini-btn" type="button" title="Sil" data-action="delete" data-bot-id="${esc(b.id)}" onclick="event.preventDefault();event.stopPropagation();kisiselDeleteBot('${esc(b.id)}')">×</button></div></div>`;
    if(!visible.length) return '<div class="sanal-list-label">BARİSTALAR 0</div><div class="sanal-empty">Henüz barista yok.</div>';
    return `<div class="sanal-list-label">BARİSTALAR ${active.length}</div>${active.length?active.map(row).join(''):'<div class="sanal-empty">Aktif barista yok.</div>'}${soon.length?`<div class="sanal-list-label sanal-soon-section-label">YAKINDA GELİYOR ${soon.length}</div>${soon.map((b,i)=>row(b,active.length+i)).join('')}`:''}`;
  }
  function historyRows(){
    if(!histCache.length) return '<div class="sanal-empty">İlk konuşmayı başlatınca burada görünecek.</div>';
    return histCache.slice(0,18).map(h=>{const b=botById(h.botId)||{};return `<div class="sanal-history-row" onclick="kisiselOpenHistory('${esc(h.id)}')"><div class="sanal-history-icon">${esc(botIcon(b))}</div><div style="min-width:0;flex:1"><div class="sanal-history-title">${esc(h.title||b.name||'Sohbet')}</div><div class="sanal-history-meta">${esc(b.name||'Kişisel Baristan')} · ${timeLabel(h.updatedAt)}</div></div></div>`}).join('');
  }
  function starters(bot){return ((bot&&bot.starters)||[]).map(x=>String(x||'').trim()).filter(Boolean).slice(0,4);}
  function renderShell(){
    const root=document.getElementById('sanal-app'); if(!root) return;
    botsCache=applyStatusOverrides(botsCache);
    const bot=botById(activeBotId);
    if(!bot){
      root.innerHTML=`<div class="sanal-shell"><aside class="sanal-panel"><div class="sanal-panel-head"><div class="sanal-panel-title">Kişisel Baristan</div><button class="sanal-new-btn" onclick="kisiselNewBot()">+ Yeni Barista</button></div><div class="sanal-panel-scroll"><div class="sanal-list-label">BARİSTALAR 0</div><div class="sanal-empty">Henüz barista yok.</div></div></aside><main class="sanal-main"><div class="sanal-chat-top"><div class="sanal-bot-icon">☕</div><div><div class="sanal-chat-title">Kişisel Baristan</div><div class="sanal-chat-sub">Başlamak için yeni bir barista oluştur.</div></div><button class="btn btn-primary" style="margin-left:auto" onclick="kisiselNewBot()">+ Yeni Barista Oluştur</button></div><div class="sanal-stage"><div class="sanal-welcome" id="sanal-welcome"><div class="sanal-welcome-line"><div class="sanal-greet-avatar">☕</div><div>Henüz aktif barista yok. Yeni bir barista oluşturunca burada görünecek.</div></div></div><div class="sanal-messages" id="sanal-messages"></div></div></main></div>`;
      return;
    }
    activeBotId=bot.id;
    const starterList=starters(bot);
    const starterHtml=bot.coming_soon ? '' : (starterList.length?`<div class="sanal-prompt-grid">${starterList.map((x,i)=>`<div class="sanal-prompt-card ${i===2?'wide':''}" onclick="kisiselStarter('${esc(x)}')"><div class="sanal-prompt-title">${esc(x)}</div><div class="sanal-prompt-type">Başlat</div><div class="sanal-prompt-desc">Bu başlıkla yeni konuşma aç.</div></div>`).join('')}</div>`:'');
    const welcomeText=bot.coming_soon ? `${esc(bot.name)} üzerinde çalışıyoruz. Şimdilik sohbet kapalı, aktif olduğunda burada konuşabileceksin.` : `Merhaba, ben ${esc(bot.name)}. Bugün nasıl yardımcı olayım?`;
    const inputHtml=bot.coming_soon ? `<div class="sanal-inputbar sanal-coming-note" style="justify-content:center;color:#9D9186;font-size:13px">Üzerinde çalışıyoruz. Bu barista şimdilik soru kabul etmiyor.</div>` : `<div class="sanal-inputbar"><span style="font-size:22px;color:#B9AEA3">+</span><textarea id="sanal-input" placeholder="${esc(bot.name)} ile konuş..." rows="1" autocomplete="off" autocorrect="off" spellcheck="false" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();kisiselSend()}"></textarea><button onclick="kisiselSend()">↑</button></div>`;
    root.innerHTML=`<div class="sanal-shell"><aside class="sanal-panel"><div class="sanal-panel-head"><div class="sanal-panel-title">Kişisel Baristan</div><button class="sanal-new-btn" onclick="kisiselNewBot()">+ Yeni Barista</button></div><div class="sanal-panel-scroll">${botRows()}<div class="sanal-list-label" style="margin-top:24px;display:flex;justify-content:space-between;align-items:center"><span>YAKIN ZAMANDAKİLER</span><button onclick="kisiselNewChat()" style="border:0;background:transparent;color:#8B6B4F;font-size:11px;font-weight:700;cursor:pointer">Yeni sohbet</button></div>${historyRows()}</div></aside><main class="sanal-main"><div class="sanal-chat-top"><div class="sanal-bot-icon">${esc(botIcon(bot))}</div><div><div class="sanal-chat-title">${esc(bot.name)}${bot.coming_soon?'<span class="sanal-soon-badge">Yakında</span>':''}</div><div class="sanal-chat-sub">${esc(bot.coming_soon?'Üzerinde çalışıyoruz':(bot.description||'Kişisel baristan'))}</div></div><button class="btn btn-ghost" style="margin-left:auto" onclick="kisiselEditBot('${esc(bot.id)}')">Baristayı Düzenle</button></div><div class="sanal-stage"><div class="sanal-welcome" id="sanal-welcome"><div class="sanal-welcome-line"><div class="sanal-greet-avatar">${esc(botIcon(bot))}</div><div>${welcomeText}</div></div>${starterHtml}</div><div class="sanal-messages" id="sanal-messages"></div>${inputHtml}</div></main></div>`;
    requestAnimationFrame(()=>document.getElementById('sanal-input')?.blur());
  }
  function showMessages(){
    const welcome=document.getElementById('sanal-welcome'), box=document.getElementById('sanal-messages');
    if(welcome) welcome.style.display='none'; if(box) box.style.display='flex'; if(!box)return;
    box.innerHTML=tempMessages.map((m,i)=>m.role==='typing'
      ? `<div class="sanal-msg typing"><span>${esc(m.text||'Yazıyor')}</span><span class="sanal-typing-dots"><span></span><span></span><span></span></span></div>`
      : `<div class="sanal-msg ${m.role==='user'?'user':'assistant'}">${esc(m.text)}${m.role==='assistant'?`<div class="sanal-msg-copy" onclick="navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify(m.text).replace(/</g,'\\u003c')})">▢ Copy</div>`:''}</div>`).join('');
    box.scrollTop=box.scrollHeight;
  }
  async function assistantReply(text){
    const bot=botById(activeBotId)||{name:'Kişisel Baristan'};
    if(window.CHATBOT_CHAT_FN||typeof CHATBOT_CHAT_FN!=='undefined'){
      try{
        const fn=window.CHATBOT_CHAT_FN||CHATBOT_CHAT_FN;
        const key=window.SUPABASE_KEY||SUPABASE_KEY;
        const contextPayload=await buildBaristaMessage(text,bot.id);
        const res=await fetch(fn,{
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},
          body:JSON.stringify({chatbot_id:bot.id,session_id:activeChatSessionId,user_id:getCurrentUser()?.email||userKey(),message:contextPayload.message,journey_context:contextPayload.journey,conversation_context:contextPayload.conversation})
        });
        const data=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(data.message||data.error||`chatbot-chat ${res.status}`);
        if(data.session_id) activeChatSessionId=data.session_id;
        if(data.reply) return cleanBotText(data.reply);
        throw new Error('chatbot-chat yanıtı boş döndü.');
      }catch(e){
        return `Şu an chatbot sunucusundan yanıt alamıyorum.\n\nTeknik hata: ${e.message||e}\n\nBaristanın talimatları ve belgeleri Supabase tarafında duruyor; cevap üretimi için chatbot-chat Edge Function ve OpenAI token/secret ayarını kontrol etmek gerekiyor.`;
      }
    }
    return `${bot.name} olarak not aldım.\n\nŞunu netleştirelim: ${text}\n\nBurada amaç seni ikna etmek değil; doğru soruyla zaten bildiğin cevabı ortaya çıkarmak. Şimdi bunu tek net aksiyona indirelim.`;
  }
  window.kisiselOpenBot=function(id){activeBotId=id;activeThreadId=null;activeChatSessionId=null;tempMessages=[];renderShell();};
  window.kisiselNewChat=function(){activeThreadId=null;activeChatSessionId=null;tempMessages=[];renderShell();};
  window.kisiselOpenHistory=async function(id){const h=histCache.find(x=>x.id===id); if(!h)return; activeBotId=h.botId; activeThreadId=h.id; activeChatSessionId=id; tempMessages=await loadMessages(id); renderShell(); setTimeout(showMessages,0);};
  window.kisiselStarter=function(text){const inp=document.getElementById('sanal-input'); if(inp){inp.value=text;window.kisiselSend();}};
  window.kisiselSend=async function(){const inp=document.getElementById('sanal-input'); if(!inp)return; const text=inp.value.trim(); if(!text)return; inp.value=''; const typingId=uid('typing'); tempMessages.push({role:'user',text},{role:'typing',text:'Yazıyor',id:typingId}); showMessages(); const userSaved=await saveMsg('user',text); const reply=cleanBotText(await assistantReply(text)); tempMessages=tempMessages.filter(m=>m.id!==typingId); tempMessages.push({role:'assistant',text:reply}); showMessages(); const assistantSaved=await saveMsg('assistant',reply); await loadHistory(); renderShell(); setTimeout(showMessages,0); if(!(userSaved&&assistantSaved)){}};
  function requireAdminAction(){if(admin())return true;alert('Bu alan sadece admin tarafından düzenlenebilir.');return false;}
  function botExportPayload(bot){
    const b=bot||botById(activeBotId)||{};
    return {name:b.name||'',icon:botIcon(b),description:b.description||'',system_prompt:b.system_prompt||'',starters:starters(b),is_active:b.is_active!==false};
  }
  window.kisiselNewBot=function(){if(!requireAdminAction())return;renderEditor();};
  window.kisiselEditBot=function(id){if(!requireAdminAction())return;renderEditor(botById(id));};
  window.kisiselDeleteBot=async function(id){if(!requireAdminAction())return;if(!confirm('Bu barista pasife alınsın mı?'))return; await deactivateBot(id); activeBotId=(botsCache.find(b=>b.is_active!==false)||botsCache[0]||null)?.id||null; renderShell();};
  window.kisiselHandleFile=async function(input){
    if(!requireAdminAction())return;
    const file=input?.files?.[0];
    if(!file) return;
    try{
      const doc=await readKisiselFile(file);
      if(doc){
        kisiselEditDocs.push(doc);
        renderKisiselPendingDocs();
        setDocStatus(`${doc.filename} hazır. Kaydet dediğinde Supabase'e yüklenecek.`);
      }
    }catch(e){
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
      setDocStatus('');
    }finally{
      if(input) input.value='';
    }
  };
  window.kisiselRemovePendingDoc=function(i){
    kisiselEditDocs.splice(i,1);
    renderKisiselPendingDocs();
    setDocStatus(kisiselEditDocs.length ? `${kisiselEditDocs.length} belge kaydedilmeyi bekliyor.` : '');
  };
  window.kisiselDeleteDoc=async function(docId,btn){
    if(!requireAdminAction())return;
    if(!confirm('Bu belgeyi baristadan kaldırmak istiyor musun?'))return;
    const db=getSb();
    if(!db){alert('Bağlantı kurulamadı. Lütfen tekrar deneyin.');return;}
    try{
      await db.from('chatbot_chunks').delete().eq('document_id',docId);
      const res=await db.from('chatbot_documents').delete().eq('id',docId);
      if(res?.error) throw res.error;
      btn?.closest('.cb-doc-chip')?.remove();
      setDocStatus('Belge kaldırıldı.');
    }catch(e){
      alert('Belge silinemedi. Lütfen tekrar deneyin.');
    }
  };
  function renderEditor(bot){
    const root=document.getElementById('sanal-app'); if(!root)return; const qs=bot?.starters||[];
    kisiselEditDocs=[];
    const sample=JSON.stringify(botExportPayload(bot||{}),null,2);
    root.innerHTML=`<div style="height:100%;overflow:auto;padding:32px"><div class="sanal-editor"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><div class="sanal-editor-title">${bot?'Baristayı Düzenle':'Yeni Barista Oluştur'}</div></div><div class="sanal-editor-grid"><div><small>Kahve İkonu</small><input id="sanal-ed-icon" value="${esc(bot?.icon||'☕')}" style="width:64px;font-size:24px;text-align:center;background:#FFFFFF;border:1px solid rgba(26,21,16,.10);border-radius:13px;padding:8px;color:#1A1510"></div><div><small>Barista Adı</small><input id="sanal-ed-name" class="form-input" value="${esc(bot?.name||'')}" placeholder="örn. Campaign Coach"></div></div><div style="margin-bottom:12px"><small>Kısa Açıklama</small><input id="sanal-ed-desc" class="form-input" value="${esc(bot?.description||'')}" placeholder="Kullanıcının göreceği kısa açıklama"></div><div style="margin-bottom:12px"><small>Sistem Promptu / Yapay Zeka Talimatı</small><textarea id="sanal-ed-prompt" class="form-input" rows="7" placeholder="Bu barista nasıl davranacak? Hangi konuda uzman olacak?">${esc(bot?.system_prompt||'')}</textarea></div><div style="margin-bottom:12px"><small>Konuşma Başlatıcılar</small>${[0,1,2,3].map(i=>`<input id="sanal-ed-st-${i}" class="form-input" style="margin-bottom:7px" value="${esc(qs[i]||'')}" placeholder="Başlatıcı ${i+1}">`).join('')}</div><div style="margin-bottom:16px"><small>Belgeler</small><div id="sanal-saved-docs" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px"><span style="font-size:12px;color:#9D9186">Belgeler yükleniyor...</span></div><input type="file" id="sanal-doc-input" accept=".pdf,.txt,.md" style="display:none" onchange="kisiselHandleFile(this)"><button type="button" class="btn btn-ghost" style="font-size:12px;padding:7px 12px" onclick="document.getElementById('sanal-doc-input').click()">+ PDF / TXT Ekle</button><div id="sanal-doc-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div><div id="sanal-doc-status" style="font-size:11.5px;color:#9D9186;margin-top:7px;line-height:1.5"></div></div><div style="display:flex;align-items:center;gap:9px;margin-bottom:16px"><input id="sanal-ed-active" type="checkbox" ${bot?.is_active!==false?'checked':''} style="width:16px;height:16px;accent-color:#6E5E51"><label for="sanal-ed-active" style="font-size:13px;color:#5C4B38;cursor:pointer">Aktif — kullanıcılar görebilir ve konuşabilir</label></div><div id="sanal-save-debug" class="sanal-save-debug"></div><div class="sanal-editor-actions"><button class="btn btn-primary" onclick="kisiselSaveBot('${esc(bot?.id||'')}')">Kaydet</button><button class="btn btn-ghost" onclick="kisiselRender()">İptal</button></div><div class="sanal-import-box"><div class="sanal-import-head"><div class="sanal-import-title">JSON ile içe aktar / dışa aktar</div><button class="btn btn-ghost" style="font-size:12px;padding:5px 10px" onclick="kisiselExportBot()">Dışa Aktar</button></div><div class="sanal-import-help">Başka yerde hazırladığın chatbot/barista konfigürasyonunu buraya yapıştırıp alanlara aktarabilirsin. Desteklenen alanlar: name, icon, description, system_prompt, starters, is_active.</div><textarea id="sanal-ed-import" class="form-input" placeholder='${esc(sample)}'></textarea><div class="sanal-editor-actions" style="margin-top:10px"><button class="btn btn-ghost" onclick="kisiselImportBot()">JSON'u Alanlara Aktar</button></div></div></div></div>`;
    injectComingSoonControl(bot);
    renderKisiselPendingDocs();
    renderKisiselSavedDocs(bot?.id||'');
  }
  function injectComingSoonControl(bot){
    const active=document.getElementById('sanal-ed-active');
    if(!active || document.getElementById('sanal-ed-status')) return;
    const status=bot?.coming_soon?'coming':'active';
    const activeRow=active.closest('div');
    if(activeRow) activeRow.style.display='none';
    const row=document.createElement('div');
    row.className='sanal-status-row';
    row.innerHTML=`<small>Durum</small><select id="sanal-ed-status" class="sanal-status-select" onchange="syncSanalStatusFields()"><option value="active" ${status==='active'?'selected':''}>Aktif — kullanıcılar görebilir ve konuşabilir</option><option value="coming" ${status==='coming'?'selected':''}>Yakında — etiketi göster, sohbeti kapalı tut</option></select>`;
    activeRow?.after(row);
    syncSanalStatusFields();
  }
  window.syncSanalStatusFields=function(){
    const status=document.getElementById('sanal-ed-status')?.value||'active';
    const active=document.getElementById('sanal-ed-active');
    if(active) active.checked=true;
  };
  function getSanalEditorStatus(){
    return document.getElementById('sanal-ed-status')?.value || (document.getElementById('sanal-ed-active')?.checked?'active':'coming');
  }
  window.kisiselImportBot=function(){
    if(!requireAdminAction())return;
    const raw=document.getElementById('sanal-ed-import')?.value.trim();
    if(!raw){alert('Önce JSON konfigürasyonunu yapıştır.');return;}
    let data;try{data=JSON.parse(raw)}catch(e){alert('JSON okunamadı. Virgül, tırnak ve köşeli parantezleri kontrol et.');return;}
    const first=Array.isArray(data)?data[0]:data;
    if(!first||typeof first!=='object'){alert('Geçerli bir barista objesi bulunamadı.');return;}
    document.getElementById('sanal-ed-name').value=first.name||first.title||'';
    document.getElementById('sanal-ed-icon').value=first.icon||first.emoji||'☕';
    document.getElementById('sanal-ed-desc').value=first.description||first.desc||'';
    document.getElementById('sanal-ed-prompt').value=first.system_prompt||first.prompt||first.instructions||'';
    const importedStarters=first.starters||first.starter_questions||first.openers||[];
    [0,1,2,3].forEach(i=>{const el=document.getElementById('sanal-ed-st-'+i);if(el)el.value=importedStarters[i]||'';});
    const status=(first.coming_soon===true || first.is_coming_soon===true || first.status==='coming_soon')?'coming':'active';
    const select=document.getElementById('sanal-ed-status'); if(select) select.value=status;
    const active=document.getElementById('sanal-ed-active'); if(active) active.checked=status==='active';
  };
  window.kisiselExportBot=function(){
    const status=getSanalEditorStatus();
    const payload={name:document.getElementById('sanal-ed-name').value.trim(),icon:document.getElementById('sanal-ed-icon').value.trim()||'☕',description:document.getElementById('sanal-ed-desc').value.trim(),system_prompt:document.getElementById('sanal-ed-prompt').value.trim(),starters:[0,1,2,3].map(i=>document.getElementById('sanal-ed-st-'+i).value.trim()).filter(Boolean),is_active:true,coming_soon:status==='coming'};
    const box=document.getElementById('sanal-ed-import');if(box)box.value=JSON.stringify(payload,null,2);
  };
  window.kisiselSaveBot=async function(id){
    if(!requireAdminAction())return;
    const btn=(typeof event!=='undefined'&&event?.target)||document.querySelector('.sanal-editor-actions .btn-primary');
    if(btn){btn.disabled=true;btn.textContent='Kaydediliyor...';}
    const finishError=(msg)=>{alert(msg);if(btn){btn.disabled=false;btn.textContent='Kaydet';}};
    const name=document.getElementById('sanal-ed-name').value.trim();
    if(!name){finishError('Barista adı gerekli.');return;}
    const existingId=isUuid(id)?id:'';
    const status=getSanalEditorStatus();
    const comingSoon=status==='coming';
    const item=normalizeBot({id:existingId||uid('barista'),name,icon:document.getElementById('sanal-ed-icon').value.trim()||'☕',description:document.getElementById('sanal-ed-desc').value.trim(),system_prompt:document.getElementById('sanal-ed-prompt').value.trim(),starters:[0,1,2,3].map(i=>document.getElementById('sanal-ed-st-'+i).value.trim()).filter(Boolean),is_active:true,coming_soon:comingSoon,sort_order:existingId?(botById(existingId).sort_order||0):botsCache.length+1,status:comingSoon?'coming_soon':'active'});
    writeStatusOverride(item.id,comingSoon?'coming':'active');
    const existingIdx=botsCache.findIndex(b=>String(b.id)===String(item.id));
    if(existingIdx>=0) botsCache[existingIdx]={...botsCache[existingIdx],...item};
    const saved=await Promise.race([
      saveBotToDb(item),
      new Promise(resolve=>setTimeout(()=>{window.__lastKisiselBaristanError='Kaydetme işlemi 9 saniyede tamamlanmadı.';resolve(false);},9000))
    ]);
    if(!saved){finishError('Kaydetme işlemi başarısız oldu. Lütfen tekrar deneyin.');return;}
    const docsSaved=await ingestKisiselDocs(item.id);
    if(!docsSaved){finishError('Barista kaydedildi, belge yüklenemedi. Lütfen tekrar deneyin.');return;}
    await loadBots();
    activeBotId=item.id; activeThreadId=null; activeChatSessionId=null; tempMessages=[]; renderShell();
  };

  // Kişisel Baristan: inline onclick bozulursa hafif event delegation yedeği
  document.addEventListener('click', function(e){
    const newBtn=e.target.closest('.sanal-new-btn');
    if(newBtn && typeof window.kisiselNewBot==='function'){ e.preventDefault(); window.kisiselNewBot(); return; }
  }, false);
  window.kisiselRender=function(){renderShell();};
  window.sanalOpenBot=window.kisiselOpenBot; window.sanalOpenHistory=window.kisiselOpenHistory; window.sanalStarter=window.kisiselStarter; window.sanalSend=window.kisiselSend; window.sanalNewBot=window.kisiselNewBot; window.sanalEditBot=window.kisiselEditBot; window.sanalDeleteBot=window.kisiselDeleteBot; window.sanalRender=window.kisiselRender;
  const oldGo=window.go; window.go=function(page,el){const r=oldGo?oldGo.apply(this,arguments):undefined;if(page==='sanal')setTimeout(refresh,0);return r;};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0));else setTimeout(refresh,0);
})();

/* Ders detayını indirilebilir kaynaklar bölümüyle yeniden çiz */
(function(){
  const oldRender=window.renderEgitimLessonContent;
  window.renderEgitimLessonContent=function(lessonId){
    const l=(window.egitimLessons||egitimLessons||[]).find(x=>x.id===lessonId); if(!l){ if(oldRender) return oldRender(lessonId); return; }
    let videoSectionHtml='';
    if(l.video_url){const url=l.video_url;let videoEl='';const wistiaMatch=url.match(/wistia\.(?:com|net)\/(?:medias|embed\/iframe)\/([a-zA-Z0-9]+)/); if(wistiaMatch) videoEl=`<iframe src="https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}?playerColor=8d8277&videoFoam=false" allowfullscreen allowtransparency style="width:100%;height:100%;border:0;display:block;background:#000"></iframe>`; else if(url.includes('vimeo.com')){const id=url.split('/').filter(Boolean).pop(); videoEl=`<iframe src="https://player.vimeo.com/video/${id}" allowfullscreen></iframe>`;} else {const yt=typeof youtubeEmbedUrl==='function'?youtubeEmbedUrl(url):''; if(yt) videoEl=`<iframe src="${escHtml(yt)}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`; else videoEl=`<video src="${escHtml(url)}" controls style="width:100%;height:100%;background:#000"></video>`;} videoSectionHtml=`<div class="ec-video-container"><div class="ec-video-wrap">${videoEl}</div></div>`;} else videoSectionHtml='';
    const adminActions=(typeof egitimIsAdmin==='function'&&egitimIsAdmin())?`<div class="ec-admin-actions"><button class="ec-admin-btn" title="Dersi düzenle" onclick="openEgitimDersModal(${l.topic_id},${l.id})"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2l3 3-8 8H3v-3z"/></svg></button><button class="ec-admin-btn red" title="Dersi sil" onclick="deleteEgitimDers(${l.id})"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9"/></svg></button></div>`:'';
    const descHtml=l.description?`<div style="padding:0 28px 24px;font-size:14px;color:var(--color-text-secondary);line-height:1.75;white-space:pre-line">${escHtml(l.description)}</div>`:'';
    const downloads=l.resource_url?`<div class="ec-downloads"><div class="ec-downloads-label">CONTENT</div><div class="ec-downloads-box"><div class="ec-downloads-head"><span style="color:#B7ACA1">⌄</span><span>İndirilebilir Kaynaklar</span><span style="font-size:12px;color:#4E9E68;font-weight:800">Kaynak mevcut</span></div><a class="ec-download-item" href="${escHtml(l.resource_url)}" target="_blank" download><span>🔗 Kaynaklar & Şablonlar</span><span style="color:#A2968B;font-size:20px">→</span></a></div></div>`:'';
    document.getElementById('egitim-content-panel').innerHTML=`<div class="ec-content-card"><div class="ec-content-header"><h1 class="ec-lesson-title">${escHtml(l.title)}</h1>${adminActions}</div>${descHtml}${videoSectionHtml}${downloads}</div>`;
  };
})();

/* Kişisel Baristan ilk açılışta statik/eksik render kalmasın diye tek seferlik hafif refresh patch. */
(function(){
  function lightRefreshKisiselBaristan(){
    try{
      var page=document.getElementById('page-sanal');
      var app=document.getElementById('sanal-app');
      if(!app) return;
      if(typeof window.kisiselRender==='function'){
        window.kisiselRender();
      }
    }catch(e){
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(lightRefreshKisiselBaristan, 350);
      setTimeout(lightRefreshKisiselBaristan, 900);
    }, {once:true});
  }else{
    setTimeout(lightRefreshKisiselBaristan, 350);
    setTimeout(lightRefreshKisiselBaristan, 900);
  }
})();

/* PATCH V11 — Kişisel Baristan üst aksiyonları ilk açılışta görünür */
(function(){
  if (window.__kisiselHeaderActionsAlwaysVisibleV11) return;
  window.__kisiselHeaderActionsAlwaysVisibleV11 = true;

  function forceKisiselHeaderActions(){
    try {
      const root = document.getElementById('sanal-app');
      if (!root) return;

      const panelHead = root.querySelector('.sanal-panel-head');
      if (panelHead && !panelHead.querySelector('.sanal-new-btn')) {
        const btn = document.createElement('button');
        btn.className = 'sanal-new-btn';
        btn.type = 'button';
        btn.textContent = '+ Yeni Barista';
        btn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); if (window.kisiselNewBot) window.kisiselNewBot(); };
        panelHead.appendChild(btn);
      }

      const top = root.querySelector('.sanal-chat-top');
      const hasActiveBot = root.querySelector('.sanal-list-item.active, .sanal-bot-row.active');
      if (top) {
        const title = top.querySelector('.sanal-chat-title')?.textContent?.trim() || '';
        const targetText = title && title !== 'Kişisel Baristan' ? 'Baristayı Düzenle' : '+ Yeni Barista Oluştur';
        const already = top.querySelector('[data-kisisel-header-action="true"]') ||
          Array.from(top.querySelectorAll('button')).some(b => (b.textContent || '').trim() === targetText);
        if (!already) {
          const btn = document.createElement('button');
          btn.className = title && title !== 'Kişisel Baristan' ? 'btn btn-ghost' : 'btn btn-primary';
          btn.type = 'button';
          btn.dataset.kisiselHeaderAction = 'true';
          btn.style.marginLeft = 'auto';
          btn.textContent = targetText;
          btn.onclick = function(e){
            e.preventDefault();
            e.stopPropagation();
            const activeId = window.activeBotId || window.kisiselActiveBotId || window.currentBotId || null;
            if (btn.textContent.includes('Düzenle') && activeId && window.kisiselEditBot) return window.kisiselEditBot(activeId);
            if (btn.textContent.includes('Düzenle') && window.botsCache && window.botsCache[0] && window.kisiselEditBot) return window.kisiselEditBot(window.botsCache[0].id);
            if (window.kisiselNewBot) return window.kisiselNewBot();
          };
          top.appendChild(btn);
        }
      }
    } catch(e) {}
  }

  const originalRender = window.kisiselRender;
  if (typeof originalRender === 'function') {
    window.kisiselRender = function(){
      const result = originalRender.apply(this, arguments);
      requestAnimationFrame(forceKisiselHeaderActions);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded', function(){
    requestAnimationFrame(forceKisiselHeaderActions);
    setTimeout(forceKisiselHeaderActions, 250);
    setTimeout(forceKisiselHeaderActions, 900);
  }, { once:true });

  document.addEventListener('click', function(e){
    if (e.target && e.target.closest && e.target.closest('[data-page="sanal"], [onclick*="sanal"], [onclick*="kisisel"]')) {
      setTimeout(forceKisiselHeaderActions, 0);
    }
  }, true);
})();