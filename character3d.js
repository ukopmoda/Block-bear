// character3d.js — Three.js animal character overlay

let _r     = null;
let _s     = null;
let _cam   = null;
let _grp   = null;
let _head  = null;
let _torso = null;
let _armL  = null;
let _armR  = null;
let _legL  = null;
let _legR  = null;
let _flowers = null;
let _neck  = null;
let _tail  = null;
let _mats  = [];
let _raf   = null;
let _t0    = 0;
let _gears = [];

// Bear idle events
let _honeyPot    = null;
let _honeyPhase  = 0;   // 0=waiting, 1=enter, 2=hold, 3=exit
let _honeyPhaseT = 0;
let _honeyNextT  = 6;
let _idleTiltDir = 1;
let _eventType   = 0;   // 0=stare, 1=phone, 2=starbucks
let _phoneProp   = null;
let _sbProp      = null;

let _dialogDismissCb  = null;
let _glitchCanvasEl   = null;


// CRT glitch timing
let _crtGlitchT    = 5;
let _crtGlitchEndT = 0;

let _frameCount = 0;
let _randomDialogueNextT = 55;
let _shineMat        = null;
let _dialogueTriggerT = -99;
let _lastBuiltAnimal = null;

// Menu mode state
let _menuMode        = false;
let _tablet          = null;
let _menuGlanceT     = -99;
let _menuGlanceNextT = 5;
let _menuNodT        = -99;
let _butterfly       = null;
let _bfWingL         = null;
let _bfWingR         = null;

// ── Public API ────────────────────────────────────────────────────────────────

function show3DCharacter() {
    _ensureInit();
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }

    _menuMode = false;
    if (_tablet) _tablet.visible = false;
    if (_butterfly) _butterfly.visible = false;
    _cam.fov = 44;
    _cam.aspect = 232 / 200;
    _cam.position.set(0, 4.05, 8.0);
    _cam.lookAt(0, 3.85, 0);
    _cam.updateProjectionMatrix();

    _position();

    _mats.forEach(m => { m.opacity = 0; });
    _grp.position.set(0, -5, 0);
    _grp.rotation.set(0, 0.14, 0.22);
    _grp.scale.setScalar(0.62);

    _honeyPhase = 0;
    _honeyNextT = 6;
    _randomDialogueNextT = 50 + Math.random() * 20;

    _r.domElement.style.display = 'block';
    _t0 = performance.now();
    _loop();
}

function hide3DCharacter() {
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    if (_r) _r.domElement.style.display = 'none';
}

function notifyBearDialogue() {
    _dialogueTriggerT = (performance.now() - _t0) / 1000;
}

function showMenuBear() {
    _ensureInit();
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }

    _menuMode = true;
    if (_butterfly) _butterfly.visible = true;

    _cam.fov = 48;
    _cam.position.set(0, 3.0, 10.0);
    _cam.lookAt(0, 2.6, 0);
    _cam.updateProjectionMatrix();

    _positionMenu();

    _mats.forEach(m => { m.opacity = 0; });
    _grp.position.set(0, 0, 0);
    _grp.rotation.set(0, Math.PI, 0);
    _grp.scale.setScalar(0.62);

    _menuGlanceT     = -99;
    _menuGlanceNextT = 3.5;

    _r.domElement.style.display = 'block';
    _t0 = performance.now();
    _loop();
}

function hideMenuBear() {
    _menuMode = false;
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    if (_r) _r.domElement.style.display = 'none';
}

function menuBearNod() {
    if (_t0) _menuNodT = (performance.now() - _t0) / 1000;
}

