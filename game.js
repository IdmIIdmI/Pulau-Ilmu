
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

/* ==================================================
   MAGICAL JURASSIC KINGDOM
   Serasi dengan index.html asal
================================================== */

const $ = id => document.getElementById(id);

const container = $('game-container');
const mainMenu = $('main-menu');
const characterMenu = $('character-menu');
const gameHUD = $('game-hud');
const loadingScreen = $('loading-screen');
const progressBar = $('loading-progress');

if (!container) throw new Error('game-container tidak dijumpai dalam index.html');

let gameStarted = false;
let selectedHero = 0;
let crystalsCollected = 0;
let distanceTravelled = 0;
let crossedBridge = false;
let exploredForest = false;
let rescuedEgg = false;
let actionCount = 0;

const heroInfo = [
  { name: 'LALA', title: 'Wira Penyayang', color: 0x54d65e, type: 'normal' },
  { name: 'TORA', title: 'Wira Berdaya Tahan', color: 0xf07832, type: 'horn' },
  { name: 'RAJA REX', title: 'Wira Berupaya Memimpin', color: 0xffc83d, type: 'crown' },
  { name: 'BOBI', title: 'Wira Warganegara Aktif', color: 0x348fe0, type: 'bag' }
];

const characterCards = [...document.querySelectorAll('.character-card')];

characterCards.forEach((card, index) => {
  card.addEventListener('click', () => {
    selectedHero = Number(card.dataset.hero ?? index);
    characterCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });
});

/* PAPARAN */

function showLoading(value) {
  if (progressBar) progressBar.style.width = value + '%';
}

function showGame() {
  if (mainMenu) mainMenu.style.display = 'none';
  if (characterMenu) characterMenu.style.display = 'none';
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (gameHUD) gameHUD.style.display = 'block';
}

if (gameHUD) gameHUD.style.display = 'none';
if (characterMenu) characterMenu.style.display = 'none';
if (loadingScreen) loadingScreen.style.display = 'none';

$('start-button')?.addEventListener('click', () => {
  if (mainMenu) mainMenu.style.display = 'none';
  if (characterMenu) characterMenu.style.display = 'flex';
});

$('play-button')?.addEventListener('click', () => {
  if (!gameStarted) {
    gameStarted = true;
    showGame();
    startWorld();
  }
});

/* THREE JS */

let scene, camera, renderer, clock;
let player, playerRoot;
let followers = [];
let crystals = [];
let trees = [];
let clouds = [];
let eggs = [];
let animals = [];
let spellRing;
let playerY = 0;
let velocityY = 0;
let jumping = false;
let magicOn = false;
let elapsed = 0;
let messageTimer = 0;
let moveX = 0;
let moveZ = 0;
let facing = 0;

const keys = {};
const worldUp = new THREE.Vector3(0, 1, 0);

const mat = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const addMesh = (geometry, material, parent, x, y, z) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

function startWorld() {
  try {
    showLoading(10);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x79d9ff);
    scene.fog = new THREE.Fog(0x79d9ff, 100, 260);

    camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
    camera.position.set(0, 38, 45);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
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
    showLoading(20);
    createGround();
    createRiver();
    createBridge();
    showLoading(35);
    createForest();
    createMountains();
    createClouds();
    createWaterfalls();
    createCrystals();
    createEggs();
    createPlayer();
    createSpell();
    showLoading(100);

    setTimeout(() => {
      if ($('loading-screen')) $('loading-screen').style.display = 'none';
      if (gameHUD) gameHUD.style.display = 'block';
      updateHeroName();
      updateMissions();
      animate();
    }, 350);

  } catch (error) {
    console.error('Ralat permainan:', error);
    alert('Permainan tidak dapat dimulakan. Sila semak Console atau hantar tangkap layar kepada saya.');
  }
}

/* CAHAYA */

function createLights() {
  scene.add(new THREE.HemisphereLight(0xc9f4ff, 0x527b37, 2.1));

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

/* TANAH */

function createGround() {
  const ground = addMesh(
    new THREE.PlaneGeometry(250, 250),
    mat(0x55a83e),
    scene, 0, 0, 0
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  for (let i = 0; i < 180; i++) {
    const x = (Math.random() - 0.5) * 220;
    const z = (Math.random() - 0.5) * 220;
    if (Math.abs(x) < 17) continue;

    const patch = addMesh(
      new THREE.CircleGeometry(1 + Math.random() * 3, 8),
      mat(Math.random() > 0.5 ? 0x69b94a : 0x438f3c),
      scene, x, 0.025, z
    );
    patch.rotation.x = -Math.PI / 2;
  }
}

/* SUNGAI */

function createRiver() {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 250),
    new THREE.MeshPhysicalMaterial({
      color: 0x16a9d7,
      roughness: 0.16,
      metalness: 0.18,
      transparent: true,
      opacity: 0.92
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.12;
  scene.add(water);

  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(2.5, 0.35, 250),
      mat(0xb7a36a),
      scene, side * 13.6, 0.05, 0
    );
  }

  for (let i = 0; i < 50; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const rock = addMesh(
      new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.8),
      mat(0x777f82),
      scene,
      side * (14 + Math.random() * 2),
      0.2,
      (Math.random() - 0.5) * 230
    );
    rock.scale.y = 0.5 + Math.random();
  }
}

