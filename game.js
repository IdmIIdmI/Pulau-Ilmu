
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* =========================================
   MAGICAL JURASSIC KINGDOM
   JOYSTICK + SIHIR + KRISTAL + KAMERA ATAS
========================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c9ed);
scene.fog = new THREE.Fog(0x91c9ed, 100, 250);

const camera = new THREE.PerspectiveCamera(
  58, window.innerWidth / window.innerHeight, 0.1, 500
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById('game-container').appendChild(renderer.domElement);

/* ===== CAHAYA ===== */

scene.add(new THREE.HemisphereLight(0xd9f2ff, 0x536b38, 2));

const sunlight = new THREE.DirectionalLight(0xfff2d5, 3);
sunlight.position.set(-35, 65, 25);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -100;
sunlight.shadow.camera.right = 100;
sunlight.shadow.camera.top = 100;
sunlight.shadow.camera.bottom = -100;
scene.add(sunlight);

/* ===== BAHAN ===== */

function mat(color, roughness = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

const grassMat = mat(0x477c38);
const darkGrassMat = mat(0x315c2c);
const trunkMat = mat(0x68452b);
const leafMats = [
  mat(0x246b36),
  mat(0x348b43),
  mat(0x4c9b48)
];

const rockMat = mat(0x737c80);
const mountainMat = mat(0x667c80);

/* ===== TANAH ===== */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  grassMat
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

for (let i = 0; i < 180; i++) {
  const patch = new THREE.Mesh(
    new THREE.CircleGeometry(THREE.MathUtils.randFloat(0.5, 2), 7),
    i % 2 ? darkGrassMat : grassMat
  );

  patch.rotation.x = -Math.PI / 2;
  patch.position.set(
    THREE.MathUtils.randFloatSpread(190),
    -0.12,
    THREE.MathUtils.randFloatSpread(190)
  );
  scene.add(patch);
}

/* ===== SUNGAI ===== */

const waterGeometry = new THREE.PlaneGeometry(25, 220, 55, 220);

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x168fba,
  roughness: 0.22,
  metalness: 0.12,
  transparent: true,
  opacity: 0.88
});

const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.set(0, 0.12, 0);
scene.add(water);

const waterPositions = waterGeometry.attributes.position;
const originalWater = waterPositions.array.slice();

const bankMat = mat(0x8c9b50);

for (const side of [-1, 1]) {
  const bank = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.5, 220),
    bankMat
  );
  bank.position.set(side * 14, 0.05, 0);
  scene.add(bank);
}

/* ===== RIAK AIR ===== */

const riverRipples = [];

for (let i = 0; i < 28; i++) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.25, 0.38, 32),
    new THREE.MeshBasicMaterial({
      color: 0xc4f5ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(
    THREE.MathUtils.randFloat(-10, 10),
    0.19,
    THREE.MathUtils.randFloatSpread(200)
  );

  ring.userData.speed = THREE.MathUtils.randFloat(1.5, 4);
  ring.userData.phase = Math.random() * 6;

  scene.add(ring);
  riverRipples.push(ring);
}

/* ===== POKOK HIDUP ===== */

const livingTrees = [];
const obstacles = [];

function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.55, 4.5, 9),
    trunkMat
  );

  trunk.position.y = 2.25;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves = [];

  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(1.7 - i * 0.12, 12, 10),
      leafMats[i % leafMats.length]
    );

    leaf.position.set(
      THREE.MathUtils.randFloatSpread(1.4),
      4.1 + i * 0.65,
      THREE.MathUtils.randFloatSpread(1.4)
    );

    leaf.scale.set(1.1, 1.1 + Math.random() * 0.3, 1);
    leaf.castShadow = true;
    tree.add(leaf);
    leaves.push(leaf);
  }

  for (let i = 0; i < 3; i++) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.2, 1.7, 7),
      trunkMat
    );

    branch.position.set(i % 2 ? 0.6 : -0.6, 3.4 + i * 0.35, 0);
    branch.rotation.z = i % 2 ? -0.65 : 0.65;
    tree.add(branch);
  }

  scene.add(tree);

  livingTrees.push({
    tree,
    leaves,
    phase: Math.random() * 6
  });

  obstacles.push({ x, z, radius: 1.3 * scale });
}

for (let i = 0; i < 48; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;

  makeTree(
    side * THREE.MathUtils.randFloat(19, 42),
    THREE.MathUtils.randFloatSpread(190),
    THREE.MathUtils.randFloat(0.75, 1.4)
  );
}

