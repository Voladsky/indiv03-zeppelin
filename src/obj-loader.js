export function parseOBJ(data) {
    const vertices = [];
    const texCoords = [];
    const faces = [];
    
    const lines = data.split("\n");
    for (let line of lines) {
        line = line.trim();
        const parts = line.split(" ");
        const type = parts[0];

        if (type === "v") {
            vertices.push(parts.slice(1, 4).map(Number));
        } else if (type === "vt") {
            texCoords.push([
                parseFloat(parts[1]),
                1.0 - parseFloat(parts[2])
            ]);
        } else if (type === "f") { // Face
            const face = parts.slice(1).map(v => v.split("/").map(i => parseInt(i) - 1));
            faces.push(face);
        }
    }

    const positions = [];
    const texPositions = [];
    for (let face of faces) {
        for (let vertex of face) {
            positions.push(...vertices[vertex[0]]);
            texPositions.push(...texCoords[vertex[1]]);
        }
    }

    return { positions: new Float32Array(positions), texCoords: new Float32Array(texPositions) };
}
