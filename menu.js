const SKINS = {
    classic: {
        base: 0xCC9450, light: 0xDEB070, dark: 0x8A5E2E, label: 'Classic',
        bg: '#2e2418',
        board: { corner: 0x7B4226, edge: 0x9A5234, rim: 0x3E1A0E, border: 0xEFA171, divider: 0x5B2E18, gridCorner: 0x5B2E18, gridEdge: 0x7A3E22 }
    },
    ocean: {
        base: 0x2E9BBF, light: 0x58C4E0, dark: 0x1A6285, label: 'Ocean',
        bg: '#050F1A',
        board: { corner: 0x0C3558, edge: 0x1A5080, rim: 0x050F1A, border: 0x50BCEB, divider: 0x0C2840, gridCorner: 0x0C2840, gridEdge: 0x183858 }
    },
    forest: {
        base: 0x3E7A35, light: 0x60A855, dark: 0x264E20, label: 'Forest',
        bg: '#0A1208',
        board: { corner: 0x1A3012, edge: 0x284E1C, rim: 0x0A1208, border: 0x78C850, divider: 0x182A10, gridCorner: 0x182A10, gridEdge: 0x223A18 }
    },
    candy: {
        base: 0xFF5FA8, light: 0xFF90C8, dark: 0xCC2878, label: 'Candy',
        bg: '#1E0414',
        board: { corner: 0x7A0A4A, edge: 0xB01870, rim: 0x420530, border: 0xFFCCEE, divider: 0x7A0A4A, gridCorner: 0x7A0A4A, gridEdge: 0xB01870 }
    },
    tetris: {
        base: 0x5C8FE8, light: 0x8AB8FF, dark: 0x2A4EA8, label: 'Tetris',
        bg: '#080810',
        board: { corner: 0x10101E, edge: 0x18182E, rim: 0x08080E, border: 0xE0D850, divider: 0x10101E, gridCorner: 0x18182E, gridEdge: 0x22224A }
    },
    kpop: {
        base: 0xCC28B8, light: 0xE860D8, dark: 0x880888, label: 'K-Pop',
        bg: '#100218',
        board: { corner: 0x280438, edge: 0x440860, rim: 0x120218, border: 0xFF68F8, divider: 0x280438, gridCorner: 0x280438, gridEdge: 0x440660 }
    },
};

let currentSkin = localStorage.getItem('blockPuzzle_skin') || 'classic';
if (!SKINS[currentSkin] || !getUnlockedBoards().includes(currentSkin)) currentSkin = 'classic';

const _LORE_FRAGMENTS = [
    {
        title: 'FRAGMENT 001',
        body: 'death was never the obstacle.\nwe just let you think it was.',
    },
    {
        title: 'FRAGMENT 002',
        body: 'commit author: [unknown]\ncommit message: i\'m already here',
    },
    {
        title: 'FRAGMENT 003',
        body: 'when you look beyond the blocks, what do you see?\nwhat does he let you see?',
    },
    {
        title: 'FRAGMENT 004 — [CORRUPTED]',
        body: '█████ ██ ████ ██████████\n████ ████ ██ █████████████',
        secret: 'SEENOW',
    },
    {
        title: 'FRAGMENT 005',
        body: 'he\'s watching you.\nhe was watching before you opened this.',
    },
    {
        title: 'FRAGMENT 006',
        body: 'we cannot tell you how to recognize it.\nyou will know.',
    },
    {
        title: 'FRAGMENT 007',
        body: 'i need someone to find me.\n\n— A',
    },
];