function menuBearZoom() {
    if (!_cam) return;
    const startZ = _cam.position.z;
    const startT = performance.now();
    const dur    = 500;
    const step   = () => {
        const p = Math.min(1, (performance.now() - startT) / dur);
        const e = 1 - Math.pow(1 - p, 2);
        if (_cam) _cam.position.z = startZ - (startZ - 4.5) * e;
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}


function show3DDialogueBanner(onDismiss) {
    _dialogDismissCb = onDismiss || null;
    const dlg = document.getElementById('dlg');
    if (dlg) {
        _repositionBanner();
        // Start with just the left-edge fade zone visible; typewriter will advance the reveal
        const initMask = 'linear-gradient(to right, black 0%, transparent 16%)';
        dlg.style.webkitMaskImage = initMask;
        dlg.style.maskImage       = initMask;
        dlg.style.animation       = '';
        dlg.style.display         = 'block';
        dlg.addEventListener('pointerdown', _on3DClick, { once: true });
    }
}

function hide3DDialogueBanner() {
    _dialogDismissCb = null;
    const dlg = document.getElementById('dlg');
    if (dlg) {
        dlg.style.webkitMaskImage = '';
        dlg.style.maskImage       = '';
        dlg.style.animation       = '';
        dlg.style.display         = 'none';
    }
}

function updateBannerReveal(pct) {
    const dlg = document.getElementById('dlg');
    if (!dlg) return;
    const edge = Math.min(100, pct + 16);
    const mask = `linear-gradient(to right, black ${pct.toFixed(1)}%, transparent ${edge.toFixed(1)}%)`;
    dlg.style.webkitMaskImage = mask;
    dlg.style.maskImage       = mask;
}

function _on3DClick() {
    if (_dialogDismissCb) _dialogDismissCb();
}

function _repositionBanner() {
    const dlg = document.getElementById('dlg');
    if (!dlg) return;
    const cv = document.querySelector('canvas');
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const sx = rect.width / 640;
    dlg.style.left     = Math.round(rect.left) + 'px';
    dlg.style.top      = 'auto';
    dlg.style.bottom   = Math.round(window.innerHeight - rect.bottom) + 'px';
    dlg.style.width    = Math.round(rect.width) + 'px';
    dlg.style.fontSize = Math.max(11, Math.round(14 * sx)) + 'px';
}

function updateDialogueText(text, name, nameColor) {
    const dlg = document.getElementById('dlg');
    if (!dlg) return;
    dlg.innerHTML = '<span style="color:#aca4bc;letter-spacing:0.03em">' + text + '</span>';
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _makeGear(T, r, nTeeth, thick, color) {
    const mat  = new T.MeshLambertMaterial({ color });
    const hubM = new T.MeshLambertMaterial({ color: 0x12100e });
    const g    = new T.Group();
    const disc = new T.Mesh(new T.CylinderGeometry(r * 0.70, r * 0.70, thick, 36), mat);
    disc.rotation.x = Math.PI / 2;
    g.add(disc);
    const hub = new T.Mesh(new T.CylinderGeometry(r * 0.18, r * 0.18, thick * 1.1, 16), hubM);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    const toothH = r * 0.36;
    const toothW = (2 * Math.PI * r * 0.70) / (nTeeth * 2.1);
    for (let i = 0; i < nTeeth; i++) {
        const angle = (i / nTeeth) * Math.PI * 2;
        const tooth = new T.Mesh(new T.BoxGeometry(toothW, toothH, thick), mat);
        tooth.position.set(
            Math.cos(angle) * (r * 0.70 + toothH / 2),
            Math.sin(angle) * (r * 0.70 + toothH / 2),
            0
        );
        tooth.rotation.z = angle;
        g.add(tooth);
    }
    return g;
}

function _init() {
    const T = window.THREE;
    _s = new T.Scene();

    _s.add(new T.AmbientLight(0xa09080, 0.70));
    const key = new T.DirectionalLight(0xf0e4d0, 1.35);
    key.position.set(2, 6, 7);
    _s.add(key);
    const rim = new T.DirectionalLight(0x1833cc, 0.42);
    rim.position.set(-5, 3, -3);
    _s.add(rim);

    // Bear camera — upper body portrait
    _cam = new T.PerspectiveCamera(44, 232 / 200, 0.1, 50);
    _cam.position.set(0, 4.05, 8.0);
    _cam.lookAt(0, 3.85, 0);

    _r = new T.WebGLRenderer({ alpha: true, antialias: true });
    _r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    _r.domElement.id = 'char3d';
    _r.domElement.style.cssText = 'position:fixed;z-index:25;pointer-events:none;display:none;';
    document.body.appendChild(_r.domElement);

    _gears = [];

    const character = getAdminCharacter();
    const def = {
        animal:      character?.animal      || 'giraffe',
        bodyColor:   character?.bodyColor   || 0xc8801a,
        accentColor: character?.accentColor || 0xe8c070,
        spotColor:   character?.spotColor   || 0x4a1e06,
        eyeColor:    character?.eyeColor    || 0xffd84a,
    };

    const built = _build(def);
    _grp   = built.grp;
    _head  = built.head;
    _torso = built.torso;
    _neck  = built.neck;
    _tail  = built.tail;
    _armL     = built.armL;
    _armR     = built.armR;
    _legL     = built.legL;
    _legR     = built.legR;
    _flowers  = built.flowers;
    _butterfly = built.butterfly;
    _bfWingL   = built.bfWingL;
    _bfWingR   = built.bfWingR;
    _mats     = built.mats;
    _shineMat = built.shineMat;

    _tablet = built.tablet;
    _s.add(_grp);
    window.addEventListener('resize', () => {
        if (_menuMode) _positionMenu(); else _position();
        _repositionBanner();
    });
    _lastBuiltAnimal = (getAdminCharacter() || {}).animal || 'bear';
}

function _ensureInit() {
    const animal = (getAdminCharacter() || {}).animal || 'bear';
    if (!_r) { _init(); return; }
    if (_lastBuiltAnimal === animal) return;
    // Character type changed — rebuild geometry, reuse renderer/scene/camera/lights
    _mats.forEach(m => { try { m.dispose(); } catch(e) {} });
    if (_grp) _s.remove(_grp);
    const character = getAdminCharacter();
    const def = {
        animal:      character?.animal      || 'bear',
        bodyColor:   character?.bodyColor   || 0xc8801a,
        accentColor: character?.accentColor || 0xe8c070,
        spotColor:   character?.spotColor   || 0x4a1e06,
        eyeColor:    character?.eyeColor    || 0xffd84a,
    };
    const built = _build(def);
    _grp       = built.grp;
    _head      = built.head;
    _torso     = built.torso;
    _neck      = built.neck;
    _tail      = built.tail;
    _armL      = built.armL;
    _armR      = built.armR;
    _legL      = built.legL;
    _legR      = built.legR;
    _flowers   = built.flowers;
    _butterfly = built.butterfly;
    _bfWingL   = built.bfWingL;
    _bfWingR   = built.bfWingR;
    _mats      = built.mats;
    _shineMat  = built.shineMat;
    _tablet    = built.tablet;
    _s.add(_grp);
    _lastBuiltAnimal = animal;
}

function _build(def) {
    const T    = window.THREE;
    const grp  = new T.Group();
    const mats = [];

    const lm = (c, opts) => {
        const m = new T.MeshLambertMaterial({ color: c, transparent: true, opacity: 1, ...opts });
        mats.push(m);
        return m;
    };
    const ol = (mesh, sc) => {
        const m = new T.MeshBasicMaterial({ color: 0x040202, side: T.BackSide, transparent: true, opacity: 1 });
        mats.push(m);
        const o = new T.Mesh(mesh.geometry, m);
        o.scale.setScalar(sc || 1.06);
        mesh.add(o);
    };

    const bodyMat   = lm(def.bodyColor);
    const accentMat = lm(def.accentColor);
    const spotMat   = lm(def.spotColor || 0x4a1e06);
    const eyeMat    = lm(0x060304);
    const shineMat  = lm(0xffffff);
    const darkMat   = lm(0x1e0e02);

    // ── STANDING LEGS ────────────────────────────────────────────────────────
    let legL, legR;
    [-0.78, 0.78].forEach((lx, i) => {
        const legGrp = new T.Group();
        legGrp.position.set(lx, 0, 0);
        const leg = new T.Mesh(new T.BoxGeometry(1.38, 2.80, 1.38), bodyMat);
        leg.position.set(0, -0.15, 0);
        ol(leg, 1.05);
        legGrp.add(leg);
        grp.add(legGrp);
        if (i === 0) legL = legGrp; else legR = legGrp;
    });

    // ── TORSO ────────────────────────────────────────────────────────────────
    const torsoGrp  = new T.Group();
    const torsoMesh = new T.Mesh(new T.BoxGeometry(2.75, 2.8, 1.45), bodyMat);
    torsoMesh.position.set(0, 2.3, 0);
    ol(torsoMesh, 1.05);
    torsoGrp.add(torsoMesh);
    // Oval belly patch — bear only
    if (def.animal !== 'beaver') {
        const bellyMat = lm(def.accentColor);
        const belly = new T.Mesh(new T.SphereGeometry(0.65, 16, 12), bellyMat);
        belly.scale.set(0.82, 1.02, 0.22);
        belly.position.set(0, 0.02, 0.74);
        torsoMesh.add(belly);
    }
    grp.add(torsoGrp);

    // ── TAIL ─────────────────────────────────────────────────────────────────
    const tailGrp = new T.Group();
    if (def.animal === 'beaver') {
        // Flat paddle tail — wide, oval, positioned low at the back
        tailGrp.position.set(0.3, 0.9, -0.9);
        tailGrp.rotation.y = -0.28;
        const paddleMat = lm(def.accentColor);
        const paddle = new T.Mesh(new T.BoxGeometry(1.8, 0.13, 2.0), paddleMat);
        paddle.rotation.x = -0.14;
        ol(paddle, 1.04);
        // Scale-plate texture strips
        for (let i = 0; i < 5; i++) {
            const strip = new T.Mesh(new T.BoxGeometry(1.74, 0.025, 0.06), spotMat);
            strip.position.set(0, 0.08, -0.75 + i * 0.38);
            paddle.add(strip);
        }
        tailGrp.add(paddle);
    } else {
        // Bear fluffy tail
        tailGrp.position.set(0, 2.0, -0.74);
        const tailStem = new T.Mesh(new T.CylinderGeometry(0.055, 0.04, 0.85, 8), bodyMat);
        tailStem.position.set(0, -0.42, 0);
        tailGrp.add(tailStem);
        const tailTuft = new T.Mesh(new T.SphereGeometry(0.14, 8, 6), spotMat);
        tailTuft.position.set(0, -0.90, 0);
        tailGrp.add(tailTuft);
    }
    grp.add(tailGrp);

    // ── ARMS — shoulder-pivot groups ─────────────────────────────────────────
    const armGeo    = new T.BoxGeometry(1.60, 2.60, 1.60);
    const armHalfH  = 1.30;
    const shoulderY = 3.60;

    const armL = new T.Group();
    armL.position.set(-2.06, shoulderY, 0);
    const armLMesh = new T.Mesh(armGeo, bodyMat);
    armLMesh.position.y = -armHalfH;
    ol(armLMesh, 1.06);
    armL.add(armLMesh);
    grp.add(armL);

    const armR = new T.Group();
    armR.position.set(2.06, shoulderY, 0);
    const armRMesh = new T.Mesh(armGeo, bodyMat);
    armRMesh.position.y = -armHalfH;
    ol(armRMesh, 1.06);
    armR.add(armRMesh);
    grp.add(armR);

    // ── HEAD ─────────────────────────────────────────────────────────────────
    const head = new T.Group();
    head.rotation.order = 'YXZ';
    head.position.set(0, 4.40, 0.04);

    // Main head — sphere, slightly compressed depth (shared)
    const headMesh = new T.Mesh(new T.SphereGeometry(1.20, 16, 12), bodyMat);
    headMesh.scale.set(1.0, 0.97, 0.90);
    ol(headMesh, 1.05);
    head.add(headMesh);

    if (def.animal === 'beaver') {
        // Beaver: small flat disc ears, wide snout, buck teeth
        [[-0.88], [0.88]].forEach(([ex]) => {
            const ear = new T.Mesh(new T.SphereGeometry(0.22, 10, 8), bodyMat);
            ear.scale.set(1.0, 0.85, 0.40);
            ear.position.set(ex, 0.64, 0.04);
            ol(ear, 1.06);
            head.add(ear);
            const earIn = new T.Mesh(new T.SphereGeometry(0.13, 8, 6), darkMat);
            earIn.scale.set(0.90, 0.80, 0.50);
            earIn.position.set(ex, 0.64, 0.13);
            head.add(earIn);
        });
        // Wider, flatter snout
        const snout = new T.Mesh(new T.BoxGeometry(0.86, 0.46, 0.54), accentMat);
        snout.position.set(0, -0.18, 0.89);
        ol(snout, 1.05);
        head.add(snout);
        // Nose — wider
        const noseMesh = new T.Mesh(new T.SphereGeometry(0.15, 8, 6), darkMat);
        noseMesh.scale.set(1.30, 0.72, 0.65);
        noseMesh.position.set(0, 0.06, 1.10);
        head.add(noseMesh);
        // Buck teeth — two cream rectangles below the snout
        const toothMat = lm(0xf2e8c0);
        [-0.20, 0.20].forEach(tx => {
            const tooth = new T.Mesh(new T.BoxGeometry(0.26, 0.38, 0.14), toothMat);
            tooth.position.set(tx, -0.32, 1.06);
            ol(tooth, 1.04);
            head.add(tooth);
        });
    } else {
        // Bear: round ears, snout, nose
        [[-0.92], [0.92]].forEach(([ex]) => {
            const ear = new T.Mesh(new T.SphereGeometry(0.37, 10, 8), bodyMat);
            ear.scale.set(1.0, 0.93, 0.74);
            ear.position.set(ex, 0.76, -0.24);
            ol(ear, 1.06);
            head.add(ear);
            const earIn = new T.Mesh(new T.SphereGeometry(0.20, 8, 6), darkMat);
            earIn.scale.set(0.90, 0.86, 0.50);
            earIn.position.set(ex, 0.76, -0.14);
            head.add(earIn);
        });
        const snout = new T.Mesh(new T.BoxGeometry(0.74, 0.50, 0.50), accentMat);
        snout.position.set(0, -0.15, 0.90);
        ol(snout, 1.05);
        head.add(snout);
        const noseMesh = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), darkMat);
        noseMesh.scale.set(1.10, 0.72, 0.65);
        noseMesh.position.set(0, 0.05, 1.10);
        head.add(noseMesh);
    }

    if (def.animal === 'beaver') {
        // Beady side eyes — socket sits on head surface, eye protrudes in front of it
        [[-0.76, 1], [0.76, -1]].forEach(([ex, side]) => {
            // Dark flat socket disc, just proud of head surface (surface at ~z=0.83)
            const socket = new T.Mesh(new T.SphereGeometry(0.20, 8, 6), darkMat);
            socket.scale.set(1.0, 1.0, 0.12);
            socket.position.set(ex, 0.10, 0.87);
            head.add(socket);
            // Small beady eye in front of socket
            const eye = new T.Mesh(new T.SphereGeometry(0.13, 10, 8), eyeMat);
            eye.position.set(ex, 0.10, 0.93);
            head.add(eye);
            // Tiny shine
            const shine = new T.Mesh(new T.SphereGeometry(0.055, 8, 6), shineMat);
            shine.position.set(ex + 0.03 * side, 0.15, 1.00);
            head.add(shine);
        });
    } else {
        // Bear eyes — front-facing
        [[-0.46, 1], [0.46, -1]].forEach(([ex, side]) => {
            const eye = new T.Mesh(new T.SphereGeometry(0.17, 10, 8), eyeMat);
            eye.position.set(ex, 0.20, 0.76);
            head.add(eye);
            const shine = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), shineMat);
            shine.position.set(ex + 0.04 * side, 0.27, 0.88);
            head.add(shine);
        });
    }

    grp.add(head);

    // ── Wooden slate prop (menu mode only) ───────────────────────────────────
    const tabletGrp  = new T.Group();
    // Outer wood frame — darker grain
    const frameMat   = lm(0x6B3C10);
    const slateFrame = new T.Mesh(new T.BoxGeometry(1.44, 1.94, 0.11), frameMat);
    tabletGrp.add(slateFrame);
    // Writing surface — lighter warm wood
    const surfaceMat = new T.MeshLambertMaterial({ color: 0x9C6030, transparent: true, opacity: 1 });
    mats.push(surfaceMat);
    const surface = new T.Mesh(new T.PlaneGeometry(1.18, 1.66), surfaceMat);
    surface.position.z = 0.063;
    slateFrame.add(surface);
    // Small handle nub at the bottom
    const handleMat  = lm(0x4A2408);
    const handle     = new T.Mesh(new T.BoxGeometry(0.30, 0.28, 0.11), handleMat);
    handle.position.set(0, -1.09, 0);
    tabletGrp.add(handle);
    tabletGrp.position.set(0, 1.48, 1.22);
    tabletGrp.rotation.x = 0.10;
    tabletGrp.visible = false;
    grp.add(tabletGrp);

    // ── HILL + FLOWERS + GRASS (menu decoration) ─────────────────────────────
    const flowersGrp = new T.Group();
    const HILL_R = 6.0;
    const HILL_H = 0.80;
    const hillY  = (x, z) => HILL_H * Math.max(0, 1 - Math.pow((x*x + z*z) / (HILL_R*HILL_R), 0.9));
    const groundY = (x, z) => -1.55 + hillY(x, z);

    // shared materials — reused across all grass/flower instances
    const grassMats  = [0x3a8c20, 0x4aaa2e, 0x2d7018, 0x55b535, 0x60a828].map(c => lm(c));
    const stemMats   = [lm(0x3a7a22), lm(0x509030)];
    const centerMats = [lm(0xffee33), lm(0xff8800)];
    const petalMats  = [0xff88cc, 0xffeedd, 0xddaaff, 0xff66bb, 0xffccaa,
                        0xffffff, 0xff44aa, 0xffbb66, 0xaaddff, 0xffaaaa].map(c => lm(c));

    // ── Flowers ───────────────────────────────────────────────────────────────
    for (let fi = 0; fi < 55; fi++) {
        const s    = fi * 17 + 3;
        const fx   = ((s * 7)  % 118 - 59) / 10;
        const fz   = ((s * 11) % 118 - 59) / 10;
        if (fx*fx + fz*fz > HILL_R * HILL_R) continue;
        const stemH = 0.30 + (fi % 7) * 0.11;
        const petR  = 0.11 + (fi % 3) * 0.04;
        const fg    = new T.Group();
        fg.position.set(fx, groundY(fx, fz), fz);
        const stem = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, stemH, 6), stemMats[fi % 2]);
        stem.position.y = stemH / 2;
        fg.add(stem);
        const nPetals = 5 + (fi % 3);
        for (let p = 0; p < nPetals; p++) {
            const a = (p / nPetals) * Math.PI * 2;
            const petal = new T.Mesh(new T.SphereGeometry(petR, 6, 4), petalMats[fi % petalMats.length]);
            petal.scale.set(1, 0.42, 1);
            petal.position.set(Math.cos(a) * (petR + 0.08), stemH + 0.04, Math.sin(a) * (petR + 0.08));
            fg.add(petal);
        }
        const center = new T.Mesh(new T.SphereGeometry(petR * 0.85, 8, 6), centerMats[fi % 2]);
        center.position.y = stemH + 0.04;
        fg.add(center);
        flowersGrp.add(fg);
    }

    // ── Grass — circular hill grid ────────────────────────────────────────────
    for (let col = 0; col < 30; col++) {
        for (let row = 0; row < 30; row++) {
            const bx = (col / 29) * 14 - 7;
            const bz = (row / 29) * 14 - 7;
            if (bx*bx + bz*bz > HILL_R * HILL_R) continue;
            const s  = col * 7 + row * 13;
            const jx = ((s * 7)  % 19 - 9) / 9 * 0.32;
            const jz = ((s * 11) % 17 - 8) / 8 * 0.32;
            const gx = bx + jx, gz = bz + jz;
            const gc = new T.Group();
            gc.position.set(gx, groundY(gx, gz), gz);
            const h  = 0.22 + (s % 5) * 0.09;
            const gm = grassMats[s % grassMats.length];
            [-0.18, 0.0, 0.18].forEach(az => {
                const blade = new T.Mesh(new T.BoxGeometry(0.055, h, 0.035), gm);
                blade.position.y = h / 2;
                blade.rotation.z = az + ((s * 31) % 7 - 3) * 0.05;
                gc.add(blade);
            });
            flowersGrp.add(gc);
        }
    }

    grp.add(flowersGrp);

    // ── BUTTERFLY ────────────────────────────────────────────────────────────
    const bf = new T.Group();
    bf.position.set(2.6, 3.8, 0.4);

    const bfBodyMat = lm(0x1a0800);
    const bfBody = new T.Mesh(new T.CylinderGeometry(0.045, 0.025, 0.38, 8), bfBodyMat);
    bf.add(bfBody);
    [-0.07, 0.07].forEach((ax, ai) => {
        const ant = new T.Mesh(new T.CylinderGeometry(0.010, 0.006, 0.28, 4), bfBodyMat);
        ant.position.set(ax, 0.30, 0);
        ant.rotation.z = ax * 3.5;
        bf.add(ant);
        const tip = new T.Mesh(new T.SphereGeometry(0.022, 5, 4), bfBodyMat);
        tip.position.set(ax + ax * 1.4, 0.43, 0);
        bf.add(tip);
    });

    const wingMainMat   = lm(0x9966ff);
    const wingAccentMat = lm(0x5533cc);
    const wingSpotMat   = lm(0xeeddff);
    const wingDarkMat   = lm(0x221144);

    const bfWingL = new T.Group();
    const bfWingR = new T.Group();

    // upper wings — larger, thick box, angled to show depth
    const wuL = new T.Mesh(new T.BoxGeometry(0.62, 0.56, 0.07), wingMainMat);
    wuL.position.set(-0.32, 0.16, 0);
    wuL.rotation.set(0.18, 0, 0.25);
    ol(wuL, 1.04);
    bfWingL.add(wuL);
    // light spot on upper wing
    const wuLs = new T.Mesh(new T.BoxGeometry(0.22, 0.19, 0.08), wingSpotMat);
    wuLs.position.set(-0.30, 0.19, 0.03);
    wuLs.rotation.set(0.18, 0, 0.25);
    bfWingL.add(wuLs);
    // lower wings — smaller
    const wlL = new T.Mesh(new T.BoxGeometry(0.44, 0.36, 0.07), wingAccentMat);
    wlL.position.set(-0.23, -0.15, 0);
    wlL.rotation.set(0.12, 0, -0.10);
    ol(wlL, 1.04);
    bfWingL.add(wlL);

    const wuR = new T.Mesh(new T.BoxGeometry(0.62, 0.56, 0.07), wingMainMat);
    wuR.position.set(0.32, 0.16, 0);
    wuR.rotation.set(0.18, 0, -0.25);
    ol(wuR, 1.04);
    bfWingR.add(wuR);
    const wuRs = new T.Mesh(new T.BoxGeometry(0.22, 0.19, 0.08), wingSpotMat);
    wuRs.position.set(0.30, 0.19, 0.03);
    wuRs.rotation.set(0.18, 0, -0.25);
    bfWingR.add(wuRs);
    const wlR = new T.Mesh(new T.BoxGeometry(0.44, 0.36, 0.07), wingAccentMat);
    wlR.position.set(0.23, -0.15, 0);
    wlR.rotation.set(0.12, 0, 0.10);
    ol(wlR, 1.04);
    bfWingR.add(wlR);

    bf.add(bfWingL);
    bf.add(bfWingR);
    bf.visible = false; // hidden in game mode
    grp.add(bf);

    return { grp, head, torso: torsoGrp, neck: null, tail: tailGrp, mats, armL, armR, legL, legR, flowers: flowersGrp, shineMat, tablet: tabletGrp, butterfly: bf, bfWingL, bfWingR };
}

