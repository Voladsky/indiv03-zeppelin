namespace lab10 {
  function main() {
    const vertexShaderString: string = `#version 300 es
    in vec2 coord;

    void main() {
      gl_Position = vec4(coord, 0.0, 1.0);
    }
    `;

    const fragmentShaderString: string = `#version 300 es
    precision highp float;

    out vec4 color;

    void main() {
      color = vec4(0, 1, 0, 1);
    }
    `;

    function initShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Failed to create shader");

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Failed to compile shader: ${error}`);
      }

      return shader;
    }

    function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
      const program = gl.createProgram();
      if (!program) throw new Error("Failed to create program");

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

    const canvas = document.querySelector<HTMLCanvasElement>("#gl-canvas")!;
    const gl = canvas.getContext("webgl2")!;
    if (!gl) {
      alert("WebGL2 is not supported!");
      return;
    }

    const vertexShader = initShader(gl, gl.VERTEX_SHADER, vertexShaderString);
    const fragmentShader = initShader(gl, gl.FRAGMENT_SHADER, fragmentShaderString);

    const program = createProgram(gl, vertexShader, fragmentShader);

    const vertexAttributeLocation = gl.getAttribLocation(program, "coord");
    if (vertexAttributeLocation === -1) {
      alert("Failed to get attribute location for 'coord'");
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

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  main();
}
