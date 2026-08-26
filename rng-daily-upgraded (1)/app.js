const $ = (selector) => document.querySelector(selector);
const today = new Date();
const localKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const dayKey = localKey(today);
const dailySeed = Number(dayKey.replaceAll("-", "")) % 100000;
const pad = (n) => String(Math.abs(Number(n) || 0) % 100000).padStart(5, "0");
const money = (n) => Math.max(0, Math.round(n || 0)).toLocaleString();
const defaults = {
  best: 0, coins: 0, infinite: false, streak: 0, lastDay: "",
  rolls: [], unlocked: [], background: "default", totalRolls: 0,
  favorites: [], sound: true, mode: "classic", challenge: null, dailyModes: null
};
let state = Object.assign({}, defaults, JSON.parse(localStorage.getItem("rng-state-v4") || "null") || {});
state.rolls = Array.isArray(state.rolls) ? state.rolls : [];
state.unlocked = Array.isArray(state.unlocked) ? state.unlocked : [];
state.favorites = Array.isArray(state.favorites) ? state.favorites : [];
const save = () => localStorage.setItem("rng-state-v4", JSON.stringify(state));

const names = [
  "MIRROR MODE", "REPEAT OFFENDER", "TRIPLE DIGIT", "IN ORDER",
  "LUCKY DIGIT", "CLEAN LANDING", "PRIME TIME", "EVEN TEMPER",
  "BALANCED BOOKENDS", "DIGITAL ROOT", "MEME NUMBER", "LEET CODE",
  "CALCULATOR CLASSIC", "HIDDEN CHARACTER", "FIBONACCI CLUB",
  "POWER SURGE", "ALTERNATING CURRENT", "PERFECT SQUARE", "BINARY FRIEND"
];

function analyze(input) {
  const n = Math.abs(Number(input) || 0) % 100000;
  const s = pad(n);
  const d = [...s].map(Number);
  const sum = d.reduce((a, b) => a + b, 0);
  const tags = [];
  const details = [];
  const add = (tag, title, desc, points) => {
    tags.push(tag);
    details.push([title, desc, points]);
  };
  const counts = Object.fromEntries([...new Set(d)].map((x) => [x, d.filter((y) => y === x).length]));
  const triple = Object.entries(counts).find((x) => x[1] >= 3);
  const palindrome = s === s.split("").reverse().join("");
  const ascending = d.every((x, i) => i === 0 || x >= d[i - 1]);
  const descending = d.every((x, i) => i === 0 || x <= d[i - 1]);
  const alternating = d.length === 5 && d.every((x, i) => i < 2 || x === d[i % 2]);
  const fibonacci = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368].includes(n);
  const powerOfTwo = n > 0 && Number.isInteger(Math.log2(n));
  const square = Number.isInteger(Math.sqrt(n));
  const binary = d.every((x) => x === 0 || x === 1);
  let prime = n > 1;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) prime = false;

  if (palindrome) add("symmetry", names[0], "Reads the same left to right and right to left.", 280000);
  if (triple) add("triple", names[2], `${triple[1]} copies of ${triple[0]} appear in one number. Humans notice that instantly.`, 110000 + (triple[1] - 3) * 55000);
  if (new Set(d).size < 5 && !triple) add("repeat", names[1], `${d.find((x) => counts[x] > 1)} appears more than once, giving the number a visual rhythm.`, 75000);
  if ((ascending || descending) && new Set(d).size > 1) add("sequence", names[3], `The digits move ${ascending ? "upward" : "downward"} without breaking stride.`, 120000);
  const sevens = d.filter((x) => x === 7).length;
  const threes = d.filter((x) => x === 3).length;
  if (sevens || threes) add("lucky", names[4], `Contains ${[...new Set(d.filter((x) => x === 7 || x === 3))].join(" and ")} — ordinary statistically, suspicious spiritually.`, sevens * 90000 + threes * 30000);
  if (n % 10 === 0) add("round", names[5], `Ends in zero${n % 100 === 0 ? "s — impressively round" : ""}.`, 90000);
  if (prime) add("prime", names[6], "Only divisible by one and itself.", 85000);
  if (sum % 2 === 0) add("even", names[7], "Its digits add to an even total.", 20000);
  if (d[0] === d[4]) add("bookends", names[8], "The outside digits match like numerical bookends.", 45000);
  if (sum % 9 === 0) add("root", names[9], `The digits add to ${sum}, a multiple of nine.`, 35000);
  if (fibonacci) add("fibonacci", names[14], "It belongs to the sequence where every term remembers the two before it.", 180000);
  if (powerOfTwo) add("power2", names[15], "A clean power of two hiding in plain sight.", 150000);
  if (alternating) add("alternating", names[16], "Two digits take turns all the way across.", 125000);
  if (square) add("square", names[17], "This number is the product of an integer multiplied by itself.", 95000);
  if (binary) add("binary", names[18], "Uses only the two digits a computer thinks in.", 130000);

  const specials = {
    69420: [names[10], "69 and 420 share the same five-digit apartment.", 170000],
    42069: [names[10], "420 and 69 swapped places. A deliberate joke in number form.", 170000],
    1337: [names[11], "The classic gamer spelling of LEET, written as digits.", 145000],
    80085: [names[12], "A calculator-era joke number that still makes people turn the screen upside down.", 300000],
    12345: [names[3], "A perfect five-step run that anyone can spot.", 155000],
    54321: [names[3], "A perfect countdown with no explanation required.", 155000]
  };
  if (specials[n]) add("special", ...specials[n]);
  if (!details.length) add("plain", names[13], "No obvious pattern. Pure, unbothered randomness.", 0);

  const quiet = tags.length * 37 + sum % 64 + new Set(d).size * 11 + n % 64;
  const score = Math.min(1000000, Math.round(80000 + details.reduce((a, x) => a + x[2], 0) + Math.min(60000, quiet * 300)));
  return { s, n, tags, details, score, quiet };
}

