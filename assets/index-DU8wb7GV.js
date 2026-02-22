(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function o(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(n){if(n.ep)return;n.ep=!0;const r=o(n);fetch(n.href,r)}})();const w=document.querySelector("#app");if(!w)throw new Error("Missing <div id='app'></div> in index.html");w.innerHTML=`
  <div class="card">
    <h1>Mood Tracker</h1>
    <p class="subtitle">Type a sentence. Click <b>Analyze</b> to see the vibe.</p>

    <textarea id="moodInput" placeholder="How are you feeling today?"></textarea>

    <div class="actions">
      <button id="analyzeBtn" type="button">Analyze</button>
      <button id="saveBtn" type="button">Save Entry</button>
      <button id="clearBtn" type="button">Clear</button>
    </div>

    <div class="result" id="resultBox">
      <div class="emoji" id="resultEmoji">🌊</div>
      <div class="resultText">
        <strong id="resultTitle">Waiting for your note…</strong>
        <span id="resultHint">Tip: try words like “happy”, “stressed”, “grateful”, “overwhelmed”, “horrible”.</span>
      </div>
    </div>

    <h2>Your Entries</h2>
    <p class="entriesNote">Saved locally in your browser (localStorage).</p>
    <ul id="moodList"></ul>
  </div>
`;const p=document.getElementById("moodInput"),C=document.getElementById("analyzeBtn"),A=document.getElementById("saveBtn"),N=document.getElementById("clearBtn"),m=document.getElementById("resultEmoji"),y=document.getElementById("resultTitle"),f=document.getElementById("resultHint"),h=document.getElementById("moodList"),E="mood_entries_v1",O=new Set(["happy","happier","happiest","joy","joyful","glad","delighted","excited","thrilled","amazing","awesome","great","good","fantastic","incredible","wonderful","beautiful","love","loved","loving","grateful","thankful","proud","confident","peaceful","calm","relaxed","relieving","relieved","hopeful","optimistic","content","okay","fine","energized","motivated","blessed","blessing","smiling","smile","laugh","laughing","fun","wins","winning","success","accomplished","productive"]),j=new Set(["sad","sadder","saddest","down","depressed","depressing","lonely","alone","empty","hopeless","miserable","cry","crying","hurt","pain","painful","awful","terrible","horrible","horrid","worst","bad","worse","angry","mad","furious","rage","stressed","stress","anxious","anxiety","worried","worry","overwhelmed","panic","panicking","tired","exhausted","burnt","burned","burnout","sick","nauseous","nausea","scared","afraid","fear","frustrated","frustrating","annoyed","upset","heartbroken","devastated","disappointed","guilty","ashamed","embarrassed","gross","disgusting","hate","hating"]),z=new Set(["very","really","so","super","extremely","incredibly","insanely","totally","completely","absolutely"]),b=new Set(["not","never","no","can't","cannot","dont","don't","won't","isn't","wasn't","aren't","weren't"]);function k(t){return t.toLowerCase().replace(/[^a-z0-9'\s]/g," ").split(/\s+/).filter(Boolean)}function I(t){const e=k(t);let o=0,s=0,n=0;for(let c=0;c<e.length;c++){const g=e[c],v=e[c-1]||"",B=e[c-2]||"",L=b.has(v)||b.has(B),T=z.has(v);let l=0;O.has(g)?(l=2,s++):j.has(g)&&(l=-2,n++),l!==0&&(T&&(l*=1.5),L&&(l*=-1),o+=l)}t.toLowerCase().includes("!!!")&&(o*=1.15),t.toLowerCase().includes("...")&&(o*=.92);let r="neutral",i="🌊",a="Calm / neutral",d="Try adding more feeling words for a stronger result.";return o>=3?(r="positive",i="✨",a="Positive vibes",d="Ocean sparkle energy 🌟"):o<=-3?(r="negative",i="🌧️",a="Heavy vibes",d="It’s okay. Breathe. One wave at a time 🌊"):n>=2&&n>s?(r="negative",i="🌧️",a="Leaning negative",d="I’m hearing stress/sadness. Want to write one more sentence?"):s>=2&&s>n&&(r="positive",i="✨",a="Leaning positive",d="That sounds pretty good 🌞"),{score:Math.round(o*10)/10,label:r,emoji:i,title:a,hint:d}}function H(){try{const t=localStorage.getItem(E),e=t?JSON.parse(t):[];return Array.isArray(e)?e:[]}catch{return[]}}function M(t){localStorage.setItem(E,JSON.stringify(t))}function S(t){h.innerHTML="";for(const e of t){const o=document.createElement("li");o.innerHTML=`
      <div class="entryEmoji">${e.emoji||"🌊"}</div>
      <div class="entryMain">
        <div>${$(e.text)}</div>
        <div class="meta">${e.label||"neutral"} • ${new Date(e.time).toLocaleString()}</div>
      </div>
    `,h.appendChild(o)}}function $(t){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}let u=H();S(u);function x(){const t=p.value.trim();if(!t)return m.textContent="🌊",y.textContent="Waiting for your note…",f.textContent="Type something first, then click Analyze.",null;const e=I(t);return m.textContent=e.emoji,y.textContent=`${e.title} (${e.label})`,f.textContent=`Score: ${e.score}. ${e.hint}`,e}C.addEventListener("click",()=>{x()});A.addEventListener("click",()=>{const t=p.value.trim();if(!t)return;const e=x()||I(t);u=[{text:t,label:e.label,emoji:e.emoji,score:e.score,time:Date.now()},...u],M(u),S(u),p.value=""});N.addEventListener("click",()=>{p.value="",m.textContent="🌊",y.textContent="Waiting for your note…",f.textContent="Tip: try words like “happy”, “stressed”, “grateful”, “overwhelmed”, “horrible”."});
