(function () {
  const App = (window.App = window.App || {});
  const config = App.config;

  function spawnProjectile(state, options) {
    const projectile = new App.Projectile(options);
    state.projectiles.push(projectile);
    return projectile;
  }

  function applyCommandAuras(state) {
    for (const tower of state.towers) {
      tower.resetAuraMultipliers();
    }

    for (const support of state.towers) {
      if (!support.isSupport || support.hp <= 0 || !support.aura) {
        continue;
      }

      for (const target of state.towers) {
        if (target.id === support.id || target.hp <= 0) {
          continue;
        }

        const d = App.map.distance(support, target);
        if (d <= support.aura.radius) {
          target.setAuraMultipliers({
            damage: Math.max(target.activeMultipliers.damage, support.aura.damageMult),
            speed: Math.max(target.activeMultipliers.speed, support.aura.speedMult),
            range: Math.max(target.activeMultipliers.range, support.aura.rangeMult),
          });
        }
      }
    }

    if (state.skills.moraleBoostTimer > 0) {
      for (const tower of state.towers) {
        tower.activeMultipliers.speed *= config.skills.moraleBoost.attackSpeedMultiplier;
      }
    }
  }

  function applyCommanderAura(state) {
    for (const enemy of state.enemies) {
      enemy.buffs.speedMult = 1;
      enemy.buffs.damageMult = enemy.phase === 3 ? 1.35 : enemy.phase === 2 ? 1.15 : 1;
    }

    const commanders = state.enemies.filter((e) => e.type === "commander" && e.hp > 0);
    for (const commander of commanders) {
      if (!commander.aura) {
        continue;
      }
      for (const enemy of state.enemies) {
        if (enemy.id === commander.id || enemy.hp <= 0) {
          continue;
        }
        if (App.map.distance(enemy, commander) <= commander.aura.radius) {
          enemy.buffs.speedMult = Math.max(enemy.buffs.speedMult, commander.aura.speedMult);
          enemy.buffs.damageMult = Math.max(enemy.buffs.damageMult, commander.aura.damageMult);
        }
      }
    }
  }

  function getEnemyProgress(enemy) {
    return enemy.pathIndex + enemy.pathProgress;
  }

  function pickEnemyTargetForTower(tower, enemies) {
    const range = tower.getEffectiveRange();
    let candidate = null;

    for (const enemy of enemies) {
      if (!enemy.isAlive()) {
        continue;
      }
      const d = App.map.distance(tower, enemy);
      if (d > range) {
        continue;
      }
      if (!candidate || getEnemyProgress(enemy) > getEnemyProgress(candidate)) {
        candidate = enemy;
      }
    }

    return candidate;
  }

  function normalizeAngle(angle) {
    let a = angle;
    while (a <= -Math.PI) {
      a += Math.PI * 2;
    }
    while (a > Math.PI) {
      a -= Math.PI * 2;
    }
    return a;
  }

  function angleDiff(a, b) {
    const d = Math.abs(normalizeAngle(a - b));
    return d > Math.PI ? Math.PI * 2 - d : d;
  }

  function pickNearestEnemiesForTower(tower, enemies, count) {
    const range = tower.getEffectiveRange();
    return enemies
      .filter((enemy) => enemy.isAlive())
      .map((enemy) => ({
        enemy,
        dist: App.map.distance(tower, enemy),
      }))
      .filter((entry) => entry.dist <= range)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, Math.max(1, count || 1))
      .map((entry) => entry.enemy);
  }

  function pickLaserTargetsForTower(tower, enemies, count) {
    const range = tower.getEffectiveRange();
    const maxCount = Math.max(1, count || 1);
    const candidates = enemies
      .filter((enemy) => enemy.isAlive())
      .map((enemy) => {
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > range) {
          return null;
        }
        return {
          enemy,
          dist,
          angle: Math.atan2(dy, dx),
        };
      })
      .filter((entry) => !!entry)
      .sort((a, b) => a.dist - b.dist);

    if (!candidates.length) {
      return [];
    }
    if (candidates.length <= maxCount) {
      return candidates.map((entry) => entry.enemy);
    }

    const selected = [candidates.shift()];
    while (selected.length < maxCount && candidates.length > 0) {
      let bestIndex = 0;
      let bestScore = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < candidates.length; i += 1) {
        const candidate = candidates[i];
        let minSep = Number.POSITIVE_INFINITY;
        for (const picked of selected) {
          minSep = Math.min(minSep, angleDiff(candidate.angle, picked.angle));
        }
        const score = minSep * 1000 - candidate.dist;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      selected.push(candidates.splice(bestIndex, 1)[0]);
    }

    return selected.map((entry) => entry.enemy);
  }

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const lenSq = vx * vx + vy * vy;
    if (lenSq <= 0.0001) {
      const dx = px - x1;
      const dy = py - y1;
      return Math.sqrt(dx * dx + dy * dy);
    }
    let t = (wx * vx + wy * vy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * vx;
    const projY = y1 + t * vy;
    const dx = px - projX;
    const dy = py - projY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function laserHitscan(state, tower, primaryTarget, damage, options) {
    const range = tower.getEffectiveRange();
    const corridorWidth = tower.level >= 3 ? 30 : tower.level === 2 ? 24 : 18;
    const pierceCount = tower.special.piercingShots ? Math.max(1, tower.special.pierceCount || 1) : 0;
    const maxHits = 1 + pierceCount;

    const vx = primaryTarget.x - tower.x;
    const vy = primaryTarget.y - tower.y;
    const len = Math.sqrt(vx * vx + vy * vy) || 0.0001;
    const dirX = vx / len;
    const dirY = vy / len;
    const lineEndX = tower.x + dirX * range;
    const lineEndY = tower.y + dirY * range;

    const candidates = state.enemies
      .filter((enemy) => enemy.isAlive())
      .map((enemy) => {
        const proj = (enemy.x - tower.x) * dirX + (enemy.y - tower.y) * dirY;
        if (proj < -6 || proj > range + enemy.radius) {
          return null;
        }
        const d = pointToSegmentDistance(enemy.x, enemy.y, tower.x, tower.y, lineEndX, lineEndY);
        if (d > corridorWidth + enemy.radius * 0.35) {
          return null;
        }
        return {
          enemy,
          proj,
        };
      })
      .filter((item) => !!item)
      .sort((a, b) => a.proj - b.proj);

    const selected = [];
    for (const item of candidates) {
      selected.push(item);
      if (selected.length >= maxHits) {
        break;
      }
    }

    if (!selected.some((item) => item.enemy.id === primaryTarget.id)) {
      selected.unshift({ enemy: primaryTarget, proj: len });
      if (selected.length > maxHits) {
        selected.length = maxHits;
      }
    }

    for (const item of selected) {
      App.collisionSystem.applyDamageToEnemy(state, item.enemy, damage, tower.damageType, tower.role);
    }

    let farthestProj = len;
    for (const item of selected) {
      farthestProj = Math.max(farthestProj, item.proj);
    }

    const beamReach = Math.min(range, Math.max(len, farthestProj + 28));
    const endX = tower.x + dirX * beamReach;
    const endY = tower.y + dirY * beamReach;

    if (!options || !options.skipBeamLock) {
      tower.lockLaserBeam({
        targetId: primaryTarget.id,
        endX,
        endY,
      });
    }

  }

  function towerAttack(state, tower, primaryTarget) {
    if (!primaryTarget) {
      return;
    }

    const isCrit = Math.random() < config.combat.critChance;
    let damage = tower.getEffectiveDamage();
    if (isCrit) {
      damage *= config.combat.critMultiplier;
      App.Effects.addFloatingText(state, primaryTarget.x, primaryTarget.y - 18, "CRIT", "#ffd966");
    }

    App.Effects.addMuzzle(state, tower.x, tower.y, tower.color);

    if (tower.type === "laser") {
      laserHitscan(state, tower, primaryTarget, damage);
      tower.markFired();
      return;
    }

    const fireAt = (targetEnemy) => {
      if (!targetEnemy || !targetEnemy.isAlive()) {
        return;
      }
      spawnProjectile(state, {
        fromType: "tower",
        fromId: tower.id,
        towerType: tower.type,
        toType: "enemy",
        toId: targetEnemy.id,
        targetRef: targetEnemy,
        x: tower.x,
        y: tower.y,
        targetX: targetEnemy.x,
        targetY: targetEnemy.y,
        speed: tower.projectileSpeed,
        damage,
        splashRadius: tower.splashRadius,
        type: tower.projectileType,
        damageType: tower.damageType,
        color: tower.color,
        piercing: tower.special.piercingShots,
        remainingPierce: tower.special.piercingShots ? Math.max(1, tower.special.pierceCount || 1) : 0,
        visualLevel: tower.level,
        sourceRole: tower.role,
      });
    };

    fireAt(primaryTarget);

    if (tower.special.multiTarget) {
      const backupTargets = state.enemies
        .filter((enemy) => enemy.isAlive() && enemy.id !== primaryTarget.id)
        .filter((enemy) => App.map.distance(enemy, tower) <= tower.getEffectiveRange())
        .slice(0, 1);
      for (const target of backupTargets) {
        fireAt(target);
      }
    }

    tower.markFired();
  }

  function pickEnemyAttackTarget(state, enemy) {
    if (!enemy.canAttackStructures) {
      return null;
    }

    const inRange = (target) => App.map.distance(enemy, target) <= enemy.attackRange;

    // Priority follows docs: barricade > tower > base
    const barricades = state.towers.filter((t) => t.isBarricade && t.hp > 0 && inRange(t));
    if (barricades.length) {
      return { target: barricades[0], type: "tower" };
    }

    const towers = state.towers.filter((t) => t.hp > 0 && inRange(t));
    if (towers.length) {
      towers.sort((a, b) => App.map.distance(enemy, a) - App.map.distance(enemy, b));
      return { target: towers[0], type: "tower" };
    }

    if (inRange(state.base)) {
      return { target: state.base, type: "base" };
    }

    return null;
  }

  function enemyShoot(state, enemy, targetInfo) {
    if (!enemy.canShoot()) {
      return;
    }

    const target = targetInfo.target;
    App.Effects.addMuzzle(state, enemy.x, enemy.y, "#ff9086");
    spawnProjectile(state, {
      fromType: "enemy",
      fromId: enemy.id,
      toType: targetInfo.type,
      toId: target.id,
      targetRef: target,
      x: enemy.x,
      y: enemy.y,
      targetX: target.x,
      targetY: target.y,
      speed: enemy.projectileType === "laser" ? 640 : 300,
      damage: enemy.getDamage(),
      splashRadius: enemy.splashRadius,
      type: enemy.projectileType,
      damageType: enemy.projectileType === "missile" || enemy.projectileType === "shell" ? "explosive" : "kinetic",
      color: "#ffad92",
      visualLevel: enemy.isBoss ? 3 : 1,
    });
    enemy.markShot();
  }

  function moveEnemyOnPath(enemy, mapPath, dt) {
    if (enemy.pathIndex >= mapPath.length - 1) {
      return;
    }

    const current = mapPath[enemy.pathIndex];
    const next = mapPath[enemy.pathIndex + 1];

    const dx = next.x - enemy.x;
    const dy = next.y - enemy.y;
    const segLen = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    const step = enemy.getSpeed() * dt;

    if (step >= segLen) {
      enemy.x = next.x;
      enemy.y = next.y;
      enemy.pathIndex += 1;
      enemy.pathProgress = 0;
      if (enemy.pathIndex >= mapPath.length - 1) {
        enemy.reachedBase = true;
      }
      return;
    }

    enemy.x += (dx / segLen) * step;
    enemy.y += (dy / segLen) * step;
    enemy.pathProgress += step / segLen;
  }

  function handleBossAbilities(state, boss, mapPath) {
    boss.updatePhase();
    const cooldowns = boss.bossAbilityCooldowns || {
      summon: 10,
      missile: 7,
      shockwave: 9,
      armorMode: 11,
    };

    if (boss.phase === 3) {
      boss.buffs.speedMult = Math.max(boss.buffs.speedMult, 1.28);
      boss.buffs.damageMult = Math.max(boss.buffs.damageMult, 1.3);
    }

    if (boss.allowSummonMinions && boss.abilityTimers.summon <= 0) {
      const count = boss.phase === 1 ? 2 : boss.phase === 2 ? 3 : 4;
      for (let i = 0; i < count; i += 1) {
        const summonType = i % 2 === 0 ? "basicSoldier" : "fastScout";
        const waveSpec = state.currentWaveSpec || { wave: state.wave, globalWave: state.globalWave };
        const summon = new App.Enemy(summonType, waveSpec);
        summon.setPosition(mapPath[0].x, mapPath[0].y);
        state.enemies.push(summon);
      }
      boss.abilityTimers.summon = cooldowns.summon;
      App.Effects.addExplosion(state, boss.x, boss.y, 40, "rgba(255,120,120,0.4)");
    }

    if (boss.phase >= 2 && boss.abilityTimers.missile <= 0) {
      const abilityRange = boss.attackRange + 35;
      const targetTower = state.towers
        .filter((tower) => tower.hp > 0 && App.map.distance(tower, boss) <= abilityRange)
        .sort((a, b) => App.map.distance(a, boss) - App.map.distance(b, boss))[0];
      const baseInRange = App.map.distance(state.base, boss) <= abilityRange + 20;
      const target = targetTower || (baseInRange ? state.base : null);

      if (target) {
        spawnProjectile(state, {
          fromType: "enemy",
          fromId: boss.id,
          toType: target.id === state.base.id ? "base" : "tower",
          toId: target.id,
          targetRef: target,
          x: boss.x,
          y: boss.y,
          targetX: target.x,
          targetY: target.y,
          speed: 250,
          damage: boss.getDamage() * 1.15,
          splashRadius: 95,
          type: "missile",
          damageType: "explosive",
          color: "#ff6a74",
        });
        boss.abilityTimers.missile = cooldowns.missile;
      } else {
        // Retry soon when boss has moved closer instead of sniping from across the map.
        boss.abilityTimers.missile = 0.8;
      }
    }

    if (boss.abilityTimers.shockwave <= 0) {
      for (const tower of state.towers) {
        if (tower.hp <= 0) {
          continue;
        }
        const d = App.map.distance(tower, boss);
        if (d <= 130) {
          tower.setStun(2);
          App.Effects.addFloatingText(state, tower.x - 12, tower.y - 20, "CHOÁNG", "#ffb2bc");
        }
      }
      boss.abilityTimers.shockwave = cooldowns.shockwave;
      App.Effects.addExplosion(state, boss.x, boss.y, 54, "rgba(216,96,163,0.4)");
      state.boss.shakeTimer = 0.35;
    }

    if (boss.abilityTimers.armorMode <= 0) {
      boss.abilityTimers.armorMode = cooldowns.armorMode;
      boss.abilityTimers.armorModeActive = 3.6;
      App.Effects.addFloatingText(state, boss.x - 10, boss.y - 20, "GIÁP CƯỜNG HÓA", "#ffd699");
    }
  }

  function updateTowers(state, dt) {
    applyCommandAuras(state);

    for (const tower of state.towers) {
      tower.tick(dt);
      if (tower.hp <= 0 || tower.attackSpeed <= 0) {
        continue;
      }
      if (tower.type === "laser") {
        const beamCount = tower.level >= 3 ? 3 : tower.level === 2 ? 2 : 1;
        const targets = pickLaserTargetsForTower(tower, state.enemies, beamCount);
        if (!targets.length || tower.stunnedTimer > 0) {
          tower.clearLaserBeam();
          continue;
        }

        const range = tower.getEffectiveRange();
        const beams = targets.map((target) => {
          const vx = target.x - tower.x;
          const vy = target.y - tower.y;
          const len = Math.sqrt(vx * vx + vy * vy) || 0.0001;
          const dirX = vx / len;
          const dirY = vy / len;
          return {
            targetId: target.id,
            endX: tower.x + dirX * range,
            endY: tower.y + dirY * range,
          };
        });
        tower.lockLaserBeam({
          beams,
        });

        if (tower.isReadyToFire()) {
          const isCrit = Math.random() < config.combat.critChance;
          let damage = tower.getEffectiveDamage();
          if (isCrit) {
            damage *= config.combat.critMultiplier;
            App.Effects.addFloatingText(state, targets[0].x, targets[0].y - 18, "CRIT", "#ffd966");
          }

          App.Effects.addMuzzle(state, tower.x, tower.y, tower.color);
          for (const target of targets) {
            laserHitscan(state, tower, target, damage, { skipBeamLock: true });
          }
          tower.markFired();
        }
        continue;
      }
      if (!tower.isReadyToFire()) {
        continue;
      }

      const target = pickEnemyTargetForTower(tower, state.enemies);
      if (!target) {
        continue;
      }
      towerAttack(state, tower, target);
    }
  }

  function updateEnemies(state, dt) {
    const mapDef = App.map.getMap(state.level);
    const mapPath = mapDef.path;

    applyCommanderAura(state);

    const triggerBossBreach = (boss) => {
      if (state.mode !== "playing") {
        return;
      }
      state.mode = "result";
      state.result.state = "gameOver";
      state.result.reason = "Boss đã lọt vào căn cứ.";
      state.wavePhase = "ended";
      state.bus.emit(config.eventNames.GAME_OVER, {
        enemyId: boss.id,
        reason: "boss-breach",
      });
    };

    for (const enemy of state.enemies) {
      enemy.tick(dt);
      if (!enemy.isAlive()) {
        continue;
      }

      if (enemy.isBoss) {
        handleBossAbilities(state, enemy, mapPath);
      }

      const targetInfo = pickEnemyAttackTarget(state, enemy);

      if (targetInfo) {
        enemyShoot(state, enemy, targetInfo);
        if (enemy.isBoss) {
          // Boss keeps advancing while firing, instead of standing still.
          moveEnemyOnPath(enemy, mapPath, dt * 0.9);
          if (enemy.reachedBase) {
            triggerBossBreach(enemy);
            return;
          }
        }
        continue;
      }

      moveEnemyOnPath(enemy, mapPath, dt);

      if (enemy.reachedBase) {
        if (enemy.isBoss) {
          triggerBossBreach(enemy);
          return;
        }
        if (enemy.canAttackStructures) {
          if (enemy.canShoot()) {
            enemyShoot(state, enemy, { target: state.base, type: "base" });
          }
          continue;
        }
        App.collisionSystem.applyDamageToBase(state, enemy.getDamage());
        enemy.dead = true;
      }
    }
  }

  App.combatSystem = {
    update(state, dt) {
      updateTowers(state, dt);
      updateEnemies(state, dt);
      if (state.mode !== "playing") {
        return;
      }
      App.collisionSystem.updateProjectiles(state, dt);
    },
  };
})();
