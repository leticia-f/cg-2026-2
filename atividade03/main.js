const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

const botaoIniciar = document.getElementById("botaoIniciar");
const botaoJogarNovamente = document.getElementById("botaoJogarNovamente");
const msgFimDeJogo = document.getElementById("msgFimDeJogo");

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0); // Center of the circle
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0,
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    0.0, 1.0, 0.0,
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 0.0, 0.0,
]);

// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);

let MbarraDireita = m3.translation(0.9, 0.0);

let MbolaCentro = m3.identity();

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

`;


// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}

`;


// --------------------------------------------------
// COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {

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


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

// --------------------------------------------------
// LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){

    atualizaAnimacao();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    if (estadoJogo !== "fim") { // continua animação enquanto o jogo não tiver terminado
        requestAnimationFrame(drawScene);
    }
}

function drawBarraEsquerda(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length / numComponents
    );

}

function drawBarraDireita(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length / numComponents
    );

}

function drawBolaCentro(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBolaCentro
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length / numComponents
    );

}

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO
// --------------------------------------------------

const raioBola = 0.05;
const metadeAlturaBarra = 0.2;
const metadeLarguraBarra = 0.05;
const limiteBarra = 1.0 - metadeAlturaBarra;
 
const velBarraJogador = 0.01;
const velBolaX = 0.007;
const velBolaY = 0.005;
 
let tyBE = 0.0;
let tyBD = 0.0;
let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.0;
let tyBola_offset = 0.0;
 
let estadoJogo = "aguardando"; // aguardando -> jogando -> fim
 
// --------------------------------------------------
// CONTROLE DO JOGADOR
// --------------------------------------------------
 
let teclaWPressionada = false;
let teclaSPressionada = false;
let teclaSetaCimaPressionada = false;
let teclaSetaBaixoPressionada = false;
 
window.addEventListener("keydown", function(e){
    if (e.code === "KeyW") {
        teclaWPressionada = true;
    }
 
    if (e.code === "KeyS") {
        teclaSPressionada = true;
    }
 
    if (e.code === "ArrowUp") {
        teclaSetaCimaPressionada = true;
        e.preventDefault();
    }
 
    if (e.code === "ArrowDown") {
        teclaSetaBaixoPressionada = true;
        e.preventDefault();
    }
});
 
window.addEventListener("keyup", function(e){
    if (e.code === "KeyW") {
        teclaWPressionada = false;
    }
 
    if (e.code === "KeyS") {
        teclaSPressionada = false;
    }
 
    if (e.code === "ArrowUp") {
        teclaSetaCimaPressionada = false;
    }
 
    if (e.code === "ArrowDown") {
        teclaSetaBaixoPressionada = false;
    }
});
 
// --------------------------------------------------
// COLISÕES
// --------------------------------------------------
 
function colisaoBarra(txBola, tyBola, txBarra, tyBarra){
    return (
        txBola + raioBola > txBarra - metadeLarguraBarra &&
        txBola - raioBola < txBarra + metadeLarguraBarra &&
        tyBola + raioBola > tyBarra - metadeAlturaBarra &&
        tyBola - raioBola < tyBarra + metadeAlturaBarra
    );
}
 
// --------------------------------------------------
// ATUALIZAÇÃO DA ANIMAÇÃO
// --------------------------------------------------
 
function atualizaAnimacao(){
    atualizaBarraEsquerda();
    atualizaBarraDireita();
 
    if (estadoJogo === "jogando") {
        atualizaBola();
    }
}
 
function atualizaBarraEsquerda(){
    if (teclaWPressionada) tyBE += velBarraJogador;
    if (teclaSPressionada) tyBE -= velBarraJogador;
 
    if (tyBE > limiteBarra) tyBE = limiteBarra;
    if (tyBE < -limiteBarra) tyBE = -limiteBarra;
 
    MbarraEsquerda = m3.translation(-0.9, tyBE);
}
 
function atualizaBarraDireita(){
    if (teclaSetaCimaPressionada) tyBD += velBarraJogador;
    if (teclaSetaBaixoPressionada) tyBD -= velBarraJogador;
 
    if (tyBD > limiteBarra) tyBD = limiteBarra;
    if (tyBD < -limiteBarra) tyBD = -limiteBarra;
 
    MbarraDireita = m3.translation(0.9, tyBD);
}
 
function atualizaBola(){
    txBola += txBola_offset;
    tyBola += tyBola_offset;
 
    if (tyBola + raioBola > 1.0 || tyBola - raioBola < -1.0) { // colisão c teto/chão
        tyBola_offset = -tyBola_offset;
    }
 
    if (txBola_offset < 0 && colisaoBarra(txBola, tyBola, -0.9, tyBE)) { // colisão c barra esq (jogador)
        txBola_offset = -txBola_offset;
    }
 
    if (txBola_offset > 0 && colisaoBarra(txBola, tyBola, 0.9, tyBD)) { // colisão c barra dir (adversario)
        txBola_offset = -txBola_offset;
    }
 
    MbolaCentro = m3.translation(txBola, tyBola);
 
    if (txBola - raioBola < -1.0) { // bola passou da barra esq = jogador 1 perdeu
        fimDeJogo(2);
    }
    else if (txBola + raioBola > 1.0) { // bola passou da barra dir = jogador 2 perdeu
        fimDeJogo(1);
    }
}
 
// --------------------------------------------------
// FIM DE JOGO
// --------------------------------------------------
 
function fimDeJogo(jogadorVencedor){
    estadoJogo = "fim";
 
    if (jogadorVencedor === 1) {
        msgFimDeJogo.textContent = "Jogador 1 ganhou!";
        msgFimDeJogo.style.color = "rgb(0, 255, 0)";
    } else {
        msgFimDeJogo.textContent = "Jogador 2 ganhou!";
        msgFimDeJogo.style.color = "rgb(0, 0, 255)";
    }
 
    msgFimDeJogo.style.display = "block";
    botaoJogarNovamente.style.display = "inline-block";
}
 
// --------------------------------------------------
// EVENTOS DOS BOTÕES
// --------------------------------------------------
 
function iniciarJogo(){
    if (estadoJogo !== "aguardando") return;
    estadoJogo = "jogando";
 
    // direção inicial da bola aleatoria
    txBola_offset = (Math.random() < 0.5 ? -1 : 1) * velBolaX;
    tyBola_offset = (Math.random() < 0.5 ? -1 : 1) * velBolaY;
 
    botaoIniciar.style.display = "none";
}
 
function reiniciarJogo(){
    tyBE = 0.0;
    tyBD = 0.0;
 
    MbarraEsquerda = m3.translation(-0.9, tyBE);
    MbarraDireita = m3.translation(0.9, tyBD);
 
    txBola = 0.0;
    tyBola = 0.0;
    txBola_offset = 0.0;
    tyBola_offset = 0.0;
    MbolaCentro = m3.identity();
 
    msgFimDeJogo.style.display = "none";
    botaoJogarNovamente.style.display = "none";
    botaoIniciar.style.display = "inline-block";
 
    estadoJogo = "aguardando";
    drawScene();
}
 
botaoIniciar.addEventListener("click", function(e){
    if (e.button !== 0) return;
    iniciarJogo();
});
 
botaoJogarNovamente.addEventListener("click", function(){
    reiniciarJogo();
});
 
// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------
 
drawScene();