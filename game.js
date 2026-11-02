
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* =====================================================
   MAGICAL JURASSIC KINGDOM
   ===================================================== */

document.body.innerHTML = '';
document.body.style.cssText = 'margin:0;overflow:hidden;background:#79d9ff;touch-action:none;font-family:Arial,sans-serif;';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x79d9ff);
scene.fog = new THREE.Fog(0x79d9ff, 100, 240);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 35, 48);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

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

const material = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const grassMat = material(0x55a83e);
const woodMat = material(0x85502b);
const lightWoodMat = material(0xb77a42);
const stoneMat = material(0x777f82);
const goldMat = material(0xffc83d, 0.3, 0.45);

/* TANAH */

const ground = new THREE.Mesh(new THREE.PlaneGeometry(250, 250), grassMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

for (let i = 0; i < 180; i++) {
  const x = (Math.random() - 0.5) * 220;
  const z = (Math.random() - 0.5) * 220;
  if (Math.abs(x) < 17) continue;

  const patch = new THREE.Mesh(
    new THREE.CircleGeometry(1 + Math.random() * 3, 8),
    material(Math.random() > 0.5 ? 0x69b94a : 0x438f3c)
  );
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(x, 0.025, z);
  scene.add(patch);
}

/* SUNGAI */

const river = new THREE.Mesh(
  new THREE.PlaneGeometry(25, 250),
  new THREE.MeshStandardMaterial({
    color: 0x16a9d7,
    roughness: 0.2,
    metalness: 0.25,
    transparent: true,
    opacity: 0.92
  })
);
river.rotation.x = -Math.PI / 2;
river.position.y = 0.12;
scene.add(river);

for (const side of [-1, 1]) {
  const bank = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.35, 250),
    material(0xb7a36a)
  );
  bank.position.set(side * 13.6, 0.05, 0);
  scene.add(bank);
}

/* JAMBATAN */

const bridge = new THREE.Group();
scene.add(bridge);

for (const z of [-2.9, 2.9]) {
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.65, 0.55),
    woodMat
  );
  beam.position.set(0, 0.45, z);
  beam.castShadow = true;
  bridge.add(beam);
}

for (let i = 0; i < 32; i++) {
  const x = -18.2 + i * 1.17;
  const plank = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.22, 6.1),
    i % 2 ? lightWoodMat : woodMat
  );
  plank.position.set(x, 0.65, 0);
  plank.castShadow = true;
  plank.receiveShadow = true;
  bridge.add(plank);
}

for (const z of [-3.1, 3.1]) {
  for (let x = -18; x <= 18; x += 4.5) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 1.8, 0.38),
      woodMat
    );
    post.position.set(x, 1.55, z);
    post.castShadow = true;
    bridge.add(post);
  }

  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.32, 0.4),
    lightWoodMat
  );
  rail.position.set(0, 2.35, z);
  bridge.add(rail);

  const lowerRail = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.2, 0.28),
    woodMat
  );
  lowerRail.position.set(0, 1.45, z);
  bridge.add(lowerRail);
}

for (const x of [-13, 0, 13]) {
  const support = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 7.5),
    stoneMat
  );
  support.position.set(x, -0.1, 0);
  bridge.add(support);
}

function onBridge(x, z) {
  return Math.abs(x) < 19 && Math.abs(z) < 3.8;
}

/* BATU SUNGAI */

for (let i = 0; i < 45; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.8, 0),
    stoneMat
  );
  rock.position.set(side * (14 + Math.random() * 2), 0.2, (Math.random() - 0.5) * 230);
  rock.scale.y = 0.5 + Math.random();
  rock.castShadow = true;
  scene.add(rock);
}

/* POKOK */

const trees = [];

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.55, 4, 8),
    woodMat
  );
  trunk.position.y = 2;
  trunk.castShadow = true;
  tree.add(trunk);

  for (const p of [
    [0, 4.5, 0, 2.3],
    [-1.1, 5.2, 0.2, 1.6],
    [1.1, 5.1, -0.3, 1.7],
    [0.1, 6.1, 0, 1.5]
  ]) {
    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),
      material(0x238a43)
    );
    leaf.position.set(p[0], p[1], p[2]);
    leaf.scale.set(p[3], p[3] * 0.9, p[3]);
    leaf.castShadow = true;
    tree.add(leaf);
  }

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);
  trees.push({ object: tree, x, z, radius: 1.7 * scale });
}

