import "./style.css";

const app = document.querySelector("#app");
if (!app) throw new Error("Missing <div id='app'></div> in index.html");

app.innerHTML = `
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
`;

const moodInput = document.getElementById("moodInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");

const resultEmoji = document.getElementById("resultEmoji");
const resultTitle = document.getElementById("resultTitle");
const resultHint = document.getElementById("resultHint");
const moodList = document.getElementById("moodList");

const STORAGE_KEY = "mood_entries_v1";

/* ---------- Sentiment Word Banks (lots of words) ---------- */
const POSITIVE = new Set([
  "happy","happier","happiest","joy","joyful","glad","delighted","excited","thrilled","amazing","awesome","great","good",
  "fantastic","incredible","wonderful","beautiful","love","loved","loving","grateful","thankful","proud","confident",
  "peaceful","calm","relaxed","relieving","relieved","hopeful","optimistic","content","okay","fine","energized","motivated",
  "blessed","blessing","smiling","smile","laugh","laughing","fun","wins","winning","success","accomplished","productive"
]);

const NEGATIVE = new Set([
  "sad","sadder","saddest","down","depressed","depressing","lonely","alone","empty","hopeless","miserable","cry","crying",
  "hurt","pain","painful","awful","terrible","horrible","horrid","worst","bad","worse","angry","mad","furious","rage",
  "stressed","stress","anxious","anxiety","worried","worry","overwhelmed","panic","panicking","tired","exhausted","burnt",
  "burned","burnout","sick","nauseous","nausea","scared","afraid","fear","frustrated","frustrating","annoyed","upset",
  "heartbroken","devastated","disappointed","guilty","ashamed","embarrassed","gross","disgusting","hate","hating"
]);

const INTENSIFIERS = new Set([
  "very","really","so","super","extremely","incredibly","insanely","totally","completely","absolutely"
]);

const NEGATIONS = new Set(["not","never","no","can't","cannot","dont","don't","won't","isn't","wasn't","aren't","weren't"]);

/* ---------- Helpers ---------- */
function tokenize(text){
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function analyzeSentiment(text){
  const words = tokenize(text);

  let score = 0;
  let hitsPos = 0;
  let hitsNeg = 0;

  // simple negation handling: "not happy" flips
  for (let i = 0; i < words.length; i++){
    const w = words[i];
    const prev = words[i - 1] || "";
    const prev2 = words[i - 2] || "";

    const hasNegation = NEGATIONS.has(prev) || NEGATIONS.has(prev2);
    const hasBoost = INTENSIFIERS.has(prev);

    let delta = 0;

    if (POSITIVE.has(w)){
      delta = 2;
      hitsPos++;
    } else if (NEGATIVE.has(w)){
      delta = -2;
      hitsNeg++;
    }

    if (delta !== 0){
      if (hasBoost) delta *= 1.5;
      if (hasNegation) delta *= -1;
      score += delta;
    }
  }

  // Heuristic extras
  if (text.toLowerCase().includes("!!!")) score *= 1.15;
  if (text.toLowerCase().includes("...")) score *= 0.92;

  // label + emoji
  let label = "neutral";
  let emoji = "🌊";
  let title = "Calm / neutral";
  let hint = "Try adding more feeling words for a stronger result.";

  if (score >= 3){
    label = "positive";
    emoji = "✨";
    title = "Positive vibes";
    hint = "Ocean sparkle energy 🌟";
  } else if (score <= -3){
    label = "negative";
    emoji = "🌧️";
    title = "Heavy vibes";
    hint = "It’s okay. Breathe. One wave at a time 🌊";
  } else {
    // if they used strong negative words but score didn't cross threshold, force negative
    if (hitsNeg >= 2 && hitsNeg > hitsPos){
      label = "negative";
      emoji = "🌧️";
      title = "Leaning negative";
      hint = "I’m hearing stress/sadness. Want to write one more sentence?";
    } else if (hitsPos >= 2 && hitsPos > hitsNeg){
      label = "positive";
      emoji = "✨";
      title = "Leaning positive";
      hint = "That sounds pretty good 🌞";
    }
  }

  return { score: Math.round(score * 10) / 10, label, emoji, title, hint };
}

function loadEntries(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function renderEntries(entries){
  moodList.innerHTML = "";
  for (const entry of entries){
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="entryEmoji">${entry.emoji || "🌊"}</div>
      <div class="entryMain">
        <div>${escapeHtml(entry.text)}</div>
        <div class="meta">${entry.label || "neutral"} • ${new Date(entry.time).toLocaleString()}</div>
      </div>
    `;

    moodList.appendChild(li);
  }
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ---------- App Logic ---------- */
let entries = loadEntries();
renderEntries(entries);

function doAnalyze(){
  const text = moodInput.value.trim();
  if (!text){
    resultEmoji.textContent = "🌊";
    resultTitle.textContent = "Waiting for your note…";
    resultHint.textContent = "Type something first, then click Analyze.";
    return null;
  }

  const res = analyzeSentiment(text);
  resultEmoji.textContent = res.emoji;
  resultTitle.textContent = `${res.title} (${res.label})`;
  resultHint.textContent = `Score: ${res.score}. ${res.hint}`;
  return res;
}

analyzeBtn.addEventListener("click", () => {
  doAnalyze();
});

saveBtn.addEventListener("click", () => {
  const text = moodInput.value.trim();
  if (!text) return;

  const res = doAnalyze() || analyzeSentiment(text);

  const newEntry = {
    text,
    label: res.label,
    emoji: res.emoji,
    score: res.score,
    time: Date.now()
  };

  entries = [newEntry, ...entries];
  saveEntries(entries);
  renderEntries(entries);

  moodInput.value = "";
});

clearBtn.addEventListener("click", () => {
  moodInput.value = "";
  resultEmoji.textContent = "🌊";
  resultTitle.textContent = "Waiting for your note…";
  resultHint.textContent = "Tip: try words like “happy”, “stressed”, “grateful”, “overwhelmed”, “horrible”.";
});