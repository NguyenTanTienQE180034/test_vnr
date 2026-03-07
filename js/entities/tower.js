(function () {
  const App = (window.App = window.App || {});

  let towerIdSeed = 1;

  class Tower {
    constructor(type, x, y) {
      const def = App.towersData[type];
      this.id = `tower-${towerIdSeed++}`;
      this.type = type;
      this.name = def.name;
      this.x = x;
      this.y = y;
      this.radius = 18;
      this.color = def.color;

      this.maxHp = def.hp;
      this.hp = def.hp;
      this.armor = def.armor;

      this.damage = def.damage;
      this.range = def.range;
      this.attackSpeed = def.attackSpeed;
      this.cooldown = 0;
      this.projectileSpeed = def.projectileSpeed;
      this.splashRadius = def.splashRadius || 0;

      this.level = 1;
      this.cost = def.cost;
      this.upgradeCost = [...def.upgradeCost];
      this.targetMode = def.targetMode || "progress";
      this.projectileType = def.projectileType;
      this.damageType = def.damageType || "kinetic";
      this.role = def.role;
      this.buffs = {};

      this.baseStats = {
        damage: def.damage,
        range: def.range,
        attackSpeed: def.attackSpeed,
        projectileSpeed: def.projectileSpeed,
        splashRadius: def.splashRadius || 0,
      };

      this.activeMultipliers = {
        damage: 1,
        speed: 1,
        range: 1,
      };

      this.special = {
        piercingShots: false,
        extraSplash: false,
        multiTarget: false,
        auraRadiusBonus: 0,
      };

      this.stunnedTimer = 0;

      this.isSupport = type === "command";
      this.isBarricade = type === "barricade";

      if (this.isSupport) {
        const aura = def.aura;
        this.aura = {
          radius: aura.radius,
          damageMult: aura.damageMult,
          speedMult: aura.speedMult,
          rangeMult: aura.rangeMult,
        };
      }
    }

    getUpgradePrice() {
      if (this.level >= 3) {
        return null;
      }
      return this.upgradeCost[this.level - 1];
    }

    canUpgrade() {
      return this.level < 3;
    }

    upgrade() {
      if (!this.canUpgrade()) {
        return;
      }

      this.level += 1;

      const levelDamageMultiplier = this.level === 2 ? 1.6 : 2.5;
      const levelRangeMultiplier = 1 + (this.level - 1) * 0.15;
      const levelAttackSpeedMultiplier = 1 + (this.level - 1) * 0.2;
      const projectileMultiplier = 1 + (this.level - 1) * 0.15;
      const splashMultiplier = 1 + (this.level - 1) * 0.2;

      this.damage = this.baseStats.damage * levelDamageMultiplier;
      this.range = this.baseStats.range * levelRangeMultiplier;
      this.attackSpeed = this.baseStats.attackSpeed * levelAttackSpeedMultiplier;
      this.projectileSpeed = this.baseStats.projectileSpeed * projectileMultiplier;
      this.splashRadius = this.baseStats.splashRadius * splashMultiplier;
      this.maxHp *= 1.25;
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.25);

      if (this.type === "machineGun" && this.level === 3) {
        this.special.piercingShots = true;
      }
      if (this.type === "cannon" && this.level === 3) {
        this.special.extraSplash = true;
        this.splashRadius *= 1.25;
      }
      if (this.type === "missile" && this.level === 3) {
        this.special.multiTarget = true;
      }
      if (this.type === "command" && this.level === 3 && this.aura) {
        this.special.auraRadiusBonus = 60;
        this.aura.radius += 60;
      }
    }

    repair(amount) {
      this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    setStun(seconds) {
      this.stunnedTimer = Math.max(this.stunnedTimer, seconds);
    }

    tick(dt) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      this.stunnedTimer = Math.max(0, this.stunnedTimer - dt);
    }

    isReadyToFire() {
      return this.cooldown <= 0 && this.attackSpeed > 0 && this.stunnedTimer <= 0;
    }

    markFired() {
      if (this.attackSpeed <= 0) {
        this.cooldown = 999;
        return;
      }
      const attacksPerSecond = this.attackSpeed * this.activeMultipliers.speed;
      this.cooldown = 1 / attacksPerSecond;
    }

    setAuraMultipliers(mult) {
      this.activeMultipliers.damage = mult.damage;
      this.activeMultipliers.speed = mult.speed;
      this.activeMultipliers.range = mult.range;
    }

    resetAuraMultipliers() {
      this.activeMultipliers.damage = 1;
      this.activeMultipliers.speed = 1;
      this.activeMultipliers.range = 1;
    }

    getEffectiveDamage() {
      return this.damage * this.activeMultipliers.damage;
    }

    getEffectiveRange() {
      return this.range * this.activeMultipliers.range;
    }

    getSellValue() {
      const spent = this.cost + this.upgradeCost.slice(0, this.level - 1).reduce((a, b) => a + b, 0);
      return Math.floor(spent * 0.65);
    }

    getRepairCost() {
      const missingRatio = (this.maxHp - this.hp) / this.maxHp;
      return Math.max(12, Math.floor(this.cost * missingRatio * 0.65));
    }
  }

  App.Tower = Tower;
})();
