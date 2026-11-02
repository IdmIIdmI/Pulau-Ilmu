
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* MAGICAL JURASSIC KINGDOM V11.1 */

const container = document.getElementById('game-container');
const scene = new THREE.Scene();

scene.background = new THREE.Color(0x91c9df);
scene.fog = new THREE.Fog(0x91c9df, 100, 240);

const camera = new THREE.PerspectiveCamera(
  58, window.innerWidth / window.innerHeight, 0.1, 500
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

/* LIGHT */

scene.add(new THREE.HemisphereLight(0xdaf5ff, 0x526044, 2.1));

const sun = new THREE.DirectionalLight(0xffedc4, 2.8);
sun.position.set(-40, 80, 30);
scene.add(sun);

/* MATERIAL */

const material = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

/* GROUND */

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(260, 260),
  material(0x477d3e)
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.15;
scene.add(ground);

/* WATER - ANIMATED */

const waterGeometry = new THREE.PlaneGeometry(18, 220, 32, 160);

const water = new THREE.Mesh(
  waterGeometry,
  new THREE.MeshStandardMaterial({
    color: 0x38bfe8,
    roughness: 0.18,
    metalness: 0.22,
    transparent: true,
    opacity: 0.9
  })
);

water.rotation.x = -Math.PI / 2;
water.position.set(28, 0.12, 0);
scene.add(water);

const waterPositions = waterGeometry.attributes.position;
const originalWater = waterPositions.array.slice();

/* MOUNTAINS AND COLLISION */

const obstacles = [];

function makeMountain(x, z, radius, height, color) {
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 9),
    material(color)
  );

  mesh.position.set(x, height / 2 - 0.1, z);
  mesh.castShadow = true;
  scene.add(mesh);

  obstacles.push({ x, z, radius: radius * 0.78 });
}

makeMountain(-65, -60, 30, 48, 0x52616b);
makeMountain(70, -85, 34, 58, 0x66534d);
makeMountain(-85, 70, 28, 42, 0x526b51);

/* TREES */

function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, 5, 8),
    material(0x67432a)
  );
  trunk.position.y = 2.5;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.2, 1),
    material(0x236b3d)
  );
  leaves.position.y = 6;
  tree.add(leaves);

  const top = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 1),
    material(0x398c4b)
  );
  top.position.set(0.5, 8, 0);
  tree.add(top);

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);

  obstacles.push({
    x, z, radius: 2.3 * scale
  });
}

for (let i = 0; i < 100; i++) {
  const x = (Math.random() - 0.5) * 210;
  const z = (Math.random() - 0.5) * 210;

  if (Math.abs(x - 28) < 13) continue;
  if (Math.abs(x) < 16 && Math.abs(z) < 16) continue;

  makeTree(x, z, 0.7 + Math.random() * 0.9);
}

/* DINOSAUR */

