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

    ui.resultModal = document.getElementById("result-modal");
    ui.resultTitle = document.getElementById("result-title");
    ui.resultStats = document.getElementById("result-stats");
    ui.btnNextLevel = document.getElementById("btn-next-level");

    ui.bossWarning = document.getElementById("boss-warning");

    bindTowerPanelActions();
  }

  function bindTowerPanelActions() {
    ui.btnUpgradeTower.addEventListener("click", () => {
      const state = App.state;
      const tower = getTowerById(state, state.selectedTowerId);
      if (!tower || !tower.canUpgrade()) {
        return;
      }
      const price = tower.getUpgradePrice();
      if (state.supplies < price) {
        App.Effects.addFloatingText(state, tower.x - 10, tower.y - 24, "Thiếu Supplies", "#ff8e95");
        return;
      }
      state.supplies -= price;
      tower.upgrade();
      App.Effects.addFloatingText(state, tower.x - 8, tower.y - 22, "UPGRADE", "#80ffb1");
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
      const refund = tower.getSellValue();
      state.supplies += refund;
      state.towers = state.towers.filter((t) => t.id !== tower.id);
      state.selectedTowerId = null;
      App.Effects.addFloatingText(state, tower.x - 14, tower.y - 24, `+${refund}`, "#85f5ac");
      renderTowerPanel(state);
    });
  }

  function renderTowerPanel(state) {
    const tower = getTowerById(state, state.selectedTowerId);
    if (!tower) {
      ui.towerPanel.classList.add("hidden");
      return;
    }

    ui.towerPanel.classList.remove("hidden");
    ui.towerPanelBody.innerHTML = `
      <div><strong>${tower.name}</strong> (Lv.${tower.level})</div>
      <div class="card-meta">HP: ${Math.floor(tower.hp)}/${Math.floor(tower.maxHp)} | Armor: ${Math.floor(tower.armor)}</div>
      <div class="card-meta">Damage: ${Math.floor(tower.getEffectiveDamage())} | Range: ${Math.floor(tower.getEffectiveRange())}</div>
      <div class="card-meta">AttackSpeed: ${(tower.attackSpeed * tower.activeMultipliers.speed).toFixed(2)} | Projectile: ${Math.floor(tower.projectileSpeed)}</div>
      <div class="card-meta">Special: ${tower.special.piercingShots ? "Xuyên" : "-"} ${tower.special.multiTarget ? "| Đa mục tiêu" : ""} ${tower.special.extraSplash ? "| Nổ lan" : ""}</div>
    `;

    const upgradePrice = tower.getUpgradePrice();
    ui.btnUpgradeTower.disabled = !upgradePrice || state.supplies < upgradePrice;
    ui.btnUpgradeTower.textContent = upgradePrice ? `Nâng cấp (${upgradePrice})` : "Đã max";

    const repairPrice = tower.getRepairCost();
    ui.btnRepairTower.disabled = tower.hp >= tower.maxHp || state.supplies < repairPrice;
    ui.btnRepairTower.textContent = `Sửa (${repairPrice})`;
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
    ui.wave.textContent = `${state.wave}/${App.config.wave.maxWavePerLevel}`;
    ui.level.textContent = `${state.level}`;
    ui.enemiesLeft.textContent = `${state.enemies.filter((e) => e.hp > 0).length + state.spawnQueue.length}`;

    if (state.wavePhase === "prep") {
      ui.waveState.textContent = `Chuẩn bị wave ${state.wave}: ${state.prepTimer.toFixed(1)}s`;
    } else if (state.wavePhase === "combat") {
      ui.waveState.textContent = `Wave ${state.wave} đang diễn ra`;
    } else if (state.wavePhase === "ended") {
      ui.waveState.textContent = "Màn đã kết thúc";
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
    App.skillSystem.refreshUI(state);
  }

  function showResult(state) {
    ui.resultModal.classList.remove("hidden");

    if (state.result.state === "gameOver") {
      ui.resultTitle.textContent = "Game Over";
    } else if (state.result.state === "victory") {
      ui.resultTitle.textContent = "Chiến dịch hoàn tất";
    } else {
      ui.resultTitle.textContent = "Qua màn";
    }

    ui.resultStats.innerHTML = `
      <p>${state.result.reason || ""}</p>
      <p>Thời gian chơi: <strong>${formatTime(state.stats.playSeconds)}</strong></p>
      <p>Số câu đúng: <strong>${state.stats.correctAnswers}</strong> | Sai: <strong>${state.stats.wrongAnswers}</strong></p>
      <p>Trụ đã xây: <strong>${state.stats.towersBuilt}</strong></p>
      <p>Địch tiêu diệt: <strong>${state.stats.enemiesKilled}</strong></p>
      <p>Wave hoàn thành: <strong>${state.stats.wavesCleared}</strong></p>
    `;

    ui.btnNextLevel.classList.add("hidden");
    if (state.result.state === "levelClear" && state.level < 3) {
      ui.btnNextLevel.classList.remove("hidden");
    }
  }

  function hideResult() {
    ui.resultModal.classList.add("hidden");
  }

  App.uiSystem = {
    init,
    update,
    showResult,
    hideResult,
    renderTowerPanel,
  };
})();