const dailyChallenges = [
  { id: "pattern", title: "Spot any pattern", description: "Reveal a number with at least one visible clue.", reward: 35, test: (a) => !a.tags.includes("plain") },
  { id: "lucky", title: "Find a lucky signal", description: "Reveal a number containing a 3 or a 7.", reward: 45, test: (a) => a.tags.includes("lucky") },
  { id: "bigscore", title: "Break six figures", description: "Reveal a number worth at least 100,000 points.", reward: 50, test: (a) => a.score >= 100000 },
  { id: "mirror", title: "Catch the reflection", description: "Reveal a palindrome and make the number look back at you.", reward: 60, test: (a) => a.tags.includes("symmetry") },
  { id: "special", title: "Enter the folklore", description: "Reveal one of the numbers people already recognize.", reward: 75, test: (a) => a.tags.includes("special") },
  { id: "newmath", title: "Find hidden math", description: "Reveal a Fibonacci number, square, or power of two.", reward: 55, test: (a) => a.tags.some((t) => ["fibonacci", "square", "power2"].includes(t)) }
];
function challengeDefinition() {
  return dailyChallenges[dailySeed % dailyChallenges.length];
}
function ensureChallenge() {
  const definition = challengeDefinition();
  if (!state.challenge || state.challenge.day !== dayKey || state.challenge.id !== definition.id) {
    state.challenge = { day: dayKey, id: definition.id, completed: false };
    save();
  }
  return definition;
}
function ensureDailyModes() {
  if (!state.dailyModes || state.dailyModes.day !== dayKey) {
    state.dailyModes = { day: dayKey, played: { classic: false, blitz: false, guess: false } };
    save();
  } else {
    state.dailyModes.played = Object.assign({ classic: false, blitz: false, guess: false }, state.dailyModes.played || {});
  }
  return state.dailyModes.played;
}
function modeUsed(mode) {
  return Boolean(ensureDailyModes()[mode]);
}
function markModeUsed(mode) {
  ensureDailyModes()[mode] = true;
  save();
}
function modesUsedCount() {
  return Object.values(ensureDailyModes()).filter(Boolean).length;
}
function renderChallenge() {
  const card = $("#challengeCard");
  if (!card) return;
  const c = ensureChallenge();
  const complete = state.challenge.completed;
  $("#challengeTitle").textContent = c.title;
  $("#challengeDescription").textContent = c.description;
  $("#challengeReward").textContent = `+${c.reward} ◈`;
  $("#challengeStatus").textContent = complete ? "COMPLETED ✓" : "IN PROGRESS";
  card.classList.toggle("complete", complete);
}
function completeChallenge(a) {
  const c = ensureChallenge();
  if (state.challenge.completed || !c.test(a)) return 0;
  state.challenge.completed = true;
  state.coins += c.reward;
  if (!state.unlocked.includes("daily")) state.unlocked.push("daily");
  save();
  renderChallenge();
  return c.reward;
}

