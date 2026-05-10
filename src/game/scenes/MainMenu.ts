import { GameObjects, Geom, Scene } from 'phaser';
import { LEVELS } from '../LevelData';
import {
    clearSavedLevelForMode,
    DEFAULT_MODE_ID,
    GAME_MODES,
    GameMode,
    getGameMode,
    getSavedLevelForMode,
} from '../GameMode';

const CARD_SELECTED_ALPHA = 0.28;
const CARD_UNSELECTED_ALPHA = 0.92;
const CARD_ACCENT_ALPHA = 0.95;
const CARD_ACCENT_DIM_ALPHA = 0.55;
const CARD_TOP_BAR_HEIGHT = 8;
const CARD_INSET_X = 18;

interface ModeCard {
    mode: GameMode;
    box: GameObjects.Graphics;
    title: GameObjects.Text;
    body: GameObjects.Text;
    meta: GameObjects.Text;
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * MainMenu – title screen shown before gameplay.
 * Shows the game title, mode cards, and context-aware start controls.
 */
export class MainMenu extends Scene {
    private titleText!: GameObjects.Text;
    private selectedModeId = DEFAULT_MODE_ID;
    private modeCards: ModeCard[] = [];
    private actionButton!: GameObjects.Text;
    private actionHint!: GameObjects.Text;
    private resetButton!: GameObjects.Text;

    constructor() {
        super('MainMenu');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x101826, 0x101826, 0x17263d, 0x17263d, 1);
        bg.fillRect(0, 0, W, H);

        const glow = this.add.graphics();
        glow.fillStyle(0x5DADE2, 0.08);
        glow.fillCircle(W * 0.2, H * 0.18, 140);
        glow.fillStyle(0x58D68D, 0.08);
        glow.fillCircle(W * 0.82, H * 0.78, 180);

        this.addDecorativeArrow(68, 80, '→', '#5DADE2');
        this.addDecorativeArrow(W - 64, 76, '↓', '#EC7063');
        this.addDecorativeArrow(78, H - 78, '↑', '#58D68D');
        this.addDecorativeArrow(W - 70, H - 84, '←', '#F0B27A');

        this.titleText = this.add.text(W / 2, 88, 'ARROWS', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '64px',
            color: '#F4F8FB',
            stroke: '#2E86C1',
            strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(W / 2, 154, 'Puzzle Escape', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#A9CCE3',
            fontStyle: 'italic',
        }).setOrigin(0.5);

        this.add.text(W / 2, 198, 'Choose a mode, then peel the board apart without trapping your arrows.', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#D6EAF8',
            align: 'center',
        }).setOrigin(0.5);

        this.createModeCards();

