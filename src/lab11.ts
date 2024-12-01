type Mode = "flat" | "uniform" | "gradient";

export const vertexShaderString = `
    #version 300 es
    in vec2 coord;
    in vec3 vertexColor;
    out vec3 fragColor;
    void main() {
        gl_Position = vec4(coord, 0.0, 1.0);
        fragColor = vertexColor;
    }
`;

const flatFragmentShaderString = `
    #version 300 es
    precision highp float;
    out vec4 color;
    void main() {
        color = vec4(1.0, 0.5, 0.2, 1.0); // Flat color (orange)
    }
`;

const uniformFragmentShaderString = `
    #version 300 es
    precision highp float;
    uniform vec4 uniformColor;
    out vec4 color;
    void main() {
        color = uniformColor; // Color from uniform
    }
`;

const gradientFragmentShaderString = `
    #version 300 es
    precision highp float;
    in vec3 fragColor;
    out vec4 color;
    void main() {
        color = vec4(fragColor, 1.0); // Gradient color
    }
`;

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error("Shader compilation failed");
    }
    return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        throw new Error("Program linking failed");
    }
    return program;
}

function main() {
    const canvas = document.querySelector<HTMLCanvasElement>("#gl-canvas")!;
    const gl = canvas.getContext("webgl2")!;
    if (!gl) throw new Error("WebGL2 not supported");

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderString);

    const programs = {
        flat: createProgram(gl, vertexShader, createShader(gl, gl.FRAGMENT_SHADER, flatFragmentShaderString)),
        uniform: createProgram(gl, vertexShader, createShader(gl, gl.FRAGMENT_SHADER, uniformFragmentShaderString)),
        gradient: createProgram(gl, vertexShader, createShader(gl, gl.FRAGMENT_SHADER, gradientFragmentShaderString)),
    };

    const quadVertices = new Float32Array([
        -0.5, -0.5, 1.0, 0.0, 0.0,
         0.5, -0.5, 0.0, 1.0, 0.0,
         0.5,  0.5, 0.0, 0.0, 1.0,
        -0.5,  0.5, 1.0, 1.0, 0.0,
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    const vbo = gl.createBuffer()!;
    const ebo = gl.createBuffer()!;

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    let currentMode: Mode = "flat";

    (window as any).setMode = (mode: Mode) => {
        currentMode = mode;
        draw();
    };

    function draw() {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const program = programs[currentMode];
        gl.useProgram(program);

        const coordLocation = gl.getAttribLocation(program, "coord");
        const colorLocation = gl.getAttribLocation(program, "vertexColor");

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.vertexAttribPointer(coordLocation, 2, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(coordLocation);

        if (currentMode === "gradient") {
            gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 20, 8);
            gl.enableVertexAttribArray(colorLocation);
        } else {
            gl.disableVertexAttribArray(colorLocation);
        }

        if (currentMode === "uniform") {
            const colorUniform = gl.getUniformLocation(program, "uniformColor")!;
            gl.uniform4f(colorUniform, 0.5, 0.7, 0.2, 1.0); // Greenish color
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    draw();
}
