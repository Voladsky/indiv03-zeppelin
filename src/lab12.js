import {} from 'https://cdn.jsdelivr.net/npm/gl-matrix@2.4.1/dist/gl-matrix.js';
import {WebGLApp} from './lab10.js';

var image = new Image();
image.src = "../images/master_of_puppets.jpg"

var image2 = new Image();
image2.src = "../images/gang_shit.png";

const btn = document.getElementById("loadImage");
btn.addEventListener("click", loadImages);
function loadImages() {
    var texture1 = document.getElementById("textureInput1");
    var loadedImages = 0;
    function checkAndRender() {
        console.log(loadedImages);
        if (loadedImages === 2) {
            figure = new figure.constructor("#gl-canvas");
            figure.render();
        }
    }

    if (!(!texture1 || !texture1.files || texture1.files.length === 0)) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image.onload = function(e) {
                loadedImages++;
                checkAndRender();
            }
            image.src = e.target.result;
        };
        reader.readAsDataURL(texture1.files[0]);
    }

    var texture2 = document.getElementById("textureInput2");
    if (!(!texture2 || !texture2.files || texture2.files.length === 0)) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image2.onload = function(e) {
                loadedImages++;
                checkAndRender();
            }
            image2.src = e.target.result;
        };
        reader.readAsDataURL(texture2.files[0]);
    }
}

function clamp(num, min, max) {
    return num <= min
      ? min
      : num >= max
        ? max
        : num
}

function hsv2rgb(h,s,v)
{
  let f= (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0);
  return [f(5),f(3),f(1)];
}

class Tetrahedron {
    constructor(canvasId) {
        this.app = WebGLApp;
        this.app = new WebGLApp(canvasId);
        this.gl = this.app.getGL();
        this.translationMatrix = mat4.create();
        this.initProgram();
        this.initVBO();
        this.initCamera();
        this.gl.enable(this.gl.DEPTH_TEST);
    }
    initProgram() {
        const vertexShader = `#version 300 es
        in vec3 position;
        in vec3 color;
        out vec3 v_color;
        uniform mat4 u_modelViewProjectionMatrix;
        void main() {
            vec4 pos = u_modelViewProjectionMatrix * vec4(position, 1.0);
            gl_Position = pos;
            v_color = color;
        }
        `;
        const fragmentShader = `#version 300 es
        precision lowp float;
        in vec3 v_color;
        out vec4 color;
        void main() {
            color = vec4(v_color, 1.0);
        }
        `;
        let program = this.app.createProgram(vertexShader, fragmentShader);
        this.program = program;
        this.gl.useProgram(program);
    }
        /**
     * Initialize the camera and update the uniform.
     */
    initCamera() {
        const projectionMatrix = mat4.create();
        const viewMatrix = mat4.create();
        const modelMatrix = mat4.create();

        // Projection: Perspective projection
        mat4.perspective(projectionMatrix, Math.PI / 4, this.gl.canvas.width / this.gl.canvas.height, 0.1, 100.0);

        // View: Camera at (0, 0, 5) looking at origin
        mat4.lookAt(viewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);

        // Model: Rotate the tetrahedron
        mat4.rotateY(modelMatrix, modelMatrix, Math.PI + Math.PI / 4);
        mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 4);

        mat4.multiply(modelMatrix, this.translationMatrix, modelMatrix);

        // Combine all matrices
        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
        mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);

        const mvpLocation = this.gl.getUniformLocation(this.program, "u_modelViewProjectionMatrix");
        this.gl.uniformMatrix4fv(mvpLocation, false, modelViewProjectionMatrix);
    }
    /**
     * Initialize the camera and update the uniform.
     */
    initVBO() {
        const vertexData = new Float32Array([
            // Triangle 1
            0.0, 0.8, 0.0, 1.0, 0.0, 0.0,       // Top
            -0.8, -0.8, -0.8, 0.0, 1.0, 0.0,    // Bottom left-back
            0.8, -0.8, -0.8, 0.0, 0.0, 1.0,     // Bottom right-back
            // Triangle 2
            0.0, 0.8, 0.0, 1.0, 0.0, 0.0,       // Top
            -0.8, -0.8, -0.8, 0.0, 1.0, 0.0,    // Bottom left-back
            0.0, -0.8, 0.8, 1.0, 1.0, 0.0,      // Bottom front-center
            // Triangle 3
            0.0, 0.8, 0.0, 1.0, 0.0, 0.0,       // Top
            0.8, -0.8, -0.8, 0.0, 0.0, 1.0,     // Bottom right-back
            0.0, -0.8, 0.8, 1.0, 1.0, 0.0,      // Bottom front-center
            // Triangle 4
            -0.8, -0.8, -0.8, 0.0, 1.0, 0.0,    // Bottom left-back
            0.8, -0.8, -0.8, 0.0, 0.0, 1.0,     // Bottom right-back
            0.0, -0.8, 0.8, 1.0, 1.0, 0.0       // Bottom front-center
        ]);
        const VBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.DYNAMIC_DRAW);
        const positionLocation = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
        const colorLocation = this.gl.getAttribLocation(this.program, "color");
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    }
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.initCamera();
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 12);
    }

    translate(dx, dy, dz) {
        mat4.translate(this.translationMatrix, this.translationMatrix, [dx, dy, dz]);
    }
    mix(value) {

    }
}

