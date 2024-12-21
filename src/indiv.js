import { createProgram } from "./webgl-utils.js";
import { parseOBJWithNormals } from "./obj-loader.js";
import { mat4, vec3, glMatrix } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm";

const distanceScale = 0;

class Camera {
    constructor(target = [0.0, 0.0, 0.0], distance = 4.0, up = [0.0, 1.0, 0.0], yaw = -90.0, pitch = 15.0) {
        this.target = vec3.clone(target);
        this.distance = distance;
        this.position = vec3.create();
        this.worldUp = vec3.clone(up);
        this.front = vec3.fromValues(0.0, 0.0, -1.0);
        this.right = vec3.create();
        this.up = vec3.clone(up);
        this.yaw = yaw;
        this.pitch = pitch;
        this.minPitch = -89;
        this.maxPitch = 89;
        this.updateVectors();
    }

    updateVectors() {
        // Calculate the front vector
        const radYaw = glMatrix.toRadian(this.yaw);
        const radPitch = glMatrix.toRadian(this.pitch);
        this.front[0] = Math.cos(radPitch) * Math.cos(radYaw);
        this.front[1] = Math.sin(radPitch);
        this.front[2] = Math.cos(radPitch) * Math.sin(radYaw);
        vec3.normalize(this.front, this.front);

        // Calculate the right vector
        vec3.cross(this.right, this.front, this.worldUp); // Right = Front × WorldUp
        vec3.normalize(this.right, this.right);

        // Calculate the up vector
        vec3.cross(this.up, this.right, this.front); // Up = Right × Front
        vec3.normalize(this.up, this.up);

        // Update camera position
        this.position[0] = this.target[0] - this.distance * this.front[0];
        this.position[1] = this.target[1] - this.distance * this.front[1];
        this.position[2] = this.target[2] - this.distance * this.front[2];
    }

    getViewMatrix() {
        return mat4.lookAt(mat4.create(), this.position, this.target, this.up);
    }

    processMouseWheel(delta) {
        const zoomSpeed = 0.2; // Zoom speed factor, adjust as needed
        const zoomDirection = delta > 0 ? 1 : -1;

        // Smooth zoom logic
        const zoomAmount = zoomDirection * zoomSpeed;

        // Apply a smooth transition for the camera distance using interpolation
        camera.distance += zoomAmount;

        // Optionally clamp the distance to avoid going too far
        camera.distance = Math.max(2.0, Math.min(camera.distance, 10.0));

        this.updateVectors();
    }

    processMouseMovement(xoffset, yoffset) {
        xoffset *= 0.2; // Mouse sensitivity
        yoffset *= 0.2;


        this.yaw += xoffset;
        this.pitch = Math.min(Math.max(this.pitch + yoffset, this.minPitch), this.maxPitch);;

        if (this.yaw < 0) this.yaw += 360;
        if (this.pitch > 360) this.yaw -= 360;

        this.updateVectors();
    }

