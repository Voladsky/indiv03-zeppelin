import { createProgram } from "./webgl-utils.js";
import { parseOBJ } from "./obj-loader.js";
import {
  mat4,
  vec3,
  glMatrix,
} from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm";

class Camera {
  constructor(
    position = [0.0, 0.0, 0.0],
    up = [0.0, 1.0, 0.0],
    yaw = -90.0,
    pitch = 0.0
  ) {
    // Camera Attributes
    this.position = vec3.clone(position);
    this.front = vec3.fromValues(0.0, 0.0, -1.0);
    this.worldUp = vec3.clone(up);
    this.up = vec3.create();
    this.right = vec3.create();

    // Euler Angles
    this.yaw = yaw;
    this.pitch = pitch;

    // Camera Options
    this.movementSpeed = 2.5;
    this.mouseSensitivity = 0.1;
    this.zoom = 45.0;

    this.updateCameraVectors();
  }

  // Returns the view matrix calculated using Euler angles and the LookAt matrix
  getViewMatrix() {
    let target = vec3.create();
    vec3.add(target, this.position, this.front); // target = position + front
    return mat4.lookAt(mat4.create(), this.position, target, this.up);
  }

  // Processes keyboard input
  processKeyboard(direction, deltaTime) {
    let velocity = this.movementSpeed * deltaTime;
    let movement = vec3.create();

    if (direction === "FORWARD")
      vec3.scaleAndAdd(movement, movement, this.front, velocity);
    if (direction === "BACKWARD")
      vec3.scaleAndAdd(movement, movement, this.front, -velocity);
    if (direction === "LEFT")
      vec3.scaleAndAdd(movement, movement, this.right, -velocity);
    if (direction === "RIGHT")
      vec3.scaleAndAdd(movement, movement, this.right, velocity);
    if (direction === "UP")
      vec3.scaleAndAdd(movement, movement, this.up, velocity);
    if (direction === "DOWN")
      vec3.scaleAndAdd(movement, movement, this.up, -velocity);

    vec3.add(this.position, this.position, movement);

    // Rotation
    const rotationSpeed = 20.0;
    if (direction === "ROTATE_LEFT") this.yaw -= rotationSpeed * deltaTime;
    if (direction === "ROTATE_RIGHT") this.yaw += rotationSpeed * deltaTime;

    this.updateCameraVectors();
  }

  // Processes mouse movement input
  processMouseMovement(xoffset, yoffset, constrainPitch = true) {
    xoffset *= this.mouseSensitivity;
    yoffset *= this.mouseSensitivity;

    this.yaw += xoffset;
    this.pitch += yoffset;

    // Constrain pitch to avoid screen flipping
    if (constrainPitch) {
      this.pitch = Math.min(Math.max(this.pitch, -89.0), 89.0);
    }

    this.updateCameraVectors();
  }

  // Processes mouse scroll input
  processMouseScroll(yoffset) {
    this.zoom -= yoffset;
    this.zoom = Math.min(Math.max(this.zoom, 1.0), 45.0);
  }

  // Updates the camera's Front, Right, and Up vectors using Euler Angles
  updateCameraVectors() {
    const front = vec3.create();
    front[0] =
      Math.cos(glMatrix.toRadian(this.yaw)) *
      Math.cos(glMatrix.toRadian(this.pitch));
    front[1] = Math.sin(glMatrix.toRadian(this.pitch));
    front[2] =
      Math.sin(glMatrix.toRadian(this.yaw)) *
      Math.cos(glMatrix.toRadian(this.pitch));
    vec3.normalize(this.front, front);

    // Recalculate Right and Up vectors
    vec3.cross(this.right, this.front, this.worldUp);
    vec3.normalize(this.right, this.right);

    vec3.cross(this.up, this.right, this.front);
    vec3.normalize(this.up, this.up);
  }
}

class Object3D {
  constructor(gl, program, objData, textureUrl, scale) {
    this.gl = gl;
    this.program = program;

    const { positions, texCoords } = parseOBJ(objData);

    for (let i = 0; i < positions.length; i++) {
      positions[i] *= scale;
    }

    this.vertexCount = positions.length / 3;

    // Create and bind VAO
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // Create position buffer
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // Create texture coordinate buffer
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    // Create instance transformation buffer
    this.instanceMatrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixBuffer);
    const matrixAttribLocations = [2, 3, 4, 5];
    const floatsPerMatrix = 16; // 4x4 matrix
    for (let i = 0; i < 4; i++) {
      gl.enableVertexAttribArray(matrixAttribLocations[i]);
      gl.vertexAttribPointer(
        matrixAttribLocations[i],
        4, // 4 floats per column
        gl.FLOAT,
        false,
        floatsPerMatrix * 4, // Byte stride for the entire matrix
        i * 4 * 4 // Byte offset for this column
      );
      gl.vertexAttribDivisor(matrixAttribLocations[i], 1); // Update once per instance
    }

    gl.bindVertexArray(null);

    // Load texture
    this.texture = gl.createTexture();
    const image = new Image();
    image.src = textureUrl;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      gl.generateMipmap(gl.TEXTURE_2D);
    };
  }

  updateInstanceMatrices(matrices) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, matrices, gl.DYNAMIC_DRAW);
  }

  renderInstanced(instanceCount, viewMatrix) {
    const gl = this.gl;

    gl.useProgram(this.program);

    // Set the uniform matrix explicitly
    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program, "uMatrix"),
      false,
      viewMatrix
    );

    gl.bindVertexArray(this.vao);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, this.vertexCount, instanceCount);

    gl.bindVertexArray(null);
  }

  render(matrix) {
    const gl = this.gl;

    gl.useProgram(this.program);
    gl.uniformMatrix4fv(
      gl.getUniformLocation(this.program, "uMatrix"),
      false,
      matrix
    );

    gl.bindVertexArray(this.vao);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

    gl.bindVertexArray(null);
  }
}

