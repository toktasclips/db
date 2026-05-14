if(typeof location!=='undefined'&&location.protocol==='file:'){document.addEventListener('DOMContentLoaded',function(){document.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:16px;color:#5C4B38;text-align:center;padding:32px">Lütfen sistemi local dosya olarak değil, bir sunucu üzerinden çalıştırın.</div>';});}
const SUPABASE_URL = 'https://krljaqrhyszeleiwwkmd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybGphcXJoeXN6ZWxlaXd3a21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTY0MjksImV4cCI6MjA4OTMzMjQyOX0.rilLVl17MjmlSO2mWzRVFXpjhRXZTh30SVWMDw5UUlE';
let sb = null;
try {
  const _sup = (typeof supabase !== 'undefined' && supabase && supabase.createClient)
    ? supabase
    : (window.supabase && window.supabase.createClient ? window.supabase : null);
  if (_sup) {
    sb = _sup.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
  }
} catch(e) {
  sb = null;
}
function showSupabaseConnectionError(targetId){
  const msg = 'Supabase bağlantısı kurulamadı. Canlı sitede CDN, internet veya script izinleri engelleniyor olabilir.';
  const target = targetId ? document.getElementById(targetId) : null;
  if (target) {
    target.innerHTML = `<div style="margin:20px;padding:16px;border:1px solid rgba(184,50,50,.18);background:rgba(184,50,50,.06);border-radius:12px;color:#8f2a2a;font-size:13px;line-height:1.6">${msg}</div>`;
  }
  return msg;
}

// ── Instagram / Meta Entegrasyon Sabitleri ────────────────────────────
// META_APP_ID: Meta Developer Console'dan alın (App Settings → Basic → App ID)
// Bu değer public'tir (client_id), frontend'de tutulması güvenlidir.
// App Secret ASLA buraya yazılmaz — Supabase Edge Function secret olarak tanımlanır.
const META_APP_ID       = '1534643378177320';
const IG_OAUTH_FN       = `${SUPABASE_URL}/functions/v1/instagram-oauth`;
const IG_SYNC_FN        = `${SUPABASE_URL}/functions/v1/instagram-sync`;
const META_ADS_SYNC_FN  = `${SUPABASE_URL}/functions/v1/meta-ads-sync`;
const IG_RESEARCH_FN    = `${SUPABASE_URL}/functions/v1/instagram-research`;
const CHATBOT_INGEST_FN = `${SUPABASE_URL}/functions/v1/chatbot-ingest`;
const CHATBOT_CHAT_FN   = `${SUPABASE_URL}/functions/v1/chatbot-chat`;

// ===== SUPABASE LOAD / SAVE =====
async function loadFromSupabase(){
  if (!sb) {
    showSupabaseConnectionError();
    return;
  }
  try {
    const isAdmin = currentUser?.role === 'admin';
    const email = currentUser?.email || '';

    // Herkes sadece kendi verisini görür
    const cq = sb.from('clients').select('*').eq('user_id', email).order('created_at');
    const lq = sb.from('leads').select('*').eq('user_id', email).order('created_at');
    const gq = sb.from('goals').select('*').eq('user_id', email).order('created_at');
    const mq = sb.from('milestones').select('*').eq('user_id', email).order('created_at');
    const dq = sb.from('daily_entries').select('*').eq('user_id', email).order('created_at');

    const [clients, leads, goals, milestones, daily, offers, usersData, ownClientRes] = await Promise.all([
      cq, lq, gq, mq, dq,
      sb.from('offers').select('*').eq('user_id', email).order('created_at'),
      sb.from('users').select('*').order('created_at'),
      // Non-admin: kendi müşteri kaydını email ile bul (admin tarafından oluşturulmuş)
      !isAdmin ? sb.from('clients').select('*').eq('email', email).maybeSingle() : Promise.resolve({data:null})
    ]);

    if(clients.data?.length) state.clients = clients.data.map(c=>({
      id:c.id, name:c.name, type:c.type, status:c.status,
      email:c.email||'', phone:c.phone||'', sessions:c.sessions||0,
      remainingSessions:c.remaining_sessions||0,
      programEnd:c.program_end||'', startDate:c.start_date||'',
      program:c.program||'', health:c.health||5,
      notes:c.notes||[], start:c.start_date||'', social:c.social||''
    }));

    // Non-admin: kendi müşteri kaydı (admin tarafından oluşturulmuş, email eşleşmesi ile)
    if(ownClientRes?.data) {
      const oc = ownClientRes.data;
      state.ownClient = {
        id:oc.id, name:oc.name, type:oc.type, status:oc.status,
        email:oc.email||'', phone:oc.phone||'', sessions:oc.sessions||0,
        remainingSessions:oc.remaining_sessions||0,
        programEnd:oc.program_end||'', startDate:oc.start_date||'',
        program:oc.program||'', health:oc.health||5,
        notes:oc.notes||[], start:oc.start_date||'', social:oc.social||''
      };
    }

    if(leads.data?.length) state.leads = leads.data.map(l=>({
      id:l.id, name:l.name, type:l.type||'', social:l.social||'', source:l.source,
      stage:l.stage, tutar:l.tutar||0, teklifId:l.teklif_id||'', note:l.note||'', notes:l.notes||[]
    }));

    if(goals.data?.length) state.goals = goals.data.map(g=>({
      id:g.id, name:g.name, date:g.date, icon:g.icon||'🎯', done:g.done||false, notes:g.notes||[]
    }));

    if(milestones.data?.length) state.milestones = milestones.data.map(m=>({
      id:m.id, title:m.title, date:m.date, status:m.status, notes:m.notes||[]
    }));

    if(daily.data?.length) state.daily = daily.data.map(d=>({
      id:d.id, date:d.entry_date, dateShort:d.entry_date, mood:d.mood,
      takipci:d.takipci||0, mail:d.mail||0, icerik:d.icerik||0,
      reklam:d.reklam||0, tpm:d.tpm||0, hotlist:d.hotlist||0,
      musteri:d.musteri||0, teklif:d.teklif||0, alinan:d.alinan||0,
      anlasma:d.anlasma||0, yorum:d.yorum||'', win:d.win||''
    }));

    if(usersData.data?.length) users = usersData.data.map(u=>({
      id:u.id, name:u.name, email:u.email, password:u.password
    }));

    if(offers.data?.length) state.offers = offers.data.map(o=>({
      id:o.id, name:o.name, price:o.price||0,
      duration_value:o.duration_value||null, duration_unit:o.duration_unit||'Ay',
      desc:o.description||''
    }));

    // teklifler dizisini de doldur (lead panelinde teklif seçimi için)
    if(offers.data?.length) teklifler = offers.data.map(r=>({
      id: r.id, name: r.name||'', category: r.category||'',
      price: r.price||0,
      duration_value: r.duration_value||null, duration_unit: r.duration_unit||'Ay',
      description: r.description||'', status: r.status||'Aktif',
      created_at: r.created_at||''
    }));

    render();
  } catch(e){  render(); }
}

async function saveClient(c){
  const row = {
    name:c.name, type:c.type||'', status:c.status||'Yeni', email:c.email||'',
    phone:c.phone||'', social:c.social||null, sessions:c.sessions||0, remaining_sessions:c.remainingSessions||0,
    program_end:c.programEnd&&c.programEnd!==''?c.programEnd:null,
    start_date:c.startDate&&c.startDate!==''?c.startDate:null,
    program:c.program||null, health:c.health||5, notes:c.notes||[],
    user_id: currentUser?.role==='admin' ? (c.user_id||currentUser.email) : currentUser?.email||null
  };
  if(!c.id || c._new){
    const r=await sb.from('clients').insert(row).select().single();
    if(r.error){toast('Kayıt hatası: '+r.error.message);return;}
    if(r.data){c.id=+r.data.id; c._new=false;}
  } else {
    const r=await sb.from('clients').update(row).eq('id',c.id);
    if(r.error){toast('Güncelleme hatası: '+r.error.message);}
  }
}

async function deleteSBClient(id){ await sb.from('clients').delete().eq('id',id); }

async function saveLead(l){
  const row={name:l.name,type:l.type||'',social:l.social||'',source:l.source,stage:l.stage,tutar:l.tutar||0,teklif_id:l.teklifId||null,note:l.note||'',notes:l.notes||[],user_id:currentUser?.email||null};
  if(l._new){ const r=await sb.from('leads').insert(row).select().single(); if(r.data)l.id=r.data.id; l._new=false; }
  else { await sb.from('leads').update(row).eq('id',l.id); }
}
async function deleteSBLead(id){ await sb.from('leads').delete().eq('id',id); }

function openGoalPanel(id){
  const g=state.goals.find(x=>+x.id===+id);if(!g)return;
  state.currentGoalId=id;
  document.getElementById('goal-panel-title').textContent=g.name;
  document.getElementById('goal-panel-name').value=g.name;
  document.getElementById('goal-panel-date').value=g.date||'';
  const btnActive=document.getElementById('goal-btn-active');
  const btnDone=document.getElementById('goal-btn-done');
  if(g.done){
    btnDone.style.background='rgba(52,199,89,0.12)';btnDone.style.color='#248a3d';
    btnActive.style.background='';btnActive.style.color='';
  } else {
    btnActive.style.background='rgba(0,113,227,0.1)';btnActive.style.color='#0071e3';
    btnDone.style.background='';btnDone.style.color='';
  }
  renderGoalNotes(g);
  openPanel('panel-goal');
}

function renderGoalNotes(g){
  const el=document.getElementById('goal-panel-notes');if(!el)return;
  if(!g.notes||!g.notes.length){el.innerHTML='<div style="font-size:13px;color:var(--color-text-muted);padding:4px 0">Henüz not yok</div>';return;}
  el.innerHTML=g.notes.map((n,i)=>`
    <div class="note-item">${escHtml(n)}
      <button class="note-del" onclick="delGoalNote(${i})">✕</button>
    </div>`).join('');
}

function addNoteToGoal(){
  const inp=document.getElementById('goal-note-input'),v=inp.value.trim();if(!v)return;
  const g=state.goals.find(x=>+x.id===+state.currentGoalId);if(!g)return;
  if(!g.notes)g.notes=[];
  g.notes.push(v);inp.value='';renderGoalNotes(g);renderGoals();renderDashGoals();toast('Not eklendi ✓');
  saveGoal(g);
}

function delGoalNote(i){
  const g=state.goals.find(x=>+x.id===+state.currentGoalId);if(!g)return;
  g.notes.splice(i,1);renderGoalNotes(g);renderGoals();
  saveGoal(g);
}

function setGoalDone(done){
  const g=state.goals.find(x=>+x.id===+state.currentGoalId);if(!g)return;
  g.done=done;
  const btnActive=document.getElementById('goal-btn-active');
  const btnDone=document.getElementById('goal-btn-done');
  if(done){
    btnDone.style.background='rgba(52,199,89,0.12)';btnDone.style.color='#248a3d';
    btnActive.style.background='';btnActive.style.color='';toast('Hedef tamamlandı 🎉');
  } else {
    btnActive.style.background='rgba(0,113,227,0.1)';btnActive.style.color='#0071e3';
    btnDone.style.background='';btnDone.style.color='';toast('Hedef aktife alındı');
  }
  renderGoals();renderDashGoals();saveGoal(g);
}

function saveGoalEdits(){
  const g=state.goals.find(x=>+x.id===+state.currentGoalId);if(!g)return;
  g.name=document.getElementById('goal-panel-name').value.trim()||g.name;
  g.date=document.getElementById('goal-panel-date').value||g.date;
  document.getElementById('goal-panel-title').textContent=g.name;
  renderGoals();renderDashGoals();toast('Kaydedildi ✓');saveGoal(g);
}

function deleteCurrentGoal(){
  if(!confirm('Bu hedefi silmek istiyor musun?'))return;
  const id=state.currentGoalId;
  state.goals=state.goals.filter(x=>+x.id!==+id);
  closePanel('panel-goal');renderGoals();renderDashGoals();toast('Hedef silindi');
  deleteSBGoal(id);
}

async function saveGoal(g){
  const row={name:g.name,date:g.date,icon:g.icon||'🎯',done:g.done||false,notes:g.notes||[],user_id:currentUser?.email||null};
  if(g._new){
    const r=await sb.from('goals').insert(row).select().single();
    if(r.error){toast('Hata: '+r.error.message);return;}
    if(r.data){g.id=r.data.id;}
    g._new=false;
  } else {
    const r=await sb.from('goals').update(row).eq('id',+g.id);
    if(r.error){toast('Hata: '+r.error.message);}
  }
}
async function deleteSBGoal(id){ await sb.from('goals').delete().eq('id',id); }

async function saveMilestone(m){
  const row={title:m.title,date:m.date,status:m.status,notes:m.notes||[],user_id:currentUser?.email||null};
  if(m._new){ const r=await sb.from('milestones').insert(row).select().single(); if(r.data)m.id=r.data.id; m._new=false; }
  else { await sb.from('milestones').update(row).eq('id',m.id); }
}
async function deleteSBMilestone(id){ await sb.from('milestones').delete().eq('id',id); }

async function saveDailyEntry(entry){
  const row={
    entry_date:entry.dateShort||new Date().toISOString().split('T')[0],
    mood:entry.mood,
    takipci:entry.takipci,mail:entry.mail,icerik:entry.icerik,
    reklam:entry.reklam,tpm:entry.tpm,hotlist:entry.hotlist,
    musteri:entry.musteri,teklif:entry.teklif,alinan:entry.alinan,
    anlasma:entry.anlasma,yorum:entry.yorum,win:'',
    user_id:currentUser?.email||null
  };
  const r=await sb.from('daily_entries').insert(row).select().single();
  if(r.error){toast('Kayıt hatası: '+r.error.message);return;}
  if(r.data) entry.id=r.data.id;
}

async function saveOffer(o){
  // Use duration_value/duration_unit columns (consistent with loadTeklifler / insertTeklifSB)
  const row={
    name:o.name, price:o.price||0,
    duration_value:o.duration_value||null, duration_unit:o.duration_unit||'Ay',
    description:o.desc||o.description||''
  };
  if(o._new){ const r=await sb.from('offers').insert(row).select().single(); if(r.data)o.id=r.data.id; o._new=false; }
  else { await sb.from('offers').update(row).eq('id',o.id); }
}
async function deleteSBOffer(id){ await sb.from('offers').delete().eq('id',id); }