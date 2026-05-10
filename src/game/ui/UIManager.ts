import { GameObjects, Scene } from 'phaser';
import { BasePuzzleEngine } from '../engine/BasePuzzleEngine';
import { GameMode, ModeLevel } from '../modes';

interface HudCallbacks {
    onMenu: () => void;
    onRestart: () => void;
    onUndo: () => void;
}

const HEART_SPACING = 28;

export class UIManager {
    readonly scene: Scene;
    readonly mode: GameMode;
    readonly level: ModeLevel;

    private heartTexts: GameObjects.Text[] = [];
    private movesText!: GameObjects.Text;
    private statusText!: GameObjects.Text;
    private undoBtn!: GameObjects.Text;
    private extraTexts: GameObjects.Text[] = [];
    private heartSignature = '';

    constructor(scene: Scene, mode: GameMode, level: ModeLevel) {
        this.scene = scene;
        this.mode = mode;
        this.level = level;
    }

    create(width: number, height: number, engine: BasePuzzleEngine, callbacks: HudCallbacks): void {
        this.createTopBar(width, engine);
        this.createBottomBar(width, height, engine, callbacks);
        this.setUndoEnabled(false, callbacks.onUndo);
        this.setStatus(this.mode.getIdleStatus());
        this.update(engine, 0);
    }

    update(engine: BasePuzzleEngine, elapsedMs: number): void {
        this.movesText.setText(`Moves: ${engine.moveCount}`);
        this.renderHearts(engine, true);
        const extra = this.mode.getExtraHud(this.level, engine, elapsedMs);
        this.extraTexts.forEach((text, index) => text.setText(extra[index] ?? ''));
    }

    setStatus(message: string): void {
        this.statusText.setText(message);
    }

    setUndoEnabled(enabled: boolean, onUndo: () => void): void {
        this.undoBtn.off('pointerdown');
        this.undoBtn.off('pointerover');
        this.undoBtn.off('pointerout');

        if (!this.mode.allowUndo) {
            this.undoBtn.setColor('#95A5A6').removeInteractive();
            return;
        }

        if (!enabled) {
            this.undoBtn.setColor('#BDC3C7').removeInteractive();
            return;
        }

        this.undoBtn
            .setColor('#2980B9')
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', onUndo)
            .on('pointerover', () => this.undoBtn.setColor('#3498DB'))
            .on('pointerout', () => this.undoBtn.setColor('#2980B9'));
    }

    private createTopBar(width: number, engine: BasePuzzleEngine): void {
        this.scene.add.text(16, 14, this.level.label, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#2C3E50',
            fontStyle: 'bold',
        });

        this.scene.add.text(16, 36, this.mode.label, {
            fontFamily: 'Arial Black, Arial',
            fontSize: '11px',
            color: '#FFFFFF',
            backgroundColor: this.mode.accent,
            padding: { x: 10, y: 4 },
        });

        this.movesText = this.scene.add.text(width / 2, 14, 'Moves: 0', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#5D6D7E',
        }).setOrigin(0.5, 0);

        this.scene.add.text(width / 2, 34, this.mode.getHudSubtitle(this.level), {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#7F8C8D',
        }).setOrigin(0.5, 0);

        this.extraTexts = [0, 1].map((index) => this.scene.add.text(width - 16, 38 + index * 16, '', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#5D6D7E',
        }).setOrigin(1, 0));

        this.renderHearts(engine);
    }

    private createBottomBar(width: number, height: number, engine: BasePuzzleEngine, callbacks: HudCallbacks): void {
        const btnY = height - 34;

        const restartBtn = this.scene.add.text(width - 16, btnY, '↺ Restart', {
            fontFamily: 'Arial',
            fontSize: '17px',
            color: '#2980B9',
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', callbacks.onRestart);
        restartBtn.on('pointerover', () => restartBtn.setColor('#3498DB'));
        restartBtn.on('pointerout', () => restartBtn.setColor('#2980B9'));

        const menuBtn = this.scene.add.text(16, btnY, '☰ Menu', {
            fontFamily: 'Arial',
            fontSize: '17px',
            color: '#7F8C8D',
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', callbacks.onMenu);
        menuBtn.on('pointerover', () => menuBtn.setColor('#2C3E50'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#7F8C8D'));

        this.undoBtn = this.scene.add.text(width / 2, btnY, engine.allowUndo ? '⟵ Undo' : 'Undo Off', {
            fontFamily: 'Arial',
            fontSize: '17px',
            color: engine.allowUndo ? '#BDC3C7' : '#95A5A6',
        }).setOrigin(0.5, 0.5);

        this.statusText = this.scene.add.text(width / 2, height - 58, '', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#5D6D7E',
            align: 'center',
        }).setOrigin(0.5);
    }

    private renderHearts(engine: BasePuzzleEngine, force = false): void {
        const signature = `${engine.infiniteHearts}:${engine.hearts}:${engine.startingHearts}`;
        if (!force && signature === this.heartSignature) return;

        this.heartSignature = signature;
        const width = this.scene.scale.width;
        this.heartTexts.forEach((text) => text.destroy());
        this.heartTexts = [];

        if (engine.infiniteHearts) {
            this.heartTexts.push(this.scene.add.text(width - 16, 14, '∞', {
                fontFamily: 'Arial Black, Arial',
                fontSize: '24px',
                color: '#27AE60',
            }).setOrigin(1, 0));
            return;
        }

        const startX = width - 16 - (engine.startingHearts - 1) * HEART_SPACING;
        for (let i = 0; i < engine.startingHearts; i++) {
            const filled = i < engine.hearts;
            this.heartTexts.push(this.scene.add.text(startX + i * HEART_SPACING, 14, filled ? '❤' : '🖤', {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: filled ? '#E74C3C' : '#BDC3C7',
            }));
        }
    }
}