for (let i = 0; i < 85; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;
  createTree(
    side * (20 + Math.random() * 65),
    (Math.random() - 0.5) * 220,
    0.65 + Math.random() * 0.7
  );
}

/* GUNUNG */

function createMountain(x, z, height, color) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.ConeGeometry(height * 0.65, height, 8),
    material(color)
  );
  base.position.y = height / 2;
  base.castShadow = true;
  group.add(base);

  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(height * 0.2, height * 0.28, 8),
    material(0xf2ffff)
  );
  snow.position.y = height * 0.83;
  group.add(snow);

  group.position.set(x, 0, z);
  scene.add(group);
}

const mountainColors = [0x477c65, 0x597eaa, 0x9a6a9d, 0x568c83];

for (let i = 0; i < 22; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;
  createMountain(
    side * (55 + Math.random() * 40),
    (Math.random() - 0.5) * 210,
    18 + Math.random() * 30,
    mountainColors[i % mountainColors.length]
  );
}

/* AWAN */

const clouds = [];

function createCloud(x, y, z) {
  const cloud = new THREE.Group();

  for (let i = 0; i < 6; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(2 + Math.random() * 2, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 })
    );
    puff.position.set((Math.random() - 0.5) * 7, Math.random() * 2, (Math.random() - 0.5) * 3);
    cloud.add(puff);
  }

  cloud.position.set(x, y, z);
  scene.add(cloud);
  clouds.push(cloud);
}

for (let i = 0; i < 12; i++) {
  createCloud((Math.random() - 0.5) * 180, 38 + Math.random() * 20, (Math.random() - 0.5) * 180);
}

/* AIR TERJUN */

const waterfalls = [];

for (let i = 0; i < 5; i++) {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 13),
    new THREE.MeshBasicMaterial({
      color: 0x9ceeff,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide
    })
  );
  water.position.set((i % 2 === 0 ? -1 : 1) * (58 + Math.random() * 18), 9, -80 + i * 38);
  scene.add(water);
  waterfalls.push(water);
}

/* KRISTAL */

const crystals = [];
const crystalColors = [0x20eaff, 0xb34bff, 0xff55a8, 0x66ff93, 0xffd447, 0x5687ff];

function createCrystal(x, z, color) {
  const group = new THREE.Group();

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.35,
    metalness: 0.25,
    roughness: 0.12,
    transparent: true,
    opacity: 0.94
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), crystalMat);
  core.scale.set(0.8, 1.8, 0.8);
  core.position.y = 1.65;
  core.castShadow = true;
  group.add(core);

  for (let i = 0; i < 4; i++) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crystalMat);
    const angle = i * Math.PI / 2;
    shard.position.set(Math.cos(angle) * 1.05, 0.85 + Math.random() * 0.5, Math.sin(angle) * 1.05);
    shard.scale.set(0.6, 1.5, 0.6);
    group.add(shard);
  }

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.35, 8), goldMat);
  base.position.y = 0.2;
  group.add(base);

  const glow = new THREE.PointLight(color, 2.5, 9);
  glow.position.y = 1.5;
  group.add(glow);

  group.position.set(x, 0, z);
  scene.add(group);

  crystals.push({
    object: group,
    collected: false,
    attracted: false,
    offset: Math.random() * 10
  });
}

for (let i = 0; i < 24; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  createCrystal(
    side * (20 + Math.random() * 38),
    (Math.random() - 0.5) * 190,
    crystalColors[i % crystalColors.length]
  );
}

/* DINOSAUR */

