(function () {
  const App = (window.App = window.App || {});

  function boot() {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game-root",
      width: App.view?.width || 1320,
      height: App.view?.height || 760,
      backgroundColor: "#081019",
      scene: [App.BootScene, App.MenuScene, App.BattleScene, App.UIScene, App.ModalScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });

    App.phaserGame = game;

    if (App.antiCheatSystem && typeof App.antiCheatSystem.init === "function") {
      App.antiCheatSystem.init();
    }
  }

  window.addEventListener("load", boot);
})();
