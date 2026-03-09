(function () {
  const App = (window.App = window.App || {});

  function isOnCooldown(state, skillId) {
    return state.skills.cooldowns[skillId] > 0;
  }

  function spendSkillCost(state, skillId) {
    const cfg = App.config.skills[skillId];
    if (state.commandPoints < cfg.costCP) {
      return { ok: false, reason: "no-cp" };
    }
    if (isOnCooldown(state, skillId)) {
      return { ok: false, reason: "cooldown" };
    }
    state.commandPoints -= cfg.costCP;
    state.skills.cooldowns[skillId] = cfg.cooldown;
    return { ok: true };
  }

  function useSkill(state, skillId) {
    if (state.mode !== "playing" || state.paused) {
      return { ok: false, reason: "blocked" };
    }

    if (skillId === "artilleryStrike") {
      const payment = spendSkillCost(state, skillId);
      if (!payment.ok) {
        App.Effects.addFloatingText(state, 26, 96, "Khong du CP hoac dang hoi chieu.", "#ff8899");
        return payment;
      }
      state.skills.activeTargetSkill = skillId;
      App.Effects.addFloatingText(state, 30, 120, "Chon diem pha kich tren ban do", "#9cd6ff");
      return { ok: true, requiresTarget: true };
    }

    if (skillId === "emergencyRepair") {
      const payment = spendSkillCost(state, skillId);
      if (!payment.ok) {
        App.Effects.addFloatingText(state, 26, 96, "Khong du CP hoac dang hoi chieu.", "#ff8899");
        return payment;
      }
      const cfg = App.config.skills.emergencyRepair;
      state.base.heal(cfg.healBase);
      for (const tower of state.towers) {
        tower.repair(cfg.healTower);
      }
      App.Effects.addFloatingText(state, state.base.x - 16, state.base.y - 40, "+Tang vien khan cap", "#7cff9e");
      return { ok: true, requiresTarget: false };
    }

    if (skillId === "moraleBoost") {
      const payment = spendSkillCost(state, skillId);
      if (!payment.ok) {
        App.Effects.addFloatingText(state, 26, 96, "Khong du CP hoac dang hoi chieu.", "#ff8899");
        return payment;
      }
      const cfg = App.config.skills.moraleBoost;
      state.skills.moraleBoostTimer = cfg.duration;
      App.Effects.addFloatingText(state, 34, 118, "Toan quan tang si khi!", "#7cd8ff");
      return { ok: true, requiresTarget: false };
    }

    return { ok: false, reason: "unknown-skill" };
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

  function getSkillCards(state) {
    const cards = [];
    for (const skill of Object.values(App.config.skills)) {
      const cd = state.skills.cooldowns[skill.id] || 0;
      cards.push({
        id: skill.id,
        name: skill.name,
        description: skill.description,
        costCP: skill.costCP,
        cooldown: cd,
        ready: cd <= 0,
        enabled: cd <= 0 && state.commandPoints >= skill.costCP,
        activeTargeting: state.skills.activeTargetSkill === skill.id,
      });
    }
    return cards;
  }

  App.skillSystem = {
    useSkill,
    castTargetSkill,
    update,
    getSkillCards,
  };
})();
