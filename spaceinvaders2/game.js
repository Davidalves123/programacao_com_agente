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
let fase = 1;        
let playerLevel = 1; 
let maxLives = 10;
let lives = maxLives;
let highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0;
let nextUpgradeScore = 300;
let lastBossFase = 0; 

let playerUpgrades = {
    speed: 0, multishot: 0, health: 0, pierce: 0, explosive: 0,
    spell: 0, turret: 0, homing: 0, laser: 0, wall: 0, doublexp: 0,
    buffer: 0, dash: 0, lifo: 0, drones: 0, chain: 0, parallel: 0, gradient: 0, echo: 0
};

const UPGRADES_DEF = [
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
const alienBullets = []; 
const bulletSpeed = 7;
const fireRate = 250; 
let lastShotTime = 0; 

const aliens = [];
const alienWidth = 40;
const alienHeight = 30;
let baseAlienSpeed = 1.0; 
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
            player.x -= 120; 
            dashCooldown = now;
        }
        lastLeftTap = now;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
        if (playerUpgrades.dash > 0 && now - lastRightTap < 250 && now - dashCooldown > 1500) {
            player.x += 120; 
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

function atualizarNave() {
    const skins = ['nave.png', 'Ship_4.png', 'Ship_5.png', 'Ship_2.png', 'Ship_3.png'];
    let index = Math.floor(playerLevel / 3); 
    if (index >= skins.length) index = skins.length - 1; 
    playerImg.src = skins[index];
}

function resetGame() {
    score = 0;
    fase = 1;
    playerLevel = 1;
    maxLives = 10;
    lives = maxLives; 
    nextUpgradeScore = 300;
    lastBossFase = 0;
    
    playerUpgrades = {
        speed: 0, multishot: 0, health: 0, pierce: 0, explosive: 0,
        spell: 0, turret: 0, homing: 0, laser: 0, wall: 0, doublexp: 0,
        buffer: 0, dash: 0, lifo: 0, drones: 0, chain: 0, parallel: 0, gradient: 0, echo: 0
    };
    
    aliens.length = 0;
    bullets.length = 0;
    alienBullets.length = 0;
    explosions.length = 0;
    spellZones.length = 0;
    playerWalls.length = 0;
    lightnings.length = 0;
    gradientWells.length = 0;
    lifoStack.length = 0;
    
    player.x = canvas.width / 2 - player.width / 2;
    alienSpawnRate = 1200;
    gameState = 'PLAYING';
    atualizarNave(); 
}

// CORREÇÃO I/O: Atualiza variável, mas não trava o disco gravando toda hora
function atualizarHighScore() {
    if (score > highScore) {
        highScore = score;
    }
}

// CORREÇÃO I/O: Gravação do recorde transferida para o fim do jogo
function finalizarJogo() {
    gameState = 'GAMEOVER';
    localStorage.setItem('spaceInvadersHighScore', highScore);
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
    playerLevel++; 
    atualizarNave();
    
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
        let d = Math.hypot(a.x + a.width/2 - startX, a.y + a.height/2 - startY);
        if (d < minDist) { minDist = d; closest = a; }
    }
    if (closest) {
        closest.shocked = true;
        
        // CORREÇÃO DE PARTICULAS: Evita crashear o canvas renderizando raios infinitos
        if (lightnings.length < 40) {
            lightnings.push({
                x1: startX, y1: startY, 
                x2: closest.x + closest.width/2, y2: closest.y + closest.height/2, 
                timer: Date.now()
            });
        }
        
        damageAlien(aliens.indexOf(closest), closest);
        triggerLightning(closest.x + closest.width/2, closest.y + closest.height/2, jumpsLeft - 1);
    }
}

function spawnSpecificAlien(x, y, type) {
    x = Math.max(0, Math.min(canvas.width - alienWidth, x));
    let speedMods = type === 'white' ? 0.5 : 1.0;
    aliens.push({
        x: x, y: y, width: alienWidth, height: alienHeight,
        baseSpeed: (baseAlienSpeed + (fase * 0.15)) * speedMods, 
        shocked: false, type: type, hp: 1, lastShot: Date.now()
    });
}

function damageAlien(index, alien) {
    if (index === -1) return;
    if (alien.hp > 1) {
        alien.hp--;
    } else {
        killAlien(index, alien);
    }
}