function syncWallet() {
  ["coins", "coinBig", "coinsAvailable"].forEach((id) => { if ($(`#${id}`)) $(`#${id}`).textContent = money(state.coins); });
  if ($("#best")) {
    $("#best").textContent = state.best ? money(state.best) : "—";
    $("#bestBar").style.width = `${Math.min(100, state.best / 10000)}%`;
  }
  if ($("#streak")) $("#streak").textContent = state.streak || 0;
  if ($("#modeLabel") && state.mode) updateModeUI();
  document.body.dataset.bg = state.background;
  const toggle = $("#soundToggle");
  if (toggle) toggle.textContent = state.sound ? "SOUND ON" : "SOUND OFF";
}
function getRolls() { return state.rolls || []; }
function rollKey(roll) { return roll.id || `${roll.date}-${roll.time}-${roll.number}`; }
function addRoll(a) {
  const reward = Math.max(3, Math.min(120, Math.floor(a.score / 18000)));
  state.coins += reward;
  state.totalRolls = (state.totalRolls || 0) + 1;
  const yesterday = localKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  state.rolls = getRolls();
  state.rolls.push({
    id: `${Date.now()}-${state.totalRolls}`, number: a.n, score: a.score, coins: reward,
    tags: a.tags, date: dayKey, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });
  if (a.score > state.best) state.best = a.score;
  if (state.lastDay !== dayKey) {
    state.streak = state.lastDay === yesterday ? (state.streak || 0) + 1 : 1;
    state.lastDay = dayKey;
  }
  save();
  syncWallet();
  return reward;
}

let audioContext;
function tone(frequency, duration = 0.08) {
  if (!state.sound || !window.AudioContext && !window.webkitAudioContext) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.045, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}
function confetti() {
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement("i");
    piece.style.cssText = `position:fixed;z-index:4;left:${Math.random() * 100}%;top:38%;width:7px;height:14px;background:${["#c8f169", "#ff9f68", "#8cc8ff", "#ff73d2"][i % 4]};transform:rotate(${Math.random() * 180}deg);animation:fall ${.8 + Math.random() * 1.4}s ease-out forwards`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2400);
  }
}
function showEffect(a, extra = "") {
  const effect = $("#effect");
  if (!effect) return;
  const type = a.tags.includes("special") ? "meme" : a.score >= 500000 ? "epic" : a.score >= 250000 ? "good" : "";
  if (!type && !extra) return;
  const word = extra || (a.n === 80085 ? "CALCULATOR LEGEND" : a.n === 69420 ? "NICE NUMBER" : a.tags.includes("special") ? "NUMBER LEGEND" : a.score >= 500000 ? "HIGH SIGNAL" : "NICE FIND");
  effect.innerHTML = `<div class="effectword ${type || "good"}">${word}<small style="display:block;font:12px 'DM Mono';letter-spacing:.05em">${a.score.toLocaleString()} POINTS · ${a.details.length} CLUES</small></div>`;
  effect.classList.add("show");
  if (type === "epic" || type === "meme") confetti();
  setTimeout(() => effect.classList.remove("show"), 2300);
}

let current = dailySeed;
let lastAnalysis = null;
let guessSubmitted = false;
let pendingGuessBonus = 0;
let blitzTimer;
let blitzRemaining = 0;
let currentRunMode = "classic";
let hasGenerated = true;

