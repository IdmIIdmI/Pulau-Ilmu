
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// ======================================================
// MAGICAL JURASSIC KINGDOM
// Dinosaur Rescue Mission
// ======================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x83c9e9);
scene.fog = new THREE.Fog(0x83c9e9, 100, 260);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('game-container').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdff8ff, 0x385b32, 2.1));

const sun = new THREE.DirectionalLight(0xfff1c9, 2.8);
sun.position.set(-45, 80, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
scene.add(sun);

const fill = new THREE.PointLight(0x69dfff, 1.2, 100);
fill.position.set(0, 20, 0);
scene.add(fill);

const mat = (c, r = 0.8, extra = {}) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });

const box = (parent, w, h, d, material, x, y, z) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
};

const sphere = (parent, sx, sy, sz, material, x, y, z) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material);
    o.scale.set(sx, sy, sz);
    o.position.set(x, y, z);
    o.castShadow = true;
    parent.add(o);
    return o;
};

const grass = mat(0x397d37);
const grass2 = mat(0x68a947);
const wood = mat(0x704126);
const wood2 = mat(0xa87543);
const leaves = [
    mat(0x1b6532), mat(0x348d3e),
    mat(0x55a747), mat(0x83b84b)
];

// ======================================================
// WORLD
// ======================================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(250, 250),
    grass
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

for (let i = 0; i < 180; i++) {
    const patch = new THREE.Mesh(
        new THREE.CircleGeometry(THREE.MathUtils.randFloat(0.5, 2), 8),
        Math.random() > 0.5 ? grass2 : leaves[0]
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(
        THREE.MathUtils.randFloatSpread(210),
        -0.12,
        THREE.MathUtils.randFloatSpread(210)
    );
    scene.add(patch);
}

// River
const riverGeo = new THREE.PlaneGeometry(25, 230, 40, 120);
const water = new THREE.Mesh(
    riverGeo,
    mat(0x168fcb, 0.2, {
        transparent: true,
        opacity: 0.88,
        emissive: 0x073d64,
        emissiveIntensity: 0.3
    })
);
water.rotation.x = -Math.PI / 2;
water.position.y = 0.12;
scene.add(water);

const waterOriginal = riverGeo.attributes.position.array.slice();

// Bridge
const bridge = new THREE.Group();
scene.add(bridge);

for (let i = 0; i < 43; i++) {
    const x = -16 + i * 0.76;
    const plank = box(
        bridge, 0.72, 0.24, 6,
        i % 2 ? wood : wood2,
        x, 0.55 + Math.sin(i / 42 * Math.PI) * 0.2, 0
    );
}

for (const side of [-1, 1]) {
    for (const x of [-16, 16]) {
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 4.5, 10),
            wood
        );
        post.position.set(x, 2.6, side * 2.8);
        post.castShadow = true;
        bridge.add(post);
    }

    const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 33, 8),
        wood2
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 2.5, side * 2.8);
    bridge.add(rail);
}

// Trees and collision
const obstacles = [];
const trees = [];

function makeTree(x, z, scale = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(scale);

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.55, 5, 10),
        wood
    );
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    g.add(trunk);

    const crowns = [];

    for (let i = 0; i < 6; i++) {
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 10),
            leaves[i % 4]
        );
        crown.position.set(
            THREE.MathUtils.randFloatSpread(1.4),
            4 + i * 0.35,
            THREE.MathUtils.randFloatSpread(1.4)
        );
        crown.castShadow = true;
        g.add(crown);
        crowns.push(crown);
    }

    scene.add(g);
    trees.push({ group: g, crowns, phase: Math.random() * 6 });
    obstacles.push({ x, z, radius: 1.5 * scale });
}

for (let i = 0; i < 65; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    makeTree(
        side * THREE.MathUtils.randFloat(19, 48),
        THREE.MathUtils.randFloatSpread(200),
        THREE.MathUtils.randFloat(0.7, 1.4)
    );
}

// Colourful mountains
const mountainColors = [
    0x426c61, 0x597d69, 0x81917b,
    0x927b62, 0x687fa0, 0x8272a3
];

