(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  function spawnEnemyByType(state, enemyType) {
    const waveSpec = state.currentWaveSpec;
    const mapDef = App.map.getMap(state.level);

    const enemy = new App.Enemy(enemyType, waveSpec);
    enemy.setPosition(mapDef.spawn.x, mapDef.spawn.y);
    state.enemies.push(enemy);
    state.spawnedInWave += 1;

    if (enemy.isBoss) {
      state.boss.activeId = enemy.id;
      state.boss.warningTimer = 3.5;
      state.boss.healthBarVisible = true;
      state.bossSpawnedInWave = true;
      state.bossKilledInWave = false;
      state.bus.emit(config.eventNames.BOSS_SPAWN, { enemyId: enemy.id, wave: state.wave });
    }
  }

  function prepareNextWave(state) {
    const nextWave = state.wave + 1;
    state.wave = nextWave;
    state.globalWave = nextWave;

    const spec = App.wavesData.buildWave(nextWave);

    state.currentWaveSpec = spec;
    state.wavePhase = "prep";
    state.prepTimer = config.wave.prepDuration;
    state.spawnTimer = 0;
    state.spawnedInWave = 0;
    state.waveTimer = spec.durationSec;
    state.bossSpawnedInWave = false;
    state.bossKilledInWave = false;
    if (state.base) {
      state.base.healUsedThisWave = false;
    }

    state.spawnQueue = new Array(spec.enemyCount).fill(0);

    return true;
  }

  function startWaveNow(state) {
    if (state.wavePhase !== "prep") {
      return;
    }

    state.wavePhase = "combat";
    state.spawnTimer = 0.06;

    state.bus.emit(config.eventNames.WAVE_START, {
      wave: state.wave,
      globalWave: state.globalWave,
    });
  }

  function callEarlyStart(state) {
    if (state.wavePhase !== "prep" || !state.currentWaveSpec) {
      return false;
    }

    state.supplies += state.currentWaveSpec.earlyReward;
    App.Effects.addFloatingText(state, 20, 40, `+${state.currentWaveSpec.earlyReward} early bonus`, "#8cffb8");
    startWaveNow(state);
    return true;
  }

  function clearBattlefieldForNextWave(state) {
    state.enemies = [];
    state.projectiles = [];
  }

  function resolveWaveCompleted(state) {
    state.stats.wavesCleared += 1;
    state.supplies += 40 + state.wave * 10;
    state.commandPoints += 1;

    state.bus.emit(config.eventNames.WAVE_CLEARED, {
      wave: state.wave,
    });

    clearBattlefieldForNextWave(state);
    prepareNextWave(state);
  }

  function updateCombatWave(state, dt) {
    const spec = state.currentWaveSpec;
    if (!spec) {
      return;
    }

    const elapsed = spec.durationSec - state.waveTimer;

    state.waveTimer = Math.max(0, state.waveTimer - dt);

    state.spawnTimer -= dt;
    while (state.spawnTimer <= 0 && state.waveTimer > 0) {
      const type = spec.pickEnemyType(state.spawnedInWave);
      spawnEnemyByType(state, type);
      if (state.spawnQueue.length > 0) {
        state.spawnQueue.pop();
      }
      state.spawnTimer += spec.spawnInterval;
    }

    if (!state.bossSpawnedInWave && elapsed >= spec.bossSpawnAtSec) {
      spawnEnemyByType(state, spec.bossType);
    }

    if (state.waveTimer <= 0 && !state.bossSpawnedInWave) {
      spawnEnemyByType(state, spec.bossType);
    }

    if (state.bossSpawnedInWave) {
      const bossAlive = state.enemies.some((enemy) => enemy.id === state.boss.activeId && enemy.isAlive());
      if (!bossAlive) {
        state.bossKilledInWave = true;
        state.boss.activeId = null;
        state.boss.healthBarVisible = false;
      }
    }

    if (state.waveTimer <= 0 && state.bossKilledInWave) {
      resolveWaveCompleted(state);
    }
  }

  function updateWave(state, dt) {
    if (state.wavePhase === "prep") {
      state.prepTimer -= dt;
      if (state.prepTimer <= 0) {
        startWaveNow(state);
      }
      return;
    }

    if (state.wavePhase !== "combat") {
      return;
    }

    updateCombatWave(state, dt);
  }

  App.waveSystem = {
    prepareNextWave,
    startWaveNow,
    callEarlyStart,
    updateWave,
  };
})();
