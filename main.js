const _isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const _TOUCH_LIFT     = 310;  // logical units piece rides above finger on touch

let score = 0;
let scoreText;

let kpopHypeActive    = false;
let kpopHypeEndTime   = 0;
let kpopLastMilestone = 0;

let _kpopHypeBarFill = null;
let _kpopHypeBarBg   = null;
let _kpopHypeBarGlow = null;

function startKpopHypeBar() {
    stopKpopHypeBar();
    if (!currentScene) return;
    const bx = START_X - 10;
    const bw = BOARD_SIZE + 20;
    const by = START_Y + BOARD_SIZE + 18;

    _kpopHypeBarBg = currentScene.add.rectangle(bx + bw / 2, by, bw, 4, 0x050A14, 0.7);
    _kpopHypeBarBg.setDepth(15);

    _kpopHypeBarGlow = currentScene.add.rectangle(bx, by, bw, 6, 0x0055AA, 0.30);
    _kpopHypeBarGlow.setOrigin(0, 0.5).setDepth(15);

    _kpopHypeBarFill = currentScene.add.rectangle(bx, by, bw, 4, 0x00BBFF, 0.92);
    _kpopHypeBarFill.setOrigin(0, 0.5).setDepth(16);

    currentScene.tweens.add({
        targets: [_kpopHypeBarFill, _kpopHypeBarGlow],
        scaleX: 0,
        duration: 38000,
        ease: 'Linear',
        onComplete: () => stopKpopHypeBar()
    });
}

function stopKpopHypeBar() {
    if (_kpopHypeBarFill) { _kpopHypeBarFill.destroy(); _kpopHypeBarFill = null; }
    if (_kpopHypeBarBg)   { _kpopHypeBarBg.destroy();   _kpopHypeBarBg   = null; }
    if (_kpopHypeBarGlow) { _kpopHypeBarGlow.destroy();  _kpopHypeBarGlow = null; }
}

let _kpopHypeThrobGfx  = null;
let _kpopHypeThrobTwn  = null;

function startKpopHypeThrob() {
    stopKpopHypeThrob();
    if (!currentScene) return;
    _kpopHypeThrobGfx = currentScene.add.graphics();
    _kpopHypeThrobGfx.setDepth(14);
    const proxy = { t: 0 };
    // ~128 BPM: 200ms up + 200ms back + 69ms rest ≈ 469ms per beat
    _kpopHypeThrobTwn = currentScene.tweens.add({
        targets: proxy, t: 1,
        duration: 200, ease: 'Sine.easeInOut',
        yoyo: true, repeat: -1, repeatDelay: 69,
        onUpdate: () => {
            if (!_kpopHypeThrobGfx) return;
            _kpopHypeThrobGfx.clear();
            // Pulsing outer glow border
            _kpopHypeThrobGfx.lineStyle(7, 0x00AAFF, proxy.t * 0.70);
            _kpopHypeThrobGfx.strokeRect(START_X - 16, START_Y - 16, BOARD_SIZE + 32, BOARD_SIZE + 32);
            _kpopHypeThrobGfx.lineStyle(3, 0x88DDFF, proxy.t * 0.40);
            _kpopHypeThrobGfx.strokeRect(START_X - 22, START_Y - 22, BOARD_SIZE + 44, BOARD_SIZE + 44);
            // Subtle inner board flash
            _kpopHypeThrobGfx.fillStyle(0x0055AA, proxy.t * 0.07);
            _kpopHypeThrobGfx.fillRect(START_X, START_Y, BOARD_SIZE, BOARD_SIZE);
        }
    });
}

function stopKpopHypeThrob() {
    if (_kpopHypeThrobTwn) { _kpopHypeThrobTwn.stop(); _kpopHypeThrobTwn = null; }
    if (_kpopHypeThrobGfx) { _kpopHypeThrobGfx.destroy(); _kpopHypeThrobGfx = null; }
}

function applyKpopHypeTint(active) {
    if (typeof boardCellObjects === 'undefined') return;
    const cold   = 0x4499CC;
    const normal = ((SKINS || {})['kpop'] || {}).base || 0xFF68F8;
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            if (boardCellObjects[y] && boardCellObjects[y][x]) {
                boardCellObjects[y][x].setFillStyle(active ? cold : normal);
            }
        }
    }
}

let streak = 0;

let currentScene;
let ghostGraphics;
let placedGraphics;
let boardCellObjects;
let _litBoardCells = [];
let clearAnimating = false;
let fxGraphics;
let handPieces = [];
let gameOver = false;
let _gameOverOverlay = null;

let gameOverText;
let restartButton;
let restartButtonText;

let dailyBestScore = 0;
let dailyBestText;
let allTimeBestScore = 0;

