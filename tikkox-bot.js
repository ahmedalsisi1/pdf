/* =========================================================================
   TikkoX AI Chatbot — v3 (Multilingual assistant-like)
   - Natural language switching: “speak English / parle français / تكلم عربي …”
   - Auto-detect language if user doesn’t specify
   - Remembers ONLY language preference (toggleable)
   - Friendly small-talk + quick TikkoX answers + helpful links
   - No external APIs required
   ========================================================================= */

;(() => {
  "use strict";

  /* ----------------------- Config (edit as needed) ----------------------- */
  const CONFIG = {
    brand: "TikkoX",
    token: "TKOX",
    explorer: "https://explorer.tikkox.org",
    wallet: "https://wallet.tikkox.org",
    docs: "https://tikkox.org/docs",
    roadmap: "roadmap.html",
    contact: "ifhsihfhgs@gmail.com"
  };

  /* ----------------------- Memory (language only) ------------------------ */
  const Pref = {
    get save() { return localStorage.getItem("tkx_pref_save") !== "off"; },
    set saveOn(v) { localStorage.setItem("tkx_pref_save", v ? "on" : "off"); },
    get lang() { return localStorage.getItem("tkx_pref_lang") || ""; },
    set lang(v) { localStorage.setItem("tkx_pref_lang", v); }
  };

  /* -------------------------- Supported languages ------------------------ */
  // Add/remove codes if you like. The bot answers *simply* in these languages.
  const SUPPORTED = {
    ar: "Arabic", en: "English", fr: "French", es: "Spanish", de: "German",
    tr: "Turkish", ru: "Russian", hi: "Hindi", ur: "Urdu", fa: "Farsi",
    it: "Italian", pt: "Portuguese", id: "Indonesian", zh: "Chinese", ja: "Japanese"
  };

  /* ----------------------------- UI styling ------------------------------ */
  const CSS = `
  .tkx-bot-toggle{position:fixed;right:16px;bottom:16px;z-index:9998;width:56px;height:56px;border-radius:50%;
    border:1px solid #d4af37;background:#0b0b0b url('/assets/tikkox-logo-gold.png') no-repeat center/72%;
    box-shadow:0 6px 18px rgba(0,0,0,.5);cursor:pointer}
  .tkx-bot-panel{position:fixed;right:16px;bottom:84px;width:360px;max-height:72vh;z-index:9999;background:#0b0b0b;border:1px solid #d4af37;border-radius:14px;display:none;overflow:hidden}
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
  .tkx-chip{display:inline-block;border:1px solid #d4af37;border-radius:999px;padding:4px 8px;margin:4px 6px 0 0;color:#d4af37;cursor:pointer;font-size:12px}
  .tkx-cmd{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:#111; border:1px solid #333; border-radius:8px; padding:2px 6px}
  .tkx-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .tkx-links a{border:1px solid #d4af37;border-radius:999px;padding:6px 10px;color:#d4af37;text-decoration:none}
  `;

  /* ---------------------------- Helper fns ------------------------------- */
  const $ = sel => document.querySelector(sel);
  const addMsg = (role, html) => {
    const feed = $(".tkx-bot-feed");
    const wrap = document.createElement("div");
    wrap.className = "tkx-msg " + role;
    const b = document.createElement("div");
    b.className = "bubble";
    b.innerHTML = html;
    wrap.appendChild(b);
    feed.appendChild(wrap);
    feed.scrollTop = feed.scrollHeight;
  };

  // Very light auto-detection (script + a few keywords). Fallback to English.
  function autoDetect(text = "") {
    if (Pref.lang && Pref.save) return Pref.lang;
    if (/[\u0600-\u06FF]/.test(text)) return "ar";
    if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
    if (/[ぁ-ゟ゠-ヿ]/.test(text)) return "ja";
    const t = (text || "").toLowerCase();
    if (/\b(hola|gracias|por favor)\b/.test(t)) return "es";
    if (/\b(merci|bonjour)\b/.test(t)) return "fr";
    if (/\b(danke|hallo)\b/.test(t)) return "de";
    if (/\b(merhaba|teşekkür|tesekkur)\b/.test(t)) return "tr";
    if (/\b(спасибо|привет)\b/.test(t)) return "ru";
    return "en";
  }

  // “speak English / تكلم عربي / parle français …” → language code
  function parseSwitch(text = "") {
    const t = text.toLowerCase().trim();

    // English patterns
    let m = t.match(/\b(speak|talk|reply|write)\s+([a-z]+)\b/);
    if (m) return mapLangName(m[2]);

    // Arabic patterns
    m = t.match(/(?:تكلم|تكلّم|رد|اكتب)\s+([^\s]+)/);
    if (m) return mapLangName(m[1]);

    // French patterns
    m = t.match(/\b(parle|écris)\s+([a-zéèêç]+)\b/);
    if (m) return mapLangName(m[2]);

    // Spanish patterns
    m = t.match(/\b(habla|escribe)\s+([a-záéíóú]+)\b/);
    if (m) return mapLangName(m[2]);

    // Turkish phrase examples
    m = t.match(/\b([a-zığüşöç]+)\s+konuş\b/); // "<lang> konuş"
    if (m) return mapLangName(m[1]);

    return "";
  }

  function mapLangName(name) {
    const n = name.normalize("NFKD").replace(/[^a-z\u0600-\u06FF]/g, "").toLowerCase();
    const table = {
      // English names
      arabic: "ar", english: "en", french: "fr", spanish: "es", german: "de",
      turkish: "tr", russian: "ru", hindi: "hi", urdu: "ur", farsi: "fa",
      italian: "it", portuguese: "pt", indonesian: "id", chinese: "zh", japanese: "ja",
      // Arabic names
      عربي: "ar", عربية: "ar", انجليزي: "en", انجليزية: "en",
      فرنسي: "fr", فرنسية: "fr", اسباني: "es", اسبانية: "es",
      الماني: "de", المانية: "de", تركي: "tr", تركية: "tr",
      روسي: "ru", روسية: "ru", هندي: "hi", اوردو: "ur", فارسي: "fa",
      ايطالي: "it", برتغالي: "pt", اندونيسي: "id", صيني: "zh", ياباني: "ja",
      // French/Spanish common forms
      français: "fr", espagnol: "es", allemand: "de", anglais: "en", arabe: "ar",
      español: "es", portugués: "pt", italiano: "it", turco: "tr", ruso: "ru",
    };
    return table[n] || "";
  }

  function linksBlock(lang) {
    const L = (lang === "ar")
      ? { explorer: "Open Explorer", wallet: "Open Wallet", docs: "Read Docs", roadmap: "Roadmap", contact: "Email Support" } // keep link labels English if you prefer
      : { explorer: "Open Explorer", wallet: "Open Wallet", docs: "Read Docs", roadmap: "Roadmap", contact: "Email Support" };
    return `
      <div class="tkx-links">
        <a target="_blank" href="${CONFIG.explorer}">${L.explorer}</a>
        <a target="_blank" href="${CONFIG.wallet}">${L.wallet}</a>
        <a target="_blank" href="${CONFIG.docs}">${L.docs}</a>
        <a target="_blank" href="${CONFIG.roadmap}">${L.roadmap}</a>
        <a href="mailto:${CONFIG.contact}">${L.contact}</a>
      </div>`;
  }

  function tone(text) {
    const t = (text || "").toLowerCase();
    if (/[😂🤣😆😄]/.test(t) || /(haha|lol|هههه)/i.test(t)) return "joy";
    if (/[😢😭😞😔]/.test(t) || /(sad|حزين|محبط)/i.test(t)) return "sad";
    if (/[😡🤬]/.test(t) || /(angry|غاضب)/i.test(t)) return "angry";
    if (/[🤔😕]/.test(t) || /(confused|مش فاهم|مو فاهم|صعب)/i.test(t)) return "confused";
    return "neutral";
  }

  /* ----------------------------- Tiny “brain” ---------------------------- */
  function quickAnswer(q, lang) {
    const t = (q || "").toLowerCase();

    // direct FAQs
    if (/\bprice\b/.test(t) || /سعر/.test(t))
      return (lang === "ar")
        ? `The initial price of ${CONFIG.token} is $0.05.`
        : `The initial price of ${CONFIG.token} is $0.05.`;

    if (/decimal|decimals|عشري/.test(t))
      return (lang === "ar")
        ? `${CONFIG.token} uses 8 decimals.`
        : `${CONFIG.token} uses 8 decimals.`;

    if (/supply|circulating|العرض|المتداول|الاجمالي/.test(t))
      return (lang === "ar")
        ? `Total supply: 21,999,999 ${CONFIG.token}. Circulating at launch: 2,999,999 ${CONFIG.token}.`
        : `Total supply: 21,999,999 ${CONFIG.token}. Circulating at launch: 2,999,999 ${CONFIG.token}.`;

    if (/wallet|محفظة/.test(t))
      return (lang === "ar")
        ? `Wallet: <a target="_blank" href="${CONFIG.wallet}">${CONFIG.wallet}</a>.`
        : `Wallet: <a target="_blank" href="${CONFIG.wallet}">${CONFIG.wallet}</a>.`;

    if (/explorer|المستكشف|block|tx|account/.test(t))
      return (lang === "ar")
        ? `Explorer: <a target="_blank" href="${CONFIG.explorer}">${CONFIG.explorer}</a>.`
        : `Explorer: <a target="_blank" href="${CONFIG.explorer}">${CONFIG.explorer}</a>.`;

    if (/docs|documentation|وثائق|developer|sdk/.test(t))
      return (lang === "ar")
        ? `Docs: <a target="_blank" href="${CONFIG.docs}">${CONFIG.docs}</a>.`
        : `Docs: <a target="_blank" href="${CONFIG.docs}">${CONFIG.docs}</a>.`;

    if (/help|error|link|how|where|كيف|أين|وين|مشكلة/.test(t))
      return ((lang === "ar")
        ? `Here are helpful links:`
        : `Here are helpful links:`) + linksBlock(lang);

    // small talk
    if (/^(hi|hello|hey|yo)\b/.test(t) || /^(مرحبا|هلا|سلام|اهلا)/.test(t))
      return (lang === "ar")
        ? `Hi! I’m TikkoX AI. Ask me anything or say “/lang en” to switch language.`
        : `Hi! I’m TikkoX AI. Ask me anything or say “/lang ar” to switch language.`;

    if (/thanks|thank you|شكرا|thx/.test(t))
      return (lang === "ar") ? `You're welcome!` : `You're welcome!`;

    if (/😂|🤣|lol|lmao|هه|هاها/.test(t))
      return (lang === "ar") ? `Haha, love the vibe!` : `Haha, love the vibe!`;

    // fallback
    return (lang === "ar")
      ? `Got it. Tell me more so I can be precise.`
      : `Got it. Tell me a bit more so I can be precise.`;
  }

  /* ------------------------------- Commands ------------------------------ */
  // /lang xx        -> set language (must exist in SUPPORTED)
  // /auto           -> clear override; auto-detect based on message
  // /memory on/off  -> toggle remembering language preference
  function handleCommand(text) {
    const t = text.trim();

    if (t.startsWith("/lang ")) {
      const code = t.split(/\s+/)[1]?.trim().toLowerCase();
      if (SUPPORTED[code]) {
        Pref.lang = code;
        return `Language set to <b>${SUPPORTED[code]}</b> ✅`;
      }
      return `Unknown language code. Supported: ${Object.keys(SUPPORTED).join(", ")}`;
    }

    if (t === "/auto") {
      Pref.lang = "";
      return `Language auto-detection is now active.`;
    }

    if (t.startsWith("/memory ")) {
      const v = t.split(/\s+/)[1]?.trim().toLowerCase();
      if (v === "on") { Pref.saveOn = true; return `Preference memory: <b>ON</b> ✅`; }
      if (v === "off") { Pref.saveOn = false; Pref.lang = ""; return `Preference memory: <b>OFF</b> ✅`; }
      return `Use: /memory on | off`;
    }

    return null;
  }

  /* --------------------------------- UI ---------------------------------- */
  function mountUI() {
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
          <input placeholder="Type here… (try: speak English / /lang ar / /auto / /memory off)" aria-label="Type a message">
          <button type="button">Send</button>
        </div>
      </div>`;
    document.body.appendChild(root);

    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const toggle = $(".tkx-bot-toggle");
    const panel = $(".tkx-bot-panel");
    const btn = $(".tkx-bot-input button");
    const inp = $(".tkx-bot-input input");

    function greet() {
      const l = Pref.lang || "en";
      addMsg("bot", `I’m <b>TikkoX AI</b> — say “speak Arabic/French/Turkish…” and I will switch languages. Use <span class="tkx-cmd">/lang ar|en|fr|…</span>, <span class="tkx-cmd">/auto</span>, <span class="tkx-cmd">/memory on|off</span>.`);
      // Quick chips
      const chips = document.createElement("div");
      ["Price", "Supply", "Decimals", "Wallet", "Explorer", "Docs", "Roadmap", "Support"].forEach(t => {
        const c = document.createElement("span");
        c.className = "tkx-chip";
        c.textContent = t;
        c.onclick = () => send(t);
        chips.appendChild(c);
      });
      $(".tkx-bot-feed").appendChild(chips);
    }

    function send(text) {
      const val = (text || inp.value || "").trim();
      if (!val) return;
      addMsg("user", val);
      inp.value = "";

      // Commands first
      const cmd = handleCommand(val);
      if (cmd) { addMsg("bot", cmd); return; }

      // Natural language switching (e.g., “speak English”, “تكلم عربي”)
      const sw = parseSwitch(val);
      if (sw && SUPPORTED[sw]) {
        Pref.lang = sw;
        addMsg("bot", `Okay, I’ll reply in <b>${SUPPORTED[sw]}</b> from now on.`);
        if (!Pref.save) Pref.lang = ""; // don’t persist if memory is off
        return;
      }

      // Language to reply in
      const lang = Pref.lang || autoDetect(val);
      if (Pref.save && lang) Pref.lang = lang; // remember only if memory ON

      // Compose answer
      const base = quickAnswer(val, lang);
      const mood = tone(val);
      const flair = { joy: " 😄", sad: " 🙏", angry: " 🤝", confused: " 🤔", neutral: "" }[mood] || "";
      let reply = base + flair;

      // Add helpful links when user seems stuck
      if (/(i can.?t|cannot|don.?t know|help|how|where|error|link|مش فاهم|مو فاهم|صعب|مشكلة|كيف|أين|وين)/i.test(val)) {
        reply += "<br>" + linksBlock(lang);
      }

      addMsg("bot", reply);
    }

    toggle.onclick = () => {
      panel.style.display = (panel.style.display === "block") ? "none" : "block";
      if (panel.style.display === "block" && !$(".tkx-bot-feed").children.length) greet();
    };
    btn.onclick = () => send();
    inp.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountUI);
  } else {
    mountUI();
  }
})();