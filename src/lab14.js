import { createProgram } from "./webgl-utils.js";
import { parseOBJ, parseOBJWithNormals } from "./obj-loader.js";
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm";

export class Object3D {
    constructor(gl, program, objData, textureUrl, scale) {
        this.gl = gl;
        this.program = program;

        const { positions, texCoords, normals } = parseOBJWithNormals(objData);

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

        this.vertexNormalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);

        // Load texture
        this.texture = gl.createTexture();
        const image = new Image();
        image.src = textureUrl;
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
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
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uMatrix"), false, viewMatrix);

        gl.bindVertexArray(this.vao);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, this.vertexCount, instanceCount);

        gl.bindVertexArray(null);
    }

    // render(matrix) {
    //     const gl = this.gl;

    //     gl.useProgram(this.program);
    //     gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uMatrix"), false, matrix);

    //     gl.bindVertexArray(this.vao);
    //     gl.bindTexture(gl.TEXTURE_2D, this.texture);
    //     gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

    //     gl.bindVertexArray(null);
    // }
    render(model, view, projection) {
        const gl = this.gl;

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uModelMatrix"), false, model);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uViewMatrix"), false, view);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uProjectionMatrix"), false, projection);

        gl.bindVertexArray(this.vao);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

        gl.bindVertexArray(null);
    }
}


var camera_position = [0, 0, 5];
var camera_direction = [0, 0, 0];
var cameraMatrix = mat4.create();
mat4.translate(cameraMatrix, cameraMatrix, camera_position); // Initial position

function initCamera(gl) {
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();

    mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    mat4.lookAt(viewMatrix, camera_position, camera_direction, [0, 1, 0]);
    mat4.rotateY(modelMatrix, modelMatrix, Math.PI + Math.PI / 4);
    mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 4);

    const modelViewProjectionMatrix = mat4.create();
    mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);
    mat4.multiply(modelViewProjectionMatrix, modelViewProjectionMatrix, modelMatrix);


    return modelViewProjectionMatrix;
}

function initModelViewProjection(gl) {
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    const modelMatrix = mat4.create();

    mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
    mat4.lookAt(viewMatrix, camera_position, camera_direction, [0, 1, 0]);
    mat4.rotateY(modelMatrix, modelMatrix, Math.PI + Math.PI / 4);
    mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 4);

    return {model: modelMatrix, view: viewMatrix, projection: projectionMatrix};
}

function applyCameraTransformations() {
    mat4.getTranslation(camera_position, cameraMatrix);
    const forward = [0, 0, -1];
    vec3.transformMat4(camera_direction, forward, cameraMatrix);
}

window.addEventListener('keydown', function (e) {
    const translationSpeed = 0.1;
    const rotationSpeed = 0.05;

    switch (e.code) {
        case "KeyW":
            // Move forward
            const forwardVector = vec3.create();
            vec3.set(forwardVector, 0, 0, -translationSpeed);
            mat4.translate(cameraMatrix, cameraMatrix, forwardVector);
            break;
        case "KeyS":
            // Move backward
            const backwardVector = vec3.create();
            vec3.set(backwardVector, 0, 0, translationSpeed);
            mat4.translate(cameraMatrix, cameraMatrix, backwardVector);
            break;
        case "KeyA":
            // Strafe left
            const leftVector = vec3.create();
            vec3.set(leftVector, -translationSpeed, 0, 0);
            mat4.translate(cameraMatrix, cameraMatrix, leftVector);
            break;
        case "KeyD":
            // Strafe right
            const rightVector = vec3.create();
            vec3.set(rightVector, translationSpeed, 0, 0);
            mat4.translate(cameraMatrix, cameraMatrix, rightVector);
            break;
        case "ArrowLeft":
            // Rotate camera left (yaw)
            mat4.rotateY(cameraMatrix, cameraMatrix, rotationSpeed);
            break;
        case "ArrowRight":
            // Rotate camera right (yaw)
            mat4.rotateY(cameraMatrix, cameraMatrix, -rotationSpeed);
            break;
        case "ArrowUp":
            // Rotate camera up (pitch)
            mat4.rotateX(cameraMatrix, cameraMatrix, rotationSpeed);
            break;
        case "ArrowDown":
            // Rotate camera down (pitch)
            mat4.rotateX(cameraMatrix, cameraMatrix, -rotationSpeed);
            break;
    }

    applyCameraTransformations(); // Update position and direction
});

