var fps = 60;
var framesPassed = 0;
var drawPointFramesInterval = 5; // draw a point every {drawPointFramesInterval} frames
var eraseTrailWhenBallHitsGround = false;
var screenWidth = window.innerWidth, screenHeight = window.innerHeight;
var renderer, scene, ballLight, camera;
var ball, trail, trailGround, trace, traceGround, doneDrawingTrail = false;
var fieldWidth = 68 * 1024/725.8; // 68 meters is kinda standard width
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
//var ballInitV = new THREE.Vector3(60, 6, 4);
//var ballInitAxis = new THREE.Vector3(0, 1, 0);
var ballInitV = new THREE.Vector3(10, 7, 0);
var ballInitAxis = new THREE.Vector3(-1, 0, 0);
var ballInitAngle = 0;
var ballRot = Math.PI * 8;
var ballAxis = new THREE.Vector3(0, 1, 0);
var gravity = new THREE.Vector3(0, -9.8, 0);
var ballLightOffset = new THREE.Vector3(-2 * ballRadius, 3 * ballRadius, -2 * ballRadius);

var state = {
  physicsOn: false
};

var textureInfos = [{ path: 'footballmap2.png' }, { path: 'footballpitch2.svg' }];
var texturesToLoad = textureInfos.length;
var loader = new THREE.TextureLoader();
textureInfos.map(function(textureInfo) {
  loader.load(textureInfo.path, function(texture) {
    textureInfo.texture = texture;
    texturesToLoad--;
  });
});

var id = setInterval(function() {
  if (!texturesToLoad) {
    document.getElementById('myCanvas').style.visible = true;
    init();
    clearInterval(id);
  }
}, 300);

function init() {
  // renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('myCanvas'),
    antialias: true
  });
  renderer.setClearColor(0x007F7F);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(screenWidth-3, screenHeight-3);
  renderer.shadowMap.enabled = true;
  renderer.domElement.addEventListener('mousedown', function() {
    document.getElementById('clickprompt').style.display="none";
  });


  // scene
  scene = new THREE.Scene();

  // ball
  ball = new THREE.Mesh(
    new THREE.SphereGeometry(ballRadius, 20, 20),
    new THREE.MeshPhongMaterial({ map: textureInfos[0].texture })
    //new THREE.MeshPhongMaterial({color: 0xFFFFFF})
  );
  ball.receiveShadow = true;
  ball.castShadow = true;
  ball.r = ballRadius;
  ball.v = new THREE.Vector3();
  initBallKinetics();
  scene.add(ball);

  // trails and traces

  trail = new THREE.Points(
    new THREE.Geometry(),
    new THREE.PointsMaterial({ color: 0xFF3F3F, size: 0.3 })
  );
  scene.add(trail);
  trailGround = new THREE.Points(
    new THREE.Geometry(),
    new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.3 })
  );
  scene.add(trailGround);
  trace = new THREE.Line(
    new THREE.Geometry(),
    new THREE.LineBasicMaterial({ color: 0xFF3F3F, size: 0.1 })
  );
  scene.add(trace);
  traceGround = new THREE.Line(
    new THREE.Geometry(),
    new THREE.LineBasicMaterial({ color: 0xFFFFFF, size: 0.1 })
  );
  scene.add(traceGround);
  document.getElementById('csv-textarea').value = '';

  // floor
  var meshFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000),
    new THREE.MeshPhongMaterial({color: 0x007F00})
  );
  meshFloor.position.y -= 0.02;
  meshFloor.rotation.x -= Math.PI / 2;
  meshFloor.receiveShadow = true;
  scene.add(meshFloor);

  // field
  var field = new THREE.Mesh(
    new THREE.PlaneGeometry(fieldWidth * 2, fieldWidth),
    new THREE.MeshPhongMaterial({ map: textureInfos[1].texture, transparent: true })
  );
  //field.position.y += 0.005;
  field.rotation.x -= Math.PI/2;
  field.receiveShadow = true;
  scene.add(field);

  // goal
  var goal1 = makeGoal(1);
  scene.add(goal1);
  var goal2 = makeGoal(-1);
  scene.add(goal2);

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
  camera.position.set(-5, player.height, 0);
  camera.rotation.order = 'YXZ';
  camera.lookAt(new THREE.Vector3(0, player.height, 0));
  camera.rotation.x -= Math.PI/12;

  pasteBallInitKinetics();

  // keyboard controls
  keyboardControls = new KeyboardControls(camera, player, state, resetEverything);
  renderer.domElement.addEventListener('keydown', keyboardControls.keyDown);
  renderer.domElement.addEventListener('keyup', keyboardControls.keyUp);

  requestAnimationFrame(animate);
}

//Constants
var airDensity = 1.2;
var airViscosity = 1.5 * Math.pow(10, -5);
var ballRadius = 0.109;
var ballMass = 0.436;

