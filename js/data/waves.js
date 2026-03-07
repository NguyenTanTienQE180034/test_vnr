(function () {
  const App = (window.App = window.App || {});

  const LEVEL_POOLS = {
    1: ["basicSoldier", "fastScout", "armoredInfantry", "sniperEnemy"],
    2: ["basicSoldier", "fastScout", "armoredInfantry", "sniperEnemy", "heavyGunner", "commander", "apcVehicle"],
    3: ["fastScout", "armoredInfantry", "sniperEnemy", "heavyGunner", "commander", "apcVehicle", "tank", "rocketVehicle"],
  };

  function pseudoRandom(seed) {
    const x = Math.sin(seed * 712.17) * 10000;
    return x - Math.floor(x);
  }

  function pickFromPool(pool, seed) {
    const idx = Math.floor(pseudoRandom(seed) * pool.length);
    return pool[Math.max(0, Math.min(pool.length - 1, idx))];
  }

  function buildWave(level, wave) {
    const config = App.config;
    const globalWave = (level - 1) * config.wave.maxWavePerLevel + wave;

    const baseCount = 7 + level * 2;
    // Keep both formulas from docs, then choose stricter spawn count.
    const countByClassic = baseCount + wave * 3;
    const countByScalingRule = baseCount + wave * config.scaling.spawnGrowthPerWave;
    const enemyCount = Math.max(countByClassic, countByScalingRule);
    const tier = Math.floor(globalWave / 5);

    const pool = LEVEL_POOLS[level] || LEVEL_POOLS[1];
    const entries = [];

    for (let i = 0; i < enemyCount; i += 1) {
      const seed = globalWave * 97 + i * 13 + level * 41;
      let picked = pickFromPool(pool, seed);

      if (tier >= 2 && i % 6 === 0) {
        picked = "sniperEnemy";
      }
      if (tier >= 3 && i % 7 === 0) {
        picked = "heavyGunner";
      }
      if (level >= 2 && wave >= 4 && i % 9 === 0) {
        picked = "commander";
      }
      if (level >= 2 && wave >= 6 && i % 8 === 0) {
        picked = "apcVehicle";
      }
      if (level >= 3 && wave >= 7 && i % 5 === 0) {
        picked = "tank";
      }
      if (level >= 3 && wave >= 8 && i % 4 === 0) {
        picked = "rocketVehicle";
      }

      entries.push({
        type: picked,
        delay: 0.48 + (i % 3) * 0.12,
      });
    }

    let special = null;
    if (wave % 10 === 0) {
      special = {
        type: "supremeBoss",
        isBoss: true,
        delay: 1.5,
      };
    } else if (wave % 5 === 0) {
      special = {
        type: "miniBoss",
        isMiniBoss: true,
        delay: 1.2,
      };
    }

    if (special) {
      entries.push(special);
    }

    return {
      level,
      wave,
      globalWave,
      enemyCount,
      tier,
      entries,
      earlyReward: config.wave.earlyStartRewardBase + wave * 8 + level * 10,
      hasBoss: Boolean(special && special.isBoss),
      hasMiniBoss: Boolean(special && special.isMiniBoss),
    };
  }

  App.wavesData = {
    buildWave,
  };
})();
