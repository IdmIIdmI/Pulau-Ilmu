
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// =====================================================
// MAGICAL JURASSIC KINGDOM
// =====================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x83c9e9);
scene.fog = new THREE.Fog(0x83c9e9, 110, 270);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById('game-container').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe5f8ff, 0x385b32, 2));

const sun = new THREE.DirectionalLight(0xfff1d0, 2.5);
sun.position.set(-45, 80, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const fillLight = new THREE.PointLight(0x69dfff, 1.2, 100);
fillLight.position.set(0, 20, 0);
scene.add(fillLight);

const material = (color, roughness = 0.8, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function makeSphere(parent, sx, sy, sz, mat, x, y, z) {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 12),
        mat
    );
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
}

function makeBox(parent, w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        mat
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}

// =====================================================
// SUARA DAN MUZIK
// =====================================================

let audioContext = null;
let audioReady = false;
let musicTimer = null;
let musicStep = 0;
let voiceEnabled = true;

function prepareAudio() {
    if (audioReady) {
        if (audioContext?.state === 'suspended') audioContext.resume();
        return;
    }

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioReady = true;
        audioContext.resume();
        startMusic();
    } catch (e) {
        console.warn('Audio tidak tersedia:', e);
    }
}

function playTone(frequency, duration = 0.2, type = 'sine', volume = 0.07) {
    if (!audioContext || !audioReady) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {}
}

function startMusic() {
    if (musicTimer) return;

    const notes = [392, 440, 523, 440, 349, 392, 440, 523, 587, 523, 440, 392];

    musicTimer = setInterval(() => {
        if (!audioReady || !audioContext || audioContext.state !== 'running') return;

        playTone(notes[musicStep % notes.length], 0.3, 'sine', 0.025);
        musicStep++;
    }, 420);
}

function playJumpSound() {
    playTone(420, 0.15, 'sine', 0.08);
    playTone(650, 0.18, 'sine', 0.05);
}

function playMagicSound() {
    playTone(520, 0.2, 'triangle', 0.08);
    setTimeout(() => playTone(780, 0.25, 'sine', 0.06), 100);
}

function playCrystalSound() {
    playTone(880, 0.15, 'sine', 0.08);
    setTimeout(() => playTone(1175, 0.3, 'sine', 0.06), 100);
}

function playSuccessSound() {
    [523, 659, 784].forEach((n, i) => {
        setTimeout(() => playTone(n, 0.3, 'sine', 0.07), i * 150);
    });
}

// Suara percakapan Bahasa Melayu
function speakMalay(message) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = 'ms-MY';
    speech.rate = 0.9;
    speech.pitch = 1.12;
    speech.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const malayVoice = voices.find(v =>
        v.lang.toLowerCase().startsWith('ms')
    );

    if (malayVoice) speech.voice = malayVoice;

    window.speechSynthesis.speak(speech);
}

// Sembunyikan butang bunyi sahaja, bukan sistem audio
const oldSoundButton = document.getElementById('sound-toggle');
if (oldSoundButton) oldSoundButton.style.display = 'none';

// =====================================================
// DUNIA PERMAINAN
// =====================================================

const groundMaterial = material(0x397d37);
const grassMaterial = material(0x68a947);
const trunkMaterial = material(0x704126);
const leafMaterials = [
    material(0x1b6532),
    material(0x348d3e),
    material(0x55a747),
    material(0x83b84b)
];

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(250, 250),
    groundMaterial
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

