(function () {
  const App = (window.App = window.App || {});

  const ui = {
    canvas: null,
    towerList: null,
  };

  function buildTowerCards(container) {
    container.innerHTML = "";

    for (const key of App.towerOrder) {
      const tower = App.towersData[key];
      const card = document.createElement("div");
      card.className = "tower-card";
      card.draggable = true;
      card.dataset.towerType = tower.type;
      card.innerHTML = `
        <div class="tower-card-head">
          <strong>${tower.name}</strong>
          <button class="btn btn-small tower-upgrade-quick" data-upgrade-type="${tower.type}" title="Nâng cấp nhanh trụ loại này">+</button>
        </div>
        <div class="card-meta">Cost: ${tower.cost} | DMG: ${tower.damage} | RNG: ${Math.floor(tower.range)}</div>
        <div class="card-meta">${tower.description}</div>
      `;

      card.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", tower.type);
        App.state.drag.activeTowerType = tower.type;
        card.classList.add("dragging");
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        const state = App.state;
        state.drag.activeTowerType = null;
      });

      const quickBtn = card.querySelector(".tower-upgrade-quick");
      if (quickBtn) {
        quickBtn.addEventListener("mousedown", (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
        quickBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (App.uiSystem && App.uiSystem.quickUpgradeByTowerType) {
            App.uiSystem.quickUpgradeByTowerType(tower.type);
          }
        });
      }

      container.appendChild(card);
    }
  }

  function getCanvasPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function tryPlaceTower(state, towerType, x, y) {
    const def = App.towersData[towerType];
    if (!def) {
      return { ok: false, message: "Loại trụ không tồn tại." };
    }

    const slot = App.map.findNearestFreeSlot(x, y, state.towers, state.level);
    if (!slot) {
      return { ok: false, message: "Vị trí không hợp lệ." };
    }

    if (state.supplies < def.cost) {
      return { ok: false, message: "Không đủ Supplies." };
    }

    const tower = new App.Tower(towerType, slot.x, slot.y);
    if (App.uiSystem && App.uiSystem.applyTowerTechToInstance) {
      App.uiSystem.applyTowerTechToInstance(state, tower, "init");
    }
    state.towers.push(tower);
    state.supplies -= def.cost;
    state.stats.towersBuilt += 1;
    App.Effects.addFloatingText(state, tower.x - 12, tower.y - 22, `-${def.cost}`, "#ffbfbf");

    return { ok: true, tower };
  }

  function onCanvasDragOver(event) {
    event.preventDefault();
    const state = App.state;
    if (state.mode !== "playing") {
      return;
    }

    const point = getCanvasPoint(event, ui.canvas);
    const type = event.dataTransfer.getData("text/plain") || state.drag.activeTowerType;
    state.drag.activeTowerType = type;
    state.drag.hoverX = point.x;
    state.drag.hoverY = point.y;
    const slot = App.map.findNearestFreeSlot(point.x, point.y, state.towers, state.level);
    state.drag.canPlace = !!slot;
  }

  function onCanvasDrop(event) {
    event.preventDefault();
    const state = App.state;
    if (state.mode !== "playing" || state.paused) {
      return;
    }

    const type = event.dataTransfer.getData("text/plain") || state.drag.activeTowerType;
    if (!type) {
      return;
    }

    const point = getCanvasPoint(event, ui.canvas);
    const result = tryPlaceTower(state, type, point.x, point.y);

    if (!result.ok) {
      App.Effects.addFloatingText(state, point.x - 20, point.y - 20, result.message, "#ff8d9b");
    }

    state.drag.activeTowerType = null;
    state.drag.canPlace = false;
  }

  function init(dom) {
    ui.canvas = dom.canvas;
    ui.towerList = dom.towerList;

    buildTowerCards(ui.towerList);

    ui.canvas.addEventListener("dragover", onCanvasDragOver);
    ui.canvas.addEventListener("drop", onCanvasDrop);
    ui.canvas.addEventListener("dragleave", () => {
      const state = App.state;
      state.drag.canPlace = false;
    });
  }

  App.dragDropSystem = {
    init,
    tryPlaceTower,
    getCanvasPoint,
  };
})();
