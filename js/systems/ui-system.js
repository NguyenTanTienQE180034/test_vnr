(function () {
    const App = (window.App = window.App || {});

    function getTowerById(state, id) {
        return state.towers.find((tower) => tower.id === id);
    }

    function spendCP(state, cost) {
        if (state.commandPoints < cost) {
            return false;
        }
        state.commandPoints -= cost;
        return true;
    }

    function getTowerTech(state, towerType) {
        if (!state.towerTech) {
            state.towerTech = {};
        }
        if (!state.towerTech[towerType]) {
            state.towerTech[towerType] = {
                level: 1,
                pointUpgradeLevels: {
                    damage: 0,
                    hp: 0,
                    speed: 0,
                },
            };
        }
        return state.towerTech[towerType];
    }

    function applyTowerTechToInstance(state, tower, reason) {
        const tech = getTowerTech(state, tower.type);
        tower.applyTechProfile(tech, reason || "init");
    }

    function applyTowerTechToAllInstances(state, towerType, reason) {
        const towers = state.towers.filter((tower) => tower.type === towerType);
        for (const tower of towers) {
            applyTowerTechToInstance(state, tower, reason || "upgrade");
        }
    }

    function canUpgradeTowerType(state, towerType) {
        const tech = getTowerTech(state, towerType);
        return tech.level < 3;
    }

    function getTowerTypeUpgradePrice(state, towerType) {
        const tech = getTowerTech(state, towerType);
        if (tech.level >= 3) {
            return null;
        }
        const def = App.towersData[towerType];
        return def.upgradeCost[tech.level - 1];
    }

    function canPointUpgradeTowerType(state, towerType, statKey) {
        const tech = getTowerTech(state, towerType);
        if (tech.level < 3) {
            return false;
        }
        const cfg = App.towersData[towerType].pointUpgrade[statKey];
        return cfg && cfg.growth > 0 && cfg.costCP < 90;
    }

    function getPointUpgradeCostByType(state, towerType, statKey) {
        const tech = getTowerTech(state, towerType);
        const def = App.towersData[towerType];
        const cfg = App.towersData[towerType].pointUpgrade[statKey];
        if (!cfg) {
            return null;
        }
        const step = tech.pointUpgradeLevels[statKey] || 0;
        const baseCost = Math.floor(def.cost * 0.28) + cfg.costCP * 12;
        const growthMultiplier = 1 + step * 0.65 + step * step * 0.2;
        const scaled = baseCost * growthMultiplier;
        return Math.ceil(scaled / 5) * 5;
    }

    function upgradeTowerType(state, towerType) {
        if (!canUpgradeTowerType(state, towerType)) {
            return { ok: false, reason: "max-level" };
        }
        const price = getTowerTypeUpgradePrice(state, towerType);
        if (state.supplies < price) {
            App.Effects.addFloatingText(
                state,
                24,
                138,
                "Thieu tiep te",
                "#ff8e95",
            );
            return { ok: false, reason: "insufficient-supplies", price };
        }

        state.supplies -= price;
        const tech = getTowerTech(state, towerType);
        tech.level += 1;
        applyTowerTechToAllInstances(state, towerType, "upgrade");

        const placed = state.towers.find((tower) => tower.type === towerType);
        if (placed) {
            App.Effects.addFloatingText(
                state,
                placed.x - 8,
                placed.y - 22,
                "NANG CAP",
                "#80ffb1",
            );
            state.selectedTowerId = placed.id;
        } else {
            App.Effects.addFloatingText(
                state,
                26,
                140,
                `Nang cap ${App.towersData[towerType].name} toan cuc`,
                "#80ffb1",
            );
        }
        return { ok: true, price };
    }

    function upgradeTowerTypePointStat(state, towerType, statKey, label) {
        if (!canPointUpgradeTowerType(state, towerType, statKey)) {
            return { ok: false, reason: "locked" };
        }

        const cost = getPointUpgradeCostByType(state, towerType, statKey);
        if (state.supplies < cost) {
            const any = state.towers.find((t) => t.type === towerType);
            if (any) {
                App.Effects.addFloatingText(
                    state,
                    any.x - 10,
                    any.y - 24,
                    "Thieu tiep te",
                    "#ff8e95",
                );
            } else {
                App.Effects.addFloatingText(
                    state,
                    26,
                    158,
                    "Thieu tiep te",
                    "#ff8e95",
                );
            }
            return { ok: false, reason: "insufficient-supplies", cost };
        }
        state.supplies -= cost;

        const tech = getTowerTech(state, towerType);
        tech.pointUpgradeLevels[statKey] += 1;
        applyTowerTechToAllInstances(
            state,
            towerType,
            statKey === "hp" ? "pointHp" : "point",
        );

        const any = state.towers.find((t) => t.type === towerType);
        if (any) {
            App.Effects.addFloatingText(
                state,
                any.x - 10,
                any.y - 24,
                `+${label}`,
                "#8fdfff",
            );
            state.selectedTowerId = any.id;
        } else {
            App.Effects.addFloatingText(
                state,
                26,
                158,
                `+${label} toan cuc cho ${App.towersData[towerType].name}`,
                "#8fdfff",
            );
        }
        return { ok: true, cost };
    }

    function upgradeSelectedTower(state) {
        const tower = getTowerById(state, state.selectedTowerId);
        if (!tower) {
            return { ok: false, reason: "no-selection" };
        }
        return upgradeTowerType(state, tower.type);
    }

    function repairSelectedTower(state) {
        const tower = getTowerById(state, state.selectedTowerId);
        if (!tower || tower.hp >= tower.maxHp) {
            return { ok: false, reason: "invalid-target" };
        }
        const price = tower.getRepairCost();
        if (state.supplies < price) {
            App.Effects.addFloatingText(
                state,
                tower.x - 10,
                tower.y - 24,
                "Thieu tiep te",
                "#ff8e95",
            );
            return { ok: false, reason: "insufficient-supplies", price };
        }
        state.supplies -= price;
        tower.repair(tower.maxHp * 0.45);
        App.Effects.addFloatingText(
            state,
            tower.x - 10,
            tower.y - 24,
            `Sua -${price}`,
            "#9cf6b4",
        );
        return { ok: true, price };
    }

    function sellSelectedTower(state) {
        const tower = getTowerById(state, state.selectedTowerId);
        if (!tower) {
            return { ok: false, reason: "no-selection" };
        }
        state.towers = state.towers.filter((t) => t.id !== tower.id);
        state.selectedTowerId = null;
        App.Effects.addFloatingText(
            state,
            tower.x - 14,
            tower.y - 24,
            "Da ban",
            "#85f5ac",
        );
        return { ok: true };
    }

    function pointUpgradeSelectedTower(state, statKey) {
        const tower = getTowerById(state, state.selectedTowerId);
        if (!tower) {
            return { ok: false, reason: "no-selection" };
        }
        const label =
            statKey === "damage"
                ? "SAT THUONG"
                : statKey === "hp"
                  ? "HP"
                  : "TOC BAN";
        return upgradeTowerTypePointStat(state, tower.type, statKey, label);
    }

    function upgradeBase(state) {
        const base = state.base;
        if (!base || !base.canUpgradeLevel()) {
            return { ok: false, reason: "max-level" };
        }
        const cpCost = base.getUpgradeLevelCost();
        if (!spendCP(state, cpCost)) {
            App.Effects.addFloatingText(
                state,
                base.x - 20,
                base.y - 36,
                "Thieu CP",
                "#ff9ba8",
            );
            return { ok: false, reason: "insufficient-cp", cpCost };
        }
        base.upgradeLevel();
        App.Effects.addFloatingText(
            state,
            base.x - 24,
            base.y - 36,
            "NANG CAP CAN CU",
            "#9ce6ff",
        );
        return { ok: true, cpCost };
    }

    function boostBaseHp(state) {
        const base = state.base;
        const cost = App.config.base.hpBoostCostCP;
        if (!spendCP(state, cost)) {
            App.Effects.addFloatingText(
                state,
                base.x - 20,
                base.y - 36,
                "Thieu CP",
                "#ff9ba8",
            );
            return { ok: false, reason: "insufficient-cp", cpCost: cost };
        }
        base.boostMaxHp();
        App.Effects.addFloatingText(
            state,
            base.x - 16,
            base.y - 36,
            "+HP TOI DA",
            "#9ff8b5",
        );
        return { ok: true, cpCost: cost };
    }

    function healBase(state) {
        const base = state.base;
        if (base.healUsedThisWave) {
            App.Effects.addFloatingText(
                state,
                base.x - 18,
                base.y - 36,
                "Wave nay da hoi roi",
                "#ff9ba8",
            );
            return { ok: false, reason: "heal-used" };
        }
        const cost = App.config.base.healCostCP;
        if (!spendCP(state, cost)) {
            App.Effects.addFloatingText(
                state,
                base.x - 20,
                base.y - 36,
                "Thieu CP",
                "#ff9ba8",
            );
            return { ok: false, reason: "insufficient-cp", cpCost: cost };
        }
        base.heal(base.getHealAmount());
        base.healUsedThisWave = true;
        App.Effects.addFloatingText(
            state,
            base.x - 12,
            base.y - 36,
            "+HOI MAU",
            "#7cff9e",
        );
        return { ok: true, cpCost: cost };
    }

    function getTowerPanelModel(state) {
        const tower = getTowerById(state, state.selectedTowerId);
        if (!tower) {
            return null;
        }

        const tech = getTowerTech(state, tower.type);
        applyTowerTechToInstance(state, tower, "sync");

        const upgradePrice = getTowerTypeUpgradePrice(state, tower.type);
        const repairPrice = tower.getRepairCost();
        const dmgCost = getPointUpgradeCostByType(state, tower.type, "damage");
        const hpCost = getPointUpgradeCostByType(state, tower.type, "hp");
        const spdCost = getPointUpgradeCostByType(state, tower.type, "speed");
        const laserBeamCount =
            tower.type === "laser"
                ? tower.level >= 3
                    ? 3
                    : tower.level === 2
                      ? 2
                      : 1
                : 0;

        return {
            towerId: tower.id,
            towerType: tower.type,
            towerName: tower.name,
            level: tech.level,
            hp: Math.floor(tower.hp),
            maxHp: Math.floor(tower.maxHp),
            armor: Math.floor(tower.armor),
            damage: Math.floor(tower.getEffectiveDamage()),
            range: Math.floor(tower.getEffectiveRange()),
            attackSpeed: (
                tower.attackSpeed * tower.activeMultipliers.speed
            ).toFixed(2),
            projectileSpeed: Math.floor(tower.projectileSpeed),
            specialText:
                `${laserBeamCount > 0 ? `Tia x${laserBeamCount} | ` : ""}${tower.special.piercingShots ? `Xuyen x${Math.max(1, tower.special.pierceCount || 1)}` : "-"} ${
                    tower.special.multiTarget ? "| Da muc tieu" : ""
                } ${tower.special.extraSplash ? "| No lan" : ""}`.trim(),
            pointLevels: {
                damage: tech.pointUpgradeLevels.damage,
                hp: tech.pointUpgradeLevels.hp,
                speed: tech.pointUpgradeLevels.speed,
            },
            buttons: {
                upgrade: {
                    enabled: !!upgradePrice && state.supplies >= upgradePrice,
                    text: upgradePrice
                        ? `Nang cap (${upgradePrice})`
                        : "Da toi da",
                },
                repair: {
                    enabled:
                        tower.hp < tower.maxHp && state.supplies >= repairPrice,
                    text: `Sua (${repairPrice})`,
                },
                sell: {
                    enabled: true,
                    text: "Ban tru",
                },
                pointDamage: {
                    enabled:
                        canPointUpgradeTowerType(state, tower.type, "damage") &&
                        state.supplies >= dmgCost,
                    text: canPointUpgradeTowerType(state, tower.type, "damage")
                        ? `+SAT THUONG (${dmgCost} tiep te)`
                        : "+SAT THUONG (Lv3)",
                },
                pointHp: {
                    enabled:
                        canPointUpgradeTowerType(state, tower.type, "hp") &&
                        state.supplies >= hpCost,
                    text: canPointUpgradeTowerType(state, tower.type, "hp")
                        ? `+HP (${hpCost} tiep te)`
                        : "+HP (Lv3)",
                },
                pointSpeed: {
                    enabled:
                        canPointUpgradeTowerType(state, tower.type, "speed") &&
                        state.supplies >= spdCost,
                    text: canPointUpgradeTowerType(state, tower.type, "speed")
                        ? `+TOC BAN (${spdCost} tiep te)`
                        : "+TOC BAN (Lv3)",
                },
            },
        };
    }

    function getBasePanelModel(state) {
        const base = state.base;
        if (!base) {
            return null;
        }

        const levelUpCost = base.getUpgradeLevelCost();
        const hpBoostCost = App.config.base.hpBoostCostCP;
        const healCost = App.config.base.healCostCP;

        return {
            level: base.level,
            hp: Math.floor(base.hp),
            maxHp: Math.floor(base.maxHp),
            armor: Math.floor(base.armor),
            hpBoostLevel: base.hpBoostLevel,
            healReady: !base.healUsedThisWave,
            upgradeCost: levelUpCost || 0,
            hpBoostCost,
            healCost,
            buttons: {
                upgrade: {
                    enabled:
                        base.canUpgradeLevel() &&
                        state.commandPoints >= (levelUpCost || 0),
                    text: base.canUpgradeLevel()
                        ? `Nang cap can cu (${levelUpCost} CP)`
                        : "Can cu toi da",
                },
                hpBoost: {
                    enabled: state.commandPoints >= hpBoostCost,
                    text: `Tang HP toi da (+${App.config.base.hpBoostAmount}) (${hpBoostCost} CP)`,
                },
                heal: {
                    enabled:
                        !base.healUsedThisWave &&
                        state.commandPoints >= healCost &&
                        base.hp < base.maxHp,
                    text: base.healUsedThisWave
                        ? "Hoi mau da dung wave nay"
                        : `Hoi mau (${healCost} CP)`,
                },
            },
        };
    }

    function getWaveStatusText(state) {
        if (state.wavePhase === "prep") {
            return `Chuan bi wave ${state.wave}: ${state.prepTimer.toFixed(1)}s`;
        }
        if (state.wavePhase === "combat") {
            const spec = state.currentWaveSpec;
            const bossCountdown = spec
                ? Math.max(0, spec.bossSpawnAtSec - state.waveTimer)
                : 0;
            const bossStatus = state.bossSpawnedInWave
                ? state.bossKilledInWave
                    ? "Boss da ha"
                    : "Dang danh boss"
                : `Boss sau ${bossCountdown.toFixed(1)}s`;
            return `Wave ${state.wave} | Combat ${state.waveTimer.toFixed(
                1,
            )}s | ${bossStatus}`;
        }
        if (state.wavePhase === "ended") {
            return "Tran da ket thuc";
        }
        return "Dang khoi tao...";
    }

    function getHudModel(state) {
        return {
            baseHp: `${Math.max(0, Math.floor(state.base.hp))}/${Math.floor(state.base.maxHp)}`,
            supplies: Math.floor(state.supplies),
            cp: Math.floor(state.commandPoints),
            wave: `${state.wave}`,
            level: "VO HAN",
            enemiesLeft: `${state.enemies.filter((e) => e.hp > 0).length}`,
            waveState: getWaveStatusText(state),
            quizCd:
                state.quizCooldown > 0
                    ? `Quiz hồi sau ${state.quizCooldown.toFixed(1)}s`
                    : "Quiz sẵn sàng",
            paused: state.paused,
            bossWarningVisible: state.boss.warningTimer > 0,
            bossHealthVisible:
                state.boss.healthBarVisible && !!state.boss.activeId,
        };
    }

    function getTowerHelpData() {
        const items = [];
        for (const type of App.towerOrder) {
            const t = App.towersData[type];
            const scaling = t.levelScaling;
            items.push({
                type,
                name: t.name,
                color: t.color,
                description: t.description,
                role: t.role,
                cost: t.cost,
                projectileType: t.projectileType,
                level1: {
                    damage: t.damage,
                    hp: t.hp,
                    speed: t.attackSpeed.toFixed(2),
                    range: Math.floor(t.range),
                },
                level2Mult: {
                    damage: scaling.damage[1],
                    hp: scaling.hp[1],
                    speed: scaling.attackSpeed[1],
                },
                level3Mult: {
                    damage: scaling.damage[2],
                    hp: scaling.hp[2],
                    speed: scaling.attackSpeed[2],
                },
            });
        }
        return items;
    }

    function formatTime(totalSeconds) {
        const sec = Math.floor(totalSeconds % 60);
        const min = Math.floor(totalSeconds / 60);
        return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }

    function getResultModel(state) {
        return {
            title: state.result.state === "gameOver" ? "Thất bại" : "Kết thúc",
            reason: state.result.reason || "",
            wave: state.wave,
            playTime: formatTime(state.stats.playSeconds),
            correctAnswers: state.stats.correctAnswers,
            wrongAnswers: state.stats.wrongAnswers,
            towersBuilt: state.stats.towersBuilt,
            enemiesKilled: state.stats.enemiesKilled,
            wavesCleared: state.stats.wavesCleared,
        };
    }

    function quickUpgradeByTowerType(stateArg, towerType) {
        const state = stateArg || App.state;
        if (!state || state.mode !== "playing") {
            return { ok: false, reason: "not-playing" };
        }
        return upgradeTowerType(state, towerType);
    }

    App.uiSystem = {
        getHudModel,
        getTowerPanelModel,
        getBasePanelModel,
        getTowerHelpData,
        getResultModel,
        upgradeSelectedTower,
        repairSelectedTower,
        sellSelectedTower,
        pointUpgradeSelectedTower,
        upgradeBase,
        boostBaseHp,
        healBase,
        quickUpgradeByTowerType,
        canUpgradeTowerType(state, towerType) {
            return canUpgradeTowerType(state, towerType);
        },
        getTowerTypeUpgradeInfo(state, towerType) {
            const level = getTowerTech(state, towerType).level;
            const price = getTowerTypeUpgradePrice(state, towerType);
            return { level, price, canUpgrade: level < 3 };
        },
        applyTowerTechToInstance,
    };
})();
