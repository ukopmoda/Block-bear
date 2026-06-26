let dialogueActive = false;

let _audioCtx = null;
let _oceanLoaded = false;

function _ensureAudioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') {
        _audioCtx.resume();
        // Silent buffer — required by iOS Safari to actually unlock the audio system
        try {
            const buf = _audioCtx.createBuffer(1, 1, 22050);
            const src = _audioCtx.createBufferSource();
            src.buffer = buf;
            src.connect(_audioCtx.destination);
            src.start(0);
        } catch(e) {}
    }
    return _audioCtx;
}

// Belt-and-suspenders: also unlock on raw touchstart and touchend
['touchstart', 'touchend'].forEach(ev =>
    document.addEventListener(ev, () => { try { _ensureAudioCtx(); } catch(e) {} }, { passive: true })
);

function _sansBlip() {
    try {
        const ctx = _ensureAudioCtx();
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 1800 + Math.random() * 600;
        g.gain.setValueAtTime(0.010, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.018);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.020);
    } catch (e) {}
}

const _jaLines = [
    "なんだと！",
    "まさか…",
    "くそっ！",
    "面白い…",
    "覚悟しろ",
    "行くぞ！",
    "信じられない",
    "まだまだ！",
    "もう終わりだ",
    "やるか！",
    "逃げるな",
    "見ているぞ…",
    "そうか…",
    "やってみろ！",
    "うそだろ！",
    "諦めるな！",
];


function playPlaceSound() {
    try {
        const ctx = _ensureAudioCtx();
        const now = ctx.currentTime;
        // Low woody thud
        const o1 = ctx.createOscillator(), g1 = ctx.createGain();
        o1.connect(g1); g1.connect(ctx.destination);
        o1.type = 'triangle';
        o1.frequency.setValueAtTime(190, now);
        o1.frequency.exponentialRampToValueAtTime(75, now + 0.09);
        g1.gain.setValueAtTime(0.30, now);
        g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
        o1.start(now); o1.stop(now + 0.11);
        // Soft click transient
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine';
        o2.frequency.value = 440;
        g2.gain.setValueAtTime(0.10, now);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
        o2.start(now); o2.stop(now + 0.05);
    } catch (e) {}
}

function _streakPitch() {
    const RATIOS = [1, 1.125, 1.25, 1.333, 1.5, 1.667];
    const level = Math.min((typeof streak !== 'undefined' ? streak : 0) + 1, 6);
    return RATIOS[level - 1];
}

// ── Classic synth engine (four-sine bell chord, no samples) ──────────────────
function _clearSoundClassic(ctx) {
    const now = ctx.currentTime;
    const p   = _streakPitch();
    const base = 440 * p;

    const oRoot = ctx.createOscillator(), gRoot = ctx.createGain();
    oRoot.connect(gRoot); gRoot.connect(ctx.destination);
    oRoot.type = 'sine'; oRoot.frequency.value = base;
    gRoot.gain.setValueAtTime(0, now);
    gRoot.gain.linearRampToValueAtTime(0.15, now + 0.04);
    gRoot.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    oRoot.start(now); oRoot.stop(now + 1.0);

    const oFifth = ctx.createOscillator(), gFifth = ctx.createGain();
    oFifth.connect(gFifth); gFifth.connect(ctx.destination);
    oFifth.type = 'sine'; oFifth.frequency.value = base * 1.5;
    gFifth.gain.setValueAtTime(0, now + 0.03);
    gFifth.gain.linearRampToValueAtTime(0.08, now + 0.07);
    gFifth.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    oFifth.start(now + 0.03); oFifth.stop(now + 0.78);

    const oOct = ctx.createOscillator(), gOct = ctx.createGain();
    oOct.connect(gOct); gOct.connect(ctx.destination);
    oOct.type = 'sine'; oOct.frequency.value = base * 2.0;
    gOct.gain.setValueAtTime(0, now + 0.06);
    gOct.gain.linearRampToValueAtTime(0.05, now + 0.10);
    gOct.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    oOct.start(now + 0.06); oOct.stop(now + 0.58);

    const oShim = ctx.createOscillator(), gShim = ctx.createGain();
    oShim.connect(gShim); gShim.connect(ctx.destination);
    oShim.type = 'sine'; oShim.frequency.value = base * 3.0;
    gShim.gain.setValueAtTime(0, now + 0.10);
    gShim.gain.linearRampToValueAtTime(0.022, now + 0.13);
    gShim.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    oShim.start(now + 0.10); oShim.stop(now + 0.40);
}

