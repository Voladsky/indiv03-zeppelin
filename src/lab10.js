export class WebGLApp {
    constructor(canvasId) {
        this.canvas = document.querySelector(canvasId);
        if (!this.canvas)
            throw new Error("Canvas element not found!");
        /** @type {WebGL2RenderingContext} */
        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl)
            throw new Error("WebGL2 is not supported!");
    }
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        if (!shader)
            throw new Error("Failed to create shader");
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error(`Failed to compile shader: ${error}`);
        }
        return shader;
    }
    createProgram(vertexShaderSource, fragmentShaderSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = this.gl.createProgram();
        if (!program)
            throw new Error("Failed to create program");
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            this.gl.deleteProgram(program);
            throw new Error(`Failed to link program: ${error}`);
        }
        return program;
    }
    createBuffer(data) {
        const buffer = this.gl.createBuffer();
        if (!buffer)
            throw new Error("Failed to create buffer");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
        return buffer;
    }
    configureAttribute(program, name, size, type, stride, offset) {
        const location = this.gl.getAttribLocation(program, name);
        if (location === -1)
            throw new Error(`Failed to get attribute location for '${name}'`);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, type, false, stride, offset);
    }
    clearCanvas(color = [0.0, 0.0, 0.0, 1.0]) {
        this.gl.clearColor(...color);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    drawArrays(mode, count) {
        this.gl.drawArrays(mode, 0, count);
    }
    getGL() {
        return this.gl;
    }
}
function main() {
    const app = new WebGLApp("#gl-canvas");
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
      color = vec4(0, 1, 0, 1);
    }
    `;
    const program = app.createProgram(vertexShaderString, fragmentShaderString);
    app.getGL().useProgram(program);
    const triangle = new Float32Array([
        -1.0, -1.0,
        0.0, 1.0,
        1.0, -1.0,
    ]);
    const buffer = app.createBuffer(triangle);
    app.configureAttribute(program, "coord", 2, app.getGL().FLOAT, 0, 0);
    app.clearCanvas();
    app.drawArrays(app.getGL().TRIANGLES, 3);
}
main();
