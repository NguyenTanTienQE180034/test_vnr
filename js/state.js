(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  const createEventBus = () => {
    const listeners = {};
    return {
      on(eventName, handler) {
        listeners[eventName] = listeners[eventName] || [];
        listeners[eventName].push(handler);
      },
      emit(eventName, payload) {
        const group = listeners[eventName];
        if (!group) {
          return;
        }
        for (const fn of group) {
          fn(payload);
        }
      },
      clear() {
        Object.keys(listeners).forEach((k) => delete listeners[k]);
      },
    };
  };

  App.state = {
    mode: "menu",
    paused: false,
    level: 1,
    wave: 0,
    globalWave: 0,
    wavePhase: "idle",
    prepTimer: 0,
    currentWaveSpec: null,
    spawnQueue: [],
    spawnTimer: 0,
    spawnedInWave: 0,
    waveTimer: 0,
    bossSpawnedInWave: false,
    bossKilledInWave: false,

    supplies: config.resources.startSupplies,
    commandPoints: config.resources.startCommandPoints,

    quizCooldown: 0,
    quizUsedIndexes: [],

    base: null,
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
    selectedTowerId: null,

    drag: {
      activeTowerType: null,
      hoverX: 0,
      hoverY: 0,
      canPlace: false,
      hoverValid: false,
      previewCard: null,
    },

    skills: {
      activeTargetSkill: null,
      cooldowns: {
        artilleryStrike: 0,
        emergencyRepair: 0,
        moraleBoost: 0,
      },
      moraleBoostTimer: 0,
    },

    boss: {
      activeId: null,
      warningTimer: 0,
      healthBarVisible: false,
      shakeTimer: 0,
    },

    stats: {
      towersBuilt: 0,
      enemiesKilled: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      playSeconds: 0,
      wavesCleared: 0,
      damageToBase: 0,
      levelCleared: 0,
    },

    result: {
      state: null,
      reason: "",
    },

    availableSlots: [],
    towerTech: {},

    bus: createEventBus(),
  };

  App.resetStateForRun = function resetStateForRun() {
    const s = App.state;
    s.mode = "playing";
    s.paused = false;
    s.level = 1;
    s.wave = 0;
    s.globalWave = 0;
    s.wavePhase = "idle";
    s.prepTimer = 0;
    s.currentWaveSpec = null;
    s.spawnQueue = [];
    s.spawnTimer = 0;
    s.spawnedInWave = 0;
    s.waveTimer = 0;
    s.bossSpawnedInWave = false;
    s.bossKilledInWave = false;

    s.supplies = config.resources.startSupplies;
    s.commandPoints = config.resources.startCommandPoints;

    s.quizCooldown = 0;
    s.quizUsedIndexes = [];

    s.towers = [];
    s.enemies = [];
    s.projectiles = [];
    s.effects = [];
    s.selectedTowerId = null;

    s.drag.activeTowerType = null;
    s.drag.canPlace = false;
    s.drag.hoverX = 0;
    s.drag.hoverY = 0;
    s.drag.hoverValid = false;
    s.drag.previewCard = null;

    s.skills.activeTargetSkill = null;
    s.skills.cooldowns.artilleryStrike = 0;
    s.skills.cooldowns.emergencyRepair = 0;
    s.skills.cooldowns.moraleBoost = 0;
    s.skills.moraleBoostTimer = 0;

    s.boss.activeId = null;
    s.boss.warningTimer = 0;
    s.boss.healthBarVisible = false;
    s.boss.shakeTimer = 0;

    s.stats.towersBuilt = 0;
    s.stats.enemiesKilled = 0;
    s.stats.correctAnswers = 0;
    s.stats.wrongAnswers = 0;
    s.stats.playSeconds = 0;
    s.stats.wavesCleared = 0;
    s.stats.damageToBase = 0;
    s.stats.levelCleared = 0;

    s.result.state = null;
    s.result.reason = "";

    const tech = {};
    const order = App.towerOrder || [];
    for (const type of order) {
      tech[type] = {
        level: 1,
        pointUpgradeLevels: {
          damage: 0,
          hp: 0,
          speed: 0,
        },
      };
    }
    s.towerTech = tech;
  };
})();
