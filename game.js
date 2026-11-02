
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* =========================================
   MAGICAL JURASSIC KINGDOM V11
   3D GAME ENGINE
========================================= */

const container = document.getElementById('game-container') || document.body;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8bc9df);
scene.fog = new THREE.Fog(0x8bc9df, 65, 190);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  400
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

/* =========================================
   LIGHTING
========================================= */

scene.add(new THREE.HemisphereLight(0xc9efff, 0x526044, 2));

const sun = new THREE.DirectionalLight(0xffedc4, 3);
sun.position.set(-35, 65, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -90;
sun.shadow.camera.right = 90;
sun.shadow.camera.top = 90;
sun.shadow.camera.bottom = -90;
scene.add(sun);

/* =========================================
   MATERIALS
========================================= */

const mat = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness
  });

const grassMat = mat(0x477d3e);
const darkGrassMat = mat(0x315c32);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x42c5e8,
  roughness: 0.2,
  metalness: 0.25,
  transparent: true,
  opacity: 0.86
});

/* =========================================
   WORLD
========================================= */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(260, 260, 32, 32),
  grassMat
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);

// River
const river = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 220),
  waterMat
);

river.rotation.x = -Math.PI / 2;
river.position.set(28, 0.03, 0);
scene.add(river);

// Mountains
function makeMountain(x, z, radius, height, color) {
  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 7),
    mat(color)
  );

  mountain.position.set(x, height / 2 - 1, z);
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  scene.add(mountain);
}

makeMountain(-65, -60, 30, 48, 0x52616b);
makeMountain(70, -85, 34, 58, 0x66534d);
makeMountain(-85, 70, 28, 42, 0x526b51);

// Volcano glow
const volcanoGlow = new THREE.PointLight(0xff6325, 20, 48);
volcanoGlow.position.set(70, 35, -85);
scene.add(volcanoGlow);

/* =========================================
   TREES
========================================= */

function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, 5, 8),
    mat(0x67432a)
  );

  trunk.position.y = 2.5;
  trunk.castShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.2, 1),
    mat(0x236b3d)
  );

  leaves.position.y = 6;
  leaves.castShadow = true;
  tree.add(leaves);

  const upperLeaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 1),
    mat(0x398c4b)
  );

  upperLeaves.position.set(0.5, 8, 0);
  tree.add(upperLeaves);

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);
}

for (let i = 0; i < 100; i++) {
  const x = (Math.random() - 0.5) * 210;
  const z = (Math.random() - 0.5) * 210;

  if (Math.abs(x - 28) < 13) continue;
  if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

  makeTree(x, z, 0.7 + Math.random() * 1.1);
}

/* =========================================
   DINOSAUR CHARACTER CREATOR
========================================= */

