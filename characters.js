// Bear skin colorways — assign specific skins to specific people via UNLOCK_CODES
const BEAR_SKINS = {
    'default': {
        nameColor:   '#8a3030',
        bodyColor:   0x3c2214,
        accentColor: 0xa07848,
        spotColor:   0x0c0806,
        eyeColor:    0xcc0e0e,
    },
    'glacier': {
        nameColor:   '#2088b0',
        bodyColor:   0x1e3a50,
        accentColor: 0x5ab0d0,
        spotColor:   0x080c14,
        eyeColor:    0x30e0ff,
    },
    'ember': {
        nameColor:   '#c04010',
        bodyColor:   0x4a1a08,
        accentColor: 0xe06020,
        spotColor:   0x0c0502,
        eyeColor:    0xff8820,
    },
    'midnight': {
        nameColor:   '#6030a0',
        bodyColor:   0x1a1028,
        accentColor: 0x6030a0,
        spotColor:   0x080410,
        eyeColor:    0xaa60ff,
    },
    'honey': {
        nameColor:   '#b07820',
        bodyColor:   0x6a3c0e,
        accentColor: 0xd8a040,
        spotColor:   0x180c02,
        eyeColor:    0xf0c030,
    },
};

// Shared dialogue lines — same bear personality across all skins
const BEAR_DIALOGUES = {
    bigCombo: [
        "everything you build is going to fall. i'll enjoy that part.",
        "chaos finds its way in. it always does.",
        "you can feel it unraveling, can't you?",
        "the board doesn't care about you. but i do. that's worse.",
        "you didn't choose to start. you won't choose to stop.",
        "i've watched a thousand players sit exactly where you're sitting.",
        "nothing you do here will last. i find that beautiful.",
        "every piece that falls — i feel it.",
        "don't think too hard. that's when things start breaking.",
        "something is watching from the corner. something always is.",
        "keep going. it's almost beautiful when they struggle.",
        "the board remembers everything. even the things you'd rather forget.",
        "i've been here longer than you think.",
        "order bores me. let's see how long yours holds.",
    ],
    bigStreak: [
        "oh, you're good. that only makes it more interesting.",
        "don't stop. i want to see exactly how far this goes.",
        "yes. again. again.",
        "power like that should belong to something darker.",
        "i'm watching every single move. don't disappoint me.",
        "a streak means nothing if you shatter under the weight of it.",
        "the chaos inside you is starting to show.",
        "impressive. now let's see you suffer for it.",
        "you can't hold this together forever. i'll be here when it breaks.",
        "i counted. i always count.",
        "how long have you been sitting there?",
        "close your eyes and you'll still see it.",
        "you're not playing anymore. you're being played.",
        "more. always more.",
    ],
    danger: [
        "look how little space you have left.",
        "it's closing in, isn't it.",
        "you've done this to yourself.",
        "i love watching the walls come in.",
        "panic looks good on you.",
        "breathe. slowly. it won't help, but breathe.",
        "the board is winning. the board always wins.",
        "one wrong move now. just one.",
        "there's almost no room left. how does that feel?",
        "you built this cage yourself.",
    ],
    gameOver: [
        "and so it ends. as all things do.",
        "collapse always comes. i just help it along.",
        "i warned you. you weren't listening.",
        "shattered. i love the sound of that.",
        "don't be upset. nothing stays whole. not even you.",
        "the ending is always the best part.",
        "you left something behind in there.",
        "i'll remember this one.",
        "it was never going to last. not with me watching.",
        "rest. the board will be here when you come back.",
        "nothing ends. it only waits.",
        "sleep now. i'll keep it warm.",
        "you'll be back. chaos always returns.",
        "it was never just a game.",
    ],
};

// Personal codes — map each code to a bear skin + which board skins are unlocked.
// Classic board is always available to everyone (no code needed).
// Add a new entry here for each person you want to give access to.
const UNLOCK_CODES = {
    'UKAPOKU': { bearSkin: 'default', boards: ['classic', 'ocean', 'forest', 'candy', 'tetris', 'kpop'] },
    // 'PERSONCODE': { bearSkin: 'glacier', boards: ['classic', 'ocean'] },
};

function getCurrentBearSkin() {
    const saved = localStorage.getItem('blockPuzzle_bearSkin');
    return BEAR_SKINS[saved] || BEAR_SKINS['default'];
}

function getUnlockedBoards() {
    return Object.keys(SKINS);
}

// Always returns a bear — backwards compatible with character3d.js and dialogue.js
function getAdminCharacter() {
    const skin = getCurrentBearSkin();
    return {
        animal:      'bear',
        bodyColor:   skin.bodyColor,
        accentColor: skin.accentColor,
        spotColor:   skin.spotColor,
        eyeColor:    skin.eyeColor,
        nameColor:   skin.nameColor,
        dialogues:   BEAR_DIALOGUES,
    };
}