    setTarget(newTarget) {
        vec3.copy(this.target, newTarget);
        this.updateVectors();
    }
}



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
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

        // Instance Matrix Buffer
        this.instanceMatrixBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixBuffer);

        for (let i = 0; i < 4; i++) {
            gl.enableVertexAttribArray(3 + i); // Attributes 3, 4, 5, 6
            gl.vertexAttribPointer(3 + i, 4, gl.FLOAT, false, 64, i * 16);
            gl.vertexAttribDivisor(3 + i, 1); // One matrix per instance
        }

        gl.bindVertexArray(null);

        // Load texture
        this.texture = gl.createTexture();
        const image = new Image();
        image.src = textureUrl;
        image.onload = () => {
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
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



    render(models, view, projection, shadingMode, numInstances = 1) {
        /** @type {WebGL2RenderingContext} */
        const gl = this.gl;

        this.updateInstanceMatrices(models);

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uViewMatrix"), false, view);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "uProjectionMatrix"), false, projection);

        // Get uniform locations for light structs
        const pointLightLoc = {
            position: gl.getUniformLocation(this.program, "uPointLight.position"),
            color: gl.getUniformLocation(this.program, "uPointLight.color"),
            intensity: gl.getUniformLocation(this.program, "uPointLight.intensity"),
        };

        const dirLightLoc = {
            direction: gl.getUniformLocation(this.program, "uDirLight.direction"),
            color: gl.getUniformLocation(this.program, "uDirLight.color"),
            intensity: gl.getUniformLocation(this.program, "uDirLight.intensity"),
        };

        // const spotLightLoc = {
        //     position: gl.getUniformLocation(this.program, "uSpotLight.position"),
        //     direction: gl.getUniformLocation(this.program, "uSpotLight.direction"),
        //     color: gl.getUniformLocation(this.program, "uSpotLight.color"),
        //     intensity: gl.getUniformLocation(this.program, "uSpotLight.intensity"),
        //     cutoff: gl.getUniformLocation(this.program, "uSpotLight.cutoff"),
        // };

        // Set values for Point Light
        gl.uniform3fv(pointLightLoc.position, [1.0, 2.0, 3.0]);  // Position
        gl.uniform3fv(pointLightLoc.color, [1.0, 0.8, 0.6]);     // Color
        gl.uniform1f(pointLightLoc.intensity, 1.5);              // Intensity

        // Set values for Directional Light
        gl.uniform3fv(dirLightLoc.direction, [-0.5, -1.0, -0.5]); // Direction
        gl.uniform3fv(dirLightLoc.color, [1.0, 1.0, 1.0]);        // Color
        gl.uniform1f(dirLightLoc.intensity, 0.8);                 // Intensity

        // Set values for Spotlight
        // gl.uniform3fv(spotLightLoc.position, [2.0, 4.0, 2.0]);    // Position
        // gl.uniform3fv(spotLightLoc.direction, [-1.0, -1.0, -1.0]);// Direction
        // gl.uniform3fv(spotLightLoc.color, [1.0, 0.5, 0.2]);       // Color
        // gl.uniform1f(spotLightLoc.intensity, 2.0);                // Intensity
        // gl.uniform1f(spotLightLoc.cutoff, Math.cos(Math.PI / 6)); // Spotlight cutoff (30 degrees)

        gl.uniform1i(gl.getUniformLocation(this.program, "uShadingMode"), shadingMode);

        gl.uniform3fv(gl.getUniformLocation(this.program, "uViewPos"), camera.position);

        gl.bindVertexArray(this.vao);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, this.vertexCount, numInstances);

        gl.bindVertexArray(null);
    }
}

// Define global variables
const camera = new Camera([0, 2, 10]); // Start the camera behind the zeppelin
let lastFrame = 0;

const keys = {};
class Zeppelin {
    constructor(gl, program, objData, textureUrl) {
        this.object = new Object3D(gl, program, objData, textureUrl, 0.02);
        this.position = vec3.fromValues(0, 0, 0);
        this.rotation = vec3.fromValues(0, 0, 0); // [pitch, yaw, roll]
        this.camera_forward = vec3.create();
        this.spotlight_on = true;
        this.camera_transitioning = false;
    }

