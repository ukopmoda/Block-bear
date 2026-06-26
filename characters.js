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
        "okay that was clean. don't make it weird.",
        "fine. i'll allow it.",
        "not bad. still ass overall tho.",
        "Adom couldn't do that. he also made this game so.",
        "that was actually kinda cold ngl",
        "you're built different. unfortunately.",
        "respect. (barely.)",
        "the board is scared. you should be too.",
    ],
    bigStreak: [
        "you're on a streak?? who allowed this",
        "still can't beat Adom's high score tho lmaooo",
        "okay fine you're not completely ass",
        "bro is locked in. unfortunately for everyone.",
        "Adom made this game in a week and you're beating his score. disrespectful.",
        "go off i guess. freak.",
    ],
    danger: [
        "you're ass.",
        "bro what are you doing",
        "this is embarrassing and i live here",
        "how did you even get into this situation",
        "i genuinely cannot watch this",
        "lil bro cooked himself",
        "the board is winning. YOU are losing.",
        "you need help. not from me though.",
    ],
    gameOver: [
        "you're ass.",
        "Adom would never.",
        "you still didn't beat Adom's score. go figure.",
        "404: skill not found.",
        "git push origin skill",
        "bro needed more time in the lab",
        "that was painful. for me.",
        "same time tomorrow so you can disappoint me again?",
        "the code has bugs and you STILL lost. impressive.",
        "tragic.",
        "get better. genuinely.",
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