const DAILY_BEST_SCORE_KEY = "blockPuzzle_dailyBestScore";
const DAILY_BEST_DATE_KEY  = "blockPuzzle_dailyBestDate";
const ALL_TIME_BEST_KEY    = "blockPuzzle_allTimeBest";

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        currentScene = this;
        applySkinBackground();

        // Remove menu transition flash overlay
        const _fl = document.getElementById('scene-flash');
        if (_fl) _fl.remove();

        // Reset all state for a fresh game
        score          = 0;
        streak         = 0;
        gameOver       = false;
        handPieces     = [];
        gameOverText   = null;
        restartButton  = null;
        restartButtonText = null;
        clearAnimating = false;
        boardGraphics  = null; // forces board.js to create a fresh Graphics object
        ghostGraphics  = null;
        placedGraphics = null;
        fxGraphics     = null;
        resetDialogueFlags();

        loadDailyBest();

        this.input.dragDistanceThreshold = 0;

        createBoard();

        drawBoard(this);

        ghostGraphics = this.add.graphics();
        ghostGraphics.setDepth(6);
        placedGraphics = this.add.graphics();
        fxGraphics = this.add.graphics();
        fxGraphics.setDepth(10);

        // Destroy any leftover placed piece rectangles from a previous game
        if (boardCellObjects) {
            boardCellObjects.forEach(row => row.forEach(cell => { if (cell) cell.destroy(); }));
        }
        boardCellObjects = Array.from({length: 9}, () => new Array(9).fill(null));

        scoreText = this.add.text(
            20,
            35,
            "Score: 0",
            {
                fontSize: "24px",
                color: "#e8d9c0"
            }
        );

        dailyBestText = this.add.text(
            320,
            35,
            "BEST: " + allTimeBestScore,
            {
                fontSize: "24px",
                color: "#e8d9c0"
            }
        ).setOrigin(0.5, 0);

        const menuBtn = this.add.text(626, 35, "MENU", {
            fontSize: "18px",
            color: "#8a6240"
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setColor('#e8d9c0'));
        menuBtn.on('pointerout',  () => menuBtn.setColor('#8a6240'));
        menuBtn.on('pointerdown', () => { hide3DCharacter(); currentScene.scene.start('MenuScene'); });

        createHand();
        hide3DCharacter();

        this.input.on(
            "dragstart",
            (pointer, piece) => {

                if (gameOver || piece.disabledForFit) return;

                piece.setDepth(1000);

                // Tween piece from tray position up to lifted spot + full scale.
                // drag handler kills this tween the moment the pointer moves.
                this.tweens.killTweensOf(piece);
                this.tweens.add({
                    targets: piece,
                    x: pointer.x,
                    y: pointer.y - _TOUCH_LIFT,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 160,
                    ease: 'Cubic.Out',
                });
            }
        );

        this.input.on(
            "drag",
            (pointer, piece, dragX, dragY) => {

                if (gameOver) return;

                if (piece.disabledForFit) return;

                // Kill pickup tween the moment pointer moves, then track directly
                this.tweens.killTweensOf(piece);
                piece.scaleX = 1;
                piece.scaleY = 1;
                piece.x = pointer.x;
                piece.y = pointer.y - _TOUCH_LIFT;

                drawGhost(piece);
            }
        );

        this.input.on(
            "dragend",
            (pointer, piece) => {

                if (gameOver) return;

                if (piece.disabledForFit) return;

                ghostGraphics.clear();

                // Restore piece squares and any lit board cells on release
                const colors = SKINS[currentSkin];
                if (piece.squares) piece.squares.forEach(sq => sq.setFillStyle(colors.base));
                _litBoardCells.forEach(key => {
                    const cy = Math.floor(key / 9), cx = key % 9;
                    if (boardCellObjects[cy] && boardCellObjects[cy][cx]) {
                        boardCellObjects[cy][cx].setFillStyle(colors.base);
                    }
                });
                _litBoardCells = [];

                tryPlacePiece(piece);
            }
        );
    }

    update() {}
}