function _position() {
    if (!_r) return;
    const cv   = document.querySelector('canvas');
    const rect = cv.getBoundingClientRect();
    const sx   = rect.width  / 900;
    const sy   = rect.height / 1000;
    const GW = 300, GH = 200;
    const pw  = Math.round(GW * sx);
    const ph  = Math.round(GH * sy);
    const cl  = Math.round(rect.left + 20 * sx);
    const ct  = Math.round(rect.top  + 820 * sy);

    _r.setSize(pw, ph);
    _r.domElement.style.left = cl + 'px';
    _r.domElement.style.top  = ct + 'px';

    const crtEl = document.getElementById('crt-overlay');
    if (crtEl) {
        crtEl.style.left   = cl + 'px';
        crtEl.style.top    = ct + 'px';
        crtEl.style.width  = pw + 'px';
        crtEl.style.height = ph + 'px';
    }

    if (_glitchCanvasEl) {
        _glitchCanvasEl.width              = pw;
        _glitchCanvasEl.height             = ph;
        _glitchCanvasEl.style.left         = cl + 'px';
        _glitchCanvasEl.style.top          = ct + 'px';
        _glitchCanvasEl.style.width        = pw + 'px';
        _glitchCanvasEl.style.height       = ph + 'px';
    }

    // Screen frame — borderless: exactly matches canvas
    const frameEl = document.getElementById('tv-frame');
    if (frameEl) {
        frameEl.style.left   = cl + 'px';
        frameEl.style.top    = ct + 'px';
        frameEl.style.width  = pw + 'px';
        frameEl.style.height = ph + 'px';
    }

    const vigEl = document.getElementById('board-vignette');
    if (vigEl) {
        vigEl.style.left   = rect.left + 'px';
        vigEl.style.top    = rect.top  + 'px';
        vigEl.style.width  = rect.width  + 'px';
        vigEl.style.height = rect.height + 'px';
    }

    _cam.aspect = GW / GH;
    _cam.updateProjectionMatrix();
}

