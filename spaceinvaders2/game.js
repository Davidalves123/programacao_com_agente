const canvas = document.getElementById('gameCanvas');
// O canvas inicia com o tamanho do menu (Solo)
canvas.width = 800;
canvas.style.maxWidth = '100%';
canvas.style.height = 'auto';
const ctx = canvas.getContext('2d');

// Carregamento de todas as imagens
const playerImg = new Image(); playerImg.src = 'nave.png'; 
const alienImg = new Image(); alienImg.src = 'alien.png';
const ship4Img = new Image(); ship4Img.src = 'Ship_4.png';
const ship5Img = new Image(); ship5Img.src = 'Ship_5.png';
const ship2Img = new Image(); ship2Img.src = 'Ship_2.png';
const ship3Img = new Image(); ship3Img.src = 'Ship_3.png';
const skins = [playerImg, ship4Img, ship5Img, ship2Img, ship3Img];

const backgroundMusic = {
    context: null,
    masterGain: null,
    intervalId: null,
    started: false,
    step: 0,
    phraseIndex: 0,
    musicMode: 'menu',
    phrases: [
        [261.63, 329.63, 392.00, 523.25, 392.00, 349.23, 293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00, 349.23],
        [293.66, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00, 349.23, 392.00, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00],
        [329.63, 392.00, 493.88, 587.33, 523.25, 440.00, 392.00, 329.63, 349.23, 440.00, 523.25, 587.33, 659.25, 587.33, 523.25, 493.88],
        [220.00, 293.66, 329.63, 392.00, 493.88, 440.00, 392.00, 329.63, 293.66, 349.23, 392.00, 440.00, 392.00, 349.23, 329.63, 293.66]
    ],
    bass: [130.81, 146.83, 164.81, 196.00, 146.83, 164.81, 174.61, 220.00]
};

function playMusicTone(frequency, duration, type = 'triangle', volume = 0.04, delay = 0) {
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;

    const { context, masterGain } = backgroundMusic;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = context.currentTime + delay;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
}

function playShootSound() {
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;

    const { context, masterGain } = backgroundMusic;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = context.currentTime;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(720, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(190, startAt + 0.08);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.045, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.09);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.start(startAt);
    oscillator.stop(startAt + 0.1);
}

function playEnemyKillSound() {
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;

    const { context, masterGain } = backgroundMusic;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startAt = context.currentTime;

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(260, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(90, startAt + 0.12);

    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.05, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.13);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);

    oscillator.start(startAt);
    oscillator.stop(startAt + 0.14);
}

function playLoseSound() {
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;

    const { context, masterGain } = backgroundMusic;
    const notes = [220, 164.81, 130.81];

    notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const startAt = context.currentTime + index * 0.11;

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, startAt);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.4), startAt + 0.22);

        gainNode.gain.setValueAtTime(0.0001, startAt);
        gainNode.gain.exponentialRampToValueAtTime(0.04, startAt + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.25);

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.3);
    });
}

function playPowerSound(powerType) {
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;

    const { context, masterGain } = backgroundMusic;
    const tones = {
        lightning: [360, 520],
        spell: [220, 330],
        gradient: [260, 440],
        homing: [420, 660],
        laser: [180, 300],
        health: [540, 700],
        speed: [660, 840],
        default: [440, 560]
    };
    const frequencies = tones[powerType] || tones.default;

    frequencies.forEach((frequency, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + index * 0.05;

        osc.type = index === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(frequency, startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.025, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startAt);
        osc.stop(startAt + 0.19);
    });
}

function playMenuSound() {
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;

    const { context, masterGain } = backgroundMusic;
    const notes = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66, 261.63];

    notes.forEach((frequency, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + index * 0.14;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.018, startAt + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.24);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startAt);
        osc.stop(startAt + 0.26);
    });
}

function playStartGameSound() {
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;

    const { context, masterGain } = backgroundMusic;
    const notes = [220, 293.66, 392.00, 523.25];

    notes.forEach((frequency, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        const startAt = context.currentTime + index * 0.08;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, startAt);

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.04, startAt + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startAt);
        osc.stop(startAt + 0.24);
    });
}

function playBackgroundMusicStep() {
    if (!backgroundMusic.context || !backgroundMusic.masterGain || backgroundMusic.musicMode !== 'gameplay') return;

    const phrase = backgroundMusic.phrases[backgroundMusic.phraseIndex];
    const lead = phrase[backgroundMusic.step % phrase.length];
    const bass = backgroundMusic.bass[backgroundMusic.step % backgroundMusic.bass.length];

    playMusicTone(lead, 0.18 + ((backgroundMusic.step % 4 === 0) ? 0.04 : 0), backgroundMusic.step % 3 === 0 ? 'triangle' : 'sine', 0.032, 0);
    playMusicTone(bass, 0.26, 'sine', 0.018, 0.02);

    if (backgroundMusic.step % 2 === 0) {
        playMusicTone(lead * 1.5, 0.12, 'square', 0.012, 0.04);
    }

    if (backgroundMusic.step % 8 === 0) {
        playMusicTone(lead / 2, 0.18, 'triangle', 0.016, 0.08);
    }

    backgroundMusic.step += 1;
    if (backgroundMusic.step % 16 === 0) {
        backgroundMusic.phraseIndex = (backgroundMusic.phraseIndex + 1) % backgroundMusic.phrases.length;
    }
}

function playMenuThemeStep() {
    if (!backgroundMusic.context || !backgroundMusic.masterGain || backgroundMusic.musicMode !== 'menu') return;

    const menuNotes = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66, 261.63];
    const note = menuNotes[backgroundMusic.step % menuNotes.length];

    playMusicTone(note, 0.24, 'triangle', 0.09, 0);
    if (backgroundMusic.step % 2 === 0) {
        playMusicTone(note / 2, 0.3, 'sine', 0.055, 0.02);
    }

    backgroundMusic.step += 1;
}

function ensureAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!backgroundMusic.context) {
        backgroundMusic.context = new AudioContextClass();
        backgroundMusic.masterGain = backgroundMusic.context.createGain();
        backgroundMusic.masterGain.gain.value = 0.7;
        backgroundMusic.masterGain.connect(backgroundMusic.context.destination);
    }

    if (backgroundMusic.context.state === 'suspended') {
        backgroundMusic.context.resume();
    }

    return backgroundMusic.context;
}

