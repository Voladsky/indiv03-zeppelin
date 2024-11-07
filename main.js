"use strict";

var vertexShaderSource = `#version 300 es
in vec2 coord;

void main() {
  gl_Position = vec4(coord, 0.0, 1.0);
}
`;

var fragmentShaderSource = `#version 300 es
precision highp float;

out vec4 color;

void main() {
  // Just set the output to a constant redish-purple
  color = vec4(0, 1, 0, 1);
}
`;

function initShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);

  return undefined;
}

function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#gl-canvas");
  /** @type {WebGLRenderingContext} */
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    alert("No WebGL for you. Skill issue!");
    return;
  }

  var vertexShader = initShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = initShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  var program = createProgram(gl, vertexShader, fragmentShader);

  var vertexAttributeLocation = gl.getAttribLocation(program, "coord");

  if (vertexAttributeLocation === -1) {
    alert("Something is wrong with getAttribLocation for coord!");
    return;
  }

  var VBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, VBO);

  var triangle = [
    -1.0, -1.0,
    0.0, 1.0,
    1.0, -1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle), gl.STATIC_DRAW);

  //webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  gl.useProgram(program);
  gl.enableVertexAttribArray(vertexAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, VBO);

  gl.vertexAttribPointer(vertexAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

}

main();
