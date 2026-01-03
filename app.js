const container = document.getElementById("quiz-container");
const titleEl = document.getElementById("quiz-title");
const metaEl = document.getElementById("quiz-meta");
const progressEl = document.getElementById("progress");

let data;
let state = {
  screen: "home",
  history: [],
  year: null,
  semester: null,
  course: null,
  department: null,
  quiz: null,
  index: 0,
  score: 0,

  // ⏱ TIMER
  timePerQuestion: 30,
  timeLeft: 0,
  timerId: null
};

fetch("quizzes.json")
  .then(res => res.json())
  .then(json => {
    data = json;

    const saved = JSON.parse(localStorage.getItem("quiz-progress"));
    if (saved) {
      const quiz = findQuizById(saved.quizId);
      if (quiz) {
        state.quiz = quiz;
        state.index = saved.index;
        state.score = saved.score;
        state.timePerQuestion = saved.timePerQuestion;
        state.screen = "quiz";
      }
    }

    render();
  });

/* ---------------- RENDER ---------------- */

function render() {
  container.innerHTML = "";
  progressEl.textContent = "";

  if (state.screen === "years") renderYears();
  if (state.screen === "semesters") renderSemesters();
  if (state.screen === "courses") renderCourses();
  if (state.screen === "departments") renderDepartments();
  if (state.screen === "quizzes") renderQuizzes();
  if (state.screen === "quiz") renderQuestion();
  if (state.screen === "summary") renderSummary();
  if (state.screen === "home") renderHome();
}

/* ---------------- NAV SCREENS ---------------- */
function renderHome() {
  titleEl.textContent = "Batch 29 Quizzes";
  metaEl.textContent = "Special thanks to the academic office and everybody who made or helped making the Quizzes";

  const card = document.createElement("div");
  card.className = "question-card home-card";
  card.innerHTML = `
    <h2>Welcome 👋</h2>
    <p>Offline-first, minimal quizzes engine, hope it will be useful</p>
    <div class="option primary">Start Quizzes →</div>
  `;

  card.querySelector(".option").onclick = () => {
    state.history = [];
    state.screen = "years";
    render();
  };

  container.appendChild(card);
  const installBtn = document.createElement("div");
installBtn.className = "option primary install-btn";
installBtn.textContent = "Install App ⬇️";
installBtn.style.display = "none";

card.appendChild(installBtn);
}
function renderYears() {
  titleEl.textContent = "Select Year";
  metaEl.textContent = "";

  data.years.forEach(y => {
    container.appendChild(card(y.title, () => {
      push(state.screen); // ✅ FIX
      state.year = y;
      state.screen = "semesters";
      render();
    }));
  });
}

function renderSemesters() {
  header(state.year.title);

  state.year.semesters.forEach(s => {
    container.appendChild(card(s.title, () => {
      push(state.screen);
      state.semester = s;
      state.screen = "courses";
      render();
    }));
  });

  back();
}

function renderCourses() {
  header(`${state.year.title} • ${state.semester.title}`);

  state.semester.courses.forEach(c => {
    container.appendChild(card(c.title, () => {
      push(state.screen);
      state.course = c;
      state.screen = "departments";
      render();
    }));
  });

  back();
}

function renderDepartments() {
  header(state.course.title);

  state.course.departments.forEach(d => {
    container.appendChild(card(d.title, () => {
      push(state.screen);
      state.department = d;
      state.screen = "quizzes";
      render();
    }));
  });

  back();
}

function renderQuizzes() {
  header(state.department.title);

  // ⏱ TIMER SETTINGS UI
  const timerCard = document.createElement("div");
  timerCard.className = "question-card";
  timerCard.innerHTML = `
    <label>
      Time per question:
      <select id="timer-select">
        <option value="0">No timer</option>
        <option value="15">15 sec</option>
        <option value="30" selected>30 sec</option>
        <option value="45">45 sec</option>
        <option value="60">60 sec</option>
      </select>
    </label>
  `;
  container.appendChild(timerCard);

  if (!state.department.quizzes.length) {
    container.appendChild(empty("No quizzes yet"));
    back();
    return;
  }

  state.department.quizzes.forEach(q => {
    container.appendChild(card(q.title, () => {
  const select = document.getElementById("timer-select");
  state.timePerQuestion = Number(select.value) || 0;

  push(state.screen);
  state.quiz = q;
  state.index = 0;
  state.score = 0;
  state.screen = "quiz";
  titleEl.textContent = q.title;
  metaEl.textContent = state.course.title;
  render();
}));
  });

  back();
}