for (let i = 0; i < 18; i++) {
    const side = i % 2 ? 1 : -1;
    const size = THREE.MathUtils.randFloat(10, 18);
    const x = side * THREE.MathUtils.randFloat(52, 85);
    const z = THREE.MathUtils.randFloatSpread(190);

    const mountain = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.ConeGeometry(size, size * 1.8, 8),
        mat(mountainColors[i % mountainColors.length])
    );
    body.position.y = size * 0.85;
    body.castShadow = true;
    mountain.add(body);

    const snow = new THREE.Mesh(
        new THREE.ConeGeometry(size * 0.3, size * 0.55, 8),
        mat(0xe7f4f4)
    );
    snow.position.y = size * 1.55;
    mountain.add(snow);

    mountain.position.set(x, 0, z);
    scene.add(mountain);

    obstacles.push({ x, z, radius: size * 0.7 });
}

// Clouds
const clouds = [];

for (let i = 0; i < 16; i++) {
    const cloud = new THREE.Group();

    for (let j = 0; j < 5; j++) {
        sphere(
            cloud,
            2.5 + Math.random() * 2,
            1.2 + Math.random(),
            1.7,
            mat(0xffffff),
            j * 2 - 4,
            Math.random(),
            0
        );
    }

    cloud.position.set(
        THREE.MathUtils.randFloatSpread(180),
        THREE.MathUtils.randFloat(25, 42),
        THREE.MathUtils.randFloatSpread(180)
    );

    scene.add(cloud);
    clouds.push(cloud);
}

// ======================================================
// HERO CHARACTERS
// ======================================================

const heroes = {
    LALA: {
        color: 0x65c94c,
        belly: 0xc8e7a1,
        name: 'LALA – Wira Penyayang'
    },
    TORA: {
        color: 0xd96d37,
        belly: 0xf5c28c,
        name: 'TORA – Wira Berdaya Tahan'
    },
    'RAJA REX': {
        color: 0xd8a72c,
        belly: 0xffe7a0,
        name: 'RAJA REX – Wira Pemimpin'
    },
    BOBI: {
        color: 0x388fc7,
        belly: 0xb7e3ef,
        name: 'BOBI – Wira Warganegara Aktif'
    }
};

function makeDinosaur(type, small = false) {
    const data = heroes[type] || heroes.LALA;
    const g = new THREE.Group();

    const skin = mat(data.color);
    const belly = mat(data.belly);
    const white = mat(0xffffff);
    const black = mat(0x111111);

    const size = small ? 0.48 : 1;

    sphere(g, 1.05, 0.85, 1.45, skin, 0, 1.25, 0);
    sphere(g, 0.83, 0.55, 1.1, belly, 0, 0.95, -0.05);
    sphere(g, 0.55, 0.85, 0.55, skin, 0, 1.75, -0.9);
    sphere(g, 0.72, 0.68, 0.78, skin, 0, 2.35, -1.2);
    sphere(g, 0.5, 0.32, 0.55, skin, 0, 2.05, -1.72);

    for (const side of [-1, 1]) {
        sphere(g, 0.19, 0.2, 0.12, white, side * 0.48, 2.47, -1.67);
        sphere(g, 0.09, 0.11, 0.07, black, side * 0.49, 2.46, -1.78);
    }

    const legs = [];

    for (const side of [-1, 1]) {
        for (const front of [-1, 1]) {
            const leg = new THREE.Group();
            leg.position.set(
                side * 0.65,
                0.95,
                front === 1 ? 0.75 : -0.75
            );

            sphere(leg, 0.27, 0.62, 0.3, skin, 0, -0.25, 0);
            sphere(leg, 0.32, 0.18, 0.38, belly, 0, -0.68, -0.03);
            g.add(leg);
            legs.push(leg);
        }
    }

    const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 2.1, 10),
        skin
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 1.25, 1.75);
    g.add(tail);

    if (type === 'TORA') {
        for (const side of [-1, 1]) {
            const horn = new THREE.Mesh(
                new THREE.ConeGeometry(0.14, 0.9, 8),
                mat(0xf5e4c1)
            );
            horn.position.set(side * 0.65, 2.95, -1.25);
            horn.rotation.z = side * 0.45;
            g.add(horn);
        }
    }

    if (type === 'RAJA REX') {
        const crown = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.58, 0.35, 6),
            mat(0xffd43b, 0.3, { metalness: 0.5 })
        );
        crown.position.set(0, 3.03, -1.2);
        g.add(crown);
    }

    if (type === 'BOBI') {
        box(g, 0.65, 0.75, 0.35, mat(0x173f68), 0, 1.5, 0.95);
    }

    g.scale.setScalar(size);
    g.userData = { legs, tail, type };

    return g;
}

