
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* ==========================================
   MAGICAL JURASSIC KINGDOM
   JUNGLE CRYSTAL EDITION
========================================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x83c9e9);
scene.fog = new THREE.Fog(0x83c9e9, 110, 270);

const camera = new THREE.PerspectiveCamera(
  55, innerWidth / innerHeight, 0.1, 500
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById('game-container').appendChild(renderer.domElement);

/* ===== CAHAYA ===== */

scene.add(new THREE.HemisphereLight(0xdff8ff, 0x385b32, 2.2));

const sun = new THREE.DirectionalLight(0xfff1c9, 3);
sun.position.set(-45, 80, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
scene.add(sun);

const fillLight = new THREE.PointLight(0x69dfff, 1.2, 100);
fillLight.position.set(0, 20, 0);
scene.add(fillLight);

function material(color, roughness = 0.85, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    ...extra
  });
}

/* ===== WARNA ALAM ===== */

const grass = material(0x397d37);
const grassLight = material(0x68a947);
const darkGrass = material(0x28552b);
const soil = material(0x795334);
const wood = material(0x754426);
const woodLight = material(0xb27a42);
const stone = material(0x667a7d);
const snow = material(0xdce9e9);

/* ===== TANAH ===== */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(250, 250),
  grass
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

// Kawasan rumput berwarna
for (let i = 0; i < 260; i++) {
  const patch = new THREE.Mesh(
    new THREE.CircleGeometry(THREE.MathUtils.randFloat(0.5, 2.5), 8),
    Math.random() > 0.5 ? grassLight : darkGrass
  );

  patch.rotation.x = -Math.PI / 2;
  patch.position.set(
    THREE.MathUtils.randFloatSpread(210),
    -0.12,
    THREE.MathUtils.randFloatSpread(210)
  );
  scene.add(patch);
}

/* ===== SUNGAI ===== */

const riverGeometry = new THREE.PlaneGeometry(25, 230, 60, 220);

const waterMaterial = material(0x168fcb, 0.18, {
  metalness: 0.15,
  transparent: true,
  opacity: 0.88,
  emissive: 0x073d64,
  emissiveIntensity: 0.3
});

const water = new THREE.Mesh(riverGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = 0.12;
scene.add(water);

const waterPositions = riverGeometry.attributes.position;
const originalWater = waterPositions.array.slice();

const bankMaterial = material(0x8eaa57);

for (const side of [-1, 1]) {
  const bank = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.55, 230),
    bankMaterial
  );

  bank.position.set(side * 14, 0.05, 0);
  scene.add(bank);
}

/* ===== JAMBATAN KAYU ===== */

const bridge = new THREE.Group();
scene.add(bridge);

// Tapak jambatan
const bridgeDeck = new THREE.Mesh(
  new THREE.BoxGeometry(35, 0.65, 7),
  wood
);
bridgeDeck.position.y = 0.65;
bridgeDeck.castShadow = true;
bridgeDeck.receiveShadow = true;
bridge.add(bridgeDeck);

// Papan-papan lantai
for (let i = 0; i < 25; i++) {
  const plank = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.12, 6.8),
    i % 2 ? woodLight : wood
  );

  plank.position.set(-16.5 + i * 1.37, 1.03, 0);
  plank.castShadow = true;
  bridge.add(plank);
}

// Pagar kiri dan kanan
for (const side of [-1, 1]) {
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(35, 0.3, 0.3),
    woodLight
  );

  rail.position.set(0, 2.15, side * 3.25);
  bridge.add(rail);

  for (let i = 0; i < 13; i++) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 2.2, 0.35),
      wood
    );

    post.position.set(-16 + i * 2.65, 1.65, side * 3.25);
    post.castShadow = true;
    bridge.add(post);
  }
}

// Tiang sokongan jambatan
for (const x of [-10, 0, 10]) {
  for (const z of [-2.4, 2.4]) {
    const support = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 4, 9),
      wood
    );

    support.position.set(x, -1.2, z);
    bridge.add(support);
  }
}