function updateModeUI() {
  const mode = $("#gameMode")?.value || state.mode || "classic";
  state.mode = mode;
  const labels = { classic: "TODAY'S NUMBER", blitz: "BLITZ RUN", guess: "GUESS THE SCORE" };
  if ($("#modeLabel")) $("#modeLabel").textContent = labels[mode];
  if ($("#dailyModes")) $("#dailyModes").textContent = `${modesUsedCount()} / 3 MODES USED TODAY`;
  if ($("#gameMode")) {
    const optionLabels = { classic: "CLASSIC", blitz: "BLITZ · 30 SEC", guess: "GUESS THE SCORE" };
    [...$("#gameMode").options].forEach((option) => {
      option.textContent = modeUsed(option.value) ? `${optionLabels[option.value]} · DONE` : optionLabels[option.value];
    });
  }
  const used = modeUsed(mode);
  if ($("#generate")) $("#generate").disabled = used;
  if ($("#reveal")) $("#reveal").disabled = used || currentRunMode !== mode || !hasGenerated;
  if ($("#guessControls")) $("#guessControls").hidden = mode !== "guess" || Boolean(lastAnalysis?.score) || used;
  if ($("#gameMode") && $("#gameMode").value !== mode) $("#gameMode").value = mode;
  if ($("#status") && used) $("#status").textContent = "● COMPLETE TODAY";
}
function renderNumber(n) {
  const a = analyze(n);
  const number = $("#number");
  if (!number) return a;
  number.textContent = a.s;
  number.classList.remove("roll");
  void number.offsetWidth;
  number.classList.add("roll");
  const positive = a.details.filter((x) => x[2] > 0).length;
  if ($("#caption")) $("#caption").textContent = `${positive} recognizable pattern${positive === 1 ? "" : "s"} waiting to be revealed.`;
  if ($("#scoreline")) $("#scoreline").textContent = "Reveal the score to inspect the number.";
  if ($("#traits")) $("#traits").innerHTML = '<div class="empty">Your discoveries will appear here one at a time.</div>';
  if ($("#sharePanel")) $("#sharePanel").hidden = true;
  updateModeUI();
  return a;
}
function startBlitz() {
  clearInterval(blitzTimer);
  blitzRemaining = 30;
  if ($("#modeTimer")) $("#modeTimer").textContent = "30s LEFT";
  blitzTimer = setInterval(() => {
    blitzRemaining--;
    if ($("#modeTimer")) $("#modeTimer").textContent = `${blitzRemaining}s LEFT`;
    if (blitzRemaining <= 0) {
      clearInterval(blitzTimer);
      if ($("#status")) $("#status").textContent = "● TIME";
      if ($("#modeTimer")) $("#modeTimer").textContent = "TIME";
      tone(180, .18);
    }
  }, 1000);
}
function generate() {
  if (modeUsed(state.mode)) return;
  clearInterval(blitzTimer);
  const n = Math.floor(Math.random() * 100000);
  const number = $("#number");
  let steps = 0;
  currentRunMode = state.mode;
  hasGenerated = true;
  guessSubmitted = false;
  pendingGuessBonus = 0;
  lastAnalysis = null;
  if ($("#status")) $("#status").textContent = "● ROLLING";
  if ($("#sharePanel")) $("#sharePanel").hidden = true;
  const timer = setInterval(() => {
    if (number) number.textContent = pad(Math.floor(Math.random() * 100000));
    if (++steps > 13) {
      clearInterval(timer);
      current = n;
      renderNumber(n);
      if ($("#status")) $("#status").textContent = "● READY";
      if (state.mode === "blitz") startBlitz();
      tone(520, .1);
    }
  }, 42);
}
function resultText(a) {
  const clues = a.details.filter((x) => x[2] > 0).map((x) => x[0].toLowerCase()).slice(0, 3);
  return `I found ${a.s} in RNG//DAILY: ${money(a.score)}/1,000,000 points${clues.length ? ` · ${clues.join(", ")}` : ""}.`;
}
function updateShare(a) {
  if (!$("#sharePanel")) return;
  $("#shareNumber").textContent = a.s;
  $("#shareSummary").textContent = `${money(a.score)} points · ${a.details.filter((x) => x[2] > 0).length} visible clues`;
  $("#sharePanel").hidden = false;
}
async function copyResult() {
  if (!lastAnalysis) return;
  const text = resultText(lastAnalysis);
  try {
    if (navigator.clipboard) await navigator.clipboard.writeText(text);
    else {
      const area = document.createElement("textarea");
      area.value = text; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
    }
    if ($("#shareStatus")) $("#shareStatus").textContent = "COPIED";
    tone(720, .08);
  } catch {
    if ($("#shareStatus")) $("#shareStatus").textContent = "COPY BLOCKED";
  }
}
async function shareResult() {
  if (!lastAnalysis) return;
  const text = resultText(lastAnalysis);
  if (navigator.share) {
    try { await navigator.share({ title: "RNG//DAILY result", text }); } catch { /* cancelled shares are quiet */ }
  } else copyResult();
}
function submitGuess() {
  const guess = Number($("#guessInput")?.value);
  if (!Number.isFinite(guess) || guess < 0 || guess > 1000000) {
    if ($("#shareStatus")) $("#shareStatus").textContent = "ENTER 0–1,000,000";
    return;
  }
  const answer = analyze(current).score;
  const difference = Math.abs(answer - guess);
  pendingGuessBonus = difference <= 10000 ? 30 : difference <= 50000 ? 15 : 0;
  guessSubmitted = true;
  reveal();
}
function reveal() {
  if (modeUsed(state.mode)) return;
  if (currentRunMode !== state.mode || !hasGenerated) {
    if ($("#caption")) $("#caption").textContent = "Generate this mode's number before revealing it.";
    return;
  }
  if ($("#gameMode") && $("#gameMode").value === "guess" && !guessSubmitted) {
    if ($("#caption")) $("#caption").textContent = "Lock in your score guess before revealing.";
    $("#guessInput")?.focus();
    return;
  }
  const a = analyze(current);
  lastAnalysis = a;
  let reward = addRoll(a);
  markModeUsed(state.mode);
  const challengeReward = completeChallenge(a);
  let modeBonus = pendingGuessBonus;
  if (state.mode === "blitz" && blitzRemaining > 0) {
    modeBonus += Math.min(30, blitzRemaining);
    clearInterval(blitzTimer);
  }
  if (modeBonus) { state.coins += modeBonus; save(); syncWallet(); }
  const bonusText = challengeReward || modeBonus ? ` · +${challengeReward + modeBonus} bonus ◈` : "";
  if ($("#scoreline")) $("#scoreline").innerHTML = `<b style="color:var(--lime);font:18px 'DM Mono'">${money(a.score)}/1,000,000</b> · +${reward} ◈${bonusText}`;
  if ($("#traits")) $("#traits").innerHTML = a.details.map((x, i) => `<article class="trait" style="animation-delay:${i * .06}s"><div class="icon">${String(i + 1).padStart(2, "0")}</div><h3>${x[0]}</h3><p>${x[1]}</p>${x[2] ? `<span class="pts">+${money(x[2])} PTS</span>` : "<span class=\"pts\">NO BONUS · STILL VALID</span>"}</article>`).join("");
  if ($("#caption")) $("#caption").textContent = `${a.tags.length} visible clue${a.tags.length === 1 ? "" : "s"} · +${reward + challengeReward + modeBonus} coins`;
  if ($("#rollCount")) $("#rollCount").textContent = `${getRolls().filter((x) => x.date === dayKey).length} rolls today`;
  if ($("#status")) $("#status").textContent = "● REVEALED";
  updateShare(a);
  showEffect(a, challengeReward ? "MISSION COMPLETE" : "");
  tone(challengeReward ? 880 : 660, .12);
  unlock(a);
  renderAchievements();
  renderRolls();
  guessSubmitted = false;
  pendingGuessBonus = 0;
  hasGenerated = false;
  if ($("#guessControls")) $("#guessControls").hidden = true;
  updateModeUI();
  return a;
}