// Tompok rumput
for (let i = 0; i < 150; i++) {
    const patch = new THREE.Mesh(
        new THREE.CircleGeometry(THREE.MathUtils.randFloat(0.5, 2), 8),
        grassMaterial
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(
        THREE.MathUtils.randFloatSpread(210),
        -0.12,
        THREE.MathUtils.randFloatSpread(210)
    );
    scene.add(patch);
}

// Sungai
const riverGeometry = new THREE.PlaneGeometry(25, 230, 40, 120);
const waterMaterial = material(0x168fcb, 0.2, {
    transparent: true,
    opacity: 0.88,
    emissive: 0x073d64,
    emissiveIntensity: 0.3
});

const water = new THREE.Mesh(riverGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = 0.12;
scene.add(water);

const originalWater = riverGeometry.attributes.position.array.slice();

// Jambatan kayu
const bridge = new THREE.Group();
scene.add(bridge);

for (let i = 0; i < 43; i++) {
    const x = -16 + i * 0.76;
    makeBox(
        bridge, 0.72, 0.24, 6,
        i % 2 ? trunkMaterial : material(0xa87543),
        x, 0.55 + Math.sin(i / 42 * Math.PI) * 0.2, 0
    );
}

for (const side of [-1, 1]) {
    for (const x of [-16, 16]) {
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 4.5, 10),
            trunkMaterial
        );
        post.position.set(x, 2.6, side * 2.8);
        bridge.add(post);
    }

    const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 33, 8),
        material(0xa87543)
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 2.5, side * 2.8);
    bridge.add(rail);
}

// Pokok dan halangan
const obstacles = [];
const trees = [];

function makeTree(x, z, scale = 1) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.55, 5, 10),
        trunkMaterial
    );
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    group.add(trunk);

    const crowns = [];

    for (let i = 0; i < 6; i++) {
        const crown = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 10),
            leafMaterials[i % 4]
        );
        crown.position.set(
            THREE.MathUtils.randFloatSpread(1.4),
            4 + i * 0.35,
            THREE.MathUtils.randFloatSpread(1.4)
        );
        crown.castShadow = true;
        group.add(crown);
        crowns.push(crown);
    }

    scene.add(group);
    trees.push({ group, crowns, phase: Math.random() * 6 });
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

// Gunung berwarna
const mountainColors = [
    0x426c61, 0x597d69, 0x81917b,
    0x927b62, 0x687fa0, 0x8272a3
];

for (let i = 0; i < 18; i++) {
    const size = THREE.MathUtils.randFloat(10, 18);
    const x = (i % 2 ? 1 : -1) * THREE.MathUtils.randFloat(52, 85);
    const z = THREE.MathUtils.randFloatSpread(190);

    const mountain = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.ConeGeometry(size, size * 1.8, 8),
        material(mountainColors[i % mountainColors.length])
    );
    body.position.y = size * 0.85;
    body.castShadow = true;
    mountain.add(body);

    const snow = new THREE.Mesh(
        new THREE.ConeGeometry(size * 0.3, size * 0.55, 8),
        material(0xe7f4f4)
    );
    snow.position.y = size * 1.55;
    mountain.add(snow);

    mountain.position.set(x, 0, z);
    scene.add(mountain);
    obstacles.push({ x, z, radius: size * 0.7 });
}

// Awan bergerak
const clouds = [];

