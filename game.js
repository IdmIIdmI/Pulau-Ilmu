
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* =====================================================
   MAGICAL JURASSIC KINGDOM
   Versi: Nature Alive
   ===================================================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c9ed);
scene.fog = new THREE.Fog(0x91c9ed, 90, 230);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  500
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

/* -------------------- CAHAYA -------------------- */

scene.add(new THREE.HemisphereLight(0xd9f2ff, 0x536b38, 2));

const sunlight = new THREE.DirectionalLight(0xfff2d5, 3);
sunlight.position.set(-35, 65, 25);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -90;
sunlight.shadow.camera.right = 90;
sunlight.shadow.camera.top = 90;
sunlight.shadow.camera.bottom = -90;
scene.add(sunlight);

/* -------------------- BAHAN -------------------- */

function mat(color, roughness = 0.85) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness
  });
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

/* -------------------- TANAH -------------------- */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  grassMat
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
ground.receiveShadow = true;
scene.add(ground);

// Tompok rumput untuk menjadikan tanah lebih semula jadi
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

/* -------------------- SUNGAI -------------------- */

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
water.receiveShadow = true;
scene.add(water);

const waterPositions = waterGeometry.attributes.position;
const originalWater = waterPositions.array.slice();

const riverBankMat = mat(0x8c9b50);

for (const side of [-1, 1]) {
  const bank = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.5, 220),
    riverBankMat
  );
  bank.position.set(side * 14, 0.05, 0);
  scene.add(bank);
}

/* Riak air bergerak */

const riverRipples = [];

for (let i = 0; i < 24; i++) {
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xc4f5ff,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide
  });

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.25, 0.38, 32),
    ringMaterial
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.set(
    THREE.MathUtils.randFloat(-10, 10),
    0.19,
    THREE.MathUtils.randFloatSpread(200)
  );

  ring.userData.speed = THREE.MathUtils.randFloat(1.5, 4);
  ring.userData.phase = Math.random() * Math.PI * 2;

  scene.add(ring);
  riverRipples.push(ring);
}

/* -------------------- POKOK HIDUP -------------------- */

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

    leaf.scale.set(
      1.1,
      1.1 + Math.random() * 0.3,
      1
    );

    leaf.castShadow = true;
    tree.add(leaf);
    leaves.push(leaf);
  }

  // Cabang pokok
  for (let i = 0; i < 3; i++) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.2, 1.7, 7),
      trunkMat
    );
    branch.position.set(
      i % 2 ? 0.6 : -0.6,
      3.4 + i * 0.35,
      0
    );
    branch.rotation.z = i % 2 ? -0.65 : 0.65;
    tree.add(branch);
  }

  scene.add(tree);

  livingTrees.push({
    tree,
    leaves,
    phase: Math.random() * Math.PI * 2
  });

  obstacles.push({
    x,
    z,
    radius: 1.3 * scale
  });
}

// Hutan di kiri dan kanan kawasan
for (let i = 0; i < 48; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;
  const x = side * THREE.MathUtils.randFloat(19, 42);
  const z = THREE.MathUtils.randFloatSpread(190);
  makeTree(x, z, THREE.MathUtils.randFloat(0.75, 1.4));
}

// Pokok tambahan di kawasan luar
for (let i = 0; i < 25; i++) {
  const x = THREE.MathUtils.randFloatSpread(160);
  const z = THREE.MathUtils.randFloatSpread(190);

  if (Math.abs(x) > 18) {
    makeTree(x, z, THREE.MathUtils.randFloat(0.7, 1.2));
  }
}

/* -------------------- GUNUNG -------------------- */

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

  obstacles.push({
    x,
    z,
    radius: size * 0.72
  });
}

for (let i = 0; i < 18; i++) {
  const side = i % 2 ? 1 : -1;
  makeMountain(
    side * THREE.MathUtils.randFloat(48, 75),
    THREE.MathUtils.randFloatSpread(190),
    THREE.MathUtils.randFloat(9, 17)
  );
}

/* -------------------- BATU -------------------- */

