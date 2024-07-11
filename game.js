// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tutorial = document.getElementById('tutorial');
const gameOverPopup = document.getElementById('gameOverPopup');
const currentScoreElement = document.getElementById('currentScore');
const bestScoreElement = document.getElementById('bestScore');
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');

let width, height, scale;
let bird, pipes, score, bestScore = 0;
let gameStarted = false;
let frames = 0;

const GAME_SPEED = 2;
const MIN_PIPE_HEIGHT = 110;
const MAX_PIPE_HEIGHT = 120;

// Кеш для изображений
const imageCache = {};

// Функция для загрузки изображения в кеш
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

// Загрузка всех изображений
const imageSources = [
    'assets/bird1.png', 'assets/bird2.png',
    'assets/wall1.png', 'assets/wall2.png', 'assets/wall3.png',
    'assets/cup1.png', 'assets/cup2.png', 'assets/cup3.png',
    'assets/BG.png', 'assets/BG.png', 'assets/logo.png'
];

let background, backgroundWall;
let bgX = 0;
let bgWallX = 0;

Promise.all(imageSources.map(loadImage)).then(() => {
    background = imageCache['assets/BG.png'];
    backgroundWall = imageCache['assets/BG.png'];
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
        this.topTexture = imageCache[`assets/wall${Math.floor(Math.random() * 3) + 1}.png`];
        this.bottomTexture = imageCache[`assets/cup${Math.floor(Math.random() * 3) + 1}.png`];
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
                Math.floor(this.x), i * topTextureHeight, this.width, drawHeight
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
                Math.floor(this.x), 600 - this.bottom + i * bottomTextureHeight, this.width, drawHeight
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
    hideGameOverPopup();
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
                gameOver();
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

    // Draw backgrounds
    
    ctx.drawImage(backgroundWall, bgWallX, 0, 400, 600);
    ctx.drawImage(backgroundWall, bgWallX + 400, 0, 400, 600);
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
    if (bird) {
        bird.flap();
    }
}

function gameOver() {
    gameStarted = false;
    if (score > bestScore) {
        bestScore = score;
    }
    showGameOverPopup();
}

// Замените функцию showGameOverPopup на следующую
function showGameOverPopup() {
    currentScoreElement.textContent = `Текущий результат: ${score}`;
    bestScoreElement.textContent = `Лучший результат: ${bestScore}`;
    gameOverPopup.classList.remove('hidden');
    canvas.classList.add('blur');
}

// Добавьте эти функции
function hideGameOverPopup() {
    gameOverPopup.classList.add('hidden');
    canvas.classList.remove('blur');
}

function restartGame() {
    hideGameOverPopup();
    init();
    gameStarted = true;
}

function exitGame() {
    // Placeholder for exit functionality
    console.log('Exit button clicked');
}

// Добавьте эти обработчики событий в конец файла
restartButton.addEventListener('click', restartGame);
exitButton.addEventListener('click', exitGame);

window.addEventListener('resize', resize);
window.addEventListener('keydown', handleInput);
window.addEventListener('touchstart', handleInput);

resize();