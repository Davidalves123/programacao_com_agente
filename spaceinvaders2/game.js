const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerImg = new Image();
playerImg.src = 'nave.png'; 

const alienImg = new Image();
alienImg.src = 'alien.png';

// ==========================================
// MÁQUINA DE ESTADOS DO JOGO
// ==========================================
let gameState = 'START'; 

// ==========================================
// DADOS DO JOGO E UPGRADES
// ==========================================
let score = 0;
let fase = 1;        // Antigo "Level"
let playerLevel = 1; // Nível atual do jogador (cresce com upgrades)
let maxLives = 10;
let lives = maxLives;
let highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0;
let nextUpgradeScore = 300;

let playerUpgrades = {
    speed: 0, multishot: 0, health: 0, pierce: 0, explosive: 0,
    spell: 0, turret: 0, homing: 0, laser: 0, wall: 0, doublexp: 0,
    buffer: 0, dash: 0, lifo: 0, drones: 0, chain: 0, parallel: 0, gradient: 0, echo: 0
};

const UPGRADES_DEF = [
    // Upgrades Clássicos
    { id: 'speed', name: 'Mais Velocidade', desc: '+10% vel. movimento', rarity: 'Comum', max: 5 },
    { id: 'multishot', name: 'Ataque Duplo', desc: 'Tiros extras laterais', rarity: 'Comum', max: 2 },
    { id: 'health', name: 'Vida Extra', desc: 'Vida máxima +5', rarity: 'Comum', max: 4 },
    { id: 'pierce', name: 'Perfuração', desc: 'Tiro atravessa inimigos', rarity: 'Raro', max: 99 },
    { id: 'explosive', name: 'Morte Explosiva', desc: 'Inimigos explodem', rarity: 'Raro', max: 1 },
    { id: 'spell', name: 'Feitiço', desc: 'Zona de lentidão (4s)', rarity: 'Raro', max: 1 }, 
    { id: 'turret', name: 'Torreta', desc: 'Canhão aliado nos cantos', rarity: 'Épico', max: 4 },
    { id: 'homing', name: 'Foguete Teleguiado', desc: 'Mísseis perseguidores', rarity: 'Épico', max: 1 },
    { id: 'laser', name: 'Laser', desc: 'Feixe contínuo poderoso', rarity: 'Lendário', max: 1 },
    { id: 'wall', name: 'Parede', desc: 'Escudos frontais', rarity: 'Lendário', max: 3 },
    { id: 'doublexp', name: 'Mais Exp', desc: 'Pontos duplicados', rarity: 'Lendário', max: 1 },
    // Novos Upgrades
    { id: 'buffer', name: 'Sobrecarga de Memória', desc: 'Mortes aumentam cadência', rarity: 'Comum', max: 1 },
    { id: 'dash', name: 'Dash Tático', desc: 'Toque 2x Direção p/ Salto', rarity: 'Comum', max: 1 },
    { id: 'lifo', name: 'Ricochete LIFO', desc: 'Tiros perdidos retornam', rarity: 'Raro', max: 1 },
    { id: 'drones', name: 'Interceção', desc: 'Drones orbitais protetores', rarity: 'Raro', max: 3 },
    { id: 'chain', name: 'Propagação em Largura', desc: 'Choque elétrico em rede', rarity: 'Épico', max: 3 },
    { id: 'parallel', name: 'Processamento Paralelo', desc: 'Satélites holográficos', rarity: 'Épico', max: 1 },
    { id: 'gradient', name: 'Poço de Gradiente', desc: 'Anomalia puxa inimigos', rarity: 'Lendário', max: 1 },
    { id: 'echo', name: 'Pacote de Eco', desc: 'Bumerangue Cura/Repele', rarity: 'Lendário', max: 1 }
];

let upgradeChoices = [];
let explosions = [];
let spellZones = [];
let playerWalls = [];
let lightnings = [];
let gradientWells = [];
let lifoStack = [];

let lastTurretShot = 0;
let lastSpellTime = 0;
let lastLifoPop = 0;
let lastGradientTime = 0;
let lastEchoTime = 0;