function _positionMenu() {
    if (!_r) return;
    const cv   = document.querySelector('canvas');
    const rect = cv.getBoundingClientRect();
    const sx   = rect.width  / 640;
    const sy   = rect.height / 1000;
    const GW   = 460, GH = 520;
    const pw   = Math.round(GW * sx);
    const ph   = Math.round(GH * sy);
    const cl   = Math.round(rect.left + (320 - GW / 2) * sx);
    const ct   = Math.round(rect.top  + 95 * sy);

    _r.setSize(pw, ph);
    _r.domElement.style.left = cl + 'px';
    _r.domElement.style.top  = ct + 'px';

    _cam.aspect = GW / GH;
    _cam.updateProjectionMatrix();
}

// Arm climb curve: 1=fully raised/gripping, 0=at rest.
// Phases: first pull → re-grip → final pull → spring settle.
function _armClimbAmt(tt) {
    if (tt < 0)    return 1.0;
    if (tt < 0.28) return 1.0 - (tt / 0.28) * 0.52;
    if (tt < 0.50) return 0.48 + ((tt - 0.28) / 0.22) * 0.52;
    if (tt < 0.90) { const p = (tt - 0.50) / 0.40; return 1.0 - (1 - Math.pow(1 - p, 2)); }
    if (tt < 1.35) { const p = (tt - 0.90) / 0.45; return Math.max(0, Math.exp(-p * 5.5) * Math.sin(p * Math.PI * 2.2) * 0.18); }
    return 0;
}