// Returns today's local date as "YYYY-MM-DD"
function getTodayDateString() {

    const now = new Date();

    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day   = String(now.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

let _dangerDialogueLast = -99999;

function getBoardFillPct() {
    let filled = 0;
    for (let y = 0; y < 9; y++)
        for (let x = 0; x < 9; x++)
            if (board[y][x] === 1) filled++;
    return filled / 81;
}

function loadDailyBest() {

    const today      = getTodayDateString();
    const storedDate = localStorage.getItem(DAILY_BEST_DATE_KEY);

    if (storedDate !== today) {
        dailyBestScore = 0;
        localStorage.setItem(DAILY_BEST_DATE_KEY,  today);
        localStorage.setItem(DAILY_BEST_SCORE_KEY, "0");
    } else {
        const storedScore = localStorage.getItem(DAILY_BEST_SCORE_KEY);
        dailyBestScore = storedScore ? parseInt(storedScore, 10) : 0;
    }

    const storedAll = localStorage.getItem(ALL_TIME_BEST_KEY);
    allTimeBestScore = storedAll ? parseInt(storedAll, 10) : 0;
}

function maybeUpdateDailyBest() {
    if (score > dailyBestScore) {
        dailyBestScore = score;
        localStorage.setItem(DAILY_BEST_SCORE_KEY, String(dailyBestScore));
        localStorage.setItem(DAILY_BEST_DATE_KEY,  getTodayDateString());
    }

    if (score > allTimeBestScore) {
        allTimeBestScore = score;
        localStorage.setItem(ALL_TIME_BEST_KEY, String(allTimeBestScore));
        if (dailyBestText) {
            dailyBestText.setText("BEST: " + allTimeBestScore);
        }
    }
}

// Streak multiplier: the FIRST clear in a chain is
// baseline (1.00x, no bonus yet). The multiplier only
// starts growing from the SECOND consecutive clear
// onward, and caps out at streak 6.
// streak 1 -> 1.00x, streak 2 -> 1.15x, streak 6 -> 1.75x
function getStreakMultiplier(currentStreak) {

    const capped = Math.min(currentStreak, 6);

    if (capped <= 1) return 1;

    return 1 + (capped - 1) * 0.15;
}

// Combo bonus: only fires when a SINGLE placement
// clears 2 or more lines/boxes at once.
function getComboBonus(clearedCount) {

    if (clearedCount === 2) return 55;
    if (clearedCount === 3) return 120;
    if (clearedCount >= 4) return 220;

    return 0;
}

function createHand() {

    handPieces = [];

    const trayY = 890;

    const trayPositions = [134, 320, 506];

    for (let i = 0; i < 3; i++) {

        const pieceType = randomPiece();

        const piece = createPieceVisual(
            currentScene,
            pieceType,
            trayPositions[i],
            trayY
        );

        handPieces.push(piece);
    }

    updateHandAvailability();
}

function createPieceVisual(
    scene,
    pieceType,
    startX,
    startY
) {

    const shape = pieceType;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    shape.forEach(block => {

        minX = Math.min(minX, block[0]);
        maxX = Math.max(maxX, block[0]);

        minY = Math.min(minY, block[1]);
        maxY = Math.max(maxY, block[1]);
    });

    const widthCells  = maxX - minX + 1;
    const heightCells = maxY - minY + 1;

    const width  = widthCells * CELL_SIZE;
    const height = heightCells * CELL_SIZE;

    const offsetX = -width  / 2 + CELL_SIZE / 2;
    const offsetY = -height / 2 + CELL_SIZE / 2;

    const container = scene.add.container(startX, startY);

    const squares = [];
    const colors  = SKINS[currentSkin];
    const size    = CELL_SIZE - 8;

    shape.forEach(block => {

        const cx = offsetX + block[0] * CELL_SIZE;
        const cy = offsetY + block[1] * CELL_SIZE;

        const square = scene.add.rectangle(cx, cy, size, size, colors.base);
        container.add(square);
        squares.push(square);
    });

    container.shape = shape;

    container.squares = squares;

    container.disabledForFit = false;

    container.widthCells  = widthCells;
    container.heightCells = heightCells;

    container.startX = startX;
    container.startY = startY;

    container.setScale(0.45);

    container.setSize(width, height);

    container.setInteractive(
        new Phaser.Geom.Rectangle(-130, -130, 260, 260),
        Phaser.Geom.Rectangle.Contains
    );

    scene.input.setDraggable(container);

    return container;
}

// Sets the visual grey/normal state and toggles
// drag interactivity for a single hand piece.
function setPieceFitState(piece, fits) {

    piece.disabledForFit = !fits;

    const tint = fits ? SKINS[currentSkin].base : 0x4a3c30;

    piece.squares.forEach(square => {
        square.setFillStyle(tint);
    });

    piece.setAlpha(fits ? 1 : 0.55);

    if (fits) {
        currentScene.input.setDraggable(piece, true);
    } else {
        currentScene.input.setDraggable(piece, false);
    }
}

// Checks every piece currently in hand against the
// current board state and greys out any that can't
// be placed anywhere.
function updateHandAvailability() {

    handPieces.forEach(piece => {

        let fits = false;

        for (let row = 0; row < 9 && !fits; row++) {

            for (let col = 0; col < 9 && !fits; col++) {

                if (canPlace(piece.shape, row, col)) {
                    fits = true;
                }
            }
        }

        setPieceFitState(piece, fits);
    });
}

// Returns the best snap {row, col, valid} for a piece at its current position.
// Tries the natural Math.round cell first, then ±1 on each axis so that
// pieces placed "slightly off" still land where the ghost shows.
function getSnapTarget(piece) {

    const baseCol =
        Math.round((piece.x - START_X) / CELL_SIZE) -
        Math.floor(piece.widthCells / 2);

    const baseRow =
        Math.round((piece.y - START_Y) / CELL_SIZE) -
        Math.floor(piece.heightCells / 2);

    if (canPlace(piece.shape, baseRow, baseCol)) {
        return { row: baseRow, col: baseCol, valid: true };
    }

    const fallbacks = [
        { row: baseRow - 1, col: baseCol },
        { row: baseRow + 1, col: baseCol },
        { row: baseRow,     col: baseCol - 1 },
        { row: baseRow,     col: baseCol + 1 },
    ];

    for (const candidate of fallbacks) {
        if (canPlace(piece.shape, candidate.row, candidate.col)) {
            return { ...candidate, valid: true };
        }
    }

    return { row: baseRow, col: baseCol, valid: false };
}

// Returns the set of board cells (as y*9+x keys) that would be cleared
// if shape were placed at (row, col), without mutating the real board.
function getWouldClear(shape, row, col) {

    const tmp = board.map(r => [...r]);

    for (const block of shape) {
        const x = col + block[0];
        const y = row + block[1];
        if (x >= 0 && x < 9 && y >= 0 && y < 9) tmp[y][x] = 1;
    }

    const cells = new Set();

    for (let r = 0; r < 9; r++) {
        if (tmp[r].every(v => v !== 0)) {
            for (let c = 0; c < 9; c++) {
                if (tmp[r][c] !== -1) cells.add(r * 9 + c);
            }
        }
    }

    for (let c = 0; c < 9; c++) {
        if (tmp.every(r => r[c] !== 0)) {
            for (let r = 0; r < 9; r++) {
                if (tmp[r][c] !== -1) cells.add(r * 9 + c);
            }
        }
    }

    for (let br = 0; br < 9; br += 3) {
        for (let bc = 0; bc < 9; bc += 3) {
            let full = true, hasPlayable = false;
            for (let r = br; r < br + 3; r++) {
                for (let c = bc; c < bc + 3; c++) {
                    if (tmp[r][c] !== -1) hasPlayable = true;
                    if (tmp[r][c] === 0) full = false;
                }
            }
            if (hasPlayable && full) {
                for (let r = br; r < br + 3; r++) {
                    for (let c = bc; c < bc + 3; c++) {
                        if (tmp[r][c] !== -1) cells.add(r * 9 + c);
                    }
                }
            }
        }
    }

    return cells;
}

function _getComboConfig(skin, label) {
    switch (skin) {
        case 'ocean':
            return {
                bg: 0x0C3558, border: 0x50BCEB, textColor: '#88D8F8',
                text: '≈ ' + label + ' ≈',  // ≈ waves
                radius: 16, fontSize: 21,
                ease: 'Back.Out', holdDelay: 320,
            };
        case 'forest':
            return {
                bg: 0x1A3012, border: 0x78C850, textColor: '#C0F070',
                text: label,
                radius: 6, fontSize: 22,
                ease: 'Back.Out', holdDelay: 320,
                leaves: true,
            };
        case 'candy':
            return {
                bg: 0xCC2878, border: 0xFFAADD, textColor: '#FFFFFF',
                text: '★ ' + label + ' ★',  // ★ stars
                radius: 24, fontSize: 21,
                ease: 'Elastic.Out', holdDelay: 280,
            };
        case 'tetris':
            return {
                bg: 0x08080E, border: 0xE0D850, textColor: '#E0D850',
                text: label,
                radius: 0, fontSize: 21,
                ease: 'Linear', holdDelay: 200,
                boxy: true,
            };
        case 'kpop': {
            let text = label;
            if (label === 'COMBO') {
                text = '콤보!';            // 콤보!
            } else if (label.startsWith('STREAK x')) {
                const n = parseInt(label.replace('STREAK x', ''));
                text = n >= 5
                    ? '대박!! \xd7' + n   // 대박!!
                    : '연속 \xd7' + n;    // 연속 ×n
            }
            return {
                bg: 0x280438, border: 0xFF68F8, textColor: '#FFAAFF',
                text, radius: 22, fontSize: 22,
                ease: 'Back.Out', holdDelay: 320,
                font: '"Malgun Gothic", "Apple Gothic", sans-serif',
            };
        }
        default: // classic
            return {
                bg: 0xd9a04b, border: null, textColor: '#1a1410',
                text: label,
                radius: 10, fontSize: 22,
                ease: 'Back.Out', holdDelay: 320,
            };
    }
}

function _spawnLeaves(scene, cx, cy) {
    const leafColors = [0x78C850, 0x60A855, 0xA8E060, 0x4A7C3F, 0xC8F080];
    for (let i = 0; i < 9; i++) {
        const lx   = cx + (Math.random() - 0.5) * 180;
        const size = 7 + Math.random() * 7;
        const leaf = scene.add.graphics().setDepth(29);
        leaf.fillStyle(leafColors[Math.floor(Math.random() * leafColors.length)], 0.88);
        leaf.fillEllipse(0, 0, size, size * 0.48);
        leaf.x        = lx;
        leaf.y        = cy - 30 - Math.random() * 50;
        leaf.rotation = Math.random() * Math.PI * 2;
        scene.tweens.add({
            targets:  leaf,
            x:        lx + (Math.random() - 0.5) * 90,
            y:        cy + 55 + Math.random() * 40,
            rotation: leaf.rotation + (Math.random() - 0.5) * 4,
            alpha:    0,
            duration: 650 + Math.random() * 450,
            delay:    Math.random() * 180,
            ease:     'Cubic.In',
            onComplete: () => leaf.destroy(),
        });
    }
}

function showComboBubble(label, yOffset) {

    const scene  = currentScene;
    const skin   = typeof currentSkin !== 'undefined' ? currentSkin : 'classic';
    const cfg    = _getComboConfig(skin, label);
    const cx     = 450;
    const cy     = 480 + (yOffset || 0);
    const h      = 50;
    const pad    = 26;

    const container = scene.add.container(cx, cy).setDepth(30);

    const approxW = cfg.text.length * (cfg.fontSize * 0.60) + pad * 2;
    const gr = scene.add.graphics();

    if (cfg.boxy) {
        // Tetris: hard-edged rectangle with yellow border
        gr.fillStyle(cfg.bg);
        gr.fillRect(-approxW / 2, -h / 2, approxW, h);
        gr.lineStyle(3, cfg.border, 1);
        gr.strokeRect(-approxW / 2, -h / 2, approxW, h);
    } else {
        gr.fillStyle(cfg.bg);
        gr.fillRoundedRect(-approxW / 2, -h / 2, approxW, h, cfg.radius);
        if (cfg.border) {
            gr.lineStyle(2, cfg.border, 0.85);
            gr.strokeRoundedRect(-approxW / 2, -h / 2, approxW, h, cfg.radius);
        }
    }

    const txt = scene.add.text(0, 1, cfg.text, {
        fontSize:   cfg.fontSize + 'px',
        color:      cfg.textColor,
        fontStyle:  'bold',
        fontFamily: cfg.font || '"Courier New", Courier, monospace',
    }).setOrigin(0.5);

    container.add([gr, txt]);
    container.setScale(0.5);
    container.setAlpha(0);

    if (cfg.leaves) _spawnLeaves(scene, cx, cy);

    scene.tweens.add({
        targets:  container,
        scaleX:   1, scaleY: 1, alpha: 1,
        duration: cfg.ease === 'Elastic.Out' ? 380 : 160,
        ease:     cfg.ease,
        onComplete: () => {
            scene.tweens.add({
                targets:  container,
                y:        cy - 90,
                alpha:    0,
                duration: 600,
                delay:    cfg.holdDelay,
                ease:     'Cubic.Out',
                onComplete: () => container.destroy(),
            });
        },
    });
}

function drawGhost(piece) {

    ghostGraphics.clear();

    const colors = SKINS[currentSkin];

    // Reset all piece squares to normal skin color each frame
    if (piece.squares) piece.squares.forEach(sq => sq.setFillStyle(colors.base));

    // Restore any previously lit board cells
    _litBoardCells.forEach(key => {
        const cy = Math.floor(key / 9), cx = key % 9;
        if (boardCellObjects[cy] && boardCellObjects[cy][cx]) {
            boardCellObjects[cy][cx].setFillStyle(colors.base);
        }
    });
    _litBoardCells = [];

    const { row, col, valid } = getSnapTarget(piece);

    if (!valid) {
        ghostGraphics.fillStyle(0xa84b3f, 0.45);
        for (const block of piece.shape) {
            const x = col + block[0];
            const y = row + block[1];
            if (x < 0 || x > 8 || y < 0 || y > 8) continue;
            ghostGraphics.fillRect(
                START_X + x * CELL_SIZE,
                START_Y + y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
        }
        return;
    }

    const clearCells = getWouldClear(piece.shape, row, col);

    // Shadow ghost for non-clearing cells
    ghostGraphics.fillStyle(0x14100c, 0.4);
    for (const block of piece.shape) {
        const x = col + block[0];
        const y = row + block[1];
        if (x < 0 || x > 8 || y < 0 || y > 8) continue;
        if (!clearCells.has(y * 9 + x)) {
            ghostGraphics.fillRect(
                START_X + x * CELL_SIZE,
                START_Y + y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }

    // Highlight ALL clearing cells white — piece squares AND placed board cells
    if (clearCells.size > 0) {
        if (piece.squares) {
            piece.shape.forEach((block, i) => {
                const bx = col + block[0];
                const by = row + block[1];
                if (clearCells.has(by * 9 + bx)) {
                    piece.squares[i].setFillStyle(0xffffff);
                }
            });
        }

        // Light up already-placed board cells that are part of the clear
        const placingKeys = new Set(piece.shape.map(b => (row + b[1]) * 9 + (col + b[0])));
        for (const key of clearCells) {
            if (!placingKeys.has(key)) {
                const cy = Math.floor(key / 9), cx = key % 9;
                if (boardCellObjects[cy] && boardCellObjects[cy][cx]) {
                    boardCellObjects[cy][cx].setFillStyle(0xffffff);
                    _litBoardCells.push(key);
                }
            }
        }
    }
}

function tryPlacePiece(piece) {

    const { row, col, valid } = getSnapTarget(piece);

    if (!valid) {

        currentScene.tweens.add({
            targets: piece,
            x: piece.startX,
            y: piece.startY,
            scaleX: 0.45,
            scaleY: 0.45,
            duration: 180,
            ease: 'Back.Out'
        });

        return;
    }

    placePiece(piece.shape, row, col);
    playPlaceSound();

    // Spawn Rectangle objects for each placed block — same type as tray pieces
    const _placeColors = SKINS[currentSkin];
    const _hypeNow     = currentSkin === 'kpop' && kpopHypeActive && Date.now() <= kpopHypeEndTime;
    const _blockSize   = CELL_SIZE - 8;
    piece.shape.forEach(block => {
        const bx = col + block[0];
        const by = row + block[1];
        const rect = currentScene.add.rectangle(
            START_X + bx * CELL_SIZE + CELL_SIZE / 2,
            START_Y + by * CELL_SIZE + CELL_SIZE / 2,
            _blockSize, _blockSize,
            _hypeNow ? 0x4499CC : _placeColors.base
        );
        rect.setDepth(3);
        boardCellObjects[by][bx] = rect;
    });

    // K-Pop hype mode: cold neon flash on every placed cell
    if (_hypeNow) {
        piece.shape.forEach(block => {
            const bx = col + block[0];
            const by = row + block[1];
            const fx = START_X + bx * CELL_SIZE + CELL_SIZE / 2;
            const fy = START_Y + by * CELL_SIZE + CELL_SIZE / 2;
            const glow = currentScene.add.rectangle(fx, fy, CELL_SIZE - 2, CELL_SIZE - 2, 0x0077CC, 0.55);
            glow.setDepth(5);
            currentScene.tweens.add({ targets: glow, alpha: 0, duration: 700, ease: 'Power2', onComplete: () => glow.destroy() });
            const flash = currentScene.add.rectangle(fx, fy, CELL_SIZE - 14, CELL_SIZE - 14, 0x00CCFF, 0.92);
            flash.setDepth(6);
            currentScene.tweens.add({ targets: flash, alpha: 0, duration: 420, ease: 'Power2', onComplete: () => flash.destroy() });
        });
    }

    const result  = clearCompletedLines();
    const cleared = result.count;

    console.log("Blocks:", piece.shape.length, "Cleared:", cleared);

    piece.destroy();

    handPieces = handPieces.filter(p => p !== piece);

    // Draw the placed piece immediately
    redrawEverything();

    // Dissolve animation on just the cleared cells
    if (cleared > 0) {
        animateDissolve(result.cells);
    }

    // Base score = number of blocks placed
    score += piece.shape.length;

    // -----------------------------
    // STREAK
    // ONLY increments when this placement actually
    // cleared at least one line/box. Placing a piece
    // with no clear resets streak back to 0.
    // Multiplier applies to the clear-tier bonus below.
    // -----------------------------

    if (cleared > 0) {
        streak += 1;
    } else {
        streak = 0;
    }

    const multiplier = getStreakMultiplier(streak);

    // Bonus score for clears (tiered, then streak-multiplied)
    let clearBonus = 0;

    if (cleared === 1)      clearBonus = 35;
    else if (cleared === 2) clearBonus = 80;
    else if (cleared === 3) clearBonus = 160;
    else if (cleared >= 4)  clearBonus = 320;

    clearBonus = Math.round(clearBonus * multiplier);

    // -----------------------------
    // COMBO
    // Flat bonus for clearing 2+ lines/boxes
    // in this single placement.
    // -----------------------------

    const comboBonus = getComboBonus(cleared);

    score += clearBonus + comboBonus;

    scoreText.setText("Score: " + score);

    // K-Pop hype mode: every 1000 points activates for 40 seconds
    if (currentSkin === 'kpop') {
        if (kpopHypeActive && Date.now() > kpopHypeEndTime) {
            kpopHypeActive = false;
            if (typeof stopKpopHypeBackground === 'function') stopKpopHypeBackground();
            applyKpopHypeTint(false);
            stopKpopHypeBar();
            stopKpopHypeThrob();
        }
        const milestone = Math.floor(score / 1000);
        if (milestone > kpopLastMilestone) {
            kpopLastMilestone = milestone;
            kpopHypeActive    = true;
            kpopHypeEndTime   = Date.now() + 38000;
            if (typeof startKpopHypeBackground === 'function') startKpopHypeBackground();
            applyKpopHypeTint(true);
            startKpopHypeBar();
            startKpopHypeThrob();
        }
    }

    maybeUpdateDailyBest();

    if (streak >= 2 && comboBonus > 0) {
        showComboBubble("COMBO",   0);
        showComboBubble("STREAK x" + streak, -64);
    } else if (streak >= 2) {
        showComboBubble("STREAK x" + streak, 0);
    } else if (comboBonus > 0) {
        showComboBubble("COMBO", 0);
    }

    if (streak === 3 || streak === 6) {
        showCharacterDialogue('bigStreak');
    }

    // Danger dialogue when board filling up and no clear
    if (cleared === 0) {
        const fillPct = getBoardFillPct();
        if (fillPct > 0.72) {
            const now = Date.now();
            if (now - _dangerDialogueLast > 14000) {
                _dangerDialogueLast = now;
                showCharacterDialogue('danger');
            }
        }
    }

    checkHandStatus();
}

function checkHandStatus() {

    if (handPieces.length === 0) {

        createHand();

        // New hand might be immediately unplayable on a full board
        if (!canAnyPieceFit()) {
            showGameOver();
        }

        return;
    }

    // Board changed (placement + possible clears),
    // so re-check which remaining hand pieces still fit.
    updateHandAvailability();

    if (!canAnyPieceFit()) {

        showGameOver();
    }
}

function canAnyPieceFit() {

    for (const piece of handPieces) {

        for (let row = 0; row < 9; row++) {

            for (let col = 0; col < 9; col++) {

                if (canPlace(piece.shape, row, col)) {
                    return true;
                }
            }
        }
    }

    return false;
}

function showGameOver() {

    if (gameOver) return;

    gameOver = true;

    // If an admin character is active, show their game-over dialogue first,
    // then reveal the panel once the player dismisses it.
    if (getAdminCharacter()) {
        showCharacterDialogue('gameOver', _showGameOverPanel);
    } else {
        _showGameOverPanel();
    }
}

function _showGameOverPanel() {
    const cv   = document.querySelector('canvas');
    const rect = cv.getBoundingClientRect();
    const sx   = rect.width  / 640;
    const sy   = rect.height / 1000;
    const fs   = n => Math.round(n * Math.min(sx, sy)) + 'px';

    const overlay = document.createElement('div');
    overlay.style.cssText =
        'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:rgba(0,0,0,0.72);z-index:40;' +
        'display:flex;align-items:center;justify-content:center;' +
        'opacity:0;transition:opacity 0.30s ease;pointer-events:auto;';
    document.body.appendChild(overlay);
    _gameOverOverlay = overlay;
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    const panel = document.createElement('div');
    panel.style.cssText =
        `width:${Math.round(370*sx)}px;` +
        'background:linear-gradient(155deg,#1e1308 0%,#120d04 100%);' +
        `border:${Math.max(1,Math.round(2*sy))}px solid #6b4820;` +
        `border-radius:${Math.round(14*sy)}px;` +
        `padding:${Math.round(30*sy)}px ${Math.round(32*sx)}px;` +
        'box-sizing:border-box;display:flex;flex-direction:column;' +
        `align-items:center;gap:${Math.round(10*sy)}px;` +
        'transform:scale(0.82);transition:transform 0.38s cubic-bezier(0.34,1.56,0.64,1);';
    overlay.appendChild(panel);
    requestAnimationFrame(() => requestAnimationFrame(() => { panel.style.transform = 'scale(1)'; }));

    // Top accent bar
    const bar = document.createElement('div');
    bar.style.cssText = `width:${Math.round(52*sx)}px;height:${Math.round(3*sy)}px;background:#8a5c28;border-radius:2px;margin-bottom:${Math.round(2*sy)}px;`;
    panel.appendChild(bar);

    // Title
    const title = document.createElement('div');
    title.textContent = 'GAME OVER';
    title.style.cssText = `font:bold ${fs(38)} Arial,sans-serif;color:#c85030;letter-spacing:.08em;text-shadow:0 0 28px rgba(200,80,48,.40);`;
    panel.appendChild(title);

    // Score number (large)
    const scoreNum = document.createElement('div');
    scoreNum.textContent = score;
    scoreNum.style.cssText = `font:bold ${fs(62)} Arial,sans-serif;color:#e8d9c0;line-height:1;margin-top:${Math.round(2*sy)}px;`;
    panel.appendChild(scoreNum);

    const scoreLbl = document.createElement('div');
    scoreLbl.textContent = 'SCORE';
    scoreLbl.style.cssText = `font:${fs(12)} Arial,sans-serif;color:#5a4535;letter-spacing:.18em;margin-top:-${Math.round(4*sy)}px;`;
    panel.appendChild(scoreLbl);

    // All-time best / new record
    const isNewAllTime = score > 0 && score === allTimeBestScore;
    const isNewDaily   = score > 0 && score === dailyBestScore;
    const bestEl = document.createElement('div');
    if (isNewAllTime) {
        bestEl.textContent = '★  NEW ALL-TIME BEST  ★';
        bestEl.style.cssText = `font:bold ${fs(15)} Arial,sans-serif;color:#f5c820;letter-spacing:.06em;`;
    } else if (isNewDaily) {
        bestEl.textContent = '★  NEW DAILY BEST  ★';
        bestEl.style.cssText = `font:bold ${fs(14)} Arial,sans-serif;color:#c8a030;letter-spacing:.06em;`;
    } else {
        bestEl.textContent = 'Daily Best: ' + dailyBestScore;
        bestEl.style.cssText = `font:bold ${fs(13)} Arial,sans-serif;color:#7a6050;letter-spacing:.06em;`;
    }
    panel.appendChild(bestEl);

    const allTimeEl = document.createElement('div');
    allTimeEl.textContent = 'All-Time Best: ' + allTimeBestScore;
    allTimeEl.style.cssText = `font:${fs(12)} Arial,sans-serif;color:#5a4535;letter-spacing:.04em;margin-top:${Math.round(2*sy)}px;`;
    panel.appendChild(allTimeEl);

    // Divider
    const hr = document.createElement('div');
    hr.style.cssText = `width:100%;height:1px;background:#2e1e0a;margin:${Math.round(4*sy)}px 0;`;
    panel.appendChild(hr);

    // Play again button
    const btn = document.createElement('button');
    btn.textContent = 'PLAY AGAIN';
    btn.style.cssText =
        `padding:${Math.round(12*sy)}px ${Math.round(38*sx)}px;` +
        'background:#5c3820;border:none;' +
        `border-radius:${Math.round(6*sy)}px;` +
        `color:#e8d9c0;font:bold ${fs(17)} Arial,sans-serif;` +
        'cursor:pointer;letter-spacing:.12em;' +
        'transition:background .15s,transform .10s;outline:none;';
    btn.addEventListener('mouseover', () => { btn.style.background='#8a5030'; btn.style.transform='scale(1.05)'; });
    btn.addEventListener('mouseout',  () => { btn.style.background='#5c3820'; btn.style.transform='scale(1)'; });
    btn.addEventListener('click', () => restartGame());
    panel.appendChild(btn);
}

const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 1000,
    transparent: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 640,
        height: 1000,
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);

// Fully resets the game state and starts a fresh round.
function restartGame() {

    if (_gameOverOverlay) { _gameOverOverlay.remove(); _gameOverOverlay = null; }

    score  = 0;
    streak = 0;
    gameOver = false;
    kpopHypeActive    = false;
    kpopLastMilestone = 0;
    _dangerDialogueLast = -99999;
    if (typeof stopKpopHypeBackground === 'function') stopKpopHypeBackground();
    applyKpopHypeTint(false);
    stopKpopHypeBar();
    stopKpopHypeThrob();

    scoreText.setText("Score: 0");

    if (gameOverText) {
        gameOverText.destroy();
        gameOverText = null;
    }

    if (restartButton) {
        restartButton.destroy();
        restartButton = null;
    }

    if (restartButtonText) {
        restartButtonText.destroy();
        restartButtonText = null;
    }

    handPieces.forEach(piece => piece.destroy());
    handPieces = [];

    // Destroy leftover placed-piece rectangles from the previous round
    if (boardCellObjects) {
        boardCellObjects.forEach(row => row.forEach(cell => { if (cell) cell.destroy(); }));
    }
    boardCellObjects = Array.from({length: 9}, () => new Array(9).fill(null));
    _litBoardCells = [];

    createBoard();
    drawBoard(currentScene);

    placedGraphics.clear();
    ghostGraphics.clear();
    fxGraphics.clear();

    createHand();
    hide3DCharacter();
}

function canPlace(shape, row, col) {

    for (const block of shape) {

        const x = col + block[0];
        const y = row + block[1];

        if (x < 0 || x > 8 || y < 0 || y > 8) return false;

        if (board[y][x] === -1) return false;

        if (board[y][x] === 1) return false;
    }

    return true;
}

function placePiece(shape, row, col) {

    for (const block of shape) {

        const x = col + block[0];
        const y = row + block[1];

        board[y][x] = 1;
    }
}

function redrawEverything() {

    placedGraphics.clear();

    const bevel  = 4;
    const colors = SKINS[currentSkin];

    for (let y = 0; y < 9; y++) {

        for (let x = 0; x < 9; x++) {

            if (board[y][x] === 1) {

                const cellX = START_X + x * CELL_SIZE + 5;
                const cellY = START_Y + y * CELL_SIZE + 5;
                const size  = CELL_SIZE - 10;

                placedGraphics.fillStyle(colors.base);
                placedGraphics.fillRect(cellX, cellY, size, size);

                placedGraphics.fillStyle(colors.light);
                placedGraphics.fillRect(cellX, cellY, size, bevel);
                placedGraphics.fillRect(cellX, cellY, bevel, size);

                placedGraphics.fillStyle(colors.dark);
                placedGraphics.fillRect(cellX, cellY + size - bevel, size, bevel);
                placedGraphics.fillRect(cellX + size - bevel, cellY, bevel, size);
            }
        }
    }
}

function clearCompletedLines() {

    let cleared = 0;
    const clearedCells = new Set();

    function addCell(x, y) {
        clearedCells.add(y * 9 + x);
    }

    // Rows
    for (let row = 0; row < 9; row++) {

        let full = true;

        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) { full = false; break; }
        }

        if (full) {
            cleared++;
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== -1) addCell(col, row);
            }
        }
    }

    // Columns
    for (let col = 0; col < 9; col++) {

        let full = true;

        for (let row = 0; row < 9; row++) {
            if (board[row][col] === 0) { full = false; break; }
        }

        if (full) {
            cleared++;
            for (let row = 0; row < 9; row++) {
                if (board[row][col] !== -1) addCell(col, row);
            }
        }
    }

    // 3x3 boxes
    for (let br = 0; br < 9; br += 3) {

        for (let bc = 0; bc < 9; bc += 3) {

            let full = true;
            let hasPlayableCell = false;

            for (let r = br; r < br + 3; r++) {
                for (let c = bc; c < bc + 3; c++) {

                    if (board[r][c] !== -1) hasPlayableCell = true;

                    if (board[r][c] === 0) full = false;
                }
            }

            // A box made entirely of void (-1) cells
            // (like the center cutout) is never a real clear.
            if (!hasPlayableCell) continue;

            if (full) {
                cleared++;
                for (let r = br; r < br + 3; r++) {
                    for (let c = bc; c < bc + 3; c++) {
                        if (board[r][c] !== -1) addCell(c, r);
                    }
                }
            }
        }
    }

    for (const key of clearedCells) {
        const x = key % 9;
        const y = Math.floor(key / 9);
        board[y][x] = 0;
    }

    return {
        count: cleared,
        cells: Array.from(
            clearedCells,
            key => ({ x: key % 9, y: Math.floor(key / 9) })
        )
    };
}