class Cube {
    constructor(canvasId) {
        this.app = WebGLApp;
        this.app = new WebGLApp(canvasId);
        this.gl = this.app.getGL();
        this.translationMatrix = mat4.create();
        this.mixParam = 0.5;
        this.initProgram();
        this.initVBO();
        this.initCamera();
        this.gl.enable(this.gl.DEPTH_TEST);
    }
    initProgram() {
        const vertexShader = `#version 300 es
        in vec3 position;
        in vec3 color;
        in vec2 t;

        out vec3 v_color;
        out vec2 tex_coord;
        uniform mat4 u_modelViewProjectionMatrix;

        void main() {
            vec4 pos = u_modelViewProjectionMatrix * vec4(position, 1.0);
            gl_Position = pos;
            v_color = color;
            tex_coord = t;
        }
        `;
        const fragmentShader = `#version 300 es
        precision lowp float;
        in vec3 v_color;
        out vec4 color;

        in vec2 tex_coord;
        uniform sampler2D our_texture;
        uniform float mix_param;

        void main() {
            color = mix(texture(our_texture, tex_coord), vec4(v_color, 1.0f), mix_param);
        }
        `;
        let program = this.app.createProgram(vertexShader, fragmentShader);
        this.program = program;
        this.gl.useProgram(program);
    }
        /**
     * Initialize the camera and update the uniform.
     */
    initCamera() {
        const projectionMatrix = mat4.create();
        const viewMatrix = mat4.create();
        const modelMatrix = mat4.create();
        // Projection: Perspective projection
        mat4.perspective(projectionMatrix, Math.PI / 4, this.gl.canvas.width / this.gl.canvas.height, 0.1, 100.0);
        // View: Camera at (0, 0, 5) looking at origin
        mat4.lookAt(viewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);
        // Model: Rotate the tetrahedron
        mat4.rotateY(modelMatrix, modelMatrix, Math.PI + Math.PI / 4);
        mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 4);
        mat4.multiply(modelMatrix, this.translationMatrix, modelMatrix);
        // Combine all matrices
        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
        mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);
        const mvpLocation = this.gl.getUniformLocation(this.program, "u_modelViewProjectionMatrix");
        this.gl.uniformMatrix4fv(mvpLocation, false, modelViewProjectionMatrix);
    }
    /**
     * Initialize the camera and update the uniform.
     */
    initVBO() {
        const vertexData = new Float32Array([
            // Front face
            -0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            -0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 0.0, 1.0,  // Top-left
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            +0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 1.0, 0.0,  // Bottom-right
            -0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left

            // Back face
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 0.0, 1.0,  // Top-left
            +0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 1.0, 0.0,  // Bottom-right

            // Top face
            -0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 0.0, 1.0,  // Bottom-left
            -0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 0.0, 0.0,  // Top-left
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 0.0,  // Top-right
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 0.0,  // Top-right
            +0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Bottom-right
            -0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 0.0, 1.0,  // Bottom-left

            // Bottom face
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 1.0,  // Top-left
            +0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 1.0, 0.0,  // Bottom-right

            // Right face
            +0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 1.0,  // Top-left
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            +0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 0.0,  // Bottom-right
            +0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left

            // Left face
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            -0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 1.0,  // Top-left
            -0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            -0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 0.0   // Bottom-right
        ]);
        const VBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.DYNAMIC_DRAW);
        const positionLocation = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        const colorLocation = this.gl.getAttribLocation(this.program, "color");
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

        const textureCoordLocation = this.gl.getAttribLocation(this.program, "t");
        this.gl.enableVertexAttribArray(textureCoordLocation);
        this.gl.vertexAttribPointer(textureCoordLocation, 2, this.gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);

        const texture_1 = this.gl.createTexture();

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture_1);

        //this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.gl.texImage2D(
            this.gl.TEXTURE_2D, // Target
            0,                 // Level of detail
            this.gl.RGBA,      // Internal format
            image.width,       // Width of the texture
            image.height,      // Height of the texture
            0,                 // Border (must be 0)
            this.gl.RGBA,      // Format of the pixel data
            this.gl.UNSIGNED_BYTE, // Data type of the pixel data
            image              // Image source
        );

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        const textureLocation = this.gl.getUniformLocation(this.program, "our_texture");
        this.gl.uniform1i(textureLocation, 0);
    }
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.initCamera();

        const mixLocation = this.gl.getUniformLocation(this.program, "mix_param");
        this.gl.uniform1f(mixLocation, this.mixParam);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);
    }
    translate(dx, dy, dz) {
        mat4.translate(this.translationMatrix, this.translationMatrix, [dx, dy, dz]);
    }
    mix(value) {
        this.mixParam = clamp(this.mixParam + value, 0.0, 1.0);
    }
};

