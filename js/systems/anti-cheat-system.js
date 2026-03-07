(function () {
  const App = (window.App = window.App || {});

  const state = {
    locked: false,
    detectInterval: null,
    debugInterval: null,
    overlayEl: null,
    closeBtn: null,
  };

  function blockHotkeys(event) {
    const key = String(event.key || "").toUpperCase();
    const blockedCombo =
      key === "F12" ||
      (event.ctrlKey && event.shiftKey && ["I", "J", "C", "K"].includes(key)) ||
      (event.ctrlKey && key === "U");

    if (!blockedCombo) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    lockGame("hotkey");
  }

  function detectDevtoolsBySize() {
    const widthGap = window.outerWidth - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    return widthGap > 160 || heightGap > 160;
  }

  function lockGame(reason) {
    if (state.locked) {
      return;
    }

    state.locked = true;

    if (App.state) {
      App.state.paused = true;
    }

    if (state.overlayEl) {
      state.overlayEl.classList.remove("hidden");
      state.overlayEl.dataset.reason = reason;
    }
  }

  function dismissOverlay() {
    if (state.overlayEl) {
      state.overlayEl.classList.add("hidden");
    }
    state.locked = false;
    if (App.state && App.state.mode === "playing") {
      App.state.paused = false;
    }
  }

  function attachDetectors() {
    document.addEventListener("keydown", blockHotkeys, true);

    document.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
        lockGame("contextmenu");
      },
      true
    );

    state.detectInterval = window.setInterval(() => {
      if (detectDevtoolsBySize()) {
        lockGame("viewport");
      }
    }, 800);

    state.debugInterval = window.setInterval(() => {
      const start = performance.now();
      // Intentional debugger trap to detect opened devtools.
      // eslint-disable-next-line no-debugger
      debugger;
      const spent = performance.now() - start;
      if (spent > 130) {
        lockGame("debugger");
      }
    }, 1800);
  }

  function init() {
    state.overlayEl = document.getElementById("anti-cheat-overlay");
    state.closeBtn = document.getElementById("btn-close-anti-cheat");

    if (state.closeBtn) {
      state.closeBtn.addEventListener("click", () => {
        dismissOverlay();
      });
    }

    attachDetectors();
  }

  document.addEventListener("DOMContentLoaded", init);

  App.antiCheatSystem = {
    isLocked() {
      return state.locked;
    },
  };
})();