// ── Ocean sample engine (water-drip.mp3) ─────────────────────────────────────
let _oceanBuf         = null;
let _oceanLoadStarted = false;

async function _oceanLoad(ctx) {
    if (_oceanLoadStarted) return;
    _oceanLoadStarted = true;
    try {
        const res = await fetch('water-drip.mp3');
        const ab  = await res.arrayBuffer();
        _oceanBuf = await new Promise((resolve, reject) => ctx.decodeAudioData(ab, resolve, reject));
    } catch(e) {}
}

function _clearSoundOcean(ctx) {
    const now = ctx.currentTime;
    const p   = _streakPitch();
    if (!_oceanLoadStarted) _oceanLoad(ctx);

    if (_oceanBuf) {
        // Slow down slightly for a calm ambient feel
        const rate   = p * 0.80;
        const outDur = Math.min(0.90, (_oceanBuf.duration / rate) * 0.85);

        const src = ctx.createBufferSource();
        src.buffer = _oceanBuf;
        src.playbackRate.value = rate;

        const g = ctx.createGain();
        src.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.28, now + 0.06);
        g.gain.setValueAtTime(0.28, now + outDur - 0.18);
        g.gain.linearRampToValueAtTime(0, now + outDur);
        src.start(now, 0);
        src.stop(now + outDur);

        // Echo — drip resonating in a still space
        const echoDelay = ctx.createDelay(0.8);
        echoDelay.delayTime.value = 0.38;
        const echoGain = ctx.createGain();
        echoGain.gain.value = 0.22;
        g.connect(echoDelay);
        echoDelay.connect(echoGain);
        echoGain.connect(ctx.destination);

    } else {
        // Fallback synth drip until buffer loads
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(820 * p, now);
        o.frequency.exponentialRampToValueAtTime(310 * p, now + 0.20);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.22, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        o.start(now); o.stop(now + 0.34);
    }
}

// ── Forest sample engine (forest-crow.wav) ────────────────────────────────────
let _forestBuf         = null;
let _forestLoadStarted = false;
let _forestPeaks       = [];
let _forestLastIdx     = -1;

function _forestFindPeaks(audioBuffer) {
    const ch      = audioBuffer.getChannelData(0);
    const sr      = audioBuffer.sampleRate;
    const win     = Math.floor(0.55 * sr);
    const step    = Math.floor(0.05 * sr);
    const numSegs = 6;
    const segLen  = Math.floor((ch.length - win) / numSegs);

    let totalSq = 0;
    for (let i = 0; i < ch.length; i++) totalSq += ch[i] * ch[i];
    const minRms = Math.sqrt(totalSq / ch.length) * 0.40;

    const peaks = [];
    for (let seg = 0; seg < numSegs; seg++) {
        const segStart = seg * segLen;
        const segEnd   = Math.min(segStart + segLen, ch.length - win);
        let bestT = (segStart + segLen / 2) / sr, bestScore = -1;
        for (let i = segStart; i < segEnd; i += step) {
            let sq = 0;
            for (let j = i; j < i + win; j++) sq += ch[j] * ch[j];
            const rms = Math.sqrt(sq / win);
            if (rms < minRms) continue;
            if (rms > bestScore) { bestScore = rms; bestT = i / sr; }
        }
        peaks.push(bestT);
    }
    return peaks;
}