function startMenuMusic() {
    ensureAudioContext();
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;
    if (backgroundMusic.musicMode === 'menu' && backgroundMusic.intervalId) return;

    backgroundMusic.musicMode = 'menu';
    backgroundMusic.started = true;
    backgroundMusic.step = 0;
    clearInterval(backgroundMusic.intervalId);
    backgroundMusic.intervalId = setInterval(playMenuThemeStep, 260);
    playMenuThemeStep();
}

function startBackgroundMusic() {
    ensureAudioContext();
    if (!backgroundMusic.context || !backgroundMusic.masterGain) return;
    if (backgroundMusic.musicMode === 'gameplay' && backgroundMusic.intervalId) return;

    backgroundMusic.musicMode = 'gameplay';
    backgroundMusic.started = true;
    backgroundMusic.step = 0;
    backgroundMusic.phraseIndex = 0;
    clearInterval(backgroundMusic.intervalId);
    backgroundMusic.intervalId = setInterval(playBackgroundMusicStep, 200);
    playBackgroundMusicStep();
}

// ==========================================
// MÁQUINA DE ESTADOS DO JOGO GLOBAL
// ==========================================
let gameState = 'START'; // START, PLAYING, P1_UPGRADE, P2_UPGRADE, P1_WIN, P2_WIN, GAMEOVER
let gameMode = 'SOLO';   // 'SOLO' ou 'MULTI'
let highScore = parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0;

let p1, p2; // Instâncias dos jogadores

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

// ==========================================
// CLASSE INDIVIDUAL DO JOGADOR
// ==========================================
class PlayerBoard {
    constructor(id, offsetX) {
        this.id = id;
        this.offsetX = offsetX;
        this.gameWidth = 800; 
        this.gameHeight = 600;

        this.score = 0;
        this.fase = 1;
        this.playerLevel = 1;
        this.maxLives = 10;
        this.lives = this.maxLives;
        this.nextUpgradeScore = 300;
        this.lastBossFase = 0;

        this.playerUpgrades = {
            speed: 0, multishot: 0, health: 0, pierce: 0, explosive: 0,
            spell: 0, turret: 0, homing: 0, laser: 0, wall: 0, doublexp: 0,
            buffer: 0, dash: 0, lifo: 0, drones: 0, chain: 0, parallel: 0, gradient: 0, echo: 0
        };

        this.upgradeChoices = [];
        this.explosions = [];
        this.spellZones = [];
        this.playerWalls = [];
        this.lightnings = [];
        this.gradientWells = [];
        this.lifoStack = [];
        this.effects = [];

        this.lastTurretShot = 0;
        this.lastSpellTime = 0;
        this.lastLifoPop = 0;
        this.lastGradientTime = 0;
        this.lastEchoTime = 0;
        this.bufferStacks = 0;
        this.bufferTimer = 0;
        this.lastLeftTap = 0;
        this.lastRightTap = 0;
        this.dashCooldown = 0;

        this.keys = { left: false, right: false, shoot: false };

        this.player = { width: 50, height: 30, x: this.gameWidth / 2 - 25, y: this.gameHeight - 50, speed: 6 };
        this.bullets = [];
        this.alienBullets = [];
        this.bulletSpeed = 7;
        this.fireRate = 250;
        this.lastShotTime = 0;

        this.aliens = [];
        this.alienWidth = 40;
        this.alienHeight = 30;
        this.baseAlienSpeed = 1.0;
        this.alienSpawnRate = 1200;
        this.lastAlienSpawnTime = 0;
    }

    atualizarNave() {
        let index = Math.floor(this.playerLevel / 3); 
        if (index >= skins.length) index = skins.length - 1; 
        return skins[index];
    }

    generateUpgrades() {
        this.upgradeChoices = [];
        let available = UPGRADES_DEF.filter(u => (this.playerUpgrades[u.id] || 0) < u.max);
        for(let i=0; i<3; i++) {
            if (available.length === 0) break;
            let r = Math.random();
            let rarity = (r<0.05)?'Lendário':(r<0.20)?'Épico':(r<0.50)?'Raro':'Comum';
            
            let pool = available.filter(u => u.rarity === rarity);
            if (pool.length === 0) pool = available.filter(u => u.rarity === 'Comum');
            if (pool.length === 0) pool = available; 
            
            let chosen = pool[Math.floor(Math.random() * pool.length)];
            this.upgradeChoices.push(chosen);
            available = available.filter(u => u.id !== chosen.id); 
        }
    }

    applyUpgrade(upgrade) {
        this.playerUpgrades[upgrade.id]++;
        this.playerLevel++; 
        if (upgrade.id === 'health') {
            this.maxLives += 5;
            this.lives += 5;
        }
        if (upgrade.id === 'wall') this.playerWalls.push({ active: true });

        playPowerSound(upgrade.id);
        this.spawnEffect(upgrade.id, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, upgrade.id === 'health' ? '#7CFF8A' : upgrade.id === 'speed' ? '#FFDB70' : upgrade.id === 'laser' ? '#00FFFF' : upgrade.id === 'spell' ? '#B98DFF' : upgrade.id === 'gradient' ? '#A94DFF' : '#FFFFFF', 34, 420);
        
        this.nextUpgradeScore += 300;
        gameState = 'PLAYING';
        this.keys.shoot = false; 
    }

    spawnEffect(type, x, y, color = '#FFFFFF', size = 30, duration = 500) {
        this.effects.push({
            type,
            x,
            y,
            color,
            size,
            duration,
            createdAt: Date.now()
        });
    }

    triggerLightning(startX, startY, jumpsLeft) {
        if (jumpsLeft <= 0) return;
        let closest = null, minDist = 180;
        for (let a of this.aliens) {
            if (a.shocked) continue;
            let d = Math.hypot(a.x + a.width/2 - startX, a.y + a.height/2 - startY);
            if (d < minDist) { minDist = d; closest = a; }
        }
        if (closest) {
            closest.shocked = true;
            if (this.lightnings.length < 40) {
                this.lightnings.push({
                    x1: startX, y1: startY, 
                    x2: closest.x + closest.width/2, y2: closest.y + closest.height/2, 
                    timer: Date.now()
                });
            }
            this.spawnEffect('lightning', startX, startY, '#66D9FF', 28, 220);
            this.damageAlien(this.aliens.indexOf(closest), closest);
            this.triggerLightning(closest.x + closest.width/2, closest.y + closest.height/2, jumpsLeft - 1);
        }
    }