class TwoTextureCube {
    constructor(canvasId) {
        this.app = WebGLApp;
        this.app = new WebGLApp(canvasId);
        this.gl = this.app.getGL();
        this.translationMatrix = mat4.create();
        this.mixParam = 0.5;
        this.initProgram();
        this.initVBO();
        this.initCamera();
        this.gl.enable(this.gl.DEPTH_TEST);
    }
    initProgram() {
        const vertexShader = `#version 300 es
        in vec3 position;
        in vec3 color;
        in vec2 t;

        out vec3 v_color;
        out vec2 tex_coord;
        uniform mat4 u_modelViewProjectionMatrix;

        void main() {
            vec4 pos = u_modelViewProjectionMatrix * vec4(position, 1.0);
            gl_Position = pos;
            v_color = color;
            tex_coord = t;
        }
        `;
        const fragmentShader = `#version 300 es
        precision lowp float;
        in vec3 v_color;
        out vec4 color;

        in vec2 tex_coord;
        uniform sampler2D our_texture;
        uniform sampler2D our_texture_2;
        uniform float mix_param;

        void main() {
            color = mix(texture(our_texture, tex_coord), texture(our_texture_2, tex_coord), mix_param);
        }
        `;
        let program = this.app.createProgram(vertexShader, fragmentShader);
        this.program = program;
        this.gl.useProgram(program);
    }
        /**
     * Initialize the camera and update the uniform.
     */
    initCamera() {
        const projectionMatrix = mat4.create();
        const viewMatrix = mat4.create();
        const modelMatrix = mat4.create();
        // Projection: Perspective projection
        mat4.perspective(projectionMatrix, Math.PI / 4, this.gl.canvas.width / this.gl.canvas.height, 0.1, 100.0);
        // View: Camera at (0, 0, 5) looking at origin
        mat4.lookAt(viewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);
        // Model: Rotate the tetrahedron
        mat4.rotateY(modelMatrix, modelMatrix, Math.PI + Math.PI / 4);
        mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 4);
        mat4.multiply(modelMatrix, this.translationMatrix, modelMatrix);
        // Combine all matrices
        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
        mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);
        const mvpLocation = this.gl.getUniformLocation(this.program, "u_modelViewProjectionMatrix");
        this.gl.uniformMatrix4fv(mvpLocation, false, modelViewProjectionMatrix);
    }
    /**
     * Initialize the camera and update the uniform.
     */
    initVBO() {
        const vertexData = new Float32Array([
            // Front face
            -0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            -0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 0.0, 1.0,  // Top-left
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            +0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 1.0, 0.0,  // Bottom-right
            -0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left

            // Back face
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 0.0, 1.0,  // Top-left
            +0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 1.0, 0.0,  // Bottom-right

            // Top face
            -0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 0.0, 1.0,  // Bottom-left
            -0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 0.0, 0.0,  // Top-left
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 0.0,  // Top-right
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 0.0,  // Top-right
            +0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Bottom-right
            -0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 0.0, 1.0,  // Bottom-left

            // Bottom face
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 1.0,  // Top-left
            +0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 1.0, 0.0,  // Bottom-right

            // Right face
            +0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            +0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 1.0,  // Top-left
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            +0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            +0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 0.0,  // Bottom-right
            +0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left

            // Left face
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            -0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, +0.5, 1.0, 0.0, 0.0, 1 - 0.0, 1.0,  // Top-left
            -0.5, +0.5, +0.5, 0.0, 0.0, 1.0, 1 - 1.0, 1.0,  // Top-right
            -0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 1 - 0.0, 0.0,  // Bottom-left
            -0.5, +0.5, -0.5, 0.0, 0.0, 1.0, 1 - 1.0, 0.0   // Bottom-right
        ]);
        const VBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.DYNAMIC_DRAW);
        const positionLocation = this.gl.getAttribLocation(this.program, "position");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        const colorLocation = this.gl.getAttribLocation(this.program, "color");
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

        const textureCoordLocation = this.gl.getAttribLocation(this.program, "t");
        this.gl.enableVertexAttribArray(textureCoordLocation);
        this.gl.vertexAttribPointer(textureCoordLocation, 2, this.gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);

        const texture_1 = this.gl.createTexture();
        const texture_2 = this.gl.createTexture();

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture_1);

        //this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)

        this.gl.texImage2D(
            this.gl.TEXTURE_2D, // Target
            0,                 // Level of detail
            this.gl.RGBA,      // Internal format
            image.width,       // Width of the texture
            image.height,      // Height of the texture
            0,                 // Border (must be 0)
            this.gl.RGBA,      // Format of the pixel data
            this.gl.UNSIGNED_BYTE, // Data type of the pixel data
            image              // Image source
        );

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture_2);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.gl.texImage2D(
            this.gl.TEXTURE_2D, // Target
            0,                 // Level of detail
            this.gl.RGBA,      // Internal format
            image.width,       // Width of the texture
            image.height,      // Height of the texture
            0,                 // Border (must be 0)
            this.gl.RGBA,      // Format of the pixel data
            this.gl.UNSIGNED_BYTE, // Data type of the pixel data
            image2              // Image source
        );

        const textureLocation = this.gl.getUniformLocation(this.program, "our_texture");
        this.gl.uniform1i(textureLocation, 0);

        const texture2Location = this.gl.getUniformLocation(this.program, "our_texture_2");
        this.gl.uniform1i(texture2Location, 1);

    }
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.initCamera();

        const mixLocation = this.gl.getUniformLocation(this.program, "mix_param");
        this.gl.uniform1f(mixLocation, this.mixParam);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 36);
    }
    translate(dx, dy, dz) {
        mat4.translate(this.translationMatrix, this.translationMatrix, [dx, dy, dz]);
    }
    mix(value) {
        this.mixParam = clamp(this.mixParam + value, 0.0, 1.0);
    }
};