const characters = [
  { name: 'LALA', title: 'Wira Penyayang', color: 0x54d65e, type: 'normal' },
  { name: 'TORA', title: 'Wira Berdaya Tahan', color: 0xf07832, type: 'horn' },
  { name: 'RAJA REX', title: 'Wira Berupaya Memimpin', color: 0xffc83d, type: 'crown' },
  { name: 'BOBI', title: 'Wira Warganegara Aktif', color: 0x348fe0, type: 'bag' }
];

function makeDino(info) {
  const root = new THREE.Group();
  const bodyMat = material(info.color);
  const bellyMat = material(0xffd9a0);
  const darkMat = material(0x293344);
  const whiteMat = material(0xffffff);

  function sphere(parent, x, y, z, sx, sy, sz, m) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  // Badan
  sphere(root, 0, 1.25, 0, 1.15, 0.85, 1.55, bodyMat);
  sphere(root, 0, 0.95, -0.05, 0.85, 0.45, 1.2, bellyMat);

  // Leher dan kepala
  sphere(root, 0, 1.95, 0.85, 0.65, 0.75, 0.7, bodyMat);
  sphere(root, 0, 2.25, 1.25, 0.75, 0.68, 0.75, bodyMat);
  sphere(root, 0, 1.95, 1.78, 0.55, 0.28, 0.42, bellyMat);

  // Mata
  for (const side of [-1, 1]) {
    sphere(root, side * 0.48, 2.38, 1.55, 0.18, 0.2, 0.12, whiteMat);
    sphere(root, side * 0.52, 2.38, 1.65, 0.085, 0.1, 0.06, darkMat);
  }

  // Lubang hidung
  for (const side of [-1, 1]) {
    sphere(root, side * 0.23, 2.02, 2.12, 0.07, 0.06, 0.05, darkMat);
  }

  // Kaki
  const legs = [];
  for (const x of [-0.7, 0.7]) {
    for (const z of [-0.8, 0.85]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.85, z);
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 10), bodyMat);
      limb.position.y = -0.35;
      limb.castShadow = true;
      leg.add(limb);
      sphere(leg, 0, -0.77, 0.12, 0.32, 0.17, 0.4, bellyMat);
      root.add(leg);
      legs.push(leg);
    }
  }

  // Ekor
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.38, 2.2, 10), bodyMat);
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 1.2, -1.85);
  tail.castShadow = true;
  root.add(tail);

  // Tanduk TORA
  if (info.type === 'horn') {
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 8), material(0xfff0c0));
      horn.position.set(side * 0.62, 2.75, 1.2);
      horn.rotation.z = side * -0.5;
      root.add(horn);
    }
    const noseHorn = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.65, 8), material(0xfff0c0));
    noseHorn.position.set(0, 2.55, 1.9);
    noseHorn.rotation.x = -0.6;
    root.add(noseHorn);
  }

  // Mahkota RAJA REX
  if (info.type === 'crown') {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.35, 5), goldMat);
    crown.position.set(0, 3.0, 1.1);
    root.add(crown);
    for (let i = 0; i < 5; i++) {
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 5), goldMat);
      const a = i * Math.PI * 2 / 5;
      point.position.set(Math.cos(a) * 0.38, 3.35, 1.1 + Math.sin(a) * 0.38);
      root.add(point);
    }
  }

  // Beg BOBI
  if (info.type === 'bag') {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.9, 0.4), material(0x273c68));
    bag.position.set(0, 1.55, -1.0);
    bag.castShadow = true;
    root.add(bag);
    sphere(root, 0, 1.7, -1.25, 0.28, 0.25, 0.1, material(0xffd34e));
  }

  root.userData.legs = legs;
  root.userData.tail = tail;
  return root;
}

/* WATAK DAN PENGIKUT */

let selectedIndex = 0;
let player;
let followers = [];
let playerPosition = new THREE.Vector3(17, 0, 12);
let playerVelocityY = 0;
let jumping = false;
let crystalsCollected = 0;
let distanceWalked = 0;
let crossedBridge = false;
let exploredForest = false;

const dinoGroups = characters.map(info => makeDino(info));