for (let i = 0; i < 16; i++) {
    const cloud = new THREE.Group();

    for (let j = 0; j < 5; j++) {
        makeSphere(
            cloud,
            2.5 + Math.random() * 2,
            1.2 + Math.random(),
            1.7,
            material(0xffffff),
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

// =====================================================
// WATAK UTAMA
// =====================================================

const heroes = {
    LALA: { color: 0x65c94c, belly: 0xc8e7a1, name: 'LALA – Wira Penyayang' },
    TORA: { color: 0xd96d37, belly: 0xf5c28c, name: 'TORA – Wira Berdaya Tahan' },
    'RAJA REX': { color: 0xd8a72c, belly: 0xffe7a0, name: 'RAJA REX – Wira Pemimpin' },
    BOBI: { color: 0x388fc7, belly: 0xb7e3ef, name: 'BOBI – Wira Warganegara Aktif' }
};

function makeDinosaur(type, small = false) {
    const data = heroes[type] || heroes.LALA;
    const group = new THREE.Group();
    const skin = material(data.color);
    const belly = material(data.belly);
    const white = material(0xffffff);
    const black = material(0x111111);

    makeSphere(group, 1.05, 0.85, 1.45, skin, 0, 1.25, 0);
    makeSphere(group, 0.83, 0.55, 1.1, belly, 0, 0.95, -0.05);
    makeSphere(group, 0.55, 0.85, 0.55, skin, 0, 1.75, -0.9);
    makeSphere(group, 0.72, 0.68, 0.78, skin, 0, 2.35, -1.2);
    makeSphere(group, 0.5, 0.32, 0.55, skin, 0, 2.05, -1.72);

    for (const side of [-1, 1]) {
        makeSphere(group, 0.19, 0.2, 0.12, white, side * 0.48, 2.47, -1.67);
        makeSphere(group, 0.09, 0.11, 0.07, black, side * 0.49, 2.46, -1.78);
    }

    const legs = [];

    for (const side of [-1, 1]) {
        for (const front of [-1, 1]) {
            const leg = new THREE.Group();
            leg.position.set(side * 0.65, 0.95, front === 1 ? 0.75 : -0.75);
            makeSphere(leg, 0.27, 0.62, 0.3, skin, 0, -0.25, 0);
            makeSphere(leg, 0.32, 0.18, 0.38, belly, 0, -0.68, -0.03);
            group.add(leg);
            legs.push(leg);
        }
    }

    const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 2.1, 10),
        skin
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 1.25, 1.75);
    group.add(tail);

    if (type === 'TORA') {
        for (const side of [-1, 1]) {
            const horn = new THREE.Mesh(
                new THREE.ConeGeometry(0.14, 0.9, 8),
                material(0xf5e4c1)
            );
            horn.position.set(side * 0.65, 2.95, -1.25);
            horn.rotation.z = side * 0.45;
            group.add(horn);
        }
    }

    if (type === 'RAJA REX') {
        const crown = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.58, 0.35, 6),
            material(0xffd43b, 0.3, { metalness: 0.5 })
        );
        crown.position.set(0, 3.03, -1.2);
        group.add(crown);
    }

    if (type === 'BOBI') {
        makeBox(group, 0.65, 0.75, 0.35, material(0x173f68), 0, 1.5, 0.95);
    }

    group.scale.setScalar(small ? 0.48 : 1);
    group.userData = { legs, tail, type };
    return group;
}

let player = null;
let selectedHero = 'LALA';
let gameStarted = false;
let playerAngle = 0;

function setHero(type) {
    if (!heroes[type]) return;

    selectedHero = type;

    if (player) scene.remove(player);

    player = makeDinosaur(type);
    player.position.set(17, 0, 12);
    scene.add(player);

    const label = document.getElementById('hero-name');
    if (label) label.textContent = heroes[type].name;
}

setHero(selectedHero);

// =====================================================
// MENU
// =====================================================

const mainMenu = document.getElementById('main-menu');
const characterMenu = document.getElementById('character-menu');
const gameHud = document.getElementById('game-hud');

if (characterMenu) characterMenu.style.display = 'none';
if (gameHud) gameHud.style.display = 'none';

function showMessage(message, speak = true) {
    const indicator = document.getElementById('voice-indicator');

    if (indicator) {
        indicator.textContent = message;
        indicator.style.display = 'block';
    }

    if (speak) speakMalay(message);
}

const startButton = document.getElementById('start-button');
const playButton = document.getElementById('play-button');

if (startButton) {
    startButton.addEventListener('click', () => {
        prepareAudio();

        if (mainMenu) mainMenu.style.display = 'none';
        if (characterMenu) characterMenu.style.display = 'flex';

        speakMalay('Selamat datang ke Magical Jurassic Kingdom. Pilih wira kamu.');
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
        playTone(600, 0.12);
    });
});

if (playButton) {
    playButton.addEventListener('click', () => {
        prepareAudio();

        if (characterMenu) characterMenu.style.display = 'none';
        if (gameHud) gameHud.style.display = 'block';

        gameStarted = true;
        showMessage('Misi bermula! Mari selamatkan anak dinosaur!');
        playSuccessSound();
    });
}

// =====================================================
// KRISTAL AJAIB
// =====================================================