for (let i = 0; i < 45; i++) {
  const x = THREE.MathUtils.randFloatSpread(100);
  const z = THREE.MathUtils.randFloatSpread(180);

  if (Math.abs(x) < 17) continue;

  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(
      THREE.MathUtils.randFloat(0.5, 1.5),
      0
    ),
    rockMat
  );

  rock.position.set(x, 0.7, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  scene.add(rock);

  obstacles.push({
    x,
    z,
    radius: 1.1
  });
}

/* -------------------- DINOSAUR -------------------- */

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
  const dark = mat(0x26312b);
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

  // Badan
  sphere(group, 1.05, 0.85, 1.45, skin, 0, 1.25, 0);

  // Perut
  sphere(group, 0.83, 0.55, 1.1, bellyMat, 0, 0.95, -0.05);

  // Leher
  sphere(group, 0.55, 0.85, 0.55, skin, 0, 1.75, -0.9);

  // Kepala
  sphere(group, 0.72, 0.68, 0.78, skin, 0, 2.35, -1.2);

  // Muncung
  sphere(group, 0.5, 0.32, 0.55, skin, 0, 2.05, -1.72);

  // Mata
  for (const side of [-1, 1]) {
    sphere(group, 0.19, 0.2, 0.12, white, side * 0.48, 2.47, -1.67);
    sphere(group, 0.09, 0.11, 0.07, black, side * 0.49, 2.46, -1.78);
  }

  // Kaki
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

  // Ekor
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 2.1, 10),
    skin
  );
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 1.25, 1.75);
  tail.castShadow = true;
  group.add(tail);

  // Tanduk untuk TORA
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

  // Mahkota untuk RAJA REX
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

  // Beg kecil untuk BOBI
  if (type === 'BOBI') {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.75, 0.35),
      mat(0x173f68)
    );
    bag.position.set(0, 1.5, 0.95);
    group.add(bag);
  }

  group.userData = {
    legs,
    tail,
    type
  };

  return group;
}

/* -------------------- WATAK & PENGIKUT -------------------- */

let selectedHero = 'LALA';
let player;
const followers = [];

