
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* =====================================================
   MAGICAL JURASSIC KINGDOM
   COMPLETE GAME.JS
===================================================== */

const $ = id => document.getElementById(id);

const container = $('game-container');
if (!container) throw new Error('game-container tiada dalam index.html');

const heroes = [
  { name: 'LALA', title: 'Wira Penyayang', color: 0x55d65b },
  { name: 'TORA', title: 'Wira Berdaya Tahan', color: 0xf07832 },
  { name: 'RAJA REX', title: 'Wira Berupaya Memimpin', color: 0xffc83d },
  { name: 'BOBI', title: 'Wira Warganegara Aktif', color: 0x348fe0 }
];

let selectedHero = 0;
let scene, camera, renderer, clock;
let player, followers = [], trees = [], crystals = [], eggs = [], clouds = [];
let spellRing;
let started = false;
let moveX = 0, moveZ = 0;
let velocityY = 0, jumping = false;
let facing = 0, elapsed = 0;
let distanceTravelled = 0;
let crystalsCollected = 0;
let bridgeCrossed = false;
let forestExplored = false;
let magicOn = false;
let messageTimer = 0;
let messageElement;

const keys = {};
const up = new THREE.Vector3(0, 1, 0);

const material = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function mesh(geo, mat, parent, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/* =====================================================
   MENU DAN PEMILIHAN WATAK
===================================================== */

if ($('game-hud')) $('game-hud').style.display = 'none';
if ($('character-menu')) $('character-menu').style.display = 'none';
if ($('loading-screen')) $('loading-screen').style.display = 'none';

document.querySelectorAll('.character-card').forEach((card, i) => {
  card.addEventListener('click', () => {
    selectedHero = Number(card.dataset.hero ?? i);
    document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    speak('Saya ' + heroes[selectedHero].name + '! Jom mengembara!');
  });
});

$('start-button')?.addEventListener('click', () => {
  startAudio();
  if ($('main-menu')) $('main-menu').style.display = 'none';
  if ($('character-menu')) $('character-menu').style.display = 'flex';
  setTimeout(() => speak('Selamat datang ke kerajaan dinosaur ajaib!'), 300);
});

$('play-button')?.addEventListener('click', () => {
  startAudio();
  if (started) return;
  started = true;

  if ($('main-menu')) $('main-menu').style.display = 'none';
  if ($('character-menu')) $('character-menu').style.display = 'none';
  if ($('loading-screen')) $('loading-screen').style.display = 'none';
  if ($('game-hud')) $('game-hud').style.display = 'block';

  createGame();
  setTimeout(() => speak('Jom mulakan pengembaraan! Cari kristal ajaib!'), 1200);
});

/* =====================================================
   AUDIO: MUZIK, SUARA DAN KESAN BUNYI
===================================================== */

let audio = null;
let master = null;
let musicGain = null;
let musicTimer = null;
let musicIndex = 0;
let muted = false;
let lastSpeech = 0;

function startAudio() {
  if (!audio) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audio = new AudioContextClass();

    master = audio.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(audio.destination);

    musicGain = audio.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(master);
  }

  if (audio.state === 'suspended') audio.resume();

  if (!musicTimer) {
    musicTimer = setInterval(playMusic, 360);
  }
}

const melody = [
  523, 659, 784, 659, 587, 698, 880, 698,
  523, 659, 784, 1046, 880, 784, 659, 587,
  523, 587, 659, 784, 880, 784, 659, 523
];

function note(freq, duration = 0.25, type = 'triangle', volume = 0.08, destination = master) {
  if (!audio || muted || !destination) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);

  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

  osc.connect(gain);
  gain.connect(destination);
  osc.start();
  osc.stop(audio.currentTime + duration + 0.04);
}

function playMusic() {
  if (!audio || muted) return;

  const n = melody[musicIndex % melody.length];
  note(n, 0.31, 'triangle', 0.055, musicGain);

  if (musicIndex % 4 === 0) {
    note(n / 2, 0.35, 'sine', 0.035, musicGain);
  }

  if (musicIndex % 8 === 0) {
    note(n * 1.5, 0.15, 'sine', 0.025, musicGain);
  }

  musicIndex++;
}