async function _forestLoad(ctx) {
    if (_forestLoadStarted) return;
    _forestLoadStarted = true;
    try {
        const res = await fetch('forest-crow.wav');
        const ab  = await res.arrayBuffer();
        const decoded = await new Promise((resolve, reject) => ctx.decodeAudioData(ab, resolve, reject));
        _forestBuf   = decoded;
        _forestPeaks = _forestFindPeaks(decoded);
    } catch(e) {}
}

function _clearSoundForest(ctx) {
    const now = ctx.currentTime;
    const p   = _streakPitch();
    if (!_forestLoadStarted) _forestLoad(ctx);

    if (_forestBuf && _forestPeaks.length > 0) {
        let peakIdx;
        do { peakIdx = Math.floor(Math.random() * _forestPeaks.length); } while (peakIdx === _forestLastIdx && _forestPeaks.length > 1);
        _forestLastIdx = peakIdx;
        const startAt = _forestPeaks[peakIdx];
        // 0.65s of source consumed; output duration = 0.65/p
        const outDur  = Math.min(0.70, 0.65 / p);

        const src = ctx.createBufferSource();
        src.buffer = _forestBuf;
        src.playbackRate.value = p;
        const g = ctx.createGain();
        src.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.30, now + 0.04);
        g.gain.setValueAtTime(0.30, now + outDur - 0.14);
        g.gain.linearRampToValueAtTime(0, now + outDur);
        src.start(now, startAt);
        src.stop(now + outDur);
        // Forest echo — crow call bouncing through the trees
        const echoDelay = ctx.createDelay(0.8);
        echoDelay.delayTime.value = 0.34;
        const echoGain = ctx.createGain();
        echoGain.gain.value = 0.28;
        g.connect(echoDelay);
        echoDelay.connect(echoGain);
        echoGain.connect(ctx.destination);
    } else {
        // Fallback synth until buffer loads
        [587, 698, 880, 1047].forEach((freq, i) => {
            const t = now + i * 0.09;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'triangle'; o.frequency.value = freq * p;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.18, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
            o.start(t); o.stop(t + 0.44);
        });
        const oBird = ctx.createOscillator(), gBird = ctx.createGain();
        oBird.connect(gBird); gBird.connect(ctx.destination);
        oBird.type = 'sine';
        oBird.frequency.setValueAtTime(1600 * p, now);
        oBird.frequency.exponentialRampToValueAtTime(2200 * p, now + 0.08);
        gBird.gain.setValueAtTime(0, now);
        gBird.gain.linearRampToValueAtTime(0.10, now + 0.01);
        gBird.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        oBird.start(now); oBird.stop(now + 0.24);
    }
}

// ── Candy sample engine (candy-mmm.wav) ──────────────────────────────────────
let _candyBuf         = null;
let _candyLoadStarted = false;
let _candyPeaks       = [];
let _candyLastIdx     = -1;

function _candyFindPeaks(audioBuffer) {
    const ch      = audioBuffer.getChannelData(0);
    const sr      = audioBuffer.sampleRate;
    const win     = Math.floor(0.55 * sr);
    const step    = Math.floor(0.05 * sr);
    const numSegs = 6;
    const segLen  = Math.floor((ch.length - win) / numSegs);
    let totalSq = 0;
    for (let i = 0; i < ch.length; i++) totalSq += ch[i] * ch[i];
    const minRms = Math.sqrt(totalSq / ch.length) * 0.40;
    const peaks = [];
    for (let seg = 0; seg < numSegs; seg++) {
        const segStart = seg * segLen;
        const segEnd   = Math.min(segStart + segLen, ch.length - win);
        let bestT = (segStart + segLen / 2) / sr, bestScore = -1;
        for (let i = segStart; i < segEnd; i += step) {
            let sq = 0;
            for (let j = i; j < i + win; j++) sq += ch[j] * ch[j];
            const rms = Math.sqrt(sq / win);
            if (rms < minRms) continue;
            if (rms > bestScore) { bestScore = rms; bestT = i / sr; }
        }
        peaks.push(bestT);
    }
    return peaks;
}

