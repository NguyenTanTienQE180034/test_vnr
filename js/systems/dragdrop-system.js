(function () {
  const App = (window.App = window.App || {});

  function getTowerCatalog() {
    return App.towerOrder.map((key) => {
      const tower = App.towersData[key];
      return {
        type: tower.type,
        name: tower.name,
        cost: tower.cost,
        damage: tower.damage,
        range: Math.floor(tower.range),
        description: tower.description,
        color: tower.color,
      };
    });
  }

  function canPlaceTowerAt(state, towerType, x, y) {
    const def = App.towersData[towerType];
    if (!def) {
      return false;
    }
    if (state.supplies < def.cost) {
      return false;
    }
    const slot = App.map.findNearestFreeSlot(x, y, state.towers, state.level);
    return !!slot;
  }

  function tryPlaceTower(state, towerType, x, y) {
    const def = App.towersData[towerType];
    if (!def) {
      return { ok: false, message: "Loai tru khong ton tai." };
    }

    const slot = App.map.findNearestFreeSlot(x, y, state.towers, state.level);
    if (!slot) {
      return { ok: false, message: "Vi tri khong hop le." };
    }

    if (state.supplies < def.cost) {
      return { ok: false, message: "Khong du tiep te." };
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

  App.dragDropSystem = {
    getTowerCatalog,
    canPlaceTowerAt,
    tryPlaceTower,
  };
})();
