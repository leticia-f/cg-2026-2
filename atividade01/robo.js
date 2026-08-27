(() => { // função pra não dar erro por nome de variável repetido

const canvas = document.getElementById("glCanvas2");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// vértices (genérico)
function circleVertices(centerX, centerY, radius) {
    const vertices = [centerX, centerY];
    const sides = 40;

    for (let i = 0; i <= sides; i++) {
        const angle = i * 2 * Math.PI / sides;
        vertices.push(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        );
    }

    return new Float32Array(vertices);
}

const orelhaEsq = circleVertices(-0.4, 0.0, 0.2);
const orelhaDir = circleVertices(0.4, 0.0, 0.2);
const haste = new Float32Array([0.0, 0.3, 0.0, 0.5]);
const ponta = circleVertices(0.0, 0.6, 0.1);
const cabeca = new Float32Array([
    -0.45,  0.3,  0.45,  0.3,  0.45, -0.3,
    -0.45, -0.3,  0.45, -0.3, -0.45,  0.3
]);
const olhoEsq = circleVertices(-0.2, 0.0, 0.12);
const olhoDir = circleVertices(0.2, 0.0, 0.12);

// buffer
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, orelhaEsq, gl.STATIC_DRAW);

// vertex shader
const vertexShaderSource = `#version 300 es
in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// fragment shader
const fragmentShaderSourceAzul = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(0.0, 1.0, 1.0, 1.0);
}`;

const fragmentShaderSourceBranco = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;

const fragmentShaderSourcePreto = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
}`;

// compilar shaders
function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
    }

    return shader;
}

const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);

// criar programa
function createProgram(fragmentShaderSource) {
    const program = gl.createProgram();
    const fragmentShader = createShader(
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
    );

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    return program;
}

const programAzul = createProgram(fragmentShaderSourceAzul);
const programBranco = createProgram(fragmentShaderSourceBranco);
const programPreto = createProgram(fragmentShaderSourcePreto);

// local dos atributos
const positionAzul = gl.getAttribLocation(programAzul, "aPosition");
const positionBranco = gl.getAttribLocation(programBranco, "aPosition");
const positionPreto = gl.getAttribLocation(programPreto, "aPosition");

// limpar
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// desenhar
function desenhar(vertices, mode, program, position) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(mode, 0, vertices.length / 2);
}

desenhar(orelhaEsq, gl.TRIANGLE_FAN, programAzul, positionAzul);
desenhar(orelhaDir, gl.TRIANGLE_FAN, programAzul, positionAzul);
desenhar(haste, gl.LINES, programAzul, positionAzul);
desenhar(ponta, gl.TRIANGLE_FAN, programAzul, positionAzul);
desenhar(cabeca, gl.TRIANGLES, programBranco, positionBranco);
desenhar(olhoEsq, gl.TRIANGLE_FAN, programPreto, positionPreto);
desenhar(olhoDir, gl.TRIANGLE_FAN, programPreto, positionPreto);

})();