async function _candyLoad(ctx) {
    if (_candyLoadStarted) return;
    _candyLoadStarted = true;
    try {
        const res = await fetch('candy-mmm.wav');
        const ab  = await res.arrayBuffer();
        const decoded = await new Promise((resolve, reject) => ctx.decodeAudioData(ab, resolve, reject));
        _candyBuf   = decoded;
        _candyPeaks = _candyFindPeaks(decoded);
    } catch(e) {}
}

function _clearSoundCandy(ctx) {
    const now = ctx.currentTime;
    const p   = _streakPitch();
    if (!_candyLoadStarted) _candyLoad(ctx);

    if (_candyBuf && _candyPeaks.length > 0) {
        let peakIdx;
        do { peakIdx = Math.floor(Math.random() * _candyPeaks.length); } while (peakIdx === _candyLastIdx && _candyPeaks.length > 1);
        _candyLastIdx = peakIdx;
        const startAt = _candyPeaks[peakIdx];
        const outDur  = Math.min(0.72, 0.68 / p);

        // Pitch scales with streak; compressor evens out mmm.wav's inconsistent recording levels
        const vol = 0.30 / Math.sqrt(p);
        const src = ctx.createBufferSource();
        src.buffer = _candyBuf;
        src.playbackRate.value = p;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -24; comp.knee.value = 6;
        comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.25;
        const g = ctx.createGain();
        src.connect(comp); comp.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.04);
        g.gain.setValueAtTime(vol, now + outDur - 0.16);
        g.gain.linearRampToValueAtTime(0, now + outDur);
        src.start(now, startAt);
        src.stop(now + outDur);
    } else {
        // Fallback synth until buffer loads
        const oBoing = ctx.createOscillator(), gBoing = ctx.createGain();
        oBoing.connect(gBoing); gBoing.connect(ctx.destination);
        oBoing.type = 'sine';
        oBoing.frequency.setValueAtTime(350 * p, now);
        oBoing.frequency.exponentialRampToValueAtTime(620 * p, now + 0.20);
        gBoing.gain.setValueAtTime(0, now);
        gBoing.gain.linearRampToValueAtTime(0.20, now + 0.02);
        gBoing.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        oBoing.start(now); oBoing.stop(now + 0.40);

        [0, 0.06, 0.12, 0.18].forEach((delay, i) => {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = 'sine';
            o.frequency.value = [1800, 2300, 2900, 3500][i] * p;
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(0.08, now + delay + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);
            o.start(now + delay); o.stop(now + delay + 0.24);
        });
    }
}

function _clearSoundTetris(ctx) {
    const now = ctx.currentTime;
    const p = _streakPitch();

    // NES-style square wave ascending arpeggio
    [494, 622, 784, 988].forEach((freq, i) => {
        const t = now + i * 0.10;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square'; o.frequency.value = freq * p;
        g.gain.setValueAtTime(0.10, t);
        g.gain.setValueAtTime(0.10, t + 0.065);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        o.start(t); o.stop(t + 0.18);
    });

    // Sub thump at the end for emphasis
    const oSub = ctx.createOscillator(), gSub = ctx.createGain();
    oSub.connect(gSub); gSub.connect(ctx.destination);
    oSub.type = 'sine'; oSub.frequency.value = 80 * p;
    gSub.gain.setValueAtTime(0.21, now + 0.32);
    gSub.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    oSub.start(now + 0.32); oSub.stop(now + 0.60);
}

function _scratch(ctx, when, dur, hpFreq, vol) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = hpFreq;
    const g = ctx.createGain();
    src.connect(hpf); hpf.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.start(when); src.stop(when + dur + 0.01);
}