function soundJump() {
  note(380, 0.12, 'sine', 0.15);
  setTimeout(() => note(620, 0.16, 'sine', 0.12), 90);
}

function soundMagic() {
  note(500, 0.15, 'sine', 0.12);
  setTimeout(() => note(750, 0.18, 'triangle', 0.12), 100);
  setTimeout(() => note(1050, 0.25, 'sine', 0.1), 200);
}

function soundCrystal() {
  [880, 1175, 1568].forEach((n, i) => {
    setTimeout(() => note(n, 0.25, 'sine', 0.14), i * 100);
  });
}

function soundSuccess() {
  [523, 659, 784, 1046].forEach((n, i) => {
    setTimeout(() => note(n, 0.3, 'triangle', 0.13), i * 130);
  });
}

function speak(message) {
  if (!('speechSynthesis' in window) || muted) return;

  const now = Date.now();
  if (now - lastSpeech < 1600) return;
  lastSpeech = now;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'ms-MY';
  utterance.rate = 0.92;
  utterance.pitch = 1.15;
  utterance.volume = 1;

  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.toLowerCase().startsWith('ms'));
  if (voice) utterance.voice = voice;

  speechSynthesis.speak(utterance);
}

/* =====================================================
   KAWALAN PAPARAN
===================================================== */

const controlStyle = document.createElement('style');
controlStyle.textContent = `
#touch-controls { display:none !important; }

#magic-controls {
  position:fixed; inset:0; z-index:99999;
  pointer-events:none; user-select:none;
  -webkit-user-select:none; font-family:Arial,sans-serif;
}

#magic-joystick {
  position:absolute; left:20px; bottom:20px;
  width:124px; height:124px; border-radius:50%;
  background:rgba(12,45,65,.55);
  border:4px solid white;
  box-shadow:0 0 18px #58dfff;
  pointer-events:auto; touch-action:none;
}

#magic-stick {
  position:absolute; left:30px; top:30px;
  width:56px; height:56px; border-radius:50%;
  background:linear-gradient(145deg,#fff,#60d9ff);
  border:3px solid white;
  box-shadow:0 3px 12px #123;
  pointer-events:none;
}

.magic-button {
  position:absolute; right:20px; width:78px; height:78px;
  border-radius:50%; border:3px solid white;
  color:white; font-weight:bold; font-size:13px;
  text-shadow:1px 2px 3px #333;
  box-shadow:0 4px 12px #1238;
  pointer-events:auto; touch-action:none;
}

#magic-jump { bottom:22px; background:linear-gradient(145deg,#ffdf50,#ff8919); }
#magic-spell { bottom:112px; background:linear-gradient(145deg,#dc75ff,#702bdf); }

#magic-sound {
  position:absolute; right:15px; top:15px;
  width:48px; height:48px; border-radius:50%;
  border:2px solid white; background:#173d66cc;
  color:white; font-size:22px; pointer-events:auto;
}

.magic-button:active { transform:scale(.9); filter:brightness(1.2); }

@media(max-width:600px) {
  #magic-joystick { width:112px;height:112px;left:14px;bottom:15px; }
  #magic-stick { left:25px;top:25px; }
  .magic-button { width:70px;height:70px;right:14px; }
  #magic-jump { bottom:18px; }
  #magic-spell { bottom:98px; }
}
`;
document.head.appendChild(controlStyle);

const controlUI = document.createElement('div');
controlUI.id = 'magic-controls';
controlUI.innerHTML = `
  <div id="magic-joystick"><div id="magic-stick"></div></div>
  <button id="magic-jump" class="magic-button">⬆ LOMPAT</button>
  <button id="magic-spell" class="magic-button">✨ SIHIR</button>
  <button id="magic-sound">🔊</button>
`;
document.body.appendChild(controlUI);

/* JOYSTICK */

const pad = $('magic-joystick');
const stick = $('magic-stick');
let joystickId = null;

function resetJoystick() {
  moveX = 0;
  moveZ = 0;
  stick.style.left = innerWidth <= 600 ? '25px' : '30px';
  stick.style.top = innerWidth <= 600 ? '25px' : '30px';
}