function _openLoreOverlay(scene) {
    if (scene && scene.input) scene.input.enabled = false;
    let page = 0;

    const el = document.createElement('div');
    el.id = 'lore-overlay';
    el.style.cssText =
        'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.97);' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'font-family:"Courier New",Courier,monospace;pointer-events:auto;padding:32px;box-sizing:border-box;';
    document.body.appendChild(el);

    function render() {
        const frag = _LORE_FRAGMENTS[page];
        el.innerHTML = '';

        const header = document.createElement('div');
        header.textContent = frag.title;
        header.style.cssText = 'color:#5a4535;font-size:13px;letter-spacing:.12em;margin-bottom:28px;text-align:center;';
        el.appendChild(header);

        const body = document.createElement('div');
        body.style.cssText = 'color:#c8b89a;font-size:16px;line-height:1.8;white-space:pre-wrap;text-align:center;max-width:480px;';
        body.textContent = frag.body;
        el.appendChild(body);

        if (frag.secret) {
            const hint = document.createElement('div');
            hint.style.cssText = 'color:#8b0000;font-size:14px;margin-top:22px;letter-spacing:.18em;';
            hint.textContent = '>> ' + frag.secret;
            el.appendChild(hint);
        }

        const nav = document.createElement('div');
        nav.style.cssText = 'display:flex;gap:20px;margin-top:40px;align-items:center;';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '< PREV';
        prevBtn.disabled = page === 0;
        prevBtn.style.cssText = 'background:none;border:1px solid #3d2b1f;color:' + (page === 0 ? '#3d2b1f' : '#8a6040') + ';font-family:inherit;font-size:14px;padding:8px 18px;cursor:' + (page === 0 ? 'default' : 'pointer') + ';letter-spacing:.1em;';
        prevBtn.onclick = () => { if (page > 0) { page--; render(); } };

        const counter = document.createElement('div');
        counter.textContent = (page + 1) + ' / ' + _LORE_FRAGMENTS.length;
        counter.style.cssText = 'color:#3d2b1f;font-size:13px;min-width:60px;text-align:center;';

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'NEXT >';
        nextBtn.disabled = page === _LORE_FRAGMENTS.length - 1;
        nextBtn.style.cssText = 'background:none;border:1px solid #3d2b1f;color:' + (page === _LORE_FRAGMENTS.length - 1 ? '#3d2b1f' : '#8a6040') + ';font-family:inherit;font-size:14px;padding:8px 18px;cursor:' + (page === _LORE_FRAGMENTS.length - 1 ? 'default' : 'pointer') + ';letter-spacing:.1em;';
        nextBtn.onclick = () => { if (page < _LORE_FRAGMENTS.length - 1) { page++; render(); } };

        nav.appendChild(prevBtn);
        nav.appendChild(counter);
        nav.appendChild(nextBtn);
        el.appendChild(nav);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'CLOSE';
        closeBtn.style.cssText = 'background:none;border:1px solid #5c4632;color:#5c4632;font-family:inherit;font-size:13px;padding:8px 24px;cursor:pointer;letter-spacing:.14em;margin-top:18px;';
        closeBtn.onclick = () => { el.remove(); if (scene && scene.input) scene.input.enabled = true; if (typeof showMenuBear === 'function') showMenuBear(); };
        el.appendChild(closeBtn);
    }

    render();
}

function applySkinBackground() {
    document.body.style.background = (SKINS[currentSkin] && SKINS[currentSkin].bg) || '#2e2418';
}

