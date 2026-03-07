(function () {
  const App = (window.App = window.App || {});

  const Effects = {
    addFloatingText(state, x, y, text, color) {
      state.effects.push({
        type: "text",
        x,
        y,
        text,
        color,
        life: 1,
        maxLife: 1,
      });
    },

    addExplosion(state, x, y, radius, color) {
      state.effects.push({
        type: "explosion",
        x,
        y,
        radius,
        color,
        life: 0.35,
        maxLife: 0.35,
      });
    },

    addHit(state, x, y, color) {
      state.effects.push({
        type: "hit",
        x,
        y,
        color,
        life: 0.2,
        maxLife: 0.2,
      });
    },

    addMuzzle(state, x, y, color) {
      state.effects.push({
        type: "muzzle",
        x,
        y,
        color,
        life: 0.12,
        maxLife: 0.12,
      });
    },

    update(state, dt) {
      for (const fx of state.effects) {
        fx.life -= dt;
        if (fx.type === "text") {
          fx.y -= 26 * dt;
        }
      }
      state.effects = state.effects.filter((fx) => fx.life > 0);
    },

    draw(state, ctx) {
      for (const fx of state.effects) {
        const ratio = fx.life / fx.maxLife;

        if (fx.type === "text") {
          ctx.save();
          ctx.globalAlpha = ratio;
          ctx.fillStyle = fx.color;
          ctx.font = "bold 13px Trebuchet MS";
          ctx.fillText(fx.text, fx.x, fx.y);
          ctx.restore();
          continue;
        }

        if (fx.type === "explosion") {
          ctx.save();
          ctx.globalAlpha = Math.max(0, ratio * 0.9);
          ctx.beginPath();
          ctx.fillStyle = fx.color;
          ctx.arc(fx.x, fx.y, fx.radius * (1 + (1 - ratio)), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          continue;
        }

        if (fx.type === "hit" || fx.type === "muzzle") {
          ctx.save();
          ctx.globalAlpha = ratio;
          ctx.beginPath();
          ctx.fillStyle = fx.color;
          ctx.arc(fx.x, fx.y, fx.type === "hit" ? 7 * ratio : 5 * ratio, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    },
  };

  App.Effects = Effects;
})();