function killAlien(index, alien) {
    if (index === -1) return;
    aliens.splice(index, 1);
    
    if (alien.type === 'white') {
        spawnSpecificAlien(alien.x - 25, alien.y, 'normal');
        spawnSpecificAlien(alien.x + 25, alien.y, 'normal');
    }
    
    if (playerUpgrades.buffer > 0) {
        bufferStacks = Math.min(bufferStacks + 1, 10);
        bufferTimer = Date.now() + 2000; 
    }

    // CORREÇÃO DE PARTICULAS: Limita o número de explosões na tela
    if (playerUpgrades.explosive > 0 && explosions.length < 20) {
        explosions.push({
            x: alien.x + alien.width/2, 
            y: alien.y + alien.height/2, 
            radius: 10, 
            maxRadius: 60,
            hitAliens: []
        });
    }
    
    let pts = (alien.type === 'boss' ? 100 : 10) * (playerUpgrades.doublexp > 0 ? 2 : 1);
    score += pts;
    
    // CORREÇÃO MATEMÁTICA: Pular múltiplos níveis garante que não desincronize se ganhar pontos demais 
    let novaFase = Math.floor(score / 100) + 1;
    if (novaFase > fase) {
        let fasesPulas = novaFase - fase;
        fase = novaFase;
        lives = maxLives; 
        
        for (let k = 0; k < fasesPulas; k++) {
            if (alienSpawnRate > 400) alienSpawnRate -= 50;
        }

        for (let w = 0; w < playerWalls.length; w++) {
            playerWalls[w].active = true;
        }
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
    
    if (now > bufferTimer) bufferStacks = 0;
    
    let currentSpeed = player.speed * (1 + (playerUpgrades.speed * 0.1));
    if (keys.left) player.x -= currentSpeed;
    if (keys.right) player.x += currentSpeed;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    let isShootingLaser = (keys.space && playerUpgrades.laser > 0);
    let isHoming = playerUpgrades.homing > 0;
    let dynamicFireRate = fireRate * Math.pow(0.95, bufferStacks);
    let currentFireRate = isHoming ? dynamicFireRate / 0.4 : dynamicFireRate;
    
    let shootPositions = [player.x];
    if (playerUpgrades.parallel > 0) shootPositions.push(player.x - 70, player.x + 70);

    if (keys.space && now - lastShotTime > currentFireRate && !isShootingLaser) {
        let currentBulletSpeed = isHoming ? bulletSpeed * 0.5 : bulletSpeed;
        
        let mult = Math.min(playerUpgrades.multishot, 2);
        let offsets = [];
        if (mult === 0) offsets = [0];
        else if (mult === 1) offsets = [-15, 15];
        else if (mult === 2) offsets = [-20, 0, 20];

        for(let px of shootPositions) {
            for (let offsetX of offsets) {
                bullets.push({
                    x: px + player.width / 2 - 2.5 + offsetX,
                    y: player.y,
                    vx: 0, vy: -currentBulletSpeed, 
                    width: 5, height: 15, speed: currentBulletSpeed,
                    pierceLeft: playerUpgrades.pierce,
                    hitAliens: [], isHoming: isHoming, isTurret: false, isEcho: false,
                    hasLooped: false
                });
            }
        }
        lastShotTime = now; 
    }

    if (playerUpgrades.echo > 0 && keys.space && now - lastEchoTime > 8000) {
        bullets.push({
            x: player.x + player.width/2 - 10, y: player.y, 
            vx: 0, vy: -bulletSpeed * 1.5,
            width: 20, height: 20, speed: bulletSpeed * 1.5, 
            pierceLeft: 999, hitAliens: [], isHoming: false, isTurret: false, isEcho: true, hasLooped: false
        });
        lastEchoTime = now;
    }

    const turretPos = [
        {x: 30, y: 30}, {x: canvas.width-30, y: 30},
        {x: 30, y: canvas.height-30}, {x: canvas.width-30, y: canvas.height-30}
    ];
    if (playerUpgrades.turret > 0 && now - lastTurretShot > 1000) {
        for (let i = 0; i < playerUpgrades.turret; i++) {
            bullets.push({
                x: turretPos[i].x, y: turretPos[i].y, vx: 0, vy: -bulletSpeed * 0.4,
                width: 8, height: 8, speed: bulletSpeed * 0.4, 
                pierceLeft: 0, hitAliens: [], isHoming: true, isTurret: true, isEcho: false, hasLooped: false
            });
        }
        lastTurretShot = now;
    }

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

    let currentSpawnRate = alienSpawnRate;
    if (fase >= 31) currentSpawnRate /= 2.0;
    else if (fase >= 21) currentSpawnRate /= 1.5;

    if (now - lastAlienSpawnTime > currentSpawnRate) {
        if (fase > 0 && fase % 20 === 0 && fase !== lastBossFase) {
            aliens.push({ 
                x: canvas.width / 2 - 50, y: -100, 
                width: 100, height: 100, 
                baseSpeed: 0.4, 
                shocked: false, type: 'boss', hp: 100, 
                lastShot: now 
            });
            lastBossFase = fase;
            lastAlienSpawnTime = now;
        } else {
            let spawnType = 'normal';
            let spawnHp = 1;
            let rand = Math.random();
            
            if (fase >= 20 && rand < 0.05) { spawnType = 'white'; spawnHp = 1; }
            else if (fase >= 15 && rand < 0.10) { spawnType = 'red'; spawnHp = 2; }
            else if (fase >= 10 && rand < 0.15) { spawnType = 'yellow'; spawnHp = 1; }
            else if (fase >= 5 && rand < 0.20) { spawnType = 'blue'; spawnHp = 1; }

            let speedMods = spawnType === 'white' ? 0.5 : 1.0;
            
            aliens.push({ 
                x: Math.random() * (canvas.width - alienWidth), y: -alienHeight, 
                width: alienWidth, height: alienHeight, 
                baseSpeed: (baseAlienSpeed + (fase * 0.15)) * speedMods, 
                shocked: false, type: spawnType, hp: spawnHp, 
                lastShot: Date.now() + Math.random()*1000 
            });
            lastAlienSpawnTime = now;
        }
    }

    for (let i = alienBullets.length - 1; i >= 0; i--) {
        let ab = alienBullets[i];
        ab.x += ab.vx || 0;
        ab.y += ab.vy || ab.speed;
        
        if (ab.x < player.x + player.width && ab.x + ab.width > player.x &&
            ab.y < player.y + player.height && ab.y + ab.height > player.y) {
            
            lives -= (ab.damage || 1); 
            alienBullets.splice(i, 1);
            if (lives <= 0) finalizarJogo();
            continue;
        }
        if (ab.y > canvas.height || ab.x < -50 || ab.x > canvas.width + 50) alienBullets.splice(i, 1);
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
        let exp = explosions[i];
        exp.radius += 3;
        for (let j = aliens.length - 1; j >= 0; j--) {
            let alien = aliens[j];
            if (!exp.hitAliens.includes(alien) && Math.hypot((alien.x + alien.width/2) - exp.x, (alien.y + alien.height/2) - exp.y) < exp.radius) {
                exp.hitAliens.push(alien);
                damageAlien(j, alien);
            }
        }
        if (exp.radius > exp.maxRadius) explosions.splice(i, 1);
    }
    
    lightnings = lightnings.filter(l => now - l.timer < 300);

    let spacing = 55;
    let startX = player.x + player.width/2 - ((playerWalls.length-1)*spacing)/2;
    
    for (let i = aliens.length - 1; i >= 0; i--) {
        let alien = aliens[i];
        let currentAlienSpeed = alien.baseSpeed;
        
        if (alien.type === 'yellow') {
            let dx = (player.x + player.width/2) - (alien.x + alien.width/2);
            alien.x += Math.sign(dx) * 0.5;
        }
        
        if (alien.type === 'blue' && now - alien.lastShot > 1250) {
            alienBullets.push({
                x: alien.x + alien.width/2 - 3, y: alien.y + alien.height,
                width: 6, height: 16, vx: 0, vy: 4, damage: 1
            });
            alien.lastShot = now;
        }
        
        if (alien.type === 'boss' && now - alien.lastShot > 2000) {
            for (let angle = -0.4; angle <= 0.41; angle += 0.2) {
                alienBullets.push({
                    x: alien.x + alien.width/2 - 6,
                    y: alien.y + alien.height - 10,
                    width: 12, height: 12, 
                    vx: Math.sin(angle) * 5, 
                    vy: Math.cos(angle) * 5, 
                    damage: 2
                });
            }
            alien.lastShot = now;
        }

        for (let s of spellZones) {
            if (Math.hypot((alien.x + alien.width/2) - s.x, (alien.y + alien.height/2) - s.y) < s.radius) {
                currentAlienSpeed *= 0.3; break;
            }
        }
        for (let g of gradientWells) {
            let dx = g.x - (alien.x + alien.width/2);
            let dy = g.y - (alien.y + alien.height/2);
            if (Math.hypot(dx, dy) < 250) {
                alien.x += dx * 0.03;
                alien.y += dy * 0.03;
                currentAlienSpeed *= 0.1; 
            }
        }
        
        alien.y += currentAlienSpeed;

        if (alien.x < player.x + player.width && alien.x + alien.width > player.x &&
            alien.y < player.y + player.height && alien.y + alien.height > player.y) {
            
            lives -= 3;
            killAlien(i, alien);
            
            if (lives <= 0) finalizarJogo();
            continue; 
        }

        let hitShield = false;
        for (let w = 0; w < playerWalls.length; w++) {
            let wx = startX + w*spacing - 15, wy = player.y - 40;
            if (playerWalls[w].active && alien.x < wx + 30 && alien.x + alien.width > wx && alien.y < wy + 15 && alien.y + alien.height > wy) {
                playerWalls[w].active = false;
                damageAlien(i, alien);
                hitShield = true;
                break;
            }
        }
        if (hitShield) continue;

        if (playerUpgrades.drones > 0) {
            let numDrones = playerUpgrades.drones;
            for(let d=0; d<numDrones; d++) {
                let angle = now * 0.003 + (Math.PI * 2 / numDrones) * d;
                let dx = player.x + player.width/2 + Math.cos(angle) * 80;
                let dy = player.y + player.height/2 + Math.sin(angle) * 80;
                if (Math.hypot((alien.x + alien.width/2) - dx, (alien.y + alien.height/2) - dy) < (alien.type === 'boss' ? 60 : 30)) {
                    damageAlien(i, alien);
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

    if (isShootingLaser) {
        for (let px of shootPositions) {
            for (let j = aliens.length - 1; j >= 0; j--) {
                if (aliens[j].x < px + player.width / 2 + 10 && aliens[j].x + aliens[j].width > px + player.width / 2 - 10) {
                    damageAlien(j, aliens[j]);
                }
            }
        }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];
        
        if (bullet.isHoming) {
            let nearest = null, minDist = Infinity;
            for (let a of aliens) {
                let d = Math.hypot((a.x + a.width/2) - bullet.x, (a.y + a.height/2) - bullet.y);
                if (d < minDist) { minDist = d; nearest = a; }
            }
            if (nearest) {
                let mag = Math.hypot((nearest.x + nearest.width/2) - bullet.x, (nearest.y + nearest.height/2) - bullet.y);
                if (mag > 0.1) {
                    bullet.vx = bullet.vx * 0.92 + ((nearest.x + nearest.width/2 - bullet.x) / mag * bullet.speed) * 0.08;
                    bullet.vy = bullet.vy * 0.92 + ((nearest.y + nearest.height/2 - bullet.y) / mag * bullet.speed) * 0.08;
                }
            } else {
                bullet.vy = bullet.vy * 0.95 - (bullet.speed * 0.05); 
            }
            bullet.x += bullet.vx; bullet.y += bullet.vy;
        } else {
            bullet.y += bullet.vy; 
        }

        if (bullet.y < 0 && bullet.vy < 0) {
            if (bullet.isEcho) {
                bullet.vy = Math.abs(bullet.speed); 
            } else if (playerUpgrades.lifo > 0 && !bullet.hasLooped) {
                lifoStack.push({x: bullet.x, speed: bullet.speed}); 
                bullets.splice(i, 1);
                continue;
            }
        }
        
        if (bullet.isEcho && bullet.vy > 0 && bullet.y > player.y && Math.abs(bullet.x - player.x) < 50) {
            lives = Math.min(lives + 1, maxLives);
            score += 50;
            aliens.forEach(a => a.y = Math.max(-50, a.y - 150)); 
            bullets.splice(i, 1);
            continue;
        }

        let bulletHit = false; 
        for (let j = aliens.length - 1; j >= 0; j--) {
            let alien = aliens[j];
            if (bullet.hitAliens.includes(alien)) continue;

            if (bullet.x < alien.x + alien.width && bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height && bullet.y + bullet.height > alien.y) {
                
                bullet.hitAliens.push(alien);
                damageAlien(j, alien);
                
                if (playerUpgrades.chain > 0 && !bullet.isEcho && !bullet.isTurret) {
                    triggerLightning(alien.x + alien.width/2, alien.y + alien.height/2, playerUpgrades.chain);
                }

                if (bullet.isHoming && !bullet.isTurret) {
                    // CORREÇÃO DE PARTICULAS: Só cria novas explosões se o limite permitir
                    if (explosions.length < 20) {
                        explosions.push({x: bullet.x, y: bullet.y, radius: 10, maxRadius: 50, hitAliens: []});
                    }
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

    if (lifoStack.length > 0 && now - lastLifoPop > 150) {
        let b = lifoStack.pop();
        bullets.push({
            x: b.x, y: canvas.height, vx: 0, vy: -b.speed, 
            width: 5, height: 15, speed: b.speed, pierceLeft: playerUpgrades.pierce, 
            hitAliens: [], isHoming: false, isTurret: false, isEcho: false,
            hasLooped: true 
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

    if (keys.space && playerUpgrades.laser > 0 && gameState === 'PLAYING') {
        ctx.fillStyle = '#00FFFF'; ctx.shadowBlur = 10; ctx.shadowColor = '#00FFFF';
        
        let drawPositions = [player.x];
        if (playerUpgrades.parallel > 0) drawPositions.push(player.x - 70, player.x + 70);
        
        for (let px of drawPositions) {
            ctx.fillRect(px + player.width/2 - 10, 0, 20, player.y);
        }
        ctx.shadowBlur = 0; 
    }

    let spacing = 55;
    let startX = player.x + player.width/2 - ((playerWalls.length-1)*spacing)/2;
    for (let i = 0; i < playerWalls.length; i++) {
        if (playerWalls[i].active) {
            ctx.fillStyle = '#00FFCC'; 
            ctx.fillRect(startX + i*spacing - 15, player.y - 40, 30, 15);
        }
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

    if (playerUpgrades.parallel > 0 && gameState === 'PLAYING') {
        ctx.globalAlpha = 0.4;
        ctx.drawImage(playerImg, player.x - 70, player.y, player.width, player.height);
        ctx.drawImage(playerImg, player.x + 70, player.y, player.width, player.height);
        ctx.globalAlpha = 1.0;
    }
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

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
    
    for (let ab of alienBullets) {
        ctx.fillStyle = ab.damage === 2 ? '#FF00FF' : '#FF0055'; 
        ctx.beginPath(); 
        if (ab.damage === 2) {
            ctx.arc(ab.x + ab.width/2, ab.y + ab.height/2, ab.width/2, 0, Math.PI*2);
        } else {
            ctx.roundRect(ab.x, ab.y, ab.width, ab.height, 4); 
        }
        ctx.fill();
    }

    for (let a of aliens) {
        if (a.type !== 'normal') {
            ctx.fillStyle = a.type === 'blue' ? 'rgba(0, 150, 255, 0.4)' :
                            a.type === 'yellow' ? 'rgba(255, 255, 0, 0.4)' :
                            a.type === 'red' ? 'rgba(255, 50, 50, 0.4)' :
                            a.type === 'boss' ? 'rgba(255, 0, 255, 0.5)' :
                            'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(a.x + a.width/2, a.y + a.height/2, a.width*0.8, 0, Math.PI*2);
            ctx.fill();
        }
        
        ctx.drawImage(alienImg, a.x, a.y, a.width, a.height);
        
        if (a.type === 'boss') {
            ctx.fillStyle = 'red';
            ctx.fillRect(a.x, a.y - 15, a.width, 8);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(a.x, a.y - 15, a.width * (a.hp / 100), 8); 
        }
    }

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

    ctx.fillStyle = '#FFFFFF'; ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('High Score: ' + highScore, 10, 60); 
    ctx.fillText('Próx Poder: ' + nextUpgradeScore, 10, 90); 
    
    ctx.fillText('Fase: ' + fase, canvas.width - 130, 30);
    ctx.fillStyle = '#00FFCC'; ctx.fillText('Nível: ' + playerLevel, canvas.width - 130, 60);
    ctx.fillStyle = (lives < 4) ? '#FF5555' : '#FFFFFF';
    ctx.fillText('Vidas: ' + lives + '/' + maxLives, canvas.width - 130, 90);

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