/* JAMBATAN */

function createBridge() {
  const bridge = new THREE.Group();
  scene.add(bridge);

  const wood = mat(0x85502b);
  const lightWood = mat(0xb77a42);

  for (const z of [-2.9, 2.9]) {
    addMesh(new THREE.BoxGeometry(38, 0.65, 0.55), wood, bridge, 0, 0.45, z);
  }

  for (let i = 0; i < 32; i++) {
    const x = -18.2 + i * 1.17;
    addMesh(
      new THREE.BoxGeometry(1.12, 0.22, 6.1),
      i % 2 ? lightWood : wood,
      bridge, x, 0.65, 0
    );
  }

  for (const z of [-3.1, 3.1]) {
    for (let x = -18; x <= 18; x += 4.5) {
      addMesh(
        new THREE.BoxGeometry(0.38, 1.8, 0.38),
        wood, bridge, x, 1.55, z
      );
    }

    addMesh(
      new THREE.BoxGeometry(38, 0.32, 0.4),
      lightWood, bridge, 0, 2.35, z
    );

    addMesh(
      new THREE.BoxGeometry(38, 0.2, 0.28),
      wood, bridge, 0, 1.45, z
    );
  }

  for (const x of [-13, 0, 13]) {
    addMesh(
      new THREE.BoxGeometry(1.5, 1.5, 7.5),
      mat(0x777f82), bridge, x, -0.1, 0
    );
  }
}

function onBridge(x, z) {
  return Math.abs(x) < 19 && Math.abs(z) < 3.8;
}

/* POKOK */

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = addMesh(
    new THREE.CylinderGeometry(0.35, 0.55, 4, 8),
    mat(0x85502b), tree, 0, 2, 0
  );

  const leafColors = [0x238a43, 0x329b4b, 0x176c3b];

  for (let i = 0; i < 5; i++) {
    const leaf = addMesh(
      new THREE.IcosahedronGeometry(1, 1),
      mat(leafColors[i % leafColors.length]),
      tree,
      (Math.random() - 0.5) * 2,
      4.5 + Math.random() * 1.5,
      (Math.random() - 0.5) * 2
    );
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
    createTree(
      side * (20 + Math.random() * 65),
      (Math.random() - 0.5) * 220,
      0.65 + Math.random() * 0.7
    );
  }
}

/* GUNUNG */

function createMountains() {
  const colors = [0x477c65, 0x597eaa, 0x9a6a9d, 0x568c83];

  for (let i = 0; i < 22; i++) {
    const height = 18 + Math.random() * 30;
    const side = Math.random() > 0.5 ? 1 : -1;
    const group = new THREE.Group();

    addMesh(
      new THREE.ConeGeometry(height * 0.65, height, 8),
      mat(colors[i % colors.length]),
      group, 0, height / 2, 0
    );

    addMesh(
      new THREE.ConeGeometry(height * 0.2, height * 0.28, 8),
      mat(0xf2ffff),
      group, 0, height * 0.83, 0
    );

    group.position.set(
      side * (55 + Math.random() * 40),
      0,
      (Math.random() - 0.5) * 210
    );
    scene.add(group);
  }
}

/* AWAN */

function createClouds() {
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Group();

    for (let j = 0; j < 6; j++) {
      const puff = addMesh(
        new THREE.SphereGeometry(2 + Math.random() * 2, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff }),
        cloud,
        (Math.random() - 0.5) * 7,
        Math.random() * 2,
        (Math.random() - 0.5) * 3
      );
    }

    cloud.position.set(
      (Math.random() - 0.5) * 180,
      38 + Math.random() * 20,
      (Math.random() - 0.5) * 180
    );

    scene.add(cloud);
    clouds.push(cloud);
  }
}

/* AIR TERJUN */

