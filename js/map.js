(function () {
  const App = (window.App = window.App || {});

  const MAPS = {
    1: {
      name: "Tuyến cửa ngõ",
      spawn: { x: 30, y: 88 },
      base: { x: 928, y: 300, radius: 34 },
      path: [
        { x: 30, y: 88 },
        { x: 285, y: 88 },
        { x: 285, y: 220 },
        { x: 120, y: 220 },
        { x: 120, y: 388 },
        { x: 440, y: 388 },
        { x: 440, y: 520 },
        { x: 760, y: 520 },
        { x: 760, y: 300 },
        { x: 928, y: 300 },
      ],
      towerSlots: [
        { x: 120, y: 42 },
        { x: 230, y: 42 },
        { x: 170, y: 145 },
        { x: 250, y: 160 },
        { x: 330, y: 145 },
        { x: 200, y: 260 },
        { x: 70, y: 290 },
        { x: 160, y: 455 },
        { x: 300, y: 450 },
        { x: 370, y: 335 },
        { x: 500, y: 450 },
        { x: 540, y: 560 },
        { x: 620, y: 550 },
        { x: 690, y: 450 },
        { x: 810, y: 440 },
        { x: 820, y: 240 },
        { x: 700, y: 250 },
        { x: 900, y: 220 },
        { x: 885, y: 380 },
      ],
    },
    2: {
      name: "Vành đai áp lực",
      spawn: { x: 34, y: 520 },
      base: { x: 910, y: 110, radius: 34 },
      path: [
        { x: 34, y: 520 },
        { x: 280, y: 520 },
        { x: 280, y: 340 },
        { x: 90, y: 340 },
        { x: 90, y: 140 },
        { x: 430, y: 140 },
        { x: 430, y: 450 },
        { x: 690, y: 450 },
        { x: 690, y: 110 },
        { x: 910, y: 110 },
      ],
      towerSlots: [
        { x: 160, y: 560 },
        { x: 240, y: 430 },
        { x: 170, y: 250 },
        { x: 45, y: 240 },
        { x: 150, y: 90 },
        { x: 320, y: 100 },
        { x: 375, y: 240 },
        { x: 510, y: 190 },
        { x: 510, y: 340 },
        { x: 620, y: 520 },
        { x: 720, y: 360 },
        { x: 760, y: 210 },
        { x: 820, y: 70 },
        { x: 915, y: 190 },
        { x: 850, y: 300 },
        { x: 640, y: 80 },
      ],
    },
    3: {
      name: "Căn cứ quyết chiến",
      spawn: { x: 28, y: 300 },
      base: { x: 940, y: 300, radius: 36 },
      path: [
        { x: 28, y: 300 },
        { x: 240, y: 300 },
        { x: 240, y: 120 },
        { x: 480, y: 120 },
        { x: 480, y: 500 },
        { x: 700, y: 500 },
        { x: 700, y: 210 },
        { x: 820, y: 210 },
        { x: 820, y: 300 },
        { x: 940, y: 300 },
      ],
      towerSlots: [
        { x: 120, y: 360 },
        { x: 200, y: 220 },
        { x: 320, y: 80 },
        { x: 430, y: 210 },
        { x: 380, y: 360 },
        { x: 560, y: 410 },
        { x: 620, y: 540 },
        { x: 740, y: 420 },
        { x: 760, y: 280 },
        { x: 870, y: 170 },
        { x: 900, y: 260 },
        { x: 900, y: 370 },
        { x: 650, y: 190 },
        { x: 540, y: 240 },
        { x: 580, y: 90 },
        { x: 250, y: 470 },
      ],
    },
  };

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function findNearestFreeSlot(x, y, towers, level) {
    const map = MAPS[level] || MAPS[1];
    let best = null;

    for (const slot of map.towerSlots) {
      const occupied = towers.some((tower) => distance(tower, slot) < 8);
      if (occupied) {
        continue;
      }
      const d = distance({ x, y }, slot);
      if (d > 36) {
        continue;
      }
      if (!best || d < best.distance) {
        best = { slot, distance: d };
      }
    }

    return best ? best.slot : null;
  }

  App.map = {
    maps: MAPS,
    distance,
    findNearestFreeSlot,
    getMap(level) {
      return MAPS[level] || MAPS[1];
    },
  };
})();
