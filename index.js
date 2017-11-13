var screenWidth = 1024, screenHeight = 600;
var renderer, scene, lights, camera;
var mesh, lines = [];
var keyboard = {};
var player = { height: 1.8, speed: 0.5, vspeed: 0.5 };
var axesData = [
  { points: [[0,0,0],[1,0,0]], color: 0xFF0000},
  { points: [[0,0,0],[0,1,0]], color: 0x00FF00},
  { points: [[0,0,0],[0,0,1]], color: 0x0000FF},
];
function init() {
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('myCanvas'),
    antialias: true
  });
  renderer.setClearColor(0x007F7F);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(screenWidth, screenHeight);
  renderer.shadowMap.enabled = true;

  scene = new THREE.Scene();

  ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(-1,0.5,0);
  light.castShadow = true;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 100;
  scene.add(light);

  mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({color: 0xFFFFFF})
  );
  mesh.position.set(0, 2, 0);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  var meshFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshPhongMaterial({color: 0x007F00})
  );
  meshFloor.rotation.x -= Math.PI / 2;
  meshFloor.receiveShadow = true;
  scene.add(meshFloor);

  axesData.map(function(axis, i) {
    lines.push(new THREE.Line(
      new THREE.Geometry(),
      new THREE.LineBasicMaterial({
        color: axis.color,
        linewidth: 2
      })
    ));
    axis.points.map(function(point) {
      lines[i].geometry.vertices.push(
        new THREE.Vector3(point[0],point[1],point[2]),
      );
    });
    scene.add(lines[i]);
  });



  camera = new THREE.PerspectiveCamera(50, screenWidth / screenHeight, 0.1, 1000);
  camera.position.set(0, player.height, -10);
  camera.lookAt(new THREE.Vector3(0, player.height, 0));
  camera.rotation.order = 'YXZ';

  requestAnimationFrame(animate);
}

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.02;
  if (keyboard[87]) { // W
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.z += Math.cos(camera.rotation.y) * player.speed;
  }
  if (keyboard[83]) { // S
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.z -= Math.cos(camera.rotation.y) * player.speed;
  }
  if (keyboard[65]) { // A
    camera.position.x += Math.cos(camera.rotation.y) * player.speed;
    camera.position.z -= Math.sin(camera.rotation.y) * player.speed;
  }
  if (keyboard[68]) { // D
    camera.position.x -= Math.cos(camera.rotation.y) * player.speed;
    camera.position.z += Math.sin(camera.rotation.y) * player.speed;
  }
  if (keyboard[16]) { // shift
    camera.position.y += player.vspeed;
  }
  if (keyboard[17]) { // ctrl, making sure player stays aboveground
    if (camera.position.y > player.height + player.vspeed) {
      camera.position.y -= player.vspeed;
    } else {
      camera.position.y = player.height;
    }
  }
  if (keyboard[37]) { // left
    camera.rotation.y -= Math.PI * 0.01;
  }
  if (keyboard[38]) { // left
    camera.rotation.x -= Math.PI * 0.01;
  }
  if (keyboard[39]) { // right
    camera.rotation.y += Math.PI * 0.01;
  }
  if (keyboard[40]) { // left
    camera.rotation.x += Math.PI * 0.01;
  }
  renderer.render(scene, camera);
}

function keyDown(event) {
  keyboard[event.keyCode] = true;
}
function keyUp(event) {
  keyboard[event.keyCode] = false;
}
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
init();
