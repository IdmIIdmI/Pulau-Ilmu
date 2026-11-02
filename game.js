const livingTrees = [];

function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, 5, 10),
    material(0x67432a)
  );
  trunk.position.y = 2.5;
  tree.add(trunk);

  const leaves = new THREE.Group();
  leaves.position.y = 5;
  tree.add(leaves);

  const crown1 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.2, 2),
    material(0x236b3d)
  );
  crown1.position.y = 1;
  leaves.add(crown1);

  const crown2 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 2),
    material(0x398c4b)
  );
  crown2.position.set(0.5, 3, 0);
  leaves.add(crown2);

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);

  livingTrees.push({
    tree,
    leaves,
    phase: Math.random() * Math.PI * 2,
    strength: 0.025 + Math.random() * 0.025
  });

  obstacles.push({
    x, z, radius: 2.3 * scale
  });
}