    update(deltaTime, camera) {
        const moveSpeed = 1.5;
        const rotateSpeed = 0.7;

        if (keys["w"]) vec3.scaleAndAdd(this.position, this.position, [camera.front[0], 0, camera.front[2]], moveSpeed * deltaTime);
        if (keys["s"]) vec3.scaleAndAdd(this.position, this.position, [camera.front[0], 0, camera.front[2]], -moveSpeed * deltaTime);
        if (keys["a"]) vec3.scaleAndAdd(this.position, this.position, [camera.right[0], 0, camera.right[2]], -moveSpeed * deltaTime);
        if (keys["d"]) vec3.scaleAndAdd(this.position, this.position, [camera.right[0], 0, camera.right[2]], moveSpeed * deltaTime);
        if (keys["q"]) vec3.scaleAndAdd(this.position, this.position, [0, camera.up[1], 0], moveSpeed * deltaTime);
        if (keys["e"]) vec3.scaleAndAdd(this.position, this.position, [0, camera.up[1], 0], -moveSpeed * deltaTime);
        this.camera_forward = camera.front;

        if (keys["w"] || keys["s"] || keys["a"] || keys["d"] || keys["q"] || keys["e"]) {
            const forward = vec3.fromValues(camera.front[0], 0, camera.front[2]);
            vec3.normalize(forward, forward);

            const targetYaw = -Math.atan2(forward[2], forward[0]);
            var deltaYaw = targetYaw - this.rotation[1];

            if (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
            if (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;

            if (Math.abs(deltaYaw) >= 1e-2)
                this.rotation[1] += deltaYaw * deltaTime * rotateSpeed;
        }

        const target = vec3.create();
        const delta = vec3.create();
        vec3.copy(target, this.position);
        if (this.spotlight_on) {
            vec3.scaleAndAdd(target, target, camera.front, 4.5);
            vec3.scaleAndAdd(target, target, [camera.front[0], -5.3, 0], 0.1);
            camera.distance = 5.5;
            camera.minPitch = -25;
            camera.maxPitch = 20;
        }
        if (this.camera_transitioning) {
            vec3.lerp(delta, camera.target, target, 0.1 * moveSpeed);
            const vecDiff = vec3.create();
            vec3.subtract(vecDiff, target, delta);
            if (vec3.length(vecDiff) < 0.15) {
                this.camera_transitioning = false;
            }
        }
        else {
            vec3.copy(delta, target);
        }
        // Update the camera's target to follow the zeppelin
        camera.setTarget(delta);
    }

    updateSpotlight(gl, program) {
        const spotLightLoc = {
            position: gl.getUniformLocation(program, "uSpotLight.position"),
            direction: gl.getUniformLocation(program, "uSpotLight.direction"),
            color: gl.getUniformLocation(program, "uSpotLight.color"),
            intensity: gl.getUniformLocation(program, "uSpotLight.intensity"),
            cutoff: gl.getUniformLocation(program, "uSpotLight.cutoff"),
            on: gl.getUniformLocation(program, "uSpotlightOn"),
        };

        // Spotlight position is at the Zeppelin's current position
        const spotlightPosition = this.position.slice();
        vec3.add(spotlightPosition, spotlightPosition, [0, -0.5, 0]);

        const spotlightDirection = this.camera_forward.slice();
        vec3.normalize(spotlightDirection, spotlightDirection);

        gl.uniform3fv(spotLightLoc.position, spotlightPosition);
        gl.uniform3fv(spotLightLoc.direction, spotlightDirection);
        gl.uniform3fv(spotLightLoc.color, [1.0, 0.2, 0.0]);
        gl.uniform1f(spotLightLoc.intensity, this.spotlight_on ? 4 : 0);
        gl.uniform1f(spotLightLoc.cutoff, Math.cos(Math.PI / 12));
    }

    render(viewMatrix, projectionMatrix) {
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, this.position);
        mat4.rotateY(modelMatrix, modelMatrix, Math.PI + this.rotation[1]);
        mat4.rotateZ(modelMatrix, modelMatrix, glMatrix.toRadian(this.rotation[2]));

        this.updateSpotlight(this.object.gl, this.object.program);
        this.object.render(modelMatrix, viewMatrix, projectionMatrix, 0);
    }
}

function updateBlinkingLight(gl, program, position, color, intensity) {
        const blinkLightLoc = {
            position: gl.getUniformLocation(program, "uBlinkingLight.position"),
            color: gl.getUniformLocation(program, "uBlinkingLight.color"),
            intensity: gl.getUniformLocation(program, "uBlinkingLight.intensity"),
        };

        const blinkPosition = position.slice();

        gl.uniform3fv(blinkLightLoc.position, blinkPosition);
        gl.uniform3fv(blinkLightLoc.color, color);
        gl.uniform1f(blinkLightLoc.intensity, intensity);
}


async function main() {
    const canvas = document.getElementById("gl-canvas");
    /** @type {WebGL2RenderingContext} */
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("WebGL2 is not supported.");
        return;
    }

