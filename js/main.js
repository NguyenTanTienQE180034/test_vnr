(function () {
  const App = (window.App = window.App || {});

  const dom = {};

  function cacheDom() {
    dom.mainMenu = document.getElementById("main-menu");
    dom.gameScreen = document.getElementById("game-screen");
    dom.guideScreen = document.getElementById("guide-screen");
    dom.levelScreen = document.getElementById("level-screen");
    dom.resultModal = document.getElementById("result-modal");

    dom.btnPlay = document.getElementById("btn-play");
    dom.btnQuick = document.getElementById("btn-quick");
    dom.btnGuide = document.getElementById("btn-guide");
    dom.btnCloseGuide = document.getElementById("btn-close-guide");
    dom.btnLevelSelect = document.getElementById("btn-level-select");
    dom.btnCloseLevel = document.getElementById("btn-close-level");

    dom.levelButtons = [...document.querySelectorAll(".level-btn")];

    dom.btnRestart = document.getElementById("btn-restart");
    dom.btnBackMenu = document.getElementById("btn-back-menu");
    dom.btnNextLevel = document.getElementById("btn-next-level");
  }

  function showMainMenu() {
    dom.mainMenu.classList.add("screen--active");
    dom.mainMenu.classList.remove("hidden");
    dom.gameScreen.classList.add("hidden");
    dom.levelScreen.classList.add("hidden");
    dom.guideScreen.classList.add("hidden");
    dom.resultModal.classList.add("hidden");

    App.quizSystem.closeQuiz();
    App.state.mode = "menu";
  }

  function showGameScreen() {
    dom.mainMenu.classList.remove("screen--active");
    dom.mainMenu.classList.add("hidden");
    dom.gameScreen.classList.remove("hidden");
    dom.levelScreen.classList.add("hidden");
    dom.guideScreen.classList.add("hidden");
  }

  function startLevel(level) {
    showGameScreen();
    App.game.startLevel(level);
  }

  function bindMenuActions() {
    dom.btnPlay.addEventListener("click", () => startLevel(1));
    dom.btnQuick.addEventListener("click", () => startLevel(1));

    dom.btnGuide.addEventListener("click", () => {
      dom.guideScreen.classList.remove("hidden");
    });

    dom.btnCloseGuide.addEventListener("click", () => {
      dom.guideScreen.classList.add("hidden");
    });

    dom.btnLevelSelect.addEventListener("click", () => {
      dom.levelScreen.classList.remove("hidden");
    });

    dom.btnCloseLevel.addEventListener("click", () => {
      dom.levelScreen.classList.add("hidden");
    });

    dom.levelButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const level = Number(btn.dataset.level || "1");
        startLevel(level);
      });
    });

    dom.btnRestart.addEventListener("click", () => {
      startLevel(App.state.level || 1);
    });

    dom.btnBackMenu.addEventListener("click", () => {
      showMainMenu();
    });

    dom.btnNextLevel.addEventListener("click", () => {
      const next = Math.min(3, (App.state.level || 1) + 1);
      startLevel(next);
    });
  }

  function boot() {
    cacheDom();
    bindMenuActions();
    App.game.init();
    showMainMenu();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