function joystickMove(e) {
  if (joystickId !== e.pointerId) return;

  const r = pad.getBoundingClientRect();
  let x = (e.clientX - r.left - r.width / 2) / (r.width * 0.34);
  let y = (e.clientY - r.top - r.height / 2) / (r.height * 0.34);

  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }

  moveX = x;
  moveZ = y;

  const max = r.width * 0.29;
  stick.style.left = (r.width / 2 - 28 + x * max) + 'px';
  stick.style.top = (r.height / 2 - 28 + y * max) + 'px';
}

pad.addEventListener('pointerdown', e => {
  e.preventDefault();
  joystickId = e.pointerId;
  pad.setPointerCapture(e.pointerId);
  startAudio();
  joystickMove(e);
});
pad.addEventListener('pointermove', joystickMove);

function releaseJoystick(e) {
  if (joystickId !== e.pointerId) return;
  joystickId = null;
  resetJoystick();
}
pad.addEventListener('pointerup', releaseJoystick);
pad.addEventListener('pointercancel', releaseJoystick);

/* LOMPAT */

$('magic-jump').addEventListener('pointerdown', e => {
  e.preventDefault();
  startAudio();

  if (!jumping && player) {
    jumping = true;
    velocityY = 10;
    soundJump();
  }
});

/* SIHIR */

$('magic-spell').addEventListener('pointerdown', e => {
  e.preventDefault();
  startAudio();
  magicOn = true;
  useMagic();
  soundMagic();
  speak('Kuasa ajaib! Tarik kristal ke sini!');
});

function stopMagic() {
  magicOn = false;
}
$('magic-spell').addEventListener('pointerup', stopMagic);
$('magic-spell').addEventListener('pointercancel', stopMagic);
$('magic-spell').addEventListener('lostpointercapture', stopMagic);

/* BUNYI */

$('magic-sound').addEventListener('click', () => {
  muted = !muted;
  $('magic-sound').textContent = muted ? '🔇' : '🔊';

  if (master && audio) {
    master.gain.setTargetAtTime(muted ? 0 : 0.55, audio.currentTime, 0.08);
  }

  if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
  else {
    startAudio();
    speak('Bunyi permainan dihidupkan!');
  }
});

/* KEYBOARD */

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === ' ' && !jumping && player) {
    jumping = true;
    velocityY = 10;
    soundJump();
  }

  if (e.key.toLowerCase() === 'e') {
    startAudio();
    useMagic();
    soundMagic();
  }
});

addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

/* =====================================================
   CIPTA DUNIA 3D
===================================================== */

function createGame() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x79d9ff);
  scene.fog = new THREE.Fog(0x79d9ff, 100, 260);

  camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
  camera.position.set(0, 38, 45);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  createLights();
  createGround();
  createRiver();
  createBridge();
  createForest();
  createMountains();
  createClouds();
  createCrystals();
  createEggs();
  createCharacters();
  createSpellRing();

  updateHeroName();
  updateMissions();
  animate();
}

function createLights() {
  scene.add(new THREE.HemisphereLight(0xc9f4ff, 0x527b37, 2));

  const sun = new THREE.DirectionalLight(0xfff2d0, 3);
  sun.position.set(-40, 80, 35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x9bdfff, 0.8);
  fill.position.set(30, 30, -40);
  scene.add(fill);
}

function createGround() {
  const ground = mesh(
    new THREE.PlaneGeometry(250, 250),
    material(0x55a83e),
    scene, 0, 0, 0
  );
  ground.rotation.x = -Math.PI / 2;

  for (let i = 0; i < 160; i++) {
    const x = (Math.random() - 0.5) * 220;
    const z = (Math.random() - 0.5) * 220;
    if (Math.abs(x) < 17) continue;

    const patch = mesh(
      new THREE.CircleGeometry(1 + Math.random() * 3, 8),
      material(Math.random() > 0.5 ? 0x69b94a : 0x438f3c),
      scene, x, 0.025, z
    );
    patch.rotation.x = -Math.PI / 2;
  }
}