function createWaterfalls() {
  for (let i = 0; i < 5; i++) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 13),
      new THREE.MeshBasicMaterial({
        color: 0x9ceeff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      })
    );

    water.position.set(
      (i % 2 === 0 ? -1 : 1) * (58 + Math.random() * 18),
      9,
      -80 + i * 38
    );

    scene.add(water);
    clouds.push(water);
  }
}

/* KRISTAL */

function createCrystals() {
  const colors = [0x20eaff, 0xb34bff, 0xff55a8, 0x66ff93, 0xffd447, 0x5687ff];

  for (let i = 0; i < 24; i++) {
    const group = new THREE.Group();
    const color = colors[i % colors.length];

    const crystalMaterial = new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.12,
      transparent: true,
      opacity: 0.95
    });

    const core = addMesh(
      new THREE.OctahedronGeometry(1.1),
      crystalMaterial,
      group, 0, 1.5, 0
    );
    core.scale.set(0.8, 1.8, 0.8);

    for (let j = 0; j < 4; j++) {
      const angle = j * Math.PI / 2;
      const shard = addMesh(
        new THREE.OctahedronGeometry(0.42),
        crystalMaterial,
        group,
        Math.cos(angle) * 1.0,
        0.85,
        Math.sin(angle) * 1.0
      );
      shard.scale.y = 1.5;
    }

    addMesh(
      new THREE.CylinderGeometry(1.15, 1.35, 0.35, 8),
      mat(0xffc83d, 0.3, 0.4),
      group, 0, 0.2, 0
    );

    const glow = new THREE.PointLight(color, 2.5, 9);
    glow.position.y = 1.5;
    group.add(glow);

    const side = i % 2 === 0 ? -1 : 1;
    group.position.set(
      side * (20 + Math.random() * 38),
      0,
      (Math.random() - 0.5) * 190
    );

    scene.add(group);
    crystals.push({
      object: group,
      collected: false,
      attracted: false,
      offset: Math.random() * 10
    });
  }
}

/* TELUR DINOSAUR */

function createEggs() {
  for (let i = 0; i < 5; i++) {
    const egg = new THREE.Group();

    const shell = addMesh(
      new THREE.SphereGeometry(0.65, 16, 12),
      mat(0xffe7b0),
      egg, 0, 0.65, 0
    );
    shell.scale.set(0.75, 1, 0.75);

    addMesh(
      new THREE.SphereGeometry(0.68, 12, 8),
      mat(0x9c7a48),
      egg, 0, 0.15, 0
    );

    egg.position.set(
      25 + Math.random() * 30,
      0,
      -35 + i * 13
    );

    scene.add(egg);
    eggs.push({ object: egg, collected: false });
  }
}

/* BINA DINOSAUR */

function makeDino(info) {
  const root = new THREE.Group();
  const bodyMat = mat(info.color);
  const bellyMat = mat(0xffd9a0);
  const darkMat = mat(0x293344);
  const whiteMat = mat(0xffffff);

  function sphere(parent, x, y, z, sx, sy, sz, m) {
    const mesh = addMesh(
      new THREE.SphereGeometry(1, 16, 12),
      m, parent, x, y, z
    );
    mesh.scale.set(sx, sy, sz);
    return mesh;
  }

  sphere(root, 0, 1.25, 0, 1.15, 0.85, 1.55, bodyMat);
  sphere(root, 0, 0.95, -0.05, 0.85, 0.45, 1.2, bellyMat);
  sphere(root, 0, 1.95, 0.85, 0.65, 0.75, 0.7, bodyMat);
  sphere(root, 0, 2.25, 1.25, 0.75, 0.68, 0.75, bodyMat);
  sphere(root, 0, 1.95, 1.78, 0.55, 0.28, 0.42, bellyMat);

  for (const side of [-1, 1]) {
    sphere(root, side * 0.48, 2.38, 1.55, 0.18, 0.2, 0.12, whiteMat);
    sphere(root, side * 0.52, 2.38, 1.65, 0.085, 0.1, 0.06, darkMat);
    sphere(root, side * 0.23, 2.02, 2.12, 0.07, 0.06, 0.05, darkMat);
  }

  const legs = [];

  for (const x of [-0.7, 0.7]) {
    for (const z of [-0.8, 0.85]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.85, z);

      addMesh(
        new THREE.CylinderGeometry(0.22, 0.3, 0.9, 10),
        bodyMat, leg, 0, -0.35, 0
      );

      sphere(leg, 0, -0.77, 0.12, 0.32, 0.17, 0.4, bellyMat);
      root.add(leg);
      legs.push(leg);
    }
  }

  const tail = addMesh(
    new THREE.ConeGeometry(0.38, 2.2, 10),
    bodyMat, root, 0, 1.2, -1.85
  );
  tail.rotation.x = -Math.PI / 2;

  if (info.type === 'horn') {
    for (const side of [-1, 1]) {
      const horn = addMesh(
        new THREE.ConeGeometry(0.16, 0.9, 8),
        mat(0xfff0c0),
        root, side * 0.62, 2.75, 1.2
      );
      horn.rotation.z = side * -0.5;
    }

    const noseHorn = addMesh(
      new THREE.ConeGeometry(0.13, 0.65, 8),
      mat(0xfff0c0),
      root, 0, 2.55, 1.9
    );
    noseHorn.rotation.x = -0.6;
  }

  if (info.type === 'crown') {
    addMesh(
      new THREE.CylinderGeometry(0.45, 0.55, 0.35, 5),
      mat(0xffc83d),
      root, 0, 3.0, 1.1
    );

    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      addMesh(
        new THREE.ConeGeometry(0.12, 0.45, 5),
        mat(0xffc83d),
        root,
        Math.cos(angle) * 0.38,
        3.35,
        1.1 + Math.sin(angle) * 0.38
      );
    }
  }

  if (info.type === 'bag') {
    addMesh(
      new THREE.BoxGeometry(0.85, 0.9, 0.4),
      mat(0x273c68),
      root, 0, 1.55, -1.0
    );
  }

  root.userData.legs = legs;
  root.userData.tail = tail;
  return root;
}