function _vocalLine(ctx, when, freqStart, freqMid, freqEnd, dur, vol) {
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 5.8; lg.gain.value = 3; // ±3 Hz vibrato, never scaled
    lfo.connect(lg);
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    lg.connect(osc.frequency);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, when);
    osc.frequency.linearRampToValueAtTime(freqMid, when + dur * 0.45);
    osc.frequency.linearRampToValueAtTime(freqEnd, when + dur * 0.85);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    lfo.start(when); lfo.stop(when + dur + 0.02);
    osc.start(when); osc.stop(when + dur + 0.02);
}

// ── K-Pop sample engine ────────────────────────────────────────────────────
let _kpopBuf          = null;
let _kpopLoadStarted  = false;
let _kpopVocalPeaks   = [];  // lighter / vocal-heavy sections → single clears
let _kpopBeatPeaks    = [];  // thumping beat-heavy sections → streak clears
let _kpopLastVocalIdx = -1;
let _kpopLastBeatIdx  = -1;

function _kpopFindPeaks(audioBuffer) {
    const ch      = audioBuffer.getChannelData(0);
    const sr      = audioBuffer.sampleRate;
    const win     = Math.floor(0.45 * sr);
    const step    = Math.floor(0.06 * sr);
    const numSegs = 10;
    const segLen  = Math.floor((ch.length - win) / numSegs);

    let totalSq = 0;
    for (let i = 0; i < ch.length; i++) totalSq += ch[i] * ch[i];
    const minRms = Math.sqrt(totalSq / ch.length) * 0.55;

    const segments = [];
    for (let seg = 0; seg < numSegs; seg++) {
        const segStart = seg * segLen;
        const segEnd   = Math.min(segStart + segLen, ch.length - win);
        let bestT = (segStart + segLen / 2) / sr, bestScore = -1, bestRatio = 0;

        for (let i = segStart; i < segEnd; i += step) {
            let rawSq = 0;
            for (let j = i; j < i + win; j++) rawSq += ch[j] * ch[j];
            const rawRms = Math.sqrt(rawSq / win);
            if (rawRms < minRms) continue;

            // First-difference ratio: high = vocal/snare content, low = bass/kick dominant
            let diffSq = 0;
            for (let j = i + 1; j < i + win; j++) {
                const d = ch[j] - ch[j - 1]; diffSq += d * d;
            }
            const ratio = Math.sqrt(diffSq / win) / (rawRms + 0.001);
            const ratioScore = ratio > 0.05 ? Math.min(ratio / 0.20, 1.5) : ratio / 0.05;
            const score = rawRms * ratioScore;

            if (score > bestScore) { bestScore = score; bestT = i / sr; bestRatio = ratio; }
        }
        segments.push({ t: bestT, ratio: bestRatio });
    }

    // Top 5 by ratio = vocal-light sections; bottom 5 = beat-heavy sections
    segments.sort((a, b) => b.ratio - a.ratio);
    return {
        vocalPeaks: segments.slice(0, 5).map(s => s.t),
        beatPeaks:  segments.slice(5).map(s => s.t),
    };
}

async function _kpopLoad(ctx) {
    if (_kpopLoadStarted) return;
    _kpopLoadStarted = true;
    try {
        const res = await fetch('domino-kpop.mp3');
        const ab  = await res.arrayBuffer();
        const decoded = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));
        _kpopBuf = decoded;
        const { vocalPeaks, beatPeaks } = _kpopFindPeaks(decoded);
        _kpopVocalPeaks = vocalPeaks;
        _kpopBeatPeaks  = beatPeaks;
    } catch (e) {}
}

// ── K-Pop hype sample engine (kpop-hype.webm) ────────────────────────────────
let _kpopHypeBuf          = null;
let _kpopHypeLoadStarted  = false;
let _kpopHypeSrc          = null;
let _kpopHypeMainGain     = null;

async function _kpopHypeLoad(ctx) {
    if (_kpopHypeLoadStarted) return;
    _kpopHypeLoadStarted = true;
    try {
        const res = await fetch('kpop-hype.webm');
        const ab  = await res.arrayBuffer();
        _kpopHypeBuf = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));
        // Hype mode may have already activated while we were loading — start now if so
        if (typeof kpopHypeActive !== 'undefined' && kpopHypeActive && Date.now() <= kpopHypeEndTime) {
            startKpopHypeBackground();
        }
    } catch (e) {}
}

