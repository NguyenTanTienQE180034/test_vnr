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

    const UI_THEME = {
        fontFamily: "Consolas",
        textPrimary: "#e8e2cc",
        textMuted: "#b8ac8d",
        buttonBg: 0x33452a,
        buttonBorder: 0xa3bb7f,
        buttonText: "#e9f2d8",
        buttonHover: 0x3f5633,
        panelBg: 0x17070b,
        panelBorder: 0x815448,
        cardBg: 0x271218,
        cardBorder: 0xae7d68,
        topbarBg: 0x1a070d,
        topbarBorder: 0x7c4d42,
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
        const baseColor = options.baseColor || UI_THEME.buttonBg;
        const hoverColor = options.hoverColor || UI_THEME.buttonHover;
        const lineColor = options.lineColor || UI_THEME.buttonBorder;
        const bg = scene.add.rectangle(
            options.x,
            options.y,
            options.width,
            options.height,
            baseColor,
            1,
        );
        bg.setStrokeStyle(1, lineColor, 0.55);
        bg.setInteractive({ useHandCursor: true });
        const baseFontSize =
            Number.parseInt(String(options.fontSize || "14px"), 10) || 14;
        const text = scene.add
            .text(options.x, options.y, "", {
                fontFamily: options.fontFamily || UI_THEME.fontFamily,
                fontSize: `${baseFontSize}px`,
                color: options.textColor || UI_THEME.buttonText,
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
        bg.on("pointerover", () => {
            if (!ref.enabled) {
                return;
            }
            bg.setFillStyle(hoverColor, 1);
        });
        bg.on("pointerout", () => {
            bg.setFillStyle(baseColor, 1);
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
                baseColor: 0x415b33,
                lineColor: 0xb8d59b,
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

            g.fillStyle(0xa1ad90, 1);
            g.fillRect(
                VIEW.worldX,
                VIEW.worldY,
                VIEW.worldWidth,
                VIEW.worldHeight,
            );
            g.fillStyle(0xb6c1a5, 0.44);
            g.fillRect(VIEW.worldX, VIEW.worldY + 24, VIEW.worldWidth, 120);
            g.fillStyle(0x8f9c80, 0.32);
            g.fillRect(
                VIEW.worldX,
                VIEW.worldY + VIEW.worldHeight - 170,
                VIEW.worldWidth,
                146,
            );

            for (let gy = VIEW.worldY; gy < VIEW.worldY + VIEW.worldHeight; gy += 56) {
                for (let gx = VIEW.worldX; gx < VIEW.worldX + VIEW.worldWidth; gx += 56) {
                    const checker = ((gx + gy) / 56) % 2 === 0;
                    g.fillStyle(checker ? 0xacb79a : 0x95a084, 0.3);
                    g.fillRect(gx + 2, gy + 2, 52, 52);
                }
            }

            const drawPathLayer = (width, color, alpha) => {
                g.lineStyle(width, color, alpha);
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
            };

            drawPathLayer(50, 0x5f5848, 1);
            drawPathLayer(32, 0x786c56, 1);
            drawPathLayer(15, 0x978666, 1);
            drawPathLayer(3, 0xd4c39f, 0.22);

            const spawn = worldToScreen(mapDef.spawn.x, mapDef.spawn.y);
            g.fillStyle(0x8fab76, 0.95);
            g.fillRect(spawn.x - 14, spawn.y - 14, 28, 28);
            g.fillStyle(0x4d6243, 1);
            g.fillRect(spawn.x - 7, spawn.y - 7, 14, 14);
            g.lineStyle(2, 0xdfe7c6, 0.74);
            g.strokeRect(spawn.x - 15, spawn.y - 15, 30, 30);

            for (const slot of mapDef.towerSlots) {
                const p = worldToScreen(slot.x, slot.y);
                g.fillStyle(0x6a6758, 0.82);
                g.fillRect(p.x - 22, p.y - 22, 44, 44);
                g.lineStyle(2, 0xcfc39f, 0.52);
                g.strokeRect(p.x - 20, p.y - 20, 40, 40);
                g.fillStyle(0x7f7a67, 0.66);
                g.fillRect(p.x - 12, p.y - 12, 24, 24);
            }

            const base = worldToScreen(state.base.x, state.base.y);
            const baseWidth = state.base.radius * 2 + 24;
            const baseHeight = state.base.radius + 24;
            g.fillStyle(0x6e7d87, 0.95);
            g.fillRect(
                base.x - baseWidth / 2,
                base.y - baseHeight / 2,
                baseWidth,
                baseHeight,
            );
            g.fillStyle(0x5c6d78, 1);
            g.fillRect(base.x - 18, base.y - baseHeight / 2 - 8, 36, 16);
            g.fillStyle(0x3b4b56, 1);
            g.fillRect(base.x + 8, base.y - baseHeight / 2 - 2, 24, 4);
            g.lineStyle(2, 0xcad8e3, 0.62);
            g.strokeRect(
                base.x - baseWidth / 2,
                base.y - baseHeight / 2,
                baseWidth,
                baseHeight,
            );
            this.drawHealthBar(
                g,
                base.x,
                base.y - baseHeight / 2 - 24,
                100,
                state.base.hp,
                state.base.maxHp,
                0xff9f8f,
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
            const dark = this.tintColor(baseColor, 0.62);
            const bright = this.tintColor(baseColor, 1.22);
            const steel = 0x7b8189;
            const barrel = 0x11161e;
            const level = Math.max(1, Math.min(3, tower.level || 1));
            const tierScale = level === 1 ? 1 : level === 2 ? 1.12 : 1.26;
            const phase =
                (Number.parseInt(
                    String(tower.id || "").replace(/\D+/g, ""),
                    10,
                ) || 0) * 0.33;
            const pulse = 0.84 + Math.sin(this.time.now * 0.008 + phase) * 0.16;

            g.fillStyle(0x000000, 0.26);
            g.fillRect(
                p.x - (tower.isBarricade ? 28 : Math.round(20 * tierScale)),
                p.y + 17,
                tower.isBarricade ? 56 : Math.round(40 * tierScale),
                4,
            );
            g.lineStyle(1.6, 0x101318, 0.62);
            g.strokeRect(
                p.x - (tower.isBarricade ? 26 : Math.round(18 * tierScale)),
                p.y - 14,
                tower.isBarricade ? 52 : Math.round(36 * tierScale),
                tower.isBarricade ? 28 : 25,
            );

            if (tower.isBarricade) {
                const width =
                    tower.level === 1 ? 34 : tower.level === 2 ? 42 : 52;
                const height =
                    tower.level === 1 ? 18 : tower.level === 2 ? 22 : 28;
                const left = Math.round(p.x - width / 2);
                const top = Math.round(p.y - height / 2 + 2);
                g.fillStyle(0x4d3f2f, 1);
                g.fillRect(left, top, width, height);
                g.fillStyle(0x6d5841, 0.95);
                g.fillRect(left + 2, top + 2, width - 4, height - 4);
                g.lineStyle(2, 0xcbb58f, 0.55);
                g.strokeRect(left, top, width, height);
                g.fillStyle(0x2b2117, 0.95);
                for (let i = 0; i < 4; i += 1) {
                    const x = left + 4 + i * ((width - 8) / 4);
                    g.fillRect(x, top + height - 6, 3, 4);
                }
                if (level >= 2) {
                    g.fillStyle(0xd8c29b, 0.9);
                    g.fillRect(left + 5, top - 3, 4, 3);
                    g.fillRect(left + width - 9, top - 3, 4, 3);
                }
                if (level >= 3) {
                    g.fillStyle(0xcdb48d, 0.95);
                    for (let i = 0; i < 4; i += 1) {
                        g.fillRect(left + 8 + i * 10, top - 4, 2, 4);
                    }
                }
                return;
            }

            g.fillStyle(steel, 0.95);
            g.fillRect(
                p.x - Math.round(16 * tierScale),
                p.y + 8,
                Math.round(32 * tierScale),
                5,
            );
            g.fillStyle(this.tintColor(steel, 1.18), 0.9);
            g.fillRect(
                p.x - Math.round(14 * tierScale),
                p.y + 9,
                Math.round(28 * tierScale),
                2,
            );

            if (tower.type === "infantry") {
                g.fillStyle(dark, 1);
                g.fillRect(
                    p.x - Math.round(13 * tierScale),
                    p.y - 2,
                    Math.round(26 * tierScale),
                    12,
                );
                g.fillStyle(baseColor, 1);
                g.fillRect(
                    p.x - Math.round(7 * tierScale),
                    p.y - 9,
                    Math.round(14 * tierScale),
                    8,
                );
                g.fillStyle(0x1f2938, 1);
                g.fillRect(p.x + Math.round(6 * tierScale), p.y - 5, 12, 3);
                g.fillStyle(0xe6edf8, 0.85);
                g.fillRect(p.x - 2, p.y - 6, 4, 2);
                if (level >= 2) {
                    g.fillStyle(this.tintColor(baseColor, 1.12), 1);
                    g.fillRect(p.x - 12, p.y - 1, 3, 7);
                    g.fillRect(p.x + 9, p.y - 1, 3, 7);
                }
                if (level >= 3) {
                    g.fillStyle(0x1f2938, 1);
                    g.fillRect(p.x + 6, p.y - 8, 13, 2);
                    g.fillRect(p.x + 6, p.y - 3, 13, 2);
                }
            } else if (tower.type === "machineGun") {
                g.fillStyle(dark, 1);
                g.fillRect(
                    p.x - Math.round(14 * tierScale),
                    p.y - 1,
                    Math.round(28 * tierScale),
                    11,
                );
                g.fillStyle(baseColor, 1);
                g.fillRect(
                    p.x - Math.round(8 * tierScale),
                    p.y - 8,
                    Math.round(16 * tierScale),
                    7,
                );
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + Math.round(6 * tierScale), p.y - 8, 14, 2);
                g.fillRect(p.x + Math.round(6 * tierScale), p.y - 4, 14, 2);
                g.fillStyle(0x8f7350, 1);
                g.fillRect(p.x - Math.round(15 * tierScale), p.y - 2, 4, 9);
                if (level >= 2) {
                    g.fillStyle(this.tintColor(baseColor, 1.1), 0.95);
                    g.fillRect(p.x - 4, p.y - 12, 8, 4);
                }
                if (level >= 3) {
                    g.fillStyle(barrel, 1);
                    g.fillRect(p.x + Math.round(6 * tierScale), p.y - 6, 14, 2);
                    g.fillStyle(0x2a323f, 0.95);
                    g.fillRect(p.x - 2, p.y - 13, 4, 5);
                }
            } else if (tower.type === "cannon") {
                g.fillStyle(dark, 1);
                g.fillRect(
                    p.x - Math.round(16 * tierScale),
                    p.y - 1,
                    Math.round(32 * tierScale),
                    11,
                );
                g.fillStyle(baseColor, 1);
                g.fillRect(
                    p.x - Math.round(10 * tierScale),
                    p.y - 9,
                    Math.round(20 * tierScale),
                    8,
                );
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + Math.round(6 * tierScale), p.y - 7, 18, 4);
                g.fillStyle(0x8d949d, 1);
                g.fillRect(p.x - Math.round(14 * tierScale), p.y + 8, 5, 5);
                g.fillRect(p.x + Math.round(9 * tierScale), p.y + 8, 5, 5);
                if (level >= 2) {
                    g.fillStyle(barrel, 1);
                    g.fillRect(p.x + Math.round(8 * tierScale), p.y - 11, 18, 3);
                }
                if (level >= 3) {
                    g.fillStyle(0x2c3440, 1);
                    g.fillRect(p.x + Math.round(9 * tierScale), p.y - 4, 18, 3);
                }
            } else if (tower.type === "missile") {
                g.fillStyle(dark, 1);
                g.fillRect(
                    p.x - Math.round(14 * tierScale),
                    p.y - 1,
                    Math.round(28 * tierScale),
                    11,
                );
                g.fillStyle(baseColor, 1);
                g.fillRect(
                    p.x - Math.round(9 * tierScale),
                    p.y - 8,
                    Math.round(18 * tierScale),
                    7,
                );
                g.fillStyle(0xe5ddd2, 1);
                g.fillRect(p.x - 6, p.y - 16, 4, 14);
                g.fillRect(p.x + 2, p.y - 16, 4, 14);
                g.fillStyle(0x242d3c, 1);
                g.fillRect(p.x - 5, p.y - 17, 2, 2);
                g.fillRect(p.x + 3, p.y - 17, 2, 2);
                if (level >= 2) {
                    g.fillStyle(0xe5ddd2, 1);
                    g.fillRect(p.x - 11, p.y - 14, 3, 11);
                    g.fillRect(p.x + 8, p.y - 14, 3, 11);
                }
                if (level >= 3) {
                    g.fillStyle(this.tintColor(baseColor, 1.15), 0.95);
                    g.fillRect(p.x - 2, p.y - 22, 4, 5);
                    g.fillStyle(0x293142, 1);
                    g.fillRect(p.x - 1, p.y - 12, 2, 7);
                }
            } else if (tower.type === "laser") {
                g.fillStyle(dark, 1);
                g.fillRect(
                    p.x - Math.round(13 * tierScale),
                    p.y - 1,
                    Math.round(26 * tierScale),
                    11,
                );
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 4, p.y - 11, 8, 10);
                g.fillStyle(0xafefff, 0.95);
                g.fillRect(p.x + 4, p.y - 7, 13, 2);
                g.fillRect(p.x + 4, p.y - 4, 13, 2);
                if (level >= 2) {
                    g.fillStyle(0xafefff, 0.9);
                    g.fillRect(p.x + 4, p.y - 10, 11, 2);
                }
                if (level >= 3) {
                    g.fillStyle(0xdaf9ff, 0.95);
                    g.fillRect(p.x - 1, p.y - 15, 2, 4);
                    g.fillRect(p.x - 6, p.y - 12, 12, 2);
                }
                const auraPad = level === 3 ? 22 : level === 2 ? 20 : 18;
                g.lineStyle(2, 0x8fdcff, 0.5 + pulse * 0.3);
                g.strokeRect(
                    p.x - auraPad,
                    p.y - (auraPad - 2),
                    auraPad * 2,
                    auraPad + 8,
                );
            } else if (tower.type === "command") {
                g.fillStyle(dark, 1);
                g.fillRect(
                    p.x - Math.round(14 * tierScale),
                    p.y - 1,
                    Math.round(28 * tierScale),
                    11,
                );
                g.fillStyle(baseColor, 1);
                g.fillRect(
                    p.x - Math.round(9 * tierScale),
                    p.y - 9,
                    Math.round(18 * tierScale),
                    8,
                );
                g.fillStyle(0xf2f5ff, 0.95);
                g.fillRect(p.x - 1, p.y - 16, 2, 8);
                g.fillRect(p.x - 6, p.y - 12, 12, 2);
                if (level >= 2) {
                    g.fillStyle(0xf2f5ff, 0.95);
                    g.fillRect(p.x - 8, p.y - 14, 2, 5);
                    g.fillRect(p.x + 6, p.y - 14, 2, 5);
                }
                if (level >= 3) {
                    g.fillStyle(bright, 0.92);
                    g.fillRect(p.x - 10, p.y - 18, 20, 2);
                    g.fillRect(p.x + 8, p.y - 18, 8, 1);
                }
                g.lineStyle(2, bright, 0.35 + pulse * 0.3);
                g.strokeRect(p.x - 20 - pulse * 2, p.y - 19 - pulse * 2, 40 + pulse * 4, 28 + pulse * 4);
            } else {
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 12, p.y - 4, 24, 14);
            }
        }

        drawEnemySprite(g, enemy, p) {
            const baseColor = parseColor(enemy.color).color;
            const dark = this.tintColor(baseColor, 0.58);
            const bright = this.tintColor(baseColor, 1.22);
            const phase =
                (Number.parseInt(
                    String(enemy.id || "").replace(/\D+/g, ""),
                    10,
                ) || 0) * 0.27;
            const bob = Math.sin(this.time.now * 0.009 + phase) * 1.4;
            const y = enemy.visualType === "drone" ? p.y - 6 + bob : p.y;
            const steel = 0x7b8189;
            const barrel = 0x121820;

            g.fillStyle(0x000000, enemy.isBoss ? 0.3 : 0.22);
            g.fillRect(
                p.x - (enemy.isBoss ? 30 : enemy.radius + 8),
                p.y + enemy.radius + 6,
                enemy.isBoss ? 60 : enemy.radius * 2 + 16,
                enemy.isBoss ? 5 : 4,
            );

            if (enemy.visualType === "drone") {
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 8, y - 8, 16, 16);
                g.fillStyle(bright, 0.95);
                g.fillRect(p.x - 13, y - 2, 26, 4);
                g.fillRect(p.x - 2, y - 13, 4, 26);
                g.fillStyle(0x0f1318, 1);
                g.fillRect(p.x - 2, y - 2, 4, 4);
            } else if (enemy.visualType === "infantry") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 7, y - 2, 14, 14);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 5, y - 10, 10, 8);
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + 4, y - 3, 10, 3);
            } else if (enemy.visualType === "scout") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 12, y + 2, 20, 6);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 6, y - 7, 14, 8);
                g.fillStyle(bright, 0.95);
                g.fillRect(p.x + 7, y - 4, 8, 2);
                g.fillStyle(steel, 1);
                g.fillRect(p.x - 11, y + 7, 4, 4);
                g.fillRect(p.x + 5, y + 7, 4, 4);
            } else if (enemy.visualType === "armored") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 10, y - 2, 20, 15);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 7, y - 11, 14, 8);
                g.fillStyle(this.tintColor(baseColor, 1.16), 1);
                g.fillRect(p.x - 11, y + 1, 22, 4);
            } else if (enemy.visualType === "sniper") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 8, y - 2, 16, 14);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 6, y - 10, 12, 8);
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + 6, y - 5, 16, 2);
                g.fillStyle(0xf0dfbe, 1);
                g.fillRect(p.x + 4, y - 7, 2, 3);
            } else if (enemy.visualType === "heavy") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 11, y - 2, 22, 16);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 7, y - 10, 14, 8);
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + 6, y - 4, 12, 4);
                g.fillStyle(steel, 0.95);
                g.fillRect(p.x - 14, y - 1, 4, 12);
            } else if (enemy.visualType === "commander") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 9, y - 2, 18, 15);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 6, y - 10, 12, 8);
                g.fillStyle(0xf0f3f9, 1);
                g.fillRect(p.x - 1, y - 16, 2, 6);
                g.fillStyle(bright, 0.8);
                g.fillRect(p.x + 1, y - 15, 5, 3);
                g.lineStyle(2, bright, 0.55);
                g.strokeRect(p.x - enemy.radius - 4, y - 10, enemy.radius * 2 + 8, enemy.radius + 10);
            } else if (enemy.visualType === "shield") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 8, y - 2, 16, 14);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 6, y - 10, 12, 8);
                g.fillStyle(this.tintColor(baseColor, 1.24), 0.95);
                g.fillRect(p.x + 8, y - 7, 8, 14);
                g.lineStyle(1, 0xe4f5ff, 0.8);
                g.strokeRect(p.x + 8, y - 7, 8, 14);
            } else if (enemy.visualType === "flame") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 8, y - 2, 16, 14);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 6, y - 10, 12, 8);
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + 5, y - 3, 9, 3);
                g.fillStyle(0xffc06b, 0.95);
                g.fillRect(p.x + 14, y - 4, 6, 3);
            } else if (enemy.visualType === "vehicle") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 16, y - 2, 32, 12);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 10, y - 9, 20, 8);
                g.fillStyle(steel, 0.96);
                g.fillRect(p.x - 13, y + 8, 26, 4);
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + 4, y - 6, 10, 3);
            } else if (enemy.visualType === "tank") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 19, y - 2, 38, 13);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 12, y - 11, 24, 9);
                g.fillStyle(this.tintColor(baseColor, 1.2), 0.95);
                g.fillRect(p.x - 6, y - 14, 12, 4);
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + 8, y - 8, 16, 4);
                g.fillStyle(steel, 0.95);
                g.fillRect(p.x - 15, y + 9, 30, 4);
            } else if (enemy.visualType === "rocket") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 16, y - 2, 32, 12);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 10, y - 10, 20, 8);
                g.fillStyle(0xe9ddd0, 1);
                g.fillRect(p.x - 5, y - 16, 3, 8);
                g.fillRect(p.x + 1, y - 16, 3, 8);
                g.fillStyle(steel, 1);
                g.fillRect(p.x - 13, y + 8, 26, 4);
            } else if (enemy.visualType === "mortar") {
                g.fillStyle(dark, 1);
                g.fillRect(p.x - 17, y - 2, 34, 12);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 11, y - 10, 22, 8);
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + 2, y - 19, 6, 10);
                g.fillStyle(steel, 1);
                g.fillRect(p.x - 14, y + 8, 28, 4);
            } else if (enemy.visualType === "boss-core") {
                g.fillStyle(this.tintColor(baseColor, 0.5), 1);
                g.fillRect(p.x - 30, y - 20, 60, 40);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 22, y - 14, 44, 28);
                g.fillStyle(this.tintColor(baseColor, 1.26), 1);
                g.fillRect(p.x - 10, y - 8, 20, 16);
                g.fillStyle(0xf8e9dd, 0.95);
                g.fillRect(p.x - 3, y - 3, 6, 6);
                g.lineStyle(2, bright, 0.55);
                g.strokeRect(p.x - 34, y - 24, 68, 48);
            } else if (enemy.visualType === "boss-iron") {
                g.fillStyle(this.tintColor(baseColor, 0.48), 1);
                g.fillRect(p.x - 36, y - 14, 72, 28);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 22, y - 24, 44, 14);
                g.fillStyle(this.tintColor(baseColor, 1.22), 1);
                g.fillRect(p.x - 7, y - 20, 14, 8);
                g.fillStyle(barrel, 1);
                g.fillRect(p.x + 10, y - 18, 26, 6);
                g.fillStyle(steel, 0.95);
                g.fillRect(p.x - 30, y + 13, 60, 6);
                g.lineStyle(2, bright, 0.5);
                g.strokeRect(p.x - 40, y - 28, 80, 50);
            } else if (enemy.visualType === "boss-shadow") {
                g.fillStyle(this.tintColor(baseColor, 0.42), 0.62);
                g.fillRect(p.x - 32, y - 26, 64, 52);
                g.fillStyle(this.tintColor(baseColor, 0.76), 0.9);
                g.fillRect(p.x - 24, y - 18, 48, 36);
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 14, y - 10, 28, 20);
                g.fillStyle(0xf0e7ff, 0.92);
                g.fillRect(p.x - 6, y - 2, 12, 4);
                g.lineStyle(2, this.tintColor(baseColor, 1.3), 0.44 + Math.sin(this.time.now * 0.01 + phase) * 0.2);
                g.strokeRect(p.x - 36, y - 30, 72, 60);
            } else {
                g.fillStyle(baseColor, 1);
                g.fillRect(p.x - 10, y - 10, 20, 20);
            }

            if (enemy.canAttackStructures) {
                g.fillStyle(0xff9da7, 0.92);
                g.fillRect(p.x - 4, y - enemy.radius - 9, 8, 3);
                g.fillRect(p.x - 1, y - enemy.radius - 13, 2, 10);
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
                    const level = Math.max(1, Math.min(3, tower.level || 1));
                    const outerColor =
                        level === 3 ? 0x5cf0ff : level === 2 ? 0x66e7ff : 0x65e7ff;
                    const coreColor =
                        level === 3 ? 0xefffff : level === 2 ? 0xd8fbff : 0xe6feff;
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
                        const outerWidth =
                            (level === 3 ? 12 : level === 2 ? 10 : 8) * falloff;
                        const innerWidth =
                            (level === 3 ? 6.5 : level === 2 ? 5.2 : 4.5) * falloff;
                        const coreWidth =
                            (level === 3 ? 3 : level === 2 ? 2.5 : 2.1) * falloff;
                        g.lineStyle(outerWidth, outerColor, 0.16 * falloff);
                        g.beginPath();
                        g.moveTo(startX, startY);
                        g.lineTo(endX, endY);
                        g.strokePath();
                        g.lineStyle(innerWidth, 0x9ff4ff, 0.42 * falloff);
                        g.beginPath();
                        g.moveTo(startX, startY);
                        g.lineTo(endX, endY);
                        g.strokePath();
                        g.lineStyle(coreWidth, coreColor, 0.9 * falloff);
                        g.beginPath();
                        g.moveTo(startX, startY);
                        g.lineTo(endX, endY);
                        g.strokePath();
                        g.fillStyle(coreColor, 0.88 * falloff);
                        g.fillCircle(
                            endX,
                            endY,
                            (level === 3 ? 5 : level === 2 ? 4.5 : 4) * falloff,
                        );
                        if (level >= 3) {
                            g.lineStyle(1.2 * falloff, 0xb8fdff, 0.42 * falloff);
                            g.beginPath();
                            g.moveTo(startX, startY - 4);
                            g.lineTo(endX, endY - 4);
                            g.moveTo(startX, startY + 4);
                            g.lineTo(endX, endY + 4);
                            g.strokePath();
                        }
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
                const level = Math.max(
                    1,
                    Math.min(3, Number(projectile.visualLevel) || 1),
                );
                const age = (performance.now() - (projectile.createdAt || 0)) / 1000;
                const pulse = 0.65 + Math.sin(age * 26) * 0.35;
                if (projectile.type === "laser") {
                    const laserWidth = level === 3 ? 5 : level === 2 ? 4 : 3;
                    const laserColor =
                        level === 3 ? 0xdffeff : level === 2 ? 0xbef7ff : 0xa8f0ff;
                    g.lineStyle(laserWidth, laserColor, 0.9);
                    g.beginPath();
                    g.moveTo(
                        VIEW.worldX + projectile.prevX,
                        VIEW.worldY + projectile.prevY,
                    );
                    g.lineTo(p.x, p.y);
                    g.strokePath();
                    g.lineStyle(
                        level === 3 ? 2.6 : level === 2 ? 2.2 : 1.8,
                        0xecfcff,
                        0.62,
                    );
                    g.beginPath();
                    g.moveTo(
                        VIEW.worldX + projectile.prevX,
                        VIEW.worldY + projectile.prevY,
                    );
                    g.lineTo(p.x, p.y);
                    g.strokePath();
                    if (level >= 3) {
                        g.lineStyle(1, 0xc0fbff, 0.44 * pulse);
                        g.beginPath();
                        g.moveTo(
                            VIEW.worldX + projectile.prevX,
                            VIEW.worldY + projectile.prevY - 2,
                        );
                        g.lineTo(p.x, p.y - 2);
                        g.moveTo(
                            VIEW.worldX + projectile.prevX,
                            VIEW.worldY + projectile.prevY + 2,
                        );
                        g.lineTo(p.x, p.y + 2);
                        g.strokePath();
                    }
                } else if (projectile.type === "missile") {
                    const w = level === 3 ? 14 : level === 2 ? 12 : 10;
                    const h = level === 3 ? 5 : 4;
                    const bodyColor =
                        projectile.fromType === "tower" ? 0xffae7c : 0xff6f72;
                    g.fillStyle(bodyColor, 1);
                    g.fillRect(p.x - w / 2, p.y - h / 2, w, h);
                    g.fillStyle(0x2b3344, 0.95);
                    g.fillRect(p.x + w / 2 - 2, p.y - h / 2, 2, h);
                    g.fillStyle(0xffd9a1, 0.8 + pulse * 0.2);
                    g.fillRect(p.x - w / 2 - 2, p.y - 1, 2, 2);
                    if (level >= 2) {
                        g.fillStyle(0xe9ddd2, 1);
                        g.fillRect(p.x - 1, p.y - h / 2 - 2, 2, 2);
                    }
                    if (level >= 3) {
                        g.fillStyle(0xf0e6dc, 1);
                        g.fillRect(p.x - 3, p.y - h / 2 - 2, 2, 2);
                        g.fillRect(p.x + 1, p.y - h / 2 - 2, 2, 2);
                    }
                } else if (projectile.type === "shell") {
                    const w = level === 3 ? 10 : level === 2 ? 9 : 8;
                    const h = level === 3 ? 7 : 6;
                    g.fillStyle(level === 3 ? 0xffc06f : 0xffc272, 1);
                    g.fillRect(p.x - w / 2, p.y - h / 2, w, h);
                    g.fillStyle(0x2f3642, 0.95);
                    g.fillRect(p.x + w / 2 - 2, p.y - h / 2 + 1, 2, h - 2);
                    if (level >= 2) {
                        g.lineStyle(1, 0xffe1a9, 0.65);
                        g.strokeRect(p.x - w / 2, p.y - h / 2, w, h);
                    }
                } else {
                    if (projectile.fromType === "tower") {
                        if (projectile.towerType === "machineGun") {
                            const w = level === 3 ? 8 : level === 2 ? 7 : 6;
                            g.fillStyle(0xc8ffd7, 1);
                            g.fillRect(p.x - w / 2, p.y - 1, w, 2);
                            g.fillStyle(0xa4f7bd, 0.65);
                            g.fillRect(p.x - w / 2 - 2, p.y - 1, 2, 2);
                        } else if (projectile.towerType === "infantry") {
                            const w = level === 3 ? 7 : level === 2 ? 6 : 5;
                            g.fillStyle(0xf3f8ff, 1);
                            g.fillRect(p.x - w / 2, p.y - 1, w, 2);
                            if (level >= 2) {
                                g.fillStyle(0xdbe9ff, 0.65);
                                g.fillRect(p.x - w / 2 - 2, p.y - 1, 2, 2);
                            }
                        } else {
                            g.fillStyle(0xf3f8ff, 1);
                            g.fillRect(p.x - 2, p.y - 1, 4, 2);
                        }
                    } else {
                        g.fillStyle(0xffc2b6, 1);
                        g.fillRect(p.x - 2, p.y - 1, 4, 2);
                    }
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
                    UI_THEME.topbarBg,
                    0.95,
                )
                .setStrokeStyle(1, UI_THEME.topbarBorder, 0.55);
            this.add
                .rectangle(VIEW.width / 2, 45, VIEW.width - 44, 50, 0x2a0f16, 0.5)
                .setStrokeStyle(1, 0x96695c, 0.35);
            this.add.image(52, 45, "flag-vn").setDisplaySize(52, 34);
            this.add
                .image(VIEW.width - 52, 45, "flag-us")
                .setDisplaySize(52, 34);

            this.hudTexts.baseHp = this.add.text(96, 20, "", {
                fontFamily: UI_THEME.fontFamily,
                fontSize: "15px",
                color: UI_THEME.textPrimary,
            });
            this.hudTexts.supplies = this.add.text(96, 42, "", {
                fontFamily: UI_THEME.fontFamily,
                fontSize: "15px",
                color: UI_THEME.textPrimary,
            });
            this.hudTexts.cp = this.add.text(320, 20, "", {
                fontFamily: UI_THEME.fontFamily,
                fontSize: "15px",
                color: UI_THEME.textPrimary,
            });
            this.hudTexts.wave = this.add.text(320, 42, "", {
                fontFamily: UI_THEME.fontFamily,
                fontSize: "15px",
                color: UI_THEME.textPrimary,
            });
            this.hudTexts.enemy = this.add.text(520, 20, "", {
                fontFamily: UI_THEME.fontFamily,
                fontSize: "15px",
                color: UI_THEME.textPrimary,
            });
            this.hudTexts.quiz = this.add.text(520, 42, "", {
                fontFamily: UI_THEME.fontFamily,
                fontSize: "15px",
                color: UI_THEME.textMuted,
            });
            this.hudTexts.waveState = this.add.text(740, 30, "", {
                fontFamily: UI_THEME.fontFamily,
                fontSize: "14px",
                color: UI_THEME.textMuted,
            });
            this.hudTexts.boss = this.add
                .text(740, 52, "BOSS ARRIVED!", {
                    fontFamily: UI_THEME.fontFamily,
                    fontSize: "16px",
                    color: "#ffad8f",
                })
                .setVisible(false);

            this.pauseButton = makeButton(this, {
                x: VIEW.width - 172,
                y: 30,
                width: 120,
                height: 30,
                label: "Pause",
                baseColor: 0x4a2d23,
                lineColor: 0xc49a7c,
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
                baseColor: 0x374b2d,
                lineColor: 0xaec488,
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
                    UI_THEME.panelBg,
                    0.96,
                )
                .setStrokeStyle(1, UI_THEME.panelBorder, 0.7);
            this.add
                .rectangle(
                    VIEW.panelX + VIEW.panelWidth / 2,
                    VIEW.panelY + 175,
                    VIEW.panelWidth - 14,
                    260,
                    0x230f15,
                    0.6,
                )
                .setStrokeStyle(1, 0x8f6252, 0.38);
            this.add
                .rectangle(
                    VIEW.panelX + VIEW.panelWidth / 2,
                    VIEW.panelY + 390,
                    VIEW.panelWidth - 14,
                    132,
                    0x210f14,
                    0.52,
                )
                .setStrokeStyle(1, 0x7a5547, 0.32);
            this.add
                .rectangle(
                    VIEW.panelX + VIEW.panelWidth / 2,
                    VIEW.panelY + 594,
                    VIEW.panelWidth - 14,
                    126,
                    0x221017,
                    0.58,
                )
                .setStrokeStyle(1, 0x8b6355, 0.34);
            this.add
                .text(
                    VIEW.panelX + 10,
                    VIEW.panelY + 10,
                    "Build towers (drag)",
                    {
                        fontFamily: UI_THEME.fontFamily,
                        fontSize: "14px",
                        color: UI_THEME.textPrimary,
                    },
                )
                .setDepth(20);
            this.add
                .text(VIEW.panelX + 10, VIEW.panelY + 312, "Skills", {
                    fontFamily: UI_THEME.fontFamily,
                    fontSize: "13px",
                    color: UI_THEME.textPrimary,
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
            const dark = this.tintCardColor(baseColor, 0.62);
            const bright = this.tintCardColor(baseColor, 1.2);
            const steel = 0x7a8088;
            const barrel = 0x121821;

            const icon = this.add.container(-122, 0);
            const ring = this.add
                .rectangle(0, 0, 28, 28, 0x201017, 0.95)
                .setStrokeStyle(1, 0xab7966, 0.62);
            icon.add(ring);

            if (type === "infantry") {
                icon.add(this.add.rectangle(-1, 4, 14, 8, dark, 1));
                icon.add(this.add.rectangle(-1, -3, 8, 6, baseColor, 1));
                icon.add(this.add.rectangle(6, -1, 8, 2, barrel, 1));
            } else if (type === "machineGun") {
                icon.add(this.add.rectangle(-1, 4, 15, 8, dark, 1));
                icon.add(this.add.rectangle(-1, -2, 10, 5, baseColor, 1));
                icon.add(this.add.rectangle(7, -3, 9, 2, barrel, 1));
                icon.add(this.add.rectangle(7, 0, 9, 2, barrel, 1));
            } else if (type === "cannon") {
                icon.add(this.add.rectangle(-2, 5, 16, 8, dark, 1));
                icon.add(this.add.rectangle(-3, -2, 12, 6, baseColor, 1));
                icon.add(this.add.rectangle(6, -2, 11, 3, barrel, 1));
                icon.add(this.add.rectangle(-8, 7, 4, 4, steel, 1));
                icon.add(this.add.rectangle(3, 7, 4, 4, steel, 1));
            } else if (type === "missile") {
                icon.add(this.add.rectangle(-1, 4, 14, 8, dark, 1));
                icon.add(this.add.rectangle(-4, -4, 3, 10, baseColor, 1));
                icon.add(this.add.rectangle(2, -4, 3, 10, baseColor, 1));
                icon.add(this.add.rectangle(6, -1, 8, 2, barrel, 1));
            } else if (type === "laser") {
                icon.add(this.add.rectangle(-1, 4, 14, 8, dark, 1));
                icon.add(this.add.rectangle(-1, -3, 6, 6, baseColor, 1));
                icon.add(this.add.rectangle(6, -3, 8, 2, 0xbbf7ff, 0.95));
                icon.add(this.add.rectangle(6, 0, 8, 2, 0xbbf7ff, 0.9));
            } else if (type === "command") {
                icon.add(this.add.rectangle(-1, 4, 14, 8, dark, 1));
                icon.add(this.add.rectangle(-1, -4, 9, 5, baseColor, 1));
                icon.add(this.add.rectangle(-1, -9, 2, 6, 0xffffff, 0.95));
                icon.add(this.add.rectangle(-4, -6, 8, 2, 0xffffff, 0.95));
                icon.add(this.add.rectangle(-1, -1, 16, 1, bright, 0.35));
            } else if (type === "barricade") {
                icon.add(this.add.rectangle(-1, 5, 18, 8, dark, 1));
                icon.add(this.add.rectangle(-6, 1, 4, 4, bright, 0.95));
                icon.add(this.add.rectangle(-1, 1, 4, 4, bright, 0.95));
                icon.add(this.add.rectangle(4, 1, 4, 4, bright, 0.95));
            } else {
                icon.add(this.add.rectangle(0, 0, 10, 10, baseColor, 1));
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
                        UI_THEME.cardBg,
                        0.92,
                    )
                    .setStrokeStyle(1, UI_THEME.cardBorder, 0.42);
                const icon = this.createTowerCardIcon(card.type, card.color);
                const name = this.add.text(-98, -10, card.name, {
                    fontFamily: UI_THEME.fontFamily,
                    fontSize: "12px",
                    color: UI_THEME.textPrimary,
                });
                const meta = this.add.text(
                    -98,
                    4,
                    `Cost ${card.cost} | DMG ${card.damage}`,
                    {
                        fontFamily: UI_THEME.fontFamily,
                        fontSize: "11px",
                        color: UI_THEME.textMuted,
                    },
                );
                const plus = this.add
                    .rectangle(88, 0, 84, 22, 0x3c4f2f, 1)
                    .setStrokeStyle(1, 0xb7cc90, 0.62)
                    .setInteractive({ useHandCursor: true });
                plus.on("pointerdown", () =>
                    App.uiSystem.quickUpgradeByTowerType(App.state, card.type),
                );
                const plusText = this.add
                    .text(88, 0, "Nang cap tru", {
                        fontFamily: UI_THEME.fontFamily,
                        fontSize: "10px",
                        color: "#e9f2d8",
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
                const palette =
                    skill.id === "artilleryStrike"
                        ? { baseColor: 0x4c3728, lineColor: 0xc4a27f }
                        : skill.id === "emergencyRepair"
                          ? { baseColor: 0x2f4a46, lineColor: 0x9fc9bc }
                          : { baseColor: 0x3c3658, lineColor: 0xb2a9d4 };
                const button = makeButton(this, {
                    x: VIEW.panelX + VIEW.panelWidth / 2,
                    y,
                    width: VIEW.panelWidth - 24,
                    height: 26,
                    label: `${skill.name} (${skill.costCP} CP)`,
                    fontSize: "12px",
                    baseColor: palette.baseColor,
                    lineColor: palette.lineColor,
                    onClick: () =>
                        App.skillSystem.useSkill(App.state, skill.id),
                });
                const cd = this.add.text(VIEW.panelX + 14, y + 14, "", {
                    fontFamily: UI_THEME.fontFamily,
                    fontSize: "10px",
                    color: UI_THEME.textMuted,
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
                baseColor: 0x415b33,
                lineColor: 0xb8d59b,
                onClick: () => App.waveSystem.callEarlyStart(App.state),
            });
            this.quizButton = makeButton(this, {
                x: VIEW.panelX + VIEW.panelWidth / 2,
                y: VIEW.panelY + 502,
                width: VIEW.panelWidth - 24,
                height: 28,
                label: "Nhận tiếp tế",
                fontSize: "12px",
                baseColor: 0x5a3424,
                lineColor: 0xd8af84,
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
                    fontFamily: UI_THEME.fontFamily,
                    fontSize: "13px",
                    color: UI_THEME.textPrimary,
                },
            );
            this.detailTexts.line1 = this.add.text(
                VIEW.panelX + 10,
                VIEW.panelY + 549,
                "",
                {
                    fontFamily: UI_THEME.fontFamily,
                    fontSize: "11px",
                    color: UI_THEME.textMuted,
                },
            );
            this.detailTexts.line2 = this.add.text(
                VIEW.panelX + 10,
                VIEW.panelY + 564,
                "",
                {
                    fontFamily: UI_THEME.fontFamily,
                    fontSize: "11px",
                    color: UI_THEME.textMuted,
                },
            );

            this.towerButtons.upgrade = makeButton(this, {
                x: VIEW.panelX + 50,
                y: VIEW.panelY + 602,
                width: 80,
                height: 28,
                label: "Upgrade",
                baseColor: 0x3a4f2d,
                lineColor: 0xb6cb91,
                onClick: () => App.uiSystem.upgradeSelectedTower(App.state),
            });
            this.towerButtons.repair = makeButton(this, {
                x: VIEW.panelX + 140,
                y: VIEW.panelY + 602,
                width: 80,
                height: 28,
                label: "Repair",
                baseColor: 0x34504b,
                lineColor: 0x9bcabf,
                onClick: () => App.uiSystem.repairSelectedTower(App.state),
            });
            this.towerButtons.sell = makeButton(this, {
                x: VIEW.panelX + 230,
                y: VIEW.panelY + 602,
                width: 80,
                height: 28,
                label: "Sell",
                baseColor: 0x6f2e33,
                lineColor: 0xe99e84,
                onClick: () => App.uiSystem.sellSelectedTower(App.state),
            });
            this.towerButtons.dmg = makeButton(this, {
                x: VIEW.panelX + 50,
                y: VIEW.panelY + 636,
                width: 80,
                height: 26,
                label: "+DMG",
                baseColor: 0x4e3428,
                lineColor: 0xcda984,
                onClick: () =>
                    App.uiSystem.pointUpgradeSelectedTower(App.state, "damage"),
            });
            this.towerButtons.hp = makeButton(this, {
                x: VIEW.panelX + 140,
                y: VIEW.panelY + 636,
                width: 80,
                height: 26,
                label: "+HP",
                baseColor: 0x2f4a3f,
                lineColor: 0x9dc3b4,
                onClick: () =>
                    App.uiSystem.pointUpgradeSelectedTower(App.state, "hp"),
            });
            this.towerButtons.spd = makeButton(this, {
                x: VIEW.panelX + 230,
                y: VIEW.panelY + 636,
                width: 80,
                height: 26,
                label: "+SPD",
                baseColor: 0x3e3555,
                lineColor: 0xbaabd7,
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
                baseColor: 0x4e412d,
                lineColor: 0xceba91,
                onClick: () => App.uiSystem.upgradeBase(App.state),
            });
            this.baseButtons.maxHp = makeButton(this, {
                x: VIEW.panelX + 206,
                y: VIEW.panelY + 602,
                width: 126,
                height: 30,
                fontSize: "11px",
                label: "MaxHP",
                baseColor: 0x2c4b2e,
                lineColor: 0xaed399,
                onClick: () => App.uiSystem.boostBaseHp(App.state),
            });
            this.baseButtons.heal = makeButton(this, {
                x: VIEW.panelX + 206,
                y: VIEW.panelY + 602,
                width: 126,
                height: 30,
                fontSize: "11px",
                label: "Heal",
                baseColor: 0x2f4d46,
                lineColor: 0x9fc9bc,
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
                    bg.setFillStyle(0x4a2731, 0.96);
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
                    bg.setFillStyle(UI_THEME.cardBg, 0.92);
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
            this.quizCooldownTicker = null;
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
            this.stopQuizCooldownTicker();
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

        stopQuizCooldownTicker() {
            if (!this.quizCooldownTicker) {
                return;
            }
            this.quizCooldownTicker.remove(false);
            this.quizCooldownTicker = null;
        }

        updateWrongAnswerFeedback(explanation) {
            const remain = Math.max(0, App.state.quizCooldown || 0);
            const baseText =
                `Đáp án sai: Không nhận được tiếp tế. ` +
                `Trả lời lại sau: ${remain.toFixed(1)}s.`;
            this.feedback.setColor("#ff8e95");
            this.feedback.setText(
                explanation ? `${baseText}\n${explanation}` : baseText,
            );
        }

        beginWrongAnswerCooldown(explanation) {
            this.stopQuizCooldownTicker();
            const tick = () => {
                if (this.currentType !== "quiz" || !App.modalState.active) {
                    this.stopQuizCooldownTicker();
                    return;
                }

                this.updateWrongAnswerFeedback(explanation);

                if ((App.state.quizCooldown || 0) > 0.01) {
                    return;
                }

                this.stopQuizCooldownTicker();
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

                this.renderQuizQuestion(next, "");
            };

            tick();
            this.quizCooldownTicker = this.time.addEvent({
                delay: 100,
                loop: true,
                callback: tick,
            });
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
            this.stopQuizCooldownTicker();
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
            this.stopQuizCooldownTicker();
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
            this.stopQuizCooldownTicker();
            const result = App.quizSystem.answerQuiz(App.state, index);
            if (!result.ok) {
                return;
            }
            for (const btn of this.answerButtons) {
                btn.setEnabled(false);
            }
            if (result.correct) {
                this.feedback.setColor("#7cff9e");
                this.feedback.setText(`Correct! +${result.reward} Supplies`);
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
                        `Correct! +${result.reward} Supplies `,
                    );
                });
            } else {
                this.feedback.setColor("#ff8e95");
                this.feedback.setText(
                    `Đáp án sai: Không nhận được tiếp tế. Được trả lời lại sau: ${App.config.quiz.wrongCooldown}s.\n${result.explanation}`,
                );
                this.beginWrongAnswerCooldown(result.explanation || "");
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
                `${result.reason}\n\nWave cao nhất : ${result.wave}\nPlay time: ${result.playTime}\nSố câu trả lời đúng: ${result.correctAnswers} | Số câu trả lời sai: ${result.wrongAnswers}\nSố trụ đã xây: ${result.towersBuilt}\nĐã tiêu diệt được: ${result.enemiesKilled} kẻ địch\nWaves đã qua: ${result.wavesCleared}`,
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
