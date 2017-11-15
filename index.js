var fps = 60;
var screenWidth = 1024, screenHeight = 600;
var renderer, scene, ballLight, camera;
var ball, wireframeFloor, lines = [];
var keyboard = {}, keypressed = {};
var player = { height: 1.8, speed: 0.5, vspeed: 0.5, turnspeed: Math.PI * 0.01 };
var axesData = [
  { points: [[0,0,0],[1,0,0]], color: 0xFF0000},
  { points: [[0,0,0],[0,1,0]], color: 0x00FF00},
  { points: [[0,0,0],[0,0,1]], color: 0x0000FF},
];

var ballRadius = 0.5;
var ballInitP = new THREE.Vector3(0, ballRadius + 10, 0);
var ballInitV = new THREE.Vector3(-3, 5, 2);
var ballInitAxis = new THREE.Vector3(0, 1, 0);
var ballInitAngle = 0;
var gravity = new THREE.Vector3(0, -9.8, 0);
var bounciness = 0.7;
var ballLightOffset = new THREE.Vector3(-2 * ballRadius, 1 * ballRadius, 0);

var physicsOn = false;

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

  // ball
  ball = new THREE.Mesh(
    new THREE.SphereGeometry(ballRadius, 20, 20),
    new THREE.MeshPhongMaterial({ map: THREE.ImageUtils.loadTexture('footballmap2.png',THREE.SphericalRefractionMapping) })
    //new THREE.MeshPhongMaterial({color: 0xFFFFFF})
  );
  ball.receiveShadow = true;
  ball.castShadow = true;
  ball.r = ballRadius;
  ball.v = new THREE.Vector3();
  initBallKinetics();
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
  wireframeFloor.visible = true;
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

  // lights
  ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  ballLight = new THREE.DirectionalLight(0xffffff, 0.5);
  ballLight.castShadow = true;
  ballLight.shadow.camera.left = -ball.r;
  ballLight.shadow.camera.right = ball.r;
  ballLight.shadow.camera.top = ball.r;
  ballLight.shadow.camera.bottom = -ball.r;
  scene.add(ballLight);
  //scene.add(new THREE.CameraHelper(ballLight.shadow.camera));

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
  handleKeyboardEnvControls();

  // physics
  if (physicsOn) {
    ball.v.addScaledVector(gravity, 1/fps);
    ball.position.addScaledVector(ball.v, 1/fps);
    if (ball.position.y < ball.r) {
      ball.v.y *= -bounciness;
      ball.position.y = ball.r;
    }
  }

  // other changes
  wireframeFloor.position.x = Math.round(ball.position.x);
  wireframeFloor.position.z = Math.round(ball.position.z);
  ballLight.position.copy(ballLightOffset.clone().add(ball.position));
  ballLight.target = ball;

  // rendering
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// set ball to its initial rotation, position, velocity
function initBallKinetics() {
  ball.position.copy(ballInitP);
  ball.v.copy(ballInitV);
  ball.setRotationFromAxisAngle(ballInitAxis, ballInitAngle);
}

function handleKeyboardEnvControls() {
  if (keypressed['z']) {
    initBallKinetics();
    keypressed['z'] = false;
  }
  if (keypressed['p']) {
    physicsOn = !physicsOn;
    keypressed['p'] = false;
  }
}

function handleKeyboardCameraControls() {
  if (keyboard['w']) { // W
    camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
    camera.position.z -= Math.cos(camera.rotation.y) * player.speed;
  }
  if (keyboard['s']) { // S
    camera.position.x += Math.sin(camera.rotation.y) * player.speed;
    camera.position.z += Math.cos(camera.rotation.y) * player.speed;
  }
  if (keyboard['a']) { // A
    camera.position.x -= Math.cos(camera.rotation.y) * player.speed;
    camera.position.z += Math.sin(camera.rotation.y) * player.speed;
  }
  if (keyboard['d']) { // D
    camera.position.x += Math.cos(camera.rotation.y) * player.speed;
    camera.position.z -= Math.sin(camera.rotation.y) * player.speed;
  }
  if (keyboard['r']) { // R
    camera.position.y += player.vspeed;
  }
  if (keyboard['f']) { // making sure player stays aboveground
    if (camera.position.y > player.height + player.vspeed) {
      camera.position.y -= player.vspeed;
    } else {
      camera.position.y = player.height;
    }
  }
  if (keyboard['ArrowLeft']) {
    camera.rotation.y += player.turnspeed;
  }
  if (keyboard['ArrowUp']) { 
    camera.rotation.x += player.turnspeed;
  }
  if (keyboard['ArrowRight']) {
    camera.rotation.y -= player.turnspeed;
  }
  if (keyboard['ArrowDown']) {
    camera.rotation.x -= player.turnspeed;
  }
}

function keyDown(event) {
  keyboard[event.key] = true;
}
function keyUp(event) {
  keyboard[event.key] = false;
  keypressed[event.key] = true;
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);
init();

function toggleWireframe() {
  wireframeFloor.visible = !wireframeFloor.visible;
}