const crystalColors = [
    0x24eaff, 0xb34bff, 0xff55b7,
    0x6aff9a, 0xffd447, 0x638cff
];

const crystals = [];

function makeCrystal(x, z, index) {
    const group = new THREE.Group();
    const color = crystalColors[index % crystalColors.length];

    const crystalMat = material(color, 0.18, {
        emissive: color,
        emissiveIntensity: 0.8,
        metalness: 0.15
    });

    for (let i = 0; i < 5; i++) {
        const h = 2 + Math.random() * 2.5;
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.55, h, 6),
            crystalMat
        );

        const angle = i / 5 * Math.PI * 2;
        mesh.position.set(Math.cos(angle) * 0.8, h / 2, Math.sin(angle) * 0.8);
        mesh.castShadow = true;
        group.add(mesh);
    }

    const glow = new THREE.PointLight(color, 2.5, 12);
    glow.position.y = 2;
    group.add(glow);

    group.position.set(x, 0, z);
    scene.add(group);

    crystals.push({
        group,
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

// =====================================================
// ANAK DINOSAUR UNTUK DISELAMATKAN
// =====================================================

const babies = [];
let rescued = 0;

function makeBaby(x, z, index) {
    const group = new THREE.Group();
    const baby = makeDinosaur('LALA', true);
    group.add(baby);

    const cage = new THREE.Group();
    const cageMaterial = material(0x80552e);

    for (let i = 0; i < 5; i++) {
        const bar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 2.5, 6),
            cageMaterial
        );
        const angle = i / 5 * Math.PI * 2;
        bar.position.set(Math.cos(angle) * 1.2, 1.25, Math.sin(angle) * 1.2);
        cage.add(bar);
    }

    const roof = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.4, 0.12, 6),
        material(0xb98a4e)
    );
    roof.position.y = 2.5;
    cage.add(roof);
    group.add(cage);

    group.position.set(x, 0, z);
    scene.add(group);

    babies.push({ group, baby, rescued: false, phase: index });
}

[
    [-32, -50],
    [34, -20],
    [35, 48],
    [-40, 75],
    [48, 85]
].forEach((p, i) => makeBaby(p[0], p[1], i));

// =====================================================
// MUSUH
// =====================================================

const enemies = [];

function makeEnemy(x, z, boss = false) {
    const group = new THREE.Group();
    const skin = material(boss ? 0x542b83 : 0x526b35);
    const belly = material(boss ? 0xb78bd4 : 0xc4b58a);
    const eye = material(0xff382b, 0.3, { emissive: 0xff1100 });

    makeSphere(group, boss ? 1.7 : 0.9, boss ? 1.4 : 0.8, boss ? 2 : 1.3, skin, 0, 1.4, 0);
    makeSphere(group, 0.7, 0.7, 0.7, skin, 0, 2.1, -1.2);
    makeSphere(group, 0.6, 0.3, 0.6, belly, 0, 1.1, -0.3);

    for (const side of [-1, 1]) {
        makeSphere(group, 0.12, 0.12, 0.08, eye, side * 0.45, 2.2, -1.65);
    }

    const legs = [];

    for (const side of [-1, 1]) {
        const leg = new THREE.Group();
        leg.position.set(side * 0.5, 0.9, 0.5);
        makeSphere(leg, 0.25, 0.55, 0.28, skin, 0, -0.3, 0);
        group.add(leg);
        legs.push(leg);
    }

    const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 2, 8),
        skin
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.set(0, 1.3, 1.5);
    group.add(tail);

    group.position.set(x, 0, z);
    scene.add(group);

    enemies.push({
        group,
        legs,
        health: boss ? 8 : 3,
        boss,
        stunned: 0,
        alive: true
    });
}

makeEnemy(-35, -25);
makeEnemy(40, 15);
makeEnemy(-43, 60);
makeEnemy(50, 70);
makeEnemy(0, -95, true);

// =====================================================
// MISI
// =====================================================