// Plays 2:02–2:40 (38 s) in the background with reverb
function startKpopHypeBackground() {
    try {
        if (!_audioCtx) return;
        if (!_kpopHypeBuf) {
            // Still loading — _kpopHypeLoad will call us once the buffer is ready
            if (!_kpopHypeLoadStarted) _kpopHypeLoad(_audioCtx);
            return;
        }
        stopKpopHypeBackground();
        const ctx = _audioCtx, now = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = _kpopHypeBuf;

        const g = ctx.createGain();
        src.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.36, now + 2.0);   // fade in
        g.gain.setValueAtTime(0.36, now + 33);
        g.gain.linearRampToValueAtTime(0, now + 38);        // fade out near end

        // Reverb taps — washes the track into a background ambience
        [0.06, 0.14, 0.28, 0.46].forEach((dt, i) => {
            const d = ctx.createDelay(1.0), dg = ctx.createGain();
            d.delayTime.value = dt; dg.gain.value = 0.06 / (i + 1);
            g.connect(d); d.connect(dg); dg.connect(ctx.destination);
        });

        src.start(now, 122, 38);   // offset 2:02, duration 38 s
        _kpopHypeSrc      = src;
        _kpopHypeMainGain = g;
    } catch(e) {}
}

function stopKpopHypeBackground() {
    try {
        if (!_kpopHypeSrc) return;
        const ctx = _audioCtx, now = ctx.currentTime;
        if (_kpopHypeMainGain) {
            _kpopHypeMainGain.gain.cancelScheduledValues(now);
            _kpopHypeMainGain.gain.setValueAtTime(_kpopHypeMainGain.gain.value, now);
            _kpopHypeMainGain.gain.linearRampToValueAtTime(0, now + 1.5);
        }
        _kpopHypeSrc.stop(now + 1.6);
        _kpopHypeSrc = null; _kpopHypeMainGain = null;
    } catch(e) {}
}

function _clearSoundKpop(ctx) {
    const now = ctx.currentTime;
    const p   = _streakPitch();
    const streakLevel = Math.min((typeof streak !== 'undefined' ? streak : 0), 5);

    if (!_kpopLoadStarted) _kpopLoad(ctx);

    // During hype: background song plays, clear sounds are muted
    if (typeof kpopHypeActive !== 'undefined' && kpopHypeActive && Date.now() <= kpopHypeEndTime) return;

    const buf        = _kpopBuf;
    const vocalPool  = _kpopVocalPeaks;
    const beatPool   = _kpopBeatPeaks;

    if (buf && (vocalPool.length > 0 || beatPool.length > 0)) {
        const useBeats = streakLevel >= 2;
        const pool     = useBeats ? beatPool : vocalPool;

        let peakIdx;
        const lastIdx = useBeats ? _kpopLastBeatIdx : _kpopLastVocalIdx;
        do { peakIdx = Math.floor(Math.random() * pool.length); } while (peakIdx === lastIdx && pool.length > 1);
        if (useBeats) _kpopLastBeatIdx = peakIdx; else _kpopLastVocalIdx = peakIdx;

        const startAt = pool[peakIdx];
        const clipDur = useBeats ? 0.90 : 0.80;

        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        src.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.32, now + 0.06);
        g.gain.setValueAtTime(0.32, now + clipDur - 0.16);
        g.gain.linearRampToValueAtTime(0, now + clipDur);
        src.start(now, startAt, clipDur);

        // Beat clears always layer a vocal snippet; single clears get 35% chance
        const adLibChance = useBeats ? 1.0 : 0.35;
        if (Math.random() < adLibChance && vocalPool.length > 0) {
            let altIdx;
            do { altIdx = Math.floor(Math.random() * vocalPool.length); } while (altIdx === peakIdx && vocalPool.length > 1);
            const altDur = 0.22;
            const src2 = ctx.createBufferSource();
            src2.buffer = buf;
            const g2 = ctx.createGain();
            src2.connect(g2); g2.connect(ctx.destination);
            g2.gain.setValueAtTime(0, now + clipDur - 0.03);
            g2.gain.linearRampToValueAtTime(0.22, now + clipDur + 0.04);
            g2.gain.linearRampToValueAtTime(0, now + clipDur + altDur);
            src2.start(now + clipDur - 0.03, vocalPool[altIdx], altDur + 0.06);
        }

    } else {
        // Fallback synthetic vocals until buffer loads
        const vp = 1 + (p - 1) * 0.38;
        _vocalLine(ctx, now + 0.05, 440 * vp, 502 * vp, 473 * vp, 0.28, 0.24);
        if (Math.random() < 0.5) {
            _vocalLine(ctx, now + 0.36, 520 * vp, 582 * vp, 546 * vp, 0.24, 0.21);
        }
    }
}