function unlock(a) {
  const candidates = [];
  const digits = [...a.s].map(Number);
  const dayRolls = getRolls().filter((x) => x.date === dayKey);
  if (a.tags.includes("symmetry")) candidates.push("mirror");
  if (a.tags.includes("triple")) candidates.push("triple");
  if (a.tags.includes("special")) candidates.push("special");
  if (a.tags.includes("lucky")) candidates.push("lucky");
  if (a.tags.includes("prime")) candidates.push("prime");
  if (a.tags.includes("fibonacci")) candidates.push("fibonacci");
  if (a.tags.includes("power2")) candidates.push("power2");
  if (a.tags.includes("alternating")) candidates.push("alternating");
  if (a.tags.includes("square")) candidates.push("square");
  if (a.tags.includes("binary")) candidates.push("binary");
  if (a.score >= 500000) candidates.push("half");
  if (a.score >= 100000) candidates.push("score100");
  if (a.score >= 750000) candidates.push("score750");
  if (a.score >= 900000) candidates.push("score900");
  if (a.tags.includes("special") && a.n === 69420) candidates.push("meme69420");
  if (a.tags.includes("special") && a.n === 42069) candidates.push("meme42069");
  if (a.tags.includes("special") && a.n === 1337) candidates.push("meme1337");
  if (a.tags.includes("special") && a.n === 80085) candidates.push("meme80085");
  if (a.tags.includes("triple")) candidates.push("pattern3");
  if (digits.filter((x) => x === 7).length >= 3) candidates.push("seven");
  if (digits.every((x) => x === 0)) candidates.push("zero");
  if (Object.values(Object.fromEntries(digits.map((x) => [x, digits.filter((y) => y === x).length]))).includes(4)) candidates.push("four");
  if (digits.every((x) => x === digits[0])) candidates.push("fiveSame");
  if (a.tags.includes("sequence") && digits[0] < digits[4]) candidates.push("ascending");
  if (a.tags.includes("sequence") && digits[0] > digits[4]) candidates.push("descending");
  if (digits.every((x) => x % 2)) candidates.push("odd");
  if (digits.every((x) => x % 2 === 0)) candidates.push("even");
  if (a.n < 10000) candidates.push("low");
  if (a.n > 90000) candidates.push("high");
  if (a.tags.includes("root")) candidates.push("sum9");
  if (a.tags.includes("bookends")) candidates.push("bookends");
  if (a.tags.includes("plain")) candidates.push("plain");
  if (state.totalRolls >= 1) candidates.push("one");
  if (a.tags.length >= 5) candidates.push("pattern5");
  if (dayRolls.length >= 5) candidates.push("five", "roll5");
  if (dayRolls.length >= 10) candidates.push("roll10");
  if (dayRolls.length >= 20) candidates.push("roll20");
  if (state.totalRolls >= 25) candidates.push("roll25");
  if (state.totalRolls >= 50) candidates.push("fifty");
  if (state.totalRolls >= 100) candidates.push("roll100");
  if (state.totalRolls >= 250) candidates.push("roll250");
  if (state.coins >= 100) candidates.push("coins100");
  if (state.coins >= 500) candidates.push("coins500");
  if (state.coins >= 1000) candidates.push("coins1000");
  if (state.streak >= 2) candidates.push("day2");
  if (state.streak >= 7) candidates.push("day7");
  if (state.streak >= 30) candidates.push("day30");
  candidates.forEach((id) => { if (!state.unlocked.includes(id)) state.unlocked.push(id); });
  save();
}

