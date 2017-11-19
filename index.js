var fps = 60;
var framesPassed = 0;
var drawPointFramesInterval = 5; // draw a point every {drawPointFramesInterval} frames
var eraseTrailWhenBallHitsGround = false;
var screenWidth = window.innerWidth, screenHeight = window.innerHeight;
var renderer, scene, ballLight, camera;
var ball, trail, trailGround, wireframeFloor;
var keyboardControls;
var player = { height: 1.8, speed: 0.5, vspeed: 0.5, turnspeed: Math.PI * 0.01 };
var axes = [], axesData = [
  { points: [[0,0,0],[0.4,0,0]], color: 0xFF0000},
  { points: [[0,0,0],[0,0.4,0]], color: 0x00FF00},
  { points: [[0,0,0],[0,0,0.4]], color: 0x0000FF},
];
var m = 1000;
var groundAxes = [], groundAxesData = [
  { points: [[0,0,0],[m,0,0]], color: 0xFF0000, linewidth: 4},
  { points: [[0,0,0],[0,m,0]], color: 0x00FF00, linewidth: 4},
  { points: [[0,0,0],[0,0,m]], color: 0x0000FF, linewidth: 4},
  { points: [[1,0,0],[m+1,0,0]], color: 0xFF0000, linewidth: 1},
  { points: [[0,1,0],[0,m+1,0]], color: 0x00FF00, linewidth: 1},
  { points: [[0,0,1],[0,0,m+1]], color: 0x0000FF, linewidth: 1},
  { points: [[0,0,0],[-m,0,0]], color: 0xFF7F7F, linewidth: 4},
  { points: [[0,0,0],[0,0,-m]], color: 0x7F7FFF, linewidth: 4},
  { points: [[-1,0,0],[-m-1,0,0]], color: 0xFF7F7F, linewidth: 1},
  { points: [[0,0,-1],[0,0,-m-1]], color: 0x7F7FFF, linewidth: 1},
];

var ballRadius = 0.1098;
var ballInitP = new THREE.Vector3(0, ballRadius, 0);
var ballInitV = new THREE.Vector3(-2, 7, 3);
var ballInitAxis = new THREE.Vector3(0, 1, 0);
var ballInitAngle = 0;
var gravity = new THREE.Vector3(0, -9.8, 0);
var ballLightOffset = new THREE.Vector3(-2 * ballRadius, 3 * ballRadius, -2 * ballRadius);

var state = {
  physicsOn: false
};