let collected = 0;
let crossedBridge = false;
const missionDone = new Set();

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

    if (missionItems[index]) missionItems[index].style.display = 'none';

    showMessage('Tahniah! Misi berjaya diselesaikan!');
    playSuccessSound();
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

// =====================================================
// KAWALAN TELEFON
// =====================================================

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
 position:absolute; inset:auto 0 16px;
 display:flex; justify-content:space-between;
 align-items:flex-end; padding:0 22px;
 pointer-events:none; z-index:20;
}
.virtual-joystick {
 width:118px; height:118px; border:3px solid #ffffff85;
 border-radius:50%; background:radial-gradient(circle,#42677b99,#102d43dd);
 box-shadow:0 5px 18px #0008,inset 0 0 15px #ffffff22;
 display:flex; align-items:center; justify-content:center;
 position:relative; pointer-events:auto; touch-action:none;
}
.joystick-knob {
 width:52px; height:52px; border:3px solid #ffffffb0;
 border-radius:50%; background:linear-gradient(145deg,#e8faff,#5486a2);
 box-shadow:0 4px 12px #0008; position:absolute;
 left:50%; top:50%; transform:translate(-50%,-50%);
 pointer-events:none;
}
.right-game-controls {
 display:flex; flex-direction:column; gap:6px;
 align-items:center; pointer-events:auto;
}
.right-game-controls button {
 width:65px; height:65px; border:3px solid #ffffffa0;
 border-radius:50%; color:white; font:900 10px Arial,sans-serif;
 box-shadow:0 5px 15px #0008; touch-action:none;
}
.jump-control {background:radial-gradient(circle at 35% 30%,#ffcf68,#bd5d25)}
.magic-control {background:radial-gradient(circle at 35% 30%,#e5aaff,#6637b8)}
.shield-control {background:radial-gradient(circle at 35% 30%,#8eeaff,#1764a0)}
.lightning-control {background:radial-gradient(circle at 35% 30%,#fff08a,#a66a00)}
.right-game-controls button:active {transform:scale(.9)}
@media(max-height:430px) {
 .virtual-joystick {width:95px;height:95px}
 .joystick-knob {width:43px;height:43px}
 .right-game-controls button {width:53px;height:53px}
}
`;
document.head.appendChild(controlStyle);

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
    if (knob) knob.style.transform = 'translate(-50%,-50%)';
}

function moveStick(e) {
    if (!joystick || !knob || pointerId !== e.pointerId) return;

    const r = joystick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);

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

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') jumpTime = 0.65;
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// =====================================================
// LOMPAT
// =====================================================

if (jumpButton) {
    jumpButton.addEventListener('pointerdown', e => {
        e.preventDefault();
        jumpTime = 0.65;
        playJumpSound();
    });
}

// =====================================================
// SIHIR
// =====================================================

const magicBolts = [];

function castMagic() {
    if (!gameStarted || !player || magicCooldown > 0) return;

    magicCooldown = 0.65;
    playMagicSound();

    const bolt = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xd69aff })
    );

    const direction = new THREE.Vector3(
        -Math.sin(player.rotation.y),
        0,
        -Math.cos(player.rotation.y)
    );

    bolt.position.copy(player.position);
    bolt.position.y += 2;
    scene.add(bolt);

    const light = new THREE.PointLight(0xc56bff, 4, 12);
    bolt.add(light);

    magicBolts.push({ mesh: bolt, direction, life: 1.2 });
}

if (magicButton) {
    magicButton.addEventListener('pointerdown', e => {
        e.preventDefault();
        castMagic();
    });
}

// =====================================================
// PERISAI
// =====================================================

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
        playTone(620, 0.3, 'triangle');
        showMessage('Perisai ajaib melindungi kamu!');
    });
}

// =====================================================
// PETIR
// =====================================================

function castLightning() {
    if (!gameStarted || lightningCooldown > 0 || !player) return;

    lightningCooldown = 7;

    const flash = new THREE.PointLight(0xffed64, 14, 35);
    flash.position.set(player.position.x, 8, player.position.z);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 450);

    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        if (enemy.group.position.distanceTo(player.position) < 23) {
            enemy.stunned = 3;
            enemy.health -= 2;
            if (enemy.health <= 0) defeatEnemy(enemy);
        }
    });

    playTone(180, 0.45, 'sawtooth', 0.1);
    showMessage('Petir ajaib! Musuh terhenti!');
}

if (lightningButton) {
    lightningButton.addEventListener('pointerdown', e => {
        e.preventDefault();
        castLightning();
    });
}

// =====================================================
// MUSUH DIHALAU
// =====================================================

function defeatEnemy(enemy) {
    if (!enemy.alive) return;

    enemy.alive = false;
    enemy.group.visible = false;

    showMessage('Syabas! Dinosaur musuh berjaya dihalau!');
    playSuccessSound();
    updateMissions();
}

// =====================================================
// PERGERAKAN DAN PERLANGGARAN
// =====================================================

function onBridge(x, z) {
    return Math.abs(x) < 19 && Math.abs(z) < 3.8;
}

function canMoveTo(x, z) {
    if (Math.abs(x) < 12.5 && !onBridge(x, z)) return false;

    for (const o of obstacles) {
        if (Math.hypot(x - o.x, z - o.z) < o.radius + 0.9) return false;
    }

    return Math.abs(x) < 100 && Math.abs(z) < 110;
}

function lerpAngle(a, b, t) {
    const diff = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + diff * t;
}

// =====================================================
// SELAMATKAN ANAK DINOSAUR
// =====================================================

function updateRescues() {
    if (!player || !gameStarted) return;

    babies.forEach(baby => {
        if (baby.rescued) return;

        if (baby.group.position.distanceTo(player.position) < 3.5) {
            baby.rescued = true;
            baby.group.visible = false;
            rescued++;

            playSuccessSound();
            showMessage(`Anak dinosaur diselamatkan! ${rescued} daripada 5.`);
            updateMissions();
        }
    });
}

// =====================================================
// GERAKAN MUSUH
// =====================================================

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
            enemy.group.position.x += dx / distance * speed * delta;
            enemy.group.position.z += dz / distance * speed * delta;
            enemy.group.rotation.y = Math.atan2(-dx, -dz);

            enemy.legs.forEach((leg, i) => {
                leg.rotation.x = Math.sin(time * 9 + i * 3) * 0.5;
            });
        }

        if (shieldTime > 0 && distance < 4.5) {
            enemy.group.position.x -= dx / Math.max(distance, 0.1) * 0.35;
            enemy.group.position.z -= dz / Math.max(distance, 0.1) * 0.35;
        }
    });
}

// =====================================================
// GERAKAN SERANGAN SIHIR
// =====================================================

function updateMagicBolts(delta) {
    for (let i = magicBolts.length - 1; i >= 0; i--) {
        const bolt = magicBolts[i];

        bolt.mesh.position.addScaledVector(bolt.direction, 28 * delta);
        bolt.life -= delta;

        enemies.forEach(enemy => {
            if (!enemy.alive) return;

            const target = enemy.group.position.clone();
            target.y += 1.5;

            if (bolt.mesh.position.distanceTo(target) < 3) {
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

// =====================================================
// PERGERAKAN WATAK 360 DARJAH
// =====================================================

function updatePlayer(delta, time) {
    if (!gameStarted || !player) return;

    let inputX = stickX;
    let inputY = stickY;

    if (keys.a || keys.arrowleft) inputX = -1;
    if (keys.d || keys.arrowright) inputX = 1;
    if (keys.w || keys.arrowup) inputY = -1;
    if (keys.s || keys.arrowdown) inputY = 1;

    const move = new THREE.Vector3(inputX, 0, inputY);
    const moving = move.lengthSq() > 0.04;

    if (moving) {
        move.normalize();

        // Kamera berada di belakang watak.
        // Atas joystick = bergerak ke hadapan.
        move.z *= -1;

        const targetAngle = Math.atan2(-move.x, -move.z);

        playerAngle = lerpAngle(
            playerAngle,
            targetAngle,
            Math.min(delta * 9, 1)
        );

        player.rotation.y = playerAngle;

        const speed = 9.5;
        const nx = player.position.x + move.x * speed * delta;
        const nz = player.position.z + move.z * speed * delta;

        if (canMoveTo(nx, player.position.z)) player.position.x = nx;
        if (canMoveTo(player.position.x, nz)) player.position.z = nz;
    }

    const bridgeHeight = onBridge(player.position.x, player.position.z) ? 0.65 : 0;

    if (jumpTime > 0) {
        jumpTime -= delta;
        const progress = 1 - jumpTime / 0.65;
        player.position.y = bridgeHeight + Math.sin(progress * Math.PI) * 2.3;
    } else {
        player.position.y = bridgeHeight;
    }

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

    const cameraTarget = new THREE.Vector3(
        player.position.x,
        39,
        player.position.z + 23
    );

    camera.position.lerp(cameraTarget, Math.min(delta * 3, 1));
    camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z);

    if (shieldMesh) {
        shieldMesh.position.set(
            player.position.x,
            player.position.y + 1.5,
            player.position.z
        );
    }
}

// =====================================================
// KRISTAL DITARIK OLEH SIHIR
// =====================================================

function updateCrystals(time, delta) {
    crystals.forEach(crystal => {
        if (crystal.collected) return;

        crystal.group.rotation.y = Math.sin(time * 0.5 + crystal.phase) * 0.12;
        crystal.group.position.y = 0.25 + Math.sin(time * 2 + crystal.phase) * 0.15;

        if (!player || !gameStarted) return;

        const target = new THREE.Vector3(
            player.position.x,
            player.position.y + 1,
            player.position.z
        );

        const distance = crystal.group.position.distanceTo(target);

        if (distance < 23) crystal.magnet = true;

        if (crystal.magnet) {
            crystal.group.position.lerp(target, Math.min(delta * 3.5, 1));
        }

        if (distance < 2.5) {
            crystal.collected = true;
            crystal.group.visible = false;
            collected++;

            playCrystalSound();
            showMessage(`Kristal ajaib diperoleh! Jumlah ${collected}.`);
            updateMissions();
        }
    });
}

// =====================================================
// ANIMASI DUNIA
// =====================================================

function animateWorld(time, delta) {
    const pos = riverGeometry.attributes.position;

    for (let i = 0; i < pos.count; i++) {
        const x = originalWater[i * 3];
        const y = originalWater[i * 3 + 1];

        pos.array[i * 3 + 2] =
            originalWater[i * 3 + 2] +
            Math.sin(x * 0.5 + time * 2) * 0.12 +
            Math.sin(y * 0.18 - time * 1.5) * 0.1;
    }

    pos.needsUpdate = true;
    riverGeometry.computeVertexNormals();

    trees.forEach(tree => {
        tree.group.rotation.z = Math.sin(time + tree.phase) * 0.025;

        tree.crowns.forEach((crown, i) => {
            crown.rotation.z = Math.sin(time * 1.5 + i) * 0.035;
        });
    });

    clouds.forEach(cloud => {
        cloud.position.x += delta * 0.45;
        if (cloud.position.x > 110) cloud.position.x = -110;
    });

    babies.forEach(baby => {
        if (!baby.rescued) {
            baby.baby.position.y = Math.sin(time * 2 + baby.phase) * 0.08;
        }
    });
}

// =====================================================
// KIRA MASA KUASA
// =====================================================

function updateCooldowns(delta) {
    magicCooldown = Math.max(0, magicCooldown - delta);
    lightningCooldown = Math.max(0, lightningCooldown - delta);

    if (shieldTime > 0) {
        shieldTime -= delta;

        if (shieldTime <= 0 && shieldMesh) {
            scene.remove(shieldMesh);
            shieldMesh = null;
            showMessage('Perisai ajaib telah tamat.');
        }
    }
}

// =====================================================
// PERMULAAN DAN ANIMASI
// =====================================================

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

// =====================================================
// SAIZ SKRIN
// =====================================================

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
});
