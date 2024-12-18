import { mat4, vec3, glMatrix } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm";

export class Camera {
    constructor(position = [0.0, 0.0, 0.0], up = [0.0, 1.0, 0.0], yaw = -90.0, pitch = 0.0) {
        // Camera Attributes
        this.position = vec3.clone(position);
        this.front = vec3.fromValues(0.0, 0.0, -1.0);
        this.worldUp = vec3.clone(up);
        this.up = vec3.create();
        this.right = vec3.create();

        // Euler Angles
        this.yaw = yaw;
        this.pitch = pitch;

        // Camera Options
        this.movementSpeed = 2.5;
        this.mouseSensitivity = 0.1;
        this.zoom = 45.0;

        this.updateCameraVectors();
    }

    // Returns the view matrix calculated using Euler angles and the LookAt matrix
    getViewMatrix() {
        let target = vec3.create();
        vec3.add(target, this.position, this.front); // target = position + front
        return mat4.lookAt(mat4.create(), this.position, target, this.up);
    }

    // Processes keyboard input
    processKeyboard(direction, deltaTime) {
        let velocity = this.movementSpeed * deltaTime;
        let movement = vec3.create();

        if (direction === 'FORWARD') vec3.scaleAndAdd(movement, movement, this.front, velocity);
        if (direction === 'BACKWARD') vec3.scaleAndAdd(movement, movement, this.front, -velocity);
        if (direction === 'LEFT') vec3.scaleAndAdd(movement, movement, this.right, -velocity);
        if (direction === 'RIGHT') vec3.scaleAndAdd(movement, movement, this.right, velocity);
        if (direction === 'UP') vec3.scaleAndAdd(movement, movement, this.up, velocity);
        if (direction === 'DOWN') vec3.scaleAndAdd(movement, movement, this.up, -velocity);

        vec3.add(this.position, this.position, movement);

        // Rotation
        const rotationSpeed = 20.0;
        if (direction === 'ROTATE_LEFT') this.yaw -= rotationSpeed * deltaTime;
        if (direction === 'ROTATE_RIGHT') this.yaw += rotationSpeed * deltaTime;

        this.updateCameraVectors();
    }

    // Processes mouse movement input
    processMouseMovement(xoffset, yoffset, constrainPitch = true) {
        xoffset *= this.mouseSensitivity;
        yoffset *= this.mouseSensitivity;

        this.yaw += xoffset;
        this.pitch += yoffset;

        // Constrain pitch to avoid screen flipping
        if (constrainPitch) {
            this.pitch = Math.min(Math.max(this.pitch, -89.0), 89.0);
        }

        this.updateCameraVectors();
    }

    // Processes mouse scroll input
    processMouseScroll(yoffset) {
        this.zoom -= yoffset;
        this.zoom = Math.min(Math.max(this.zoom, 1.0), 45.0);
    }

    // Updates the camera's Front, Right, and Up vectors using Euler Angles
    updateCameraVectors() {
        const front = vec3.create();
        front[0] = Math.cos(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
        front[1] = Math.sin(glMatrix.toRadian(this.pitch));
        front[2] = Math.sin(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch));
        vec3.normalize(this.front, front);

        // Recalculate Right and Up vectors
        vec3.cross(this.right, this.front, this.worldUp);
        vec3.normalize(this.right, this.right);

        vec3.cross(this.up, this.right, this.front);
        vec3.normalize(this.up, this.up);
    }
}