function chooseCharacter(index) {
  selectedIndex = index;
  player = dinoGroups[index];
  followers = dinoGroups.filter((_, i) => i !== index);

  player.position.copy(playerPosition);
  scene.add(player);

  followers.forEach((f, i) => {
    f.position.set(playerPosition.x + (i - 1) * 2.5, 0, playerPosition.z - 4 - i * 1.5);
    scene.add(f);
  });

  updateCharacterButtons();
}

characters.forEach((info, i) => {
  const button = document.createElement('button');
  button.textContent = info.name;
  button.style.cssText = `
    padding:8px 12px;border:2px solid white;border-radius:14px;
    background:#ffffffdd;color:#18354b;font-weight:bold;font-size:12px;
  `;
  button.onclick = () => chooseCharacter(i);
  characterBar.appendChild(button);
  characterButtons.push(button);
});

function updateCharacterButtons() {
  characterButtons.forEach((b, i) => {
    b.style.background = i === selectedIndex ? '#ffdb55' : '#ffffffdd';
  });
}

/* PAPARAN ANTARA MUKA */

const hud = document.createElement('div');
hud.style.cssText = 'position:fixed;inset:0;pointer-events:none;color:white;text-shadow:0 2px 4px #173b53;z-index:5;';
document.body.appendChild(hud);

const title = document.createElement('div');
title.textContent = '🦖 MAGICAL JURASSIC KINGDOM';
title.style.cssText = 'position:absolute;top:12px;left:50%;transform:translateX(-50%);font-size:clamp(15px,3vw,24px);font-weight:900;white-space:nowrap;';
hud.appendChild(title);

const missionBox = document.createElement('div');
missionBox.style.cssText = 'position:absolute;right:12px;top:55px;width:190px;padding:12px;background:#153b55cc;border:2px solid #fff;border-radius:14px;font-size:13px;line-height:1.7;';
missionBox.innerHTML = '<b>⭐ MISI</b><div id="missionList"></div>';
hud.appendChild(missionBox);

const score = document.createElement('div');
score.style.cssText = 'position:absolute;left:12px;top:12px;padding:9px 13px;background:#153b55cc;border-radius:12px;font-weight:bold;font-size:14px;';
score.textContent = '💎 Kristal: 0';
hud.appendChild(score);

const characterBar = document.createElement('div');
characterBar.style.cssText = 'position:absolute;top:48px;left:12px;display:flex;gap:5px;pointer-events:auto;flex-wrap:wrap;max-width:45%;';
hud.appendChild(characterBar);

const characterButtons = [];

const message = document.createElement('div');
message.style.cssText = 'position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);font-size:20px;font-weight:bold;text-align:center;opacity:0;transition:opacity .3s;background:#153b55cc;padding:12px 20px;border-radius:15px;';
hud.appendChild(message);

let messageTimer = 0;
function showMessage(text) {
  message.textContent = text;
  message.style.opacity = 1;
  messageTimer = 2.2;
}

/* JOYSTICK DAN BUTANG */

const controls = document.createElement('div');
controls.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10;';
document.body.appendChild(controls);

const joystick = document.createElement('div');
joystick.style.cssText = 'position:absolute;left:25px;bottom:25px;width:120px;height:120px;border-radius:50%;background:#ffffff55;border:3px solid #ffffffcc;pointer-events:auto;touch-action:none;';
controls.appendChild(joystick);

const stick = document.createElement('div');
stick.style.cssText = 'position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:#ffffffdd;border:2px solid #477b9b;';
joystick.appendChild(stick);

const jumpButton = document.createElement('button');
jumpButton.textContent = '⬆ LOMPAT';
jumpButton.style.cssText = 'position:absolute;right:25px;bottom:35px;width:95px;height:65px;border-radius:50%;border:3px solid white;background:#35a9ed;color:white;font-weight:bold;pointer-events:auto;';
controls.appendChild(jumpButton);

const magicButton = document.createElement('button');
magicButton.textContent = '✨ SIHIR';
magicButton.style.cssText = 'position:absolute;right:130px;bottom:35px;width:85px;height:65px;border-radius:50%;border:3px solid white;background:#9b54e8;color:white;font-weight:bold;pointer-events:auto;';
controls.appendChild(magicButton);

