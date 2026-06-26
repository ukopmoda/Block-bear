const PIECES = {

    single: [[0,0]],

    domino: [[0,0],[1,0]],

    line3: [[0,0],[1,0],[2,0]],
    line4: [[0,0],[1,0],[2,0],[3,0]],
    line5: [[0,0],[1,0],[2,0],[3,0],[4,0]],

    square: [
        [0,0],[1,0],
        [0,1],[1,1]
    ],

    // --------------------
    // T SHAPES
    // --------------------

    // classic 4-square T
    T: [
        [0,0],[1,0],[2,0],
               [1,1]
    ],

    // NEW: 5-square T (wide top bar, stem of 2)
    T5: [
        [0,0],[1,0],[2,0],
               [1,1],
               [1,2]
    ],

    // --------------------
    // L SHAPES
    // --------------------

    miniL: [
        [0,0],[1,0],
        [0,1]
    ],

    L4: [
        [0,0],
        [0,1],
        [0,2],
        [1,2]
    ],

    L5: [
        [0,0],[1,0],
        [0,1],
        [0,2],
        [1,2]
    ],

    // Big corner: 3 tall × 3 wide, meets at corner — 5 squares
    bigCorner: [
        [0,0],
        [0,1],
        [0,2],[1,2],[2,2]
    ],

    // --------------------
    // U SHAPE
    // --------------------

    U: [
        [0,0],
        [0,1],
        [1,1],
        [2,1],
        [2,0]
    ],

    // --------------------
    // ZIG
    // --------------------

    zig: [
        [0,0],
        [1,0],
        [1,1],
        [2,1]
    ],

    // --------------------
    // PLUS
    // --------------------

    plus: [
        [1,0],
        [0,1],[1,1],[2,1],
               [1,2]
    ],

    // --------------------
    // DIAGONALS
    // --------------------

    diag2: [
        [0,0],
        [1,1]
    ],

    diag3: [
        [0,0],
        [1,1],
        [2,2]
    ]
};

// -----------------------------
// ROTATION SYSTEM (IMPORTANT)
// -----------------------------
function rotate(shape, times = 0) {
    let rotated = shape;
    for (let i = 0; i < times; i++) {
        rotated = rotated.map(([x, y]) => [-y, x]);
        // normalize so no negative coords
        let minX = Math.min(...rotated.map(p => p[0]));
        let minY = Math.min(...rotated.map(p => p[1]));
        rotated = rotated.map(([x, y]) => [
            x - minX,
            y - minY
        ]);
    }
    return rotated;
}

// -----------------------------
// RANDOM PIECE
// Every piece type has EQUAL chance of being picked
// (one entry per shape in PIECES, no duplicate orientations),
// then a random rotation (0-3) is applied on top.
// -----------------------------
function randomPiece() {

    const keys = Object.keys(PIECES);

    const base = keys[
        Math.floor(Math.random() * keys.length)
    ];

    const shape = PIECES[base];

    const rot = Math.floor(Math.random() * 4);

    return rotate(shape, rot);
}