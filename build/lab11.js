"use strict";
var lab12;
(function (lab12) {
    function main() {
        const vertexShaderString = `#version 300 es
    in vec2 coord;
    in vec3 vertexColor;
    out vec3 fragColor;

    void main() {
      fragColor = vertexColor;
      gl_Position = vec4(coord, 0.0, 1.0);
    }
    `;
        const fragmentShaderString = `#version 300 es
    precision highp float;
    in vec3 fragColor;
    out vec4 color;

    void main() {
      color = vec4(fragColor, 1.0);
    }
    `;
        const shapes = {
            quad: [-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5],
            fan: [0.0, 0.0, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5],
            pentagon: [
                0.0, 0.5,
                0.47, 0.15,
                0.29, -0.4,
                -0.29, -0.4,
                -0.47, 0.15,
            ],
        };
        const colors = {
            flat: [0.0, 1.0, 0.0],
            gradient: [
                [1.0, 0.0, 0.0],
                [0.0, 1.0, 0.0],
                [0.0, 0.0, 1.0],
                [1.0, 1.0, 0.0],
                [0.0, 1.0, 1.0],
            ],
        };
        function initShader(gl, type, source) {
            const shader = gl.createShader(type);
            if (!shader)
                throw new Error("Failed to create shader");
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                const error = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                throw new Error(`Failed to compile shader: ${error}`);
            }
            return shader;
        }
        function createProgram(gl, vertexShader, fragmentShader) {
            const program = gl.createProgram();
            if (!program)
                throw new Error("Failed to create program");
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                const error = gl.getProgramInfoLog(program);
                gl.deleteProgram(program);
                throw new Error(`Failed to link program: ${error}`);
            }
            return program;
        }
        function render(gl, shape, mode) {
            const program = createProgram(gl, initShader(gl, gl.VERTEX_SHADER, vertexShaderString), initShader(gl, gl.FRAGMENT_SHADER, fragmentShaderString));
            gl.useProgram(program);
            const vertices = shapes[shape];
            const vertexColors = mode === "flat"
                ? Array(vertices.length / 2).fill(colors.flat).flat()
                : colors.gradient.flat();
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            const colorBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
            const coordLocation = gl.getAttribLocation(program, "coord");
            const colorLocation = gl.getAttribLocation(program, "vertexColor");
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(coordLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(coordLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(colorLocation);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);
        }
        const canvas = document.querySelector("#gl-canvas");
        const gl = canvas.getContext("webgl2");
        const shapeSelect = document.getElementById("shape");
        const flatShaderBtn = document.getElementById("flat-shader");
        const gradientBtn = document.getElementById("gradient");
        flatShaderBtn.addEventListener("click", () => render(gl, shapeSelect.value, "flat"));
        gradientBtn.addEventListener("click", () => render(gl, shapeSelect.value, "gradient"));
    }
    main();
})(lab12 || (lab12 = {}));