for (let i = 0; i < 25; i++) {
  const x = THREE.MathUtils.randFloatSpread(160);
  const z = THREE.MathUtils.randFloatSpread(190);

  if (Math.abs(x) > 18) {
    makeTree(x, z, THREE.MathUtils.randFloat(0.7, 1.2));
  }
}

/* ===== GUNUNG ===== */

function makeMountain(x, z, size) {
  const mountain = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.ConeGeometry(size, size * 1.8, 7),
    mountainMat
  );

  base.position.y = size * 0.85;
  base.castShadow = true;
  base.receiveShadow = true;
  mountain.add(base);

  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(size * 0.35, size * 0.6, 7),
    mat(0xd6e4df)
  );

  snow.position.y = size * 1.55;
  mountain.add(snow);

  mountain.position.set(x, 0, z);
  scene.add(mountain);

  obstacles.push({ x, z, radius: size * 0.72 });
}

for (let i = 0; i < 18; i++) {
  const side = i % 2 ? 1 : -1;

  makeMountain(
    side * THREE.MathUtils.randFloat(48, 75),
    THREE.MathUtils.randFloatSpread(190),
    THREE.MathUtils.randFloat(9, 17)
  );
}

/* ===== BATU ===== */

for (let i = 0; i < 45; i++) {
  const x = THREE.MathUtils.randFloatSpread(100);
  const z = THREE.MathUtils.randFloatSpread(180);

  if (Math.abs(x) < 17) continue;

  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(
      THREE.MathUtils.randFloat(0.5, 1.5), 0
    ),
    rockMat
  );

  rock.position.set(x, 0.7, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  scene.add(rock);

  obstacles.push({ x, z, radius: 1.1 });
}

/* ===== DINOSAUR ===== */

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

function makeDinosaur(type) {
  const data = heroes[type];
  const group = new THREE.Group();

  const skin = mat(data.color);
  const bellyMat = mat(data.belly);
  const white = mat(0xffffff);
  const black = mat(0x111111);

  function sphere(parent, sx, sy, sz, material, x, y, z) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 18, 14),
      material
    );

    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  sphere(group, 1.05, 0.85, 1.45, skin, 0, 1.25, 0);
  sphere(group, 0.83, 0.55, 1.1, bellyMat, 0, 0.95, -0.05);
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

      leg.position.set(
        side * 0.65,
        0.95,
        front === 1 ? 0.75 : -0.75
      );

      sphere(leg, 0.27, 0.62, 0.3, skin, 0, -0.25, 0);
      sphere(leg, 0.32, 0.18, 0.38, bellyMat, 0, -0.68, -0.03);

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
        mat(0xf5e4c1)
      );

      horn.position.set(side * 0.65, 2.95, -1.25);
      horn.rotation.z = side * 0.45;
      group.add(horn);
    }

    const noseHorn = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.6, 8),
      mat(0xf5e4c1)
    );

    noseHorn.position.set(0, 2.55, -1.95);
    noseHorn.rotation.x = -0.5;
    group.add(noseHorn);
  }

  if (type === 'RAJA REX') {
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.58, 0.35, 6),
      mat(0xffd43b, 0.4)
    );

    crown.position.set(0, 3.03, -1.2);
    group.add(crown);

    for (let i = 0; i < 3; i++) {
      const point = new THREE.Mesh(
        new THREE.ConeGeometry(0.13, 0.45, 5),
        mat(0xffd43b)
      );

      point.position.set((i - 1) * 0.35, 3.37, -1.2);
      group.add(point);
    }
  }

  if (type === 'BOBI') {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.75, 0.35),
      mat(0x173f68)
    );

    bag.position.set(0, 1.5, 0.95);
    group.add(bag);
  }

  group.userData = { legs, tail, type };
  return group;
}

/* ===== PEMAIN DAN PENGIKUT ===== */

let selectedHero = 'LALA';
let player;
const followers = [];

function setHero(type) {
  selectedHero = type;

  if (player) scene.remove(player);

  player = makeDinosaur(type);

  // Bermula di tebing kanan sungai
  player.position.set(17, 0, 12);
  scene.add(player);

  followers.forEach(follower => scene.remove(follower));
  followers.length = 0;

  Object.keys(heroes)
    .filter(name => name !== type)
    .forEach((name, index) => {
      const follower = makeDinosaur(name);

      follower.position.set(
        17 + (index - 1) * 3,
        0,
        17 + index * 2
      );

      scene.add(follower);
      followers.push(follower);
    });

  const heroName = document.getElementById('hero-name');
  if (heroName) heroName.textContent = heroes[type].name;
}

setHero(selectedHero);

/* ===== KRISTAL ===== */

