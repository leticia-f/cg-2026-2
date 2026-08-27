const canvas = document.getElementById("glCanvas1");
const gl = canvas.getContext("webgl2");

if (!gl) {
	throw new Error("WebGL 2 não é suportado.");
}

// vértices
const verticesCaule = new Float32Array([
	0.0, -0.7,
	0.0, 0.0
]);

function circleVertices(centroX, centroY, radiusX, radiusY) {
	const vertices = [centroX, centroY];
	const sides = 40;

	for (let i = 0; i <= sides; i++) {
		const angle = i * 2 * Math.PI / sides;
		vertices.push(
			centroX + radiusX * Math.cos(angle),
			centroY + radiusY * Math.sin(angle)
		);
	}

	return new Float32Array(vertices);
}

const verticesPetala1 = circleVertices(0.0, 0.4, 0.15, 0.15);
const verticesPetala2 = circleVertices(0.2, 0.25, 0.15, 0.15);
const verticesPetala3 = circleVertices(0.12, 0.0, 0.15, 0.15);
const verticesPetala4 = circleVertices(-0.12, 0.0, 0.15, 0.15);
const verticesPetala5 = circleVertices(-0.2, 0.25, 0.15, 0.15);
const verticesMiolo = circleVertices(0.0, 0.18, 0.22, 0.22);

// buffer
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, verticesCaule, gl.STATIC_DRAW);

// vertex shader
const vertexShaderSource = `#version 300 es
in vec2 aPosition;

void main() {
	gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// fragment shader
const fragmentShaderSourceCaule = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
	outColor = vec4(0.0, 1.0, 0.0, 1.0);
}`;

const fragmentShaderSourcePetalas = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
	outColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

const fragmentShaderSourceMiolo = `#version 300 es
precision mediump float;

out vec4 outColor;

void main() {
	outColor = vec4(1.0, 1.0, 0.0, 1.0);
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
	const fragmentShader = createShader(
		gl.FRAGMENT_SHADER,
		fragmentShaderSource
	);
	const program = gl.createProgram();

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(gl.getProgramInfoLog(program));
	}

	return program;
}

const programCaule = createProgram(fragmentShaderSourceCaule);
const programPetalas = createProgram(fragmentShaderSourcePetalas);
const programMiolo = createProgram(fragmentShaderSourceMiolo);

const positionLocationCaule = gl.getAttribLocation(programCaule, "aPosition");
const positionLocationPetalas = gl.getAttribLocation(programPetalas, "aPosition");
const positionLocationMiolo = gl.getAttribLocation(programMiolo, "aPosition");

// limpar
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// desenhar
function desenhar(vertices, mode, program, positionLocation) {
	gl.useProgram(program);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(mode, 0, vertices.length / 2);
}

desenhar(verticesCaule, gl.LINES, programCaule, positionLocationCaule);
desenhar(verticesPetala1, gl.TRIANGLE_FAN, programPetalas, positionLocationPetalas);
desenhar(verticesPetala2, gl.TRIANGLE_FAN, programPetalas, positionLocationPetalas);
desenhar(verticesPetala3, gl.TRIANGLE_FAN, programPetalas, positionLocationPetalas);
desenhar(verticesPetala4, gl.TRIANGLE_FAN, programPetalas, positionLocationPetalas);
desenhar(verticesPetala5, gl.TRIANGLE_FAN, programPetalas, positionLocationPetalas);
desenhar(verticesMiolo, gl.TRIANGLE_FAN, programMiolo, positionLocationMiolo);