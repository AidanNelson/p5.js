'use strict';

var p5 = require('../core/core');

/**
 * Allows rotation of a 3D sketch by dragging the mouse. As the mouse is dragged
 * away from the center of the canvas in the X or Y direction, the sketch is
 * rotated about the Y or X axis respectively. Note that this rotation only
 * affects objects drawn after orbitControl() has been called in the draw() loop.
 * To reverse movement in either axis, enter a negative number for sensitivity.
 * Calling this function without arguments is equivalent to calling orbitControl(1,1).
 * @method orbitControl
 * @for p5
 * @param  {Number} [sensitivityX]        sensitivity to mouse movement along X axis
 * @param  {Number} [sensitivityY]        sensitivity to mouse movement along Y axis
 * @chainable
 * @example
 * <div>
 * <code>
 * function setup() {
 *   createCanvas(100, 100, WEBGL);
 * }
 *
 * function draw() {
 *   background(200);
 *   // Orbit control allows the camera to orbit around a target.
 *   orbitControl();
 *   box(30, 50);
 * }
 * </code>
 * </div>
 *
 * @alt
 * Camera orbits around box when mouse is hold-clicked & then moved.
 */
//@TODO: implement full orbit controls including
//pan, zoom, quaternion rotation, etc.
// implementation based on three.js 'orbitControls'
p5.prototype.orbitControl = function(sensitivityX, sensitivityY) {
  this._assert3d('orbitControl');
  p5._validateParameters('orbitControl', arguments);

  if (typeof sensitivityX === 'undefined') {
    sensitivityX = 1;
  }
  if (typeof sensitivityY === 'undefined') {
    sensitivityY = sensitivityX;
  }

  // hack to get around linter not allowing double declarations of a variable -- ideally this would not need to be declared if unused...
  // camera position
  var camX = this._renderer.cameraX;
  var camY = this._renderer.cameraY;
  var camZ = this._renderer.cameraZ;

  // center coordinates
  var centerX = this._renderer.cameraCenterX;
  var centerY = this._renderer.cameraCenterY;
  var centerZ = this._renderer.cameraCenterZ;

  if (this.keyIsDown(this.SHIFT) && this.mouseIsPressed) {
    //find two vectors perpendicular to current view vector...
    var z0 = camX - centerX;
    var z1 = camY - centerY;
    var z2 = camZ - centerZ;

    var y0 = 0;
    var y1 = 1;
    var y2 = 0;

    // compute x vector as y cross z
    var x0 = y1 * z2 - y2 * z1;
    var x1 = -y0 * z2 + y2 * z0;
    var x2 = y0 * z1 - y1 * z0;

    // recompute y = z cross x
    y0 = z1 * x2 - z2 * x1;
    y1 = -z0 * x2 + z2 * x0;
    y2 = z0 * x1 - z1 * x0;

    // cross product gives area of parallelogram, which is < 1.0 for
    // non-perpendicular unit-length vectors; so normalize x, y here:
    var xmag = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (xmag !== 0) {
      x0 /= xmag;
      x1 /= xmag;
      x2 /= xmag;
    }

    var ymag = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (ymag !== 0) {
      y0 /= ymag;
      y1 /= ymag;
      y2 /= ymag;
    }

    // move along those vectors by amount controlled by mouseX, pmouseY
    var deltaX = -1 * sensitivityX * (this.mouseX - this.pmouseX);
    var deltaY = -1 * sensitivityY * (this.mouseY - this.pmouseY);

    // determine how much to move camera along World XYZ coordinates based on camera view XYZ vectors
    camX += deltaX * x0 + deltaY * y0;
    // camY += deltaX * x1 + deltaY * y1;
    camZ += deltaX * x2 + deltaY * y2;

    centerX += deltaX * x0 + deltaY * y0;
    // centerY += deltaX * x1 + deltaY * y1;
    centerZ += deltaX * x2 + deltaY * y2;

    this.camera(camX, camY, camZ, centerX, centerY, centerZ, 0, 1, 0);
  } else if (this.mouseIsPressed) {
    var deltaTheta = 0.1 * sensitivityX * (this.mouseX - this.pmouseX);
    var deltaPhi = 0.1 * sensitivityY * (this.mouseY - this.pmouseY);

    var diffX = camX - centerX;
    var diffY = camY - centerY;
    var diffZ = camZ - centerZ;

    // get spherical coorinates for current camera position about origin
    var camRadius = Math.sqrt(diffX * diffX + diffY * diffY + diffZ * diffZ);
    // from three.js...
    var camTheta = Math.atan2(diffX, diffZ); // equatorial angle
    var camPhi = Math.acos(Math.max(-1, Math.min(1, diffY / camRadius))); // polar angle

    // add mouse movements
    camTheta += deltaTheta;
    camPhi += deltaPhi;

    // prevent rotation over the zenith / under bottom
    if (camPhi > Math.PI) {
      camPhi = Math.PI;
    } else if (camPhi <= 0) {
      camPhi = 0.001;
    }

    // turn back into Cartesian coordinates
    var sinPhiRadius = Math.sin(camPhi) * camRadius;

    var _x = sinPhiRadius * Math.sin(camTheta);
    var _y = Math.cos(camPhi) * camRadius;
    var _z = sinPhiRadius * Math.cos(camTheta);

    this.camera(
      _x + centerX,
      _y + centerY,
      _z + centerZ,
      centerX,
      centerY,
      centerZ,
      0,
      1,
      0
    );
  }
  return this;
};

module.exports = p5;
