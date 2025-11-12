import {
  auth, onAuthStateChanged, logoutUser,
  recordCorrectAnswer, recordWrongAttempt, db
} from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
  }
  setFeedback(text, color) {
    this.feedbackEl.textContent = text;
    this.feedbackEl.className = "text-lg font-semibold mb-2 " + (color || "");
  }
}

const game = new GameState();
let currentUser = null;

async function fetchQuestion() {
  try {
    const res = await fetch("https://marcconrad.com/uob/banana/api.php");
    const question = await res.json();
    game.updateState(question.question, question.solution);
  } catch (err) {
    game.setFeedback("Failed to load question.", "text-red-500");
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

function initUIBindings() {
  document.getElementById("action-button").addEventListener("click", handleButtonClick);
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await logoutUser();
    window.location.href = "login.html";
  });
}

onAuthStateChanged(auth, async (user) => {
  const loadingEl = document.getElementById("loading");
  const wrapperEl = document.getElementById("game-wrapper");
  const userEmailEl = document.getElementById("user-email");
  const statsEl = document.getElementById("stats");

  if (!user) return (window.location.href = "login.html");

  currentUser = user;
  userEmailEl.textContent = user.email || "(no email)";
  loadingEl.classList.add("hidden");
  wrapperEl.classList.remove("hidden");

  // Live stats (optional)
  try {
    const ref = doc(db, "users", user.uid);
    onSnapshot(ref, (snap) => {
      const d = snap.data();
      if (d) {
        statsEl.classList.remove("hidden");
        statsEl.textContent = `Games played: ${d.gamesPlayed || 0} | Correct: ${d.correctAnswers || 0}`;
      }
    });
  } catch {}

  initUIBindings();
  fetchQuestion();
});