let joyX = 0;
let joyY = 0;
let joystickPointer = null;

function setJoystick(e) {
  const r = joystick.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  const max = 42;
  const len = Math.hypot(dx, dy);
  const scale = len > max ? max / len : 1;
  const x = dx * scale;
  const y = dy * scale;
  joyX = x / max;
  joyY = y / max;
  stick.style.transform = `translate(${x}px,${y}px)`;
}

joystick.addEventListener('pointerdown', e => {
  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  setJoystick(e);
});
joystick.addEventListener('pointermove', e => {
  if (e.pointerId === joystickPointer) setJoystick(e);
});
function releaseJoystick(e) {
  if (e.pointerId !== joystickPointer) return;
  joystickPointer = null;
  joyX = 0;
  joyY = 0;
  stick.style.transform = 'translate(0,0)';
}
joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);

jumpButton.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!jumping) {
    jumping = true;
    playerVelocityY = 10;
  }
});

let magicActive = false;
magicButton.addEventListener('pointerdown', e => {
  e.preventDefault();
  magicActive = true;
});
magicButton.addEventListener('pointerup', () => magicActive = false);
magicButton.addEventListener('pointercancel', () => magicActive = false);
magicButton.addEventListener('pointerleave', () => magicActive = false);

/* KEYBOARD */

const keys = {};
addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

/* COLLISION */

function canMoveTo(x, z) {
  if (Math.abs(x) < 12.5 && !onBridge(x, z)) return false;

  for (const tree of trees) {
    if (Math.hypot(x - tree.x, z - tree.z) < tree.radius + 1.0) return false;
  }

  return Math.abs(x) < 115 && Math.abs(z) < 115;
}

/* SIHIR */

const spellRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.2, 0.12, 8, 48),
  new THREE.MeshBasicMaterial({ color: 0xd7a0ff })
);
spellRing.rotation.x = Math.PI / 2;
spellRing.visible = false;
scene.add(spellRing);

function useMagic() {
  if (!player) return;
  spellRing.visible = true;
  spellRing.position.set(player.position.x, player.position.y + 0.5, player.position.z);

  for (const c of crystals) {
    if (c.collected) continue;
    const d = c.object.position.distanceTo(player.position);
    if (d < 27) c.attracted = true;
  }
}

/* MISI */

function updateMissions() {
  const missions = [
    [crystalsCollected >= 3, 'Kumpul 3 kristal'],
    [crystalsCollected >= 6, 'Kumpul 6 kristal'],
    [crystalsCollected >= 9, 'Kumpul 9 kristal'],
    [crossedBridge, 'Seberangi jambatan'],
    [exploredForest, 'Terokai hutan'],
    [distanceWalked >= 100, 'Berjalan 100 meter']
  ];

  document.getElementById('missionList').innerHTML = missions
    .filter(m => !m[0])
    .map(m => '▫ ' + m[1])
    .join('<br>');

  if (missions.every(m => m[0])) {
    document.getElementById('missionList').innerHTML = '🏆 SEMUA MISI SELESAI!';
  }
}

/* MULAKAN WATAK */

chooseCharacter(0);

/* ANIMASI */