// Tangga kecil di kedua-dua hujung
for (const side of [-1, 1]) {
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.25, 7.5),
      woodLight
    );

    step.position.set(side * (17.8 + i * 1.2), 0.3 - i * 0.2, 0);
    bridge.add(step);
  }
}

// Jambatan diletakkan pada z=0
bridge.position.z = 0;

/* ===== RIAK AIR ===== */

const ripples = [];

for (let i = 0; i < 32; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.4, 32),
    new THREE.MeshBasicMaterial({
      color: 0xc4f5ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(
    THREE.MathUtils.randFloat(-10, 10),
    0.2,
    THREE.MathUtils.randFloatSpread(220)
  );

  ring.userData.speed = 1.5 + Math.random() * 3;
  ring.userData.phase = Math.random() * 6;

  scene.add(ring);
  ripples.push(ring);
}

/* ===== POKOK ===== */

const trees = [];
const obstacles = [];

const leafMaterials = [
  material(0x1b6532),
  material(0x348d3e),
  material(0x55a747),
  material(0x83b84b)
];

function makeTree(x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.55, 5, 10),
    wood
  );

  trunk.position.y = 2.5;
  trunk.castShadow = true;
  group.add(trunk);

  const leaves = [];

  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(1.6 - i * 0.1, 14, 12),
      leafMaterials[i % leafMaterials.length]
    );

    leaf.position.set(
      THREE.MathUtils.randFloatSpread(1.6),
      4.1 + i * 0.45,
      THREE.MathUtils.randFloatSpread(1.6)
    );

    leaf.scale.set(1.15, 1.2, 1);
    leaf.castShadow = true;
    group.add(leaf);
    leaves.push(leaf);
  }

  scene.add(group);

  trees.push({
    group,
    leaves,
    phase: Math.random() * 6
  });

  obstacles.push({ x, z, radius: 1.4 * scale });
}

for (let i = 0; i < 70; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;

  makeTree(
    side * THREE.MathUtils.randFloat(19, 48),
    THREE.MathUtils.randFloatSpread(210),
    THREE.MathUtils.randFloat(0.7, 1.5)
  );
}

/* ===== TUMBUHAN KECIL ===== */

for (let i = 0; i < 150; i++) {
  const x = THREE.MathUtils.randFloatSpread(130);
  const z = THREE.MathUtils.randFloatSpread(200);

  if (Math.abs(x) < 17) continue;

  const bush = new THREE.Mesh(
    new THREE.SphereGeometry(
      THREE.MathUtils.randFloat(0.35, 0.85), 9, 8
    ),
    leafMaterials[Math.floor(Math.random() * leafMaterials.length)]
  );

  bush.position.set(x, 0.5, z);
  bush.scale.y = 0.7;
  scene.add(bush);
}

/* ===== GUNUNG BERWARNA ===== */

const mountainMaterials = [
  material(0x426c61),
  material(0x597d69),
  material(0x81917b),
  material(0x9a987a)
];

function makeMountain(x, z, size) {
  const mountain = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.ConeGeometry(size, size * 1.8, 8),
    mountainMaterials[Math.floor(Math.random() * 4)]
  );

  base.position.y = size * 0.85;
  base.castShadow = true;
  mountain.add(base);

  const snowCap = new THREE.Mesh(
    new THREE.ConeGeometry(size * 0.3, size * 0.55, 8),
    snow
  );

  snowCap.position.y = size * 1.58;
  mountain.add(snowCap);

  // Tumbuhan di kaki gunung
  for (let i = 0; i < 12; i++) {
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 8, 7),
      leafMaterials[i % leafMaterials.length]
    );

    const angle = i * Math.PI / 6;
    bush.position.set(
      Math.cos(angle) * size * 0.55,
      size * 0.25,
      Math.sin(angle) * size * 0.55
    );

    bush.scale.set(1.3, 0.7, 1);
    mountain.add(bush);
  }

  mountain.position.set(x, 0, z);
  scene.add(mountain);

  obstacles.push({ x, z, radius: size * 0.7 });
}

