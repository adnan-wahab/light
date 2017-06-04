
let glm = require("gl-matrix");
let mat4 = glm.mat4
let vec3 = glm.vec3
let vec2 = glm.vec2
let quat = glm.quat

function normalizedMouse(mouseX, mouseY, width, height) {
  return [(2.0 * mouseX / width) - 1.0, 1.0 - (2.0 * mouseY / height)];
};

var _TMP_VEC2 = [0.0, 0.0];
var _TMP_VEC3 = [0.0, 0.0, 0.0];
var _TMP_EYE = [0.0, 0.0, 0.0];
var _UP = [0.0, 1.0, 0.0];
var _TMP_QUAT = [0.0, 0.0, 0.0, 1.0];
var _TMP_MAT = mat4.create();

var _sq = Math.SQRT1_2;
var _d = 0.5;

class Camera {
  constructor() {
   this._quatRot = [0.5497909650268096, 0.6564698035674892, -0.06884606932414049, -0.5118959958014655];

   this._view = mat4.clone(
     [0.7184602618217468, -0.0047233677469193935, -0.6955519914627075, 0, 0.4504257142543793, 0.7651517391204834, 0.4600646197795868, 0, 0.5300297737121582, -0.6438326239585876, 0.55185866355896, 0, 0, 0, -5.6411919593811035, 1]
   );

   this._proj = mat4.clone(
     [1.2071068286895752, 0, 0, 0, 0, 2.4142136573791504, 0, 0, 0, 0, -1, -1, 0, 0, -0.019999999552965164, 0]
   );

   this._viewport = mat4.clone(
     [360, 0, 0, 0, 0, 180, 0, 0, 0, 0, 0.5, 0, 360, 180, 0.5, 1]
   ); 


    this._lastNormalizedMouseXY = [0.0, 0.0];
    this._width = 0.0; 
    this._height = 0.0;

    this._speed = 0.0;
    this._fov = 45;

   this._trans = [0, 0, 3]

    this._center = [0.0, 0.0, 0.0]; // center of rotation
    this._offset = [0.0, 0.0, 0.0];

    // near far
    this._near = 0.01;
    this._far = 338;


   this.updateView();
  }

  mode() {
    return this._fov;
  }

  rotate(mouseX, mouseY) {
    var axisRot = _TMP_VEC3;
    var diff = _TMP_VEC2;

    var normalizedMouseXY = normalizedMouse(mouseX, mouseY, this._width, this._height);
      var length = vec2.dist(this._lastNormalizedMouseXY, normalizedMouseXY);
      vec2.sub(diff, normalizedMouseXY, this._lastNormalizedMouseXY);
      vec3.normalize(axisRot, vec3.set(axisRot, -diff[1], diff[0], 0.0));
      quat.mul(this._quatRot, quat.setAxisAngle(_TMP_QUAT, axisRot, length * 2.0), this._quatRot);

    this._rotDelta(axisRot, length * 6);
    this._lastNormalizedMouseXY = normalizedMouseXY;
    this.updateView();
  }

  getTransZ() {
    return this._trans[2] * 45 / this._fov;
  }

  updateView() {
    var center = _TMP_VEC3;

    var view = this._view;

    var tx = this._trans[0];
    var ty = this._trans[1];
    var off = this._offset;
    vec3.set(_TMP_EYE, tx - off[0], ty - off[1], this.getTransZ() - off[2]);
    vec3.set(center, tx - off[0], ty - off[1], -off[2]);
    mat4.lookAt(view, _TMP_EYE, center, _UP);

    mat4.mul(view, view, mat4.fromQuat(_TMP_MAT, this._quatRot));
    mat4.translate(view, view, vec3.negate(_TMP_VEC3, this._center));
  }

  updateProjection() {
      mat4.perspective(this._proj, this._fov * Math.PI / 180.0, this._width / this._height, this._near, this._far);
      this._proj[10] = -1.0;
      this._proj[14] = -2 * this._near;
  }

  setTrans(trans) {
    vec3.copy(this._trans, trans);
    this.updateView();
  }

  onResize(width, height) {

    this._width = width;
    this._height = height;

    var vp = this._viewport;
    mat4.identity(vp);
    mat4.scale(vp, vp, vec3.set(_TMP_VEC3, 0.5 * width, 0.5 * height, 0.5));
    mat4.translate(vp, vp, vec3.set(_TMP_VEC3, 1.0, 1.0, 1.0));

    this.updateProjection();
  }

  _translateDelta(delta, dr) {
    var trans = this._trans;
    vec3.scaleAndAdd(trans, trans, delta, dr);
    this.setTrans(trans);
  }

  _rotDelta(delta, d3) {
    quat.mul(this._quatRot, quat.setAxisAngle(_TMP_QUAT, delta, d3), this._quatRot);
    this.updateView();
  }
}
module.exports = Camera