class Circle {
    constructor(canvasId) {
        this.app = WebGLApp;
        this.app = new WebGLApp(canvasId);
        this.gl = this.app.getGL();
        this.translationMatrix = mat4.create();
        this.ab = [1, 1];
        this.initProgram();
        this.initVBO();
        this.initCamera();
        this.gl.enable(this.gl.DEPTH_TEST);
    }
    initProgram() {
        const vertexShader = `#version 300 es
        in float t;
        in vec3 color;
        out vec3 v_color;

        uniform vec2 ab;
        uniform mat4 u_modelViewProjectionMatrix;
        void main() {
            vec2 scale = vec2(step(0.0, t));
            vec2 ellipsoid_pos = scale * ab * vec2(sin(t), cos(t));
            gl_Position = u_modelViewProjectionMatrix * vec4(ellipsoid_pos, 0.0, 1.0);
            v_color = color;
        }
        `;
        const fragmentShader = `#version 300 es
        precision lowp float;
        in vec3 v_color;
        out vec4 color;
        void main() {
            color = vec4(v_color, 1.0);
        }
        `;
        let program = this.app.createProgram(vertexShader, fragmentShader);
        this.program = program;
        this.gl.useProgram(program);
    }
        /**
     * Initialize the camera and update the uniform.
     */
    initCamera() {
        const projectionMatrix = mat4.create();
        const viewMatrix = mat4.create();
        const modelMatrix = mat4.create();

        // Projection: Perspective projection
        mat4.perspective(projectionMatrix, Math.PI / 4, this.gl.canvas.width / this.gl.canvas.height, 0.1, 100.0);

        // View: Camera at (0, 0, 5) looking at origin
        mat4.lookAt(viewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);

        // Model: Rotate the tetrahedron
        // mat4.rotateY(modelMatrix, modelMatrix, Math.PI + Math.PI / 4);
        // mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 4);

        mat4.multiply(modelMatrix, this.translationMatrix, modelMatrix);

        // Combine all matrices
        const modelViewProjectionMatrix = mat4.create();
        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
        mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);