var ratRandoms = [Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5];

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

    const vertexShaderSource = `#version 300 es
    layout(location = 0) in vec3 aPosition;
    layout(location = 1) in vec2 aTexCoord;
    layout(location = 2) in vec3 aNormal;

    uniform mat4 uModelMatrix, uViewMatrix, uProjectionMatrix;
    out vec3 vNormal;
    out vec3 vFragPos;
    out vec2 vTexCoord;

    void main() {
        vNormal = mat3(transpose(inverse(uModelMatrix))) * aNormal;
        vFragPos = vec3(uModelMatrix * vec4(aPosition, 1.0));
        vTexCoord = aTexCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
    }`;


    const fragmentShaderSource = `#version 300 es
    precision mediump float;

    in vec3 vNormal;
    in vec3 vFragPos;
    in vec2 vTexCoord;

    uniform vec3 uViewPos;

    // Light properties
    struct Light {
        vec3 position;
        vec3 direction;
        vec3 color;
        float intensity;
        float cutoff; // For spotlights
    };
    uniform Light uPointLight;
    uniform Light uDirLight;
    uniform Light uSpotLight;

    // Texture samplers
    uniform sampler2D uTexture;

    // Shading mode
    uniform int uShadingMode;

    // Outputs
    out vec4 FragColor;

    float toonShade(vec3 normal, vec3 lightDir) {
        float intensity = max(dot(normal, lightDir), 0.0);
        if (intensity > 0.9) return 1.0;
        else if (intensity > 0.5) return 0.7;
        else if (intensity > 0.25) return 0.4;
        else return 0.2;
    }

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(uViewPos - vFragPos);
        vec4 texColor = texture(uTexture, vTexCoord);

        vec3 resultColor = vec3(0.0);

        // Point Light
        vec3 lightDir = normalize(uPointLight.position - vFragPos);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 pointLightColor = uPointLight.color * diff * uPointLight.intensity;

        // Directional Light
        lightDir = normalize(-uDirLight.direction);
        diff = max(dot(normal, lightDir), 0.0);
        vec3 dirLightColor = uDirLight.color * diff * uDirLight.intensity;

        // Spotlight
        lightDir = normalize(uSpotLight.position - vFragPos);
        float theta = dot(lightDir, normalize(-uSpotLight.direction));
        if (theta > uSpotLight.cutoff) {
            diff = max(dot(normal, lightDir), 0.0);
            vec3 spotLightColor = uSpotLight.color * diff * uSpotLight.intensity;
            resultColor += spotLightColor;
        }

        // Phong Shading (Shading Mode 0)
        if (uShadingMode == 0) {
            resultColor += pointLightColor + dirLightColor;
        }
        // Toon Shading (Shading Mode 1)
        else if (uShadingMode == 1) {
            float toon = toonShade(normal, lightDir);
            resultColor += uPointLight.color * toon * uPointLight.intensity;
        }
        // Cook-Torrance (Shading Mode 2 - simplified example)
        else if (uShadingMode == 2) {
            resultColor += pointLightColor * 0.5 + dirLightColor * 0.5;
        }

        FragColor = vec4(resultColor * texColor.rgb, texColor.a);
    }`;


    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    // Load the cat model
    const catResponse = await fetch("../models/cat.obj");
    const catObjData = await catResponse.text();
    const cat = new Object3D(gl, program, catObjData, "../images/texture.png", 1.5);

    // Load the mouse model
    // const ratResponse = await fetch("../models/rat.obj");
    // const ratObjData = await ratResponse.text();
    // const rat = new Object3D(gl, program, ratObjData, "../images/rat_texture.png", 0.2);

    function render() {
        resizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        const now = Date.now() / 1000;


        // Create 5 transformation matrices for the mice
        //const mvpMatrix = initCamera(gl);

        const {model, view, projection} = initModelViewProjection(gl);

        cat.render(model, view, projection);

        requestAnimationFrame(render);
    }

    render();
})();