function animate() {
  // input
  keyboardControls.handleCamera();
  keyboardControls.handleEnv();

  // physics
  ball.rotateOnAxis(ballAxis, ballRot/fps);
  if (state.physicsOn) {
    if (!doneDrawingTrail) {
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
      }
      trace.geometry.vertices.push(ball.position.clone());
      var v = trace.geometry.vertices;
      var m = trace.material;
      trace.geometry = new THREE.Geometry();
      trace.geometry.vertices = v;

      traceGround.geometry.vertices.push(ball.position.clone().setComponent(1, 0));
      var v = traceGround.geometry.vertices;
      var m = traceGround.material;
      traceGround.geometry = new THREE.Geometry();
      traceGround.geometry.vertices = v;
    }

    var ballVelocity = ball.v.length();
    var ballCrossArea = Math.PI*Math.pow(ballRadius, 2);

    //dragForce
    var reynolds, dragCoefficient, dragForce, dragAcceleration;
    reynolds = airDensity * ballVelocity * 2*ballRadius / airViscosity;
    if(reynolds < 100000){
        dragCoefficient = 0.47;
    }else if(reynolds < 135000){
        dragCoefficient = 0.47 - 0.25 * (reynolds - 100000)/35000;
    }else{
        dragCoefficient = 0.22;
    }
    dragForce = 1/2 * dragCoefficient * airDensity * Math.pow(ballVelocity, 2) * ballCrossArea;
    dragAcceleration = dragForce / ballMass;
    var dragDirection = new THREE.Vector3();
    dragDirection.copy(ball.v).negate();
    dragDirection.setLength(dragAcceleration);

    //Magnus Force
    var liftCoefficient, liftForce, liftAcceleration;
    liftCoefficient = 0.385 * Math.pow((ballRadius * ballRot / ballVelocity), 0.25);
    liftForce = 1/2 * liftCoefficient * airDensity * Math.pow(ballVelocity, 2) * ballCrossArea;
    liftAcceleration = liftForce / ballMass;
    var liftDirection = new THREE.Vector3();
    liftDirection.crossVectors(ballAxis, ball.v);
    liftDirection.setLength(liftAcceleration);


    //normal stuff and gravity;
    ball.v.addScaledVector(gravity, 1/fps);
	ball.v.addScaledVector(dragDirection, 1/fps);
	ball.v.addScaledVector(liftDirection, 1/fps);
    ball.position.addScaledVector(ball.v, 1/fps);
    framesPassed++;
    if (ball.position.y < ball.r) {
      initBallKinetics();
      if (eraseTrailWhenBallHitsGround) { trail.geometry.vertices = []; }
      if (eraseTrailWhenBallHitsGround) { trace.geometry.vertices = []; }
      framesPassed = 0;
      doneDrawingTrail = true;
      generateCSV();
    }
  }
  if (axes[0].visible) {
    setAxesPositions();
  }

  // other changes
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
    var n = parseFloat(document.getElementById('vel-'+letter).value);
    if (isNaN(n)) isValid = false;
      else return n;
  });
  var axis = letters.map(function(letter) {
    var n = parseFloat(document.getElementById('axis-'+letter).value);
    if (isNaN(n)) isValid = false;
      else return n;
  });
  var rot = parseFloat(document.getElementById('rot').value);
    if (isNaN(rot)) isValid = false;

  if (!isValid) {
    alert("All fields must be real numbers.");
    return;
  }
  if(pos) ballInitP.fromArray(pos);
  if(vel) ballInitV.fromArray(vel);
  if(axis) {
	  ballAxis.fromArray(axis).normalize();
	  console.log("New ballAxis: " + JSON.stringify(ballAxis));
  }
  if(rot || rot == 0) {
	  ballRot = rot * 2 * Math.PI;
	  console.log("New ballRot: " + ballRot);
  }
  resetEverything();
}

function pasteBallInitKinetics() {
  var letters = ['x', 'y', 'z'];
  letters.map(function(letter) {
    document.getElementById('pos-'+letter).value = ballInitP[letter];
    document.getElementById('vel-'+letter).value = ballInitV[letter];
    document.getElementById('axis-'+letter).value = ballAxis[letter];
  });
  document.getElementById('rot').value = ballRot / 2 / Math.PI;
}

function setAxesPositions() {
  axes.map(function(axis) {
    axis.position.copy(ball.position);
  });
}

function resetEverything() {
  document.getElementById('csv-textarea').value = '';
  document.getElementById('csv-modal').style.display = 'none';
  initBallKinetics();
  framesPassed = 0;
  doneDrawingTrail = false;
  trail.geometry.vertices = [];
  trailGround.geometry.vertices = [];
  trace.geometry.vertices = [];
  traceGround.geometry.vertices = [];
}
resetEverything = resetEverything.bind(this);


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

function generateCSV() {
  document.getElementById('csv-modal').style.display = 'block';
  document.getElementById('csv-textarea').value =
    'velocity\n' + ballInitV.x + ',' + ballInitV.y + ',' + ballInitV.z + '\n' +
    'axis vector\n' + ballAxis.x + ',' + ballAxis.y + ',' + ballAxis.z + '\n' +
    'rotation\n' + ballRot + '\n' +
    'position for every 1/60 of a second\n' +
    trace.geometry.vertices.map(function(coord) {
      return coord.x + ',' + coord.y + ',' + coord.z;
    }).join('\n');
}