// Variáveis para Buffer e Dash
let bufferStacks = 0;
let bufferTimer = 0;
let lastLeftTap = 0;
let lastRightTap = 0;
let dashCooldown = 0;

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
// CONTROLES DE INTERAÇÃO
// ==========================================
canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'START') resetGame();
    else if (gameState === 'GAMEOVER') gameState = 'START';
    else if (gameState === 'UPGRADE') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let startX = canvas.width / 2 - 320; 
        for(let i=0; i<upgradeChoices.length; i++) {
            let cx = startX + i * 220;
            if(mouseX >= cx && mouseX <= cx + 200 && mouseY >= 200 && mouseY <= 450) {
                applyUpgrade(upgradeChoices[i]);
                break;
            }
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (gameState === 'START' && (e.code === 'Enter' || e.code === 'Space')) return resetGame();
    if (gameState === 'GAMEOVER' && (e.code === 'Enter' || e.code === 'Space')) return gameState = 'START';
    
    if (gameState === 'UPGRADE') {
        if (e.key === '1' && upgradeChoices[0]) applyUpgrade(upgradeChoices[0]);
        if (e.key === '2' && upgradeChoices[1]) applyUpgrade(upgradeChoices[1]);
        if (e.key === '3' && upgradeChoices[2]) applyUpgrade(upgradeChoices[2]);
        return;
    }

    const now = Date.now();
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
        if (playerUpgrades.dash > 0 && now - lastLeftTap < 250 && now - dashCooldown > 1500) {
            player.x -= 120; // Dash mecânico
            dashCooldown = now;
        }
        lastLeftTap = now;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
        if (playerUpgrades.dash > 0 && now - lastRightTap < 250 && now - dashCooldown > 1500) {
            player.x += 120; // Dash mecânico
            dashCooldown = now;
        }
        lastRightTap = now;
    }
    if (e.code === 'Space') keys.space = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
    if (e.code === 'Space') keys.space = false;
});

// ==========================================
// FUNÇÕES AUXILIARES E LÓGICA DE UPGRADES
// ==========================================
function resetGame() {
    score = 0;
    fase = 1;
    playerLevel = 1;
    maxLives = 10;
    lives = maxLives; 
    nextUpgradeScore = 300;
    
    playerUpgrades = {
        speed: 0, multishot: 0, health: 0, pierce: 0, explosive: 0,
        spell: 0, turret: 0, homing: 0, laser: 0, wall: 0, doublexp: 0,
        buffer: 0, dash: 0, lifo: 0, drones: 0, chain: 0, parallel: 0, gradient: 0, echo: 0
    };
    
    aliens.length = 0;
    bullets.length = 0;
    explosions.length = 0;
    spellZones.length = 0;
    playerWalls.length = 0;
    lightnings.length = 0;
    gradientWells.length = 0;
    lifoStack.length = 0;
    
    player.x = canvas.width / 2 - player.width / 2;
    alienSpawnRate = 1200;
    gameState = 'PLAYING';
}

function atualizarHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceInvadersHighScore', highScore);
    }
}

function finalizarJogo() {
    gameState = 'GAMEOVER';
    atualizarHighScore();
}

function generateUpgrades() {
    upgradeChoices = [];
    let available = UPGRADES_DEF.filter(u => (playerUpgrades[u.id] || 0) < u.max);
    for(let i=0; i<3; i++) {
        if (available.length === 0) break;
        let r = Math.random();
        let rarity = (r<0.05)?'Lendário':(r<0.20)?'Épico':(r<0.50)?'Raro':'Comum';
        
        let pool = available.filter(u => u.rarity === rarity);
        if (pool.length === 0) pool = available.filter(u => u.rarity === 'Comum');
        if (pool.length === 0) pool = available; 
        
        let chosen = pool[Math.floor(Math.random() * pool.length)];
        upgradeChoices.push(chosen);
        available = available.filter(u => u.id !== chosen.id); 
    }
}

function applyUpgrade(upgrade) {
    playerUpgrades[upgrade.id]++;
    playerLevel++; // Sobe o nível do jogador
    
    if (upgrade.id === 'health') {
        maxLives += 5;
        lives += 5;
    }
    if (upgrade.id === 'wall') playerWalls.push({ active: true });
    
    nextUpgradeScore += 300;
    gameState = 'PLAYING';
    keys.space = false; 
}

