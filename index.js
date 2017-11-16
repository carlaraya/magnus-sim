var fps = 60;
var framesPassed = 0;
var drawPointFramesInterval = 5; // draw a point every {drawPointFramesInterval} frames
var eraseTrailWhenBallHitsGround = false;
var screenWidth = window.innerWidth, screenHeight = window.innerHeight;
var renderer, scene, ballLight, camera;
var ball, trail, trailGround, wireframeFloor, axes = [];
var keyboard = {}, keypressed = {};
var player = { height: 1.8, speed: 0.5, vspeed: 0.5, turnspeed: Math.PI * 0.01 };
var axesData = [
  { points: [[0,0,0],[2,0,0]], color: 0xFF0000},
  { points: [[0,0,0],[0,2,0]], color: 0x00FF00},
  { points: [[0,0,0],[0,0,2]], color: 0x0000FF},
];

var ballRadius = 0.5;
var ballInitP = new THREE.Vector3(10, ballRadius, -10);
var ballInitV = new THREE.Vector3(-6, 15, 4);
var ballInitAxis = new THREE.Vector3(0, 1, 0);
var ballInitAngle = 0;
var gravity = new THREE.Vector3(0, -9.8, 0);
var ballLightOffset = new THREE.Vector3(2 * ballRadius, 1 * ballRadius, 0);

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

  trail = new THREE.Points(
    new THREE.Geometry(),
    new THREE.PointsMaterial({ color: 0xFF3F3F, size: 0.4 })
  );
  scene.add(trail);
  trailGround = new THREE.Points(
    new THREE.Geometry(),
    new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.4 })
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

  //plotly
  initPlots();

  requestAnimationFrame(animate);
}

//Plotly
var trace1;
var plotData;
var plotLayout;
function initPlots(){
	trace1 = {
		x: [],
		y: [],
		type: 'scatter',
		mode: 'lines+markers',
		marker: {
			color: 'rgb(128, 0, 128)',
			size: 8
		},
		line: {
			color: 'rgb(128, 0, 128)',
			width: 1,
			simplify: false,
		}
	};
	plotData = [trace1];
	plotLayout = {
		xaxis: {
			autorange: true,
			showgrid: true,
			zeroline: true,
			showline: true,
			autotick: true,
			ticks: 'outside',
			showticklabels: true,
			title: 'time'
		},
		yaxis: {
			autorange: true,
			showgrid: true,
			zeroline: true,
			showline: true,
			autotick: true,
			ticks: 'outside',
			showticklabels: true,
			title: 'y-position'
		},
		autosize: false,
		width: 420,
		height: 280,
		plot_bgcolor: '#ffff99'
	}
	Plotly.newPlot('plot-me', plotData, plotLayout);
}

var updateRepeatCount = 0;
function updatePlots(){
	updateRepeatCount++;
	trace1.x.push(drawPointFramesInterval*updateRepeatCount)
	trace1.y.push(ball.position.y);
	Plotly.animate('plot-me', {
		data: plotData,
		traces: [0],
		layout: {},
		transition: {
			duration: 200,
			easing: 'cubic-in-out'
		},
		frame: {
			duration: 200,
			redraw: false
		}
	});
}

function animate() {

  // input
  handleKeyboardCameraControls();
  handleKeyboardEnvControls();

  // physics
  if (physicsOn) {
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

	  updatePlots();
    }

    ball.v.addScaledVector(gravity, 1/fps);
    ball.position.addScaledVector(ball.v, 1/fps);
    framesPassed++;
    if (ball.position.y < ball.r) {
      initBallKinetics();
      if (eraseTrailWhenBallHitsGround) { trail.geometry.vertices = []; }
      framesPassed = 0;
    }
  }
  setAxesPositions();

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

function setAxesPositions() {
  axes.map(function(axis) {
    axis.position.copy(ball.position);
  });
}

function handleKeyboardEnvControls() {
  if (keypressed['z']) {
    initBallKinetics();
    framesPassed = 0;
    trail.geometry.vertices = [];
    trailGround.geometry.vertices = [];
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

function toggleAxes() {
  axes.map(function(axis) {
    axis.visible = !axis.visible;
  });
}
