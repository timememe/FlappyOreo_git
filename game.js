// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tutorial = document.getElementById('tutorial');

let width, height, scale;
let bird, pipes, score;
let gameStarted = false;
let frames = 0;

const wallTextures = ['wall1', 'wall2', 'wall3', 'wall4', 'wall5', 'wall6', 'wall7'];
const cupTextures = ['cup1', 'cup2', 'cup3', 'cup4', 'cup5', 'cup6', 'cup7', 'cup8',];

const background = new Image();
background.src = 'assets/BG.png';
let bgX = 0;

const GAME_SPEED = 2;
const MIN_PIPE_HEIGHT = 150;
const MAX_PIPE_HEIGHT = 160;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    scale = Math.min(width / 400, height / 600);
    canvas.width = 400 * scale;
    canvas.height = 600 * scale;
    ctx.scale(scale, scale);
}

class Bird {
    constructor() {
        this.x = 50;
        this.y = 300;
        this.velocity = 0;
        this.gravity = 0.25;
        this.lift = -5;
        this.size = 45;
        this.image1 = new Image();
        this.image1.src = 'assets/bird1.png';
        this.image2 = new Image();
        this.image2.src = 'assets/bird2.png';
        this.currentImage = this.image1;
    }

    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;

        if (this.y + this.size > 600) {
            this.y = 600 - this.size;
            this.velocity = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
    }

    flap() {
        this.velocity = this.lift;
        this.currentImage = this.image2;
        setTimeout(() => {
            this.currentImage = this.image1;
        }, 100);
    }

    draw() {
        ctx.drawImage(this.currentImage, this.x, this.y, this.size, this.size);
    }
}

class Pipe {
    constructor() {
        this.top = Math.random() * (MAX_PIPE_HEIGHT - MIN_PIPE_HEIGHT) + MIN_PIPE_HEIGHT;
        this.bottom = 600 - this.top - 150;
        this.x = 400;
        this.width = 50;
        this.speed = GAME_SPEED;
        this.topTexture = new Image();
        this.bottomTexture = new Image();
        this.topTexture.src = `assets/${wallTextures[Math.floor(Math.random() * wallTextures.length)]}.png`;
        this.bottomTexture.src = `assets/${cupTextures[Math.floor(Math.random() * cupTextures.length)]}.png`;
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        // Отрисовка верхней трубы
        const topAspectRatio = this.topTexture.width / this.topTexture.height;
        const topTextureHeight = this.width / topAspectRatio;
        const topRepeat = Math.ceil(this.top / topTextureHeight);

        for (let i = 0; i < topRepeat; i++) {
            const drawHeight = Math.min(topTextureHeight, this.top - i * topTextureHeight);
            ctx.drawImage(
                this.topTexture,
                0, this.topTexture.height - (drawHeight / topTextureHeight) * this.topTexture.height,
                this.topTexture.width, (drawHeight / topTextureHeight) * this.topTexture.height,
                this.x, i * topTextureHeight, this.width, drawHeight
            );
        }

        // Отрисовка нижней трубы
        const bottomAspectRatio = this.bottomTexture.width / this.bottomTexture.height;
        const bottomTextureHeight = this.width / bottomAspectRatio;
        const bottomRepeat = Math.ceil(this.bottom / bottomTextureHeight);

        for (let i = 0; i < bottomRepeat; i++) {
            const drawHeight = Math.min(bottomTextureHeight, this.bottom - i * bottomTextureHeight);
            ctx.drawImage(
                this.bottomTexture,
                0, 0,
                this.bottomTexture.width, (drawHeight / bottomTextureHeight) * this.bottomTexture.height,
                this.x, 600 - this.bottom + i * bottomTextureHeight, this.width, drawHeight
            );
        }
    }
}

function init() {
    bird = new Bird();
    pipes = [];
    score = 0;
    gameStarted = false;
    tutorial.style.display = 'flex';
}

function update() {
    if (gameStarted) {
        bird.update();

        if (frames % 100 === 0) {
            pipes.push(new Pipe());
        }

        pipes.forEach((pipe, index) => {
            pipe.update();

            if (pipe.x + pipe.width < 0) {
                pipes.splice(index, 1);
                score++;
            }

            if (
                bird.x < pipe.x + pipe.width &&
                bird.x + bird.size > pipe.x &&
                (bird.y < pipe.top || bird.y + bird.size > 600 - pipe.bottom)
            ) {
                init();
            }
        });

        bgX -= GAME_SPEED;
        if (bgX <= -400) {
            bgX = 0;
        }
    }
}

function draw() {
    // Draw background
    ctx.drawImage(background, bgX, 0, 400, 600);
    ctx.drawImage(background, bgX + 400, 0, 400, 600);

    pipes.forEach(pipe => pipe.draw());
    bird.draw();

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

function gameLoop() {
    frames++;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function handleInput() {
    if (!gameStarted) {
        gameStarted = true;
        tutorial.style.display = 'none';
    }
    bird.flap();
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', handleInput);
window.addEventListener('touchstart', handleInput);

resize();
init();
gameLoop();