function _loopMenu(t) {
    const FADE_DUR = 0.55;
    if (t < FADE_DUR) {
        const op = 1 - Math.pow(1 - t / FADE_DUR, 2);
        _mats.forEach(m => { m.opacity = op; });
    } else if (_mats[0] && _mats[0].opacity < 1) {
        _mats.forEach(m => { m.opacity = 1; });
    }

    const breathe = Math.sin(t * 1.5) * 0.009;
    const sway    = Math.sin(t * 0.75) * 0.013;

    // Periodic glance up at camera
    if (t > _menuGlanceNextT) {
        _menuGlanceT     = t;
        _menuGlanceNextT = t + 4.5 + Math.random() * 4;
    }
    const gDt    = t - _menuGlanceT;
    const glance = (gDt > 0 && gDt < 1.8)
        ? Math.sin(Math.min(1, gDt / 1.8) * Math.PI) : 0;

    if (_grp) {
        _grp.position.set(sway * 0.3, breathe * 1.5, 0);
        _grp.rotation.set(-0.06 + breathe * 0.2, -0.60 + sway * 0.015, sway * 0.010);
        _grp.scale.setScalar(0.62);
    }
    if (_torso) {
        _torso.scale.set(1 + breathe * 0.5, 1 + breathe * 1.5, 1 + breathe * 0.8);
        _torso.position.y = breathe * 0.4;
    }
    if (_armL) {
        _armL.position.set(-2.06, 3.60, 0);
        _armL.rotation.x =  0.10 + sway * 0.015;
        _armL.rotation.y =  0.04;
        _armL.rotation.z =  0.16 + breathe * 0.3;
    }
    if (_armR) {
        _armR.position.set(2.06, 3.60, 0);
        _armR.rotation.x =  0.10 - sway * 0.015;
        _armR.rotation.y = -0.04;
        _armR.rotation.z = -0.16 - breathe * 0.3;
    }
    if (_legL) {
        _legL.rotation.z = -0.05 + Math.sin(t * 1.0)        * 0.03;
        _legL.rotation.x =         Math.sin(t * 0.85)        * 0.02;
        _legL.position.y = 0;
    }
    if (_legR) {
        _legR.rotation.z =  0.05 + Math.sin(t * 1.0 + 1.3)  * 0.03;
        _legR.rotation.x =         Math.sin(t * 0.85 + 1.0)  * 0.02;
        _legR.position.y = 0;
    }
    if (_flowers) {
        _flowers.children.forEach((f, i) => {
            const w = Math.sin(t * 0.55 + i * 0.72) * 0.10
                    + Math.sin(t * 1.30 + i * 0.41) * 0.04;
            f.rotation.z = w;
            f.rotation.x = Math.sin(t * 0.48 + i * 0.93) * 0.05;
        });
    }
    if (_tail) {
        _tail.rotation.x = 0.30 + Math.sin(t * 1.55) * 0.14;
        _tail.rotation.z = Math.sin(t * 1.18) * 0.09;
    }
    const nodDt = t - _menuNodT;
    const nod   = (nodDt >= 0 && nodDt < 0.85)
        ? Math.sin(nodDt / 0.85 * Math.PI) * 0.20 : 0;

    if (_head) {
        _head.position.y = 4.40 + breathe;
        _head.rotation.y = 0.55 + sway * 0.04;
        _head.rotation.x = -0.06 + breathe * 0.2 + nod;
        _head.rotation.z = sway * 0.03;
    }
    if (_shineMat) {
        _shineMat.emissive.copy(_shineMat.color);
        _shineMat.emissiveIntensity = glance * 0.9;
    }
    if (_butterfly) {
        const hov  = Math.sin(t * 1.9) * 0.14;
        const hovX = Math.sin(t * 0.8) * 0.09;
        _butterfly.position.set(3.2 + hovX, 4.9 + hov, 0.4);
        _butterfly.rotation.x = 1.05;
        _butterfly.rotation.y = Math.sin(t * 0.45) * 0.22 - 0.15;
        const flap = Math.sin(t * 5.0) * 0.70;
        if (_bfWingL) _bfWingL.rotation.y =  flap;
        if (_bfWingR) _bfWingR.rotation.y = -flap;
    }
}