function createRiver() {
  const water = mesh(
    new THREE.PlaneGeometry(25, 250),
    new THREE.MeshPhysicalMaterial({
      color: 0x16a9d7,
      roughness: 0.16,
      metalness: 0.18,
      transparent: true,
      opacity: 0.92
    }),
    scene, 0, 0.12, 0
  );
  water.rotation.x = -Math.PI / 2;

  for (const side of [-1, 1]) {
    mesh(new THREE.BoxGeometry(2.5, 0.35, 250),
      material(0xb7a36a), scene, side * 13.6, 0.05, 0);
  }
}

function createBridge() {
  const bridge = new THREE.Group();
  scene.add(bridge);

  const wood = material(0x85502b);
  const lightWood = material(0xb77a42);

  for (const z of [-2.9, 2.9]) {
    mesh(new THREE.BoxGeometry(38, 0.65, 0.55), wood, bridge, 0, 0.45, z);
  }

  for (let i = 0; i < 32; i++) {
    mesh(new THREE.BoxGeometry(1.12, 0.22, 6.1),
      i % 2 ? lightWood : wood, bridge, -18.2 + i * 1.17, 0.65, 0);
  }

  for (const z of [-3.1, 3.1]) {
    for (let x = -18; x <= 18; x += 4.5) {
      mesh(new THREE.BoxGeometry(0.38, 1.8, 0.38), wood, bridge, x, 1.55, z);
    }
    mesh(new THREE.BoxGeometry(38, 0.32, 0.4), lightWood, bridge, 0, 2.35, z);
    mesh(new THREE.BoxGeometry(38, 0.2, 0.28), wood, bridge, 0, 1.45, z);
  }
}

function onBridge(x, z) {
  return Math.abs(x) < 19 && Math.abs(z) < 3.8;
}

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  mesh(new THREE.CylinderGeometry(0.35, 0.55, 4, 8),
    material(0x85502b), tree, 0, 2, 0);

  const colors = [0x238a43, 0x329b4b, 0x176c3b];

  for (let i = 0; i < 5; i++) {
    const leaf = mesh(new THREE.IcosahedronGeometry(1, 1),
      material(colors[i % 3]), tree,
      (Math.random() - 0.5) * 2,
      4.5 + Math.random() * 1.5,
      (Math.random() - 0.5) * 2);
    leaf.scale.setScalar(1.3 + Math.random() * 0.7);
  }

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);
  trees.push({ object: tree, x, z, radius: 1.7 * scale });
}

function createForest() {
  for (let i = 0; i < 90; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    createTree(side * (20 + Math.random() * 65),
      (Math.random() - 0.5) * 220,
      0.65 + Math.random() * 0.7);
  }
}

function createMountains() {
  const colors = [0x477c65, 0x597eaa, 0x9a6a9d, 0x568c83];

  for (let i = 0; i < 22; i++) {
    const h = 18 + Math.random() * 30;
    const group = new THREE.Group();

    mesh(new THREE.ConeGeometry(h * 0.65, h, 8),
      material(colors[i % colors.length]), group, 0, h / 2, 0);

    mesh(new THREE.ConeGeometry(h * 0.2, h * 0.28, 8),
      material(0xf2ffff), group, 0, h * 0.83, 0);

    group.position.set(
      (Math.random() > 0.5 ? 1 : -1) * (55 + Math.random() * 40),
      0,
      (Math.random() - 0.5) * 210
    );
    scene.add(group);
  }
}

function createClouds() {
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Group();

    for (let j = 0; j < 6; j++) {
      mesh(new THREE.SphereGeometry(2 + Math.random() * 2, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        cloud, (Math.random() - 0.5) * 7,
        Math.random() * 2, (Math.random() - 0.5) * 3);
    }

    cloud.position.set((Math.random() - 0.5) * 180,
      38 + Math.random() * 20,
      (Math.random() - 0.5) * 180);

    scene.add(cloud);
    clouds.push(cloud);
  }
}