/* WATAK UTAMA DAN PENGIKUT */

function createPlayer() {
  const all = heroInfo.map(makeDino);

  playerRoot = all[selectedHero];
  player = playerRoot;

  player.position.set(17, 0, 12);
  scene.add(player);

  followers = all.filter((_, i) => i !== selectedHero);

  followers.forEach((f, i) => {
    f.position.set(17 + (i - 1) * 2.5, 0, 7 - i * 1.5);
    scene.add(f);
  });

  updateHeroName();
}

function updateHeroName() {
  if ($('hero-name')) $('hero-name').textContent = heroInfo[selectedHero].name;
}

/* KUASA SIHIR */

function createSpell() {
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

  spellRing.visible = true;

  for (const crystal of crystals) {
    if (crystal.collected) continue;

    if (crystal.object.position.distanceTo(player.position) < 28) {
      crystal.attracted = true;
    }
  }
}

/* KAWALAN */

function setDirection(direction, value) {
  if (direction === 'left') moveX = value ? -1 : 0;
  if (direction === 'right') moveX = value ? 1 : 0;
  if (direction === 'up') moveZ = value ? -1 : 0;
  if (direction === 'down') moveZ = value ? 1 : 0;
}

function bindHold(id, direction) {
  const button = $(id);
  if (!button) return;

  button.addEventListener('pointerdown', e => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    setDirection(direction, true);
  });

  const stop = e => {
    e.preventDefault();
    setDirection(direction, false);
  };

  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('lostpointercapture', stop);
}

bindHold('left-btn', 'left');
bindHold('right-btn', 'right');
bindHold('up-btn', 'up');
bindHold('down-btn', 'down');

$('jump-btn')?.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!jumping) {
    jumping = true;
    velocityY = 10;
  }
});

$('action-btn')?.addEventListener('pointerdown', e => {
  e.preventDefault();
  actionCount++;
  showMessage('🌟 Semangat wira!');
});

$('power-btn')?.addEventListener('pointerdown', e => {
  e.preventDefault();
  magicOn = true;
  useMagic();
});

$('power-btn')?.addEventListener('pointerup', () => magicOn = false);
$('power-btn')?.addEventListener('pointercancel', () => magicOn = false);

addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === ' ' && !jumping) {
    jumping = true;
    velocityY = 10;
  }

  if (e.key.toLowerCase() === 'e') useMagic();
});

addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

/* PERLANGGARAN */

function canMoveTo(x, z) {
  if (Math.abs(x) < 12.5 && !onBridge(x, z)) return false;

  for (const tree of trees) {
    if (Math.hypot(x - tree.x, z - tree.z) < tree.radius + 1) return false;
  }

  return Math.abs(x) < 115 && Math.abs(z) < 115;
}

/* MESEJ */

let messageElement;

function showMessage(text) {
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.style.cssText = `
      position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);
      z-index:20;padding:14px 22px;background:#153b55dd;
      border:2px solid white;border-radius:15px;color:white;
      font-size:18px;font-weight:bold;text-align:center;
      pointer-events:none;
    `;
    document.body.appendChild(messageElement);
  }

  messageElement.textContent = text;
  messageElement.style.display = 'block';
  messageTimer = 2;
}

