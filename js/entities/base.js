(function () {
  const App = (window.App = window.App || {});

  class Base {
    constructor(x, y, radius, maxHp, armor) {
      this.id = "base-main";
      this.type = "base";
      this.x = x;
      this.y = y;
      this.radius = radius;

      this.baseMaxHp = maxHp;
      this.baseArmor = armor;
      this.maxHp = maxHp;
      this.hp = maxHp;
      this.armor = armor;

      this.level = 1;
      this.hpBoostLevel = 0;
      this.healUsedThisWave = false;
    }

    canUpgradeLevel() {
      return this.level < 3;
    }

    getUpgradeLevelCost() {
      if (!this.canUpgradeLevel()) {
        return null;
      }
      const costs = App.config.base.upgradeCost;
      return costs[this.level - 1];
    }

    upgradeLevel() {
      if (!this.canUpgradeLevel()) {
        return false;
      }

      const oldMax = this.maxHp;
      this.level += 1;

      const hpMult = App.config.base.levelHpMultiplier[this.level - 1] || 1;
      const armorBonus = App.config.base.levelArmorBonus[this.level - 1] || 0;

      this.maxHp = this.baseMaxHp * hpMult + this.hpBoostLevel * App.config.base.hpBoostAmount;
      this.armor = this.baseArmor + armorBonus;

      const gain = Math.max(0, this.maxHp - oldMax);
      this.hp = Math.min(this.maxHp, this.hp + gain * 0.8);
      return true;
    }

    boostMaxHp() {
      this.hpBoostLevel += 1;
      this.maxHp += App.config.base.hpBoostAmount;
      this.hp = Math.min(this.maxHp, this.hp + App.config.base.hpBoostAmount * 0.9);
    }

    getHealAmount() {
      return this.maxHp * App.config.base.healPercent;
    }

    heal(amount) {
      this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    damage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      return this.hp;
    }
  }

  App.Base = Base;
})();
