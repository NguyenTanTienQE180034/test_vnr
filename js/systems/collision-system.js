(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  function calcRealDamage(rawDamage, armor) {
    // Combat formula required by docs: damage * (100 / (100 + armor))
    return rawDamage * (100 / (100 + Math.max(0, armor)));
  }

  function getEnemyById(state, id) {
    return state.enemies.find((e) => e.id === id && e.hp > 0);
  }

  function getTowerById(state, id) {
    return state.towers.find((t) => t.id === id && t.hp > 0);
  }

  function applyDamageToEnemy(state, enemy, rawDamage, damageType, sourceRole) {
    if (!enemy || enemy.hp <= 0) {
      return 0;
    }

    let finalDamage = rawDamage;

    if (
      damageType === "explosive" &&
      (enemy.type === "tank" || enemy.type === "apcVehicle" || enemy.type === "miniBoss" || enemy.type === "shieldBearer" || enemy.type === "mortarTruck")
    ) {
      finalDamage *= 1.25;
    }

    if (sourceRole === "anti-infantry" && (enemy.type === "basicSoldier" || enemy.type === "fastScout")) {
      finalDamage *= 1.2;
    }

    const dealt = calcRealDamage(finalDamage, enemy.getArmor());
    enemy.takeDamage(dealt);

    App.Effects.addHit(state, enemy.x, enemy.y, "#ffd08c");
    App.Effects.addFloatingText(state, enemy.x + 8, enemy.y - 6, `-${Math.floor(dealt)}`, "#ffe2a9");

    if (enemy.hp <= 0) {
      state.supplies += enemy.reward;
      state.stats.enemiesKilled += 1;
      App.Effects.addExplosion(state, enemy.x, enemy.y, enemy.isBoss ? 34 : 20, "rgba(255,140,120,0.65)");
    }

    return dealt;
  }

  function applyDamageToTower(state, tower, rawDamage) {
    if (!tower || tower.hp <= 0) {
      return 0;
    }

    const dealt = calcRealDamage(rawDamage, tower.armor);
    tower.hp = Math.max(0, tower.hp - dealt);
    App.Effects.addHit(state, tower.x, tower.y, "#ff8e95");
    App.Effects.addFloatingText(state, tower.x + 8, tower.y - 6, `-${Math.floor(dealt)}`, "#ff8e95");

    if (tower.hp <= 0) {
      App.Effects.addExplosion(state, tower.x, tower.y, 24, "rgba(255,95,120,0.65)");
      state.bus.emit(config.eventNames.TOWER_DESTROYED, { towerId: tower.id });
      if (state.selectedTowerId === tower.id) {
        state.selectedTowerId = null;
      }
    }

    return dealt;
  }

  function applyDamageToBase(state, rawDamage) {
    const dealt = calcRealDamage(rawDamage, state.base.armor);
    state.base.damage(dealt);
    state.stats.damageToBase += dealt;
    App.Effects.addFloatingText(state, state.base.x - 12, state.base.y - 30, `-${Math.floor(dealt)}`, "#ff9bb6");
    state.bus.emit(config.eventNames.BASE_DAMAGED, { damage: dealt });
    return dealt;
  }

  function resolveProjectileHit(state, projectile) {
    if (projectile.toType === "enemy") {
      const enemy = getEnemyById(state, projectile.toId);
      if (enemy) {
        if (projectile.splashRadius > 0) {
          for (const e of state.enemies) {
            if (!e.isAlive()) {
              continue;
            }
            const d = App.map.distance(e, enemy);
            if (d <= projectile.splashRadius) {
              applyDamageToEnemy(state, e, projectile.damage, projectile.damageType, projectile.sourceRole);
              if (projectile.type === "missile") {
                e.debuff.slowTimer = Math.max(e.debuff.slowTimer, 0.35);
              }
            }
          }
          App.Effects.addExplosion(state, enemy.x, enemy.y, projectile.splashRadius * 0.35, "rgba(255,186,102,0.55)");
        } else {
          applyDamageToEnemy(state, enemy, projectile.damage, projectile.damageType, projectile.sourceRole);
        }

        if (projectile.piercing && projectile.remainingPierce > 0) {
          projectile.remainingPierce -= 1;
          projectile.toId = "";
          const chainRange = projectile.type === "laser" ? 170 : 80;
          const next = state.enemies.find((e) => e.isAlive() && App.map.distance(e, projectile) < chainRange);
          if (next) {
            projectile.toId = next.id;
            projectile.targetRef = next;
            projectile.targetX = next.x;
            projectile.targetY = next.y;
            return;
          }
        }
      }
      projectile.alive = false;
      return;
    }

    if (projectile.toType === "tower") {
      const tower = getTowerById(state, projectile.toId);
      if (tower) {
        if (projectile.splashRadius > 0) {
          for (const t of state.towers) {
            if (t.hp <= 0) {
              continue;
            }
            const d = App.map.distance(t, tower);
            if (d <= projectile.splashRadius) {
              applyDamageToTower(state, t, projectile.damage);
            }
          }
          if (App.map.distance(state.base, tower) <= projectile.splashRadius) {
            applyDamageToBase(state, projectile.damage * 0.4);
          }
          App.Effects.addExplosion(state, tower.x, tower.y, projectile.splashRadius * 0.33, "rgba(255,120,120,0.55)");
        } else {
          applyDamageToTower(state, tower, projectile.damage);
        }
      }
      projectile.alive = false;
      return;
    }

    if (projectile.toType === "base") {
      if (projectile.splashRadius > 0) {
        for (const tower of state.towers) {
          if (tower.hp <= 0) {
            continue;
          }
          if (App.map.distance(tower, state.base) <= projectile.splashRadius + 45) {
            applyDamageToTower(state, tower, projectile.damage * 0.5);
          }
        }
      }
      applyDamageToBase(state, projectile.damage);
      App.Effects.addExplosion(state, state.base.x, state.base.y, 28, "rgba(255,95,140,0.6)");
      projectile.alive = false;
    }
  }

  function updateProjectiles(state, dt) {
    for (const projectile of state.projectiles) {
      if (!projectile.alive) {
        continue;
      }
      const arrived = projectile.update(dt);
      if (arrived) {
        resolveProjectileHit(state, projectile);
      }
    }

    state.projectiles = state.projectiles.filter((p) => p.alive);
    state.towers = state.towers.filter((t) => t.hp > 0);
    state.enemies = state.enemies.filter((e) => e.isAlive());
  }

  App.collisionSystem = {
    calcRealDamage,
    applyDamageToEnemy,
    applyDamageToTower,
    applyDamageToBase,
    updateProjectiles,
    getEnemyById,
    getTowerById,
  };
})();
