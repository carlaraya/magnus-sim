function KeyboardControls(camera, player, state, resetEverything) {
  this.keyboard = {};
  this.keyPressed = {};
  this.camera = camera;
  this.player = player;
  this.state = state;
  this.resetEverything = resetEverything;
  this.handleCamera = function() {
    if (this.keyboard['w']) { // W
      this.camera.position.x -= Math.sin(this.camera.rotation.y) * this.player.speed;
      this.camera.position.z -= Math.cos(this.camera.rotation.y) * this.player.speed;
    }
    if (this.keyboard['a']) { // A
      this.camera.position.x -= Math.cos(this.camera.rotation.y) * this.player.speed;
      this.camera.position.z += Math.sin(this.camera.rotation.y) * this.player.speed;
    }
    if (this.keyboard['s']) { // S
      this.camera.position.x += Math.sin(this.camera.rotation.y) * this.player.speed;
      this.camera.position.z += Math.cos(this.camera.rotation.y) * this.player.speed;
    }
    if (this.keyboard['d']) { // D
      this.camera.position.x += Math.cos(this.camera.rotation.y) * this.player.speed;
      this.camera.position.z -= Math.sin(this.camera.rotation.y) * this.player.speed;
    }
    if (this.keyboard['r']) { // R
      this.camera.position.y += this.player.vspeed;
    }
    if (this.keyboard['f']) { // making sure this.player stays aboveground
      if (this.camera.position.y > this.player.height + this.player.vspeed) {
        this.camera.position.y -= this.player.vspeed;
      } else {
        this.camera.position.y = this.player.height;
      }
    }
    if (this.keyboard['i']) {
      this.camera.rotation.x += this.player.turnspeed;
    }
    if (this.keyboard['j']) {
      this.camera.rotation.y += this.player.turnspeed;
    }
    if (this.keyboard['k']) {
      this.camera.rotation.x -= this.player.turnspeed;
    }
    if (this.keyboard['l']) {
      this.camera.rotation.y -= this.player.turnspeed;
    }
  }.bind(this);

  this.handleEnv = function() {
    if (this.keyPressed['z']) {
      this.resetEverything();
      this.keyPressed['z'] = false;
    }
    if (this.keyPressed['p']) {
      this.state.physicsOn = !this.state.physicsOn;
      this.keyPressed['p'] = false;
    }
  }.bind(this);

  this.keyDown = function(event) {
    this.keyboard[event.key] = true;
  }.bind(this);
  this.keyUp = function(event) {
    this.keyboard[event.key] = false;
    this.keyPressed[event.key] = true;
  }.bind(this);
}