for (let i = 0; i < 22; i++) {
  const side = i % 2 ? 1 : -1;

  makeMountain(
    side * THREE.MathUtils.randFloat(50, 85),
    THREE.MathUtils.randFloatSpread(210),
    THREE.MathUtils.randFloat(10, 19)
  );
}

/* ===== AIR TERJUN ===== */

const waterfallMaterial = new THREE.MeshBasicMaterial({
  color: 0x8cecff,
  transparent: true,
  opacity: 0.75
});

const waterfalls = [];

for (let i = 0; i < 5; i++) {
  const fall = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 12),
    waterfallMaterial.clone()
  );

  fall.position.set(
    (i % 2 ? 1 : -1) * (50 + i * 5),
    11,
    -65 + i * 30
  );

  scene.add(fall);
  waterfalls.push(fall);
}

/* ===== KRISTAL AJAIB ===== */

const crystalColors = [
  0x20eaff,
  0xb34bff,
  0xff55a8,
  0x66ff93,
  0xffd447,
  0x5687ff
];

const crystalMaterials = crystalColors.map(color =>
  new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.5,
    metalness: 0.25,
    roughness: 0.18
  })
);

const crystals = [];

function makeCrystal(x, z, index) {
  const group = new THREE.Group();

  const colorIndex = index % crystalMaterials.length;
  const crystalMaterial = crystalMaterials[colorIndex];

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.1, 0),
    crystalMaterial
  );

  crystal.scale.set(0.8, 1.8, 0.8);
  crystal.castShadow = true;
  group.add(crystal);

  // Kristal kecil di sekeliling
  for (let i = 0; i < 3; i++) {
    const small = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      crystalMaterial
    );

    small.position.set(
      Math.cos(i * 2.1) * 1.1,
      0.4 + i * 0.3,
      Math.sin(i * 2.1) * 1.1
    );

    group.add(small);
  }

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.5, 0.25, 8),
    material(0x394b55)
  );

  base.position.y = -1.2;
  group.add(base);

  // Cahaya kristal
  const glow = new THREE.PointLight(crystalColors[colorIndex], 2.2, 10);
  glow.position.y = 1;
  group.add(glow);

  group.position.set(x, 1.6, z);
  scene.add(group);

  crystals.push({
    group,
    collected: false,
    magnet: false,
    phase: Math.random() * 6
  });
}

// Kristal di kedua-dua tebing
const crystalPlaces = [
  [-21, -65], [-25, -35], [-20, 28], [-26, 72],
  [-34, 48], [-40, -5], [21, -75], [24, -45],
  [20, 25], [27, 65], [35, 5], [42, 82],
  [47, -95], [-48, 95], [31, -105], [-30, -105]
];

crystalPlaces.forEach((place, i) => {
  makeCrystal(place[0], place[1], i);
});

/* ===== WATAK DINOSAUR ===== */

const heroes = {
  LALA: { color: 0x65c94c, belly: 0xc8e7a1, name: 'LALA – Wira Penyayang' },
  TORA: { color: 0xd96d37, belly: 0xf5c28c, name: 'TORA – Wira Berdaya Tahan' },
  'RAJA REX': { color: 0xd8a72c, belly: 0xffe7a0, name: 'RAJA REX – Wira Pemimpin' },
  BOBI: { color: 0x388fc7, belly: 0xb7e3ef, name: 'BOBI – Wira Warganegara Aktif' }
};