        const mvpLocation = this.gl.getUniformLocation(this.program, "u_modelViewProjectionMatrix");
        this.gl.uniformMatrix4fv(mvpLocation, false, modelViewProjectionMatrix);
    }
    /**
     * Initialize the camera and update the uniform.
     */
    initVBO() {
        var N = 3000;
        var vertexData = new Float32Array((N + 2) * 4);
        var t = 0;
        var delta = (2 * Math.PI) / N;
        var hue = 0;
        var hue_delta = 360.0 / N;
        vertexData[0] = -1;
        vertexData[1] = 1;
        vertexData[2] = 1;
        vertexData[3] = 1;
        for (var i = 1; i < (N + 1); i++) {
            var color = hsv2rgb(hue, 1, 1);
            vertexData[4*i] = t;
            vertexData[4*i+1] = color[0];
            vertexData[4*i+2] = color[1];
            vertexData[4*i+3] = color[2];
            hue += hue_delta;
            t += delta;
        }

        vertexData[4*N]   = vertexData[4];
        vertexData[4*N+1] = vertexData[4+1];
        vertexData[4*N+2] = vertexData[4+2];
        vertexData[4*N+3] = vertexData[4+3];

        const VBO = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, VBO);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexData, this.gl.DYNAMIC_DRAW);
        const positionLocation = this.gl.getAttribLocation(this.program, "t");
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 1, this.gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
        const colorLocation = this.gl.getAttribLocation(this.program, "color");
        this.gl.enableVertexAttribArray(colorLocation);
        this.gl.vertexAttribPointer(colorLocation, 3, this.gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, Float32Array.BYTES_PER_ELEMENT);
    }
    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.initCamera();

        const ab_location = this.gl.getUniformLocation(this.program, "ab");
        this.gl.uniform2fv(ab_location, this.ab);


        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 3001);
    }

    translate(dx, dy, dz) {
        mat4.translate(this.translationMatrix, this.translationMatrix, [dx, dy, dz]);
    }

    scaleX(value) {
        this.ab[0] += value;
    }

    scaleY(value) {
        this.ab[1] += value;
    }
}

var figure = new Tetrahedron("#gl-canvas");

var selectFigure = document.querySelector('#figure');
selectFigure.addEventListener('change', function() {
    if (selectFigure.options[0].selected === true) {
        figure = new Tetrahedron("#gl-canvas");
    }
    else if (selectFigure.options[1].selected === true) {
        figure = new Cube("#gl-canvas");
    }
    else if (selectFigure.options[2].selected === true) {
        figure = new TwoTextureCube("#gl-canvas");
    }
    else if (selectFigure.options[3].selected === true) {
        figure = new Circle("#gl-canvas");
    }
    figure.render();
});

window.addEventListener('keydown', function (e) {
    switch (e.code) {
        case "ArrowLeft":
            figure.translate(-0.1, 0, 0);
            break;
        case "ArrowRight":
            figure.translate(0.1, 0, 0);
            break;
        case "ArrowUp":
            figure.translate(0, 0.1, 0);
            break;
        case "ArrowDown":
            figure.translate(0, -0.1, 0);
            break;
        case "KeyW":
            figure.translate(0, 0, 0.1);
            break;
        case "KeyS":
            figure.translate(0, 0, -0.1);
            break;
        case "NumpadAdd":
            figure.mix(0.1);
            break;
        case "NumpadSubtract":
            figure.mix(-0.1);
            break;
        case "Numpad8":
            figure.scaleY(0.1);
            break;
        case "Numpad2":
            figure.scaleY(-0.1);
            break;
        case "Numpad6":
            figure.scaleX(0.1);
            break;
        case "Numpad4":
            figure.scaleX(-0.1);
            break;
    }
    figure.render();
});


figure.render();
