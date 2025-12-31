// ==========================================
// TO MARS AND BEYOND - SpaceX Starship Game
// 8-Bit Style Space Adventure
// ==========================================

// Audio Context for 8-bit sounds
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

// Sound Generator - 8-bit style
const SoundGenerator = {
    init() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
    },

    play(type) {
        if (!audioCtx) return;
        
        switch(type) {
            case 'launch':
                this.playLaunch();
                break;
            case 'boost':
                this.playBoost();
                break;
            case 'coin':
                this.playCoin();
                break;
            case 'hit':
                this.playHit();
                break;
            case 'ufo':
                this.playUFO();
                break;
            case 'milestone':
                this.playMilestone();
                break;
            case 'gameover':
                this.playGameOver();
                break;
            case 'separation':
                this.playSeparation();
                break;
        }
    },

    createOscillator(freq, type = 'square', duration = 0.1) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    },

    playLaunch() {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.createOscillator(100 + i * 30, 'sawtooth', 0.15);
            }, i * 100);
        }
    },

    playBoost() {
        this.createOscillator(80, 'sawtooth', 0.05);
    },

    playCoin() {
        this.createOscillator(987, 'square', 0.05);
        setTimeout(() => this.createOscillator(1318, 'square', 0.1), 50);
    },

    playHit() {
        this.createOscillator(200, 'sawtooth', 0.1);
        setTimeout(() => this.createOscillator(100, 'sawtooth', 0.2), 50);
    },

    playUFO() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createOscillator(800 - i * 100, 'sine', 0.1);
            }, i * 50);
        }
    },

    playMilestone() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.createOscillator(freq, 'square', 0.15), i * 100);
        });
    },

    playGameOver() {
        const notes = [400, 350, 300, 250, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => this.createOscillator(freq, 'square', 0.2), i * 150);
        });
    },

    playSeparation() {
        this.createOscillator(300, 'sawtooth', 0.3);
        setTimeout(() => this.createOscillator(500, 'square', 0.2), 200);
    }
};

// Game Constants
const MILESTONES = [
    { name: 'MOON', distance: 384400, emoji: '🌙', bonus: 10000 },
    { name: 'MARS', distance: 225000000, emoji: '🔴', bonus: 50000 },
    { name: 'JUPITER', distance: 628730000, emoji: '🟠', bonus: 100000 },
    { name: 'SATURN', distance: 1275000000, emoji: '🪐', bonus: 150000 },
    { name: 'URANUS', distance: 2724000000, emoji: '🔵', bonus: 200000 },
    { name: 'NEPTUNE', distance: 4351000000, emoji: '💙', bonus: 250000 },
    { name: 'PLUTO', distance: 5900000000, emoji: '⚪', bonus: 300000 },
    { name: 'VOYAGER 1', distance: 24000000000, emoji: '🛸', bonus: 1000000 }
];

// Convert real distances to game distances (scaled for playability)
// Moon should be reachable after ~20-30 seconds of gameplay
const DISTANCE_SCALE = 20000; // 1 game unit = 20,000 km (easier milestones)
const SCALED_MILESTONES = MILESTONES.map(m => ({
    ...m,
    gameDistance: m.distance / DISTANCE_SCALE
}));

