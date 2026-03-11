(function () {
    const App = (window.App = window.App || {});
    const config = App.config;

    const runtime = {
        activeQuestionIndex: null,
        answered: false,
    };

    function randomQuestionIndex(state) {
        const total = Array.isArray(App.questionsData)
            ? App.questionsData.length
            : 0;
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

        if (!available.length) {
            return null;
        }

        const picked = available[Math.floor(Math.random() * available.length)];
        return picked;
    }

    function openQuiz(state) {
        if (state.mode !== "playing") {
            return { ok: false, reason: "not-playing" };
        }

        if (state.quizCooldown > 0) {
            return {
                ok: false,
                reason: "cooldown",
                cooldown: state.quizCooldown,
            };
        }

        if (
            !Array.isArray(App.questionsData) ||
            App.questionsData.length === 0
        ) {
            return { ok: false, reason: "no-data" };
        }

        runtime.activeQuestionIndex = randomQuestionIndex(state);
        if (runtime.activeQuestionIndex === null) {
            return { ok: false, reason: "no-data" };
        }
        runtime.answered = false;

        const q = App.questionsData[runtime.activeQuestionIndex];
        return {
            ok: true,
            questionIndex: runtime.activeQuestionIndex,
            question: q.question,
            answers: q.answers.slice(),
        };
    }

    function answerQuiz(state, selectedIndex) {
        if (runtime.activeQuestionIndex === null) {
            return { ok: false, reason: "not-opened" };
        }

        if (runtime.answered) {
            return { ok: false, reason: "already-answered" };
        }

        runtime.answered = true;
        const q = App.questionsData[runtime.activeQuestionIndex];
        const correct = selectedIndex === q.correctIndex;
        const correctAnswerText = q.answers[q.correctIndex] || "";
        const correctAnswerLabel = `${String.fromCharCode(
            65 + q.correctIndex,
        )}. ${correctAnswerText}`;

        state.quizUsedIndexes.push(runtime.activeQuestionIndex);

        const payload = {
            ok: true,
            correct,
            selectedIndex,
            correctIndex: q.correctIndex,
            question: q.question,
            explanation: q.explanation,
            correctAnswerLabel,
            correctAnswerText,
            reward: 0,
            cpGain: 0,
        };

        if (correct) {
            const reward =
                config.quiz.rewardBase + state.wave * config.quiz.rewardPerWave;
            state.supplies += reward;
            state.stats.correctAnswers += 1;
            payload.reward = reward;
            payload.cpGain = 0;
            App.Effects.addFloatingText(
                state,
                32,
                70,
                `+${reward} Tiếp tế`,
                "#8cffb8",
            );
            state.bus.emit(config.eventNames.QUIZ_ANSWERED, {
                correct: true,
                reward,
            });
        } else {
            state.stats.wrongAnswers += 1;
            state.quizCooldown = config.quiz.wrongCooldown;
            state.bus.emit(config.eventNames.QUIZ_ANSWERED, {
                correct: false,
                reward: 0,
            });
        }

        return payload;
    }

    function closeQuiz() {
        runtime.activeQuestionIndex = null;
        runtime.answered = false;
    }

    function getRuntimeState() {
        return {
            activeQuestionIndex: runtime.activeQuestionIndex,
            answered: runtime.answered,
        };
    }

    function update(state, dt) {
        state.quizCooldown = Math.max(0, state.quizCooldown - dt);
    }

    App.quizSystem = {
        openQuiz,
        answerQuiz,
        closeQuiz,
        getRuntimeState,
        update,
    };
})();
