
;(()=>{
  const KB = {"meta": {"bot_name": "TikkoX AI", "version": "1.0", "brand": "TikkoX", "token": "TKOX", "price_usd": "0.05", "decimals": "8", "total_supply": "21,999,999", "circulating_at_launch": "2,999,999", "network": "Substrate-based", "wallet_page": "wallet.html", "explorer_page": "explorer.html", "contact_email": "ifhsihfhgs@gmail.com"}, "intents": [{"name": "greeting", "patterns": ["^hi", "^hello", "^hey", "^yo", "^مرحبا", "^هلا", "^سلام", "^اهلا"], "reply": "مرحبًا! أنا **TikkoX AI**. كيف أقدر أساعدك اليوم؟ 🙂"}, {"name": "price", "patterns": ["price", "سعر", "tkox price", "كم سعر"], "reply": "السعر الابتدائي الرسمي لـ **TKOX** هو **$0.05** ويتم تحديثه داخليًا على الشبكة."}, {"name": "decimals", "patterns": ["decimal", "decimals", "كم رقم عشري", "العشري"], "reply": "الرقم العشري لعملة **TKOX** هو **8**."}, {"name": "supply", "patterns": ["supply", "total supply", "circulating", "العرض", "الاجمالي", "المتداول"], "reply": "الإجمالي: **21,999,999 TKOX** — المتداول عند الإطلاق: **2,999,999 TKOX**."}, {"name": "about", "patterns": ["what is tikko", "about", "ما هي", "وش هي"], "reply": "**TikkoX** شبكة بلوكشين حديثة مبنية على Substrate، مع Explorer وWallet وTikkoX Pay (قريبًا)."}, {"name": "wallet", "patterns": ["wallet", "محفظة", "انشئ محفظة"], "reply": "محفظتك على TikkoX هنا: **wallet.html** (قريبًا). تقدر تترك بريدك هناك وراح نذكرك عند الإطلاق."}, {"name": "explorer", "patterns": ["explorer", "المستكشف", "explore"], "reply": "مستكشف TikkoX هنا: **explorer.html** (قريبًا)."}, {"name": "bridge", "patterns": ["bridge", "جسر"], "reply": "ندمج جسر **ChainBridge** تحت صلاحيات Sudo للأمان. (ميزة ضمن خارطة الطريق)."}, {"name": "docs", "patterns": ["docs", "وثائق", "documentation"], "reply": "الوثائق ستتوفر على **tikkox.org/docs**. لو تحتاج إرشاد الآن، اسألني مباشرة."}, {"name": "grants", "patterns": ["grant", "منحة", "rewards", "مكافآت"], "reply": "لدينا برنامج مكافآت للمطورين. أخبرني بفكرتك أو اترك بريدك وسنعاود التواصل."}, {"name": "laugh", "patterns": ["😂", "🤣", "هه", "هاها", "lol", "lmao"], "reply": "ههههه 😄 واضح أنك مبسوط! خلّينا نكمّل على نفس الجو — كيف أقدر أفيدك؟"}, {"name": "thanks", "patterns": ["thanks", "شكرا", "thx", "مشكور"], "reply": "على الرحب والسعة! إذا احتجت أي شيء ثاني أنا حاضر."}, {"name": "contact", "patterns": ["email", "contact", "تواصل", "بريد"], "reply": "تقدر تراسلنا على **ifhsihfhgs@gmail.com** أو تترك بريدك في صفحات المحفظة/المستكشف."}, {"name": "default", "patterns": [".*"], "reply": "سؤالك مهم. أعطني تفاصيل أكثر، أو اختر موضوعًا سريعًا بالأسفل 👇"}], "quick_topics": ["Price of TKOX", "Total supply", "Decimals", "Create wallet", "Open explorer", "Bridge & Interop", "Developer grants", "Docs/SDKs"]};

  function matches(patterns, text){
    text = (text||'').toLowerCase().trim();
    return patterns.some(p=> new RegExp(p, 'i').test(text));
  }

  function pickReply(text){
    for(const intent of KB.intents){
      if(matches(intent.patterns, text)) return intent.reply;
    }
    return KB.intents.find(i=>i.name==='default').reply;
  }

  function ui(){return {
    toggle: document.querySelector('.tkx-bot-toggle'),
    panel: document.querySelector('.tkx-bot-panel'),
    feed: document.querySelector('.tkx-bot-feed'),
    input: document.querySelector('.tkx-bot-input input'),
    send: document.querySelector('.tkx-bot-input button')
  }}

  function addMsg(role, text){
    const u = ui();
    const wrap = document.createElement('div');
    wrap.className = 'tkx-msg ' + role;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g,'<b>$1</b>');
    wrap.appendChild(bubble);
    u.feed.appendChild(wrap);
    u.feed.scrollTop = u.feed.scrollHeight;
  }

  function greet(){
    addMsg('bot', `أنا <b>${KB.meta.bot_name}</b> 🤖 — اسألني عن <b>${KB.meta.token}</b>، الأسعار، التوكن، المحفظة، أو التطوير.`);
    const chips = document.createElement('div');
    KB.quick_topics.forEach(t=>{
      const chip = document.createElement('span');
      chip.className = 'tkx-kb-chip';
      chip.textContent = t;
      chip.onclick = ()=> send(t);
      chips.appendChild(chip);
    });
    ui().feed.appendChild(chips);
  }

  function send(text){
    const u = ui();
    text = text || u.input.value;
    if(!text) return;
    addMsg('user', text);
    u.input.value='';
    const reply = pickReply(text);
    let enriched = reply
      .replace('wallet.html', `<a href="${KB.meta.wallet_page}">wallet.html</a>`)
      .replace('explorer.html', `<a href="${KB.meta.explorer_page}">explorer.html</a>`);
    // Insert dynamic facts
    enriched = enriched
      .replace('0.05', KB.meta.price_usd)
      .replace('8', KB.meta.decimals)
      .replace('21,999,999', KB.meta.total_supply)
      .replace('2,999,999', KB.meta.circulating_at_launch);
    setTimeout(()=> addMsg('bot', enriched), 250);
  }

  function mount(){
    const root = document.createElement('div');
    root.innerHTML = `
      <button class="tkx-bot-toggle" title="Chat with TikkoX AI"></button>
      <div class="tkx-bot-panel" role="dialog" aria-label="TikkoX AI chat">
        <div class="tkx-bot-header">
          <img src="/assets/tikkox-logo-gold.png" alt="TikkoX">
          <div class="ttl">TikkoX AI</div>
        </div>
        <div class="tkx-bot-feed" aria-live="polite"></div>
        <div class="tkx-bot-input">
          <input placeholder="اكتب سؤالك هنا…" aria-label="اكتب سؤالك">
          <button type="button">Send</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    // Style
    const s = document.createElement('style'); s.textContent = `
.tkx-bot-toggle{
  position:fixed; right:16px; bottom:16px; z-index:9998;
  width:56px; height:56px; border-radius:50%; border:1px solid #d4af37;
  background:#0b0b0b url('/assets/tikkox-logo-gold.png') no-repeat center/72%;
  box-shadow:0 6px 18px rgba(0,0,0,.5); cursor:pointer;
}
.tkx-bot-panel{
  position:fixed; right:16px; bottom:84px; width:340px; max-height:70vh; z-index:9999;
  background:#0b0b0b; border:1px solid #d4af37; border-radius:14px; display:none; overflow:hidden;
}
.tkx-bot-header{display:flex; gap:10px; align-items:center; padding:10px 12px; border-bottom:1px solid #151515; background:#0a0a0a}
.tkx-bot-header img{width:26px; height:26px}
.tkx-bot-header .ttl{font-weight:700; color:#d4af37}
.tkx-bot-feed{padding:12px; height:320px; overflow:auto; background:radial-gradient(ellipse at top,#111 0%,#000 70%)}
.tkx-msg{display:flex; gap:8px; margin:8px 0}
.tkx-msg.bot .bubble{background:#121212; border:1px solid #2a2a2a}
.tkx-msg.user{justify-content:flex-end}
.tkx-msg .bubble{max-width:75%; padding:10px 12px; border-radius:12px; color:#d4af37}
.tkx-msg.user .bubble{background:#1a1a1a; border:1px solid #3a3a3a}
.tkx-bot-input{display:flex; gap:8px; padding:10px; border-top:1px solid #151515; background:#0a0a0a}
.tkx-bot-input input{flex:1; background:#000; color:#c9b27a; border:1px solid #d4af37; border-radius:10px; padding:10px 12px; outline:none}
.tkx-bot-input button{border:0; background:#d4af37; color:#111; font-weight:700; border-radius:10px; padding:10px 12px; cursor:pointer}
.tkx-kb-chip{display:inline-block; border:1px solid #d4af37; border-radius:999px; padding:4px 8px; margin:4px 4px 0 0; color:#d4af37; cursor:pointer; font-size:12px}
`; document.head.appendChild(s);
    const u = ui();
    u.toggle.onclick = ()=>{ u.panel.style.display = (u.panel.style.display==='block')?'none':'block'; if(u.panel.style.display==='block' && u.feed.childElementCount===0) greet(); };
    u.send.onclick = ()=> send();
    u.input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') send(); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

})();