function createCrystals() {
  const colors = [0x20eaff, 0xb34bff, 0xff55a8, 0x66ff93, 0xffd447, 0x5687ff];

  for (let i = 0; i < 24; i++) {
    const group = new THREE.Group();
    const color = colors[i % colors.length];

    const crystalMat = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.12
    });

    const core = mesh(new THREE.OctahedronGeometry(1.1),
      crystalMat, group, 0, 1.5, 0);
    core.scale.set(0.8, 1.8, 0.8);

    for (let j = 0; j < 4; j++) {
      const angle = j * Math.PI / 2;
      const shard = mesh(new THREE.OctahedronGeometry(0.42),
        crystalMat, group,
        Math.cos(angle), 0.85, Math.sin(angle));
      shard.scale.y = 1.5;
    }

    mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.35, 8),
      material(0xffc83d, 0.3, 0.4), group, 0, 0.2, 0);

    const glow = new THREE.PointLight(color, 2.5, 9);
    glow.position.y = 1.5;
    group.add(glow);

    const side = i % 2 === 0 ? -1 : 1;
    group.position.set(side * (20 + Math.random() * 38),
      0, (Math.random() - 0.5) * 190);

    scene.add(group);
    crystals.push({ object: group, collected: false, attracted: false });
  }
}

function createEggs() {
  for (let i = 0; i < 5; i++) {
    const egg = new THREE.Group();

    const shell = mesh(new THREE.SphereGeometry(0.65, 16, 12),
      material(0xffe7b0), egg, 0, 0.65, 0);
    shell.scale.set(0.75, 1, 0.75);

    egg.position.set(25 + Math.random() * 30, 0, -35 + i * 13);
    scene.add(egg);
    eggs.push({ object: egg, collected: false });
  }
}

/* =====================================================
   DINOSAUR
===================================================== */

function makeDino(info) {
  const root = new THREE.Group();
  const bodyMat = material(info.color);
  const bellyMat = material(0xffd9a0);
  const darkMat = material(0x293344);
  const whiteMat = material(0xffffff);

  function sphere(x, y, z, sx, sy, sz, m) {
    const s = mesh(new THREE.SphereGeometry(1, 16, 12),
      m, root, x, y, z);
    s.scale.set(sx, sy, sz);
    return s;
  }

  sphere(0, 1.25, 0, 1.15, 0.85, 1.55, bodyMat);
  sphere(0, 0.95, -0.05, 0.85, 0.45, 1.2, bellyMat);
  sphere(0, 1.95, 0.85, 0.65, 0.75, 0.7, bodyMat);
  sphere(0, 2.25, 1.25, 0.75, 0.68, 0.75, bodyMat);
  sphere(0, 1.95, 1.78, 0.55, 0.28, 0.42, bellyMat);

  for (const side of [-1, 1]) {
    sphere(side * 0.48, 2.38, 1.55, 0.18, 0.2, 0.12, whiteMat);
    sphere(side * 0.52, 2.38, 1.65, 0.085, 0.1, 0.06, darkMat);
  }

  const legs = [];

  for (const x of [-0.7, 0.7]) {
    for (const z of [-0.8, 0.85]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.85, z);

      mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 10),
        bodyMat, leg, 0, -0.35, 0);

      sphere.bind(null);
      const foot = mesh(new THREE.SphereGeometry(1, 12, 8),
        bellyMat, leg, 0, -0.77, 0.12);
      foot.scale.set(0.32, 0.17, 0.4);

      root.add(leg);
      legs.push(leg);
    }
  }

  const tail = mesh(new THREE.ConeGeometry(0.38, 2.2, 10),
    bodyMat, root, 0, 1.2, -1.85);
  tail.rotation.x = -Math.PI / 2;

  if (info.name === 'TORA') {
    for (const side of [-1, 1]) {
      const horn = mesh(new THREE.ConeGeometry(0.16, 0.9, 8),
        material(0xfff0c0), root, side * 0.62, 2.75, 1.2);
      horn.rotation.z = side * -0.5;
    }
  }

  if (info.name === 'RAJA REX') {
    mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.35, 5),
      material(0xffc83d), root, 0, 3, 1.1);
  }

  if (info.name === 'BOBI') {
    mesh(new THREE.BoxGeometry(0.85, 0.9, 0.4),
      material(0x273c68), root, 0, 1.55, -1);
  }

  root.userData.legs = legs;
  root.userData.tail = tail;
  return root;
}