const achievements = [
  ["mirror", "Looking Back", "Find a palindrome."], ["triple", "Three's Company", "Find three matching digits."],
  ["special", "Internet Archaeologist", "Find a special number."], ["lucky", "Lucky Break", "Find a 7 or 3."],
  ["prime", "Indivisible", "Find a prime number."], ["fibonacci", "Sequence Keeper", "Find a Fibonacci number."],
  ["power2", "Power Surge", "Find a power of two."], ["alternating", "On-Off", "Find alternating digits."],
  ["square", "Squared Away", "Find a perfect square."], ["binary", "Machine Language", "Find a binary-friendly number."],
  ["half", "Halfway There", "Score 500,000 points."], ["five", "Warm Up", "Reveal five rolls in one day."],
  ["fifty", "Serial Roller", "Reveal 50 numbers."], ["roll10", "Ten Deep", "Reveal 10 numbers."],
  ["roll25", "Quarter Century", "Reveal 25 numbers."], ["roll100", "Century", "Reveal 100 numbers."],
  ["coins100", "Pocket Change", "Earn 100 coins."], ["coins500", "Getting Rich", "Earn 500 coins."],
  ["coins1000", "Four Digits", "Earn 1,000 coins."], ["seven", "Seventh Heaven", "Find 777 in a number."],
  ["four", "Quad Squad", "Find four matching digits."], ["fiveSame", "Full House", "Find five matching digits."],
  ["zero", "Round Trip", "Find five zeros."], ["ascending", "Up We Go", "Find an ascending run."],
  ["descending", "Down We Go", "Find a descending run."], ["sum9", "Nine Lives", "Find a digit sum divisible by 9."],
  ["bookends", "Bookends", "Match the first and last digit."], ["odd", "Oddball", "Find a number with only odd digits."],
  ["even", "Even Steven", "Find a number with only even digits."], ["low", "Low Five", "Generate a number under 10000."],
  ["high", "High Five", "Generate a number over 90000."], ["meme69420", "Nice", "Find 69420."],
  ["meme42069", "Reverse Nice", "Find 42069."], ["meme1337", "Elite", "Find 1337."],
  ["meme80085", "Calculator Kid", "Find 80085."], ["one", "First Blood", "Reveal your first number."],
  ["day2", "Back Again", "Play on two days."], ["day7", "Weekly", "Keep a seven-day streak."],
  ["day30", "Monthly", "Keep a 30-day streak."], ["background", "Interior Design", "Unlock a background."],
  ["shop", "Collector", "Unlock three backgrounds."], ["infinite", "Beyond the Limit", "Buy Infinite Mode."],
  ["compare", "Referee", "Compare two numbers."], ["lab", "Lab Rat", "Visit the Lab."],
  ["archive", "Historian", "Visit the Archive."], ["shortcut", "Speed Reader", "Use a keyboard shortcut."],
  ["roll5", "Five Alive", "Roll five times."], ["roll20", "Twenty Questions", "Roll 20 times."],
  ["roll250", "Big Sample", "Roll 250 times."], ["pattern3", "Triple Threat", "Find three visible clues."],
  ["pattern5", "Pattern Stack", "Find five visible clues."], ["score100", "Six Figures", "Score 100,000."],
  ["score750", "Heavy Hitter", "Score 750,000."], ["score900", "Legendary", "Score 900,000."],
  ["plain", "Chaos Enjoyer", "Find pure randomness."], ["daily", "Mission Control", "Complete a daily mission."]
];
function renderAchievements() {
  const grid = $("#achievementGrid");
  if (!grid) return;
  const unlocked = state.unlocked || [];
  const done = achievements.filter((a) => unlocked.includes(a[0])).length;
  if ($("#achievementCount")) $("#achievementCount").textContent = `${done} / ${achievements.length}`;
  grid.innerHTML = achievements.map((a) => `<article class="achievement ${unlocked.includes(a[0]) ? "unlocked" : ""}"><b>${unlocked.includes(a[0]) ? "✓" : "○"} ${a[1]}</b><p>${a[2]}</p></article>`).join("");
}

