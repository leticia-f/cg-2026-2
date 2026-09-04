const canvas = document.getElementById("canvas1");
const gl = canvas.getContext("webgl2");

if (!gl) {
	throw new Error("WebGL 2 não é suportado.");
}

let cliques = 0;
let pt1 = { x: 0, y: 0 };
let pt2 = { x: 0, y: 0 };
let rgb = [0.0, 0.0, 1.0]; // azul

// vértices e cores
let vertices = new Float32Array([]);
let colors = new Float32Array([]);

// buffers
const verticesBuffer = gl.createBuffer();
const colorsBuffer = gl.createBuffer();

// vertex shader
const vertexShaderSource = `#version 300 es
in vec2 aPosition;
in vec3 aColor;
out vec3 vColor;

void main() {
	gl_Position = vec4(aPosition, 0.0, 1.0);
	gl_PointSize = 1.0;
    vColor = aColor;
}`;

// fragment shader
const fragmentShaderSource = `#version 300 es
precision mediump float;

in vec3 vColor;
out vec4 outColor;

void main() {
    outColor = vec4(vColor, 1.0);
}`;

// compilar shaders
function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(gl.getShaderInfoLog(shader));
	}
	return shader;
}

// criar programa
const program = gl.createProgram();
gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShaderSource));
gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource));
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	throw new Error(gl.getProgramInfoLog(program));
}

// local dos atributos
const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getAttribLocation(program, "aColor");

// usar programa
gl.useProgram(program);

// configurar atributos (posição)
gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// configurar atributos (cores)
gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

// canvas -> webgl
function conversaoWebGL(x, y) {
	const webglX = (x / canvas.width) * 2 - 1;
	const webglY = -((y / canvas.height) * 2 - 1);
	return [webglX, webglY];
}

// algoritmo de bresenham
function gerarPixelsBresenham(x1, y1, x2, y2) {
	const pixels = [];
	const dx = Math.abs(x2 - x1),
		dy = Math.abs(y2 - y1);
	const sx = x1 < x2 ? 1 : -1,
		sy = y1 < y2 ? 1 : -1;
	let p = dx - dy,
		x = x1,
		y = y1;

	while (true) {
		pixels.push({ x, y });

		if (x === x2 && y === y2) break;
		const p2 = 2 * p;
		if (p2 > -dy) {
			p -= dy;
			x += sx;
		}
		if (p2 < dx) {
			p += dx;
			y += sy;
		}
	}
	return pixels;
}

// desenhar
function drawScene() {
	gl.clearColor(0.1, 0.1, 0.1, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.useProgram(program);

	gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

	if (vertices.length > 0) {
		gl.drawArrays(gl.POINTS, 0, vertices.length / 2);
	}
}

// interação c mouse
canvas.addEventListener("mousedown", (event) => {
	if (event.button !== 0) {
		return;
	}

	const x = event.offsetX;
	const y = event.offsetY;

	if (cliques === 0) {
		pt1 = { x, y };
		cliques = 1;
	} else {
		pt2 = { x, y };
		cliques = 0;

		const pixels = gerarPixelsBresenham(pt1.x, pt1.y, pt2.x, pt2.y);

		const linePoints = [];
		for (const pixel of pixels) {
			const [webglX, webglY] = conversaoWebGL(pixel.x, pixel.y);
			linePoints.push(webglX, webglY);
		}

		vertices = new Float32Array(linePoints);

		const numVertices = linePoints.length / 2;
		const colorArray = [];
		for (let i = 0; i < numVertices; i++) {
			colorArray.push(...rgb);
		}
		colors = new Float32Array(colorArray);

		drawScene();
	}
});

// interação c teclado
document.addEventListener("keydown", (event) => {
	const keyColors = {
		0: [1.0, 1.0, 1.0], // branco
		1: [1.0, 0.0, 0.0], // vermelho
		2: [0.0, 1.0, 0.0], // verde
		3: [0.0, 0.0, 1.0], // azul
		4: [1.0, 1.0, 0.0], // amarelo
		5: [1.0, 0.0, 1.0], // magenta
		6: [0.0, 1.0, 1.0], // ciano
		7: [1.0, 0.5, 0.0], // laranja
		8: [0.5, 0.0, 1.0], // roxo
		9: [1.0, 0.4, 0.7], // rosa
	};

	if (keyColors[event.key]) {
		rgb = keyColors[event.key];

		if (vertices.length > 0) {
			const numVertices = vertices.length / 2;
			const colorArray = [];
			for (let i = 0; i < numVertices; i++) colorArray.push(...rgb);
			colors = new Float32Array(colorArray);

			drawScene();
		}
	}
});

drawScene();