(() => { // função pra não dar erro por nome de variável repetido

const canvas = document.getElementById("glCanvas3");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// vértices (funções p usar várias vezes)
function squareVertices(esq, dir, baixo, cima) {
    return new Float32Array([
        esq, cima,
        dir, cima,
        dir, baixo,
        dir, baixo,
        esq, baixo,
        esq, cima
    ]);
}

function circleVertices(centroX, centroY, radius) {
    const vertices = [centroX, centroY];
    const sides = 40;

    for (let i = 0; i <= sides; i++) {
        const angle = i * 2 * Math.PI / sides;
        vertices.push(
            centroX + radius * Math.cos(angle),
            centroY + radius * Math.sin(angle)
        );
    }

    return new Float32Array(vertices);
}

const carroPrincipal = squareVertices(-0.8, 0.8, -0.4, 0.0);
const cabine = squareVertices(-0.8, 0.3, 0.0, 0.5);
const janela = squareVertices(-0.7, 0.2, 0.0, 0.4);
const rodaEsq = circleVertices(-0.5, -0.4, 0.15);
const rodaDir = circleVertices(0.5, -0.4, 0.15);

// 2. BUFFER
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, carroPrincipal, gl.STATIC_DRAW);

// vertex shader
const vertexShaderSource = `#version 300 es
in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// fragment shader
const fragmentShaderSourceVermelho = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

const fragmentShaderSourceAzul = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(0.1, 0.7, 1.0, 1.0);
}`;

const fragmentShaderSourceBranco = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
    outColor = vec4(1.0, 1.0, 1.0, 1.0);
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
function createProgram(fragmentSource) {
    const program = gl.createProgram();
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    return program;
}

const programVermelho = createProgram(fragmentShaderSourceVermelho);
const programAzul = createProgram(fragmentShaderSourceAzul);
const programBranco = createProgram(fragmentShaderSourceBranco);

// local dos atributos
const positionVermelho = gl.getAttribLocation(programVermelho, "aPosition");
const positionAzul = gl.getAttribLocation(programAzul, "aPosition");
const positionBranco = gl.getAttribLocation(programBranco, "aPosition");

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

desenhar(carroPrincipal, gl.TRIANGLES, programVermelho, positionVermelho);
desenhar(cabine, gl.TRIANGLES, programVermelho, positionVermelho);
desenhar(janela, gl.TRIANGLES, programAzul, positionAzul);
desenhar(rodaEsq, gl.TRIANGLE_FAN, programBranco, positionBranco);
desenhar(rodaDir, gl.TRIANGLE_FAN, programBranco, positionBranco);

})();