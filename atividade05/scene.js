// ==================================================
// CLASS - SCENE
// ==================================================

class Scene {

    constructor(gl, program) {

        this.renderer =
            new Renderer(gl, program);

        // Figura que será exibida
        this.helicopterBody = new HelicopterBody();

        this.helicopterTopShaft = new HelicopterTopShaft();

        this.helicopterTail = new HelicopterTail();

        this.helicopterPropellers = new HelicopterPropellers();

        this.helicopterTailPropeller = new HelicopterTailPropeller();

        this.theta = 0.0;

        this.velGiroHelices = 0.02;

        this.posicaoX = 0.0;
        this.posicaoY = 0.0;
        this.velMovimento = 0.02;

        this.viradoDireita = false;
        this.anguloDirecao = 0.0;
        this.anguloDirecaoAlvo = 0.0;
        this.velVirada = 0.07;

        this.teclasPressionadas = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };

        this.configurarControlesTeclado();
    }

    configurarControlesTeclado() {
        window.addEventListener("keydown", (event) => {
            if (event.key in this.teclasPressionadas) {
                this.teclasPressionadas[event.key] = true;
                event.preventDefault();
            }
            if (event.key === "ArrowRight") {
                this.viradoDireita = true;
                this.anguloDirecaoAlvo = Math.PI;
            }
            if (event.key === "ArrowLeft") {
                this.viradoDireita = false;
                this.anguloDirecaoAlvo = 0;
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key in this.teclasPressionadas) {
                this.teclasPressionadas[event.key] = false;
                event.preventDefault();
            }
        });
    }

    updPosicao() {
        if (this.teclasPressionadas.ArrowUp) {
            this.posicaoY += this.velMovimento;
        }
        if (this.teclasPressionadas.ArrowDown) {
            this.posicaoY -= this.velMovimento;
        }
        if (this.teclasPressionadas.ArrowLeft) {
            this.posicaoX -= this.velMovimento;
        }
        if (this.teclasPressionadas.ArrowRight) {
            this.posicaoX += this.velMovimento;
        }

        this.posicaoX = Math.min(Math.max(this.posicaoX, -0.6), 0.6);
        this.posicaoY = Math.min(Math.max(this.posicaoY, -0.6), 0.6);
    }

    updDirecao() {
        const diff = this.anguloDirecaoAlvo - this.anguloDirecao;

        if (Math.abs(diff) < this.velVirada) {
            this.anguloDirecao = this.anguloDirecaoAlvo;
        } else {
            this.anguloDirecao += Math.sign(diff) * this.velVirada;
        }
    }

    construirTransform(localTransform) {
        let m = localTransform;

        m = m4.yRotate(m, this.anguloDirecao);
        m = m4.translate(
            m,
            this.posicaoX,
            this.posicaoY,
            0
        );
        
        return m;
    }

    update() {
        const sentidoGiro = this.viradoDireita ? -1 : 1;

        this.theta += this.velGiroHelices * sentidoGiro;

        this.updPosicao();
        this.updDirecao();

        const helicopterTransform = this.construirTransform(m4.identity());

        this.helicopterBody.update(helicopterTransform);
        this.helicopterTopShaft.update(helicopterTransform);
        this.helicopterTail.update(helicopterTransform);

        const helicopterPropellersLocalTransform = m4.yRotation(this.theta);

        this.helicopterPropellers.update(
            this.construirTransform(helicopterPropellersLocalTransform)
        );

        const eixoCaudaX = 0.7;
        const eixoCaudaY = 0.0;
        const eixoCaudaZ = 0.06;

        let helicopterTailPropellerLocalTransform = m4.identity();

        helicopterTailPropellerLocalTransform = m4.translate(
            helicopterTailPropellerLocalTransform,
            -eixoCaudaX,
            -eixoCaudaY,
            -eixoCaudaZ
        );

        helicopterTailPropellerLocalTransform = m4.zRotate(
            helicopterTailPropellerLocalTransform,
            this.theta
        );

        helicopterTailPropellerLocalTransform = m4.translate(
            helicopterTailPropellerLocalTransform,
            eixoCaudaX,
            eixoCaudaY,
            eixoCaudaZ
        );

        this.helicopterTailPropeller.update(
            this.construirTransform(helicopterTailPropellerLocalTransform)
        );
    }

    draw() {

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.useProgram(program);

        this.helicopterBody.draw(
            this.renderer
        );

        this.helicopterTopShaft.draw(
            this.renderer
        );

        this.helicopterTail.draw(
            this.renderer
        );

        this.helicopterPropellers.draw(
            this.renderer
        );

        this.helicopterTailPropeller.draw(
            this.renderer
        );
    }

    execute() {

        this.update();
        this.draw();

        requestAnimationFrame(
            () => this.execute()
        );
    }

    init() {

        requestAnimationFrame(
            () => this.execute()
        );
    }
}