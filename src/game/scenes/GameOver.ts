import { Scene } from 'phaser';
import { LEVELS } from '../LevelData';

interface GameOverData {
    levelIndex: number;
}

/**
 * GameOver – shown when all hearts are lost.
 * Lets the player retry the same level or go back to the menu.
 */
export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create(data: GameOverData) {
        const W = this.scale.width;
        const H = this.scale.height;

        const levelIndex = data?.levelIndex ?? 0;
        const levelDef   = LEVELS[levelIndex];

        // ── Dark red overlay ──────────────────────────────────────────────────
        const bg = this.add.graphics();
        bg.fillStyle(0x1a0a0a, 0.92);
        bg.fillRect(0, 0, W, H);

        // ── Panel ─────────────────────────────────────────────────────────────
        const panelW = 340;
        const panelH = 260;
        const panelX = (W - panelW) / 2;
        const panelY = (H - panelH) / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0xFFFFFF, 1);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 14);
        panel.lineStyle(3, 0xE74C3C, 1);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 14);

        // ── Heading ───────────────────────────────────────────────────────────
        this.add.text(W / 2, panelY + 40, '💔 Out of Hearts', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '26px',
            color: '#C0392B',
        }).setOrigin(0.5);

        // ── Level name ────────────────────────────────────────────────────────
        if (levelDef) {
            this.add.text(W / 2, panelY + 86, `Level ${levelDef.id} – ${levelDef.title}`, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#7F8C8D',
            }).setOrigin(0.5);
        }

        this.add.text(W / 2, panelY + 116, "Don't give up – study the order!", {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#AEB6BF',
            fontStyle: 'italic',
        }).setOrigin(0.5);

        // ── Buttons ───────────────────────────────────────────────────────────
        const btnY = panelY + 172;

        const retryBtn = this.add.text(W / 2 + 8, btnY, '↺ Try Again', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '20px',
            color: '#FFFFFF',
            backgroundColor: '#E74C3C',
            padding: { x: 20, y: 10 },
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerdown', () => {
            this.scene.start('Game', { levelIndex });
        });
        retryBtn.on('pointerover',  () => retryBtn.setStyle({ backgroundColor: '#EC7063' }));
        retryBtn.on('pointerout',   () => retryBtn.setStyle({ backgroundColor: '#E74C3C' }));

        const menuBtn = this.add.text(W / 2 - 8, btnY, '☰ Menu', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#2980B9',
            backgroundColor: '#EBF5FB',
            padding: { x: 16, y: 10 },
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => { this.scene.start('MainMenu'); });
        menuBtn.on('pointerover',  () => menuBtn.setStyle({ backgroundColor: '#D6EAF8' }));
        menuBtn.on('pointerout',   () => menuBtn.setStyle({ backgroundColor: '#EBF5FB' }));

        // ── Shake animation on panel ──────────────────────────────────────────
        this.cameras.main.shake(400, 0.008);
    }
}
