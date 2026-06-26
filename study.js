// study.js — Anki-style Russian flashcard system

const _SRS_KEY       = 'blockPuzzle_russian_srs';
const _STREAK_KEY    = 'blockPuzzle_russian_streak';
const _DAILY_NEW_KEY = 'blockPuzzle_russian_daily_new';
const _NEW_PER_DAY   = 20;

const _INTERVALS = [
    1  * 24 * 3600000,
    3  * 24 * 3600000,
    7  * 24 * 3600000,
    14 * 24 * 3600000,
    30 * 24 * 3600000,
];

// ── SRS ──────────────────────────────────────────────────────────────────────
function _getSRS() {
    try { return JSON.parse(localStorage.getItem(_SRS_KEY) || '{}'); }
    catch(e) { return {}; }
}
function _saveSRS(d) { localStorage.setItem(_SRS_KEY, JSON.stringify(d)); }

function _markAnswer(idx, knew) {
    const data = _getSRS();
    const e = data[idx] || { level: 0 };
    e.level = knew ? Math.min(e.level + 1, _INTERVALS.length) : 0;
    e.due   = Date.now() + (_INTERVALS[e.level - 1] || 0);
    data[idx] = e;
    _saveSRS(data);
}

// Pick (and cache) today's batch of new word indices, in list order.
function _getDailyNew() {
    const today = new Date().toISOString().slice(0, 10);
    try {
        const d = JSON.parse(localStorage.getItem(_DAILY_NEW_KEY) || 'null');
        if (d && d.date === today) return d.indices;
    } catch(e) {}
    const data = _getSRS();
    const fresh = [];
    RUSSIAN_WORDS.forEach((_, i) => {
        const e = data[i];
        if (!e || e.level === 0) fresh.push(i);
    });
    const batch = fresh.slice(0, _NEW_PER_DAY);
    localStorage.setItem(_DAILY_NEW_KEY, JSON.stringify({ date: today, indices: batch }));
    return batch;
}

function _buildSession() {
    const data = _getSRS();
    const now  = Date.now();
    const due  = [];
    RUSSIAN_WORDS.forEach((_, i) => {
        const e = data[i];
        if (e && e.level > 0 && e.due <= now) due.push(i);
    });
    // due cards in stable index order, then today's new words (still at level 0)
    const todayNew = _getDailyNew().filter(i => { const e = data[i]; return !e || e.level === 0; });
    return [...due, ...todayNew];
}

// Returns { due, new: newCount, total } for menu badge
function getStudyDueCount() {
    const data  = _getSRS();
    const now   = Date.now();
    let due = 0, newCount = 0;
    RUSSIAN_WORDS.forEach((_, i) => {
        const e = data[i];
        if (!e || e.level === 0) newCount++;
        else if (e.due <= now)   due++;
    });
    return { due, new: Math.min(newCount, _NEW_PER_DAY), total: due + Math.min(newCount, _NEW_PER_DAY) };
}

// ── Streak ────────────────────────────────────────────────────────────────────
function _getStreak() {
    try { return JSON.parse(localStorage.getItem(_STREAK_KEY) || '{"count":0,"lastDate":null}'); }
    catch(e) { return { count: 0, lastDate: null }; }
}

