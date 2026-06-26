const CELL_SIZE = 66;

const BOARD_SIZE = CELL_SIZE * 9;

const START_X = 23;
const START_Y = 120;

let boardGraphics;

function drawBoard(scene) {

    if (!boardGraphics) {
        boardGraphics = scene.add.graphics();
    }

    boardGraphics.clear();

    const sk = SKINS[currentSkin] || SKINS.classic;
    const b  = sk.board;

    // Drop shadow
    boardGraphics.fillStyle(0x000000, 0.42);
    boardGraphics.fillRect(START_X + 7, START_Y + 7, BOARD_SIZE, BOARD_SIZE);

    // Board outer rim
    boardGraphics.fillStyle(b.rim, 1);
    boardGraphics.fillRect(START_X - 10, START_Y - 10, BOARD_SIZE + 20, BOARD_SIZE + 20);
    boardGraphics.lineStyle(2, b.border, 0.45);
    boardGraphics.lineBetween(START_X - 10, START_Y - 10, START_X + BOARD_SIZE + 10, START_Y - 10);
    boardGraphics.lineBetween(START_X - 10, START_Y - 10, START_X - 10, START_Y + BOARD_SIZE + 10);
    boardGraphics.lineStyle(2, 0x000000, 0.6);
    boardGraphics.lineBetween(START_X - 10, START_Y + BOARD_SIZE + 10, START_X + BOARD_SIZE + 10, START_Y + BOARD_SIZE + 10);
    boardGraphics.lineBetween(START_X + BOARD_SIZE + 10, START_Y - 10, START_X + BOARD_SIZE + 10, START_Y + BOARD_SIZE + 10);

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {

            const px = START_X + x * CELL_SIZE;
            const py = START_Y + y * CELL_SIZE;

            if (board[y][x] === -1) continue;

            const inCorner = (x < 3 || x >= 6) && (y < 3 || y >= 6);
            const filled   = board[y][x] === 1;

            // Board cell background
            boardGraphics.fillStyle(inCorner ? b.corner : b.edge);
            boardGraphics.fillRect(px, py, CELL_SIZE, CELL_SIZE);

            if (!filled) {
                // Recessed slot look
                boardGraphics.fillStyle(0x000000, 0.24);
                boardGraphics.fillRect(px, py, CELL_SIZE, 3);
                boardGraphics.fillRect(px, py, 3, CELL_SIZE);
                boardGraphics.fillStyle(0xffffff, 0.05);
                boardGraphics.fillRect(px, py + CELL_SIZE - 3, CELL_SIZE, 3);
                boardGraphics.fillRect(px + CELL_SIZE - 3, py, 3, CELL_SIZE);

                // Thin grid line
                boardGraphics.lineStyle(3, inCorner ? b.gridCorner : b.gridEdge, 0.55);
                boardGraphics.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
            }
            // Filled cells: a scene.add.rectangle object sits on top — nothing drawn here
        }
    }

    const lx3 = START_X + 3 * CELL_SIZE;
    const lx6 = START_X + 6 * CELL_SIZE;
    const ly3 = START_Y + 3 * CELL_SIZE;
    const ly6 = START_Y + 6 * CELL_SIZE;
    const top  = START_Y;
    const bot  = START_Y + BOARD_SIZE;
    const lft  = START_X;
    const rgt  = START_X + BOARD_SIZE;

    // Zone dividers
    boardGraphics.lineStyle(7, b.divider);
    boardGraphics.lineBetween(lx3, top, lx3, bot);
    boardGraphics.lineBetween(lx6, top, lx6, bot);
    boardGraphics.lineBetween(lft, ly3, lx3, ly3);
    boardGraphics.lineBetween(lft, ly6, lx3, ly6);
    boardGraphics.lineBetween(lx6, ly3, rgt, ly3);
    boardGraphics.lineBetween(lx6, ly6, rgt, ly6);
    boardGraphics.lineBetween(lx3, ly3, lx6, ly3);
    boardGraphics.lineBetween(lx3, ly6, lx6, ly6);

    // Outer board border
    boardGraphics.lineStyle(7, b.border);
    boardGraphics.lineBetween(lft, top, rgt, top);
    boardGraphics.lineBetween(lft, bot, rgt, bot);
    boardGraphics.lineBetween(lft, top, lft, bot);
    boardGraphics.lineBetween(rgt, top, rgt, bot);

    // ── Skin-specific board decorations ──────────────────────────────────────
    const SX = START_X, SY = START_Y, BSZ = BOARD_SIZE, RIM = 10;

    if (currentSkin === 'candy') {
        // Scalloped cookie inner edge — bumps of icing along all 4 inner rims
        const scR = 5.5, scStep = 13;
        boardGraphics.fillStyle(0xFFCCEE, 0.80);
        for (let x = SX + scR; x < SX + BSZ - scR; x += scStep) {
            boardGraphics.fillCircle(x, SY, scR);
            boardGraphics.fillCircle(x, SY + BSZ, scR);
        }
        for (let y = SY + scR + scStep; y < SY + BSZ - scR - scStep; y += scStep) {
            boardGraphics.fillCircle(SX, y, scR);
            boardGraphics.fillCircle(SX + BSZ, y, scR);
        }
        // Sprinkle bars in the rim — fixed positions for consistency
        const sprinkCols = [0xFF90C8, 0xFFFFAA, 0xCC88FF, 0xFFFFFF, 0xFF50B0, 0xAAFFCC];
        const sprinkXs   = [20, 48, 80, 112, 145, 180, 220, 260, 305, 345, 385, 420, 455, 490, 522];
        sprinkXs.forEach((sx, i) => {
            const col = sprinkCols[i % sprinkCols.length];
            boardGraphics.fillStyle(col, 0.90);
            const angle = (i * 37) % 180; // deterministic pseudo-random angle
            const rx = angle < 90 ? 6 : 2, ry = angle < 90 ? 2 : 6;
            boardGraphics.fillRect(SX + sx - rx, SY - RIM + 3 - ry, rx * 2, ry * 2);
            boardGraphics.fillRect(SX + ((sx + 29) % (BSZ - 10)) - rx, SY + BSZ + RIM - 7 - ry, rx * 2, ry * 2);
        });
        // Corner frosting rosettes
        [[SX-RIM+5,SY-RIM+5],[SX+BSZ+RIM-5,SY-RIM+5],
         [SX-RIM+5,SY+BSZ+RIM-5],[SX+BSZ+RIM-5,SY+BSZ+RIM-5]].forEach(([cx,cy]) => {
            boardGraphics.fillStyle(0xFFE0F4, 0.90); boardGraphics.fillCircle(cx, cy, 7);
            boardGraphics.fillStyle(0xFF90C8, 1.00); boardGraphics.fillCircle(cx, cy, 4.5);
            boardGraphics.fillStyle(0xFF28A0, 1.00); boardGraphics.fillCircle(cx, cy, 2.2);
            boardGraphics.fillStyle(0xFFFFFF, 0.70); boardGraphics.fillCircle(cx - 1.5, cy - 1.5, 1.2);
        });

    } else if (currentSkin === 'ocean') {
        // Bubble trail along all four rim edges
        let bi = 0;
        const bubCols = [0x58C4E0, 0x2E9BBF, 0x50BCEB, 0x1A6285];
        const bub = (x, y, r) => {
            boardGraphics.lineStyle(1, bubCols[bi++ % bubCols.length], 0.58 + 0.12 * (bi % 3));
            boardGraphics.strokeCircle(x, y, r);
            boardGraphics.fillStyle(0xffffff, 0.10);
            boardGraphics.fillCircle(x - r * 0.4, y - r * 0.38, r * 0.32);
        };
        const bGap = 17;
        for (let x = SX - RIM + 5; x <= SX + BSZ + RIM - 5; x += bGap) {
            bub(x, SY - RIM + 5,  3.5 + (bi % 3));
            bub(x, SY + BSZ + RIM - 5, 2.5 + (bi % 3));
        }
        for (let y = SY - RIM + 5 + bGap; y <= SY + BSZ + RIM - 5 - bGap; y += bGap) {
            bub(SX - RIM + 5,          y, 2.5 + (bi % 3));
            bub(SX + BSZ + RIM - 5,    y, 3.0 + (bi % 3));
        }

    } else if (currentSkin === 'forest') {
        // Leaf shapes at corners + small ones along top/bottom rim
        const leaf = (cx, cy, h, w, col, a) => {
            boardGraphics.fillStyle(col, a);
            boardGraphics.fillTriangle(cx, cy - h, cx + w, cy, cx, cy + h * 0.35);
            boardGraphics.fillTriangle(cx, cy - h, cx - w, cy, cx, cy + h * 0.35);
        };
        leaf(SX - RIM + 5,      SY - RIM + 5,      7, 5, 0x60A855, 0.92);
        leaf(SX + BSZ + RIM - 5, SY - RIM + 5,      7, 5, 0x78C850, 0.92);
        leaf(SX - RIM + 5,      SY + BSZ + RIM - 5, 7, 5, 0x3E7A35, 0.92);
        leaf(SX + BSZ + RIM - 5, SY + BSZ + RIM - 5, 7, 5, 0x3E7A35, 0.92);
        for (let x = SX + 42; x < SX + BSZ - 32; x += 58) {
            leaf(x,      SY - RIM + 4, 4, 3, 0x78C850, 0.70);
            leaf(x + 29, SY + BSZ + RIM - 4, 4, 3, 0x60A855, 0.70);
        }

    } else if (currentSkin === 'kpop') {
        // 5-pointed stars at corners + small stars along top/bottom
        const star = (cx, cy, R, r, col) => {
            const pts = [];
            for (let i = 0; i < 10; i++) {
                const a = (i * Math.PI / 5) - Math.PI / 2;
                pts.push({ x: cx + Math.cos(a) * (i % 2 === 0 ? R : r),
                           y: cy + Math.sin(a) * (i % 2 === 0 ? R : r) });
            }
            boardGraphics.fillStyle(col, 1);
            boardGraphics.fillPoints(pts, true);
        };
        star(SX - RIM + 6,       SY - RIM + 6,       8, 3.5, 0xFF68F8);
        star(SX + BSZ + RIM - 6, SY - RIM + 6,       8, 3.5, 0xFF68F8);
        star(SX - RIM + 6,       SY + BSZ + RIM - 6, 8, 3.5, 0xE860D8);
        star(SX + BSZ + RIM - 6, SY + BSZ + RIM - 6, 8, 3.5, 0xE860D8);
        for (let x = SX + 55; x < SX + BSZ - 42; x += 72) {
            star(x,      SY - RIM + 5,       4.5, 2, 0xFF68F8);
            star(x + 36, SY + BSZ + RIM - 5, 4.5, 2, 0xE860D8);
        }

    } else if (currentSkin === 'tetris') {
        // Mini pixel tetromino blocks at each corner
        const blk = (x, y, col) => {
            boardGraphics.fillStyle(col, 1);
            boardGraphics.fillRect(x, y, 5, 5);
            boardGraphics.fillStyle(0xffffff, 0.22); boardGraphics.fillRect(x, y, 5, 1);
            boardGraphics.fillStyle(0xffffff, 0.14); boardGraphics.fillRect(x, y + 1, 1, 4);
            boardGraphics.fillStyle(0x000000, 0.28); boardGraphics.fillRect(x + 1, y + 4, 4, 1);
            boardGraphics.fillStyle(0x000000, 0.22); boardGraphics.fillRect(x + 4, y, 1, 5);
        };
        [[0,0],[0,1],[0,2],[1,2]].forEach(([ox,oy]) => blk(SX-RIM+1+ox*6, SY-RIM+1+oy*6, 0xE0D850));         // L top-left
        [[1,0],[1,1],[0,2],[1,2]].forEach(([ox,oy]) => blk(SX+BSZ+RIM-14+ox*6, SY-RIM+1+oy*6, 0x5C8FE8));   // J top-right
        [[1,0],[2,0],[0,1],[1,1]].forEach(([ox,oy]) => blk(SX-RIM+1+ox*6, SY+BSZ+RIM-14+oy*6, 0x8AB8FF));   // S bot-left
        [[0,0],[1,0],[1,1],[2,1]].forEach(([ox,oy]) => blk(SX+BSZ+RIM-20+ox*6, SY+BSZ+RIM-14+oy*6, 0xE0D850)); // Z bot-right

    } else if (currentSkin === 'classic') {
        // Ornate wood-carved corner brackets
        const bracket = (x, y, dx, dy) => {
            boardGraphics.lineStyle(2, 0xEFA171, 0.90);
            boardGraphics.lineBetween(x + dx * 12, y, x, y);
            boardGraphics.lineBetween(x, y, x, y + dy * 12);
            boardGraphics.lineStyle(1, 0xCC9450, 0.48);
            boardGraphics.lineBetween(x + dx * 7, y + dy * 2, x + dx * 2, y + dy * 2);
            boardGraphics.lineBetween(x + dx * 2, y + dy * 2, x + dx * 2, y + dy * 7);
            boardGraphics.fillStyle(0xEFA171, 0.90);
            boardGraphics.fillCircle(x, y, 2.5);
        };
        bracket(SX - RIM + 1,       SY - RIM + 1,        1,  1);
        bracket(SX + BSZ + RIM - 1, SY - RIM + 1,       -1,  1);
        bracket(SX - RIM + 1,       SY + BSZ + RIM - 1,  1, -1);
        bracket(SX + BSZ + RIM - 1, SY + BSZ + RIM - 1, -1, -1);
        // Thin accent lines across the top/bottom rim
        boardGraphics.lineStyle(1, 0xCC9450, 0.22);
        boardGraphics.lineBetween(SX - RIM + 15, SY - RIM + 5,       SX + BSZ + RIM - 15, SY - RIM + 5);
        boardGraphics.lineBetween(SX - RIM + 15, SY + BSZ + RIM - 5, SX + BSZ + RIM - 15, SY + BSZ + RIM - 5);
    }
}
