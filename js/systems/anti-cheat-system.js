(function () {
  const App = (window.App = window.App || {});

  const state = {
    locked: false,
    initialized: false,
    detectInterval: null,
    debugInterval: null,
  };

  function emitLockState(reason) {
    const names = App.uiEventNames || {};
    if (!App.state || !App.state.bus || !names.ANTI_CHEAT_LOCK || !names.ANTI_CHEAT_UNLOCK) {
      return;
    }
    if (state.locked) {
      App.state.bus.emit(names.ANTI_CHEAT_LOCK, { reason });
    } else {
      App.state.bus.emit(names.ANTI_CHEAT_UNLOCK, { reason });
    }
  }

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
    emitLockState(reason || "unknown");
  }

  function dismiss() {
    state.locked = false;
    if (App.state && App.state.mode === "playing") {
      App.state.paused = false;
    }
    emitLockState("dismiss");
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
      // eslint-disable-next-line no-debugger
      debugger;
      const spent = performance.now() - start;
      if (spent > 130) {
        lockGame("debugger");
      }
    }, 1800);
  }

  function init() {
    if (state.initialized) {
      return;
    }
    state.initialized = true;
    attachDetectors();
  }

  App.antiCheatSystem = {
    init,
    dismiss,
    lockGame,
    isLocked() {
      return state.locked;
    },
  };
})();
