const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerImg = new Image();
playerImg.src = 'nave.png'; 

const alienImg = new Image();
alienImg.src = 'alien.png';

// ==========================================
// MÁQUINA DE ESTADOS DO JOGO
// ==========================================
// O jogo começa na tela de abertura
let gameState = 'START'; // Pode ser: 'START', 'PLAYING', 'GAMEOVER'

// ==========================================
// DADOS DO JOGO
// ==========================================
let score = 0;
let level = 1;
const maxLives = 10;
let lives = maxLives;
let highScore = localStorage.getItem('spaceInvadersHighScore') || 0;

const bgColors = [
    '#000000', '#1a0500', '#330a00', '#4d0f00', '#661400', 
    '#801a00', '#991f00', '#b32400', '#cc2900', '#e62e00', 
    '#ff471a', '#ff704d', '#ff9980'
];

// ==========================================
// ESTADO DO TECLADO E ENTIDADES
// ==========================================
const keys = { left: false, right: false, space: false };

const player = { width: 50, height: 30, x: canvas.width / 2 - 25, y: canvas.height - 50, speed: 6 };
const bullets = [];
const bulletSpeed = 7;
const fireRate = 250; 
let lastShotTime = 0; 

const aliens = [];
const alienWidth = 40;
const alienHeight = 30;
let baseAlienSpeed = 2;
let alienSpawnRate = 1200; 
let lastAlienSpawnTime = 0;

// ==========================================
// CONTROLES DE INTERAÇÃO (TECLADO E MOUSE)
// ==========================================

// Interação pelo Mouse
canvas.addEventListener('mousedown', () => {
    if (gameState === 'START') {
        resetGame(); // Inicia o jogo
    } else if (gameState === 'GAMEOVER') {
        gameState = 'START'; // Volta para a tela de abertura
    }
});

// Interação pelo Teclado
document.addEventListener('keydown', (e) => {
    // Comportamento muda dependendo do estado da tela
    if (gameState === 'START') {
        if (e.code === 'Enter' || e.code === 'Space') {
            resetGame(); // Inicia o jogo
        }
        return; 
    } 
    
    if (gameState === 'GAMEOVER') {
        if (e.code === 'Enter' || e.code === 'Space') {
            gameState = 'START'; // Volta para a tela de abertura
        }
        return;
    }

    // Se estiver no estado 'PLAYING', os controles funcionam normalmente
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.code === 'Space') keys.space = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.code === 'Space') keys.space = false;
});

// ==========================================
// FUNÇÃO PARA INICIAR/REINICIAR O JOGO
// ==========================================
function resetGame() {
    score = 0;
    level = 1;
    lives = maxLives; 
    gameState = 'PLAYING'; // Muda o estado para rodando
    
    aliens.length = 0;
    bullets.length = 0;
    
    player.x = canvas.width / 2 - player.width / 2;
    alienSpawnRate = 1200;
    lastShotTime = Date.now();
    lastAlienSpawnTime = Date.now();

    keys.left = false;
    keys.right = false;
    keys.space = false;
}

// ==========================================
// MOTOR LÓGICO
// ==========================================
function update() {
    // Só calcula movimentação e colisões se o jogo estiver rodando
    if (gameState !== 'PLAYING') return;

    const now = Date.now(); 

    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    if (keys.space && now - lastShotTime > fireRate) {
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5, height: 15, speed: bulletSpeed
        });
        lastShotTime = now; 
    }

    if (now - lastAlienSpawnTime > alienSpawnRate) {
        const randomX = Math.random() * (canvas.width - alienWidth);
        aliens.push({ 
            x: randomX, y: -alienHeight, width: alienWidth, height: alienHeight,
            speed: baseAlienSpeed + (level * 0.5) 
        });
        lastAlienSpawnTime = now;
    }

    for (let i = aliens.length - 1; i >= 0; i--) {
        let alien = aliens[i];
        alien.y += alien.speed;

        // Bateu no jogador
        if (
            alien.x < player.x + player.width &&
            alien.x + alien.width > player.x &&
            alien.y < player.y + player.height &&
            alien.y + alien.height > player.y
        ) {
            finalizarJogo();
        }

        // Alien passou da tela
        if (alien.y > canvas.height) {
            aliens.splice(i, 1);
            lives--;             
            if (lives <= 0) finalizarJogo();
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        bullet.y -= bullet.speed;
        let bulletHit = false; 

        for (let j = aliens.length - 1; j >= 0; j--) {
            let alien = aliens[j];
            if (
                bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + bullet.height > alien.y
            ) {
                aliens.splice(j, 1);
                bulletHit = true;    
                score += 10;
                
                if (score > 0 && score % 100 === 0) {
                    level++;
                    lives = maxLives; 
                    if (alienSpawnRate > 400) alienSpawnRate -= 100;
                }
                
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('spaceInvadersHighScore', highScore);
                }
                break; 
            }
        }
        if (bulletHit || bullet.y < 0) bullets.splice(i, 1);
    }
}

// Função auxiliar para evitar código repetido
function finalizarJogo() {
    gameState = 'GAMEOVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceInvadersHighScore', highScore);
    }
}

// ==========================================
// MOTOR GRÁFICO (RENDERIZAÇÃO)
// ==========================================
function draw() {
    // 1. TELA DE ABERTURA
    if (gameState === 'START') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        
        ctx.font = 'bold 60px Arial';
        ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2 - 60);
        
        ctx.fillStyle = '#FFFF00';
        ctx.font = '24px Arial';
        ctx.fillText('High Score: ' + highScore, canvas.width / 2, canvas.height / 2 - 10);
        
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '20px Arial';
        ctx.fillText('Pressione ENTER ou CLIQUE para começar', canvas.width / 2, canvas.height / 2 + 60);
        
        ctx.textAlign = 'left'; // Reseta o alinhamento
        return; // Pula o resto da função draw
    }

    // 2. FUNDO E ELEMENTOS DO JOGO (Serve para PLAYING e GAMEOVER)
    let colorIndex = Math.min(level - 1, bgColors.length - 1);
    ctx.fillStyle = bgColors[colorIndex];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    ctx.fillStyle = '#FFFF00';
    for (let i = 0; i < bullets.length; i++) {
        let b = bullets[i];
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.width, b.height, 2);
        ctx.fill();
    }

    for (let i = 0; i < aliens.length; i++) {
        let a = aliens[i];
        ctx.drawImage(alienImg, a.x, a.y, a.width, a.height);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('High Score: ' + highScore, 10, 60); 
    ctx.fillText('Level: ' + level, canvas.width - 110, 30);
    
    if (lives < 4) ctx.fillStyle = '#FF5555';
    else ctx.fillStyle = '#FFFFFF';
    
    ctx.fillText('Vidas: ' + lives + '/' + maxLives, canvas.width - 110, 60);

    // 3. SOBREPOSIÇÃO DE GAME OVER
    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'red';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Pressione ENTER ou CLIQUE para voltar', canvas.width / 2, canvas.height / 2 + 30);
        
        ctx.textAlign = 'left';
    }
}

// ==========================================
// LOOP PRINCIPAL INFINITO
// ==========================================
function gameLoop() {
    update();
    draw();
    
    // O navegador sempre chama o loop, não importa o estado
    requestAnimationFrame(gameLoop);
}

gameLoop();