    spawnSpecificAlien(x, y, type) {
        x = Math.max(0, Math.min(this.gameWidth - this.alienWidth, x));
        let speedMods = type === 'white' ? 0.5 : 1.0;
        this.aliens.push({
            x: x, y: y, width: this.alienWidth, height: this.alienHeight,
            baseSpeed: (this.baseAlienSpeed + (this.fase * 0.15)) * speedMods, 
            shocked: false, type: type, hp: 1, lastShot: Date.now()
        });
    }

    damageAlien(index, alien) {
        if (index === -1) return;
        if (alien.hp > 1) {
            alien.hp--;
        } else {
            this.killAlien(index, alien);
        }
    }

    killAlien(index, alien) {
        if (index === -1) return;
        this.aliens.splice(index, 1);
        
        if (alien.type === 'white') {
            this.spawnSpecificAlien(alien.x - 25, alien.y, 'normal');
            this.spawnSpecificAlien(alien.x + 25, alien.y, 'normal');
        }
        
        if (this.playerUpgrades.buffer > 0) {
            this.bufferStacks = Math.min(this.bufferStacks + 1, 10);
            this.bufferTimer = Date.now() + 2000; 
        }

        if (this.playerUpgrades.explosive > 0 && this.explosions.length < 20) {
            this.explosions.push({
                x: alien.x + alien.width/2, y: alien.y + alien.height/2, 
                radius: 10, maxRadius: 60, hitAliens: []
            });
            this.spawnEffect('explosive', alien.x + alien.width/2, alien.y + alien.height/2, '#FF8A00', 40, 320);
        }

        playEnemyKillSound();
        
        let pts = (alien.type === 'boss' ? 100 : 10) * (this.playerUpgrades.doublexp > 0 ? 2 : 1);
        this.score += pts;
        
        let novaFase = Math.floor(this.score / 100) + 1;
        if (novaFase > this.fase) {
            let fasesPulas = novaFase - this.fase;
            this.fase = novaFase;
            this.lives = this.maxLives; 
            for (let k = 0; k < fasesPulas; k++) {
                if (this.alienSpawnRate > 400) this.alienSpawnRate -= 50;
            }
            for (let w = 0; w < this.playerWalls.length; w++) {
                this.playerWalls[w].active = true;
            }
        }
        
        if (this.score > highScore) highScore = this.score;

        if (this.score >= this.nextUpgradeScore) {
            gameState = this.id === 1 ? 'P1_UPGRADE' : 'P2_UPGRADE';
            this.generateUpgrades();
        }
    }

    update() {
        const now = Date.now(); 
        
        if (now > this.bufferTimer) this.bufferStacks = 0;
        
        let currentSpeed = this.player.speed * (1 + (this.playerUpgrades.speed * 0.1));
        if (this.keys.left) this.player.x -= currentSpeed;
        if (this.keys.right) this.player.x += currentSpeed;
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.gameWidth) this.player.x = this.gameWidth - this.player.width;

        let isShootingLaser = (this.keys.shoot && this.playerUpgrades.laser > 0);
        let isHoming = this.playerUpgrades.homing > 0;
        let dynamicFireRate = this.fireRate * Math.pow(0.95, this.bufferStacks);
        let currentFireRate = isHoming ? dynamicFireRate / 0.4 : dynamicFireRate;
        
        let shootPositions = [this.player.x];
        if (this.playerUpgrades.parallel > 0) shootPositions.push(this.player.x - 70, this.player.x + 70);

        if (this.keys.shoot && now - this.lastShotTime > currentFireRate && !isShootingLaser) {
            let currentBulletSpeed = isHoming ? this.bulletSpeed * 0.5 : this.bulletSpeed;
            
            let mult = Math.min(this.playerUpgrades.multishot, 2);
            let offsets = [];
            if (mult === 0) offsets = [0];
            else if (mult === 1) offsets = [-15, 15];
            else if (mult === 2) offsets = [-20, 0, 20];

            playShootSound();

            for(let px of shootPositions) { 
                for (let offsetX of offsets) {
                    this.bullets.push({
                        x: px + this.player.width / 2 - 2.5 + offsetX,
                        y: this.player.y,
                        vx: 0, vy: -currentBulletSpeed, 
                        width: 5, height: 15, speed: currentBulletSpeed,
                        pierceLeft: this.playerUpgrades.pierce,
                        hitAliens: [], isHoming: isHoming, isTurret: false, isEcho: false,
                        hasLooped: false
                    });
                }
            }
            this.lastShotTime = now; 
        }

        if (this.playerUpgrades.echo > 0 && this.keys.shoot && now - this.lastEchoTime > 8000) {
            this.bullets.push({
                x: this.player.x + this.player.width/2 - 10, y: this.player.y, 
                vx: 0, vy: -this.bulletSpeed * 1.5,
                width: 20, height: 20, speed: this.bulletSpeed * 1.5, 
                pierceLeft: 999, hitAliens: [], isHoming: false, isTurret: false, isEcho: true, hasLooped: false
            });
            this.lastEchoTime = now;
        }

        const turretPos = [
            {x: 30, y: 30}, {x: this.gameWidth-30, y: 30},
            {x: 30, y: this.gameHeight-30}, {x: this.gameWidth-30, y: this.gameHeight-30}
        ];
        if (this.playerUpgrades.turret > 0 && now - this.lastTurretShot > 1000) {
            for (let i = 0; i < this.playerUpgrades.turret; i++) {
                this.bullets.push({
                    x: turretPos[i].x, y: turretPos[i].y, vx: 0, vy: -this.bulletSpeed * 0.4,
                    width: 8, height: 8, speed: this.bulletSpeed * 0.4, 
                    pierceLeft: 0, hitAliens: [], isHoming: true, isTurret: true, isEcho: false, hasLooped: false
                });
            }
            this.lastTurretShot = now;
        }

        if (this.playerUpgrades.spell > 0 && now - this.lastSpellTime > 4000) {
            const spellX = Math.random()*(this.gameWidth-100)+50;
            const spellY = Math.random()*(this.gameHeight/2)+50;
            this.spellZones.push({x: spellX, y: spellY, radius: 80, spawnTime: now});
            this.spawnEffect('spell', spellX, spellY, '#B98DFF', 54, 600);
            playPowerSound('spell');
            this.lastSpellTime = now;
        }
        this.spellZones = this.spellZones.filter(s => now - s.spawnTime < 3000); 