// Game State
const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    state: 'start', // start, launching, playing, gameover
    
    // Player (Starship is ~50m tall in reality)
    player: {
        x: 0,
        y: 0,
        width: 40,
        height: 80,
        targetX: 0,
        velocityX: 0
    },
    
    // Booster (Super Heavy is ~70m tall - larger than Starship!)
    booster: {
        x: 0,
        y: 0,
        width: 45,
        height: 100,
        rotation: 0,
        separated: false,
        visible: true,
        velocityY: 0
    },
    
    // Flames
    flames: {
        visible: false,
        underBooster: true,
        frame: 0
    },
    
    // Tower
    tower: {
        visible: true,
        x: 0,
        y: 0
    },
    
    // Game stats
    stats: {
        altitude: 0,
        score: 0,
        coins: 0,
        hearts: 3,
        maxHearts: 3
    },
    
    // Objects
    obstacles: [],
    coins: [],
    hearts: [], // Collectible hearts for health
    stars: [],
    shootingStars: [],
    galaxies: [],
    blackHoles: [],
    aliens: [],
    
    // Milestone visual
    milestonePlanet: null, // Current approaching planet for background display
    
    // Milestones
    milestonesReached: [],
    currentMilestoneIndex: 0,
    
    // Launch sequence
    launchTimer: 0,
    launchPhase: 0, // 0: pre-launch, 1: liftoff, 2: ascending, 3: separation, 4: starship-only
    
    // Background
    backgroundGradient: null,
    sunsetProgress: 0,
    
    // Input
    inputX: 0,
    isDragging: false,
    
    // Time
    lastTime: 0,
    deltaTime: 0,
    gameSpeed: 1,
    
    // Assets
    assets: {},
    assetsLoaded: false,
    
    // Animation
    animationFrame: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.loadAssets();
        this.setupInput();
        this.generateStars();
        
        // Start game loop
        requestAnimationFrame((time) => this.loop(time));
    },
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = false;
        
        // Update player position
        this.player.x = this.width / 2;
        this.player.y = this.height * 0.6;
        this.player.targetX = this.player.x;
        
        this.tower.x = this.width / 2;
        this.tower.y = this.height - 100;
        
        this.createBackgroundGradient();
    },
    
    loadAssets() {
        const assetList = [
            'Starship', 'Booster', 'Tower', 'Flames', 'SpaceX',
            'Asteroid1', 'Asteroid2', 'Asteroid3',
            'Dogecoin', 'UFO',
            'Moon', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Voyager1'
        ];
        
        let loaded = 0;
        
        assetList.forEach(name => {
            const img = new Image();
            img.onload = () => {
                loaded++;
                if (loaded === assetList.length) {
                    this.assetsLoaded = true;
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load: ${name}`);
                loaded++;
                if (loaded === assetList.length) {
                    this.assetsLoaded = true;
                }
            };
            img.src = `Assets/${name}.png`;
            this.assets[name] = img;
        });
    },
    
    setupInput() {
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state === 'playing') {
                this.player.targetX = e.clientX;
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleTap(e.clientX, e.clientY);
        });
        
        // Start screen click/touch handlers
        const startScreen = document.getElementById('start-screen');
        startScreen.addEventListener('click', () => {
            this.handleTap(0, 0);
        });
        startScreen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTap(0, 0);
        }, { passive: false });
        
        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.isDragging = true;
            this.handleTap(touch.clientX, touch.clientY);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.state === 'playing' && this.isDragging) {
                const touch = e.touches[0];
                this.player.targetX = touch.clientX;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
        
        // Button handlers
        document.getElementById('retry-btn').addEventListener('click', () => this.restart());
        document.getElementById('share-btn').addEventListener('click', () => this.shareScore());
    },
    
    handleTap(x, y) {
        if (this.state === 'start') {
            this.startGame();
        }
    },
    
    startGame() {
        SoundGenerator.init();
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        
        this.state = 'launching';
        this.launchPhase = 0;
        this.launchTimer = 0;
        
        // Reset stats
        this.stats = {
            altitude: 0,
            score: 0,
            coins: 0,
            hearts: 3,
            maxHearts: 3
        };
        
        this.updateHearts();
        this.milestonesReached = [];
        this.currentMilestoneIndex = 0;
        this.obstacles = [];
        this.coins = [];
        this.hearts = [];
        this.milestonePlanet = null;
        this.gameSpeed = 1;
        
        // Position for launch - stack starship on top of booster
        this.player.x = this.width / 2;
        this.player.y = this.height - 250;
        this.player.targetX = this.player.x;
        
        // Position booster directly below starship (touching)
        this.booster.x = this.player.x;
        this.booster.y = this.player.y + this.player.height / 2 + this.booster.height / 2;
        this.booster.separated = false;
        this.booster.rotation = 0;
        this.booster.visible = true;
        this.booster.velocityY = 0;
        
        this.tower.visible = true;
        this.flames.visible = false;
        this.flames.underBooster = true;
        
        SoundGenerator.play('launch');
    },
    
    restart() {
        document.getElementById('gameover-screen').classList.add('hidden');
        this.sunsetProgress = 0;
        this.generateStars();
        this.aliens = [];
        this.galaxies = [];
        this.blackHoles = [];
        this.shootingStars = [];
        this.startGame();
    },
    
    async shareScore() {
        try {
            // Capture the game over screen as an image
            const gameOverScreen = document.getElementById('gameover-screen');
            const canvas = await this.captureScreenshot(gameOverScreen);
            
            // Convert canvas to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'my-score.png', { type: 'image/png' });
            
            const shareData = {
                title: 'To Mars And Beyond',
                text: `🚀 I reached ${this.formatDistance(this.stats.altitude)} and scored ${this.stats.score.toLocaleString()} points in To Mars And Beyond! Can you beat my score?`,
                url: window.location.href
            };
            
            // Try to share with image if supported
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    ...shareData,
                    files: [file]
                });
            } else if (navigator.share) {
                // Fallback to text-only share
                await navigator.share(shareData);
            } else {
                // Final fallback: download the image
                const link = document.createElement('a');
                link.download = 'my-score.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                alert('Screenshot saved! You can share it with your friends.');
            }
        } catch (err) {
            console.log('Share failed:', err);
            // If sharing fails, try to at least copy text
            try {
                const text = `🚀 I reached ${this.formatDistance(this.stats.altitude)} and scored ${this.stats.score.toLocaleString()} points in To Mars And Beyond!`;
                await navigator.clipboard.writeText(text + ' ' + window.location.href);
                alert('Score copied to clipboard!');
            } catch (e) {
                console.log('Clipboard failed:', e);
            }
        }
    },
    
    async captureScreenshot(element) {
        // Create a canvas to capture the screenshot
        const rect = element.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        const scale = 2; // Higher resolution
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        
        // Draw background
        const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a0a2a');
        gradient.addColorStop(1, '#2a0a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, rect.width, rect.height);
        
        // Draw stars
        for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
            ctx.beginPath();
            ctx.arc(Math.random() * rect.width, Math.random() * rect.height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Set text properties
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = rect.width / 2;
        
        // Game Over title
        ctx.font = 'bold 36px "Press Start 2P", monospace';
        ctx.fillStyle = '#ff0040';
        ctx.shadowColor = '#800020';
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.fillText('GAME OVER', centerX, 50);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Medal
        ctx.font = '60px Arial';
        const medal = document.getElementById('medal').textContent;
        ctx.fillText(medal, centerX, 120);
        
        // Medal text
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(document.getElementById('medal-text').textContent, centerX, 170);
        
        // Stats box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        const boxY = 200;
        const boxHeight = 100;
        ctx.fillRect(20, boxY, rect.width - 40, boxHeight);
        ctx.strokeRect(20, boxY, rect.width - 40, boxHeight);
        
        // Stats text
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`ALTITUDE: ${this.formatDistance(this.stats.altitude)}`, centerX, boxY + 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`FINAL SCORE: ${this.stats.score.toLocaleString()}`, centerX, boxY + 55);
        ctx.fillText(`DOGECOINS: ${this.stats.coins}`, centerX, boxY + 80);
        
        // Milestones
        if (this.milestonesReached.length > 0) {
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = '#9d4edd';
            ctx.fillText('MILESTONES REACHED:', centerX, boxY + boxHeight + 30);
            
            ctx.font = '24px Arial';
            const emojis = this.milestonesReached.map(m => m.emoji).join(' ');
            ctx.fillText(emojis, centerX, boxY + boxHeight + 60);
        }
        
        // Game title at bottom
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#666';
        ctx.fillText('TO MARS & BEYOND', centerX, rect.height - 20);
        
        return canvas;
    },
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.05 + 0.01,
                layer: Math.floor(Math.random() * 3) // Parallax layers
            });
        }
    },
    
    createBackgroundGradient() {
        // Will be updated dynamically based on altitude
        this.updateBackground();
    },
    
    updateBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        
        if (this.sunsetProgress < 0.3) {
            // Sunset phase
            const p = this.sunsetProgress / 0.3;
            gradient.addColorStop(0, this.lerpColor('#1a1035', '#0a0a1a', p));
            gradient.addColorStop(0.3, this.lerpColor('#2d1b4e', '#0f0f2a', p));
            gradient.addColorStop(0.6, this.lerpColor('#ff6b35', '#1a0a2a', p));
            gradient.addColorStop(0.85, this.lerpColor('#ff9f1c', '#0a0a1a', p));
            gradient.addColorStop(1, this.lerpColor('#ffcc00', '#0a0a1a', p));
        } else {
            // Deep space
            const p = Math.min((this.sunsetProgress - 0.3) / 0.7, 1);
            gradient.addColorStop(0, this.lerpColor('#0a0a1a', '#050510', p));
            gradient.addColorStop(0.5, this.lerpColor('#0f0f2a', '#080818', p));
            gradient.addColorStop(1, this.lerpColor('#0a0a1a', '#020208', p));
        }
        
        this.backgroundGradient = gradient;
    },
    
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        return `rgb(${r},${g},${b})`;
    },
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },
    
    loop(currentTime) {
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        this.animationFrame++;
        
        this.update();
        this.render();
        
        requestAnimationFrame((time) => this.loop(time));
    },
    
    update() {
        if (this.state === 'launching') {
            this.updateLaunch();
        } else if (this.state === 'playing') {
            this.updatePlaying();
        }
        
        // Update stars twinkle
        this.stars.forEach(star => {
            star.brightness = 0.5 + Math.sin(this.animationFrame * star.twinkleSpeed) * 0.5;
        });
        
        // Update shooting stars
        this.updateShootingStars();
        
        // Update aliens
        this.updateAliens();
        
        // Update galaxies
        this.updateGalaxies();
        
        // Update black holes
        this.updateBlackHoles();
        
        // Flames animation
        if (this.flames.visible) {
            this.flames.frame = (this.flames.frame + 1) % 4;
        }
    },
    
    updateLaunch() {
        this.launchTimer += this.deltaTime;
        
        switch (this.launchPhase) {
            case 0: // Pre-launch - show flames
                if (this.launchTimer > 0.5) {
                    this.flames.visible = true;
                    this.flames.underBooster = true;
                    if (this.launchTimer > 1.5) {
                        this.launchPhase = 1;
                        this.launchTimer = 0;
                    }
                }
                break;
                
            case 1: // Liftoff
                this.player.y -= 100 * this.deltaTime;
                this.booster.y = this.player.y + this.player.height / 2 + this.booster.height / 2;
                this.tower.visible = this.player.y > this.height - 300;
                
                if (this.launchTimer > 2) {
                    this.launchPhase = 2;
                    this.launchTimer = 0;
                }
                break;
                
            case 2: // Ascending - move to center
                this.player.y -= 150 * this.deltaTime;
                this.booster.y = this.player.y + this.player.height / 2 + this.booster.height / 2;
                
                // Move toward center
                const targetY = this.height * 0.6;
                if (this.player.y < targetY) {
                    this.player.y = targetY;
                }
                
                if (this.launchTimer > 3) {
                    this.launchPhase = 3;
                    this.launchTimer = 0;
                    this.flames.visible = false;
                    SoundGenerator.play('separation');
                }
                break;
                
            case 3: // Booster separation
                this.booster.separated = true;
                this.booster.rotation += 2 * this.deltaTime;
                this.booster.velocityY += 100 * this.deltaTime;
                this.booster.y += this.booster.velocityY * this.deltaTime;
                
                if (this.launchTimer > 2) {
                    this.booster.visible = false;
                    this.launchPhase = 4;
                    this.launchTimer = 0;
                }
                break;
                
            case 4: // Starship continues
                this.flames.visible = true;
                this.flames.underBooster = false;
                
                // Center the starship
                this.player.y = this.height * 0.6;
                
                if (this.launchTimer > 1) {
                    this.state = 'playing';
                    this.player.targetX = this.width / 2;
                }
                break;
        }
    },
    
    updatePlaying() {
        // Increase altitude
        const altitudeGain = 50 * this.gameSpeed * this.deltaTime;
        this.stats.altitude += altitudeGain;
        this.stats.score += Math.floor(altitudeGain * 10);
        
        // Update sunset/space transition
        this.sunsetProgress = Math.min(this.stats.altitude / 500, 1);
        this.updateBackground();
        
        // Increase game speed gradually
        this.gameSpeed = 1 + this.stats.altitude / 10000;
        
        // Move player toward target
        const dx = this.player.targetX - this.player.x;
        this.player.x += dx * 0.1;
        
        // Clamp to screen bounds
        const halfWidth = this.player.width / 2;
        this.player.x = Math.max(halfWidth, Math.min(this.width - halfWidth, this.player.x));
        
        // Spawn obstacles
        this.spawnObstacles();
        
        // Spawn coins
        this.spawnCoins();
        
        // Spawn hearts (health pickups)
        this.spawnHearts();
        
        // Spawn space objects
        this.spawnSpaceObjects();
        
        // Update obstacles
        this.updateObstacles();
        
        // Update coins
        this.updateCoins();
        
        // Update heart pickups
        this.updateHeartPickups();
        
        // Update milestone planet visibility
        this.updateMilestonePlanet();
        
        // Check milestones
        this.checkMilestones();
        
        // Update UI
        this.updateUI();
        
        // Random rocket boost sound
        if (Math.random() < 0.02) {
            SoundGenerator.play('boost');
        }
    },
    
    spawnObstacles() {
        const spawnRate = 0.02 + this.stats.altitude / 100000;
        
        if (Math.random() < spawnRate) {
            const isUFO = Math.random() < 0.1; // 10% chance for UFO
            const asteroidType = Math.floor(Math.random() * 3) + 1;
            
            this.obstacles.push({
                x: Math.random() * (this.width - 60) + 30,
                y: -60,
                width: isUFO ? 50 : 40 + Math.random() * 20,
                height: isUFO ? 30 : 40 + Math.random() * 20,
                speed: (100 + Math.random() * 100) * this.gameSpeed,
                type: isUFO ? 'ufo' : `asteroid${asteroidType}`,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 4,
                wobble: isUFO ? Math.random() * Math.PI * 2 : 0
            });
        }
    },
    
    spawnCoins() {
        const spawnRate = 0.015;
        
        if (Math.random() < spawnRate) {
            this.coins.push({
                x: Math.random() * (this.width - 40) + 20,
                y: -30,
                width: 30,
                height: 30,
                speed: 80 * this.gameSpeed,
                rotation: 0
            });
        }
    },
    
    spawnHearts() {
        // Hearts are rare - only spawn if player has lost health
        if (this.stats.hearts < this.stats.maxHearts && Math.random() < 0.003) {
            this.hearts.push({
                x: Math.random() * (this.width - 40) + 20,
                y: -30,
                width: 30,
                height: 30,
                speed: 60 * this.gameSpeed,
                pulse: 0
            });
        }
    },
    
    spawnSpaceObjects() {
        // Shooting stars
        if (Math.random() < 0.005 && this.sunsetProgress > 0.3) {
            this.shootingStars.push({
                x: Math.random() * this.width,
                y: 0,
                length: 50 + Math.random() * 100,
                speed: 500 + Math.random() * 300,
                angle: Math.PI / 4 + (Math.random() - 0.5) * 0.5,
                opacity: 1
            });
        }
        
        // Galaxies (rare, background)
        if (Math.random() < 0.001 && this.sunsetProgress > 0.5 && this.galaxies.length < 3) {
            this.galaxies.push({
                x: Math.random() * this.width,
                y: -100,
                size: 50 + Math.random() * 100,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.5,
                color: ['#9d4edd', '#ff6b9d', '#00d4ff'][Math.floor(Math.random() * 3)],
                speed: 20
            });
        }
        
        // Black holes (very rare, hazard)
        if (Math.random() < 0.0005 && this.sunsetProgress > 0.7 && this.blackHoles.length < 1) {
            this.blackHoles.push({
                x: Math.random() * this.width,
                y: -80,
                size: 60,
                speed: 30,
                pullRadius: 150
            });
        }
        
        // Aliens (decoration)
        if (Math.random() < 0.002 && this.sunsetProgress > 0.4 && this.aliens.length < 5) {
            this.aliens.push({
                x: Math.random() < 0.5 ? -30 : this.width + 30,
                y: Math.random() * this.height * 0.5,
                size: 20 + Math.random() * 20,
                speedX: (Math.random() < 0.5 ? 1 : -1) * (30 + Math.random() * 50),
                wobbleOffset: Math.random() * Math.PI * 2
            });
        }
    },
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.y += obs.speed * this.deltaTime;
            obs.rotation += obs.rotationSpeed * this.deltaTime;
            
            // UFO wobble
            if (obs.type === 'ufo') {
                obs.wobble += 5 * this.deltaTime;
                obs.x += Math.sin(obs.wobble) * 2;
            }
            
            // Remove if off screen
            if (obs.y > this.height + 100) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Collision check
            if (this.checkCollision(this.player, obs)) {
                if (obs.type === 'ufo') {
                    SoundGenerator.play('ufo');
                    this.stats.hearts = 0;
                } else {
                    SoundGenerator.play('hit');
                    this.stats.hearts--;
                }
                
                this.showDamageFlash();
                this.updateHearts();
                this.obstacles.splice(i, 1);
                
                if (this.stats.hearts <= 0) {
                    this.gameOver();
                }
            }
        }
    },
    
    updateCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.y += coin.speed * this.deltaTime;
            coin.rotation += 3 * this.deltaTime;
            
            if (coin.y > this.height + 50) {
                this.coins.splice(i, 1);
                continue;
            }
            
            // Collision check
            if (this.checkCollision(this.player, coin)) {
                SoundGenerator.play('coin');
                this.stats.coins++;
                this.stats.score += 500;
                this.showCoinCollect(coin.x, coin.y, '+500');
                this.coins.splice(i, 1);
            }
        }
    },
    
    updateHeartPickups() {
        for (let i = this.hearts.length - 1; i >= 0; i--) {
            const heart = this.hearts[i];
            heart.y += heart.speed * this.deltaTime;
            heart.pulse += 5 * this.deltaTime;
            
            if (heart.y > this.height + 50) {
                this.hearts.splice(i, 1);
                continue;
            }
            
            // Collision check
            if (this.checkCollision(this.player, heart)) {
                if (this.stats.hearts < this.stats.maxHearts) {
                    SoundGenerator.play('coin'); // Use coin sound for now
                    this.stats.hearts++;
                    this.updateHearts();
                    this.showCoinCollect(heart.x, heart.y, '+❤️');
                }
                this.hearts.splice(i, 1);
            }
        }
    },
    
    updateMilestonePlanet() {
        if (this.currentMilestoneIndex >= SCALED_MILESTONES.length) {
            this.milestonePlanet = null;
            return;
        }
        
        const milestone = SCALED_MILESTONES[this.currentMilestoneIndex];
        const distanceToMilestone = milestone.gameDistance - this.stats.altitude;
        
        // Start showing planet when getting close (within 500 game km)
        if (distanceToMilestone <= 500 && distanceToMilestone > 0) {
            const progress = 1 - (distanceToMilestone / 500);
            this.milestonePlanet = {
                ...milestone,
                progress: progress,
                size: 80 + progress * 200, // Grows from 80 to 280
                y: -100 + progress * (this.height * 0.3), // Moves down into view
                opacity: Math.min(progress * 1.5, 1)
            };
        } else if (distanceToMilestone <= 0) {
            // Just passed milestone, fade out
            this.milestonePlanet = null;
        } else {
            this.milestonePlanet = null;
        }
    },
    
    updateShootingStars() {
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const star = this.shootingStars[i];
            star.x += Math.cos(star.angle) * star.speed * this.deltaTime;
            star.y += Math.sin(star.angle) * star.speed * this.deltaTime;
            star.opacity -= 0.5 * this.deltaTime;
            
            if (star.opacity <= 0 || star.y > this.height || star.x > this.width) {
                this.shootingStars.splice(i, 1);
            }
        }
    },
    
    updateGalaxies() {
        for (let i = this.galaxies.length - 1; i >= 0; i--) {
            const galaxy = this.galaxies[i];
            galaxy.y += galaxy.speed * this.deltaTime;
            galaxy.rotation += galaxy.rotationSpeed * this.deltaTime;
            
            if (galaxy.y > this.height + galaxy.size) {
                this.galaxies.splice(i, 1);
            }
        }
    },
    
    updateBlackHoles() {
        for (let i = this.blackHoles.length - 1; i >= 0; i--) {
            const bh = this.blackHoles[i];
            bh.y += bh.speed * this.deltaTime;
            
            if (bh.y > this.height + bh.size) {
                this.blackHoles.splice(i, 1);
                continue;
            }
            
            // Gravitational pull effect
            const dx = bh.x - this.player.x;
            const dy = bh.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < bh.pullRadius && dist > 0) {
                const pullStrength = (1 - dist / bh.pullRadius) * 200 * this.deltaTime;
                this.player.targetX += (dx / dist) * pullStrength;
            }
        }
    },
    
    updateAliens() {
        for (let i = this.aliens.length - 1; i >= 0; i--) {
            const alien = this.aliens[i];
            alien.x += alien.speedX * this.deltaTime;
            alien.wobbleOffset += 3 * this.deltaTime;
            
            if ((alien.speedX > 0 && alien.x > this.width + 50) ||
                (alien.speedX < 0 && alien.x < -50)) {
                this.aliens.splice(i, 1);
            }
        }
    },
    
    checkCollision(a, b) {
        const padding = 10; // Forgiving hitbox
        return a.x - a.width/2 + padding < b.x + b.width/2 &&
               a.x + a.width/2 - padding > b.x - b.width/2 &&
               a.y - a.height/2 + padding < b.y + b.height/2 &&
               a.y + a.height/2 - padding > b.y - b.height/2;
    },
    
    checkMilestones() {
        if (this.currentMilestoneIndex >= SCALED_MILESTONES.length) return;
        
        const milestone = SCALED_MILESTONES[this.currentMilestoneIndex];
        if (this.stats.altitude >= milestone.gameDistance) {
            this.milestonesReached.push(milestone);
            this.stats.score += milestone.bonus;
            this.showMilestone(milestone);
            SoundGenerator.play('milestone');
            this.currentMilestoneIndex++;
        }
    },
    
    showMilestone(milestone) {
        const flash = document.getElementById('milestone-flash');
        flash.innerHTML = `
            <div class="milestone-icon">${milestone.emoji}</div>
            <div class="milestone-name">${milestone.name}</div>
            <div class="milestone-reached">REACHED!</div>
            <div class="milestone-bonus">+${milestone.bonus.toLocaleString()} POINTS</div>
        `;
        flash.classList.remove('hidden');
        flash.style.animation = 'none';
        flash.offsetHeight; // Trigger reflow
        flash.style.animation = 'milestoneFlash 3s forwards';
        
        // Add screen flash effect
        const screenFlash = document.createElement('div');
        screenFlash.className = 'milestone-screen-flash';
        document.getElementById('game-container').appendChild(screenFlash);
        setTimeout(() => screenFlash.remove(), 500);
        
        setTimeout(() => {
            flash.classList.add('hidden');
        }, 3000);
    },
    
    showCoinCollect(x, y, text = '+500') {
        const flash = document.createElement('div');
        flash.className = 'coin-flash';
        flash.textContent = text;
        flash.style.left = x + 'px';
        flash.style.top = y + 'px';
        document.getElementById('game-container').appendChild(flash);
        
        setTimeout(() => flash.remove(), 1000);
    },
    
    showDamageFlash() {
        const flash = document.createElement('div');
        flash.className = 'damage-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 200);
    },
    
    updateUI() {
        document.getElementById('altitude').textContent = this.formatDistance(this.stats.altitude);
        document.getElementById('score').textContent = `SCORE: ${this.stats.score.toLocaleString()}`;
    },
    
    updateHearts() {
        const container = document.getElementById('hearts');
        container.innerHTML = '';
        for (let i = 0; i < this.stats.maxHearts; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            heart.textContent = i < this.stats.hearts ? '❤️' : '🖤';
            container.appendChild(heart);
        }
    },
    
    formatDistance(km) {
        if (km >= 1000000000) {
            return (km / 1000000000).toFixed(2) + ' B KM';
        } else if (km >= 1000000) {
            return (km / 1000000).toFixed(2) + ' M KM';
        } else if (km >= 1000) {
            return (km / 1000).toFixed(2) + ' K KM';
        }
        return Math.floor(km) + ' KM';
    },
    
    gameOver() {
        this.state = 'gameover';
        SoundGenerator.play('gameover');
        
        // Calculate medal
        let medal = '🥉';
        let medalText = 'BRONZE PILOT';
        
        if (this.milestonesReached.length >= 7) {
            medal = '🏆';
            medalText = 'LEGENDARY VOYAGER';
        } else if (this.milestonesReached.length >= 5) {
            medal = '💎';
            medalText = 'DIAMOND COMMANDER';
        } else if (this.milestonesReached.length >= 3) {
            medal = '🥇';
            medalText = 'GOLD CAPTAIN';
        } else if (this.milestonesReached.length >= 1) {
            medal = '🥈';
            medalText = 'SILVER ASTRONAUT';
        }
        
        // Update game over screen
        document.getElementById('medal').textContent = medal;
        document.getElementById('medal-text').textContent = medalText;
        document.getElementById('final-altitude').textContent = `ALTITUDE: ${this.formatDistance(this.stats.altitude)}`;
        document.getElementById('final-score').textContent = `FINAL SCORE: ${this.stats.score.toLocaleString()}`;
        document.getElementById('coins-collected').textContent = `DOGECOINS: ${this.stats.coins}`;
        
        // Milestones list
        const list = document.getElementById('milestones-list');
        list.innerHTML = '';
        if (this.milestonesReached.length === 0) {
            list.innerHTML = '<span style="color: #666;">None yet - try again!</span>';
        } else {
            this.milestonesReached.forEach((m, i) => {
                const badge = document.createElement('span');
                badge.className = 'milestone-badge';
                badge.textContent = m.emoji;
                badge.title = m.name;
                badge.style.animationDelay = (i * 0.1) + 's';
                list.appendChild(badge);
            });
        }
        
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('gameover-screen').classList.remove('hidden');
    },
    
    render() {
        const ctx = this.ctx;
        
        // Background
        this.updateBackground();
        ctx.fillStyle = this.backgroundGradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Stars (parallax)
        this.renderStars();
        
        // Galaxies (background)
        this.renderGalaxies();
        
        // Milestone planet (large, in background when approaching)
        this.renderMilestonePlanetBackground();
        
        // Black holes
        this.renderBlackHoles();
        
        // Shooting stars
        this.renderShootingStars();
        
        // Aliens
        this.renderAliens();
        
        // Tower (during launch)
        if (this.tower.visible && this.state === 'launching') {
            this.renderTower();
        }
        
        // Booster (if visible)
        if (this.booster.visible && (this.state === 'launching' || this.launchPhase < 4)) {
            this.renderBooster();
        }
        
        // Flames
        if (this.flames.visible) {
            this.renderFlames();
        }
        
        // Starship
        if (this.state !== 'start') {
            this.renderStarship();
        }
        
        // Obstacles
        this.renderObstacles();
        
        // Coins
        this.renderCoins();
        
        // Heart pickups
        this.renderHeartPickups();
    },
    
    renderStars() {
        const ctx = this.ctx;
        
        this.stars.forEach(star => {
            const alpha = star.brightness * (this.sunsetProgress > 0.2 ? 1 : this.sunsetProgress / 0.2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            
            // Parallax movement
            const parallaxSpeed = (star.layer + 1) * 0.5;
            const offsetY = (this.stats.altitude * parallaxSpeed) % this.height;
            let y = (star.y + offsetY) % this.height;
            
            ctx.beginPath();
            ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
    },
    
    renderShootingStars() {
        const ctx = this.ctx;
        
        this.shootingStars.forEach(star => {
            const gradient = ctx.createLinearGradient(
                star.x, star.y,
                star.x - Math.cos(star.angle) * star.length,
                star.y - Math.sin(star.angle) * star.length
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(
                star.x - Math.cos(star.angle) * star.length,
                star.y - Math.sin(star.angle) * star.length
            );
            ctx.stroke();
        });
    },
    
    renderGalaxies() {
        const ctx = this.ctx;
        
        this.galaxies.forEach(galaxy => {
            ctx.save();
            ctx.translate(galaxy.x, galaxy.y);
            ctx.rotate(galaxy.rotation);
            
            // Spiral galaxy effect
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size);
            gradient.addColorStop(0, galaxy.color);
            gradient.addColorStop(0.3, galaxy.color + '80');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, galaxy.size, galaxy.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    },
    
    renderBlackHoles() {
        const ctx = this.ctx;
        
        this.blackHoles.forEach(bh => {
            // Gravitational lensing effect
            const gradient = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.size);
            gradient.addColorStop(0, '#000');
            gradient.addColorStop(0.5, '#1a0030');
            gradient.addColorStop(0.7, '#4a0080');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bh.x, bh.y, bh.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Accretion disk
            ctx.save();
            ctx.translate(bh.x, bh.y);
            ctx.rotate(this.animationFrame * 0.02);
            
            ctx.strokeStyle = '#ff6b00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, bh.size * 1.3, bh.size * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        });
    },
    
    renderAliens() {
        const ctx = this.ctx;
        
        this.aliens.forEach(alien => {
            const wobbleY = Math.sin(alien.wobbleOffset) * 10;
            
            ctx.save();
            ctx.translate(alien.x, alien.y + wobbleY);
            
            // Simple alien spaceship
            ctx.fillStyle = '#39ff14';
            ctx.beginPath();
            ctx.ellipse(0, 0, alien.size, alien.size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Dome
            ctx.fillStyle = '#00d4ff';
            ctx.beginPath();
            ctx.arc(0, -alien.size * 0.2, alien.size * 0.3, Math.PI, 0);
            ctx.fill();
            
            // Lights
            ctx.fillStyle = '#ff0';
            for (let i = 0; i < 3; i++) {
                const lx = (i - 1) * alien.size * 0.4;
                const flash = Math.sin(this.animationFrame * 0.2 + i) > 0;
                if (flash) {
                    ctx.beginPath();
                    ctx.arc(lx, alien.size * 0.1, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            ctx.restore();
        });
    },
    
    renderTower() {
        const ctx = this.ctx;
        const tower = this.assets.Tower;
        
        if (tower && tower.complete) {
            const scale = 0.8;
            const w = 100 * scale;
            const h = 200 * scale;
            ctx.drawImage(tower, this.tower.x - w/2, this.height - h, w, h);
        } else {
            // Fallback tower
            ctx.fillStyle = '#666';
            ctx.fillRect(this.tower.x - 20, this.height - 150, 40, 150);
        }
    },
    
    renderBooster() {
        const ctx = this.ctx;
        const booster = this.assets.Booster;
        
        ctx.save();
        ctx.translate(this.booster.x, this.booster.y);
        
        if (this.booster.separated) {
            ctx.rotate(this.booster.rotation);
        }
        
        if (booster && booster.complete) {
            const w = this.booster.width;
            const h = this.booster.height;
            ctx.drawImage(booster, -w/2, -h/2, w, h);
        } else {
            // Fallback booster
            ctx.fillStyle = '#888';
            ctx.fillRect(-this.booster.width/2, -this.booster.height/2, this.booster.width, this.booster.height);
        }
        
        ctx.restore();
    },
    
    renderFlames() {
        const ctx = this.ctx;
        const flames = this.assets.Flames;
        
        let flameX, flameY;
        
        if (this.flames.underBooster && !this.booster.separated) {
            flameX = this.booster.x;
            flameY = this.booster.y + this.booster.height / 2;
        } else {
            flameX = this.player.x;
            flameY = this.player.y + this.player.height / 2;
        }
        
        // Animated flame effect
        const flameOffset = Math.sin(this.animationFrame * 0.5) * 5;
        const flameScale = 0.8 + Math.sin(this.animationFrame * 0.3) * 0.2;
        
        if (flames && flames.complete) {
            const w = 40 * flameScale;
            const h = 60 * flameScale;
            ctx.drawImage(flames, flameX - w/2, flameY + flameOffset, w, h);
        } else {
            // Fallback flames
            ctx.fillStyle = '#ff6b00';
            ctx.beginPath();
            ctx.moveTo(flameX, flameY);
            ctx.lineTo(flameX - 15, flameY + 40 + flameOffset);
            ctx.lineTo(flameX, flameY + 30);
            ctx.lineTo(flameX + 15, flameY + 40 + flameOffset);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(flameX, flameY + 10);
            ctx.lineTo(flameX - 8, flameY + 30 + flameOffset);
            ctx.lineTo(flameX + 8, flameY + 30 + flameOffset);
            ctx.closePath();
            ctx.fill();
        }
    },
    
    renderStarship() {
        const ctx = this.ctx;
        const starship = this.assets.Starship;
        
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        // No rotation - keep starship upright
        
        if (starship && starship.complete) {
            const w = this.player.width;
            const h = this.player.height;
            ctx.drawImage(starship, -w/2, -h/2, w, h);
        } else {
            // Fallback starship shape
            ctx.fillStyle = '#ddd';
            ctx.beginPath();
            ctx.moveTo(0, -this.player.height/2);
            ctx.lineTo(this.player.width/2, this.player.height/2);
            ctx.lineTo(-this.player.width/2, this.player.height/2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    },
    
    renderObstacles() {
        const ctx = this.ctx;
        
        this.obstacles.forEach(obs => {
            ctx.save();
            ctx.translate(obs.x, obs.y);
            ctx.rotate(obs.rotation);
            
            const asset = this.assets[obs.type === 'ufo' ? 'UFO' : `Asteroid${obs.type.slice(-1)}`];
            
            if (asset && asset.complete) {
                ctx.drawImage(asset, -obs.width/2, -obs.height/2, obs.width, obs.height);
            } else {
                // Fallback shapes
                if (obs.type === 'ufo') {
                    ctx.fillStyle = '#0f0';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, obs.width/2, obs.height/2, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#666';
                    ctx.beginPath();
                    ctx.arc(0, 0, obs.width/2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            ctx.restore();
        });
    },
    
    renderCoins() {
        const ctx = this.ctx;
        const coin = this.assets.Dogecoin;
        
        this.coins.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            
            // 3D rotation effect
            const scaleX = Math.cos(c.rotation);
            ctx.scale(scaleX, 1);
            
            if (coin && coin.complete) {
                ctx.drawImage(coin, -c.width/2, -c.height/2, c.width, c.height);
            } else {
                // Fallback coin
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(0, 0, c.width/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#b8860b';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('D', 0, 0);
            }
            
            ctx.restore();
        });
    },
    
    renderHeartPickups() {
        const ctx = this.ctx;
        
        this.hearts.forEach(heart => {
            ctx.save();
            ctx.translate(heart.x, heart.y);
            
            // Pulsing effect
            const scale = 1 + Math.sin(heart.pulse) * 0.2;
            ctx.scale(scale, scale);
            
            // Draw heart
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❤️', 0, 0);
            
            // Glow effect
            ctx.shadowColor = '#ff0040';
            ctx.shadowBlur = 15;
            ctx.fillText('❤️', 0, 0);
            
            ctx.restore();
        });
    },
    
    renderMilestonePlanetBackground() {
        // Show the approaching milestone planet prominently in background
        if (!this.milestonePlanet) return;
        
        const ctx = this.ctx;
        const planet = this.milestonePlanet;
        
        // Get the asset name (remove spaces, handle "Voyager 1" -> "Voyager1")
        const assetName = planet.name.replace(' ', '');
        const planetAsset = this.assets[assetName];
        
        ctx.save();
        ctx.globalAlpha = planet.opacity;
        
        // Center the planet horizontally
        const x = this.width / 2;
        const y = planet.y;
        const size = planet.size;
        
        // Draw glow behind planet
        const glowGradient = ctx.createRadialGradient(x, y, size * 0.3, x, y, size * 0.8);
        glowGradient.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        if (planetAsset && planetAsset.complete) {
            ctx.drawImage(planetAsset, x - size/2, y - size/2, size, size);
        } else {
            // Fallback - draw a colored circle based on planet name
            const colors = {
                'MOON': '#888888',
                'MARS': '#c1440e',
                'JUPITER': '#d8ca9d',
                'SATURN': '#f4d59e',
                'URANUS': '#b1e4e3',
                'NEPTUNE': '#5b5ddf',
                'PLUTO': '#968570',
                'VOYAGER 1': '#aaaaaa'
            };
            ctx.fillStyle = colors[planet.name] || '#666';
            ctx.beginPath();
            ctx.arc(x, y, size/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw planet name approaching text
        if (planet.progress < 0.8) {
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillStyle = `rgba(255, 215, 0, ${planet.opacity})`;
            ctx.textAlign = 'center';
            ctx.fillText(`APPROACHING ${planet.name}`, x, y + size/2 + 30);
        }
        
        ctx.restore();
    }
};

// Initialize game when page loads
window.addEventListener('load', () => {
    Game.init();
});

// Handle visibility change (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && Game.state === 'playing') {
        // Could pause here if needed
    }
});