function createCharacters() {
  const all = heroes.map(makeDino);

  player = all[selectedHero];
  player.position.set(17, 0, 12);
  scene.add(player);

  followers = all.filter((_, i) => i !== selectedHero);

  followers.forEach((f, i) => {
    f.position.set(17 + (i - 1) * 2.5, 0, 7 - i * 1.5);
    scene.add(f);
  });
}

function createSpellRing() {
  spellRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.12, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0xd7a0ff })
  );
  spellRing.rotation.x = Math.PI / 2;
  spellRing.visible = false;
  scene.add(spellRing);
}

function useMagic() {
  if (!player) return;

  for (const c of crystals) {
    if (c.collected) continue;

    if (c.object.position.distanceTo(player.position) < 28) {
      c.attracted = true;
    }
  }
}

/* =====================================================
   MESEJ DAN MISI
===================================================== */

function showMessage(message) {
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.style.cssText = `
      position:fixed;top:43%;left:50%;transform:translate(-50%,-50%);
      z-index:100000;padding:14px 22px;
      background:#153b55ed;border:2px solid white;border-radius:15px;
      color:white;font-size:18px;font-weight:bold;text-align:center;
      pointer-events:none;
    `;
    document.body.appendChild(messageElement);
  }

  messageElement.textContent = message;
  messageElement.style.display = 'block';
  messageTimer = 2.5;
}

function updateHeroName() {
  if ($('hero-name')) $('hero-name').textContent = heroes[selectedHero].name;
}

function updateMissions() {
  const panel = $('mission-panel');
  if (!panel) return;

  const tasks = [
    [eggs.filter(e => e.collected).length >= 3, 'Kumpulkan 3 telur dinosaur'],
    [crystalsCollected >= 3, 'Cari 3 kristal ajaib'],
    [bridgeCrossed, 'Seberangi jambatan'],
    [forestExplored, 'Teroka hutan purba'],
    [distanceTravelled >= 100, 'Teroka kawasan kerajaan'],
    [crystalsCollected >= 6, 'Kumpulkan 6 kristal'],
    [crystalsCollected >= 9, 'Kumpulkan 9 kristal']
  ];

  const items = [...panel.querySelectorAll('.mission-item')];

  tasks.forEach((task, i) => {
    if (items[i]) {
      items[i].textContent = (task[0] ? '✓ ' : '▫ ') + task[1];
      items[i].style.opacity = task[0] ? '0.4' : '1';
      items[i].style.textDecoration = task[0] ? 'line-through' : 'none';
    }
  });
}

/* =====================================================
   PERLANGGARAN
===================================================== */

function canMoveTo(x, z) {
  if (Math.abs(x) < 12.5 && !onBridge(x, z)) return false;

  for (const t of trees) {
    if (Math.hypot(x - t.x, z - t.z) < t.radius + 1) return false;
  }

  return Math.abs(x) < 115 && Math.abs(z) < 115;
}