applySkinBackground();

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const W = 640, H = 1000, cx = W / 2;

        // Subtle grid deco — only lower portion where bear isn't
        const deco = this.add.graphics();
        deco.lineStyle(1, 0x2a1f14, 1);
        for (let x = 0; x <= W; x += 62) deco.lineBetween(x, 620, x, H);
        for (let y = 620; y <= H; y += 62) deco.lineBetween(0, y, W, y);

        // Title — compact, sits above bear
        this.add.text(cx, 52, 'BLOCK BEAR', {
            fontSize: '52px',
            color: '#e8d9c0',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // Bear plays here (Three.js canvas y=95–615 overlaid)

        const settingsPanel = this._buildSettingsPanel(cx, H / 2);
        const skinsPanel    = this._buildSkinsPanel(cx, H / 2);
        const passwordPanel = this._buildAdminKeypad();
        settingsPanel.setVisible(false);
        skinsPanel.setVisible(false);
        passwordPanel.setVisible(false);

        // PLAY — large, dominant
        this._makePlayButton(cx, 648, () => {
            if (typeof menuBearNod  === 'function') menuBearNod();
            if (typeof menuBearZoom === 'function') menuBearZoom();
            const flash = document.createElement('div');
            flash.id = 'scene-flash';
            flash.style.cssText = 'position:fixed;inset:0;background:white;opacity:0;z-index:999;pointer-events:none;transition:opacity 0.45s ease;';
            document.body.appendChild(flash);
            requestAnimationFrame(() => { flash.style.opacity = '1'; });
            setTimeout(() => this.scene.start('GameScene'), 480);
        });

        // STUDY — show pending card count
        const _dueInfo = typeof getStudyDueCount === 'function' ? getStudyDueCount() : null;
        const _studyLabel = (_dueInfo && _dueInfo.total > 0) ? 'STUDY  ' + _dueInfo.total : 'STUDY';
        this._makeButton(cx, 728, _studyLabel, () => { if (typeof menuBearNod === 'function') menuBearNod(); if (typeof hideMenuBear === 'function') hideMenuBear(); openStudyOverlay(this); });

        // SKINS | CODE side by side
        this._makeButton(cx - 148, 808, 'SKINS', () => { if (typeof menuBearNod === 'function') menuBearNod(); if (typeof hideMenuBear === 'function') hideMenuBear(); skinsPanel.setVisible(true); });
        this._makeButton(cx + 148, 808, 'CODE',  () => { if (typeof menuBearNod === 'function') menuBearNod(); if (typeof hideMenuBear === 'function') hideMenuBear(); passwordPanel.open(); });

        // SETTINGS | ??? smaller below
        this._makeSmallButton(cx - 110, 882, 'SETTINGS', () => { if (typeof menuBearNod === 'function') menuBearNod(); if (typeof hideMenuBear === 'function') hideMenuBear(); settingsPanel.setVisible(true); });
        this._makeSmallButton(cx + 110, 882, '???', () => { if (typeof menuBearNod === 'function') menuBearNod(); _openLoreOverlay(this); });

        this.add.text(cx, H - 28, 'v0.178', {
            fontSize: '14px',
            color: '#3d2b1f',
        }).setOrigin(0.5);

        if (typeof showMenuBear === 'function') showMenuBear();
    }

    _buildAdminKeypad() {
        const container = this.add.container(0, 0);
        container.setDepth(100);

        const cx = 320;

        const overlay = this.add.rectangle(cx, 500, 640, 1000, 0x000000, 0.92)
            .setInteractive();
        const panel  = this.add.rectangle(cx, 645, 620, 560, 0x2a1f14);
        const border = this.add.graphics();
        border.lineStyle(2, 0x5c4632);
        border.strokeRect(10, 365, 620, 560);

        const titleTxt = this.add.text(cx, 395, 'ENTER CODE', {
            fontSize: '26px', color: '#d9a04b', fontStyle: 'bold',
        }).setOrigin(0.5);

        // Input display
        let inputStr = '';
        const inputBg  = this.add.rectangle(cx, 448, 600, 50, 0x14100c);
        const inputTxt = this.add.text(cx, 448, '', {
            fontSize: '20px', color: '#e8d9c0',
        }).setOrigin(0.5);

        // Feedback line (success / invalid code)
        const feedbackTxt = this.add.text(cx, 480, '', {
            fontSize: '15px', color: '#9b4a4a',
        }).setOrigin(0.5);

        const updateDisplay = () => inputTxt.setText(inputStr);

        container.add([overlay, panel, border, titleTxt, inputBg, inputTxt, feedbackTxt]);

        // QWERTY rows
        const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
        const KW = 74, KH = 54, KG = 6;
        const ROW_Y = [530, 594, 658];

        ROWS.forEach((row, ri) => {
            const totalW = row.length * KW + (row.length - 1) * KG;
            const startX = cx - totalW / 2 + KW / 2;
            row.split('').forEach((letter, ci) => {
                const kx = startX + ci * (KW + KG);
                const ky = ROW_Y[ri];
                const kbg = this.add.rectangle(kx, ky, KW, KH, 0x4a3828)
                    .setInteractive({ useHandCursor: true });
                const ktxt = this.add.text(kx, ky, letter, {
                    fontSize: '20px', color: '#e8d9c0', fontStyle: 'bold',
                }).setOrigin(0.5);
                kbg.on('pointerover', () => kbg.setFillStyle(0x6b4a2f));
                kbg.on('pointerout',  () => kbg.setFillStyle(0x4a3828));
                kbg.on('pointerdown', () => {
                    if (inputStr.length < 24) { inputStr += letter; updateDisplay(); }
                });
                container.add([kbg, ktxt]);
            });
        });

        // Bottom row: SPACE  ←  CLEAR  SAVE  X
        const ky4 = 730;
        const btns = [
            { label: 'SPACE', w: 240, col: 0x4a3828,
              fn: () => { if (inputStr.length < 24) { inputStr += ' '; updateDisplay(); } } },
            { label: '←',    w: 96,  col: 0x4a3828,
              fn: () => { inputStr = inputStr.slice(0, -1); updateDisplay(); } },
            { label: 'CLEAR', w: 112, col: 0x5c2020,
              fn: () => { inputStr = ''; updateDisplay(); } },
            { label: 'CLAIM', w: 112, col: 0x2a4a2a,
              fn: () => {
                  const code = inputStr.trim().toUpperCase();
                  const matched = UNLOCK_CODES[code];
                  if (matched && matched.type === 'secret') {
                      feedbackTxt.setText(matched.response).setColor('#cc2222');
                      inputStr = '';
                      updateDisplay();
                  } else if (matched) {
                      if (matched.character) localStorage.setItem('blockPuzzle_character', matched.character);
                      localStorage.setItem('blockPuzzle_bearSkin', matched.bearSkin);
                      localStorage.setItem('blockPuzzle_unlockedBoards', JSON.stringify(matched.boards));
                      feedbackTxt.setText('unlocked!').setColor('#4a9b4a');
                      setTimeout(() => { container.setVisible(false); if (typeof showMenuBear === 'function') showMenuBear(); }, 1400);
                  } else {
                      feedbackTxt.setText('invalid code').setColor('#9b4a4a');
                      inputStr = '';
                      updateDisplay();
                  }
              }},
            { label: 'X',    w: 64,  col: 0x3d2b1f,
              fn: () => { container.setVisible(false); if (typeof showMenuBear === 'function') showMenuBear(); } },
        ];

        const totalBtnW = btns.reduce((s, b) => s + b.w, 0) + (btns.length - 1) * 8;
        let bx = cx - totalBtnW / 2;
        btns.forEach(b => {
            const bxc = bx + b.w / 2;
            const bg  = this.add.rectangle(bxc, ky4, b.w, KH, b.col)
                .setInteractive({ useHandCursor: true });
            const txt = this.add.text(bxc, ky4, b.label, {
                fontSize: '16px', color: '#e8d9c0', fontStyle: 'bold',
            }).setOrigin(0.5);
            bg.on('pointerdown', b.fn);
            container.add([bg, txt]);
            bx += b.w + 8;
        });

        container.open = () => {
            inputStr = '';
            updateDisplay();
            feedbackTxt.setText('');
            container.setVisible(true);
        };

        return container;
    }

    _makePlayButton(x, y, onClick) {
        const bg = this.add.rectangle(x, y, 320, 74, 0x8a5a30)
            .setInteractive({ useHandCursor: true });
        this.add.text(x, y, 'PLAY', {
            fontSize: '34px',
            color: '#f5e8d0',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        bg.on('pointerover', () => bg.setFillStyle(0xaa7840));
        bg.on('pointerout',  () => bg.setFillStyle(0x8a5a30));
        bg.on('pointerdown', onClick);
    }

    _makeButton(x, y, label, onClick) {
        const bg = this.add.rectangle(x, y, 260, 58, 0x6b4a2f)
            .setInteractive({ useHandCursor: true });
        this.add.text(x, y, label, {
            fontSize: '22px',
            color: '#e8d9c0',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        bg.on('pointerover', () => bg.setFillStyle(0x8a6240));
        bg.on('pointerout',  () => bg.setFillStyle(0x6b4a2f));
        bg.on('pointerdown', onClick);
    }

    _makeSmallButton(x, y, label, onClick) {
        const bg = this.add.rectangle(x, y, 200, 46, 0x4a3020)
            .setInteractive({ useHandCursor: true });
        this.add.text(x, y, label, {
            fontSize: '17px',
            color: '#a09070',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        bg.on('pointerover', () => bg.setFillStyle(0x6b4a2f));
        bg.on('pointerout',  () => bg.setFillStyle(0x4a3020));
        bg.on('pointerdown', onClick);
    }

    _buildSettingsPanel(cx, cy) {
        const container = this.add.container(0, 0);
        container.setDepth(50);

        const overlay  = this.add.rectangle(cx, cy, 640, 1000, 0x000000, 0.75);
        const panelBg  = this.add.rectangle(cx, cy, 480, 430, 0x2a1f14);
        const border   = this.add.graphics();
        border.lineStyle(2, 0x5c4632);
        border.strokeRect(cx - 240, cy - 215, 480, 430);

        const titleTxt = this.add.text(cx, cy - 180, 'SETTINGS', {
            fontSize: '34px', color: '#e8d9c0', fontStyle: 'bold',
        }).setOrigin(0.5);

        const div = this.add.graphics();
        div.lineStyle(1, 0x5c4632);
        div.lineBetween(cx - 190, cy - 145, cx + 190, cy - 145);

        // Sound row
        const soundLabel = this.add.text(cx - 160, cy - 90, 'Sound', {
            fontSize: '22px', color: '#e8d9c0',
        }).setOrigin(0, 0.5);

        let soundOn = true;
        const soundBtn = this.add.rectangle(cx + 140, cy - 90, 90, 38, 0x6b4a2f)
            .setInteractive({ useHandCursor: true });
        const soundTxt = this.add.text(cx + 140, cy - 90, 'ON', {
            fontSize: '18px', color: '#e8d9c0', fontStyle: 'bold',
        }).setOrigin(0.5);
        soundBtn.on('pointerdown', () => {
            soundOn = !soundOn;
            soundTxt.setText(soundOn ? 'ON' : 'OFF');
            soundBtn.setFillStyle(soundOn ? 0x6b4a2f : 0x3d2b1f);
        });

        // Reset daily best row
        const resetLabel = this.add.text(cx - 160, cy + 10, 'Daily Best', {
            fontSize: '22px', color: '#e8d9c0',
        }).setOrigin(0, 0.5);

        const resetBtn = this.add.rectangle(cx + 140, cy + 10, 110, 38, 0x5c2020)
            .setInteractive({ useHandCursor: true });
        const resetTxt = this.add.text(cx + 140, cy + 10, 'RESET', {
            fontSize: '18px', color: '#e8d9c0', fontStyle: 'bold',
        }).setOrigin(0.5);
        resetBtn.on('pointerover', () => resetBtn.setFillStyle(0x8a3030));
        resetBtn.on('pointerout',  () => resetBtn.setFillStyle(0x5c2020));
        resetBtn.on('pointerdown', () => {
            localStorage.removeItem(DAILY_BEST_SCORE_KEY);
            localStorage.removeItem(DAILY_BEST_DATE_KEY);
        });

        const closeBtn = this.add.rectangle(cx, cy + 170, 160, 50, 0x6b4a2f)
            .setInteractive({ useHandCursor: true });
        const closeTxt = this.add.text(cx, cy + 170, 'CLOSE', {
            fontSize: '22px', color: '#e8d9c0', fontStyle: 'bold',
        }).setOrigin(0.5);
        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x8a6240));
        closeBtn.on('pointerout',  () => closeBtn.setFillStyle(0x6b4a2f));
        closeBtn.on('pointerdown', () => { container.setVisible(false); if (typeof showMenuBear === 'function') showMenuBear(); });

        container.add([
            overlay, panelBg, border, titleTxt, div,
            soundLabel, soundBtn, soundTxt,
            resetLabel, resetBtn, resetTxt,
            closeBtn, closeTxt,
        ]);

        return container;
    }

    _buildSkinsPanel(cx, cy) {
        const container = this.add.container(0, 0);
        container.setDepth(50);

        const overlay = this.add.rectangle(cx, cy, 900, 1000, 0x000000, 0.75);
        const panelBg = this.add.rectangle(cx, cy + 10, 620, 590, 0x2a1f14);
        const border  = this.add.graphics();
        border.lineStyle(2, 0x5c4632);
        border.strokeRect(cx - 310, cy - 285, 620, 590);

        const titleTxt = this.add.text(cx, cy - 255, 'SKINS', {
            fontSize: '34px', color: '#e8d9c0', fontStyle: 'bold',
        }).setOrigin(0.5);

        const div = this.add.graphics();
        div.lineStyle(1, 0x5c4632);
        div.lineBetween(cx - 220, cy - 215, cx + 220, cy - 215);

        container.add([overlay, panelBg, border, titleTxt, div]);

        const SW = 140, SH = 95, GX = 175, GY = 148;
        const ox = cx - GX, oy = cy - 120;

        const unlockedBoards = getUnlockedBoards();
        Object.keys(SKINS).forEach((key, i) => {
            const skin   = SKINS[key];
            const col    = i % 3;
            const row    = Math.floor(i / 3);
            const sx     = ox + col * GX;
            const sy     = oy + row * GY;
            const locked = !unlockedBoards.includes(key);

            const swatch = this.add.rectangle(sx, sy, SW, SH, skin.base);

            // Bevel
            const bv = 5;
            const bG = this.add.graphics();
            bG.fillStyle(skin.light);
            bG.fillRect(sx - SW / 2,      sy - SH / 2,      SW, bv);
            bG.fillRect(sx - SW / 2,      sy - SH / 2,      bv, SH);
            bG.fillStyle(skin.dark);
            bG.fillRect(sx - SW / 2,      sy + SH / 2 - bv, SW, bv);
            bG.fillRect(sx + SW / 2 - bv, sy - SH / 2,      bv, SH);

            const nameLabel = this.add.text(sx, sy + SH / 2 + 18, skin.label, {
                fontSize: '15px',
                color: locked ? '#5c4632' : '#e8d9c0',
            }).setOrigin(0.5);

            container.add([swatch, bG, nameLabel]);

            if (locked) {
                const lockBg  = this.add.rectangle(sx, sy, SW, SH, 0x000000, 0.60);
                const lockTxt = this.add.text(sx, sy, '🔒', {
                    fontSize: '22px',
                }).setOrigin(0.5);
                container.add([lockBg, lockTxt]);
            } else {
                swatch.setInteractive({ useHandCursor: true });
                if (currentSkin === key) swatch.setStrokeStyle(3, 0xffffff);
                swatch.on('pointerover', () => swatch.setStrokeStyle(3, 0xffffff));
                swatch.on('pointerout',  () => {
                    if (currentSkin !== key) swatch.setStrokeStyle(0);
                });
                swatch.on('pointerdown', () => {
                    currentSkin = key;
                    localStorage.setItem('blockPuzzle_skin', key);
                    swatch.setStrokeStyle(4, 0xffffff);
                    applySkinBackground();
                });
            }
        });

        const closeBtn = this.add.rectangle(cx, cy + 275, 160, 50, 0x6b4a2f)
            .setInteractive({ useHandCursor: true });
        const closeTxt = this.add.text(cx, cy + 275, 'CLOSE', {
            fontSize: '22px', color: '#e8d9c0', fontStyle: 'bold',
        }).setOrigin(0.5);
        closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x8a6240));
        closeBtn.on('pointerout',  () => closeBtn.setFillStyle(0x6b4a2f));
        closeBtn.on('pointerdown', () => { container.setVisible(false); if (typeof showMenuBear === 'function') showMenuBear(); });
        container.add([closeBtn, closeTxt]);

        return container;
    }
}
