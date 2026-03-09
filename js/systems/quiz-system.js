(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  const quizUi = {
    modal: null,
    question: null,
    answers: null,
    feedback: null,
    close: null,
  };

  const runtime = {
    activeQuestionIndex: null,
    answered: false,
  };

  function init(dom) {
    quizUi.modal = dom.modal;
    quizUi.question = dom.question;
    quizUi.answers = dom.answers;
    quizUi.feedback = dom.feedback;
    quizUi.close = dom.close;

    quizUi.close.addEventListener("click", closeQuiz);
  }

  function randomQuestionIndex(state) {
    const total = Array.isArray(App.questionsData) ? App.questionsData.length : 0;
    if (total === 0) {
      return null;
    }

    if (state.quizUsedIndexes.length >= total) {
      state.quizUsedIndexes = [];
    }

    const available = [];
    for (let i = 0; i < total; i += 1) {
      if (!state.quizUsedIndexes.includes(i)) {
        available.push(i);
      }
    }

    const picked = available[Math.floor(Math.random() * available.length)];
    return picked;
  }

  function openQuiz(state) {
    if (state.mode !== "playing") {
      return false;
    }

    if (state.quizCooldown > 0) {
      return false;
    }

    if (!Array.isArray(App.questionsData) || App.questionsData.length === 0) {
      return false;
    }

    runtime.activeQuestionIndex = randomQuestionIndex(state);
    if (runtime.activeQuestionIndex === null) {
      return false;
    }
    runtime.answered = false;

    const q = App.questionsData[runtime.activeQuestionIndex];
    quizUi.question.textContent = q.question;
    quizUi.answers.innerHTML = "";
    quizUi.feedback.textContent = "";
    quizUi.close.classList.add("hidden");

    q.answers.forEach((answer, idx) => {
      const btn = document.createElement("button");
      btn.className = "btn quiz-answer";
      btn.textContent = `${String.fromCharCode(65 + idx)}. ${answer}`;
      btn.addEventListener("click", () => answerQuiz(state, idx));
      quizUi.answers.appendChild(btn);
    });

    quizUi.modal.classList.remove("hidden");
    return true;
  }

  function answerQuiz(state, selectedIndex) {
    if (runtime.answered) {
      return;
    }

    runtime.answered = true;
    const q = App.questionsData[runtime.activeQuestionIndex];
    const correct = selectedIndex === q.correctIndex;

    state.quizUsedIndexes.push(runtime.activeQuestionIndex);

    const answerButtons = [...quizUi.answers.querySelectorAll("button")];
    answerButtons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.correctIndex) {
        btn.classList.add("btn-glow");
      }
      if (idx === selectedIndex && selectedIndex !== q.correctIndex) {
        btn.classList.add("btn-danger");
      }
    });

    if (correct) {
      const reward = config.quiz.rewardBase + state.wave * config.quiz.rewardPerWave;
      const cpGain = Math.random() < 0.4 ? 2 : 1;
      state.supplies += reward;
      state.commandPoints += cpGain;
      state.stats.correctAnswers += 1;
      quizUi.feedback.innerHTML = `<div class="feedback-good">Đúng! +${reward} Supplies, +${cpGain} CP</div><small>${q.explanation}</small>`;
      App.Effects.addFloatingText(state, 32, 70, `+${reward} Supplies`, "#8cffb8");
      state.bus.emit(config.eventNames.QUIZ_ANSWERED, { correct: true, reward });
    } else {
      state.stats.wrongAnswers += 1;
      state.quizCooldown = config.quiz.wrongCooldown;
      quizUi.feedback.innerHTML = `<div class="feedback-bad">Sai! Không nhận thưởng. Cooldown quiz ${config.quiz.wrongCooldown}s.</div><small>${q.explanation}</small>`;
      state.bus.emit(config.eventNames.QUIZ_ANSWERED, { correct: false, reward: 0 });
    }

    quizUi.close.classList.remove("hidden");
  }

  function closeQuiz() {
    if (!quizUi.modal) {
      return;
    }
    quizUi.modal.classList.add("hidden");
  }

  function update(state, dt) {
    state.quizCooldown = Math.max(0, state.quizCooldown - dt);
  }

  App.quizSystem = {
    init,
    openQuiz,
    closeQuiz,
    update,
  };
})();
