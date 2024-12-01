"use strict";
const vertexShaderString = `#version 300 es
  in vec2 coord;

  void main() {
    gl_Position = vec4(coord, 0.0, 1.0);
  }
  `;
const fragmentShaderString = `#version 300 es
  precision highp float;

  out vec4 color;

  void main() {
    // the TRIANGLE is GREEN
    color = vec4(0, 1, 0, 1);
  }
  `;
function initShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader)
        return undefined;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return undefined;
}
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    if (!program)
        return undefined;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return undefined;
}
function main() {
    const canvas = document.querySelector("#gl-canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("No WebGL2 for YOU!");
        return;
    }
    const vertexShader = initShader(gl, gl.VERTEX_SHADER, vertexShaderString);
    const fragmentShader = initShader(gl, gl.FRAGMENT_SHADER, fragmentShaderString);
    if (!vertexShader || !fragmentShader) {
        alert("VertexShader or FragmentShader are not initialized!");
        return;
    }
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        alert("Program is not initialized!");
        return;
    }
    const vertexAttributeLocation = gl.getAttribLocation(program, "coord");
    if (vertexAttributeLocation === -1) {
        alert("Something is wrong with getAttribLocation for coord!");
        return;
    }
    const VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    const triangle = [
        -1.0, -1.0,
        0.0, 1.0,
        1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(vertexAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.vertexAttribPointer(vertexAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    var error = gl.getError();
    if (error != gl.NO_ERROR) {
        alert(error);
        return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(VBO);
    gl.useProgram(null);
    gl.deleteProgram(program);
}