function playClearSound() {
    try {
        const ctx = _ensureAudioCtx();
        if (!_oceanLoaded) {
            // Kick off all sample loads immediately so first clear of each skin uses real audio
            _oceanLoad(ctx);
            _kpopLoad(ctx);
            _kpopHypeLoad(ctx);
            _forestLoad(ctx);
            _candyLoad(ctx);
            _oceanLoaded = true;
        }
        const skin = typeof currentSkin !== 'undefined' ? currentSkin : 'classic';
        switch (skin) {
            case 'ocean':  _clearSoundOcean(ctx);  break;
            case 'forest': _clearSoundForest(ctx); break;
            case 'candy':  _clearSoundCandy(ctx);  break;
            case 'tetris': _clearSoundTetris(ctx); break;
            case 'kpop':   _clearSoundKpop(ctx);   break;
            default:       _clearSoundClassic(ctx); break;
        }
    } catch (e) {}
}

function resetDialogueFlags() {}

function showCharacterDialogue(trigger, onComplete, opts) {
    if (dialogueActive) {
        if (onComplete) onComplete();
        return;
    }

    const character = getAdminCharacter();
    if (!character) {
        if (onComplete) onComplete();
        return;
    }

    const lines = character.dialogues[trigger];
    if (!lines || !lines.length) {
        if (onComplete) onComplete();
        return;
    }

    dialogueActive = true;
    if (typeof notifyBearDialogue === 'function') notifyBearDialogue();
    if (typeof show3DCharacter === 'function') show3DCharacter();
    const text  = lines[Math.floor(Math.random() * lines.length)];

    // Clear the panel and show it
    updateDialogueText('', '', character.nameColor);

    let gone = false;
    const dismiss = () => {
        if (gone) return;
        gone = true;
        clearTimeout(autoTimer);
        clearInterval(typeTimer);
        hide3DDialogueBanner();
        if (typeof hide3DCharacter === 'function') hide3DCharacter();
        dialogueActive = false;
        if (onComplete) onComplete();
    };

    show3DDialogueBanner(dismiss);

    // Typewriter: each tick advances text + banner reveal together (rolling effect)
    const typeMs = Math.max(22, Math.floor(680 / Math.max(text.length, 1)));
    let charIdx = 0;
    const typeTimer = setInterval(() => {
        charIdx++;
        updateDialogueText(text.slice(0, charIdx), '', character.nameColor);
        if (typeof updateBannerReveal === 'function') {
            updateBannerReveal((charIdx / text.length) * 100);
        }
        if (charIdx >= text.length) clearInterval(typeTimer);
        const ch = text[charIdx - 1];
        if (ch && ch !== ' ') _sansBlip();
    }, typeMs);

    // Auto-dismiss after 6 s; clicking 3-D canvas skips early (handled in character3d)
    const autoTimer = setTimeout(dismiss, 6000);
}