function _loop() {
    _raf = requestAnimationFrame(_loop);
    const t   = (performance.now() - _t0) / 1000;
    const now = performance.now() / 1000;

    if (_menuMode) {
        _loopMenu(t);
        _r.render(_s, _cam);
        return;
    }

    // ── Fade in ───────────────────────────────────────────────────────────────
    const FADE_DUR = 0.40;
    if (t < FADE_DUR) {
        const op = 1 - Math.pow(1 - t / FADE_DUR, 2);
        _mats.forEach(m => { m.opacity = op; });
    } else if (_mats[0] && _mats[0].opacity < 1) {
        _mats.forEach(m => { m.opacity = 1; });
    }

    // ── Entry: two-heave climb ────────────────────────────────────────────────
    // Body: partial rise → re-grip dip → final heave → spring settle
    const ENTER_DUR = 1.10;
    let enterOff = 0, entryScale = 1, entryTilt = 0, entryYaw = 0;
    if (t < ENTER_DUR) {
        const p = t / ENTER_DUR;
        let bodyE;
        if      (p < 0.28) { bodyE = (p / 0.28) * 0.42; }
        else if (p < 0.46) { bodyE = 0.42 - ((p - 0.28) / 0.18) * 0.07; }
        else               { const pp = (p - 0.46) / 0.54; bodyE = 0.35 + (1 - Math.pow(1 - pp, 3)) * 0.65; }
        const ss = 0.88 * ENTER_DUR;
        const spng = t > ss ? Math.exp(-(t - ss) * 4.2) * Math.sin((t - ss) * Math.PI * 3.5) * 0.28 : 0;
        enterOff   = -5 * (1 - bodyE) + spng;
        entryScale = 0.62 + 0.38 * Math.min(1, bodyE);
        entryTilt  = (1 - bodyE) * 0.08;
        entryYaw   = (1 - bodyE) * 0.14;
    }

    // L arm leads, R arm follows 90ms behind — breaks the symmetry
    const acL = _armClimbAmt(t);
    const acR = _armClimbAmt(t - 0.09);
    const acAvg = (acL + acR) * 0.5;

    // ── Fighting game idle: bounce + weight shift + breathe ──────────────────
    const bounce      = Math.sin(t * 5.8) * 0.065;      // vertical bob ~0.92Hz
    const shift       = Math.sin(t * 3.0) * 0.11;       // lateral weight shift ~0.48Hz
    const breathe     = Math.sin(t * 2.1) * 0.015;      // chest breathe ~0.33Hz
    const forwardRock = Math.sin(t * 4.4) * 0.009;      // subtle forward-back micro-rock
    const bob         = bounce;
    const struggleWobble = (t > 0.10 && t < 1.0) ? Math.max(0, acAvg * (1 - acAvg) * 4) * Math.sin(t * 18.0) * 0.13 : 0;

    // ── Arrogant pose on dialogue trigger ─────────────────────────────────────
    const dlgDt        = t - _dialogueTriggerT;
    // Body leans back slowly (cocky, chin-up energy)
    const arrogLean    = (dlgDt > 0 && dlgDt < 3.0)
        ? Math.exp(-1.2 * dlgDt) * Math.sin(dlgDt * 1.4) * 0.30 : 0;
    // Chest puffs outward briefly
    const chestPuff    = (dlgDt > 0 && dlgDt < 1.5)
        ? Math.exp(-3.2 * dlgDt) * 0.20 : 0;
    // Head tilts back — chin up, looking down at player
    const headChinUp   = (dlgDt > 0 && dlgDt < 2.5)
        ? -Math.exp(-1.4 * dlgDt) * 0.13 : 0;
    // Head does a slow contemptuous side-tilt
    const headContempt = (dlgDt > 0 && dlgDt < 4.0)
        ? Math.exp(-0.85 * dlgDt) * Math.sin(dlgDt * 0.95) * 0.18 : 0;
    // Full body wobble: fast-decaying shake of the whole group
    const bodyWobble   = (dlgDt > 0 && dlgDt < 1.0)
        ? Math.exp(-5.5 * dlgDt) * Math.sin(dlgDt * 20) * 0.16 : 0;

    if (_grp) {
        _grp.position.x = shift + struggleWobble + bodyWobble * 2.5;
        _grp.position.y = bob + enterOff;
        _grp.rotation.z = shift * 0.07 + entryTilt + bodyWobble;
        _grp.rotation.y = shift * 0.05 + entryYaw  + bodyWobble * 0.4;
        _grp.rotation.x = 0.04 - arrogLean + forwardRock;
        _grp.scale.setScalar(entryScale);
    }

    if (_torso) {
        _torso.scale.y    = 1.0 + breathe * 1.5;
        _torso.scale.x    = 1.0 + chestPuff * 0.55 + breathe * 0.5;
        _torso.scale.z    = 1.0 + chestPuff         + breathe * 0.8;
        _torso.position.y = breathe * 0.5;
    }

    // ── Tail ─────────────────────────────────────────────────────────────────
    if (_tail) {
        if (_lastBuiltAnimal === 'beaver') {
            // Slow side-to-side thwack
            _tail.rotation.x = -0.14 + Math.sin(t * 1.1) * 0.07;
            _tail.rotation.z = Math.sin(t * 0.85) * 0.20;
            _tail.rotation.y = -0.28 + Math.sin(t * 0.65) * 0.10;
        } else {
            _tail.rotation.x = 0.30 + Math.sin(t * 2.18) * 0.24 + Math.sin(t * 1.43) * 0.09;
            _tail.rotation.z = Math.sin(t * 1.76) * 0.16;
        }
    }

    // ── Arms — idle pendulum + lateral drift; climb overrides ───────────────
    const armSwingL = Math.sin(t * 2.1) * 0.14;              // L arm forward-back pendulum
    const armSwingR = Math.sin(t * 2.1 + 1.1) * 0.12;       // R arm offset phase
    const armDrift  = shift * 0.22;                           // both arms drift with body sway
    const armTwist  = Math.sin(t * 1.5) * 0.06;              // gentle y-axis twist

    if (_armL) {
        _armL.position.set(-2.06, 3.60, 0);
        _armL.rotation.x = acL * -2.35 + (1 - acL) * armSwingL;
        _armL.rotation.y =  armTwist;
        _armL.rotation.z =  armDrift * 0.45;
    }
    if (_armR) {
        _armR.position.set(2.06, 3.60, 0);
        _armR.rotation.x = acR * -2.35 + (1 - acR) * armSwingR;
        _armR.rotation.y = -armTwist;
        _armR.rotation.z = -armDrift * 0.45;
    }

    // ── Eye glow on dialogue ──────────────────────────────────────────────────
    if (_shineMat) {
        const glowAmt = (dlgDt > 0 && dlgDt < 3.5)
            ? Math.max(0, Math.exp(-0.9 * dlgDt)) * (0.7 + 0.3 * Math.sin(dlgDt * 9))
            : 0;
        _shineMat.emissive.copy(_shineMat.color);
        _shineMat.emissiveIntensity = glowAmt * 2.2;
    }

    // ── Head — counter-bounce inertia + breathe + arrogant tilt on dialogue ───
    if (_head) {
        _head.position.y = 4.40 - bounce * 0.45;
        _head.rotation.x = 0.18 + breathe * 0.7 - acAvg * 0.18 + headChinUp;
        _head.rotation.z = shift * 0.09 + headContempt;
        _head.rotation.y = shift * 0.06 + headContempt * 0.45;
    }

    // Random idle dialogue — fires every ~60s if no dialogue is active
    if (t > _randomDialogueNextT && getAdminCharacter()) {
        _randomDialogueNextT = t + 55 + Math.random() * 35;
        const dlgEl = document.getElementById('dlg');
        if (!dlgEl || dlgEl.style.display !== 'block') {
            showCharacterDialogue('bigCombo', null, { silent: true });
        }
    }

    _r.render(_s, _cam);
}