function animateDissolve(cells, callback) {
    if (!cells || cells.length === 0) { if (callback) callback(); return; }
    clearAnimating = true;
    playClearSound();

    // Hide the placed Rectangle objects for cleared cells immediately
    cells.forEach(c => {
        if (boardCellObjects[c.y] && boardCellObjects[c.y][c.x]) {
            boardCellObjects[c.y][c.x].setVisible(false);
        }
    });

    const colors  = SKINS[currentSkin];

    // Diagonal wave: sort by x+y so dissolve sweeps top-left → bottom-right
    const sorted  = [...cells].sort((a, b) => (a.x + a.y) - (b.x + b.y));

    const STAGGER  = 28;   // ms between each cell starting
    const FLASH    = 70;   // ms bright flash per cell
    const DISSOLVE = 210;  // ms shrink+fade after flash
    const PER_CELL = FLASH + DISSOLVE;
    const TOTAL    = STAGGER * (sorted.length - 1) + PER_CELL + 40;

    const start = performance.now();

    function step() {
        const e = performance.now() - start;
        fxGraphics.clear();

        sorted.forEach((c, i) => {
            const local = e - i * STAGGER;
            if (local < 0 || local >= PER_CELL) return;

            const px = START_X + c.x * CELL_SIZE + CELL_SIZE / 2;
            const py = START_Y + c.y * CELL_SIZE + CELL_SIZE / 2;

            if (local < FLASH) {
                // Flash phase: white pop
                const ft    = local / FLASH;
                const alpha = ft < 0.35 ? ft / 0.35 : 1 - (ft - 0.35) / 0.65;
                fxGraphics.fillStyle(0xffffff, alpha * 0.95);
                fxGraphics.fillRect(px - CELL_SIZE / 2, py - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
            } else {
                // Dissolve phase: shrink + sparkle
                const dt   = (local - FLASH) / DISSOLVE;
                const ease = 1 - Math.pow(1 - dt, 2);
                const sz   = CELL_SIZE * (1 - ease * 0.78);
                const alph = 1 - dt;

                fxGraphics.fillStyle(colors.base, alph * 0.88);
                fxGraphics.fillRect(px - sz / 2, py - sz / 2, sz, sz);

                // Bright center that shrinks faster
                const msz = sz * 0.42;
                fxGraphics.fillStyle(0xfffbe8, alph * (1 - dt) * 0.85);
                fxGraphics.fillRect(px - msz / 2, py - msz / 2, msz, msz);

                // Tiny sparkle pixels flying outward
                if (dt < 0.55) {
                    const pA   = (1 - dt / 0.55) * 0.75;
                    const dist = ease * CELL_SIZE * 0.72;
                    const pSz  = 3;
                    [[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx, dy]) => {
                        fxGraphics.fillStyle(0xfffbe8, pA);
                        fxGraphics.fillRect(px + dx * dist - pSz / 2, py + dy * dist - pSz / 2, pSz, pSz);
                    });
                }
            }
        });

        if (e < TOTAL) requestAnimationFrame(step);
        else {
            fxGraphics.clear();
            // Destroy placed Rectangle objects for cleared cells
            cells.forEach(c => {
                if (boardCellObjects[c.y] && boardCellObjects[c.y][c.x]) {
                    boardCellObjects[c.y][c.x].destroy();
                    boardCellObjects[c.y][c.x] = null;
                }
            });
            redrawEverything();
            clearAnimating = false;
            if (callback) callback();
        }
    }
    requestAnimationFrame(step);
}
