// study.js — Anki-style Russian flashcard system

const _SRS_KEY = 'blockPuzzle_russian_srs';
const _NEW_PER_SESSION = 20;

// Intervals per level (milliseconds)
const _INTERVALS = [
    1  * 24 * 3600000,   // level 1 → 1 day
    3  * 24 * 3600000,   // level 2 → 3 days
    7  * 24 * 3600000,   // level 3 → 7 days
    14 * 24 * 3600000,   // level 4 → 14 days
    30 * 24 * 3600000,   // level 5 → 30 days (mastered)
];

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

function _buildSession() {
    const data  = _getSRS();
    const now   = Date.now();
    const due   = [];
    const fresh = [];

    RUSSIAN_WORDS.forEach((_, i) => {
        const e = data[i];
        if (!e || e.level === 0) { fresh.push(i); }
        else if (e.due <= now)   { due.push(i); }
    });

    const shuffleDue   = due.sort(() => Math.random() - 0.5);
    const shuffleFresh = fresh.sort(() => Math.random() - 0.5).slice(0, _NEW_PER_SESSION);
    return [...shuffleDue, ...shuffleFresh];
}

function openStudyOverlay(scene) {
    if (scene && scene.input) scene.input.enabled = false;

    const session = _buildSession();
    let idx = 0, sessionCorrect = 0, sessionTotal = 0;

    const el = document.createElement('div');
    el.style.cssText =
        'position:fixed;inset:0;z-index:200;background:#080604;' +
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
        wrap.innerHTML =
            '<div style="color:#5a4535;font-size:13px;letter-spacing:.14em;margin-bottom:18px;">all caught up.</div>' +
            '<div style="color:#3d2b1f;font-size:14px;margin-bottom:48px;">come back tomorrow.</div>';
        const btn = document.createElement('button');
        btn.textContent = 'back to menu';
        btn.style.cssText = 'background:none;border:1px solid #5c4632;color:#8a6040;font-family:inherit;font-size:15px;padding:12px 36px;cursor:pointer;letter-spacing:.1em;';
        btn.onclick = close;
        wrap.appendChild(btn);
        el.appendChild(wrap);
    }

    function renderSummary() {
        const data     = _getSRS();
        const seen     = Object.keys(data).length;
        const mastered = Object.values(data).filter(e => e.level >= 5).length;
        el.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;';
        wrap.innerHTML =
            '<div style="color:#3d2b1f;font-size:11px;letter-spacing:.16em;margin-bottom:32px;">SESSION COMPLETE</div>' +
            '<div style="color:#e8d9c0;font-size:56px;font-weight:bold;line-height:1;">' + sessionCorrect + '</div>' +
            '<div style="color:#5a4535;font-size:14px;margin-bottom:36px;">of ' + sessionTotal + ' correct</div>' +
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
        const [ru, en] = RUSSIAN_WORDS[wordIdx];
        const pct = Math.round((idx / session.length) * 100);

        el.innerHTML =
            // header
            '<div style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:18px 22px;box-sizing:border-box;">' +
                '<div style="color:#3d2b1f;font-size:13px;">' + (idx + 1) + ' / ' + session.length + '</div>' +
                '<button id="s-close" style="background:none;border:none;color:#3d2b1f;font-size:20px;cursor:pointer;padding:4px 8px;font-family:inherit;">✕</button>' +
            '</div>' +
            // progress bar
            '<div style="width:100%;height:2px;background:#1a1208;">' +
                '<div style="height:100%;background:#5c4632;width:' + pct + '%;"></div>' +
            '</div>' +
            // card tap area
            '<div id="s-card" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
                'padding:40px 24px;cursor:pointer;width:100%;box-sizing:border-box;">' +
                '<div style="color:#e8d9c0;font-size:52px;font-weight:bold;text-align:center;margin-bottom:36px;">' + ru + '</div>' +
                '<div id="s-reveal" style="color:#2a1f14;font-size:14px;letter-spacing:.1em;">tap to reveal</div>' +
            '</div>' +
            // buttons (hidden until reveal)
            '<div id="s-btns" style="display:flex;gap:20px;padding:28px 24px;opacity:0;pointer-events:none;transition:opacity 0.2s;justify-content:center;width:100%;box-sizing:border-box;">' +
                '<button id="s-again" style="background:none;border:1px solid #5c2020;color:#8a3030;font-family:inherit;font-size:16px;padding:14px 0;cursor:pointer;letter-spacing:.06em;width:140px;">again</button>' +
                '<button id="s-got"   style="background:none;border:1px solid #2a4a2a;color:#3a7a3a;font-family:inherit;font-size:16px;padding:14px 0;cursor:pointer;letter-spacing:.06em;width:140px;">got it ✓</button>' +
            '</div>';

        el.querySelector('#s-close').onclick = close;

        let revealed = false;
        el.querySelector('#s-card').onclick = () => {
            if (revealed) return;
            revealed = true;
            const rv = el.querySelector('#s-reveal');
            rv.textContent = en;
            rv.style.cssText = 'color:#c8b89a;font-size:20px;text-align:center;max-width:380px;line-height:1.6;';
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
