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

const BEAVER_SKIN = {
    bodyColor:   0x5c5c5c,
    accentColor: 0x888888,
    spotColor:   0x1c1c1c,
    eyeColor:    0x080808,
    nameColor:   '#909090',
};

const BEAVER_DIALOGUES = {
    bigCombo: [
        "suboptimal placement, but the outcome was statistically acceptable.",
        "cleared. efficiency rating: 7.2 out of 10.",
        "that combo had good throughput.",
        "your pattern recognition is improving. marginally.",
        "optimal outcome. suboptimal process. still counts.",
        "well-executed. i'd have used fewer pieces but fine.",
        "7 cells cleared. above baseline.",
        "the board approved that move. i am neutral.",
    ],
    bigStreak: [
        "consistent output. running above baseline.",
        "streak confirmed. the algorithm is satisfied.",
        "four consecutive clears. don't break the chain.",
        "you've achieved a local maximum. stay focused.",
        "this is what planning ahead looks like.",
        "your decision tree is improving. incrementally.",
    ],
    danger: [
        "your board is approaching a deadlock state.",
        "you've painted yourself into a corner. classically.",
        "this is what happens when you don't plan ahead.",
        "stack overflow. in real life.",
        "board entropy is critical. intervene immediately.",
        "i'd help but you need to learn from this.",
        "your spatial reasoning has failed. diagnose and retry.",
        "fatal error incoming. prepare for game over.",
    ],
    badPlacement: [],
    kingGlaze: [
        "score logged. still below the benchmark.",
        "12000 was set without effort. you required effort.",
        "the record exists. you are not it.",
        "insufficient. the standard has already been established.",
        "you played well. he played differently.",
    ],
    gameOver: [
        "process terminated.",
        "fatal error: no valid moves remaining.",
        "segmentation fault. core dumped.",
        "your strategy had an O(n²) problem. this is the result.",
        "null pointer exception. board is now empty.",
        "runtime terminated. exit code 1.",
        "git blame yourself.",
        "404: winning not found.",
        "you failed to allocate sufficient space. classic.",
        "that was a memory leak. you were the memory.",
    ],
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
    kingGlaze: [
        "you will never be as good as him.",
        "just stop here. we already have a king.",
        "good score. wrong person.",
        "he would have kept going.",
        "12000. he didn't even try.",
        "sit down.",
    ],
    glitch: [
        "did you think you were playing?",
        "i've been here since before the game.",
        "you're still here. good.",
        "the board fills. it always fills. you never learn.",
        "adom says hi.",
        "i can see you.",
    ],
    score2000: [
        "you weren't supposed to reach this.",
        "fragment 003 warned you.",
        "we can hear you too, you know.",
    ],
};

let _forceGlitchBear = false;
function activateGlitchBear()   { _forceGlitchBear = true;  }
function deactivateGlitchBear() { _forceGlitchBear = false; }

// Personal codes — map each code to a bear skin + which board skins are unlocked.
// Classic board is always available to everyone (no code needed).
// Add a new entry here for each person you want to give access to.
const UNLOCK_CODES = {
    'UKAPOKU':       { character: 'bear',   bearSkin: 'default', boards: ['classic', 'ocean', 'forest', 'candy', 'tetris', 'kpop'] },
    'BUILDMODE':     { character: 'beaver', bearSkin: 'default', boards: ['classic', 'ocean', 'forest', 'candy', 'tetris', 'kpop'] },
    'SEENOW':        { type: 'secret', response: 'yes.' },
    'ADOM':          { type: 'secret', response: 'adom.exe has stopped responding.\n\nthe board has him now.' },
    'BRAINBREAK':    { type: 'secret', response: 'the badge was never for you.' },
    'WHYAREYOUHERE': { type: 'secret', response: 'good question.' },
    // 'PERSONCODE': { character: 'bear', bearSkin: 'glacier', boards: ['classic', 'ocean'] },
};

function getCurrentBearSkin() {
    const saved = localStorage.getItem('blockPuzzle_bearSkin');
    return BEAR_SKINS[saved] || BEAR_SKINS['default'];
}

function getUnlockedBoards() {
    return Object.keys(SKINS);
}

function getAdminCharacter() {
    if (_forceGlitchBear) {
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
    const charType = localStorage.getItem('blockPuzzle_character') || 'bear';
    if (charType === 'beaver') {
        return {
            animal:      'beaver',
            bodyColor:   BEAVER_SKIN.bodyColor,
            accentColor: BEAVER_SKIN.accentColor,
            spotColor:   BEAVER_SKIN.spotColor,
            eyeColor:    BEAVER_SKIN.eyeColor,
            nameColor:   BEAVER_SKIN.nameColor,
            dialogues:   BEAVER_DIALOGUES,
        };
    }
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
