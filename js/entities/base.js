(function () {
  const App = (window.App = window.App || {});

  class Base {
    constructor(x, y, radius, maxHp, armor) {
      this.id = "base-main";
      this.type = "base";
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.maxHp = maxHp;
      this.hp = maxHp;
      this.armor = armor;
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
