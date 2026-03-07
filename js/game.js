(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  const runtime = {
    canvas: null,
    ctx: null,
    lastFrameTime: 0,
    started: false,
    resultShownState: null,
  };

  function init() {
    runtime.canvas = document.getElementById("game-canvas");
    runtime.ctx = runtime.canvas.getContext("2d");

    App.dragDropSystem.init({
      canvas: runtime.canvas,
      towerList: document.getElementById("tower-list"),
    });

    App.skillSystem.init({
      skillList: document.getElementById("skill-list"),
    });

    App.quizSystem.init({
      modal: document.getElementById("quiz-modal"),
      question: document.getElementById("quiz-question"),
      answers: document.getElementById("quiz-answers"),
      feedback: document.getElementById("quiz-feedback"),
      close: document.getElementById("btn-close-quiz"),
    });

    App.uiSystem.init();
    if (App.audioSystem) {
      App.audioSystem.init();
    }

    bindInGameButtons();
    bindCanvasInteraction();
    bindEvents();

    runtime.started = true;
    runtime.lastFrameTime = performance.now();
    requestAnimationFrame(loop);
  }

  function bindInGameButtons() {
    document.getElementById("btn-start-wave").addEventListener("click", () => {
      App.waveSystem.callEarlyStart(App.state);
    });

    document.getElementById("btn-quiz").addEventListener("click", () => {
      const opened = App.quizSystem.openQuiz(App.state);
      if (!opened && App.state.quizCooldown > 0) {
        App.Effects.addFloatingText(App.state, 24, 84, "Quiz đang cooldown", "#ff9fb6");
      }
    });

    document.getElementById("btn-pause").addEventListener("click", () => {
      if (App.state.mode !== "playing") {
        return;
      }
      App.state.paused = !App.state.paused;
    });
  }

  function bindCanvasInteraction() {
    runtime.canvas.addEventListener("mousemove", (event) => {
      const point = App.dragDropSystem.getCanvasPoint(event, runtime.canvas);
      App.state.drag.hoverX = point.x;
      App.state.drag.hoverY = point.y;
    });

    runtime.canvas.addEventListener("click", (event) => {
      const state = App.state;
      if (state.mode !== "playing") {
        return;
      }

      const point = App.dragDropSystem.getCanvasPoint(event, runtime.canvas);

      if (state.skills.activeTargetSkill) {
        App.skillSystem.castTargetSkill(state, point.x, point.y);
        return;
      }

      const tower = state.towers.find((t) => App.map.distance(t, point) <= t.radius + 8);
      if (tower) {
        state.selectedTowerId = tower.id;
      } else {
        state.selectedTowerId = null;
      }
      App.uiSystem.renderTowerPanel(state);
    });
  }

  function bindEvents() {
    const bus = App.state.bus;
    bus.on(config.eventNames.BOSS_SPAWN, () => {
      App.state.boss.warningTimer = 3.5;
      App.state.boss.shakeTimer = 0.4;
    });
  }

  function startLevel(level) {
    App.resetStateForRun(level);
    const state = App.state;
    const mapDef = App.map.getMap(level);

    state.base = new App.Base(mapDef.base.x, mapDef.base.y, mapDef.base.radius, config.base.maxHp, config.base.armor);
    state.availableSlots = mapDef.towerSlots.slice();

    App.waveSystem.prepareNextWave(state);
    App.uiSystem.hideResult();
    runtime.resultShownState = null;
  }

  function update(dt) {
    const state = App.state;

    if (state.mode === "playing") {
      if (!state.paused) {
        state.stats.playSeconds += dt;

        App.waveSystem.updateWave(state, dt);
        App.quizSystem.update(state, dt);
        App.skillSystem.update(state, dt);
        App.combatSystem.update(state, dt);
        App.Effects.update(state, dt);

        state.boss.warningTimer = Math.max(0, state.boss.warningTimer - dt);
        state.boss.shakeTimer = Math.max(0, state.boss.shakeTimer - dt);

        if (state.base.hp <= 0) {
          state.mode = "result";
          state.result.state = "gameOver";
          state.result.reason = "Căn cứ bị phá hủy.";
          state.wavePhase = "ended";
          state.bus.emit(config.eventNames.GAME_OVER, {});
        }

        if (state.boss.activeId) {
          const boss = state.enemies.find((enemy) => enemy.id === state.boss.activeId);
          if (!boss || boss.hp <= 0) {
            state.boss.activeId = null;
            state.boss.healthBarVisible = false;
          }
        }
      }
    }

    if (state.mode === "result" && runtime.resultShownState !== state.result.state) {
      App.uiSystem.showResult(state);
      runtime.resultShownState = state.result.state;
    }
  }

  function drawHealthBar(ctx, x, y, width, hp, maxHp, color) {
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x - width / 2, y, width, 5);
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y, width * ratio, 5);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(x - width / 2, y, width, 5);
  }

  function drawMap(ctx, state) {
    const mapDef = App.map.getMap(state.level);

    const grad = ctx.createLinearGradient(0, 0, 0, runtime.canvas.height);
    grad.addColorStop(0, "#2a3540");
    grad.addColorStop(1, "#111b28");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, runtime.canvas.width, runtime.canvas.height);

    ctx.strokeStyle = "#6f839d";
    ctx.lineWidth = 32;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    mapDef.path.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#8fd7ff";
    ctx.beginPath();
    ctx.arc(mapDef.spawn.x, mapDef.spawn.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#122536";
    ctx.fillText("Spawn", mapDef.spawn.x - 20, mapDef.spawn.y - 24);

    ctx.fillStyle = "#ff9ab0";
    ctx.beginPath();
    ctx.arc(state.base.x, state.base.y, state.base.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (const slot of mapDef.towerSlots) {
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(150,200,255,0.32)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    drawHealthBar(ctx, state.base.x, state.base.y - 50, 90, state.base.hp, state.base.maxHp, "#ff7e9b");
  }

  function drawTowers(ctx, state) {
    const selected = state.selectedTowerId;

    for (const tower of state.towers) {
      if (tower.id === selected) {
        ctx.strokeStyle = "rgba(144,224,255,0.65)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.getEffectiveRange(), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = tower.color;
      if (tower.isBarricade) {
        ctx.fillRect(tower.x - 18, tower.y - 16, 36, 32);
      } else {
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tower.stunnedTimer > 0) {
        ctx.fillStyle = "rgba(255,188,208,0.85)";
        ctx.fillText("⚡", tower.x - 5, tower.y - 20);
      }

      drawHealthBar(ctx, tower.x, tower.y - 26, 44, tower.hp, tower.maxHp, "#7cff9e");

      if (tower.id === selected) {
        ctx.strokeStyle = "#b2edff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawEnemies(ctx, state) {
    for (const enemy of state.enemies) {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      if (enemy.type === "commander") {
        ctx.strokeStyle = "rgba(204,165,255,0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.aura.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (enemy.isBoss && enemy.abilityTimers.armorModeActive > 0) {
        ctx.strokeStyle = "rgba(255,212,136,0.7)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawHealthBar(ctx, enemy.x, enemy.y - enemy.radius - 12, enemy.isBoss ? 110 : 42, enemy.hp, enemy.maxHp, "#ff7d7d");
    }
  }

  function drawProjectiles(ctx, state) {
    for (const projectile of state.projectiles) {
      switch (projectile.type) {
        case "shell":
          ctx.fillStyle = "#ffbe73";
          ctx.fillRect(projectile.x - 3, projectile.y - 3, 6, 6);
          break;
        case "missile":
          ctx.fillStyle = "#ff7b87";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "laser":
          ctx.fillStyle = "#92f0ff";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        default:
          ctx.fillStyle = "#f3f8ff";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, 2.8, 0, Math.PI * 2);
          ctx.fill();
      }
    }
  }

  function drawBossBar(ctx, state) {
    if (!state.boss.healthBarVisible || !state.boss.activeId) {
      return;
    }
    const boss = state.enemies.find((enemy) => enemy.id === state.boss.activeId);
    if (!boss) {
      return;
    }

    const x = 190;
    const y = 12;
    const width = 600;
    const ratio = Math.max(0, boss.hp / boss.maxHp);

    ctx.fillStyle = "rgba(15, 7, 13, 0.8)";
    ctx.fillRect(x, y, width, 22);
    ctx.fillStyle = "#ff6078";
    ctx.fillRect(x, y, width * ratio, 22);
    ctx.strokeStyle = "rgba(255,180,190,0.6)";
    ctx.strokeRect(x, y, width, 22);
    ctx.fillStyle = "#fff2f4";
    ctx.font = "bold 13px Trebuchet MS";
    ctx.fillText(`${boss.name} - Phase ${boss.phase}`, x + 10, y + 15);
  }

  function drawDragOrSkillTarget(ctx, state) {
    if (state.skills.activeTargetSkill === "artilleryStrike") {
      const cfg = config.skills.artilleryStrike;
      ctx.strokeStyle = "rgba(255,120,120,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.drag.hoverX, state.drag.hoverY, cfg.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (state.drag.activeTowerType) {
      const def = App.towersData[state.drag.activeTowerType];
      if (!def) {
        return;
      }
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = state.drag.canPlace ? "#8fffb3" : "#ff8a9d";
      ctx.beginPath();
      ctx.arc(state.drag.hoverX, state.drag.hoverY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(state.drag.hoverX, state.drag.hoverY, def.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawPausedOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, runtime.canvas.width, runtime.canvas.height);
    ctx.fillStyle = "#e9f4ff";
    ctx.font = "bold 38px Trebuchet MS";
    ctx.fillText("PAUSED", runtime.canvas.width / 2 - 80, runtime.canvas.height / 2);
    ctx.restore();
  }

  function draw() {
    const state = App.state;
    const ctx = runtime.ctx;

    if (!state.base) {
      ctx.clearRect(0, 0, runtime.canvas.width, runtime.canvas.height);
      return;
    }

    ctx.save();

    if (state.boss.shakeTimer > 0) {
      const shakeX = (Math.random() - 0.5) * 6;
      const shakeY = (Math.random() - 0.5) * 6;
      ctx.translate(shakeX, shakeY);
    }

    drawMap(ctx, state);
    drawTowers(ctx, state);
    drawEnemies(ctx, state);
    drawProjectiles(ctx, state);
    App.Effects.draw(state, ctx);
    drawBossBar(ctx, state);
    drawDragOrSkillTarget(ctx, state);

    if (state.paused && state.mode === "playing") {
      drawPausedOverlay(ctx);
    }

    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - runtime.lastFrameTime) / 1000);
    runtime.lastFrameTime = now;

    if (runtime.started) {
      update(dt);
      draw();
      if (App.state.base) {
        App.uiSystem.update(App.state);
      }
    }

    requestAnimationFrame(loop);
  }

  App.game = {
    init,
    startLevel,
  };
})();