let player = null;
let selectedHero = 'LALA';
let gameStarted = false;

function setHero(type) {
    selectedHero = type;

    if (player) scene.remove(player);

    player = makeDinosaur(type);
    player.position.set(17, 0, 12);
    scene.add(player);

    const label = document.getElementById('hero-name');
    if (label) label.textContent = heroes[type].name;
}

setHero(selectedHero);

// ======================================================
// CRYSTALS
// ======================================================

const crystalColors = [
    0x24eaff, 0xb34bff, 0xff55b7,
    0x6aff9a, 0xffd447, 0x638cff
];

const crystals = [];

function makeCrystal(x, z, index) {
    const g = new THREE.Group();
    const color = crystalColors[index % crystalColors.length];
    const crystalMat = mat(color, 0.18, {
        emissive: color,
        emissiveIntensity: 0.8,
        metalness: 0.15
    });

    for (let i = 0; i < 5; i++) {
        const h = 2 + Math.random() * 2.5;

        const c = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.55, h, 6),
            crystalMat
        );

        const a = i / 5 * Math.PI * 2;
        c.position.set(Math.cos(a) * 0.8, h / 2, Math.sin(a) * 0.8);
        c.rotation.z = (Math.random() - 0.5) * 0.3;
        c.castShadow = true;
        g.add(c);
    }

    const glow = new THREE.PointLight(color, 2.5, 12);
    glow.position.y = 2;
    g.add(glow);

    g.position.set(x, 0, z);
    scene.add(g);

    crystals.push({
        group: g,
        collected: false,
        magnet: false,
        phase: Math.random() * 6
    });
}

[
    [-21, -65], [-25, -35], [-20, 28],
    [-26, 72], [-34, 48], [-40, -5],
    [21, -75], [24, -45], [20, 25],
    [27, 65], [35, 5], [42, 82]
].forEach((p, i) => makeCrystal(p[0], p[1], i));

// ======================================================
// BABY DINOSAUR RESCUE
// Babies disappear into magic pocket after rescue.
// They do NOT follow the player.
// ======================================================

const babies = [];
let rescued = 0;

function makeBaby(x, z, index) {
    const g = new THREE.Group();

    const baby = makeDinosaur('LALA', true);
    baby.position.y = 0;
    g.add(baby);

    // Magical rescue cage
    const cage = new THREE.Group();
    const cageMat = mat(0x80552e);

    for (let i = 0; i < 5; i++) {
        const bar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 2.5, 6),
            cageMat
        );
        const a = i / 5 * Math.PI * 2;
        bar.position.set(Math.cos(a) * 1.2, 1.25, Math.sin(a) * 1.2);
        cage.add(bar);
    }

    const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 0.12, 6),
        mat(0xb98a4e)
    );
    roof.position.y = 2.5;
    cage.add(roof);

    g.add(cage);
    g.position.set(x, 0, z);
    scene.add(g);

    babies.push({
        group: g,
        baby,
        rescued: false,
        phase: index
    });
}

[
    [-32, -50],
    [34, -20],
    [35, 48],
    [-40, 75],
    [48, 85]
].forEach((p, i) => makeBaby(p[0], p[1], i));

// ======================================================
// ENEMIES
// ======================================================

const enemies = [];