const backgrounds = [
  ["default", "Carbon", "The original dark lab.", 0], ["mint", "Mint Lab", "A cool green instrument panel.", 180],
  ["sunset", "Sunset Array", "Warm signals, late-night energy.", 300], ["ocean", "Deep Ocean", "Blue noise for deep thinking.", 450],
  ["violet", "Violet Room", "A softer, stranger lab.", 650], ["paper", "Paper Mode", "Bright, clean, suspiciously calm.", 800],
  ["terminal", "Terminal Green", "For serious number business.", 1000], ["candy", "Candy Static", "Maximum color. Minimum seriousness.", 1400]
];
function renderShop() {
  const shop = $("#shopgrid");
  if (!shop) return;
  shop.innerHTML = backgrounds.map((x) => {
    const owned = state.unlocked.includes(`bg-${x[0]}`) || x[0] === "default";
    return `<article class="shopitem ${owned ? "owned" : ""}"><div class="swatch sw-${x[0]}"></div><h3>${x[1]}</h3><p>${x[2]}</p><button class="secondary shopbtn" data-bg="${x[0]}" data-cost="${x[3]}">${state.background === x[0] ? "EQUIPPED" : owned ? "EQUIP" : `${x[3]} ◈`}</button></article>`;
  }).join("") + `<article class="shopitem ${state.infinite ? "owned" : ""}"><div class="swatch sw-infinite"></div><h3>INFINITE MODE</h3><p>Roll without daily rules. It belongs in the store.</p><button class="shopbtn" id="buyInfinite">${state.infinite ? "OWNED ✓" : "BUY FOR 1,000 ◈"}</button></article>`;
  document.querySelectorAll(".shopbtn[data-bg]").forEach((button) => button.onclick = () => {
    const id = button.dataset.bg; const cost = Number(button.dataset.cost);
    if (!state.unlocked.includes(`bg-${id}`) && id !== "default") {
      if (state.coins < cost) return alert("Not enough coins yet.");
      state.coins -= cost; state.unlocked.push(`bg-${id}`);
    }
    state.background = id; state.unlocked.push("background");
    if (backgrounds.filter((x) => state.unlocked.includes(`bg-${x[0]}`)).length >= 3) state.unlocked.push("shop");
    save(); syncWallet(); renderShop();
  });
  $("#buyInfinite")?.addEventListener("click", () => {
    if (state.infinite) return;
    if (state.coins < 1000) return alert("You need 1,000 coins to buy Infinite Mode.");
    state.coins -= 1000; state.infinite = true; state.unlocked.push("infinite"); save(); syncWallet(); renderShop();
  });
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
function renderStats() {
  const box = $("#statsGrid");
  if (!box) return;
  const rolls = getRolls();
  const average = rolls.length ? rolls.reduce((sum, x) => sum + x.score, 0) / rolls.length : 0;
  const patternedRolls = rolls.filter((x) => (x.tags || []).some((tag) => tag !== "plain"));
  const patterns = rolls.flatMap((x) => x.tags || []).filter((x) => x !== "plain");
  const counts = patterns.reduce((acc, tag) => ({ ...acc, [tag]: (acc[tag] || 0) + 1 }), {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  box.innerHTML = [
    ["AVERAGE SCORE", rolls.length ? money(average) : "—", "Across every revealed roll"],
    ["BEST PATTERN", top ? top[0].toUpperCase() : "—", top ? `${top[1]} discoveries` : "Reveal a few numbers"],
    ["FAVORITES", state.favorites.length || "0", "Star a roll in the log"],
    ["PATTERN RATE", rolls.length ? `${Math.round(patternedRolls.length / rolls.length * 100)}%` : "—", "Rolls with a visible clue"]
  ].map((x) => `<div class="statbox"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("");
}
function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter((x) => x !== id) : [...state.favorites, id];
  save(); renderRolls(); renderStats();
}
function renderRolls() {
  const list = $("#historyList");
  if (!list) return;
  let rolls = getRolls().slice();
  const search = ($("#historySearch")?.value || "").trim().toLowerCase();
  const sort = $("#historySort")?.value || "newest";
  if (search) rolls = rolls.filter((x) => `${x.number} ${x.date} ${x.tags?.join(" ")}`.toLowerCase().includes(search));
  if ($("#favoritesOnly")?.checked) rolls = rolls.filter((x) => state.favorites.includes(rollKey(x)));
  if (sort === "score") rolls.sort((a, b) => b.score - a.score);
  else if (sort === "coins") rolls.sort((a, b) => b.coins - a.coins);
  else rolls.reverse();
  if ($("#historyCount")) $("#historyCount").textContent = `${rolls.length} shown · newest first`;
  list.innerHTML = rolls.length ? rolls.map((x) => {
    const id = rollKey(x); const favorite = state.favorites.includes(id);
    return `<div class="historyrow"><button class="favorite ${favorite ? "selected" : ""}" data-favorite="${esc(id)}" aria-label="${favorite ? "Remove from favorites" : "Add to favorites"}">${favorite ? "★" : "☆"}</button><b>${pad(x.number)}</b><span>${esc(x.date)} · ${esc(x.time || "")}</span><span>${money(x.score)} PTS</span><span>+${x.coins} ◈</span></div>`;
  }).join("") : '<div class="empty">No rolls match this view yet.</div>';
  list.querySelectorAll("[data-favorite]").forEach((button) => button.addEventListener("click", () => toggleFavorite(button.dataset.favorite)));
  if ($("#totalRolls")) $("#totalRolls").textContent = state.totalRolls || 0;
  if ($("#archiveBest")) $("#archiveBest").textContent = money(state.best || 0);
  renderStats();
}

function renderExplorer(filter = "all") {
  const nums = filter === "special" ? [69420, 42069, 1337, 80085, 12345, 54321] : filter === "triple" ? [77700, 33381, 99942, 55512, 11119, 88808] : Array.from({ length: 6 }, () => Math.floor(Math.random() * 100000));
  const box = $("#results");
  if (!box) return;
  box.innerHTML = nums.map((n) => {
    const a = analyze(n); const detail = a.details.find((x) => x[2] > 0) || a.details[0];
    return `<article class="result"><span class="rs">${money(a.score)}</span><div class="rnum">${a.s}</div><h4>${detail[0]}</h4><p>${detail[1]}</p>${a.tags.slice(0, 3).map((t) => `<span class="tag">#${t}</span>`).join("")}</article>`;
  }).join("");
}
function addSoundControl() {
  const header = $("header");
  if (!header || $("#soundToggle")) return;
  const button = document.createElement("button");
  button.id = "soundToggle"; button.className = "soundtoggle"; button.type = "button";
  button.onclick = () => { state.sound = !state.sound; save(); syncWallet(); if (state.sound) tone(660); };
  header.appendChild(button);
}

function setup() {
  ensureChallenge();
  ensureDailyModes();
  if ($("#gameMode")) $("#gameMode").value = state.mode || "classic";
  addSoundControl();
  syncWallet();
  renderChallenge();
  if ($("#date")) $("#date").textContent = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  if ($("#gameMode")) {
    $("#gameMode").value = state.mode || "classic";
    $("#gameMode").onchange = () => {
      clearInterval(blitzTimer);
      state.mode = $("#gameMode").value;
      currentRunMode = state.mode;
      hasGenerated = false;
      lastAnalysis = null;
      guessSubmitted = false;
      pendingGuessBonus = 0;
      if (state.mode === "classic" && !modeUsed("classic") && current === dailySeed) hasGenerated = true;
      if ($("#scoreline")) $("#scoreline").textContent = "Generate this mode to begin your daily run.";
      if ($("#traits")) $("#traits").innerHTML = '<div class="empty">Your discoveries will appear here one at a time.</div>';
      if ($("#sharePanel")) $("#sharePanel").hidden = true;
      save(); updateModeUI();
    };
  }
  if ($("#generate")) $("#generate").onclick = generate;
  if ($("#reveal")) $("#reveal").onclick = reveal;
  if ($("#submitGuess")) $("#submitGuess").onclick = submitGuess;
  if ($("#copyResult")) $("#copyResult").onclick = copyResult;
  if ($("#shareResult")) $("#shareResult").onclick = shareResult;
  if ($("#number")) renderNumber(current);
  renderAchievements(); renderShop(); renderRolls();
  document.querySelectorAll("[data-filter]").forEach((button) => button.onclick = () => {
    document.querySelectorAll("[data-filter]").forEach((x) => x.classList.remove("active"));
    button.classList.add("active"); renderExplorer(button.dataset.filter);
  });
  if ($("#results") && document.querySelector("[data-filter].active")) renderExplorer(document.querySelector("[data-filter].active").dataset.filter);
  $("#compareBtn")?.addEventListener("click", () => {
    const a = analyze($("#compareA").value), b = analyze($("#compareB").value);
    state.unlocked.push("compare"); save();
    $("#compareResult").innerHTML = `<b style="color:var(--lime)">${a.score === b.score ? "Tie game" : a.score > b.score ? `${a.s} wins` : `${b.s} wins`}</b><br>${a.s}: ${money(a.score)} · ${b.s}: ${money(b.score)}`;
  });
  ["historySearch", "historySort", "favoritesOnly"].forEach((id) => $(`#${id}`)?.addEventListener("input", renderRolls));
  document.querySelectorAll("nav a").forEach((link) => link.addEventListener("click", () => {
    const href = link.getAttribute("href") || "";
    if (href.includes("lab")) state.unlocked.push("lab");
    if (href.includes("archive")) state.unlocked.push("archive");
    save();
  }));
  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (event.key === " " && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
      event.preventDefault(); generate(); state.unlocked.push("shortcut"); save();
    }
    if (event.key.toLowerCase() === "r" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) reveal();
  });
  let logoClicks = 0; let secretKeys = "";
  $("#logoSecret")?.addEventListener("click", (event) => {
    logoClicks++; setTimeout(() => { logoClicks = 0; }, 2500);
    if (logoClicks >= 7 && secretKeys === "kernel") { event.preventDefault(); location.href = "dev.html"; }
  });
  document.addEventListener("keydown", (event) => {
    if (document.activeElement?.id !== "termcmd") secretKeys = (secretKeys + event.key.toLowerCase()).slice(-6);
    if (secretKeys === "kernel" && logoClicks >= 7) location.href = "dev.html";
  });
}
setup();