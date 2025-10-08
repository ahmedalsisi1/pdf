/* TikkoX AI Chatbot — v2.1 (teachable, multilingual, sentiment-aware) */
;(()=>{"use strict";

const META_DEFAULT={bot_name:"TikkoX AI",brand:"TikkoX",token:"TKOX",price_usd:"0.05",decimals:"8",
  total_supply:"21,999,999",circulating_at_launch:"2,999,999",
  explorer_url:"https://explorer.tikkox.org",wallet_url:"https://wallet.tikkox.org",
  docs_url:"https://tikkox.org/docs",roadmap_url:"roadmap.html",
  contact_email:"ifhsihfhgs@gmail.com",support_url:"mailto:ifhsihfhgs@gmail.com"};

const LINKS=[
  {k:"explorer",url:META_DEFAULT.explorer_url,label_en:"Open Explorer",label_ar:"افتح المستكشف"},
  {k:"wallet",url:META_DEFAULT.wallet_url,label_en:"Open Wallet",label_ar:"افتح المحفظة"},
  {k:"docs",url:META_DEFAULT.docs_url,label_en:"Read Docs",label_ar:"اقرأ الوثائق"},
  {k:"roadmap",url:META_DEFAULT.roadmap_url,label_en:"Roadmap",label_ar:"خارطة الطريق"},
  {k:"support",url:META_DEFAULT.support_url,label_en:"Email Support",label_ar:"راسل الدعم"}
];

const UI_CSS=`.tkx-bot-toggle{position:fixed;right:16px;bottom:16px;z-index:9998;width:56px;height:56px;border-radius:50%;border:1px solid #d4af37;background:#0b0b0b url('/assets/tikkox-logo-gold.png') no-repeat center/72%;box-shadow:0 6px 18px rgba(0,0,0,.5);cursor:pointer}
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
.tkx-kb-chip{display:inline-block;border:1px solid #d4af37;border-radius:999px;padding:4px 8px;margin:4px 4px 0 0;color:#d4af37;cursor:pointer;font-size:12px}
.tkx-cmd{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:#111; border:1px solid #333; border-radius:8px; padding:2px 6px}
.tkx-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.tkx-links a{border:1px solid #d4af37;border-radius:999px;padding:6px 10px;color:#d4af37;text-decoration:none}`;

const store={get userKB(){try{return JSON.parse(localStorage.getItem("tkx_user_kb")||"[]")}catch{return[]}},set userKB(v){localStorage.setItem("tkx_user_kb",JSON.stringify(v))},
get meta(){try{return JSON.parse(localStorage.getItem("tkx_meta_overrides")||"{}")}catch{return{}}},set meta(v){localStorage.setItem("tkx_meta_overrides",JSON.stringify(v))},
get lang(){return localStorage.getItem("tkx_lang")||""},set lang(v){localStorage.setItem("tkx_lang",v)},
historyPush(m){const arr=this.history();arr.push(m);localStorage.setItem("tkx_hist",JSON.stringify(arr).slice(-8000))},history(){try{return JSON.parse(localStorage.getItem("tkx_hist")||"[]")}catch{return[]}},
reset(){localStorage.removeItem("tkx_user_kb");localStorage.removeItem("tkx_meta_overrides");localStorage.removeItem("tkx_lang");localStorage.removeItem("tkx_hist")}};

function detectLang(text=""){ if(store.lang) return store.lang; const nav=(navigator.language||"en").slice(0,2).toLowerCase(); const ar=/[\\u0600-\\u06FF]/.test(text); return ar?"ar":(nav==="ar"?"ar":"en"); }

const MSG={
  greet:{en:(m)=>`I’m <b>${m.bot_name}</b> 🤖 — ask me about <b>${m.token}</b>, prices, wallet, explorer, or building on TikkoX.`, ar:(m)=>`أنا <b>${m.bot_name}</b> 🤖 — اسألني عن <b>${m.token}</b>، الأسعار، المحفظة، المستكشف أو التطوير على TikkoX.`},
  tips:{en:()=>`Teach <span class="tkx-cmd">/teach question => answer</span> • Edit <span class="tkx-cmd">/set key value</span> • Forget <span class="tkx-cmd">/forget question</span> • Reset <span class="tkx-cmd">/reset</span> • Language <span class="tkx-cmd">/lang ar|en</span> • Links <span class="tkx-cmd">/links</span>`, ar:()=>`علّمني <span class="tkx-cmd">/teach سؤال => الإجابة</span> • عدّل <span class="tkx-cmd">/set key value</span> • احذف <span class="tkx-cmd">/forget سؤال</span> • إعادة ضبط <span class="tkx-cmd">/reset</span> • اللغة <span class="tkx-cmd">/lang ar|en</span> • الروابط <span class="tkx-cmd">/links</span>`},
  struggling:{en:()=>`Looks like you need a direct resource. Helpful links 👇`, ar:()=>`واضح أنك تحتاج رابط مباشر. هذه روابط مفيدة 👇`},
  taught_ok:{en:(q,a)=>`Saved ✅ I will answer “<b>${q}</b>” with:<br><b>${a}</b>`, ar:(q,a)=>`تم الحفظ ✅ سأجيب عن “<b>${q}</b>” بالآتي:<br><b>${a}</b>`},
  wrong_teach:{en:()=>`Use: <span class="tkx-cmd">/teach question => answer</span>`, ar:()=>`استخدم: <span class="tkx-cmd">/teach سؤال => الإجابة</span>`},
  set_ok:{en:(k,v)=>`Updated <b>${k}</b> → <b>${v}</b> ✅`, ar:(k,v)=>`تم تعديل <b>${k}</b> إلى <b>${v}</b> ✅`},
  forget_ok:{en:(q)=>`Removed learned entry for “<b>${q}</b>” 🗑️`, ar:(q)=>`تم حذف المعلومة الخاصة بـ “<b>${q}</b>” 🗑️`},
  reset_ok:{en:()=>`Reset complete. Back to default ✨`, ar:()=>`تمت إعادة الضبط. رجعنا للوضع الافتراضي ✨`},
  lang_ok:{en:(l)=>`Language set to <b>${l}</b> ✅`, ar:(l)=>`تم تعيين اللغة إلى <b>${l}</b> ✅`},
  followup:{en:()=>`Your question matters. One more detail?`, ar:()=>`سؤالك مهم. ممكن تفاصيل أكثر؟`}
};

const KB_BASE=[
  {name:"greeting",patterns:["^hi","^hello","^hey","^yo","^مرحبا","^هلا","^سلام","^اهلا"],reply_en:(m)=>`Hi! ${MSG.greet.en(m)}`,reply_ar:(m)=>`مرحبًا! ${MSG.greet.ar(m)}`},
  {name:"price",patterns:["price","سعر","tkox price","كم سعر"],reply_en:(m)=>`Official initial price of <b>${m.token}</b> is <b>$${m.price_usd}</b>.`,reply_ar:(m)=>`السعر الابتدائي الرسمي لعملة <b>${m.token}</b> هو <b>$${m.price_usd}</b>.`},
  {name:"decimals",patterns:["decimal","decimals","كم رقم عشري","العشري"],reply_en:(m)=>`<b>${m.token}</b> uses <b>${m.decimals}</b> decimals.`,reply_ar:(m)=>`الرقم العشري لعملة <b>${m.token}</b> هو <b>${m.decimals}</b>.`},
  {name:"supply",patterns:["supply","total supply","circulating","العرض","الاجمالي","المتداول"],reply_en:(m)=>`Total: <b>${m.total_supply} ${m.token}</b> — Circulating at launch: <b>${m.circulating_at_launch} ${m.token}</b>.`,reply_ar:(m)=>`الإجمالي: <b>${m.total_supply} ${m.token}</b> — المتداول عند الإطلاق: <b>${m.circulating_at_launch} ${m.token}</b>.`},
  {name:"about",patterns:["what is tikko","about","ما هي","وش هي","tikkox"],reply_en:(m)=>`<b>${m.brand}</b> is a Substrate-based blockchain with Explorer, Wallet, and TikkoX Pay (coming).`,reply_ar:(m)=>`<b>${m.brand}</b> شبكة بلوكشين مبنية على Substrate، مع Explorer وWallet وTikkoX Pay (قريبًا).`},
  {name:"wallet",patterns:["wallet","محفظة","انشئ محفظة","create wallet"],reply_en:(m)=>`Wallet: <a target="_blank" href="${m.wallet_url}">${m.wallet_url}</a> (coming).`,reply_ar:(m)=>`المحفظة: <a target="_blank" href="${m.wallet_url}">${m.wallet_url}</a> (قريبًا).`},
  {name:"explorer",patterns:["explorer","المستكشف","explore","block","tx","account"],reply_en:(m)=>`Explorer: <a target="_blank" href="${m.explorer_url}">${m.explorer_url}</a> (coming).`,reply_ar:(m)=>`المستكشف: <a target="_blank" href="${m.explorer_url}">${m.explorer_url}</a> (قريبًا).`},
  {name:"bridge",patterns:["bridge","جسر","chainbridge"],reply_en:()=>`We plan to integrate <b>ChainBridge</b> under Sudo for security.`,reply_ar:()=>`سيتم دمج <b>ChainBridge</b> تحت صلاحيات Sudo لضمان الأمان.`},
  {name:"docs",patterns:["docs","وثائق","documentation","developer","sdk"],reply_en:(m)=>`Docs: <a target="_blank" href="${m.docs_url}">${m.docs_url}</a>`,reply_ar:(m)=>`الوثائق: <a target="_blank" href="${m.docs_url}">${m.docs_url}</a>`},
  {name:"grants",patterns:["grant","منحة","rewards","مكافآت"],reply_en:()=>`We run developer rewards. Pitch your idea or leave your email.`,reply_ar:()=>`لدينا مكافآت للمطورين. قدّم فكرتك أو اترك بريدك.`},
  {name:"laugh",patterns:["😂","🤣","هه","هاها","lol","lmao"],reply_en:()=>`Hahaha 😄 Love the vibe!`,reply_ar:()=>`ههههه 😄 جو جميل!`},
  {name:"thanks",patterns:["thanks","شكرا","thx","مشكور"],reply_en:()=>`You're welcome!`,reply_ar:()=>`العفو!`},
  {name:"contact",patterns:["email","contact","تواصل","بريد","support"],reply_en:(m)=>`Reach us at <b>${m.contact_email}</b> or <a href="${m.support_url}">support</a>.`,reply_ar:(m)=>`راسلنا على <b>${m.contact_email}</b> أو <a href="${m.support_url}">الدعم</a>.`}
];

const $=(q)=>document.querySelector(q);
function addMsg(role,html){const f=$(".tkx-bot-feed");const w=document.createElement("div");w.className="tkx-msg "+role;const b=document.createElement("div");b.className="bubble";b.innerHTML=html;w.appendChild(b);f.appendChild(w);f.scrollTop=f.scrollHeight}
function regMatch(pats,txt){txt=(txt||"").toLowerCase().trim();return pats.some(p=>new RegExp(p,"i").test(txt))}
function detectSentiment(txt){txt=(txt||"").toLowerCase();if(/[😂🤣😆😄]/.test(txt)||/(haha|lol|هههه)/i.test(txt))return"joy";if(/[😢😭😞😔]/.test(txt)||/(sad|حزين|محبط)/i.test(txt))return"sad";if(/[😡🤬]/.test(txt)||/(angry|غاضب)/i.test(txt))return"angry";if(/[🤔😕]/.test(txt)||/(confused|مش فاهم|مو فاهم|صعب)/i.test(txt))return"confused";return"neutral"}
function renderLinks(lang){return `<div class="tkx-links">`+LINKS.map(l=>`<a target="_blank" href="${l.url}">${lang==="ar"?l.label_ar:l.label_en}</a>`).join("")+`</div>`}
function suggestLinksIfNeeded(txt,lang){const hard=/(i can't|i cannot|i dont know|مش فاهم|مو فاهم|صعب|مشكلة|error|help|كيف|أين|وين|link|رابط)/i.test(txt||"");if(!hard)return"";return (lang==="ar"? "واضح أنك تحتاج رابط مباشر." : "It looks like you need a direct resource.")+" "+(lang==="ar"?"هذه روابط مفيدة:":"Helpful links:")+renderLinks(lang)}
function searchLearned(txt){const t=(txt||"").toLowerCase();for(const item of store.userKB){if(t.includes(item.q.toLowerCase()))return item.a}return null}
function pickReply(txt,lang,meta){const taught=searchLearned(txt);if(taught)return taught;for(const it of KB_BASE){if(regMatch(it.patterns,txt))return (lang==="ar"?it.reply_ar(meta):it.reply_en(meta))}return (lang==="ar"?MSG.followup.ar():MSG.followup.en())}

function doCommand(text,lang){
  const t=text.trim();
  if(t.startsWith("/teach ")){const parts=t.replace("/teach ","").split("=>");if(parts.length>=2){const q=parts[0].trim(),a=parts.slice(1).join("=>").trim();const arr=store.userKB;arr.push({q,a});store.userKB=arr;return (lang==="ar"?MSG.taught_ok.ar(q,a):MSG.taught_ok.en(q,a))}return (lang==="ar"?MSG.wrong_teach.ar():MSG.wrong_teach.en())}
  if(t.startsWith("/set ")){const [,key,...rest]=t.split(" ");if(!key||rest.length===0)return (lang==="ar"?`استخدم: <span class="tkx-cmd">/set key value</span>`:`Use: <span class="tkx-cmd">/set key value</span>`);const v=rest.join(" ");const m=store.meta;m[key]=v;store.meta=m;return (lang==="ar"?MSG.set_ok.ar(key,v):MSG.set_ok.en(key,v))}
  if(t.startsWith("/forget ")){const q=t.replace("/forget ","").trim();const arr=store.userKB.filter(x=>x.q.toLowerCase()!==q.toLowerCase());store.userKB=arr;return (lang==="ar"?MSG.forget_ok.ar(q):MSG.forget_ok.en(q))}
  if(t==="/reset"){store.reset();return (lang==="ar"?MSG.reset_ok.ar():MSG.reset_ok.en())}
  if(t.startsWith("/lang ")){const l=t.split(" ")[1]?.trim().toLowerCase();if(["ar","en"].includes(l)){store.lang=l;return (l==="ar"?MSG.lang_ok.ar("العربية"):MSG.lang_ok.en("English"))}return (lang==="ar"?"اكتب: /lang ar أو /lang en":"Type: /lang ar or /lang en")}
  if(t==="/links"){return renderLinks(lang)}
  return null;
}

function loadMeta(){const m=Object.assign({},META_DEFAULT,store.meta);LINKS.forEach(l=>{if(m[`${l.k}_url`])l.url=m[`${l.k}_url`]});return m}

function mountUI(){
  const root=document.createElement("div");
  root.innerHTML=`<button class="tkx-bot-toggle" title="Chat with TikkoX AI"></button>
  <div class="tkx-bot-panel" role="dialog" aria-label="TikkoX AI chat">
    <div class="tkx-bot-header"><img src="/assets/tikkox-logo-gold.png" alt="TikkoX" onerror="this.src='/assets/logo.png'"><div class="ttl">TikkoX AI</div></div>
    <div class="tkx-bot-feed" aria-live="polite"></div>
    <div class="tkx-bot-input"><input placeholder="Type here… / اكتب سؤالك هنا…" aria-label="Type a message"><button type="button">Send</button></div>
  </div>`;
  document.body.appendChild(root);
  const s=document.createElement("style");s.textContent=UI_CSS;document.head.appendChild(s);

  const toggle=document.querySelector(".tkx-bot-toggle");
  const panel=document.querySelector(".tkx-bot-panel");
  const btn=document.querySelector(".tkx-bot-input button");
  const inp=document.querySelector(".tkx-bot-input input");

  function greet(){
    const meta=loadMeta(); const lang=detectLang();
    addMsg("bot", lang==="ar"? MSG.greet.ar(meta) : MSG.greet.en(meta));
    addMsg("bot", lang==="ar"? MSG.tips.ar() : MSG.tips.en());
    const chips=document.createElement("div");chips.style.marginTop="6px";
    ["Price","Supply","Decimals","Wallet","Explorer","Docs","Roadmap","Support"].forEach(t=>{
      const c=document.createElement("span");c.className="tkx-kb-chip";c.textContent=t;c.onclick=()=>send(t);chips.appendChild(c);
    });
    document.querySelector(".tkx-bot-feed").appendChild(chips);
  }

  function send(text){
    const meta=loadMeta();
    const val=(text||inp.value||"").trim();
    if(!val) return;
    addMsg("user", val);
    store.historyPush({role:"user", text: val, t: Date.now()});
    inp.value="";
    const lang=detectLang(val);
    const cmd=doCommand(val,lang);
    if(cmd){ addMsg("bot", cmd); store.historyPush({role:"bot", text: cmd, t: Date.now()}); return; }
    const snt=detectSentiment(val);
    const flair=(lang==="ar"?{joy:" 😄",sad:" 🙏",angry:" 🤝",confused:" 🤔",neutral:""}:{joy:" 😄",sad:" 🙏",angry:" 🤝",confused:" 🤔",neutral:""});
    let reply=pickReply(val,lang,meta)+(flair[snt]||"");
    const help=suggestLinksIfNeeded(val,lang); if(help) reply+="<br>"+help;
    addMsg("bot", reply);
    store.historyPush({role:"bot", text: reply, t: Date.now()});
  }

  toggle.onclick=()=>{panel.style.display=(panel.style.display==="block")?"none":"block"; if(panel.style.display==="block" && !document.querySelector(".tkx-bot-feed").children.length) greet();};
  btn.onclick=()=>send();
  inp.addEventListener("keydown",(e)=>{if(e.key==="Enter") send();});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountUI); else mountUI();

})();