        if (this.playerUpgrades.gradient > 0 && now - this.lastGradientTime > 8000) {
            const gradX = Math.random()*(this.gameWidth-200)+100;
            const gradY = Math.random()*(this.gameHeight/2 - 100)+100;
            this.gradientWells.push({x: gradX, y: gradY, spawnTime: now});
            this.spawnEffect('gradient', gradX, gradY, '#A94DFF', 58, 800);
            playPowerSound('gradient');
            this.lastGradientTime = now;
        }
        this.gradientWells = this.gradientWells.filter(g => now - g.spawnTime < 4000);

        let currentSpawnRate = this.alienSpawnRate;
        if (this.fase >= 31) currentSpawnRate /= 2.0;
        else if (this.fase >= 21) currentSpawnRate /= 1.5;

        if (now - this.lastAlienSpawnTime > currentSpawnRate) {
            if (this.fase > 0 && this.fase % 20 === 0 && this.fase !== this.lastBossFase) {
                this.aliens.push({ 
                    x: this.gameWidth / 2 - 50, y: -100, 
                    width: 100, height: 100, 
                    baseSpeed: 0.4, 
                    shocked: false, type: 'boss', hp: 100, 
                    lastShot: now 
                });
                this.lastBossFase = this.fase;
                this.lastAlienSpawnTime = now;
            } else {
                let spawnType = 'normal';
                let spawnHp = 1;
                let rand = Math.random();
                
                if (this.fase >= 20 && rand < 0.05) { spawnType = 'white'; spawnHp = 1; }
                else if (this.fase >= 15 && rand < 0.10) { spawnType = 'red'; spawnHp = 2; }
                else if (this.fase >= 10 && rand < 0.15) { spawnType = 'yellow'; spawnHp = 1; }
                else if (this.fase >= 5 && rand < 0.20) { spawnType = 'blue'; spawnHp = 1; }

                let speedMods = spawnType === 'white' ? 0.5 : 1.0;
                
                this.aliens.push({ 
                    x: Math.random() * (this.gameWidth - this.alienWidth), y: -this.alienHeight, 
                    width: this.alienWidth, height: this.alienHeight, 
                    baseSpeed: (this.baseAlienSpeed + (this.fase * 0.15)) * speedMods, 
                    shocked: false, type: spawnType, hp: spawnHp, 
                    lastShot: Date.now() + Math.random()*1000 
                });
                this.lastAlienSpawnTime = now;
            }
        }

        this.effects = this.effects.filter(effect => Date.now() - effect.createdAt < effect.duration);

        for (let i = this.alienBullets.length - 1; i >= 0; i--) {
            let ab = this.alienBullets[i];
            ab.x += ab.vx || 0;
            ab.y += ab.vy || ab.speed;
            
            if (ab.x < this.player.x + this.player.width && ab.x + ab.width > this.player.x &&
                ab.y < this.player.y + this.player.height && ab.y + ab.height > this.player.y) {
                
                this.lives -= (ab.damage || 1); 
                this.alienBullets.splice(i, 1);
                
                if (this.lives <= 0) {
                    playLoseSound();
                    if (gameMode === 'SOLO') {
                        gameState = 'GAMEOVER';
                        localStorage.setItem('spaceInvadersHighScore', highScore);
                    } else {
                        declareWinner(this.id === 1 ? 2 : 1);
                    }
                }
                continue;
            }
            if (ab.y > this.gameHeight || ab.x < -50 || ab.x > this.gameWidth + 50) this.alienBullets.splice(i, 1);
        }

        for (let i = this.explosions.length - 1; i >= 0; i--) {
            let exp = this.explosions[i];
            exp.radius += 3;
            for (let j = this.aliens.length - 1; j >= 0; j--) {
                let alien = this.aliens[j];
                if (!exp.hitAliens.includes(alien) && Math.hypot((alien.x + alien.width/2) - exp.x, (alien.y + alien.height/2) - exp.y) < exp.radius) {
                    exp.hitAliens.push(alien);
                    this.damageAlien(j, alien);
                }
            }
            if (exp.radius > exp.maxRadius) this.explosions.splice(i, 1);
        }
        
        this.lightnings = this.lightnings.filter(l => now - l.timer < 300);

        let spacing = 55;
        let startX = this.player.x + this.player.width/2 - ((this.playerWalls.length-1)*spacing)/2;
        
