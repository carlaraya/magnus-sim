var fps = 60;
var screenWidth = 1024, screenHeight = 600;
var renderer, scene, lights, camera;
var ball, wireframeFloor, lines = [];
var keyboard = {};
var player = { height: 1.8, speed: 0.5, vspeed: 0.5 };
var axesData = [
  { points: [[0,0,0],[1,0,0]], color: 0xFF0000},
  { points: [[0,0,0],[0,1,0]], color: 0x00FF00},
  { points: [[0,0,0],[0,0,1]], color: 0x0000FF},
];
var ballRadius = 0.5;
var ballInitP = new THREE.Vector3(0, ballRadius + 5, 0);
var ballInitV = new THREE.Vector3(2, 5, 3);
var gravity = new THREE.Vector3(0, -9.8, 0);
function init() {
  // renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('myCanvas'),
    antialias: true
  });
  renderer.setClearColor(0x007F7F);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(screenWidth, screenHeight);
  renderer.shadowMap.enabled = true;

  // scene
  scene = new THREE.Scene();

  // lights
  ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(-40,20,0);
  light.castShadow = true;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 100;
  scene.add(light);

  // ball
  ball = new THREE.Mesh(

    new THREE.SphereGeometry(ballRadius, 20, 20),
    new THREE.MeshPhongMaterial({color: 0xFFFFFF})
  );
  ball.receiveShadow = true;
  ball.castShadow = true;
  ball.r = ballRadius;
  ball.position.copy(ballInitP);
  ball.v = ballInitV.clone();
  scene.add(ball);

  // floor
  var meshFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    new THREE.MeshPhongMaterial({color: 0x007F00})
  );
  meshFloor.rotation.x -= Math.PI / 2;
  meshFloor.receiveShadow = true;
  scene.add(meshFloor);
  wireframeFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(10,10,10,10),
    new THREE.MeshBasicMaterial({ color: 0x7fff7f, wireframe: true })
  );
  wireframeFloor.rotation.x -= Math.PI / 2;
  scene.add(wireframeFloor);


  // axes
  axesData.map(function(axis, i) {
    lines.push(new THREE.Line(
      new THREE.Geometry(),
      new THREE.LineBasicMaterial({ color: axis.color, linewidth: 2 })
    ));
    axis.points.map(function(point) {
      lines[i].geometry.vertices.push(
        new THREE.Vector3(point[0],point[1],point[2]),
      );
    });
    scene.add(lines[i]);
  });

  // camera
  camera = new THREE.PerspectiveCamera(50, screenWidth / screenHeight, 0.1, 1000);
  camera.position.set(10, player.height + 10, 30);
  camera.rotation.order = 'YXZ';
  camera.lookAt(new THREE.Vector3(0, player.height, 0));

  requestAnimationFrame(animate);
}

function animate() {

  // input
  handleKeyboardCameraControls();

  // physics
  ball.v.addScaledVector(gravity, 1/fps);
  ball.position.addScaledVector(ball.v, 1/fps);
  if (ball.position.y < ball.r) {
    ball.v.y *= -0.7;
    ball.position.y = ball.r;
  }

  wireframeFloor.position.x = Math.round(ball.position.x);
  wireframeFloor.position.z = Math.round(ball.position.z);

  // rendering
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function handleKeyboardCameraControls() {
  if (keyboard[87]) { // W
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.z -= Math.cos(camera.rotation.y) * player.speed;
  }
  if (keyboard[83]) { // S
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.z += Math.cos(camera.rotation.y) * player.speed;
  }
  if (keyboard[65]) { // A
    camera.position.x -= Math.cos(camera.rotation.y) * player.speed;
    camera.position.z += Math.sin(camera.rotation.y) * player.speed;
  }
  if (keyboard[68]) { // D
    camera.position.x += Math.cos(camera.rotation.y) * player.speed;
    camera.position.z -= Math.sin(camera.rotation.y) * player.speed;
  }
  if (keyboard[82]) { // R
    camera.position.y += player.vspeed;
  }
  if (keyboard[70]) { // F, making sure player stays aboveground
    if (camera.position.y > player.height + player.vspeed) {
      camera.position.y -= player.vspeed;
    } else {
      camera.position.y = player.height;
    }
  }
  if (keyboard[37]) { // left
    camera.rotation.y += Math.PI * 0.01;
  }
  if (keyboard[38]) { // up
    camera.rotation.x += Math.PI * 0.01;
  }
  if (keyboard[39]) { // right
    camera.rotation.y -= Math.PI * 0.01;
  }
  if (keyboard[40]) { // down
    camera.rotation.x -= Math.PI * 0.01;
  }
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
