// ===== STATE =====
const state = {
  clients:[],
  leads:[],
  goals:[],
  milestones:[],
  daily:[],
  offers:[],
  ownClient:null,
  currentClientId:null,
  currentMsId:null,
  currentLeadId:null,
  currentGoalId:null
};

const dbContent = {
  bots:[
    {icon:'🤖',title:'Mehmet Bot',desc:'Koçluk/danışmanlık/eğitim işinin büyümesinde rehberlik eder. Programdaki her şeyi benimle konuşur gibi yapabilirsin.',categories:['Satış','Pazarlama','Operasyon','Fikir Alışverişi'],url:'https://chatgpt.com/g/g-68f09ea4f3c8819191049164e6f11eec-mehmet-bot'},
    {icon:'☕',title:'Dijital Barista™ | Optimizasyon',desc:'Sosyal medya hesabını ekosisteminin en değerli yerine getir, optimize et ve en iyi haline taşı.',categories:['Pazarlama'],url:'https://chatgpt.com/g/g-6895e14abefc8191b854f2b6083d753d-dijital-baristatm-optimizasyon'},
    {icon:'☕',title:'Dijital Barista™ | Persona ve Konumlandırma',desc:'Hedef kitleni belirle, onların görebileceği şekilde konumlan ve kendi "kült"ünü oluştur.',categories:['Pazarlama','Satış'],url:'https://chatgpt.com/g/g-689398a255bc81919013a2947d14cc47-dijital-baristatm-persona-ve-konumlandirma'},
    {icon:'☕',title:'Dijital Barista™ | Teklif',desc:'Paketlerini tasarla, fiyatlandırmalarını oluştur.',categories:['Satış'],url:'https://chatgpt.com/g/g-68938aea07cc8191accc898bcbaaff84-dijital-baristatm-teklif'},
    {icon:'☕',title:'Dijital Barista™ | Satış Kurgusu',desc:'Instagram ve mail listene satış yap. Hazır story kurgularından ve önceden kurgulanmış akışlardan yararlan.',categories:['Satış','Pazarlama'],url:'https://chatgpt.com/g/g-67e6c0a4846081919abca7a83cfc9cf1-dijital-baristatm-satis-kurgusu'},
    {icon:'⚡',title:'Dijital Barista™ | ToktasGPT 3.0',desc:'Reklamlara para yakma devrini bitirdim — organik olarak yüz binlerce izlenip işini içerikle pazarla.',categories:['Pazarlama'],url:'https://chatgpt.com/g/g-67dc540760248191ace3853d72421e4f-dijital-baristatm-toktasgpt-3-0'}
  ],
  sales:[
    {icon:'🗺️',title:'Kampanya Mimarisi GPT',desc:'Bir haftada bir aylık satış yapmak için takip etmen gereken lansman planı.',categories:['Satış','Pazarlama'],url:'https://chatgpt.com/g/g-698a59fe7d648191a67996da92e2127c-kampanya-mimarisi-gpt'},
    {icon:'💪',title:'Eforsuz Teklif Güçlendirici™',desc:'Teklifini herkese uygun hale getir, mevcut müşterinle daha uzun süreler çalış.',categories:['Satış'],url:'https://chatgpt.com/g/g-696be8e778e88191b7e5d708cc7d1e84-eforsuz-teklif-guclendiricitm'}
  ],
  kits:[
    {icon:'✋',title:'Momentum - Hand Raiser',desc:'El uzatan içeriği saniyeler içinde oluştur.',categories:['Satış'],url:'https://chatgpt.com/g/g-696f936ba9248191bf93d6fd0697d61c-momentum-hand-raiser'},
    {icon:'📋',title:'Momentum Teklifi',desc:'Teklifini birkaç dakika içinde netleştir, buradan iyi bir taslak alacaksın.',categories:['Satış'],url:'https://chatgpt.com/g/g-696f69119b308191aa5174a5630e5673-momentum-teklifi'},
    {icon:'📄',title:'Momentum - Teklif Dokümanı',desc:'8 soruya cevap vererek programını birkaç dakikada teklif dosyasına dök.',categories:['Satış','Operasyon'],url:'https://chatgpt.com/g/g-696f5a13eb2881919666eea856162696-momentum-teklif-dokumani'}
  ]
};

// Escape HTML to prevent XSS when injecting user data via innerHTML
function escHtml(str){
  if(str==null) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

let clientFilter='all', clientSearch='';
const avCls=['av-blue','av-green','av-orange','av-red','av-purple','av-teal'];
const ini=n=>(n||'').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
const avc=i=>avCls[i%avCls.length];
const bCls=s=>({Aktif:'b-green',Yeni:'b-amber',Takip:'b-red',Tamamlandı:'b-gray'}[s]||'b-gray');

// ===== NAV =====
const dailyWelcomes = [
  {msg:'Hoş geldin! ☀️', sub:'Bugün harika şeyler olacak, hadi başlayalım.'},
  {msg:'Selam! 👋', sub:'Yeni bir gün, yeni bir fırsat. Hazır mısın?'},
  {msg:'İyi günler! 🌟', sub:'Bugünkü verilerini girmek için mükemmel bir zaman.'},
  {msg:'Hey, hoş geldin! 🚀', sub:'Bugün yapacak çok işimiz var, hadi gidelim!'},
  {msg:'Günaydın! ☕', sub:'Kahveni al, bugünü takip edelim.'},
  {msg:'Merhaba! 🎯', sub:'Günlük verilerini girerek süreci takip et.'},
  {msg:'Harika görünüyorsun! 💪', sub:'Bugün de güçlü bir gün olacak.'},
  {msg:'Tekrar hoş geldin! ✨', sub:'Sisteme girdin, harika. Devam edelim.'},
  {msg:'Selam, ustam! 🔥', sub:'Bugün de rekoru kıralım.'},
  {msg:'İyi günler! 🌈', sub:'Her veri bir adım, hadi birlikte büyüyelim.'}
];

function showDailyWelcome(){
  const w = dailyWelcomes[Math.floor(Math.random()*dailyWelcomes.length)];
  const el = document.getElementById('daily-welcome-msg');
  const sub = document.getElementById('daily-welcome-sub');
  if(el) el.textContent = w.msg;
  if(sub) sub.textContent = w.sub;
  prefillTakipciFromIG();
}

let igDailyFollowers = 0;
let igDailyAdSpend   = 0;
let igDailyCPF       = 0;

async function prefillTakipciFromIG(dateStr){
  if(!dateStr) dateStr = document.getElementById('daily-entry-date').value || new Date().toISOString().split('T')[0];

  // Follower count: latest snapshot on or before dateStr
  try {
    const { data: snap } = await sb
      .from('instagram_account_snapshots')
      .select('follower_count')
      .eq('user_id', currentUser.email)
      .lte('snapshot_date', dateStr)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    igDailyFollowers = snap?.follower_count || 0;
    const takipciEl = document.getElementById('kpi-takipci');
    if(takipciEl && !takipciEl.value && igDailyFollowers > 0) takipciEl.value = igDailyFollowers;
  } catch(e) { igDailyFollowers = 0; }

  // Content status: any media published on dateStr
  try {
    const { data: media } = await sb
      .from('instagram_media')
      .select('media_id')
      .eq('user_id', currentUser.email)
      .gte('published_at', dateStr + 'T00:00:00')
      .lte('published_at', dateStr + 'T23:59:59')
      .limit(1);
    const hasContent = !!(media && media.length > 0);
    icerikPaylasildi = hasContent;
    const icerikEl = document.getElementById('kpi-icerik');
    if(icerikEl && !icerikEl.value) icerikEl.value = hasContent ? '1' : '0';
  } catch(e) {}

  // Ad spend + CPF
  try {
    const [adResult, prevSnapResult] = await Promise.all([
      sb.from('meta_ad_insights').select('spend')
        .eq('user_id', currentUser.email).eq('insight_date', dateStr),
      sb.from('instagram_account_snapshots').select('follower_count')
        .eq('user_id', currentUser.email).lt('snapshot_date', dateStr)
        .order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
    ]);
    const totalSpend = (adResult.data ?? []).reduce((s, r) => s + (+r.spend || 0), 0);
    igDailyAdSpend = totalSpend;
    const reklamEl = document.getElementById('kpi-reklam');
    if(reklamEl && !reklamEl.value && totalSpend > 0) reklamEl.value = totalSpend.toFixed(2);

    const prevFollowers = prevSnapResult.data?.follower_count ?? null;
    const gain = (igDailyFollowers > 0 && prevFollowers != null) ? igDailyFollowers - prevFollowers : null;
    igDailyCPF = (gain != null && gain > 0 && totalSpend > 0) ? totalSpend / gain : 0;
    const tpmEl = document.getElementById('kpi-tpm');
    if(tpmEl && !tpmEl.value && igDailyCPF > 0) tpmEl.value = igDailyCPF.toFixed(2);
  } catch(e) { igDailyAdSpend = 0; igDailyCPF = 0; }
}

function updateIcerikBadge(hasContent){ /* no-op: replaced by select input */ }

function onDailyDateChange(dateStr){
  if(dateStr) prefillTakipciFromIG(dateStr);
}

const NAV_GROUPS = {
  operasyon: ['musteri-yonetimi','health','musteriler','client-reports','leads'],
  istakibi:  ['goals','competitors','teklifler']
};

function toggleNavGroup(name) {
  const hd = document.querySelector(`#navgroup-${name} .nav-group-hd`);
  const bd = document.getElementById(`navgroupbd-${name}`);
  if(!hd||!bd) return;
  const open = bd.classList.toggle('open');
  hd.classList.toggle('open', open);
}

function openNavGroupFor(pageId) {
  Object.entries(NAV_GROUPS).forEach(([name, pages]) => {
    if(pages.includes(pageId)) {
      const bd = document.getElementById(`navgroupbd-${name}`);
      const hd = document.querySelector(`#navgroup-${name} .nav-group-hd`);
      if(bd) { bd.classList.add('open'); }
      if(hd) { hd.classList.add('open'); }
    }
  });
}

function go(id,el){
  if(!checkAccess()) return; // block expired users on every navigation
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  if(el) el.classList.add('active');
  openNavGroupFor(id);
  closeAllPanels();
  if(id==='daily') showDailyWelcome();
  if(id==='client-reports') renderClientReports();
  if(id==='competitors') setTimeout(()=>{ if(!competitors.length) loadCompetitorsSB(); else renderCompetitors(); },50);
  if(id==='musteriler') setTimeout(loadMusteriler, 50);
  if(id==='teklifler') setTimeout(loadTeklifler, 50);
  if(id==='kazanimlar') setTimeout(loadKazanimlarPage, 50);
  if(id==='instagram') setTimeout(loadInstagramPage, 50);
  if(id==='asistanlar') setTimeout(loadAsistanlarPage, 50);
  if(id==='implementation') setTimeout(loadImplementationPage, 50);
  if(id==='musteri-yonetimi') setTimeout(loadMusteriYonetimi, 50);
  if(id==='forum') setTimeout(loadForum, 50);
  if(id==='guncellemeler') setTimeout(renderGuncellemeler, 50);
  if(id==='barista') setTimeout(loadToolboxItems, 50);
  if(id==='odevler') setTimeout(loadOdevler, 50);
  if(id==='egitim') setTimeout(loadEgitim, 50);
  if(id==='onboarding') setTimeout(loadOnboardingPage, 50);
  if(id==='mesajlar') setTimeout(loadMesajlar, 50);
  if(id==='daily')  setTimeout(loadSalesTicker, 80);
  render();
}

// ===== RENDER =====
function healthColor(s){return s>=7?'var(--color-green)':s>=4?'var(--color-amber)':'#ff3b30';}
function healthLabel(s){return s>=7?'Sağlıklı':s>=4?'Risk Altında':'Kritik';}

// ── Remaining days — single source of truth ───────────────────
function remainingDays(endDateStr){
  if(!endDateStr||endDateStr==='—'||endDateStr==='') return null;
  const end=new Date(endDateStr+(endDateStr.includes('T')?'':'T00:00:00'));
  const today=new Date(); today.setHours(0,0,0,0);
  return Math.floor((end-today)/(1000*60*60*24));
}
function remainingDaysLabel(days){
  if(days===null) return '—';
  if(days>0) return `${days} gün`;
  if(days===0) return 'Bugün bitiyor';
  return 'Süresi doldu';
}
function remainingDaysColor(days){
  if(days===null) return 'var(--color-text-muted)';
  if(days>14) return 'var(--color-green)';
  if(days>0)  return 'var(--color-amber)';
  return 'var(--color-red)';
}

// ── Access control ────────────────────────────────────────────
function getUserClient(){
  if(!currentUser) return null;
  if(currentUser.role==='admin') return null;
  // Non-admin: admin tarafından oluşturulan kayıt, email eşleşmesiyle yüklenir
  return state.ownClient || null;
}

function isUserExpired(){
  if(!currentUser||currentUser.role==='admin') return false;
  const c=getUserClient();
  if(!c||!c.programEnd) return false;
  const d=remainingDays(c.programEnd);
  return d!==null&&d<0;
}

function checkAccess(){
  if(isUserExpired()){ showBlockScreen(); return false; }
  return true;
}

function showBlockScreen(){
  document.getElementById('app-root').style.display='none';
  document.getElementById('block-screen').style.display='flex';
}

function renderExpiryBadge(){
  const el=document.getElementById('expiry-badge');
  if(!el) return;
  if(!currentUser||currentUser.role==='admin'){ el.style.display='none'; return; }
  const c=getUserClient();
  if(!c||!c.programEnd){ el.style.display='none'; return; }
  const days=remainingDays(c.programEnd);
  if(days===null){ el.style.display='none'; return; }
  let bg,color,border,text;
  if(days<0){
    bg='rgba(229,115,115,0.15)'; color='#e57373'; border='rgba(229,115,115,0.35)'; text='Süre Doldu';
  } else if(days<=7){
    bg='rgba(255,183,77,0.15)'; color='#ffb74d'; border='rgba(255,183,77,0.35)'; text=days===0?'Son gün':days+' gün kaldı';
  } else {
    bg='rgba(255,255,255,0.07)'; color='rgba(255,255,255,0.45)'; border='rgba(255,255,255,0.12)'; text=days+' gün kaldı';
  }
  el.style.display='block';
  el.style.background=bg;
  el.style.color=color;
  el.style.border='1px solid '+border;
  el.textContent=text;
}

// ── User program card ─────────────────────────────────────────
function renderUserProgramCard(){
  const card=document.getElementById('user-program-card');
  if(!card) return;
  if(!currentUser||currentUser.role==='admin'){ card.style.display='none'; return; }
  const c=getUserClient();
  if(!c){ card.style.display='none'; return; }
  const days=remainingDays(c.programEnd);
  const dcolor=remainingDaysColor(days);
  const dlabel=remainingDaysLabel(days);
  const badgeCls=days===null?'upc-badge-active':days<0?'upc-badge-expired':days<=7?'upc-badge-warning':'upc-badge-active';
  const badgeTxt=days===null?'Aktif':days<0?'Süresi Doldu':days<=7?'Bitiyor':'Aktif';
  const fmtD=s=>s?new Date(s+'T00:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):'—';
  card.style.display='block';
  card.innerHTML=`<div class="upc">
    <div class="upc-kalan">
      <div class="upc-kalan-num" style="color:${dcolor}">${days===null?'—':days<0?'0':days}</div>
      <div class="upc-kalan-lbl">Kalan Gün</div>
    </div>
    <div class="upc-info">
      <div class="upc-program">${c.program||'Dijital Barista Programı'}</div>
      <div class="upc-dates" style="margin-bottom:8px">${fmtD(c.startDate)} — ${fmtD(c.programEnd)}</div>
      <span class="upc-badge ${badgeCls}">${badgeTxt}</span>
    </div>
  </div>`;
}

function render(){
  renderStats(); renderDashClients(); renderDashMilestones(); renderDashGoals();
  renderDailyClients();
  renderPipeline(); renderGoals(); renderMilestones(); renderReports();
  renderHealthPage(); renderDijitalBarista(); renderUsers(); setDates();
  renderUserProgramCard();
}

function renderDashGoals(){
  const el=document.getElementById('dash-goals');if(!el)return;
  const active=state.goals.filter(g=>!g.done).slice(0,5);
  if(!active.length){el.innerHTML='<div style="font-size:13px;color:var(--color-text-muted);padding:8px 0">Tamamlanmamış hedef yok 🎉</div>';return;}
  el.innerHTML=active.map(g=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0dfc0">
      <div style="width:28px;height:28px;border-radius:8px;background:#f0dfc0;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${g.icon}</div>
      <div style="flex:1">
        <div style="font-size:13.5px;font-weight:500;color:var(--color-text-primary)">${g.name}</div>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:1px">Bitiş: ${g.date}</div>
      </div>
      <button onclick="event.stopPropagation();completeGoal(${g.id})" style="background:rgba(52,199,89,0.1);color:var(--color-green);border:none;border-radius:8px;padding:3px 10px;font-size:11px;cursor:pointer;font-family:inherit;font-weight:500">✓</button>
    </div>`).join('');
}

function daysLeft(dateStr){
  if(!dateStr) return null;
  const diff=new Date(dateStr)-new Date();
  return Math.ceil(diff/(1000*60*60*24));
}
function deadlineTag(dateStr){
  if(!dateStr) return '';
  const d=daysLeft(dateStr);
  if(d<0) return `<span class="tag-deadline expired">⏰ Süre doldu</span>`;
  if(d<=14) return `<span class="tag-deadline soon">⏰ ${d} gün kaldı</span>`;
  if(d<=30) return `<span class="tag-deadline soon">📅 ${d} gün kaldı</span>`;
  return `<span class="tag-deadline ok">📅 ${d} gün kaldı</span>`;
}
function sessionsTag(n){
  if(n===0) return `<span class="tag-sessions urgent">0 görüşme hakkı</span>`;
  if(n<=2) return `<span class="tag-sessions warning">${n} görüşme hakkı</span>`;
  return `<span class="tag-sessions">${n} görüşme hakkı</span>`;
}


/* ---- Müşteri Listesi Sort ---- */
let hsSort = 'health_desc';

function setHsSort(type) {
  hsSort = type;
  renderHealthPage();
}

function parseRemainingDays(client) {
  if(!client.programEnd) return Infinity;
  const days = Math.ceil((new Date(client.programEnd) - new Date()) / (1000*60*60*24));
  return days;
}

function sortClients(list, type) {
  return list.sort((a, b) => {
    if(type === 'health_desc') return (b.health||0) - (a.health||0);
    if(type === 'health_asc')  return (a.health||0) - (b.health||0);
    if(type === 'days_asc') {
      const da = parseRemainingDays(a), db = parseRemainingDays(b);
      return da - db;
    }
    if(type === 'days_desc') {
      const da = parseRemainingDays(a), db = parseRemainingDays(b);
      return db - da;
    }
    return 0;
  });
}

function renderHealthPage(){
  const el=document.getElementById('hs-client-list');if(!el)return;
  const clients=state.clients;
  const critical=clients.filter(c=>(c.health||0)<4).length;
  const risk=clients.filter(c=>(c.health||0)>=4&&(c.health||0)<7).length;
  const good=clients.filter(c=>(c.health||0)>=7).length;
  const avg=clients.length?Math.round(clients.reduce((a,c)=>a+(c.health||0),0)/clients.length*10)/10:0;

  const sumEl=document.getElementById('hs-summary');
  if(sumEl) sumEl.innerHTML=`
    <div class="hs-card hs-card-crit"><div class="hs-card-num" style="color:#ff3b30">${critical}</div><div class="hs-card-lbl" style="color:#ff3b30">Kritik (0–3)</div></div>
    <div class="hs-card hs-card-risk"><div class="hs-card-num" style="color:#ff9500">${risk}</div><div class="hs-card-lbl" style="color:#ff9500">Risk Altında (4–6)</div></div>
    <div class="hs-card hs-card-good"><div class="hs-card-num" style="color:#34c759">${good}</div><div class="hs-card-lbl" style="color:#34c759">Sağlıklı (7–10)</div></div>`;

  const avgValEl=document.getElementById('hs-avg-val');
  const avgBarEl=document.getElementById('hs-avg-bar');
  if(avgValEl){avgValEl.textContent=avg+'/10';avgValEl.style.color=healthColor(avg);}
  if(avgBarEl) avgBarEl.style.width=(avg/10*100)+'%';

  const hsQ = (document.getElementById('hs-search')?.value||'').toLowerCase().trim();
  const filtered = hsQ ? clients.filter(c => c.name.toLowerCase().includes(hsQ)) : clients;

  if(filtered.length === 0 && hsQ) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--color-text-muted);font-size:13px">"${escHtml(hsQ)}" için sonuç bulunamadı</div>`;
    return;
  }

  el.innerHTML = sortClients([...filtered], hsSort).map((c,i)=>{
    const h=c.health||0;
    const days=remainingDays(c.programEnd);
    const dcolor=remainingDaysColor(days);
    const daysStr=days===null?'':`<span style="font-size:11px;font-weight:600;color:${dcolor}">${remainingDaysLabel(days)}</span>`;
    return `<div class="hs-client-row" style="animation:fadeIn 0.18s ease both;animation-delay:${i*0.03}s" onclick="openClientPanel(${c.id})">
      <div class="avatar ${avc(state.clients.indexOf(c))}" style="width:38px;height:38px;font-size:13px">${escHtml(ini(c.name))}</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:500">${escHtml(c.name)}</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">${escHtml(c.type||'') + (c.type && daysStr ? ' · ' : '') + (daysStr||'—')}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:18px;font-weight:700;color:${healthColor(h)}">${h}</div>
        <div style="font-size:11px;font-weight:500;color:${healthColor(h)}">${healthLabel(h)}</div>
      </div>
      <div style="width:80px;margin-left:12px">
        <div class="health-bar"><div class="health-fill" style="width:${h*10}%;background:${healthColor(h)}"></div></div>
      </div>
    </div>`;
  }).join('');
}

const quotes=[
  'Barista\'nın işi satmaya çalışmak değil, kahveyi iyi hazırlamaktır.',
  'Barista yanlış sütü döktüğünde kahveyi çöpe atmaz, yeniden yapar. Sen de.',
  'Kahve soğursa ısıtırsın. Müşteri soğursa — sisteminle geri getirirsin.',
  'En güçlü kahve bile demlenmek ister — sabret, sonuç kendiliğinden gelir.',
  'Kahve acı olur ama içersin. Çünkü sonunda enerji verir. İş de öyle.',
  'Disiplin, motivasyonun bittiği yerde başlar.',
  'Müşterini kazan, sistemi inşa et, özgür ol.',
  'Her "hayır", seni doğru "evet"e yaklaştırıyor.',
  'İşin büyümesi için önce sen büyümelisin.',
  'Küçük tutarlı adımlar, büyük sıçramaları geçer.',
  'Bugün yarattığın değer, yarın geri dönüyor.',
  'Satış bir beceri — her gün biraz daha keskinleşiyor.',
  'Sistemin varsa, enerjin başka şeylere kalır.',
  'Rakibin değil, dünkü kendinle yarış.',
  'İçerik üret, güven inşa et, satış kendiliğinden gelir.'
];

function setDates(){
  const s=new Date().toLocaleDateString('tr-TR',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  ['today-date','daily-date'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=s;});
  // Set today in date picker
  const dateInput=document.getElementById('daily-entry-date');
  if(dateInput && !dateInput.value) dateInput.value=new Date().toISOString().split('T')[0];
  const qEl=document.getElementById('daily-quote');
  if(qEl){
    const dayIndex=new Date().getDate()%quotes.length;
    qEl.textContent='✦ '+quotes[dayIndex];
  }
}

function renderStats(){
  const aktif=state.clients.filter(c=>c.status==='Aktif').length;
  const scEl=document.getElementById('s-clients');
  if(scEl) scEl.textContent=aktif;
  const slEl=document.getElementById('s-leads');
  if(slEl) slEl.textContent=state.leads.length;
  const cc=document.getElementById('client-count');if(cc)cc.textContent=state.clients.length+' müşteri';
  const lc=document.getElementById('lead-count');if(lc)lc.textContent=state.leads.length+' kişi pipeline\'da';
}

function renderDailyClients(){
  const el=document.getElementById('daily-clients');if(!el)return;
  if(!state.clients.length){el.innerHTML='<div class="empty">Henüz müşteri yok</div>';return;}
  el.innerHTML=state.clients.slice(0,6).map((c,i)=>`
    <div class="c-item" onclick="openClientPanel(${c.id})" style="padding:10px 0">
      <div class="avatar ${avc(i)}" style="width:38px;height:38px;font-size:13px">${escHtml(ini(c.name))}</div>
      <div style="flex:1">
        <div class="c-name">${escHtml(c.name)}</div>
        <div class="c-meta">${escHtml(c.type||'—')}</div>
      </div>
      <span class="badge ${bCls(c.status)}">${escHtml(c.status)}</span>
    </div>`).join('');
}

function renderDashClients(){
  document.getElementById('dash-clients').innerHTML=state.clients.slice(0,5).map((c,i)=>`
    <div class="c-item" onclick="openClientPanel(${c.id})">
      <div class="avatar ${avc(i)}" style="width:36px;height:36px;font-size:13px">${escHtml(ini(c.name))}</div>
      <div style="flex:1">
        <div class="c-name">${escHtml(c.name)}</div>
        <div style="display:flex;gap:5px;margin-top:4px;flex-wrap:wrap">
          ${sessionsTag(c.remainingSessions??0)}
          ${deadlineTag(c.programEnd)}
        </div>
      </div>
      <span class="badge ${bCls(c.status)}">${escHtml(c.status)}</span>
    </div>`).join('');
}

function renderActivities(){
  document.getElementById('dash-activities').innerHTML=[
    {text:'Zeynep Kaya ile seans tamamlandı',time:'10 dk önce',color:'var(--color-blue)'},
    {text:'Mert Aydın hedef tamamladı',time:'1 sa önce',color:'var(--color-green)'},
    {text:'Yeni lead eklendi',time:'3 sa önce',color:'var(--color-amber)'},
    {text:'Günlük giriş kaydedildi',time:'Dün',color:'var(--color-blue)'}
  ].map(a=>`<div class="act-item"><div class="act-dot" style="background:${a.color}"></div><div class="act-text">${a.text}</div><div class="act-time">${a.time}</div></div>`).join('');
}

function renderDashMilestones(){
  document.getElementById('dash-milestones').innerHTML=state.milestones.map(m=>`
    <div class="ms-item" onclick="openMsPanel(${m.id})">
      <div class="ms-dot ms-${m.status}">${m.status==='done'?'✓':m.status==='active'?'→':''}</div>
      <div><div class="ms-title">${m.title}</div><div class="ms-sub">${m.date}</div></div>
    </div>`).join('');
}

function renderClientList(){
  let list=state.clients;
  if(clientFilter!=='all') list=list.filter(c=>c.status===clientFilter);
  if(clientSearch) list=list.filter(c=>c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  const el=document.getElementById('client-list-main');
  if(!list.length){el.innerHTML='<div class="empty"><div style="font-size:36px;margin-bottom:10px">👤</div><div>Müşteri bulunamadı</div></div>';return;}
  el.innerHTML=list.map(c=>`
    <div class="c-item" style="padding:12px 0" onclick="openClientPanel(${c.id})">
      <div class="avatar ${avc(state.clients.indexOf(c))}" style="width:42px;height:42px;font-size:14px">${ini(c.name)}</div>
      <div style="flex:1">
        <div class="c-name">${c.name}</div>
        <div class="c-meta" style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
          ${sessionsTag(c.remainingSessions??0)}
          ${deadlineTag(c.programEnd)}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <span class="badge ${bCls(c.status)}">${c.status}</span>
        <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">${c.type}</div>
      </div>
    </div>`).join('');
}
function filterClients(f,el){clientFilter=f;el.closest('.tab-bar').querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');renderClientList();}
function searchClients(v){clientSearch=v;renderClientList();}

function renderPipeline(){
  const el = document.getElementById('pipeline'); if(!el) return;
  const stages = ['İletişim','Görüşme','Teklif','Kazanıldı'];
  const dots = { 'İletişim':'#666','Görüşme':'#d4924a','Teklif':'#5b9cf6','Kazanıldı':'#5db88a' };

  el.innerHTML = stages.map(stage => {
    const leads = state.leads.filter(l => l.stage === stage);
    const total = leads.reduce((a,l) => a+(+l.tutar||0), 0);
    const dot   = dots[stage];

    const cards = leads.length ? leads.map(l => `
      <div
        draggable="true"
        ondragstart="pipeDragStart(event,${l.id})"
        ondragend="pipeDragEnd(event)"
        onclick="openLeadPanel(${l.id})"
        class="lead-pipeline-card"
        style="background:#F8F5F0;border:1px solid rgba(60,42,26,.12);border-radius:12px;padding:12px;cursor:grab;transition:background 0.12s,border-color 0.12s,box-shadow 0.12s;user-select:none;margin-bottom:8px"
        onmouseover="this.style.background='#FFFFFF';this.style.borderColor='rgba(166,95,35,.22)';this.style.boxShadow='0 10px 24px rgba(60,42,26,.08)'"
        onmouseout="this.style.background='#F8F5F0';this.style.borderColor='rgba(60,42,26,.12)';this.style.boxShadow='none'">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div style="width:28px;height:28px;border-radius:50%;background:#EFE7DC;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#9B846E;flex-shrink:0">${escHtml((l.name||'?').charAt(0).toUpperCase())}</div>
          <div style="min-width:0">
            <div style="font-size:13px;font-weight:700;color:#211A14;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(l.name)}</div>
            ${l.social ? `<div style="font-size:10px;color:#9B8E82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(extractHandle(l.social))}</div>` : (l.source ? `<div style="font-size:10px;color:#9B8E82">${escHtml(l.source)}</div>` : '')}
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          ${l.tutar ? `<div style="font-size:12px;font-weight:700;color:#211A14">₺${Number(l.tutar).toLocaleString('tr-TR')}</div>` : '<div></div>'}
          ${l.social ? `<a href="${l.social.startsWith('http') ? l.social : 'https://instagram.com/' + l.social.replace('@','')}" target="_blank" onclick="event.stopPropagation()" style="font-size:10px;color:#8B6B4F;text-decoration:none;padding:3px 8px;background:#FFFFFF;border-radius:7px;border:1px solid rgba(60,42,26,.12);transition:all 0.1s;white-space:nowrap" onmouseover="this.style.color='#A65F23';this.style.borderColor='rgba(166,95,35,.25)'" onmouseout="this.style.color='#8B6B4F';this.style.borderColor='rgba(60,42,26,.12)'">↗ Profil</a>` : ''}
        </div>
      </div>`) .join('')
    : `<div style="border:1px dashed rgba(60,42,26,.18);border-radius:12px;height:80px;display:flex;align-items:center;justify-content:center;background:#FBFAF8">
        <span style="font-size:12px;color:#9B8E82">Kart yok</span>
       </div>`;

    return `
      <div
        data-stage="${stage}"
        ondragover="pipeDragOver(event,this)"
        ondragleave="pipeDragLeave(this)"
        ondrop="pipeDrop(event,'${stage}')"
        class="lead-pipeline-col"
        style="flex:1 1 0;min-width:0;background:#FFFFFF;border:1px solid rgba(60,42,26,.10);border-radius:16px;padding:12px;min-height:300px;transition:outline 0.12s;box-shadow:0 10px 26px rgba(60,42,26,.04)">

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
          <div style="width:8px;height:8px;border-radius:50%;background:${dot};flex-shrink:0"></div>
          <span style="font-size:13px;font-weight:700;color:#211A14;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${stage}</span>
          <span style="font-size:11px;color:#9B846E;background:#F1E9DE;border-radius:8px;padding:1px 8px;font-weight:700">${leads.length}</span>
          <button
            onclick="openInstagramEkle()"
            style="width:28px;height:28px;border-radius:9px;border:1px solid rgba(60,42,26,.12);background:#FFFFFF;color:#9B846E;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;transition:all 0.12s;font-family:inherit;flex-shrink:0"
            onmouseover="this.style.background='#F8F5F0';this.style.borderColor='rgba(166,95,35,.25)';this.style.color='#A65F23'"
            onmouseout="this.style.background='#FFFFFF';this.style.borderColor='rgba(60,42,26,.12)';this.style.color='#9B846E'">+</button>
        </div>

        ${total > 0 ? `<div style="font-size:11px;color:${dot};font-weight:700;margin-bottom:10px;padding:4px 8px;background:#FBFAF8;border-radius:8px">₺${total.toLocaleString('tr-TR')}</div>` : ''}

        <!-- Cards -->
        <div>${cards}</div>
      </div>`;
  }).join('');
}

let dragLeadId = null;

function pipeDragStart(e, id){
  dragLeadId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=>{ e.target.style.opacity='0.4'; e.target.style.cursor='grabbing'; }, 0);
}

function pipeDragEnd(e){
  e.target.style.opacity='1';
  e.target.style.cursor='grab';
  document.querySelectorAll('[data-stage]').forEach(col=>{
    col.style.outline='none';
    col.style.boxShadow='none';
  });
}

function pipeDragOver(e, col){
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  col.style.outline='2px dashed #444';
  col.style.outlineOffset='-2px';
}

function pipeDragLeave(col){
  col.style.outline='none';
}

async function pipeDrop(e, stage){
  e.preventDefault();
  const col=e.currentTarget;
  col.style.outline='none';
  if(!dragLeadId)return;
  const l=state.leads.find(x=>+x.id===+dragLeadId);
  if(!l||l.stage===stage)return;
  l.stage=stage;
  renderPipeline();
  await saveLead(l);
  toast('✓ '+l.name+' → '+stage);
  dragLeadId=null;
}

function renderGoals(){
  const el=document.getElementById('goals-list');if(!el)return;
  if(!state.goals.length){el.innerHTML='<div class="empty"><div style="font-size:36px;margin-bottom:10px">🎯</div><div>Henüz hedef yok</div></div>';return;}
  el.innerHTML=state.goals.map(g=>`
    <div class="goal-item" style="cursor:pointer;transition:background 0.12s;border-radius:10px;padding:12px 8px;position:relative" 
      onclick="openGoalPanel(${g.id})"
      onmouseover="this.style.background='#252525';this.querySelector('.goal-del-btn') && (this.querySelector('.goal-del-btn').style.opacity='1')"
      onmouseout="this.style.background='transparent';this.querySelector('.goal-del-btn') && (this.querySelector('.goal-del-btn').style.opacity='0')">
      <div class="goal-icon" style="background:${g.done?'rgba(52,199,89,0.12)':'rgba(0,113,227,0.08)'}">${g.done?'✓':g.icon}</div>
      <div class="goal-info" style="flex:1">
        <div class="goal-name" style="${g.done?'text-decoration:line-through;color:var(--color-text-muted)':''}">${g.name}</div>
        <div class="goal-date">Bitiş: ${g.date}${g.notes&&g.notes.length?' · '+g.notes.length+' not':''}</div>
      </div>
      ${g.done?`<button class="goal-del-btn" onclick="event.stopPropagation();quickDeleteGoal(${g.id})" style="opacity:0;transition:opacity 0.15s;background:rgba(255,59,48,0.1);color:var(--color-red);border:none;border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit;font-weight:500">Sil</button>`
      :`<span style="font-size:11px;color:#c7c7cc">›</span>`}
    </div>`).join('');
}

function quickDeleteGoal(id){
  if(!confirm('Bu hedefi silmek istiyor musun?'))return;
  state.goals=state.goals.filter(x=>+x.id!==+id);
  renderGoals();renderDashGoals();toast('Hedef silindi');
  deleteSBGoal(id);
}

function renderMilestones(){
  const el=document.getElementById('ms-list');if(!el)return;
  el.innerHTML=state.milestones.map(m=>`
    <div class="ms-item" onclick="openMsPanel(${m.id})">
      <div class="ms-dot ms-${m.status}">${m.status==='done'?'✓':m.status==='active'?'→':''}</div>
      <div style="flex:1"><div class="ms-title">${m.title}</div><div class="ms-sub">${m.date}${m.notes.length?' · '+m.notes.length+' not':''}</div></div>
      <span style="font-size:11px;color:#c7c7cc;flex-shrink:0">›</span>
    </div>`).join('');
}

function renderReports(){
  const el=document.getElementById('reports-list');if(!el)return;
  if(!state.daily.length){
    el.innerHTML='<div class="empty" style="padding:48px"><div style="font-size:36px;margin-bottom:10px">📊</div><div>Henüz giriş yok.</div></div>';
    return;
  }
  const cols=[
    {key:'date',label:'Tarih',w:'160px'},
    {key:'mood',label:'',w:'36px'},
    {key:'takipci',label:'Takipçi',w:'90px'},
    {key:'mail',label:'Mail',w:'90px'},
    {key:'icerik',label:'İçerik',w:'70px'},
    {key:'reklam',label:'Reklam ₺',w:'90px'},
    {key:'hotlist',label:'Hot-List',w:'80px'},
    {key:'musteri',label:'Müşteri',w:'80px'},
    {key:'teklif',label:'Teklif',w:'70px'},
    {key:'alinan',label:'Alınan ₺',w:'90px'},
    {key:'anlasma',label:'Anlaşma ₺',w:'100px'},
    {key:'actions',label:'',w:'110px'},
  ];
  el.innerHTML=`
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:1px solid var(--color-border)">
          ${cols.map(c=>`<th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;width:${c.w}">${c.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${state.daily.slice().reverse().map((d,i)=>`
          <tr style="border-bottom:1px solid var(--color-divider);transition:background 0.1s" onmouseover="this.style.background='var(--color-surface-hover)'" onmouseout="this.style.background='transparent'">
            <td style="padding:12px 16px;font-size:13px;font-weight:600;color:var(--color-text-primary);white-space:nowrap">${d.dateShort||d.date}</td>
            <td style="padding:12px 16px;font-size:18px">${d.mood||'🙂'}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--color-text-primary);font-weight:500">${(d.takipci||0).toLocaleString('tr-TR')}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--color-text-primary)">${(d.mail||0).toLocaleString('tr-TR')}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--color-text-primary)">${d.icerik?'✓':'—'}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--color-text-primary)">₺${(d.reklam||0).toLocaleString('tr-TR')}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--color-text-primary)">${d.hotlist||0}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--color-text-primary)">${d.musteri||0}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--color-text-primary)">${d.teklif||0}</td>
            <td style="padding:12px 16px;font-size:13px;color:#34c759;font-weight:600">${d.alinan?'₺'+(d.alinan).toLocaleString('tr-TR'):'—'}</td>
            <td style="padding:12px 16px;font-size:13px;color:var(--color-text-primary)">${d.anlasma?'₺'+(d.anlasma).toLocaleString('tr-TR'):'—'}</td>
            <td style="padding:12px 16px">
              <div style="display:flex;gap:6px">
                <button onclick="editDailyEntry(${d.id})" style="background:#f0dfc0;border:none;border-radius:7px;padding:4px 10px;font-size:11px;color:#7b4a1e;cursor:pointer;font-family:inherit;font-weight:600;white-space:nowrap">✏️ Düzenle</button>
                <button onclick="deleteDailyEntry(${d.id})" style="background:rgba(255,59,48,0.08);border:none;border-radius:7px;padding:4px 8px;font-size:11px;color:var(--color-red);cursor:pointer;font-family:inherit">Sil</button>
              </div>
            </td>
          </tr>
          ${d.yorum?`<tr style="border-bottom:1px solid var(--color-divider)"><td colspan="12" style="padding:4px 16px 12px;font-size:12px;color:var(--color-text-muted)">💬 ${d.yorum}</td></tr>`:''}
        `).join('')}
      </tbody>
    </table>`;
  
  // Update follower chart
  buildDailyFollowerChart();
}

let dailyFollowerChart;
let activeDailyMetric = 'takipci';
let activeDailyRange  = 7;   // number | 'today' | 'all' | 'custom'
let customRangeStart  = null;
let customRangeEnd    = null;

/* ---- helpers ---- */
function getDailyStr(d){ return d.dateShort || d.date || ''; }

function getFilteredSorted(){
  let sorted = [...state.daily].sort((a,b)=> getDailyStr(a).localeCompare(getDailyStr(b)));

  // Local timezone-safe today string (avoids UTC offset issues)
  const _n = new Date();
  const todayStr = _n.getFullYear() + '-' + String(_n.getMonth()+1).padStart(2,'0') + '-' + String(_n.getDate()).padStart(2,'0');

  if(activeDailyRange === 'today'){
    sorted = sorted.filter(d=> getDailyStr(d) === todayStr);
  } else if(activeDailyRange === 'custom' && customRangeStart && customRangeEnd){
    sorted = sorted.filter(d=>{ const ds=getDailyStr(d); return ds>=customRangeStart && ds<=customRangeEnd; });
  } else if(typeof activeDailyRange === 'number' && activeDailyRange > 0){
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - activeDailyRange); cutoff.setHours(0,0,0,0);
    // Parse as local date to avoid UTC shift
    sorted = sorted.filter(d=>{
      const ds = getDailyStr(d);
      const parts = ds.split('-');
      const localDate = new Date(+parts[0], +parts[1]-1, +parts[2]);
      return localDate >= cutoff;
    });
  }
  return sorted;
}

/* ---- filter UI ---- */
function setDailyRange(val, el){
  activeDailyRange = val;
  document.querySelectorAll('.drange-btn').forEach(b=> b.classList.remove('drange-active'));
  if(el) el.classList.add('drange-active');
  // hide custom row unless custom
  document.getElementById('custom-range-row').style.display = 'none';
  buildDailyFollowerChart();
}

function toggleCustomRange(el){
  const row = document.getElementById('custom-range-row');
  const visible = row.style.display !== 'none';
  if(visible){
    row.style.display = 'none';
    // revert to 7 day
    setDailyRange(7, document.getElementById('drange-7'));
  } else {
    row.style.display = 'flex';
    document.querySelectorAll('.drange-btn').forEach(b=> b.classList.remove('drange-active'));
    el.classList.add('drange-active');
    activeDailyRange = 'custom';
  }
}

function applyCustomRange(){
  const s = document.getElementById('drange-start').value;
  const e = document.getElementById('drange-end').value;
  customRangeStart = s || null;
  customRangeEnd   = e || null;
  activeDailyRange = 'custom';
  // label
  const lbl = document.getElementById('custom-range-label');
  if(s && e) lbl.textContent = formatDateTR(s) + ' – ' + formatDateTR(e);
  buildDailyFollowerChart();
}

function setDailyChart(metric){
  activeDailyMetric = metric;
  buildDailyFollowerChart();
}

/* ---- main chart + KPI builder ---- */
function buildDailyFollowerChart(){
  const ctx = document.getElementById('daily-follower-chart'); if(!ctx) return;
  const sorted = getFilteredSorted();

  /* --- KPI CARDS --- */
  // Takipçi & Mail: her zaman tüm datadaki en son değeri göster (snapshot metrik)
  // Bu metrikler "şu an kaç takipçin var" — range filtresinden bağımsız son gerçek değer
  const allSorted    = [...state.daily].sort((a,b)=>getDailyStr(a).localeCompare(getDailyStr(b)));
  const firstInRange = sorted.length ? getDailyStr(sorted[0]) : '';

  // Son gerçek (>0) takipçi/mail değeri
  const lastRealTakipci = [...allSorted].reverse().find(d=>(d.takipci||0)>0)?.takipci || (allSorted.length ? allSorted[allSorted.length-1].takipci||0 : 0);
  const lastRealMail    = [...allSorted].reverse().find(d=>(d.mail||0)>0)?.mail       || (allSorted.length ? allSorted[allSorted.length-1].mail||0    : 0);

  // Delta: range başı vs range sonu (sıfır olmayan ilk/son değer)
  const firstTakipciInRange = sorted.find(d=>(d.takipci||0)>0)?.takipci || 0;
  const lastTakipciInRange  = [...sorted].reverse().find(d=>(d.takipci||0)>0)?.takipci || 0;
  const firstMailInRange    = sorted.find(d=>(d.mail||0)>0)?.mail || 0;
  const lastMailInRange     = [...sorted].reverse().find(d=>(d.mail||0)>0)?.mail || 0;

  const beforeRange  = allSorted.filter(d=> getDailyStr(d) < firstInRange);
  const prevEntry    = beforeRange.length ? beforeRange[beforeRange.length-1] : null;
  const deltaTakipci = (lastTakipciInRange||lastRealTakipci) - (firstTakipciInRange || prevEntry?.takipci||0);
  const deltaMail    = (lastMailInRange||lastRealMail)    - (firstMailInRange    || prevEntry?.mail||0);

  // Gelir: range içindeki sum
  const rangeGelir   = sorted.reduce((a,d)=>a+(d.alinan||0), 0);
  const rangeLen     = sorted.length;
  const prevSlice    = beforeRange.slice(-rangeLen);
  const prevGelirSlice = prevSlice.reduce((a,d)=>a+(d.alinan||0),0);

  const setS=(id,val,chg,prefix='')=>{
    const v=document.getElementById('dstat-'+id+'-val');
    const c=document.getElementById('dstat-'+id+'-chg');
    if(v) v.textContent = prefix + val.toLocaleString('tr-TR');
    if(c){
      const pos = chg>=0;
      c.textContent = (pos?'↑ +':'↓ ') + prefix + Math.abs(chg).toLocaleString('tr-TR');
      c.style.color = pos ? 'var(--green)' : 'var(--red)';
      c.style.fontWeight = '600';
    }
  };
  setS('takipci', lastRealTakipci, deltaTakipci);
  setS('mail',    lastRealMail,    deltaMail);
  setS('gelir',   rangeGelir,      rangeGelir - prevGelirSlice, '₺');

  /* --- CHART --- */
  const labels = sorted.map(d=> getDailyStr(d));
  let values;
  if(activeDailyMetric === 'gelir'){
    // Kümülatif gelir — range öncesi base + range içi toplam
    let baseCum = allSorted.filter(d=>getDailyStr(d)<firstInRange).reduce((a,d)=>a+(d.alinan||0),0);
    let cum = baseCum;
    values = sorted.map(d=>{ cum += (d.alinan||0); return cum; });
  } else {
    // Snapshot metrik (takipci / mail): 0 olan günlere önceki değeri taşı (forward fill)
    // range öncesi son gerçek değeri base olarak al
    const baseVal = beforeRange.length ? (beforeRange[beforeRange.length-1][activeDailyMetric]||0) : 0;
    let last = baseVal;
    values = sorted.map(d=>{
      const v = d[activeDailyMetric]||0;
      if(v > 0) last = v;
      return last;
    });
  }

  const colorMap = {
    takipci: { line:'#e07070', fill:'rgba(224,112,112,' },
    mail:    { line:'#5b9cf6', fill:'rgba(91,156,246,' },
    gelir:   { line:'#5db88a', fill:'rgba(93,184,138,' }
  };
  const color    = colorMap[activeDailyMetric].line;
  const fillBase = colorMap[activeDailyMetric].fill;
  const lbl = {takipci:'Takipçi',mail:'Mail Abone',gelir:'Kümülatif Gelir ₺'}[activeDailyMetric];

  if(dailyFollowerChart) dailyFollowerChart.destroy();
  const c = ctx.getContext('2d');
  const gradient = c.createLinearGradient(0,0,0,200);
  gradient.addColorStop(0, fillBase+'0.18)');
  gradient.addColorStop(1, fillBase+'0)');

  dailyFollowerChart = new Chart(c, {
    type:'line',
    data:{ labels, datasets:[{ data:values, borderColor:color, borderWidth:2, backgroundColor:gradient, fill:true, tension:0.3, pointRadius:4, pointBackgroundColor:color, pointBorderColor:'var(--bg-2)', pointBorderWidth:2, pointHoverRadius:6 }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{backgroundColor:'#2a2a2a',borderColor:'rgba(255,255,255,0.08)',borderWidth:1,padding:12,cornerRadius:8,titleColor:'#9b9a97',bodyColor:'#e3e3e1',callbacks:{
        label: ctx=>{ const val=ctx.parsed.y; return lbl+': '+(activeDailyMetric==='gelir'?'₺':'')+val.toLocaleString('tr-TR'); }
      }}},
      scales:{
        x:{ grid:{display:false}, border:{display:false}, ticks:{font:{size:11},color:'#5a5a58',maxTicksLimit:8} },
        y:{ grid:{color:'rgba(255,255,255,0.04)'}, border:{display:false}, ticks:{font:{size:11},color:'#5a5a58',callback:v=>v>=1000?(v/1000).toFixed(1)+'B':v} }
      }
    }
  });

  // active card highlight
  ['takipci','mail','gelir'].forEach(m=>{
    const el=document.getElementById('dstat-'+m);
    if(el){
      el.style.background = m===activeDailyMetric ? 'var(--surface)' : 'var(--bg-3)';
      el.style.boxShadow  = m===activeDailyMetric ? 'inset 0 -2px 0 '+colorMap[m].line : 'none';
    }
  });
}

function catClass(c){return{'Satış':'cat-satis','Pazarlama':'cat-pazarlama','Operasyon':'cat-operasyon','Fikir Alışverişi':'cat-fikir'}[c]||'cat-satis';}

// ===== ALET ÇANTASI (TOOLBOX) =====
let toolboxItems = []; // loaded from Supabase or falls back to dbContent

async function fetchToolboxData() {
  const {data, error} = await sb.from('toolbox_items').select('*').order('order_index').order('created_at');
  if(!error && data && data.length > 0) {
    toolboxItems = data;
  } else {
    toolboxItems = [
      ...dbContent.kits.map((x,i) => ({...x, id:'k'+i, category:'kits', description:x.desc, published:true})),
      ...dbContent.sales.map((x,i) => ({...x, id:'s'+i, category:'sales', description:x.desc, published:true})),
      ...dbContent.bots.map((x,i) => ({...x, id:'b'+i, category:'bots', description:x.desc, published:true})),
    ];
  }
}

async function loadToolboxItems() {
  const isAdmin = currentUser && currentUser.role === 'admin';
  const adminBar = document.getElementById('tb-admin-bar');
  if(adminBar) adminBar.style.display = isAdmin ? 'flex' : 'none';
  await fetchToolboxData();
  renderDijitalBarista();
}

function renderDijitalBarista(){
  const botsEl=document.getElementById('db-bots');
  const kitsEl=document.getElementById('db-kits');
  const salesEl=document.getElementById('db-sales');
  const isAdmin = currentUser && currentUser.role === 'admin';

  const renderCard = items => items
    .filter(item => isAdmin || item.published !== false)
    .map(item => {
      const cats = Array.isArray(item.categories) ? item.categories : (item.categories ? item.categories : []);
      const adminControls = isAdmin ? `
        <div class="tb-card-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px">
          <button class="tb-edit-btn" onclick="event.preventDefault();event.stopPropagation();editToolboxItem('${item.id}')">✏️</button>
          <button class="tb-del-btn" onclick="event.preventDefault();event.stopPropagation();deleteToolboxItem('${item.id}')">🗑</button>
        </div>` : '';
      const unpubClass = (!item.published && isAdmin) ? 'tb-unpublished' : '';
      return `<div style="position:relative" onmouseenter="this.querySelector('.tb-card-actions')&&(this.querySelector('.tb-card-actions').style.display='flex')" onmouseleave="this.querySelector('.tb-card-actions')&&(this.querySelector('.tb-card-actions').style.display='none')">
        ${adminControls}
        <a class="db-card ${unpubClass}" href="${item.url||'#'}" onclick="dbClick(event,'${item.url||'#'}')">
          <div class="db-card-icon">${item.icon||'🔧'}</div>
          <div class="db-card-title">${escHtml(item.title)}</div>
          <div class="db-card-desc">${escHtml(item.description||item.desc||'')}</div>
          <div class="db-cats">${cats.map(c=>`<span class="db-cat ${catClass(c)}">${escHtml(c)}</span>`).join('')}</div>
        </a>
      </div>`;
    }).join('');

  // Use toolboxItems if loaded, else dbContent
  const src = toolboxItems.length > 0 ? toolboxItems : [
    ...dbContent.kits.map(x=>({...x,category:'kits',description:x.desc,published:true})),
    ...dbContent.sales.map(x=>({...x,category:'sales',description:x.desc,published:true})),
    ...dbContent.bots.map(x=>({...x,category:'bots',description:x.desc,published:true})),
  ];
  if(kitsEl) kitsEl.innerHTML = renderCard(src.filter(x=>x.category==='kits'));
  if(salesEl) salesEl.innerHTML = renderCard(src.filter(x=>x.category==='sales'));
  if(botsEl) botsEl.innerHTML = renderCard(src.filter(x=>x.category==='bots'));
}

function dbClick(e,url){
  e.preventDefault();
  if(!url||url==='#'){toast('Link henüz eklenmedi');return;}
  window.open(url,'_blank');
}

function openToolboxModal(item=null){
  document.getElementById('toolbox-modal-title').textContent = item ? 'İçeriği Düzenle' : 'İçerik Ekle';
  document.getElementById('tb-edit-id').value = item ? item.id : '';
  document.getElementById('tb-icon').value = item ? (item.icon||'🔧') : '🔧';
  document.getElementById('tb-title').value = item ? (item.title||'') : '';
  document.getElementById('tb-desc').value = item ? (item.description||item.desc||'') : '';
  document.getElementById('tb-category').value = item ? (item.category||'bots') : 'bots';
  const cats = item && Array.isArray(item.categories) ? item.categories.join(', ') : '';
  document.getElementById('tb-cats').value = cats;
  document.getElementById('tb-url').value = item ? (item.url||'') : '';
  document.getElementById('tb-published').checked = item ? (item.published !== false) : true;
  openModal('modal-toolbox');
}

function editToolboxItem(id){
  const item = toolboxItems.find(x=>String(x.id)===String(id));
  if(item) openToolboxModal(item);
}

async function saveToolboxItem(){
  const editId = document.getElementById('tb-edit-id').value;
  const icon = document.getElementById('tb-icon').value.trim()||'🔧';
  const title = document.getElementById('tb-title').value.trim();
  const description = document.getElementById('tb-desc').value.trim();
  const category = document.getElementById('tb-category').value;
  const catsRaw = document.getElementById('tb-cats').value;
  const categories = catsRaw.split(',').map(s=>s.trim()).filter(Boolean);
  const url = document.getElementById('tb-url').value.trim();
  const published = document.getElementById('tb-published').checked;

  if(!title){toast('Başlık gerekli');return;}

  const payload = {icon, title, description, category, categories, url, published};
  if(editId){
    const {error} = await sb.from('toolbox_items').update(payload).eq('id', editId);
    if(error){toast('❌ '+error.message);return;}
    const idx = toolboxItems.findIndex(x=>String(x.id)===String(editId));
    if(idx>=0) toolboxItems[idx] = {...toolboxItems[idx], ...payload};
    toast('✅ İçerik güncellendi');
  } else {
    const {data, error} = await sb.from('toolbox_items').insert({...payload, order_index:toolboxItems.length}).select().single();
    if(error){toast('❌ '+error.message);return;}
    toolboxItems.push(data);
    toast('✅ İçerik eklendi');
  }
  closeModal('modal-toolbox');
  renderDijitalBarista();
}

async function deleteToolboxItem(id){
  if(!confirm('Bu içeriği silmek istiyor musun?'))return;
  // Only delete from Supabase if it's a numeric id (not a hardcoded fallback)
  if(!String(id).startsWith('k') && !String(id).startsWith('s') && !String(id).startsWith('b')){
    await sb.from('toolbox_items').delete().eq('id', id);
  }
  toolboxItems = toolboxItems.filter(x=>String(x.id)!==String(id));
  renderDijitalBarista();
  toast('Silindi');
}

// ===== PANELS =====
function openPanel(id){document.getElementById(id).classList.add('open');}
function closePanel(id){document.getElementById(id).classList.remove('open');}
function closeAllPanels(){document.querySelectorAll('.side-panel').forEach(p=>p.classList.remove('open'));}

function openClientPanel(id){
  const c=state.clients.find(x=>String(x.id)===String(id));if(!c)return;
  state.currentClientId=c.id;
  const idx=state.clients.indexOf(c);
  document.getElementById('dp-name').textContent=c.name;
  document.getElementById('dp-name2').textContent=c.name;
  document.getElementById('dp-type').textContent=c.type+' Koçluğu';
  const av=document.getElementById('dp-avatar');
  av.textContent=ini(c.name);av.className='avatar '+avc(idx);av.style.cssText='width:48px;height:48px;font-size:16px;border-radius:14px';
  document.getElementById('dp-badge').innerHTML=c.programEnd?deadlineTag(c.programEnd):'';
  document.getElementById('dp-name-input').value=c.name||'';
  document.getElementById('dp-type-input').value=c.type||'';
  document.getElementById('dp-email-input').value=c.email||'';
  document.getElementById('dp-phone-input').value=c.phone||'';
  document.getElementById('dp-social-input').value=c.social||'';
  document.getElementById('dp-remaining').value=c.remainingSessions??0;
  document.getElementById('dp-end-date').value=c.programEnd||'';
  if(c.programEnd) calcDaysLeft(c.programEnd);
  document.getElementById('dp-sessions-tag').innerHTML=sessionsTag(c.remainingSessions??0);
  document.getElementById('dp-deadline-tag').innerHTML=deadlineTag(c.programEnd);
  const h=c.health||0;
  document.getElementById('dp-health-val').textContent=h;
  document.getElementById('dp-health-val').style.color=healthColor(h);
  document.getElementById('dp-health-badge').textContent=healthLabel(h);
  document.getElementById('dp-health-badge').style.color=healthColor(h);
  document.getElementById('dp-health-slider').value=h;
  renderClientNotes(c);
  openPanel('panel-client');
}

function updateHealthSlider(v){
  document.getElementById('dp-health-val').textContent=v;
  document.getElementById('dp-health-val').style.color=healthColor(+v);
  document.getElementById('dp-health-badge').textContent=healthLabel(+v);
  document.getElementById('dp-health-badge').style.color=healthColor(+v);
}

function calcDaysLeft(dateVal){
  const el=document.getElementById('dp-days-left');if(!el)return;
  if(!dateVal){el.style.display='none';return;}
  const diff=Math.ceil((new Date(dateVal)-new Date())/(1000*60*60*24));
  if(diff<0){el.textContent='⚠️ Program sona erdi ('+Math.abs(diff)+' gün önce)';el.style.background='rgba(255,59,48,0.08)';el.style.borderColor='rgba(255,59,48,0.2)';el.style.color='var(--red)';}
  else if(diff===0){el.textContent='⚠️ Bugün son gün!';el.style.background='rgba(255,59,48,0.08)';el.style.borderColor='rgba(255,59,48,0.2)';el.style.color='var(--red)';}
  else if(diff<=7){el.textContent='⏰ '+diff+' gün kaldı';el.style.background='rgba(255,149,0,0.08)';el.style.borderColor='rgba(255,149,0,0.2)';el.style.color='var(--amber)';}
  else{el.textContent='✓ '+diff+' gün kaldı';el.style.background='var(--blue-subtle)';el.style.borderColor='rgba(91,156,246,0.2)';el.style.color='var(--blue)';}
  el.style.display='block';
}

async function saveClientSchedule(){
  const remaining=+document.getElementById('dp-remaining').value||0;
  const programEnd=document.getElementById('dp-end-date').value||'';
  const c=state.clients.find(x=>String(x.id)===String(state.currentClientId));
  if(!c){toast('Müşteri bulunamadı');return;}
  c.remainingSessions=remaining;
  c.programEnd=programEnd;
  document.getElementById('dp-sessions-tag').innerHTML=sessionsTag(remaining);
  document.getElementById('dp-deadline-tag').innerHTML=deadlineTag(programEnd);
  document.getElementById('dp-badge').innerHTML=programEnd?deadlineTag(programEnd):'';
  const {error}=await sb.from('clients').update({
    remaining_sessions:remaining,
    program_end:programEnd||null
  }).eq('id',state.currentClientId);
  if(error){toast('Hata: '+error.message);return;}
  renderHealthPage();renderClientList();toast('✅ Program bilgileri kaydedildi!');
}

async function saveClientHealth(){
  const health=+document.getElementById('dp-health-slider').value;
  const c=state.clients.find(x=>String(x.id)===String(state.currentClientId));
  if(!c){toast('Müşteri bulunamadı');return;}
  c.health=health;
  const {error}=await sb.from('clients').update({health}).eq('id',state.currentClientId);
  if(error){toast('Hata: '+error.message);return;}
  renderHealthPage();renderClientList();toast('✅ Sağlık skoru kaydedildi!');
}

async function approveLead(){
  const l=state.leads.find(x=>+x.id===+state.currentLeadId);if(!l)return;
  if(!confirm(`${l.name} müşteriye dönüştürülsün mü?`))return;
  
  // Supabase'e ekle
  const nc={id:Date.now(),_new:true,name:l.name,type:l.type,status:'Yeni',email:l.email||'',phone:'',sessions:0,remainingSessions:0,programEnd:'',startDate:'',program:'',notes:l.notes||[],health:5,start:''};
  state.clients.push(nc);
  await saveClient(nc);
  
  // Lead'i sil
  const delId=state.currentLeadId;
  state.leads=state.leads.filter(x=>+x.id!==+delId);
  await deleteSBLead(delId);
  
  closePanel('panel-lead');
  toast(l.name+' müşteriye dönüştürüldü ✓');
  render();
}
function renderClientNotes(c){
  document.getElementById('dp-notes').innerHTML=c.notes.length
    ?c.notes.map((n,i)=>`<div class="note-item">${escHtml(n)}<button class="note-del" onclick="delClientNote(${i})">✕</button></div>`).join('')
    :'<div style="font-size:13px;color:var(--color-text-muted)">Henüz not yok</div>';
}
function addNoteToClient(){const inp=document.getElementById('dp-note-input'),v=inp.value.trim();if(!v)return;const c=state.clients.find(x=>String(x.id)===String(state.currentClientId));if(!c)return;c.notes.push(v);inp.value='';renderClientNotes(c);toast('Not eklendi ✓');saveClient(c);}
function delClientNote(i){const c=state.clients.find(x=>String(x.id)===String(state.currentClientId));if(!c)return;c.notes.splice(i,1);renderClientNotes(c);saveClient(c);}
function cycleClientStatus(){const c=state.clients.find(x=>String(x.id)===String(state.currentClientId));if(!c)return;const ss=['Yeni','Aktif','Takip','Tamamlandı'];c.status=ss[(ss.indexOf(c.status)+1)%ss.length];document.getElementById('dp-badge').innerHTML=`<span class="badge ${bCls(c.status)}">${c.status}</span>`;renderClientList();renderStats();toast('Durum: '+c.status);}
function saveContactInfo(){
  const c=state.clients.find(x=>String(x.id)===String(state.currentClientId));if(!c)return;
  const newName=document.getElementById('dp-name-input').value.trim();
  if(!newName){toast('İsim boş olamaz');return;}
  c.name=newName;
  c.type=document.getElementById('dp-type-input').value.trim();
  c.email=document.getElementById('dp-email-input').value.trim();
  c.phone=document.getElementById('dp-phone-input').value.trim();
  c.social=document.getElementById('dp-social-input').value.trim();
  document.getElementById('dp-name').textContent=c.name;
  document.getElementById('dp-name2').textContent=c.name;
  document.getElementById('dp-type').textContent=c.type||'—';
  document.getElementById('dp-badge').innerHTML=c.programEnd?deadlineTag(c.programEnd):'';
  const av=document.getElementById('dp-avatar');
  av.textContent=ini(c.name);
  renderHealthPage();renderDashClients();
  toast('✅ Bilgiler kaydedildi!');
  saveClient(c);
}

async function deleteCurrentClient(){
  if(!confirm('Bu müşteriyi silmek istiyor musun?'))return;
  const delId=state.currentClientId;
  state.clients=state.clients.filter(x=>+x.id!==+delId);
  closePanel('panel-client');
  toast('Müşteri silindi');
  render();
  await deleteSBClient(delId);
}

function openMsPanel(id){
  const m=state.milestones.find(x=>+x.id===+id);if(!m)return;
  state.currentMsId=id;
  document.getElementById('ms-panel-title').textContent=m.title;
  document.getElementById('ms-edit-title').value=m.title;
  document.getElementById('ms-edit-date').value=m.date;
  ['todo','active','done'].forEach(s=>{
    const btn=document.getElementById('msst-'+s);
    btn.className='status-btn'+(m.status===s?' sel-'+s:'');
  });
  renderMsNotes(m);
  openPanel('panel-ms');
}
function renderMsNotes(m){
  document.getElementById('ms-panel-notes').innerHTML=m.notes.length
    ?m.notes.map((n,i)=>`<div class="note-item">${escHtml(n)}<button class="note-del" onclick="delMsNote(${i})">✕</button></div>`).join('')
    :'<div style="font-size:13px;color:var(--color-text-muted)">Henüz not yok</div>';
}
function setMsStatus(s){
  const m=state.milestones.find(x=>+x.id===+state.currentMsId);if(!m)return;
  m.status=s;
  ['todo','active','done'].forEach(st=>{
    const btn=document.getElementById('msst-'+st);
    btn.className='status-btn'+(s===st?' sel-'+st:'');
  });
  renderMilestones();renderDashMilestones();toast('Durum güncellendi');
  saveMilestone(m);
}
function saveMsEdits(){
  const m=state.milestones.find(x=>+x.id===+state.currentMsId);if(!m)return;
  m.title=document.getElementById('ms-edit-title').value||m.title;
  m.date=document.getElementById('ms-edit-date').value||m.date;
  document.getElementById('ms-panel-title').textContent=m.title;
  renderMilestones();renderDashMilestones();toast('Kaydedildi ✓');
  saveMilestone(m);
}
function addNoteToMs(){
  const inp=document.getElementById('ms-note-input'),v=inp.value.trim();if(!v)return;
  const m=state.milestones.find(x=>+x.id===+state.currentMsId);if(!m)return;
  m.notes.push(v);inp.value='';renderMsNotes(m);renderMilestones();toast('Not eklendi ✓');
  saveMilestone(m);
}
function delMsNote(i){
  const m=state.milestones.find(x=>+x.id===+state.currentMsId);if(!m)return;
  m.notes.splice(i,1);renderMsNotes(m);renderMilestones();
  saveMilestone(m);
}
function deleteCurrentMs(){
  if(!confirm('Bu milestone\'ı silmek istiyor musun?'))return;
  const id=state.currentMsId;
  state.milestones=state.milestones.filter(x=>+x.id!==+id);
  closePanel('panel-ms');toast('Milestone silindi');render();
  deleteSBMilestone(id);
}

// ===== MODALS =====
function openModal(id){
  document.getElementById(id).classList.add('open');
  if(id==='modal-add-goal') initCal();
  if(id==='modal-add-user') populateUserTeklifSelect();
}
function closeModal(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));

async function addClient(){
  const name=document.getElementById('c-name').value.trim();if(!name){toast('Ad Soyad zorunlu');return;}
  const nc={
    _new:true, name,
    type:document.getElementById('c-type').value.trim(),
    status:document.getElementById('c-status').value,
    email:document.getElementById('c-email').value.trim(),
    phone:document.getElementById('c-phone').value.trim(),
    sessions:0, remainingSessions:0, programEnd:'', startDate:'', program:'', social:'',
    notes:document.getElementById('c-note').value?[document.getElementById('c-note').value]:[],
    health:5, start:''
  };
  closeModal('modal-add-client');
  ['c-name','c-email','c-phone','c-note'].forEach(id=>document.getElementById(id).value='');
  // Supabase'e kaydet, gerçek id al
  const row={name:nc.name,type:nc.type,status:nc.status,email:nc.email,phone:nc.phone,social:'',sessions:0,remaining_sessions:0,program_end:null,start_date:null,program:null,health:5,notes:[]};
  const r=await sb.from('clients').insert(row).select().single();
  if(r.error){toast('Hata: '+r.error.message);return;}
  nc.id = +r.data.id; nc._new=false;
  state.clients.push(nc);
  toast('✅ Müşteri eklendi!');
  renderHealthPage(); renderDashClients(); renderStats();
}
async function addLead(){
  const name=document.getElementById('l-name').value.trim();if(!name){toast('Ad Soyad zorunlu');return;}
  const nl={id:Date.now(),_new:true,name,type:'',teklifId:'',social:document.getElementById('l-social').value.trim(),source:document.getElementById('l-source').value,stage:document.getElementById('l-stage').value,note:document.getElementById('l-note').value,notes:[],tutar:+document.getElementById('l-tutar').value||0};
  state.leads.push(nl);
  closeModal('modal-add-lead');
  document.getElementById('l-social-preview').style.display='none';
  ['l-name','l-note','l-tutar','l-social'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  toast('Lead eklendi ✓');renderPipeline();renderStats();
  await saveLead(nl);
}

// LEAD PANEL
function openLeadPanel(id){
  const l=state.leads.find(x=>x.id===id);if(!l)return;
  state.currentLeadId=id;
  document.getElementById('lead-panel-title').textContent=l.name;
  document.getElementById('lead-panel-source').textContent=l.source||'—';
  document.getElementById('lead-panel-stage').textContent=l.stage;
  // Profil kartı
  const profileDiv = document.getElementById('lead-panel-profile');
  if(l.social) {
    const handle = extractHandle(l.social);
    const url = l.social.startsWith('http') ? l.social : 'https://instagram.com/' + l.social.replace('@','');
    document.getElementById('lead-panel-avatar').textContent = l.name.charAt(0).toUpperCase();
    document.getElementById('lead-panel-handle').textContent = handle;
    document.getElementById('lead-panel-profilelink').href = url;
    profileDiv.style.display = 'block';
  } else {
    profileDiv.style.display = 'none';
  }
  const tutarEl=document.getElementById('lead-panel-tutar');
  if(tutarEl)tutarEl.value=l.tutar||'';
  // Teklif dropdown doldur
  const teklifSel=document.getElementById('lead-panel-teklif');
  if(teklifSel){
    const aktifTeklifler=teklifler.filter(t=>t.status==='Aktif');
    teklifSel.innerHTML='<option value="">— Teklif seç —</option>'+
      aktifTeklifler.map(t=>`<option value="${t.id}" data-price="${t.price}"${l.teklifId&&String(l.teklifId)===String(t.id)?' selected':''}>${t.name} — ₺${Number(t.price).toLocaleString('tr-TR')}</option>`).join('');
  }
  renderLeadNotes(l);
  openPanel('panel-lead');
}
function renderLeadNotes(l){
  if(!l.notes)l.notes=[];
  document.getElementById('lead-panel-notes').innerHTML=l.notes.length
    ?l.notes.map((n,i)=>`<div class="note-item">${escHtml(n)}<button class="note-del" onclick="delLeadNote(${i})">✕</button></div>`).join('')
    :'<div style="font-size:13px;color:var(--color-text-muted)">Henüz not yok</div>';
}
function addNoteToLead(){
  const inp=document.getElementById('lead-note-input'),v=inp.value.trim();if(!v)return;
  const l=state.leads.find(x=>+x.id===+state.currentLeadId);if(!l)return;
  if(!l.notes)l.notes=[];
  l.notes.push(v);inp.value='';renderLeadNotes(l);renderPipeline();toast('Not eklendi ✓');
  saveLead(l);
}
function delLeadNote(i){
  const l=state.leads.find(x=>+x.id===+state.currentLeadId);if(!l)return;
  l.notes.splice(i,1);renderLeadNotes(l);renderPipeline();
  saveLead(l);
}
function leadTeklifSec(teklifId){
  const l=state.leads.find(x=>+x.id===+state.currentLeadId);if(!l)return;
  if(!teklifId){ return; }
  const t=teklifler.find(x=>String(x.id)===String(teklifId));
  if(!t)return;
  // Tutarı otomatik doldur
  l.teklifId=teklifId;
  l.tutar=t.price;
  const tutarEl=document.getElementById('lead-panel-tutar');
  if(tutarEl)tutarEl.value=t.price;
  saveLead(l);
  renderPipeline();
  toast('✅ ' + t.name + ' seçildi');
}

function saveLeadTutar(){
  const l=state.leads.find(x=>+x.id===+state.currentLeadId);if(!l)return;
  const val=+document.getElementById('lead-panel-tutar').value||0;
  l.tutar=val;
  saveLead(l);
  renderPipeline();
  toast('✅ Tutar güncellendi');
}

function setLeadStage(stage){
  const l=state.leads.find(x=>+x.id===+state.currentLeadId);if(!l)return;
  l.stage=stage;
  document.getElementById('lead-panel-stage').textContent=stage;
  renderPipeline();toast('Aşama: '+stage);
  const lUpd=state.leads.find(x=>+x.id===+state.currentLeadId);if(lUpd)saveLead(lUpd);
}
function deleteCurrentLead(){
  if(!confirm('Bu lead\'i silmek istiyor musun?'))return;
  const delLId=state.currentLeadId;
  state.leads=state.leads.filter(x=>x.id!==delLId);
  closePanel('panel-lead');toast('Lead silindi');renderPipeline();renderStats();
  deleteSBLead(delLId);
}
async function addGoal(){
  const name=document.getElementById('g-name').value.trim();if(!name){toast('Hedef adı zorunlu');return;}
  const dateStr=selectedDate?selectedDate.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):'—';
  const ng={id:Date.now(),_new:true,name,date:dateStr,icon:'🎯',done:false,notes:[]};
  state.goals.push(ng);
  closeModal('modal-add-goal');document.getElementById('g-name').value='';initCal();
  toast('Hedef eklendi ✓');render();
  await saveGoal(ng);
}
async function addMilestone(){
  const name=document.getElementById('ms-name').value.trim();if(!name){toast('Milestone adı zorunlu');return;}
  const nm={id:Date.now(),_new:true,title:name,date:document.getElementById('ms-date').value||'—',status:document.getElementById('ms-status').value,notes:[]};
  state.milestones.push(nm);
  closeModal('modal-add-ms');document.getElementById('ms-name').value='';document.getElementById('ms-date').value='';
  toast('Milestone eklendi ✓');render();
  await saveMilestone(nm);
}

// ===== DAILY =====
async function saveDaily(){
  const dateInput = document.getElementById('daily-entry-date').value;
  if(!dateInput){toast('Lütfen tarih seçin');return;}

  const sel = document.querySelector('.mood-btn.sel');
  const entry = {
    dateShort: dateInput,
    mood:      sel ? sel.textContent : '🙂',
    takipci:   +document.getElementById('kpi-takipci').value||0,
    mail:      +document.getElementById('kpi-mail').value||0,
    icerik:    +(document.getElementById('kpi-icerik').value||0),
    reklam:    +document.getElementById('kpi-reklam').value||0,
    tpm:       +document.getElementById('kpi-tpm').value||0,
    teklif:    +document.getElementById('kpi-teklif').value||0,
    yorum:     document.getElementById('kpi-yorum').value
  };

  // DÜZENLEME MODU — mevcut kaydı güncelle
  if(window._editingDailyId){
    const id = window._editingDailyId;
    const row = {
      entry_date:dateInput, mood:entry.mood,
      takipci:entry.takipci, mail:entry.mail, icerik:entry.icerik,
      reklam:entry.reklam, tpm:entry.tpm, hotlist:entry.hotlist,
      musteri:entry.musteri, teklif:entry.teklif,
      alinan:entry.alinan, anlasma:entry.anlasma, yorum:entry.yorum
    };
    const {error} = await sb.from('daily_entries').update(row).eq('id',+id).eq('user_id',currentUser?.email||'');
    if(error){toast('❌ Güncelleme hatası: '+error.message);return;}
    // state güncelle
    const idx = state.daily.findIndex(x=>+x.id===+id);
    if(idx>=0) state.daily[idx] = {...state.daily[idx], ...entry};
    window._editingDailyId = null;
    toast('Giriş güncellendi ✓');
  } else {
    // YENİ KAYIT — aynı tarihe (bu kullanıcı için) giriş var mı kontrol et
    const {data:existing} = await sb.from('daily_entries').select('id').eq('entry_date',dateInput).eq('user_id',currentUser?.email||'');
    if(existing && existing.length > 0){
      toast('⚠️ Bu tarihe zaten giriş yapılmış!');
      setTimeout(()=>{ if(confirm('Raporlar sayfasından düzenlemek ister misin?')) go('reports',document.querySelector('[onclick*=reports]')); },300);
      return;
    }
    const d = new Date(dateInput);
    entry.date = d.toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    state.daily.push(entry);
    saveDailyEntry(entry);
    toast('Günlük giriş kaydedildi ✓');
  }

  // Formu temizle
  ['kpi-takipci','kpi-mail','kpi-icerik','kpi-reklam','kpi-tpm','kpi-teklif','kpi-yorum'].forEach(id=>document.getElementById(id).value='');
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('daily-entry-date').value = todayStr;
  prefillTakipciFromIG(todayStr);
  render();
}

async function editDailyEntry(id){
  const d = state.daily.find(x=>+x.id===+id); if(!d) return;
  window._editingDailyId = id;
  // Modalı doldur
  document.getElementById('ed-date').value    = d.dateShort||d.date||'';
  document.getElementById('ed-mood').value    = d.mood||'🙂';
  document.getElementById('ed-takipci').value = d.takipci||0;
  document.getElementById('ed-mail').value    = d.mail||0;
  document.getElementById('ed-reklam').value  = d.reklam||0;
  document.getElementById('ed-tpm').value     = d.tpm||0;
  document.getElementById('ed-teklif').value  = d.teklif||0;
  document.getElementById('ed-icerik').value  = d.icerik||0;
  document.getElementById('ed-yorum').value   = d.yorum||'';
  openModal('modal-edit-daily');
}

async function saveEditedDaily(){
  const id = window._editingDailyId; if(!id) return;
  const dateVal = document.getElementById('ed-date').value;
  if(!dateVal){ toast('Tarih seç'); return; }
  const row = {
    entry_date: dateVal,
    mood:       document.getElementById('ed-mood').value,
    takipci:    +document.getElementById('ed-takipci').value||0,
    mail:       +document.getElementById('ed-mail').value||0,
    reklam:     +document.getElementById('ed-reklam').value||0,
    tpm:        +document.getElementById('ed-tpm').value||0,
    teklif:     +document.getElementById('ed-teklif').value||0,
    icerik:     +document.getElementById('ed-icerik').value||0,
    yorum:      document.getElementById('ed-yorum').value
  };
  const {error} = await sb.from('daily_entries').update(row).eq('id',+id).eq('user_id',currentUser?.email||'');
  if(error){ toast('❌ Hata: '+error.message); return; }
  // state güncelle
  const idx = state.daily.findIndex(x=>+x.id===+id);
  if(idx>=0) state.daily[idx] = { ...state.daily[idx], ...row, dateShort: dateVal };
  window._editingDailyId = null;
  closeModal('modal-edit-daily');
  renderReports();
  render();
  toast('✅ Güncellendi!');
}

async function deleteDailyEntry(id){
  if(!confirm('Bu girişi silmek istiyor musun?'))return;
  state.daily=state.daily.filter(x=>+x.id!==+id);
  await sb.from('daily_entries').delete().eq('id',+id).eq('user_id',currentUser?.email||'');
  renderReports();toast('Giriş silindi');
}

function pickMood(el){document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('sel'));el.classList.add('sel');}
let icerikPaylasildi = false;
function setIcerik(val){
  icerikPaylasildi = !!val;
  updateIcerikBadge(val === null ? null : !!val);
}

// ===== MINI CALENDAR =====
let calDate=new Date(), selectedDate=new Date();
const months=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const dayLabels=['Pt','Sa','Ça','Pe','Cu','Ct','Pa'];

function initCal(){
  selectedDate=new Date();selectedDate.setHours(0,0,0,0);calDate=new Date(selectedDate);
  document.getElementById('date-display-text').textContent=selectedDate.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
  buildCal();
}
function toggleCal(){
  const cal=document.getElementById('mini-cal'),disp=document.getElementById('date-display');
  cal.classList.toggle('open');disp.classList.toggle('open');
  if(cal.classList.contains('open'))buildCal();
}
function closeCal(){document.getElementById('mini-cal').classList.remove('open');document.getElementById('date-display').classList.remove('open');}
function calNav(dir){calDate.setMonth(calDate.getMonth()+dir);buildCal();}
function buildCal(){
  document.getElementById('cal-title').textContent=months[calDate.getMonth()]+' '+calDate.getFullYear();
  const y=calDate.getFullYear(),m=calDate.getMonth();
  const today=new Date();today.setHours(0,0,0,0);
  let startDay=new Date(y,m,1).getDay()-1;if(startDay<0)startDay=6;
  const dim=new Date(y,m+1,0).getDate(),dipm=new Date(y,m,0).getDate();
  let html=dayLabels.map(d=>`<div class="cal-day-lbl">${d}</div>`).join('');
  for(let i=0;i<startDay;i++)html+=`<div class="cal-day other-month">${dipm-startDay+1+i}</div>`;
  for(let d=1;d<=dim;d++){
    const t=new Date(y,m,d);
    const isToday=t.getTime()===today.getTime();
    const isSel=selectedDate&&t.getTime()===new Date(selectedDate.getFullYear(),selectedDate.getMonth(),selectedDate.getDate()).getTime();
    html+=`<div class="cal-day${isSel?' selected':isToday?' today':''}" onclick="pickDate(${y},${m},${d})">${d}</div>`;
  }
  const rem=(startDay+dim)%7;if(rem>0)for(let i=1;i<=7-rem;i++)html+=`<div class="cal-day other-month">${i}</div>`;
  document.getElementById('cal-grid').innerHTML=html;
}
function pickDate(y,m,d){
  selectedDate=new Date(y,m,d);
  document.getElementById('date-display-text').textContent=selectedDate.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
  closeCal();buildCal();
}
document.addEventListener('click',e=>{const w=document.querySelector('.date-picker-wrap');if(w&&!w.contains(e.target))closeCal();});

// ===== CHART =====
const data6ay={labels:['Ekim','Kasım','Aralık','Ocak','Şubat','Mart'],values:[28000,31500,29000,36000,36000,42500]};
const data60gun={labels:['15 Oca','22 Oca','29 Oca','5 Şub','12 Şub','19 Şub','26 Şub','5 Mar','12 Mar','16 Mar'],values:[8200,9100,8600,9800,10200,9400,11000,12500,13200,14100]};
const data90gun={labels:['15 Ara','22 Ara','29 Ara','5 Oca','12 Oca','19 Oca','26 Oca','2 Şub','9 Şub','16 Şub','23 Şub','2 Mar','9 Mar','16 Mar'],values:[6800,7200,6500,7800,8200,9100,8600,9800,10200,9400,11000,12500,13200,14100]};
const data1yil={labels:['Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara','Oca','Şub','Mar'],values:[18000,21000,24000,22000,25000,27000,28000,31500,29000,36000,36000,42500]};
let chart;
function buildChart(data){
  const ctx=document.getElementById('revenue-chart').getContext('2d');
  if(chart)chart.destroy();
  const grad=ctx.createLinearGradient(0,0,0,190);
  grad.addColorStop(0,'rgba(0,113,227,0.18)');grad.addColorStop(1,'rgba(0,113,227,0)');
  chart=new Chart(ctx,{type:'line',data:{labels:data.labels,datasets:[{data:data.values,borderColor:'#0071e3',borderWidth:2,backgroundColor:grad,fill:true,tension:0.42,pointRadius:4,pointBackgroundColor:'#0071e3',pointBorderColor:'#fff',pointBorderWidth:2,pointHoverRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1d1d1f',padding:10,cornerRadius:10,callbacks:{label:c=>'₺'+c.parsed.y.toLocaleString('tr-TR')}}},scales:{x:{grid:{display:false},border:{display:false},ticks:{font:{size:11},color:'#86868b'}},y:{grid:{color:'rgba(0,0,0,0.05)'},border:{display:false},ticks:{font:{size:11},color:'#86868b',callback:v=>'₺'+(v/1000).toFixed(0)+'B'}}}}});
}
function setRange(range,el){
  el.closest('.chart-tabs').querySelectorAll('.chart-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');
  const map={['6ay']:data6ay,['60gun']:data60gun,['90gun']:data90gun,['1yil']:data1yil};
  const d=map[range]||data6ay;
  const total=d.values.reduce((a,b)=>a+b,0),last=d.values[d.values.length-1],prev=d.values[d.values.length-2];
  const pct=Math.round((last-prev)/prev*100);
  document.getElementById('rev-month').textContent='₺'+last.toLocaleString('tr-TR');
  document.getElementById('rev-total').textContent='₺'+total.toLocaleString('tr-TR');
  document.getElementById('rev-change').textContent=(pct>0?'↑':'↓')+' %'+Math.abs(pct);
  const lbl={['6ay']:'Toplam (6 ay)',['60gun']:'Toplam (60 gün)',['90gun']:'Toplam (90 gün)',['1yil']:'Toplam (1 yıl)'};
  document.getElementById('rev-total-label').textContent=lbl[range]||'Toplam';
  buildChart(d);
}

function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2000);
}

// ===== INIT =====
// ===== AUTH =====
const ADMIN_EMAIL = 'admin@mentorflow.com';
const ADMIN_PASS_HASH = 'ca03b861723f3bc73bc8a14f649bba1697d2340e282b1362cab61ee6945b2d1d';

let users = [];
let currentUser = null;

function saveUsers(){} // Supabase handles this

async function sha256(str){
  if(crypto?.subtle){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  // Pure JS fallback for HTTP (no crypto.subtle)
  function _sha256(s){const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];const m=[];let i=0;s=unescape(encodeURIComponent(s));for(i=0;i<s.length;i++)m[i>>2]|=(s.charCodeAt(i))<<(24-8*(i%4));m[i>>2]|=0x80<<(24-8*(i%4));const l=s.length*8;m[((s.length+64>>9)<<4)+15]=l;for(let b=0;b<m.length;b+=16){let[a,bb,c,d,e,f,g,hh]=h;const w=Array(64);for(let j=0;j<16;j++)w[j]=m[b+j]||0;for(let j=16;j<64;j++){const s0=((w[j-15]>>>7)|(w[j-15]<<25))^((w[j-15]>>>18)|(w[j-15]<<14))^(w[j-15]>>>3);const s1=((w[j-2]>>>17)|(w[j-2]<<15))^((w[j-2]>>>19)|(w[j-2]<<13))^(w[j-2]>>>10);w[j]=(w[j-16]+s0+w[j-7]+s1)>>>0;}for(let j=0;j<64;j++){const S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7));const ch=(e&f)^(~e&g);const t1=(hh+S1+ch+K[j]+w[j])>>>0;const S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10));const maj=(a&bb)^(a&c)^(bb&c);const t2=(S0+maj)>>>0;hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=bb;bb=a;a=(t1+t2)>>>0;}h[0]=(h[0]+a)>>>0;h[1]=(h[1]+bb)>>>0;h[2]=(h[2]+c)>>>0;h[3]=(h[3]+d)>>>0;h[4]=(h[4]+e)>>>0;h[5]=(h[5]+f)>>>0;h[6]=(h[6]+g)>>>0;h[7]=(h[7]+hh)>>>0;}return h.map(v=>v.toString(16).padStart(8,'0')).join('');}
  return _sha256(str);
}

async function doLogin(){
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  // Admin hard-coded check
  const passHash = await sha256(pass);
  if(email === ADMIN_EMAIL && passHash === ADMIN_PASS_HASH){
    currentUser = {email, name:'Admin', role:'admin'};
    showApp();
    return;
  }

  if (!sb) {
    errEl.textContent = showSupabaseConnectionError();
    errEl.style.display = 'block';
    return;
  }

  // Supabase users tablosundan kontrol (role dahil)
  const {data:found, error} = await sb.from('users').select('*').eq('email',email).eq('password',pass);
  if(found && found.length > 0){
    const u = found[0];
    currentUser = {email: u.email, name: u.name, role: u.role||'client', id: u.id};
    showApp();
    return;
  }

  errEl.style.display = 'block';
  setTimeout(() => errEl.style.display = 'none', 3000);
}

function openInitialDukkanPage(){
  const page = document.getElementById('page-daily');
  const nav = document.querySelector('[data-nav-page="daily"]') || document.querySelector('.nav-item[onclick*="daily"]');
  if(!page) return;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  page.classList.add('active');
  if(nav) nav.classList.add('active');
  if(typeof showDailyWelcome === 'function') showDailyWelcome();
}

function showApp(){
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-root').style.display = 'flex';
  const nameEl = document.getElementById('sidebar-username');
  const roleEl = document.getElementById('sidebar-role');
  if(nameEl) nameEl.textContent = currentUser.name;
  if(roleEl) roleEl.textContent = currentUser.role === 'admin' ? 'Admin' : 'Üye';

  // Admin değilse Yönetim menüsünü gizle
  const isAdmin = currentUser.role === 'admin';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  document.querySelectorAll('.non-admin-only').forEach(el => {
    el.style.display = isAdmin ? 'none' : '';
  });

  // Dersler sayfası tüm giriş yapan kullanıcılara açık; görünür/gizli kontrolü
  // bölüm ve ders seviyesinde Supabase verisiyle yönetilir.
  const canSeeDersler = !!currentUser;
  const navEgitim = document.getElementById('nav-egitim');
  if(navEgitim) navEgitim.style.display = canSeeDersler ? '' : 'none';
  const pageEgitim = document.getElementById('page-egitim');
  if(pageEgitim) pageEgitim.style.display = canSeeDersler ? '' : 'none';

  // State sıfırla
  state.clients=[]; state.leads=[]; state.goals=[];
  state.milestones=[]; state.daily=[]; state.offers=[]; state.ownClient=null;

  openInitialDukkanPage();
  render();
  setTimeout(() => buildChart(data6ay), 100);
  initCal();
  loadFromSupabase().then(() => {
    render();
    openInitialDukkanPage();
    loadSalesTicker();
    loadIgDailyKPIs();
    renderUserProgramCard();
    renderExpiryBadge();
    updateUnreadBadge();
    checkAccess(); // enforce expiry after client data is loaded
  });
}

function doLogout(){
  currentUser = null;
  state.clients=[]; state.leads=[]; state.goals=[];
  state.milestones=[]; state.daily=[]; state.offers=[]; state.ownClient=null;
  const eb=document.getElementById('expiry-badge'); if(eb) eb.style.display='none';
  document.getElementById('app-root').style.display = 'none';
  document.getElementById('block-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

/* ---- Kullanıcı Ekle helpers ---- */
function offerToDays(o) {
  if(!o || !o.duration_value) return null;
  const v = parseInt(o.duration_value);
  const u = (o.duration_unit || 'Ay').trim();
  if(u === 'Gün')   return v;
  if(u === 'Hafta') return v * 7;
  if(u === 'Ay')    return v * 30;
  if(u === 'Yıl')   return v * 365;
  return null;
}

function populateUserTeklifSelect() {
  const sel = document.getElementById('u-offer'); if(!sel) return;
  const opts = state.offers.map(o =>
    `<option value="${o.id}" data-price="${o.price||0}" data-dur-val="${o.duration_value||''}" data-dur-unit="${o.duration_unit||'Ay'}" data-name="${escHtml(o.name)}">${escHtml(o.name)}${o.duration_value ? ' · '+o.duration_value+' '+o.duration_unit : ''}</option>`
  ).join('');
  sel.innerHTML = '<option value="">— Teklif seç —</option>' + opts;
  // today as default start_date
  const sd = document.getElementById('u-start');
  if(sd && !sd.value) sd.value = new Date().toISOString().slice(0,10);
  updateUserFormPreview();
}

function updateUserFormPreview() {
  const sel = document.getElementById('u-offer');
  const sdEl = document.getElementById('u-start');
  const prevEl = document.getElementById('u-preview');
  const monthlyEl = document.getElementById('u-monthly');
  if(!sel || !sdEl || !prevEl) return;

  const opt = sel.options[sel.selectedIndex];
  const offerId = sel.value;
  if(!offerId) { prevEl.style.display='none'; return; }

  const o = state.offers.find(x => String(x.id) === String(offerId));
  if(!o) { prevEl.style.display='none'; return; }

  const days = offerToDays(o);
  const startStr = sdEl.value;

  // Auto-fill monthly payment from offer price / duration months
  if(monthlyEl && !monthlyEl._userEdited) {
    const months = o.duration_unit==='Ay' ? (o.duration_value||1) :
                   o.duration_unit==='Yıl' ? (o.duration_value||1)*12 : null;
    if(months && o.price) monthlyEl.value = Math.round(o.price / months);
    else if(o.price) monthlyEl.value = o.price;
  }
  monthlyEl.addEventListener('input', () => { monthlyEl._userEdited = true; }, {once:true});

  // Duration label
  const durLabel = o.duration_value ? o.duration_value + ' ' + (o.duration_unit||'Ay') : '—';
  document.getElementById('u-prev-dur').textContent = durLabel;

  if(days && startStr) {
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(start.getTime() + days * 86400000);
    const endStr = end.toLocaleDateString('tr-TR', {day:'2-digit', month:'short', year:'numeric'});
    document.getElementById('u-prev-end').textContent = endStr;

    const rem = remainingDays(end.toISOString().slice(0,10));
    const remEl = document.getElementById('u-prev-rem');
    remEl.textContent = remainingDaysLabel(rem);
    remEl.style.color = remainingDaysColor(rem);
  } else {
    document.getElementById('u-prev-end').textContent = '—';
    document.getElementById('u-prev-rem').textContent = '—';
  }

  prevEl.style.display = 'block';
}

async function recordSaleInDaily(name, programName, amount) {
  const today = new Date().toISOString().slice(0,10);
  const adminEmail = currentUser?.email || '';
  const noteText = programName ? `${name} – ${programName}` : name;

  const { data: rows } = await sb.from('daily_entries')
    .select('*').eq('entry_date', today).eq('user_id', adminEmail);

  const existing = rows && rows.length > 0 ? rows[0] : null;

  if(existing) {
    const newAlinan = (existing.alinan||0) + amount;
    const newWin = existing.win ? existing.win + '\n' + noteText : noteText;
    await sb.from('daily_entries').update({ alinan: newAlinan, win: newWin }).eq('id', existing.id);
    const local = state.daily.find(d => String(d.id) === String(existing.id));
    if(local) { local.alinan = newAlinan; local.win = newWin; }
    else { state.daily.unshift({ id:existing.id, date:today, dateShort:today, mood:existing.mood||'🙂', takipci:existing.takipci||0, mail:existing.mail||0, icerik:existing.icerik||0, reklam:existing.reklam||0, tpm:existing.tpm||0, hotlist:existing.hotlist||0, musteri:existing.musteri||0, teklif:existing.teklif||0, alinan:newAlinan, anlasma:existing.anlasma||0, yorum:existing.yorum||'', win:newWin }); }
  } else {
    const entry = {
      dateShort: today, mood:'🙂', takipci:0, mail:0, icerik:0,
      reklam:0, tpm:0, hotlist:0, musteri:0, teklif:0,
      alinan: amount, anlasma:0, yorum:'', win: noteText
    };
    await saveDailyEntry(entry);
    state.daily.unshift(entry);
  }
}

async function addUser(){
  const name = document.getElementById('u-name').value.trim();
  const email = document.getElementById('u-email').value.trim().toLowerCase();
  const password = document.getElementById('u-password').value;
  if(!name || !email || !password){ toast('Tüm alanları doldur'); return; }
  if(password.length < 6){ toast('Şifre en az 6 karakter olmalı'); return; }

  // Offer / program bilgileri
  const offerId = document.getElementById('u-offer').value;
  const offer = offerId ? state.offers.find(x => String(x.id)===String(offerId)) : null;
  const startStr = document.getElementById('u-start').value || new Date().toISOString().slice(0,10);
  const monthlyPay = parseFloat(document.getElementById('u-monthly').value) || (offer ? offer.price||0 : 0);
  const durationDays = offer ? offerToDays(offer) : null;
  const endDate = (durationDays && startStr)
    ? new Date(new Date(startStr+'T00:00:00').getTime() + durationDays*86400000).toISOString().slice(0,10)
    : null;
  const programName = offer ? offer.name : '';

  // Supabase'de zaten var mı kontrol et
  const {data:existing} = await sb.from('users').select('id').eq('email',email);
  if(existing && existing.length > 0){ toast('Bu e-posta zaten kayıtlı'); return; }

  // 1. Users tablosuna ekle (role: client)
  const {data,error} = await sb.from('users').insert({name,email,password,role:'client'}).select().single();
  if(error){ toast('Hata: '+error.message); return; }
  if(!users) users=[];
  users.push({id:data.id,name,email,password});

  // 2. Clients tablosuna ekle (Müşteri Sağlığı kaynağı)
  const clientRow = {
    name, email, type: offer?.category||'', status:'Aktif',
    phone:'', social:null, sessions:0, remaining_sessions:0,
    program: programName||null,
    start_date: startStr||null,
    program_end: endDate||null,
    health: 8, notes: [],
    user_id: currentUser?.email||null
  };
  const {data:cd, error:ce} = await sb.from('clients').insert(clientRow).select().single();
  if(!ce && cd) {
    state.clients.push({
      id:+cd.id, _new:false, name, email,
      type: clientRow.type, status:'Aktif',
      phone:'', social:'', sessions:0, remainingSessions:0,
      programEnd: endDate||'', startDate: startStr||'',
      program: programName, health:8, notes:[], start:startStr||''
    });
  }

  // 3. Customers tablosuna ekle (MRR kaynağı)
  const customerRow = {
    name, email, program: programName||'',
    monthly_payment: monthlyPay,
    start_date: startStr||null,
    end_date: endDate||null,
    status: 'Aktif', notes: ''
  };
  const newCustId = await insertMusteriSB(customerRow);
  musteriler.push({ id: newCustId, ...customerRow });

  // 4. Günlük raporlara otomatik satış kaydı
  if(monthlyPay > 0 || programName) {
    await recordSaleInDaily(name, programName, monthlyPay);
  }

  closeModal('modal-add-user');
  const prevEl = document.getElementById('u-preview'); if(prevEl) prevEl.style.display='none';
  ['u-name','u-email','u-password','u-start','u-monthly'].forEach(id => { const el=document.getElementById(id); if(el){ el.value=''; el._userEdited=false; }});
  document.getElementById('u-offer').value='';
  toast('✅ '+name+' eklendi!');
  renderUsers(); renderHealthPage(); renderStats();
  renderMusteriKPI(); renderMusterierChart(); renderMusteriTable();
}

/* ================================================================
   GÜNCELLEMELER — CHANGELOG
   ================================================================ */
// KURAL: Buraya SADECE kullanıcıyı etkileyen değişiklikler eklenir.
// Admin paneli, yönetim araçları, arka plan değişiklikleri EKLENMEZ.
const CHANGELOG = [
  {
    date: '2026-04-17',
    entries: [
      { type:'new', icon:'💬', title:'Uygulama içi mesajlaşma eklendi', desc:'Admin ve kullanıcılar arasında anlık mesajlaşma. Admin tüm kullanıcıları sol panelde görür, istediğiyle sohbet başlatabilir. Kullanıcılar da admin\'e yazabilir. Okunmamış mesajlar için sidebar rozeti var.' },
      { type:'new', icon:'⏳', title:'Abonelik süresi dolunca erişim engeli', desc:'Süresi dolan kullanıcılar giriş yapınca tam ekran kilit ekranı görür. Sağ üstte kalan gün rozeti: 7 günden az turuncu, bitince kırmızı.' },
      { type:'imp', icon:'🔒', title:'Şifreler SHA-256 ile hashlendi', desc:'Admin ve kullanıcı şifreleri artık veritabanında düz metin olarak saklanmıyor. Giriş sırasında hash karşılaştırması yapılıyor.' },
      { type:'imp', icon:'🛡️', title:'Supabase RLS etkinleştirildi', desc:'Tüm tablolarda Row Level Security açıldı. Veritabanı dışarıdan doğrudan erişime karşı korunuyor.' },
      { type:'imp', icon:'🎓', title:'Dersler sürükle-bırak sıralama', desc:'Seviyeler, bölümler ve dersler sürükle-bırak ile yeniden sıralanabiliyor. Sıra numarası girme kaldırıldı.' },
    ]
  },
  {
    date: '2026-04-16',
    entries: [
      { type:'new', icon:'📋', title:'Ödevler sistemi eklendi', desc:'Koçun sana görev atayabilecek. Ödevi tamamladığında "Tamamladım" diyorsun, koç inceleyip onaylıyor. Durum takibi: Atandı → İnceleniyor → Onaylandı.' },
      { type:'new', icon:'🧰', title:'Alet Çantası güncellendi', desc:'Tüm botlar ve kitler artık düzenlenebilir içerik olarak yönetiliyor. Koçun yeni araçlar ekleyip kaldırabilir.' },
      { type:'imp', icon:'🗂️', title:'Menü yeniden düzenlendi', desc:'Navigasyon daha sade ve organize bir yapıya kavuştu. Operasyon ve İş Takibi grupları açılır/kapanır hale getirildi. Alet Çantası, Uygulama Planı ve İçerik Yönetimi ana seviyeye taşındı.' },
    ]
  },
  {
    date: '2026-04-15',
    entries: [
      { type:'new', icon:'✅', title:'Uygulama Planı sayfası eklendi', desc:'Faz bazlı program takip sistemi: 4 faz, haftalar ve görevler. Her görevin durumunu Başlanmadı / Devam Ediyor / Tamamlandı olarak işaretleyebilirsin.' },
    ]
  },
  {
    date: '2026-04-14',
    entries: [
      { type:'new', icon:'🏆', title:'Kazanımlar rozet sistemi güncellendi', desc:'5 seviyeli rozet sistemi: Hayatta Kalan\'dan Unicorn\'a. Her rozet belirli bir gelir eşiğini aştığında açılıyor.' },
    ]
  },
];

function renderGuncellemeler() {
  const el = document.getElementById('cl-list'); if(!el) return;
  el.innerHTML = CHANGELOG.map(group => {
    const d = new Date(group.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' });
    const entries = group.entries.map(e => {
      const tagClass = e.type==='new' ? 'cl-tag-new' : e.type==='fix' ? 'cl-tag-fix' : 'cl-tag-imp';
      const tagLabel = e.type==='new' ? 'Yeni' : e.type==='fix' ? 'Düzeltme' : 'İyileştirme';
      const iconClass = e.type==='new' ? 'cl-icon-new' : e.type==='fix' ? 'cl-icon-fix' : 'cl-icon-imp';
      return `<div class="cl-entry">
        <div class="cl-icon ${iconClass}">${e.icon}</div>
        <div class="cl-body">
          <span class="cl-tag ${tagClass}">${tagLabel}</span>
          <div class="cl-title">${e.title}</div>
          <div class="cl-desc">${e.desc}</div>
        </div>
      </div>`;
    }).join('');
    return `<div class="cl-group">
      <div class="cl-date-label">${dateStr}</div>
      <div style="display:flex;flex-direction:column;gap:6px">${entries}</div>
    </div>`;
  }).join('');
}

/* ================================================================
   MÜŞTERİ YÖNETİMİ — CHECK-IN BOARD
   ================================================================ */
const CM_FREQ = 7;        // varsayılan kontrol sıklığı (gün)
const CM_UPCOMING = 2;    // bu kadar gün kalmışsa "yaklaşan"

function cmDaysSince(dateStr) {
  if(!dateStr) return Infinity;
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.floor((today - d) / 86400000);
}

function cmClassify(c) {
  const since = cmDaysSince(c.last_check_in_at);
  if(since <= CM_UPCOMING)       return 'checked';
  if(since < CM_FREQ)            return 'upcoming';
  return 'overdue';
}

function cmStatusText(c) {
  const since = cmDaysSince(c.last_check_in_at);
  if(since === 0)       return 'Bugün kontrol edildi';
  if(since === 1)       return '1 gün önce kontrol edildi';
  if(since < CM_FREQ)   return `${since} gün önce kontrol edildi`;
  if(since === Infinity) return 'Hiç kontrol edilmedi';
  return `${since} gün gecikti`;
}

function cmStatusColor(bucket) {
  if(bucket === 'overdue')  return '#ff6b6b';
  if(bucket === 'upcoming') return '#e0a553';
  return '#4caf81';
}

async function loadMusteriYonetimi() {
  // Load last_check_in_at from clients table
  const { data, error } = await sb.from('clients').select('id,name,email,program,program_end,health,last_check_in_at').order('name');
  if(error) {  return; }
  // Merge into state.clients
  (data||[]).forEach(row => {
    const c = state.clients.find(x => String(x.id) === String(row.id));
    if(c) c.last_check_in_at = row.last_check_in_at || null;
  });
  renderMusteriYonetimi();
}

function renderMusteriYonetimi() {
  const q = (document.getElementById('cm-search')?.value||'').toLowerCase().trim();
  let clients = state.clients.filter(c => c.status !== 'Tamamlandı');
  if(q) clients = clients.filter(c => c.name.toLowerCase().includes(q));

  const overdue  = clients.filter(c => cmClassify(c) === 'overdue');
  const upcoming = clients.filter(c => cmClassify(c) === 'upcoming');
  const checked  = clients.filter(c => cmClassify(c) === 'checked');

  // KPI strip
  const kpiEl = document.getElementById('cm-kpi');
  if(kpiEl) kpiEl.innerHTML = [
    { label:'Geciken', val:overdue.length, color:'#ff6b6b', bg:'rgba(255,59,48,0.08)' },
    { label:'Yaklaşan', val:upcoming.length, color:'#e0a553', bg:'rgba(224,165,83,0.08)' },
    { label:'Kontrol Edildi', val:checked.length, color:'#4caf81', bg:'rgba(76,175,129,0.08)' },
  ].map(k=>`<div class="stat-card" style="background:${k.bg};border-color:transparent">
    <div class="stat-label" style="color:${k.color}">${k.label}</div>
    <div class="stat-value" style="font-size:28px;color:${k.color}">${k.val}</div>
  </div>`).join('');

  // Badge counts
  ['overdue','upcoming','checked'].forEach((b,i)=>{
    const cnt = [overdue,upcoming,checked][i].length;
    const el = document.getElementById(`cm-cnt-${b}`); if(el) el.textContent = cnt;
  });

  // Render each column
  const render = (list, bucket, elId) => {
    const el = document.getElementById(elId); if(!el) return;
    if(!list.length) { el.innerHTML = `<div class="cm-empty">${bucket==='checked'?'Henüz kontrol yok':'Hepsi tamam 🎉'}</div>`; return; }
    el.innerHTML = list.map(c => {
      const days = remainingDays(c.programEnd);
      const remStr = days !== null ? `· ${remainingDaysLabel(days)}` : '';
      const sinceStr = cmStatusText(c);
      const color = cmStatusColor(bucket);
      const isDone = bucket === 'checked';
      return `<div class="cm-card" onclick="openClientPanel(${c.id})">
        <div class="cm-dot" style="background:${color}"></div>
        <div class="cm-card-info">
          <div class="cm-card-name">${escHtml(c.name)}</div>
          <div class="cm-card-meta">${escHtml(c.program||c.type||'—')} ${escHtml(remStr)}</div>
          <div class="cm-card-meta" style="color:${color};margin-top:1px">${sinceStr}</div>
        </div>
        <button class="cm-check-btn ${isDone?'done':''}" title="Kontrol edildi olarak işaretle"
          onclick="event.stopPropagation();cmCheckIn(${c.id})">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="${isDone?'#4caf81':'rgba(255,255,255,0.4)'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 6.5 12 13 4"/></svg>
        </button>
      </div>`;
    }).join('');
  };

  render(overdue,  'overdue',  'cm-list-overdue');
  render(upcoming, 'upcoming', 'cm-list-upcoming');
  render(checked,  'checked',  'cm-list-checked');
}

async function cmCheckIn(clientId) {
  const c = state.clients.find(x => String(x.id) === String(clientId));
  if(!c) return;
  const today = new Date().toISOString().slice(0,10);
  c.last_check_in_at = today;

  // Boost health slightly if overdue
  if((c.health||5) < 6) { c.health = Math.min(10, (c.health||5) + 1); }

  renderMusteriYonetimi();
  renderHealthPage();

  // Persist
  const { error } = await sb.from('clients')
    .update({ last_check_in_at: today, health: c.health })
    .eq('id', clientId);
  if(error)
}

async function deleteUser(id){
  if(!confirm('Bu kullanıcıyı silmek istiyor musun?')) return;
  await sb.from('users').delete().eq('id',id);
  users = users.filter(u => u.id !== id);
  renderUsers();
  toast('Kullanıcı silindi');
}

// ===== MÜŞTERİ RAPORLARI =====
let crData={daily:[],goals:[],milestones:[],tasks:[],clientTeklif:[]};
let crChart=null;
let crMetric='takipci';
let crTab='daily';

async function renderClientReports(){
  // Ensure musteriler is loaded so teklif card can show payment info
  if((typeof musteriler === 'undefined' || musteriler.length === 0) && typeof loadMusteriler === 'function'){
    await loadMusteriler();
  }
  populateCRSelect();
}

function populateCRSelect(){
  const sel=document.getElementById('cr-client-select');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML='<option value="">— Müşteri seçin —</option>';
  // users tablosundaki kayıtları kullan (bunların user_id'leri var)
  users.forEach(u=>{
    const o=document.createElement('option');
    o.value=u.email;
    o.textContent=u.name;
    sel.appendChild(o);
  });
  // users'da olmayan ama clients'da olan müşterileri de ekle
  state.clients.forEach(c=>{
    if(c.email && !users.find(u=>u.email===c.email)){
      const o=document.createElement('option');
      o.value=c.email;
      o.textContent=c.name+' (email yok)';
      sel.appendChild(o);
    }
  });
  if(cur) sel.value=cur;
}

async function loadClientReport(email){
  if(!email){
    document.getElementById('cr-content').style.display='none';
    document.getElementById('cr-empty').style.display='block';
    return;
  }
  document.getElementById('cr-empty').style.display='none';
  document.getElementById('cr-content').style.display='block';
  // Supabase'den bu müşterinin verilerini çek
  const [daily,goals,milestones,homeworks,clientTeklif]=await Promise.all([
    sb.from('daily_entries').select('*').eq('user_id',email).order('entry_date'),
    sb.from('goals').select('*').eq('user_id',email).order('created_at'),
    sb.from('milestones').select('*').eq('user_id',email).order('created_at'),
    sb.from('homework_assignments').select('*').eq('user_id',email).order('created_at'),
    sb.from('offers').select('*').eq('user_id',email).order('created_at'),
  ]);
  crData.daily=daily.data||[];
  crData.goals=goals.data||[];
  crData.milestones=milestones.data||[];
  crData.tasks=homeworks.data||[];
  crData.clientTeklif=clientTeklif.data||[];
  renderCRTeklif(email);
  renderCRStats();
  buildCRChart();
  renderCRTab();
}

function renderCRTeklif(email){
  const el = document.getElementById('cr-teklif'); if(!el) return;
  // Find client record — try email field first, then name match via users array
  let client = state.clients.find(c => c.email === email);
  if(!client){
    const u = (typeof users !== 'undefined' ? users : []).find(u => u.email === email);
    if(u) client = state.clients.find(c => c.name === u.name);
  }
  // Find musteri record (for payment info) — email match or name match
  let musteri = (typeof musteriler !== 'undefined' ? musteriler : []).find(m => m.email === email);
  if(!musteri && client){
    musteri = (typeof musteriler !== 'undefined' ? musteriler : []).find(m => m.name === client.name);
  }
  const anyUser = (typeof users !== 'undefined' ? users : []).find(u => u.email === email);
  if(!client && !musteri && !anyUser){ el.innerHTML=''; return; }

  const fmtD = s => s ? new Date(s+'T00:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}) : '—';
  const displayName = (client&&client.name) || (anyUser&&anyUser.name) || email;
  const programName = (client&&client.program) || (musteri&&musteri.program_name) || 'Dijital Barista Programı';
  const startDate = (client&&client.startDate) || (musteri&&musteri.start_date) || null;
  const endDate = (client&&client.programEnd) || (musteri&&musteri.end_date) || null;
  const monthlyPay = musteri ? (musteri.monthly_payment||0) : 0;
  const days = endDate ? remainingDays(endDate) : null;
  const dcolor = remainingDaysColor(days);
  const dlabel = days===null ? '—' : days < 0 ? 'Süresi doldu' : days===0 ? 'Bugün bitiyor' : days+' gün kaldı';
  const statusLabel = days===null ? 'Aktif' : days<0 ? 'Sona Erdi' : days<=7 ? 'Bitiyor' : 'Aktif';
  const statusColor = days===null||days>7 ? 'var(--color-green)' : days<=0 ? 'var(--color-red)' : 'var(--color-amber)';
  const remainingMonths = (days !== null && days > 0) ? Math.ceil(days / 30) : 0;
  const remainingTotal = monthlyPay && remainingMonths > 0 ? monthlyPay * remainingMonths : 0;

  el.innerHTML = `<div class="cr-teklif-card">
    <div style="font-size:20px">📦</div>
    <div class="cr-teklif-item" style="flex:2;min-width:160px">
      <div class="cr-teklif-label">Müşteri</div>
      <div class="cr-teklif-value">${escHtml(displayName)}</div>
      <div style="font-size:12px;color:var(--color-text-muted)">${escHtml(programName)}</div>
    </div>
    ${monthlyPay ? `<div class="cr-teklif-item">
      <div class="cr-teklif-label">Aylık Ödeme</div>
      <div class="cr-teklif-value">₺${Number(monthlyPay).toLocaleString('tr-TR')}</div>
    </div>` : ''}
    ${remainingTotal ? `<div class="cr-teklif-item">
      <div class="cr-teklif-label">Kalan Ödeme</div>
      <div class="cr-teklif-value" style="color:var(--color-amber)">₺${Number(remainingTotal).toLocaleString('tr-TR')}</div>
      <div style="font-size:11px;color:var(--color-text-muted)">${remainingMonths} ay × ₺${Number(monthlyPay).toLocaleString('tr-TR')}</div>
    </div>` : ''}
    <div class="cr-teklif-item">
      <div class="cr-teklif-label">Başlangıç</div>
      <div class="cr-teklif-value" style="font-size:13px">${fmtD(startDate)}</div>
    </div>
    <div class="cr-teklif-item">
      <div class="cr-teklif-label">Bitiş</div>
      <div class="cr-teklif-value" style="font-size:13px">${fmtD(endDate)}</div>
    </div>
    <div class="cr-teklif-item">
      <div class="cr-teklif-label">Kalan</div>
      <div class="cr-teklif-value" style="color:${dcolor}">${dlabel}</div>
    </div>
    <div class="cr-teklif-item">
      <div class="cr-teklif-label">Durum</div>
      <div class="cr-teklif-value" style="color:${statusColor}">${statusLabel}</div>
    </div>
  </div>`;
}

function renderCRStats(){
  const d=crData.daily;
  const totalGelir=d.reduce((a,x)=>a+(x.alinan||0),0);
  const lastTakipci=d.length?d[d.length-1].takipci||0:0;
  const lastMail=d.length?d[d.length-1].mail||0:0;
  const totalHotlist=d.reduce((a,x)=>a+(x.hotlist||0),0);
  document.getElementById('cr-stats').innerHTML=[
    ['👥 Takipçi',lastTakipci.toLocaleString('tr-TR'),'#2c1a0e'],
    ['📧 Mail Abone',lastMail.toLocaleString('tr-TR'),'#0071e3'],
    ['💰 Toplam Gelir','₺'+totalGelir.toLocaleString('tr-TR'),'var(--color-green)'],
    ['🔥 Hot-List',totalHotlist,'var(--color-amber)'],
  ].map(([lbl,val,color])=>`
    <div class="card"><div class="card-body" style="padding:16px 20px">
      <div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px">${lbl}</div>
      <div style="font-size:22px;font-weight:700;color:${color}">${val}</div>
    </div></div>`).join('');
}

function setCRChart(metric,el){
  crMetric=metric;
  document.querySelectorAll('#cr-content .chart-tab').forEach(b=>b.classList.remove('active'));
  if(el)el.classList.add('active');
  buildCRChart();
}

function buildCRChart(){
  const ctx=document.getElementById('cr-chart');if(!ctx)return;
  const d=[...crData.daily].sort((a,b)=>a.entry_date?.localeCompare(b.entry_date));
  const labels=d.map(x=>x.entry_date);
  let values;
  if(crMetric==='gelir'){let c=0;values=d.map(x=>{c+=(x.alinan||0);return c;});}
  else values=d.map(x=>x[crMetric]||0);
  const color={takipci:'#2c1a0e',mail:'#0071e3',gelir:'var(--color-green)'}[crMetric];
  if(crChart)crChart.destroy();
  crChart=new Chart(ctx.getContext('2d'),{
    type:'line',
    data:{labels,datasets:[{data:values,borderColor:color,borderWidth:2,backgroundColor:'transparent',tension:0.3,pointRadius:4,pointBackgroundColor:color,pointBorderColor:'#fff',pointBorderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},border:{display:false},ticks:{font:{size:11},color:'#6b6963',maxTicksLimit:8}},y:{grid:{color:'rgba(255,255,255,0.05)'},border:{display:false},ticks:{font:{size:11},color:'#6b6963'}}}}
  });
}

function setCRTab(tab,el){
  crTab=tab;
  document.querySelectorAll('#page-client-reports .tab').forEach(b=>b.classList.remove('active'));
  if(el)el.classList.add('active');
  renderCRTab();
}

function renderCRTab(){
  const el=document.getElementById('cr-table');if(!el)return;
  if(crTab==='daily'){
    if(!crData.daily.length){el.innerHTML='<div class="empty" style="padding:32px">Henüz giriş yok</div>';return;}
    el.innerHTML=`<table style="width:100%;border-collapse:collapse">
      <thead><tr style="border-bottom:1px solid var(--color-border)">
        ${['Tarih','Takipçi','Mail','Reklam ₺','Hot-List','Müşteri','Teklif','Alınan ₺'].map(h=>`<th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase">${h}</th>`).join('')}
      </tr></thead>
      <tbody>${crData.daily.slice().reverse().map(d=>`<tr style="border-bottom:1px solid var(--color-divider)" onmouseover="this.style.background='var(--color-surface-hover)'" onmouseout="this.style.background=''">
        <td style="padding:10px 16px;font-size:13px;font-weight:600">${d.entry_date}</td>
        <td style="padding:10px 16px;font-size:13px">${(d.takipci||0).toLocaleString('tr-TR')}</td>
        <td style="padding:10px 16px;font-size:13px">${(d.mail||0).toLocaleString('tr-TR')}</td>
        <td style="padding:10px 16px;font-size:13px">₺${(d.reklam||0).toLocaleString('tr-TR')}</td>
        <td style="padding:10px 16px;font-size:13px">${d.hotlist||0}</td>
        <td style="padding:10px 16px;font-size:13px">${d.musteri||0}</td>
        <td style="padding:10px 16px;font-size:13px">${d.teklif||0}</td>
        <td style="padding:10px 16px;font-size:13px;color:#34c759;font-weight:600">${d.alinan?'₺'+(d.alinan).toLocaleString('tr-TR'):'—'}</td>
      </tr>`).join('')}</tbody></table>`;
  } else if(crTab==='goals'){
    if(!crData.goals.length){el.innerHTML='<div class="empty" style="padding:32px">Henüz hedef yok</div>';return;}
    el.innerHTML='<div style="padding:16px">'+crData.goals.map(g=>`
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--color-divider)">
        <div style="font-size:20px">${g.done?'✓':g.icon||'🎯'}</div>
        <div style="flex:1"><div style="font-size:14px;font-weight:500;${g.done?'text-decoration:line-through;color:var(--color-text-muted)':''}">${g.name}</div><div style="font-size:12px;color:var(--color-text-muted)">${g.date||''}</div></div>
        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;background:${g.done?'rgba(52,199,89,0.1)':'rgba(0,113,227,0.08)'};color:${g.done?'var(--color-green)':'#0071e3'}">${g.done?'Tamamlandı':'Devam'}</span>
      </div>`).join('')+'</div>';
  } else if(crTab==='milestones'){
    if(!crData.milestones.length){el.innerHTML='<div class="empty" style="padding:32px">Henüz milestone yok</div>';return;}
    el.innerHTML='<div style="padding:16px">'+crData.milestones.map(m=>`
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--color-divider)">
        <div style="flex:1"><div style="font-size:14px;font-weight:500">${m.title}</div><div style="font-size:12px;color:var(--color-text-muted)">${m.date||''}</div></div>
        <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px;background:rgba(52,199,89,0.1);color:#34c759">${m.status||'—'}</span>
      </div>`).join('')+'</div>';
  } else if(crTab==='client-teklif'){
    const statusBadge = s => {
      const map = {'Aktif':'background:rgba(76,175,129,0.15);color:#4caf81','Pasif':'background:rgba(107,105,99,0.2);color:#9b9a97','Taslak':'background:rgba(224,165,83,0.12);color:var(--color-amber)'};
      return `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;white-space:nowrap;${map[s]||map['Taslak']}">${s||'Taslak'}</span>`;
    };
    el.innerHTML=`<div style="padding:16px">
      ${!crData.clientTeklif.length ? '<div class="empty" style="padding:32px">Bu müşteriye ait teklif bulunamadı</div>' :
        crData.clientTeklif.slice().reverse().map(t=>`
        <div style="padding:16px 0;border-bottom:1px solid var(--color-divider)">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600">${escHtml(t.name||'')}</div>
            ${statusBadge(t.status||'Taslak')}
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:4px">
            ${t.price ? `<span style="font-size:14px;font-weight:600;color:var(--color-green)">₺${Number(t.price).toLocaleString('tr-TR')}</span>` : ''}
            ${t.duration_value ? `<span style="font-size:13px;color:var(--color-text-muted)">⏱ ${t.duration_value} ${t.duration_unit||'Ay'}</span>` : ''}
            ${t.category ? `<span style="font-size:12px;color:var(--color-text-muted);background:var(--color-bg-secondary);padding:2px 8px;border-radius:6px">${escHtml(t.category)}</span>` : ''}
          </div>
          ${t.description ? `<div style="font-size:13px;color:var(--color-text-secondary)">${escHtml(t.description)}</div>` : ''}
        </div>`).join('')
      }
    </div>`;
  } else if(crTab==='tasks'){
    // Admin: Ödev atama ve inceleme
    const email=document.getElementById('cr-client-select').value;
    const odevStatusBadge = s => {
      if(s==='atanmis') return `<span class="odev-status odev-status-atanmis"><span class="odev-badge-dot"></span>Atandı</span>`;
      if(s==='inceleniyor') return `<span class="odev-status odev-status-inceleniyor"><span class="odev-badge-dot"></span>İnceleniyor</span>`;
      if(s==='admin_onaylandi') return `<span class="odev-status odev-status-onaylandi"><span class="odev-badge-dot"></span>Onaylandı</span>`;
      if(s==='revize_gerekli') return `<span class="odev-status odev-status-revize"><span class="odev-badge-dot"></span>Revize Gerekli</span>`;
      return `<span class="odev-status odev-status-atanmis"><span class="odev-badge-dot"></span>Atandı</span>`;
    };
    const todayStr = new Date().toISOString().slice(0,10);
    el.innerHTML=`<div style="padding:16px">
      <div style="background:var(--color-bg-secondary);border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid rgba(74,158,255,0.2)">
        <div style="font-size:12px;font-weight:700;color:#4a9eff;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">+ Yeni Ödev Ata</div>
        <input id="cr-task-title" class="form-input" placeholder="Ödev başlığı..." style="margin-bottom:8px;padding:8px 12px;font-size:13px" />
        <textarea id="cr-task-note" class="form-input" placeholder="Açıklama / talimat (opsiyonel)..." style="min-height:60px;margin-bottom:8px;font-size:13px;resize:none"></textarea>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <label style="font-size:12px;color:var(--color-text-muted);white-space:nowrap">Son tarih:</label>
          <input type="date" id="cr-task-due" class="form-input" style="width:auto;padding:6px 10px;font-size:13px" value="${todayStr}" />
        </div>
        <button class="btn btn-primary" style="font-size:13px;padding:8px 20px;border-radius:10px" onclick="addCROdev('${escHtml(email)}')">Ata</button>
      </div>
      ${!crData.tasks.length?'<div class="empty" style="padding:20px">Henüz ödev atanmadı</div>':
        crData.tasks.slice().reverse().map(t=>`
        <div style="padding:16px 0;border-bottom:1px solid var(--color-divider)">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:8px">
            <div style="flex:1">
              <div style="font-size:14px;font-weight:500;margin-bottom:4px">${escHtml(t.title)}</div>
              ${t.description?`<div style="font-size:12px;color:var(--color-text-muted);margin-bottom:4px">📝 ${escHtml(t.description)}</div>`:''}
              ${t.due_date?`<div style="font-size:11px;color:var(--color-text-muted)">📅 Son tarih: ${t.due_date}</div>`:''}
              ${t.admin_note?`<div style="font-size:12px;color:var(--color-amber);margin-top:4px;padding:6px 10px;background:rgba(224,165,83,0.08);border-radius:6px">💬 ${escHtml(t.admin_note)}</div>`:''}
              ${t.user_completed_at?`<div style="font-size:11px;color:var(--color-text-muted);margin-top:4px">✅ Kullanıcı teslim etti</div>`:''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
              ${odevStatusBadge(t.status||'atanmis')}
              <button onclick="deleteCROdev(${t.id},'${escHtml(email)}')" style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:16px;padding:0;line-height:1" title="Sil">🗑</button>
            </div>
          </div>
          ${t.status==='inceleniyor'?`
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:8px">
            <span style="font-size:12px;color:var(--color-text-muted);font-weight:500">İncele:</span>
            <button class="odev-approve-btn" onclick="adminReviewOdev(${t.id},'onay','${escHtml(email)}')">✓ Onayla</button>
            <button class="odev-revize-btn" onclick="adminReviewOdev(${t.id},'revize','${escHtml(email)}')">↩ Revize İste</button>
          </div>` : ''}
        </div>`).join('')
      }
    </div>`;
  } else {
    el.innerHTML='';
  }
}

async function addCROdev(email){
  const title=document.getElementById('cr-task-title').value.trim();
  if(!title){toast('Ödev başlığı gir');return;}
  const description=document.getElementById('cr-task-note').value.trim();
  const due_date=document.getElementById('cr-task-due').value||null;
  const {data,error}=await sb.from('homework_assignments').insert({user_id:email,title,description,due_date,status:'atanmis'}).select().single();
  if(error){toast('❌ Hata: '+error.message);return;}
  crData.tasks.push(data);
  document.getElementById('cr-task-title').value='';
  document.getElementById('cr-task-note').value='';
  renderCRTab();
  toast('✅ Ödev atandı!');
}

async function deleteCROdev(id,email){
  if(!confirm('Bu ödevi silmek istiyor musun?'))return;
  crData.tasks=crData.tasks.filter(x=>x.id!==id);
  await sb.from('homework_assignments').delete().eq('id',id);
  renderCRTab();
  toast('Ödev silindi');
}

async function adminReviewOdev(id, action, email){
  const newStatus = action==='onay' ? 'admin_onaylandi' : 'revize_gerekli';
  let adminNote = '';
  if(action==='revize'){
    adminNote = prompt('Revize notu (opsiyonel):') || '';
  }
  const payload = {status: newStatus, admin_reviewed_at: new Date().toISOString()};
  if(adminNote) payload.admin_note = adminNote;
  const {error} = await sb.from('homework_assignments').update(payload).eq('id',id);
  if(error){toast('❌ '+error.message);return;}
  const idx = crData.tasks.findIndex(x=>x.id===id);
  if(idx>=0) crData.tasks[idx] = {...crData.tasks[idx], ...payload};
  renderCRTab();
  toast(action==='onay' ? '✅ Ödev onaylandı!' : '↩ Revize istendi');
}

// ===== ÖDEVLER (Kullanıcı Sayfası) =====
let odevler = [];

async function loadOdevler(){
  if(!currentUser||currentUser.role==='admin') return;
  const email = currentUser.email;
  const {data, error} = await sb.from('homework_assignments').select('*').eq('user_id', email).order('created_at');
  odevler = data || [];
  renderOdevler();
}

function odevStatusBadgeUser(s){
  if(s==='atanmis') return `<span class="odev-status odev-status-atanmis"><span class="odev-badge-dot"></span>Atandı</span>`;
  if(s==='inceleniyor') return `<span class="odev-status odev-status-inceleniyor"><span class="odev-badge-dot"></span>İnceleniyor</span>`;
  if(s==='admin_onaylandi') return `<span class="odev-status odev-status-onaylandi"><span class="odev-badge-dot"></span>Tamamlandı ✓</span>`;
  if(s==='revize_gerekli') return `<span class="odev-status odev-status-revize"><span class="odev-badge-dot"></span>Revize Gerekli</span>`;
  return `<span class="odev-status odev-status-atanmis"><span class="odev-badge-dot"></span>Atandı</span>`;
}

function renderOdevler(){
  const list = document.getElementById('odev-list');
  const empty = document.getElementById('odev-empty');
  if(!list) return;
  if(!odevler.length){
    list.innerHTML=''; empty.style.display='block'; list.style.display='none'; return;
  }
  empty.style.display='none'; list.style.display='flex';
  list.innerHTML = odevler.slice().reverse().map(o => {
    const canComplete = o.status==='atanmis' || o.status==='revize_gerekli';
    const doneAlready = o.status==='inceleniyor'||o.status==='admin_onaylandi';
    return `<div class="odev-card">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
          <div style="font-size:15px;font-weight:600">${escHtml(o.title)}</div>
          ${odevStatusBadgeUser(o.status||'atanmis')}
        </div>
        ${o.description?`<div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:6px">${escHtml(o.description)}</div>`:''}
        ${o.due_date?`<div style="font-size:12px;color:var(--color-text-muted)">📅 Son tarih: ${o.due_date}</div>`:''}
        ${o.admin_note?`<div style="margin-top:8px;padding:8px 12px;background:rgba(224,165,83,0.08);border:1px solid rgba(224,165,83,0.2);border-radius:8px;font-size:13px;color:var(--color-amber)">💬 Koç notu: ${escHtml(o.admin_note)}</div>`:''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px;flex-shrink:0">
        ${doneAlready ? `<div class="odev-done-check">✓</div>` :
          canComplete ? `<button class="odev-complete-btn" onclick="userCompleteOdev(${o.id})">Tamamladım</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function userCompleteOdev(id){
  const {error} = await sb.from('homework_assignments').update({
    status: 'inceleniyor',
    user_completed_at: new Date().toISOString()
  }).eq('id', id);
  if(error){toast('❌ '+error.message);return;}
  const idx = odevler.findIndex(x=>x.id===id);
  if(idx>=0) odevler[idx] = {...odevler[idx], status:'inceleniyor', user_completed_at: new Date().toISOString()};
  renderOdevler();
  toast('✅ Ödev koça gönderildi! İnceleniyor.');
}

// ===== MÜŞTERİ TEKLİFLERİ (admin yönetir) =====
async function addClientTeklif(email){
  const title = document.getElementById('ct-title').value.trim();
  if(!title){toast('Teklif adı gir');return;}
  const price = parseFloat(document.getElementById('ct-price').value)||0;
  const duration = document.getElementById('ct-duration').value.trim();
  const description = document.getElementById('ct-desc').value.trim();
  const status = document.getElementById('ct-status').value;
  const {data,error} = await sb.from('client_teklif').insert({user_id:email,title,price,duration,description,status}).select().single();
  if(error){toast('❌ '+error.message);return;}
  crData.clientTeklif.push(data);
  document.getElementById('ct-title').value='';
  document.getElementById('ct-price').value='';
  document.getElementById('ct-duration').value='';
  document.getElementById('ct-desc').value='';
  renderCRTab();
  toast('✅ Teklif eklendi!');
}

async function deleteClientTeklif(id,email){
  if(!confirm('Bu teklifi silmek istiyor musun?'))return;
  crData.clientTeklif=crData.clientTeklif.filter(x=>x.id!==id);
  await sb.from('client_teklif').delete().eq('id',id);
  renderCRTab();
  toast('Teklif silindi');
}

function renderUsers(){
  const el = document.getElementById('users-list'); if(!el) return;
  if(!users.length){
    el.innerHTML = '<div class="empty"><div style="font-size:36px;margin-bottom:10px">🔑</div><div>Henüz kullanıcı yok. + Kullanıcı Ekle ile başla.</div></div>';
    return;
  }
  el.innerHTML = users.map(u => `
    <div class="c-item" style="padding:12px 0">
      <div class="avatar av-orange" style="width:40px;height:40px;font-size:14px">${u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
      <div style="flex:1">
        <div class="c-name">${u.name}</div>
        <div class="c-meta">${u.email}</div>
      </div>
      <button class="btn btn-danger" style="padding:5px 12px;font-size:12px;border-radius:8px" onclick="deleteUser(${u.id})">Sil</button>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  initCal();
  initIvCal();
  renderUsers();
  loadFromSupabase().then(()=>{
    setTimeout(()=>buildChart(data6ay),200);
  });
  loadKanban();
});

/* ============ KANBAN — SUPABASE ============ */
let kanbanCards = [];
let draggedCardId = null;
let ivViewMode = 'board';
let ivCalYear, ivCalMonth;
let kdCalYear, kdCalMonth, kdSelectedDate = null;

const colColors = {
  fikir:     { bg:'var(--color-purple-light)', color:'var(--color-purple)' },
  metin:     { bg:'var(--color-amber-light)',  color:'var(--color-amber)'  },
  duzenleme: { bg:'var(--color-blue-light)',   color:'var(--color-blue)'   },
  paylasim:  { bg:'var(--color-green-light)',  color:'var(--color-green-text)' }
};
const monthNames = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDateTR(ds){
  if(!ds) return '';
  const [y,m,d] = ds.split('-');
  return `${d} ${monthNames[parseInt(m)-1]} ${y}`;
}

/* ---- SUPABASE CRUD ---- */
async function loadKanban(){
  const { data, error } = await sb.from('kanban_cards').select('*').eq('user_id', currentUser?.email||'').order('created_at');
  if(error){  return; }
  kanbanCards = (data||[]).map(x => ({
    id: x.id, title: x.title, format: x.format||'📝 Diğer',
    col: x.col||'fikir', date: x.date||'', note: x.note||'', link: x.link||''
  }));
  renderKanban();
}

async function insertKanban(card){
  const { data, error } = await sb.from('kanban_cards')
    .insert({ title:card.title, format:card.format, col:card.col, date:card.date||null, note:card.note, user_id:currentUser?.email||null })
    .select().single();
  if(error){ toast('❌ Hata: '+error.message); return null; }
  return data.id;
}

async function updateKanban(id, fields){
  const { error } = await sb.from('kanban_cards').update(fields).eq('id', id);
  if(error) toast('Kayıt hatası: '+error.message);
}

async function deleteKanbanSB(id){
  const { error } = await sb.from('kanban_cards').delete().eq('id', id);
  if(error) toast('Silme hatası: '+error.message);
}

/* ---- BOARD RENDER ---- */
function renderKanban(){
  ['fikir','metin','duzenleme','paylasim'].forEach(col => {
    const el = document.getElementById('col-'+col); if(!el) return;
    const cards = kanbanCards.filter(c => c.col === col);
    const countEl = document.getElementById('count-'+col);
    if(countEl) countEl.textContent = cards.length;
    if(!cards.length){
      el.innerHTML = `<div style="text-align:center;padding:24px 12px;color:var(--color-text-muted);font-size:12px;border:1.5px dashed var(--color-border);border-radius:var(--radius-md)">Kart yok</div>`;
      return;
    }
    const clr = colColors[col];
    el.innerHTML = cards.map(c => `
      <div class="kanban-card" draggable="true"
          onclick="openKartDetay(${c.id})"
          ondragstart="onDragStart(event,${c.id})"
          ondragend="onDragEnd(event)">
        <div class="kanban-card-title">${c.title}</div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span class="kanban-card-tag" style="background:${clr.bg};color:${clr.color}">${c.format}</span>
          ${c.date ? `<span style="font-size:10px;color:var(--color-text-muted)">📅 ${formatDateTR(c.date)}</span>` : ''}
        </div>
        ${c.note ? `<div style="margin-top:6px;font-size:11px;color:var(--color-text-muted);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${c.note}</div>` : ''}
      </div>`).join('');
  });
  if(ivViewMode === 'cal') renderIvCal();
}

/* ---- VIEW MODE ---- */
function setIcerikViewMode(mode, el){
  ivViewMode = mode;
  document.querySelectorAll('#iv-tab-board, #iv-tab-cal').forEach(t => t.classList.remove('active'));
  if(el) el.classList.add('active');
  document.getElementById('iv-board').style.display = mode === 'board' ? 'flex' : 'none';
  document.getElementById('iv-cal').style.display   = mode === 'cal'   ? 'block' : 'none';
  if(mode === 'cal') renderIvCal();
}

/* ---- CALENDAR VIEW ---- */
function initIvCal(){
  const n = new Date();
  ivCalYear = n.getFullYear();
  ivCalMonth = n.getMonth();
}
function ivCalNav(dir){
  ivCalMonth += dir;
  if(ivCalMonth > 11){ ivCalMonth = 0; ivCalYear++; }
  if(ivCalMonth < 0){  ivCalMonth = 11; ivCalYear--; }
  renderIvCal();
}
function renderIvCal(){
  const titleEl = document.getElementById('iv-cal-title');
  const gridEl  = document.getElementById('iv-cal-grid');
  if(!titleEl || !gridEl) return;
  titleEl.textContent = monthNames[ivCalMonth] + ' ' + ivCalYear;
  const firstDow = new Date(ivCalYear, ivCalMonth, 1).getDay();
  const offset   = firstDow === 0 ? 6 : firstDow - 1;
  const days     = new Date(ivCalYear, ivCalMonth + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];
  let html = '';
  for(let i = 0; i < offset; i++)
    html += `<div style="min-height:110px;padding:8px;border-right:1px solid var(--color-divider);border-bottom:1px solid var(--color-divider);background:var(--color-bg-secondary)"></div>`;
  for(let d = 1; d <= days; d++){
    const ds = `${ivCalYear}-${String(ivCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = ds === todayStr;
    const items = kanbanCards.filter(c => c.date === ds);
    const col = (offset + d - 1) % 7;
    const borderR = col < 6 ? '1px solid var(--color-divider)' : 'none';
    const badges = items.slice(0,3).map(c => {
      const clr = colColors[c.col] || colColors.fikir;
      return `<div onclick="openKartDetay(${c.id})" style="cursor:pointer;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:500;background:${clr.bg};color:${clr.color};margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${c.title}">${c.title}</div>`;
    }).join('');
    const more = items.length > 3 ? `<div style="font-size:10px;color:var(--color-text-muted)">+${items.length-3} daha</div>` : '';
    const numStyle = isToday
      ? 'width:22px;height:22px;border-radius:50%;background:var(--color-accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700'
      : 'font-size:12px;color:var(--color-text-secondary)';
    html += `<div style="min-height:110px;padding:8px;border-right:${borderR};border-bottom:1px solid var(--color-divider);${isToday?'background:rgba(35,131,226,0.03)':''}">
      <div style="margin-bottom:4px"><span style="${numStyle}">${d}</span></div>
      ${badges}${more}
    </div>`;
  }
  const total = offset + days;
  const rem = total % 7;
  if(rem !== 0) for(let i = 0; i < 7 - rem; i++)
    html += `<div style="min-height:110px;padding:8px;border-right:${i<6-rem?'1px solid var(--color-divider)':'none'};border-bottom:1px solid var(--color-divider);background:var(--color-bg-secondary)"></div>`;
  gridEl.innerHTML = html;
}

/* ---- KART DETAY ---- */
function openKartDetay(id){
  const c = kanbanCards.find(x => x.id === id); if(!c) return;
  window._kdId = id;
  kdSelectedDate = c.date || null;
  document.getElementById('kd-title').textContent = c.title;
  document.getElementById('kd-date-display').textContent = c.date ? formatDateTR(c.date) : 'Tarih seç';
  document.getElementById('kd-date-display').style.color = c.date ? '#e8e8e8' : '#555';
  document.getElementById('kd-format').value = c.format;
  document.getElementById('kd-col').value    = c.col;
  document.getElementById('kd-note').value   = c.note || '';
  document.getElementById('kd-link').value   = c.link || '';
  document.getElementById('kd-overlay').style.display = 'flex';
  closeKdCal();
  if(c.date){ const p=c.date.split('-'); kdCalYear=+p[0]; kdCalMonth=+p[1]-1; }
  else { const n=new Date(); kdCalYear=n.getFullYear(); kdCalMonth=n.getMonth(); }
}
function closeKartDetay(){
  document.getElementById('kd-overlay').style.display = 'none';
  closeKdCal();
}
async function saveKartField(field, value){
  const c = kanbanCards.find(x => x.id === window._kdId); if(!c) return;
  c[field] = value;
  await updateKanban(c.id, { [field]: value || null });
  renderKanban();
}

/* ---- DATE PICKER ---- */
function toggleKdCal(e){
  e.stopPropagation();
  const pop = document.getElementById('kd-cal-popup');
  if(pop.style.display === 'none'){ renderKdCal(); pop.style.display = 'block'; }
  else pop.style.display = 'none';
}
function closeKdCal(){ document.getElementById('kd-cal-popup').style.display = 'none'; }
function kdCalNav(dir){
  kdCalMonth += dir;
  if(kdCalMonth > 11){ kdCalMonth=0; kdCalYear++; }
  if(kdCalMonth < 0){  kdCalMonth=11; kdCalYear--; }
  renderKdCal();
}
function renderKdCal(){
  document.getElementById('kd-cal-month').textContent = monthNames[kdCalMonth] + ' ' + kdCalYear;
  const firstDow = new Date(kdCalYear, kdCalMonth, 1).getDay();
  const offset   = firstDow === 0 ? 6 : firstDow - 1;
  const days     = new Date(kdCalYear, kdCalMonth+1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];
  let html = '';
  for(let i=0;i<offset;i++) html += `<div></div>`;
  for(let d=1;d<=days;d++){
    const ds = `${kdCalYear}-${String(kdCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = ds === todayStr;
    const isSel   = ds === kdSelectedDate;
    let bg='transparent', color='#37352f', fw='400';
    if(isSel){    bg='#37352f'; color='#fff'; fw='600'; }
    else if(isToday){ bg='rgba(35,131,226,0.1)'; color='#2383e2'; fw='600'; }
    html += `<div onclick="kdSelectDate('${ds}')" style="text-align:center;padding:5px 2px;border-radius:6px;font-size:12px;font-weight:${fw};background:${bg};color:${color};cursor:pointer;transition:all 0.1s"
      onmouseover="if('${ds}'!=='${kdSelectedDate||''}')this.style.background='#f7f6f3'"
      onmouseout="if('${ds}'!=='${kdSelectedDate||''}')this.style.background='${isSel?'#37352f':'transparent'}'">${d}</div>`;
  }
  document.getElementById('kd-cal-days').innerHTML = html;
}
function kdSelectDate(ds){
  kdSelectedDate = ds;
  document.getElementById('kd-date-display').textContent = formatDateTR(ds);
  document.getElementById('kd-date-display').style.color = '#37352f';
  saveKartField('date', ds);
  renderKdCal();
  closeKdCal();
}
function kdSelectToday(){ kdSelectDate(new Date().toISOString().split('T')[0]); }
function kdClearDate(){
  kdSelectedDate = null;
  document.getElementById('kd-date-display').textContent = 'Tarih seç';
  document.getElementById('kd-date-display').style.color = '#9b9a97';
  saveKartField('date', '');
  closeKdCal();
}
document.addEventListener('click', e => {
  const pop = document.getElementById('kd-cal-popup');
  if(pop && !pop.contains(e.target) && e.target.id !== 'kd-date-display') closeKdCal();
});

/* ---- MODAL / ADD ---- */
function openIcerikModal(col){
  document.getElementById('ik-title').value = '';
  document.getElementById('ik-note').value  = '';
  document.getElementById('ik-date').value  = '';
  if(col) document.getElementById('ik-col').value = col;
  openModal('modal-icerik-kart');
  setTimeout(()=>document.getElementById('ik-title').focus(), 100);
}
async function addKanbanCard(){
  const title = document.getElementById('ik-title').value.trim();
  if(!title){ toast('Başlık gir'); return; }
  const card = {
    title,
    format: document.getElementById('ik-format').value,
    col:    document.getElementById('ik-col').value,
    date:   document.getElementById('ik-date').value,
    note:   document.getElementById('ik-note').value.trim()
  };
  const newId = await insertKanban(card);
  if(!newId) return;
  kanbanCards.push({ ...card, id: newId });
  renderKanban();
  closeModal('modal-icerik-kart');
  toast('✅ Kart eklendi!');
}
async function deleteKanbanCard(id){
  if(!confirm('Bu kartı silmek istiyor musun?')) return;
  await deleteKanbanSB(id);
  kanbanCards = kanbanCards.filter(c => c.id !== id);
  renderKanban();
  closeKartDetay();
  toast('Kart silindi');
}

/* ---- DRAG & DROP ---- */
function onDragStart(e,id){
  draggedCardId=id;
  setTimeout(()=>e.currentTarget.classList.add('dragging'),0);
  e.dataTransfer.effectAllowed='move';
}
function onDragEnd(e){
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.kanban-col').forEach(c=>c.classList.remove('drag-over'));
}
function onDragOver(e){
  e.preventDefault(); e.dataTransfer.dropEffect='move';
  const col=e.currentTarget.closest('.kanban-col');
  document.querySelectorAll('.kanban-col').forEach(c=>c.classList.remove('drag-over'));
  if(col) col.classList.add('drag-over');
}
async function onDrop(e,col){
  e.preventDefault();
  document.querySelectorAll('.kanban-col').forEach(c=>c.classList.remove('drag-over'));
  if(draggedCardId==null) return;
  const card=kanbanCards.find(c=>c.id===draggedCardId);
  if(card && card.col!==col){
    card.col=col;
    await updateKanban(card.id, { col });
    renderKanban();
    toast('Kart taşındı ✓');
  }
  draggedCardId=null;
}



function fmtNum(n) {
  if(!n) return '0';
  if(n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if(n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}
/* ============================================================
   RAKİP TAKİBİ
   ============================================================ */
let competitors = [];
let ctSortField = 'name';
let ctSortDir = -1;
let ctView = 'cards';

/* ---- Supabase CRUD ---- */
async function loadCompetitorsSB() {
  try {
    const { data, error } = await sb.from('competitors').select('*').eq('user_id', currentUser?.email||'').order('created_at');
    if(error) throw error;
    competitors = (data||[]).map(r => ({
      id: r.id,
      name: r.name,
      platform: r.platform || 'instagram',
      category: r.category || '',
      note: r.note || '',
      profileLink: r.profile_link || '',
      addedAt: r.created_at
    }));
  } catch(e) {
    // Fallback to demo data on first load
    if(!competitors.length) competitors = [
      { id:'demo1', name:'@toktasclips', platform:'instagram', category:'', followers:0, engagement:0, postsPerWeek:0, note:'', profileLink:'https://instagram.com/toktasclips' },
    ];
  }
  renderCompetitors();
}

async function insertCompetitorSB(comp) {
  try {
    const { data, error } = await sb.from('competitors').insert({
      name: comp.name,
      platform: comp.platform,
      category: comp.category,
      note: comp.note,
      profile_link: comp.profileLink,
      user_id: currentUser?.email||null
    }).select().single();
    if(error) throw error;
    return data.id;
  } catch(e) {
    return Date.now();
  }
}

async function updateCompetitorSB(id, comp) {
  try {
    await sb.from('competitors').update({
      name: comp.name,
      platform: comp.platform,
      category: comp.category,
      note: comp.note,
      profile_link: comp.profileLink
    }).eq('id', id);
  } catch(e) {  }
}

async function deleteCompetitorSB(id) {
  try {
    await sb.from('competitors').delete().eq('id', id);
  } catch(e) {  }
}

function setCTView(view, el) {
  ctView = view;
  document.querySelectorAll('#page-competitors .tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  document.getElementById('ct-cards-view').style.display = view === 'cards' ? 'block' : 'none';
  document.getElementById('ct-table-view').style.display = view === 'table' ? 'block' : 'none';
  renderCompetitors();
}

function ctSortBy(field) {
  if(ctSortField === field) ctSortDir *= -1;
  else { ctSortField = field; ctSortDir = -1; }
  renderCompetitors();
}

const platformIcons = { instagram:'📷', youtube:'▶️', tiktok:'🎵', linkedin:'💼', twitter:'𝕏' };
const platformColors = { instagram:'#e1306c', youtube:'#ff0000', tiktok:'#69c9d0', linkedin:'#0077b5', twitter:'#1da1f2' };

function renderCompetitors() {
  const search = (document.getElementById('ct-search')?.value || '').toLowerCase();
  const sortBy = document.getElementById('ct-sort')?.value || 'name';

  let list = competitors.filter(c =>
    c.name.toLowerCase().includes(search) ||
    (c.category||'').toLowerCase().includes(search)
  );
  list.sort((a,b) => {
    return a.name.localeCompare(b.name);
  });


  // Cards
  const cardsEl = document.getElementById('ct-cards-view');
  cardsEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">
    ${list.map(c => {
      const icon = platformIcons[c.platform] || '🌐';
      const clr = platformColors[c.platform] || '#888';
      return `
        <div class="card" style="margin-bottom:0;transition:box-shadow 0.15s" onmouseover="this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.boxShadow='none'">
          <div style="padding:16px 20px">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <span style="font-size:15px;font-weight:600;color:var(--color-text-primary)">${c.name}</span>
                  <span style="font-size:14px">${icon}</span>
                </div>
                <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">${c.category || '—'}</div>
              </div>
              <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
                <button onclick="openEditCompetitor('${c.id}')" style="background:none;border:1px solid var(--color-border);color:var(--color-text-muted);cursor:pointer;font-size:11px;padding:3px 8px;border-radius:6px;font-family:inherit;transition:all 0.1s" onmouseover="this.style.background='var(--color-surface-hover)';this.style.color='var(--color-text-primary)'" onmouseout="this.style.background='none';this.style.color='var(--color-text-muted)'">Düzenle</button>
              </div>
            </div>
            ${c.profileLink ? `<a href="${c.profileLink}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;padding:9px 14px;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:8px;font-size:13px;font-weight:500;color:var(--color-text-secondary);text-decoration:none;transition:all 0.15s" onmouseover="this.style.background='var(--color-surface-hover)';this.style.color='var(--color-text-primary)';this.style.borderColor='var(--color-border-strong)'" onmouseout="this.style.background='var(--color-bg-tertiary)';this.style.color='var(--color-text-secondary)';this.style.borderColor='var(--color-border)'">
              <span style="font-size:16px">${platformIcons[c.platform]||'🌐'}</span> Instagram'da Aç ↗
            </a>` : ''}
            ${c.note ? `<div style="margin-top:10px;font-size:12px;color:var(--color-text-muted);background:var(--color-bg-tertiary);border-radius:6px;padding:8px 10px">${c.note}</div>` : ''}
          </div>
        </div>`;
    }).join('')}
    ${list.length === 0 ? '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--color-text-muted)">Rakip bulunamadı. "+ Rakip Ekle" ile başla.</div>' : ''}
  </div>`;

  // Table
  const tbody = document.getElementById('ct-tbody');
  tbody.innerHTML = list.map(c => {
    const icon = platformIcons[c.platform] || '🌐';
    return `<tr style="border-bottom:1px solid var(--color-divider);transition:background 0.1s" onmouseover="this.style.background='var(--color-surface-hover)'" onmouseout="this.style.background='transparent'">
      <td style="padding:12px 16px">
        ${c.profileLink ? `<a href="${c.profileLink}" target="_blank" style="font-size:14px;font-weight:500;color:var(--color-text-primary);text-decoration:none" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${c.name} ↗</a>` : `<div style="font-size:14px;font-weight:500;color:var(--color-text-primary)">${c.name}</div>`}
        <div style="font-size:11px;color:var(--color-text-muted)">${c.category||'—'}</div>
      </td>
      <td style="padding:12px 16px"><span style="font-size:16px">${icon}</span> <span style="font-size:12px;color:var(--color-text-muted)">${c.platform}</span></td>
      <td style="padding:12px 16px;text-align:right;display:flex;gap:6px;justify-content:flex-end">
        <button onclick="openEditCompetitor('${c.id}')" style="background:none;border:1px solid var(--color-border);color:var(--color-text-muted);cursor:pointer;font-size:12px;border-radius:6px;padding:4px 10px;font-family:inherit;transition:all 0.1s" onmouseover="this.style.background='var(--color-surface-hover)';this.style.color='var(--color-text-primary)'" onmouseout="this.style.background='none';this.style.color='var(--color-text-muted)'">Düzenle</button>
      </td>
    </tr>`;
  }).join('');
}

function openAddCompetitor() { openModal('modal-add-competitor'); setTimeout(()=>document.getElementById('ct-add-name').focus(),100); }

async function addCompetitor() {
  const name = document.getElementById('ct-add-name').value.trim();
  if(!name) { toast('Hesap adı gir'); return; }
  const comp = {
    name,
    platform: document.getElementById('ct-add-platform').value,
    category: document.getElementById('ct-add-category').value.trim(),
    note: document.getElementById('ct-add-note').value.trim(),
    profileLink: document.getElementById('ct-add-link').value.trim()
  };
  const newId = await insertCompetitorSB(comp);
  comp.id = newId;
  competitors.push(comp);
  renderCompetitors();
  closeModal('modal-add-competitor');
  ['ct-add-name','ct-add-category','ct-add-note','ct-add-link'].forEach(id => document.getElementById(id).value = '');
  toast('✅ Rakip eklendi!');
}

function openEditCompetitor(id) {
  const c = competitors.find(x => String(x.id) === String(id)); if(!c) return;
  document.getElementById('ct-edit-id').value = id;
  document.getElementById('ct-edit-name').value = c.name;
  document.getElementById('ct-edit-platform').value = c.platform;
  document.getElementById('ct-edit-category').value = c.category || '';
  document.getElementById('ct-edit-link').value = c.profileLink || '';
  document.getElementById('ct-edit-note').value = c.note || '';
  openModal('modal-edit-competitor');
  setTimeout(()=>document.getElementById('ct-edit-name').focus(),100);
}

async function saveCompetitorEdit() {
  const id = document.getElementById('ct-edit-id').value;
  const name = document.getElementById('ct-edit-name').value.trim();
  if(!name) { toast('Hesap adı gir'); return; }
  const updated = {
    name,
    platform: document.getElementById('ct-edit-platform').value,
    category: document.getElementById('ct-edit-category').value.trim(),
    note: document.getElementById('ct-edit-note').value.trim(),
    profileLink: document.getElementById('ct-edit-link').value.trim()
  };
  await updateCompetitorSB(id, updated);
  const idx = competitors.findIndex(x => String(x.id) === String(id));
  if(idx >= 0) competitors[idx] = { ...competitors[idx], ...updated };
  renderCompetitors();
  closeModal('modal-edit-competitor');
  toast('✅ Kaydedildi!');
}

async function deleteCompetitor(id) {
  if(!confirm('Bu rakibi silmek istiyor musun?')) return;
  await deleteCompetitorSB(id);
  competitors = competitors.filter(c => String(c.id) !== String(id));
  renderCompetitors();
  toast('Rakip silindi');
}

async function deleteCompetitorFromEdit() {
  const id = document.getElementById('ct-edit-id').value;
  if(!confirm('Bu rakibi silmek istiyor musun?')) return;
  await deleteCompetitorSB(id);
  competitors = competitors.filter(c => String(c.id) !== String(id));
  renderCompetitors();
  closeModal('modal-edit-competitor');
  toast('Rakip silindi');
}



/* ============================================================
   MÜŞTERİLER & MRR
   ============================================================ */
let musteriler = [];
let mrrChartInstance = null;
let mrrPeriod = 3;
let currentMusteriId = null;

/* ---- Helpers ---- */
function monthsBetween(start, end) {
  if(!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
}
function fmtTL(n) {
  if(!n && n !== 0) return '—';
  return '₺' + Number(n).toLocaleString('tr-TR');
}
function fmtDateTR(d) {
  if(!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric' });
}
function isActiveNow(m) {
  if(m.status !== 'Aktif') return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const s = m.start_date ? new Date(m.start_date + 'T00:00:00') : null;
  const e = m.end_date   ? new Date(m.end_date   + 'T00:00:00') : null;
  if(!s || !e) return false;
  return today >= s && today <= e;
}
function totalRevenue(m) {
  return monthsBetween(m.start_date, m.end_date) * (m.monthly_payment || 0);
}

/* ---- Supabase ---- */
async function loadMusteriler() {
  try {
    const userId = currentUser?.email || '';
    let q = sb.from('customers').select('*').order('created_at');
    if(currentUser?.role !== 'admin') q = q.eq('user_id', userId);
    else q = q.or(`user_id.eq.${userId},user_id.is.null`);
    const { data, error } = await q;
    if(error) throw error;
    musteriler = (data||[]).map(r => ({
      id: r.id,
      name: r.name || '',
      email: r.email || '',
      program: r.program || '',
      monthly_payment: r.monthly_payment || 0,
      start_date: r.start_date || '',
      end_date: r.end_date || '',
      status: r.status || 'Aktif',
      notes: r.notes || ''
    }));
  } catch(e) {
    musteriler = musteriler.length ? musteriler : [];
  }
  renderMusteriKPI();
  renderMusterierChart();
  renderMusteriTable();
}

async function insertMusteriSB(m) {
  try {
    const { data, error } = await sb.from('customers').insert({
      user_id: currentUser?.email || null,
      name: m.name, email: m.email, program: m.program,
      monthly_payment: m.monthly_payment,
      start_date: m.start_date || null,
      end_date: m.end_date || null,
      status: m.status, notes: m.notes
    }).select().single();
    if(error) throw error;
    return data.id;
  } catch(e) {  return 'local_' + Date.now(); }
}

async function updateMusteriSB(id, m) {
  try {
    let q = sb.from('customers').update({
      name: m.name, email: m.email, program: m.program,
      monthly_payment: m.monthly_payment,
      start_date: m.start_date || null,
      end_date: m.end_date || null,
      status: m.status, notes: m.notes
    }).eq('id', id);
    if(currentUser?.role !== 'admin') q = q.eq('user_id', currentUser?.email || '');
    await q;
  } catch(e) {  }
}

async function deleteMusteriSB(id) {
  try {
    let q = sb.from('customers').delete().eq('id', id);
    if(currentUser?.role !== 'admin') q = q.eq('user_id', currentUser?.email || '');
    await q;
  }
  catch(e) {  }
}

/* ---- KPI ---- */
function renderMusteriKPI() {
  const el = document.getElementById('mrr-kpi');
  if(!el) return;
  const active = musteriler.filter(isActiveNow);
  const mrr = active.reduce((s,m) => s + (m.monthly_payment||0), 0);
  const totalProj = musteriler.reduce((s,m) => s + totalRevenue(m), 0);
  const avgVal = active.length ? mrr / active.length : 0;

  const kpis = [
    { label:'Toplam MRR', value: fmtTL(mrr), sub:'aktif müşterilerden', icon:'📈' },
    { label:'Aktif Müşteri', value: active.length, sub: musteriler.length + ' toplam kayıt', icon:'👤' },
    { label:'Projeksiyon Geliri', value: fmtTL(totalProj), sub:'tüm kontratlar dahil', icon:'🎯' },
    { label:'Ortalama Değer', value: fmtTL(Math.round(avgVal)), sub:'aktif müşteri başına', icon:'⌀' },
  ];
  el.innerHTML = kpis.map(k => `
    <div class="stat-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="stat-label">${k.label}</div>
        <span style="font-size:16px;opacity:0.5">${k.icon}</span>
      </div>
      <div class="stat-value" style="font-size:22px;letter-spacing:-0.5px">${k.value}</div>
      <div class="stat-change" style="margin-top:5px;font-size:11px;color:var(--color-text-muted)">${k.sub}</div>
    </div>
  `).join('');
}

/* ---- Chart ---- */
function setMrrPeriod(months, el) {
  mrrPeriod = months;
  document.querySelectorAll('#page-musteriler .chart-tab').forEach(t => t.classList.remove('active'));
  if(el) el.classList.add('active');
  renderMusterierChart();
}

function renderMusterierChart() {
  const ctx     = document.getElementById('mrr-chart');
  const wrapEl  = document.getElementById('mrr-chart-wrap');
  const emptyEl = document.getElementById('mrr-chart-empty');
  if(!ctx) return;
  if(mrrChartInstance) { mrrChartInstance.destroy(); mrrChartInstance = null; }

  const today = new Date(); today.setDate(1); today.setHours(0,0,0,0);
  const labels = [], mrrData = [];

  for(let i = mrrPeriod - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('tr-TR', { month:'short', year: mrrPeriod > 6 ? '2-digit' : undefined });
    labels.push(label);

    const monthStart = new Date(d); monthStart.setDate(1);
    const monthEnd   = new Date(d); monthEnd.setMonth(monthEnd.getMonth()+1); monthEnd.setDate(0);

    let mrr = 0;
    musteriler.forEach(m => {
      if(!m.start_date || !m.end_date || m.status !== 'Aktif') return;
      const s = new Date(m.start_date + 'T00:00:00');
      const e = new Date(m.end_date   + 'T00:00:00');
      if(s <= monthEnd && e >= monthStart) mrr += (m.monthly_payment||0);
    });
    mrrData.push(mrr);
  }

  // Kaç ay anlamlı veri var?
  const meaningfulPoints = mrrData.filter(v => v > 0).length;

  if(meaningfulPoints < 2) {
    if(wrapEl)  wrapEl.style.display  = 'none';
    if(emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if(wrapEl)  wrapEl.style.display  = 'block';
  if(emptyEl) emptyEl.style.display = 'none';

  // Gradient fill
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 160);
  gradient.addColorStop(0,   'rgba(155,154,151,0.15)');
  gradient.addColorStop(1,   'rgba(155,154,151,0.0)');

  mrrChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: mrrData,
        borderColor: 'rgba(155,154,151,0.7)',
        backgroundColor: gradient,
        borderWidth: 1.5,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(155,154,151,0.8)',
        pointBorderColor: 'transparent',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#e8e8e6',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1f1f1f',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleColor: '#9b9a97',
          bodyColor: '#e8e8e6',
          padding: 10,
          callbacks: {
            title: items => items[0].label,
            label: item => '  ₺' + Number(item.raw).toLocaleString('tr-TR')
          }
        }
      },
      scales: {
        x: {
          ticks: { color:'#6b6963', font:{size:10}, maxRotation:0 },
          grid:  { color:'rgba(255,255,255,0.03)', drawTicks:false },
          border:{ display:false }
        },
        y: {
          ticks: {
            color:'#6b6963', font:{size:10}, maxTicksLimit:4,
            callback: v => v >= 1000 ? '₺' + (v/1000).toFixed(0) + 'K' : '₺' + v
          },
          grid:  { color:'rgba(255,255,255,0.04)' },
          border:{ display:false }
        }
      }
    }
  });
}

/* ---- Table ---- */
function renderMusteriTable() {
  const search  = (document.getElementById('mrr-search')?.value || '').toLowerCase();
  const filter  = document.getElementById('mrr-status-filter')?.value || '';
  const tbody   = document.getElementById('mrr-tbody');
  const emptyEl = document.getElementById('mrr-empty');
  const tableEl = document.getElementById('mrr-table-container');
  if(!tbody) return;

  let list = musteriler.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search) || (m.email||'').toLowerCase().includes(search) || (m.program||'').toLowerCase().includes(search);
    const matchStatus = !filter || m.status === filter;
    return matchSearch && matchStatus;
  });

  if(musteriler.length === 0) {
    emptyEl.style.display = 'block'; tableEl.style.display = 'none'; return;
  }
  emptyEl.style.display = 'none'; tableEl.style.display = 'block';

  const statusStyle = {
    'Aktif':      { bg:'rgba(76,175,129,0.12)', color:'var(--color-green)' },
    'Pasif':      { bg:'rgba(155,154,151,0.12)', color:'var(--color-text-muted)' },
    'Tamamlandı': { bg:'rgba(74,158,255,0.10)', color:'var(--color-blue)' },
  };

  tbody.innerHTML = list.map(m => {
    const dur = monthsBetween(m.start_date, m.end_date);
    const tot = totalRevenue(m);
    const ss  = statusStyle[m.status] || statusStyle['Pasif'];
    const active = isActiveNow(m);
    return `<tr style="border-bottom:1px solid var(--color-divider);cursor:pointer;transition:background 0.1s"
      onmouseover="this.style.background='var(--color-surface-hover)'"
      onmouseout="this.style.background='transparent'"
      onclick="openMusteriPanel('${m.id}')">
      <td style="padding:11px 16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar av-orange" style="width:30px;height:30px;font-size:11px;border-radius:8px;flex-shrink:0">${m.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-size:13px;font-weight:500;color:var(--color-text-primary)">${m.name}</div>
            ${m.email ? `<div style="font-size:11px;color:var(--color-text-muted)">${m.email}</div>` : ''}
          </div>
        </div>
      </td>
      <td style="padding:11px 16px;font-size:13px;color:var(--color-text-secondary)">${m.program || '—'}</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:600;color:var(--color-text-primary)">${fmtTL(m.monthly_payment)}</td>
      <td style="padding:11px 16px;font-size:12px;color:var(--color-text-muted);white-space:nowrap">${fmtDateTR(m.start_date)}</td>
      <td style="padding:11px 16px;font-size:12px;color:var(--color-text-muted);white-space:nowrap">${fmtDateTR(m.end_date)}</td>
      <td style="padding:11px 16px;text-align:center;font-size:13px;color:var(--color-text-secondary)">${dur > 0 ? dur + ' ay' : '—'}</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:600;color:var(--color-text-primary)">${fmtTL(tot)}</td>
      <td style="padding:11px 16px;text-align:center">
        <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:500;background:${ss.bg};color:${ss.color}">${m.status}</span>
        ${active ? '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-green);margin-left:5px;vertical-align:middle"></span>' : ''}
      </td>
      <td style="padding:11px 16px;font-size:12px;color:var(--color-text-muted);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.notes || '—'}</td>
      <td style="padding:11px 16px;text-align:right">
        <button onclick="event.stopPropagation();openMusteriEdit('${m.id}')" style="background:none;border:1px solid var(--color-border);color:var(--color-text-muted);cursor:pointer;font-size:11px;padding:3px 8px;border-radius:5px;font-family:inherit;transition:all 0.1s" onmouseover="this.style.background='var(--color-surface-hover)';this.style.color='var(--color-text-primary)'" onmouseout="this.style.background='none';this.style.color='var(--color-text-muted)'">Düzenle</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="10" style="padding:40px;text-align:center;color:var(--color-text-muted);font-size:13px">Sonuç bulunamadı</td></tr>`;
}

/* ---- Modal ---- */
function openMusteriModal() {
  currentMusteriId = null;
  document.getElementById('musteri-modal-title').textContent = 'Yeni Müşteri';
  document.getElementById('m-save-btn').textContent = 'Kaydet';
  document.getElementById('m-delete-wrap').style.display = 'none';
  ['m-id','m-name','m-email','m-program','m-payment','m-start','m-end','m-notes'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  document.getElementById('m-status').value = 'Aktif';
  document.getElementById('m-preview').style.display = 'none';
  openModal('modal-musteri');
  setTimeout(() => document.getElementById('m-name').focus(), 100);
}

function openMusteriEdit(id) {
  const m = musteriler.find(x => String(x.id) === String(id)); if(!m) return;
  currentMusteriId = id;
  document.getElementById('musteri-modal-title').textContent = 'Müşteriyi Düzenle';
  document.getElementById('m-save-btn').textContent = 'Güncelle';
  document.getElementById('m-delete-wrap').style.display = 'block';
  document.getElementById('m-id').value = id;
  document.getElementById('m-name').value = m.name;
  document.getElementById('m-email').value = m.email;
  document.getElementById('m-program').value = m.program;
  document.getElementById('m-payment').value = m.monthly_payment;
  document.getElementById('m-start').value = m.start_date;
  document.getElementById('m-end').value = m.end_date;
  document.getElementById('m-status').value = m.status;
  document.getElementById('m-notes').value = m.notes;
  updateMusteriPreview();
  openModal('modal-musteri');
}

function editMusteriFromPanel() {
  closePanel('panel-musteri');
  if(currentMusteriId) openMusteriEdit(currentMusteriId);
}

function updateMusteriPreview() {
  const start = document.getElementById('m-start').value;
  const end   = document.getElementById('m-end').value;
  const pay   = parseFloat(document.getElementById('m-payment').value) || 0;
  const prev  = document.getElementById('m-preview');
  if(start && end && pay) {
    const dur = monthsBetween(start, end);
    document.getElementById('m-prev-dur').textContent = dur + ' ay';
    document.getElementById('m-prev-total').textContent = fmtTL(dur * pay);
    prev.style.display = 'block';
  } else {
    prev.style.display = 'none';
  }
}

// live preview on input change
['m-start','m-end','m-payment'].forEach(id => {
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateMusteriPreview);
  });
});
// Also attach after DOM ready via delegation
document.addEventListener('input', e => {
  if(['m-start','m-end','m-payment'].includes(e.target.id)) updateMusteriPreview();
});

async function saveMusteri() {
  const name = document.getElementById('m-name').value.trim();
  if(!name) { toast('İsim gir'); return; }
  const pay = parseFloat(document.getElementById('m-payment').value) || 0;
  if(!pay) { toast('Aylık ödeme gir'); return; }

  const m = {
    name,
    email:   document.getElementById('m-email').value.trim(),
    program: document.getElementById('m-program').value.trim(),
    monthly_payment: pay,
    start_date: document.getElementById('m-start').value,
    end_date:   document.getElementById('m-end').value,
    status:  document.getElementById('m-status').value,
    notes:   document.getElementById('m-notes').value.trim()
  };

  if(currentMusteriId) {
    await updateMusteriSB(currentMusteriId, m);
    const idx = musteriler.findIndex(x => String(x.id) === String(currentMusteriId));
    if(idx >= 0) musteriler[idx] = { ...musteriler[idx], ...m };
    toast('✅ Güncellendi!');
  } else {
    const newId = await insertMusteriSB(m);
    musteriler.push({ ...m, id: newId });
    toast('✅ Müşteri eklendi!');
  }

  closeModal('modal-musteri');
  renderMusteriKPI();
  renderMusterierChart();
  renderMusteriTable();
}

async function deleteMusteriFromModal() {
  const id = document.getElementById('m-id').value;
  if(!id || !confirm('Bu müşteriyi silmek istiyor musun?')) return;
  await deleteMusteriSB(id);
  musteriler = musteriler.filter(x => String(x.id) !== String(id));
  closeModal('modal-musteri');
  renderMusteriKPI();
  renderMusterierChart();
  renderMusteriTable();
  toast('Müşteri silindi');
}

/* ---- Detail Panel ---- */
function openMusteriPanel(id) {
  const m = musteriler.find(x => String(x.id) === String(id)); if(!m) return;
  currentMusteriId = id;
  const initials = m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('mp-avatar').textContent = initials;
  document.getElementById('mp-name').textContent  = m.name;
  document.getElementById('mp-name2').textContent = m.name;
  document.getElementById('mp-email').textContent = m.email || '—';
  document.getElementById('mp-program').textContent = m.program || '—';
  document.getElementById('mp-payment').textContent = fmtTL(m.monthly_payment);
  document.getElementById('mp-start').textContent = fmtDateTR(m.start_date);
  document.getElementById('mp-end').textContent   = fmtDateTR(m.end_date);
  const dur = monthsBetween(m.start_date, m.end_date);
  document.getElementById('mp-dur').textContent   = dur > 0 ? dur + ' ay' : '—';
  document.getElementById('mp-total').textContent = fmtTL(totalRevenue(m));
  const ss = { 'Aktif':{ bg:'rgba(76,175,129,0.12)', c:'var(--color-green)' }, 'Pasif':{ bg:'rgba(155,154,151,0.12)', c:'var(--color-text-muted)' }, 'Tamamlandı':{ bg:'rgba(74,158,255,0.10)', c:'var(--color-blue)' } };
  const s = ss[m.status] || ss['Pasif'];
  document.getElementById('mp-status-badge').innerHTML = `<span style="padding:3px 10px;border-radius:4px;font-size:11px;font-weight:500;background:${s.bg};color:${s.c}">${m.status}</span>`;
  const notesSection = document.getElementById('mp-notes-section');
  if(m.notes) {
    notesSection.style.display = 'block';
    document.getElementById('mp-notes-text').textContent = m.notes;
  } else {
    notesSection.style.display = 'none';
  }
  openPanel('panel-musteri');
}


/* ============================================================
   ONBOARDİNG BEKLEYENLERa
   ============================================================
   onboarding_leads tablosu:
     id          bigserial primary key
     name        text not null
     email       text not null
     note        text
     status      text default 'Bekliyor'  -- 'Bekliyor' | 'Hesap Açıldı' | 'Arşivlendi'
     offer_id    bigint references offers(id)   -- INTEGER, not UUID
     created_at  timestamptz default now()
     approved_at timestamptz
   ============================================================ */
let onboardingRegs = [];
let onbCurrentTab = 'pending';

// DB status → Türkçe görüntü
const ONB_STATUS_LABEL = { pending: 'Bekliyor', approved: 'Hesap Açıldı', archived: 'Arşivlendi' };
const ONB_STATUS_COLOR = { pending: 'var(--color-amber)', approved: 'var(--color-green)', archived: 'var(--color-text-muted)' };
// Tab key → DB status filtresi
const ONB_TAB_STATUS   = { pending: 'pending', approved: 'approved', archived: 'archived', all: null };

async function loadOnboardingPage() {
  if (!sb) return;
  const { data, error } = await sb.from('onboarding_leads').select('*').order('created_at', { ascending: false });
  if (error) { toast('Hata: ' + error.message); return; }
  onboardingRegs = data || [];
  renderOnboardingPage();
}

function setOnbTab(tab) {
  onbCurrentTab = tab;
  ['pending', 'approved', 'archived', 'all'].forEach(t => {
    const btn = document.getElementById('onb-tab-' + t);
    if (!btn) return;
    const isActive = t === tab;
    btn.style.background = isActive ? 'var(--color-text-primary)' : 'transparent';
    btn.style.color = isActive ? '#fff' : 'var(--color-text-primary)';
    btn.style.fontWeight = isActive ? '600' : '500';
  });
  renderOnboardingList();
}

function renderOnboardingPage() {
  const bekliyor = onboardingRegs.filter(r => r.status === 'pending').length;
  const acildi   = onboardingRegs.filter(r => r.status === 'approved').length;
  const arsiv    = onboardingRegs.filter(r => r.status === 'archived').length;
  const elq = id => document.getElementById(id);
  if(elq('onb-stat-bekliyor')) elq('onb-stat-bekliyor').textContent = bekliyor;
  if(elq('onb-stat-acildi'))   elq('onb-stat-acildi').textContent   = acildi;
  if(elq('onb-stat-arsiv'))    elq('onb-stat-arsiv').textContent    = arsiv;
  if(elq('onb-stat-toplam'))   elq('onb-stat-toplam').textContent   = onboardingRegs.length;
  renderOnboardingList();
}

function renderOnboardingList() {
  const container = document.getElementById('onb-list');
  if (!container) return;
  const filterStatus = ONB_TAB_STATUS[onbCurrentTab];
  const filtered = filterStatus === null
    ? onboardingRegs
    : onboardingRegs.filter(r => r.status === filterStatus);

  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;padding:48px;color:var(--color-text-muted);font-size:14px">Kayıt bulunamadı</div>';
    return;
  }

  const aktifTeklifler = teklifler.filter(t => t.status === 'Aktif');
  container.innerHTML = filtered.map(reg => {
    const safeId = reg.id; // UUID string
    const displayName = reg.full_name || reg.name || '—';
    const dateStr = reg.created_at ? new Date(reg.created_at).toLocaleDateString('tr-TR', {day:'numeric',month:'short',year:'numeric'}) : '—';
    const statusLabel = ONB_STATUS_LABEL[reg.status] || reg.status;
    const statusColor = ONB_STATUS_COLOR[reg.status] || 'var(--color-text-muted)';
    const offerSelect = reg.status === 'pending' ? `
      <div style="margin-top:12px">
        <div class="form-label" style="font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px">PROGRAM / TEKLİF SEÇ</div>
        <select id="onb-offer-${safeId}" class="form-input form-select" style="font-size:13px">
          <option value="">— Program seç —</option>
          ${aktifTeklifler.map(t => `<option value="${t.id}">${t.name} — ₺${Number(t.price).toLocaleString('tr-TR')}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="btn approve-btn" style="flex:1;justify-content:center;border-radius:10px;padding:9px;font-size:13px" onclick="createOnboardingPortalAccount('${safeId}')">✓ Portal Hesabı Oluştur</button>
        <button class="btn btn-ghost" style="padding:9px 16px;font-size:13px;border-radius:10px" onclick="archiveOnboardingReg('${safeId}')">Arşivle</button>
      </div>` : '';
    return `
      <div class="card" style="margin-bottom:12px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div style="font-size:15px;font-weight:600;color:var(--color-text-primary)">${displayName}</div>
          <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${statusColor}22;color:${statusColor}">${statusLabel}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
          <div>
            <div class="form-label" style="font-size:10px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.4px">E-POSTA</div>
            <div style="font-size:13px;color:var(--color-text-primary);margin-top:3px">${reg.email || '—'}</div>
          </div>
          <div>
            <div class="form-label" style="font-size:10px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.4px">KAYIT TARİHİ</div>
            <div style="font-size:13px;color:var(--color-text-primary);margin-top:3px">${dateStr}</div>
          </div>
        </div>
        ${onboardingDesiredPassword(reg) ? `<div style="margin-top:8px;font-size:12px;color:var(--color-text-muted)">İstenen şifre: <code style="background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:4px">${escHtml(onboardingDesiredPassword(reg))}</code></div>` : ''}
        ${offerSelect}
      </div>`;
  }).join('');
}

function onboardingDesiredPassword(reg) {
  const raw = reg.desired_password || reg.password || reg.sifre || reg['şifre'] || '';
  return String(raw).trim();
}

async function createOnboardingPortalAccount(regId) {
  const reg = onboardingRegs.find(r => String(r.id) === String(regId));
  if (!reg) return;

  const selectEl = document.getElementById('onb-offer-' + regId);
  const selectedOfferId = selectEl ? selectEl.value : '';
  const offer = selectedOfferId ? teklifler.find(t => String(t.id) === String(selectedOfferId)) : null;
  if (!offer) { toast('Lütfen bir program / teklif seç'); return; }

  const name  = reg.full_name || reg.name || '';
  const email = reg.email || '';
  if (!email) { toast('E-posta bulunamadı'); return; }

  // Tally formundan gelen şifreyi kullan, yoksa otomatik oluştur
  const password = onboardingDesiredPassword(reg) || (email.split('@')[0] + '123!');

  const { data: existingUsers, error: existingUserErr } = await sb
    .from('users')
    .select('*')
    .eq('email', email);
  if (existingUserErr) { toast('Hata: ' + existingUserErr.message); return; }
  const existingUser = existingUsers && existingUsers.length ? existingUsers[0] : null;

  const startStr   = new Date().toISOString().slice(0, 10);
  const monthlyPay = offer.price || 0;
  const durationDays = offerToDays(offer);
  const endDate    = durationDays
    ? new Date(new Date(startStr + 'T00:00:00').getTime() + durationDays * 86400000).toISOString().slice(0, 10)
    : null;

  // 1. users tablosunu manuel ekleme formatına getir
  let userData = existingUser;
  if (existingUser) {
    const { data: updatedUser, error: userErr } = await sb.from('users')
      .update({ name: name || existingUser.name || email, email, password, role: 'client' })
      .eq('id', existingUser.id)
      .select()
      .single();
    if (userErr) { toast('Hata: ' + userErr.message); return; }
    userData = updatedUser;
  } else {
    const { data: insertedUser, error: userErr } = await sb.from('users').insert({
      name, email, password, role: 'client'
    }).select().single();
    if (userErr) { toast('Hata: ' + userErr.message); return; }
    userData = insertedUser;
  }
  if (!users) users = [];
  const localUserIdx = users.findIndex(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  const localUser = { id: userData.id, name: userData.name || name, email, password };
  if (localUserIdx >= 0) users[localUserIdx] = { ...users[localUserIdx], ...localUser };
  else users.push(localUser);

  // 2. clients tablosuna ekle
  const clientRow = {
    name, email, type: offer.category || '', status: 'Aktif',
    phone: reg.phone || '', social: null,
    sessions: 0, remaining_sessions: 0,
    program: offer.name || null,
    start_date: startStr, program_end: endDate,
    health: 8, notes: [],
    user_id: currentUser?.email || null
  };
  const { data: existingClients } = await sb.from('clients').select('id').eq('email', email).limit(1);
  const existingClient = existingClients && existingClients.length ? existingClients[0] : null;
  const clientWrite = existingClient
    ? await sb.from('clients').update(clientRow).eq('id', existingClient.id).select().single()
    : await sb.from('clients').insert(clientRow).select().single();
  const cd = clientWrite.data;
  if (cd) {
    const localClient = {
      id: +cd.id, _new: false, name, email,
      type: clientRow.type, status: 'Aktif',
      phone: clientRow.phone, social: '', sessions: 0, remainingSessions: 0,
      programEnd: endDate || '', startDate: startStr,
      program: offer.name || '', health: 8, notes: [], start: startStr
    };
    const localClientIdx = state.clients.findIndex(c => c.email && c.email.toLowerCase() === email.toLowerCase());
    if (localClientIdx >= 0) state.clients[localClientIdx] = { ...state.clients[localClientIdx], ...localClient };
    else state.clients.push(localClient);
  }

  // 3. customers tablosuna ekle
  const customerRow = {
    name, email, program: offer.name || '',
    monthly_payment: monthlyPay,
    start_date: startStr, end_date: endDate,
    status: 'Aktif', notes: ''
  };
  const { data: existingCustomers } = await sb.from('customers').select('id').eq('email', email).limit(1);
  const existingCustomer = existingCustomers && existingCustomers.length ? existingCustomers[0] : null;
  let customerId = existingCustomer?.id;
  if (existingCustomer) {
    await sb.from('customers').update(customerRow).eq('id', existingCustomer.id);
  } else {
    customerId = await insertMusteriSB(customerRow);
  }
  const localCustomerIdx = musteriler.findIndex(m => m.email && m.email.toLowerCase() === email.toLowerCase());
  const localCustomer = { id: customerId, ...customerRow };
  if (localCustomerIdx >= 0) musteriler[localCustomerIdx] = { ...musteriler[localCustomerIdx], ...localCustomer };
  else musteriler.push(localCustomer);

  // 4. Günlük satış kaydı
  if (monthlyPay > 0 || offer.name) await recordSaleInDaily(name, offer.name, monthlyPay);

  // 5. onboarding_leads durumunu güncelle
  const { error: updErr } = await sb.from('onboarding_leads').update({
    status: 'approved',
    approved_at: new Date().toISOString()
  }).eq('id', regId);
  if (updErr) { toast('Hesap oluşturuldu fakat kayıt güncellenemedi: ' + updErr.message); }

  const idx = onboardingRegs.findIndex(r => String(r.id) === String(regId));
  if (idx >= 0) onboardingRegs[idx].status = 'approved';

  toast('✅ ' + name + ' için portal hesabı oluşturuldu!');
  renderOnboardingPage();
  setOnbTab(onbCurrentTab);
  renderUsers(); renderHealthPage(); renderStats();
}

async function archiveOnboardingReg(regId) {
  const { error } = await sb.from('onboarding_leads').update({ status: 'archived' }).eq('id', regId);
  if (error) { toast('Hata: ' + error.message); return; }
  const idx = onboardingRegs.findIndex(r => String(r.id) === String(regId));
  if (idx >= 0) onboardingRegs[idx].status = 'archived';
  renderOnboardingPage();
}

function openAddOnboardingModal() {
  ['onb-add-name', 'onb-add-email', 'onb-add-note'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  openModal('modal-add-onboarding');
}

async function addOnboardingTestRecord() {
  const full_name = document.getElementById('onb-add-name').value.trim();
  const email     = document.getElementById('onb-add-email').value.trim().toLowerCase();
  const note      = document.getElementById('onb-add-note').value.trim();
  if (!full_name || !email) { toast('Ad ve e-posta zorunlu'); return; }

  const { data, error } = await sb.from('onboarding_leads').insert({
    full_name, email, note: note || null, status: 'pending', source: 'manual'
  }).select().single();
  if (error) { toast('Hata: ' + error.message); return; }

  onboardingRegs.unshift(data);
  closeModal('modal-add-onboarding');
  renderOnboardingPage();
  toast('Kayıt eklendi');
}

/* ============================================================
   TEKLİFLER
   ============================================================ */
let teklifler = [];
let currentTeklifId = null;

/* ---- Supabase ---- */
async function loadTeklifler() {
  try {
    const userId = currentUser?.email || '';
    let q = sb.from('offers').select('*').order('created_at');
    if(currentUser?.role !== 'admin') q = q.eq('user_id', userId);
    else q = q.or(`user_id.eq.${userId},user_id.is.null`);
    const { data, error } = await q;
    if(error) throw error;
    teklifler = (data||[]).map(r => ({
      id:           r.id,
      name:         r.name || '',
      category:     r.category || '',
      price:        r.price || 0,
      duration_value: r.duration_value || null,
      duration_unit:  r.duration_unit || 'Ay',
      description:  r.description || '',
      status:       r.status || 'Aktif',
      created_at:   r.created_at || ''
    }));
  } catch(e) {
  }
  renderTeklifKPI();
  renderTeklifCatFilter();
  renderTeklifTable();
}

async function insertTeklifSB(t) {
  try {
    const { data, error } = await sb.from('offers').insert({
      user_id: currentUser?.email || null,
      name: t.name, category: t.category, price: t.price,
      duration_value: t.duration_value || null,
      duration_unit: t.duration_unit,
      description: t.description, status: t.status
    }).select().single();
    if(error) throw error;
    return data;
  } catch(e) {
    return { id: 'local_' + Date.now(), created_at: new Date().toISOString() };
  }
}

async function updateTeklifSB(id, t) {
  try {
    let q = sb.from('offers').update({
      name: t.name, category: t.category, price: t.price,
      duration_value: t.duration_value || null,
      duration_unit: t.duration_unit,
      description: t.description, status: t.status
    }).eq('id', id);
    if(currentUser?.role !== 'admin') q = q.eq('user_id', currentUser?.email || '');
    await q;
  } catch(e) {  }
}

async function deleteTeklifSB(id) {
  try {
    let q = sb.from('offers').delete().eq('id', id);
    if(currentUser?.role !== 'admin') q = q.eq('user_id', currentUser?.email || '');
    await q;
  }
  catch(e) {  }
}

/* ---- Helpers ---- */
function fmtDur(t) {
  if(!t.duration_value) return '—';
  return t.duration_value + ' ' + (t.duration_unit || 'Ay');
}
function fmtDate(d) {
  if(!d) return '—';
  return new Date(d).toLocaleDateString('tr-TR', { day:'2-digit', month:'short', year:'numeric' });
}
const teklifStatusStyle = {
  'Aktif':  { bg:'rgba(76,175,129,0.12)',  color:'var(--color-green)' },
  'Pasif':  { bg:'rgba(155,154,151,0.12)', color:'var(--color-text-muted)' },
  'Taslak': { bg:'rgba(224,165,83,0.12)',  color:'var(--color-amber)' },
};

/* ---- KPI ---- */
function renderTeklifKPI() {
  const el = document.getElementById('teklif-kpi');
  if(!el) return;
  const aktif = teklifler.filter(t => t.status === 'Aktif');
  const avgPrice = aktif.length ? aktif.reduce((s,t) => s + t.price, 0) / aktif.length : 0;
  const totalVal = teklifler.reduce((s,t) => s + t.price, 0);
  const kpis = [
    { label:'Toplam Teklif',    value: teklifler.length,          sub: 'kayıtlı program',         icon:'📋' },
    { label:'Aktif Teklif',     value: aktif.length,              sub: teklifler.length - aktif.length + ' pasif / taslak', icon:'✅' },
    { label:'Ortalama Fiyat',   value: avgPrice ? '₺' + Math.round(avgPrice).toLocaleString('tr-TR') : '—', sub:'aktif teklifler', icon:'⌀' },
    { label:'Toplam Değer',     value: totalVal ? '₺' + totalVal.toLocaleString('tr-TR') : '—',  sub:'tüm tekliflerin toplamı', icon:'💰' },
  ];
  el.innerHTML = kpis.map(k => `
    <div class="stat-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="stat-label">${k.label}</div>
        <span style="font-size:16px;opacity:0.45">${k.icon}</span>
      </div>
      <div class="stat-value" style="font-size:22px;letter-spacing:-0.5px">${k.value}</div>
      <div class="stat-change" style="margin-top:5px;font-size:11px;color:var(--color-text-muted)">${k.sub}</div>
    </div>`).join('');
}

/* ---- Category filter ---- */
function renderTeklifCatFilter() {
  const sel = document.getElementById('teklif-cat-filter');
  if(!sel) return;
  const cats = [...new Set(teklifler.map(t => t.category).filter(Boolean))].sort();
  const current = sel.value;
  sel.innerHTML = '<option value="">Tüm Kategoriler</option>' +
    cats.map(c => `<option value="${c}"${current===c?' selected':''}>${c}</option>`).join('');
}

/* ---- Table ---- */
function renderTeklifTable() {
  const search  = (document.getElementById('teklif-search')?.value || '').toLowerCase();
  const status  = document.getElementById('teklif-status-filter')?.value || '';
  const cat     = document.getElementById('teklif-cat-filter')?.value || '';
  const tbody   = document.getElementById('teklif-tbody');
  const emptyEl = document.getElementById('teklif-empty');
  const tableEl = document.getElementById('teklif-table-container');
  if(!tbody) return;

  let list = teklifler.filter(t => {
    const matchS = t.name.toLowerCase().includes(search) || (t.category||'').toLowerCase().includes(search) || (t.description||'').toLowerCase().includes(search);
    const matchSt = !status || t.status === status;
    const matchC  = !cat    || t.category === cat;
    return matchS && matchSt && matchC;
  });

  if(teklifler.length === 0) {
    emptyEl.style.display = 'block'; tableEl.style.display = 'none'; return;
  }
  emptyEl.style.display = 'none'; tableEl.style.display = 'block';

  tbody.innerHTML = list.map(t => {
    const ss = teklifStatusStyle[t.status] || teklifStatusStyle['Pasif'];
    return `<tr style="border-bottom:1px solid var(--color-divider);cursor:pointer;transition:background 0.1s"
      onmouseover="this.style.background='var(--color-surface-hover)'"
      onmouseout="this.style.background='transparent'"
      onclick="openTeklifPanel('${t.id}')">
      <td style="padding:11px 16px">
        <div style="font-size:13px;font-weight:500;color:var(--color-text-primary)">${t.name}</div>
      </td>
      <td style="padding:11px 16px;font-size:12px;color:var(--color-text-muted)">${t.category || '—'}</td>
      <td style="padding:11px 16px;text-align:right;font-size:13px;font-weight:600;color:var(--color-text-primary);white-space:nowrap">${t.price ? '₺' + Number(t.price).toLocaleString('tr-TR') : '—'}</td>
      <td style="padding:11px 16px;text-align:center;font-size:13px;color:var(--color-text-secondary);white-space:nowrap">${fmtDur(t)}</td>
      <td style="padding:11px 16px;font-size:12px;color:var(--color-text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.description || '—'}</td>
      <td style="padding:11px 16px;text-align:center">
        <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:500;background:${ss.bg};color:${ss.color}">${t.status}</span>
      </td>
      <td style="padding:11px 16px;font-size:12px;color:var(--color-text-muted);white-space:nowrap">${fmtDate(t.created_at)}</td>
      <td style="padding:11px 16px;text-align:right">
        <button onclick="event.stopPropagation();openTeklifEdit('${t.id}')"
          style="background:none;border:1px solid var(--color-border);color:var(--color-text-muted);cursor:pointer;font-size:11px;padding:3px 8px;border-radius:5px;font-family:inherit;transition:all 0.1s"
          onmouseover="this.style.background='var(--color-surface-hover)';this.style.color='var(--color-text-primary)'"
          onmouseout="this.style.background='none';this.style.color='var(--color-text-muted)'">Düzenle</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--color-text-muted);font-size:13px">Sonuç bulunamadı</td></tr>`;
}

/* ---- Modal ---- */
function openTeklifModal() {
  currentTeklifId = null;
  document.getElementById('teklif-modal-title').textContent = 'Yeni Teklif';
  document.getElementById('t-save-btn').textContent = 'Kaydet';
  document.getElementById('t-delete-wrap').style.display = 'none';
  ['t-id','t-name','t-category','t-price','t-dur-val','t-desc'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  document.getElementById('t-dur-unit').value = 'Ay';
  document.getElementById('t-status').value = 'Aktif';
  openModal('modal-teklif');
  setTimeout(() => document.getElementById('t-name').focus(), 100);
}

function openTeklifEdit(id) {
  const t = teklifler.find(x => String(x.id) === String(id)); if(!t) return;
  currentTeklifId = id;
  document.getElementById('teklif-modal-title').textContent = 'Teklifi Düzenle';
  document.getElementById('t-save-btn').textContent = 'Güncelle';
  document.getElementById('t-delete-wrap').style.display = 'block';
  document.getElementById('t-id').value       = id;
  document.getElementById('t-name').value     = t.name;
  document.getElementById('t-category').value = t.category;
  document.getElementById('t-price').value    = t.price;
  document.getElementById('t-dur-val').value  = t.duration_value || '';
  document.getElementById('t-dur-unit').value = t.duration_unit || 'Ay';
  document.getElementById('t-desc').value     = t.description;
  document.getElementById('t-status').value   = t.status;
  openModal('modal-teklif');
  setTimeout(() => document.getElementById('t-name').focus(), 100);
}

function editTeklifFromPanel() {
  closePanel('panel-teklif');
  if(currentTeklifId) openTeklifEdit(currentTeklifId);
}

async function saveTeklif() {
  const name = document.getElementById('t-name').value.trim();
  if(!name) { toast('Teklif adı gir'); return; }
  const price = parseFloat(document.getElementById('t-price').value) || 0;
  if(!price) { toast('Fiyat gir'); return; }

  const t = {
    name,
    category:       document.getElementById('t-category').value.trim(),
    price,
    duration_value: parseInt(document.getElementById('t-dur-val').value) || null,
    duration_unit:  document.getElementById('t-dur-unit').value,
    description:    document.getElementById('t-desc').value.trim(),
    status:         document.getElementById('t-status').value,
  };

  if(currentTeklifId) {
    await updateTeklifSB(currentTeklifId, t);
    const idx = teklifler.findIndex(x => String(x.id) === String(currentTeklifId));
    if(idx >= 0) teklifler[idx] = { ...teklifler[idx], ...t };
    toast('✅ Güncellendi!');
  } else {
    const res = await insertTeklifSB(t);
    teklifler.push({ ...t, id: res.id, created_at: res.created_at });
    toast('✅ Teklif eklendi!');
  }

  closeModal('modal-teklif');
  renderTeklifKPI();
  renderTeklifCatFilter();
  renderTeklifTable();
}

async function deleteTeklifFromModal() {
  const id = document.getElementById('t-id').value;
  if(!id || !confirm('Bu teklifi silmek istiyor musun?')) return;
  await deleteTeklifSB(id);
  teklifler = teklifler.filter(x => String(x.id) !== String(id));
  closeModal('modal-teklif');
  renderTeklifKPI();
  renderTeklifCatFilter();
  renderTeklifTable();
  toast('Teklif silindi');
}

/* ---- Detail Panel ---- */
function openTeklifPanel(id) {
  const t = teklifler.find(x => String(x.id) === String(id)); if(!t) return;
  currentTeklifId = id;
  document.getElementById('tp-name').textContent  = t.name;
  document.getElementById('tp-price').textContent = t.price ? '₺' + Number(t.price).toLocaleString('tr-TR') : '—';
  document.getElementById('tp-dur').textContent   = fmtDur(t);
  document.getElementById('tp-cat').textContent   = t.category || '—';
  document.getElementById('tp-date').textContent  = fmtDate(t.created_at);
  const ss = teklifStatusStyle[t.status] || teklifStatusStyle['Pasif'];
  document.getElementById('tp-status-badge').innerHTML =
    `<span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:500;background:${ss.bg};color:${ss.color}">${t.status}</span>`;
  const descSection = document.getElementById('tp-desc-section');
  if(t.description) {
    descSection.style.display = 'block';
    document.getElementById('tp-desc-text').textContent = t.description;
  } else {
    descSection.style.display = 'none';
  }
  openPanel('panel-teklif');
}


/* ============================================================
   INSTAGRAM'DAN EKLE
   ============================================================ */

/* ============================================================
   KAZANIMLAR — BELT ACHIEVEMENT SYSTEM
   ============================================================ */

const BADGE_DEFS = [
  {
    key:         'survivor',
    name:        'Hayatta Kalma',
    emoji:       '🪨',
    threshold:   50000,
    threshLabel: '₺50.000+',
    color:       '#c4b8a5',
    heroGlow:    'rgba(190,175,155,0.09)',
    barColor:    'linear-gradient(90deg,#9a8c78,#c4b8a5)',
    desc:        'Temeller atıldı. Sistem artık nefes alıyor.',
    pillStyle:   'background:rgba(185,172,150,0.15);color:#c4b8a5',
    statusDone:  'background:rgba(185,172,150,0.12);color:#a89880',
    statusActive:'background:rgba(185,172,150,0.22);color:#d4c8b5'
  },
  {
    key:         'parttime',
    name:        'Part-Time',
    emoji:       '⚡',
    threshold:   100000,
    threshLabel: '₺100.000+',
    color:       '#4a9eff',
    heroGlow:    'rgba(74,158,255,0.10)',
    barColor:    'linear-gradient(90deg,#1a6ecf,#4a9eff)',
    desc:        'Ek gelir çizgisi aşıldı. Model güç kazanıyor.',
    pillStyle:   'background:rgba(74,158,255,0.14);color:#4a9eff',
    statusDone:  'background:rgba(74,158,255,0.10);color:#2a72c8',
    statusActive:'background:rgba(74,158,255,0.20);color:#6ab8ff'
  },
  {
    key:         'fulltime',
    name:        'Full-Time',
    emoji:       '💜',
    threshold:   250000,
    threshLabel: '₺250.000+',
    color:       '#b070f8',
    heroGlow:    'rgba(168,100,255,0.10)',
    barColor:    'linear-gradient(90deg,#6830a8,#b070f8)',
    desc:        'Bu artık bir düzen, tesadüf değil.',
    pillStyle:   'background:rgba(160,90,255,0.14);color:#b878ff',
    statusDone:  'background:rgba(160,90,255,0.10);color:#7840b0',
    statusActive:'background:rgba(160,90,255,0.20);color:#cc90ff'
  },
  {
    key:         'operator',
    name:        'Operatör',
    emoji:       '⚙️',
    threshold:   500000,
    threshLabel: '₺500.000+',
    color:       '#d0882a',
    heroGlow:    'rgba(210,148,55,0.10)',
    barColor:    'linear-gradient(90deg,#885210,#d4a040)',
    desc:        'Gelir sistemle yönetiliyor, eforla değil.',
    pillStyle:   'background:rgba(200,138,45,0.14);color:#d4902a',
    statusDone:  'background:rgba(200,138,45,0.10);color:#906018',
    statusActive:'background:rgba(200,138,45,0.20);color:#e8a840'
  },
  {
    key:         'unicorn',
    name:        'Unicorn',
    emoji:       '🦄',
    threshold:   1000000,
    threshLabel: '₺1.000.000+',
    color:       '#c084fc',
    heroGlow:    'rgba(196,175,255,0.08)',
    barColor:    'linear-gradient(90deg,#7c3aed,#c084fc,#60a5fa)',
    desc:        'Nadir seviyeye ulaşıldı. Bu artık elit performans.',
    pillStyle:   'background:rgba(192,132,252,0.14);color:#c084fc',
    statusDone:  'background:rgba(192,132,252,0.10);color:#8040c0',
    statusActive:'background:rgba(192,132,252,0.20);color:#d8aaff'
  }
];

function getActiveBadge(revenue) {
  // Returns the badge matching the current revenue range, or null if < 50,000
  let active = null;
  for (const b of BADGE_DEFS) {
    if (revenue >= b.threshold) active = b;
  }
  return active;
}

// Cached unlock data
let _beltAchievements = []; // {belt_key, unlocked_at, unlocked_month_revenue}
let _beltLoaded = false;
let _beltTableMissing = false;

/* --- Helpers --- */
function getCurrentMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const start = `${y}-${m}-01`;
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

async function getThisMonthRevenue() {
  if (!currentUser) return 0;
  const { start, end } = getCurrentMonthRange();

  let q = sb.from('daily_entries')
    .select('alinan')
    .gte('entry_date', start)
    .lte('entry_date', end);

  q = q.eq('user_id', currentUser.email);

  const { data, error } = await q;
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (parseFloat(row.alinan) || 0), 0);
}

async function loadUserAchievements() {
  if (!currentUser) return [];
  const { data, error } = await sb
    .from('user_achievements')
    .select('*')
    .eq('owner_user_id', currentUser.email)
    .order('created_at');
  if (error) {
    _beltTableMissing = true;
    return [];
  }
  _beltTableMissing = false;
  return data || [];
}

async function unlockBeltIfNew(beltKey, revenueAmount) {
  if (!currentUser || _beltTableMissing) return;
  const existing = _beltAchievements.find(a => a.belt_key === beltKey);
  if (existing) return;

  const row = {
    owner_user_id: currentUser.email,
    belt_key: beltKey,
    unlocked_at: new Date().toISOString(),
    unlocked_month_revenue: revenueAmount
  };
  const { data, error } = await sb
    .from('user_achievements')
    .insert(row)
    .select()
    .single();
  if (error) {
    const isDup = error.message?.includes('duplicate') || error.code === '23505';
    if (!isDup)
    return;
  }
  if (data) _beltAchievements.push(data);
}

async function processUnlocks(monthRevenue) {
  for (const badge of BADGE_DEFS) {
    if (monthRevenue >= badge.threshold) {
      await unlockBeltIfNew(badge.key, monthRevenue);
    }
  }
}

/* --- Main Page Loader --- */
async function loadKazanimlarPage() {
  const gallery = document.getElementById('badge-gallery');
  if (gallery) gallery.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-text-muted);font-size:13px">Rozetler yükleniyor...</div>';

  try {
    _beltAchievements = await loadUserAchievements();
    const monthRevenue = await getThisMonthRevenue();
    await processUnlocks(monthRevenue);
    _beltAchievements = await loadUserAchievements();
    _beltLoaded = true;

    renderKazanimlarPage(monthRevenue);

    if (_beltTableMissing) {
      const gallery2 = document.getElementById('badge-gallery');
      const warn = document.createElement('div');
      warn.style.cssText = 'grid-column:1/-1;background:rgba(229,115,115,0.1);border:1px solid rgba(229,115,115,0.25);border-radius:10px;padding:18px 20px;font-size:13px;color:#e57373;line-height:1.7';
      warn.innerHTML = `<strong>⚠️ Supabase tablosu bulunamadı</strong><br>
        Supabase → SQL Editor'de şu kodu çalıştır, sonra sayfayı yenile:<br><br>
        <code style="font-size:11px;background:rgba(0,0,0,0.3);padding:10px 14px;border-radius:8px;display:block;white-space:pre-wrap;color:#ffcdd2">CREATE TABLE IF NOT EXISTS user_achievements (
  id                      BIGSERIAL PRIMARY KEY,
  owner_user_id           TEXT NOT NULL,
  belt_key                TEXT NOT NULL,
  unlocked_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlocked_month_revenue  NUMERIC(14,2),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_belt UNIQUE (owner_user_id, belt_key)
);</code>`;
      if (gallery2) gallery2.appendChild(warn);
    }

  } catch (e) {
    if (gallery) gallery.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-red);font-size:13px">İçerik yüklenemedi. Lütfen tekrar deneyin.</div>';
  }
}

function renderKazanimlarPage(monthRevenue) {
  const activeBadge = getActiveBadge(monthRevenue);
  const heroEl = document.getElementById('badge-hero');

  // Revenue
  const revEl = document.getElementById('badge-hero-revenue');
  if (revEl) revEl.textContent = '₺' + Math.round(monthRevenue).toLocaleString('tr-TR');

  // Hero background glow colour
  if (heroEl) {
    heroEl.style.setProperty('--hero-glow', activeBadge ? activeBadge.heroGlow : 'rgba(255,255,255,0.04)');
  }

  // Active badge pill
  const pillWrap = document.getElementById('badge-hero-active-pill-wrap');
  if (pillWrap) {
    if (activeBadge) {
      pillWrap.innerHTML = `<div class="badge-hero-active-pill" style="${activeBadge.pillStyle}"><span>${activeBadge.emoji}</span><span>Aktif Rozet: ${activeBadge.name}</span></div>`;
    } else {
      pillWrap.innerHTML = `<div class="badge-hero-active-pill" style="background:rgba(255,255,255,0.06);color:var(--color-text-muted)"><span>🔒</span><span>Henüz rozet açılmadı</span></div>`;
    }
  }

  // Motivation text
  const motivEl = document.getElementById('badge-hero-motivation');
  if (motivEl) {
    if (activeBadge) {
      motivEl.textContent = activeBadge.desc;
      motivEl.style.fontStyle = 'normal';
      motivEl.style.color = 'var(--color-text-secondary)';
    } else {
      motivEl.textContent = '₺50.000 eşiğini geç, ilk rozetini kazan.';
      motivEl.style.fontStyle = 'italic';
      motivEl.style.color = 'var(--color-text-muted)';
    }
  }

  // Progress toward next badge
  const activeIdx = activeBadge ? BADGE_DEFS.indexOf(activeBadge) : -1;
  const nextBadge = activeIdx < BADGE_DEFS.length - 1 ? BADGE_DEFS[activeIdx + 1] : null;
  const isTop     = activeBadge !== null && nextBadge === null;

  const progressTextEl = document.getElementById('badge-hero-progress-text');
  const progressPctEl  = document.getElementById('badge-hero-progress-pct');
  const progressBarEl  = document.getElementById('badge-hero-bar');
  const heroRightEl    = document.getElementById('badge-hero-right');
  const nextIconEl     = document.getElementById('badge-hero-next-icon');
  const nextNameEl     = document.getElementById('badge-hero-next-name');
  const nextAmountEl   = document.getElementById('badge-hero-next-amount');

  if (isTop) {
    if (progressTextEl) progressTextEl.textContent = 'En üst seviyedesin 🏆';
    if (progressPctEl)  progressPctEl.textContent  = '100%';
    if (progressBarEl) {
      progressBarEl.style.width = '100%';
      progressBarEl.style.background = BADGE_DEFS[BADGE_DEFS.length - 1].barColor;
    }
    if (heroRightEl) heroRightEl.style.visibility = 'hidden';
  } else {
    const prevThresh = activeBadge ? activeBadge.threshold : 0;
    const nextThresh = nextBadge.threshold;
    const pct        = Math.min(100, Math.max(0, ((monthRevenue - prevThresh) / (nextThresh - prevThresh)) * 100));
    const remaining  = Math.max(0, nextThresh - monthRevenue);

    if (progressTextEl) {
      progressTextEl.textContent = activeBadge
        ? `${nextBadge.name} için ₺${Math.round(remaining).toLocaleString('tr-TR')} kaldı`
        : `İlk rozet için ₺${Math.round(remaining).toLocaleString('tr-TR')} kaldı`;
    }
    if (progressPctEl)  progressPctEl.textContent = Math.round(pct) + '%';
    if (progressBarEl) {
      progressBarEl.style.width = pct + '%';
      progressBarEl.style.background = nextBadge.barColor;
    }
    if (nextIconEl)   nextIconEl.textContent = nextBadge.emoji;
    if (nextNameEl)   { nextNameEl.textContent = nextBadge.name; nextNameEl.style.color = nextBadge.color; }
    if (nextAmountEl) nextAmountEl.textContent = nextBadge.threshLabel;
    if (heroRightEl)  heroRightEl.style.visibility = '';
  }

  // Badge gallery
  const gallery = document.getElementById('badge-gallery');
  if (!gallery) return;

  gallery.innerHTML = BADGE_DEFS.map((badge, idx) => {
    const isActive = activeBadge?.key === badge.key;
    const isPassed = activeBadge !== null && BADGE_DEFS.indexOf(badge) < BADGE_DEFS.indexOf(activeBadge);
    const isLocked = !isActive && !isPassed;
    const stateClass = isActive ? 'active' : isPassed ? 'passed' : 'locked';
    const achData  = _beltAchievements.find(a => a.belt_key === badge.key);

    const activeTag  = isActive ? `<div class="badge-card-active-tag" style="${badge.statusActive}">⭐ Aktif</div>` : '';
    const lockIcon   = isLocked ? `<div class="badge-card-lock">🔒</div>` : '';
    const statusHTML = isActive
      ? `<div class="badge-card-status" style="${badge.statusActive}">Aktif Seviye</div>`
      : isPassed
        ? `<div class="badge-card-status" style="${badge.statusDone}">✓ Tamamlandı</div>`
        : `<div class="badge-card-status" style="background:rgba(255,255,255,0.04);color:var(--color-text-disabled)">Kilitli</div>`;

    const dateHTML = (!isLocked && achData?.unlocked_at)
      ? `<div class="badge-card-date">${new Date(achData.unlocked_at).toLocaleDateString('tr-TR', {day:'numeric',month:'long',year:'numeric'})}</div>`
      : '';

    const threshColor = isLocked ? 'color:var(--color-text-disabled)' : '';

    return `
      <div class="badge-card badge-${badge.key} ${stateClass} badge-reveal" style="animation-delay:${idx * 0.07}s">
        ${activeTag}${lockIcon}
        <div class="badge-orb">
          <div class="badge-orb-glow"></div>
          <div class="badge-orb-inner">${badge.emoji}</div>
        </div>
        <div class="badge-card-name">${badge.name}</div>
        <div class="badge-card-threshold" style="${threshColor}">${badge.threshLabel}</div>
        ${statusHTML}
        <div class="badge-card-desc">${badge.desc}</div>
        ${dateHTML}
      </div>`;
  }).join('');
}

/* SQL to run once in Supabase dashboard:

CREATE TABLE IF NOT EXISTS user_achievements (
  id                      BIGSERIAL PRIMARY KEY,
  owner_user_id           TEXT NOT NULL,
  belt_key                TEXT NOT NULL,
  unlocked_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlocked_month_revenue  NUMERIC(14,2),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_belt UNIQUE (owner_user_id, belt_key)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  USING (owner_user_id = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (owner_user_id = current_setting('request.jwt.claims', true)::json->>'email');

NOTE: Since this app uses anon key with custom auth (users table),
RLS enforcement is at application level (eq filter by currentUser.email).
The policies above are for reference / production hardening.
*/

/* ============================================
   CHA-CHING — Satış Bildirimi
   ============================================ */
function openChaChing() {
  ['cc-paket','cc-not'].forEach(id => document.getElementById(id).value = '');
  ['cc-alinan','cc-toplam'].forEach(id => document.getElementById(id).value = '');
  openModal('modal-chaching');
  setTimeout(() => document.getElementById('cc-paket').focus(), 100);
}

async function saveChaChing() {
  const paket  = document.getElementById('cc-paket').value.trim();
  const alinan = +document.getElementById('cc-alinan').value || 0;
  const toplam = +document.getElementById('cc-toplam').value || 0;
  const not    = document.getElementById('cc-not').value.trim();

  if (!paket)  { toast('Paket adı gir'); return; }
  if (!alinan) { toast('Alınan ödemeyi gir'); return; }

  const btn = document.getElementById('cc-save-btn');
  btn.disabled = true; btn.textContent = 'Kaydediliyor…';

  const today = new Date().toISOString().split('T')[0];

  // 1. sales tablosuna kaydet
  const { error } = await sb.from('sales').insert({
    user_id:         currentUser.email,
    sale_date:       today,
    package_name:    paket,
    amount_received: alinan,
    total_amount:    toplam || alinan,
    note:            not || null,
  });

  if (error) {
    btn.disabled = false; btn.innerHTML = '💰 Kaydet';
    toast('❌ Hata: ' + error.message); return;
  }

  // 2. O günün toplam satışını hesapla
  const { data: daySales } = await sb.from('sales')
    .select('amount_received')
    .eq('user_id', currentUser.email)
    .eq('sale_date', today);
  const totalAlinan = (daySales ?? []).reduce((s, r) => s + (+r.amount_received || 0), 0);

  // 3. daily_entries güncelle veya oluştur
  const { data: existingRows } = await sb.from('daily_entries')
    .select('id').eq('user_id', currentUser.email).eq('entry_date', today).limit(1);
  const existing = existingRows?.[0] ?? null;
  if (existing?.id) {
    await sb.from('daily_entries').update({ alinan: totalAlinan }).eq('id', existing.id);
    const local = (state.daily || []).find(d => d.date === today);
    if (local) { local.alinan = totalAlinan; }
    else {
      state.daily = state.daily || [];
      state.daily.unshift({ id: existing.id, date: today, dateShort: today, mood: '🙂',
        takipci: +document.getElementById('kpi-takipci')?.value||0, mail:0, icerik:0,
        reklam: +document.getElementById('kpi-reklam')?.value||0,
        tpm: +document.getElementById('kpi-tpm')?.value||0,
        hotlist:0, musteri:0, teklif:0, alinan: totalAlinan, anlasma:0, yorum:'', win:'' });
    }
  } else {
    const { data: newRow } = await sb.from('daily_entries').insert({
      user_id: currentUser.email, entry_date: today, mood: '🙂',
      alinan: totalAlinan,
      takipci: +document.getElementById('kpi-takipci')?.value||0,
      reklam: +document.getElementById('kpi-reklam')?.value||0,
      tpm: +document.getElementById('kpi-tpm')?.value||0,
      mail:0, icerik:0, teklif:0, anlasma:0, yorum:''
    }).select().single();
    if (newRow) {
      state.daily = state.daily || [];
      state.daily.unshift({ id: newRow.id, date: today, dateShort: today, mood: '🙂',
        takipci: newRow.takipci||0, mail:0, icerik:0, reklam: newRow.reklam||0,
        tpm: newRow.tpm||0, hotlist:0, musteri:0, teklif:0, alinan: totalAlinan, anlasma:0, yorum:'', win:'' });
    }
  }

  btn.disabled = false; btn.innerHTML = '💰 Kaydet';
  closeModal('modal-chaching');
  toast('💰 Cha-Ching! Satış kaydedildi!');
  render();
  loadSalesTicker();
}

/* ============================================
   ACTIVITY STREAM — Güncel Aktiviteler
   ============================================ */
const _AS_SUBS = [
  'Başarılı bir satış gerçekleştirildi.',
  'Yeni bir satış bildirimi eklendi.',
  'Günlük satış kaydı oluşturuldu.',
  'Satış hedefine bir adım daha yaklaştı.',
  'Sisteme yeni bir gelir kaydı girildi.',
];

async function loadSalesTicker() {
  const inner = document.getElementById('as-inner');
  if (!inner) return;

  const { data, error } = await sb
    .from('sales')
    .select('user_id, sale_date, package_name, amount_received')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) { _renderActivityCards(inner, []); return; }

  const items = [];
  for (const row of data) {
    const found = (typeof users !== 'undefined' && Array.isArray(users))
      ? users.find(x => x.email === row.user_id)
      : null;
    // Admin satışları akışa dahil etme
    if (row.user_id === currentUser?.email && currentUser?.role === 'admin') continue;
    // Fallback: users listesinde yoksa email'den isim türet
    const name = found?.name
      ?? (currentUser?.email === row.user_id ? (currentUser?.name || row.user_id.split('@')[0]) : null);
    if (!name) continue;
    const amt = (+row.amount_received).toLocaleString('tr-TR', { minimumFractionDigits: 0 });
    const pkg = row.package_name ? ` — ${row.package_name}` : '';
    items.push({ name, sub: `₺${amt} satış bildirdi${pkg}` });
    if (items.length >= 10) break;
  }

  _renderActivityCards(inner, items);
}

function _renderActivityCards(inner, items) {
  const icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 10h8M8 14h5"/><path d="M8 3V1M16 3V1"/></svg>`;

  if (!items.length) {
    inner.style.animation = 'none';
    inner.innerHTML = `<div class="as-empty-wrap">
      <div class="as-empty-title">Henüz satış aktivitesi yok</div>
      <div class="as-empty-sub">İlk satış bildirimi geldiğinde burada görünecek.</div>
    </div>`;
    return;
  }

  const card = item => `<div class="as-card">
    <div class="as-card-icon">${icon}</div>
    <div class="as-card-body">
      <div class="as-card-name">${item.name} satış yaptı!</div>
      <div class="as-card-sub">${item.sub}</div>
    </div>
  </div>`;

  const single = items.map(card).join('');
  inner.innerHTML = single + single;

  const dur = Math.max(28, items.length * 5);
  inner.style.animation = `asScroll ${dur}s linear infinite`;
}

function extractHandle(social) {
  if(!social) return '';
  if(social.startsWith('@')) return social;
  try {
    const url = social.includes('://') ? new URL(social) : new URL('https://' + social);
    const parts = url.pathname.replace(/\/+$/,'').split('/').filter(Boolean);
    return parts.length ? '@' + parts[parts.length - 1] : social;
  } catch(e) { return social; }
}

function autoParseInstagram(val) {
  const preview = document.getElementById('l-social-preview');
  const avatarEl = document.getElementById('l-social-avatar');
  const handleEl = document.getElementById('l-social-handle');
  if(!val || val.length < 3) { preview.style.display = 'none'; return; }
  const handle = extractHandle(val);
  if(handle) {
    avatarEl.textContent = handle.replace('@','').charAt(0).toUpperCase();
    handleEl.textContent = handle;
    preview.style.display = 'flex';
    // İsim alanı boşsa kullanıcı adını doldur
    const nameEl = document.getElementById('l-name');
    if(nameEl && !nameEl.value) nameEl.value = handle.replace('@','');
  } else {
    preview.style.display = 'none';
  }
}

function parseInstagramLink() {
  const val = document.getElementById('l-social').value.trim();
  autoParseInstagram(val);
  if(!val) { toast('Link veya kullanıcı adı gir'); return; }
  const handle = extractHandle(val);
  const sourceEl = document.getElementById('l-source');
  if(sourceEl) sourceEl.value = 'Instagram';
  const nameEl = document.getElementById('l-name');
  if(nameEl && !nameEl.value && handle) nameEl.value = handle.replace('@','');
  toast('✅ Profil bağlandı');
}

function openInstagramEkle() {
  // Önce modalı aç
  openModal('modal-add-lead');
  // Kaynağı Instagram seç
  setTimeout(() => {
    const sourceEl = document.getElementById('l-source');
    if(sourceEl) sourceEl.value = 'Instagram';
    // Odağı social alanına ver
    const socialEl = document.getElementById('l-social');
    if(socialEl) {
      socialEl.focus();
      socialEl.placeholder = 'instagram.com/kullanici veya @kullanici — yapıştır';
    }
  }, 120);
}

/* ============================================================
   INSTAGRAM ENTEGRASYONU — Frontend Logic
   ============================================================

   GÜVENLİK MODELİ:
   ─────────────────
   • Meta API çağrıları YALNIZCA Supabase Edge Functions üzerinden yapılır.
   • Access token frontend'e hiç gelmez; DB'de pgcrypto ile şifreli.
   • Frontend sadece snapshot + media tablolarını okur (anon key).
   • encrypted_access_token kolonu anon key için REVOKE edilmiştir.
   • OAuth state parametresi 15 dakika TTL ile CSRF koruması sağlar.
   ============================================================ */

// ── State ─────────────────────────────────────────────────────────────
let igConn       = null;   // connection metadata (token excluded)
let igSnapshots  = [];     // account daily snapshots
let igMedia      = [];     // media performance records

// ── OAuth — popup akışı ───────────────────────────────────────────────
function connectInstagram() {
  if (!META_APP_ID) {
    toast('⚠️ META_APP_ID ayarlanmamış. Kod içindeki sabiti güncelleyin.');
    return;
  }

  // State: encoded user identity + timestamp (CSRF protection)
  const state = encodeURIComponent(btoa(JSON.stringify({
    uid: currentUser.email,
    ts:  Date.now(),
  })));

  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'instagram_basic',
    'instagram_manage_insights',
    'business_management',
    'ads_read',
  ].join(',');

  const oauthUrl =
    `https://www.facebook.com/v20.0/dialog/oauth` +
    `?client_id=${META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(IG_OAUTH_FN)}` +
    `&scope=${scopes}` +
    `&state=${state}` +
    `&response_type=code`;

  const popup = window.open(oauthUrl, 'ig-oauth',
    'width=640,height=720,scrollbars=yes,resizable=yes');

  // Listen for postMessage from Edge Function callback page
  const handler = (e) => {
    if (e.data?.type === 'IG_OAUTH_SUCCESS') {
      window.removeEventListener('message', handler);
      popup?.close();
      toast('✓ Instagram hesabı bağlandı!');
      // Trigger initial sync then reload page data
      syncInstagramSilent().then(() => loadInstagramPage());
    } else if (e.data?.type === 'IG_OAUTH_ERROR') {
      window.removeEventListener('message', handler);
      popup?.close();
      toast('⚠️ Bağlantı başarısız: ' + (e.data.payload || 'Bilinmeyen hata'));
    }
  };
  window.addEventListener('message', handler);
}

// ── Disconnect ────────────────────────────────────────────────────────
async function disconnectInstagram() {
  if (!confirm('Instagram bağlantısını kaldırmak istediğinize emin misiniz?')) return;
  await sb.from('instagram_connections')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', currentUser.email);
  igConn = null;
  igSnapshots = [];
  igMedia = [];
  document.getElementById('ig-kpi-section').style.display = 'none';
  toast('Instagram bağlantısı kaldırıldı.');
  loadInstagramPage();
}

// ── Manual sync (with UI feedback) ───────────────────────────────────
async function syncInstagram() {
  const btn = document.getElementById('ig-sync-btn');
  if (btn) { btn.disabled = true; btn.textContent = '↻ Senkronize ediliyor…'; }

  const [result] = await Promise.all([_callSyncFn(), _callAdsSync()]);

  if (btn) { btn.disabled = false; btn.textContent = '↻ Senkronize Et'; }

  if (result.success) {
    toast(`✓ Senkronize edildi — ${result.followers?.toLocaleString('tr-TR') ?? '?'} takipçi`);
    await loadInstagramPage();
    await loadIgDailyKPIs();
  } else if (result.error === 'token_expired') {
    toast('⚠️ Bağlantı süresi dolmuş. Lütfen yeniden bağlayın.');
    loadInstagramPage();
  } else if (result.error === 'requires_reconnect') {
    toast('⚠️ Instagram izinleri eksik. Hesabı yeniden bağlamanız gerekiyor.');
    loadInstagramPage();
  } else {
    toast(`⚠️ Senkronizasyon başarısız: ${result.detail || result.error || 'bilinmeyen hata'}`);
  }
}

// Silent sync (no UI feedback, used after OAuth)
async function syncInstagramSilent() {
  await Promise.all([_callSyncFn(), _callAdsSync()]);
}

async function _callSyncFn() {
  try {
    const res = await fetch(IG_SYNC_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ user_id: currentUser.email }),
    });
    return await res.json();
  } catch {
    return { error: 'network_error' };
  }
}

// ── Meta Ads sync ─────────────────────────────────────────────────────
async function syncMetaAds() {
  const btn = document.getElementById('meta-ads-sync-btn');
  if (btn) { btn.disabled = true; btn.textContent = '↻ Senkronize ediliyor…'; }
  const result = await _callAdsSync();
  if (btn) { btn.disabled = false; btn.textContent = '↻ Reklamları Senkronize Et'; }

  if (result.success) {
    const spend = (result.total_spend ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    toast(`✓ Reklam verisi güncellendi — ₺${spend} harcama`);
    loadIgAdsSection();
  } else if (result.error === 'no_ads_token') {
    toast('ℹ️ Reklam verisi için yeniden bağlanın (ads_read izni gerekli).');
  } else {
    toast(`⚠️ Reklam senkronizasyonu başarısız: ${result.detail || result.error || 'bilinmeyen hata'}`);
  }
}

async function _callAdsSync() {
  try {
    const res = await fetch(META_ADS_SYNC_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ user_id: currentUser.email }),
    });
    return await res.json();
  } catch {
    return { error: 'network_error' };
  }
}

// ── Instagram State ───────────────────────────────────────────────────
const igState = {
  filters: { sortBy: 'newest', contentType: 'all', dateRange: 'all' },
  research: {
    accounts: (() => { try { return JSON.parse(localStorage.getItem('ig_ra')||'[]'); } catch { return []; } })(),
    data: {},    // username → { profile, media, fetchedAt }
    active: null // null = own account
  },
};

// ── Metric utilities ──────────────────────────────────────────────────
function igFmt(n) {
  if (n === null || n === undefined) return '—';
  return n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : (+n).toLocaleString('tr-TR');
}
function igFmtS(n) { return (!n) ? '0' : n >= 1000 ? (n/1000).toFixed(1)+'K' : (+n).toLocaleString('tr-TR'); }
function igEngTotal(m) { return (m.like_count||0)+(m.comments_count||0)+(m.saves||0)+(m.shares||0); }
function igEngRate(m, followers) {
  if (m.engagement_rate != null && m.engagement_rate > 0) return m.engagement_rate;
  const denom = m.reach || followers || 1;
  return denom > 0 ? (igEngTotal(m) / denom * 100) : 0;
}

// ── Filter / Sort ─────────────────────────────────────────────────────
function igApplyFilters(media, f) {
  let r = [...media];
  if (f.contentType !== 'all') r = r.filter(m => m.media_type === f.contentType);
  if (f.dateRange !== 'all') {
    const days = { '7d':7,'30d':30,'90d':90 }[f.dateRange]||99999;
    const cut = Date.now() - days*86400000;
    r = r.filter(m => m.published_at && new Date(m.published_at).getTime() >= cut);
  }
  const sorts = {
    newest:          (a,b) => new Date(b.published_at||0)-new Date(a.published_at||0),
    oldest:          (a,b) => new Date(a.published_at||0)-new Date(b.published_at||0),
    most_views:      (a,b) => (b.views||0)-(a.views||0),
    most_likes:      (a,b) => (b.like_count||0)-(a.like_count||0),
    most_comments:   (a,b) => (b.comments_count||0)-(a.comments_count||0),
    most_engagement: (a,b) => igEngTotal(b)-igEngTotal(a),
    top_eng_rate:    (a,b) => igEngRate(b,0)-igEngRate(a,0),
    most_saves:      (a,b) => (b.saves||0)-(a.saves||0),
    most_shares:     (a,b) => (b.shares||0)-(a.shares||0),
  };
  r.sort(sorts[f.sortBy]||sorts.newest);
  return r;
}

// ── Toolbar ───────────────────────────────────────────────────────────
function igRenderToolbar() {
  const bar = document.getElementById('ig-toolbar');
  if (!bar) return;
  const ra = igState.research.accounts;
  const own = igConn?.instagram_username ? '@'+igConn.instagram_username : 'Kendi Hesabım';
  const acctOpts = [
    `<option value="own" ${!igState.research.active?'selected':''}>${escHtml(own)}</option>`,
    ...ra.map(u=>`<option value="${escHtml(u)}" ${igState.research.active===u?'selected':''}>@${escHtml(u)}</option>`)
  ].join('');
  const f = igState.filters;
  bar.innerHTML = `
    <select class="ig-sel" onchange="igOnAccount(this.value)" title="Hesap">${acctOpts}</select>
    <select class="ig-sel" onchange="igState.filters.sortBy=this.value;igRenderGrid()" title="Sıralama">
      <option value="newest"          ${f.sortBy==='newest'?'selected':''}>En Yeni</option>
      <option value="most_views"      ${f.sortBy==='most_views'?'selected':''}>En Çok İzlenen</option>
      <option value="most_likes"      ${f.sortBy==='most_likes'?'selected':''}>En Çok Beğenilen</option>
      <option value="most_comments"   ${f.sortBy==='most_comments'?'selected':''}>En Çok Yorum</option>
      <option value="most_engagement" ${f.sortBy==='most_engagement'?'selected':''}>En Çok Etkileşim</option>
      <option value="top_eng_rate"    ${f.sortBy==='top_eng_rate'?'selected':''}>En Yüksek Oran</option>
      <option value="most_saves"      ${f.sortBy==='most_saves'?'selected':''}>En Çok Kaydedilen</option>
      <option value="most_shares"     ${f.sortBy==='most_shares'?'selected':''}>En Çok Paylaşılan</option>
      <option value="oldest"          ${f.sortBy==='oldest'?'selected':''}>En Eski</option>
    </select>
    <select class="ig-sel" onchange="igState.filters.contentType=this.value;igRenderGrid()" title="Tür">
      <option value="all"            ${f.contentType==='all'?'selected':''}>Tüm Türler</option>
      <option value="REELS"          ${f.contentType==='REELS'?'selected':''}>Reels</option>
      <option value="IMAGE"          ${f.contentType==='IMAGE'?'selected':''}>Fotoğraf</option>
      <option value="CAROUSEL_ALBUM" ${f.contentType==='CAROUSEL_ALBUM'?'selected':''}>Carousel</option>
      <option value="VIDEO"          ${f.contentType==='VIDEO'?'selected':''}>Video</option>
    </select>
    <select class="ig-sel" onchange="igState.filters.dateRange=this.value;igRenderGrid()" title="Tarih">
      <option value="all" ${f.dateRange==='all'?'selected':''}>Tüm Zamanlar</option>
      <option value="7d"  ${f.dateRange==='7d'?'selected':''}>Son 7 Gün</option>
      <option value="30d" ${f.dateRange==='30d'?'selected':''}>Son 30 Gün</option>
      <option value="90d" ${f.dateRange==='90d'?'selected':''}>Son 90 Gün</option>
    </select>
    <div style="flex:1;min-width:8px"></div>
    <button class="btn btn-ghost" onclick="openIgResearch()" style="font-size:12px;padding:7px 14px;gap:6px;display:flex;align-items:center;border-color:rgba(193,100,200,0.3);color:rgba(200,120,210,0.9)">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M14 14l-3-3"/></svg>
      Hesap Araştır
    </button>`;
}

// ── Grid ──────────────────────────────────────────────────────────────
function igRenderGrid() {
  const area = document.getElementById('ig-content-area');
  if (!area) return;
  const isRes = igState.research.active !== null;
  const src   = isRes ? (igState.research.data[igState.research.active]?.media||[]) : igMedia;
  const flrs  = isRes ? (igState.research.data[igState.research.active]?.profile?.followers_count||1) : 1;
  const items = igApplyFilters(src, igState.filters);
  if (!items.length) {
    area.innerHTML = `<div class="ig-empty-box"><div class="ig-empty-icon">${src.length?'🔍':'📭'}</div><div class="ig-empty-title">${src.length?'Filtrelerle eşleşen içerik yok':'Henüz içerik yok'}</div><div class="ig-empty-sub">${src.length?'Farklı filtre deneyin.':'Senkronize Et\'e basarak verileri çek.'}</div></div>`;
    return;
  }
  const TL = { IMAGE:'FOTOĞRAF', VIDEO:'VİDEO', CAROUSEL_ALBUM:'CAROUSEL', REELS:'REELS' };
  const maxP = Math.max(...items.map(m=>m.performance_score??0),1);
  area.innerHTML = `<div class="ig-content-grid">${items.map((m,i)=>igCardHtml(m,i,flrs,maxP,TL,!isRes)).join('')}</div>`;
}

function igCardHtml(m, idx, flrs, maxP, TL, isOwn) {
  const thumb = m.thumbnail_url||m.media_url;
  const thumbH = thumb ? `<img src="${escHtml(thumb)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '<span style="font-size:28px;opacity:.3">📷</span>';
  const perf   = Math.min(100,((m.performance_score??0)/maxP)*100);
  const er     = igEngRate(m, flrs);
  const erCol  = er>=5?'#4caf81':er>=2?'#f58529':'var(--color-text-muted)';
  const cap    = m.caption ? escHtml(m.caption.slice(0,90)) : '';
  const date   = m.published_at ? new Date(m.published_at).toLocaleDateString('tr-TR',{day:'numeric',month:'short'}) : '';
  const src    = isOwn ? 'own' : igState.research.active;
  const hasVw  = (m.views||0) > 0 || m.media_type==='REELS'||m.media_type==='VIDEO';
  return `<div class="ig-card" onclick="openIgDetail(${idx},'${escHtml(src)}')">
    <div class="ig-card-thumb">
      ${thumbH}
      ${m.media_type?`<span class="ig-card-type">${TL[m.media_type]??m.media_type}</span>`:''}
      ${er>=5?'<span class="ig-card-hot">🔥</span>':''}
    </div>
    <div class="ig-card-body">
      ${cap?`<div class="ig-card-caption">${cap}</div>`:''}
      <div class="ig-card-metrics">
        <div class="ig-card-metric"><div class="ig-card-metric-val">${igFmtS(m.like_count)}</div><div class="ig-card-metric-lbl">Beğeni</div></div>
        <div class="ig-card-metric"><div class="ig-card-metric-val">${igFmtS(m.comments_count)}</div><div class="ig-card-metric-lbl">Yorum</div></div>
        <div class="ig-card-metric"><div class="ig-card-metric-val">${igFmtS(hasVw?m.views:m.reach)}</div><div class="ig-card-metric-lbl">${hasVw?'İzlenme':'Erişim'}</div></div>
        <div class="ig-card-metric"><div class="ig-card-metric-val" style="color:${erCol}">%${er.toFixed(1)}</div><div class="ig-card-metric-lbl">Etk.Oran</div></div>
      </div>
      <div class="ig-card-footer">
        <span class="ig-card-date">${date}</span>
        ${isOwn?`<div class="ig-perf-bar" style="width:56px"><div class="ig-perf-fill" style="width:${perf.toFixed(1)}%"></div></div>`:''}
      </div>
    </div>
  </div>`;
}

function igOnAccount(val) {
  igState.research.active = val==='own' ? null : val;
  igRenderGrid();
}

// ── Detail Drawer ─────────────────────────────────────────────────────
function openIgDetail(idx, src) {
  const isOwn  = src==='own';
  const srcMed = isOwn ? igMedia : (igState.research.data[src]?.media||[]);
  const flrs   = isOwn ? 1 : (igState.research.data[src]?.profile?.followers_count||1);
  const items  = igApplyFilters(srcMed, igState.filters);
  const m      = items[idx]; if (!m) return;
  const TL     = { IMAGE:'Fotoğraf', VIDEO:'Video', CAROUSEL_ALBUM:'Carousel / Albüm', REELS:'Reels' };
  const er     = igEngRate(m, flrs);
  const eng    = igEngTotal(m);
  const thumb  = m.thumbnail_url||m.media_url;
  const canDl  = isOwn && !!m.media_url;
  const inner  = document.getElementById('ig-detail-inner'); if (!inner) return;
  inner.innerHTML = `
    <div class="ig-detail-header">
      <span class="ig-card-type" style="position:static;font-size:10px;padding:3px 8px">${TL[m.media_type]??m.media_type??'—'}</span>
      <button class="ig-detail-close" onclick="closeIgDetail()">✕</button>
    </div>
    ${thumb?`<div class="ig-detail-thumb"><img src="${escHtml(thumb)}" alt="" onerror="this.style.display='none'"></div>`:''}
    <div class="ig-detail-content">
      ${m.caption?`<div class="ig-detail-caption">${escHtml(m.caption)}</div>`:'<div class="ig-detail-caption" style="opacity:.35;font-style:italic">Açıklama yok</div>'}
      <div class="ig-detail-date">${m.published_at?new Date(m.published_at).toLocaleString('tr-TR'):''}</div>
      <div class="ig-detail-metrics">
        <div class="ig-detail-metric"><div class="ig-detail-metric-val">${igFmt(m.like_count)}</div><div class="ig-detail-metric-lbl">Beğeni</div></div>
        <div class="ig-detail-metric"><div class="ig-detail-metric-val">${igFmt(m.comments_count)}</div><div class="ig-detail-metric-lbl">Yorum</div></div>
        ${m.views>0?`<div class="ig-detail-metric"><div class="ig-detail-metric-val">${igFmt(m.views)}</div><div class="ig-detail-metric-lbl">İzlenme</div></div>`:''}
        ${m.reach>0?`<div class="ig-detail-metric"><div class="ig-detail-metric-val">${igFmt(m.reach)}</div><div class="ig-detail-metric-lbl">Erişim</div></div>`:''}
        ${(m.saves||0)>0?`<div class="ig-detail-metric"><div class="ig-detail-metric-val">${igFmt(m.saves)}</div><div class="ig-detail-metric-lbl">Kayıt</div></div>`:''}
        ${(m.shares||0)>0?`<div class="ig-detail-metric"><div class="ig-detail-metric-val">${igFmt(m.shares)}</div><div class="ig-detail-metric-lbl">Paylaşım</div></div>`:''}
        <div class="ig-detail-metric"><div class="ig-detail-metric-val">%${er.toFixed(2)}</div><div class="ig-detail-metric-lbl">Etk. Oranı</div></div>
        <div class="ig-detail-metric"><div class="ig-detail-metric-val">${igFmt(eng)}</div><div class="ig-detail-metric-lbl">Toplam Etk.</div></div>
        ${isOwn&&m.performance_score?`<div class="ig-detail-metric"><div class="ig-detail-metric-val">${(+m.performance_score).toFixed(1)}</div><div class="ig-detail-metric-lbl">Perf. Skoru</div></div>`:''}
      </div>
      <div class="ig-detail-actions">
        ${m.permalink?`<a href="${escHtml(m.permalink)}" target="_blank" rel="noopener" class="btn btn-ghost" style="font-size:12px;text-decoration:none">Instagram'da Aç ↗</a>`:''}
        ${canDl?`<button class="btn btn-ghost" onclick="igDownload('${escHtml(m.media_url)}','${m.media_type}')" style="font-size:12px">⬇ İndir</button>`:''}
      </div>
    </div>`;
  const overlay = document.getElementById('ig-detail-overlay');
  const drawer  = document.getElementById('ig-detail-drawer');
  overlay.style.display = '';
  drawer.style.display  = '';
  setTimeout(()=>drawer.style.transform='translateX(0)',10);
  document.body.style.overflow = 'hidden';
}

function closeIgDetail() {
  const overlay = document.getElementById('ig-detail-overlay');
  const drawer  = document.getElementById('ig-detail-drawer');
  if (overlay) overlay.style.display = 'none';
  if (drawer)  { drawer.style.transform='translateX(100%)'; setTimeout(()=>drawer.style.display='none',260); }
  document.body.style.overflow = '';
}

// ── Download ──────────────────────────────────────────────────────────
async function igDownload(url, mediaType) {
  try {
    const res = await fetch(url, { mode:'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const ext  = (mediaType==='REELS'||mediaType==='VIDEO') ? 'mp4' : 'jpg';
    const obj  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = obj; a.download = `ig-content.${ext}`; a.click();
    setTimeout(()=>URL.revokeObjectURL(obj), 5000);
  } catch { window.open(url,'_blank','noopener'); }
}

// ── Research Modal ────────────────────────────────────────────────────
function openIgResearch() {
  const m = document.getElementById('ig-research-modal');
  if (!m) return;
  m.classList.add('open');
  _igResearchRenderInput();
}
function closeIgResearch() {
  const m = document.getElementById('ig-research-modal');
  if (m) m.classList.remove('open');
}

function _igResearchRenderInput(prefill='') {
  const box = document.getElementById('ig-rm-inner'); if (!box) return;
  const recent = igState.research.accounts;
  box.innerHTML = `
    <div style="padding:24px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--color-text-primary)">Hesap Araştır</div>
          <div style="font-size:12px;color:var(--color-text-muted);margin-top:3px">Business / Creator hesapları araştır</div>
        </div>
        <button onclick="closeIgResearch()" style="background:none;border:none;color:var(--color-text-muted);font-size:18px;cursor:pointer;padding:2px 6px;line-height:1">✕</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input id="ig-ri" class="form-input" placeholder="@kullaniciadi veya kullaniciadi" value="${escHtml(prefill)}"
          style="flex:1" oninput="this.value=this.value.replace(/^@+/,'')" onkeydown="if(event.key==='Enter')_igDoResearch()">
        <button class="btn btn-primary" onclick="_igDoResearch()" style="font-size:13px;padding:8px 18px;white-space:nowrap">Araştır</button>
      </div>
      <div style="font-size:11px;color:var(--color-text-disabled);line-height:1.55;margin-bottom:${recent.length?'14px':'0'}">
        ⚠ Yalnızca <strong style="color:var(--color-text-muted)">Business</strong> veya <strong style="color:var(--color-text-muted)">Creator</strong> türündeki halka açık hesaplar desteklenir.
      </div>
      ${recent.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px">${recent.map(u=>`<button class="btn btn-ghost" onclick="_igLoadAccount('${escHtml(u)}')" style="font-size:11px;padding:4px 10px">@${escHtml(u)}</button>`).join('')}</div>`:''}
      <div id="ig-rr" style="margin-top:16px"></div>
    </div>`;
  setTimeout(()=>document.getElementById('ig-ri')?.focus(),80);
}

async function _igDoResearch() {
  const inp = document.getElementById('ig-ri'); if (!inp) return;
  const username = inp.value.replace(/^@/,'').trim().toLowerCase();
  if (!username) { toast('Kullanıcı adı girin'); return; }
  _igLoadAccount(username);
}

async function _igLoadAccount(username) {
  const rr = document.getElementById('ig-rr'); if (!rr) return;
  const cached = igState.research.data[username];
  if (cached && Date.now()-cached.fetchedAt < 5*60*1000) { _igRenderResult(cached); return; }

  rr.innerHTML = `<div style="text-align:center;padding:40px 0">
    <div class="ig-skel" style="width:56px;height:56px;border-radius:50%;margin:0 auto 14px"></div>
    <div class="ig-skel" style="width:130px;height:13px;border-radius:6px;margin:0 auto 8px"></div>
    <div class="ig-skel" style="width:90px;height:11px;border-radius:6px;margin:0 auto"></div>
  </div>`;

  try {
    const res  = await fetch(IG_RESEARCH_FN, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${SUPABASE_KEY}`},
      body: JSON.stringify({ user_id: currentUser.email, target_username: username }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      const msgs = {
        not_business_account: 'Bu hesap Business/Creator türünde değil — araştırılamıyor.',
        account_not_found:    'Hesap bulunamadı. Kullanıcı adını kontrol edin.',
        no_active_connection: 'Önce kendi Instagram hesabınızı bağlayın.',
        token_expired:        'Instagram bağlantınızın süresi dolmuş. Yeniden bağlayın.',
        api_error:            data.detail || 'API hatası oluştu.',
      };
      rr.innerHTML = `<div class="ig-empty-box" style="padding:20px"><div class="ig-empty-icon">⚠️</div><div class="ig-empty-title" style="color:#e57373">${msgs[data.error]||'Bir hata oluştu.'}</div>${data.code?`<div class="ig-empty-sub" style="font-size:10px">Hata kodu: ${data.code}</div>`:''}</div>`;
      return;
    }
    igState.research.data[username] = { ...data, fetchedAt: Date.now() };
    if (!igState.research.accounts.includes(username)) {
      igState.research.accounts.unshift(username);
      igState.research.accounts = igState.research.accounts.slice(0,8);
      try { localStorage.setItem('ig_ra', JSON.stringify(igState.research.accounts)); } catch {}
    }
    _igRenderResult(igState.research.data[username]);
    igRenderToolbar();
  } catch {
    rr.innerHTML = `<div class="ig-empty-box" style="padding:20px"><div class="ig-empty-icon">❌</div><div class="ig-empty-title">Bağlantı hatası. Tekrar deneyin.</div></div>`;
  }
}

function _igRenderResult(data) {
  const rr = document.getElementById('ig-rr'); if (!rr) return;
  const p = data.profile; const media = data.media||[];
  const TL = { IMAGE:'FOTOĞRAF', VIDEO:'VİDEO', CAROUSEL_ALBUM:'CAROUSEL', REELS:'REELS' };
  const avgL = media.length ? Math.round(media.reduce((s,m)=>s+(m.like_count||0),0)/media.length) : 0;
  const avgC = media.length ? Math.round(media.reduce((s,m)=>s+(m.comments_count||0),0)/media.length) : 0;
  const tc = {}; media.forEach(m=>{ tc[m.media_type]=(tc[m.media_type]||0)+1; });
  const dom = Object.entries(tc).sort((a,b)=>b[1]-a[1])[0];
  rr.innerHTML = `
    <div class="ig-rp-card">
      ${p.profile_picture_url?`<img src="${escHtml(p.profile_picture_url)}" class="ig-rp-avatar" alt="" onerror="this.outerHTML='<div class=ig-rp-avatar-ph>👤</div>'">`:'<div class="ig-rp-avatar-ph">👤</div>'}
      <div style="flex:1;min-width:0">
        <div class="ig-rp-username">@${escHtml(p.username)}</div>
        ${p.name?`<div class="ig-rp-name">${escHtml(p.name)}</div>`:''}
        ${p.biography?`<div class="ig-rp-bio">${escHtml(p.biography.slice(0,140))}</div>`:''}
        <div class="ig-rp-stats">
          <div class="ig-rp-stat"><span>${igFmt(p.followers_count)}</span>Takipçi</div>
          <div class="ig-rp-stat"><span>${igFmt(p.follows_count)}</span>Takip</div>
          <div class="ig-rp-stat"><span>${igFmt(p.media_count)}</span>Gönderi</div>
        </div>
      </div>
    </div>
    ${media.length?`
    <div class="ig-rp-analytics">
      <div class="ig-rp-ana"><div class="ig-rp-ana-val">${igFmtS(avgL)}</div><div class="ig-rp-ana-lbl">Ort. Beğeni</div></div>
      <div class="ig-rp-ana"><div class="ig-rp-ana-val">${igFmtS(avgC)}</div><div class="ig-rp-ana-lbl">Ort. Yorum</div></div>
      <div class="ig-rp-ana"><div class="ig-rp-ana-val">${dom?TL[dom[0]]||dom[0]:'—'}</div><div class="ig-rp-ana-lbl">Baskın Tür</div></div>
      <div class="ig-rp-ana"><div class="ig-rp-ana-val">${media.length}</div><div class="ig-rp-ana-lbl">İçerik</div></div>
    </div>
    <div style="font-size:11px;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Son İçerikler</div>
    <div class="ig-rp-grid">${media.map(m=>{
      const th=m.thumbnail_url||m.media_url;
      return `<div class="ig-rp-item">
        ${th?`<img src="${escHtml(th)}" alt="" onerror="this.style.display='none'">`:'<span>📷</span>'}
        <div class="ig-rp-item-over"><span>❤️${igFmtS(m.like_count)}</span><span>💬${igFmtS(m.comments_count)}</span></div>
        ${m.media_type?`<span class="ig-card-type">${TL[m.media_type]??''}</span>`:''}
      </div>`;
    }).join('')}</div>`:''}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
      <button class="btn btn-ghost" onclick="igLoadResearchInMain('${escHtml(p.username)}')" style="font-size:12px">
        Panele Yükle →
      </button>
    </div>`;
}

function igLoadResearchInMain(username) {
  closeIgResearch();
  igState.research.active = username;
  igRenderToolbar();
  igRenderGrid();
}

// ── Page load ─────────────────────────────────────────────────────────
async function loadInstagramPage() {
  const card = document.getElementById('ig-connection-card');
  if (!card) return;

  const { data: conn } = await sb
    .from('instagram_connections')
    .select('instagram_user_id,instagram_username,instagram_account_name,token_expires_at,is_active,last_synced_at,sync_error')
    .eq('user_id', currentUser.email)
    .maybeSingle();

  igConn = conn;
  _renderIgConnectionCard(card, conn);

  if (!conn?.is_active) {
    document.getElementById('ig-tab-nav').style.display = 'none';
    document.getElementById('ig-analytics-section').style.display = 'none';
    document.getElementById('ig-account-detail-section').style.display = 'none';
    document.getElementById('ig-main-area').style.display = 'none';
    document.getElementById('ig-setup-info').style.display = '';
    return;
  }
  document.getElementById('ig-setup-info').style.display = 'none';
  document.getElementById('ig-tab-nav').style.display = '';

  // Default: analytics tab
  igSwitchTab('analytics');

  // Load media for content tab (background)
  const { data: media } = await sb
    .from('instagram_media').select('*')
    .eq('user_id', currentUser.email)
    .order('published_at',{ascending:false}).limit(50);
  igMedia = media ?? [];

  // Load analytics data
  await loadIgAnalytics();
}

function _renderIgConnectionCard(card, conn) {
  const igSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
  if (!conn?.is_active) {
    card.innerHTML = `<div class="ig-connect-card"><div class="ig-brand"><div class="ig-brand-icon">${igSvg}</div><div><div class="ig-brand-name">Instagram<span class="ig-status disconnected"><span class="ig-status-dot"></span>Bağlı değil</span></div><div class="ig-brand-sub">Business veya Creator hesabını bağla</div></div></div><div class="ig-connect-actions"><button class="btn btn-primary" onclick="connectInstagram()" style="font-size:13px;padding:8px 18px">+ Instagram Bağla</button></div></div>`;
    return;
  }
  const expired        = conn.token_expires_at && new Date(conn.token_expires_at) < new Date();
  const needsReconnect = conn.sync_error === 'requires_reconnect' || expired;
  const statusHtml = needsReconnect
    ? `<span class="ig-status expired"><span class="ig-status-dot"></span>${expired ? 'Süre doldu' : 'İzin eksik — yeniden bağla'}</span>`
    : `<span class="ig-status connected"><span class="ig-status-dot"></span>Bağlı</span>`;
  const username  = conn.instagram_username ? `@${escHtml(conn.instagram_username)}` : '—';
  const name      = conn.instagram_account_name ? escHtml(conn.instagram_account_name) : '';
  const lastSync  = conn.last_synced_at ? new Date(conn.last_synced_at).toLocaleString('tr-TR') : 'Henüz senkronize edilmedi';
  const warningHtml = (conn.sync_error === 'requires_reconnect')
    ? `<div style="font-size:11.5px;color:#f59e0b;margin-top:4px">⚠️ Instagram bağlantısını yenilemeniz gerekiyor (izin eksik).</div>`
    : '';
  card.innerHTML  = `<div class="ig-connect-card connected"><div class="ig-brand"><div class="ig-brand-icon">${igSvg}</div><div><div class="ig-brand-name">${username}${statusHtml}</div>${name?`<div class="ig-brand-sub">${name}</div>`:''}<div class="ig-last-sync">Son sync: ${lastSync}</div>${warningHtml}</div></div><div class="ig-connect-actions">${needsReconnect?`<button class="btn btn-primary" onclick="connectInstagram()" style="font-size:12px;padding:7px 16px">↺ Yeniden Bağla</button>`:`<button class="btn btn-ghost" id="ig-sync-btn" onclick="syncInstagram()" style="font-size:12px;padding:7px 14px">↻ Senkronize Et</button>`}<button class="btn btn-ghost" onclick="disconnectInstagram()" style="font-size:12px;padding:7px 14px;color:var(--color-text-muted)">Bağlantıyı Kaldır</button></div></div>`;
}

function _renderIgAccountDetail(snap) {
  const detail = document.getElementById('ig-account-detail'); if (!detail) return;
  const stats = [
    ['Takipçi', snap.follower_count], ['Takip', snap.follows_count], ['İçerik', snap.media_count],
    ['Erişim', snap.reach], ['Gösterim', snap.impressions], ['Profil Görüntüleme', snap.profile_views],
  ].filter(([,v]) => v != null);
  detail.innerHTML = `<div class="ig-account-detail">${stats.map(([l,v],i)=>`${i>0?'<div class="ig-account-divider"></div>':''}<div class="ig-account-stat"><div class="ig-account-stat-val">${igFmt(v)}</div><div class="ig-account-stat-lbl">${l}</div></div>`).join('')}</div>`;
}

// ── Analytics Dashboard ───────────────────────────────────────────────
let igAnSnaps = [];
let igFollowersChart = null;
let igReachChart = null;
const igAnState = { growthPeriod: 7, reachPeriod: 7 };

function igSwitchTab(tab) {
  ['analytics','content'].forEach(t => {
    const btn = document.getElementById(`ig-tab-btn-${t}`);
    if (btn) btn.className = 'ig-tab-btn' + (t === tab ? ' active' : '');
  });
  document.getElementById('ig-analytics-section').style.display     = tab === 'analytics' ? '' : 'none';
  document.getElementById('ig-main-area').style.display             = tab === 'content'   ? '' : 'none';
  document.getElementById('ig-account-detail-section').style.display = tab === 'content'  ? '' : 'none';

  if (tab === 'content' && igConn?.is_active) {
    const { data: snap } = sb
      .from('instagram_account_snapshots').select('*')
      .eq('user_id', currentUser.email)
      .order('snapshot_date',{ascending:false}).limit(1).maybeSingle()
      .then(({ data }) => { if (data) { _renderIgAccountDetail(data); document.getElementById('ig-account-detail-section').style.display = ''; } });
    igRenderToolbar();
    igRenderGrid();
  }
}

async function loadIgAnalytics() {
  const since90 = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  const [{ data: snaps }, { data: media }] = await Promise.all([
    sb.from('instagram_account_snapshots')
      .select('snapshot_date,follower_count,follows_count,media_count,reach,impressions,profile_views,website_clicks,phone_call_clicks,email_contacts,total_interactions')
      .eq('user_id', currentUser.email)
      .gte('snapshot_date', since90)
      .order('snapshot_date', { ascending: true }),
    sb.from('instagram_media').select('*')
      .eq('user_id', currentUser.email)
      .order('published_at', { ascending: false })
      .limit(50),
  ]);
  igAnSnaps = snaps ?? [];
  igMedia   = media ?? [];

  igRenderAnKPIs();
  igRenderPerfTable();
  igRenderPerformers();
  loadIgAdsSection();

  try {
    await igLoadChartJs();
    igRenderFollowersChart();
  } catch(e) {  }
}

function igRenderAnKPIs() {
  const grid = document.getElementById('ig-an-kpi-grid');
  if (!grid) return;
  const snaps    = igAnSnaps;
  const latest   = snaps.at(-1) ?? {};
  const prev1    = snaps.at(-2) ?? null;
  const followers = latest.follower_count ?? null;
  const chgDay   = prev1 != null && followers != null ? followers - (prev1.follower_count ?? followers) : null;
  const lastSync = igConn?.last_synced_at
    ? new Date(igConn.last_synced_at).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : null;

  const fmt  = n => n == null ? '—' : n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : Number(n).toLocaleString('tr-TR');
  const fmtD = n => n == null ? '—' : (n > 0 ? '+' : '') + fmt(n);
  const dc   = n => n == null ? 'flat' : n > 0 ? 'up' : n < 0 ? 'down' : 'flat';

  const cards = [
    { label:'Takipçi', val: followers != null ? fmt(followers) : '—',
      delta: chgDay != null ? `<span class="ig-an-kpi-delta ${dc(chgDay)}">${fmtD(chgDay)} bugün</span>` : `<span class="ig-an-kpi-na">Veri yok</span>` },
    { label:'Son Sync', val: lastSync ?? '—', delta: '' },
  ];
  grid.innerHTML = cards.map(c => `
    <div class="ig-an-kpi-card">
      <div class="ig-an-kpi-label">${c.label}</div>
      <div class="ig-an-kpi-val">${c.val}</div>
      ${c.delta}
    </div>`).join('');
}

async function igLoadChartJs() {
  if (window.Chart) return;
  await new Promise((res,rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function igChartDefaults() {
  const bg = getComputedStyle(document.body).backgroundColor;
  const rgb = bg.match(/\d+/g)?.map(Number) ?? [255,255,255];
  const brightness = (rgb[0]*299 + rgb[1]*587 + rgb[2]*114) / 1000;
  const isDark = brightness < 128;
  return {
    gridColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    tickColor: isDark ? 'rgba(255,255,255,0.55)'  : 'rgba(0,0,0,0.5)',
    accent: '#6366f1', blue: '#3b82f6', orange: '#f59e0b', green: '#22c55e',
  };
}

function igRenderFollowersChart() {
  const canvas = document.getElementById('ig-followers-chart');
  if (!canvas || !window.Chart) return;
  const snaps = igAnSnaps.slice(-igAnState.growthPeriod);
  if (!snaps.length) {
    canvas.parentElement.innerHTML = '<div class="ig-chart-empty">Yeterli veri yok</div>'; return;
  }
  const C = igChartDefaults();
  const labels    = snaps.map(s => new Date(s.snapshot_date).toLocaleDateString('tr-TR',{day:'numeric',month:'short'}));
  const followers = snaps.map(s => s.follower_count ?? null);
  if (igFollowersChart) igFollowersChart.destroy();
  igFollowersChart = new Chart(canvas, {
    type:'line',
    data:{ labels, datasets:[{ label:'Takipçi', data:followers,
      borderColor:C.accent, backgroundColor:C.accent+'18', fill:true, tension:.4, pointRadius:3, pointHoverRadius:5 }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{mode:'index',intersect:false} },
      scales:{
        x:{ grid:{color:C.gridColor}, ticks:{color:C.tickColor,maxTicksLimit:7,font:{size:10}} },
        y:{ grid:{color:C.gridColor}, ticks:{color:C.tickColor,font:{size:10}} },
      }
    }
  });
}

function igRenderReachChart() {
  const wrap   = document.getElementById('ig-reach-chart-wrap');
  const canvas = document.getElementById('ig-reach-chart');
  if (!wrap || !canvas || !window.Chart) return;
  const snaps = igAnSnaps.slice(-igAnState.reachPeriod);
  const hasData = snaps.some(s => (s.reach ?? 0) > 0 || (s.impressions ?? 0) > 0);
  if (!hasData) {
    wrap.innerHTML = '<div class="ig-chart-empty">Bu hesap için erişim/gösterim verisi mevcut değil.<br>Veriler bir sonraki sync sonrası görünür.</div>'; return;
  }
  const C = igChartDefaults();
  const labels     = snaps.map(s => new Date(s.snapshot_date).toLocaleDateString('tr-TR',{day:'numeric',month:'short'}));
  const reach      = snaps.map(s => s.reach       ?? null);
  const impressions= snaps.map(s => s.impressions  ?? null);
  if (igReachChart) igReachChart.destroy();
  igReachChart = new Chart(canvas, {
    type:'bar',
    data:{ labels, datasets:[
      { label:'Erişim',   data:reach,       backgroundColor:C.blue  +'cc', borderRadius:3 },
      { label:'Gösterim', data:impressions, backgroundColor:C.orange+'cc', borderRadius:3 },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:true, labels:{color:C.tickColor,font:{size:11}}}, tooltip:{mode:'index',intersect:false} },
      scales:{
        x:{ grid:{color:C.gridColor}, ticks:{color:C.tickColor,maxTicksLimit:7,font:{size:10}} },
        y:{ grid:{color:C.gridColor}, ticks:{color:C.tickColor,font:{size:10}} },
      }
    }
  });
}

function igSetGrowthPeriod(p, btn) {
  igAnState.growthPeriod = p;
  btn.closest('.ig-chart-pills').querySelectorAll('.ig-chart-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  igRenderFollowersChart();
}

function igSetReachPeriod(p, btn) {
  igAnState.reachPeriod = p;
  btn.closest('.ig-chart-pills').querySelectorAll('.ig-chart-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  igRenderReachChart();
}

function igRenderPerfTable() {
  const tbody = document.getElementById('ig-perf-tbody');
  if (!tbody) return;
  let media = [...igMedia];
  const typeFilter = document.getElementById('ig-table-type')?.value ?? 'all';
  const sortBy     = document.getElementById('ig-table-sort')?.value ?? 'newest';
  if (typeFilter !== 'all') media = media.filter(m => m.media_type === typeFilter);
  media.sort((a,b) => {
    if (sortBy === 'newest')          return new Date(b.published_at) - new Date(a.published_at);
    if (sortBy === 'most_views')      return (b.views ?? 0) - (a.views ?? 0);
    if (sortBy === 'most_reach')      return (b.reach ?? 0) - (a.reach ?? 0);
    if (sortBy === 'most_engagement') return ((b.like_count??0)+(b.comments_count??0)+(b.saves??0))-((a.like_count??0)+(a.comments_count??0)+(a.saves??0));
    if (sortBy === 'top_eng_rate')    return (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0);
    return 0;
  });
  if (!media.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--color-text-muted)">İçerik bulunamadı</td></tr>`; return;
  }
  const na = `<span style="color:var(--color-text-muted)">—</span>`;
  const fmt = n => n != null && n > 0 ? (n >= 1000 ? (n/1000).toFixed(1)+'K' : n.toLocaleString('tr-TR')) : na;
  tbody.innerHTML = media.slice(0,30).map(m => {
    const thumb = m.thumbnail_url || m.media_url;
    const date  = m.published_at ? new Date(m.published_at).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'2-digit'}) : '—';
    const cap   = (m.caption ?? '').slice(0,50) + ((m.caption?.length ?? 0) > 50 ? '…' : '');
    const badge = `<span class="ig-type-badge ig-type-${m.media_type}">${m.media_type === 'CAROUSEL_ALBUM' ? 'CAR.' : m.media_type}</span>`;
    const engR  = m.engagement_rate != null ? `%${Number(m.engagement_rate).toFixed(2)}` : na;
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:10px;min-width:150px">
        ${thumb ? `<img class="ig-perf-thumb" src="${escHtml(thumb)}" alt="" loading="lazy" onerror="this.style.opacity=0">` : `<div class="ig-perf-thumb"></div>`}
        <span style="font-size:11px;color:var(--color-text-muted);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(m.caption??'')}}">${escHtml(cap)}</span>
      </div></td>
      <td>${badge}</td>
      <td style="white-space:nowrap;font-size:11px">${date}</td>
      <td>${fmt(m.like_count)}</td>
      <td>${fmt(m.comments_count)}</td>
      <td>${fmt(m.views)}</td>
      <td>${fmt(m.reach)}</td>
      <td style="font-weight:500">${engR}</td>
      <td>${m.permalink ? `<a href="${escHtml(m.permalink)}" target="_blank" rel="noopener" style="color:var(--color-accent);font-size:13px">↗</a>` : ''}</td>
    </tr>`;
  }).join('');
}

function igRenderPerformers() {
  const withScore = [...igMedia].filter(m => (m.performance_score ?? 0) > 0);
  const top5    = [...withScore].sort((a,b) => b.performance_score - a.performance_score).slice(0,5);
  const bottom5 = [...withScore].sort((a,b) => a.performance_score - b.performance_score).slice(0,5);
  const renderList = (items, elId) => {
    const el = document.getElementById(elId); if (!el) return;
    if (!items.length) { el.innerHTML = `<div style="font-size:12px;color:var(--color-text-muted);padding:8px 0">Yeterli veri yok</div>`; return; }
    el.innerHTML = items.map((m,i) => {
      const thumb = m.thumbnail_url || m.media_url;
      const cap   = (m.caption ?? m.media_type ?? '').slice(0,60);
      const date  = m.published_at ? new Date(m.published_at).toLocaleDateString('tr-TR',{day:'numeric',month:'short'}) : '';
      return `<div class="ig-pf-item">
        <span class="ig-pf-rank">${i+1}</span>
        ${thumb ? `<img class="ig-pf-thumb" src="${escHtml(thumb)}" alt="" loading="lazy" onerror="this.style.opacity=0">` : `<div class="ig-pf-thumb"></div>`}
        <div class="ig-pf-info">
          <div class="ig-pf-caption">${escHtml(cap) || '(caption yok)'}</div>
          <div class="ig-pf-meta">${m.media_type} · ${date}</div>
        </div>
        <span class="ig-pf-score">${Number(m.performance_score).toFixed(1)}</span>
      </div>`;
    }).join('');
  };
  renderList(top5,    'ig-top5');
  renderList(bottom5, 'ig-bottom5');
}

function igRenderDataStatus() {
  const grid = document.getElementById('ig-ds-grid'); if (!grid) return;
  const s = igAnSnaps; const m = igMedia;
  const checks = [
    { label:'Takipçi sayısı',     ok: s.some(x => (x.follower_count ?? 0) > 0) },
    { label:'Günlük erişim',      ok: s.some(x => (x.reach         ?? 0) > 0) },
    { label:'Gösterim verisi',    ok: s.some(x => (x.impressions    ?? 0) > 0) },
    { label:'Profil görüntüleme', ok: s.some(x => (x.profile_views  ?? 0) > 0) },
    { label:'Web tıklamaları',    ok: s.some(x => (x.website_clicks ?? 0) > 0) },
    { label:'Telefon tıklamaları',ok: s.some(x => (x.phone_call_clicks ?? 0) > 0) },
    { label:'E-posta tıklamaları',ok: s.some(x => (x.email_contacts ?? 0) > 0) },
    { label:'İçerik verisi',      ok: m.length > 0 },
    { label:'İçerik erişimi',     ok: m.some(x => (x.reach   ?? 0) > 0) },
    { label:'İçerik izlenme',     ok: m.some(x => (x.views   ?? 0) > 0) },
    { label:'Kaydetme sayısı',    ok: m.some(x => (x.saves   ?? 0) > 0) },
    { label:'Paylaşım sayısı',    ok: m.some(x => (x.shares  ?? 0) > 0) },
  ];
  grid.innerHTML = checks.map(c => `
    <div class="ig-ds-item">
      <span class="ig-ds-dot ${c.ok ? 'ok' : 'na'}"></span>
      <span style="color:${c.ok ? 'var(--color-text-primary)' : 'var(--color-text-muted)'}">${c.label}${c.ok ? '' : ' <small>(mevcut değil)</small>'}</span>
    </div>`).join('');
}

// ── Meta Ads Section ──────────────────────────────────────────────────
let igAdsData   = [];
let igAdsChart  = null;

// Persisted set of hidden account IDs
let igAdsHidden  = new Set(JSON.parse(localStorage.getItem('ig_ads_hidden') || '[]'));
let igAdsPeriod  = 'today'; // 'today' | 'yesterday' | '7d'
let igAdsSnaps   = [];      // instagram_account_snapshots for CPF calculation

async function loadIgAdsSection() {
  const content = document.getElementById('ig-ads-content'); if (!content) return;
  const since7  = new Date(Date.now() - 7  * 86400000).toISOString().split('T')[0];
  const since14 = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];

  const [{ data: rows }, { data: snaps }] = await Promise.all([
    sb.from('meta_ad_insights')
      .select('insight_date,account_id,account_name,spend,currency')
      .eq('user_id', currentUser.email)
      .gte('insight_date', since7)
      .order('insight_date', { ascending: true }),
    sb.from('instagram_account_snapshots')
      .select('snapshot_date,follower_count')
      .eq('user_id', currentUser.email)
      .gte('snapshot_date', since14)   // 14 days for reliable baselines
      .order('snapshot_date', { ascending: true }),
  ]);

  igAdsData  = rows  ?? [];
  igAdsSnaps = snaps ?? [];

  if (!igAdsData.length) {
    content.innerHTML = `
      <div style="padding:16px 0;color:#555;font-size:13px;line-height:1.7">
        Henüz reklam verisi yok.<br>
        <span style="font-size:12px">
          <strong style="color:#888">↺ Yeniden Bağla</strong> ile OAuth'u yenileyin,
          ardından <em>Senkronize Et</em>'e tıklayın.
        </span>
      </div>`;
    return;
  }

  const currency  = igAdsData.find(r => r.currency)?.currency ?? 'TRY';
  const allAccts  = [...new Map(igAdsData.map(r => [r.account_id, r.account_name || r.account_id])).entries()];

  const badgeHtml = allAccts.map(([id, name]) => {
    const hidden = igAdsHidden.has(id);
    return `<span onclick="igAdsToggleAccount('${id}',this)" data-acct="${id}"
      style="font-size:11px;padding:3px 10px;border-radius:4px;cursor:pointer;user-select:none;transition:all 0.15s;
        background:${hidden?'transparent':'#2a2a2a'};color:${hidden?'#444':'#ccc'};
        border:1px solid ${hidden?'#2a2a2a':'#555'};text-decoration:${hidden?'line-through':'none'}"
    >${escHtml(name)}</span>`;
  }).join('');

  const periodBtn = (val, label) => {
    const active = igAdsPeriod === val;
    return `<button onclick="igAdsSetPeriod('${val}')" data-period="${val}"
      style="padding:4px 12px;font-size:11px;border-radius:5px;cursor:pointer;font-family:inherit;transition:all 0.15s;
        border:1px solid ${active?'#666':'#2a2a2a'};background:${active?'#2a2a2a':'transparent'};color:${active?'#fff':'#555'}"
    >${label}</button>`;
  };

  content.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px">
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;flex:1">
        <span style="font-size:12px;color:#555;margin-right:2px">Hesaplar:</span>${badgeHtml}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0" id="ig-ads-period-btns">
        ${periodBtn('today','Bugün')}${periodBtn('yesterday','Dün')}${periodBtn('7d','Son 7 Gün')}
      </div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px" id="ig-ads-kpi-row"></div>
    <div class="ig-chart-card" style="margin-bottom:0">
      <div class="ig-chart-header"><span class="ig-chart-title" id="ig-ads-chart-title">Günlük Harcama (${currency})</span></div>
      <div class="ig-chart-canvas-wrap"><canvas id="ig-ads-chart"></canvas></div>
    </div>`;

  igAdsRenderMetrics();
}

function igAdsSetPeriod(val) {
  igAdsPeriod = val;
  document.querySelectorAll('[data-period]').forEach(b => {
    const active = b.dataset.period === val;
    b.style.borderColor = active ? '#666' : '#2a2a2a';
    b.style.background  = active ? '#2a2a2a' : 'transparent';
    b.style.color       = active ? '#fff' : '#555';
  });
  igAdsRenderMetrics();
}

function igAdsToggleAccount(id, el) {
  if (igAdsHidden.has(id)) {
    igAdsHidden.delete(id);
    el.style.background = '#2a2a2a'; el.style.color = '#ccc';
    el.style.borderColor = '#555'; el.style.textDecoration = 'none';
  } else {
    igAdsHidden.add(id);
    el.style.background = 'transparent'; el.style.color = '#444';
    el.style.borderColor = '#2a2a2a'; el.style.textDecoration = 'line-through';
  }
  localStorage.setItem('ig_ads_hidden', JSON.stringify([...igAdsHidden]));
  igAdsRenderMetrics();
}

function igAdsRenderMetrics() {
  const kpiRow = document.getElementById('ig-ads-kpi-row'); if (!kpiRow) return;
  const currency = igAdsData.find(r => r.currency)?.currency ?? 'TRY';
  const sym      = currency === 'TRY' ? '₺' : '$';
  const fmtCur   = n => (+n).toLocaleString('tr-TR', { minimumFractionDigits:2, maximumFractionDigits:2 });

  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Determine which dates to include for spend
  const visible = igAdsData.filter(r => !igAdsHidden.has(r.account_id));
  let filtered;
  if      (igAdsPeriod === 'today')     filtered = visible.filter(r => r.insight_date === today);
  else if (igAdsPeriod === 'yesterday') filtered = visible.filter(r => r.insight_date === yesterday);
  else                                  filtered = visible; // 7d

  const totalSpend = filtered.reduce((s, r) => s + +r.spend, 0);

  // Cost per follower: spend / follower delta
  const sortedSnaps = [...igAdsSnaps].sort((a,b) => a.snapshot_date.localeCompare(b.snapshot_date));

  let followerGain = null;
  let followerSub  = 'veri yok';

  // Period-boundary calculation: end snap vs start snap
  const snapBefore = date => [...sortedSnaps].reverse().find(s => s.snapshot_date <= date) ?? null;

  let endSnap, startSnap;
  if (igAdsPeriod === '7d') {
    endSnap   = sortedSnaps.at(-1) ?? null;
    startSnap = sortedSnaps[0]     ?? null;
  } else {
    const endDate   = igAdsPeriod === 'today' ? today : yesterday;
    const startDate = igAdsPeriod === 'today'
      ? yesterday
      : new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    endSnap   = snapBefore(endDate);
    startSnap = snapBefore(startDate);
  }

  if (endSnap && startSnap && endSnap.snapshot_date !== startSnap.snapshot_date) {
    followerGain = endSnap.follower_count - startSnap.follower_count;
    followerSub  = `${startSnap.snapshot_date} → ${endSnap.snapshot_date}`;
  }

  const cpf = (followerGain != null && followerGain > 0) ? totalSpend / followerGain : null;
  const periodLabel = igAdsPeriod === 'today' ? 'bugün' : igAdsPeriod === 'yesterday' ? 'dün' : 'son 7 gün';

  const card = (label, val, sub, highlight = false) => `
    <div class="ig-an-kpi-card" style="flex:1;min-width:160px${highlight?' border-color:rgba(99,102,241,0.3)':''}">
      <div class="ig-an-kpi-label">${label}</div>
      <div class="ig-an-kpi-val">${val}</div>
      <span class="ig-an-kpi-delta flat">${sub}</span>
    </div>`;

  kpiRow.innerHTML =
    card('Toplam Harcama', `${sym}${fmtCur(totalSpend)}`, periodLabel) +
    card('Takipçi Kazanımı',
      followerGain != null ? (followerGain >= 0 ? `+${followerGain.toLocaleString('tr-TR')}` : followerGain.toLocaleString('tr-TR')) : '—',
      followerGain != null ? followerSub : 'IG snapshot yok') +
    card('Takipçi Başına Maliyet',
      cpf != null ? `${sym}${fmtCur(cpf)}` : '—',
      cpf != null ? 'harcama / kazanım' : followerGain === 0 ? 'takipçi artışı yok' : 'IG snapshot yok',
      true);

  // Chart — always show 7-day daily bars regardless of period filter
  const all7 = visible;
  const byDate = {};
  for (const r of all7) {
    byDate[r.insight_date] = (byDate[r.insight_date] ?? 0) + +r.spend;
  }
  const dates  = Object.keys(byDate).sort();
  const spends = dates.map(d => +byDate[d].toFixed(2));

  const titleEl = document.getElementById('ig-ads-chart-title');
  if (titleEl) titleEl.textContent = `Günlük Harcama (${currency})`;

  igLoadChartJs().then(() => {
    const canvas = document.getElementById('ig-ads-chart');
    if (!canvas || !window.Chart) return;
    const C = igChartDefaults();

    // Highlight selected day(s) in chart
    const highlightDate = igAdsPeriod === 'today' ? today : igAdsPeriod === 'yesterday' ? yesterday : null;
    const bgColors = dates.map(d => d === highlightDate ? C.orange : C.orange+'55');

    if (igAdsChart) igAdsChart.destroy();
    igAdsChart = new Chart(canvas, {
      type: 'bar',
      data: { labels: dates.map(d => new Date(d).toLocaleDateString('tr-TR', { day:'numeric', month:'short' })),
        datasets: [{ label:`Harcama (${currency})`, data: spends,
          backgroundColor: bgColors, borderColor: C.orange, borderWidth:1, borderRadius:4 }] },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{mode:'index',intersect:false} },
        scales:{
          x:{ grid:{color:C.gridColor}, ticks:{color:C.tickColor,font:{size:10}} },
          y:{ grid:{color:C.gridColor}, ticks:{color:C.tickColor,font:{size:10}} },
        }
      }
    });
  }).catch(e =>
}

// ── Daily KPI strip on the daily page ────────────────────────────────
async function loadIgDailyKPIs() {
  const section = document.getElementById('ig-kpi-section');
  if (!section) return;

  // Check if connection exists and is active
  const { data: conn } = await sb
    .from('instagram_connections')
    .select('is_active,instagram_username')
    .eq('user_id', currentUser.email)
    .eq('is_active', true)
    .maybeSingle();

  if (!conn) { section.style.display = 'none'; return; }

  // Fetch last 31 days of snapshots
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const { data: snaps } = await sb
    .from('instagram_account_snapshots')
    .select('snapshot_date,follower_count,reach,impressions,profile_views')
    .eq('user_id', currentUser.email)
    .gte('snapshot_date', since30)
    .order('snapshot_date', { ascending: false });

  if (!snaps?.length) { section.style.display = 'none'; return; }

  const latest = snaps[0];
  const yesterday = snaps[1] ?? null;
  const week7ago  = snaps.find(s => {
    const d = new Date(s.snapshot_date);
    return d <= new Date(Date.now() - 7 * 86400000);
  });

  const followers = latest.follower_count ?? 0;
  const chgDay    = yesterday ? followers - (yesterday.follower_count ?? 0) : null;
  const chg7d     = week7ago  ? followers - (week7ago.follower_count   ?? 0) : null;
  const reach30d  = snaps.reduce((a, s) => a + (s.reach ?? 0), 0);

  // Fetch last 10 media for avg engagement rate
  const { data: media10 } = await sb
    .from('instagram_media')
    .select('engagement_rate')
    .eq('user_id', currentUser.email)
    .order('published_at', { ascending: false })
    .limit(10);
  const avgEng = media10?.length
    ? (media10.reduce((a, m) => a + (m.engagement_rate ?? 0), 0) / media10.length).toFixed(2)
    : null;

  // ── Render ──
  const fmtN = (n) => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : n?.toLocaleString('tr-TR') ?? '—';
  const fmtChg = (v, el) => {
    if (!el || v === null) return;
    el.textContent = v > 0 ? `+${v.toLocaleString('tr-TR')}` : v.toLocaleString('tr-TR');
    el.className = 'ig-kpi-change ' + (v > 0 ? 'up' : v < 0 ? 'down' : 'flat');
  };

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('ig-kpi-followers',    fmtN(followers));
  set('ig-kpi-7d-growth',    chg7d !== null ? fmtN(chg7d) : '—');
  set('ig-kpi-reach',        fmtN(reach30d));
  set('ig-kpi-eng',          avgEng !== null ? `%${avgEng}` : '—');

  fmtChg(chgDay, document.getElementById('ig-kpi-followers-chg'));
  if (chg7d !== null) {
    const el = document.getElementById('ig-kpi-7d-chg');
    if (el) { el.textContent = 'son 7 gün'; el.className = 'ig-kpi-change flat'; }
  }

  section.style.display = '';
}


// ============================================================
//  IMPLEMENTATION CHECKLIST
// ============================================================
/*
  Required Supabase tables (run once in SQL editor):

  -- program_phases: id, title, order_index (already exists)
  -- program_tasks: id, phase_id, title, description, order_index, is_visible
  --   NOTE: program_tasks now references program_phases directly (no weeks layer).
  --   Run migration if upgrading from week-based schema:
  --     alter table program_tasks add column if not exists phase_id uuid references program_phases(id) on delete cascade;
  --     alter table program_tasks add column if not exists description text;
  --     alter table program_tasks add column if not exists is_visible boolean not null default true;
  --   Run migration for metadata columns (added 2026-04):
  --     alter table program_tasks add column if not exists konu text;
  --     alter table program_tasks add column if not exists seviye text;
  --     alter table program_tasks add column if not exists cikti text;
  --     alter table program_tasks add column if not exists source_label text;
  --     alter table program_tasks add column if not exists source_url text;
  -- program_task_progress: id, user_id (email), task_id, status ('done'|'undone'), updated_at
  --   unique(user_id, task_id)

  create table if not exists program_phases (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    order_index int not null default 0
  );
  -- insert into program_phases (title, order_index) values
  --   ('Oryantasyon, Vizyon ve Model', 1),
  --   ('Genel Kurulumlar', 2),
  --   ('İçerik Ekosistemi', 3),
  --   ('Satış ve Rakamlar', 4);

  create table if not exists program_tasks (
    id uuid primary key default gen_random_uuid(),
    phase_id uuid references program_phases(id) on delete cascade,
    title text not null,
    description text,
    order_index int not null default 0,
    is_visible boolean not null default true
  );

  create table if not exists program_task_progress (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    task_id uuid references program_tasks(id) on delete cascade,
    status text not null default 'undone',
    updated_at timestamptz default now(),
    unique(user_id, task_id)
  );
*/

/*
  onboarding_leads tablosu (Supabase'de çalıştır):

  create table if not exists onboarding_leads (
    id          bigserial primary key,
    name        text not null,
    email       text not null,
    note        text,
    status      text not null default 'Bekliyor',
    offer_id    bigint references offers(id) on delete set null,
    created_at  timestamptz not null default now(),
    approved_at timestamptz
  );

  -- RLS politikaları:
  alter table onboarding_leads enable row level security;
  create policy "admin_all" on onboarding_leads
    for all using (true) with check (true);
*/

// ── State ─────────────────────────────────────────────────────
const implState = {
  phases: [],    // [{id, title, order_index}]
  tasks: [],     // [{id, phase_id, title, description, order_index, is_visible}]
  progress: {},  // { task_id: 'done'|'undone' }
  loaded: false,
};

// ── Supabase helpers ──────────────────────────────────────────
// Shared structure (phases/tasks) is admin-defined; read-only for regular users.
// Only program_task_progress is user-specific — keyed by currentUser.email.

async function implLoadAll() {
  const userEmail = currentUser?.email;
  if (!userEmail) return;

  const [phRes, tRes, pRes] = await Promise.all([
    sb.from('program_phases').select('*').order('order_index'),
    sb.from('program_tasks').select('*').order('order_index'),
    sb.from('program_task_progress').select('task_id,status').eq('user_id', userEmail),
  ]);

  implState.phases   = phRes.data ?? [];
  implState.tasks    = tRes.data ?? [];
  implState.progress = {};
  for (const r of (pRes.data ?? [])) implState.progress[r.task_id] = r.status;
  implState.loaded   = true;
}

async function implToggleTask(taskId) {
  const userEmail = currentUser?.email;
  if (!userEmail) return;
  const current = implState.progress[taskId] ?? 'undone';
  const next = current === 'done' ? 'undone' : 'done';
  // Optimistic update
  implState.progress[taskId] = next;
  // Re-render just progress numbers without full rebuild to keep DOM stable
  implRenderOverall();
  implRefreshPhaseProgress();
  // Persist — writes only to this user's own progress row
  await sb.from('program_task_progress').upsert(
    { user_id: userEmail, task_id: taskId, status: next, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,task_id' }
  );
}

// ── Progress calc ─────────────────────────────────────────────
function implCalcProgress(taskIds) {
  if (!taskIds.length) return { done: 0, total: 0, pct: 0 };
  const done = taskIds.filter(id => (implState.progress[id] ?? 'undone') === 'done').length;
  return { done, total: taskIds.length, pct: Math.round(done / taskIds.length * 100) };
}

function implVisibleTasksForPhase(phaseId) {
  return implState.tasks.filter(t => t.phase_id === phaseId && t.is_visible !== false);
}

// ── Render ────────────────────────────────────────────────────
function implRenderTaskRow(task) {
  const isDone = (implState.progress[task.id] ?? 'undone') === 'done';
  const isAdmin = currentUser?.role === 'admin';

  const adminBtns = isAdmin ? `<div class="impl-task-admin" onclick="event.stopPropagation()">
    <button onclick="openImplTaskModal('${task.phase_id}','${task.id}')" class="eg-pill-btn">düzenle</button>
    <button onclick="deleteImplTask('${task.id}')" class="eg-pill-btn red">sil</button>
  </div>` : '';

  // Metadata badges
  const konuBadge   = task.konu   ? `<span class="impl-badge impl-badge-konu">${escHtml(task.konu)}</span>`   : '';
  const seviyeBadge = task.seviye ? `<span class="impl-badge impl-badge-seviye">${escHtml(task.seviye)}</span>` : '';
  const ciktiBadge  = task.cikti  ? `<span class="impl-badge impl-badge-cikti">${escHtml(task.cikti)}</span>`  : '';
  const kaynakHtml = task.source_url
    ? `<a href="${escHtml(task.source_url)}" target="_blank" class="impl-source-link">${escHtml(task.source_label || task.source_url)}</a>`
    : task.source_label
      ? `<span class="impl-source-text">${escHtml(task.source_label)}</span>`
      : '';

  return `<div class="impl-task-row ${isDone ? 'impl-done' : ''}" id="impl-tr-${task.id}" data-task-id="${task.id}">
    <div class="impl-task-check-col">
      <div class="impl-checkbox ${isDone ? 'checked' : ''}" id="impl-cb-${task.id}" onclick="implToggleTask('${task.id}')">
        ${isDone ? '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6l3 3 5-5"/></svg>' : ''}
      </div>
    </div>
    <div class="impl-task-main">
      <div class="impl-task-title ${isDone ? 'impl-title-done' : ''}">${escHtml(task.title)}</div>
      ${task.description ? `<div class="impl-task-desc">${escHtml(task.description)}</div>` : ''}
    </div>
    <div class="impl-task-meta">
      ${seviyeBadge}${konuBadge}${ciktiBadge}
    </div>
    <div class="impl-task-source">${kaynakHtml}</div>
    ${adminBtns}
  </div>`;
}

function implRenderPhase(phase, idx) {
  const tasks = implVisibleTasksForPhase(phase.id);
  const taskIds = tasks.map(t => t.id);
  const { done, total, pct } = implCalcProgress(taskIds);
  const bodyId = `impl-mb-${phase.id}`;
  const isAdmin = currentUser?.role === 'admin';
  const phaseLabel = `<span style="font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:var(--color-brand);opacity:0.75;flex-shrink:0">Faz ${idx + 1}</span><span style="color:rgba(255,255,255,0.2);margin:0 6px;font-size:11px">·</span>`;

  const tasksHtml = tasks.length
    ? tasks.map(t => implRenderTaskRow(t)).join('')
    : `<div style="padding:12px 16px 12px 48px;font-size:12px;color:rgba(255,255,255,0.2)">Bu faz için henüz görev tanımlanmamış.</div>`;

  const addBtnHtml = isAdmin
    ? `<button class="impl-add-task-btn" onclick="openImplTaskModal('${phase.id}',null)">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>
        Görev Ekle
       </button>`
    : '';

  return `<div class="impl-phase" id="impl-phase-${phase.id}">
    <div class="impl-phase-header" onclick="implTogglePhase('${phase.id}')">
      <svg class="impl-phase-chevron" id="impl-mc-${phase.id}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg>
      <span class="impl-phase-title">${phaseLabel}${phase.title}</span>
      <div class="impl-phase-meta" id="impl-phase-meta-${phase.id}">
        <span class="impl-phase-prog-text">${done}/${total}</span>
        <div class="impl-phase-bar-wrap"><div class="impl-phase-bar-fill" style="width:${pct}%"></div></div>
        <span class="impl-phase-prog-text">${pct}%</span>
      </div>
    </div>
    <div class="impl-phase-body" id="${bodyId}">
      ${tasksHtml}
      ${addBtnHtml}
    </div>
  </div>`;
}

function implRenderOverall() {
  const allIds = implState.tasks.filter(t => t.is_visible !== false).map(t => t.id);
  const { done, total, pct } = implCalcProgress(allIds);
  const bar = document.getElementById('impl-progress-bar');
  const sub = document.getElementById('impl-progress-sub');
  const pctEl = document.getElementById('impl-progress-pct');
  if (bar)   bar.style.width = pct + '%';
  if (sub)   sub.textContent = `${done} / ${total} görev tamamlandı`;
  if (pctEl) pctEl.textContent = `%${pct}`;
  if (bar)   bar.style.background = pct >= 80 ? 'var(--color-green)' : pct >= 40 ? 'var(--color-amber)' : 'var(--color-accent)';
}

function implRefreshPhaseProgress() {
  // Update only progress numbers inside each phase header — avoids rebuilding the whole list
  for (const phase of implState.phases) {
    const metaEl = document.getElementById(`impl-phase-meta-${phase.id}`);
    if (!metaEl) continue;
    const tasks = implVisibleTasksForPhase(phase.id);
    const { done, total, pct } = implCalcProgress(tasks.map(t => t.id));
    metaEl.innerHTML = `<span class="impl-phase-prog-text">${done}/${total}</span>
      <div class="impl-phase-bar-wrap"><div class="impl-phase-bar-fill" style="width:${pct}%"></div></div>
      <span class="impl-phase-prog-text">${pct}%</span>`;
  }
  // Also update individual checkbox states in the DOM
  for (const [taskId, status] of Object.entries(implState.progress)) {
    const cb = document.getElementById(`impl-cb-${taskId}`);
    if (!cb) continue;
    if (status === 'done') {
      cb.classList.add('checked');
      const row = document.getElementById(`impl-tr-${taskId}`);
      if (row) {
        const titleEl = row.querySelector('.impl-task-row-title');
        if (titleEl) { titleEl.classList.add('done-text'); }
      }
    } else {
      cb.classList.remove('checked');
      const row = document.getElementById(`impl-tr-${taskId}`);
      if (row) {
        const titleEl = row.querySelector('.impl-task-row-title');
        if (titleEl) { titleEl.classList.remove('done-text'); }
      }
    }
  }
}

function implRender() {
  implRenderOverall();
  const list = document.getElementById('impl-list');
  if (!list) return;
  if (!implState.phases.length) {
    list.innerHTML = `<div style="padding:48px 24px;text-align:center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 14px;display:block"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h4"/></svg>
      <div style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.3);margin-bottom:6px">Bu program için henüz plan tanımlanmamış</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.18)">Program şablonu admin tarafından oluşturulduğunda burada görünecek</div>
    </div>`;
    return;
  }
  list.innerHTML = implState.phases.map((p, i) => implRenderPhase(p, i)).join('');
}

// ── Toggle phase expand/collapse ──────────────────────────────
function implTogglePhase(phaseId) {
  const body = document.getElementById(`impl-mb-${phaseId}`);
  const chev = document.getElementById(`impl-mc-${phaseId}`);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (chev) chev.classList.toggle('open', open);
}

// ── Admin: Add/Edit modal ─────────────────────────────────────
function openImplTaskModal(phaseId, taskId) {
  if (currentUser?.role !== 'admin') return;
  const titleEl  = document.getElementById('impl-task-modal-title');
  const idEl     = document.getElementById('impl-task-id');
  const phaseEl  = document.getElementById('impl-task-phase-id');
  const nameEl   = document.getElementById('impl-task-title');
  const descEl   = document.getElementById('impl-task-desc');

  if (taskId) {
    // Edit mode
    const task = implState.tasks.find(t => t.id === taskId);
    if (!task) return;
    if (titleEl) titleEl.textContent = 'Görevi Düzenle';
    if (idEl)    idEl.value    = task.id;
    if (phaseEl) phaseEl.value = task.phase_id;
    if (nameEl)  nameEl.value  = task.title;
    if (descEl)  descEl.value  = task.description ?? '';
    document.getElementById('impl-task-konu').value         = task.konu || '';
    document.getElementById('impl-task-seviye').value       = task.seviye || '';
    document.getElementById('impl-task-cikti').value        = task.cikti || '';
    document.getElementById('impl-task-source-url').value   = task.source_url || '';
  } else {
    // Add mode
    if (titleEl) titleEl.textContent = 'Görev Ekle';
    if (idEl)    idEl.value    = '';
    if (phaseEl) phaseEl.value = phaseId;
    if (nameEl)  nameEl.value  = '';
    if (descEl)  descEl.value  = '';
    document.getElementById('impl-task-konu').value         = '';
    document.getElementById('impl-task-seviye').value       = '';
    document.getElementById('impl-task-cikti').value        = '';
    document.getElementById('impl-task-source-url').value   = '';
  }
  openModal('modal-impl-task');
  setTimeout(() => { if (nameEl) nameEl.focus(); }, 80);
}

async function saveImplTask() {
  const idEl    = document.getElementById('impl-task-id');
  const phaseEl = document.getElementById('impl-task-phase-id');
  const nameEl  = document.getElementById('impl-task-title');
  const descEl  = document.getElementById('impl-task-desc');

  const title       = (nameEl?.value ?? '').trim();
  const description = (descEl?.value ?? '').trim() || null;
  const phase_id    = phaseEl?.value ?? '';
  const konu        = document.getElementById('impl-task-konu').value.trim() || null;
  const seviye      = document.getElementById('impl-task-seviye').value.trim() || null;
  const cikti       = document.getElementById('impl-task-cikti').value.trim() || null;
  const source_url   = document.getElementById('impl-task-source-url').value.trim() || null;

  if (!title) { if (nameEl) nameEl.focus(); return; }

  const taskId = idEl?.value ?? '';

  if (taskId) {
    // Update existing task
    const { error } = await sb.from('program_tasks')
      .update({ title, description, konu, seviye, cikti, source_url })
      .eq('id', taskId);
    if (!error) {
      const t = implState.tasks.find(t => t.id === taskId);
      if (t) { t.title = title; t.description = description; t.konu = konu; t.seviye = seviye; t.cikti = cikti; t.source_url = source_url; }
    }
  } else {
    // Insert new task
    const maxOrder = implState.tasks
      .filter(t => t.phase_id === phase_id)
      .reduce((m, t) => Math.max(m, t.order_index ?? 0), 0);
    const { data, error } = await sb.from('program_tasks')
      .insert({ phase_id, title, description, konu, seviye, cikti, source_url, order_index: maxOrder + 1, is_visible: true })
      .select()
      .single();
    if (!error && data) {
      implState.tasks.push(data);
    }
  }

  closeModal('modal-impl-task');
  implRender();
}

async function deleteImplTask(taskId) {
  if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
  const { error } = await sb.from('program_tasks').delete().eq('id', taskId);
  if (!error) {
    implState.tasks = implState.tasks.filter(t => t.id !== taskId);
    implRender();
  }
}

// ── Entry point ───────────────────────────────────────────────
async function loadImplementationPage() {
  const list = document.getElementById('impl-list');
  if (list) list.innerHTML = `<div class="impl-loading">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
    Veriler yükleniyor…
  </div>`;
  try {
    await implLoadAll();
    implRender();
  } catch(e) {
    if (list) list.innerHTML = `<div style="padding:24px;color:var(--color-red);font-size:13px">İçerik yüklenemedi. Lütfen tekrar deneyin.</div>`;
  }
}

// ============================================================
// MESAJLAŞMA
// ============================================================

let msgRealtimeSub = null;
let msgActiveThread = null; // email of conversation partner

async function loadMesajlar(){
  const root = document.getElementById('msg-root');
  if(!root) return;
  if(currentUser?.role === 'admin'){
    await renderMsgAdminView();
  } else {
    msgActiveThread = 'admin';
    await renderMsgUserView();
  }
  subscribeMessages();
}

function msgAdminEmail(){ return 'admin'; }

// ── Admin: sol panel kullanıcılar, sağ panel chat ──────────────
async function renderMsgAdminView(){
  const root = document.getElementById('msg-root');
  root.innerHTML = `
    <div id="msg-sidebar" style="width:270px;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;overflow:hidden">
      <div style="padding:16px 14px 10px;border-bottom:1px solid rgba(255,255,255,0.07)">
        <div style="font-size:13px;font-weight:600;color:#e8e8e6;margin-bottom:8px">Mehmet'e Sor</div>
        <input id="msg-search" type="text" placeholder="Kullanıcı ara…" oninput="msgFilterList(this.value)" style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:7px;padding:7px 10px;font-size:12px;color:#e8e8e6;font-family:inherit;outline:none"/>
      </div>
      <div id="msg-thread-list" style="flex:1;overflow-y:auto"></div>
    </div>
    <div id="msg-chat-area" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
      <div id="msg-chat-empty" style="flex:1;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:13px">Bir kullanıcı seç</div>
    </div>`;
  await renderMsgThreadList();
}

let _msgAllUsers = [];

async function renderMsgThreadList(){
  const el = document.getElementById('msg-thread-list');
  if(!el) return;

  const [{ data: allUsers }, { data: msgs }] = await Promise.all([
    sb.from('users').select('id,name,email').eq('role','client').order('name'),
    sb.from('messages').select('*').order('created_at', { ascending: false })
  ]);

  _msgAllUsers = allUsers || [];
  const threads = {};
  (msgs || []).forEach(m => {
    const partner = m.sender_email === 'admin' ? m.receiver_email : m.sender_email;
    if(!threads[partner]) threads[partner] = { last: m, unread: 0 };
    if(m.sender_email !== 'admin' && !m.is_read) threads[partner].unread++;
  });

  // Merge: users with messages sorted by last message time, then remaining users alphabetically
  const withMsg = _msgAllUsers.filter(u => threads[u.email]).sort((a,b) => new Date(threads[b.email].last.created_at) - new Date(threads[a.email].last.created_at));
  const noMsg   = _msgAllUsers.filter(u => !threads[u.email]);
  const sorted  = [...withMsg, ...noMsg];

  _msgRenderList(sorted, threads);
}

function _msgRenderList(users, threads){
  const el = document.getElementById('msg-thread-list');
  if(!el) return;
  if(!users.length){ el.innerHTML = '<div style="padding:16px;font-size:12px;color:rgba(255,255,255,0.25)">Kullanıcı yok</div>'; return; }
  el.innerHTML = users.map(u => {
    const t = threads ? threads[u.email] : null;
    const initials = (u.name||u.email).slice(0,2).toUpperCase();
    const preview = t ? (t.last.content.length > 32 ? t.last.content.slice(0,32)+'…' : t.last.content) : 'Henüz mesaj yok';
    const time = t ? new Date(t.last.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) : '';
    const active = msgActiveThread === u.email;
    const unread = t ? t.unread : 0;
    return `<div onclick="msgOpenThread('${u.email}')" data-email="${u.email}" data-name="${(u.name||'').toLowerCase()}" style="padding:11px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04);background:${active?'rgba(255,255,255,0.07)':'transparent'};display:flex;align-items:center;gap:10px;transition:background .1s" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='${active?'rgba(255,255,255,0.07)':'transparent'}'">
      <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#e8e8e6;flex-shrink:0">${initials}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <span style="font-size:13px;font-weight:500;color:#e8e8e6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px">${u.name||u.email}</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.28);flex-shrink:0">${time}</span>
        </div>
        <div style="font-size:11.5px;color:${t?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.18)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${preview}</div>
      </div>
      ${unread > 0 ? `<span style="background:#e57373;color:#fff;font-size:10px;font-weight:700;border-radius:10px;padding:1px 6px;flex-shrink:0">${unread}</span>` : ''}
    </div>`;
  }).join('');
}

function msgFilterList(q){
  const el = document.getElementById('msg-thread-list');
  if(!el) return;
  const items = el.querySelectorAll('[data-email]');
  items.forEach(item => {
    const name = item.dataset.name || '';
    const email = item.dataset.email || '';
    item.style.display = (name.includes(q.toLowerCase()) || email.toLowerCase().includes(q.toLowerCase())) ? '' : 'none';
  });
}

async function msgOpenThread(email){
  msgActiveThread = email;
  await renderMsgAdminChatPanel(email);
  await renderMsgThreadList();
  await msgMarkRead(email);
  updateUnreadBadge();
}

async function renderMsgAdminChatPanel(email){
  const area = document.getElementById('msg-chat-area');
  if(!area) return;
  const user = _msgAllUsers.find(u => u.email === email);
  const displayName = user ? user.name : email;
  area.innerHTML = `
    <div style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:10px">
      <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#e8e8e6">${displayName.slice(0,2).toUpperCase()}</div>
      <div>
        <div style="font-size:13.5px;font-weight:500;color:#e8e8e6">${displayName}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3)">${email}</div>
      </div>
    </div>
    <div id="msg-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px"></div>
    <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.07);display:flex;gap:8px">
      <input id="msg-input" type="text" placeholder="Mesaj yaz…" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 12px;font-size:13px;color:#e8e8e6;font-family:inherit;outline:none" onkeydown="if(event.key==='Enter')msgSend()"/>
      <button onclick="msgSend()" style="padding:9px 18px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#e8e8e6;font-size:12px;cursor:pointer;font-family:inherit;transition:background .1s" onmouseover="this.style.background='rgba(255,255,255,0.14)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">Gönder</button>
    </div>`;
  await renderMsgMessages(email);
}

// ── User view ──────────────────────────────────────────────────
async function renderMsgUserView(){
  const root = document.getElementById('msg-root');
  root.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
      <div style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:10px">
        <div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#e8e8e6">DB</div>
        <span style="font-size:13px;font-weight:500;color:#e8e8e6">Dijital Barista</span>
      </div>
      <div id="msg-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px"></div>
      <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.07);display:flex;gap:8px">
        <input id="msg-input" type="text" placeholder="Mesaj yaz…" style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:9px 12px;font-size:13px;color:#e8e8e6;font-family:inherit;outline:none" onkeydown="if(event.key==='Enter')msgSend()"/>
        <button onclick="msgSend()" style="padding:9px 16px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#e8e8e6;font-size:12px;cursor:pointer;font-family:inherit">Gönder</button>
      </div>
    </div>`;
  await renderMsgMessages(currentUser.email);
  await msgMarkRead(currentUser.email);
  updateUnreadBadge();
}

// ── Shared: render messages ────────────────────────────────────
async function renderMsgMessages(userEmail){
  const el = document.getElementById('msg-messages');
  if(!el) return;
  const { data: msgs } = await sb.from('messages')
    .select('*')
    .or(`and(sender_email.eq.${userEmail},receiver_email.eq.admin),and(sender_email.eq.admin,receiver_email.eq.${userEmail})`)
    .order('created_at', { ascending: true });
  if(!msgs || !msgs.length){ el.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--color-text-muted);margin-top:40px">Henüz mesaj yok</div>'; return; }
  const myEmail = currentUser?.role === 'admin' ? 'admin' : currentUser.email;
  el.innerHTML = msgs.map(m => {
    const isMine = m.sender_email === myEmail;
    const time = new Date(m.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    return `<div style="display:flex;justify-content:${isMine?'flex-end':'flex-start'}">
      <div class="msg-bubble ${isMine?'mine':'other'}" style="max-width:70%;padding:9px 13px;border-radius:${isMine?'14px 14px 4px 14px':'14px 14px 14px 4px'}">
        ${escHtml(m.content)}
        <div class="msg-time" style="font-size:10px;margin-top:3px;text-align:right">${time}</div>
      </div>
    </div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

async function msgSend(){
  const input = document.getElementById('msg-input');
  if(!input) return;
  const content = input.value.trim();
  if(!content) return;
  const isAdmin = currentUser?.role === 'admin';
  const sender = isAdmin ? 'admin' : currentUser.email;
  const receiver = isAdmin ? msgActiveThread : 'admin';
  if(!receiver){ alert('Kullanıcı seç'); return; }
  input.value = '';
  await sb.from('messages').insert({ sender_email: sender, receiver_email: receiver, content, is_read: false });
  await renderMsgMessages(isAdmin ? msgActiveThread : currentUser.email);
  if(isAdmin) await renderMsgThreadList();
}

async function msgMarkRead(userEmail){
  if(currentUser?.role === 'admin'){
    await sb.from('messages').update({ is_read: true }).eq('sender_email', userEmail).eq('receiver_email', 'admin').eq('is_read', false);
  } else {
    await sb.from('messages').update({ is_read: true }).eq('sender_email', 'admin').eq('receiver_email', userEmail).eq('is_read', false);
  }
}

async function updateUnreadBadge(){
  const badge = document.getElementById('msg-unread-badge');
  if(!badge) return;
  const myEmail = currentUser?.role === 'admin' ? 'admin' : currentUser.email;
  const { count } = await sb.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_email', myEmail).eq('is_read', false);
  if(count && count > 0){ badge.textContent = count; badge.style.display = 'inline'; }
  else { badge.style.display = 'none'; }
}

function subscribeMessages(){
  if(msgRealtimeSub) sb.removeChannel(msgRealtimeSub);
  const myEmail = currentUser?.role === 'admin' ? 'admin' : currentUser.email;
  msgRealtimeSub = sb.channel('messages-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
      const m = payload.new;
      const isAdmin = currentUser?.role === 'admin';
      const relevant = isAdmin
        ? (m.receiver_email === 'admin' || m.sender_email === 'admin')
        : (m.sender_email === myEmail || m.receiver_email === myEmail);
      if(!relevant) return;
      updateUnreadBadge();
      const msgsEl = document.getElementById('msg-messages');
      if(!msgsEl) return;
      if(isAdmin && msgActiveThread){
        await renderMsgMessages(msgActiveThread);
        await renderMsgThreadList();
        if(m.sender_email !== 'admin') await msgMarkRead(msgActiveThread);
      } else if(!isAdmin){
        await renderMsgMessages(myEmail);
        await msgMarkRead(myEmail);
      }
    })
    .subscribe();
}

// ============================================================
// EĞİTİM / CLASSROOM SİSTEMİ
// ============================================================

function egitimIsAdmin(){ return currentUser?.role === 'admin'; }
function egitimUserProgramName(){
  if(!currentUser || currentUser.role === 'admin') return '';
  const email = (currentUser.email || '').toLowerCase();
  const own = state.ownClient || state.clients.find(c => (c.email||'').toLowerCase() === email) || null;
  return String(own?.program || own?.type || '').trim();
}
function egitimNormalizeProgramName(name){
  return String(name||'').toLocaleLowerCase('tr-TR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/ı/g,'i');
}
function egitimIsMonthlySubscription(){
  const p = egitimNormalizeProgramName(egitimUserProgramName());
  return p.includes('aylik') && p.includes('abonelik');
}
function egitimNeedsLevelApproval(){
  if(egitimIsAdmin() || egitimIsMonthlySubscription()) return false;
  const p = egitimNormalizeProgramName(egitimUserProgramName());
  return p.includes('kulucka') || p.includes('dijital barista');
}
function egitimAllModulesUnlocked(){
  return egitimIsAdmin() || egitimIsMonthlySubscription();
}
function egitimModuleTitle(moduleIdOrObj){
  const m = typeof moduleIdOrObj === 'object'
    ? moduleIdOrObj
    : egitimModules.find(x => String(x.id) === String(moduleIdOrObj));
  return String(m?.title || '').trim();
}
function egitimNormalizedModuleTitle(moduleIdOrObj){
  return egitimNormalizeProgramName(egitimModuleTitle(moduleIdOrObj));
}
function egitimIsMomentumModule(moduleIdOrObj){
  return egitimNormalizedModuleTitle(moduleIdOrObj).includes('momentum');
}
function egitimIsSeviyeZeroModule(moduleIdOrObj){
  const title = egitimNormalizedModuleTitle(moduleIdOrObj);
  return title.includes('seviye 0') || title.includes('level 0') || title.includes('seviye-0') || title.includes('level-0');
}
function egitimIsInitialModuleUnlocked(moduleOrId, index){
  return egitimIsMomentumModule(moduleOrId) || egitimIsSeviyeZeroModule(moduleOrId) || index === 0;
}
function egitimNeedsModuleApproval(moduleId){
  return egitimNeedsLevelApproval() && !egitimIsMomentumModule(moduleId);
}
const EGITIM_CONTROL_FORM_DEFAULTS = {
  seviye_0: {
    level_key:'seviye_0',
    module_match:'seviye 0',
    title:'Seviye 0 Kontrol Formu',
    questions:[
      { id:'q1', type:'textarea', label:"Dijital Barista'daki kemerler neyi temsil eder?", placeholder:'Kısa cevabını yaz...' },
      { id:'q2', type:'textarea', label:'Yeni müşteriye satış yaptığında ne yapacaksın?', placeholder:'Süreci nasıl ilerleteceğini yaz...' },
      { id:'q3', type:'textarea', label:'Sorularına cevap almak için en iyi alan?', placeholder:'Nereye yazman gerektiğini belirt...' }
    ]
  },
  seviye_1: {
    level_key:'seviye_1',
    module_match:'seviye 1',
    title:'1. Kontrol Noktası',
    questions:[
      { id:'q1', type:'textarea', rows:4, label:'"Tersine mühendislik" yapısı ile, lütfen aktif olan ürün/hizmetlerini detaylı şekilde açıkla, aylık 200.000 TL kazanca ulaşmak için kaç müşteriye ihtiyacın olacağını ve bu müşterilere haftada ne kadar zaman ayıracağını belirt', placeholder:'Cevabını yaz...' },
      { id:'q2', type:'textarea', rows:3, label:'Verimli hafta protokolündeki 3F nedir?', placeholder:'Cevabını yaz...' }
    ]
  },
  seviye_2: {
    level_key:'seviye_2',
    module_match:'seviye 2',
    title:'2. Kontrol Noktası',
    questions:[
      { id:'q1', type:'textarea', rows:4, label:'Teklif eğitimine göre, ana teklifin ne olacak?', help:'Tam ödeme ve taksit seçeneklerini, programların süresini ve diğer tüm detayları dahil et. Ayrıca kaç müşteriyle çalışman gerektiğini de belirt.', placeholder:'Ana teklifini yaz...' },
      { id:'q2', type:'textarea', rows:4, label:'Peki mikro teklifin ne olacak?', help:'Fiyatlandırmayı ve program süresini dahil et.', placeholder:'Mikro teklifini yaz...' },
      { id:'q3', type:'textarea', rows:3, label:'Kademeli 1:1 erişim yaklaşımı nasıl çalışıyor?', placeholder:'Cevabını yaz...' }
    ]
  },
  seviye_3: {
    level_key:'seviye_3',
    module_match:'seviye 3',
    title:'3. Kontrol Noktası',
    questions:[
      { id:'q1', type:'select', label:'Neden kendi eşsiz mekanizmanı oluşturmalısın?', options:[
        'Sadece havalı gözükmek için',
        'Kalabalık bir pazarda, insanlara daha önce denediklerinden farklı bir çözüm yolu olduğunu göstermek için'
      ]},
      { id:'q2', type:'select', label:'Müşterilerimize hem en iyi sonucu aldırmak, hem de kendi işimizde en verimli çalışmak için nasıl ilerlemeliyiz?', options:[
        '1:1 iletişim',
        'Kişiye özel sıfırdan plan',
        'Online eğitim/kaynaklarınla desteklenmiş 1:1 iletişimle karma olacak şekilde',
        'Sürekli toplantı yaparak eğitmek'
      ]}
    ]
  },
  seviye_4: {
    level_key:'seviye_4',
    module_match:'seviye 4',
    title:'4. Kontrol Noktası',
    questions:[
      { id:'q1', type:'select', label:'Hangi gün müşteri seçtiğimiz "hikayeleri" paylaşıyoruz?', options:['Pazartesi','Hangi gün olursa','Çarşamba'] },
      { id:'q2', type:'select', label:'Neden Instagram hesabımızı optimize ediyoruz?', options:[
        'Güzel gözükmesi için',
        'Reklamlarımızdan bizi gören kişilerin bizi takibe alıp potansiyel müşterimiz olması için',
        'Sadece işimizde uzman olduğumuz için'
      ]},
      { id:'q3', type:'select', label:'Müşterilerimize hem en iyi sonucu aldırmak, hem de kendi işimizde en verimli çalışmak için nasıl ilerlemeliyiz?', options:[
        'Onlara satış yapmayı denemek için',
        "Instagram'dan arkadaş bulmak istiyoruz",
        'Onlara mesaj bırakarak, algoritmada önlerine çıkma ihtimalimizi artırmak'
      ]},
      { id:'q4', type:'select', label:'Uzun formatlı videolardaki amacımız ne?', options:[
        'Viral olmak',
        'Diğer koçlardan daha akıllı gözükmek',
        'Güven oluşturmak ve kitleyi daha hızlı beslemeye devam etmek'
      ]}
    ]
  },
  seviye_5: {
    level_key:'seviye_5',
    module_match:'seviye 5',
    title:'5. Kontrol Noktası',
    questions:[
      { id:'q1', type:'select', label:'Neden mail listeni büyütmek, sosyal medyana odaklanmaktan daha önemli?', options:[
        'E-posta listemiz bizim tek varlığımız, sosyal medya hesabımız kiralık ve kapatılabilir',
        'İnsanlar maillerle daha çok iletişime geçiyor',
        'E-posta listesi oluşturmak sosyal medya kitlesi oluşturmaktan daha ucuz'
      ]},
      { id:'q2', type:'select', label:'Lead magnetin asıl amacı nedir?', options:[
        'Direkt olarak programının satışını yapmak',
        'Mail listeni büyütmek, hedef kitlene değerli bir kaynak sunup mail adresi ile takas etmek.',
        'Sosyal medya hesabını büyütmek için'
      ]},
      { id:'q3', type:'select', label:'E-Posta "nurture" kampanyası nedir?', options:[
        'Yeni mail bırakan kişilere güven sağlamak için kullanılır',
        'Haftalık bülten olarak değerlendirilir',
        'İçeriklerimizi izletmek için kullanırız'
      ]},
      { id:'q4', type:'select', label:'İçeriklere göre, e-posta pazarlamaya ne zaman başlamalıyız?', options:[
        '500+ aboneyi geçtiğimiz zaman',
        'Listemizi oluşturduktan 3 ay sonra',
        'Lead magneti oluşturup, mail listemizi oluşturmaya başladıktan sonra.'
      ]}
    ]
  },
  seviye_6: {
    level_key:'seviye_6',
    module_match:'seviye 6',
    title:'6. Kontrol Noktası',
    questions:[
      { id:'q1', type:'select', label:'İnsanlar neden yüksek fiyatlı hizmet alıyor?', options:[
        'Vakit doldurmak ve meşgul olmak için',
        'Hayatlarındaki statüyü artırmak için',
        'Arkadaşları önerdiği için'
      ]},
      { id:'q2', type:'select', label:'Aşağıdakilerden hangisi, insanların bir koçluk/eğitim hizmeti satın almasının nedenleri arasında YER ALMAZ', options:[
        'Fit gözükmek, sağlığını iyileştirmek.',
        'Netlerini artırmak, daha düzenli çalışmayı öğrenmek.',
        'Parasını harcamak, vakit geçirmek'
      ]},
      { id:'q3', type:'select', label:'"Follow-Up-Fridays" sonuç verir çünkü...', options:[
        "Satışın %80'inden fazlası 7. temas noktasından sonra gelir.",
        'Çünkü hayırlı bir gündür.',
        'Hafta sonuna girmeden mesaj atmak önemlidir.'
      ]}
    ]
  }
};
let egitimControlQuestionSets = { ...EGITIM_CONTROL_FORM_DEFAULTS };
let egitimControlQuestionsLoaded = false;

function egitimControlLevelKey(moduleId){
  if(egitimIsMomentumModule(moduleId)) return null;
  const title = egitimNormalizedModuleTitle(moduleId);
  const match = title.match(/(?:seviye|level)[\s-]*(\d+)/);
  return match ? `seviye_${match[1]}` : null;
}
function egitimNormalizeQuestionSet(row){
  const levelKey = row.level_key || row.level || row.key || egitimNormalizeProgramName(row.module_match || row.module_title || row.title || '').replace(/\s+/g,'_');
  const questions = Array.isArray(row.questions) ? row.questions : [];
  return {
    level_key: levelKey,
    module_match: row.module_match || row.module_title || row.title || levelKey,
    title: row.title || EGITIM_CONTROL_FORM_DEFAULTS[levelKey]?.title || 'Kontrol Formu',
    questions: questions.length ? questions : (EGITIM_CONTROL_FORM_DEFAULTS[levelKey]?.questions || [])
  };
}
function egitimSeedPayloads(){
  return Object.values(EGITIM_CONTROL_FORM_DEFAULTS).map((set, index) => ({
    level_key: set.level_key,
    module_match: set.module_match,
    title: set.title,
    questions: set.questions,
    sort_order: index,
    is_active: true,
    updated_at: new Date().toISOString()
  }));
}
async function seedEgitimControlQuestions(){
  if(!sb || !egitimIsAdmin()) return;
  const { error } = await sb
    .from('training_control_questions')
    .upsert(egitimSeedPayloads(), { onConflict:'level_key' });
  if(error)
}
async function loadEgitimControlQuestions(){
  egitimControlQuestionSets = { ...EGITIM_CONTROL_FORM_DEFAULTS };
  if(!sb || egitimControlQuestionsLoaded) return;
  try {
    if(egitimIsAdmin()) await seedEgitimControlQuestions();
    const { data, error } = await sb
      .from('training_control_questions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending:true });
    if(error) throw error;
    (data || []).forEach(row => {
      const normalized = egitimNormalizeQuestionSet(row);
      if(normalized.level_key && normalized.questions.length) {
        egitimControlQuestionSets[normalized.level_key] = normalized;
      }
    });
    egitimControlQuestionsLoaded = true;
  } catch(e) {
  }
}
function egitimControlFormQuestions(moduleId){
  const key = egitimControlLevelKey(moduleId);
  return key ? (egitimControlQuestionSets[key]?.questions || []) : [];
}
function egitimControlFormTitle(moduleId){
  const key = egitimControlLevelKey(moduleId);
  return key ? (egitimControlQuestionSets[key]?.title || 'Seviye Tamamlama Formu') : 'Seviye Tamamlama Formu';
}
function egitimLatestSubmissionForModule(moduleId, userId = currentUser?.email){
  const email = String(userId || '').toLowerCase();
  return (egitimSubs || [])
    .filter(s => String(s.module_id) === String(moduleId) && (!email || String(s.user_id||'').toLowerCase() === email))
    .sort((a,b) => new Date(b.reviewed_at || b.created_at || 0) - new Date(a.reviewed_at || a.created_at || 0))[0] || null;
}
function egitimIsModuleApproved(moduleId, userId = currentUser?.email){
  if(!egitimNeedsModuleApproval(moduleId)) return true;
  const sub = egitimLatestSubmissionForModule(moduleId, userId);
  const access = egitimAccess.find(a => String(a.module_id) === String(moduleId) && (!userId || String(a.user_id||'').toLowerCase() === String(userId).toLowerCase()));
  return !!(access?.completed && sub?.status === 'onaylandi');
}
function egitimCanOpenModuleForUser(module, visibleModules, index){
  if(egitimAllModulesUnlocked() || egitimIsInitialModuleUnlocked(module, index)) return true;
  const access = egitimAccess.find(a => String(a.module_id) === String(module.id));
  if(!access?.unlocked) return false;
  const previousApprovalModule = [...visibleModules]
    .slice(0, index)
    .reverse()
    .find(m => egitimNeedsModuleApproval(m.id));
  return !previousApprovalModule || egitimIsModuleApproved(previousApprovalModule.id);
}

// --- IMAGE UPLOAD ---
function egitimShowCoverPreview(url) {
  const img = document.getElementById('em-cover-img');
  const ph  = document.getElementById('em-drop-placeholder');
  if (!img) return;
  if (url) { img.src = url; img.style.display = ''; if(ph) ph.style.display = 'none'; }
  else     { img.src = ''; img.style.display = 'none'; if(ph) ph.style.display = ''; }
}
function egitimPreviewCover(url) { egitimShowCoverPreview(url); }

function egitimHandleImageDrop(e) {
  e.preventDefault();
  document.getElementById('em-drop-zone')?.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) egitimLoadImageFile(file);
}
function egitimHandleImageFile(input) {
  const file = input.files[0];
  if (file) egitimLoadImageFile(file);
}
function egitimLoadImageFile(file) {
  const reader = new FileReader();
  reader.onload = function(ev) {
    const tmp = new Image();
    tmp.onload = function() {
      const canvas = document.createElement('canvas');
      const maxW = 800, maxH = 450;
      let w = tmp.width, h = tmp.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(tmp, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      document.getElementById('em-cover').value = dataUrl;
      egitimShowCoverPreview(dataUrl);
    };
    tmp.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// --- DATA & STATE ---
let egitimModules = [];
let egitimTopics  = [];
let egitimLessons = [];
let egitimAccess  = [];
let egitimSubs    = [];
let egitimCurrentModule = null;
let egitimCurrentLesson = null;
let egitimDragModuleId  = null;
let egitimDragTopicId   = null;
let egitimDragLessonId  = null;

async function loadEgitim() {
  const email = currentUser?.email;
  if (!sb) {
    showSupabaseConnectionError('egitim-grid-view');
    return;
  }
  try {
    if (email) {
      const subsQuery = egitimIsAdmin()
        ? sb.from('training_module_submissions').select('*').order('created_at', { ascending: false })
        : sb.from('training_module_submissions').select('*').eq('user_id', email);
      const [mR, tR, lR, aR, sR] = await Promise.all([
        sb.from('training_modules').select('*').order('order_index'),
        sb.from('training_topics').select('*').order('order_index'),
        sb.from('training_lessons').select('*').order('order_index'),
        sb.from('user_module_access').select('*').eq('user_id', email),
        subsQuery,
      ]);
      egitimModules = mR.data || [];
      egitimTopics  = tR.data || [];
      egitimLessons = lR.data || [];
      egitimAccess  = aR.data || [];
      egitimSubs    = sR.data || [];
      await loadEgitimControlQuestions();
    }
  } catch(e) {
  }
  egitimShowGrid();
}

// ===== VIEW HELPERS =====
function egitimShowGrid() {
  document.getElementById('egitim-grid-view').style.display = '';
  document.getElementById('egitim-detail-view').style.display = 'none';
  document.getElementById('egitim-form-view').style.display = 'none';
  renderEgitimGrid();
}

function egitimBack() {
  if (egitimCurrentModule) {
    egitimCurrentLesson = null;
    egitimShowDetail(egitimCurrentModule);
  } else {
    egitimCurrentModule = null;
    egitimShowGrid();
  }
}

// ===== GRID VIEW =====
function renderEgitimGrid() {
  const el = document.getElementById('egitim-module-list');
  const visibleMods = egitimModules.filter(m => egitimIsAdmin() || m.is_visible !== false);
  const gripSvg = `<svg width="9" height="13" viewBox="0 0 9 13" fill="rgba(255,255,255,0.28)"><circle cx="2.5" cy="2" r="1.2"/><circle cx="6.5" cy="2" r="1.2"/><circle cx="2.5" cy="6.5" r="1.2"/><circle cx="6.5" cy="6.5" r="1.2"/><circle cx="2.5" cy="11" r="1.2"/><circle cx="6.5" cy="11" r="1.2"/></svg>`;
  const lockSvg = `<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>`;

  const cards = visibleMods.map((m, idx) => {
    const access    = egitimAccess.find(a => a.module_id === m.id);
    const unlocked  = egitimCanOpenModuleForUser(m, visibleMods, idx);
    const sub       = egitimLatestSubmissionForModule(m.id);
    const subStatus = sub ? sub.status : null;
    const completed = egitimNeedsModuleApproval(m.id) ? egitimIsModuleApproved(m.id) : !!(access && access.completed);
    const topics    = egitimTopics.filter(t => t.module_id === m.id && (egitimIsAdmin() || t.is_visible !== false));
    const lessonCount = topics.reduce((n,t) => n + egitimLessons.filter(l => l.topic_id === t.id && (egitimIsAdmin() || l.is_visible !== false)).length, 0);
    const coverContent = m.cover_image
      ? `<img src="${escHtml(m.cover_image)}" alt="" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display='none'">`
      : '';
    let statusBadge = '';
    if (completed) statusBadge = `<div style="position:absolute;top:10px;right:10px;background:rgba(76,175,129,0.9);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px">✓ Tamam</div>`;
    else if (subStatus==='incelemede') statusBadge = `<div style="position:absolute;top:10px;right:10px;background:rgba(224,165,83,0.9);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px">İnceleniyor</div>`;
    else if (subStatus==='revize') statusBadge = `<div style="position:absolute;top:10px;right:10px;background:rgba(229,115,115,0.9);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px">Revize</div>`;
    const adminBtns = egitimIsAdmin() ? `<div style="display:flex;gap:4px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--color-divider)">
      <span style="cursor:grab;line-height:0;margin-right:3px" title="Sürükle">${gripSvg}</span>
      <button onclick="event.stopPropagation();openEgitimModulModal(${m.id})" class="eg-pill-btn">düzenle</button>
      <button onclick="event.stopPropagation();deleteEgitimModul(${m.id})" class="eg-pill-btn red">sil</button>
    </div>` : '';
    const draggable = egitimIsAdmin()
      ? `draggable="true" ondragstart="egitimModulDragStart(event,${m.id})" ondragover="egitimModulDragOver(event)" ondragleave="this.classList.remove('drag-over')" ondrop="egitimModulDrop(event,${m.id})"`
      : '';
    return `<div class="egitim-card" ${draggable} ondragend="window._egitimDragging=false;this.classList.remove('dragging')" onclick="${unlocked?`if(!window._egitimDragging)egitimOpenModule(${m.id})`:'void(0)'}" style="${!unlocked&&!egitimIsAdmin()?'opacity:0.55;cursor:default;pointer-events:none':''}">
      <div class="egitim-card-cover">
        ${coverContent}
        ${!unlocked&&!egitimIsAdmin()?`<div class="egitim-locked-overlay">${lockSvg}</div>`:''}
        ${statusBadge}
        ${!m.is_visible&&egitimIsAdmin()?'<div style="position:absolute;bottom:8px;left:10px;font-size:10px;background:rgba(0,0,0,0.7);color:#aaa;padding:2px 7px;border-radius:6px">Gizli</div>':''}
      </div>
      <div class="egitim-card-body">
        <div class="egitim-card-title">${escHtml(m.title)}</div>
        <div class="egitim-card-desc${m.description?'':' empty'}">${m.description?escHtml(m.description):'&nbsp;'}</div>
        <div class="egitim-card-bar-bg"><div class="egitim-card-bar-fill" style="width:${completed?100:0}%"></div></div>
        <div class="egitim-card-meta"><span>${topics.length} bölüm · ${lessonCount} ders</span>${completed?'<span style="color:#4caf81">Tamamlandı</span>':''}</div>
        ${adminBtns}
      </div>
    </div>`;
  });
  if (egitimIsAdmin()) {
    cards.push(`<div class="egitim-add-card" onclick="openEgitimModulModal()">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
      <span style="font-size:13px;font-weight:500">Yeni Seviye Ekle</span>
    </div>`);
  }
  el.innerHTML = cards.join('');
}

function egitimModulDragStart(e, id) {
  egitimDragModuleId = id;
  window._egitimDragging = true;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}
function egitimModulDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}
async function egitimModulDrop(e, targetId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!egitimDragModuleId || egitimDragModuleId === targetId) { egitimDragModuleId = null; return; }
  const si = egitimModules.findIndex(m => m.id === egitimDragModuleId);
  const ti = egitimModules.findIndex(m => m.id === targetId);
  if (si < 0 || ti < 0) { egitimDragModuleId = null; return; }
  const moved = egitimModules.splice(si, 1)[0];
  egitimModules.splice(ti, 0, moved);
  egitimModules.forEach((m, i) => { m.order_index = i + 1; });
  egitimDragModuleId = null;
  renderEgitimGrid();
  await Promise.all(egitimModules.map(m => sb.from('training_modules').update({ order_index: m.order_index }).eq('id', m.id)));
}

// ===== DETAIL VIEW (classroom) =====
function egitimOpenModule(moduleId) {
  egitimCurrentModule = moduleId;
  egitimCurrentLesson = null;
  egitimShowDetail(moduleId);
}

function egitimShowDetail(moduleId) {
  document.getElementById('egitim-grid-view').style.display = 'none';
  document.getElementById('egitim-form-view').style.display = 'none';
  document.getElementById('egitim-detail-view').style.display = '';
  renderEgitimNav(moduleId);
  if (egitimCurrentLesson) {
    renderEgitimLessonContent(egitimCurrentLesson);
  } else {
    renderEgitimModuleIntro(moduleId);
  }
}

function toggleEcSection(hdEl) {
  const section = hdEl.closest('.ec-section');
  if (!section) return;
  const open = section.dataset.open !== 'false';
  section.dataset.open = open ? 'false' : 'true';
}

function renderEgitimNav(moduleId) {
  const m        = egitimModules.find(x => x.id === moduleId);
  const topics   = egitimTopics.filter(t => t.module_id === moduleId && (egitimIsAdmin() || t.is_visible !== false));
  const access   = egitimAccess.find(a => a.module_id === moduleId);
  const completed = access && access.completed;
  const gripSvg = `<svg width="9" height="13" viewBox="0 0 9 13" fill="rgba(255,255,255,0.28)"><circle cx="2.5" cy="2" r="1.2"/><circle cx="6.5" cy="2" r="1.2"/><circle cx="2.5" cy="6.5" r="1.2"/><circle cx="6.5" cy="6.5" r="1.2"/><circle cx="2.5" cy="11" r="1.2"/><circle cx="6.5" cy="11" r="1.2"/></svg>`;
  const chevronSvg = `<svg class="ec-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>`;
  const checkSvg = `<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6l3 3 5-5"/></svg>`;

  const progressPct = completed ? 100 : 0;

  let html = `<div class="ec-nav-header">
    <button class="ec-back-btn" onclick="egitimShowGrid()">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 3L5 8l5 5"/></svg> Dersler
    </button>
    <div class="ec-module-title">${escHtml(m?.title||'')}</div>
    <div class="ec-progress-label">${progressPct}% tamamlandi</div>
    <div class="ec-progress-track"><div class="ec-progress-fill" style="width:${progressPct}%"></div></div>
  </div>
  <div class="ec-nav-body">`;

  topics.forEach((t, tIdx) => {
    const lessons = egitimLessons.filter(l => l.topic_id === t.id && (egitimIsAdmin() || l.is_visible !== false));
    const topicDrag = egitimIsAdmin()
      ? `draggable="true" ondragstart="egitimTopicDragStart(event,${t.id})" ondragover="event.preventDefault();this.querySelector('.ec-section-hd').classList.add('drag-over')" ondragleave="this.querySelector('.ec-section-hd').classList.remove('drag-over')" ondrop="egitimTopicDrop(event,${t.id})" ondragend="egitimTopicDragEnd(event)"`
      : '';
    const adminTopicBtns = egitimIsAdmin() ? `<div class="ec-section-admin" style="display:flex;gap:3px;align-items:center;margin-left:4px" onclick="event.stopPropagation()">
      <span style="cursor:grab;line-height:0;margin-right:2px">${gripSvg}</span>
      <button onclick="openEgitimDersModal(${t.id})" class="eg-pill-btn">+ ders</button>
      <button onclick="openEgitimKonuModal(${moduleId},${t.id})" class="eg-pill-btn">duzenle</button>
      <button onclick="deleteEgitimKonu(${t.id})" class="eg-pill-btn red">sil</button>
    </div>` : '';
    html += `<div class="ec-section" data-open="true" ${topicDrag}>
      <div class="ec-section-hd" onclick="toggleEcSection(this)">
        <span class="ec-section-num">${tIdx+1}.</span>
        <span class="ec-section-name">${escHtml(t.title)}</span>
        ${chevronSvg}
        ${adminTopicBtns}
      </div>
      <div class="ec-section-body">`;
    lessons.forEach(l => {
      const active = egitimCurrentLesson === l.id;
      const lessonDrag = egitimIsAdmin()
        ? `draggable="true" ondragstart="egitimLessonDragStart(event,${l.id})" ondragover="event.preventDefault();event.stopPropagation();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="egitimLessonDrop(event,${l.id})"`
        : '';
      const adminDersBtns = egitimIsAdmin() ? `<span style="display:flex;gap:3px;flex-shrink:0" onclick="event.stopPropagation()">
        <button onclick="openEgitimDersModal(${t.id},${l.id})" class="eg-pill-btn">duzenle</button>
        <button onclick="deleteEgitimDers(${l.id})" class="eg-pill-btn red">sil</button>
      </span>` : '';
      html += `<div class="ec-lesson-row${active?' active':''}" onclick="if(!window._egitimDragging)egitimSelectLesson(${l.id})" ${lessonDrag} ondragend="window._egitimDragging=false">
        <span class="ec-lesson-name">${escHtml(l.title)}</span>
        ${adminDersBtns}
      </div>`;
    });
    if (!lessons.length && egitimIsAdmin()) {
      html += `<div style="padding:5px 32px;font-size:11px;color:rgba(255,255,255,0.25);font-style:italic">Ders yok</div>`;
    }
    html += `</div></div>`;
  });

  if (!topics.length) {
    html += `<div style="padding:18px 18px;font-size:12px;color:rgba(255,255,255,0.3)">${egitimIsAdmin()?'Asagidan bolum ekle →':'Icerik yukleniyor…'}</div>`;
  }
  html += '</div>';

  if (egitimIsAdmin()) {
    html += `<div class="ec-nav-admin">
      <button onclick="openEgitimKonuModal(${moduleId})" class="ec-add-btn">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg> Bolum Ekle
      </button>
      <button onclick="openEgitimModulModal(${moduleId})" class="ec-add-btn">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2H5a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2z"/><path d="M8 7v4M6 9h4"/></svg> Modulu Duzenle
      </button>
    </div>`;
  }

  document.getElementById('egitim-nav-panel').innerHTML = html;
}

function egitimTopicDragStart(e, id) {
  egitimDragTopicId = id;
  window._egitimDragging = true;
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', String(id)); } catch (_) {}
  e.stopPropagation();
}
function egitimTopicDragEnd(e) {
  egitimDragTopicId = null;
  window._egitimDragging = false;
  document.querySelectorAll('.ec-section-hd.drag-over').forEach(el => el.classList.remove('drag-over'));
}
async function egitimTopicDrop(e, targetId) {
  e.preventDefault();
  e.stopPropagation();
  document.querySelectorAll('.ec-section-hd.drag-over').forEach(el => el.classList.remove('drag-over'));
  if (!egitimDragTopicId || egitimDragTopicId === targetId) { egitimTopicDragEnd(e); return; }
  const srcT = egitimTopics.find(t => t.id === egitimDragTopicId);
  const tgtT = egitimTopics.find(t => t.id === targetId);
  if (!srcT || !tgtT || srcT.module_id !== tgtT.module_id) { egitimTopicDragEnd(e); return; }
  const modTopics = egitimTopics.filter(t => t.module_id === srcT.module_id).sort((a,b) => a.order_index - b.order_index);
  const si = modTopics.findIndex(t => t.id === egitimDragTopicId);
  const ti = modTopics.findIndex(t => t.id === targetId);
  const moved = modTopics.splice(si, 1)[0];
  modTopics.splice(ti, 0, moved);
  modTopics.forEach((t, i) => { t.order_index = i + 1; });
  egitimTopicDragEnd(e);
  renderEgitimNav(egitimCurrentModule);
  const writes = await Promise.all(modTopics.map(t => sb.from('training_topics').update({ order_index: t.order_index }).eq('id', t.id)));
  const failed = writes.find(r => r && r.error);
  if (failed) alert('Bölüm sırası kaydedilemedi. Lütfen tekrar dene.');
}

function egitimLessonDragStart(e, id) {
  egitimDragLessonId = id;
  window._egitimDragging = true;
  e.dataTransfer.effectAllowed = 'move';
  e.stopPropagation();
}
async function egitimLessonDrop(e, targetId) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  if (!egitimDragLessonId || egitimDragLessonId === targetId) { egitimDragLessonId = null; return; }
  const srcL = egitimLessons.find(l => l.id === egitimDragLessonId);
  const tgtL = egitimLessons.find(l => l.id === targetId);
  if (!srcL || !tgtL || srcL.topic_id !== tgtL.topic_id) { egitimDragLessonId = null; return; }
  const topicLessons = egitimLessons.filter(l => l.topic_id === srcL.topic_id).sort((a,b) => a.order_index - b.order_index);
  const si = topicLessons.findIndex(l => l.id === egitimDragLessonId);
  const ti = topicLessons.findIndex(l => l.id === targetId);
  const moved = topicLessons.splice(si, 1)[0];
  topicLessons.splice(ti, 0, moved);
  topicLessons.forEach((l, i) => { l.order_index = i + 1; });
  egitimDragLessonId = null;
  renderEgitimNav(egitimCurrentModule);
  await Promise.all(topicLessons.map(l => sb.from('training_lessons').update({ order_index: l.order_index }).eq('id', l.id)));
}

function renderEgitimModuleIntro(moduleId) {
  const m = egitimModules.find(x => x.id === moduleId);
  const access = egitimAccess.find(a => a.module_id === moduleId);
  const completed = access && access.completed;
  const sub = egitimSubs.find(s => s.module_id === moduleId && s.user_id === currentUser?.email);
  const subStatus = sub ? sub.status : null;
  let actionHtml = '';
  if (!egitimIsAdmin()) {
    if (!egitimNeedsModuleApproval(moduleId)) actionHtml = '';
    else if (completed) actionHtml = `<div style="padding:14px 18px;background:rgba(76,175,129,0.08);border:1px solid rgba(76,175,129,0.2);border-radius:10px;font-size:13px;color:#4caf81;margin-top:24px">✓ Bu seviyeyi tamamladın!</div>`;
    else if (subStatus==='incelemede') actionHtml = `<div style="padding:14px 18px;background:rgba(224,165,83,0.08);border:1px solid rgba(224,165,83,0.2);border-radius:10px;font-size:13px;color:var(--color-amber);margin-top:24px">⏳ Formun gönderildi, admin inceliyor…</div>`;
    else if (subStatus==='revize') actionHtml = `<div style="margin-top:24px"><div style="padding:12px 16px;background:rgba(229,115,115,0.08);border-radius:10px;font-size:13px;color:#e57373;margin-bottom:12px">↩ Revize gerekli${sub.admin_note?`: ${escHtml(sub.admin_note)}`:''}</div><button class="btn btn-primary" onclick="openEgitimForm(${moduleId})">Tekrar Gönder</button></div>`;
    else actionHtml = `<div style="padding:14px 18px;background:rgba(224,165,83,0.08);border:1px solid rgba(224,165,83,0.18);border-radius:10px;font-size:13px;color:var(--color-amber);margin-top:24px">Seviye kontrol formu son dersi tamamladığında açılacak.</div>`;
  }
  document.getElementById('egitim-content-panel').innerHTML = `
    <div class="ec-content-card">
      <div class="ec-content-header">
        <h1 class="ec-lesson-title">${escHtml(m?.title||'')}</h1>
      </div>
      <div style="padding:0 28px 28px">
        ${m?.description?`<div style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin-bottom:16px">${escHtml(m.description)}</div>`:''}
        <div style="font-size:13px;color:rgba(255,255,255,0.3)">Sol menuden bir ders secerek basla.</div>
        ${actionHtml}
      </div>
    </div>`;
}

function egitimSelectLesson(lessonId) {
  egitimCurrentLesson = lessonId;
  renderEgitimNav(egitimCurrentModule);
  renderEgitimLessonContent(lessonId);
}

function renderEgitimLessonContent(lessonId) {
  const l = egitimLessons.find(x => x.id === lessonId);
  if (!l) return;
  const topic = egitimTopics.find(t => t.id === l.topic_id);

  let videoSectionHtml = '';
  if (l.video_url) {
    const url = l.video_url;
    let videoEl = '';
    const wistiaMatch = url.match(/wistia\.(?:com|net)\/(?:medias|embed\/iframe)\/([a-zA-Z0-9]+)/);
    if (wistiaMatch) {
      videoEl = `<div class="wistia_embed wistia_async_${wistiaMatch[1]} eg-wistia-standard seo=false videoFoam=true playerColor=c9905a controlsVisibleOnLoad=true playbar=true playButton=true smallPlayButton=true volumeControl=true fullscreenButton=true settingsControl=true playbackRateControl=true" style="width:100%;height:100%">&nbsp;</div>`;
    } else if (url.includes('vimeo.com')) {
      const id = url.split('/').filter(Boolean).pop();
      videoEl = `<iframe src="https://player.vimeo.com/video/${id}" allowfullscreen></iframe>`;
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{6,})/);
      if (match) videoEl = `<iframe src="https://www.youtube-nocookie.com/embed/${escHtml(match[1])}?rel=0&modestbranding=1&playsinline=1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    } else {
      videoEl = `<video src="${escHtml(url)}" controls style="width:100%;height:100%;background:#000"></video>`;
    }
    videoSectionHtml = `<div class="ec-video-container"><div class="ec-video-wrap">${videoEl}</div></div>`;
  } else {
    videoSectionHtml = '';
  }

  const adminActions = egitimIsAdmin() ? `<div class="ec-admin-actions">
    <button class="ec-admin-btn" title="Dersi duzenle" onclick="openEgitimDersModal(${l.topic_id},${l.id})">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2l3 3-8 8H3v-3z"/></svg>
    </button>
    <button class="ec-admin-btn red" title="Dersi sil" onclick="deleteEgitimDers(${l.id})">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M5 4V3h6v1M6 7v5M10 7v5M4 4l1 9h6l1-9"/></svg>
    </button>
  </div>` : '';

  const resourcesHtml = l.resource_url ? `<div class="ec-resources">
    <div class="ec-resources-title">Kaynaklar</div>
    <a href="${escHtml(l.resource_url)}" target="_blank" class="ec-resource-link">📎 Kaynaga Git</a>
  </div>` : '';

  const descHtml = l.description ? `<div style="padding:0 28px 24px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.75;white-space:pre-line">${escHtml(l.description)}</div>` : '';

  document.getElementById('egitim-content-panel').innerHTML = `
    <div class="ec-content-card">
      <div class="ec-content-header">
        <h1 class="ec-lesson-title">${escHtml(l.title)}</h1>
        ${adminActions}
      </div>
      ${descHtml}
      ${videoSectionHtml}
      ${resourcesHtml}
    </div>`;
}

// ===== SUBMISSION FORM =====
function openEgitimForm(moduleId) {
  if (!egitimNeedsModuleApproval(moduleId)) {
    egitimShowDetail(moduleId);
    return;
  }
  egitimCurrentModule = moduleId;
  document.getElementById('egitim-grid-view').style.display = 'none';
  document.getElementById('egitim-detail-view').style.display = 'none';
  document.getElementById('egitim-form-view').style.display = '';
  const m = egitimModules.find(x => x.id === moduleId);
  const questions = egitimControlFormQuestions(moduleId);
  if (!questions.length) {
    egitimShowDetail(moduleId);
    return;
  }
  const fieldsHtml = questions.map((q, index) => {
    const required = q.required === false ? '' : 'required';
    const helpHtml = q.help ? `<div style="font-size:12px;color:var(--color-text-muted);line-height:1.5;margin:-6px 0 9px">${escHtml(q.help)}</div>` : '';
    const labelHtml = `<label class="form-label" for="esub-${escHtml(q.id || `q${index+1}`)}">${escHtml(q.label || `Soru ${index+1}`)}</label>${helpHtml}`;
    const id = escHtml(q.id || `q${index+1}`);
    if (q.type === 'select') {
      const opts = (q.options || []).map(opt => `<option value="${escHtml(opt)}">${escHtml(opt)}</option>`).join('');
      return `${labelHtml}<select class="form-input" id="esub-${id}" data-question-id="${id}" ${required} style="margin-bottom:14px">
        <option value="">Seç...</option>${opts}
      </select>`;
    }
    return `${labelHtml}<textarea class="form-input" id="esub-${id}" data-question-id="${id}" rows="${q.rows || 3}" style="resize:vertical;margin-bottom:14px" placeholder="${escHtml(q.placeholder || 'Cevabını yaz...')}" ${required}></textarea>`;
  }).join('');
  document.getElementById('egitim-form-content').innerHTML = `
    <div style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:14px;padding:24px">
      <div style="font-size:18px;font-weight:700;margin-bottom:4px">${escHtml(egitimControlFormTitle(moduleId))}</div>
      <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:20px">${escHtml(m?.title||'')}</div>
      ${fieldsHtml}
      <button class="btn btn-primary" onclick="submitEgitimForm(${moduleId})">Gönder</button>
    </div>`;
}

async function submitEgitimForm(moduleId) {
  const questions = egitimControlFormQuestions(moduleId);
  const answers = questions.map((q, index) => {
    const id = q.id || `q${index+1}`;
    const value = document.getElementById(`esub-${id}`)?.value.trim() || '';
    return { id, label:q.label || `Soru ${index+1}`, type:q.type || 'textarea', value };
  });
  const missing = questions.find((q, index) => q.required !== false && !answers[index]?.value);
  if (missing) { alert('Lütfen tüm zorunlu soruları cevapla.'); return; }
  const payload = {
    user_id:currentUser.email,
    module_id:moduleId,
    q1:answers[0]?.value || '',
    q2:answers[1]?.value || '',
    q3:answers[2]?.value || '',
    status:'incelemede',
    created_at:new Date().toISOString(),
    answers,
    question_set_key: egitimControlLevelKey(moduleId)
  };
  let { error } = await sb.from('training_module_submissions').insert(payload);
  if (error && /answers|question_set_key|schema cache|column/i.test(error.message || '')) {
    const fallbackPayload = { ...payload };
    delete fallbackPayload.answers;
    delete fallbackPayload.question_set_key;
    ({ error } = await sb.from('training_module_submissions').insert(fallbackPayload));
  }
  if (error) { alert('Gönderilemedi: ' + error.message); return; }
  egitimSubs.push({ user_id:currentUser.email, module_id:moduleId, status:'incelemede', answers, q1:payload.q1, q2:payload.q2, q3:payload.q3, created_at:payload.created_at });
  egitimCurrentLesson = null;
  egitimShowDetail(moduleId);
}

function egitimSubmissionAnswersHtml(s){
  const questions = egitimControlFormQuestions(s.module_id);
  const storedAnswers = Array.isArray(s.answers) ? s.answers : null;
  const answers = storedAnswers || questions.map((q, index) => ({
    label: q.label || `Soru ${index+1}`,
    value: s[`q${index+1}`] || ''
  }));
  return answers
    .filter(a => a.value)
    .map(a => `<div style="font-size:12px;color:var(--color-text-muted);margin-bottom:5px">${escHtml(a.label)}: <span style="color:var(--color-text-secondary)">${escHtml(a.value)}</span></div>`)
    .join('');
}

// ===== ONAY PANEL (admin, inside grid view) =====
function egitimToggleOnay() {
  const panel = document.getElementById('egitim-onay-panel');
  const open = panel.style.display === 'none';
  panel.style.display = open ? '' : 'none';
  if (open) renderEgitimOnayPanel();
}

function renderEgitimOnayPanel() {
  const el = document.getElementById('egitim-submissions-list');
  if (!egitimSubs.length) { el.innerHTML = '<div class="empty" style="padding:24px">Bekleyen gönderim yok</div>'; return; }
  const badge = s => {
    const map = { incelemede:['rgba(224,165,83,0.12)','var(--color-amber)','⏳ İncelemede'], onaylandi:['rgba(76,175,129,0.12)','#4caf81','✓ Onaylandı'], revize:['rgba(229,115,115,0.12)','#e57373','↩ Revize'] };
    const [bg,color,label] = map[s]||map.incelemede;
    return `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${bg};color:${color}">${label}</span>`;
  };
  el.innerHTML = egitimSubs.map(s => {
    const m = egitimModules.find(x => x.id === s.module_id);
    return `<div style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:12px;padding:16px 18px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap">
        <span style="font-size:13px;font-weight:600;flex:1">${escHtml(s.user_id)}</span>
        <span style="font-size:11px;color:var(--color-text-muted)">${m?escHtml(m.title):''}</span>
        ${badge(s.status)}
        <span style="font-size:11px;color:var(--color-text-muted)">${s.created_at?new Date(s.created_at).toLocaleDateString('tr-TR'):''}</span>
      </div>
      <div style="margin-bottom:8px">${egitimSubmissionAnswersHtml(s)}</div>
      ${s.admin_note?`<div style="font-size:12px;padding:7px 11px;background:rgba(224,165,83,0.08);border-radius:6px;margin-bottom:8px;color:var(--color-amber)">Not: ${escHtml(s.admin_note)}</div>`:''}
      ${s.status!=='onaylandi'?`<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" style="font-size:12px;padding:5px 12px;background:var(--color-green-light);color:#4caf81;border:1px solid rgba(76,175,129,0.3)" onclick="egitimOnayla(${s.id},${s.module_id},'${escHtml(s.user_id)}')">Onayla</button>
        <input id="enote-${s.id}" class="form-input" placeholder="Revize notu..." style="flex:1;min-width:140px;font-size:12px;padding:5px 9px"/>
        <button class="btn btn-ghost" style="font-size:12px;padding:5px 12px" onclick="egitimRevize(${s.id},'${escHtml(s.user_id)}')">Revize İste</button>
      </div>`:''}
    </div>`;
  }).join('');
}

async function egitimOnayla(subId, moduleId, userId) {
  const mods = [...egitimModules].sort((a,b) => a.order_index - b.order_index);
  const curIdx = mods.findIndex(m => m.id === moduleId);
  const next = mods[curIdx + 1];
  const ops = [
    sb.from('training_module_submissions').update({ status:'onaylandi', reviewed_at:new Date().toISOString() }).eq('id', subId),
    sb.from('user_module_access').upsert({ user_id:userId, module_id:moduleId, unlocked:true, completed:true, unlocked_at:new Date().toISOString() }, { onConflict:'user_id,module_id' }),
  ];
  if (next) ops.push(sb.from('user_module_access').upsert({ user_id:userId, module_id:next.id, unlocked:true, unlocked_at:new Date().toISOString() }, { onConflict:'user_id,module_id' }));
  await Promise.all(ops);
  const sub = egitimSubs.find(s => s.id === subId);
  if (sub) sub.status = 'onaylandi';
  const curAccess = egitimAccess.find(a => String(a.user_id) === String(userId) && String(a.module_id) === String(moduleId));
  if (curAccess) { curAccess.unlocked = true; curAccess.completed = true; }
  else egitimAccess.push({ user_id:userId, module_id:moduleId, unlocked:true, completed:true, unlocked_at:new Date().toISOString() });
  if (next) {
    const nextAccess = egitimAccess.find(a => String(a.user_id) === String(userId) && String(a.module_id) === String(next.id));
    if (nextAccess) nextAccess.unlocked = true;
    else egitimAccess.push({ user_id:userId, module_id:next.id, unlocked:true, completed:false, unlocked_at:new Date().toISOString() });
  }
  renderEgitimOnayPanel();
}

async function egitimRevize(subId, userId) {
  const note = document.getElementById(`enote-${subId}`)?.value.trim();
  const sub = egitimSubs.find(s => s.id === subId);
  const moduleId = sub?.module_id;
  const reviewedAt = new Date().toISOString();
  const ops = [
    sb.from('training_module_submissions').update({ status:'revize', admin_note:note||null, reviewed_at:reviewedAt }).eq('id', subId)
  ];
  if (moduleId) {
    const mods = [...egitimModules].sort((a,b) => a.order_index - b.order_index);
    const curIdx = mods.findIndex(m => String(m.id) === String(moduleId));
    if (curIdx >= 0) {
      ops.push(sb.from('user_module_access').upsert({
        user_id:userId,
        module_id:moduleId,
        unlocked:true,
        completed:false,
        unlocked_at:reviewedAt
      }, { onConflict:'user_id,module_id' }));
      mods.slice(curIdx + 1).forEach(m => {
        ops.push(sb.from('user_module_access').upsert({
          user_id:userId,
          module_id:m.id,
          unlocked:false,
          completed:false,
          unlocked_at:null
        }, { onConflict:'user_id,module_id' }));
      });
    }
  }
  await Promise.all(ops);
  if (sub) { sub.status='revize'; sub.admin_note=note||null; }
  if (moduleId) {
    const mods = [...egitimModules].sort((a,b) => a.order_index - b.order_index);
    const curIdx = mods.findIndex(m => String(m.id) === String(moduleId));
    if (curIdx >= 0) {
      const curAccess = egitimAccess.find(a => String(a.user_id) === String(userId) && String(a.module_id) === String(moduleId));
      if (curAccess) { curAccess.unlocked = true; curAccess.completed = false; }
      else egitimAccess.push({ user_id:userId, module_id:moduleId, unlocked:true, completed:false, unlocked_at:reviewedAt });
      mods.slice(curIdx + 1).forEach(m => {
        const access = egitimAccess.find(a => String(a.user_id) === String(userId) && String(a.module_id) === String(m.id));
        if (access) { access.unlocked = false; access.completed = false; access.unlocked_at = null; }
        else egitimAccess.push({ user_id:userId, module_id:m.id, unlocked:false, completed:false, unlocked_at:null });
      });
    }
  }
  renderEgitimOnayPanel();
}

// ===== ADMIN MODALS =====
function openEgitimModulModal(id) {
  const m = id ? egitimModules.find(x => x.id === id) : null;
  document.getElementById('egitim-modul-modal-title').textContent = m ? 'Seviyeyi Düzenle' : 'Yeni Seviye';
  document.getElementById('em-id').value = m ? m.id : '';
  document.getElementById('em-title').value = m ? m.title : '';
  document.getElementById('em-desc').value = m ? (m.description||'') : '';
  document.getElementById('em-cover').value = m ? (m.cover_image||'') : '';
  egitimShowCoverPreview(m ? (m.cover_image||'') : '');
  document.getElementById('em-order').value = m ? m.order_index : (egitimModules.length + 1);
  document.getElementById('em-visible').checked = m ? m.is_visible !== false : true;
  document.getElementById('modal-egitim-modul').classList.add('open');
}

async function saveEgitimModul() {
  const id = document.getElementById('em-id').value;
  const payload = {
    title: document.getElementById('em-title').value.trim(),
    description: document.getElementById('em-desc').value.trim(),
    cover_image: document.getElementById('em-cover').value.trim() || null,
    order_index: +document.getElementById('em-order').value || 1,
    is_visible: document.getElementById('em-visible').checked
  };
  if (!payload.title) { alert('Seviye adı gerekli'); return; }
  let res;
  if (id) { res = await sb.from('training_modules').update(payload).eq('id', id).select().single(); }
  else { res = await sb.from('training_modules').insert(payload).select().single(); }
  if (res?.error) { alert('Kayıt hatası: ' + res.error.message); return; }
  closeModal('modal-egitim-modul');
  if (res?.data) {
    if (id) { const idx = egitimModules.findIndex(x=>x.id==id); if(idx>=0) egitimModules[idx]={...egitimModules[idx],...res.data}; }
    else egitimModules.push(res.data);
  }
  renderEgitimGrid();
}

async function deleteEgitimModul(id) {
  if (!confirm('Seviyeyi sil? İçindeki bölümler ve dersler de silinir.')) return;
  const tIds = egitimTopics.filter(t => t.module_id === id).map(t => t.id);
  if (tIds.length) await sb.from('training_lessons').delete().in('topic_id', tIds);
  await sb.from('training_topics').delete().eq('module_id', id);
  await sb.from('training_modules').delete().eq('id', id);
  egitimModules = egitimModules.filter(x => x.id !== id);
  egitimTopics  = egitimTopics.filter(x => x.module_id !== id);
  renderEgitimGrid();
}

function openEgitimKonuModal(moduleId, topicId) {
  const t = topicId ? egitimTopics.find(x => x.id === topicId) : null;
  document.getElementById('egitim-konu-modal-title').textContent = t ? 'Bölümü Düzenle' : 'Yeni Bölüm';
  document.getElementById('ek-id').value = t ? t.id : '';
  document.getElementById('ek-module-id').value = moduleId;
  document.getElementById('ek-title').value = t ? t.title : '';
  document.getElementById('ek-order').value = t ? t.order_index : (egitimTopics.filter(x=>x.module_id==moduleId).length + 1);
  document.getElementById('ek-visible').checked = t ? t.is_visible !== false : true;
  document.getElementById('modal-egitim-konu').classList.add('open');
}

async function saveEgitimKonu() {
  const id = document.getElementById('ek-id').value;
  const moduleId = +document.getElementById('ek-module-id').value;
  const payload = { module_id:moduleId, title:document.getElementById('ek-title').value.trim(), order_index:+document.getElementById('ek-order').value||1, is_visible:document.getElementById('ek-visible').checked };
  if (!payload.title) { alert('Bölüm adı gerekli'); return; }
  let res;
  if (id) { res = await sb.from('training_topics').update(payload).eq('id', id).select().single(); }
  else { res = await sb.from('training_topics').insert(payload).select().single(); }
  if (res?.error) { alert('Kayıt hatası: ' + res.error.message); return; }
  closeModal('modal-egitim-konu');
  if (res?.data) {
    if (id) { const idx = egitimTopics.findIndex(x=>x.id==id); if(idx>=0) egitimTopics[idx]={...egitimTopics[idx],...res.data}; }
    else egitimTopics.push(res.data);
  }
  if (egitimCurrentModule) renderEgitimNav(egitimCurrentModule);
  else renderEgitimGrid();
}

async function deleteEgitimKonu(id) {
  if (!confirm('Bölümü ve derslerini sil?')) return;
  await sb.from('training_lessons').delete().eq('topic_id', id);
  await sb.from('training_topics').delete().eq('id', id);
  egitimTopics = egitimTopics.filter(x => x.id !== id);
  egitimLessons = egitimLessons.filter(x => x.topic_id !== id);
  if (egitimCurrentModule) renderEgitimNav(egitimCurrentModule);
  else renderEgitimGrid();
}

function openEgitimDersModal(topicId, lessonId) {
  const l = lessonId ? egitimLessons.find(x => x.id === lessonId) : null;
  document.getElementById('egitim-ders-modal-title').textContent = l ? 'Dersi Düzenle' : 'Yeni Ders';
  document.getElementById('ed2-id').value = l ? l.id : '';
  document.getElementById('ed2-topic-id').value = topicId;
  document.getElementById('ed2-title').value = l ? l.title : '';
  document.getElementById('ed2-desc').value = l ? (l.description||'') : '';
  document.getElementById('ed2-resource').value = l ? (l.resource_url||'') : '';
  document.getElementById('ed2-order').value = l ? l.order_index : (egitimLessons.filter(x=>x.topic_id==topicId).length + 1);
  document.getElementById('ed2-visible').checked = l ? l.is_visible !== false : true;
  document.getElementById('ed2-video').value = l ? (l.video_url || '') : '';
  document.getElementById('modal-egitim-ders').classList.add('open');
}

async function saveEgitimDers() {
  const id = document.getElementById('ed2-id').value;
  const payload = {
    topic_id: +document.getElementById('ed2-topic-id').value,
    title: document.getElementById('ed2-title').value.trim(),
    description: document.getElementById('ed2-desc').value.trim(),
    video_url: document.getElementById('ed2-video').value.trim()||null,
    resource_url: document.getElementById('ed2-resource').value.trim()||null,
    order_index: +document.getElementById('ed2-order').value||1,
    is_visible: document.getElementById('ed2-visible').checked
  };
  if (!payload.title) { alert('Ders başlığı gerekli'); return; }
  let res;
  if (id) { res = await sb.from('training_lessons').update(payload).eq('id', id).select().single(); }
  else { res = await sb.from('training_lessons').insert(payload).select().single(); }
  if (res?.error) { alert('Kayıt hatası: ' + res.error.message); return; }
  closeModal('modal-egitim-ders');
  if (res?.data) {
    if (id) { const idx = egitimLessons.findIndex(x=>x.id==id); if(idx>=0) egitimLessons[idx]={...egitimLessons[idx],...res.data}; }
    else egitimLessons.push(res.data);
  }
  if (egitimCurrentModule) renderEgitimNav(egitimCurrentModule);
  else renderEgitimGrid();
  if (id && egitimCurrentLesson != null && String(egitimCurrentLesson) === String(id)) {
    renderEgitimLessonContent(egitimCurrentLesson);
  }
}

async function deleteEgitimDers(id) {
  if (!confirm('Dersi sil?')) return;
  await sb.from('training_lessons').delete().eq('id', id);
  egitimLessons = egitimLessons.filter(x => x.id !== id);
  if (egitimCurrentLesson === id) { egitimCurrentLesson = null; if(egitimCurrentModule) renderEgitimModuleIntro(egitimCurrentModule); }
  if (egitimCurrentModule) renderEgitimNav(egitimCurrentModule);
  else renderEgitimGrid();
}

// ══════════════════════════════════════════════════════════
//  ASISTANLAR (CHATBOT) MODULE
// ══════════════════════════════════════════════════════════
let cbBots = [];
let cbActiveBot = null;
let cbSessionId = null;
let cbMessages = [];

async function loadAsistanlarPage() {
  await cbFetchBots();
  cbShowList();
}

async function cbFetchBots() {
  const isAdmin = currentUser?.role === 'admin';
  let q = sb.from('chatbots').select('*').order('created_at');
  if(!isAdmin) q = q.eq('is_active', true);
  const { data } = await q;
  cbBots = data ?? [];
}

function cbShowList() {
  cbActiveBot = null; cbSessionId = null; cbMessages = [];
  document.getElementById('cb-back-btn').style.display = 'none';
  document.getElementById('cb-new-btn').style.display = '';
  document.getElementById('cb-subtitle').textContent = 'Yapay zeka chatbotların';
  const isAdmin = currentUser?.role === 'admin';
  const area = document.getElementById('cb-area');

  const banner = `<div style="margin-bottom:32px;padding:28px 32px;background:linear-gradient(135deg,rgba(201,144,90,0.07) 0%,rgba(255,255,255,0.015) 100%);border:1px solid rgba(201,144,90,0.22);border-radius:16px;position:relative;overflow:hidden">
    <div style="position:absolute;top:-80px;left:-80px;width:260px;height:260px;background:radial-gradient(circle,rgba(201,144,90,0.1) 0%,transparent 70%);pointer-events:none"></div>
    <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:rgba(201,144,90,0.12);border:1px solid rgba(201,144,90,0.3);border-radius:20px;margin-bottom:14px">
      <span style="width:6px;height:6px;background:#c9905a;border-radius:50%;display:inline-block;box-shadow:0 0 6px rgba(201,144,90,0.8)"></span>
      <span style="font-size:11px;font-weight:600;color:#c9905a;letter-spacing:0.06em;text-transform:uppercase">Beta Süreci</span>
    </div>
    <div style="font-size:18px;font-weight:700;color:var(--color-text-primary);letter-spacing:-0.4px;margin-bottom:10px;line-height:1.45">Yeni nesil Dijital Barista asistan sistemi şu anda geliştiriliyor.</div>
    <div style="font-size:13.5px;color:var(--color-text-secondary);line-height:1.75;max-width:680px;margin-bottom:12px">Yakında tüm chatbotlarla doğrudan konuşabilecek, kendi işine özel sistemler oluşturabilecek ve yapay zeka destekli iş geliştirme araçlarını tek panelden kullanabileceksin.</div>
    <div style="font-size:12px;color:var(--color-text-muted)">⚠️ Bazı chatbotlar henüz geliştirme aşamasındadır.</div>
  </div>`;

  const renderCard = bot => {
    const cats = Array.isArray(bot.categories) ? bot.categories : [];
    const inactive = !bot.is_active;
    const adminControls = isAdmin ? `
      <div class="tb-card-actions" style="position:absolute;top:8px;right:8px;display:none;gap:4px">
        <button class="tb-edit-btn" title="Düzenle" onclick="event.stopPropagation();cbOpenEditor('${bot.id}')">✏️</button>
        <button class="tb-del-btn" title="Sil" onclick="event.stopPropagation();cbDeleteBot('${bot.id}')">🗑</button>
      </div>` : '';
    const inactiveClass = (inactive && isAdmin) ? 'tb-unpublished' : '';
    const catChips = cats.length
      ? cats.map(c => `<span class="db-cat ${catClass(c)}">${escHtml(c)}</span>`).join('')
      : `<span class="db-cat" style="background:rgba(147,112,219,0.12);color:#9370db;border-color:rgba(147,112,219,0.25)">Sohbet</span>`;
    return `<div style="position:relative" onmouseenter="this.querySelector('.tb-card-actions')&&(this.querySelector('.tb-card-actions').style.display='flex')" onmouseleave="this.querySelector('.tb-card-actions')&&(this.querySelector('.tb-card-actions').style.display='none')">
      ${adminControls}
      <div class="db-card ${inactiveClass}" style="cursor:pointer" onclick="cbOpenChat('${bot.id}')">
        <div class="db-card-icon">${escHtml(bot.avatar_emoji||'✦')}</div>
        <div class="db-card-title">${escHtml(bot.name)}</div>
        <div class="db-card-desc">${escHtml(bot.description||'Soru sormak için tıkla')}</div>
        <div class="db-cats">${catChips}</div>
      </div>
    </div>`;
  };

  const visible = cbBots.filter(b => isAdmin || b.is_active);
  const cardsHtml = visible.length
    ? `<div class="db-grid">${visible.map(renderCard).join('')}</div>`
    : `<div style="text-align:center;padding:60px 20px;color:var(--color-text-muted)">
        <div style="font-size:48px;margin-bottom:16px">🤖</div>
        <div style="font-size:15px;font-weight:600;color:var(--color-text-secondary);margin-bottom:8px">Henüz asistan yok</div>
        ${isAdmin ? '<div style="font-size:13px">Yeni chatbot eklemek için "+ Yeni Chatbot" butonunu kullan.</div>' : '<div style="font-size:13px">Yakında chatbotlar burada görünecek.</div>'}
      </div>`;

  area.innerHTML = banner + cardsHtml;
}

async function cbOpenChat(botId) {
  cbActiveBot = cbBots.find(b => b.id === botId);
  if (!cbActiveBot) return;
  cbSessionId = null; cbMessages = [];
  document.getElementById('cb-back-btn').style.display = '';
  document.getElementById('cb-new-btn').style.display = 'none';
  document.getElementById('cb-subtitle').textContent = cbActiveBot.name;
  const area = document.getElementById('cb-area');
  area.innerHTML = `
    <div class="cb-chat-wrap">
      <div class="cb-chat-header">
        <span style="font-size:28px">${cbActiveBot.avatar_emoji || '🤖'}</span>
        <div>
          <div style="font-size:14px;font-weight:600;color:var(--color-text-primary)">${cbActiveBot.name}</div>
          <div style="font-size:12px;color:var(--color-text-muted)">${cbActiveBot.description || ''}</div>
        </div>
      </div>
      <div class="cb-chat-messages" id="cb-msgs">
        <div class="cb-msg assistant">Merhaba! Size nasıl yardımcı olabilirim?</div>
      </div>
      ${(cbActiveBot.starter_questions||[]).length > 0 ? `<div id="cb-starters" style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border-top:1px solid var(--color-border)">
        ${(cbActiveBot.starter_questions||[]).map(q => `<button style="font-size:12px;padding:7px 14px;border-radius:20px;text-align:left;background:transparent;border:1.5px solid var(--color-accent);color:var(--color-accent);cursor:pointer;transition:background .15s" onmouseover="this.style.background='var(--color-accent)';this.style.color='#fff'" onmouseout="this.style.background='transparent';this.style.color='var(--color-accent)'" onclick="cbSendStarter(this,'${q.replace(/'/g,"&#39;")}')">${q}</button>`).join('')}
      </div>` : ''}
      <div class="cb-chat-input-row">
        <textarea class="cb-chat-input" id="cb-input" placeholder="Mesajınızı yazın..." rows="1"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();cbSend()}"></textarea>
        <button class="btn btn-primary" onclick="cbSend()" style="align-self:flex-end">Gönder</button>
      </div>
    </div>`;
}

async function cbDeleteDoc(docId, btn) {
  if (!confirm('Bu belgeyi silmek istiyor musun?')) return;
  await sb.from('chatbot_chunks').delete().eq('document_id', docId);
  await sb.from('chatbot_documents').delete().eq('id', docId);
  btn.closest('.cb-doc-chip').remove();
}

function cbSendStarter(btn, text) {
  document.getElementById('cb-starters')?.remove();
  document.getElementById('cb-input').value = text;
  cbSend();
}

async function cbSend() {
  const input = document.getElementById('cb-input');
  const text = (input.value || '').trim();
  if (!text || !cbActiveBot) return;
  input.value = '';
  input.style.height = '';
  cbAppendMsg('user', text);
  cbAppendMsg('assistant', '...', true);
  try {
    const res = await fetch(CHATBOT_CHAT_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ chatbot_id: cbActiveBot.id, session_id: cbSessionId, user_id: currentUser.email, message: (window.withJourneyContext?window.withJourneyContext(text):text), journey_context: (window.getJourneyContext?window.getJourneyContext():'') }),
    });
    const data = await res.json();
    if (data.session_id) cbSessionId = data.session_id;
    cbRemoveTyping();
    cbAppendMsg('assistant', cleanAssistantText(data.reply || 'Bir hata oluştu.'));
  } catch(e) {
    cbRemoveTyping();
    cbAppendMsg('assistant', 'Bağlantı hatası. Tekrar dene.');
  }
}

function cleanAssistantText(v) {
  return String(v ?? '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cbAppendMsg(role, text, typing=false) {
  const msgs = document.getElementById('cb-msgs');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = `cb-msg ${role}${typing ? ' typing' : ''}`;
  if (typing) div.id = 'cb-typing';
  if (role === 'assistant' && !typing) {
    div.innerHTML = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/#{1,3} (.+)/g,'<strong>$1</strong>')
      .replace(/\n/g,'<br>');
  } else {
    div.textContent = text;
  }
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function cbRemoveTyping() {
  const t = document.getElementById('cb-typing');
  if (t) t.remove();
}

// ── Admin: editor ──────────────────────────────────────────
let cbEditingId = null;
let cbEditDocs = [];

async function cbOpenEditor(botId = null) {
  cbEditingId = botId;
  cbEditDocs = [];
  const bot = botId ? cbBots.find(b => b.id === botId) : null;
  document.getElementById('cb-back-btn').style.display = '';
  document.getElementById('cb-new-btn').style.display = 'none';
  document.getElementById('cb-subtitle').textContent = bot ? 'Chatbot Düzenle' : 'Yeni Chatbot';

  // Mevcut dokümanları çek
  let savedDocs = [];
  if (botId) {
    const { data } = await sb.from('chatbot_documents').select('id, filename, created_at').eq('chatbot_id', botId).order('created_at');
    savedDocs = data || [];
  }

  const area = document.getElementById('cb-area');
  area.innerHTML = `
    <div class="cb-editor">
      <div style="display:grid;grid-template-columns:60px 1fr;gap:12px;margin-bottom:16px;align-items:center">
        <div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:4px">Emoji</div>
          <input id="cb-emoji" value="${bot?.avatar_emoji||'✦'}" style="width:54px;font-size:24px;text-align:center;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:6px;color:var(--color-text-primary)">
        </div>
        <div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:4px">Baristan Adı</div>
          <input id="cb-name" class="form-input" placeholder="örn. Satış Koçu" value="${bot?.name||''}">
        </div>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:4px">Kısa Açıklama</div>
        <input id="cb-desc" class="form-input" placeholder="Kullanıcılara gösterilecek kısa açıklama" value="${bot?.description||''}">
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:4px">Talimatlar (Sistem Prompt)</div>
        <textarea id="cb-prompt" class="form-input" rows="5" placeholder="Bu asistan sadece satış eğitimi konularında yanıt verir. Konu dışı sorulara 'Bu konuda yardımcı olamam' de.">${bot?.system_prompt||''}</textarea>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:6px">Konuşma Başlatıcılar <span style="opacity:.5">(opsiyonel, max 4)</span></div>
        ${[0,1,2,3].map(i => `<input id="cb-sq-${i}" class="form-input" style="margin-bottom:6px" placeholder="örn. Sıcak kitle nedir?" value="${(bot?.starter_questions||[])[i]||''}">`).join('')}
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:6px">Belgeler</div>
        <div id="cb-saved-docs" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          ${savedDocs.map(d => `<span class="cb-doc-chip" style="background:var(--color-bg-tertiary)">📄 ${d.filename}<button onclick="cbDeleteDoc('${d.id}',this)">×</button></span>`).join('')}
          ${savedDocs.length === 0 ? '<span style="font-size:12px;color:var(--color-text-muted)">Henüz belge yok</span>' : ''}
        </div>
        <input type="file" id="cb-file-input" accept=".txt,.pdf,.md" style="display:none" onchange="cbHandleFile(this)">
        <button class="btn btn-ghost" onclick="document.getElementById('cb-file-input').click()">+ Yeni Dosya Ekle</button>
        <div id="cb-doc-list" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px"></div>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-size:11px;color:var(--color-text-muted);margin-bottom:4px">Kategoriler / Etiketler <span style="opacity:.5">(virgülle ayır, örn: Satış, Pazarlama)</span></div>
        <input id="cb-categories" class="form-input" placeholder="Satış, Pazarlama, Operasyon" value="${(bot?.categories||[]).join(', ')}">
      </div>
      <div style="margin-bottom:20px;display:flex;align-items:center;gap:10px">
        <input type="checkbox" id="cb-active" style="width:16px;height:16px;accent-color:var(--color-accent);cursor:pointer" ${bot?.is_active !== false ? 'checked' : ''}>
        <label for="cb-active" style="font-size:13px;color:var(--color-text-secondary);cursor:pointer">Aktif — kullanıcılar görebilir</label>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="cbSaveBot()">Kaydet</button>
        <button class="btn btn-ghost" onclick="cbShowList()">İptal</button>
      </div>
    </div>`;
}

async function cbHandleFile(input) {
  const file = input.files[0];
  if (!file) return;
  let text = '';
  if (file.name.toLowerCase().endsWith('.pdf')) {
    try {
      if (!window.pdfjsLib) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      const buf = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str).join(' '));
      }
      text = pages.join('\n\n');
      if (!text.trim()) {
        alert('PDF\'den metin okunamadı. Bu PDF taranmış/görsel tabanlı olabilir. Lütfen metin içeren bir PDF veya .txt dosyası kullanın.');
        return;
      }
    } catch(e) {
      alert('PDF okunamadı: ' + e.message);
      return;
    }
  } else {
    text = await file.text();
  }
  cbEditDocs.push({ filename: file.name, content: text });
  const list = document.getElementById('cb-doc-list');
  list.innerHTML = cbEditDocs.map((d,i) => `
    <span class="cb-doc-chip">${d.filename} (${d.content.length} kr)<button onclick="cbEditDocs.splice(${i},1);cbHandleFile({files:[]})">×</button></span>`).join('');
  input.value = '';
}

async function cbSaveBot() {
  const name = document.getElementById('cb-name').value.trim();
  if (!name) { alert('Baristan adı gerekli'); return; }
  const categoriesRaw = document.getElementById('cb-categories')?.value || '';
  const payload = {
    name,
    description:       document.getElementById('cb-desc').value.trim(),
    system_prompt:     document.getElementById('cb-prompt').value.trim(),
    avatar_emoji:      document.getElementById('cb-emoji').value.trim() || '🤖',
    starter_questions: [0,1,2,3].map(i => document.getElementById(`cb-sq-${i}`)?.value.trim()).filter(Boolean),
    categories:        categoriesRaw.split(',').map(s=>s.trim()).filter(Boolean),
    is_active:         document.getElementById('cb-active')?.checked ?? true,
  };
  let botId = cbEditingId;
  if (botId) {
    await sb.from('chatbots').update(payload).eq('id', botId);
  } else {
    const { data } = await sb.from('chatbots').insert(payload).select('id').single();
    botId = data?.id;
  }
  // Dokümanları yükle
  for (const doc of cbEditDocs) {
    const r = await fetch(CHATBOT_INGEST_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ chatbot_id: botId, filename: doc.filename, content: doc.content }),
    });
    const rj = await r.json().catch(() => ({}));
    if (!r.ok) { alert(`Belge yükleme hatası (${doc.filename}): ${JSON.stringify(rj)}`); return; }
  }
  alert(cbEditDocs.length > 0 ? `Kaydedildi! ${cbEditDocs.length} belge yüklendi.` : 'Kaydedildi!');
  await cbFetchBots();
  cbShowList();
}

async function cbDeleteBot(id) {
  if (!confirm('Bu asistanı silmek istediğinden emin misin?')) return;
  await sb.from('chatbots').update({ is_active: false }).eq('id', id);
  await cbFetchBots();
  cbShowList();
}

/* ============================================================
   FORUM
   ============================================================ */
const forumState = { posts: [], comments: {}, reactionCounts: {}, myReactions: new Set(), openComments: new Set() };

async function loadForum() {
  const addBtn = document.getElementById('forum-add-btn');
  if (addBtn) addBtn.style.display = currentUser?.role === 'admin' ? '' : 'none';

  const [postsRes, commentsRes, reactionsRes] = await Promise.all([
    sb.from('forum_posts').select('*').order('created_at', { ascending: false }),
    sb.from('forum_comments').select('*').order('created_at', { ascending: true }),
    sb.from('forum_reactions').select('post_id, user_id'),
  ]);

  forumState.posts = postsRes.data || [];

  forumState.comments = {};
  for (const c of (commentsRes.data || [])) {
    if (!forumState.comments[c.post_id]) forumState.comments[c.post_id] = [];
    forumState.comments[c.post_id].push(c);
  }

  forumState.reactionCounts = {};
  forumState.myReactions = new Set();
  for (const r of (reactionsRes.data || [])) {
    forumState.reactionCounts[r.post_id] = (forumState.reactionCounts[r.post_id] || 0) + 1;
    if (r.user_id === currentUser?.email) forumState.myReactions.add(+r.post_id);
  }

  renderForum();
}

function renderForum() {
  const el = document.getElementById('forum-list');
  if (!el) return;
  if (!forumState.posts.length) {
    el.innerHTML = '<div style="color:rgba(255,255,255,0.25);font-size:13px;padding:8px 0">Henüz paylaşım yok.</div>';
    return;
  }
  el.innerHTML = forumState.posts.map(p => forumRenderCard(p)).join('');
}

function forumRenderCard(p) {
  const isAdmin  = currentUser?.role === 'admin';
  const date     = new Date(p.created_at).toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' });
  const videoHtml = p.video_url ? `<div class="forum-card-video">${forumVideoEmbed(p.video_url)}</div>` : '';
  const liked    = forumState.myReactions.has(+p.id);
  const likeCount = forumState.reactionCounts[p.id] || 0;
  const comments  = forumState.comments[p.id] || [];
  const commentsOpen = forumState.openComments.has(+p.id);

  const commentsHtml = commentsOpen ? `
    <div class="forum-comments" id="forum-comments-${p.id}">
      ${comments.length ? comments.map(c => `
        <div class="forum-comment">
          <div class="forum-comment-avatar">${escHtml((c.author_name||'?')[0].toUpperCase())}</div>
          <div class="forum-comment-body">
            <div class="forum-comment-author">${escHtml(c.author_name||'Kullanıcı')}</div>
            <div class="forum-comment-text">${escHtml(c.body)}</div>
          </div>
          ${(isAdmin || c.user_id === currentUser?.email) ? `<button onclick="deleteForumComment(${c.id},${p.id})" style="background:none;border:none;color:rgba(255,255,255,0.2);cursor:pointer;font-size:13px;padding:2px 4px;line-height:1;flex-shrink:0" title="Sil">✕</button>` : ''}
        </div>`).join('') : '<div style="font-size:12px;color:rgba(255,255,255,0.2);padding:4px 0 8px">Henüz yorum yok.</div>'}
      <div class="forum-comment-input-row">
        <input class="forum-comment-input" id="fc-input-${p.id}" placeholder="Yorum yaz..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();addForumComment(${p.id})}" />
        <button class="forum-comment-send" onclick="addForumComment(${p.id})">Gönder</button>
      </div>
    </div>` : '';

  const adminBtns = isAdmin ? `
    <button class="eg-pill-btn" onclick="openForumModal(${JSON.stringify(p).replace(/"/g,'&quot;')})">düzenle</button>
    <button class="eg-pill-btn red" onclick="deleteForumPost(${p.id})">sil</button>` : '';

  return `<div class="forum-card" id="forum-card-${p.id}">
    <div class="forum-card-head">
      <div class="forum-card-title">${escHtml(p.title)}</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="forum-card-date">${date}</div>
        ${adminBtns}
      </div>
    </div>
    ${p.body ? `<div class="forum-card-body">${escHtml(p.body)}</div>` : ''}
    ${videoHtml}
    <div class="forum-card-footer">
      <button class="forum-reaction-btn ${liked ? 'liked' : ''}" onclick="toggleForumReaction(${p.id})">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14s-6-3.9-6-8a4 4 0 0 1 7.4-2.1A4 4 0 0 1 14 6c0 4.1-6 8-6 8z"/></svg>
        ${likeCount > 0 ? likeCount : ''}
      </button>
      <button class="forum-comment-btn ${commentsOpen ? 'active' : ''}" onclick="forumToggleComments(${p.id})">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5l-3 2V4a1 1 0 0 1 1-1z"/></svg>
        ${comments.length > 0 ? comments.length : ''} Yorum
      </button>
    </div>
    ${commentsHtml}
  </div>`;
}

function forumVideoEmbed(url) {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen></iframe>`;
  return `<video src="${escHtml(url)}" controls></video>`;
}

function forumToggleComments(postId) {
  if (forumState.openComments.has(+postId)) forumState.openComments.delete(+postId);
  else forumState.openComments.add(+postId);
  renderForum();
  if (forumState.openComments.has(+postId)) {
    setTimeout(() => document.getElementById(`fc-input-${postId}`)?.focus(), 50);
  }
}

async function toggleForumReaction(postId) {
  const liked = forumState.myReactions.has(+postId);
  if (liked) {
    await sb.from('forum_reactions').delete().eq('post_id', postId).eq('user_id', currentUser.email);
    forumState.myReactions.delete(+postId);
    forumState.reactionCounts[postId] = Math.max(0, (forumState.reactionCounts[postId] || 1) - 1);
  } else {
    await sb.from('forum_reactions').insert({ post_id: postId, user_id: currentUser.email });
    forumState.myReactions.add(+postId);
    forumState.reactionCounts[postId] = (forumState.reactionCounts[postId] || 0) + 1;
  }
  renderForum();
}

async function addForumComment(postId) {
  const input = document.getElementById(`fc-input-${postId}`);
  const body = input?.value.trim();
  if (!body) return;

  const { data } = await sb.from('forum_comments').insert({
    post_id: postId,
    user_id: currentUser.email,
    author_name: currentUser.name || currentUser.email.split('@')[0],
    body,
  }).select().single();

  if (data) {
    if (!forumState.comments[postId]) forumState.comments[postId] = [];
    forumState.comments[postId].push(data);
    renderForum();
    setTimeout(() => document.getElementById(`fc-input-${postId}`)?.focus(), 50);
  }
}

async function deleteForumComment(commentId, postId) {
  await sb.from('forum_comments').delete().eq('id', commentId);
  forumState.comments[postId] = (forumState.comments[postId] || []).filter(c => c.id !== commentId);
  renderForum();
}

function openForumModal(post) {
  document.getElementById('forum-post-id').value = post?.id ?? '';
  document.getElementById('forum-post-title').value = post?.title ?? '';
  document.getElementById('forum-post-body').value = post?.body ?? '';
  document.getElementById('forum-post-video').value = post?.video_url ?? '';
  document.getElementById('forum-modal-title').textContent = post ? 'Paylaşımı Düzenle' : 'Paylaşım Ekle';
  openModal('modal-forum-post');
}

async function saveForumPost() {
  const id    = document.getElementById('forum-post-id').value;
  const title = document.getElementById('forum-post-title').value.trim();
  const body  = document.getElementById('forum-post-body').value.trim();
  const video = document.getElementById('forum-post-video').value.trim();
  if (!title) { toast('Başlık gerekli'); return; }
  const payload = { title, body: body||null, video_url: video||null };
  if (id) await sb.from('forum_posts').update(payload).eq('id', id);
  else     await sb.from('forum_posts').insert(payload);
  closeModal('modal-forum-post');
  toast(id ? 'Paylaşım güncellendi ✓' : 'Paylaşım eklendi ✓');
  loadForum();
}

async function deleteForumPost(id) {
  if (!confirm('Bu paylaşımı silmek istiyor musun?')) return;
  await sb.from('forum_posts').delete().eq('id', id);
  toast('Paylaşım silindi');
  loadForum();
}