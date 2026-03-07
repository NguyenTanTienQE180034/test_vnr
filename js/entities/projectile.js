(function () {
  const App = (window.App = window.App || {});

  let projectileIdSeed = 1;

  class Projectile {
    constructor(options) {
      this.id = `proj-${projectileIdSeed++}`;
      this.fromType = options.fromType;
      this.fromId = options.fromId;
      this.toType = options.toType;
      this.toId = options.toId;
      this.x = options.x;
      this.y = options.y;
      this.speed = options.speed;
      this.damage = options.damage;
      this.splashRadius = options.splashRadius || 0;
      this.type = options.type;
      this.damageType = options.damageType || "kinetic";
      this.color = options.color || "#ffffff";
      this.targetX = options.targetX;
      this.targetY = options.targetY;
      this.targetRef = options.targetRef || null;
      this.alive = true;
      this.piercing = !!options.piercing;
      this.remainingPierce = options.remainingPierce || 0;
      this.sourceRole = options.sourceRole || "";
      this.createdAt = performance.now();
    }

    update(dt) {
      if (this.targetRef && this.targetRef.hp > 0) {
        this.targetX = this.targetRef.x;
        this.targetY = this.targetRef.y;
      }

      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const step = this.speed * dt;

      if (step >= dist) {
        this.x = this.targetX;
        this.y = this.targetY;
        return true;
      }

      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      return false;
    }
  }

  App.Projectile = Projectile;
})();
