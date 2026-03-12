(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  function spawnEnemyByType(state, enemyType) {
    const waveSpec = state.currentWaveSpec;
    const mapDef = App.map.getMap(state.level);

    const enemy = new App.Enemy(enemyType, waveSpec);
    enemy.setPosition(mapDef.spawn.x, mapDef.spawn.y);
    state.enemies.push(enemy);
    if (!enemy.isBoss) {
      state.spawnedInWave += 1;
    }

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
    state.waveTimer = 0;
    state.bossSpawnedInWave = false;
    state.bossKilledInWave = false;
    if (state.base) {
      state.base.healUsedThisWave = false;
    }

    state.spawnQueue = [];

    return true;
  }

  function startWaveNow(state) {
    if (state.wavePhase !== "prep") {
      return;
    }

    state.wavePhase = "combat";
    const firstSpawnDelay = state.currentWaveSpec
      ? Math.max(0.2, state.currentWaveSpec.spawnInterval * 0.75)
      : 0.35;
    state.spawnTimer = firstSpawnDelay;
    state.waveTimer = 0;

    state.bus.emit(config.eventNames.WAVE_START, {
      wave: state.wave,
      globalWave: state.globalWave,
    });
  }

  function callEarlyStart(state) {
    if (state.wavePhase !== "prep" || !state.currentWaveSpec) {
      return false;
    }

    startWaveNow(state);
    return true;
  }

  function clearBattlefieldForNextWave(state) {
    state.enemies = [];
    state.projectiles = [];
  }

  function resolveWaveCompleted(state) {
    state.stats.wavesCleared += 1;
    state.commandPoints += state.wave;

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

    state.waveTimer += dt;

    const canSpawnNormal =
      !state.bossSpawnedInWave &&
      state.waveTimer <= spec.durationSec &&
      state.spawnedInWave < spec.enemyCount;

    if (canSpawnNormal) {
      state.spawnTimer -= dt;
      while (state.spawnTimer <= 0 && state.spawnedInWave < spec.enemyCount) {
        const type = spec.pickEnemyType(state.spawnedInWave);
        spawnEnemyByType(state, type);
        state.spawnTimer += spec.spawnInterval;
      }
    }

    const shouldSpawnBoss =
      !state.bossSpawnedInWave &&
      (state.spawnedInWave >= spec.enemyCount || state.waveTimer >= spec.bossSpawnAtSec);

    if (shouldSpawnBoss) {
      spawnEnemyByType(state, spec.bossType);
    }

    if (state.bossSpawnedInWave) {
      const bossAlive = state.enemies.some((enemy) => enemy.id === state.boss.activeId && enemy.isAlive());
      if (!bossAlive) {
        state.bossKilledInWave = true;
        state.boss.activeId = null;
        state.boss.healthBarVisible = false;
        resolveWaveCompleted(state);
      }
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
