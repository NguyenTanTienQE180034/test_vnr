(function () {
    const App = (window.App = window.App || {});

    App.config = {
        gameName: "Chiến Tuyến 1954-1965",
        canvas: {
            width: 980,
            height: 620,
        },
        base: {
            maxHp: 7200,
            armor: 20,
            upgradeCost: [3, 5],
            levelHpMultiplier: [1, 1.35, 1.8],
            levelArmorBonus: [0, 10, 22],
            hpBoostCostCP: 2,
            hpBoostAmount: 380,
            healCostCP: 2,
            healPercent: 0.32,
        },
        resources: {
            startSupplies: 560,
            startCommandPoints: 0,
        },
        wave: {
            prepDuration: 6,
            durationSec: 30,
            baseSpawnInterval: 0.9,
            earlyStartRewardBase: 45,
        },
        quiz: {
            wrongCooldown: 5,
            rewardBase: 80,
            rewardPerWave: 20,
        },
        combat: {
            critChance: 0.1,
            critMultiplier: 1.8,
            collisionRadius: 16,
        },
        scaling: {
            enemyHpGrowth: 1.18,
            enemyDamageGrowth: 1.1,
            enemySpeedGrowthPerWave: 0.012,
            enemyArmorStep: 2,
            enemyArmorEvery: 3,
            bossHpGrowth: 1.22,
            bossDamageGrowth: 1.12,
            bossSpeedGrowthPerWave: 0.01,
            bossArmorStep: 4,
            bossArmorEvery: 2,
            spawnGrowthPerWave: 2,
        },
        skills: {
            artilleryStrike: {
                id: "artilleryStrike",
                name: "Chi viện hỏa lực",
                description: "Click bản đồ để dội pháo diện rộng",
                damage: 400,
                cooldown: 25,
                costCP: 2,
                radius: 90,
            },
            emergencyRepair: {
                id: "emergencyRepair",
                name: "Tăng viện khẩn cấp",
                description: "Hồi máu căn cứ và toàn bộ trụ",
                healTower: 280,
                healBase: 380,
                cooldown: 30,
                costCP: 1,
            },
            moraleBoost: {
                id: "moraleBoost",
                name: "Tăng sĩ khí",
                description: "+40% tốc bắn toàn map trong 6 giây",
                attackSpeedMultiplier: 1.4,
                duration: 6,
                cooldown: 35,
                costCP: 2,
            },
        },
        eventNames: {
            WAVE_START: "WAVE_START",
            WAVE_CLEARED: "WAVE_CLEARED",
            BOSS_SPAWN: "BOSS_SPAWN",
            TOWER_DESTROYED: "TOWER_DESTROYED",
            BASE_DAMAGED: "BASE_DAMAGED",
            QUIZ_ANSWERED: "QUIZ_ANSWERED",
            GAME_OVER: "GAME_OVER",
            VICTORY: "VICTORY",
        },
    };
})();
