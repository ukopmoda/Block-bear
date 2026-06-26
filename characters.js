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
        "okay that was actually clean ngl",
        "fine. i fw that.",
        "ok ok ok i see you",
        "not bad. still not beating Adom's high score tho",
        "bro thought he was different 💀",
        "adom couldn't even do that and he MADE this game",
        "that one was kinda sick",
        "alright alright, respect",
        "you're built different. maybe.",
        "the board is scared rn",
    ],
    bigStreak: [
        "you really cooking rn",
        "don't get cocky. please.",
        "bro is actually running it",
        "okay streaker we see you",
        "still can't beat Adom's high score tho lol",
        "go off i guess",
        "aight i fw this",
        "you locked in fr",
        "this is either skill or luck and i'm not sure which",
        "Adom spent 3 weeks on this game and you're out here clowning",
    ],
    danger: [
        "you cooked yourself lil bro",
        "yikes.",
        "bro how did you even get here",
        "this is genuinely painful to witness",
        "buddy...",
        "i can't watch this",
        "you really fucking suck at this",
        "the board is literally begging you to stop",
        "how",
        "this is a cry for help",
    ],
    gameOver: [
        "gg bro. (it was not gg.)",
        "you really fucking suck",
        "Adom would never.",
        "and you STILL didn't beat Adom's high score. embarrassing.",
        "tragic.",
        "ngl that was rough to watch",
        "get better.",
        "bro needed more time in the lab",
        "same time tomorrow? so i can watch you fail again?",
        "the code has bugs and you still lost to it",
        "git push and try again",
        "404: skill not found",
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