        for (let i = this.aliens.length - 1; i >= 0; i--) {
            let alien = this.aliens[i];
            let currentAlienSpeed = alien.baseSpeed;
            
            if (alien.type === 'yellow') {
                let dx = (this.player.x + this.player.width/2) - (alien.x + alien.width/2);
                alien.x += Math.sign(dx) * 0.5;
            }
            
            if (alien.type === 'blue' && now - alien.lastShot > 1250) {
                this.alienBullets.push({
                    x: alien.x + alien.width/2 - 3, y: alien.y + alien.height,
                    width: 6, height: 16, vx: 0, vy: 4, damage: 1
                });
                alien.lastShot = now;
            }
            
            if (alien.type === 'boss' && now - alien.lastShot > 2000) {
                for (let angle = -0.4; angle <= 0.41; angle += 0.2) {
                    this.alienBullets.push({
                        x: alien.x + alien.width/2 - 6, y: alien.y + alien.height - 10,
                        width: 12, height: 12, 
                        vx: Math.sin(angle) * 5, vy: Math.cos(angle) * 5, damage: 2
                    });
                }
                alien.lastShot = now;
            }

            for (let s of this.spellZones) {
                if (Math.hypot((alien.x + alien.width/2) - s.x, (alien.y + alien.height/2) - s.y) < s.radius) {
                    currentAlienSpeed *= 0.3; break;
                }
            }
            for (let g of this.gradientWells) {
                let dx = g.x - (alien.x + alien.width/2);
                let dy = g.y - (alien.y + alien.height/2);
                if (Math.hypot(dx, dy) < 250) {
                    alien.x += dx * 0.03; alien.y += dy * 0.03; currentAlienSpeed *= 0.1; 
                }
            }
            
            alien.y += currentAlienSpeed;

            if (alien.x < this.player.x + this.player.width && alien.x + alien.width > this.player.x &&
                alien.y < this.player.y + this.player.height && alien.y + alien.height > this.player.y) {
                
                this.lives -= 3;
                this.killAlien(i, alien);
                
                if (this.lives <= 0) {
                    playLoseSound();
                    if (gameMode === 'SOLO') {
                        gameState = 'GAMEOVER';
                        localStorage.setItem('spaceInvadersHighScore', highScore);
                    } else {
                        declareWinner(this.id === 1 ? 2 : 1);
                    }
                }
                continue; 
            }

            let hitShield = false;
            for (let w = 0; w < this.playerWalls.length; w++) {
                let wx = startX + w*spacing - 15, wy = this.player.y - 40;
                if (this.playerWalls[w].active && alien.x < wx + 30 && alien.x + alien.width > wx && alien.y < wy + 15 && alien.y + alien.height > wy) {
                    this.playerWalls[w].active = false;
                    this.damageAlien(i, alien);
                    hitShield = true; break;
                }
            }
            if (hitShield) continue;

            if (this.playerUpgrades.drones > 0) {
                let numDrones = this.playerUpgrades.drones;
                for(let d=0; d<numDrones; d++) {
                    let angle = now * 0.003 + (Math.PI * 2 / numDrones) * d;
                    let dx = this.player.x + this.player.width/2 + Math.cos(angle) * 80;
                    let dy = this.player.y + this.player.height/2 + Math.sin(angle) * 80;
                    if (Math.hypot((alien.x + alien.width/2) - dx, (alien.y + alien.height/2) - dy) < (alien.type === 'boss' ? 60 : 30)) {
                        this.damageAlien(i, alien);
                        hitShield = true; break;
                    }
                }
            }
            if (hitShield) continue;

            if (alien.y > this.gameHeight) {
                this.aliens.splice(i, 1);
                this.lives--;             
                if (this.lives <= 0) {
                    playLoseSound();
                    if (gameMode === 'SOLO') {
                        gameState = 'GAMEOVER';
                        localStorage.setItem('spaceInvadersHighScore', highScore);
                    } else {
                        declareWinner(this.id === 1 ? 2 : 1);
                    }
                }
            }
        }

        if (isShootingLaser) {
            for (let px of shootPositions) {
                for (let j = this.aliens.length - 1; j >= 0; j--) {
                    if (this.aliens[j].x < px + this.player.width / 2 + 10 && this.aliens[j].x + this.aliens[j].width > px + this.player.width / 2 - 10) {
                        this.damageAlien(j, this.aliens[j]);
                    }
                }
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let bullet = this.bullets[i];
            
            if (bullet.isHoming) {
                let nearest = null, minDist = Infinity;
                for (let a of this.aliens) {
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
                } else if (this.playerUpgrades.lifo > 0 && !bullet.hasLooped) {
                    this.lifoStack.push({x: bullet.x, speed: bullet.speed}); 
                    this.bullets.splice(i, 1); continue;
                }
            }
            
            if (bullet.isEcho && bullet.vy > 0 && bullet.y > this.player.y && Math.abs(bullet.x - this.player.x) < 50) {
                this.lives = Math.min(this.lives + 1, this.maxLives);
                this.score += 50;
                this.aliens.forEach(a => a.y = Math.max(-50, a.y - 150)); 
                this.bullets.splice(i, 1); continue;
            }

            let bulletHit = false; 
            for (let j = this.aliens.length - 1; j >= 0; j--) {
                let alien = this.aliens[j];
                if (bullet.hitAliens.includes(alien)) continue;

                if (bullet.x < alien.x + alien.width && bullet.x + bullet.width > alien.x &&
                    bullet.y < alien.y + alien.height && bullet.y + bullet.height > alien.y) {
                    
                    bullet.hitAliens.push(alien);
                    this.damageAlien(j, alien);
                    
                    if (this.playerUpgrades.chain > 0 && !bullet.isEcho && !bullet.isTurret) {
                        this.triggerLightning(alien.x + alien.width/2, alien.y + alien.height/2, this.playerUpgrades.chain);
                    }

                    if (bullet.isHoming && !bullet.isTurret) {
                        if (this.explosions.length < 20) {
                            this.explosions.push({x: bullet.x, y: bullet.y, radius: 10, maxRadius: 50, hitAliens: []});
                        }
                        bulletHit = true; break;
                    }
                    if (bullet.pierceLeft > 0) bullet.pierceLeft--;
                    else { bulletHit = true; break; }
                }
            }
            
            if (bulletHit || bullet.y < -50 || bullet.x < -50 || bullet.x > this.gameWidth + 50 || bullet.y > this.gameHeight + 50) {
                this.bullets.splice(i, 1);
            }
        }

        if (this.lifoStack.length > 0 && now - this.lastLifoPop > 150) {
            let b = this.lifoStack.pop();
            this.bullets.push({
                x: b.x, y: this.gameHeight, vx: 0, vy: -b.speed, 
                width: 5, height: 15, speed: b.speed, pierceLeft: this.playerUpgrades.pierce, 
                hitAliens: [], isHoming: false, isTurret: false, isEcho: false, hasLooped: true 
            });
            this.lastLifoPop = now;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.offsetX, 0);

        ctx.beginPath();
        ctx.rect(0, 0, this.gameWidth, this.gameHeight);
        ctx.clip();

        let hue = (this.fase * 20) % 360; 
        ctx.fillStyle = `hsl(${hue}, 40%, 12%)`; ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        for (let g of this.gradientWells) {
            let pulse = Math.abs(Math.sin(Date.now() * 0.005)) * 10;
            let grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, 200);
            grad.addColorStop(0, '#000000');
            grad.addColorStop(0.5, 'rgba(50, 0, 100, 0.4)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(g.x, g.y, 200 + pulse, 0, Math.PI * 2); ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(170, 0, 255, 0.2)';
        for (let s of this.spellZones) {
            ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
        }

        if (this.keys.shoot && this.playerUpgrades.laser > 0 && gameState === 'PLAYING') {
            ctx.fillStyle = '#00FFFF'; ctx.shadowBlur = 10; ctx.shadowColor = '#00FFFF';
            let drawPositions = [this.player.x];
            if (this.playerUpgrades.parallel > 0) drawPositions.push(this.player.x - 70, this.player.x + 70);
            for (let px of drawPositions) {
                ctx.fillRect(px + this.player.width/2 - 10, 0, 20, this.player.y);
            }
            ctx.shadowBlur = 0; 
        }

        let spacing = 55;
        let startX = this.player.x + this.player.width/2 - ((this.playerWalls.length-1)*spacing)/2;
        for (let i = 0; i < this.playerWalls.length; i++) {
            if (this.playerWalls[i].active) {
                ctx.fillStyle = '#00FFCC'; 
                ctx.fillRect(startX + i*spacing - 15, this.player.y - 40, 30, 15);
            }
        }
        
        if (this.playerUpgrades.drones > 0) {
            ctx.fillStyle = '#00FFCC';
            let numDrones = this.playerUpgrades.drones;
            for(let d=0; d<numDrones; d++) {
                let angle = Date.now() * 0.003 + (Math.PI * 2 / numDrones) * d;
                let dx = this.player.x + this.player.width/2 + Math.cos(angle) * 80;
                let dy = this.player.y + this.player.height/2 + Math.sin(angle) * 80;
                ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI*2); ctx.fill();
            }
        }

        let skinObj = this.atualizarNave();

        if (this.playerUpgrades.parallel > 0 && gameState === 'PLAYING') {
            ctx.globalAlpha = 0.4;
            ctx.drawImage(skinObj, this.player.x - 70, this.player.y, this.player.width, this.player.height);
            ctx.drawImage(skinObj, this.player.x + 70, this.player.y, this.player.width, this.player.height);
            ctx.globalAlpha = 1.0;
        }
        ctx.drawImage(skinObj, this.player.x, this.player.y, this.player.width, this.player.height);

        const turretPos = [{x: 30, y: 30}, {x: this.gameWidth-30, y: 30}, {x: 30, y: this.gameHeight-30}, {x: this.gameWidth-30, y: this.gameHeight-30}];
        for (let i = 0; i < this.playerUpgrades.turret; i++) {
            let pos = turretPos[i];
            ctx.fillStyle = '#666'; ctx.fillRect(pos.x-12, pos.y-12, 24, 24);
            ctx.fillStyle = '#F00'; ctx.fillRect(pos.x-4, pos.y, 8, 18);
        }

        for (let b of this.bullets) {
            if (b.isEcho) { ctx.fillStyle = '#00FFAA'; ctx.beginPath(); ctx.arc(b.x+b.width/2, b.y+b.height/2, b.width/2, 0, Math.PI*2); ctx.fill(); }
            else {
                ctx.fillStyle = b.isHoming ? (b.isTurret ? '#FFAA00' : '#FF4400') : '#FFFF00';
                ctx.beginPath();
                if (b.isHoming) ctx.arc(b.x+b.width/2, b.y+b.height/2, b.width, 0, Math.PI*2);
                else ctx.roundRect(b.x, b.y, b.width, b.height, 2);
                ctx.fill();
            }
        }
        
        for (let ab of this.alienBullets) {
            ctx.fillStyle = ab.damage === 2 ? '#FF00FF' : '#FF0055'; 
            ctx.beginPath(); 
            if (ab.damage === 2) {
                ctx.arc(ab.x + ab.width/2, ab.y + ab.height/2, ab.width/2, 0, Math.PI*2);
            } else {
                ctx.roundRect(ab.x, ab.y, ab.width, ab.height, 4); 
            }
            ctx.fill();
        }

        for (let a of this.aliens) {
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
                ctx.fillStyle = 'red'; ctx.fillRect(a.x, a.y - 15, a.width, 8);
                ctx.fillStyle = '#00FF00'; ctx.fillRect(a.x, a.y - 15, a.width * (a.hp / 100), 8); 
            }
        }

