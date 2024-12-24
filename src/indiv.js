import { createProgram } from "./webgl-utils.js";
import { parseOBJWithNormals } from "./obj-loader.js";
import { mat4, vec3, glMatrix } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm";

const typesound = new Audio("../audio/typewriter.mp3");
let loading_music = new Audio("../audio/loading1.ogg");
let loading2 = new Audio("../audio/loading2.ogg");
const stampSound = new Audio("../audio/stamp.mp3");

await Promise.all([
    typesound, loading_music, loading2, stampSound
]);

let intervalLoading = null;

const loadingTexts = [
    "Поднимаем тревогу...",
    "Эвакуируем население...",
    "Готовим контрудар...",
    "Бежим...",
    "Вводим чрезвычайное положение...",
    "Осознаём, что не одиноки во Вселенной...",
    "Проигрываем в боях с пришельцами..."
];

async function imitateTypewriterEffect(text, element, speed) {
    return new Promise((resolve) => {
        let i = 0;
        let lastTime = 0; // Variable to store the last time update occurred
        typesound.loop = true;
        typesound.volume = 0.20;
        typesound.playbackRate = 1.5;
        typesound.play();

        loading_music.loop = true;
        loading_music.volume = 0.1;
        loading_music.play();

        loading2.loop = true;
        loading2.volume = 0.1;

        function updateText(currentTime) {
            const deltaTime = currentTime - lastTime;

            if (deltaTime >= speed) {
                if (i < text.length) {
                    element.textContent += text[i];
                    i++;
                }
                lastTime = currentTime;
            }

            if (i < text.length) {
                requestAnimationFrame(updateText);
            } else {
                document.getElementById("quote").style.display = "block";
                document.getElementById('loaderAnim').style.display = "block";

                document.querySelector('.loader-text').textContent = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];

                intervalLoading = setInterval(() => {
                    document.querySelector('.loader-text').textContent = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
                }, 2500);
                stampSound.volume = 0.3;
                stampSound.play();
                element.innerHTML += "";
                typesound.pause();
                loading_music.loop = false;
                loading_music.addEventListener("ended", function () {
                    loading_music = loading2;
                    loading_music.play();
                });

                // Resolve the promise after the text has been completely typed
                resolve();
            }
        }

        requestAnimationFrame(updateText);
    });
}

const typingSpeed = 50;
const typeWriter = imitateTypewriterEffect("Никто не поверил бы в последние годы девятнадцатого  столетия,  что  за всем происходящим на Земле  зорко  и  внимательно  следят  существа  более развитые, чем человек, хотя такие же смертные, как и он; что в  то  время, как люди занимались своими делами, их исследовали и изучали,  может  быть, так же тщательно,  как  человек  в  микроскоп  изучает  эфемерных  тварей, кишащих и размножающихся  в  капле  воды.", document.getElementById("typewriter"), typingSpeed);


const artilleryShout = new Audio("../audio/artillery4.mp3");
const artilleryBLAST = new Audio("../audio/blast2.mp3");
const soundtrack = new Audio('../audio/music.ogg');
const biplaneSound = new Audio("../audio/plane.mp3");
const ambient = new Audio("../audio/ambient1.mp3");
const light_sound_off = new Audio("../audio/flashlight_off.wav");
const light_sound_on = new Audio("../audio/flashlight_on.wav");

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
    new Audio('../audio/retreat.mp3'),
    new Audio('../audio/defend1.mp3')
];

class Camera {
    constructor(target = [0.0, 0.0, 0.0], distance = 4.0, up = [0.0, 1.0, 0.0], yaw = -45.0, pitch = -15.0) {
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
        /** @type {WebGL2RenderingContext} */
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

        this.displacementMap = gl.NULL;

        gl.bindVertexArray(null);

        // Load texture
        this.texture = gl.createTexture();
        const image = new Image();
        image.src = textureUrl;
        image.onload = () => {
            gl.activeTexture(gl.TEXTURE0);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.useProgram(this.program);
            gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
        };
    }

