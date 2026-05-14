
/* ============================================================
   OVERRIDE — Digital Coffee style assistant page
   ============================================================ */
function cbAssistantSeeds(bot){
  const q=(bot?.starter_questions||[]).filter(Boolean);
  const fallback=[
    ['Başla','Hızlı yardım','Ne üzerinde çalışmak istediğini yaz; ben yönlendireyim.'],
    ['Hedefimi netleştir','Strateji','Bu oturumdan net bir çıktı çıkaralım.'],
    ['Brain dump','Açık konuşma','Aklımdakileri toparlamama yardım et.'],
    ['Sonraki adımlar','Aksiyon','Bulunduğum yere göre somut sonraki adımları ver.']
  ];
  return fallback.map((f,i)=>({title:q[i]||f[0],type:f[1],desc:f[2]}));
}
function cbConversationHistoryHtml(){
  return `
    <div class="cb-section-label" style="margin-top:20px">Geçmiş</div>
    <div class="cb-history-row"><div class="cb-bot-avatar" style="width:28px;height:28px;font-size:13px">☕</div><div style="min-width:0"><div class="cb-history-title">Bugünkü odağımı netleştir</div><div class="cb-history-sub">17 mesaj · Dün</div></div></div>
    <div class="cb-history-row"><div class="cb-bot-avatar" style="width:28px;height:28px;font-size:13px">☕</div><div style="min-width:0"><div class="cb-history-title">Teklifimi nasıl anlatmalıyım?</div><div class="cb-history-sub">8 mesaj · Bu hafta</div></div></div>
    <div class="cb-history-row"><div class="cb-bot-avatar" style="width:28px;height:28px;font-size:13px">☕</div><div style="min-width:0"><div class="cb-history-title">İçerik fikrini satışa bağla</div><div class="cb-history-sub">12 mesaj · Eski</div></div></div>`;
}
function cbRenderShell(activeBotId=null, mode='welcome'){
  const isAdmin = currentUser?.role === 'admin';
  const visible = cbBots.filter(b=>isAdmin || b.is_active);
  const active = activeBotId ? visible.find(b=>b.id===activeBotId) : (visible[0] || {id:'sanal-mehmet',name:'Sanal Mehmet',description:'Your head barista',avatar_emoji:'✦',starter_questions:[]});
  cbActiveBot = active.id === 'sanal-mehmet' ? null : active;
  document.getElementById('cb-back-btn') && (document.getElementById('cb-back-btn').style.display='none');
  document.getElementById('cb-new-btn') && (document.getElementById('cb-new-btn').style.display=isAdmin?'':'none');
  document.getElementById('cb-subtitle') && (document.getElementById('cb-subtitle').textContent='Sanal Mehmet ve chatbotlar');
  const botRows = visible.map(bot=>`
    <div class="cb-bot-row ${active.id===bot.id?'active':''}" onclick="cbOpenChat('${bot.id}')">
      <div class="cb-bot-avatar">${escHtml(bot.avatar_emoji||'☕')}</div>
      <div style="min-width:0;flex:1"><div class="cb-bot-name">${escHtml(bot.name)}</div><div class="cb-bot-desc">${escHtml(bot.description||'Konuşma başlat')}</div></div>
      ${isAdmin?`<div class="cb-row-actions"><button class="cb-icon-btn" onclick="event.stopPropagation();cbOpenEditor('${bot.id}')">✎</button><button class="cb-icon-btn" onclick="event.stopPropagation();cbDeleteBot('${bot.id}')">×</button></div>`:''}
    </div>`).join('') || `<div style="padding:20px;color:#9B8B7A;font-size:13px">Henüz asistan yok.</div>`;
  const starters = cbAssistantSeeds(active);
  const area=document.getElementById('cb-area');
  area.innerHTML=`
    <div class="cb-shell">
      <aside class="cb-left">
        <div class="cb-brand"><div class="cb-brand-logo">☕</div><div class="cb-brand-name">Dijital Barista</div></div>
        <div class="cb-left-nav">
          <div class="cb-section-label">Menü</div>
          <div class="cb-left-link active"><span>🧑‍💼</span><span>Sanal Mehmet</span></div>
          <div class="cb-left-link" onclick="go('egitim',document.getElementById('nav-egitim'))"><span>📚</span><span>Dersler</span></div>
          <div class="cb-left-link" onclick="go('barista',document.querySelector('[onclick*=barista]'))"><span>🧰</span><span>Alet Çantası</span></div>
          <div class="cb-left-link" onclick="go('reports',document.querySelector('[onclick*=reports]'))"><span>📊</span><span>Metrikler</span></div>
        </div>
        <div class="cb-left-bottom"><div style="display:flex;align-items:center;gap:10px"><div class="sme-user-avatar">DB</div><div style="min-width:0"><div style="font-size:12.5px;font-weight:700;color:#1A1510;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(currentUser?.name||'Dijital Barista')}</div><div style="font-size:11px;color:#9B8B7A">${isAdmin?'Admin Panel':'Koç & Mentor'}</div></div></div></div>
      </aside>
      <aside class="cb-panel">
        <div class="cb-panel-head"><div class="cb-panel-title">Chatbot</div>${isAdmin?`<button class="btn btn-primary" style="font-size:11px;padding:6px 10px" onclick="cbOpenEditor()">+ Yeni</button>`:`<button class="cb-panel-close">×</button>`}</div>
        <div class="cb-panel-scroll">
          <div class="cb-section-label">Baristalar ${visible.length}</div>
          ${botRows}
          ${cbConversationHistoryHtml()}
        </div>
      </aside>
      <main class="cb-main">
        <div class="cb-chat-top"><div class="cb-bot-avatar">${escHtml(active.avatar_emoji||'🧑‍💼')}</div><div><div class="cb-chat-title">${escHtml(active.name||'Sanal Mehmet')}</div><div class="cb-chat-sub">${escHtml(active.description||'İşini birlikte netleştirelim')}</div></div></div>
        <div class="cb-chat-stage">
          <div class="cb-welcome" id="cb-welcome">
            <div class="cb-welcome-line"><div class="sme-greeting-avatar">${escHtml((active.name||'M').trim().charAt(0).toUpperCase())}</div><div>Merhaba, ben ${escHtml(active.name||'Sanal Mehmet')}. Bugün ne üzerinde çalışıyoruz?</div></div>
            <div class="cb-prompt-grid">
              ${starters.map((x,i)=>`<div class="cb-prompt-card ${i===2?'wide':''}" onclick="cbSendStarterModern('${String(x.title).replace(/'/g,'&#39;')}')"><div class="cb-prompt-title">${escHtml(x.title)}</div><div class="cb-prompt-type">${escHtml(x.type)}</div><div class="cb-prompt-desc">${escHtml(x.desc)}</div></div>`).join('')}
            </div>
          </div>
          <div class="cb-messages-modern" id="cb-msgs" style="display:none"></div>
          <div class="cb-input-modern"><span style="font-size:20px;color:#C8BAAB">+</span><textarea id="cb-input" placeholder="${escHtml(active.name||'Sanal Mehmet')} ile konuş..." rows="1" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();cbSend()}"></textarea><button onclick="cbSend()">↑</button></div>
        </div>
      </main>
    </div>`;
}
async function loadAsistanlarPage(){ await cbFetchBots(); cbShowList(); }
function cbShowList(){ cbSessionId=null; cbMessages=[]; cbRenderShell(null,'welcome'); }
async function cbOpenChat(botId){
  cbActiveBot=cbBots.find(b=>b.id===botId); if(!cbActiveBot) return;
  cbSessionId=null; cbMessages=[]; cbRenderShell(botId,'welcome');
}
function cbSendStarterModern(text){
  const input=document.getElementById('cb-input'); if(input){input.value=text; cbSend();}
}
function cbSendStarter(btn,text){ cbSendStarterModern(text); }
const cbAppendMsgOriginalModern = cbAppendMsg;
function cbAppendMsg(role,text,typing=false){
  const welcome=document.getElementById('cb-welcome');
  const msgs=document.getElementById('cb-msgs');
  if(welcome) welcome.style.display='none';
  if(msgs) msgs.style.display='flex';
  if(!msgs) return;
  const div=document.createElement('div');
  div.className=`cb-msg ${role}${typing?' typing':''}`;
  if(typing) div.id='cb-typing';
  if(role==='assistant' && !typing){
    div.innerHTML=String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/#{1,3} (.+)/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  }else div.textContent=text;
  msgs.appendChild(div); msgs.scrollTop=msgs.scrollHeight;
}
