(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  function cloneEntries(entries) {
    return entries.map((item) => ({ ...item }));
  }

  function spawnEnemyFromEntry(state, entry) {
    const waveSpec = state.currentWaveSpec;
    const mapDef = App.map.getMap(state.level);
    const enemy = new App.Enemy(entry.type, waveSpec);
    enemy.setPosition(mapDef.spawn.x, mapDef.spawn.y);
    state.enemies.push(enemy);
    state.spawnedInWave += 1;

    if (entry.isBoss || enemy.isBoss) {
      state.boss.activeId = enemy.id;
      state.boss.warningTimer = 3.5;
      state.boss.healthBarVisible = true;
      state.bus.emit(config.eventNames.BOSS_SPAWN, { enemyId: enemy.id });
    }
  }

  function prepareNextWave(state) {
    if (state.wave >= config.wave.maxWavePerLevel) {
      return false;
    }

    const nextWave = state.wave + 1;
    state.wave = nextWave;
    state.globalWave = (state.level - 1) * config.wave.maxWavePerLevel + state.wave;

    const spec = App.wavesData.buildWave(state.level, state.wave);
    state.currentWaveSpec = spec;
    state.wavePhase = "prep";
    state.prepTimer = config.wave.prepDuration;
    state.spawnQueue = cloneEntries(spec.entries);
    state.spawnTimer = 0;
    state.spawnedInWave = 0;

    return true;
  }

  function startWaveNow(state) {
    if (state.wavePhase !== "prep") {
      return;
    }
    state.wavePhase = "combat";
    state.spawnTimer = 0.08;
    state.bus.emit(config.eventNames.WAVE_START, {
      level: state.level,
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

  function markLevelResult(state, resultState, reason) {
    state.mode = "result";
    state.result.state = resultState;
    state.result.reason = reason;
    state.wavePhase = "ended";
  }

  function resolveWaveCompleted(state) {
    state.stats.wavesCleared += 1;
    state.bus.emit(config.eventNames.WAVE_CLEARED, {
      level: state.level,
      wave: state.wave,
    });

    if (state.wave < config.wave.maxWavePerLevel) {
      prepareNextWave(state);
      return;
    }

    state.levelCompletedFlags[state.level] = true;

    if (state.level >= 3) {
      markLevelResult(state, "victory", "Bạn đã hoàn thành chiến dịch 1954-1965.");
      state.bus.emit(config.eventNames.VICTORY, { level: state.level });
      return;
    }

    markLevelResult(state, "levelClear", `Bạn đã vượt qua màn ${state.level}.`);
    state.bus.emit(config.eventNames.VICTORY, { level: state.level });
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

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.spawnQueue.length > 0) {
      const entry = state.spawnQueue.shift();
      spawnEnemyFromEntry(state, entry);
      state.spawnTimer = entry.delay || config.wave.spawnInterval;
    }

    const aliveEnemies = state.enemies.some((e) => e.isAlive());
    if (state.spawnQueue.length === 0 && !aliveEnemies) {
      resolveWaveCompleted(state);
    }
  }

  App.waveSystem = {
    prepareNextWave,
    startWaveNow,
    callEarlyStart,
    updateWave,
  };
})();