document.addEventListener("click", function () {
  document.body.requestPointerLock();
});

const ratSize = 1e3;
const ratRandoms = [];
for (var i = 0; i < ratSize; i++) {
  ratRandoms.push(Math.random() + 0.5);
}

const ratOrbitsX = [];
for (var i = 0; i < ratSize; i++) {
  ratOrbitsX.push((Math.random() * ratSize) / 10 + 1.5);
}

const ratOrbitsY = [];
for (var i = 0; i < ratSize; i++) {
  ratOrbitsY.push((Math.random() * ratSize) / 100 - 2.0);
}

const ratSpeedsX = [];
for (var i = 0; i < ratSize; i++) {
  ratSpeedsX.push(Math.random() + 0.5);
}

const ratSpeedsY = [];
for (var i = 0; i < ratSize; i++) {
  ratSpeedsY.push(Math.random() * 10 + 1.0);
}

(async () => {
  function resizeCanvasToDisplaySize(canvas) {
    const realToCSSPixels = window.devicePixelRatio || 1;

    const displayWidth = Math.floor(canvas.clientWidth * realToCSSPixels);
    const displayHeight = Math.floor(canvas.clientHeight * realToCSSPixels);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }

  const canvas = document.getElementById("gl-canvas");
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    console.error("WebGL2 not supported.");
    return;
  }

  resizeCanvasToDisplaySize(canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);

  const vertexShaderSrc = `#version 300 es
        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec2 aTexCoord;
        layout(location = 2) in mat4 aMatrix;
        uniform mat4 uMatrix;
        out vec2 vTexCoord;
        void main() {
            gl_Position = uMatrix * aMatrix * vec4(aPosition, 1.0);
            vTexCoord = aTexCoord;
        }
    `;

  const fragmentShaderSrc = `#version 300 es
        precision mediump float;
        uniform sampler2D uTexture;
        in vec2 vTexCoord;
        out vec4 outColor;
        void main() {
            outColor = texture(uTexture, vTexCoord);
        }
    `;

  const camera = new Camera([0.0, 0.0, 5.0]); // Position at (0, 0, 5)
  const projectionMatrix = mat4.create(); // For perspective projection

  mat4.perspective(
    projectionMatrix,
    Math.PI / 4, // 45 degrees field of view
    canvas.width / canvas.height, // Aspect ratio
    0.1, // Near plane
    100.0 // Far plane
  );

  const keys = {};
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  function update(deltaTime) {
    if (keys["w"]) camera.processKeyboard("FORWARD", deltaTime);
    if (keys["s"]) camera.processKeyboard("BACKWARD", deltaTime);
    if (keys["a"]) camera.processKeyboard("LEFT", deltaTime);
    if (keys["d"]) camera.processKeyboard("RIGHT", deltaTime);
    if (keys["q"]) camera.processKeyboard("UP", deltaTime);
    if (keys["e"]) camera.processKeyboard("DOWN", deltaTime);
  }

  document.body.addEventListener("mousemove", function (event) {
    camera.processMouseMovement(event.movementX, -event.movementY);
  });

  const program = createProgram(gl, vertexShaderSrc, fragmentShaderSrc);

  // Load the cat model
  const catResponse = await fetch("../models/Kowalski.obj");
  const catObjData = await catResponse.text();
  const cat = new Object3D(
    gl,
    program,
    catObjData,
    "../images/Kowalski.png",
    1
  );

  // Load the mouse model
  const ratResponse = await fetch("../models/rat.obj");
  const ratObjData = await ratResponse.text();
  const rat = new Object3D(
    gl,
    program,
    ratObjData,
    "../images/rat_texture.png",
    0.2
  );

  function render() {
    resizeCanvasToDisplaySize(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const deltaTime = 0.016; // Approximate for simplicity
    update(deltaTime); // Update camera position

    const viewMatrix = camera.getViewMatrix(); // Get updated view matrix
    const vpMatrix = mat4.create(); // Combined View-Projection matrix
    mat4.multiply(vpMatrix, projectionMatrix, viewMatrix);

    const now = Date.now() / 1000;

    // Pass VP matrix to render cat
    const catMatrices = new Float32Array(16);
    const matrix = mat4.create();
    mat4.rotateY(matrix, matrix, now);
    catMatrices.set(matrix);
    cat.updateInstanceMatrices(catMatrices);
    cat.renderInstanced(1, vpMatrix);

    // Pass VP matrix to render rats
    const ratMatrices = new Float32Array(16 * ratSize);
    for (let i = 0; i < ratSize; i++) {
      const angle = (Math.PI * 2 * i) / ratSize + now * ratSpeedsX[i];
      const ratMatrix = mat4.create();
      const x = Math.cos(angle) * ratOrbitsX[i];
      const z = Math.sin(angle) * ratOrbitsX[i];
      mat4.translate(ratMatrix, ratMatrix, [x, ratOrbitsY[i], z]);
      mat4.rotateY(ratMatrix, ratMatrix, now * ratSpeedsY[i]);
      mat4.scale(ratMatrix, ratMatrix, [
        ratRandoms[i],
        ratRandoms[i],
        ratRandoms[i],
      ]);
      ratMatrices.set(ratMatrix, i * 16);
    }
    rat.updateInstanceMatrices(ratMatrices);
    rat.renderInstanced(ratSize, vpMatrix);

    requestAnimationFrame(render);
  }

  render();
})();
