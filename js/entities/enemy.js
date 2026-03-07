(function () {
  const App = (window.App = window.App || {});

  let enemyIdSeed = 1;

  class Enemy {
    constructor(type, waveSpec) {
      const def = App.enemiesData[type];
      const config = App.config;
      const level = waveSpec.level;
      const globalWave = waveSpec.globalWave;

      this.id = `enemy-${enemyIdSeed++}`;
      this.type = type;
      this.name = def.name;
      this.color = def.color;
      this.isBoss = !!def.isBoss;
      this.isMiniBoss = !!def.isMiniBoss;

      this.pathIndex = 0;
      this.pathProgress = 0;
      this.pathDistance = 0;
      this.x = 0;
      this.y = 0;
      this.radius = this.isBoss ? 20 : this.isMiniBoss ? 17 : 13;

      const hpScale = Math.pow(config.scaling.hpExponent, globalWave);
      const damageScale = Math.pow(config.scaling.damageExponent, globalWave);
      const armorScaleAdd = Math.floor(globalWave / config.scaling.armorStepWave);
      const speedScale = 1 + globalWave * config.scaling.speedStep;

      let hp = def.hp * hpScale;
      let damage = def.damage * damageScale;
      let armor = def.armor + armorScaleAdd;
      let speed = def.speed * speedScale;

      if (this.isBoss) {
        const bossHp = def.hp * Math.pow(config.scaling.bossHpExponent, level);
        const bossDmg = def.damage * Math.pow(config.scaling.bossDamageExponent, level);
        hp = Math.max(hp, bossHp);
        damage = Math.max(damage, bossDmg);
        armor += level * 8;
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

      this.reward = Math.floor(def.reward * (1 + globalWave * 0.06));

      this.buffs = {
        speedMult: 1,
        damageMult: 1,
      };

      this.targetId = null;
      this.targetType = null;
      this.reachedBase = false;
      this.dead = false;

      this.phase = 1;
      this.abilityTimers = {
        summon: 10,
        missile: 7,
        shockwave: 9,
        armorMode: 11,
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
      const extra = this.isBoss && this.abilityTimers.armorModeActive > 0 ? 80 : 0;
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
