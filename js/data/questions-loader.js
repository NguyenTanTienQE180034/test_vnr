(function () {
  const App = (window.App = window.App || {});

  function stripOptionPrefix(value) {
    return value.replace(/^\s*[A-Ha-h][.)\:-]\s*/, "").trim();
  }

  function parseCorrectIndex(item, answers) {
    if (Number.isInteger(item.correctIndex) && item.correctIndex >= 0 && item.correctIndex < answers.length) {
      return item.correctIndex;
    }

    const rawAnswer = item.answer ?? item.correctAnswer;

    if (Number.isInteger(rawAnswer) && rawAnswer >= 0 && rawAnswer < answers.length) {
      return rawAnswer;
    }

    if (typeof rawAnswer !== "string") {
      return -1;
    }

    const answerToken = rawAnswer.trim();
    if (/^[A-Za-z]$/.test(answerToken)) {
      const alphaIndex = answerToken.toUpperCase().charCodeAt(0) - 65;
      if (alphaIndex >= 0 && alphaIndex < answers.length) {
        return alphaIndex;
      }
    }

    const normalizedToken = stripOptionPrefix(answerToken).toLowerCase();
    return answers.findIndex((choice) => choice.toLowerCase() === normalizedToken);
  }

  function normalizeQuestion(item) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const question = typeof item.question === "string" ? item.question.trim() : "";
    const rawAnswers = Array.isArray(item.answers) ? item.answers : Array.isArray(item.options) ? item.options : [];
    const answers = rawAnswers
      .map((choice) => stripOptionPrefix(typeof choice === "string" ? choice : String(choice)))
      .filter(Boolean);

    const correctIndex = parseCorrectIndex(item, answers);

    if (!question || answers.length < 2 || correctIndex < 0 || correctIndex >= answers.length) {
      return null;
    }

    return {
      question,
      answers,
      correctIndex,
      explanation: typeof item.explanation === "string" ? item.explanation.trim() : "",
    };
  }

  async function loadQuestionsData() {
    try {
      const response = await fetch("questions.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!Array.isArray(json)) {
        throw new Error("questions.json is not an array");
      }

      const normalized = json.map(normalizeQuestion).filter(Boolean);
      if (!normalized.length) {
        throw new Error("No valid quiz entries in questions.json");
      }

      App.questionsData = normalized;
      console.info(`[Quiz] Loaded ${normalized.length} questions from questions.json`);
      return true;
    } catch (error) {
      console.warn("[Quiz] Failed to load questions.json, fallback to bundled questions.", error);
      return false;
    }
  }

  App.loadQuestionsData = loadQuestionsData;
})();