function makeDinosaur(type) {
  const data = heroes[type];
  const group = new THREE.Group();

  const skin = material(data.color);
  const belly = material(data.belly);
  const white = material(0xffffff);
  const black = material(0x111111);

  function sphere(parent, sx, sy, sz, mat, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 18, 14),
      mat
    );

    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  sphere(group, 1.05, 0.85, 1.45, skin, 0, 1.25, 0);
  sphere(group, 0.83, 0.55, 1.1, belly, 0, 0.95, -0.05);
  sphere(group, 0.55, 0.85, 0.55, skin, 0, 1.75, -0.9);
  sphere(group, 0.72, 0.68, 0.78, skin, 0, 2.35, -1.2);
  sphere(group, 0.5, 0.32, 0.55, skin, 0, 2.05, -1.72);

  for (const side of [-1, 1]) {
    sphere(group, 0.19, 0.2, 0.12, white, side * 0.48, 2.47, -1.67);
    sphere(group, 0.09, 0.11, 0.07, black, side * 0.49, 2.46, -1.78);
  }

  const legs = [];

  for (const side of [-1, 1]) {
    for (const front of [-1, 1]) {
      const leg = new THREE.Group();

      leg.position.set(side * 0.65, 0.95, front === 1 ? 0.75 : -0.75);

      sphere(leg, 0.27, 0.62, 0.3, skin, 0, -0.25, 0);
      sphere(leg, 0.32, 0.18, 0.38, belly, 0, -0.68, -0.03);

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
      material(0xffd43b)
    );

    crown.position.set(0, 3.03, -1.2);
    group.add(crown);
  }

  if (type === 'BOBI') {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.75, 0.35),
      material(0x173f68)
    );

    bag.position.set(0, 1.5, 0.95);
    group.add(bag);
  }

  group.userData = { legs, tail, type };
  return group;
}

/* ===== PEMAIN DAN PENGIKUT ===== */

let player;
let selectedHero = 'LALA';
const followers = [];

function setHero(type) {
  selectedHero = type;

  if (player) scene.remove(player);

  player = makeDinosaur(type);
  player.position.set(17, 0.65, 12);
  scene.add(player);

  followers.forEach(f => scene.remove(f));
  followers.length = 0;

  Object.keys(heroes).filter(n => n !== type).forEach((name, i) => {
    const follower = makeDinosaur(name);

    follower.position.set(
      17 + (i - 1) * 3,
      0.65,
      17 + i * 2
    );

    scene.add(follower);
    followers.push(follower);
  });

  const label = document.getElementById('hero-name');
  if (label) label.textContent = heroes[type].name;
}

setHero(selectedHero);

/* ===== MISI ===== */

const missionNames = [
  'Kumpul 3 kristal ajaib',
  'Kumpul 6 kristal ajaib',
  'Kumpul 9 kristal ajaib',
  'Seberangi jambatan',
  'Terokai kawasan hutan',
  'Berjalan sejauh 100 meter',
  'Selesaikan pengembaraan'
];

let collected = 0;
let distanceWalked = 0;
let crossedBridge = false;
let exploredForest = false;
const missionDone = new Set();

function setupMissions() {
  document.querySelectorAll('.mission-item').forEach((item, i) => {
    if (missionNames[i]) {
      item.textContent = '☆ ' + missionNames[i];
      item.style.display = '';
    }
  });
}

function completeMission(i) {
  if (missionDone.has(i)) return;

  missionDone.add(i);

  const items = document.querySelectorAll('.mission-item');
  if (items[i]) items[i].style.display = 'none';
}

function updateMissions() {
  if (collected >= 3) completeMission(0);
  if (collected >= 6) completeMission(1);
  if (collected >= 9) completeMission(2);
  if (crossedBridge) completeMission(3);
  if (exploredForest) completeMission(4);
  if (distanceWalked >= 100) completeMission(5);

  if (missionDone.size >= 6) completeMission(6);
}

setupMissions();

/* ===== MENU ===== */

const mainMenu = document.getElementById('main-menu');
const characterMenu = document.getElementById('character-menu');
const gameHud = document.getElementById('game-hud');