        for (let exp of this.explosions) {
            ctx.fillStyle = `rgba(255, 100, 0, ${1 - (exp.radius/exp.maxRadius)})`;
            ctx.beginPath(); ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2); ctx.fill();
        }

        for (let effect of this.effects) {
            const elapsed = Date.now() - effect.createdAt;
            const progress = Math.min(1, elapsed / effect.duration);
            const alpha = 1 - progress;
            ctx.save();

            if (effect.type === 'lightning') {
                ctx.strokeStyle = `rgba(102, 217, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(effect.x, effect.y);
                for (let i = 1; i <= 5; i++) {
                    const px = effect.x + (i - 0.5) * 10;
                    const py = effect.y + (i % 2 === 0 ? -18 : 18) * (1 + progress * 0.5);
                    ctx.lineTo(px, py);
                }
                ctx.stroke();
            } else if (effect.type === 'spell') {
                ctx.strokeStyle = `rgba(185, 141, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size * (0.55 + progress), 0, Math.PI * 2);
                ctx.stroke();
            } else if (effect.type === 'gradient') {
                const grad = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.size * (0.7 + progress));
                grad.addColorStop(0, 'rgba(255,255,255,0.6)');
                grad.addColorStop(0.5, `rgba(169, 77, 255, ${alpha * 0.7})`);
                grad.addColorStop(1, 'rgba(169, 77, 255, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size * (0.9 + progress), 0, Math.PI * 2);
                ctx.fill();
            } else if (effect.type === 'explosive') {
                ctx.strokeStyle = `rgba(255, 138, 0, ${alpha})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size * (0.25 + progress), 0, Math.PI * 2);
                ctx.stroke();
            } else if (effect.type === 'health') {
                ctx.strokeStyle = `rgba(124, 255, 138, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(effect.x - effect.size, effect.y);
                ctx.lineTo(effect.x + effect.size, effect.y);
                ctx.moveTo(effect.x, effect.y - effect.size);
                ctx.lineTo(effect.x, effect.y + effect.size);
                ctx.stroke();
            } else if (effect.type === 'speed') {
                ctx.strokeStyle = `rgba(255, 219, 112, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(effect.x - effect.size, effect.y);
                ctx.lineTo(effect.x, effect.y - effect.size * 0.6);
                ctx.lineTo(effect.x + effect.size, effect.y);
                ctx.stroke();
            } else {
                ctx.fillStyle = effect.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size * (0.4 + progress), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
        
        ctx.strokeStyle = '#00FFFF'; ctx.lineWidth = 2;
        for (let l of this.lightnings) {
            ctx.beginPath(); ctx.moveTo(l.x1, l.y1);
            ctx.lineTo(l.x1 + (l.x2 - l.x1)/2 + (Math.random()*20-10), l.y1 + (l.y2 - l.y1)/2 + (Math.random()*20-10));
            ctx.lineTo(l.x2, l.y2); ctx.stroke();
        }

        ctx.fillStyle = '#FFFFFF'; ctx.font = '20px Arial';
        let displayText = gameMode === 'SOLO' ? `Score: ${this.score}` : `P${this.id} Score: ${this.score}`;
        ctx.fillText(displayText, 10, 30);
        ctx.fillText('Próx Poder: ' + this.nextUpgradeScore, 10, 60); 
        
        ctx.fillText('Fase: ' + this.fase, this.gameWidth - 130, 30);
        ctx.fillStyle = '#00FFCC'; ctx.fillText('Nível: ' + this.playerLevel, this.gameWidth - 130, 60);
        ctx.fillStyle = (this.lives < 4) ? '#FF5555' : '#FFFFFF';
        ctx.fillText('Vidas: ' + this.lives + '/' + this.maxLives, this.gameWidth - 130, 90);

        if (this.id === 1 && gameMode === 'MULTI') {
            ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(this.gameWidth, 0); ctx.lineTo(this.gameWidth, this.gameHeight); ctx.stroke();
        }

        ctx.restore();
    }
}

// ==========================================
// CONTROLOS DE JOGO GLOBAIS
// ==========================================

function resetGame(mode) {
    startBackgroundMusic();
    playStartGameSound();
    gameMode = mode;
    if (mode === 'SOLO') {
        canvas.width = 800;
        p1 = new PlayerBoard(1, 0);
        p2 = null;
    } else {
        canvas.width = 1600;
        p1 = new PlayerBoard(1, 0);
        p2 = new PlayerBoard(2, 800);
    }
    gameState = 'PLAYING';
}

function declareWinner(winnerId) {
    gameState = winnerId === 1 ? 'P1_WIN' : 'P2_WIN';
    localStorage.setItem('spaceInvadersHighScore', highScore);
}

// ==========================================
// CONTROLOS DE RATO E TECLADO
// ==========================================
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (gameState === 'START') {
        playMenuSound();
        // Botão Solo: x entre 180 e 380, y entre 320 e 380
        // Botão Multi: x entre 420 e 620, y entre 320 e 380
        if (mouseY >= 320 && mouseY <= 380) {
            if (mouseX >= 180 && mouseX <= 380) resetGame('SOLO');
            else if (mouseX >= 420 && mouseX <= 620) resetGame('MULTI');
        }
    }
    else if (gameState.includes('WIN') || gameState === 'GAMEOVER') {
        gameState = 'START';
        canvas.width = 800; 
    }
    else if (gameState === 'P1_UPGRADE' || gameState === 'P2_UPGRADE') {
        let p = gameState === 'P1_UPGRADE' ? p1 : p2;
        let centerX = p.offsetX + p.gameWidth / 2;
        let startX = centerX - 320; 
        
        for(let i=0; i<p.upgradeChoices.length; i++) {
            let cx = startX + i * 220;
            if(mouseX >= cx && mouseX <= cx + 200 && mouseY >= 200 && mouseY <= 450) {
                p.applyUpgrade(p.upgradeChoices[i]);
                break;
            }
        }
    }
});

document.addEventListener('keydown', (e) => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    if (gameState === 'START') {
        if (e.key === '1') { resetGame('SOLO'); return; }
        if (e.key === '2') { resetGame('MULTI'); return; }
        return;
    }

    if ((gameState.includes('WIN') || gameState === 'GAMEOVER') && (e.code === 'Enter' || e.code === 'Space')) {
        gameState = 'START';
        canvas.width = 800;
        startMenuMusic();
        return;
    }
    
    if (gameState === 'P1_UPGRADE') {
        if (e.key === '1' && p1.upgradeChoices[0]) p1.applyUpgrade(p1.upgradeChoices[0]);
        if (e.key === '2' && p1.upgradeChoices[1]) p1.applyUpgrade(p1.upgradeChoices[1]);
        if (e.key === '3' && p1.upgradeChoices[2]) p1.applyUpgrade(p1.upgradeChoices[2]);
        return;
    }
    if (gameState === 'P2_UPGRADE') {
        if (e.key === '1' && p2.upgradeChoices[0]) p2.applyUpgrade(p2.upgradeChoices[0]);
        if (e.key === '2' && p2.upgradeChoices[1]) p2.applyUpgrade(p2.upgradeChoices[1]);
        if (e.key === '3' && p2.upgradeChoices[2]) p2.applyUpgrade(p2.upgradeChoices[2]);
        return;
    }

    const now = Date.now();
    
    // Controlos Jogador 1 (Solo aceita setas e WASD)
    if (e.key === 'a' || e.key === 'A' || (gameMode === 'SOLO' && e.key === 'ArrowLeft')) {
        p1.keys.left = true;
        if (p1.playerUpgrades.dash > 0 && now - p1.lastLeftTap < 250 && now - p1.dashCooldown > 1500) { p1.player.x -= 120; p1.dashCooldown = now; }
        p1.lastLeftTap = now;
    }
    if (e.key === 'd' || e.key === 'D' || (gameMode === 'SOLO' && e.key === 'ArrowRight')) {
        p1.keys.right = true;
        if (p1.playerUpgrades.dash > 0 && now - p1.lastRightTap < 250 && now - p1.dashCooldown > 1500) { p1.player.x += 120; p1.dashCooldown = now; }
        p1.lastRightTap = now;
    }
    if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S' || (gameMode === 'SOLO' && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.code === 'Space'))) {
        p1.keys.shoot = true;
    }

    // Controlos Jogador 2 (Só no Multi)
    if (gameMode === 'MULTI' && p2) {
        if (e.key === 'ArrowLeft') {
            p2.keys.left = true;
            if (p2.playerUpgrades.dash > 0 && now - p2.lastLeftTap < 250 && now - p2.dashCooldown > 1500) { p2.player.x -= 120; p2.dashCooldown = now; }
            p2.lastLeftTap = now;
        }
        if (e.key === 'ArrowRight') {
            p2.keys.right = true;
            if (p2.playerUpgrades.dash > 0 && now - p2.lastRightTap < 250 && now - p2.dashCooldown > 1500) { p2.player.x += 120; p2.dashCooldown = now; }
            p2.lastRightTap = now;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') p2.keys.shoot = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (gameState === 'START') return;
    
    if (e.key === 'a' || e.key === 'A' || (gameMode === 'SOLO' && e.key === 'ArrowLeft')) p1.keys.left = false;
    if (e.key === 'd' || e.key === 'D' || (gameMode === 'SOLO' && e.key === 'ArrowRight')) p1.keys.right = false;
    if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S' || (gameMode === 'SOLO' && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.code === 'Space'))) p1.keys.shoot = false;

    if (gameMode === 'MULTI' && p2) {
        if (e.key === 'ArrowLeft') p2.keys.left = false;
        if (e.key === 'ArrowRight') p2.keys.right = false;
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') p2.keys.shoot = false;
    }
});


// ==========================================
// LOOP PRINCIPAL E RENDERING GLOBAL
// ==========================================
function gameLoop() {
    if (gameState === 'PLAYING') {
        p1.update();
        if (gameState === 'PLAYING' && gameMode === 'MULTI' && p2) p2.update(); 
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'START') {
        startMenuMusic();
        canvas.width = 800; // Força tela de menu
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.font = 'bold 50px Arial';
        ctx.fillText('SPACE INVADERS', canvas.width / 2, canvas.height / 2 - 100);
        
        ctx.fillStyle = '#FFFF00'; ctx.font = '24px Arial';
        ctx.fillText('High Score Global: ' + highScore, canvas.width / 2, canvas.height / 2 - 40);
        
        // Botão Solo
        ctx.fillStyle = '#00FFCC'; ctx.fillRect(canvas.width / 2 - 220, canvas.height / 2 + 20, 200, 60);
        ctx.fillStyle = '#000000'; ctx.font = 'bold 24px Arial';
        ctx.fillText('1 JOGADOR', canvas.width / 2 - 120, canvas.height / 2 + 58);
        
        // Botão Multi
        ctx.fillStyle = '#FF4400'; ctx.fillRect(canvas.width / 2 + 20, canvas.height / 2 + 20, 200, 60);
        ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 24px Arial';
        ctx.fillText('2 JOGADORES', canvas.width / 2 + 120, canvas.height / 2 + 58);

        ctx.fillStyle = '#AAAAAA'; ctx.font = '18px Arial';
        ctx.fillText('Pressione [1] para Solo ou [2] para Multijogador (Ou clique nas caixas)', canvas.width / 2, canvas.height / 2 + 130);
        ctx.textAlign = 'left'; 
    } 
    else {
        p1.draw(ctx);
        if (gameMode === 'MULTI' && p2) p2.draw(ctx);
        
        // Camadas Superiores Transparentes (Upgrades)
        if (gameState === 'P1_UPGRADE' || gameState === 'P2_UPGRADE') {
            let p = gameState === 'P1_UPGRADE' ? p1 : p2;
            let centerX = p.offsetX + p.gameWidth / 2;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center';
            
            let titulo = gameMode === 'SOLO' ? 'SUBIU DE NÍVEL!' : `JOGADOR ${p.id} SUBIU DE NÍVEL!`;
            ctx.font = 'bold 36px Arial'; ctx.fillText(titulo, centerX, 100);
            ctx.font = '20px Arial'; ctx.fillText('Escolha um poder (Clique ou Pressione 1, 2, 3)', centerX, 140);
            
            let startX_UI = centerX - 320; 
            for(let i=0; i<p.upgradeChoices.length; i++) {
                let choice = p.upgradeChoices[i], cx = startX_UI + i * 220, cy = 200;
                let rarityColor = (choice.rarity === 'Raro') ? '#00AAFF' : (choice.rarity === 'Épico') ? '#AA00FF' : (choice.rarity === 'Lendário') ? '#FFD700' : '#FFFFFF';
                
                ctx.fillStyle = '#222'; ctx.fillRect(cx, cy, 200, 250);
                ctx.strokeStyle = rarityColor; ctx.lineWidth = 4; ctx.strokeRect(cx, cy, 200, 250);
                
                ctx.fillStyle = rarityColor; ctx.font = 'bold 20px Arial'; ctx.fillText(choice.name, cx + 100, cy + 40);
                ctx.fillStyle = '#AAAAAA'; ctx.font = '14px Arial'; ctx.fillText(choice.rarity.toUpperCase(), cx + 100, cy + 65);
                ctx.fillStyle = '#FFFFFF'; ctx.font = '16px Arial'; ctx.fillText(choice.desc, cx + 100, cy + 130);
                ctx.fillStyle = rarityColor; ctx.font = '16px Arial'; ctx.fillText(`[ Tecla ${i+1} ]`, cx + 100, cy + 220);
            }
            ctx.textAlign = 'left';
        } 
        
        // Ecrã de Fim de Jogo (Solo)
        else if (gameState === 'GAMEOVER') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'red'; ctx.textAlign = 'center'; ctx.font = 'bold 50px Arial';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillStyle = 'white'; ctx.font = '20px Arial';
            ctx.fillText('Pressione ENTER ou CLIQUE para voltar ao Menu', canvas.width / 2, canvas.height / 2 + 30);
            ctx.textAlign = 'left';
        }
        
        // Ecrã de Fim de Jogo (Multiplayer - Vitória)
        else if (gameState === 'P1_WIN' || gameState === 'P2_WIN') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = 'bold 50px Arial';
            
            let winner = gameState === 'P1_WIN' ? '1' : '2';
            let winnerColor = winner === '1' ? '#00FFCC' : '#FF4400';
            
            ctx.fillStyle = winnerColor;
            ctx.fillText(`O JOGADOR ${winner} VENCEU A PARTIDA!`, canvas.width / 2, canvas.height / 2 - 40);
            
            ctx.fillStyle = '#FFFF00'; ctx.font = '24px Arial';
            ctx.fillText(`Pontuação Final  -  J1: ${p1.score}  |  J2: ${p2.score}`, canvas.width / 2, canvas.height / 2 + 20);
            
            ctx.fillStyle = 'white'; ctx.font = '20px Arial';
            ctx.fillText('Pressione ENTER ou CLIQUE para voltar ao Menu', canvas.width / 2, canvas.height / 2 + 80);
            ctx.textAlign = 'left';
        }
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();