function makeEnemy(x, z, boss = false) {
    const g = new THREE.Group();

    const skin = mat(boss ? 0x542b83 : 0x526b35);
    const belly = mat(boss ? 0xb78bd4 : 0xc4b58a);
    const black = mat(0x111111);
    const eye = mat(0xff382b, 0.3, { emissive: 0xff1100 });

    sphere(g, boss ? 1.7 : 0.9, boss ? 1.4 : 0.8, boss ? 2 : 1.3, skin, 0, 1.4, 0);
    sphere(g, 0.7, 0.7, 0.7, skin, 0, 2.1, -1.2);
    sphere(g, 0.6, 0.3, 0.6, belly, 0, 1.1, -0.3);

    for (const side of [-1, 1]) {
        sphere(g, 0.12, 0.12, 0.08, eye, side * 0.45, 2.2, -1.65);
    }

    const legs = [];

    for (const side of [-1, 1]) {
        const leg = new THREE.Group();
        leg.position.set(side * 0.5, 0.9, 0.5);
        sphere(leg, 0.25, 0.55, 0.28, skin, 0, -0.3, 0);
        g.add(leg);
        legs.push(leg);
    }

    const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 2, 8),
        skin
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 1.3, 1.5);
    g.add(tail);

    g.position.set(x, 0, z);
    scene.add(g);

    enemies.push({
        group: g,
        legs,
        health: boss ? 8 : 3,
        boss,
        stunned: 0,
        retreat: 0,
        phase: Math.random() * 5,
        alive: true
    });
}

makeEnemy(-35, -25);
makeEnemy(40, 15);
makeEnemy(-43, 60);
makeEnemy(50, 70);
makeEnemy(0, -95, true);

// ======================================================
// MISSIONS
// ======================================================

let collected = 0;
let distanceWalked = 0;
let crossedBridge = false;
let missionDone = new Set();

const missionNames = [
    'Selamatkan 3 anak dinosaur',
    'Selamatkan 5 anak dinosaur',
    'Halau dinosaur musuh',
    'Seberangi jambatan',
    'Kumpul 3 kristal ajaib',
    'Kumpul 6 kristal ajaib',
    'Kalahkan dinosaur ketua'
];

const missionItems = [...document.querySelectorAll('.mission-item')];

function completeMission(index) {
    if (missionDone.has(index)) return;

    missionDone.add(index);

    if (missionItems[index]) {
        missionItems[index].style.display = 'none';
    }

    showMessage('⭐ Misi selesai!');
}

function updateMissions() {
    if (rescued >= 3) completeMission(0);
    if (rescued >= 5) completeMission(1);
    if (enemies.every(e => !e.alive)) completeMission(2);
    if (crossedBridge) completeMission(3);
    if (collected >= 3) completeMission(4);
    if (collected >= 6) completeMission(5);

    const boss = enemies.find(e => e.boss);
    if (boss && !boss.alive) completeMission(6);

    missionItems.forEach((item, i) => {
        if (missionNames[i] && !missionDone.has(i)) {
            item.textContent = '☆ ' + missionNames[i];
            item.style.display = '';
        }
    });
}

// ======================================================
// MENU
// ======================================================

const mainMenu = document.getElementById('main-menu');
const characterMenu = document.getElementById('character-menu');
const gameHud = document.getElementById('game-hud');
const startButton = document.getElementById('start-button');
const playButton = document.getElementById('play-button');

if (characterMenu) characterMenu.style.display = 'none';
if (gameHud) gameHud.style.display = 'none';

if (startButton) {
    startButton.addEventListener('click', () => {
        if (mainMenu) mainMenu.style.display = 'none';
        if (characterMenu) characterMenu.style.display = 'flex';
    });
}

document.querySelectorAll('[data-hero]').forEach(button => {
    button.addEventListener('click', () => {
        const type = button.dataset.hero;

        if (heroes[type]) setHero(type);

        document.querySelectorAll('[data-hero]').forEach(b => {
            b.style.outline = '';
        });

        button.style.outline = '3px solid white';
    });
});

if (playButton) {
    playButton.addEventListener('click', () => {
        if (characterMenu) characterMenu.style.display = 'none';
        if (gameHud) gameHud.style.display = 'block';

        gameStarted = true;
        showMessage('Misi bermula! Selamatkan anak dinosaur!');
    });
}

// ======================================================
// MESSAGE DISPLAY
// ======================================================

function showMessage(message) {
    const indicator = document.getElementById('voice-indicator');

    if (indicator) {
        indicator.textContent = message;
        indicator.style.display = 'block';
    }
}

// ======================================================
// MOBILE CONTROLS
// ======================================================

const touchControls = document.getElementById('touch-controls');

