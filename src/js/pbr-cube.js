//glossmap

//import d3 from "d3"
import * as d3 from 'd3'
import * as glm from "gl-matrix"
//import glsl from "glslify";

import fs from './frag'
import vs from './vert'

let mat4 = glm.mat4
let mat3 = glm.mat3

let Camera = require("./camera.js")
let GL = require('./lightgl')

let size = {
  width: 720, height: 360
}

let rabin = {
  party: {
    uAlbedo: [1,1,1],
    uRoughness: .17,
    uMetallic: .9
  },
  rotation: .5
};


let sphericalHarmonics = new Float32Array([
  0.27108463644981384, 0.24170474708080292, 0.31347501277923584,
  0.15342070162296295, 0.17499005794525146, 0.30566924810409546,
  0.04255439713597298,0.05418602004647255, 0.0838090106844902,
  0.04913826659321785, 0.024380825459957123, 0.014783450402319431,
  0.02236446551978588, 0.016578657552599907, 0.019958892837166786,
  0.007133827544748783, 0.020621415227651596, 0.057397469878196716,
  0.000608141184784472, -0.008813775144517422, -0.03494790941476822,
  0.01969722844660282, 0.024838542565703392, 0.04618683084845543,
  0.0076037002727389336, -0.010234174318611622, -0.044359270483255386
]);

var _transformData = {
  uIblTransform : mat3.create(),
  uSPH: sphericalHarmonics,
  uMV: mat4.create(),
  uMVP: mat4.create(),
  uN: mat3.create()
}

let getTransformData = () => {
  mat4.mul(_transformData.uMV, camera._view, rabin.mesh._matrix);
  mat3.normalFromMat4(_transformData.uN, _transformData.uMV);
  mat4.mul(_transformData.uMVP, camera._proj, _transformData.uMV);

  mat3.fromMat4(_transformData.uIblTransform, camera._view);
  mat3.transpose(_transformData.uIblTransform, _transformData.uIblTransform);

  return _transformData;
}

let ondraw = () => {
  let gl = rabin.gl;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_gl);
  gl.viewport(0,0, gl.canvas.width, gl.canvas.height)

  rabin.texture.bind(0);

  //rabin.party.uRoughness = (Math.sin(Date.now() * .001) + 1) / 2

  rabin.shader
    .uniforms(getTransformData())
    .uniforms(rabin.party)
    .draw(rabin.mesh, gl.TRIANGLES);
};

let keydown = () => {
  let isSpace = d3.event.which === 32
  let hasModifier = d3.event.shiftKey || d3.event.ctrlKey;

  if (!isSpace && ! hasModifier) return;

  d3.event.preventDefault();


  if (isSpace) {
    d3.transition()
  }

  if (d3.event.shiftKey) {
   let i = .01;

   let val = {
      ArrowRight: [+i, 0],
      ArrowLeft: [-i, 0],
      ArrowUp: [0, -i],
      ArrowDown: [0, +i]
    }[d3.event.key]

    if (val) camera.setTrans.call(camera, val.concat(2))
  }

  if (d3.event.ctrlKey) {
    let i = .001;
    let val = {
      ArrowRight: [+i, 0],
      ArrowLeft: [-i, 0],
      ArrowUp: [0, -i],
      ArrowDown: [0, +i]
    }[d3.event.key]

    if (val)
      camera.rotate.apply(camera, val);
  }
}

d3.select(window).on('keydown', keydown)

let rotator = () => { camera.rotate(rabin.rotation += 5, 1) };


// let forever = 0
// d3.timer(() => {
//   camera.rotate(forever++, 0)
// })


let playPause = (d, i, s) => {
  d3.transition().duration(10000).tween('rotate', function () {
    let i = d3.interpolate(0, 1000);
    return function (t) {
      camera.rotate(i(t), 0)
    }
  })
  // d.playing = ! d.playing;

  // s[0].textContent = (d.playing ? '❚ ❚ Pause' : '▶ Play');

  // if (! d.timer)
  //   return d.timer = d3.timer(rotator);

  // if (! d.timer._call) return d.timer.restart(rotator);
}

d3.select('.play-pause-webgl').on('click', playPause)

let zoomed = (x) => {
  camera._trans[2] = x || d3.event.transform.k;
  camera.updateView();
}

let events = (canvas) => {
  let drag = d3.drag().container(function () { return this })
      .subject(function () { return {} })
      .on('start', dragstarted)

  d3.select(canvas)
    .call(drag)
    .call(d3.zoom()
          .scaleExtent([3, 15])
          .translateExtent([[-100, -100], [size.width + 90, size.height + 100]])
          .on("zoom", zoomed)
         )
    .on('wheel', () => { d3.event.preventDefault() })

  d3.selectAll('input[type="range"]').on('mousemove', (d, i, s) => {
    let node = s[i]
    let x = d3.mouse(node)[0]
    node.value = x
    console.log(node.offsetWidth)
    console.log(x, node.className);
    rabin.party['u'+node.className] = x / node.offsetWidth
  })

  d3.selectAll('input').on('input', (d, i, s) => {
    let node = d3.event.target;
    console.log(node.type)
    let val = (node.type)  == 'range' ? node.value / 100 : pColor(node.value);
    rabin.party['u'+node.className]  = val;

  })
}


var camera  = new Camera();
camera.onResize(720, 360);
let webgl = d3.select('.webgl').node()


var gl = GL.create(webgl);
gl.clearColor(1, 1, 1, 1);
gl.enable(gl.DEPTH_TEST);

events(webgl);

rabin.mesh = GL.Mesh.cube({
  normals: true,
  coords: true
});

rabin.mesh._matrix = mat4.create();

rabin.texture = GL.Texture.fromBin('./assets/foodprint.png');


rabin.shader = new GL.Shader(vs.vs, fs.fs);
rabin.gl = gl;

d3.timer(ondraw)


function pColor(col) {
  let rgb = d3.rgb(col)
  return [rgb.r / 255,
          rgb.g / 255,
          rgb.b / 255
         ]
}

function dragstarted() {
  var d = d3.event.subject,
      x0 = d3.event.x,
      y0 = d3.event.y;

  d3.event.on("drag", function() {
    var x1 = d3.event.x,
        y1 = d3.event.y,
        dx = x1 - x0,
        dy = y1 - y0;

    camera.rotate(dx, dy);
  });
}