let elapsed = 0;
let lastMagic = 0;
let lastX = playerPosition.x;
let lastZ = playerPosition.z;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.04);
  elapsed += dt;

  if (messageTimer > 0) {
    messageTimer -= dt;
    if (messageTimer <= 0) message.style.opacity = 0;
  }

  // Arah gerakan
  let moveX = joyX;
  let moveZ = joyY;

  if (keys['arrowleft'] || keys['a']) moveX -= 1;
  if (keys['arrowright'] || keys['d']) moveX += 1;
  if (keys['arrowup'] || keys['w']) moveZ -= 1;
  if (keys['arrowdown'] || keys['s']) moveZ += 1;

  const length = Math.hypot(moveX, moveZ);
  if (length > 1) {
    moveX /= length;
    moveZ /= length;
  }

  const speed = 10;
  const oldX = player.position.x;
  const oldZ = player.position.z;

  const nextX = oldX + moveX * speed * dt;
  const nextZ = oldZ + moveZ * speed * dt;

  if (canMoveTo(nextX, oldZ)) player.position.x = nextX;
  if (canMoveTo(player.position.x, nextZ)) player.position.z = nextZ;

  const moving = Math.abs(moveX) + Math.abs(moveZ) > 0.05;

  if (moving) {
    player.rotation.y = Math.atan2(moveX, -moveZ);
    distanceWalked += speed * dt;
  }

  // Ketinggian atas jambatan dan tanah
  const onBridgeNow = onBridge(player.position.x, player.position.z);
  const floorY = onBridgeNow ? 0.76 : 0;

  if (jumping) {
    playerVelocityY -= 24 * dt;
    player.position.y += playerVelocityY * dt;

    if (player.position.y <= floorY) {
      player.position.y = floorY;
      playerVelocityY = 0;
      jumping = false;
    }
  } else {
    player.position.y = floorY;
  }

  if (onBridgeNow && Math.abs(player.position.x) < 12) {
    crossedBridge = true;
  }

  if (Math.abs(player.position.x) > 22 && Math.abs(player.position.z) > 20) {
    exploredForest = true;
  }

  // Gerakan kaki
  player.userData.legs.forEach((leg, i) => {
    leg.rotation.x = moving ? Math.sin(elapsed * 10 + i * Math.PI) * 0.55 : 0;
  });
  player.userData.tail.rotation.y = Math.sin(elapsed * 3) * 0.25;

  // Pengikut
  followers.forEach((f, i) => {
    const offset = new THREE.Vector3(
      (i - 1) * 2.4,
      0,
      4 + i * 1.3
    );
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    const target = player.position.clone().add(offset);
    f.position.lerp(target, Math.min(1, dt * 3.5));
    f.position.y = onBridge(f.position.x, f.position.z) ? 0.76 : 0;
    f.rotation.y = player.rotation.y;
    f.userData.legs.forEach((leg, j) => {
      leg.rotation.x = moving ? Math.sin(elapsed * 10 + j * Math.PI) * 0.4 : 0;
    });
    f.userData.tail.rotation.y = Math.sin(elapsed * 3 + i) * 0.25;
  });

  // Tarikan sihir
  if (magicActive && elapsed - lastMagic > 0.22) {
    useMagic();
    lastMagic = elapsed;
  }

  for (const c of crystals) {
    if (c.collected) continue;

    c.object.rotation.y += dt * 0.8;
    c.object.position.y = Math.sin(elapsed * 2 + c.offset) * 0.2;

    if (c.attracted) {
      const target = player.position.clone();
      target.y += 1.5;
      c.object.position.lerp(target, Math.min(1, dt * 3.5));

      if (c.object.position.distanceTo(target) < 2.4) {
        c.collected = true;
        scene.remove(c.object);
        crystalsCollected++;
        score.textContent = '💎 Kristal: ' + crystalsCollected;
        showMessage('✨ Kristal berjaya dikumpul!');
      }
    }
  }

  spellRing.visible = magicActive;
  spellRing.position.set(player.position.x, player.position.y + 0.5, player.position.z);
  spellRing.rotation.z += dt * 1.5;

  // Awan bergerak
  clouds.forEach((cloud, i) => {
    cloud.position.x += dt * (0.4 + i * 0.02);
    if (cloud.position.x > 110) cloud.position.x = -110;
  });

  // Air terjun beralun
  waterfalls.forEach((w, i) => {
    w.material.opacity = 0.45 + Math.sin(elapsed * 3 + i) * 0.12;
  });

  // Kamera ikut watak
  const cameraTarget = new THREE.Vector3(
    player.position.x,
    player.position.y,
    player.position.z
  );

  const desiredCamera = new THREE.Vector3(
    player.position.x,
    player.position.y + 34,
    player.position.z + 34
  );

  camera.position.lerp(desiredCamera, Math.min(1, dt * 2.5));
  camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);

  updateMissions();
  renderer.render(scene, camera);

  lastX = player.position.x;
  lastZ = player.position.z;
}

animate();

/* SAIZ SKRIN */

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
