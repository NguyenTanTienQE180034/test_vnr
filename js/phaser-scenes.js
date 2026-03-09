(function () {
    const App = (window.App = window.App || {});

    const VIEW = {
        width: 1320,
        height: 760,
        worldX: 20,
        worldY: 100,
        worldWidth: 980,
        worldHeight: 620,
        panelX: 1020,
        panelY: 100,
        panelWidth: 280,
        panelHeight: 620,
    };

    App.view = VIEW;
    App.modalState = App.modalState || { active: false, type: null };

    function isWorldPoint(screenX, screenY) {
        return (
            screenX >= VIEW.worldX &&
            screenX <= VIEW.worldX + VIEW.worldWidth &&
            screenY >= VIEW.worldY &&
            screenY <= VIEW.worldY + VIEW.worldHeight
        );
    }

    function screenToWorld(screenX, screenY) {
        return { x: screenX - VIEW.worldX, y: screenY - VIEW.worldY };
    }

    function worldToScreen(worldX, worldY) {
        return { x: VIEW.worldX + worldX, y: VIEW.worldY + worldY };
    }

    function parseColor(input, alpha) {
        if (typeof input === "number") {
            return { color: input, alpha: alpha == null ? 1 : alpha };
        }
        if (typeof input === "string" && input.startsWith("#")) {
            return {
                color: Number.parseInt(input.slice(1), 16),
                alpha: alpha == null ? 1 : alpha,
            };
        }
        if (typeof input === "string" && input.startsWith("rgba")) {
            const m = input.match(
                /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i,
            );
            if (m) {
                const r = Number.parseInt(m[1], 10);
                const g = Number.parseInt(m[2], 10);
                const b = Number.parseInt(m[3], 10);
                const a = Number.parseFloat(m[4]);
                return {
                    color: (r << 16) + (g << 8) + b,
                    alpha: alpha == null ? a : alpha,
                };
            }
        }
        return { color: 0xffffff, alpha: alpha == null ? 1 : alpha };
    }

    function makeButton(scene, options) {
        const bg = scene.add.rectangle(
            options.x,
            options.y,
            options.width,
            options.height,
            options.baseColor || 0x243f5d,
            1,
        );
        bg.setStrokeStyle(1, options.lineColor || 0x7ab0f4, 0.45);
        bg.setInteractive({ useHandCursor: true });
        const baseFontSize =
            Number.parseInt(String(options.fontSize || "14px"), 10) || 14;
        const text = scene.add
            .text(options.x, options.y, "", {
                fontFamily: "Trebuchet MS",
                fontSize: `${baseFontSize}px`,
                color: "#dce8f7",
            })
            .setOrigin(0.5);

        const fitLabel = (value) => {
            text.setText(value || "");
            let size = baseFontSize;
            text.setFontSize(size);
            const maxWidth = Math.max(24, (options.width || 120) - 12);
            while (text.width > maxWidth && size > 9) {
                size -= 1;
                text.setFontSize(size);
            }
        };

        const ref = {
            bg,
            text,
            enabled: true,
            setLabel(value) {
                fitLabel(value);
            },
            setEnabled(value) {
                ref.enabled = !!value;
                bg.setAlpha(ref.enabled ? 1 : 0.45);
                text.setAlpha(ref.enabled ? 1 : 0.5);
            },
            setVisible(value) {
                bg.setVisible(value);
                text.setVisible(value);
            },
            setDepth(value) {
                bg.setDepth(value);
                text.setDepth(value);
            },
            setPosition(x, y) {
                bg.setPosition(x, y);
                text.setPosition(x, y);
            },
            destroy() {
                bg.destroy();
                text.destroy();
            },
        };

        bg.on("pointerdown", () => {
            if (!ref.enabled) {
                return;
            }
            if (typeof options.onClick === "function") {
                options.onClick();
            }
        });

        fitLabel(options.label || "");

        return ref;
    }

    class BootScene extends Phaser.Scene {
        constructor() {
            super("BootScene");
        }

        preload() {
            this.load.image("flag-vn", "assets/ui/flag_vietnam.svg");
            this.load.image("flag-us", "assets/ui/flag_usa.svg");
        }

        create() {
            const done = () => {
                this.scene.start("MenuScene");
                if (!this.scene.isActive("ModalScene")) {
                    this.scene.launch("ModalScene");
                }
            };
            if (typeof App.loadQuestionsData === "function") {
                Promise.resolve(App.loadQuestionsData()).finally(done);
            } else {
                done();
            }
        }
    }

    class MenuScene extends Phaser.Scene {
        constructor() {
            super("MenuScene");
        }

        create() {
            this.add.rectangle(
                VIEW.width / 2,
                VIEW.height / 2,
                VIEW.width,
                VIEW.height,
                0x081019,
                1,
            );
            this.add
                .rectangle(
                    VIEW.width / 2,
                    VIEW.height / 2,
                    660,
                    420,
                    0x102338,
                    0.95,
                )
                .setStrokeStyle(1, 0x6195d8, 0.45);
            this.add
                .text(VIEW.width / 2, 170, "CHIẾN TUYẾN 1954-1965", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "40px",
                    color: "#dce8f7",
                    fontStyle: "bold",
                })
                .setOrigin(0.5);

            makeButton(this, {
                x: VIEW.width / 2,
                y: 305,
                width: 230,
                height: 46,
                label: "Play",
                baseColor: 0x1a5c7b,
                lineColor: 0x6fdcff,
                onClick: () => this.startGame(),
            });
            makeButton(this, {
                x: VIEW.width / 2,
                y: 364,
                width: 230,
                height: 42,
                label: "Bắt đầu nhanh",
                baseColor: 0x2d8b5d,
                lineColor: 0x7cff9e,
                onClick: () => this.startGame(),
            });
            makeButton(this, {
                x: VIEW.width / 2,
                y: 419,
                width: 230,
                height: 40,
                label: "Hướng dẫn",
                onClick: () => {
                    App.state.bus.emit(App.uiEventNames.OPEN_HELP, {
                        from: "menu",
                    });
                    if (!this.scene.isActive("ModalScene")) {
                        this.scene.launch("ModalScene");
                    }
                },
            });

            this.add
                .image(VIEW.width / 2 - 180, 115, "flag-vn")
                .setDisplaySize(56, 36);
            this.add
                .image(VIEW.width / 2 + 180, 115, "flag-us")
                .setDisplaySize(56, 36);
        }

        startGame() {
            App.game.startEndless();
            App.game.clearResultNotify();
            App.quizSystem.closeQuiz();

            if (this.scene.isActive("ModalScene")) {
                const modal = this.scene.get("ModalScene");
                if (modal && typeof modal.hide === "function") {
                    modal.hide();
                }
            }

            if (this.scene.isActive("BattleScene")) {
                this.scene.stop("BattleScene");
            }
            this.scene.launch("BattleScene");
            if (!this.scene.isActive("UIScene")) {
                this.scene.launch("UIScene");
            }
            if (!this.scene.isActive("ModalScene")) {
                this.scene.launch("ModalScene");
            }
            this.scene.bringToTop("UIScene");
            this.scene.bringToTop("ModalScene");
            this.scene.stop();
        }
    }

    class BattleScene extends Phaser.Scene {
        constructor() {
            super("BattleScene");
            this.effectTexts = [];
        }

        create() {
            this.mapGraphics = this.add.graphics();
            this.entityGraphics = this.add.graphics();
            this.fxGraphics = this.add.graphics();
            this.overlayGraphics = this.add.graphics();
            this.dragPreviewTitle = this.add
                .text(0, 0, "", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "13px",
                    color: "#e6f1ff",
                    fontStyle: "bold",
                })
                .setAlpha(0.58)
                .setDepth(36)
                .setVisible(false);
            this.dragPreviewMeta = this.add
                .text(0, 0, "", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "11px",
                    color: "#d8e8ff",
                })
                .setAlpha(0.52)
                .setDepth(36)
                .setVisible(false);
            this.dragPreviewDesc = this.add
                .text(0, 0, "", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "11px",
                    color: "#c9def9",
                })
                .setAlpha(0.42)
                .setDepth(36)
                .setVisible(false);
            this.input.on("pointerdown", this.onPointerDown, this);
        }

        onPointerDown(pointer) {
            const state = App.state;
            if (
                state.mode !== "playing" ||
                state.paused ||
                App.modalState.active
            ) {
                return;
            }
            if (!isWorldPoint(pointer.x, pointer.y)) {
                return;
            }

            const point = screenToWorld(pointer.x, pointer.y);
            state.drag.hoverX = point.x;
            state.drag.hoverY = point.y;

            if (state.skills.activeTargetSkill) {
                App.skillSystem.castTargetSkill(state, point.x, point.y);
                return;
            }

            const quickUpgrade = state.towers.find((tower) => {
                if (!App.uiSystem.canUpgradeTowerType(state, tower.type)) {
                    return false;
                }
                return (
                    App.map.distance(
                        { x: tower.x + 18, y: tower.y - 18 },
                        point,
                    ) <= 12
                );
            });
            if (quickUpgrade) {
                const info = App.uiSystem.getTowerTypeUpgradeInfo(
                    state,
                    quickUpgrade.type,
                );
                state.bus.emit(App.uiEventNames.OPEN_TOWER_UPGRADE, {
                    towerType: quickUpgrade.type,
                    towerName: quickUpgrade.name,
                    info,
                });
                return;
            }

            const selected = state.towers.find(
                (tower) => App.map.distance(tower, point) <= tower.radius + 8,
            );
            state.selectedTowerId = selected ? selected.id : null;
        }

        update(_time, delta) {
            App.game.tick(Math.min(0.033, delta / 1000));
            this.draw();
            if (App.game.shouldNotifyResult()) {
                App.state.bus.emit(App.uiEventNames.OPEN_RESULT, {});
            }
        }

        drawHealthBar(graphics, x, y, width, hp, maxHp, colorHex) {
            const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
            graphics.fillStyle(0x000000, 0.45);
            graphics.fillRect(x - width / 2, y, width, 5);
            graphics.fillStyle(colorHex, 1);
            graphics.fillRect(x - width / 2, y, width * ratio, 5);
            graphics.lineStyle(1, 0xffffff, 0.2);
            graphics.strokeRect(x - width / 2, y, width, 5);
        }

        drawMap(state) {
            const g = this.mapGraphics;
            g.clear();
            const mapDef = App.map.getMap(state.level);

            g.fillStyle(0x112033, 1);
            g.fillRect(
                VIEW.worldX,
                VIEW.worldY,
                VIEW.worldWidth,
                VIEW.worldHeight,
            );
            g.fillStyle(0x1d3550, 0.4);
            g.fillRect(VIEW.worldX, VIEW.worldY + 40, VIEW.worldWidth, 120);
            g.fillStyle(0x0c1726, 0.45);
            g.fillRect(
                VIEW.worldX,
                VIEW.worldY + VIEW.worldHeight - 180,
                VIEW.worldWidth,
                160,
            );

            g.lineStyle(1, 0x7da0c6, 0.08);
            for (
                let gx = VIEW.worldX;
                gx <= VIEW.worldX + VIEW.worldWidth;
                gx += 40
            ) {
                g.beginPath();
                g.moveTo(gx, VIEW.worldY);
                g.lineTo(gx, VIEW.worldY + VIEW.worldHeight);
                g.strokePath();
            }
            for (
                let gy = VIEW.worldY;
                gy <= VIEW.worldY + VIEW.worldHeight;
                gy += 40
            ) {
                g.beginPath();
                g.moveTo(VIEW.worldX, gy);
                g.lineTo(VIEW.worldX + VIEW.worldWidth, gy);
                g.strokePath();
            }

            g.lineStyle(40, 0x495c72, 1);
            g.beginPath();
            for (let i = 0; i < mapDef.path.length; i += 1) {
                const p = worldToScreen(mapDef.path[i].x, mapDef.path[i].y);
                if (i === 0) {
                    g.moveTo(p.x, p.y);
                } else {
                    g.lineTo(p.x, p.y);
                }
            }
            g.strokePath();

            g.lineStyle(30, 0x7089a3, 1);
            g.beginPath();
            for (let i = 0; i < mapDef.path.length; i += 1) {
                const p = worldToScreen(mapDef.path[i].x, mapDef.path[i].y);
                if (i === 0) {
                    g.moveTo(p.x, p.y);
                } else {
                    g.lineTo(p.x, p.y);
                }
            }
            g.strokePath();

            g.lineStyle(18, 0x8ea6bf, 0.95);
            g.beginPath();
            for (let i = 0; i < mapDef.path.length; i += 1) {
                const p = worldToScreen(mapDef.path[i].x, mapDef.path[i].y);
                if (i === 0) {
                    g.moveTo(p.x, p.y);
                } else {
                    g.lineTo(p.x, p.y);
                }
            }
            g.strokePath();

            g.lineStyle(2, 0xe9f5ff, 0.38);
            g.beginPath();
            for (let i = 0; i < mapDef.path.length; i += 1) {
                const p = worldToScreen(mapDef.path[i].x, mapDef.path[i].y);
                if (i === 0) {
                    g.moveTo(p.x, p.y);
                } else {
                    g.lineTo(p.x, p.y);
                }
            }
            g.strokePath();

            const spawn = worldToScreen(mapDef.spawn.x, mapDef.spawn.y);
            g.fillStyle(0x6bc8ff, 0.28);
            g.fillCircle(spawn.x, spawn.y, 28);
            g.fillStyle(0x8fd7ff, 1);
            g.fillCircle(spawn.x, spawn.y, 18);
            g.lineStyle(3, 0xc8f0ff, 0.8);
            g.strokeCircle(spawn.x, spawn.y, 24);

            for (const slot of mapDef.towerSlots) {
                const p = worldToScreen(slot.x, slot.y);
                g.fillStyle(0x14263a, 0.72);
                g.fillCircle(p.x, p.y, 24);
                g.lineStyle(2, 0x96c8ff, 0.48);
                g.strokeCircle(p.x, p.y, 22);
                g.lineStyle(1, 0xb4dcff, 0.2);
                g.strokeCircle(p.x, p.y, 16);
            }

            const base = worldToScreen(state.base.x, state.base.y);
            g.fillStyle(0xff7fa0, 0.3);
            g.fillCircle(base.x, base.y, state.base.radius + 16);
            g.fillStyle(0xff8ea4, 1);
            g.fillCircle(base.x, base.y, state.base.radius);
            g.lineStyle(3, 0xffdce5, 0.75);
            g.strokeCircle(base.x, base.y, state.base.radius + 4);
            g.fillStyle(0xfff1f5, 1);
            g.fillRect(base.x - 11, base.y - 32, 22, 24);
            this.drawHealthBar(
                g,
                base.x,
                base.y - 62,
                100,
                state.base.hp,
                state.base.maxHp,
                0xff7e9b,
            );
        }

        tintColor(colorHex, factor) {
            const r = Math.max(
                0,
                Math.min(255, Math.round(((colorHex >> 16) & 255) * factor)),
            );
            const g = Math.max(
                0,
                Math.min(255, Math.round(((colorHex >> 8) & 255) * factor)),
            );
            const b = Math.max(
                0,
                Math.min(255, Math.round((colorHex & 255) * factor)),
            );
            return (r << 16) + (g << 8) + b;
        }

        drawTowerSprite(g, tower, p) {
            const baseColor = parseColor(tower.color).color;
            const dark = this.tintColor(baseColor, 0.56);
            const mid = this.tintColor(baseColor, 0.84);
            const bright = this.tintColor(baseColor, 1.24);
            const phase =
                (Number.parseInt(
                    String(tower.id || "").replace(/\D+/g, ""),
                    10,
                ) || 0) * 0.33;
            const pulse = 0.84 + Math.sin(this.time.now * 0.008 + phase) * 0.16;

            g.fillStyle(0x000000, 0.26);
            g.fillEllipse(
                p.x,
                p.y + 18,
                tower.isBarricade ? 56 : 38,
                tower.isBarricade ? 14 : 10,
            );

            if (tower.isBarricade) {
                const width =
                    tower.level === 1 ? 36 : tower.level === 2 ? 44 : 52;
                const height =
                    tower.level === 1 ? 24 : tower.level === 2 ? 28 : 32;
                g.fillStyle(dark, 1);
                g.fillRect(p.x - width / 2, p.y - 6, width, height);
                g.lineStyle(2, bright, 0.55);
                g.strokeRect(p.x - width / 2, p.y - 6, width, height);

                g.fillStyle(this.tintColor(baseColor, 1.12), 0.9);
                for (let i = 0; i < 4; i += 1) {
                    const sx = p.x - width / 2 + 6 + i * ((width - 12) / 3);
                    g.fillCircle(sx, p.y - 8 + (i % 2) * 3, 5);
                }

                g.lineStyle(2, 0xd8cab5, 0.75);
                g.beginPath();
                g.moveTo(p.x - width / 2 + 4, p.y + 7);
                g.lineTo(p.x + width / 2 - 4, p.y + 7);
                g.strokePath();
                return;
            }

            g.fillStyle(0x132337, 1);
            g.fillCircle(p.x, p.y + 7, 16);
            g.fillStyle(mid, 1);
            g.fillCircle(p.x, p.y + 4, 14);
            g.lineStyle(2, bright, 0.6);
            g.strokeCircle(p.x, p.y + 4, 14);

            if (tower.type === "infantry") {
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, p.y - 8, 9);
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 9, p.y - 8, 18, 10);
                g.fillStyle(0xe8f3ff, 0.95);
                g.fillRect(p.x + 3, p.y - 10, 12, 3);
            } else if (tower.type === "machineGun") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 10, p.y - 8, 20, 10);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, p.y - 12, 7);
                g.lineStyle(2.5, 0xe3f6ff, 0.9);
                g.beginPath();
                g.moveTo(p.x + 3, p.y - 12);
                g.lineTo(p.x + 16, p.y - 14);
                g.moveTo(p.x + 3, p.y - 8);
                g.lineTo(p.x + 16, p.y - 10);
                g.strokePath();
            } else if (tower.type === "cannon") {
                g.fillStyle(this.tintColor(baseColor, 0.65), 1);
                g.fillCircle(p.x - 9, p.y - 3, 5);
                g.fillCircle(p.x + 9, p.y - 3, 5);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 11, p.y - 10, 22, 10);
                g.fillStyle(0xf5dec1, 0.95);
                g.fillRect(p.x + 2, p.y - 14, 16, 4);
                g.fillStyle(0x2f4054, 1);
                g.fillCircle(p.x + 18, p.y - 12, 3);
            } else if (tower.type === "missile") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 10, p.y - 8, 20, 11);
                g.fillStyle(baseColor, 1);
                g.fillTriangle(
                    p.x - 8,
                    p.y - 12,
                    p.x - 4,
                    p.y - 22,
                    p.x,
                    p.y - 12,
                );
                g.fillTriangle(
                    p.x,
                    p.y - 12,
                    p.x + 4,
                    p.y - 24,
                    p.x + 8,
                    p.y - 12,
                );
                g.fillStyle(0xefe9de, 1);
                g.fillRect(p.x - 1, p.y - 20, 2, 8);
                g.lineStyle(2, 0xffbcc6, 0.7 + pulse * 0.25);
                g.strokeCircle(p.x, p.y - 10, 15);
            } else if (tower.type === "laser") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 9, p.y - 7, 18, 12);
                g.fillStyle(baseColor, 1);
                g.fillTriangle(
                    p.x,
                    p.y - 24,
                    p.x - 7,
                    p.y - 10,
                    p.x + 7,
                    p.y - 10,
                );
                g.lineStyle(2, 0xaef4ff, 0.8 + pulse * 0.2);
                g.strokeCircle(p.x, p.y - 10, 12);
            } else if (tower.type === "command") {
                g.fillStyle(dark, 1);
                g.fillCircle(p.x, p.y - 8, 12);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, p.y - 8, 9);
                g.fillStyle(0xffffff, 0.95);
                g.fillRect(p.x - 1, p.y - 16, 2, 11);
                g.fillRect(p.x - 5, p.y - 12, 10, 2);
                g.lineStyle(2, bright, 0.48 + pulse * 0.25);
                g.strokeCircle(p.x, p.y - 8, 20 + pulse * 2);
            } else {
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, p.y - 8, 10);
            }
        }

        drawEnemySprite(g, enemy, p) {
            const baseColor = parseColor(enemy.color).color;
            const dark = this.tintColor(baseColor, 0.52);
            const mid = this.tintColor(baseColor, 0.82);
            const bright = this.tintColor(baseColor, 1.22);
            const phase =
                (Number.parseInt(
                    String(enemy.id || "").replace(/\D+/g, ""),
                    10,
                ) || 0) * 0.27;
            const bob = Math.sin(this.time.now * 0.009 + phase) * 1.4;
            const y =
                enemy.visualType === "drone" ||
                enemy.visualType === "boss-shadow"
                    ? p.y - 6 + bob
                    : p.y;

            g.fillStyle(
                0x000000,
                enemy.visualType === "drone" ||
                    enemy.visualType === "boss-shadow"
                    ? 0.14
                    : 0.24,
            );
            g.fillEllipse(
                p.x,
                p.y + enemy.radius + 6,
                enemy.isBoss ? 56 : enemy.radius * 2 + 12,
                enemy.isBoss ? 16 : 9,
            );

            if (enemy.visualType === "infantry") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 6, y - 4, 12, 14);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, y - 10, 6);
                g.fillStyle(0xf0f5ff, 0.95);
                g.fillRect(p.x + 1, y - 5, 10, 2);
            } else if (enemy.visualType === "scout") {
                g.fillStyle(baseColor, 1);
                g.fillTriangle(p.x - 7, y + 6, p.x + 10, y, p.x - 7, y - 6);
                g.fillStyle(bright, 1);
                g.fillCircle(p.x - 1, y - 8, 4);
            } else if (enemy.visualType === "armored") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 8, y - 5, 16, 16);
                g.fillStyle(mid, 1);
                g.fillCircle(p.x, y - 11, 6);
                g.fillStyle(this.tintColor(baseColor, 1.04), 1);
                g.fillRect(p.x - 10, y - 2, 20, 4);
            } else if (enemy.visualType === "sniper") {
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 6, y - 4, 12, 14);
                g.fillStyle(bright, 1);
                g.fillCircle(p.x, y - 10, 5);
                g.lineStyle(2.5, 0xfff3d4, 0.9);
                g.beginPath();
                g.moveTo(p.x + 4, y - 3);
                g.lineTo(p.x + 20, y - 7);
                g.strokePath();
            } else if (enemy.visualType === "heavy") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 10, y - 4, 20, 16);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, y - 11, 6);
                g.fillStyle(0xffd3a5, 0.95);
                g.fillRect(p.x + 2, y - 2, 12, 4);
                g.fillStyle(0x2a3342, 1);
                g.fillRect(p.x - 13, y - 3, 4, 15);
            } else if (enemy.visualType === "commander") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 8, y - 4, 16, 16);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, y - 11, 6);
                g.lineStyle(2, bright, 0.55);
                g.strokeCircle(p.x, y - 2, enemy.radius + 5);
                g.fillStyle(0xffffff, 0.9);
                g.fillRect(p.x - 1, y - 16, 2, 10);
            } else if (enemy.visualType === "shield") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 7, y - 4, 14, 16);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x - 1, y - 10, 5);
                g.fillStyle(this.tintColor(baseColor, 1.28), 0.95);
                g.fillEllipse(p.x + 7, y - 2, 12, 18);
                g.lineStyle(1.5, 0xe6f5ff, 0.8);
                g.strokeEllipse(p.x + 7, y - 2, 12, 18);
            } else if (enemy.visualType === "flame") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 8, y - 4, 16, 15);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, y - 10, 5);
                g.fillStyle(0xffd07d, 0.95);
                g.fillTriangle(
                    p.x + 4,
                    y - 2,
                    p.x + 17,
                    y - 8,
                    p.x + 10,
                    y + 4,
                );
            } else if (enemy.visualType === "drone") {
                g.lineStyle(2.5, dark, 1);
                g.beginPath();
                g.moveTo(p.x - 11, y);
                g.lineTo(p.x + 11, y);
                g.moveTo(p.x, y - 11);
                g.lineTo(p.x, y + 11);
                g.strokePath();
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, y, 7);
                g.fillStyle(bright, 0.95);
                g.fillCircle(p.x - 11, y, 3.5);
                g.fillCircle(p.x + 11, y, 3.5);
                g.fillCircle(p.x, y - 11, 3.5);
                g.fillCircle(p.x, y + 11, 3.5);
            } else if (enemy.visualType === "vehicle") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 14, y - 5, 28, 12);
                g.fillStyle(mid, 1);
                g.fillRect(p.x - 10, y - 10, 20, 8);
                g.fillStyle(this.tintColor(baseColor, 1.08), 1);
                g.fillTriangle(p.x + 14, y - 5, p.x + 20, y, p.x + 14, y + 7);
                g.fillStyle(0x1f2733, 1);
                g.fillCircle(p.x - 8, y + 8, 3);
                g.fillCircle(p.x + 8, y + 8, 3);
            } else if (enemy.visualType === "tank") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 18, y - 7, 36, 15);
                g.fillStyle(mid, 1);
                g.fillRect(p.x - 11, y - 13, 22, 10);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, y - 8, 7);
                g.fillStyle(this.tintColor(baseColor, 1.18), 1);
                g.fillRect(p.x + 4, y - 10, 17, 4);
                g.fillStyle(0x202833, 1);
                for (let i = -12; i <= 12; i += 8) {
                    g.fillCircle(p.x + i, y + 9, 3);
                }
            } else if (enemy.visualType === "rocket") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 14, y - 5, 28, 12);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 8, y - 12, 16, 7);
                g.fillStyle(0xffced5, 1);
                g.fillTriangle(p.x - 6, y - 12, p.x - 3, y - 18, p.x, y - 12);
                g.fillTriangle(
                    p.x + 1,
                    y - 12,
                    p.x + 4,
                    y - 18,
                    p.x + 7,
                    y - 12,
                );
                g.fillStyle(0x1f2733, 1);
                g.fillCircle(p.x - 8, y + 8, 3);
                g.fillCircle(p.x + 8, y + 8, 3);
            } else if (enemy.visualType === "mortar") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 15, y - 5, 30, 12);
                g.fillStyle(mid, 1);
                g.fillRect(p.x - 11, y - 11, 22, 7);
                g.fillStyle(this.tintColor(baseColor, 1.2), 1);
                g.fillRect(p.x - 2, y - 18, 7, 14);
                g.fillStyle(0x1f2733, 1);
                g.fillCircle(p.x - 9, y + 8, 3);
                g.fillCircle(p.x + 9, y + 8, 3);
            } else if (enemy.visualType === "boss-core") {
                g.fillStyle(this.tintColor(baseColor, 0.45), 0.92);
                g.fillCircle(p.x, y, 29);
                g.fillStyle(mid, 1);
                g.fillCircle(p.x, y, 23);
                g.fillStyle(bright, 1);
                g.fillCircle(p.x, y, 15);
                g.fillStyle(0xfff3f6, 0.95);
                g.fillCircle(p.x, y, 5);
                g.fillStyle(this.tintColor(baseColor, 0.72), 0.9);
                for (let i = 0; i < 6; i += 1) {
                    const angle = (Math.PI * 2 * i) / 6;
                    const ox = Math.cos(angle) * 30;
                    const oy = Math.sin(angle) * 30;
                    g.fillTriangle(
                        p.x + ox,
                        y + oy,
                        p.x + ox * 0.6 - 4,
                        y + oy * 0.6 + 3,
                        p.x + ox * 0.6 + 4,
                        y + oy * 0.6 - 3,
                    );
                }
            } else if (enemy.visualType === "boss-iron") {
                g.fillStyle(this.tintColor(baseColor, 0.5), 1);
                g.fillRect(p.x - 30, y - 11, 60, 21);
                g.fillStyle(mid, 1);
                g.fillRect(p.x - 20, y - 21, 40, 13);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, y - 14, 10);
                g.fillStyle(this.tintColor(baseColor, 1.25), 1);
                g.fillRect(p.x + 8, y - 17, 25, 6);
                g.fillStyle(0x212a36, 1);
                for (let i = -24; i <= 24; i += 8) {
                    g.fillCircle(p.x + i, y + 12, 3.5);
                }
            } else if (enemy.visualType === "boss-shadow") {
                g.fillStyle(this.tintColor(baseColor, 0.4), 0.5);
                g.fillCircle(p.x, y, 34);
                g.fillStyle(this.tintColor(baseColor, 0.7), 0.9);
                g.fillCircle(p.x, y, 26);
                g.fillStyle(baseColor, 1);
                g.fillCircle(p.x, y, 18);
                g.fillStyle(0xf0e6ff, 0.92);
                g.fillEllipse(p.x, y, 16, 8);
                g.lineStyle(2, this.tintColor(baseColor, 1.35), 0.48);
                g.strokeCircle(
                    p.x,
                    y,
                    34 + Math.sin(this.time.now * 0.01 + phase) * 2,
                );
            } else {
                g.fillStyle(baseColor, enemy.isBoss ? 0.95 : 1);
                g.fillCircle(
                    p.x,
                    y,
                    enemy.isBoss ? enemy.radius + 4 : enemy.radius,
                );
            }

            if (enemy.canAttackStructures) {
                g.lineStyle(1.5, 0xff9da7, 0.85);
                g.beginPath();
                g.moveTo(p.x - 4, y - enemy.radius - 4);
                g.lineTo(p.x + 4, y - enemy.radius - 4);
                g.moveTo(p.x, y - enemy.radius - 8);
                g.lineTo(p.x, y);
                g.strokePath();
            }
        }

        drawTowers(state) {
            const g = this.entityGraphics;
            for (const tower of state.towers) {
                const p = worldToScreen(tower.x, tower.y);
                if (tower.id === state.selectedTowerId) {
                    g.lineStyle(2, 0x90e0ff, 0.65);
                    g.strokeCircle(p.x, p.y, tower.getEffectiveRange());
                }

                this.drawTowerSprite(g, tower, p);

                if (tower.type === "laser" && tower.laserBeam.active) {
                    const startX = p.x;
                    const startY = p.y - 10;
                    const beams = [tower.laserBeam].concat(
                        Array.isArray(tower.extraLaserBeams)
                            ? tower.extraLaserBeams
                            : [],
                    );
                    for (
                        let beamIndex = 0;
                        beamIndex < beams.length;
                        beamIndex += 1
                    ) {
                        const beam = beams[beamIndex];
                        const endX = VIEW.worldX + beam.endX;
                        const endY = VIEW.worldY + beam.endY;
                        const falloff = beamIndex === 0 ? 1 : 0.78;
                        g.lineStyle(10 * falloff, 0x65e7ff, 0.18 * falloff);
                        g.beginPath();
                        g.moveTo(startX, startY);
                        g.lineTo(endX, endY);
                        g.strokePath();
                        g.lineStyle(5 * falloff, 0x9ff4ff, 0.48 * falloff);
                        g.beginPath();
                        g.moveTo(startX, startY);
                        g.lineTo(endX, endY);
                        g.strokePath();
                        g.lineStyle(2.2 * falloff, 0xe6feff, 0.92 * falloff);
                        g.beginPath();
                        g.moveTo(startX, startY);
                        g.lineTo(endX, endY);
                        g.strokePath();
                        g.fillStyle(0xe6feff, 0.88 * falloff);
                        g.fillCircle(endX, endY, 4 * falloff);
                    }
                }

                if (App.uiSystem.canUpgradeTowerType(state, tower.type)) {
                    g.fillStyle(0x25cb7b, 0.95);
                    g.fillCircle(p.x + 18, p.y - 18, 10);
                    g.fillStyle(0xe9fff2, 1);
                    g.fillTriangle(
                        p.x + 18,
                        p.y - 24,
                        p.x + 13,
                        p.y - 16,
                        p.x + 23,
                        p.y - 16,
                    );
                }

                const barOffset = tower.isBarricade ? 40 : 30;
                const barWidth = tower.isBarricade ? 58 : 46;
                this.drawHealthBar(
                    g,
                    p.x,
                    p.y - barOffset,
                    barWidth,
                    tower.hp,
                    tower.maxHp,
                    0x7cff9e,
                );

                g.fillStyle(0xf5fbff, 0.95);
                for (let i = 0; i < tower.level; i += 1) {
                    g.fillCircle(p.x - 8 + i * 8, p.y - 23, 2.1);
                }
            }
        }

        drawEnemies(state) {
            const g = this.entityGraphics;
            for (const enemy of state.enemies) {
                const p = worldToScreen(enemy.x, enemy.y);
                this.drawEnemySprite(g, enemy, p);

                const wideType =
                    enemy.visualType === "tank" ||
                    enemy.visualType === "mortar" ||
                    enemy.visualType === "boss-iron";
                const midType =
                    enemy.visualType === "vehicle" ||
                    enemy.visualType === "rocket";
                const barWidth = enemy.isBoss
                    ? 132
                    : wideType
                      ? 74
                      : midType
                        ? 62
                        : enemy.visualType === "drone"
                          ? 38
                          : 46;
                const barY = enemy.isBoss
                    ? p.y - enemy.radius - 28
                    : enemy.visualType === "drone"
                      ? p.y - enemy.radius - 20
                      : p.y - enemy.radius - 14;
                this.drawHealthBar(
                    g,
                    p.x,
                    barY,
                    barWidth,
                    enemy.hp,
                    enemy.maxHp,
                    0xff7d7d,
                );
            }
        }

        drawProjectiles(state) {
            const g = this.entityGraphics;
            for (const projectile of state.projectiles) {
                const p = worldToScreen(projectile.x, projectile.y);
                if (projectile.type === "laser") {
                    g.lineStyle(3, 0xb6f7ff, 0.88);
                    g.beginPath();
                    g.moveTo(
                        VIEW.worldX + projectile.prevX,
                        VIEW.worldY + projectile.prevY,
                    );
                    g.lineTo(p.x, p.y);
                    g.strokePath();
                } else if (projectile.type === "missile") {
                    g.fillStyle(0xff6a79, 1);
                    g.fillCircle(p.x, p.y, 5);
                } else if (projectile.type === "shell") {
                    g.fillStyle(0xffbe73, 1);
                    g.fillCircle(p.x, p.y, 4);
                } else {
                    g.fillStyle(0xf3f8ff, 1);
                    g.fillCircle(p.x, p.y, 3);
                }
            }
        }

        drawEffects(state) {
            const g = this.fxGraphics;
            g.clear();
            let idx = 0;
            for (const fx of state.effects) {
                const ratio = fx.life / fx.maxLife;
                if (fx.type === "text") {
                    let label = this.effectTexts[idx];
                    if (!label) {
                        label = this.add
                            .text(0, 0, "", {
                                fontFamily: "Trebuchet MS",
                                fontSize: "13px",
                                fontStyle: "bold",
                                color: "#ffffff",
                            })
                            .setOrigin(0, 0.5);
                        this.effectTexts.push(label);
                    }
                    label.setVisible(true);
                    label.setText(fx.text);
                    label.setColor(fx.color || "#ffffff");
                    label.setPosition(VIEW.worldX + fx.x, VIEW.worldY + fx.y);
                    label.setAlpha(Math.max(0, ratio));
                    idx += 1;
                    continue;
                }

                const style = parseColor(fx.color, Math.max(0, ratio * 0.9));
                g.fillStyle(style.color, style.alpha);
                if (fx.type === "explosion") {
                    g.fillCircle(
                        VIEW.worldX + fx.x,
                        VIEW.worldY + fx.y,
                        fx.radius * (1 + (1 - ratio)),
                    );
                } else if (fx.type === "hit" || fx.type === "muzzle") {
                    g.fillCircle(
                        VIEW.worldX + fx.x,
                        VIEW.worldY + fx.y,
                        fx.type === "hit" ? 7 * ratio : 5 * ratio,
                    );
                }
            }
            for (let i = idx; i < this.effectTexts.length; i += 1) {
                this.effectTexts[i].setVisible(false);
            }
        }

        drawOverlay(state) {
            this.overlayGraphics.clear();
            if (state.skills.activeTargetSkill === "artilleryStrike") {
                const cfg = App.config.skills.artilleryStrike;
                this.overlayGraphics.lineStyle(2, 0xff7878, 0.8);
                this.overlayGraphics.strokeCircle(
                    VIEW.worldX + state.drag.hoverX,
                    VIEW.worldY + state.drag.hoverY,
                    cfg.radius,
                );
            }

            const hideDragPreviewText = () => {
                this.dragPreviewTitle.setVisible(false);
                this.dragPreviewMeta.setVisible(false);
                this.dragPreviewDesc.setVisible(false);
            };

            if (
                state.drag.activeTowerType &&
                state.drag.hoverValid &&
                state.drag.previewCard
            ) {
                const card = state.drag.previewCard;
                const screenX = VIEW.worldX + state.drag.hoverX;
                const screenY = VIEW.worldY + state.drag.hoverY;
                const range = Math.max(45, Number(card.range) || 120);
                const towerColor = parseColor(card.color).color;

                this.overlayGraphics.fillStyle(
                    state.drag.canPlace ? 0x7bcf9c : 0xff8a9d,
                    0.22,
                );
                this.overlayGraphics.fillCircle(screenX, screenY, range);
                this.overlayGraphics.lineStyle(
                    2,
                    state.drag.canPlace ? 0x99e4b3 : 0xffa8b1,
                    0.45,
                );
                this.overlayGraphics.strokeCircle(screenX, screenY, range);

                this.overlayGraphics.fillStyle(0x13263a, 0.56);
                this.overlayGraphics.fillCircle(screenX, screenY, 20);
                this.overlayGraphics.fillStyle(towerColor, 0.7);
                this.overlayGraphics.fillCircle(screenX, screenY - 6, 14);
                this.overlayGraphics.lineStyle(2, 0xdff4ff, 0.55);
                this.overlayGraphics.strokeCircle(screenX, screenY - 6, 14);
                this.overlayGraphics.fillStyle(
                    state.drag.canPlace ? 0x8fffb3 : 0xff8a9d,
                    0.9,
                );
                this.overlayGraphics.fillCircle(screenX + 24, screenY - 22, 8);

                const textX = Math.max(VIEW.worldX + 18, screenX - range * 0.6);
                const textY = Math.max(VIEW.worldY + 26, screenY - 28);
                this.dragPreviewTitle.setText(card.name || "Tower");
                this.dragPreviewMeta.setText(
                    `Cost: ${card.cost} | DMG: ${card.damage} | RNG: ${card.range}`,
                );
                this.dragPreviewDesc.setText(card.description || "");
                this.dragPreviewTitle
                    .setPosition(textX, textY - 18)
                    .setVisible(true);
                this.dragPreviewMeta
                    .setPosition(textX, textY + 28)
                    .setVisible(true);
                this.dragPreviewDesc
                    .setPosition(textX, textY + 72)
                    .setVisible(true);
            } else {
                hideDragPreviewText();
            }
        }

        draw() {
            const state = App.state;
            if (!state.base) {
                this.mapGraphics.clear();
                this.entityGraphics.clear();
                this.fxGraphics.clear();
                this.overlayGraphics.clear();
                this.dragPreviewTitle.setVisible(false);
                this.dragPreviewMeta.setVisible(false);
                this.dragPreviewDesc.setVisible(false);
                return;
            }
            this.entityGraphics.clear();
            this.drawMap(state);
            this.drawTowers(state);
            this.drawEnemies(state);
            this.drawProjectiles(state);
            this.drawEffects(state);
            this.drawOverlay(state);
        }
    }

    class UIScene extends Phaser.Scene {
        constructor() {
            super("UIScene");
            this.hudTexts = {};
            this.skillRefs = [];
            this.cardRefs = [];
            this.towerButtons = {};
            this.baseButtons = {};
            this.detailTexts = {};
        }

        create() {
            this.createTopbar();
            this.createPanel();
            this.createTowerCards();
            this.createSkillButtons();
            this.createActionButtons();
            this.createDetailPanel();
            this.registerDrag();
        }

        createTopbar() {
            this.add
                .rectangle(
                    VIEW.width / 2,
                    45,
                    VIEW.width - 24,
                    80,
                    0x0b1725,
                    0.9,
                )
                .setStrokeStyle(1, 0x6195d8, 0.35);
            this.add.image(52, 45, "flag-vn").setDisplaySize(52, 34);
            this.add
                .image(VIEW.width - 52, 45, "flag-us")
                .setDisplaySize(52, 34);

            this.hudTexts.baseHp = this.add.text(96, 20, "", {
                fontFamily: "Trebuchet MS",
                fontSize: "15px",
                color: "#dce8f7",
            });
            this.hudTexts.supplies = this.add.text(96, 42, "", {
                fontFamily: "Trebuchet MS",
                fontSize: "15px",
                color: "#dce8f7",
            });
            this.hudTexts.cp = this.add.text(320, 20, "", {
                fontFamily: "Trebuchet MS",
                fontSize: "15px",
                color: "#dce8f7",
            });
            this.hudTexts.wave = this.add.text(320, 42, "", {
                fontFamily: "Trebuchet MS",
                fontSize: "15px",
                color: "#dce8f7",
            });
            this.hudTexts.enemy = this.add.text(520, 20, "", {
                fontFamily: "Trebuchet MS",
                fontSize: "15px",
                color: "#dce8f7",
            });
            this.hudTexts.quiz = this.add.text(520, 42, "", {
                fontFamily: "Trebuchet MS",
                fontSize: "15px",
                color: "#9fb7d3",
            });
            this.hudTexts.waveState = this.add.text(740, 30, "", {
                fontFamily: "Trebuchet MS",
                fontSize: "14px",
                color: "#9fb7d3",
            });
            this.hudTexts.boss = this.add
                .text(740, 52, "BOSS ARRIVED!", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "16px",
                    color: "#ff9aa5",
                })
                .setVisible(false);

            this.pauseButton = makeButton(this, {
                x: VIEW.width - 172,
                y: 30,
                width: 120,
                height: 30,
                label: "Pause",
                onClick: () => {
                    if (App.state.mode !== "playing") {
                        return;
                    }
                    if (App.antiCheatSystem && App.antiCheatSystem.isLocked()) {
                        return;
                    }
                    App.state.paused = !App.state.paused;
                },
            });
            this.helpButton = makeButton(this, {
                x: VIEW.width - 172,
                y: 64,
                width: 120,
                height: 30,
                label: "Guide",
                onClick: () =>
                    App.state.bus.emit(App.uiEventNames.OPEN_HELP, {}),
            });
        }

        createPanel() {
            this.add
                .rectangle(
                    VIEW.panelX + VIEW.panelWidth / 2,
                    VIEW.panelY + VIEW.panelHeight / 2,
                    VIEW.panelWidth,
                    VIEW.panelHeight,
                    0x09121d,
                    0.92,
                )
                .setStrokeStyle(1, 0x6195d8, 0.35);
            this.add
                .text(
                    VIEW.panelX + 10,
                    VIEW.panelY + 10,
                    "Build towers (drag)",
                    {
                        fontFamily: "Trebuchet MS",
                        fontSize: "14px",
                        color: "#dce8f7",
                    },
                )
                .setDepth(20);
            this.add
                .text(VIEW.panelX + 10, VIEW.panelY + 312, "Skills", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "13px",
                    color: "#dce8f7",
                })
                .setDepth(20);
        }

        tintCardColor(colorHex, factor) {
            const r = Math.max(
                0,
                Math.min(255, Math.round(((colorHex >> 16) & 255) * factor)),
            );
            const g = Math.max(
                0,
                Math.min(255, Math.round(((colorHex >> 8) & 255) * factor)),
            );
            const b = Math.max(
                0,
                Math.min(255, Math.round((colorHex & 255) * factor)),
            );
            return (r << 16) + (g << 8) + b;
        }

        createTowerCardIcon(type, color) {
            const baseColor = parseColor(color).color;
            const dark = this.tintCardColor(baseColor, 0.58);
            const bright = this.tintCardColor(baseColor, 1.22);

            const icon = this.add.container(-122, 0);
            const ring = this.add
                .circle(0, 0, 13, 0x132338, 0.96)
                .setStrokeStyle(1, bright, 0.65);
            icon.add(ring);

            if (type === "infantry") {
                icon.add(this.add.circle(-1, -4, 4.4, baseColor, 1));
                icon.add(this.add.rectangle(-1, 4, 8, 8, dark, 1));
                icon.add(this.add.rectangle(5, 3, 7, 2, 0xe7f3ff, 0.95));
            } else if (type === "machineGun") {
                icon.add(this.add.rectangle(-1, 3, 10, 7, dark, 1));
                icon.add(this.add.circle(-1, -3, 4.4, baseColor, 1));
                icon.add(this.add.rectangle(5, -1, 9, 2, 0xe2f4ff, 0.95));
                icon.add(this.add.rectangle(5, 2, 9, 2, 0xe2f4ff, 0.95));
            } else if (type === "cannon") {
                icon.add(this.add.rectangle(-2, 3, 12, 7, baseColor, 1));
                icon.add(this.add.circle(-6, 5, 2.8, dark, 1));
                icon.add(this.add.circle(3, 5, 2.8, dark, 1));
                icon.add(this.add.rectangle(5, -1, 10, 2.8, 0xf5dfc3, 1));
            } else if (type === "missile") {
                icon.add(this.add.rectangle(-1, 3, 10, 7, dark, 1));
                icon.add(
                    this.add.triangle(
                        -4,
                        -3,
                        -4,
                        2,
                        -1,
                        -5,
                        2,
                        2,
                        baseColor,
                        1,
                    ),
                );
                icon.add(
                    this.add.triangle(3, -3, 3, 2, 6, -6, 9, 2, baseColor, 1),
                );
            } else if (type === "laser") {
                icon.add(this.add.rectangle(-1, 3, 10, 7, dark, 1));
                icon.add(
                    this.add.triangle(
                        -1,
                        -5,
                        -5,
                        1,
                        -1,
                        -7,
                        3,
                        1,
                        baseColor,
                        1,
                    ),
                );
                icon.add(this.add.rectangle(7, -4, 9, 1.8, 0xbbf7ff, 0.95));
            } else if (type === "command") {
                icon.add(this.add.circle(-1, -2, 5, baseColor, 1));
                icon.add(this.add.rectangle(-1, -6, 1.6, 8, 0xffffff, 0.95));
                icon.add(this.add.rectangle(-4, -3, 7, 1.6, 0xffffff, 0.95));
                icon.add(this.add.circle(-1, -2, 9, bright, 0.18));
            } else if (type === "barricade") {
                icon.add(this.add.rectangle(-1, 3, 15, 9, dark, 1));
                icon.add(
                    this.add.circle(
                        -5,
                        -2,
                        2.2,
                        this.tintCardColor(baseColor, 1.1),
                        0.95,
                    ),
                );
                icon.add(
                    this.add.circle(
                        -1,
                        1,
                        2.2,
                        this.tintCardColor(baseColor, 1.1),
                        0.95,
                    ),
                );
                icon.add(
                    this.add.circle(
                        3,
                        -2,
                        2.2,
                        this.tintCardColor(baseColor, 1.1),
                        0.95,
                    ),
                );
            } else {
                icon.add(this.add.circle(0, 0, 6, baseColor, 1));
            }

            return icon;
        }

        createTowerCards() {
            const cards = App.dragDropSystem.getTowerCatalog();
            const cardHeight = 34;
            const cardStep = 39;
            let y = VIEW.panelY + 48;
            for (const card of cards) {
                const container = this.add.container(
                    VIEW.panelX + VIEW.panelWidth / 2,
                    y,
                );
                const bg = this.add
                    .rectangle(
                        0,
                        0,
                        VIEW.panelWidth - 20,
                        cardHeight,
                        0x1b2b42,
                        0.88,
                    )
                    .setStrokeStyle(1, 0x77a9e8, 0.28);
                const icon = this.createTowerCardIcon(card.type, card.color);
                const name = this.add.text(-98, -10, card.name, {
                    fontFamily: "Trebuchet MS",
                    fontSize: "12px",
                    color: "#dce8f7",
                });
                const meta = this.add.text(
                    -98,
                    4,
                    `Cost ${card.cost} | DMG ${card.damage}`,
                    {
                        fontFamily: "Trebuchet MS",
                        fontSize: "11px",
                        color: "#98abc4",
                    },
                );
                const plus = this.add
                    .rectangle(88, 0, 84, 22, 0x2d8b5d, 1)
                    .setStrokeStyle(1, 0x7cff9e, 0.55)
                    .setInteractive({ useHandCursor: true });
                plus.on("pointerdown", () =>
                    App.uiSystem.quickUpgradeByTowerType(App.state, card.type),
                );
                const plusText = this.add
                    .text(88, 0, "Nang cap tru", {
                        fontFamily: "Trebuchet MS",
                        fontSize: "10px",
                        color: "#dce8f7",
                    })
                    .setOrigin(0.5);
                container.add([bg, icon, name, meta, plus, plusText]);
                container.setSize(VIEW.panelWidth - 20, cardHeight);
                container.setInteractive(
                    new Phaser.Geom.Rectangle(
                        -(VIEW.panelWidth - 20) / 2,
                        -cardHeight / 2,
                        VIEW.panelWidth - 20,
                        cardHeight,
                    ),
                    Phaser.Geom.Rectangle.Contains,
                );
                this.input.setDraggable(container);
                container.setData("towerType", card.type);
                container.setData("originX", container.x);
                container.setData("originY", container.y);
                container.setData("bg", bg);
                container.setData("cardModel", card);
                this.cardRefs.push(container);
                y += cardStep;
            }
        }

        createSkillButtons() {
            const defs = Object.values(App.config.skills);
            let y = VIEW.panelY + 346;
            for (const skill of defs) {
                const button = makeButton(this, {
                    x: VIEW.panelX + VIEW.panelWidth / 2,
                    y,
                    width: VIEW.panelWidth - 24,
                    height: 26,
                    label: `${skill.name} (${skill.costCP} CP)`,
                    fontSize: "12px",
                    onClick: () =>
                        App.skillSystem.useSkill(App.state, skill.id),
                });
                const cd = this.add.text(VIEW.panelX + 14, y + 14, "", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "10px",
                    color: "#98abc4",
                });
                this.skillRefs.push({ id: skill.id, button, cd });
                y += 40;
            }
        }

        createActionButtons() {
            this.startWave = makeButton(this, {
                x: VIEW.panelX + VIEW.panelWidth / 2,
                y: VIEW.panelY + 468,
                width: VIEW.panelWidth - 24,
                height: 28,
                label: "Bắt đầu ngay",
                fontSize: "12px",
                baseColor: 0x2d8b5d,
                lineColor: 0x7cff9e,
                onClick: () => App.waveSystem.callEarlyStart(App.state),
            });
            this.quizButton = makeButton(this, {
                x: VIEW.panelX + VIEW.panelWidth / 2,
                y: VIEW.panelY + 502,
                width: VIEW.panelWidth - 24,
                height: 28,
                label: "Nhận tiếp tế",
                fontSize: "12px",
                baseColor: 0x1a5c7b,
                lineColor: 0x6fdcff,
                onClick: () =>
                    App.state.bus.emit(App.uiEventNames.OPEN_QUIZ, {}),
            });
        }

        createDetailPanel() {
            this.detailTexts.title = this.add.text(
                VIEW.panelX + 10,
                VIEW.panelY + 532,
                "",
                {
                    fontFamily: "Trebuchet MS",
                    fontSize: "13px",
                    color: "#dce8f7",
                },
            );
            this.detailTexts.line1 = this.add.text(
                VIEW.panelX + 10,
                VIEW.panelY + 549,
                "",
                {
                    fontFamily: "Trebuchet MS",
                    fontSize: "11px",
                    color: "#98abc4",
                },
            );
            this.detailTexts.line2 = this.add.text(
                VIEW.panelX + 10,
                VIEW.panelY + 564,
                "",
                {
                    fontFamily: "Trebuchet MS",
                    fontSize: "11px",
                    color: "#98abc4",
                },
            );

            this.towerButtons.upgrade = makeButton(this, {
                x: VIEW.panelX + 50,
                y: VIEW.panelY + 602,
                width: 80,
                height: 28,
                label: "Upgrade",
                onClick: () => App.uiSystem.upgradeSelectedTower(App.state),
            });
            this.towerButtons.repair = makeButton(this, {
                x: VIEW.panelX + 140,
                y: VIEW.panelY + 602,
                width: 80,
                height: 28,
                label: "Repair",
                onClick: () => App.uiSystem.repairSelectedTower(App.state),
            });
            this.towerButtons.sell = makeButton(this, {
                x: VIEW.panelX + 230,
                y: VIEW.panelY + 602,
                width: 80,
                height: 28,
                label: "Sell",
                baseColor: 0x8f3643,
                lineColor: 0xff6f7d,
                onClick: () => App.uiSystem.sellSelectedTower(App.state),
            });
            this.towerButtons.dmg = makeButton(this, {
                x: VIEW.panelX + 50,
                y: VIEW.panelY + 636,
                width: 80,
                height: 26,
                label: "+DMG",
                onClick: () =>
                    App.uiSystem.pointUpgradeSelectedTower(App.state, "damage"),
            });
            this.towerButtons.hp = makeButton(this, {
                x: VIEW.panelX + 140,
                y: VIEW.panelY + 636,
                width: 80,
                height: 26,
                label: "+HP",
                onClick: () =>
                    App.uiSystem.pointUpgradeSelectedTower(App.state, "hp"),
            });
            this.towerButtons.spd = makeButton(this, {
                x: VIEW.panelX + 230,
                y: VIEW.panelY + 636,
                width: 80,
                height: 26,
                label: "+SPD",
                onClick: () =>
                    App.uiSystem.pointUpgradeSelectedTower(App.state, "speed"),
            });

            this.baseButtons.upgrade = makeButton(this, {
                x: VIEW.panelX + 74,
                y: VIEW.panelY + 602,
                width: 126,
                height: 30,
                fontSize: "11px",
                label: "Base+",
                onClick: () => App.uiSystem.upgradeBase(App.state),
            });
            this.baseButtons.maxHp = makeButton(this, {
                x: VIEW.panelX + 206,
                y: VIEW.panelY + 602,
                width: 126,
                height: 30,
                fontSize: "11px",
                label: "MaxHP",
                onClick: () => App.uiSystem.boostBaseHp(App.state),
            });
            this.baseButtons.heal = makeButton(this, {
                x: VIEW.panelX + 206,
                y: VIEW.panelY + 602,
                width: 126,
                height: 30,
                fontSize: "11px",
                label: "Heal",
                onClick: () => App.uiSystem.healBase(App.state),
            });
        }

        registerDrag() {
            this.input.on("dragstart", (_pointer, object) => {
                if (!object.getData("towerType")) {
                    return;
                }
                App.state.drag.activeTowerType = object.getData("towerType");
                App.state.drag.previewCard =
                    object.getData("cardModel") || null;
                App.state.drag.hoverValid = false;
                const bg = object.getData("bg");
                if (bg) {
                    bg.setFillStyle(0x355375, 0.95);
                }
            });

            this.input.on("drag", (pointer, object) => {
                if (!object.getData("towerType")) {
                    return;
                }
                if (!isWorldPoint(pointer.x, pointer.y)) {
                    App.state.drag.canPlace = false;
                    App.state.drag.hoverValid = false;
                    return;
                }
                const point = screenToWorld(pointer.x, pointer.y);
                App.state.drag.hoverX = point.x;
                App.state.drag.hoverY = point.y;
                App.state.drag.hoverValid = true;
                App.state.drag.canPlace = App.dragDropSystem.canPlaceTowerAt(
                    App.state,
                    object.getData("towerType"),
                    point.x,
                    point.y,
                );
            });

            this.input.on("dragend", (pointer, object) => {
                if (!object.getData("towerType")) {
                    return;
                }
                if (
                    isWorldPoint(pointer.x, pointer.y) &&
                    App.state.mode === "playing" &&
                    !App.state.paused &&
                    !App.modalState.active
                ) {
                    const point = screenToWorld(pointer.x, pointer.y);
                    const result = App.dragDropSystem.tryPlaceTower(
                        App.state,
                        object.getData("towerType"),
                        point.x,
                        point.y,
                    );
                    if (!result.ok) {
                        App.Effects.addFloatingText(
                            App.state,
                            point.x - 20,
                            point.y - 20,
                            result.message,
                            "#ff8d9b",
                        );
                    }
                }
                App.state.drag.activeTowerType = null;
                App.state.drag.canPlace = false;
                App.state.drag.hoverValid = false;
                App.state.drag.previewCard = null;
                object.x = object.getData("originX");
                object.y = object.getData("originY");
                const bg = object.getData("bg");
                if (bg) {
                    bg.setFillStyle(0x1b2b42, 0.88);
                }
            });
        }

        update() {
            const state = App.state;
            const visible = state.mode === "playing" || state.mode === "result";
            for (const child of this.children.list) {
                child.setVisible(visible);
            }
            if (!visible || !state.base) {
                return;
            }

            const hud = App.uiSystem.getHudModel(state);
            this.hudTexts.baseHp.setText(`Base HP: ${hud.baseHp}`);
            this.hudTexts.supplies.setText(`Supplies: ${hud.supplies}`);
            this.hudTexts.cp.setText(`Command Points: ${hud.cp}`);
            this.hudTexts.wave.setText(`Wave: ${hud.wave}`);
            this.hudTexts.enemy.setText(`Enemies left: ${hud.enemiesLeft}`);
            this.hudTexts.quiz.setText(hud.quizCd);
            this.hudTexts.waveState.setText(hud.waveState);
            this.hudTexts.boss.setVisible(hud.bossWarningVisible);
            this.pauseButton.setLabel(state.paused ? "Resume" : "Pause");

            const skills = App.skillSystem.getSkillCards(state);
            for (const ref of this.skillRefs) {
                const model = skills.find((item) => item.id === ref.id);
                if (!model) {
                    continue;
                }
                ref.button.setLabel(
                    model.activeTargeting
                        ? "Targeting..."
                        : `${model.name} (${model.costCP} CP)`,
                );
                ref.button.setEnabled(model.enabled);
                ref.cd.setText(
                    model.cooldown > 0
                        ? `CD: ${model.cooldown.toFixed(1)}s`
                        : "CD ready",
                );
            }

            this.updateDetail(state);
        }

        updateDetail(state) {
            const tower = App.uiSystem.getTowerPanelModel(state);
            if (tower) {
                this.detailTexts.title.setText(
                    `${tower.towerName} (Lv.${tower.level})`,
                );
                this.detailTexts.line1.setText(
                    `HP ${tower.hp}/${tower.maxHp} | Armor ${tower.armor}`,
                );
                this.detailTexts.line2.setText(
                    `DMG ${tower.damage} | RNG ${tower.range} | SPD ${tower.attackSpeed}`,
                );
                this.towerButtons.upgrade.setVisible(true);
                this.towerButtons.repair.setVisible(true);
                this.towerButtons.sell.setVisible(true);
                this.towerButtons.dmg.setVisible(true);
                this.towerButtons.hp.setVisible(true);
                this.towerButtons.spd.setVisible(true);
                this.towerButtons.upgrade.setLabel(tower.buttons.upgrade.text);
                this.towerButtons.repair.setLabel(tower.buttons.repair.text);
                this.towerButtons.dmg.setLabel(tower.buttons.pointDamage.text);
                this.towerButtons.hp.setLabel(tower.buttons.pointHp.text);
                this.towerButtons.spd.setLabel(tower.buttons.pointSpeed.text);
                this.towerButtons.upgrade.setEnabled(
                    tower.buttons.upgrade.enabled,
                );
                this.towerButtons.repair.setEnabled(
                    tower.buttons.repair.enabled,
                );
                this.towerButtons.sell.setEnabled(true);
                this.towerButtons.dmg.setEnabled(
                    tower.buttons.pointDamage.enabled,
                );
                this.towerButtons.hp.setEnabled(tower.buttons.pointHp.enabled);
                this.towerButtons.spd.setEnabled(
                    tower.buttons.pointSpeed.enabled,
                );
                this.baseButtons.upgrade.setVisible(false);
                this.baseButtons.maxHp.setVisible(false);
                this.baseButtons.heal.setVisible(false);
                return;
            }

            const base = App.uiSystem.getBasePanelModel(state);
            this.detailTexts.title.setText(`Main base (Lv.${base.level})`);
            this.detailTexts.line1.setText(
                `HP ${base.hp}/${base.maxHp} | Armor ${base.armor}`,
            );
            this.detailTexts.line2.setText(
                `HP boost: ${base.hpBoostLevel} | Heal: ${base.healReady ? "Ready" : "Used"}`,
            );
            this.towerButtons.upgrade.setVisible(false);
            this.towerButtons.repair.setVisible(false);
            this.towerButtons.sell.setVisible(false);
            this.towerButtons.dmg.setVisible(false);
            this.towerButtons.hp.setVisible(false);
            this.towerButtons.spd.setVisible(false);
            this.baseButtons.upgrade.setVisible(true);
            const showHpBoost = base.level >= 3;
            this.baseButtons.maxHp.setVisible(showHpBoost);
            this.baseButtons.heal.setVisible(true);
            this.baseButtons.upgrade.setLabel(
                base.level < 3
                    ? `Nâng cấp (${base.upgradeCost} CP)`
                    : "Căn cứ tối đa",
            );
            this.baseButtons.maxHp.setLabel(`MaxHP (${base.hpBoostCost} CP)`);
            this.baseButtons.heal.setLabel(
                base.healReady
                    ? `Hồi máu (${base.healCost} CP)`
                    : "Hồi máu (Đã dùng)",
            );
            this.baseButtons.upgrade.setEnabled(base.buttons.upgrade.enabled);
            this.baseButtons.maxHp.setEnabled(
                showHpBoost && base.buttons.hpBoost.enabled,
            );
            this.baseButtons.heal.setEnabled(base.buttons.heal.enabled);

            this.baseButtons.upgrade.setPosition(
                VIEW.panelX + 74,
                VIEW.panelY + 602,
            );
            if (showHpBoost) {
                this.baseButtons.maxHp.setPosition(
                    VIEW.panelX + 206,
                    VIEW.panelY + 602,
                );
                this.baseButtons.heal.setPosition(
                    VIEW.panelX + 140,
                    VIEW.panelY + 636,
                );
            } else {
                this.baseButtons.heal.setPosition(
                    VIEW.panelX + 206,
                    VIEW.panelY + 602,
                );
            }
        }
    }

    class ModalScene extends Phaser.Scene {
        constructor() {
            super("ModalScene");
            this.answerButtons = [];
            this.currentType = null;
            this.pendingTowerType = null;
        }

        create() {
            this.overlay = this.add
                .rectangle(
                    VIEW.width / 2,
                    VIEW.height / 2,
                    VIEW.width,
                    VIEW.height,
                    0x040a0f,
                    0.82,
                )
                .setDepth(150)
                .setVisible(false);
            this.panel = this.add
                .rectangle(
                    VIEW.width / 2,
                    VIEW.height / 2,
                    760,
                    520,
                    0x102338,
                    0.98,
                )
                .setStrokeStyle(1, 0x6195d8, 0.45)
                .setDepth(151)
                .setVisible(false);
            this.title = this.add
                .text(VIEW.width / 2, VIEW.height / 2 - 220, "", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "28px",
                    color: "#dce8f7",
                    fontStyle: "bold",
                })
                .setOrigin(0.5)
                .setDepth(152)
                .setVisible(false);
            this.body = this.add
                .text(VIEW.width / 2 - 330, VIEW.height / 2 - 176, "", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "17px",
                    color: "#dce8f7",
                    wordWrap: { width: 660, useAdvancedWrap: true },
                })
                .setDepth(152)
                .setVisible(false);
            this.feedback = this.add
                .text(VIEW.width / 2 - 330, VIEW.height / 2 + 74, "", {
                    fontFamily: "Trebuchet MS",
                    fontSize: "14px",
                    color: "#9fb7d3",
                    wordWrap: { width: 660, useAdvancedWrap: true },
                })
                .setDepth(152)
                .setVisible(false);

            this.btnClose = makeButton(this, {
                x: VIEW.width / 2,
                y: VIEW.height / 2 + 220,
                width: 170,
                height: 38,
                label: "Close",
                onClick: () => this.hide(),
            });
            this.btnClose.setDepth(152);
            this.btnClose.setVisible(false);
            this.btnConfirm = makeButton(this, {
                x: VIEW.width / 2 - 90,
                y: VIEW.height / 2 + 220,
                width: 170,
                height: 38,
                label: "Confirm",
                onClick: () => this.confirmTowerUpgrade(),
            });
            this.btnConfirm.setDepth(152);
            this.btnConfirm.setVisible(false);
            this.btnCancel = makeButton(this, {
                x: VIEW.width / 2 + 90,
                y: VIEW.height / 2 + 220,
                width: 170,
                height: 38,
                label: "Cancel",
                onClick: () => this.hide(),
            });
            this.btnCancel.setDepth(152);
            this.btnCancel.setVisible(false);
            this.btnRestart = makeButton(this, {
                x: VIEW.width / 2 - 90,
                y: VIEW.height / 2 + 220,
                width: 170,
                height: 38,
                label: "Restart",
                onClick: () => this.restartGame(),
            });
            this.btnRestart.setDepth(152);
            this.btnRestart.setVisible(false);
            this.btnMenu = makeButton(this, {
                x: VIEW.width / 2 + 90,
                y: VIEW.height / 2 + 220,
                width: 170,
                height: 38,
                label: "Back menu",
                onClick: () => this.backMenu(),
            });
            this.btnMenu.setDepth(152);
            this.btnMenu.setVisible(false);

            const bus = App.state.bus;
            bus.on(App.uiEventNames.OPEN_QUIZ, () => this.openQuiz());
            bus.on(App.uiEventNames.OPEN_HELP, () => this.openHelp());
            bus.on(App.uiEventNames.OPEN_RESULT, () => this.openResult());
            bus.on(App.uiEventNames.OPEN_TOWER_UPGRADE, (payload) =>
                this.openTowerUpgrade(payload),
            );
            bus.on(App.uiEventNames.ANTI_CHEAT_LOCK, (payload) =>
                this.openAntiCheat(payload && payload.reason),
            );
            bus.on(App.uiEventNames.ANTI_CHEAT_UNLOCK, () => {
                if (this.currentType === "anti") {
                    this.hide();
                }
            });
        }

        show(type) {
            this.hide();
            this.currentType = type;
            this.overlay.setVisible(true);
            this.panel.setVisible(true);
            this.title.setVisible(true);
            this.body.setVisible(true);
            this.feedback.setVisible(true);
            App.modalState.active = true;
            App.modalState.type = type;
            this.scene.bringToTop();
        }

        hide() {
            this.currentType = null;
            this.pendingTowerType = null;
            this.overlay.setVisible(false);
            this.panel.setVisible(false);
            this.title.setVisible(false);
            this.body.setVisible(false);
            this.feedback.setVisible(false);
            this.btnClose.setVisible(false);
            this.btnConfirm.setVisible(false);
            this.btnCancel.setVisible(false);
            this.btnRestart.setVisible(false);
            this.btnMenu.setVisible(false);
            for (const btn of this.answerButtons) {
                btn.destroy();
            }
            this.answerButtons = [];
            App.modalState.active = false;
            App.modalState.type = null;
        }

        clearAnswerButtons() {
            for (const btn of this.answerButtons) {
                btn.destroy();
            }
            this.answerButtons = [];
        }

        measureWrappedHeight(text, width, fontSize) {
            const probe = this.add
                .text(-9999, -9999, text, {
                    fontFamily: "Trebuchet MS",
                    fontSize: `${fontSize}px`,
                    color: "#dce8f7",
                    align: "center",
                    wordWrap: { width, useAdvancedWrap: true },
                })
                .setOrigin(0.5);
            const h = probe.height;
            probe.destroy();
            return h;
        }

        createQuizAnswerButton(label, x, y, width, height, fontSize, onClick) {
            const bg = this.add
                .rectangle(x, y, width, height, 0x274669, 1)
                .setStrokeStyle(1, 0x6f96c7, 0.55);
            bg.setInteractive({ useHandCursor: true });
            const text = this.add
                .text(x, y, label, {
                    fontFamily: "Trebuchet MS",
                    fontSize: `${fontSize}px`,
                    color: "#dce8f7",
                    align: "center",
                    wordWrap: { width: width - 32, useAdvancedWrap: true },
                })
                .setOrigin(0.5);

            const ref = {
                bg,
                text,
                enabled: true,
                setEnabled(value) {
                    ref.enabled = !!value;
                    bg.setAlpha(ref.enabled ? 1 : 0.45);
                    text.setAlpha(ref.enabled ? 1 : 0.5);
                },
                setVisible(value) {
                    bg.setVisible(value);
                    text.setVisible(value);
                },
                setDepth(value) {
                    bg.setDepth(value);
                    text.setDepth(value);
                },
                destroy() {
                    bg.destroy();
                    text.destroy();
                },
            };

            bg.on("pointerdown", () => {
                if (!ref.enabled) {
                    return;
                }
                if (typeof onClick === "function") {
                    onClick();
                }
            });

            return ref;
        }

        renderQuizQuestion(payload, carryFeedback) {
            this.clearAnswerButtons();
            const left = VIEW.width / 2 - 330;
            const questionTop = VIEW.height / 2 - 166;
            const buttonCenterX = VIEW.width / 2;
            const buttonWidth = 640;
            const answerBottom = VIEW.height / 2 + 146;
            let questionFontSize = 17;
            for (; questionFontSize >= 14; questionFontSize -= 1) {
                this.body.setStyle({
                    fontFamily: "Trebuchet MS",
                    fontSize: `${questionFontSize}px`,
                    color: "#dce8f7",
                    wordWrap: { width: 660, useAdvancedWrap: true },
                });
                this.body.setPosition(left, questionTop);
                this.body.setText(payload.question);
                if (this.body.height <= 126) {
                    break;
                }
            }

            const answerTop = questionTop + this.body.height + 18;
            const spaceAvailable = Math.max(140, answerBottom - answerTop);
            let answerFontSize = 15;
            let heights = [];
            const spacing = 8;

            for (; answerFontSize >= 12; answerFontSize -= 1) {
                heights = payload.answers.map((answer, idx) => {
                    const label = `${String.fromCharCode(65 + idx)}. ${answer}`;
                    const textHeight = this.measureWrappedHeight(
                        label,
                        buttonWidth - 32,
                        answerFontSize,
                    );
                    return Math.max(40, textHeight + 14);
                });
                const totalHeight =
                    heights.reduce((sum, h) => sum + h, 0) +
                    Math.max(0, payload.answers.length - 1) * spacing;
                if (totalHeight <= spaceAvailable) {
                    break;
                }
            }

            let y = answerTop;
            for (let i = 0; i < payload.answers.length; i += 1) {
                const label = `${String.fromCharCode(65 + i)}. ${payload.answers[i]}`;
                const height = heights[i] || 40;
                const btn = this.createQuizAnswerButton(
                    label,
                    buttonCenterX,
                    y + height / 2,
                    buttonWidth,
                    height,
                    answerFontSize,
                    () => this.answerQuiz(i),
                );
                btn.setDepth(152);
                this.answerButtons.push(btn);
                y += height + spacing;
            }

            this.feedback.setPosition(left, VIEW.height / 2 + 164);
            if (carryFeedback) {
                this.feedback.setColor("#7cff9e");
                this.feedback.setText(carryFeedback);
            } else {
                this.feedback.setText("");
            }
        }

        openQuiz() {
            const opened = App.quizSystem.openQuiz(App.state);
            if (!opened.ok) {
                if (opened.reason === "cooldown") {
                    App.Effects.addFloatingText(
                        App.state,
                        24,
                        84,
                        "Quiz cooldown",
                        "#ff9fb6",
                    );
                } else if (opened.reason === "no-data") {
                    App.Effects.addFloatingText(
                        App.state,
                        24,
                        84,
                        "No question data",
                        "#ff9fb6",
                    );
                }
                return;
            }

            this.show("quiz");
            this.title.setText("Câu hỏi tiếp tế");
            this.feedback.setText("");
            this.btnClose.bg.removeAllListeners("pointerdown");
            this.btnClose.bg.on("pointerdown", () => {
                App.quizSystem.closeQuiz();
                this.hide();
            });
            this.btnClose.setLabel("Close");
            this.btnClose.setEnabled(true);
            this.btnClose.setVisible(true);
            this.renderQuizQuestion(opened, "");
        }

        answerQuiz(index) {
            const result = App.quizSystem.answerQuiz(App.state, index);
            if (!result.ok) {
                return;
            }
            for (const btn of this.answerButtons) {
                btn.setEnabled(false);
            }
            if (result.correct) {
                this.feedback.setColor("#7cff9e");
                this.feedback.setText(
                    `Correct! +${result.reward} Supplies, +${result.cpGain} CP`,
                );
                this.time.delayedCall(420, () => {
                    if (this.currentType !== "quiz" || !App.modalState.active) {
                        return;
                    }
                    const next = App.quizSystem.openQuiz(App.state);
                    if (!next.ok) {
                        if (next.reason === "cooldown") {
                            this.feedback.setColor("#ff8e95");
                            this.feedback.setText(
                                `Quiz cooldown ${Math.ceil(next.cooldown || 0)}s.`,
                            );
                        } else {
                            this.feedback.setColor("#9fb7d3");
                            this.feedback.setText(
                                "No more question. You can close quiz.",
                            );
                        }
                        return;
                    }
                    this.renderQuizQuestion(
                        next,
                        `Correct! +${result.reward} Supplies, +${result.cpGain} CP`,
                    );
                });
            } else {
                this.feedback.setColor("#ff8e95");
                this.feedback.setText(
                    `Đáp án sai: Không nhận được tiếp tế. Được trả lời lại sau: ${App.config.quiz.wrongCooldown}s.\n${result.explanation}`,
                );
                this.btnClose.setLabel("Close");
                this.btnClose.setEnabled(true);
                this.btnClose.setVisible(true);
            }
        }

        openHelp() {
            this.show("help");
            this.title.setText("Hướng dẫn chiến đấu");
            this.body.setText(
                "- Kéo các trụ phòng thủ (tower) từ bảng bên phải vào các ô trên bản đồ.\n- Nhấn nút Nhận tiếp tế  để nhận tiếp tế (supplies).\n- Nhấp vào trụ để nâng cấp / sửa chữa / bán.\n- Một số kẻ địch có thể tấn công công trình của bạn.\n- Chế độ Endless luôn có Boss.\n- Cờ Việt Nam = phe người chơi, Cờ Mỹ = phe địch.",
            );
            this.feedback.setText("");
            this.btnClose.bg.removeAllListeners("pointerdown");
            this.btnClose.bg.on("pointerdown", () => this.hide());
            this.btnClose.setVisible(true);
        }

        openResult() {
            const result = App.uiSystem.getResultModel(App.state);
            this.show("result");
            this.title.setText(result.title);
            this.body.setText(
                `${result.reason}\n\nHighest wave: ${result.wave}\nPlay time: ${result.playTime}\nCorrect answers: ${result.correctAnswers} | Wrong: ${result.wrongAnswers}\nTowers built: ${result.towersBuilt}\nEnemies killed: ${result.enemiesKilled}\nWaves cleared: ${result.wavesCleared}`,
            );
            this.feedback.setText("");
            this.btnRestart.setVisible(true);
            this.btnMenu.setVisible(true);
        }

        openTowerUpgrade(payload) {
            if (!payload || !payload.info) {
                return;
            }
            this.show("towerUpgrade");
            this.pendingTowerType = payload.towerType;
            this.title.setText(`Upgrade ${payload.towerName}`);
            this.body.setText(
                payload.info.canUpgrade
                    ? `Current level (global): ${payload.info.level} -> ${payload.info.level + 1}\nCost: ${payload.info.price} Supplies.`
                    : "Already at max level.",
            );
            this.feedback.setText("");
            this.btnConfirm.setVisible(true);
            this.btnCancel.setVisible(true);
            this.btnConfirm.setLabel(
                payload.info.canUpgrade
                    ? `Upgrade (${payload.info.price})`
                    : "Maxed",
            );
            this.btnConfirm.setEnabled(payload.info.canUpgrade);
        }

        confirmTowerUpgrade() {
            if (!this.pendingTowerType) {
                return;
            }
            App.uiSystem.quickUpgradeByTowerType(
                App.state,
                this.pendingTowerType,
            );
            this.hide();
        }

        openAntiCheat(reason) {
            this.show("anti");
            this.title.setText("Developer tools locked");
            this.body.setText(
                `Game paused because devtools/inspect was detected.\nClose devtools and press close to continue.\n\nDetected by: ${reason || "unknown"}`,
            );
            this.feedback.setText("");
            this.btnClose.setLabel("Close popup");
            this.btnClose.setVisible(true);
            this.btnClose.bg.removeAllListeners("pointerdown");
            this.btnClose.bg.on("pointerdown", () => {
                if (App.antiCheatSystem) {
                    App.antiCheatSystem.dismiss();
                } else {
                    this.hide();
                }
            });
        }

        restartGame() {
            App.game.startEndless();
            App.game.clearResultNotify();
            this.hide();
        }

        backMenu() {
            App.state.mode = "menu";
            App.game.clearResultNotify();
            App.quizSystem.closeQuiz();
            this.hide();
            if (this.scene.isActive("BattleScene")) {
                this.scene.stop("BattleScene");
            }
            this.scene.start("MenuScene");
        }
    }

    App.BootScene = BootScene;
    App.MenuScene = MenuScene;
    App.BattleScene = BattleScene;
    App.UIScene = UIScene;
    App.ModalScene = ModalScene;
})();