function _updateStreak() {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const s = _getStreak();
    if (s.lastDate === today) return s;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.count = (s.lastDate === yesterday) ? s.count + 1 : 1;
    s.lastDate = today;
    localStorage.setItem(_STREAK_KEY, JSON.stringify(s));
    return s;
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function _speakRussian(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
}

// ── Reverse mode toggle ───────────────────────────────────────────────────────
const _REVERSE_KEY = 'blockPuzzle_russian_reverse';
function _getReverseMode() { return localStorage.getItem(_REVERSE_KEY) === '1'; }
function _setReverseMode(v) { localStorage.setItem(_REVERSE_KEY, v ? '1' : '0'); }

// ── Main overlay ──────────────────────────────────────────────────────────────
function openStudyOverlay(scene) {
    if (scene && scene.input) scene.input.enabled = false;

    const session = _buildSession();
    let idx = 0, sessionCorrect = 0, sessionTotal = 0;
    let reverseMode = _getReverseMode();

    const el = document.createElement('div');
    el.style.cssText =
        'position:fixed;inset:0;z-index:200;background:#18110a;' +
        'display:flex;flex-direction:column;align-items:center;' +
        'font-family:"Courier New",Courier,monospace;pointer-events:auto;' +
        'box-sizing:border-box;';
    document.body.appendChild(el);

    function close() {
        el.remove();
        if (scene && scene.input) scene.input.enabled = true;
        if (typeof showMenuBear === 'function') showMenuBear();
    }

    function renderEmpty() {
        el.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;';
        const streak = _getStreak();
        const streakHtml = streak.count > 1
            ? '<div style="color:#8a6040;font-size:13px;margin-bottom:32px;">' + streak.count + ' day streak</div>'
            : '';
        wrap.innerHTML =
            '<div style="color:#5a4535;font-size:13px;letter-spacing:.14em;margin-bottom:18px;">all caught up.</div>' +
            '<div style="color:#3d2b1f;font-size:14px;margin-bottom:36px;">come back tomorrow.</div>' +
            streakHtml;
        const btn = document.createElement('button');
        btn.textContent = 'back to menu';
        btn.style.cssText = 'background:none;border:1px solid #5c4632;color:#8a6040;font-family:inherit;font-size:15px;padding:12px 36px;cursor:pointer;letter-spacing:.1em;';
        btn.onclick = close;
        wrap.appendChild(btn);
        el.appendChild(wrap);
    }

    function renderSummary() {
        const streak = _updateStreak();
        const data     = _getSRS();
        const seen     = Object.keys(data).length;
        const mastered = Object.values(data).filter(e => e.level >= 5).length;
        el.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;';
        const streakHtml = streak.count > 1
            ? '<div style="color:#8a6040;font-size:13px;margin-bottom:28px;">' + streak.count + ' day streak</div>'
            : '';
        wrap.innerHTML =
            '<div style="color:#3d2b1f;font-size:11px;letter-spacing:.16em;margin-bottom:32px;">SESSION COMPLETE</div>' +
            '<div style="color:#e8d9c0;font-size:56px;font-weight:bold;line-height:1;">' + sessionCorrect + '</div>' +
            '<div style="color:#5a4535;font-size:14px;margin-bottom:36px;">of ' + sessionTotal + ' correct</div>' +
            streakHtml +
            '<div style="color:#6b4820;font-size:13px;margin-bottom:6px;">' + seen + ' / ' + RUSSIAN_WORDS.length + ' words seen</div>' +
            '<div style="color:#5a4535;font-size:13px;margin-bottom:52px;">' + mastered + ' mastered</div>';
        const btn = document.createElement('button');
        btn.textContent = 'back to menu';
        btn.style.cssText = 'background:none;border:1px solid #5c4632;color:#8a6040;font-family:inherit;font-size:15px;padding:12px 36px;cursor:pointer;letter-spacing:.1em;';
        btn.onclick = close;
        wrap.appendChild(btn);
        el.appendChild(wrap);
    }

    function renderCard() {
        if (idx >= session.length) { renderSummary(); return; }

        const wordIdx = session[idx];
        const entry   = RUSSIAN_WORDS[wordIdx];
        const ru    = entry[0];
        const en    = entry[1];
        const tag   = entry[2] || '';
        const ex_ru = entry[3] || '';
        const ex_en = entry[4] || '';

        const pct = Math.round((idx / session.length) * 100);

        // In reverse mode: show English on face, reveal Russian
        const face    = reverseMode ? en   : ru;
        const answer  = reverseMode ? ru   : en;
        const faceSize = reverseMode ? '28px' : '52px';

        const tagHtml = tag
            ? '<span style="display:inline-block;background:#1a1208;color:#5a4535;font-size:11px;' +
              'padding:2px 8px;border-radius:2px;letter-spacing:.1em;margin-bottom:18px;">' + tag + '</span>'
            : '';

        el.innerHTML =
            // header
            '<div style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:16px 22px;box-sizing:border-box;gap:8px;">' +
                '<div style="color:#3d2b1f;font-size:12px;white-space:nowrap;">' + (idx + 1) + ' / ' + session.length + '</div>' +
                '<button id="s-rev" style="background:none;border:1px solid ' + (reverseMode ? '#5c4632' : '#2a1f14') + ';' +
                    'color:' + (reverseMode ? '#8a6040' : '#3d2b1f') + ';font-family:inherit;font-size:11px;' +
                    'padding:4px 10px;cursor:pointer;letter-spacing:.08em;white-space:nowrap;">' +
                    (reverseMode ? 'EN→RU ✓' : 'EN→RU') +
                '</button>' +
                '<button id="s-close" style="background:none;border:none;color:#3d2b1f;font-size:20px;cursor:pointer;padding:4px 8px;font-family:inherit;">✕</button>' +
            '</div>' +
            // progress
            '<div style="width:100%;height:2px;background:#1a1208;">' +
                '<div style="height:100%;background:#5c4632;width:' + pct + '%;"></div>' +
            '</div>' +
            // card
            '<div id="s-card" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
                'padding:40px 24px;cursor:pointer;width:100%;box-sizing:border-box;text-align:center;">' +
                tagHtml +
                '<div id="s-face" style="color:#e8d9c0;font-size:' + faceSize + ';font-weight:bold;text-align:center;margin-bottom:24px;line-height:1.2;">' + face + '</div>' +
                '<button id="s-audio" style="background:none;border:none;color:#3d2b1f;font-size:22px;cursor:pointer;margin-bottom:28px;padding:6px 12px;line-height:1;" title="pronounce">🔊</button>' +
                '<div id="s-reveal" style="color:#2a1f14;font-size:14px;letter-spacing:.1em;">tap to reveal</div>' +
            '</div>' +
            // buttons
            '<div id="s-btns" style="display:flex;gap:20px;padding:28px 24px;opacity:0;pointer-events:none;transition:opacity 0.2s;justify-content:center;width:100%;box-sizing:border-box;">' +
                '<button id="s-again" style="background:none;border:1px solid #5c2020;color:#8a3030;font-family:inherit;font-size:16px;padding:14px 0;cursor:pointer;letter-spacing:.06em;width:140px;">again</button>' +
                '<button id="s-got"   style="background:none;border:1px solid #2a4a2a;color:#3a7a3a;font-family:inherit;font-size:16px;padding:14px 0;cursor:pointer;letter-spacing:.06em;width:140px;">got it ✓</button>' +
            '</div>';

        el.querySelector('#s-close').onclick = close;

        // Reverse mode toggle
        el.querySelector('#s-rev').onclick = (e) => {
            e.stopPropagation();
            reverseMode = !reverseMode;
            _setReverseMode(reverseMode);
            renderCard();
        };

        // Audio: speak the Russian word always
        el.querySelector('#s-audio').onclick = (e) => {
            e.stopPropagation();
            _speakRussian(ru);
        };

        let revealed = false;
        el.querySelector('#s-card').onclick = () => {
            if (revealed) return;
            revealed = true;

            const rv = el.querySelector('#s-reveal');
            rv.innerHTML =
                '<div style="color:#c8b89a;font-size:22px;text-align:center;max-width:380px;line-height:1.5;margin-bottom:20px;">' + answer + '</div>' +
                (ex_ru
                    ? '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;max-width:340px;justify-content:center;">' +
                        '<span style="color:#7a5a38;font-size:13px;line-height:1.6;font-style:italic;text-align:center;">' + ex_ru + '</span>' +
                        '<button id="s-ex-audio" style="background:none;border:none;color:#5a4535;font-size:18px;cursor:pointer;padding:2px 4px;line-height:1;flex-shrink:0;" title="pronounce sentence">🔊</button>' +
                      '</div>' +
                      '<div style="color:#4a3520;font-size:12px;text-align:center;max-width:340px;line-height:1.6;">' + ex_en + '</div>'
                    : '');
            rv.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
            const exAudioBtn = el.querySelector('#s-ex-audio');
            if (exAudioBtn) exAudioBtn.onclick = (e) => { e.stopPropagation(); _speakRussian(ex_ru); };

            const btns = el.querySelector('#s-btns');
            btns.style.opacity = '1';
            btns.style.pointerEvents = 'auto';
        };

        el.querySelector('#s-again').onclick = () => {
            sessionTotal++;
            _markAnswer(wordIdx, false);
            idx++;
            renderCard();
        };
        el.querySelector('#s-got').onclick = () => {
            sessionTotal++;
            sessionCorrect++;
            _markAnswer(wordIdx, true);
            idx++;
            renderCard();
        };
    }

    if (session.length === 0) { renderEmpty(); return; }
    renderCard();
}