/* =====================================================
   ANIMASI PERMAINAN
===================================================== */

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || !player) return;

  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0 && messageElement) {
      messageElement.style.display = 'none';
    }
  }

  let dx = moveX;
  let dz = moveZ;

  if (keys.arrowleft || keys.a) dx -= 1;
  if (keys.arrowright || keys.d) dx += 1;
  if (keys.arrowup || keys.w) dz -= 1;
  if (keys.arrowdown || keys.s) dz += 1;

  const len = Math.hypot(dx, dz);
  if (len > 1) {
    dx /= len;
    dz /= len;
  }

  const speed = 10;
  const oldX = player.position.x;
  const oldZ = player.position.z;

  const nextX = oldX + dx * speed * dt;
  const nextZ = oldZ + dz * speed * dt;

  if (canMoveTo(nextX, oldZ)) player.position.x = nextX;
  if (canMoveTo(player.position.x, nextZ)) player.position.z = nextZ;

  const moving = Math.abs(dx) + Math.abs(dz) > 0.05;

  if (moving) {
    facing = Math.atan2(dx, -dz);
    player.rotation.y = facing;
    distanceTravelled += speed * dt;
  }

  const floorY = onBridge(player.position.x, player.position.z) ? 0.76 : 0;

  if (jumping) {
    velocityY -= 24 * dt;
    player.position.y += velocityY * dt;

    if (player.position.y <= floorY) {
      player.position.y = floorY;
      velocityY = 0;
      jumping = false;
    }
  } else {
    player.position.y = floorY;
  }

  if (onBridge(player.position.x, player.position.z) &&
      Math.abs(player.position.x) < 12) {
    if (!bridgeCrossed) {
      bridgeCrossed = true;
      showMessage('Hebat! Kamu berjaya menyeberangi jambatan!');
      soundSuccess();
      speak('Hebat! Kamu berjaya menyeberangi jambatan!');
    }
  }

  if (Math.abs(player.position.x) > 25 && Math.abs(player.position.z) > 20) {
    forestExplored = true;
  }

  player.userData.legs.forEach((leg, i) => {
    leg.rotation.x = moving ? Math.sin(elapsed * 10 + i * Math.PI) * 0.55 : 0;
  });
  player.userData.tail.rotation.y = Math.sin(elapsed * 3) * 0.25;

  followers.forEach((f, i) => {
    const offset = new THREE.Vector3((i - 1) * 2.4, 0, 4 + i * 1.3);
    offset.applyAxisAngle(up, facing);

    const target = player.position.clone().add(offset);
    f.position.lerp(target, Math.min(1, dt * 3.5));
    f.position.y = onBridge(f.position.x, f.position.z) ? 0.76 : 0;
    f.rotation.y = facing;

    f.userData.legs.forEach((leg, j) => {
      leg.rotation.x = moving ? Math.sin(elapsed * 10 + j * Math.PI) * 0.4 : 0;
    });
    f.userData.tail.rotation.y = Math.sin(elapsed * 3 + i) * 0.25;
  });

  /* KRISTAL */

  for (const c of crystals) {
    if (c.collected) continue;

    c.object.rotation.y += dt * 0.8;
    c.object.position.y = Math.sin(elapsed * 2) * 0.2;

    if (c.attracted) {
      const target = player.position.clone();
      target.y += 1.5;
      c.object.position.lerp(target, Math.min(1, dt * 3.5));

      if (c.object.position.distanceTo(target) < 2.4) {
        c.collected = true;
        scene.remove(c.object);
        crystalsCollected++;
        showMessage('💎 Kristal berjaya dikumpul!');
        soundCrystal();
        speak('Hebat! Kristal berjaya dikumpulkan!');
      }
    }
  }

  /* TELUR */

  for (const e of eggs) {
    if (e.collected) continue;

    e.object.rotation.y = Math.sin(elapsed) * 0.1;

    if (e.object.position.distanceTo(player.position) < 2.2) {
      e.collected = true;
      scene.remove(e.object);
      showMessage('🥚 Telur dinosaur dijumpai!');
      soundSuccess();
      speak('Bagus! Kamu menjumpai telur dinosaur!');
    }
  }

  /* AWAN BERGERAK */

  clouds.forEach(cloud => {
    cloud.position.x += dt * 0.4;
    if (cloud.position.x > 110) cloud.position.x = -110;
  });

  /* GELUNG SIHIR */

  spellRing.visible = magicOn;
  spellRing.position.set(player.position.x, player.position.y + 0.5, player.position.z);
  spellRing.rotation.z += dt * 1.5;

  /* KAMERA */

  const desired = new THREE.Vector3(
    player.position.x,
    player.position.y + 36,
    player.position.z + 36
  );

  camera.position.lerp(desired, Math.min(1, dt * 2.5));
  camera.lookAt(player.position.x, player.position.y, player.position.z);

  if ($('health-fill')) $('health-fill').style.width = '100%';

  updateMissions();
  renderer.render(scene, camera);
}

/* =====================================================
   SAIZ SKRIN
===================================================== */

addEventListener('resize', () => {
  if (!camera || !renderer) return;

  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