const startButton = document.getElementById('start-button');
const playButton = document.getElementById('play-button');

let gameStarted = false;

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
  });
}

/* ===== JOYSTICK ===== */

const touchControls = document.getElementById('touch-controls');

if (touchControls) {
  touchControls.innerHTML = `
    <div class="virtual-joystick" id="virtual-joystick">
      <div class="joystick-knob" id="joystick-knob"></div>
    </div>
    <div class="right-game-controls">
      <button class="jump-control" id="joystick-jump">LOMPAT</button>
      <button class="magic-control" id="joystick-magic">✦ SIHIR</button>
    </div>
  `;
}

const uiStyle = document.createElement('style');

uiStyle.textContent = `
#touch-controls {
  position:absolute;inset:auto 0 18px;
  display:flex;justify-content:space-between;
  align-items:flex-end;padding:0 22px;
  pointer-events:none;
}
.virtual-joystick {
  width:118px;height:118px;border:3px solid #ffffff75;
  border-radius:50%;background:radial-gradient(circle,#42677b99,#102d43dd);
  box-shadow:0 5px 18px #0008,inset 0 0 15px #ffffff22;
  display:flex;align-items:center;justify-content:center;
  position:relative;pointer-events:auto;touch-action:none;
}
.joystick-knob {
  width:52px;height:52px;border:3px solid #ffffffb0;
  border-radius:50%;background:linear-gradient(145deg,#e8faff,#5486a2);
  box-shadow:0 4px 12px #0008;position:absolute;
  left:50%;top:50%;transform:translate(-50%,-50%);
  pointer-events:none;
}
.right-game-controls {
  display:flex;flex-direction:column;gap:8px;
  align-items:center;pointer-events:auto;
}
.jump-control,.magic-control {
  width:70px;height:70px;border:3px solid #ffffffa0;
  border-radius:50%;color:white;font:900 12px Nunito,sans-serif;
  box-shadow:0 5px 15px #0008;touch-action:none;
}
.jump-control {
  background:radial-gradient(circle at 35% 30%,#ffcf68,#bd5d25);
}
.magic-control {
  background:radial-gradient(circle at 35% 30%,#e5aaff,#6637b8);
  box-shadow:0 0 18px #b77bff88;
}
.magic-control:active,.jump-control:active {transform:scale(.9);}
`;

document.head.appendChild(uiStyle);

const joystick = document.getElementById('virtual-joystick');
const knob = document.getElementById('joystick-knob');
const jumpButton = document.getElementById('joystick-jump');
const magicButton = document.getElementById('joystick-magic');

const keys = {};
let pointerId = null;
let jumpTime = 0;

function resetStick() {
  pointerId = null;

  keys.arrowleft = false;
  keys.arrowright = false;
  keys.arrowup = false;
  keys.arrowdown = false;

  if (knob) {
    knob.style.transform = 'translate(-50%,-50%)';
  }
}

