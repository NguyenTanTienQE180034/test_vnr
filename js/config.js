(function () {
  const App = (window.App = window.App || {});

  App.config = {
    gameName: "Chiến Tuyến 1954-1965",
    canvas: {
      width: 980,
      height: 620,
    },
    base: {
      maxHp: 4200,
      armor: 20,
    },
    resources: {
      startSupplies: 260,
      startCommandPoints: 2,
    },
    wave: {
      maxWavePerLevel: 10,
      prepDuration: 12,
      spawnInterval: 0.9,
      earlyStartRewardBase: 45,
    },
    quiz: {
      wrongCooldown: 10,
      rewardBase: 80,
      rewardPerWave: 20,
    },
    combat: {
      critChance: 0.1,
      critMultiplier: 1.8,
      collisionRadius: 16,
    },
    scaling: {
      hpExponent: 1.35,
      damageExponent: 1.25,
      speedStep: 0.02,
      armorStepWave: 5,
      spawnGrowthPerWave: 2,
      bossHpExponent: 1.6,
      bossDamageExponent: 1.4,
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
