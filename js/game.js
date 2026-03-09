(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  const runtime = {
    canvas: null,
    ctx: null,
    lastFrameTime: 0,
    started: false,
    resultShownState: null,
    upgradePopup: {
      modal: null,
      title: null,
      desc: null,
      confirm: null,
      cancel: null,
      towerId: null,
    },
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

    initUpgradePopup();
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
      if (!opened) {
        if (App.state.quizCooldown > 0) {
          App.Effects.addFloatingText(App.state, 24, 84, "Quiz đang cooldown", "#ff9fb6");
          return;
        }
        if (!Array.isArray(App.questionsData) || App.questionsData.length === 0) {
          App.Effects.addFloatingText(App.state, 24, 84, "Chua tai du lieu cau hoi", "#ff9fb6");
        }
      }
    });

    document.getElementById("btn-pause").addEventListener("click", () => {
      if (App.state.mode !== "playing") {
        return;
      }
      if (App.antiCheatSystem && App.antiCheatSystem.isLocked()) {
        return;
      }
      App.state.paused = !App.state.paused;
    });
  }

  function initUpgradePopup() {
    runtime.upgradePopup.modal = document.getElementById("tower-upgrade-modal");
    runtime.upgradePopup.title = document.getElementById("tower-upgrade-title");
    runtime.upgradePopup.desc = document.getElementById("tower-upgrade-desc");
    runtime.upgradePopup.confirm = document.getElementById("btn-confirm-tower-upgrade");
    runtime.upgradePopup.cancel = document.getElementById("btn-cancel-tower-upgrade");

    if (!runtime.upgradePopup.modal) {
      return;
    }

    runtime.upgradePopup.confirm.addEventListener("click", () => {
      const towerType = runtime.upgradePopup.towerId;
      if (!towerType) {
        closeTowerUpgradePopup();
        return;
      }
      App.uiSystem.quickUpgradeByTowerType(towerType);
      closeTowerUpgradePopup();
    });

    runtime.upgradePopup.cancel.addEventListener("click", () => {
      closeTowerUpgradePopup();
    });
  }

  function getUpgradeIconCenter(tower) {
    return {
      x: tower.x + 18,
      y: tower.y - 18,
      radius: 10,
    };
  }

  function findTowerByUpgradeIcon(point, towers) {
    return towers.find((tower) => {
      if (!(App.uiSystem && App.uiSystem.canUpgradeTowerType(App.state, tower.type))) {
        return false;
      }
      const icon = getUpgradeIconCenter(tower);
      return App.map.distance(point, icon) <= icon.radius + 2;
    });
  }

  function openTowerUpgradePopup(tower) {
    if (!runtime.upgradePopup.modal) {
      return;
    }

    const info = App.uiSystem.getTowerTypeUpgradeInfo(App.state, tower.type);
    runtime.upgradePopup.towerId = tower.type;
    runtime.upgradePopup.title.textContent = `Nâng cấp ${tower.name}`;
    runtime.upgradePopup.desc.textContent = info.canUpgrade
      ? `Level hiện tại (global): ${info.level} -> ${info.level + 1}. Chi phí: ${info.price} Supplies.`
      : "Đã đạt level tối đa.";
    runtime.upgradePopup.confirm.disabled = !info.canUpgrade;
    runtime.upgradePopup.confirm.textContent = info.canUpgrade ? `Nâng cấp (${info.price})` : "Đã max";
    runtime.upgradePopup.modal.classList.remove("hidden");
  }

  function closeTowerUpgradePopup() {
    if (!runtime.upgradePopup.modal) {
      return;
    }
    runtime.upgradePopup.towerId = null;
    runtime.upgradePopup.modal.classList.add("hidden");
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

      const upgradeTarget = findTowerByUpgradeIcon(point, state.towers);
      if (upgradeTarget) {
        openTowerUpgradePopup(upgradeTarget);
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

  function startEndless() {
    App.resetStateForRun();
    const state = App.state;
    const mapDef = App.map.getMap(1);

    state.base = new App.Base(mapDef.base.x, mapDef.base.y, mapDef.base.radius, config.base.maxHp, config.base.armor);
    state.availableSlots = mapDef.towerSlots.slice();

    App.waveSystem.prepareNextWave(state);
    App.uiSystem.hideResult();
    closeTowerUpgradePopup();
    runtime.resultShownState = null;
  }

  function update(dt) {
    const state = App.state;
    const antiLocked = App.antiCheatSystem && App.antiCheatSystem.isLocked();

    if (state.mode === "playing") {
      if (!state.paused && !antiLocked) {
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

  function drawBaseStructure(ctx, base) {
    const x = base.x;
    const y = base.y;

    if (base.level === 1) {
      ctx.fillStyle = "#ff9ab0";
      ctx.beginPath();
      ctx.arc(x, y, base.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbe0e6";
      ctx.fillRect(x - 8, y - 26, 16, 18);
      return;
    }

    if (base.level === 2) {
      ctx.fillStyle = "#ff8ea4";
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 6;
        const px = x + Math.cos(a) * (base.radius + 6);
        const py = y + Math.sin(a) * (base.radius + 6);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,230,236,0.85)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffe8ee";
      ctx.fillRect(x - 9, y - 30, 18, 22);
      return;
    }

    const glow = ctx.createRadialGradient(x, y, 10, x, y, base.radius + 24);
    glow.addColorStop(0, "rgba(255,164,184,0.65)");
    glow.addColorStop(1, "rgba(255,164,184,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, base.radius + 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff7e99";
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const outer = i % 2 === 0 ? base.radius + 10 : base.radius - 2;
      const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
      const px = x + Math.cos(a) * outer;
      const py = y + Math.sin(a) * outer;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,235,240,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff1f5";
    ctx.fillRect(x - 10, y - 32, 20, 24);
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

    drawBaseStructure(ctx, state.base);

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    for (const slot of mapDef.towerSlots) {
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(150,200,255,0.32)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    drawHealthBar(ctx, state.base.x, state.base.y - 62, 100, state.base.hp, state.base.maxHp, "#ff7e9b");
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

      const lv = tower.level;
      const x = tower.x;
      const y = tower.y;

      if (tower.isBarricade) {
        const width = lv === 1 ? 36 : lv === 2 ? 42 : 50;
        const height = lv === 1 ? 32 : lv === 2 ? 36 : 42;
        ctx.fillStyle = tower.color;
        ctx.fillRect(x - width / 2, y - height / 2, width, height);
        ctx.fillStyle = "rgba(0,0,0,0.24)";
        ctx.fillRect(x - width / 2 + 4, y - 4, width - 8, 5);
        if (lv >= 2) {
          ctx.fillStyle = "#f4ead8";
          ctx.fillRect(x - 6, y - height / 2 - 4, 12, 8);
        }
        if (lv === 3) {
          ctx.strokeStyle = "rgba(255,245,225,0.9)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        }
      } else if (lv === 1) {
        ctx.fillStyle = tower.color;
        ctx.beginPath();
        ctx.arc(x, y, tower.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (lv === 2) {
        ctx.fillStyle = tower.color;
        ctx.fillRect(x - 16, y - 16, 32, 32);
        ctx.fillStyle = "#f5fbff";
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const glow = ctx.createRadialGradient(x, y, 4, x, y, 30);
        glow.addColorStop(0, tower.color);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = tower.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const a = (Math.PI * 2 * i) / 6;
          const px = x + Math.cos(a) * 18;
          const py = y + Math.sin(a) * 18;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#f8fdff";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tower.type === "laser") {
        ctx.strokeStyle = lv === 3 ? "rgba(145,244,255,0.95)" : "rgba(145,244,255,0.7)";
        ctx.lineWidth = lv === 3 ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.stroke();

        if (tower.laserBeam && tower.laserBeam.active) {
          const endX = typeof tower.laserBeam.endX === "number" ? tower.laserBeam.endX : x;
          const endY = typeof tower.laserBeam.endY === "number" ? tower.laserBeam.endY : y;
          const ratio = Math.max(
            0.18,
            Math.min(1, tower.laserBeam.timer / Math.max(0.001, tower.laserBeam.duration || 0.12))
          );

          ctx.strokeStyle = lv === 3 ? `rgba(96, 236, 255, ${0.28 + ratio * 0.38})` : `rgba(116, 232, 255, ${0.22 + ratio * 0.33})`;
          ctx.lineWidth = lv === 3 ? 10 : lv === 2 ? 8 : 6;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          ctx.strokeStyle = lv === 3 ? `rgba(220, 255, 255, ${0.75 + ratio * 0.2})` : `rgba(198, 252, 255, ${0.68 + ratio * 0.18})`;
          ctx.lineWidth = lv === 3 ? 4.5 : lv === 2 ? 3.6 : 2.8;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          ctx.fillStyle = lv === 3 ? "rgba(225, 255, 255, 0.95)" : "rgba(208, 252, 255, 0.9)";
          ctx.beginPath();
          ctx.arc(endX, endY, lv === 3 ? 5.2 : lv === 2 ? 4.4 : 3.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (App.uiSystem && App.uiSystem.canUpgradeTowerType(state, tower.type)) {
        const icon = getUpgradeIconCenter(tower);
        ctx.fillStyle = "rgba(126,255,168,0.95)";
        ctx.beginPath();
        ctx.arc(icon.x, icon.y, icon.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(18,44,29,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(icon.x - 4, icon.y);
        ctx.lineTo(icon.x + 4, icon.y);
        ctx.moveTo(icon.x, icon.y - 4);
        ctx.lineTo(icon.x, icon.y + 4);
        ctx.stroke();
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

  function drawEnemyBody(ctx, enemy) {
    const x = enemy.x;
    const y = enemy.y;
    const r = enemy.radius;
    const visual = enemy.visualType || "infantry";

    if (visual === "vehicle" || visual === "tank" || visual === "rocket") {
      const bodyWidth = visual === "tank" ? 34 : 28;
      const bodyHeight = visual === "tank" ? 22 : 18;
      ctx.fillStyle = enemy.color;
      ctx.fillRect(x - bodyWidth / 2, y - bodyHeight / 2, bodyWidth, bodyHeight);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(x - bodyWidth / 2 + 3, y + bodyHeight / 2 - 5, bodyWidth - 6, 3);
      ctx.fillStyle = "#1a1f28";
      ctx.fillRect(x - 5, y - bodyHeight / 2 - 4, 10, 8);
      if (visual === "rocket") {
        ctx.fillStyle = "#ffdf9a";
        ctx.fillRect(x + bodyWidth / 2 - 2, y - 2, 10, 4);
      }
      return;
    }

    if (visual === "mortar") {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(x - 16, y - 11, 32, 22);
      ctx.fillStyle = "#242b33";
      ctx.fillRect(x - 6, y - 20, 12, 9);
      ctx.fillStyle = "#f6e7c5";
      ctx.fillRect(x - 2, y - 29, 4, 11);
      return;
    }

    if (visual === "shield") {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(190,235,255,0.92)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (visual === "drone") {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(x, y, r - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#dffff0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - r - 4, y);
      ctx.lineTo(x + r + 4, y);
      ctx.moveTo(x, y - r - 4);
      ctx.lineTo(x, y + r + 4);
      ctx.stroke();
      return;
    }

    if (visual === "flame") {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe6b5";
      ctx.beginPath();
      ctx.moveTo(x, y - r - 6);
      ctx.lineTo(x + 6, y - 2);
      ctx.lineTo(x, y + 4);
      ctx.lineTo(x - 6, y - 2);
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (enemy.isBoss) {
      const glow = ctx.createRadialGradient(x, y, 4, x, y, r + 16);
      glow.addColorStop(0, enemy.color);
      glow.addColorStop(1, "rgba(12,16,28,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r + 12, 0, Math.PI * 2);
      ctx.fill();

      if (visual === "boss-iron") {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(x - r - 6, y - r + 1, (r + 6) * 2, (r - 1) * 2);
        ctx.fillStyle = "#fff0d8";
        ctx.fillRect(x - 5, y - 5, 10, 10);
      } else if (visual === "boss-shadow") {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
          const rad = i % 2 === 0 ? r + 8 : r - 3;
          const px = x + Math.cos(a) * rad;
          const py = y + Math.sin(a) * rad;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(x, y - r - 4);
        ctx.lineTo(x + r + 6, y);
        ctx.lineTo(x, y + r + 4);
        ctx.lineTo(x - r - 6, y);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (visual === "commander") {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f4e6ff";
      ctx.fillRect(x - 3, y - r - 5, 6, 8);
      return;
    }

    if (visual === "sniper" || visual === "heavy" || visual === "armored") {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(15,23,34,0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#0f1826";
      ctx.fillRect(x + 2, y - 2, r - 1, 4);
      return;
    }

    if (visual === "scout") {
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      ctx.fill();
      return;
    }

    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawEnemies(ctx, state) {
    for (const enemy of state.enemies) {
      drawEnemyBody(ctx, enemy);

      if (enemy.type === "commander") {
        ctx.strokeStyle = "rgba(204,165,255,0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.aura.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (enemy.isBoss && enemy.abilityTimers.armorModeActive > 0) {
        ctx.strokeStyle = "rgba(255,212,136,0.7)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawHealthBar(ctx, enemy.x, enemy.y - enemy.radius - 14, enemy.isBoss ? 130 : 44, enemy.hp, enemy.maxHp, "#ff7d7d");
    }
  }

  function drawProjectiles(ctx, state) {
    for (const projectile of state.projectiles) {
      const lv = projectile.visualLevel || 1;
      switch (projectile.type) {
        case "shell":
          ctx.fillStyle = lv === 3 ? "#ffd39d" : lv === 2 ? "#ffc789" : "#ffbe73";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, lv === 3 ? 5 : lv === 2 ? 4 : 3, 0, Math.PI * 2);
          ctx.fill();
          if (lv >= 2) {
            ctx.strokeStyle = "rgba(255,235,194,0.65)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, lv === 3 ? 7 : 5.5, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case "missile":
          ctx.fillStyle = lv === 3 ? "#ff4f63" : lv === 2 ? "#ff6a79" : "#ff7b87";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, lv === 3 ? 6.5 : lv === 2 ? 5.5 : 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,186,150,0.55)";
          ctx.fillRect(projectile.x - 2, projectile.y + 3, 4, lv === 3 ? 8 : 6);
          break;
        case "laser":
          ctx.strokeStyle = lv === 3 ? "rgba(158,249,255,0.95)" : lv === 2 ? "rgba(150,243,255,0.88)" : "rgba(146,240,255,0.8)";
          ctx.lineWidth = lv === 3 ? 4.5 : lv === 2 ? 3.5 : 2.8;
          ctx.beginPath();
          ctx.moveTo(projectile.prevX, projectile.prevY);
          ctx.lineTo(projectile.x, projectile.y);
          ctx.stroke();
          ctx.fillStyle = lv === 3 ? "#c8fdff" : "#b6f7ff";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, lv === 3 ? 2.7 : 2.2, 0, Math.PI * 2);
          ctx.fill();
          break;
        default:
          ctx.fillStyle = lv === 3 ? "#ffffff" : lv === 2 ? "#f7fbff" : "#f3f8ff";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, lv === 3 ? 3.6 : lv === 2 ? 3.2 : 2.8, 0, Math.PI * 2);
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

    const x = 170;
    const y = 10;
    const width = 640;
    const ratio = Math.max(0, boss.hp / boss.maxHp);

    const bossGrad = ctx.createLinearGradient(x, y, x + width, y);
    bossGrad.addColorStop(0, "#ff6a82");
    bossGrad.addColorStop(0.5, "#ff445f");
    bossGrad.addColorStop(1, "#d81734");

    ctx.fillStyle = "rgba(15, 7, 13, 0.86)";
    ctx.fillRect(x, y, width, 28);
    ctx.fillStyle = bossGrad;
    ctx.fillRect(x, y, width * ratio, 28);
    ctx.strokeStyle = "rgba(255,180,190,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, 28);
    ctx.fillStyle = "#fff2f4";
    ctx.font = "bold 14px Trebuchet MS";
    ctx.fillText(`${boss.name} - Phase ${boss.phase}`, x + 12, y + 19);
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
    startEndless,
  };
})();