    const vertexShaderSource = `#version 300 es
    layout(location = 0) in vec3 aPosition;
    layout(location = 1) in vec2 aTexCoord;
    layout(location = 2) in vec3 aNormal;
    layout(location = 3) in mat4 aModelMatrix;

    uniform mat4 uViewMatrix, uProjectionMatrix;
    out vec3 vNormal;
    out vec3 vFragPos;
    out vec2 vTexCoord;

    void main() {
        vNormal = mat3(transpose(inverse(aModelMatrix))) * aNormal;
        vFragPos = vec3(aModelMatrix * vec4(aPosition, 1.0));
        vTexCoord = aTexCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * aModelMatrix * vec4(aPosition, 1.0);
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
    uniform Light uBlinkingLight;

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

        vec3 blinkLightDir = normalize(uBlinkingLight.position - vFragPos);
        float diffBlink = max(dot(normal, blinkLightDir), 0.0);
        vec3 blinkLightColor = uBlinkingLight.color * diffBlink * uBlinkingLight.intensity;

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

        if (uShadingMode == 0) {
            resultColor += pointLightColor + dirLightColor + blinkLightColor;
        }
        else if (uShadingMode == 1) {
            float toon = toonShade(normal, lightDir);
            resultColor += uPointLight.color * toon * uPointLight.intensity;
        }
        else if (uShadingMode == 2) {
            resultColor += pointLightColor * 0.5 + dirLightColor * 0.5 + blinkLightColor * 0.5;
        }

        FragColor = vec4(resultColor * texColor.rgb, texColor.a);
    }`;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    const objData = await fetch("../models/zeppelin.obj").then((res) => res.text());
    const textureUrl = "../models/zeppelin.png";

    const zeppelin = new Zeppelin(gl, program, objData, textureUrl);

    function resizeCanvasToDisplaySize(canvas) {
        const displayWidth = canvas.clientWidth * window.devicePixelRatio;
        const displayHeight = canvas.clientHeight * window.devicePixelRatio;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }

    const martianData = await fetch("../models/Martian.obj").then((res) => res.text());
    const martianTexture = "../models/Martian.png";
    const martianObject = new Object3D(gl, program, martianData, martianTexture, 0.1);

    const biplaneData = await fetch("../models/Biplane.obj").then((res) => res.text());
    const biplaneTexture = "../models/Biplane.png";
    const biplaneObject = new Object3D(gl, program, biplaneData, biplaneTexture, 0.08); // Orbit center, radius, speed

    const cloudData = await fetch("../models/Kowalski.obj").then((res) => res.text());
    const cloudTexture = "../images/Kowalski.png";
    const cloudObject = new Object3D(gl, program, cloudData, cloudTexture, 0.1);

    const biplanesSpeeds = [];
    const numBiplanes = 5;
    const orbitCenter = [0, 0, 0];
    const orbitRadius = 3.5;
    const orbitSpeed = 0.3;
    for (var i = 0; i < numBiplanes; i++) {
        biplanesSpeeds.push(Math.random());
    }

    const numClouds = 20;
    const cloudMatrices = new Float32Array(16 * numClouds);
    for (var i = 0; i < numClouds; i++) {
        const cloudMatrix = mat4.create();
        mat4.translate(cloudMatrix, cloudMatrix, [Math.random() * 30 - 15, -Math.random() * 4 + 8, Math.random() * 30 - 15]);
        mat4.rotateX(cloudMatrix, cloudMatrix, Math.random());
        mat4.rotateY(cloudMatrix, cloudMatrix, Math.random());
        mat4.rotateZ(cloudMatrix, cloudMatrix, Math.random());
        cloudMatrices.set(cloudMatrix, i * 16);
    }

    const maxIntensity = 10.0;
    var blinkIntensity = 0.0;


    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    async function render(time) {
        resizeCanvasToDisplaySize(canvas);
        const deltaTime = (time - lastFrame) / 1000.0;
        lastFrame = time;

        if (blinkIntensity > 0) {
            blinkIntensity = blinkIntensity - deltaTime * maxIntensity;
            console.log(blinkIntensity);
        }

        // Clear the screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Update objects
        zeppelin.update(deltaTime, camera);


        // Create matrices
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 100.0);
        const viewMatrix = camera.getViewMatrix();


        // Render zeppelin
        zeppelin.render(viewMatrix, projectionMatrix);

        const martian1Model = mat4.create();
        const martian2Model = mat4.create();
        mat4.translate(martian2Model, martian1Model, [6, 0, 6]);
        mat4.rotateY(martian2Model, martian2Model, -Math.PI / 2);


        const martiansModels = new Float32Array(16 * 2);
        martiansModels.set(martian1Model, 0);
        martiansModels.set(martian2Model, 16);

