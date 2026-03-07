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
    levelCompletedFlags: {
      1: false,
      2: false,
      3: false,
    },

    bus: createEventBus(),
  };

  App.resetStateForRun = function resetStateForRun(level) {
    const s = App.state;
    s.mode = "playing";
    s.paused = false;
    s.level = level || 1;
    s.wave = 0;
    s.globalWave = (s.level - 1) * config.wave.maxWavePerLevel;
    s.wavePhase = "idle";
    s.prepTimer = 0;
    s.currentWaveSpec = null;
    s.spawnQueue = [];
    s.spawnTimer = 0;
    s.spawnedInWave = 0;

    s.supplies = config.resources.startSupplies + (s.level - 1) * 120;
    s.commandPoints = config.resources.startCommandPoints + (s.level - 1);

    s.quizCooldown = 0;
    s.quizUsedIndexes = [];

    s.towers = [];
    s.enemies = [];
    s.projectiles = [];
    s.effects = [];
    s.selectedTowerId = null;

    s.drag.activeTowerType = null;
    s.drag.canPlace = false;

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
    s.stats.levelCleared = s.level;

    s.result.state = null;
    s.result.reason = "";
  };
})();