function moveStick(event) {
  if (!joystick || !knob || pointerId !== event.pointerId) return;

  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let dx = event.clientX - cx;
  let dy = event.clientY - cy;

  const max = rect.width * 0.32;
  const len = Math.hypot(dx, dy);

  if (len > max) {
    dx = dx / len * max;
    dy = dy / len * max;
  }

  knob.style.transform =
    `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;

  keys.arrowleft = dx / max < -0.2;
  keys.arrowright = dx / max > 0.2;
  keys.arrowup = dy / max < -0.2;
  keys.arrowdown = dy / max > 0.2;
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
    jumpTime = 0.6;
  });
}

/* ===== SIHIR ===== */

let magicCooldown = 0;
let magicTime = 0;

const magicRing = new THREE.Mesh(
  new THREE.RingGeometry(0.8, 1.15, 64),
  new THREE.MeshBasicMaterial({
    color: 0xc58aff,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  })
);

magicRing.rotation.x = -Math.PI / 2;
magicRing.visible = false;
scene.add(magicRing);

function castMagic() {
  if (!gameStarted || magicCooldown > 0 || !player) return;

  magicCooldown = 1.4;
  magicTime = 0.7;

  magicRing.visible = true;
  magicRing.position.set(player.position.x, 0.3, player.position.z);
  magicRing.scale.set(1, 1, 1);

  crystals.forEach(c => {
    if (c.collected) return;

    const distance = c.group.position.distanceTo(
      new THREE.Vector3(player.position.x, 1, player.position.z)
    );

    if (distance < 25) c.magnet = true;
  });

  const light = new THREE.PointLight(0xc56bff, 9, 18);
  light.position.set(player.position.x, 3, player.position.z);
  scene.add(light);

  setTimeout(() => scene.remove(light), 300);
}

if (magicButton) {
  magicButton.addEventListener('pointerdown', e => {
    e.preventDefault();
    castMagic();
  });
}

/* ===== PERGERAKAN DAN JAMBATAN ===== */

function onBridge(x, z) {
  return Math.abs(x) < 18.5 && Math.abs(z) < 3.7;
}

function canMoveTo(x, z) {
  // Sungai boleh diseberangi hanya melalui jambatan
  if (Math.abs(x) < 12.5 && !onBridge(x, z)) {
    return false;
  }

  for (const o of obstacles) {
    const dx = x - o.x;
    const dz = z - o.z;

    if (Math.hypot(dx, dz) < o.radius + 0.9) {
      return false;
    }
  }

  return Math.abs(x) < 95 && Math.abs(z) < 110;
}

/* ===== KAMERA ===== */

camera.position.set(17, 40, 25);
camera.lookAt(17, 0, 12);

/* ===== ANIMASI AIR DAN ALAM ===== */

function animateWater(time, delta) {
  for (let i = 0; i < waterPositions.count; i++) {
    const x = originalWater[i * 3];
    const y = originalWater[i * 3 + 1];

    waterPositions.array[i * 3 + 2] =
      originalWater[i * 3 + 2] +
      Math.sin(x * 0.5 + time * 2) * 0.12 +
      Math.sin(y * 0.18 - time * 1.5) * 0.1;
  }

  waterPositions.needsUpdate = true;
  riverGeometry.computeVertexNormals();

  ripples.forEach(r => {
    r.position.z += r.userData.speed * delta;

    if (r.position.z > 115) r.position.z = -115;

    const scale = 0.8 + Math.abs(Math.sin(time * 2 + r.userData.phase)) * 0.6;
    r.scale.set(scale, scale, 1);
  });

  waterfalls.forEach((fall, i) => {
    fall.material.opacity = 0.55 + Math.sin(time * 3 + i) * 0.15;
    fall.position.y = 11 + Math.sin(time * 2 + i) * 0.25;
  });
}

function animateTrees(time) {
  trees.forEach(t => {
    t.group.rotation.z = Math.sin(time + t.phase) * 0.035;

    t.leaves.forEach((leaf, i) => {
      leaf.rotation.z = Math.sin(time * 1.7 + t.phase + i) * 0.04;
    });
  });
}

/* ===== KUTIP KRISTAL ===== */

function updateCrystals(time, delta) {
  crystals.forEach(c => {
    if (c.collected) return;

    c.group.rotation.y = time * 0.6;
    c.group.position.y = 1.6 + Math.sin(time * 2 + c.phase) * 0.2;

    if (!player || !gameStarted) return;

    const target = new THREE.Vector3(
      player.position.x,
      player.position.y + 1,
      player.position.z
    );

    if (c.magnet) {
      c.group.position.lerp(target, Math.min(delta * 4, 1));
    }

    if (c.group.position.distanceTo(target) < 2.4) {
      c.collected = true;
      c.group.visible = false;
      collected++;

      const indicator = document.getElementById('voice-indicator');
      if (indicator) {
        indicator.textContent = '✨ Kristal diperoleh! ' + collected;
      }

      updateMissions();
    }
  });
}

/* ===== PEMAIN ===== */

function updatePlayer(delta, time) {
  if (!gameStarted || !player) return;

  let dx = 0;
  let dz = 0;

  if (keys.arrowleft || keys.a) dx -= 1;
  if (keys.arrowright || keys.d) dx += 1;
  if (keys.arrowup || keys.w) dz -= 1;
  if (keys.arrowdown || keys.s) dz += 1;

  const moving = dx !== 0 || dz !== 0;

  if (moving) {
    const length = Math.hypot(dx, dz);
    dx /= length;
    dz /= length;

    const speed = 10;
    const nx = player.position.x + dx * speed * delta;
    const nz = player.position.z + dz * speed * delta;

    if (canMoveTo(nx, player.position.z)) {
      player.position.x = nx;
    }

    if (canMoveTo(player.position.x, nz)) {
      player.position.z = nz;
    }

    player.rotation.y = Math.atan2(-dx, -dz);
    distanceWalked += speed * delta;
  }

  // Naik ke aras jambatan apabila berada di atasnya
  const onWoodBridge = onBridge(player.position.x, player.position.z);
  const groundHeight = onWoodBridge ? 1.05 : 0;

  if (jumpTime > 0) {
    jumpTime -= delta;
    player.position.y = groundHeight +
      Math.sin((0.6 - jumpTime) / 0.6 * Math.PI) * 2;
  } else {
    player.position.y = groundHeight;
  }

  player.userData.legs.forEach((leg, i) => {
    leg.rotation.x = moving
      ? Math.sin(time * 10 + i * Math.PI) * 0.55
      : Math.sin(time * 2 + i) * 0.025;
  });

  player.userData.tail.rotation.z = Math.sin(time * 3) * 0.15;

  followers.forEach((f, i) => {
    const targetX = player.position.x + (i - 1) * 3;
    const targetZ = player.position.z + 4 + i * 2;

    f.position.x += (targetX - f.position.x) * Math.min(delta * 2, 1);
    f.position.z += (targetZ - f.position.z) * Math.min(delta * 2, 1);

    const followerOnBridge = onBridge(f.position.x, f.position.z);
    f.position.y = followerOnBridge ? 1.05 : 0;

    f.rotation.y = Math.atan2(
      player.position.x - f.position.x,
      player.position.z - f.position.z
    );
  });

  // Kamera dari atas dan condong ke bawah
  const desiredCamera = new THREE.Vector3(
    player.position.x,
    40,
    player.position.z + 14
  );

  camera.position.lerp(desiredCamera, Math.min(delta * 3, 1));

  camera.lookAt(
    player.position.x,
    0,
    player.position.z
  );

  if (onWoodBridge) crossedBridge = true;
  if (Math.abs(player.position.x) > 22) exploredForest = true;

  updateMissions();
}

/* ===== ANIMASI SIHIR ===== */

function updateMagic(delta) {
  if (magicCooldown > 0) magicCooldown -= delta;

  if (magicTime > 0) {
    magicTime -= delta;

    const progress = 1 - magicTime / 0.7;
    const scale = 1 + progress * 13;

    magicRing.scale.set(scale, scale, 1);
    magicRing.material.opacity = Math.max(0, 0.9 * (1 - progress));

    if (player) {
      magicRing.position.x = player.position.x;
      magicRing.position.z = player.position.z;
    }
  } else {
    magicRing.visible = false;
  }
}

/* ===== GELUNG UTAMA ===== */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;

  animateWater(time, delta);
  animateTrees(time);
  updatePlayer(delta, time);
  updateCrystals(time, delta);
  updateMagic(delta);

  renderer.render(scene, camera);
}

animate();

/* ===== SKRIN ===== */

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
});