/* ---------------- QUIZ ENGINE (UNCHANGED STYLE) ---------------- */

function renderQuestion() {
  if (!state.quiz || !state.quiz.questions?.length) {
    state.screen = "quizzes";
    render();
    return;
  }

  const q = state.quiz.questions[state.index];// 🔥 MISSING LINE
  clearInterval(state.timerId);
state.timeLeft = state.timePerQuestion;

updateTimerUI();
startTimer();

  container.innerHTML = `
    <div class="question-card">
      <div class="question-text">${q.text}</div>
      ${q.image ? `<img class="question-image" src="${q.image}">` : ""}
      <div class="options">
        ${q.options.map((o, i) =>
          `<div class="option" data-i="${i}">${o}</div>`
        ).join("")}
      </div>
    </div>
  `;

  document.querySelectorAll(".options .option").forEach(btn => {
    btn.onclick = () => answer(btn, q.correct);
  });
}

  function answer(btn, correct) {
  if (!btn.dataset.i) return; // safety

  const selected = Number(btn.dataset.i);
  const options = document.querySelectorAll(".options .option");

  options.forEach(o => o.classList.add("disabled"));

  if (selected === correct) {
    btn.classList.add("correct");
    state.score++;
  } else {
    btn.classList.add("wrong");
    options[correct].classList.add("correct");
  }

clearInterval(state.timerId);
saveProgress();
setTimeout(nextQuestion, 900);
}

function renderSummary() {
  titleEl.textContent = "Results";
  metaEl.textContent = state.quiz.title;

  const total = state.quiz.questions.length;
  const perfect = state.score === total;

  container.innerHTML = `
    <div class="question-card">
      <h2>Completed 🎉</h2>
      <p><strong>${state.score}</strong> / ${total}</p>
      ${perfect ? "<p>Flawless. Consultant energy 🧠✨</p>" : ""}
    </div>
  `;

  if (perfect) confettiBurst();

  back("Back to quizzes");
  localStorage.removeItem("quiz-progress");
}

/* ---------------- HELPERS ---------------- */
function findQuizById(id) {
  for (const y of data.years)
    for (const s of y.semesters)
      for (const c of s.courses)
        for (const d of c.departments)
          for (const q of d.quizzes)
            if (q.id === id) return q;
}
function saveProgress() {
  localStorage.setItem("quiz-progress", JSON.stringify({
    quizId: state.quiz.id,
    index: state.index,
    score: state.score,
    timePerQuestion: state.timePerQuestion
  }));
}
function card(text, fn) {
  const d = document.createElement("div");
  d.className = "option";
  d.textContent = text;
  d.onclick = fn;
  return d;
}

function header(text) {
  titleEl.textContent = text;
  metaEl.textContent = "";
}

function empty(text) {
  const d = document.createElement("div");
  d.className = "question-card";
  d.textContent = text;
  return d;
}

function push(from) {
  state.history.push(from);
}
function confettiBurst() {
  const colors = ["#22c55e", "#3b82f6", "#facc15", "#ec4899"];

  for (let i = 0; i < 35; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 0.4 + "s";
    document.body.appendChild(c);

    setTimeout(() => c.remove(), 2000);
  }
}
function startTimer() {
  if (!state.timePerQuestion) return;

  state.timerId = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();

    if (state.timeLeft <= 0) {
      clearInterval(state.timerId);
      autoFail();
    }
  }, 1000);
}

function updateTimerUI() {
  progressEl.textContent = state.timePerQuestion
    ? `Q ${state.index + 1}/${state.quiz.questions.length} • ⏱ ${state.timeLeft}s`
    : `Question ${state.index + 1} of ${state.quiz.questions.length}`;
}

function autoFail() {
  const options = document.querySelectorAll(".options .option");
  options.forEach(o => o.classList.add("disabled"));

  options[state.quiz.questions[state.index].correct]
    ?.classList.add("correct");
saveProgress();
  setTimeout(nextQuestion, 700);
}

function nextQuestion() {
  state.index++;
  if (state.index < state.quiz.questions.length) {
    render();
  } else {
    state.screen = "summary";
    render();
  }
}
function back(label = "Back") {
  if (!state.history.length) return;

  const b = document.createElement("div");
  b.className = "option";
  b.textContent = "← " + label;
  b.onclick = () => {
    state.screen = state.history.pop() || "home";
    render();
  };
  container.prepend(b);
}
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;

  const btn = document.querySelector(".install-btn");
  if (btn) btn.style.display = "block";
});

document.addEventListener("click", async e => {
  if (!e.target.matches(".install-btn")) return;
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}