        this.actionButton = this.add.text(W / 2, 462, '', {
            fontFamily: 'Arial Black, Arial',
            fontSize: '28px',
            color: '#102131',
            backgroundColor: '#5DADE2',
            padding: { x: 28, y: 14 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.actionButton.on('pointerdown', () => this.startSelectedMode());
        this.actionButton.on('pointerover', () => this.actionButton.setStyle({ backgroundColor: '#85C1E9' }));
        this.actionButton.on('pointerout', () => this.actionButton.setStyle({ backgroundColor: getGameMode(this.selectedModeId).accent }));

        this.actionHint = this.add.text(W / 2, 518, '', {
            fontFamily: 'Arial',
            fontSize: '15px',
            color: '#D6EAF8',
            align: 'center',
            lineSpacing: 5,
        }).setOrigin(0.5);

        this.resetButton = this.add.text(W / 2, 555, '', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#AED6F1',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.resetButton.on('pointerdown', () => {
            clearSavedLevelForMode(this.selectedModeId);
            this.refreshActionState();
        });
        this.resetButton.on('pointerover', () => this.resetButton.setColor('#F4F8FB'));
        this.resetButton.on('pointerout', () => this.resetButton.setColor('#AED6F1'));

        this.add.text(W / 2, H - 22, `${LEVELS.length} handcrafted levels • Hover to preview paths • Z undo • R restart`, {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#7FB3D5',
        }).setOrigin(0.5);

        this.selectMode(this.selectedModeId);

        this.tweens.add({
            targets: this.titleText,
            y: 82,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private createModeCards(): void {
        const cardW = 214;
        const cardH = 142;
        const startX = 64;
        const gap = 29;
        const y = 248;

        this.modeCards = GAME_MODES.map((mode, index) => this.createModeCard(
            mode,
            startX + index * (cardW + gap),
            y,
            cardW,
            cardH,
        ));
    }

    private createModeCard(mode: GameMode, x: number, y: number, width: number, height: number): ModeCard {
        const box = this.add.graphics();
        box.setInteractive(new Geom.Rectangle(x, y, width, height), Geom.Rectangle.Contains);
        box.on('pointerdown', () => this.selectMode(mode.id));
        box.on('pointerover', () => {
            if (this.selectedModeId !== mode.id) {
                box.setAlpha(0.96);
            }
        });
        box.on('pointerout', () => {
            if (this.selectedModeId !== mode.id) {
                box.setAlpha(1);
            }
        });

        const title = this.add.text(x + CARD_INSET_X, y + 18, mode.label, {
            fontFamily: 'Arial Black, Arial',
            fontSize: '24px',
            color: '#F8FBFF',
        });

        const meta = this.add.text(x + CARD_INSET_X, y + 54, this.getModeMeta(mode), {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#D6EAF8',
            fontStyle: 'bold',
        });

        const body = this.add.text(x + CARD_INSET_X, y + 82, mode.description, {
            fontFamily: 'Arial',
            fontSize: '13px',
            color: '#D5DBDB',
            wordWrap: { width: width - (CARD_INSET_X * 2) },
            lineSpacing: 4,
        });

        const card = { mode, box, title, meta, body, x, y, width, height };
        this.drawModeCard(card, false);
        return card;
    }

    private selectMode(modeId: string): void {
        this.selectedModeId = modeId;
        this.modeCards.forEach((card) => this.drawModeCard(card, card.mode.id === modeId));
        this.refreshActionState();
    }

    private refreshActionState(): void {
        const mode = getGameMode(this.selectedModeId);
        const savedLevel = getSavedLevelForMode(mode.id, LEVELS.length);
        const hasProgress = savedLevel > 0;

        this.actionButton
            .setText(hasProgress ? `▶ Continue ${mode.shortLabel}` : `▶ Start ${mode.shortLabel}`)
            .setStyle({ backgroundColor: mode.accent });

        this.actionHint.setText(
            hasProgress
                ? `Resume at Level ${savedLevel + 1}.\n${mode.description}`
                : `Fresh run from Level 1.\n${mode.description}`,
        );

        this.resetButton
            .setText(hasProgress ? `Reset ${mode.shortLabel} progress` : '')
            .setVisible(hasProgress);

        if (hasProgress) {
            this.resetButton.setInteractive({ useHandCursor: true });
        } else {
            this.resetButton.removeInteractive();
        }
    }

    private startSelectedMode(): void {
        const levelIndex = getSavedLevelForMode(this.selectedModeId, LEVELS.length);
        this.scene.start('Game', { levelIndex, modeId: this.selectedModeId });
    }

    private drawModeCard(card: ModeCard, selected: boolean): void {
        const { box, mode, title, meta, body, x, y, width, height } = card;

        box.clear();
        box.fillStyle(selected ? mode.accentColor : 0x16213E, selected ? CARD_SELECTED_ALPHA : CARD_UNSELECTED_ALPHA);
        box.fillRoundedRect(x, y, width, height, 20);
        box.lineStyle(2, mode.accentColor, selected ? 1 : 0.45);
        box.strokeRoundedRect(x, y, width, height, 20);
        box.fillStyle(mode.accentColor, selected ? CARD_ACCENT_ALPHA : CARD_ACCENT_DIM_ALPHA);
        box.fillRoundedRect(x, y, width, CARD_TOP_BAR_HEIGHT, CARD_TOP_BAR_HEIGHT);

        title.setColor(selected ? '#FFFFFF' : '#EAF2F8');
        meta.setColor(selected ? '#FDFEFE' : '#A9CCE3');
        body.setColor(selected ? '#F8F9F9' : '#D5DBDB');
        box.setAlpha(1);
    }

    private getModeMeta(mode: GameMode): string {
        if (mode.infiniteHearts) {
            return '∞ hearts • undo on';
        }

        if (!mode.allowUndo) {
            return 'reduced hearts (min 1) • undo off';
        }

        return 'standard hearts • undo on';
    }

    private addDecorativeArrow(x: number, y: number, char: string, color: string): void {
        this.add.text(x, y, char, {
            fontFamily: 'Arial',
            fontSize: '38px',
            color,
        }).setOrigin(0.5).setAlpha(0.2);
    }
}