function triggerLightning(startX, startY, jumpsLeft) {
    if (jumpsLeft <= 0) return;
    let closest = null, minDist = 180;
    for (let a of aliens) {
        if (a.shocked) continue;
        let d = Math.hypot(a.x + alienWidth/2 - startX, a.y + alienHeight/2 - startY);
        if (d < minDist) { minDist = d; closest = a; }
    }
    if (closest) {
        closest.shocked = true;
        lightnings.push({
            x1: startX, y1: startY, 
            x2: closest.x + alienWidth/2, y2: closest.y + alienHeight/2, 
            timer: Date.now()
        });
        killAlien(aliens.indexOf(closest), closest);
        triggerLightning(closest.x + alienWidth/2, closest.y + alienHeight/2, jumpsLeft - 1);
    }
}

function killAlien(index, alien) {
    if (index === -1) return;
    aliens.splice(index, 1);
    
    // Sobrecarga de Memória (Buffer)
    if (playerUpgrades.buffer > 0) {
        bufferStacks = Math.min(bufferStacks + 1, 10);
        bufferTimer = Date.now() + 2000; // Mantém o stack ativo por 2s
    }

    if (playerUpgrades.explosive > 0) {
        explosions.push({x: alien.x + alienWidth/2, y: alien.y + alienHeight/2, radius: 10, maxRadius: 60});
    }
    
    let pts = 10 * (playerUpgrades.doublexp > 0 ? 2 : 1);
    let previousScore = score;
    score += pts;
    
    if (Math.floor(score / 100) > Math.floor(previousScore / 100)) {
        fase++;
        if (alienSpawnRate > 400) alienSpawnRate -= 50;
    }
    
    atualizarHighScore();
    if (score >= nextUpgradeScore) {
        gameState = 'UPGRADE';
        generateUpgrades();
    }
}

