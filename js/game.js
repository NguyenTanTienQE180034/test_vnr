(function () {
    const App = (window.App = window.App || {});
    const config = App.config;

    const runtime = {
        resultShownState: null,
    };

    function startEndless() {
        App.resetStateForRun();
        const state = App.state;
        const mapDef = App.map.getMap(1);

        state.base = new App.Base(
            mapDef.base.x,
            mapDef.base.y,
            mapDef.base.radius,
            config.base.maxHp,
            config.base.armor,
        );
        state.availableSlots = mapDef.towerSlots.slice();

        App.waveSystem.prepareNextWave(state);
        App.quizSystem.closeQuiz();
        runtime.resultShownState = null;
    }

    function tick(dt) {
        const state = App.state;
        const antiLocked =
            App.antiCheatSystem && App.antiCheatSystem.isLocked();

        if (state.mode === "playing") {
            if (!state.paused && !antiLocked) {
                state.stats.playSeconds += dt;

                App.waveSystem.updateWave(state, dt);
                App.quizSystem.update(state, dt);
                App.skillSystem.update(state, dt);
                App.combatSystem.update(state, dt);
                App.Effects.update(state, dt);

                state.boss.warningTimer = Math.max(
                    0,
                    state.boss.warningTimer - dt,
                );
                state.boss.shakeTimer = Math.max(0, state.boss.shakeTimer - dt);

                if (state.base.hp <= 0) {
                    state.mode = "result";
                    state.result.state = "gameOver";
                    state.result.reason = "Căn cứ bị phá huỷ.";
                    state.wavePhase = "ended";
                    state.bus.emit(config.eventNames.GAME_OVER, {});
                }

                if (state.boss.activeId) {
                    const boss = state.enemies.find(
                        (enemy) => enemy.id === state.boss.activeId,
                    );
                    if (!boss || boss.hp <= 0) {
                        state.boss.activeId = null;
                        state.boss.healthBarVisible = false;
                    }
                }
            }
        }
    }

    function shouldNotifyResult() {
        const state = App.state;
        if (state.mode !== "result") {
            return false;
        }
        if (runtime.resultShownState === state.result.state) {
            return false;
        }
        runtime.resultShownState = state.result.state;
        return true;
    }

    function clearResultNotify() {
        runtime.resultShownState = null;
    }

    App.game = {
        startEndless,
        tick,
        shouldNotifyResult,
        clearResultNotify,
    };
})();
