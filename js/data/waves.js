(function () {
    const App = (window.App = window.App || {});

    const BASIC_POOL = ["basicSoldier", "fastScout", "armoredInfantry"];
    const MEDIUM_POOL_EARLY = ["sniperEnemy", "shieldBearer", "heavyGunner"];
    const MEDIUM_POOL_FULL = [
        "sniperEnemy",
        "shieldBearer",
        "heavyGunner",
        "commander",
        "apcVehicle",
        "flameTrooper",
    ];
    const HIGH_POOL_EARLY = ["tank", "rocketVehicle"];
    const HIGH_POOL_FULL = ["tank", "rocketVehicle", "mortarTruck", "droneSwarm"];
    const BOSS_POOL = ["supremeBoss", "ironBehemothBoss", "shadowPhantomBoss"];
    const FIXED_WAVE_PLANS = {
        1: { total: 30, basic: 30, medium: 0, high: 0 },
        2: { total: 40, basic: 25, medium: 15, high: 0 },
        3: { total: 50, basic: 25, medium: 25, high: 0 },
        4: { total: 58, basic: 19, medium: 19, high: 20 },
        5: { total: 64, basic: 21, medium: 21, high: 22 },
        6: { total: 70, basic: 23, medium: 23, high: 24 },
        7: { total: 76, basic: 25, medium: 25, high: 26 },
    };

    function pseudoRandom(seed) {
        const x = Math.sin(seed * 712.17) * 10000;
        return x - Math.floor(x);
    }

    function pickFromPool(pool, seed) {
        const idx = Math.floor(pseudoRandom(seed) * pool.length);
        return pool[Math.max(0, Math.min(pool.length - 1, idx))];
    }

    function getWaveComposition(wave) {
        if (FIXED_WAVE_PLANS[wave]) {
            return { ...FIXED_WAVE_PLANS[wave] };
        }

        const baseTotal = FIXED_WAVE_PLANS[7].total;
        const extraWave = Math.max(0, wave - 7);
        const total = baseTotal + extraWave * 8;
        const highRatio = Math.min(0.42, 0.34 + extraWave * 0.015);
        const mediumRatio = 0.34;

        const high = Math.round(total * highRatio);
        const medium = Math.round(total * mediumRatio);
        const basic = Math.max(0, total - high - medium);

        return { total, basic, medium, high };
    }

    function getCategoryPool(category, wave) {
        if (category === "basic") {
            return BASIC_POOL;
        }
        if (category === "medium") {
            return wave >= 4 ? MEDIUM_POOL_FULL : MEDIUM_POOL_EARLY;
        }
        return wave >= 6 ? HIGH_POOL_FULL : HIGH_POOL_EARLY;
    }

    function buildCategoryList(composition) {
        const list = [];
        for (let i = 0; i < composition.basic; i += 1) {
            list.push("basic");
        }
        for (let i = 0; i < composition.medium; i += 1) {
            list.push("medium");
        }
        for (let i = 0; i < composition.high; i += 1) {
            list.push("high");
        }
        return list;
    }

    function shuffleWithSeed(list, seed) {
        const out = list.slice();
        for (let i = out.length - 1; i > 0; i -= 1) {
            const j = Math.floor(pseudoRandom(seed + i * 19.7) * (i + 1));
            const tmp = out[i];
            out[i] = out[j];
            out[j] = tmp;
        }
        return out;
    }

    function buildSpawnPlan(wave, composition) {
        const categories = shuffleWithSeed(
            buildCategoryList(composition),
            wave * 131.3,
        );
        return categories.map((category, index) => {
            const pool = getCategoryPool(category, wave);
            return pickFromPool(pool, wave * 911 + index * 37.3);
        });
    }

    function buildWave(wave) {
        const config = App.config;
        const globalWave = wave;
        const durationSec = config.wave.durationSec;
        const tier = Math.floor((wave - 1) / 3);
        const composition = getWaveComposition(wave);
        const enemyCount = composition.total;
        const spawnPlan = buildSpawnPlan(wave, composition);
        const normalSpawnWindowSec = 24;

        const spawnInterval = Math.max(
            0.24,
            normalSpawnWindowSec / Math.max(1, enemyCount),
        );
        const bossType = BOSS_POOL[(wave - 1) % BOSS_POOL.length];

        return {
            wave,
            globalWave,
            enemyCount,
            tier,
            durationSec,
            spawnInterval,
            spawnPlan,
            composition,
            bossType,
            bossSpawnAtSec: 24,
            earlyReward: config.wave.earlyStartRewardBase + wave * 12,
            pickEnemyType(spawnIndex) {
                if (spawnIndex < spawnPlan.length) {
                    return spawnPlan[spawnIndex];
                }
                return spawnPlan[spawnPlan.length - 1] || "basicSoldier";
            },
        };
    }

    App.wavesData = {
        buildWave,
    };
})();