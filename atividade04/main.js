const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_viewTransform;
uniform mat3 u_modelTransform;

void main() {

    vec3 position =
        u_viewTransform *
        u_modelTransform *
        vec3(aPosition, 1.0);

    gl_Position =
        vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {

    outColor =
        vec4(uColor, 1.0);
}
`;

function createShader(gl, type, source) {

    const shader =
        gl.createShader(type);

    gl.shaderSource(
        shader,
        source
    );

    gl.compileShader(shader);

    if (
        !gl.getShaderParameter(
            shader,
            gl.COMPILE_STATUS
        )
    ) {

        const error =
            gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}

function createProgram(
    gl,
    vertexShaderSource,
    fragmentShaderSource
) {

    const vertexShader =
        createShader(
            gl,
            gl.VERTEX_SHADER,
            vertexShaderSource
        );

    const fragmentShader =
        createShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        );

    const program =
        gl.createProgram();

    gl.attachShader(
        program,
        vertexShader
    );

    gl.attachShader(
        program,
        fragmentShader
    );

    gl.linkProgram(program);

    if (
        !gl.getProgramParameter(
            program,
            gl.LINK_STATUS
        )
    ) {

        throw new Error(
            gl.getProgramInfoLog(program)
        );
    }

    return program;
}


const program =
    createProgram(
        gl,
        vertexShaderSource,
        fragmentShaderSource
    );


// ==================================================
// CLASSE RENDERER
// ==================================================

class Renderer {

    constructor(gl, program) {
        this.gl = gl;
        this.program = program;

        this.positionLocation =
            gl.getAttribLocation(
                program,
                "aPosition"
            );

        this.colorLocation =
            gl.getUniformLocation(
                program,
                "uColor"
            );

        this.viewTransformLocation =
            gl.getUniformLocation(
                program,
                "u_viewTransform"
            );

        this.modelTransformLocation =
            gl.getUniformLocation(
                program,
                "u_modelTransform"
            );

        this.viewTransform =
            m3.identity();

        this.verticesBuffer =
            gl.createBuffer();
    }

    defineViewTransform(viewTransform) {
        this.viewTransform =
            viewTransform;
    }

    draw(object) {
        const gl = this.gl;

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            this.verticesBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            object.vertices,
            gl.STATIC_DRAW
        );

        gl.enableVertexAttribArray(
            this.positionLocation
        );

        gl.vertexAttribPointer(
            this.positionLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.uniform3fv(
            this.colorLocation,
            object.color
        );

        gl.uniformMatrix3fv(
            this.modelTransformLocation,
            false,
            object.modelTransform
        );

        gl.uniformMatrix3fv(
            this.viewTransformLocation,
            false,
            this.viewTransform
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            object.vertices.length / 2
        );
    }
}

// ==================================================
// AUXILIARY FUNCTIONS
// ==================================================

function rectangleVertices(x,y,width,height){
    return [
        x, y,
        x+width, y+height,
        x, y+height,

        x, y,
        x+width, y,
        x+width, y+height
    ];
}

function circleVertices(radius,numSegments,cx,cy){
    cx = cx || 0; // colocar circulo fora da origem
    cy = cy || 0;

    const vertices = [];

    for (let i = 0; i < numSegments; i++) {
        const theta1 =
            (i / numSegments) *
            2 * Math.PI;

        const theta2 =
            ((i + 1) / numSegments) *
            2 * Math.PI;


        vertices.push(
            cx,
            cy
        );

        vertices.push(
            cx + radius * Math.cos(theta1),
            cy + radius * Math.sin(theta1)
        );


        vertices.push(
            cx + radius * Math.cos(theta2),
            cy + radius * Math.sin(theta2)
        );
    }

    return vertices;
}


// ==================================================
// PARÂMETROS DO ROBÔ
// ==================================================

// tronco
const troncoEspessura = 0.5;
const troncoAltura = 0.6;

// cabeça
const cabecaEspessura = 0.4;
const cabecaAltura = 0.25;
const gapMinCabeca = 0.05;
const cabecaAmplitudeMov = 0.02;
const cabecaVelocidadeMov = 1.0;

// olhos
const olhosRaio = 0.04;
const olhosPosicaoX = 0.08;
const olhosPosicaoY = cabecaAltura * 0.5;

// antena (haste + bolinha)
const hasteAntenaEspessura = 0.02;
const hasteAntenaAltura = 0.07;
const pontaAntenaRaio = 0.04;

// haste que segura a cabeça
const hastePescocoEspessura = 0.02;

// braços
const bracosEspessura = 0.08;
const bracosAltura = 0.4;
const bracosPosicaoY = 0.05;
const bracosAmplitudeMov = 0.04;
const bracosVelocidadeMov = 1.3;

// pernas
const pernasEspessura = 0.09;
const pernasAltura = 0.4;
const pernasDist = 0.16;
const pernasSobreposicao = 0.1;
const pernasAmplitudeMov = 0.3;
const pernasVelocidadeMov = 1.3;

// deslocamento do robô
const roboLimiteMov = 2.0 - troncoEspessura/2 - bracosEspessura - bracosAmplitudeMov;
const roboVelocidadeMov = 0.005;


// ==================================================
// VÉRTICES DAS PARTES DO ROBÔ
// ==================================================

function troncoVertices() {
    const vertices = rectangleVertices(-troncoEspessura/2, -troncoAltura/2, troncoEspessura, troncoAltura);
    return new Float32Array(vertices);
}

function cabecaRetanguloVertices() {
    const vertices = rectangleVertices(-cabecaEspessura/2, 0, cabecaEspessura, cabecaAltura);
    return new Float32Array(vertices);
}

function olhosVertices() {
    const vertices = [];
    vertices.push(...circleVertices(olhosRaio, 12, -olhosPosicaoX, olhosPosicaoY));
    vertices.push(...circleVertices(olhosRaio, 12,  olhosPosicaoX, olhosPosicaoY));
    return new Float32Array(vertices);
}

function hasteAntenaVertices() {
    const vertices = rectangleVertices(-hasteAntenaEspessura/2, cabecaAltura, hasteAntenaEspessura, hasteAntenaAltura);
    return new Float32Array(vertices);
}

function pontaAntenaVertices() {
    const vertices = circleVertices(pontaAntenaRaio, 12, 0, cabecaAltura + hasteAntenaAltura);
    return new Float32Array(vertices);
}

function hastePescocoVertices(gap) {
    const vertices = rectangleVertices(-hastePescocoEspessura/2, troncoAltura/2, hastePescocoEspessura, gap);
    return new Float32Array(vertices);
}

function bracosVertices(side) {
    const vertices = side < 0
         ? rectangleVertices(-bracosEspessura, -bracosAltura/2, bracosEspessura, bracosAltura) // braço esquerdo
         : rectangleVertices(0, -bracosAltura/2, bracosEspessura, bracosAltura); // braço direito
    return new Float32Array(vertices);
}

function pernasVertices() { // quadril na origem p mover da forma necessaria
    const vertices = rectangleVertices(-pernasEspessura/2, -pernasAltura, pernasEspessura, pernasAltura);
    return new Float32Array(vertices);
}


// ==================================================
// CLASSE SCENE OBJECT
// ==================================================

class SceneObject {

    constructor(vertices, color) {

        this.vertices = vertices;

        this.color = color;

        this.modelTransform = m3.identity();
    }

    updateModelTransform(modelTransform) {

        this.modelTransform = modelTransform;
    }
}


// ==================================================
// PARTES DO ROBÔ
// ==================================================

class Tronco extends SceneObject {

    constructor() {

        super(
            troncoVertices(),

            new Float32Array([
                0.85,
                0.85,
                0.85
            ])
        );
    }
}

class CabecaRetangulo extends SceneObject {

    constructor() {

        super(
            cabecaRetanguloVertices(),

            new Float32Array([
                0.85,
                0.85,
                0.85
            ])
        );
    }
}

class Olhos extends SceneObject {

    constructor() {

        super(
            olhosVertices(),

            new Float32Array([
                0.0,
                0.9,
                0.9
            ])
        );
    }
}

class HasteAntena extends SceneObject {

    constructor() {

        super(
            hasteAntenaVertices(),

            new Float32Array([
                0.0,
                0.9,
                0.9
            ])
        );
    }
}

class PontaAntena extends SceneObject {

    constructor() {

        super(
            pontaAntenaVertices(),

            new Float32Array([
                0.85,
                0.85,
                0.85
            ])
        );
    }
}

class HastePescoco extends SceneObject {

    constructor() {

        super(
            hastePescocoVertices(gapMinCabeca),

            new Float32Array([
                0.0,
                0.9,
                0.9
            ])
        );
    }
}

class Bracos extends SceneObject {

    constructor(side) {

        super(
            bracosVertices(side),

            new Float32Array([
                0.65,
                0.65,
                0.65
            ])
        );
    }
}

class Pernas extends SceneObject {

    constructor() {

        super(
            pernasVertices(),

            new Float32Array([
                0.0,
                0.9,
                0.9
            ])
        );
    }
}


// ==================================================
// CLASSE ROBO
// ==================================================

class Robo {

    constructor(tx, ty, speed) {
        this.tx = tx;
        this.ty = ty;
        this.speed = speed;
        this.time = 0.0;

        this.tronco = new Tronco();

        this.cabecaRetangulo = new CabecaRetangulo();
        this.olhos = new Olhos();
        this.hasteAntena = new HasteAntena();
        this.pontaAntena = new PontaAntena();
        this.hastePescoco = new HastePescoco();

        this.bracoEsq = new Bracos(-1);
        this.bracoDir = new Bracos(1);

        this.pernaEsq = new Pernas();
        this.pernaDir = new Pernas();
    }

    move() {

        this.tx += this.speed;

        if (this.tx > roboLimiteMov || this.tx < -roboLimiteMov) {

            this.speed = -this.speed;
        }

        this.time += 0.05;

        const roboTransform = m3.translation(this.tx, this.ty);

        // tronco
        this.tronco.updateModelTransform(roboTransform);

        // cabeça (sobe e desce sem tocar o tronco)
        const gap = gapMinCabeca + cabecaAmplitudeMov * Math.sin(this.time * cabecaVelocidadeMov);

        const cabecaLocalTransform = m3.translation(0, troncoAltura/2 + gap);
        const cabecaTransform = m3.multiply(roboTransform, cabecaLocalTransform);

        this.cabecaRetangulo.updateModelTransform(cabecaTransform);
        this.olhos.updateModelTransform(cabecaTransform);
        this.hasteAntena.updateModelTransform(cabecaTransform);
        this.pontaAntena.updateModelTransform(cabecaTransform);

        this.hastePescoco.vertices = hastePescocoVertices(gap);
        this.hastePescoco.updateModelTransform(roboTransform);

        // braços (abrem e fecham)
        const bracosPosicao = bracosAmplitudeMov * (0.5 + 0.5 * Math.sin(this.time * bracosVelocidadeMov));

        const bracoEsqLocalTransform = m3.translation(-troncoEspessura/2 - bracosPosicao, bracosPosicaoY);
        const bracoDirLocalTransform = m3.translation(troncoEspessura/2 + bracosPosicao, bracosPosicaoY);

        this.bracoEsq.updateModelTransform(m3.multiply(roboTransform, bracoEsqLocalTransform));
        this.bracoDir.updateModelTransform(m3.multiply(roboTransform, bracoDirLocalTransform));

        // pernas (pendulam em direcao oposta)
        const pernasAngulo = pernasAmplitudeMov * Math.sin(this.time * pernasVelocidadeMov);
        const pernasQuadrilY = -troncoAltura/2 + pernasSobreposicao;

        const pernaEsqLocalTransform =
            m3.multiply(
                m3.translation(-pernasDist/2, pernasQuadrilY),
                m3.rotation(pernasAngulo)
            );

        const pernaDirLocalTransform =
            m3.multiply(
                m3.translation(pernasDist/2, pernasQuadrilY),
                m3.rotation(-pernasAngulo)
            );

        this.pernaEsq.updateModelTransform(m3.multiply(roboTransform, pernaEsqLocalTransform));
        this.pernaDir.updateModelTransform(m3.multiply(roboTransform, pernaDirLocalTransform));
    }

    draw(renderer) {

        renderer.draw(this.pernaEsq);
        renderer.draw(this.pernaDir);

        renderer.draw(this.tronco);

        renderer.draw(this.bracoEsq);
        renderer.draw(this.bracoDir);

        renderer.draw(this.hastePescoco);

        renderer.draw(this.cabecaRetangulo);
        renderer.draw(this.olhos);
        renderer.draw(this.hasteAntena);
        renderer.draw(this.pontaAntena);
    }
}


// ==================================================
// CLASSE SCENE
// ==================================================

class Scene {

    constructor(gl, program) {

        this.renderer = new Renderer(gl,program);

        this.viewTransform = m3.setClippingWindow(-2.0,-1.0,2.0,1.0);

        this.renderer.defineViewTransform(this.viewTransform);

        this.robo = new Robo(0.0, 0.0, roboVelocidadeMov);
    }

    update() {

        this.robo.move();
    }

    draw() {

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        this.robo.draw(this.renderer);
    }

    execute() {

        this.update();

        this.draw();

        requestAnimationFrame(() => this.execute());
    }

    init() {

        requestAnimationFrame(() => this.execute());
    }
}


// ==================================================
// CONFIGURAÇÃO INICIAL DO WEBGL
// ==================================================

gl.clearColor(
    0.1,
    0.1,
    0.1,
    1.0
);

gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
);


// ==================================================
// CRIAR CENA
// ==================================================

const scene =
    new Scene(gl,program);


// ==================================================
// INICIAR ANIMAÇÃO
// ==================================================

scene.init();