    updateInstanceMatrices(matrices) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, matrices, gl.DYNAMIC_DRAW);
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
            attenuation: gl.getUniformLocation(this.program, "uPointLight.attenuation")
        };

        const dirLightLoc = {
            direction: gl.getUniformLocation(this.program, "uDirLight.direction"),
            color: gl.getUniformLocation(this.program, "uDirLight.color"),
            intensity: gl.getUniformLocation(this.program, "uDirLight.intensity"),
        };

        // Set values for Point Light
        gl.uniform3fv(pointLightLoc.position, [1.0, 2.0, 3.0]);  // Position
        gl.uniform3fv(pointLightLoc.color, [1.0, 0.8, 0.6]);     // Color
        gl.uniform1f(pointLightLoc.intensity, 1.5);              // Intensity
        gl.uniform3fv(pointLightLoc.attenuation, [0.1, 0.1, 0.1]); // Attenuation

        // Set values for Directional Light
        gl.uniform3fv(dirLightLoc.direction, [-0.5, -1.0, -0.5]); // Direction
        gl.uniform3fv(dirLightLoc.color, [1.0, 1.0, 1.0]);        // Color
        gl.uniform1f(dirLightLoc.intensity, 0.8);                 // Intensity

        gl.uniform1i(gl.getUniformLocation(this.program, "uShadingMode"), shadingMode);
        gl.uniform1f(gl.getUniformLocation(this.program, "uShininess"), 32.0);

        gl.uniform3fv(gl.getUniformLocation(this.program, "uViewPos"), camera.position);

        gl.bindVertexArray(this.vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.displacementMap);

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
        this.spotlight_on = false;
        this.camera_transitioning = false;
        this.propeller = new Audio("../audio/propeller.mp3");
        this.propeller.loop = true;
        this.propeller.volume = 0.0;
        this.propeller.play();
    }

    update(deltaTime, camera) {
        const moveSpeed = 1.5;
        const rotateSpeed = 0.7;

        if (keys["KeyW"]) vec3.scaleAndAdd(this.position, this.position, [camera.front[0], 0, camera.front[2]], moveSpeed * deltaTime);
        if (keys["KeyS"]) vec3.scaleAndAdd(this.position, this.position, [camera.front[0], 0, camera.front[2]], -moveSpeed * deltaTime);
        if (keys["KeyA"]) vec3.scaleAndAdd(this.position, this.position, [camera.right[0], 0, camera.right[2]], -moveSpeed * deltaTime);
        if (keys["KeyD"]) vec3.scaleAndAdd(this.position, this.position, [camera.right[0], 0, camera.right[2]], moveSpeed * deltaTime);
        if (keys["KeyE"]) vec3.scaleAndAdd(this.position, this.position, [0, camera.up[1], 0], moveSpeed * deltaTime);
        if (keys["KeyQ"]) vec3.scaleAndAdd(this.position, this.position, [0, camera.up[1], 0], -moveSpeed * deltaTime);
        this.camera_forward = camera.front;

        if (keys["KeyW"] || keys["KeyS"] || keys["KeyA"] || keys["KeyD"] || keys["KeyE"] || keys["KeyQ"]) {
            this.propeller.volume = 0.4;
            const forward = vec3.fromValues(camera.front[0], 0, camera.front[2]);
            vec3.normalize(forward, forward);

            const targetYaw = -Math.atan2(forward[2], forward[0]);
            var deltaYaw = targetYaw - this.rotation[1];

            if (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
            if (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;

            if (Math.abs(deltaYaw) >= 1e-2)
                this.rotation[1] += deltaYaw * deltaTime * rotateSpeed;
        }
        else {
            this.propeller.volume = 0.0;
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
        gl.useProgram(program);
        const spotLightLoc = {
            position: gl.getUniformLocation(program, "uSpotLight.position"),
            direction: gl.getUniformLocation(program, "uSpotLight.direction"),
            color: gl.getUniformLocation(program, "uSpotLight.color"),
            intensity: gl.getUniformLocation(program, "uSpotLight.intensity"),
            cutoff: gl.getUniformLocation(program, "uSpotLight.cutoff")
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
        attenuation: gl.getUniformLocation(program, "uBlinkingLight.attenuation"),
    };

    const blinkPosition = position.slice();

    gl.uniform3fv(blinkLightLoc.position, blinkPosition);
    gl.uniform3fv(blinkLightLoc.color, color);
    gl.uniform1f(blinkLightLoc.intensity, intensity);
    gl.uniform3fv(blinkLightLoc.attenuation, [5, 5, 5]);
}

function applyDisplacementMap(gl, program, heightMap, object) {
    const displacementMap = gl.createTexture();
    const image = new Image();
    image.src = heightMap;

    image.onload = () => {
        gl.activeTexture(gl.TEXTURE1); // Activate texture unit 1
        gl.bindTexture(gl.TEXTURE_2D, displacementMap);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        const uDisplacementMapLocation = gl.getUniformLocation(program, "uDisplacementMap");
        gl.useProgram(program);
        gl.uniform1i(uDisplacementMapLocation, 1); // Bind to texture unit 1


        object.displacementMap = displacementMap;
    };
}

async function main() {
    const canvas = document.getElementById("gl-canvas");
    const startButton = document.getElementById("startButton");
    const loadingScreen = document.getElementById("loadingScreen");

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
    uniform vec3 uViewPos;

    uniform sampler2D uDisplacementMap; // Displacement map

    out vec3 vNormal;
    out vec3 vFragPos;
    out vec2 vTexCoord;
    out vec3 viewDir;

    void main() {
        float displacementScale = 20.0;
        float displacement = texture(uDisplacementMap, aTexCoord).r * displacementScale;
        vec3 displacedPosition = aPosition + vec3(0, displacement, 0);

        vNormal = normalize(mat3(transpose(inverse(aModelMatrix))) * aNormal);
        vFragPos = vec3(aModelMatrix * vec4(displacedPosition, 1.0));
        vTexCoord = aTexCoord;
        gl_Position = uProjectionMatrix * uViewMatrix * aModelMatrix * vec4(displacedPosition, 1.0);
        viewDir = normalize(uViewPos - vFragPos);
    }`;


    const fragmentShaderSource = `#version 300 es
    precision mediump float;

    in vec3 vNormal;
    in vec3 vFragPos;
    in vec2 vTexCoord;
    in vec3 viewDir;

    // Light properties
    struct Light {
        vec3 position;
        vec3 direction;
        vec3 color;
        float intensity;
        vec3 attenuation;
        float cutoff; // For spotlights
    };

    uniform Light uPointLight;
    uniform Light uDirLight;
    uniform Light uSpotLight;
    uniform Light uBlinkingLight;
    uniform sampler2D uTexture;
    uniform float uShininess;

    // Shading mode
    uniform int uShadingMode;

    // Outputs
    out vec4 FragColor;

    // Dithering parameters
    float dither(vec2 coord, float intensity) {
        // Bayer matrix dithering
        int[4] bayer = int[4](0, 2, 3, 1);
        float threshold = float(bayer[int(mod(coord.x, 2.0) + 2.0 * mod(coord.y, 2.0))]) / 4.0;
        return intensity > threshold ? 1.0 : 0.0;
    }

    vec3 phongShading(vec3 lightDir, vec3 normal, vec3 lightColor, float intensity, float attenuation) {
        vec3 ambient = 0.1 * lightColor;

        float NdotL = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = lightColor * NdotL * intensity;

        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
        vec3 specular = lightColor * spec * intensity;

        return ambient + diffuse * attenuation + specular * attenuation;
    }

    float toonShade(vec3 normal, vec3 lightDir) {
        float intensity = max(dot(normal, lightDir), 0.0);
        if (intensity > 0.9) return 1.0;
        else if (intensity > 0.5) return 0.7;
        else if (intensity > 0.25) return 0.4;
        else return 0.2;
    }

    vec3 spotlightEffect(vec3 lightDir, vec3 normal, vec3 lightColor, float intensity, float cutoff) {
        float theta = dot(lightDir, normalize(-uSpotLight.direction));
        if (theta > cutoff) {
            float diff = max(dot(normal, lightDir), 0.0);
            return lightColor * diff * intensity;
        }
        return vec3(0.0);
    }

    void main() {
        vec3 normal = vNormal;
        vec4 texColor = texture(uTexture, vTexCoord);

        vec3 resultColor = vec3(0.0);

        // Point Light
        vec3 lightDir = normalize(uPointLight.position - vFragPos);
        float len = length(lightDir);
        float diff = max(dot(normal, lightDir), 0.0);
        float attenuation = 1.0 / (1.0 + uPointLight.attenuation.x * len + uPointLight.attenuation.y * len * len + uPointLight.attenuation.z * len * len * len);
        vec3 pointLightColor = uPointLight.color * diff * uPointLight.intensity * attenuation;

        // Blinking Light
        vec3 blinkLightDir = normalize(uBlinkingLight.position - vFragPos);
        float blinkLen = length(blinkLightDir);
        float diffBlink = max(dot(normal, blinkLightDir), 0.0);
        float blinkAttenuation = 1.0 / (1.0 + uBlinkingLight.attenuation.x * blinkLen + uBlinkingLight.attenuation.y * blinkLen * blinkLen + uBlinkingLight.attenuation.z * blinkLen * blinkLen * blinkLen );
        vec3 blinkLightColor = uBlinkingLight.color * diffBlink * uBlinkingLight.intensity * blinkAttenuation;

        // Directional Light
        vec3 dirLightDir = normalize(-uDirLight.direction);
        diff = max(dot(normal, dirLightDir), 0.0);
        vec3 dirLightColor = uDirLight.color * diff * uDirLight.intensity;

        vec3 spotLightDir = normalize(uSpotLight.position - vFragPos);

        if (uShadingMode == 0) {
            resultColor += phongShading(lightDir, normal, uPointLight.color, uPointLight.intensity, attenuation);
            resultColor += phongShading(blinkLightDir, normal, uBlinkingLight.color, uBlinkingLight.intensity, blinkAttenuation);
            resultColor += phongShading(dirLightDir, normal, uDirLight.color, uDirLight.intensity, 1.0);
            vec3 spotlightColor = spotlightEffect(spotLightDir, normal, uSpotLight.color, uSpotLight.intensity, uSpotLight.cutoff);
            resultColor += spotlightColor;
        }
        else if (uShadingMode == 1) {
            float toon = toonShade(normal, lightDir);
            resultColor += uPointLight.color * toon * uPointLight.intensity;
        }

        vec2 screenCoord = gl_FragCoord.xy;
        resultColor *= dither(screenCoord, 0.5);

        FragColor = vec4(resultColor * texColor.rgb, texColor.a);
    }`;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    const [
        objData,
        martianData,
        biplaneData,
        cloudData,
        balloonData,
        terrainData,
        artilleryData
    ] = await Promise.all([
        fetch("../models/zeppelin.obj").then((res) => res.text()),
        fetch("../models/Martian.obj").then((res) => res.text()),
        fetch("../models/Biplane.obj").then((res) => res.text()),
        fetch("../models/Cloud.obj").then((res) => res.text()),
        fetch("../models/Balloon.obj").then((res) => res.text()),
        fetch("../models/Plane.obj").then((res) => res.text()),
        fetch("../models/Artillery.obj").then((res) => res.text())
    ]);

    const textureUrl = "../images/Zeppelin.png";

    const zeppelin = new Zeppelin(gl, program, objData, textureUrl);
    zeppelin.position = [-5, 0, 5];

    function resizeCanvasToDisplaySize(canvas) {
        canvas.style.display = "block";
        const displayWidth = canvas.clientWidth * window.devicePixelRatio;
        const displayHeight = canvas.clientHeight * window.devicePixelRatio;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }


    const martianTexture = "../images/Martian.png";
    const martianObject = new Object3D(gl, program, martianData, martianTexture, 0.1);

    const biplaneTexture = "../models/Biplane.png";
    const biplaneObject = new Object3D(gl, program, biplaneData, biplaneTexture, 0.08); // Orbit center, radius, speed

    const cloudTexture = "../images/Cloud.png";
    const cloudObject = new Object3D(gl, program, cloudData, cloudTexture, 0.002);

    const balloonTexture = "../images/Balloon.png";
    const balloonObject = new Object3D(gl, program, balloonData, balloonTexture, 0.1);


    const terrainTexture = "../images/terrain.png";
    const heightMap = "../images/heightmap2.png";
    const terrainObject = new Object3D(gl, program, terrainData, terrainTexture, 5);

    const artilleryTexture = "../images/Artillery.jpg";
    const artilleryObject = new Object3D(gl, program, artilleryData, artilleryTexture, 0.2);

    const biplanesSpeeds = [];
    const numBiplanes = 8;
    let orbitCenter = [0, 0, 0];
    let orbitRadius = 3.5;
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

    const numBalloons = 10;
    const balloonMatrices = new Float32Array(16 * numBalloons);
    for (var i = 0; i < numBalloons; i++) {
        const balloonMatrix = mat4.create();
        mat4.translate(balloonMatrix, balloonMatrix, [Math.random() * 30 - 15, -Math.random() * 4 + 4, Math.random() * 30 - 15]);
        mat4.rotateY(balloonMatrix, balloonMatrix, Math.random());
        balloonMatrices.set(balloonMatrix, i * 16);
    }

    const maxIntensity = 50.0;
    var blinkIntensity = 0.0;


    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);

    await Promise.all([
        zeppelin, martianObject, biplaneObject, cloudObject, terrainObject, balloonObject, artilleryObject, typeWriter
    ]);

    startButton.style.display = "block";
    clearInterval(intervalLoading);
    document.getElementById("loaderAnim").style.display = "none";

    startButton.addEventListener("click", () => {
        loading_music.pause();
        startButton.style.display = "none";
        document.getElementById("quote").style.display = "none";
        document.getElementById("typewriter").style.display = "none";

        setTimeout(() => {
            const subtitles = document.getElementById("subtitles")
            subtitles.style.display = "block";
            subtitles.textContent += "Берегись!";
            setTimeout(() => {
                subtitles.textContent += " Артиллерия!";
            }, 1100);

            artilleryShout.playbackRate = 1;
            setTimeout(() => {
                artilleryBLAST.volume = 1;
                artilleryBLAST.play();
                loadingScreen.style.display = "none";
                startGameLoop();
            }, 2600);


            artilleryShout.volume = 0.6;
            artilleryShout.play();
        }, 350);
    });

    var blinkPosition = vec3.create();
    var artilleryMatrix = mat4.create();
    mat4.translate(artilleryMatrix, artilleryMatrix, [-7, -3, 0]);
    mat4.rotateY(artilleryMatrix, artilleryMatrix, -Math.PI / 4);
    var blinkColor = [0.8, 0.1, 0];

    function startGameLoop() {
        async function render(time) {
            resizeCanvasToDisplaySize(canvas);
            const deltaTime = (time - lastFrame) / 1000.0;
            lastFrame = time;

            if (blinkIntensity > 0) {
                blinkIntensity = blinkIntensity - deltaTime * maxIntensity;
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
            mat4.translate(martian1Model, martian1Model, [0, 2, 0]);
            mat4.translate(martian2Model, martian1Model, [6, 0, 6]);
            mat4.translate(martian1Model, martian1Model, [-0.2, -0.2, 0]);
            mat4.rotateY(martian2Model, martian2Model, -Math.PI / 2);


            const martiansModels = new Float32Array(16 * 2);
            martiansModels.set(martian1Model, 0);
            martiansModels.set(martian2Model, 16);

            const now = Date.now() / 1000;
            const biplaneModels = new Float32Array(16 * numBiplanes);
            orbitCenter = [0, 0, 0];
            orbitRadius = 1.5;
            var new_orbit = true;
            for (let i = 0; i < numBiplanes; i++) {
                if (i > numBiplanes / 2 && new_orbit) {
                    vec3.add(orbitCenter, orbitCenter, [6 - 0.2, 0 - 0.2, 6]);
                    orbitRadius -= 1;
                    new_orbit = false;
                }
                const angle = Math.PI / 2.0 / numBiplanes + now * orbitSpeed * (biplanesSpeeds[i] * 2 + .5);
                const biplaneMatrix = mat4.create();
                const x = Math.cos(angle) * (orbitRadius + biplanesSpeeds[i] * 3 + 2);
                //const y = Math.cos(angle) * (orbitRadius - biplanesSpeeds[i] * 2);
                const y = Math.cos(angle) * (biplanesSpeeds[i] * 2);
                const z = Math.sin(angle) * (orbitRadius + biplanesSpeeds[i] * 3 + 2);
                mat4.translate(biplaneMatrix, biplaneMatrix, [x, y + -2.5 + biplanesSpeeds[i] * 2, z]);
                mat4.translate(biplaneMatrix, biplaneMatrix, orbitCenter);

                mat4.rotateY(biplaneMatrix, biplaneMatrix, -Math.atan2(z, x) + Math.PI / 2);
                mat4.rotateX(biplaneMatrix, biplaneMatrix, -Math.PI / 3 * Math.abs(1 - Math.sin(angle)));

                biplaneModels.set(biplaneMatrix, i * 16);
            }



            martianObject.render(martiansModels, viewMatrix, projectionMatrix, 0, 2);
            biplaneObject.render(biplaneModels, viewMatrix, projectionMatrix, 0, numBiplanes);

            artilleryObject.render(artilleryMatrix, viewMatrix, projectionMatrix, 0);

            updateBlinkingLight(gl, program, blinkPosition, blinkColor, blinkIntensity);

            applyDisplacementMap(gl, program, heightMap, terrainObject);

            const terrainModel = mat4.create();
            mat4.translate(terrainModel, terrainModel, [0.2, -19, 0]);
            terrainObject.render(terrainModel, viewMatrix, projectionMatrix, 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, null);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            //gl.depthMask(false);
            cloudObject.render(cloudMatrices, viewMatrix, projectionMatrix, 0, numClouds);
            //gl.depthMask(true);

            balloonObject.render(balloonMatrices, viewMatrix, projectionMatrix, 0, numBalloons);

            requestAnimationFrame(render);
        }

        // Create the background music audio object
        soundtrack.loop = true;  // Loop the soundtrack
        soundtrack.volume = 0.4; // Set volume (optional)
        soundtrack.play(); // Start playing the soundtrack

        biplaneSound.loop = true;
        biplaneSound.volume = 0.35;
        biplaneSound.play();

        ambient.loop = true;
        ambient.volume = 0.10;
        ambient.play();

        // Function to play a random sound
        function playRandomSound() {
            const sound = otherSounds[Math.floor(Math.random() * otherSounds.length)];
            sound.volume = 0.15;
            sound.play();
        }

        // Function to generate random intervals
        function startRandomSoundEffects() {
            // Set interval to play random sound at random times between 1 and 5 seconds
            setInterval(() => {
                playRandomSound();
            }, Math.random() * 5000 + 3000); // Random time between 1s and 5s
        }

        // Start playing random sounds
        startRandomSoundEffects();

        // Handle keyboard inputs
        window.addEventListener("keydown", (e) => {
            keys[e.code] = true;
            if (e.code === "KeyL") {
                if (zeppelin.spotlight_on) {
                    light_sound_off.volume = 0.8;
                    light_sound_off.play();
                }
                else {
                    light_sound_on.volume = 0.8;
                    light_sound_on.play();
                }
                zeppelin.spotlight_on = !zeppelin.spotlight_on;
                zeppelin.camera_transitioning = true;
            }
        });
        window.addEventListener("keyup", (e) => (keys[e.code] = false));

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

        const artilleryShot2 = new Audio("../audio/blast2.mp3");
        const artilleryShot1 = new Audio("../audio/blast.mp3");

        setInterval(() => {
            blinkPosition = vec3.create();
            if (Math.random() > 0.7) {
                vec3.transformMat4(blinkPosition, blinkPosition, artilleryMatrix);
                vec3.add(blinkPosition, blinkPosition, [1, 0.3, 0.1]);
                artilleryShot2.volume = 0.3;
                blinkColor = [0.8, 0.5, 0];
                artilleryShot2.play();
                blinkIntensity = maxIntensity + 20;
            }
            else {
                vec3.transformMat4(blinkPosition, blinkPosition, artilleryMatrix);
                vec3.add(blinkPosition, blinkPosition, [1, 0.3, -0.5]);
                artilleryShot1.volume = 0.4;
                blinkColor = [0.8, 0.1, 0];
                artilleryShot1.play();
                blinkIntensity = maxIntensity;
            }
        }, 5000);

        requestAnimationFrame(render);
    }
}
main();