// ==========================================
// MOTOR LÓGICO
// ==========================================
function update() {
    if (gameState !== 'PLAYING') return;
    const now = Date.now(); 
    
    // Decaimento do Buffer
    if (now > bufferTimer) bufferStacks = 0;
    
    // 1. Movimento do Jogador
    let currentSpeed = player.speed * (1 + (playerUpgrades.speed * 0.1));
    if (keys.left) player.x -= currentSpeed;
    if (keys.right) player.x += currentSpeed;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // 2. Disparos do Jogador
    let isShootingLaser = (keys.space && playerUpgrades.laser > 0);
    let isHoming = playerUpgrades.homing > 0;
    
    // Aplicação da Sobrecarga (até +50% de cadência)
    let dynamicFireRate = fireRate * Math.pow(0.95, bufferStacks);
    let currentFireRate = isHoming ? dynamicFireRate / 0.4 : dynamicFireRate;
    
    if (keys.space && now - lastShotTime > currentFireRate && !isShootingLaser) {
        let numBullets = 1 + playerUpgrades.multishot;
        let currentBulletSpeed = isHoming ? bulletSpeed * 0.5 : bulletSpeed;

        // Disparo Principal e Clones Paralelos
        let shootPositions = [player.x];
        if (playerUpgrades.parallel > 0) shootPositions.push(player.x - 70, player.x + 70);

        for(let px of shootPositions) {
            for (let i = 0; i < numBullets; i++) {
                let offsetX = (i - (numBullets - 1) / 2) * 20;
                bullets.push({
                    x: px + player.width / 2 - 2.5 + offsetX,
                    y: player.y,
                    vx: 0, vy: -currentBulletSpeed, 
                    width: 5, height: 15, speed: currentBulletSpeed,
                    pierceLeft: playerUpgrades.pierce,
                    hitAliens: [], isHoming: isHoming, isTurret: false, isEcho: false
                });
            }
        }
        lastShotTime = now; 
    }

    // Tiro de Pacote de Eco (Bumerangue Lendário)
    if (playerUpgrades.echo > 0 && keys.space && now - lastEchoTime > 8000) {
        bullets.push({
            x: player.x + player.width/2 - 10, y: player.y, 
            vx: 0, vy: -bulletSpeed * 1.5,
            width: 20, height: 20, speed: bulletSpeed * 1.5, 
            pierceLeft: 999, hitAliens: [], isHoming: false, isTurret: false, isEcho: true
        });
        lastEchoTime = now;
    }

    // 3. Torreta
    const turretPos = [
        {x: 30, y: 30}, {x: canvas.width-30, y: 30},
        {x: 30, y: canvas.height-30}, {x: canvas.width-30, y: canvas.height-30}
    ];
    if (playerUpgrades.turret > 0 && now - lastTurretShot > 1000) {
        for (let i = 0; i < playerUpgrades.turret; i++) {
            bullets.push({
                x: turretPos[i].x, y: turretPos[i].y, vx: 0, vy: -bulletSpeed * 0.4,
                width: 8, height: 8, speed: bulletSpeed * 0.4, 
                pierceLeft: 0, hitAliens: [], isHoming: true, isTurret: true, isEcho: false
            });
        }
        lastTurretShot = now;
    }

    // 4. Feitiço e Gradiente (Mínimo Local)
    if (playerUpgrades.spell > 0 && now - lastSpellTime > 4000) {
        spellZones.push({x: Math.random()*(canvas.width-100)+50, y: Math.random()*(canvas.height/2)+50, radius: 80, spawnTime: now});
        lastSpellTime = now;
    }
    spellZones = spellZones.filter(s => now - s.spawnTime < 3000); 

    if (playerUpgrades.gradient > 0 && now - lastGradientTime > 8000) {
        gradientWells.push({x: Math.random()*(canvas.width-200)+100, y: Math.random()*(canvas.height/2 - 100)+100, spawnTime: now});
        lastGradientTime = now;
    }
    gradientWells = gradientWells.filter(g => now - g.spawnTime < 4000);

    // 5. Geração de Inimigos
    if (now - lastAlienSpawnTime > alienSpawnRate) {
        aliens.push({ 
            x: Math.random() * (canvas.width - alienWidth), y: -alienHeight, 
            width: alienWidth, height: alienHeight, baseSpeed: baseAlienSpeed + (fase * 0.5), shocked: false
        });
        lastAlienSpawnTime = now;
    }

    // 6. Atualização Visual (Explosões e Raios)
    for (let i = explosions.length - 1; i >= 0; i--) {
        let exp = explosions[i];
        exp.radius += 3;
        for (let j = aliens.length - 1; j >= 0; j--) {
            if (Math.hypot((aliens[j].x + alienWidth/2) - exp.x, (aliens[j].y + alienHeight/2) - exp.y) < exp.radius) {
                killAlien(j, aliens[j]);
            }
        }
        if (exp.radius > exp.maxRadius) explosions.splice(i, 1);
    }
    lightnings = lightnings.filter(l => now - l.timer < 300);

    // 7. Paredes Protetoras & Drones Orbitais
    let activeWalls = playerWalls.filter(w => w.active);
    let spacing = 55;
    let startX = player.x + player.width/2 - ((activeWalls.length-1)*spacing)/2;
    
    // 8. Atualização de Inimigos
    for (let i = aliens.length - 1; i >= 0; i--) {
        let alien = aliens[i];
        let currentAlienSpeed = alien.baseSpeed;
        
        for (let s of spellZones) {
            if (Math.hypot((alien.x + alienWidth/2) - s.x, (alien.y + alienHeight/2) - s.y) < s.radius) {
                currentAlienSpeed *= 0.3; break;
            }
        }
        
        // Puxão do Poço de Gradiente
        for (let g of gradientWells) {
            let dx = g.x - (alien.x + alienWidth/2);
            let dy = g.y - (alien.y + alienHeight/2);
            if (Math.hypot(dx, dy) < 250) {
                alien.x += dx * 0.03;
                alien.y += dy * 0.03;
                currentAlienSpeed *= 0.1; // Segura os inimigos
            }
        }
        
        alien.y += currentAlienSpeed;

        if (alien.x < player.x + player.width && alien.x + alien.width > player.x &&
            alien.y < player.y + player.height && alien.y + alien.height > player.y) {
            finalizarJogo();
        }

        // Colisão com Paredes
        let hitShield = false;
        for (let w = 0; w < activeWalls.length; w++) {
            let wx = startX + w*spacing - 15, wy = player.y - 40;
            if (activeWalls[w].active && alien.x < wx + 30 && alien.x + alien.width > wx && alien.y < wy + 15 && alien.y + alien.height > wy) {
                activeWalls[w].active = false;
                killAlien(i, alien);
                hitShield = true;
                break;
            }
        }
        if (hitShield) continue;

        // Colisão com Drones Orbitais (Interceção)
        if (playerUpgrades.drones > 0) {
            let numDrones = playerUpgrades.drones;
            for(let d=0; d<numDrones; d++) {
                let angle = now * 0.003 + (Math.PI * 2 / numDrones) * d;
                let dx = player.x + player.width/2 + Math.cos(angle) * 80;
                let dy = player.y + player.height/2 + Math.sin(angle) * 80;
                if (Math.hypot((alien.x + alienWidth/2) - dx, (alien.y + alienHeight/2) - dy) < 30) {
                    killAlien(i, alien);
                    hitShield = true;
                    break;
                }
            }
        }
        if (hitShield) continue;

        if (alien.y > canvas.height) {
            aliens.splice(i, 1);
            lives--;             
            if (lives <= 0) finalizarJogo();
        }
    }
    playerWalls = activeWalls.filter(w => w.active);

    // 9. Dano Contínuo do Laser
    if (isShootingLaser) {
        for (let j = aliens.length - 1; j >= 0; j--) {
            if (aliens[j].x < player.x + player.width / 2 + 10 && aliens[j].x + aliens[j].width > player.x + player.width / 2 - 10) {
                killAlien(j, aliens[j]);
            }
        }
    }

    // 10. Atualização de Projéteis (Pilhas LIFO e Ecos)
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        
        if (bullet.isHoming) {
            let nearest = null, minDist = Infinity;
            for (let a of aliens) {
                let d = Math.hypot((a.x + alienWidth/2) - bullet.x, (a.y + alienHeight/2) - bullet.y);
                if (d < minDist) { minDist = d; nearest = a; }
            }
            if (nearest) {
                let mag = Math.hypot((nearest.x + alienWidth/2) - bullet.x, (nearest.y + alienHeight/2) - bullet.y);
                bullet.vx = bullet.vx * 0.92 + ((nearest.x + alienWidth/2 - bullet.x) / mag * bullet.speed) * 0.08;
                bullet.vy = bullet.vy * 0.92 + ((nearest.y + alienHeight/2 - bullet.y) / mag * bullet.speed) * 0.08;
            } else bullet.vy = bullet.vy * 0.95 - (bullet.speed * 0.05); 
            bullet.x += bullet.vx; bullet.y += bullet.vy;
        } else {
            bullet.y += bullet.vy; // Usa vetor para suportar bumerangue
        }

        // Bateu no topo da tela
        if (bullet.y < 0 && bullet.vy < 0) {
            if (bullet.isEcho) {
                bullet.vy = Math.abs(bullet.speed); // Bumerangue volta
            } else if (playerUpgrades.lifo > 0) {
                lifoStack.push({x: bullet.x, speed: bullet.speed}); // Adiciona à pilha
                bullets.splice(i, 1);
                continue;
            }
        }
        
        // Bumerangue Eco atingiu o jogador no retorno
        if (bullet.isEcho && bullet.vy > 0 && bullet.y > player.y && Math.abs(bullet.x - player.x) < 50) {
            lives = Math.min(lives + 1, maxLives);
            score += 50;
            aliens.forEach(a => a.y = Math.max(-50, a.y - 150)); // Onda de repulsão
            bullets.splice(i, 1);
            continue;
        }

        let bulletHit = false; 
        for (let j = aliens.length - 1; j >= 0; j--) {
            let alien = aliens[j];
            if (bullet.hitAliens.includes(alien)) continue;

            if (bullet.x < alien.x + alien.width && bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height && bullet.y + bullet.height > alien.y) {
                
                killAlien(j, alien);
                bullet.hitAliens.push(alien);
                
                // Dispara choque em rede (Chain Lightning)
                if (playerUpgrades.chain > 0 && !bullet.isEcho && !bullet.isTurret) {
                    triggerLightning(alien.x + alienWidth/2, alien.y + alienHeight/2, playerUpgrades.chain);
                }

                if (bullet.isHoming && !bullet.isTurret) {
                    explosions.push({x: bullet.x, y: bullet.y, radius: 10, maxRadius: 50});
                    bulletHit = true; break;
                }
                if (bullet.pierceLeft > 0) bullet.pierceLeft--;
                else { bulletHit = true; break; }
            }
        }
        
        if (bulletHit || bullet.y < -50 || bullet.x < -50 || bullet.x > canvas.width + 50 || bullet.y > canvas.height + 50) {
            bullets.splice(i, 1);
        }
    }

    // Processamento da Pilha LIFO
    if (lifoStack.length > 0 && now - lastLifoPop > 150) {
        let b = lifoStack.pop();
        bullets.push({
            x: b.x, y: canvas.height, vx: 0, vy: -b.speed, 
            width: 5, height: 15, speed: b.speed, pierceLeft: playerUpgrades.pierce, 
            hitAliens: [], isHoming: false, isTurret: false, isEcho: false
        });
        lastLifoPop = now;
    }
}