if (touchControls) {
    touchControls.innerHTML = `
      <div class="virtual-joystick" id="virtual-joystick">
        <div class="joystick-knob" id="joystick-knob"></div>
      </div>

      <div class="right-game-controls">
        <button class="jump-control" id="joystick-jump">LOMPAT</button>
        <button class="magic-control" id="joystick-magic">✦ SIHIR</button>
        <button class="shield-control" id="joystick-shield">PERISAI</button>
        <button class="lightning-control" id="joystick-lightning">PETIR</button>
      </div>
    `;
}

const controlStyle = document.createElement('style');

controlStyle.textContent = `
#touch-controls {
    position:absolute;
    inset:auto 0 16px;
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
    padding:0 22px;
    pointer-events:none;
    z-index:20;
}

.virtual-joystick {
    width:118px;
    height:118px;
    border:3px solid #ffffff85;
    border-radius:50%;
    background:radial-gradient(circle,#42677b99,#102d43dd);
    box-shadow:0 5px 18px #0008,inset 0 0 15px #ffffff22;
    display:flex;
    align-items:center;
    justify-content:center;
    position:relative;
    pointer-events:auto;
    touch-action:none;
}

.joystick-knob {
    width:52px;
    height:52px;
    border:3px solid #ffffffb0;
    border-radius:50%;
    background:linear-gradient(145deg,#e8faff,#5486a2);
    box-shadow:0 4px 12px #0008;
    position:absolute;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
    pointer-events:none;
}

.right-game-controls {
    display:flex;
    flex-direction:column;
    gap:6px;
    align-items:center;
    pointer-events:auto;
}

.right-game-controls button {
    width:65px;
    height:65px;
    border:3px solid #ffffffa0;
    border-radius:50%;
    color:white;
    font:900 10px Arial,sans-serif;
    box-shadow:0 5px 15px #0008;
    touch-action:none;
}

.jump-control {
    background:radial-gradient(circle at 35% 30%,#ffcf68,#bd5d25);
}

.magic-control {
    background:radial-gradient(circle at 35% 30%,#e5aaff,#6637b8);
}

.shield-control {
    background:radial-gradient(circle at 35% 30%,#8eeaff,#1764a0);
}

.lightning-control {
    background:radial-gradient(circle at 35% 30%,#fff08a,#a66a00);
}

.right-game-controls button:active {
    transform:scale(.9);
}

@media(max-height:430px) {
    .virtual-joystick {width:95px;height:95px}
    .joystick-knob {width:43px;height:43px}
    .right-game-controls button {width:53px;height:53px}
}
`;

document.head.appendChild(controlStyle);

// Hide old touch controls and any old sound button if present
const oldSound = document.getElementById('sound-toggle');
if (oldSound) oldSound.style.display = 'none';

const joystick = document.getElementById('virtual-joystick');
const knob = document.getElementById('joystick-knob');

const jumpButton = document.getElementById('joystick-jump');
const magicButton = document.getElementById('joystick-magic');
const shieldButton = document.getElementById('joystick-shield');
const lightningButton = document.getElementById('joystick-lightning');

let stickX = 0;
let stickY = 0;
let pointerId = null;

let jumpTime = 0;
let magicCooldown = 0;
let shieldTime = 0;
let lightningCooldown = 0;

const keys = {};

function resetStick() {
    pointerId = null;
    stickX = 0;
    stickY = 0;

    if (knob) {
        knob.style.transform = 'translate(-50%,-50%)';
    }
}

