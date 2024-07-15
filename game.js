// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tutorial = document.getElementById('tutorial');
const gameOverPopup = document.getElementById('gameOverPopup');
const currentScoreElement = document.getElementById('currentScore');
const bestScoreElement = document.getElementById('bestScore');
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');
const loadingScreen = document.getElementById('loadingScreen');

let width, height, scale;
let bird, pipes, score, bestScore = 0;
let gameStarted = false;
let isGameOver = false;
let gameFrames = 0;

const GAME_SPEED = 2;
const MIN_PIPE_HEIGHT = 130;
const MAX_PIPE_HEIGHT = 160;

const imageCache = {};
const frameImages = ['assets/frame1.png', 'assets/frame2.png', 'assets/frame3.png',
'assets/frame4.png', 'assets/frame5.png'];
const windowImages = ['assets/window1.png'];
const innerWindowImages = ['assets/inner1.png', 'assets/inner2.png', 'assets/inner3.png'];
const FRAME_WIDTH = 400;
const FRAME_HEIGHT = 225;
const FRAME_GAP = 300; // Отступ между фреймами
const WINDOW_WIDTH = 400 / 2;
const WINDOW_HEIGHT = 225 / 2;
const INNER_WINDOW_SPEED = 0.025; // Скорость движения внутреннего изображения окна

let background, backgroundWall;
let bgX = 0;
let bgWallX = 0;

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache[src] = img;
            resolve(img);
        };
        img.onerror = reject;
        img.src = src;
    });
}

const imageSources = [
    'assets/bird1.png', 'assets/bird2.png',
    'assets/wall1.png', 'assets/wall2.png', 'assets/wall3.png',
    'assets/wall4.png', 'assets/wall5.png', 'assets/wall6.png',
    'assets/wall7.png',
    'assets/cup1.png', 'assets/cup2.png', 'assets/cup3.png',
    'assets/cup4.png', 'assets/cup5.png', 'assets/cup6.png',
    'assets/cup7.png', 'assets/cup8.png',
    'assets/bg_table.png', 'assets/bg_wall.png', 'assets/logo.png',
    ...frameImages, ...windowImages, ...innerWindowImages
];

loadingScreen.style.display = 'flex';

Promise.all(imageSources.map(loadImage)).then(() => {
    background = imageCache['assets/bg_table.png'];
    backgroundWall = imageCache['assets/bg_wall.png'];
    loadingScreen.style.display = 'none';
    init();
    gameLoop();
}).catch(error => {
    console.error("Failed to load images:", error);
});

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
        this.image1 = imageCache['assets/bird1.png'];
        this.image2 = imageCache['assets/bird2.png'];
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
        this.topTexture = imageCache[`assets/wall${Math.floor(Math.random() * 7) + 1}.png`];
        this.bottomTexture = imageCache[`assets/cup${Math.floor(Math.random() * 8) + 1}.png`];
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        const topAspectRatio = this.topTexture.width / this.topTexture.height;
        const topTextureHeight = this.width / topAspectRatio;
        const topRepeat = Math.ceil(this.top / topTextureHeight);

        for (let i = 0; i < topRepeat; i++) {
            const drawHeight = Math.min(topTextureHeight, this.top - i * topTextureHeight);
            ctx.drawImage(
                this.topTexture,
                0, this.topTexture.height - (drawHeight / topTextureHeight) * this.topTexture.height,
                this.topTexture.width, (drawHeight / topTextureHeight) * this.topTexture.height,
                Math.floor(this.x), i * topTextureHeight, this.width, drawHeight
            );
        }

        const bottomAspectRatio = this.bottomTexture.width / this.bottomTexture.height;
        const bottomTextureHeight = this.width / bottomAspectRatio;
        const bottomRepeat = Math.ceil(this.bottom / bottomTextureHeight);

        for (let i = 0; i < bottomRepeat; i++) {
            const drawHeight = Math.min(bottomTextureHeight, this.bottom - i * bottomTextureHeight);
            ctx.drawImage(
                this.bottomTexture,
                0, 0,
                this.bottomTexture.width, (drawHeight / bottomTextureHeight) * this.bottomTexture.height,
                Math.floor(this.x), 600 - this.bottom + i * bottomTextureHeight, this.width, drawHeight
            );
        }
    }
}

class Frame {
    constructor(x) {
        this.x = x;
        this.image = imageCache[frameImages[Math.floor(Math.random() * frameImages.length)]];
    }

    update() {
        this.x -= GAME_SPEED * 0.5;
    }

    draw() {
        ctx.drawImage(this.image, this.x, 100, FRAME_WIDTH, FRAME_HEIGHT);
    }
}

