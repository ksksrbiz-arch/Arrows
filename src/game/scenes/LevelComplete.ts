import { Math as PhaserMath, Scene } from 'phaser';
import { getGameMode } from '../GameMode';
import { LEVELS } from '../LevelData';

interface LevelCompleteData {
    levelIndex: number;
    modeId?: string;
    stars: number;
    moves: number;
}

/**
 * LevelComplete – shown when the player clears all arrows from the grid.
 * Displays a star rating, move count, and next-level / menu buttons.
 */
export class LevelComplete extends Scene {
    constructor() {
        super('LevelComplete');
    }

    create(data: LevelCompleteData) {
        const W = this.scale.width;
        const H = this.scale.height;

        const { levelIndex, modeId, stars, moves } = data;
        const isLastLevel = levelIndex >= LEVELS.length - 1;
        const mode = getGameMode(modeId);

        // ── Dark overlay ──────────────────────────────────────────────────────
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.88);
        bg.fillRect(0, 0, W, H);

        // ── Panel ─────────────────────────────────────────────────────────────
        const panelW = 360;
        const panelH = 320;
        const panelX = (W - panelW) / 2;
        const panelY = (H - panelH) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0xFFFFFF, 1);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
        panel.lineStyle(3, 0x5DADE2, 1);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

        // ── Heading ───────────────────────────────────────────────────────────
        this.add.text(W / 2, panelY + 36, 'Level Complete!', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '28px',
            color: '#2C3E50',
        }).setOrigin(0.5);

        this.add.text(W / 2, panelY + 64, mode.label, {
            fontFamily: 'Arial Black, Arial',
            fontSize: '11px',
            color: '#FFFFFF',
            backgroundColor: mode.accent,
            padding: { x: 10, y: 4 },
        }).setOrigin(0.5);

        // ── Stars ─────────────────────────────────────────────────────────────
        const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        const starText = this.add.text(W / 2, panelY + 104, starStr, {
            fontFamily: 'Arial',
            fontSize: '44px',
            color: '#F1C40F',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: starText,
            alpha: 1,
            scaleX: { from: 0.4, to: 1 },
            scaleY: { from: 0.4, to: 1 },
            duration: 450,
            ease: 'Back.easeOut',
        });

        // ── Stats ─────────────────────────────────────────────────────────────
        const levelDef = LEVELS[levelIndex];
        this.add.text(W / 2, panelY + 160, `Moves: ${moves}`, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#5D6D7E',
        }).setOrigin(0.5);

        const heartMsg = this.getHeartMessage(!!levelDef, mode.infiniteHearts, mode.allowUndo, stars);
        this.add.text(W / 2, panelY + 186, heartMsg, {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#7F8C8D',
        }).setOrigin(0.5);

        // ── Buttons ───────────────────────────────────────────────────────────
        const btnY = panelY + 234;

        if (!isLastLevel) {
            const nextBtn = this.add.text(W / 2 + 10, btnY, 'Next Level ▶', {
                fontFamily: 'Arial Black, Arial',
                fontSize: '20px',
                color: '#FFFFFF',
                backgroundColor: mode.accent,
                padding: { x: 20, y: 10 },
            }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

            nextBtn.on('pointerdown', () => {
                this.scene.start('Game', { levelIndex: levelIndex + 1, modeId: mode.id });
            });
            nextBtn.on('pointerover',  () => nextBtn.setStyle({ backgroundColor: '#7FB3D5' }));
            nextBtn.on('pointerout',   () => nextBtn.setStyle({ backgroundColor: mode.accent }));
        } else {
            // Last level completed!
            this.add.text(W / 2, btnY, '🎉 All levels complete!', {
                fontFamily: 'Arial Black, Arial',
                fontSize: '18px',
                color: '#F1C40F',
            }).setOrigin(0.5, 0.5);
        }

        const menuBtn = this.add.text(W / 2 - 10, btnY, '☰ Menu', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#2980B9',
            backgroundColor: '#EBF5FB',
            padding: { x: 16, y: 10 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => { this.scene.start('MainMenu'); });
        menuBtn.on('pointerover',  () => menuBtn.setStyle({ backgroundColor: '#D6EAF8' }));
        menuBtn.on('pointerout',   () => menuBtn.setStyle({ backgroundColor: '#EBF5FB' }));

        // Replay button
        this.add.text(W / 2, panelY + 290, 'Replay level', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#AEB6BF',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { this.scene.start('Game', { levelIndex, modeId: mode.id }); });

        // ── Celebration particles ─────────────────────────────────────────────
        this.time.delayedCall(200, () => this.celebrate());
    }

    private celebrate(): void {
        const W = this.scale.width;
        const colors = [0xF1C40F, 0x5DADE2, 0xEC7063, 0x58D68D, 0xF0B27A];

        for (let i = 0; i < 30; i++) {
            this.time.delayedCall(i * 50, () => {
                const x   = PhaserMath.Between(60, W - 60);
                const dot = this.add.graphics();
                dot.fillStyle(PhaserMath.RND.pick(colors), 1);
                dot.fillCircle(0, 0, PhaserMath.Between(4, 8));
                dot.x = x;
                dot.y = -10;

                this.tweens.add({
                    targets: dot,
                    y:       this.scale.height + 20,
                    x:       x + PhaserMath.Between(-60, 60),
                    alpha:   { from: 1, to: 0 },
                    duration: PhaserMath.Between(900, 1600),
                    ease: 'Cubic.easeIn',
                    onComplete: () => dot.destroy(),
                });
            });
        }
    }

    private getHeartMessage(hasLevel: boolean, infiniteHearts: boolean, allowUndo: boolean, stars: number): string {
        if (!hasLevel) {
            return '';
        }

        if (infiniteHearts) {
            return 'Zen clear: no hearts were consumed.';
        }

        if (!allowUndo) {
            return 'Challenge clear: completed without undo.';
        }

        return `Hearts performance: ${stars === 3 ? '✓ Perfect!' : `${stars}/3 stars`}`;
    }
}
