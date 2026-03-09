(function () {
  const App = (window.App = window.App || {});

  const BASE_POOL = ["basicSoldier", "fastScout", "armoredInfantry", "sniperEnemy"];
  const MID_POOL = ["heavyGunner", "commander", "apcVehicle", "shieldBearer", "flameTrooper"];
  const LATE_POOL = ["tank", "rocketVehicle", "heavyGunner", "mortarTruck", "droneSwarm"];
  const ELITE_POOL = [
    "heavyGunner",
    "commander",
    "apcVehicle",
    "shieldBearer",
    "flameTrooper",
    "tank",
    "rocketVehicle",
    "mortarTruck",
    "droneSwarm",
  ];
  const BOSS_POOL = ["supremeBoss", "ironBehemothBoss", "shadowPhantomBoss"];

  function pseudoRandom(seed) {
    const x = Math.sin(seed * 712.17) * 10000;
    return x - Math.floor(x);
  }

  function pickFromPool(pool, seed) {
    const idx = Math.floor(pseudoRandom(seed) * pool.length);
    return pool[Math.max(0, Math.min(pool.length - 1, idx))];
  }

  function buildSpawnPool(wave) {
    const pool = [...BASE_POOL];

    if (wave >= 3) {
      pool.push(...MID_POOL);
    }
    if (wave >= 6) {
      pool.push(...LATE_POOL);
    }
    if (wave >= 10) {
      pool.push("tank", "rocketVehicle", "commander", "flameTrooper", "mortarTruck");
    }

    return pool;
  }

  function pickEnemyType(spawnPool, wave, spawnIndex) {
    const seed = wave * 191 + spawnIndex * 37;
    let picked = pickFromPool(spawnPool, seed);
    const elitePool = spawnPool.filter((type) => ELITE_POOL.includes(type));
    const eliteChance = Math.min(0.25 + (wave - 1) * 0.09, 0.92);

    if (elitePool.length > 0 && pseudoRandom(seed + 911) < eliteChance) {
      picked = pickFromPool(elitePool, seed + 97);
    }

    if (wave >= 4 && spawnIndex % 7 === 0) {
      picked = "sniperEnemy";
    }
    if (wave >= 6 && spawnIndex % 5 === 0) {
      picked = "heavyGunner";
    }
    if (wave >= 8 && spawnIndex % 4 === 0) {
      picked = "apcVehicle";
    }
    if (wave >= 10 && spawnIndex % 3 === 0) {
      picked = "tank";
    }
    if (wave >= 9 && spawnIndex % 6 === 0) {
      picked = "droneSwarm";
    }
    if (wave >= 12 && spawnIndex % 5 === 0) {
      picked = "mortarTruck";
    }
    if (wave >= 12 && elitePool.length > 0 && spawnIndex % 2 === 0) {
      picked = pickFromPool(elitePool, seed + 2041);
    }

    return picked;
  }

  function buildWave(wave) {
    const config = App.config;
    const globalWave = wave;
    const durationSec = config.wave.durationSec;
    const tier = Math.floor((wave - 1) / 3);

    const spawnPool = buildSpawnPool(wave);
    const spawnInterval = Math.max(0.12, config.wave.baseSpawnInterval - wave * 0.015);
    const estimatedSpawnCount = Math.floor(durationSec / spawnInterval);
    const bossType = BOSS_POOL[(wave - 1) % BOSS_POOL.length];

    const bonusByWave = Math.floor(estimatedSpawnCount * 0.2) + wave * config.scaling.spawnGrowthPerWave;
    const enemyCount = estimatedSpawnCount + bonusByWave;

    return {
      wave,
      globalWave,
      enemyCount,
      tier,
      durationSec,
      spawnInterval,
      spawnPool,
      bossType,
      bossSpawnAtSec: 18,
      earlyReward: config.wave.earlyStartRewardBase + wave * 12,
      pickEnemyType(spawnIndex) {
        return pickEnemyType(spawnPool, wave, spawnIndex);
      },
    };
  }

  App.wavesData = {
    buildWave,
  };
})();