function setHero(type) {
  selectedHero = type;

  if (player) {
    scene.remove(player);
  }

  player = makeDinosaur(type);
  player.position.set(0, 0, 12);
  scene.add(player);

  followers.forEach(follower => scene.remove(follower));

  followers.length = 0;

  Object.keys(heroes)
    .filter(name => name !== type)
    .forEach((name, index) => {
      const follower = makeDinosaur(name);
      follower.position.set(
        (index - 1) * 3,
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

/* -------------------- KRISTAL MISI -------------------- */

const crystals = [];
const crystalMat = new THREE.MeshStandardMaterial({
  color: 0x7ff8ff,
  emissive: 0x1599c0,
  emissiveIntensity: 0.8,
  metalness: 0.35,
  roughness: 0.2
});

for (let i = 0; i < 12; i++) {
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.8, 0),
    crystalMat
  );

  crystal.position.set(
    THREE.MathUtils.randFloat(-10, 10),
    1.2,
    THREE.MathUtils.randFloat(-85, 85)
  );

  crystal.castShadow = true;
  scene.add(crystal);
  crystals.push(crystal);
}

/* -------------------- MISI -------------------- */

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
let missionDone = new Set();

function setupMissions() {
  const panel = document.querySelector('#mission-panel');
  if (!panel) return;

  const items = panel.querySelectorAll('.mission-item');

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

/* -------------------- KAWALAN -------------------- */

const keys = {};
let moving = false;
let gameStarted = false;
let jumpTime = 0;

window.addEventListener('keydown', event => {
  keys[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', event => {
  keys[event.key.toLowerCase()] = false;
});

function bindHold(id, key) {
  const button = document.getElementById(id);
  if (!button) return;

  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    keys[key] = true;
  });

  ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => {
    button.addEventListener(type, () => {
      keys[key] = false;
    });
  });
}

bindHold('left-btn', 'arrowleft');
bindHold('right-btn', 'arrowright');
bindHold('up-btn', 'arrowup');
bindHold('down-btn', 'arrowdown');

const jumpButton = document.getElementById('jump-btn');

if (jumpButton) {
  jumpButton.addEventListener('pointerdown', event => {
    event.preventDefault();
    jumpTime = 0.55;
  });
}

/* -------------------- MENU -------------------- */

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

/* -------------------- KAMERA -------------------- */

camera.position.set(0, 25, 22);
camera.lookAt(0, 0, 12);

/* -------------------- ANIMASI ALAM -------------------- */

const clock = new THREE.Clock();

function animateWater(time) {
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
    ring.position.z += ring.userData.speed * 0.016;
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

function animateNature(time) {
  livingTrees.forEach(data => {
    const sway = Math.sin(time * 1.1 + data.phase) * 0.035;

    data.tree.rotation.z = sway;
    data.tree.rotation.x =
      Math.cos(time * 0.8 + data.phase) * 0.018;

    data.leaves.forEach((leaf, i) => {
      leaf.rotation.z =
        Math.sin(time * 1.7 + data.phase + i) * 0.035;
    });
  });
}

/* -------------------- PERGERAKAN -------------------- */

function canMoveTo(x, z) {
  // Halang watak masuk ke dalam gunung, pokok dan batu
  for (const obstacle of obstacles) {
    const dx = x - obstacle.x;
    const dz = z - obstacle.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < obstacle.radius + 0.9) {
      return false;
    }
  }

  // Had kawasan permainan
  if (Math.abs(x) > 95 || Math.abs(z) > 105) {
    return false;
  }

  // Jangan benarkan watak berjalan ke tengah sungai
  if (Math.abs(x) < 12.5) {
    return false;
  }

  return true;
}

function updatePlayer(delta, time) {
  if (!player || !gameStarted) return;

  let dx = 0;
  let dz = 0;

  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  if (keys['arrowup'] || keys['w']) dz -= 1;
  if (keys['arrowdown'] || keys['s']) dz += 1;

  moving = dx !== 0 || dz !== 0;

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

  // Lompat
  if (jumpTime > 0) {
    jumpTime -= delta;
    player.position.y = Math.sin(
      (0.55 - jumpTime) / 0.55 * Math.PI
    ) * 2;
  } else {
    player.position.y = 0;
  }

  // Animasi kaki dan ekor
  player.userData.legs.forEach((leg, i) => {
    leg.rotation.x = moving
      ? Math.sin(time * 10 + i * Math.PI) * 0.55
      : Math.sin(time * 2 + i) * 0.025;
  });

  player.userData.tail.rotation.z =
    Math.sin(time * 3) * 0.15;

  // Pengikut ikut pemain
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

    follower.position.y =
      Math.sin(time * 3 + i) * 0.06;

    const angleToPlayer = Math.atan2(
      player.position.x - follower.position.x,
      player.position.z - follower.position.z
    );

    follower.rotation.y = angleToPlayer;
  });

  // Kamera ikut watak dari pandangan atas
  const cameraTarget = new THREE.Vector3(
    player.position.x,
    0,
    player.position.z
  );

  const desiredCamera = new THREE.Vector3(
    player.position.x,
    25,
    player.position.z + 17
  );

  camera.position.lerp(desiredCamera, Math.min(delta * 3, 1));
  camera.lookAt(cameraTarget);

  // Kesan lawatan
  if (Math.abs(player.position.x) < 18) {
    riverVisited = true;
  }

  if (Math.abs(player.position.x) > 20) {
    forestVisited = true;
  }

  updateMissions();
}

/* -------------------- KUTIP KRISTAL -------------------- */

function updateCrystals(time) {
  crystals.forEach(crystal => {
    if (!crystal.visible) return;

    crystal.rotation.y = time * 1.4;
    crystal.position.y =
      1.2 + Math.sin(time * 2 + crystal.position.z) * 0.25;

    if (!player || !gameStarted) return;

    const distance = crystal.position.distanceTo(
      new THREE.Vector3(
        player.position.x,
        player.position.y + 1,
        player.position.z
      )
    );

    if (distance < 2.2) {
      crystal.visible = false;
      collected++;
      updateMissions();
    }
  });
}

/* -------------------- PAPARAN -------------------- */

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;

  animateWater(time);
  animateNature(time);
  updatePlayer(delta, time);
  updateCrystals(time);

  renderer.render(scene, camera);
}

animate();

/* -------------------- SAIZ SKRIN -------------------- */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
});
