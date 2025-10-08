/* =========================================================================
   TikkoX AI Chatbot — v2.0
   File: /bot/tikkox-bot.js
   Features:
   - Multilingual (AR/EN) auto-detect + manual override (/lang ar|en)
   - Teachable KB (/teach question => answer), editable meta (/set key value)
   - Forget & reset (/forget q, /reset)
   - Sentiment cues (joy/sad/confused/angry) + light humor on laughter
   - Smart link suggestions to your site when user struggles
   - Local memory (localStorage): user KB + meta overrides + history
   - Floating widget UI
   ========================================================================= */

;(()=>{
  "use strict";

  /* ============================== CONFIG ================================ */
  const META_DEFAULT = {
    bot_name: "TikkoX AI",
    brand: "TikkoX",
    token: "TKOX",
    price_usd: "0.05",
    decimals: "8",
    total_supply: "21,999,999",
    circulating_at_launch: "2,999,999",
    explorer_url: "https://explorer.tikkox.org",
    wallet_url:   "https://wallet.tikkox.org",
    docs_url:     "https://tikkox.org/docs",
    roadmap_url:  "roadmap.html",
    contact_email:"ifhsihfhgs@gmail.com",
    support_url:  "mailto:ifhsihfhgs@gmail.com"
  };

  const LINKS = [
    {k:"explorer",  url: META_DEFAULT.explorer_url, label_en:"Open Explorer", label_ar:"افتح المستكشف"},
    {k:"wallet",    url: META_DEFAULT.wallet_url,   label_en:"Open Wallet",   label_ar:"افتح المحفظة"},
    {k:"docs",      url: META_DEFAULT.docs_url,     label_en:"Read Docs",     label_ar:"اقرأ الوثائق"},
    {k:"roadmap",   url: META_DEFAULT.roadmap_url,  label_en:"Roadmap",       label_ar:"خارطة الطريق"},
    {k:"support",   url: META_DEFAULT.support_url,  label_en:"Email Support", label_ar:"راسل الدعم"}
  ];

  const UI_CSS = `
  .tkx-bot-toggle{position:fixed;right:16px;bottom:16px;z-index:9998;width:56px;height:56px;border-radius:50%;
    border:1px solid #d4af37;background:#0b0b0b url('/assets/tikkox-logo-gold.png') no-repeat center/72%;
    box-shadow:0 6px 18px rgba(0,0,0,.5);cursor:pointer}
  .tkx-bot-panel{position:fixed;right:16px;bottom:84px;width:360px;max-height:72vh;z-index:9999;background:#0b0b0b;
    border:1px solid #d4af37;border-radius:14px;display:none;overflow:hidden}
  .tkx-bot-header{display:flex;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #151515;background:#0a0a0a}
  .tkx-bot-header img{width:26px;height:26px}
  .tkx-bot-header .ttl{font-weight:700;color:#d4af37}
  .tkx-bot-feed{padding:12px;height:360px;overflow:auto;background:radial-gradient(ellipse at top,#111 0%,#000 70%)}
  .tkx-msg{display:flex;gap:8px;margin:8px 0}
  .tkx-msg.bot .bubble{background:#121212;border:1px solid #2a2a2a}
  .tkx-msg.user{justify-content:flex-end}
  .tkx-msg .bubble{max-width:78%;padding:10px 12px;border-radius:12px;color:#d4af37}
  .tkx-msg.user .bubble{background:#1a1a1a;border:1px solid #3a3a3a}
  .tkx-bot-input{display:flex;gap:8px;padding:10px;border-top:1px solid #151515;background:#0a0a0a}
  .tkx-bot-input input{flex:1;background:#000;color:#c9b27a;border:1px solid #d4af37;border-radius:10px;padding:10px 12px;outline:none}
  .tkx-bot-input button{border:0;background:#d4af37;color:#111;font-weight:700;border-radius:10px;padding:10px 12px;cursor:pointer}
  .tkx-kb-chip{display:inline-block;border:1px solid #d4af37;border-radius:999px;padding:4px 8px;margin:4px 4px 0 0;color:#d4af37;cursor:pointer;font-size:12px}
  .tkx-cmd{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:#111; border:1px solid #333; border-radius:8px; padding:2px 6px}
  .tkx-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .tkx-links a{border:1px solid #d4af37;border-radius:999px;padding:6px 10px;color:#d4af37;text-decoration:none}
  `;

  /* ============================== STORAGE ============================== */
  const store = {
    get userKB(){ try{ return JSON.parse(localStorage.getItem("tkx_user_kb") || "[]"); } catch { return []; } },
    set userKB(v){ localStorage.setItem("tkx_user_kb", JSON.stringify(v)); },
    get meta(){ try{ return JSON.parse(localStorage.getItem("tkx_meta_overrides") || "{}"); } catch { return {}; } },
    set meta(v){ localStorage.setItem("tkx_meta_overrides", JSON.stringify(v)); },
    get lang(){ return localStorage.getItem("tkx_lang") || ""; },
    set lang(v){ localStorage.setItem("tkx_lang", v); },
    historyPush(m){ const arr = store.history(); arr.push(m); localStorage.setItem("tkx_hist", JSON.stringify(arr).slice(-8000)); },
    history(){ try{ return JSON.parse(localStorage.getItem("tkx_hist")||"[]"); } catch { return []; } },
    reset(){ localStorage.removeItem("tkx_user_kb"); localStorage.removeItem("tkx_meta_overrides"); localStorage.removeItem("tkx_lang"); localStorage.removeItem("tkx_hist"); }
  };

  /* ============================== I18N ================================ */
  function detectLang(text=""){
    if(store.lang) return store.lang; // manual override
    const nav = (navigator.language||"en").slice(0,2).toLowerCase();
    const arChars = /[\u0600-\u06FF]/.test(text);
    return arChars ? "ar" : (nav==="ar" ? "ar" : "en");
  }

  const MSG = {
    greet: {
      en: (m)=>`I’m <b>${m.bot_name}</b> 🤖 — ask me about <b>${m.token}</b>, prices, wallet, explorer, or building on TikkoX.`,
      ar: (m)=>`أنا <b>${m.bot_name}</b> 🤖 — اسألني عن <b>${m.token}</b>، الأسعار، المحفظة، المستكشف أو التطوير على TikkoX.`
    },
    tips: {
      en: ()=>`Teach me with <span class="tkx-cmd">/teach question => answer</span> • Edit config with <span class="tkx-cmd">/set key value</span> • Forget <span class="tkx-cmd">/forget question</span> • Reset <span class="tkx-cmd">/reset</span> • Language <span class="tkx-cmd">/lang ar|en</span> • Links <span class="tkx-cmd">/links</span>`,
      ar: ()=>`علّمني بـ <span class="tkx-cmd">/teach سؤال => الإجابة</span> • عدّل الإعدادات بـ <span class="tkx-cmd">/set key value</span> • احذف بـ <span class="tkx-cmd">/forget سؤال</span> • إعادة ضبط <span class="tkx-cmd">/reset</span> • اللغة <span class="tkx-cmd">/lang ar|en</span> • الروابط <span class="tkx-cmd">/links</span>`
    },
    struggling: {
      en: ()=>`It looks like you need a direct resource. Here are helpful links 👇`,
      ar: ()=>`واضح أنك تحتاج رابط مباشر. هذه روابط مفيدة 👇`
    },
    taught_ok: {
      en: (q,a)=>`Saved ✅ I will answer “<b>${q}</b>” with:<br><b>${a}</b>`,
      ar: (q,a)=>`تم الحفظ ✅ سأجيب عن “<b>${q}</b>” بالآتي:<br><b>${a}</b>`
    },
    wrong_teach: {
      en: ()=>`Use: <span class="tkx-cmd">/teach question => answer</span>`,
      ar: ()=>`استخدم: <span class="tkx-cmd">/teach سؤال => الإجابة</span>`
    },
    set_ok: {
      en: (k,v)=>`Updated <b>${k}</b> → <b>${v}</b> ✅`,
      ar: (k,v)=>`تم تعديل <b>${k}</b> إلى <b>${v}</b> ✅`
    },
    forget_ok: {
      en: (q)=>`Removed learned entry for “<b>${q}</b>” 🗑️`,
      ar: (q)=>`تم حذف المعلومة الخاصة بـ “<b>${q}</b>” 🗑️`
    },
    reset_ok: {
      en: ()=>`Reset complete. We’re back to default ✨`,
      ar: ()=>`تمت إعادة الضبط. رجعنا للوضع الافتراضي ✨`
    },
    lang_ok: {
      en: (l)=>`Language set to <b>${l}</b> ✅`,
      ar: (l)=>`تم تعيين اللغة إلى <b>${l}</b> ✅`
    },
    default_followup: {
      en: ()=>`Your question matters. Could you add one detail so I can be precise?`,
      ar: ()=>`سؤالك مهم. ممكن تضيف تفصيلة واحدة لأكون أدق؟`
    }
  };

  /* ============================== BASE KB ============================= */
  const KB_BASE = [
    { name:"greeting", patterns:["^hi","^hello","^hey","^yo","^مرحبا","^هلا","^سلام","^اهلا"], 
      reply_en:(m)=>`Hi! ${MSG.greet.en(m)}`, 
      reply_ar:(m)=>`مرحبًا! ${MSG.greet.ar(m)}`
    },
    { name:"price", patterns:["price","سعر","tkox price","كم سعر"], 
      reply_en:(m)=>`Official initial price of <b>${m.token}</b> is <b>$${m.price_usd}</b>, maintained internally on-chain.`,
      reply_ar:(m)=>`السعر الابتدائي الرسمي لعملة <b>${m.token}</b> هو <b>$${m.price_usd}</b> ويتم تحديثه داخليًا على الشبكة.`
    },
    { name:"decimals", patterns:["decimal","decimals","كم رقم عشري","العشري"], 
      reply_en:(m)=>`<b>${m.token}</b> uses <b>${m.decimals}</b> decimals.`,
      reply_ar:(m)=>`الرقم العشري لعملة <b>${m.token}</b> هو <b>${m.decimals}</b>.`
    },
    { name:"supply", patterns:["supply","total supply","circulating","العرض","الاجمالي","المتداول"], 
      reply_en:(m)=>`Total: <b>${m.total_supply} ${m.token}</b> — Circulating at launch: <b>${m.circulating_at_launch} ${m.token}</b>.`,
      reply_ar:(m)=>`الإجمالي: <b>${m.total_supply} ${m.token}</b> — المتداول عند الإطلاق: <b>${m.circulating_at_launch} ${m.token}</b>.`
    },
    { name:"about", patterns:["what is tikko","about","ما هي","وش هي","tikkox"], 
      reply_en:(m)=>`<b>${m.brand}</b> is a modern Substrate-based blockchain with Explorer, Wallet, and TikkoX Pay (coming).`,
      reply_ar:(m)=>`<b>${m.brand}</b> شبكة بلوكشين حديثة مبنية على Substrate، مع Explorer وWallet وTikkoX Pay (قريبًا).`
    },
    { name:"wallet", patterns:["wallet","محفظة","انشئ محفظة","create wallet"], 
      reply_en:(m)=>`Your wallet page is here: <a target="_blank" href="${m.wallet_url}">${m.wallet_url}</a> (coming).`,
      reply_ar:(m)=>`صفحة المحفظة هنا: <a target="_blank" href="${m.wallet_url}">${m.wallet_url}</a> (قريبًا).`
    },
    { name:"explorer", patterns:["explorer","المستكشف","explore","block","tx","account"], 
      reply_en:(m)=>`Open the Explorer: <a target="_blank" href="${m.explorer_url}">${m.explorer_url}</a> (coming).`,
      reply_ar:(m)=>`افتح المستكشف: <a target="_blank" href="${m.explorer_url}">${m.explorer_url}</a> (قريبًا).`
    },
    { name:"bridge", patterns:["bridge","جسر","chainbridge"], 
      reply_en:()=>`We plan to integrate <b>ChainBridge</b> under Sudo for security.`,
      reply_ar:()=>`سنُدمج <b>ChainBridge</b> تحت صلاحيات Sudo لضمان الأمان.`
    },
    { name:"docs", patterns:["docs","وثائق","documentation","developer","sdk"], 
      reply_en:(m)=>`Docs will be at <a target="_blank" href="${m.docs_url}">${m.docs_url}</a>. Ask me anything right now.`,
      reply_ar:(m)=>`الوثائق ستكون على <a target="_blank" href="${m.docs_url}">${m.docs_url}</a>. اسألني الآن عن أي شيء.`
    },
    { name:"grants", patterns:["grant","منحة","rewards","مكافآت"], 
      reply_en:()=>`We run developer rewards. Pitch your idea or leave your email and we’ll follow up.`,
      reply_ar:()=>`لدينا مكافآت للمطورين. قدّم فكرتك أو اترك بريدك وسنتابع معك.`
    },
    { name:"laugh", patterns:["😂","🤣","هه","هاها","lol","lmao"], 
      reply_en:()=>`Hahaha 😄 Love the vibe! How can I help next?`,
      reply_ar:()=>`ههههه 😄 جو جميل! كيف أقدر أفيدك؟`
    },
    { name:"thanks", patterns:["thanks","شكرا","thx","مشكور"], 
      reply_en:()=>`You’re welcome! Anything else?`,
      reply_ar:()=>`على الرحب والسعة! أي شيء آخر؟`
    },
    { name:"contact", patterns:["email","contact","تواصل","بريد","support"], 
      reply_en:(m)=>`Reach us at <b>${m.contact_email}</b> or use <a href="${m.support_url}">email support</a>.`,
      reply_ar:(m)=>`تواصل معنا على <b>${m.contact_email}</b> أو استخدم <a href="${m.support_url}">بريد الدعم</a>.`
    }
  ];

  /* =========================== HELPERS ================================ */
  const $ = (q)=> document.querySelector(q);
  const addMsg = (role, html)=>{
    const feed = $(".tkx-bot-feed");
    const wrap = document.createElement("div");
    wrap.className = "tkx-msg "+role;
    const b = document.createElement("div");
    b.className = "bubble";
    b.innerHTML = html;
    wrap.appendChild(b);
    feed.appendChild(wrap);
    feed.scrollTop = feed.scrollHeight;
  };

  const regMatch = (pats, txt)=>{
    txt = (txt||"").toLowerCase().trim();
    return pats.some(p => new RegExp(p, "i").test(txt));
  };

  const sentiment = (txt)=>{
    txt = (txt||"").toLowerCase();
    if(/[😂🤣😆😄]/.test(txt) || /(haha|lol|هههه)/i.test(txt)) return "joy";
    if(/[😢😭😞😔]/.test(txt) || /(sad|حزين|محبط)/i.test(txt)) return "sad";
    if(/[😡🤬]/.test(txt) || /(angry|غاضب)/i.test(txt)) return "angry";
    if(/[🤔😕]/.test(txt) || /(confused|مش فاهم|مو فاهم|صعب)/i.test(txt)) return "confused";
    return "neutral";
  };

  /* ====================== KNOWLEDGE & COMMANDS ======================== */
  function loadMeta(){
    const m = {...META_DEFAULT, ...store.meta};
    // keep LINKS synced with overrides
    LINKS.forEach(l=>{
      if(m[`${l.k}_url`]) l.url = m[`${l.k}_url`];
    });
    return m;
  }

  function searchLearned(txt){
    const t = (txt||"").toLowerCase();
    for(const item of store.userKB){
      if(t.includes(item.q.toLowerCase())) return item.a;
    }
    return null;
  }

  function pickReply(txt, lang, meta){
    // user-taught first
    const learned = searchLearned(txt);
    if(learned) return learned;

    // base KB
    for(const it of KB_BASE){
      if(regMatch(it.patterns, txt)){
        return (lang==="ar" ? it.reply_ar(meta) : it.reply_en(meta));
      }
    }

    // default
    return (lang==="ar" ? MSG.default_followup.ar() : MSG.default_followup.en());
  }

  function command(text, lang){
    const t = text.trim();

    // /teach
    if(t.startsWith("/teach ")){
      const parts = t.replace("/teach ","").split("=>");
      if(parts.length>=2){
        const q = parts[0].trim(); const a = parts.slice(1).join("=>").trim();
        const data = store.userKB; data.push({q, a}); store.userKB = data;
        return (lang==="ar" ? MSG.taught_ok.ar(q,a) : MSG.taught_ok.en(q,a));
      }
      return (lang==="ar" ? MSG.wrong_teach.ar() : MSG.wrong_teach.en());
    }

    // /set key value
    if(t.startsWith("/set ")){
      const [, key, ...rest] = t.split(" ");
      if(!key || rest.length===0) {
        return (lang==="ar" ? `استخدم: <span class="tkx-cmd">/set key value</span>` : `Use: <span class="tkx-cmd">/set key value</span>`);
      }
      const value = rest.join(" ");
      const m = store.meta; m[key]=value; store.meta = m;
      return (lang==="ar" ? MSG.set_ok.ar(key,value) : MSG.set_ok.en(key,value));
    }

    // /forget question
    if(t.startsWith("/forget ")){
      const q = t.replace("/forget ","").trim();
      const arr = store.userKB.filter(x=> x.q.toLowerCase()!==q.toLowerCase());
      store.userKB = arr;
      return (lang==="ar" ? MSG.forget_ok.ar(q) : MSG.forget_ok.en(q));
    }

    // /reset
    if(t==="/reset"){
      store.reset();
      return (lang==="ar" ? MSG.reset_ok.ar() : MSG.reset_ok.en());
    }

    // /lang ar|en
    if(t.startsWith("/lang ")){
      const l = t.split(" ")[1]?.trim().toLowerCase();
      if(["ar","en"].includes(l)){ store.lang = l; return (l==="ar" ? MSG.lang_ok.ar("العربية") : MSG.lang_ok.en("English")); }
      return (lang==="ar" ? "اكتب: /lang ar أو /lang en" : "Type: /lang ar or /lang en");
    }

    // /links
    if(t==="/links"){
      return renderLinks(lang);
    }

    return null;
  }

  function renderLinks(lang){
    const parts = LINKS.map(l=>{
      const lbl = (lang==="ar" ? l.label_ar : l.label_en);
      return `<a target="_blank" href="${l.url}">${lbl}</a>`;
    }).join("");
    return `<div class="tkx-links">${parts}</div>`;
  }

  function maybeSuggestLinks(txt, lang){
    const hard = /(i can't|i cannot|i dont know|مش فاهم|مو فاهم|صعب|مشكلة|error|help|كيف|أين|وين|link|رابط)/i.test(txt||"");
    if(!hard) return "";
    const msg = (lang==="ar" ? MSG.struggling.ar() : MSG.struggling.en());
    return msg + renderLinks(lang);
  }

  /* ================================ UI ================================ */
  function mountUI(){
    // container
    const root = document.createElement("div");
    root.innerHTML = `
      <button class="tkx-bot-toggle" title="Chat with TikkoX AI"></button>
      <div class="tkx-bot-panel" role="dialog" aria-label="TikkoX AI chat">
        <div class="tkx-bot-header">
          <img src="/assets/tikkox-logo-gold.png" alt="TikkoX" onerror="this.src='/assets/logo.png'">
          <div class="ttl">TikkoX AI</div>
        </div>
        <div class="tkx-bot-feed" aria-live="polite"></div>
        <div class="tkx-bot-input">
          <input placeholder="Type here… / اكتب سؤالك هنا…" aria-label="Type a message">
          <button type="button">Send</button>
        </div>
      </div>`;
    document.body.appendChild(root);

    // style
    const s = document.createElement("style");
    s.textContent = UI_CSS;
    document.head.appendChild(s);

    // hooks
    const toggle = $(".tkx-bot-toggle");
    const panel  = $(".tkx-bot-panel");
    const btn    = $(".tkx-bot-input button");
    const inp    = $(".tkx-bot-input input");
    const meta   = loadMeta();

    const greetOnce = ()=>{
      const lang = detectLang();
      addMsg("bot", (lang==="ar" ? MSG.greet.ar(meta) : MSG.greet.en(meta)));
      addMsg("bot", (lang==="ar" ? MSG.tips.ar() : MSG.tips.en()));
      // quick topics
      const chips = document.createElement("div");
      chips.style.marginTop = "6px";
      ["Price","Supply","Decimals","Wallet","Explorer","Docs","Roadmap","Support"].forEach(t=>{
        const chip = document.createElement("span");
        chip.className = "tkx-kb-chip";
        chip.textContent = t;
        chip.onclick = ()=> send(t);
        chips.appendChild(chip);
      });
      $(".tkx-bot-feed").appendChild(chips);
    };

    toggle.onclick = ()=>{
      panel.style.display = (panel.style.display==="block") ? "none" : "block";
      if(panel.style.display==="block" && !$(".tkx-bot-feed").children.length) greetOnce();
    };
    btn.onclick = ()=> send();
    inp.addEventListener("keydown", (e)=>{ if(e.key==="Enter") send(); });

    function send(text){
      const metaNow = loadMeta();
      const inputVal = (text || inp.value || "").trim();
      if(!inputVal) return;
      addMsg("user", inputVal);
      store.historyPush({role:"user", text: inputVal, t: Date.now()});
      inp.value = "";

      const lang = detectLang(inputVal);
      const cmd = command(inputVal, lang);
      if(cmd){
        addMsg("bot", cmd);
        store.historyPush({role:"bot", text: cmd, t: Date.now()});
        return;
      }

      // sentiment flavor
      const snt = sentiment(inputVal);
      const flair = (lang==="ar" ? {joy:" 😄", sad:" 🙏", angry:" 🤝", confused:" 🤔", neutral:""} 
                                 : {joy:" 😄", sad:" 🙏", angry:" 🤝", confused:" 🤔", neutral:""});

      let reply = pickReply(inputVal, lang, metaNow) + (flair[snt]||"");

      // struggling? add links
      const helpLinks = maybeSuggestLinks(inputVal, lang);
      if(helpLinks) reply += "<br>"+helpLinks;

      addMsg("bot", reply);
      store.historyPush({role:"bot", text: reply, t: Date.now()});
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", mountUI);
  else mountUI();

})();