(function () {
  const App = (window.App = window.App || {});

  const ui = {};

  function getTowerById(state, id) {
    return state.towers.find((tower) => tower.id === id);
  }

  function init() {
    ui.baseHp = document.getElementById("ui-base-hp");
    ui.supplies = document.getElementById("ui-supplies");
    ui.cp = document.getElementById("ui-cp");
    ui.wave = document.getElementById("ui-wave");
    ui.level = document.getElementById("ui-level");
    ui.enemiesLeft = document.getElementById("ui-enemies-left");
    ui.waveState = document.getElementById("ui-wave-state");
    ui.quizCd = document.getElementById("ui-quiz-cd");
    ui.btnPause = document.getElementById("btn-pause");

    ui.towerPanel = document.getElementById("tower-panel");
    ui.towerPanelBody = document.getElementById("tower-panel-body");
    ui.btnUpgradeTower = document.getElementById("btn-upgrade-tower");
    ui.btnRepairTower = document.getElementById("btn-repair-tower");
    ui.btnSellTower = document.getElementById("btn-sell-tower");
    ui.btnUpgradeDmg = document.getElementById("btn-upgrade-dmg");
    ui.btnUpgradeHp = document.getElementById("btn-upgrade-hp");
    ui.btnUpgradeSpd = document.getElementById("btn-upgrade-spd");

    ui.basePanelBody = document.getElementById("base-panel-body");
    ui.btnBaseUpgrade = document.getElementById("btn-base-upgrade");
    ui.btnBaseHpBoost = document.getElementById("btn-base-hp-boost");
    ui.btnBaseHeal = document.getElementById("btn-base-heal");

    ui.resultModal = document.getElementById("result-modal");
    ui.resultTitle = document.getElementById("result-title");
    ui.resultStats = document.getElementById("result-stats");
    ui.btnNextLevel = document.getElementById("btn-next-level");

    ui.btnTowerHelp = document.getElementById("btn-tower-help");
    ui.towerHelpModal = document.getElementById("tower-help-modal");
    ui.towerHelpContent = document.getElementById("tower-help-content");
    ui.btnCloseTowerHelp = document.getElementById("btn-close-tower-help");

    ui.bossWarning = document.getElementById("boss-warning");

    bindTowerPanelActions();
    bindBaseActions();
    bindTowerHelpActions();
    buildTowerHelpContent();
  }

  function bindTowerHelpActions() {
    if (!ui.btnTowerHelp) {
      return;
    }
    ui.btnTowerHelp.addEventListener("click", () => {
      ui.towerHelpModal.classList.remove("hidden");
    });
    ui.btnCloseTowerHelp.addEventListener("click", () => {
      ui.towerHelpModal.classList.add("hidden");
    });
  }

  function buildTowerHelpContent() {
    if (!ui.towerHelpContent) {
      return;
    }

    ui.towerHelpContent.innerHTML = "";

    for (const type of App.towerOrder) {
      const t = App.towersData[type];
      const scaling = t.levelScaling;

      const card = document.createElement("div");
      card.className = "help-card";
      card.innerHTML = `
        <h3 style="margin:0 0 6px; color:${t.color}">${t.name}</h3>
        <div class="help-meta">${t.description}</div>
        <div class="help-meta">Cost: ${t.cost} | Type: ${t.projectileType.toUpperCase()} | Vai trò: ${t.role}</div>
        <div class="help-meta">Lv1 -> DMG ${t.damage}, HP ${t.hp}, SPD ${t.attackSpeed.toFixed(2)}, Range ${Math.floor(t.range)}</div>
        <div class="help-meta">Lv2 multiplier -> DMG x${scaling.damage[1]}, HP x${scaling.hp[1]}, SPD x${scaling.attackSpeed[1]}</div>
        <div class="help-meta">Lv3 multiplier -> DMG x${scaling.damage[2]}, HP x${scaling.hp[2]}, SPD x${scaling.attackSpeed[2]}</div>
        <div class="help-meta">Sau Lv3: tăng riêng +DMG / +HP / +Tốc bắn bằng CP.</div>
      `;
      ui.towerHelpContent.appendChild(card);
    }
  }

  function spendCP(state, cost) {
    if (state.commandPoints < cost) {
      return false;
    }
    state.commandPoints -= cost;
    return true;
  }

  function getTowerTech(state, towerType) {
    if (!state.towerTech) {
      state.towerTech = {};
    }
    if (!state.towerTech[towerType]) {
      state.towerTech[towerType] = {
        level: 1,
        pointUpgradeLevels: {
          damage: 0,
          hp: 0,
          speed: 0,
        },
      };
    }
    return state.towerTech[towerType];
  }

  function applyTowerTechToInstance(state, tower, reason) {
    const tech = getTowerTech(state, tower.type);
    tower.applyTechProfile(tech, reason || "init");
  }

  function applyTowerTechToAllInstances(state, towerType, reason) {
    const towers = state.towers.filter((tower) => tower.type === towerType);
    for (const tower of towers) {
      applyTowerTechToInstance(state, tower, reason || "upgrade");
    }
  }

  function canUpgradeTowerType(state, towerType) {
    const tech = getTowerTech(state, towerType);
    return tech.level < 3;
  }

  function getTowerTypeUpgradePrice(state, towerType) {
    const tech = getTowerTech(state, towerType);
    if (tech.level >= 3) {
      return null;
    }
    const def = App.towersData[towerType];
    return def.upgradeCost[tech.level - 1];
  }

  function canPointUpgradeTowerType(state, towerType, statKey) {
    const tech = getTowerTech(state, towerType);
    if (tech.level < 3) {
      return false;
    }
    const cfg = App.towersData[towerType].pointUpgrade[statKey];
    return cfg && cfg.growth > 0 && cfg.costCP < 90;
  }

  function getPointUpgradeCostByType(state, towerType, statKey) {
    const tech = getTowerTech(state, towerType);
    const cfg = App.towersData[towerType].pointUpgrade[statKey];
    if (!cfg) {
      return null;
    }
    const step = tech.pointUpgradeLevels[statKey] || 0;
    return cfg.costCP + Math.floor(step / 3);
  }

  function upgradeTowerType(state, towerType) {
    if (!canUpgradeTowerType(state, towerType)) {
      return false;
    }
    const price = getTowerTypeUpgradePrice(state, towerType);
    if (state.supplies < price) {
      App.Effects.addFloatingText(state, 24, 138, "Thiếu Supplies", "#ff8e95");
      return false;
    }

    state.supplies -= price;
    const tech = getTowerTech(state, towerType);
    tech.level += 1;
    applyTowerTechToAllInstances(state, towerType, "upgrade");

    const placed = state.towers.find((tower) => tower.type === towerType);
    if (placed) {
      App.Effects.addFloatingText(state, placed.x - 8, placed.y - 22, "UPGRADE", "#80ffb1");
      state.selectedTowerId = placed.id;
    } else {
      App.Effects.addFloatingText(state, 26, 140, `Nâng cấp ${App.towersData[towerType].name} toàn cục`, "#80ffb1");
    }
    return true;
  }

  function upgradeTowerTypePointStat(state, towerType, statKey, label) {
    if (!canPointUpgradeTowerType(state, towerType, statKey)) {
      return false;
    }

    const cpCost = getPointUpgradeCostByType(state, towerType, statKey);
    if (!spendCP(state, cpCost)) {
      const any = state.towers.find((t) => t.type === towerType);
      if (any) {
        App.Effects.addFloatingText(state, any.x - 10, any.y - 24, "Thiếu Command Points", "#ff8e95");
      } else {
        App.Effects.addFloatingText(state, 26, 158, "Thiếu Command Points", "#ff8e95");
      }
      return false;
    }

    const tech = getTowerTech(state, towerType);
    tech.pointUpgradeLevels[statKey] += 1;
    applyTowerTechToAllInstances(state, towerType, statKey === "hp" ? "pointHp" : "point");

    const any = state.towers.find((t) => t.type === towerType);
    if (any) {
      App.Effects.addFloatingText(state, any.x - 10, any.y - 24, `+${label}`, "#8fdfff");
      state.selectedTowerId = any.id;
    } else {
      App.Effects.addFloatingText(state, 26, 158, `+${label} toàn cục cho ${App.towersData[towerType].name}`, "#8fdfff");
    }
    return true;
  }

  function bindTowerPanelActions() {
    ui.btnUpgradeTower.addEventListener("click", () => {
      const state = App.state;
      const tower = getTowerById(state, state.selectedTowerId);
      if (!tower) {
        return;
      }
      if (!upgradeTowerType(state, tower.type)) {
        return;
      }
      renderTowerPanel(state);
    });

    ui.btnRepairTower.addEventListener("click", () => {
      const state = App.state;
      const tower = getTowerById(state, state.selectedTowerId);
      if (!tower || tower.hp >= tower.maxHp) {
        return;
      }
      const price = tower.getRepairCost();
      if (state.supplies < price) {
        App.Effects.addFloatingText(state, tower.x - 10, tower.y - 24, "Thiếu Supplies", "#ff8e95");
        return;
      }
      state.supplies -= price;
      tower.repair(tower.maxHp * 0.45);
      App.Effects.addFloatingText(state, tower.x - 10, tower.y - 24, `Repair -${price}`, "#9cf6b4");
      renderTowerPanel(state);
    });

    ui.btnSellTower.addEventListener("click", () => {
      const state = App.state;
      const tower = getTowerById(state, state.selectedTowerId);
      if (!tower) {
        return;
      }
      state.towers = state.towers.filter((t) => t.id !== tower.id);
      state.selectedTowerId = null;
      App.Effects.addFloatingText(state, tower.x - 14, tower.y - 24, "Đã bán", "#85f5ac");
      renderTowerPanel(state);
    });

    const bindPointUpgrade = (btn, statKey, label) => {
      btn.addEventListener("click", () => {
        const state = App.state;
        const tower = getTowerById(state, state.selectedTowerId);
        if (!tower) {
          return;
        }
        if (!upgradeTowerTypePointStat(state, tower.type, statKey, label)) {
          return;
        }
        renderTowerPanel(state);
      });
    };

    bindPointUpgrade(ui.btnUpgradeDmg, "damage", "DMG");
    bindPointUpgrade(ui.btnUpgradeHp, "hp", "HP");
    bindPointUpgrade(ui.btnUpgradeSpd, "speed", "SPD");
  }

  function bindBaseActions() {
    ui.btnBaseUpgrade.addEventListener("click", () => {
      const state = App.state;
      const base = state.base;
      if (!base || !base.canUpgradeLevel()) {
        return;
      }
      const cpCost = base.getUpgradeLevelCost();
      if (!spendCP(state, cpCost)) {
        App.Effects.addFloatingText(state, base.x - 20, base.y - 36, "Thiếu CP", "#ff9ba8");
        return;
      }
      base.upgradeLevel();
      App.Effects.addFloatingText(state, base.x - 24, base.y - 36, "BASE UPGRADE", "#9ce6ff");
      renderBasePanel(state);
    });

    ui.btnBaseHpBoost.addEventListener("click", () => {
      const state = App.state;
      const base = state.base;
      const cost = App.config.base.hpBoostCostCP;
      if (!spendCP(state, cost)) {
        App.Effects.addFloatingText(state, base.x - 20, base.y - 36, "Thiếu CP", "#ff9ba8");
        return;
      }
      base.boostMaxHp();
      App.Effects.addFloatingText(state, base.x - 16, base.y - 36, "+HP MAX", "#9ff8b5");
      renderBasePanel(state);
    });

    ui.btnBaseHeal.addEventListener("click", () => {
      const state = App.state;
      const base = state.base;
      if (base.healUsedThisWave) {
        App.Effects.addFloatingText(state, base.x - 18, base.y - 36, "Wave này đã hồi rồi", "#ff9ba8");
        return;
      }
      const cost = App.config.base.healCostCP;
      if (!spendCP(state, cost)) {
        App.Effects.addFloatingText(state, base.x - 20, base.y - 36, "Thiếu CP", "#ff9ba8");
        return;
      }
      base.heal(base.getHealAmount());
      base.healUsedThisWave = true;
      App.Effects.addFloatingText(state, base.x - 12, base.y - 36, "+HEAL", "#7cff9e");
      renderBasePanel(state);
    });
  }

  function renderTowerPanel(state) {
    const tower = getTowerById(state, state.selectedTowerId);
    if (!tower) {
      ui.towerPanel.classList.add("hidden");
      return;
    }

    const tech = getTowerTech(state, tower.type);
    applyTowerTechToInstance(state, tower, "sync");

    ui.towerPanel.classList.remove("hidden");
    ui.towerPanelBody.innerHTML = `
      <div><strong>${tower.name}</strong> (Lv.${tech.level} - Global)</div>
      <div class="card-meta">HP: ${Math.floor(tower.hp)}/${Math.floor(tower.maxHp)} | Armor: ${Math.floor(tower.armor)}</div>
      <div class="card-meta">Damage: ${Math.floor(tower.getEffectiveDamage())} | Range: ${Math.floor(tower.getEffectiveRange())}</div>
      <div class="card-meta">AttackSpeed: ${(tower.attackSpeed * tower.activeMultipliers.speed).toFixed(2)} | Projectile: ${Math.floor(tower.projectileSpeed)}</div>
      <div class="card-meta">Special: ${tower.special.piercingShots ? `Xuyên x${Math.max(1, tower.special.pierceCount || 1)}` : "-"} ${tower.special.multiTarget ? "| Đa mục tiêu" : ""} ${tower.special.extraSplash ? "| Nổ lan" : ""}</div>
      <div class="card-meta">Nâng riêng (Global): DMG +${tech.pointUpgradeLevels.damage} | HP +${tech.pointUpgradeLevels.hp} | SPD +${tech.pointUpgradeLevels.speed}</div>
    `;

    const upgradePrice = getTowerTypeUpgradePrice(state, tower.type);
    ui.btnUpgradeTower.disabled = !upgradePrice || state.supplies < upgradePrice;
    ui.btnUpgradeTower.textContent = upgradePrice ? `+ Nâng cấp (${upgradePrice})` : "Đã max";

    const repairPrice = tower.getRepairCost();
    ui.btnRepairTower.disabled = tower.hp >= tower.maxHp || state.supplies < repairPrice;
    ui.btnRepairTower.textContent = `Sửa (${repairPrice})`;

    const dmgCost = getPointUpgradeCostByType(state, tower.type, "damage");
    const hpCost = getPointUpgradeCostByType(state, tower.type, "hp");
    const spdCost = getPointUpgradeCostByType(state, tower.type, "speed");

    ui.btnUpgradeDmg.disabled = !canPointUpgradeTowerType(state, tower.type, "damage") || state.commandPoints < dmgCost;
    ui.btnUpgradeHp.disabled = !canPointUpgradeTowerType(state, tower.type, "hp") || state.commandPoints < hpCost;
    ui.btnUpgradeSpd.disabled = !canPointUpgradeTowerType(state, tower.type, "speed") || state.commandPoints < spdCost;

    ui.btnUpgradeDmg.textContent = canPointUpgradeTowerType(state, tower.type, "damage") ? `+DMG (${dmgCost} CP)` : "+DMG (Lv3)";
    ui.btnUpgradeHp.textContent = canPointUpgradeTowerType(state, tower.type, "hp") ? `+HP (${hpCost} CP)` : "+HP (Lv3)";
    ui.btnUpgradeSpd.textContent = canPointUpgradeTowerType(state, tower.type, "speed") ? `+Tốc bắn (${spdCost} CP)` : "+Tốc bắn (Lv3)";
  }

  function renderBasePanel(state) {
    const base = state.base;
    if (!base) {
      return;
    }

    ui.basePanelBody.innerHTML = `
      <div><strong>Căn cứ chính</strong> (Lv.${base.level})</div>
      <div class="card-meta">HP: ${Math.floor(base.hp)}/${Math.floor(base.maxHp)} | Armor: ${Math.floor(base.armor)}</div>
      <div class="card-meta">Boost HP đã dùng: ${base.hpBoostLevel} | Heal wave: ${base.healUsedThisWave ? "Đã dùng" : "Sẵn sàng"}</div>
    `;

    const levelUpCost = base.getUpgradeLevelCost();
    ui.btnBaseUpgrade.disabled = !base.canUpgradeLevel() || state.commandPoints < (levelUpCost || 0);
    ui.btnBaseUpgrade.textContent = base.canUpgradeLevel() ? `Nâng cấp căn cứ (${levelUpCost} CP)` : "Căn cứ max level";

    const hpBoostCost = App.config.base.hpBoostCostCP;
    ui.btnBaseHpBoost.disabled = state.commandPoints < hpBoostCost;
    ui.btnBaseHpBoost.textContent = `Tăng HP max (+${App.config.base.hpBoostAmount}) (${hpBoostCost} CP)`;

    const healCost = App.config.base.healCostCP;
    ui.btnBaseHeal.disabled = base.healUsedThisWave || state.commandPoints < healCost || base.hp >= base.maxHp;
    ui.btnBaseHeal.textContent = base.healUsedThisWave ? "Hồi máu đã dùng wave này" : `Hồi máu (${healCost} CP)`;
  }

  function formatTime(totalSeconds) {
    const sec = Math.floor(totalSeconds % 60);
    const min = Math.floor(totalSeconds / 60);
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  function update(state) {
    ui.baseHp.textContent = `${Math.max(0, Math.floor(state.base.hp))}/${Math.floor(state.base.maxHp)}`;
    ui.supplies.textContent = Math.floor(state.supplies);
    ui.cp.textContent = Math.floor(state.commandPoints);
    ui.wave.textContent = `${state.wave}`;
    ui.level.textContent = "ENDLESS";
    ui.enemiesLeft.textContent = `${state.enemies.filter((e) => e.hp > 0).length + state.spawnQueue.length}`;

    if (state.wavePhase === "prep") {
      ui.waveState.textContent = `Chuẩn bị wave ${state.wave}: ${state.prepTimer.toFixed(1)}s`;
    } else if (state.wavePhase === "combat") {
      const bossStatus = state.bossSpawnedInWave ? (state.bossKilledInWave ? "Boss đã hạ" : "Đang đánh boss") : "Boss chưa xuất hiện";
      ui.waveState.textContent = `Wave ${state.wave} | Còn ${Math.ceil(state.waveTimer)}s | ${bossStatus}`;
    } else if (state.wavePhase === "ended") {
      ui.waveState.textContent = "Trận đã kết thúc";
    } else {
      ui.waveState.textContent = "Đang khởi tạo...";
    }

    ui.quizCd.textContent = state.quizCooldown > 0 ? `Quiz hồi sau ${state.quizCooldown.toFixed(1)}s` : "Quiz sẵn sàng";
    ui.btnPause.textContent = state.paused ? "Resume" : "Pause";

    if (state.boss.warningTimer > 0) {
      ui.bossWarning.classList.remove("hidden");
    } else {
      ui.bossWarning.classList.add("hidden");
    }

    renderTowerPanel(state);
    renderBasePanel(state);
    App.skillSystem.refreshUI(state);
  }

  function showResult(state) {
    ui.resultModal.classList.remove("hidden");

    if (state.result.state === "gameOver") {
      ui.resultTitle.textContent = "Game Over";
    } else {
      ui.resultTitle.textContent = "Kết thúc";
    }

    ui.resultStats.innerHTML = `
      <p>${state.result.reason || ""}</p>
      <p>Wave cao nhất: <strong>${state.wave}</strong></p>
      <p>Thời gian chơi: <strong>${formatTime(state.stats.playSeconds)}</strong></p>
      <p>Số câu đúng: <strong>${state.stats.correctAnswers}</strong> | Sai: <strong>${state.stats.wrongAnswers}</strong></p>
      <p>Trụ đã xây: <strong>${state.stats.towersBuilt}</strong></p>
      <p>Địch tiêu diệt: <strong>${state.stats.enemiesKilled}</strong></p>
      <p>Wave hoàn thành: <strong>${state.stats.wavesCleared}</strong></p>
    `;

    ui.btnNextLevel.classList.add("hidden");
  }

  function hideResult() {
    ui.resultModal.classList.add("hidden");
  }

  function quickUpgradeByTowerType(towerType) {
    const state = App.state;
    if (!state || state.mode !== "playing") {
      return false;
    }
    const upgraded = upgradeTowerType(state, towerType);
    if (!upgraded) {
      return false;
    }

    renderTowerPanel(state);
    return true;
  }

  App.uiSystem = {
    init,
    update,
    showResult,
    hideResult,
    renderTowerPanel,
    renderBasePanel,
    quickUpgradeByTowerType,
    canUpgradeTowerType(state, towerType) {
      return canUpgradeTowerType(state, towerType);
    },
    getTowerTypeUpgradeInfo(state, towerType) {
      const level = getTowerTech(state, towerType).level;
      const price = getTowerTypeUpgradePrice(state, towerType);
      return { level, price, canUpgrade: level < 3 };
    },
    applyTowerTechToInstance,
  };
})();