/* MISI */

function updateMissions() {
  const panel = $('mission-panel');
  if (!panel) return;

  const tasks = [
    [rescuedEgg, 'Bantu anak dinosaur'],
    [eggs.filter(e => e.collected).length >= 3, 'Kumpulkan telur dinosaur'],
    [crystalsCollected >= 3, 'Cari kristal ajaib'],
    [crossedBridge, 'Jumpa penjaga sungai'],
    [exploredForest, 'Teroka hutan purba'],
    [distanceTravelled >= 100, 'Pergi ke gunung berapi'],
    [crystalsCollected >= 9, 'Hadapi Raja Dinosaur']
  ];

  const oldItems = [...panel.querySelectorAll('.mission-item')];

  tasks.forEach((task, i) => {
    if (oldItems[i]) {
      oldItems[i].style.opacity = task[0] ? '0.35' : '1';
      oldItems[i].style.textDecoration = task[0] ? 'line-through' : 'none';
      oldItems[i].textContent = (task[0] ? '✓ ' : '▫ ') + task[1];
    }
  });
}

/* ANIMASI */

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

  if (keys['arrowleft'] || keys.a) dx -= 1;
  if (keys['arrowright'] || keys.d) dx += 1;
  if (keys['arrowup'] || keys.w) dz -= 1;
  if (keys['arrowdown'] || keys.s) dz += 1;

  const length = Math.hypot(dx, dz);
  if (length > 1) {
    dx /= length;
    dz /= length;
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

  if (onBridge(player.position.x, player.position.z) && Math.abs(player.position.x) < 12) {
    crossedBridge = true;
  }

  if (Math.abs(player.position.x) > 25 && Math.abs(player.position.z) > 20) {
    exploredForest = true;
  }

  player.userData.legs.forEach((leg, i) => {
    leg.rotation.x = moving ? Math.sin(elapsed * 10 + i * Math.PI) * 0.55 : 0;
  });

  player.userData.tail.rotation.y = Math.sin(elapsed * 3) * 0.25;

  followers.forEach((f, i) => {
    const offset = new THREE.Vector3((i - 1) * 2.4, 0, 4 + i * 1.3);
    offset.applyAxisAngle(worldUp, facing);

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

  for (const crystal of crystals) {
    if (crystal.collected) continue;

    crystal.object.rotation.y += dt * 0.8;
    crystal.object.position.y = Math.sin(elapsed * 2) * 0.2;

    if (crystal.attracted) {
      const target = player.position.clone();
      target.y += 1.5;
      crystal.object.position.lerp(target, Math.min(1, dt * 3.5));

      if (crystal.object.position.distanceTo(target) < 2.4) {
        crystal.collected = true;
        scene.remove(crystal.object);
        crystalsCollected++;
        showMessage('💎 Kristal berjaya dikumpul!');
      }
    }
  }

  /* TELUR */

  for (const egg of eggs) {
    if (egg.collected) continue;

    egg.object.rotation.y = Math.sin(elapsed) * 0.1;

    if (egg.object.position.distanceTo(player.position) < 2.2) {
      egg.collected = true;
      scene.remove(egg.object);
      rescuedEgg = true;
      showMessage('🥚 Telur dinosaur dijumpai!');
    }
  }

  /* AWAN */

  clouds.forEach((cloud, i) => {
    cloud.position.x += dt * (0.25 + i * 0.015);
    if (cloud.position.x > 110) cloud.position.x = -110;
  });

  /* SIHIR */

  if (spellRing) {
    spellRing.visible = magicOn;
    spellRing.position.set(player.position.x, player.position.y + 0.5, player.position.z);
    spellRing.rotation.z += dt * 1.5;
  }

  /* KAMERA */

  const desiredCamera = new THREE.Vector3(
    player.position.x,
    player.position.y + 36,
    player.position.z + 36
  );

  camera.position.lerp(desiredCamera, Math.min(1, dt * 2.5));
  camera.lookAt(player.position.x, player.position.y, player.position.z);

  /* HUD */

  if ($('health-fill')) {
    $('health-fill').style.width = '100%';
  }

  if ($('hero-name')) {
    $('hero-name').textContent = heroInfo[selectedHero].name;
  }

  const scoreElement = $('hero-name');
  if (scoreElement) {
    scoreElement.title = 'Kristal: ' + crystalsCollected;
  }

  updateMissions();
  renderer.render(scene, camera);
}

/* SKRIN */

addEventListener('resize', () => {
  if (!camera || !renderer) return;

  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