function makeDinosaur(config) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();

  root.add(bodyGroup);

  const skin = mat(config.color);
  const belly = mat(config.belly || 0xd9c39b);
  const dark = mat(config.dark || 0x24402e);
  const eyeMat = mat(0xffffff, 0.25);
  const black = mat(0x101010, 0.2);
  const clawMat = mat(0xe8d5ae);

  function sphere(parent, x, y, z, sx, sy, sz, material) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 18),
      material
    );

    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Body
  sphere(bodyGroup, 0, 2.1, 0, 1.25, 1.05, 1.65, skin);

  // Belly
  sphere(bodyGroup, 0, 1.65, -0.15, 0.91, 0.67, 1.32, belly);

  // Chest
  sphere(bodyGroup, 0, 2.55, -0.85, 0.85, 0.9, 0.8, skin);

  // Neck
  const neck = sphere(
    bodyGroup, 0, 2.85, -1.05,
    0.63, 0.78, 0.68, skin
  );

  // Head
  const head = new THREE.Group();
  head.position.set(0, 3.45, -1.65);
  bodyGroup.add(head);

  sphere(head, 0, 0, 0, 0.82, 0.78, 0.9, skin);

  // Snout
  sphere(head, 0, -0.2, -0.72, 0.62, 0.4, 0.7, skin);

  // Mouth
  sphere(head, 0, -0.48, -0.82, 0.43, 0.08, 0.45, dark);

  // Eyes
  for (const side of [-1, 1]) {
    sphere(head, side * 0.59, 0.22, -0.35, 0.22, 0.25, 0.16, eyeMat);
    sphere(head, side * 0.64, 0.22, -0.47, 0.105, 0.14, 0.09, black);

    // Eyebrows
    sphere(head, side * 0.59, 0.51, -0.38, 0.25, 0.08, 0.12, dark);
  }

  // Tail
  const tail = new THREE.Group();
  tail.position.set(0, 2.2, 1.25);
  bodyGroup.add(tail);

  const tailBase = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 2.1, 12),
    skin
  );

  tailBase.rotation.x = Math.PI / 2;
  tailBase.position.z = 0.95;
  tailBase.castShadow = true;
  tail.add(tailBase);

  // Legs
  const legs = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.73, 1.35, 0.35);
    bodyGroup.add(leg);

    sphere(leg, 0, -0.4, 0, 0.38, 0.75, 0.42, skin);
    sphere(leg, 0, -0.93, -0.08, 0.42, 0.22, 0.53, skin);

    for (let c = -1; c <= 1; c++) {
      sphere(
        leg,
        c * 0.2,
        -1.02,
        -0.45,
        0.08,
        0.07,
        0.16,
        clawMat
      );
    }

    legs.push(leg);
  }

  // Arms
  const arms = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.86, 2.65, -0.95);
    bodyGroup.add(arm);

    sphere(arm, 0, -0.25, 0, 0.22, 0.5, 0.24, skin);
    sphere(arm, 0, -0.5, -0.05, 0.25, 0.18, 0.28, skin);

    arms.push(arm);
  }

  // Back spikes
  for (let i = 0; i < 6; i++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.55, 7),
      dark
    );

    spike.position.set(
      0,
      3.05,
      0.95 - i * 0.42
    );

    spike.rotation.x = -0.15;
    spike.castShadow = true;
    bodyGroup.add(spike);
  }

  // TORA horns
  if (config.horns) {
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.9, 10),
        clawMat
      );

      horn.position.set(side * 0.68, 0.55, -0.1);
      horn.rotation.z = side * 0.4;
      horn.castShadow = true;
      head.add(horn);
    }
  }

  // Royal crown
  if (config.crown) {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 0.65, 5),
      mat(0xffd044, 0.3, 0.6)
    );

    crown.position.set(0, 0.9, 0);
    crown.rotation.y = Math.PI / 5;
    crown.castShadow = true;
    head.add(crown);
  }

  // Bobi explorer backpack
  if (config.backpack) {
    sphere(
      bodyGroup,
      0, 2.35, 1.05,
      0.55, 0.65, 0.42,
      mat(0x9b6635)
    );
  }

  root.userData = {
    bodyGroup,
    head,
    tail,
    legs,
    arms,
    walking: false,
    moving: false,
    speed: 0,
    phase: Math.random() * 10
  };

  return root;
}

/* =========================================
   FOUR HEROES
========================================= */

const heroes = [
  {
    name: 'LALA',
    role: 'Wira Penyayang',
    color: 0x55c85c,
    belly: 0xe6d6a6
  },
  {
    name: 'TORA',
    role: 'Wira Berdaya Tahan',
    color: 0xd85a3b,
    belly: 0xf1bd8a,
    horns: true
  },
  {
    name: 'RAJA REX',
    role: 'Wira Berupaya Memimpin',
    color: 0xe7a82f,
    belly: 0xffdf9c,
    crown: true
  },
  {
    name: 'BOBI',
    role: 'Wira Warganegara Aktif',
    color: 0x398dd8,
    belly: 0xb9e3ed,
    backpack: true
  }
];