// ==========================================
// MOTOR GRÁFICO (RENDERIZAÇÃO)
// ==========================================
function draw() {
    if (gameState === 'START') {
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.font = 'bold 60px Arial';
        ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillStyle = '#FFFF00'; ctx.font = '24px Arial';
        ctx.fillText('High Score: ' + highScore, canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#AAAAAA'; ctx.font = '20px Arial';
        ctx.fillText('Pressione ENTER ou CLIQUE para começar', canvas.width / 2, canvas.height / 2 + 60);
        ctx.textAlign = 'left'; return; 
    }

    let hue = (fase * 20) % 360; 
    ctx.fillStyle = `hsl(${hue}, 40%, 12%)`; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Efeitos Terrestres (Poço e Feitiço)
    for (let g of gradientWells) {
        let pulse = Math.abs(Math.sin(Date.now() * 0.005)) * 10;
        let grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 200);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.5, 'rgba(50, 0, 100, 0.4)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(g.x, g.y, 200 + pulse, 0, Math.PI * 2); ctx.fill();
    }
    
    ctx.fillStyle = 'rgba(170, 0, 255, 0.2)';
    for (let s of spellZones) {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
    }

    // Efeitos e Jogador
    if (keys.space && playerUpgrades.laser > 0 && gameState === 'PLAYING') {
        ctx.fillStyle = '#00FFFF'; ctx.shadowBlur = 10; ctx.shadowColor = '#00FFFF';
        ctx.fillRect(player.x + player.width/2 - 10, 0, 20, player.y); ctx.shadowBlur = 0; 
    }

    let spacing = 55;
    let startX = player.x + player.width/2 - ((playerWalls.length-1)*spacing)/2;
    for (let i = 0; i < playerWalls.length; i++) {
        ctx.fillStyle = '#00FFCC'; ctx.fillRect(startX + i*spacing - 15, player.y - 40, 30, 15);
    }
    
    if (playerUpgrades.drones > 0) {
        ctx.fillStyle = '#00FFCC';
        let numDrones = playerUpgrades.drones;
        for(let d=0; d<numDrones; d++) {
            let angle = Date.now() * 0.003 + (Math.PI * 2 / numDrones) * d;
            let dx = player.x + player.width/2 + Math.cos(angle) * 80;
            let dy = player.y + player.height/2 + Math.sin(angle) * 80;
            ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI*2); ctx.fill();
        }
    }

    // Clones (Processamento Paralelo)
    if (playerUpgrades.parallel > 0 && gameState === 'PLAYING') {
        ctx.globalAlpha = 0.4;
        ctx.drawImage(playerImg, player.x - 70, player.y, player.width, player.height);
        ctx.drawImage(playerImg, player.x + 70, player.y, player.width, player.height);
        ctx.globalAlpha = 1.0;
    }
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    // Torretas e Projéteis
    const turretPos = [{x: 30, y: 30}, {x: canvas.width-30, y: 30}, {x: 30, y: canvas.height-30}, {x: canvas.width-30, y: canvas.height-30}];
    for (let i = 0; i < playerUpgrades.turret; i++) {
        let pos = turretPos[i];
        ctx.fillStyle = '#666'; ctx.fillRect(pos.x-12, pos.y-12, 24, 24);
        ctx.fillStyle = '#F00'; ctx.fillRect(pos.x-4, pos.y, 8, 18);
    }

    for (let b of bullets) {
        if (b.isEcho) { ctx.fillStyle = '#00FFAA'; ctx.beginPath(); ctx.arc(b.x+b.width/2, b.y+b.height/2, b.width/2, 0, Math.PI*2); ctx.fill(); }
        else {
            ctx.fillStyle = b.isHoming ? (b.isTurret ? '#FFAA00' : '#FF4400') : '#FFFF00';
            ctx.beginPath();
            if (b.isHoming) ctx.arc(b.x+b.width/2, b.y+b.height/2, b.width, 0, Math.PI*2);
            else ctx.roundRect(b.x, b.y, b.width, b.height, 2);
            ctx.fill();
        }
    }

    for (let a of aliens) ctx.drawImage(alienImg, a.x, a.y, a.width, a.height);

    for (let exp of explosions) {
        ctx.fillStyle = `rgba(255, 100, 0, ${1 - (exp.radius/exp.maxRadius)})`;
        ctx.beginPath(); ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2); ctx.fill();
    }
    
    ctx.strokeStyle = '#00FFFF'; ctx.lineWidth = 2;
    for (let l of lightnings) {
        ctx.beginPath(); ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x1 + (l.x2 - l.x1)/2 + (Math.random()*20-10), l.y1 + (l.y2 - l.y1)/2 + (Math.random()*20-10));
        ctx.lineTo(l.x2, l.y2); ctx.stroke();
    }

    // Interface HUD
    ctx.fillStyle = '#FFFFFF'; ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('High Score: ' + highScore, 10, 60); 
    ctx.fillText('Próx Poder: ' + nextUpgradeScore, 10, 90); 
    
    ctx.fillText('Fase: ' + fase, canvas.width - 130, 30);
    ctx.fillStyle = '#00FFCC'; ctx.fillText('Nível: ' + playerLevel, canvas.width - 130, 60);
    ctx.fillStyle = (lives < 4) ? '#FF5555' : '#FFFFFF';
    ctx.fillText('Vidas: ' + lives + '/' + maxLives, canvas.width - 130, 90);

    // ECRÃS DE SOBREPOSIÇÃO
    if (gameState === 'UPGRADE') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center';
        ctx.font = 'bold 36px Arial'; ctx.fillText('SUBIU DE NÍVEL!', canvas.width/2, 100);
        ctx.font = '20px Arial'; ctx.fillText('Escolha um poder (Clique ou Pressione 1, 2, 3)', canvas.width/2, 140);
        
        let startX_UI = canvas.width / 2 - 320; 
        for(let i=0; i<upgradeChoices.length; i++) {
            let choice = upgradeChoices[i], cx = startX_UI + i * 220, cy = 200;
            let rarityColor = (choice.rarity === 'Raro') ? '#00AAFF' : (choice.rarity === 'Épico') ? '#AA00FF' : (choice.rarity === 'Lendário') ? '#FFD700' : '#FFFFFF';
            
            ctx.fillStyle = '#222'; ctx.fillRect(cx, cy, 200, 250);
            ctx.strokeStyle = rarityColor; ctx.lineWidth = 4; ctx.strokeRect(cx, cy, 200, 250);
            
            ctx.fillStyle = rarityColor; ctx.font = 'bold 20px Arial'; ctx.fillText(choice.name, cx + 100, cy + 40);
            ctx.fillStyle = '#AAAAAA'; ctx.font = '14px Arial'; ctx.fillText(choice.rarity.toUpperCase(), cx + 100, cy + 65);
            ctx.fillStyle = '#FFFFFF'; ctx.font = '16px Arial'; ctx.fillText(choice.desc, cx + 100, cy + 130);
            ctx.fillStyle = rarityColor; ctx.font = '16px Arial'; ctx.fillText(`[ Tecla ${i+1} ]`, cx + 100, cy + 220);
        }
        ctx.textAlign = 'left';
    } else if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red'; ctx.textAlign = 'center'; ctx.font = 'bold 50px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = 'white'; ctx.font = '20px Arial';
        ctx.fillText('Pressione ENTER ou CLIQUE para voltar', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();