function makeDinosaur(config) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skin = material(config.color);
  const belly = material(config.belly);
  const dark = material(0x263b32);
  const white = material(0xffffff);
  const black = material(0x101010);
  const claw = material(0xe8d5ae);

  function ball(parent, x, y, z, sx, sy, sz, mat) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 16), mat
    );
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  }

  ball(body, 0, 2.1, 0, 1.25, 1.05, 1.65, skin);
  ball(body, 0, 1.65, -0.15, 0.91, 0.67, 1.32, belly);
  ball(body, 0, 2.55, -0.85, 0.85, 0.9, 0.8, skin);

  const head = new THREE.Group();
  head.position.set(0, 3.45, -1.65);
  body.add(head);

  ball(head, 0, 0, 0, 0.82, 0.78, 0.9, skin);
  ball(head, 0, -0.2, -0.72, 0.62, 0.4, 0.7, skin);
  ball(head, 0, -0.48, -0.82, 0.43, 0.08, 0.45, dark);

  for (const side of [-1, 1]) {
    ball(head, side * 0.59, 0.22, -0.35, 0.22, 0.25, 0.16, white);
    ball(head, side * 0.64, 0.22, -0.47, 0.105, 0.14, 0.09, black);
    ball(head, side * 0.59, 0.51, -0.38, 0.25, 0.08, 0.12, dark);
  }

  const tail = new THREE.Group();
  tail.position.set(0, 2.2, 1.25);
  body.add(tail);

  const tailMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 2.1, 12),
    skin
  );
  tailMesh.rotation.x = Math.PI / 2;
  tailMesh.position.z = 0.95;
  tail.add(tailMesh);

  const legs = [];
  const arms = [];

  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.73, 1.35, 0.35);
    body.add(leg);

    ball(leg, 0, -0.4, 0, 0.38, 0.75, 0.42, skin);
    ball(leg, 0, -0.93, -0.08, 0.42, 0.22, 0.53, skin);

    for (let c = -1; c <= 1; c++) {
      ball(leg, c * 0.2, -1.02, -0.45,
        0.08, 0.07, 0.16, claw);
    }
    legs.push(leg);

    const arm = new THREE.Group();
    arm.position.set(side * 0.86, 2.65, -0.95);
    body.add(arm);

    ball(arm, 0, -0.25, 0, 0.22, 0.5, 0.24, skin);
    ball(arm, 0, -0.5, -0.05, 0.25, 0.18, 0.28, skin);
    arms.push(arm);
  }

  for (let i = 0; i < 6; i++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.55, 7), dark
    );
    spike.position.set(0, 3.05, 0.95 - i * 0.42);
    body.add(spike);
  }

  if (config.horns) {
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.9, 10), claw
      );
      horn.position.set(side * 0.68, 0.55, -0.1);
      horn.rotation.z = side * 0.4;
      head.add(horn);
    }
  }

  if (config.crown) {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 0.65, 5),
      material(0xffd044, 0.3, 0.5)
    );
    crown.position.y = 0.9;
    head.add(crown);
  }

  if (config.backpack) {
    ball(body, 0, 2.35, 1.05, 0.55, 0.65, 0.42,
      material(0x9b6635));
  }

  root.userData = { body, head, tail, legs, arms, phase: 0 };
  return root;
}

/* FOUR HEROES */

const heroes = [
  { name: 'LALA', color: 0x55c85c, belly: 0xe6d6a6 },
  { name: 'TORA', color: 0xd85a3b, belly: 0xf1bd8a, horns: true },
  { name: 'RAJA REX', color: 0xe7a82f, belly: 0xffdf9c, crown: true },
  { name: 'BOBI', color: 0x398dd8, belly: 0xb9e3ed, backpack: true }
];

const models = heroes.map((h, i) => {
  const d = makeDinosaur(h);
  d.position.set(i * 3, 0, 0);
  scene.add(d);
  return d;
});

let selectedHero = 0;
let player = models[0];
let followers = [];

function selectHero(index) {
  selectedHero = index;
  player = models[index];

  models.forEach((m, i) => {
    m.visible = true;
    if (i !== index) {
      m.position.set(-3 - i * 2, 0, 3 + i);
    }
  });

  followers = models.filter((m, i) => i !== index);
  player.position.set(0, 0, 0);

  const name = document.getElementById('hero-name');
  if (name) name.textContent = heroes[index].name;
}

/* CHARACTER MENU */

document.querySelectorAll('[data-hero]').forEach(button => {
  button.addEventListener('click', () => {
    const index = Number(button.dataset.hero);
    if (index < 0 || index > 3) return;

    selectHero(index);

    document.querySelectorAll('[data-hero]').forEach(el =>
      el.classList.remove('selected')
    );
    button.classList.add('selected');
  });
});

const startButton = document.getElementById('start-button');
const characterMenu = document.getElementById('character-menu');
const mainMenu = document.getElementById('main-menu');
const hud = document.getElementById('game-hud');

let gameStarted = false;

if (startButton) {
  startButton.addEventListener('click', () => {
    if (characterMenu) characterMenu.classList.add('active');
  });
}

const playButton = document.getElementById('play-button');