const heroModels = heroes.map((hero, index) => {
  const model = makeDinosaur(hero);
  model.position.set(index * 3, 0, 0);
  scene.add(model);
  return model;
});

let selectedHero = 0;
let player = heroModels[0];

/* =========================================
   FOLLOWERS
========================================= */

const followers = [];

function selectHero(index) {
  selectedHero = index;
  player = heroModels[index];

  heroModels.forEach((hero, i) => {
    hero.visible = i === index;
  });

  followers.length = 0;

  heroModels.forEach((hero, i) => {
    if (i !== index) {
      hero.visible = true;
      followers.push(hero);
    }
  });

  player.position.set(0, 0, 0);

  followers.forEach((follower, i) => {
    follower.position.set(-3 - i * 2.3, 0, 3 + i * 1.5);
  });

  const name = document.getElementById('hero-name');
  if (name) name.textContent = heroes[index].name;
}

/* =========================================
   GAME MOVEMENT
========================================= */

const keys = {};
const velocity = new THREE.Vector3();

let jumping = false;
let jumpVelocity = 0;
let gameStarted = false;

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function movePlayer(delta) {
  if (!gameStarted) return;

  let dx = 0;
  let dz = 0;

  if (keys['arrowleft'] || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  if (keys['arrowup'] || keys['w']) dz -= 1;
  if (keys['arrowdown'] || keys['s']) dz += 1;

  const length = Math.hypot(dx, dz);

  const moving = length > 0;

  if (moving) {
    dx /= length;
    dz /= length;

    player.position.x += dx * 8 * delta;
    player.position.z += dz * 8 * delta;

    player.rotation.y = Math.atan2(-dx, -dz);
  }

  const data = player.userData;
  data.moving = moving;

  if (jumping) {
    player.position.y += jumpVelocity * delta;
    jumpVelocity -= 19 * delta;

    if (player.position.y <= 0) {
      player.position.y = 0;
      jumping = false;
      jumpVelocity = 0;
    }
  }

  animateDinosaur(player, delta, moving);

  followers.forEach((follower, i) => {
    const targetX = player.position.x - 3 - i * 1.4;
    const targetZ = player.position.z + 2 + i * 1.4;

    follower.position.x +=
      (targetX - follower.position.x) * Math.min(1, delta * 3);

    follower.position.z +=
      (targetZ - follower.position.z) * Math.min(1, delta * 3);

    animateDinosaur(follower, delta, true);
  });

  velocity.set(dx, 0, dz);
}

function animateDinosaur(model, delta, moving) {
  const data = model.userData;
  data.phase += delta * (moving ? 10 : 2);

  const swing = moving ? Math.sin(data.phase) * 0.55 : 0;

  data.legs[0].rotation.x = swing;
  data.legs[1].rotation.x = -swing;

  data.arms[0].rotation.x = -swing * 0.5;
  data.arms[1].rotation.x = swing * 0.5;

  data.tail.rotation.y = Math.sin(data.phase * 0.5) * 0.25;
  data.head.rotation.x = Math.sin(data.phase * 0.5) * 0.04;

  data.bodyGroup.position.y =
    moving ? Math.abs(Math.sin(data.phase * 2)) * 0.1 : 0;

  data.bodyGroup.rotation.z = moving
    ? Math.sin(data.phase) * 0.035
    : 0;
}

/* =========================================
   TOUCH CONTROLS
========================================= */

function bindControl(id, key) {
  const button = document.getElementById(id);
  if (!button) return;

  button.addEventListener('pointerdown', e => {
    e.preventDefault();
    keys[key] = true;
  });

  const release = e => {
    e.preventDefault();
    keys[key] = false;
  };

  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('pointerleave', release);
}

bindControl('left-btn', 'arrowleft');
bindControl('right-btn', 'arrowright');
bindControl('up-btn', 'arrowup');
bindControl('down-btn', 'arrowdown');

const jumpButton = document.getElementById('jump-btn');

if (jumpButton) {
  jumpButton.addEventListener('pointerdown', e => {
    e.preventDefault();

    if (!jumping) {
      jumping = true;
      jumpVelocity = 8.5;
    }
  });
}

/* =========================================
   CAMERA
========================================= */

const cameraOffset = new THREE.Vector3(0, 8, 13);

function updateCamera(delta) {
  const desired = new THREE.Vector3(
    player.position.x + cameraOffset.x,
    player.position.y + cameraOffset.y,
    player.position.z + cameraOffset.z
  );

  camera.position.lerp(
    desired,
    Math.min(1, delta * 4)
  );

  camera.lookAt(
    player.position.x,
    player.position.y + 2.3,
    player.position.z
  );
}

/* =========================================
   START GAME
========================================= */

function startGame() {
  gameStarted = true;

  const menu = document.getElementById('main-menu');
  const hud = document.getElementById('game-hud');
  const characterMenu = document.getElementById('character-menu');

  if (menu) menu.style.display = 'none';
  if (hud) hud.classList.add('active');
  if (characterMenu) characterMenu.classList.remove('active');

  selectHero(selectedHero);
}

const startButton = document.getElementById('start-button');
if (startButton) startButton.addEventListener('click', () => {
  const characterMenu = document.getElementById('character-menu');

  if (characterMenu) {
    characterMenu.classList.add('active');
  } else {
    startGame();
  }
});

const playButton = document.getElementById('play-button');
if (playButton) playButton.addEventListener('click', startGame);

/* =========================================
   CHARACTER MENU BUTTONS
========================================= */

document.querySelectorAll('[data-hero]').forEach(button => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.hero);

    if (index >= 0 && index < heroes.length) {
      selectHero(index);

      document.querySelectorAll('[data-hero]').forEach(el => {
        el.classList.remove('selected');
      });

      button.classList.add('selected');
    }
  });
});