class Window {
    constructor(x) {
        this.x = x;
        this.image = imageCache[windowImages[Math.floor(Math.random() * windowImages.length)]];
        this.innerImage = imageCache[innerWindowImages[Math.floor(Math.random() * innerWindowImages.length)]];
        this.innerX = 0;
        this.scale = 1; // Увеличиваем внутреннее изображение на 20%
    }

    update() {
        this.x -= GAME_SPEED * 0.5;
        this.innerX -= GAME_SPEED * INNER_WINDOW_SPEED;
        if (this.innerX <= -WINDOW_WIDTH) {
            this.innerX = 0;
        }
    }

    draw() {
        // Рисуем внутреннее изображение окна
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, 100, WINDOW_WIDTH, WINDOW_HEIGHT);
        ctx.clip();
        
        const scaledWidth = WINDOW_WIDTH * this.scale;
        const scaledHeight = WINDOW_HEIGHT * this.scale;
        const offsetX = (WINDOW_WIDTH - scaledWidth) / 20;
        const offsetY = (WINDOW_HEIGHT - scaledHeight) / 20;
        
        ctx.drawImage(
            this.innerImage, 
            this.x + this.innerX + offsetX, 
            100 + offsetY, 
            scaledWidth, 
            scaledHeight
        );
        ctx.drawImage(
            this.innerImage, 
            this.x + this.innerX + WINDOW_WIDTH + offsetX, 
            100 + offsetY, 
            scaledWidth, 
            scaledHeight
        );
        ctx.restore();

        // Рисуем рамку окна
        ctx.drawImage(this.image, this.x, 100, WINDOW_WIDTH, WINDOW_HEIGHT);
    }
}

let frames = [];

function init() {
    bird = new Bird();
    pipes = [];
    frames = [
        Math.random() < 0.5 ? new Frame(0) : new Window(0),
        Math.random() < 0.5 ? new Frame(FRAME_WIDTH + FRAME_GAP) : new Window(FRAME_WIDTH + FRAME_GAP)
    ];
    score = 0;
    gameStarted = false;
    isGameOver = false;
    tutorial.style.display = 'flex';
    hideGameOverPopup();
}

function update() {
    if (gameStarted) {
        bird.update();

        if (gameFrames % 100 === 0) {
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
                gameOver();
                return;
            }
        });

        if (frames[frames.length - 1].x <= 400 - FRAME_WIDTH - FRAME_GAP) {
            frames.push(Math.random() < 0.5 ? new Frame(400) : new Window(400));
        }

        frames.forEach((frame, index) => {
            frame.update();
            if (frame.x + FRAME_WIDTH < 0) {
                frames.splice(index, 1);
            }
        });

        bgX -= GAME_SPEED;
        if (bgX <= -400) {
            bgX = 0;
        }

        bgWallX -= GAME_SPEED * 0.5;
        if (bgWallX <= -400) {
            bgWallX = 0;
        }
    }
}

function draw() {
    if (!background || !backgroundWall) return;

    ctx.drawImage(backgroundWall, bgWallX, 0, 400, 600);
    ctx.drawImage(backgroundWall, bgWallX + 400, 0, 400, 600);

    frames.forEach(frame => frame.draw());

    ctx.drawImage(background, bgX, 0, 400, 600);
    ctx.drawImage(background, bgX + 400, 0, 400, 600);

    pipes.forEach(pipe => pipe.draw());
    bird.draw();

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

function gameLoop() {
    gameFrames++;
    update();
    draw();
    if (gameStarted) {
        requestAnimationFrame(gameLoop);
    }
}

function handleInput() {
    if (isGameOver) return; // Игнорируем ввод, если игра завершена

    if (!gameStarted) {
        gameStarted = true;
        tutorial.style.display = 'none';
        gameLoop();
    }
    if (bird) {
        bird.flap();
    }
}

function gameOver() {
    gameStarted = false;
    isGameOver = true; // У
    if (score > bestScore) {
        bestScore = score;
    }
    showGameOverPopup();
}

function showGameOverPopup() {
    currentScoreElement.textContent = `Текущий результат: ${score}`;
    bestScoreElement.textContent = `Лучший результат: ${bestScore}`;
    gameOverPopup.classList.remove('hidden');
    canvas.classList.add('blur');
}

function hideGameOverPopup() {
    gameOverPopup.classList.add('hidden');
    canvas.classList.remove('blur');
}

function restartGame() {
    hideGameOverPopup();
    init();
    isGameOver = false; // 
    gameStarted = true;
    tutorial.style.display = 'none';
    gameLoop();
}

function exitGame() {
    console.log('Exit button clicked');
}

restartButton.addEventListener('click', restartGame);
exitButton.addEventListener('click', exitGame);

window.addEventListener('resize', resize);
window.addEventListener('keydown', handleInput);
window.addEventListener('touchstart', handleInput);

resize();