if (playButton) {
  playButton.addEventListener('click', () => {
    gameStarted = true;
    if (mainMenu) mainMenu.style.display = 'none';
    if (characterMenu) characterMenu.classList.remove('active');
    if (hud) hud.classList.add('active');
    selectHero(selectedHero);
  });
}

/* CONTROLS */

const keys = {};

window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

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

let jumping = false;
let jumpVelocity = 0;

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

/* COLLISION */

function blocked(x, z) {
  for (const o of obstacles) {
    const dx = x - o.x;
    const dz = z - o.z;

    if (dx * dx + dz * dz < (o.radius + 1.15) ** 2) {
      return true;
    }
  }

  return false;
}

/* MOVEMENT AND ANIMATION */

function animateDinosaur(model, delta, moving) {
  const d = model.userData;
  d.phase += delta * (moving ? 9 : 2);

  const swing = moving ? Math.sin(d.phase) * 0.55 : 0;

  d.legs[0].rotation.x = swing;
  d.legs[1].rotation.x = -swing;
  d.arms[0].rotation.x = -swing * 0.5;
  d.arms[1].rotation.x = swing * 0.5;
  d.tail.rotation.y = Math.sin(d.phase * 0.5) * 0.25;
  d.head.rotation.x = Math.sin(d.phase * 0.5) * 0.04;
  d.body.position.y = moving ? Math.abs(Math.sin(d.phase * 2)) * 0.1 : 0;
}

function movePlayer(delta) {
  if (!gameStarted) return;

  let dx = 0, dz = 0;

  if (keys.arrowleft || keys.a) dx -= 1;
  if (keys.arrowright || keys.d) dx += 1;
  if (keys.arrowup || keys.w) dz -= 1;
  if (keys.arrowdown || keys.s) dz += 1;

  const length = Math.hypot(dx, dz);
  const moving = length > 0;

  if (moving) {
    dx /= length;
    dz /= length;

    const nx = player.position.x + dx * 8 * delta;
    const nz = player.position.z + dz * 8 * delta;

    // Check X and Z separately so the player can slide around obstacles.
    if (!blocked(nx, player.position.z)) player.position.x = nx;
    if (!blocked(player.position.x, nz)) player.position.z = nz;

    player.rotation.y = Math.atan2(-dx, -dz);
  }

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

  followers.forEach((f, i) => {
    const tx = player.position.x - 3 - i * 1.4;
    const tz = player.position.z + 2 + i * 1.4;

    f.position.x += (tx - f.position.x) * Math.min(1, delta * 3);
    f.position.z += (tz - f.position.z) * Math.min(1, delta * 3);
    animateDinosaur(f, delta, true);
  });
}

/* HIGH-ANGLE CAMERA */

function updateCamera(delta) {
  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + 23,
    player.position.z + 9
  );

  camera.position.lerp(target, Math.min(1, delta * 3.5));

  camera.lookAt(
    player.position.x,
    player.position.y,
    player.position.z
  );
}

/* MISSION VOICE */

function speak(text) {
  if (!('speechSynthesis' in window)) return;

  speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'ms-MY';
  msg.rate = 0.9;
  speechSynthesis.speak(msg);
}

/* WATER MOTION */

function animateWater(time) {
  for (let i = 0; i < waterPositions.count; i++) {
    const x = originalWater[i * 3];
    const y = originalWater[i * 3 + 1];

    // Local Z becomes vertical after the water plane is rotated.
    const wave =
      Math.sin(x * 0.7 + time * 1.8) * 0.12 +
      Math.sin(y * 0.16 + time * 1.2) * 0.09;

    waterPositions.setZ(i, originalWater[i * 3 + 2] + wave);
  }

  waterPositions.needsUpdate = true;
  waterGeometry.computeVertexNormals();

  water.material.color.setHSL(
    0.53 + Math.sin(time * 0.7) * 0.012,
    0.72,
    0.56
  );
}

/* RESIZE */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
});

/* START */

selectHero(0);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);
  const time = clock.elapsedTime;

  movePlayer(delta);
  updateCamera(delta);
  animateWater(time);

  renderer.render(scene, camera);
}

animate();

console.log('JURASSIC KINGDOM V11.1 READY');