const crystals = [];
const crystalMaterial = new THREE.MeshStandardMaterial({
  color: 0x7ff8ff,
  emissive: 0x1599c0,
  emissiveIntensity: 0.8,
  metalness: 0.35,
  roughness: 0.2
});

for (let i = 0; i < 12; i++) {
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.8, 0),
    crystalMaterial
  );

  // Kristal diletakkan di tebing, bukan di tengah sungai
  const side = i % 2 === 0 ? 1 : -1;

  crystal.position.set(
    side * THREE.MathUtils.randFloat(16, 23),
    1.2,
    THREE.MathUtils.randFloat(-85, 85)
  );

  crystal.castShadow = true;
  crystal.userData.magnet = false;

  scene.add(crystal);
  crystals.push(crystal);
}

/* ===== MISI ===== */

const missionTexts = [
  'Kumpul 3 kristal ajaib',
  'Kumpul 6 kristal ajaib',
  'Kumpul 9 kristal ajaib',
  'Terokai kawasan sungai',
  'Terokai kawasan hutan',
  'Berjalan sejauh 100 meter',
  'Selesaikan pengembaraan'
];

let collected = 0;
let distanceWalked = 0;
let riverVisited = false;
let forestVisited = false;
const missionDone = new Set();

function setupMissions() {
  const items = document.querySelectorAll('.mission-item');

  items.forEach((item, i) => {
    if (missionTexts[i]) {
      item.textContent = '☆ ' + missionTexts[i];
      item.style.display = '';
    }
  });
}

function completeMission(index) {
  if (missionDone.has(index)) return;

  missionDone.add(index);

  const items = document.querySelectorAll('.mission-item');
  if (items[index]) {
    items[index].style.display = 'none';
  }
}

function updateMissions() {
  if (collected >= 3) completeMission(0);
  if (collected >= 6) completeMission(1);
  if (collected >= 9) completeMission(2);
  if (riverVisited) completeMission(3);
  if (forestVisited) completeMission(4);
  if (distanceWalked >= 100) completeMission(5);

  if (missionDone.size >= 6) {
    completeMission(6);
  }
}

setupMissions();

/* ===== KAWALAN PAPAN KEKUNCI ===== */

const keys = {};

