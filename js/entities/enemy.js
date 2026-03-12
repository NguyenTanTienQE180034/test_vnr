(function () {
  const App = (window.App = window.App || {});

  let enemyIdSeed = 1;

  class Enemy {
    constructor(type, waveSpec) {
      const def = App.enemiesData[type];
      const config = App.config;
      const safeWave = waveSpec || { wave: 1, globalWave: 1 };
      const globalWave = safeWave.globalWave || safeWave.wave || 1;
      const waveIndex = Math.max(0, globalWave - 1);

      this.id = `enemy-${enemyIdSeed++}`;
      this.type = type;
      this.name = def.name;
      this.color = def.color;
      this.visualType = def.visualType || "infantry";
      this.isBoss = !!def.isBoss;
      this.isMiniBoss = !!def.isMiniBoss;

      this.pathIndex = 0;
      this.pathProgress = 0;
      this.pathDistance = 0;
      this.x = 0;
      this.y = 0;
      this.radius = this.isBoss
        ? 24
        : this.visualType === "tank"
          ? 15
          : this.visualType === "vehicle" || this.visualType === "rocket" || this.visualType === "mortar"
            ? 14
            : this.visualType === "drone"
              ? 10
              : this.visualType === "shield"
                ? 14
                : 13;

      const scaling = config.scaling || {};
      const hpGrowth = this.isBoss
        ? scaling.bossHpGrowth ?? 1.22
        : scaling.enemyHpGrowth ?? 1.18;
      const damageGrowth = this.isBoss
        ? scaling.bossDamageGrowth ?? 1.12
        : scaling.enemyDamageGrowth ?? 1.1;
      const speedGrowthPerWave = this.isBoss
        ? scaling.bossSpeedGrowthPerWave ?? 0.01
        : scaling.enemySpeedGrowthPerWave ?? 0.012;
      const armorStep = this.isBoss
        ? scaling.bossArmorStep ?? 4
        : scaling.enemyArmorStep ?? 2;
      const armorEvery = Math.max(
        1,
        this.isBoss
          ? scaling.bossArmorEvery ?? 2
          : scaling.enemyArmorEvery ?? 3,
      );

      const hpScale = Math.pow(hpGrowth, waveIndex);
      const damageScale = Math.pow(damageGrowth, waveIndex);
      const speedScale = 1 + waveIndex * speedGrowthPerWave;
      const armorBonus = Math.floor(waveIndex / armorEvery) * armorStep;

      let hp = def.hp * hpScale;
      let damage = def.damage * damageScale;
      let armor = def.armor + armorBonus;
      let speed = def.speed * speedScale;

      this.bossLevel = this.isBoss ? Math.max(1, Math.ceil(globalWave / 2)) : 0;
      if (this.isBoss) {
        const bossDifficultyStep = Math.min(6, waveIndex);
        const hpMultiplier = 0.58 + bossDifficultyStep * 0.11;
        const damageMultiplier = 0.52 + bossDifficultyStep * 0.085;
        const speedMultiplier = 0.66 + bossDifficultyStep * 0.02;
        const armorGrowth = Math.floor(bossDifficultyStep / 2) * 6;

        hp = def.hp * hpMultiplier;
        damage = def.damage * damageMultiplier;
        armor = def.armor + armorGrowth;
        speed = def.speed * speedMultiplier;

        // Keep boss difficulty ramp stable across different boss archetypes.
        const hpFloorByWave = 3000 + bossDifficultyStep * 700;
        const damageFloorByWave = 92 + bossDifficultyStep * 18;
        const armorFloorByWave = 60 + bossDifficultyStep * 6;
        hp = Math.max(hp, hpFloorByWave);
        damage = Math.max(damage, damageFloorByWave);
        armor = Math.max(armor, armorFloorByWave);
        const speedCapByWave = 34 + bossDifficultyStep * 2.2;
        speed = Math.min(speed, speedCapByWave);

        this.bossArmorModeBonus =
          36 + Math.floor(bossDifficultyStep / 2) * 6;

        const abilityTempoScale = Math.max(
          0.74,
          1 - bossDifficultyStep * 0.045,
        );
        this.bossAbilityCooldowns = {
          summon: Math.max(6.5, 10 * abilityTempoScale),
          missile: Math.max(5, 7.2 * abilityTempoScale),
          shockwave: Math.max(6.5, 9.2 * abilityTempoScale),
          armorMode: Math.max(7.5, 11.4 * abilityTempoScale),
        };
      } else {
        this.bossArmorModeBonus = 0;
        this.bossAbilityCooldowns = {
          summon: 10,
          missile: 7,
          shockwave: 9,
          armorMode: 11,
        };
      }

      this.maxHp = Math.floor(hp);
      this.hp = Math.floor(hp);
      this.armor = Math.floor(armor);
      this.speed = speed;
      this.damage = damage;

      this.baseAttackSpeed = def.attackSpeed;
      this.attackCooldown = 1 / Math.max(0.01, def.attackSpeed);
      this.attackTimer = 0;
      this.attackRange = def.attackRange;
      this.canAttackStructures = def.canAttackStructures;
      this.projectileType = def.projectileType;
      this.splashRadius = def.splashRadius || 0;

      this.reward = 0;

      this.buffs = {
        speedMult: 1,
        damageMult: 1,
      };

      this.targetId = null;
      this.targetType = null;
      this.reachedBase = false;
      this.dead = false;

      this.phase = 1;
      this.allowSummonMinions = false;
      const bossCooldowns = this.bossAbilityCooldowns;
      this.abilityTimers = {
        summon: bossCooldowns.summon,
        missile: bossCooldowns.missile,
        shockwave: bossCooldowns.shockwave,
        armorMode: bossCooldowns.armorMode,
        armorModeActive: 0,
      };

      this.debuff = {
        slowTimer: 0,
      };

      if (def.aura) {
        this.aura = {
          radius: def.aura.radius,
          speedMult: def.aura.speedMult,
          damageMult: def.aura.damageMult,
        };
      }
    }

    setPosition(x, y) {
      this.x = x;
      this.y = y;
    }

    tick(dt) {
      this.attackTimer = Math.max(0, this.attackTimer - dt);
      if (this.isBoss) {
        this.abilityTimers.summon = Math.max(0, this.abilityTimers.summon - dt);
        this.abilityTimers.missile = Math.max(0, this.abilityTimers.missile - dt);
        this.abilityTimers.shockwave = Math.max(0, this.abilityTimers.shockwave - dt);
        this.abilityTimers.armorMode = Math.max(0, this.abilityTimers.armorMode - dt);
        this.abilityTimers.armorModeActive = Math.max(0, this.abilityTimers.armorModeActive - dt);
      }
      this.debuff.slowTimer = Math.max(0, this.debuff.slowTimer - dt);
    }

    getSpeed() {
      const slowMult = this.debuff.slowTimer > 0 ? 0.55 : 1;
      return this.speed * this.buffs.speedMult * slowMult;
    }

    getDamage() {
      return this.damage * this.buffs.damageMult;
    }

    canShoot() {
      return this.attackTimer <= 0;
    }

    markShot() {
      const speed = Math.max(0.01, this.baseAttackSpeed);
      this.attackTimer = 1 / speed;
    }

    getArmor() {
      const extra =
        this.isBoss && this.abilityTimers.armorModeActive > 0
          ? this.bossArmorModeBonus
          : 0;
      return this.armor + extra;
    }

    updatePhase() {
      if (!this.isBoss) {
        return;
      }
      const hpRatio = this.hp / this.maxHp;
      if (hpRatio <= 0.35) {
        this.phase = 3;
      } else if (hpRatio <= 0.7) {
        this.phase = 2;
      } else {
        this.phase = 1;
      }
    }

    isAlive() {
      return !this.dead && this.hp > 0;
    }

    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      if (this.hp <= 0) {
        this.dead = true;
      }
    }
  }

  App.Enemy = Enemy;
})();
