var makeGoal = function(x) {
  var goal = new THREE.Object3D();
  var meshes = [
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.44),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.44),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 10.7),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 4.4),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 4.4),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 10.7),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.8),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.8),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 3.2),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 3.2),
      new THREE.MeshPhongMaterial({color: 0xFFFFFF})
    ),
  ];
  meshes[0].position.set(0,1.22,-5.25);
  meshes[1].position.set(0,1.22,5.25);
  meshes[2].rotation.set(Math.PI/2,0,0);
  meshes[2].position.set(0,2.44,0);
  meshes[3].rotation.set(0,0,Math.PI/2);
  meshes[3].position.set(-2.2,0.1,-5.25);
  meshes[4].rotation.set(0,0,Math.PI/2);
  meshes[4].position.set(-2.2,0.1,5.25);
  meshes[5].rotation.set(Math.PI/2,0,0);
  meshes[5].position.set(-4.4,0.1,0);
  meshes[6].rotation.set(0,0,-Math.PI/6);
  meshes[6].position.set(-3.7,1.22,-5.25);
  meshes[7].rotation.set(0,0,-Math.PI/6);
  meshes[7].position.set(-3.7,1.22,5.25);
  meshes[8].rotation.set(0,0,Math.PI/2);
  meshes[8].position.set(-1.5,2.44,-5.25);
  meshes[9].rotation.set(0,0,Math.PI/2);
  meshes[9].position.set(-1.5,2.44,5.25);
  meshes.map(function(mesh) {
    goal.add(mesh);
  });
  goal.rotation.set(0, Math.PI/2 + -x * Math.PI/2, 0);
  goal.position.set(-x * 56,0,0);
  return goal;
}
