"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initShader = initShader;
exports.createProgram = createProgram;
exports.main = main;
// Глобальные переменные
let mode = 'flat';
let gl;
let program;
const flatColor = [1.0, 0.0, 0.0, 1.0]; // Красный цвет для flat mode
const uniformColor = [0.0, 0.0, 1.0, 1.0]; // Синий цвет для uniform mode
let vertexCount; // Количество вершин
// Вершинный шейдер
const vertexShaderSource = `#version 300 es
in vec2 coord;
in vec3 vertexColor;
out vec3 fragColor;

void main() {
gl_Position = vec4(coord, 0.0, 1.0);
fragColor = vertexColor; // Передача цвета фрагментному шейдеру
}
`;
// Фрагментный шейдер
const fragmentShaderSource = `#version 300 es
precision highp float;
in vec3 fragColor;
out vec4 color;

uniform vec4 uColor; // Цвет для uniform-заливки
uniform int uMode; // Режим отрисовки

void main() {
if (uMode == 0) {
    color = vec4(fragColor, 1.0); // Градиентный цвет
} else if (uMode == 1) {
    color = uColor; // Uniform-заливка
} else {
    color = vec4(1.0, 0.0, 0.0, 1.0); // Плоский цвет
}
}
`;
// Функция для создания шейдера
function initShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error("Не удалось создать шейдер");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error("Ошибка компиляции шейдера");
}
// Функция для создания программы
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    if (!program) {
        throw new Error("Не удалось создать программу");
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    }
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error("Ошибка линковки программы");
}
// Функция для установки плоского цвета
function setFlatColor() {
    mode = 'flat';
    draw();
}
// Функция для установки uniform-цвета
function setUniformColor() {
    mode = 'uniform';
    draw();
}
// Функция для установки градиента
function setGradient() {
    mode = 'gradient';
    draw();
}
// Функция отрисовки
function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    const uMode = gl.getUniformLocation(program, "uMode");
    gl.uniform1i(uMode, mode === 'gradient' ? 0 : mode === 'uniform' ? 1 : 2);
    if (mode === 'uniform') {
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4fv(uColor, uniformColor);
    }
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}
// Главная функция
function main() {
    const canvas = document.querySelector("#gl-canvas");
    if (!canvas) {
        console.error("Canvas not found");
        return;
    }
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL2 не поддерживается");
        return;
    }
    const vertexShader = initShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = initShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);
    // Создаём массив вершин
    const vertices = new Float32Array([
        // Координаты    // Цвета вершин
        -0.5, -0.5, 1.0, 0.0, 0.0, // Красный
        0.5, -0.5, 0.0, 1.0, 0.0, // Зелёный
        0.0, 0.5, 0.0, 0.0, 1.0 // Синий
    ]);
    vertexCount = vertices.length / 5;
    const VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const coord = gl.getAttribLocation(program, "coord");
    const vertexColor = gl.getAttribLocation(program, "vertexColor");
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(coord);
    gl.vertexAttribPointer(vertexColor, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(vertexColor);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    draw();
}