var plotter;

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

  trail = new THREE.Points(
    new THREE.Geometry(),
    new THREE.PointsMaterial({ color: 0xFF3F3F, size: 0.1 })
  );
  scene.add(trail);
  trailGround = new THREE.Points(
    new THREE.Geometry(),
    new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.1 })
  );
  scene.add(trailGround);

  // floor
  var meshFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
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
  wireframeFloor.visible = false;
  scene.add(wireframeFloor);


  // axes
  axesData.map(function(axis, i) {
    axes.push(new THREE.Line(
      new THREE.Geometry(),
      new THREE.LineBasicMaterial({ color: axis.color, linewidth: 2 })
    ));
    axis.points.map(function(point) {
      axes[i].geometry.vertices.push(
        new THREE.Vector3(point[0],point[1],point[2]),
      );
    });
    axes[i].visible = false;
    scene.add(axes[i]);
  });

  // ground axes
  groundAxesData.map(function(axis, i) {
    groundAxes.push(new THREE.Line(
      new THREE.Geometry(),
      new THREE.LineDashedMaterial({
        color: axis.color, linewidth: axis.linewidth, dashSize: 1, gapSize: 1
      })
    ));
    axis.points.map(function(point) {
      groundAxes[i].geometry.vertices.push(
        new THREE.Vector3(point[0],point[1],point[2]),
      );
    });
    groundAxes[i].geometry.computeLineDistances();
    groundAxes[i].visible = false;
    scene.add(groundAxes[i]);
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
  camera.position.set(4, player.height, 5);
  camera.rotation.order = 'YXZ';
  camera.lookAt(new THREE.Vector3(0, player.height, 0));
  camera.rotation.x -= Math.PI/12;

  pasteBallInitKinetics();

  // keyboard controls
  keyboardControls = new KeyboardControls(camera, player, state, resetEverything);
  renderer.domElement.addEventListener('keydown', keyboardControls.keyDown);
  renderer.domElement.addEventListener('keyup', keyboardControls.keyUp);

  // plotly
  plotter = new Plotter(fps, drawPointFramesInterval, ball);

  requestAnimationFrame(animate);
}

function animate() {
  // input
  keyboardControls.handleCamera();
  keyboardControls.handleEnv();

  // physics
  if (state.physicsOn) {
    if (framesPassed % drawPointFramesInterval == 0) {
      trail.geometry.vertices.push(ball.position.clone());
      var v = trail.geometry.vertices;
      var m = trail.material;
      trail.geometry = new THREE.Geometry();
      trail.geometry.vertices = v;

      trailGround.geometry.vertices.push(ball.position.clone().setComponent(1, 0));
      var v = trailGround.geometry.vertices;
      var m = trailGround.material;
      trailGround.geometry = new THREE.Geometry();
      trailGround.geometry.vertices = v;
      if(!plotter.finishedPlotting){
        plotter.updatePlots();
      }
    }

    ball.v.addScaledVector(gravity, 1/fps);
    ball.position.addScaledVector(ball.v, 1/fps);
    framesPassed++;
    if (ball.position.y < ball.r) {
      initBallKinetics();
      if (eraseTrailWhenBallHitsGround) { trail.geometry.vertices = []; }
      framesPassed = 0;
      if (!plotter.finishedPlotting) {
        plotter.fillAllPlots();			
      }
    }
  }
  if (axes[0].visible) {
    setAxesPositions();
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

function setBallInitKinetics() {
  var letters = ['x', 'y', 'z'];
  var isValid = true;
  var pos = letters.map(function(letter) {
    var n = parseFloat(document.getElementById('pos-'+letter).value);
    if (isNaN(n)) isValid = false;
      else return n;
  });
  var vel = letters.map(function(letter) {
    var n = parseInt(document.getElementById('vel-'+letter).value);
    if (isNaN(n)) isValid = false;
      else return n;
  });
  var axis = letters.map(function(letter) {
    var n = parseInt(document.getElementById('axis-'+letter).value);
    if (isNaN(n)) isValid = false;
      else return n;
  });
  var rot = parseInt(document.getElementById('rot').value);
    if (isNaN(rot)) isValid = false;

  if (!isValid) {
    alert("All fields must be real numbers.");
    return;
  }
  if(pos) ballInitP.fromArray(pos);
  if(vel) ballInitV.fromArray(vel);
  //if(axis) ballAxis.fromArray(axis);
  //if(rot) ballRot.fromArray(rot);
}

function pasteBallInitKinetics() {
  var letters = ['x', 'y', 'z'];
  letters.map(function(letter) {
    document.getElementById('pos-'+letter).value = ballInitP[letter];
  });
  letters.map(function(letter) {
    document.getElementById('vel-'+letter).value = ballInitV[letter];
  });
  letters.map(function(letter) {
    document.getElementById('axis-'+letter).value = 0;
  });
  document.getElementById('rot').value = 0;
}

function setAxesPositions() {
  axes.map(function(axis) {
    axis.position.copy(ball.position);
  });
}

function resetEverything() {
  initBallKinetics();
  framesPassed = 0;
  trail.geometry.vertices = [];
  trailGround.geometry.vertices = [];
  plotter.resetPlots();
}
resetEverything = resetEverything.bind(this);



init();


function toggleAxes() {
  axes.map(function(axis) {
    axis.visible = !axis.visible;
  });
}

function toggleGroundAxes() {
  groundAxes.map(function(axis) {
    axis.visible = !axis.visible;
  });
}
