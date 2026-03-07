(function () {
  const App = (window.App = window.App || {});

  const ui = {
    skillList: null,
    skillButtons: {},
  };

  function buildSkillCards() {
    const entries = Object.values(App.config.skills);
    ui.skillList.innerHTML = "";
    ui.skillButtons = {};

    for (const skill of entries) {
      const card = document.createElement("div");
      card.className = "skill-card";

      const btn = document.createElement("button");
      btn.className = "btn btn-small btn-primary";
      btn.textContent = `Dùng (${skill.costCP} CP)`;
      btn.addEventListener("click", () => useSkill(App.state, skill.id));

      card.innerHTML = `
        <strong>${skill.name}</strong>
        <div class="card-meta">${skill.description}</div>
        <div class="card-meta" id="skill-cd-${skill.id}">CD: sẵn sàng</div>
      `;
      card.appendChild(btn);

      ui.skillButtons[skill.id] = {
        button: btn,
        cdText: card.querySelector(`#skill-cd-${skill.id}`),
      };

      ui.skillList.appendChild(card);
    }
  }

  function isOnCooldown(state, skillId) {
    return state.skills.cooldowns[skillId] > 0;
  }

  function spendSkillCost(state, skillId) {
    const cfg = App.config.skills[skillId];
    if (state.commandPoints < cfg.costCP) {
      return false;
    }
    if (isOnCooldown(state, skillId)) {
      return false;
    }
    state.commandPoints -= cfg.costCP;
    state.skills.cooldowns[skillId] = cfg.cooldown;
    return true;
  }

  function useSkill(state, skillId) {
    if (state.mode !== "playing" || state.paused) {
      return;
    }

    if (skillId === "artilleryStrike") {
      if (!spendSkillCost(state, skillId)) {
        App.Effects.addFloatingText(state, 26, 96, "Không đủ CP hoặc đang cooldown.", "#ff8899");
        return;
      }
      state.skills.activeTargetSkill = skillId;
      App.Effects.addFloatingText(state, 30, 120, "Chọn điểm pháo kích trên bản đồ", "#9cd6ff");
      return;
    }

    if (skillId === "emergencyRepair") {
      if (!spendSkillCost(state, skillId)) {
        App.Effects.addFloatingText(state, 26, 96, "Không đủ CP hoặc đang cooldown.", "#ff8899");
        return;
      }
      const cfg = App.config.skills.emergencyRepair;
      state.base.heal(cfg.healBase);
      for (const tower of state.towers) {
        tower.repair(cfg.healTower);
      }
      App.Effects.addFloatingText(state, state.base.x - 16, state.base.y - 40, "+Emergency Repair", "#7cff9e");
      return;
    }

    if (skillId === "moraleBoost") {
      if (!spendSkillCost(state, skillId)) {
        App.Effects.addFloatingText(state, 26, 96, "Không đủ CP hoặc đang cooldown.", "#ff8899");
        return;
      }
      const cfg = App.config.skills.moraleBoost;
      state.skills.moraleBoostTimer = cfg.duration;
      App.Effects.addFloatingText(state, 34, 118, "Toàn quân tăng sĩ khí!", "#7cd8ff");
    }
  }

  function castTargetSkill(state, x, y) {
    const active = state.skills.activeTargetSkill;
    if (!active) {
      return false;
    }

    if (active === "artilleryStrike") {
      const cfg = App.config.skills.artilleryStrike;
      for (const enemy of state.enemies) {
        if (!enemy.isAlive()) {
          continue;
        }
        const d = App.map.distance(enemy, { x, y });
        if (d <= cfg.radius) {
          App.collisionSystem.applyDamageToEnemy(state, enemy, cfg.damage, "explosive", "skill");
        }
      }
      App.Effects.addExplosion(state, x, y, cfg.radius * 0.4, "rgba(255,118,98,0.65)");
      state.boss.shakeTimer = 0.25;
    }

    state.skills.activeTargetSkill = null;
    return true;
  }

  function update(state, dt) {
    for (const key of Object.keys(state.skills.cooldowns)) {
      state.skills.cooldowns[key] = Math.max(0, state.skills.cooldowns[key] - dt);
    }
    state.skills.moraleBoostTimer = Math.max(0, state.skills.moraleBoostTimer - dt);
  }

  function refreshUI(state) {
    for (const [skillId, refs] of Object.entries(ui.skillButtons)) {
      const cd = state.skills.cooldowns[skillId] || 0;
      refs.cdText.textContent = cd > 0 ? `CD: ${cd.toFixed(1)}s` : "CD: sẵn sàng";
      refs.button.disabled = cd > 0 || state.commandPoints < App.config.skills[skillId].costCP;
      if (state.skills.activeTargetSkill === skillId) {
        refs.button.textContent = "Đang chọn mục tiêu...";
      } else {
        refs.button.textContent = `Dùng (${App.config.skills[skillId].costCP} CP)`;
      }
    }
  }

  function init(dom) {
    ui.skillList = dom.skillList;
    buildSkillCards();
  }

  App.skillSystem = {
    init,
    useSkill,
    castTargetSkill,
    update,
    refreshUI,
  };
})();