        const now = Date.now() / 1000;
        const biplaneModels = new Float32Array(16 * numBiplanes);
        for (let i = 0; i < numBiplanes; i++) {
            const angle = Math.PI / 2.0 / numBiplanes + now * orbitSpeed * (biplanesSpeeds[i] * 2 + .5);
            const biplaneMatrix = mat4.create();
            const x = Math.cos(angle) * (orbitRadius + biplanesSpeeds[i] * 3 + .5);
            //const y = Math.cos(angle) * (orbitRadius - biplanesSpeeds[i] * 2);
            const y = Math.cos(angle) * (biplanesSpeeds[i] * 2);
            const z = Math.sin(angle) * (orbitRadius + biplanesSpeeds[i] * 3 + .5);
            mat4.translate(biplaneMatrix, biplaneMatrix, [x, y + -2.5 + biplanesSpeeds[i] * 2, z]);

            mat4.rotateY(biplaneMatrix, biplaneMatrix, -Math.atan2(z, x) + Math.PI / 2);
            mat4.rotateX(biplaneMatrix, biplaneMatrix, -Math.PI / 3);

            biplaneModels.set(biplaneMatrix, i * 16);
        }


        updateBlinkingLight(gl, program, [1.2, -0.215, 0], [0.8, 0.5, 0], blinkIntensity);

        martianObject.render(martiansModels, viewMatrix, projectionMatrix, 0, 2);
        biplaneObject.render(biplaneModels, viewMatrix, projectionMatrix, 0, numBiplanes);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        cloudObject.render(cloudMatrices, viewMatrix, projectionMatrix, 0, numClouds);
        gl.depthMask(true);

        requestAnimationFrame(render);
    }

    // Create the background music audio object
    const soundtrack = new Audio('../audio/music.mp3');
    soundtrack.loop = true;  // Loop the soundtrack
    soundtrack.volume = 0.48; // Set volume (optional)
    soundtrack.play(); // Start playing the soundtrack

    const biplaneSound = new Audio("../audio/plane.mp3");
    biplaneSound.loop = true;
    biplaneSound.volume = 0.35;
    biplaneSound.play();

    const ambient = new Audio("../audio/ambient1.mp3");
    ambient.loop = true;
    ambient.volume = 0.10;
    ambient.play();

    // Define sound effects
    const otherSounds = [
        new Audio('../audio/whistle1.mp3'),
        new Audio('../audio/whistle2.mp3'),
        new Audio('../audio/blast.mp3'),
        new Audio('../audio/gas.mp3'),
        new Audio('../audio/artillery1.mp3'),
        new Audio('../audio/artillery3.mp3'),
        new Audio('../audio/enemy1.mp3'),
        new Audio('../audio/enemy2.mp3'),
        new Audio('../audio/gas2.mp3'),
        new Audio('../audio/retreat.mp3')
    ];

    // Function to play a random sound
    function playRandomSound() {
        const sound = otherSounds[Math.floor(Math.random() * otherSounds.length)];
        sound.volume = 0.20;
        sound.play();
    }

    // Function to generate random intervals
    function startRandomSoundEffects() {
        // Set interval to play random sound at random times between 1 and 5 seconds
        setInterval(() => {
            playRandomSound();
        }, Math.random() * 5000 + 2000); // Random time between 1s and 5s
    }

    // Start playing random sounds
    startRandomSoundEffects();


    // Handle keyboard inputs
    window.addEventListener("keydown", (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() == "l") {
            zeppelin.spotlight_on = !zeppelin.spotlight_on;
            zeppelin.camera_transitioning = true;
        }
    });
    window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

    // Lock pointer and handle mouse movement
    canvas.addEventListener("click", () => canvas.requestPointerLock());
    document.addEventListener("mousemove", (event) => {
        if (document.pointerLockElement === canvas) {
            camera.processMouseMovement(event.movementX, -event.movementY);
        }
    });

    canvas.addEventListener("wheel", (event) => {
        // Normalize wheel delta (Firefox may have different behavior for `deltaY`)
        let delta = event.deltaY;
        camera.processMouseWheel(delta);
        event.preventDefault(); // Prevent the page from scrolling
    });

    requestAnimationFrame(render);

    const artilleryShot = new Audio("../audio/blast.mp3");
    setInterval(() => {
        artilleryShot.volume = Math.max(0, Math.min(Math.random() + 0.5, 1));
        artilleryShot.play();
        blinkIntensity = maxIntensity;
    }, 3000);
}

main();

