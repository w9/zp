// Usage:
// new LIB.MouseState   -->  init()
// mousestate.update()  -->  render()
//
var LIB = LIB || {};

LIB.MouseState = function (domElement, camera, objs) {
  this.domElement= domElement || document;
  this.camera = camera;
  this.objs = objs;
  this.mouse = new THREE.Vector2(Infinity, Infinity);
  this.raycaster = new THREE.Raycaster();
  this.hoveredObj = null;
  this.selectedObj = null;
  
  // create callback to bind/unbind keyboard events
  var _this = this;

  // bind keyEvents
  this.domElement.addEventListener("mousemove", function(e){_this._onMouseMove(e)}, false);
  this.domElement.addEventListener("click", function(e){_this._onClick(e)}, false);
}

LIB.MouseState.prototype.destroy = function() {
  this.domElement.removeEventListener("mousemove", this._onMouseMove, false);
};

LIB.MouseState.prototype._onMouseMove = function(e) {
  this.mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
  this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
};
