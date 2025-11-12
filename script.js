import {
  auth, onAuthStateChanged, logoutUser,
  recordCorrectAnswer, recordWrongAttempt, db
} from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* ---------- UI helpers ---------- */
function renderStats({ gamesPlayed = 0, correctAnswers = 0 }) {
  const statsEl = document.getElementById("stats");
  const wrong = Math.max(0, gamesPlayed - correctAnswers);

  statsEl.classList.remove("hidden");
  statsEl.innerHTML = `
    <div class="grid grid-cols-3 gap-3 w-full max-w-[420px]">
      <div class="bg-white rounded-lg shadow p-3 text-center">
        <div class="text-xs text-gray-500">Total Games</div>
        <div class="text-xl font-bold">${gamesPlayed}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-3 text-center">
        <div class="text-xs text-gray-500">Correct</div>
        <div class="text-xl font-bold text-green-600">${correctAnswers}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-3 text-center">
        <div class="text-xs text-gray-500">Wrong</div>
        <div class="text-xl font-bold text-red-500">${wrong}</div>
      </div>
    </div>
  `;
}

class GameState {
  constructor() {
    this.imageUrl = "";
    this.answer = "";
    this.imgEl = document.getElementById("banana-img");
    this.feedbackEl = document.getElementById("feedback");
    this.btnEl = document.getElementById("action-button");
    this.inputEl = document.getElementById("answer-input");
  }
  updateState(imageUrl, answer) {
    this.imageUrl = imageUrl;
    this.answer = answer;
    this.imgEl.src = this.imageUrl;
    this.feedbackEl.textContent = "";
    this.btnEl.innerText = "Submit";
    this.inputEl.value = "";
    this.inputEl.focus();
  }
  setFeedback(text, color) {
    this.feedbackEl.textContent = text;
    this.feedbackEl.className = "text-lg font-semibold mb-2 " + (color || "");
  }
}

const game = new GameState();
let currentUser = null;

/* ---------- Game flow ---------- */
async function fetchQuestion() {
  try {
    game.btnEl.disabled = true;
    const res = await fetch("https://marcconrad.com/uob/banana/api.php");
    const question = await res.json();
    game.updateState(question.question, question.solution);
  } catch (err) {
    game.setFeedback("Failed to load question.", "text-red-500");
  } finally {
    game.btnEl.disabled = false;
  }
}

async function handleButtonClick() {
  if (!currentUser) return (window.location.href = "login.html");
  if (game.btnEl.innerText === "Next Question") return fetchQuestion();

  const userAnswer = game.inputEl.value.trim();
  if (!userAnswer) return game.setFeedback("Please type an answer!", "text-red-500");

  if (userAnswer === game.answer.toString()) {
    game.setFeedback("✅ Correct!", "text-green-600");
    game.btnEl.innerText = "Next Question";
    try { await recordCorrectAnswer(currentUser.uid); } catch {}
  } else {
    game.setFeedback("❌ Wrong! Try again.", "text-red-500");
    try { await recordWrongAttempt(currentUser.uid); } catch {}
  }
}

/* ---------- Wiring ---------- */
function initUIBindings() {
  document.getElementById("action-button").addEventListener("click", handleButtonClick);
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await logoutUser();
    window.location.href = "login.html";
  });

  // Enter key to submit
  game.inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleButtonClick();
  });
}

onAuthStateChanged(auth, async (user) => {
  const loadingEl = document.getElementById("loading");
  const wrapperEl = document.getElementById("game-wrapper");
  const userEmailEl = document.getElementById("user-email");

  if (!user) return (window.location.href = "login.html");

  currentUser = user;
  userEmailEl.textContent = user.email || "(no email)";
  loadingEl.classList.add("hidden");
  wrapperEl.classList.remove("hidden");

  // Live stats subscription
  const ref = doc(db, "users", user.uid);
  onSnapshot(ref, (snap) => {
    const d = snap.data() || { gamesPlayed: 0, correctAnswers: 0 };
    renderStats(d);
  });

  initUIBindings();
  fetchQuestion();
});
