import {} from 'https://cdn.jsdelivr.net/npm/gl-matrix@2.4.1/dist/gl-matrix.js';
import {WebGLApp} from './lab10.js';

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
}

class Cube {
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
};

function main() {
    let tetrahedron = new Tetrahedron("#gl-canvas");
    window.addEventListener('keydown', function (e) {
        switch (e.code) {
            case "ArrowLeft":
                tetrahedron.translate(-0.1, 0, 0);
                break;
            case "ArrowRight":
                tetrahedron.translate(0.1, 0, 0);
                break;
            case "ArrowUp":
                tetrahedron.translate(0, 0.1, 0);
                break;
            case "ArrowDown":
                tetrahedron.translate(0, -0.1, 0);
                break;
            case "KeyW":
                tetrahedron.translate(0, 0, 0.1);
                break;
            case "KeyS":
                tetrahedron.translate(0, 0, -0.1);
                break;
        }
        tetrahedron.render(); // Re-render after translation
    });

    tetrahedron.render();
}
main();