function moveStick(e) {
    if (!joystick || !knob || pointerId !== e.pointerId) return;

    const r = joystick.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    let dx = e.clientX - cx;
    let dy = e.clientY - cy;

    const max = r.width * 0.32;
    const len = Math.hypot(dx, dy);

    if (len > max) {
        dx = dx / len * max;
        dy = dy / len * max;
    }

    stickX = dx / max;
    stickY = dy / max;

    knob.style.transform =
        `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
}

if (joystick) {
    joystick.addEventListener('pointerdown', e => {
        e.preventDefault();
        pointerId = e.pointerId;
        joystick.setPointerCapture(pointerId);
        moveStick(e);
    });

    joystick.addEventListener('pointermove', moveStick);
    joystick.addEventListener('pointerup', resetStick);
    joystick.addEventListener('pointercancel', resetStick);
}

if (jumpButton) {
    jumpButton.addEventListener('pointerdown', e => {
        e.preventDefault();
        jumpTime = 0.65;
    });
}

// Keyboard support
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// ======================================================
// MAGIC ATTACK
// ======================================================

const magicBolts = [];

function castMagic() {
    if (!gameStarted || !player || magicCooldown > 0) return;

    magicCooldown = 0.65;

    const bolt = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 12),
        new THREE.MeshBasicMaterial({
            color: 0xd69aff
        })
    );

    const direction = new THREE.Vector3(
        -Math.sin(player.rotation.y),
        0,
        -Math.cos(player.rotation.y)
    );

    bolt.position.copy(player.position);
    bolt.position.y += 2;

    scene.add(bolt);

    magicBolts.push({
        mesh: bolt,
        direction,
        life: 1.2
    });

    const light = new THREE.PointLight(0xc56bff, 4, 12);
    bolt.add(light);
}

if (magicButton) {
    magicButton.addEventListener('pointerdown', e => {
        e.preventDefault();
        castMagic();
    });
}

// ======================================================
// MAGIC SHIELD
// ======================================================

let shieldMesh = null;

if (shieldButton) {
    shieldButton.addEventListener('pointerdown', e => {
        e.preventDefault();

        if (!gameStarted || shieldTime > 0) return;

        shieldTime = 4;

        if (shieldMesh) scene.remove(shieldMesh);

        shieldMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 24, 18),
            new THREE.MeshBasicMaterial({
                color: 0x55dfff,
                transparent: true,
                opacity: 0.25,
                wireframe: true
            })
        );

        scene.add(shieldMesh);
        showMessage('🛡️ Perisai ajaib aktif!');
    });
}

// ======================================================
// LIGHTNING SPECIAL ATTACK
// ======================================================

function castLightning() {
    if (!gameStarted || lightningCooldown > 0 || !player) return;

    lightningCooldown = 7;

    const flash = new THREE.PointLight(0xffed64, 14, 35);
    flash.position.set(player.position.x, 8, player.position.z);
    scene.add(flash);

    setTimeout(() => scene.remove(flash), 450);

    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        const distance = enemy.group.position.distanceTo(player.position);

        if (distance < 23) {
            enemy.stunned = 3;
            enemy.health -= 2;

            if (enemy.health <= 0) defeatEnemy(enemy);
        }
    });

    showMessage('⚡ PETIR AJAIB! Musuh terhenti!');
}

if (lightningButton) {
    lightningButton.addEventListener('pointerdown', e => {
        e.preventDefault();
        castLightning();
    });
}

// ======================================================
// ENEMY DEFEAT
// ======================================================

function defeatEnemy(enemy) {
    if (!enemy.alive) return;

    enemy.alive = false;
    enemy.group.visible = false;

    showMessage('✨ Musuh berjaya dihalau!');
    updateMissions();
}

// ======================================================
// COLLISION AND BRIDGE
// ======================================================

function onBridge(x, z) {
    return Math.abs(x) < 19 && Math.abs(z) < 3.8;
}

function canMoveTo(x, z) {
    // River crossing only at bridge
    if (Math.abs(x) < 12.5 && !onBridge(x, z)) return false;

    for (const o of obstacles) {
        if (Math.hypot(x - o.x, z - o.z) < o.radius + 0.9) {
            return false;
        }
    }

    return Math.abs(x) < 100 && Math.abs(z) < 110;
}

// ======================================================
// RESCUE BABIES
// ======================================================

function updateRescues() {
    if (!player || !gameStarted) return;

    babies.forEach(b => {
        if (b.rescued) return;

        const distance = b.group.position.distanceTo(player.position);

        if (distance < 3.5) {
            // Baby and cage disappear into magic pocket
            b.rescued = true;
            b.group.visible = false;
            rescued++;

            showMessage(`💖 Anak dinosaur diselamatkan! ${rescued}/5`);
            updateMissions();
        }
    });
}

// ======================================================
// ENEMY MOVEMENT AND COMBAT
// ======================================================

function updateEnemies(delta, time) {
    if (!player || !gameStarted) return;

    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        if (enemy.stunned > 0) {
            enemy.stunned -= delta;
            enemy.group.rotation.z = Math.sin(time * 18) * 0.12;
            return;
        }

        const dx = player.position.x - enemy.group.position.x;
        const dz = player.position.z - enemy.group.position.z;
        const distance = Math.hypot(dx, dz);

        if (distance < 28 && distance > 3.5) {
            const speed = enemy.boss ? 2.8 : 4.2;

            const nx = enemy.group.position.x + dx / distance * speed * delta;
            const nz = enemy.group.position.z + dz / distance * speed * delta;

            enemy.group.position.x = nx;
            enemy.group.position.z = nz;

            enemy.group.rotation.y = Math.atan2(-dx, -dz);

            enemy.legs.forEach((leg, i) => {
                leg.rotation.x = Math.sin(time * 9 + i * 3) * 0.5;
            });
        }

        // Shield pushes enemies away
        if (shieldTime > 0 && distance < 4.5) {
            enemy.group.position.x -= dx / Math.max(distance, 0.1) * 0.35;
            enemy.group.position.z -= dz / Math.max(distance, 0.1) * 0.35;
        }

        // Enemy contact: no blood or graphic violence
        if (distance < 2.5 && shieldTime <= 0) {
            enemy.retreat = 1.5;
            enemy.group.position.x -= dx / Math.max(distance, 0.1) * 0.25;
            enemy.group.position.z -= dz / Math.max(distance, 0.1) * 0.25;
        }
    });
}

function updateMagicBolts(delta) {
    for (let i = magicBolts.length - 1; i >= 0; i--) {
        const bolt = magicBolts[i];

        bolt.mesh.position.addScaledVector(bolt.direction, 28 * delta);
        bolt.life -= delta;

        enemies.forEach(enemy => {
            if (!enemy.alive) return;

            if (bolt.mesh.position.distanceTo(enemy.group.position.clone().add(new THREE.Vector3(0, 1.5, 0))) < 3) {
                enemy.health -= 1;
                enemy.stunned = 1.2;

                if (enemy.health <= 0) defeatEnemy(enemy);

                bolt.life = 0;
            }
        });

        if (bolt.life <= 0) {
            scene.remove(bolt.mesh);
            magicBolts.splice(i, 1);
        }
    }
}

// ======================================================
// PLAYER MOVEMENT - CAMERA RELATIVE 360 DEGREE TURNING
// ======================================================

let playerAngle = 0;

function lerpAngle(a, b, t) {
    const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + diff * t;
}

function updatePlayer(delta, time) {
    if (!gameStarted || !player) return;

    let inputX = stickX;
    let inputY = stickY;

    if (keys.a || keys.arrowleft) inputX = -1;
    if (keys.d || keys.arrowright) inputX = 1;
    if (keys.w || keys.arrowup) inputY = -1;
    if (keys.s || keys.arrowdown) inputY = 1;

    // Camera is behind player, so forward is toward negative Z.
    // Convert joystick movement into camera-relative world direction.
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    const move = new THREE.Vector3()
        .addScaledVector(right, inputX)
        .addScaledVector(forward, -inputY);

    const moving = move.lengthSq() > 0.04;

    if (moving) {
        move.normalize();

        const targetAngle = Math.atan2(-move.x, -move.z);

        // Smooth full 360 degree turning
        playerAngle = lerpAngle(
            playerAngle,
            targetAngle,
            Math.min(delta * 9, 1)
        );

        player.rotation.y = playerAngle;

        const speed = 9.5;
        const nx = player.position.x + move.x * speed * delta;
        const nz = player.position.z + move.z * speed * delta;

        if (canMoveTo(nx, player.position.z)) {
            player.position.x = nx;
        }

        if (canMoveTo(player.position.x, nz)) {
            player.position.z = nz;
        }

        distanceWalked += speed * delta;
    }

    const bridgeHeight = onBridge(
        player.position.x,
        player.position.z
    ) ? 0.65 : 0;

    if (jumpTime > 0) {
        jumpTime -= delta;

        const progress = 1 - jumpTime / 0.65;
        player.position.y =
            bridgeHeight + Math.sin(progress * Math.PI) * 2.3;
    } else {
        player.position.y = bridgeHeight;
    }

    // Walking animation
    player.userData.legs.forEach((leg, i) => {
        leg.rotation.x = moving
            ? Math.sin(time * 10 + i * Math.PI) * 0.55
            : Math.sin(time * 2 + i) * 0.02;
    });

    player.userData.tail.rotation.z = Math.sin(time * 3) * 0.15;

    if (onBridge(player.position.x, player.position.z)) {
        crossedBridge = true;
    }

    updateRescues();
    updateMissions();

    // Smooth follow camera, elevated view
    const cameraTarget = new THREE.Vector3(
        player.position.x,
        39,
        player.position.z + 23
    );

    camera.position.lerp(cameraTarget, Math.min(delta * 3, 1));
    camera.lookAt(
        player.position.x,
        player.position.y + 0.5,
        player.position.z
    );

    if (shieldMesh) {
        shieldMesh.position.set(
            player.position.x,
            player.position.y + 1.5,
            player.position.z
        );
    }
}

// ======================================================
// CRYSTAL COLLECTION AND MAGIC PULL
// ======================================================

function updateCrystals(time, delta) {
    crystals.forEach(c => {
        if (c.collected) return;

        c.group.rotation.y = Math.sin(time * 0.5 + c.phase) * 0.12;
        c.group.position.y = 0.25 + Math.sin(time * 2 + c.phase) * 0.15;

        if (!player || !gameStarted) return;

        const target = new THREE.Vector3(
            player.position.x,
            player.position.y + 1,
            player.position.z
        );

        const distance = c.group.position.distanceTo(target);

        // Magic automatically pulls nearby crystals
        if (distance < 23) c.magnet = true;

        if (c.magnet) {
            c.group.position.lerp(target, Math.min(delta * 3.5, 1));
        }

        if (distance < 2.5) {
            c.collected = true;
            c.group.visible = false;
            collected++;

            showMessage(`💎 Kristal diperoleh! ${collected}`);
            updateMissions();
        }
    });
}

// ======================================================
// ANIMATION
// ======================================================

function animateWorld(time, delta) {
    // Moving water
    const pos = riverGeo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const x = waterOriginal[i * 3];
        const y = waterOriginal[i * 3 + 1];

        pos.array[i * 3 + 2] =
            waterOriginal[i * 3 + 2] +
            Math.sin(x * 0.5 + time * 2) * 0.12 +
            Math.sin(y * 0.18 - time * 1.5) * 0.1;
    }

    pos.needsUpdate = true;
    riverGeo.computeVertexNormals();

    // Trees sway gently
    trees.forEach(t => {
        t.group.rotation.z = Math.sin(time + t.phase) * 0.025;

        t.crowns.forEach((c, i) => {
            c.rotation.z = Math.sin(time * 1.5 + i) * 0.035;
        });
    });

    // Clouds drift
    clouds.forEach(c => {
        c.position.x += delta * 0.45;

        if (c.position.x > 110) c.position.x = -110;
    });

    // Babies move slightly while waiting for rescue
    babies.forEach(b => {
        if (!b.rescued) {
            b.baby.position.y = Math.sin(time * 2 + b.phase) * 0.08;
        }
    });
}

function updateCooldowns(delta) {
    magicCooldown = Math.max(0, magicCooldown - delta);
    lightningCooldown = Math.max(0, lightningCooldown - delta);

    if (shieldTime > 0) {
        shieldTime -= delta;

        if (shieldTime <= 0 && shieldMesh) {
            scene.remove(shieldMesh);
            shieldMesh = null;
            showMessage('Perisai tamat.');
        }
    }
}

// ======================================================
// START GAME LOOP
// ======================================================

camera.position.set(17, 40, 35);
camera.lookAt(17, 0, 12);

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.04);
    const time = clock.elapsedTime;

    animateWorld(time, delta);
    updatePlayer(delta, time);
    updateCrystals(time, delta);
    updateEnemies(delta, time);
    updateMagicBolts(delta);
    updateCooldowns(delta);

    renderer.render(scene, camera);
}

animate();

// ======================================================
// RESIZE
// ======================================================

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
});
