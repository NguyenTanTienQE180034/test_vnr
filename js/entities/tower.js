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

      this.level = 1;
      this.cost = def.cost;
      this.upgradeCost = [...def.upgradeCost];
      this.targetMode = def.targetMode || "progress";
      this.projectileType = def.projectileType;
      this.damageType = def.damageType || "kinetic";
      this.role = def.role;
      this.buffs = {};

      this.baseStats = {
        hp: def.hp,
        armor: def.armor,
        damage: def.damage,
        range: def.range,
        attackSpeed: def.attackSpeed,
        projectileSpeed: def.projectileSpeed,
        splashRadius: def.splashRadius || 0,
      };

      this.levelScaling = def.levelScaling;
      this.pointUpgradeConfig = def.pointUpgrade;
      this.pointUpgradeLevels = {
        damage: 0,
        hp: 0,
        speed: 0,
      };

      this.maxHp = def.hp;
      this.hp = def.hp;
      this.armor = def.armor;
      this.damage = def.damage;
      this.range = def.range;
      this.attackSpeed = def.attackSpeed;
      this.projectileSpeed = def.projectileSpeed;
      this.splashRadius = def.splashRadius || 0;

      this.cooldown = 0;
      this.stunnedTimer = 0;

      this.activeMultipliers = {
        damage: 1,
        speed: 1,
        range: 1,
      };

      this.special = {
        piercingShots: false,
        pierceCount: 0,
        extraSplash: false,
        multiTarget: false,
        auraRadiusBonus: 0,
      };

      this.laserBeam = {
        active: false,
        targetId: "",
        endX: x,
        endY: y,
        timer: 0,
        duration: 0.12,
      };
      this.extraLaserBeams = [];

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

      if (def.defaultSpecial) {
        this.special.piercingShots = !!def.defaultSpecial.piercingShots;
        this.special.pierceCount = def.defaultSpecial.pierceCount || 0;
      }

      this.recomputeStats("init");
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

    recomputeStats(reason) {
      const oldMaxHp = this.maxHp;
      const idx = Math.max(0, this.level - 1);

      const levelDamageMultiplier = this.levelScaling.damage[idx];
      const levelHpMultiplier = this.levelScaling.hp[idx];
      const levelAttackSpeedMultiplier = this.levelScaling.attackSpeed[idx];
      const levelRangeMultiplier = this.levelScaling.range[idx];
      const projectileMultiplier = this.levelScaling.projectile[idx];
      const splashMultiplier = this.levelScaling.splash[idx];

      const dmgPoint = this.pointUpgradeConfig.damage;
      const hpPoint = this.pointUpgradeConfig.hp;
      const speedPoint = this.pointUpgradeConfig.speed;

      const dmgPointMultiplier = 1 + dmgPoint.growth * this.pointUpgradeLevels.damage;
      const hpPointMultiplier = 1 + hpPoint.growth * this.pointUpgradeLevels.hp;
      const speedPointMultiplier = 1 + speedPoint.growth * this.pointUpgradeLevels.speed;

      this.damage = this.baseStats.damage * levelDamageMultiplier * dmgPointMultiplier;
      this.range = this.baseStats.range * levelRangeMultiplier;
      this.attackSpeed = this.baseStats.attackSpeed * levelAttackSpeedMultiplier * speedPointMultiplier;
      this.projectileSpeed = this.baseStats.projectileSpeed * projectileMultiplier;
      this.splashRadius = this.baseStats.splashRadius * splashMultiplier;
      this.maxHp = this.baseStats.hp * levelHpMultiplier * hpPointMultiplier;
      this.armor = this.baseStats.armor + Math.floor((this.level - 1) * 4);

      if (reason === "upgrade") {
        const hpGain = Math.max(0, this.maxHp - oldMaxHp);
        this.hp = Math.min(this.maxHp, this.hp + hpGain * 0.65 + this.maxHp * 0.08);
      } else if (reason === "pointHp") {
        const hpGain = Math.max(0, this.maxHp - oldMaxHp);
        this.hp = Math.min(this.maxHp, this.hp + hpGain * 0.9);
      } else {
        this.hp = Math.min(this.maxHp, this.hp);
      }

      if (this.type === "machineGun" && this.level === 3) {
        this.special.piercingShots = true;
        this.special.pierceCount = Math.max(this.special.pierceCount, 1);
      }
      if (this.type === "laser" && this.level >= 2) {
        this.special.piercingShots = true;
        this.special.pierceCount = this.level === 2 ? 3 : 5;
      }
      if (this.type === "cannon" && this.level === 3) {
        this.special.extraSplash = true;
        this.splashRadius *= 1.15;
      }
      if (this.type === "missile" && this.level === 3) {
        this.special.multiTarget = true;
      }
      if (this.type === "command" && this.level === 3 && this.aura) {
        this.special.auraRadiusBonus = 60;
        this.aura.radius = App.towersData.command.aura.radius + 60;
      }
    }

    upgrade() {
      if (!this.canUpgrade()) {
        return;
      }

      this.level += 1;
      this.recomputeStats("upgrade");
    }

    canPointUpgrade(stat) {
      if (this.level < 3) {
        return false;
      }
      const cfg = this.pointUpgradeConfig[stat];
      if (!cfg) {
        return false;
      }
      return cfg.growth > 0 && cfg.costCP < 90;
    }

    getPointUpgradeCost(stat) {
      const cfg = this.pointUpgradeConfig[stat];
      if (!cfg) {
        return null;
      }
      const step = this.pointUpgradeLevels[stat] || 0;
      return cfg.costCP + Math.floor(step / 3);
    }

    upgradePointStat(stat) {
      if (!this.canPointUpgrade(stat)) {
        return false;
      }
      this.pointUpgradeLevels[stat] += 1;
      this.recomputeStats(stat === "hp" ? "pointHp" : "point");
      return true;
    }

    applyTechProfile(profile, reason) {
      if (!profile) {
        return;
      }
      this.level = profile.level || 1;
      this.pointUpgradeLevels = {
        damage: profile.pointUpgradeLevels?.damage || 0,
        hp: profile.pointUpgradeLevels?.hp || 0,
        speed: profile.pointUpgradeLevels?.speed || 0,
      };
      this.recomputeStats(reason || "init");
      if (reason === "init") {
        this.hp = this.maxHp;
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
      if (this.laserBeam.active) {
        this.laserBeam.timer = Math.max(0, this.laserBeam.timer - dt);
        if (this.laserBeam.timer <= 0) {
          this.clearLaserBeam();
        }
      }
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

    lockLaserBeam(beamData) {
      if (this.type !== "laser") {
        return;
      }
      const data = beamData && typeof beamData === "object" ? beamData : null;
      const beams = Array.isArray(data?.beams) ? data.beams : data ? [data] : [];
      const list = beams.filter((beam) => beam && typeof beam === "object");
      if (!list.length) {
        this.clearLaserBeam();
        return;
      }

      const primary = list[0];
      this.laserBeam.active = true;
      this.laserBeam.targetId = primary.targetId || "";
      this.laserBeam.endX = typeof primary.endX === "number" ? primary.endX : this.x;
      this.laserBeam.endY = typeof primary.endY === "number" ? primary.endY : this.y;
      this.laserBeam.duration = Math.min(0.75, Math.max(0.14, this.cooldown * 0.92 || 0.2));
      this.laserBeam.timer = this.laserBeam.duration;
      this.extraLaserBeams = list.slice(1).map((beam) => ({
        targetId: beam.targetId || "",
        endX: typeof beam.endX === "number" ? beam.endX : this.x,
        endY: typeof beam.endY === "number" ? beam.endY : this.y,
      }));
    }

    clearLaserBeam() {
      this.laserBeam.active = false;
      this.laserBeam.targetId = "";
      this.laserBeam.endX = this.x;
      this.laserBeam.endY = this.y;
      this.laserBeam.timer = 0;
      this.extraLaserBeams = [];
    }
  }

  App.Tower = Tower;
})();
