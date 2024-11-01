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
let bird, pipes, bestScore = 0;
let gameStarted = false;
let isGameOver = false;
let gameFrames = 0;

const GAME_SPEED = 2;
const MIN_PIPE_HEIGHT = 130;
const MAX_PIPE_HEIGHT = 160;
const PIPES_TO_WIN = 10; // Количество труб для победы
let remainingPipes = PIPES_TO_WIN; // Оставшиеся трубы

const imageCache = {};

let background, backgroundStars, floor;
let bgX = 0;
let bgStarsX = 0;
let floorX = 0;

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
    'assets/wall.png',
    'assets/floor.png', 'assets/bg.png', 'assets/bg_stars.png', 'assets/logo.png'
];

loadingScreen.style.display = 'flex';

Promise.all(imageSources.map(loadImage)).then(() => {
    background = imageCache['assets/bg.png'];
    backgroundStars = imageCache['assets/bg_stars.png'];
    floor = imageCache['assets/floor.png'];
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
        this.topTexture = imageCache['assets/wall.png'];
        this.bottomTexture = imageCache['assets/wall.png'];
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

function init() {
    bird = new Bird();
    pipes = [];
    remainingPipes = PIPES_TO_WIN;
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
                remainingPipes--;
                if (remainingPipes <= 0) {
                    gameWin();
                    return;
                }
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

        bgX -= GAME_SPEED * 0.5;
        bgStarsX -= GAME_SPEED * 0.75;
        floorX -= GAME_SPEED;

        // Сброс позиций фона при достижении края
        if (bgX <= -background.width) bgX = 0;
        if (bgStarsX <= -backgroundStars.width) bgStarsX = 0;
        if (floorX <= -floor.width) floorX = 0;
    }
}

function drawBackground(image, x, speed) {
    const aspectRatio = image.width / image.height;
    const scaledHeight = 600;
    const scaledWidth = scaledHeight * aspectRatio;
    
    let currentX = x;
    while (currentX < 400) {
        ctx.drawImage(image, currentX, 0, scaledWidth, scaledHeight);
        currentX += scaledWidth;
    }
    ctx.drawImage(image, x - scaledWidth, 0, scaledWidth, scaledHeight);
}

function draw() {
    if (!background || !backgroundStars || !floor) return;

    // Рисуем основной фон
    drawBackground(background, bgX, GAME_SPEED * 0.5);

    // Рисуем фон со звездами
    drawBackground(backgroundStars, bgStarsX, GAME_SPEED * 0.75);

    // Рисуем трубы
    pipes.forEach(pipe => pipe.draw());

    // Рисуем передний фон (пол)
    drawBackground(floor, floorX, GAME_SPEED);

    // Рисуем птицу
    bird.draw();

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Осталось труб: ${remainingPipes}`, 10, 30);
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
    if (isGameOver) return;

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
    isGameOver = true;
    if (PIPES_TO_WIN - remainingPipes > bestScore) {
        bestScore = PIPES_TO_WIN - remainingPipes;
    }
    showGameOverPopup();
}

function gameWin() {
    gameStarted = false;
    isGameOver = true;
    showGameWinPopup();
}

function showGameOverPopup() {
    currentScoreElement.textContent = `Пройдено труб: ${PIPES_TO_WIN - remainingPipes}`;
    bestScoreElement.textContent = `Лучший результат: ${bestScore} труб`;
    gameOverPopup.classList.remove('hidden');
    canvas.classList.add('blur');
}

function showGameWinPopup() {
    currentScoreElement.textContent = `Поздравляем! Вы прошли все ${PIPES_TO_WIN} труб!`;
    bestScoreElement.textContent = `Лучший результат: ${bestScore} труб`;
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
    isGameOver = false;
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