/* =========================================
   MISSION DATA
========================================= */

const missions = [
  'Bantu anak dinosaur',
  'Kumpulkan telur dinosaur',
  'Cari kristal ajaib',
  'Jumpa penjaga sungai',
  'Teroka hutan purba',
  'Pergi ke gunung berapi',
  'Hadapi Raja Dinosaur'
];

let completedMissions = [];

function completeMission(index) {
  if (completedMissions.includes(index)) return;

  completedMissions.push(index);

  const items = document.querySelectorAll('.mission-item');
  if (items[index]) {
    items[index].classList.add('completed');
  }

  speak('Bagus! Misi berjaya diselesaikan!');
}

function speak(message) {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'ms-MY';
  utterance.rate = 0.9;
  utterance.pitch = 1.05;

  window.speechSynthesis.speak(utterance);
}

/* =========================================
   WORLD DECORATION
========================================= */

// Rocks
for (let i = 0; i < 45; i++) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(
      0.4 + Math.random() * 1.2,
      0
    ),
    mat(0x777d78)
  );

  rock.position.set(
    (Math.random() - 0.5) * 180,
    0.3,
    (Math.random() - 0.5) * 180
  );

  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  scene.add(rock);
}

// Crystals
for (let i = 0; i < 12; i++) {
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.1, 0),
    new THREE.MeshStandardMaterial({
      color: 0x68f1ff,
      emissive: 0x087eaa,
      emissiveIntensity: 1.1,
      metalness: 0.3,
      roughness: 0.2
    })
  );

  crystal.position.set(
    -30 + Math.random() * 60,
    1.5,
    -35 - Math.random() * 40
  );

  crystal.rotation.y = Math.random() * Math.PI;
  scene.add(crystal);
}

/* =========================================
   RESIZE
========================================= */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
});

/* =========================================
   GAME LOOP
========================================= */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);

  movePlayer(delta);
  updateCamera(delta);

  renderer.render(scene, camera);
}

selectHero(0);
animate();

console.log('MAGICAL JURASSIC KINGDOM V11 – 3D ENGINE READY');
