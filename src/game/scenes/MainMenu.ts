import { Scene, GameObjects } from 'phaser';
import { LEVELS } from '../LevelData';

/**
 * MainMenu – title screen shown before gameplay.
 * Shows the game title, a short tagline, and a "Play" button.
 */
export class MainMenu extends Scene {
    private titleText!: GameObjects.Text;

    constructor() {
        super('MainMenu');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ── Background gradient effect (drawn with graphics) ─────────────────
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
        bg.fillRect(0, 0, W, H);

        // Decorative arrows in corners
        this.addDecorativeArrow(60,  60,  '→', '#5DADE2');
        this.addDecorativeArrow(W - 60, 60,  '↓', '#EC7063');
        this.addDecorativeArrow(60,  H - 60, '↑', '#58D68D');
        this.addDecorativeArrow(W - 60, H - 60, '←', '#F0B27A');

        // ── Title ────────────────────────────────────────────────────────────
        this.titleText = this.add.text(W / 2, H * 0.3, 'ARROWS', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '64px',
            color: '#E8F4FD',
            stroke: '#2E86C1',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.3 + 72, 'Puzzle Escape', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#85C1E9',
            fontStyle: 'italic',
        }).setOrigin(0.5);

        // ── Tagline ───────────────────────────────────────────────────────────
        this.add.text(W / 2, H * 0.52, 'Tap arrows to free them from the grid.\nClear the board without collisions!', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#AED6F1',
            align: 'center',
            lineSpacing: 6,
        }).setOrigin(0.5);

        // ── Play button ───────────────────────────────────────────────────────
        const savedLevel = this.getSavedLevel();
        const btnLabel   = savedLevel > 0 ? `▶  Continue (Level ${savedLevel + 1})` : '▶  Play';

        const playBtn = this.add.text(W / 2, H * 0.68, btnLabel, {
            fontFamily: 'Arial Black, Arial',
            fontSize: '28px',
            color: '#1A1A2E',
            backgroundColor: '#5DADE2',
            padding: { x: 28, y: 14 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playBtn.on('pointerdown', () => {
            this.scene.start('Game', { levelIndex: savedLevel });
        });
        playBtn.on('pointerover',  () => playBtn.setStyle({ backgroundColor: '#3498DB' }));
        playBtn.on('pointerout',   () => playBtn.setStyle({ backgroundColor: '#5DADE2' }));

        // ── New Game button (if save exists) ──────────────────────────────────
        if (savedLevel > 0) {
            const newBtn = this.add.text(W / 2, H * 0.68 + 70, 'New Game', {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#AED6F1',
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            newBtn.on('pointerdown', () => {
                localStorage.removeItem('arrows_level');
                this.scene.start('Game', { levelIndex: 0 });
            });
            newBtn.on('pointerover',  () => newBtn.setColor('#E8F4FD'));
            newBtn.on('pointerout',   () => newBtn.setColor('#AED6F1'));
        }

        // ── Level count info ──────────────────────────────────────────────────
        this.add.text(W / 2, H - 24, `${LEVELS.length} levels`, {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#566573',
        }).setOrigin(0.5);

        // ── Title float animation ─────────────────────────────────────────────
        this.tweens.add({
            targets: this.titleText,
            y: H * 0.3 - 6,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private addDecorativeArrow(x: number, y: number, char: string, color: string): void {
        this.add.text(x, y, char, {
            fontFamily: 'Arial',
            fontSize: '36px',
            color,
        }).setOrigin(0.5).setAlpha(0.25);
    }

    private getSavedLevel(): number {
        try {
            const saved = localStorage.getItem('arrows_level');
            if (saved !== null) {
                const idx = parseInt(saved, 10);
                if (!isNaN(idx) && idx >= 0 && idx < LEVELS.length) return idx;
            }
        } catch {
            // localStorage may not be available
        }
        return 0;
    }
}