window.addEventListener('keydown', event => {
  keys[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', event => {
  keys[event.key.toLowerCase()] = false;
});

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
    const hero = button.dataset.hero;

    if (heroes[hero]) setHero(hero);

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

/* ===== KAMERA LEBIH TINGGI ===== */

camera.position.set(17, 38, 27);
camera.lookAt(17, 0, 12);

/* ===== JOYSTICK DAN BUTANG ===== */

// Cipta kawalan baharu
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

// Gaya butang sihir dan kawalan
const controlStyle = document.createElement('style');

controlStyle.textContent = `
.virtual-joystick {
  width:118px;height:118px;
  border:3px solid #ffffff75;border-radius:50%;
  background:radial-gradient(circle,#42677b99,#102d43dd);
  box-shadow:0 5px 18px #0008,inset 0 0 15px #ffffff22;
  display:flex;align-items:center;justify-content:center;
  position:relative;pointer-events:auto;touch-action:none;
}
.joystick-knob {
  width:52px;height:52px;border:3px solid #ffffffb0;
  border-radius:50%;
  background:linear-gradient(145deg,#e8faff,#5486a2);
  box-shadow:0 4px 12px #0008;
  position:absolute;left:50%;top:50%;
  transform:translate(-50%,-50%);pointer-events:none;
}
.right-game-controls {
  display:flex;flex-direction:column;gap:9px;
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
.magic-control:active,.jump-control:active {
  transform:scale(.9);
}
`;

document.head.appendChild(controlStyle);

const joystick = document.getElementById('virtual-joystick');
const knob = document.getElementById('joystick-knob');
const jumpControl = document.getElementById('joystick-jump');
const magicControl = document.getElementById('joystick-magic');

let joystickPointer = null;
let joystickX = 0;
let joystickY = 0;
let jumpTime = 0;

function resetJoystick() {
  joystickX = 0;
  joystickY = 0;

  if (knob) {
    knob.style.transform = 'translate(-50%, -50%)';
  }

  keys['arrowleft'] = false;
  keys['arrowright'] = false;
  keys['arrowup'] = false;
  keys['arrowdown'] = false;
}

function moveJoystick(event) {
  if (!joystick || !knob || joystickPointer !== event.pointerId) return;

  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;

  const maxDistance = rect.width * 0.32;
  const distance = Math.hypot(dx, dy);

  if (distance > maxDistance) {
    dx = dx / distance * maxDistance;
    dy = dy / distance * maxDistance;
  }

  joystickX = dx / maxDistance;
  joystickY = dy / maxDistance;

  knob.style.transform =
    `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

  keys['arrowleft'] = joystickX < -0.2;
  keys['arrowright'] = joystickX > 0.2;
  keys['arrowup'] = joystickY < -0.2;
  keys['arrowdown'] = joystickY > 0.2;
}

if (joystick) {
  joystick.addEventListener('pointerdown', event => {
    event.preventDefault();
    joystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    moveJoystick(event);
  });

  joystick.addEventListener('pointermove', moveJoystick);

  joystick.addEventListener('pointerup', () => {
    joystickPointer = null;
    resetJoystick();
  });

  joystick.addEventListener('pointercancel', () => {
    joystickPointer = null;
    resetJoystick();
  });
}

if (jumpControl) {
  jumpControl.addEventListener('pointerdown', event => {
    event.preventDefault();
    jumpTime = 0.55;
  });
}

/* ===== SISTEM SIHIR ===== */

let magicCooldown = 0;
let magicPulse = null;
let magicPulseTime = 0;

const magicRing = new THREE.Mesh(
  new THREE.RingGeometry(0.8, 1.15, 64),
  new THREE.MeshBasicMaterial({
    color: 0xc58aff,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false
  })
);

magicRing.rotation.x = -Math.PI / 2;
magicRing.visible = false;
scene.add(magicRing);

function castMagic() {
  if (!gameStarted || !player || magicCooldown > 0) return;

  magicCooldown = 1.3;
  magicPulseTime = 0.65;

  magicRing.position.set(
    player.position.x,
    0.25,
    player.position.z
  );

  magicRing.scale.set(1, 1, 1);
  magicRing.material.opacity = 0.9;
  magicRing.visible = true;

  // Kristal berhampiran akan ditarik ke arah pemain
  crystals.forEach(crystal => {
    if (!crystal.visible) return;

    const distance = crystal.position.distanceTo(
      new THREE.Vector3(
        player.position.x,
        1,
        player.position.z
      )
    );

    if (distance < 22) {
      crystal.userData.magnet = true;
    }
  });

  // Kesan cahaya ajaib
  const flash = new THREE.PointLight(0xb66bff, 7, 15);
  flash.position.set(
    player.position.x,
    3,
    player.position.z
  );
  scene.add(flash);

  setTimeout(() => scene.remove(flash), 250);
}

if (magicControl) {
  magicControl.addEventListener('pointerdown', event => {
    event.preventDefault();
    castMagic();
  });
}

/* ===== ANIMASI AIR ===== */

function animateWater(time, delta) {
  for (let i = 0; i < waterPositions.count; i++) {
    const x = originalWater[i * 3];
    const y = originalWater[i * 3 + 1];

    const wave =
      Math.sin(x * 0.5 + time * 2) * 0.12 +
      Math.sin(y * 0.18 - time * 1.5) * 0.1;

    waterPositions.array[i * 3 + 2] =
      originalWater[i * 3 + 2] + wave;
  }

  waterPositions.needsUpdate = true;
  waterGeometry.computeVertexNormals();

  riverRipples.forEach(ring => {
    ring.position.z += ring.userData.speed * delta;

    ring.material.opacity =
      0.2 + Math.abs(Math.sin(time * 2 + ring.userData.phase)) * 0.25;

    const scale =
      0.8 + Math.abs(Math.sin(time * 1.5 + ring.userData.phase)) * 0.7;

    ring.scale.set(scale, scale, 1);

    if (ring.position.z > 110) {
      ring.position.z = -110;
    }
  });
}

/* ===== ANIMASI POKOK ===== */

function animateNature(time) {
  livingTrees.forEach(data => {
    data.tree.rotation.z =
      Math.sin(time * 1.1 + data.phase) * 0.035;

    data.tree.rotation.x =
      Math.cos(time * 0.8 + data.phase) * 0.018;

    data.leaves.forEach((leaf, i) => {
      leaf.rotation.z =
        Math.sin(time * 1.7 + data.phase + i) * 0.035;
    });
  });
}

/* ===== HALANGAN ===== */

function canMoveTo(x, z) {
  for (const obstacle of obstacles) {
    const dx = x - obstacle.x;
    const dz = z - obstacle.z;

    if (Math.sqrt(dx * dx + dz * dz) < obstacle.radius + 0.9) {
      return false;
    }
  }

  if (Math.abs(x) > 95 || Math.abs(z) > 105) {
    return false;
  }

  // Sungai tidak boleh dilalui
  if (Math.abs(x) < 12.5) {
    return false;
  }

  return true;
}

/* ===== PERGERAKAN PEMAIN ===== */

function updatePlayer(delta, time) {
  if (!player || !gameStarted) return;

  let dx = 0;
  let dz = 0;

  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  if (keys['arrowup'] || keys['w']) dz -= 1;
  if (keys['arrowdown'] || keys['s']) dz += 1;

  const moving = dx !== 0 || dz !== 0;

  if (moving) {
    const length = Math.sqrt(dx * dx + dz * dz);
    dx /= length;
    dz /= length;

    const speed = 10;

    const nextX = player.position.x + dx * speed * delta;
    const nextZ = player.position.z + dz * speed * delta;

    if (canMoveTo(nextX, player.position.z)) {
      player.position.x = nextX;
    }

    if (canMoveTo(player.position.x, nextZ)) {
      player.position.z = nextZ;
    }

    player.rotation.y = Math.atan2(-dx, -dz);
    distanceWalked += speed * delta;
  }

  if (jumpTime > 0) {
    jumpTime -= delta;

    player.position.y =
      Math.sin((0.55 - jumpTime) / 0.55 * Math.PI) * 2;
  } else {
    player.position.y = 0;
  }

  player.userData.legs.forEach((leg, i) => {
    leg.rotation.x = moving
      ? Math.sin(time * 10 + i * Math.PI) * 0.55
      : Math.sin(time * 2 + i) * 0.025;
  });

  player.userData.tail.rotation.z = Math.sin(time * 3) * 0.15;

  // Pengikut
  followers.forEach((follower, i) => {
    const angle = time * 0.4 + i * 2.1;

    const targetX =
      player.position.x + Math.sin(angle) * (3 + i);

    const targetZ =
      player.position.z + 4 + i * 2;

    follower.position.x +=
      (targetX - follower.position.x) * Math.min(delta * 2, 1);

    follower.position.z +=
      (targetZ - follower.position.z) * Math.min(delta * 2, 1);

    follower.position.y = Math.sin(time * 3 + i) * 0.06;

    follower.rotation.y = Math.atan2(
      player.position.x - follower.position.x,
      player.position.z - follower.position.z
    );
  });

  // KAMERA LEBIH TINGGI DAN MENGIKUT PEMAIN
  const target = new THREE.Vector3(
    player.position.x,
    0,
    player.position.z
  );

  const desiredCamera = new THREE.Vector3(
    player.position.x,
    38,
    player.position.z + 13
  );

  camera.position.lerp(desiredCamera, Math.min(delta * 3, 1));
  camera.lookAt(target);

  if (Math.abs(player.position.x) < 18) riverVisited = true;
  if (Math.abs(player.position.x) > 20) forestVisited = true;

  updateMissions();
}

/* ===== KUTIP KRISTAL ===== */

function updateCrystals(time, delta) {
  crystals.forEach(crystal => {
    if (!crystal.visible) return;

    crystal.rotation.y = time * 1.4;

    if (!crystal.userData.magnet) {
      crystal.position.y =
        1.2 + Math.sin(time * 2 + crystal.position.z) * 0.25;
    }

    if (!player || !gameStarted) return;

    const playerTarget = new THREE.Vector3(
      player.position.x,
      player.position.y + 1,
      player.position.z
    );

    if (crystal.userData.magnet) {
      crystal.position.lerp(
        playerTarget,
        Math.min(delta * 4, 1)
      );
    }

    const distance = crystal.position.distanceTo(playerTarget);

    // Kutipan automatik apabila dekat
    if (distance < 2.2) {
      crystal.visible = false;
      crystal.userData.magnet = false;

      collected++;
      updateMissions();

      const indicator = document.getElementById('voice-indicator');
      if (indicator) {
        indicator.textContent = '✨ Kristal ajaib diperoleh! ' + collected;
      }
    }
  });
}

/* ===== ANIMASI SIHIR ===== */

function updateMagic(delta) {
  if (magicCooldown > 0) {
    magicCooldown -= delta;
  }

  if (magicPulseTime > 0) {
    magicPulseTime -= delta;

    const progress = 1 - magicPulseTime / 0.65;
    const scale = 1 + progress * 12;

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

/* ===== GELUNG PERMAINAN ===== */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;

  animateWater(time, delta);
  animateNature(time);
  updatePlayer(delta, time);
  updateCrystals(time, delta);
  updateMagic(delta);

  renderer.render(scene, camera);
}

animate();

/* ===== SAIZ SKRIN ===== */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
});
