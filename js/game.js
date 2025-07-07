// js/game.js
class Game {
    constructor(canvas, user, db) { // ★★★ CORRIGIDO: Recebe 'user' e 'db' como parâmetros ★★★
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // ★★★ CORRIGIDO: Atribui os parâmetros recebidos às propriedades da classe ★★★
        this.currentUser = user; 
        this.db = db;

        this.lastTime = 0;
        
        this.TOWER_DATA = TOWER_DATA;
        this.ENEMY_DATA = ENEMY_DATA;
        this.WAVE_DATA = WAVE_DATA;

        this.lives = 20;
        this.money = 650; 
        this.wave = 0;
        this.score = 0;
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.gameIsOver = false;
        this.waveInProgress = false;

        this.selectedTowerToBuild = null;
        this.mousePos = { x: 0, y: 0 };
        
        this.ui = new UI(this);
        this.path = [];
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        this.animationFrameId = null; 
        this.gameLoop = this.gameLoop.bind(this);
        this.start();
    }

    resizeCanvas() {
        const uiPanelWidth = 280;
        // Ajusta o layout para funcionar com a barra superior
        this.canvas.width = window.innerWidth - uiPanelWidth;
        this.canvas.height = window.innerHeight; // O canvas ocupa a altura toda, a barra fica por cima
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        const topOffset = 50; // Altura da top-bar
        const bottomOffset = 0;

        // Recalcula o caminho considerando o deslocamento da barra superior
        this.path = [
            { x: -50, y: topOffset + (h - topOffset - bottomOffset) * 0.15 },
            { x: w * 0.2, y: topOffset + (h - topOffset - bottomOffset) * 0.15 },
            { x: w * 0.2, y: topOffset + (h - topOffset - bottomOffset) * 0.85 },
            { x: w * 0.8, y: topOffset + (h - topOffset - bottomOffset) * 0.85 },
            { x: w * 0.8, y: topOffset + (h - topOffset - bottomOffset) * 0.15 },
            { x: w * 0.5, y: topOffset + (h - topOffset - bottomOffset) * 0.15 },
            { x: w * 0.5, y: topOffset + (h - topOffset - bottomOffset) * 0.5 },
            { x: w + 50, y: topOffset + (h - topOffset - bottomOffset) * 0.5 },
        ];
    }

    start() {
        this.gameLoop(0);
    }
    
    gameLoop(timestamp) {
        if (this.gameIsOver) {
            cancelAnimationFrame(this.animationFrameId);
            return;
        }

        const deltaTime = (timestamp - this.lastTime) || (1000/60);
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();
        
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        if (this.lives <= 0 && !this.gameIsOver) {
            this.handlePlayerDefeat();
            return;
        }
        
        this.towers.forEach(t => t.update(this.enemies, deltaTime));
        this.enemies.forEach(e => {
            e.update(deltaTime);
            if (e.hasReachedEnd && !e.isDead()) {
                this.lives--;
                e.health = 0; 
                if(this.lives <= 0) this.lives = 0;
            }
        });

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (this.projectiles[i].update(deltaTime)) this.projectiles.splice(i, 1);
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].update(deltaTime)) this.particles.splice(i, 1);
        }

        this.handleEnemyDefeats();

        if (this.waveInProgress && this.enemies.length === 0) {
            this.waveInProgress = false;
            const waveBonus = 100 + this.wave;
            this.money += waveBonus;
            this.particles.push(new MoneyParticle(this.game, this.canvas.width / 2, this.canvas.height - 20, `+$${waveBonus}`));
            this.towers.forEach(t => { if(t.onWaveEnd) t.onWaveEnd(this) });
            this.ui.enableStartWaveButton();

            if (this.wave >= this.WAVE_DATA.length - 1) {
                this.gameWin();
            }
        }
    }
    
    handleEnemyDefeats() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (enemy.isDead()) {
                if (enemy.health <= 0 && !enemy.hasReachedEnd) {
                   this.money += enemy.bounty;
                   this.score += enemy.bounty;
                }
                this.enemies.splice(i, 1);
            }
        }
    }
    
    draw() {
        // A limpeza e o desenho do caminho agora devem respeitar o novo layout
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawPath();
        
        this.towers.forEach(t => t.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        
        this.ui.draw();
    }
    
    drawPath() {
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        this.ctx.lineWidth = 40; this.ctx.beginPath();
        this.ctx.moveTo(this.path[0].x, this.path[0].y);
        for(let i = 1; i < this.path.length; i++) this.ctx.lineTo(this.path[i].x, this.path[i].y);
        this.ctx.stroke();
    }
        
    handleCanvasClick(event) {
        if (this.gameIsOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
    
        if (this.selectedTowerToBuild) {
            const towerType = this.selectedTowerToBuild;
            const countTowerType = (type) => this.towers.filter(t => t.type === type).length;
            
            if (towerType === 'interest_bank' && countTowerType('interest_bank') >= 2) {
                alert(`Limite de 2 Bancos atingido!`); this.setSelectedTowerToBuild(null); return;
            }
            if (towerType === 'damage_amp' && countTowerType('damage_amp') >= 2) {
                alert(`Limite de 2 Amplificadores atingido!`); this.setSelectedTowerToBuild(null); return;
            }
            if (towerType === 'drone_carrier' && countTowerType('drone_carrier') >= 3) {
                alert(`Limite de 3 Porta-Drones atingido!`); this.setSelectedTowerToBuild(null); return;
            }
            
            const towerData = this.TOWER_DATA[towerType];
            if (this.money >= towerData.cost) {
                this.money -= towerData.cost;
                const newTower = createTower(this, x, y, towerType);
                this.towers.push(newTower);
                if (newTower.type === 'damage_amp') this.towers.forEach(t => t.recalculateBoost());
                this.setSelectedTowerToBuild(null);
            } else { this.setSelectedTowerToBuild(null); }
    
        } else {
            let clickedTower = null;
            for (const t of this.towers) {
                if (Math.hypot(t.x - x, t.y - y) < 20) { clickedTower = t; break; }
            }
            this.ui.selectedTower = (this.ui.selectedTower === clickedTower) ? null : clickedTower;
        }
    }
    
    setSelectedTowerToBuild(type) {
        if (type && TOWER_DATA[type].cost > this.money) { this.selectedTowerToBuild = null; return; }
        this.selectedTowerToBuild = (this.selectedTowerToBuild === type) ? null : type;
        this.ui.selectedTower = null;
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = event.clientX - rect.left;
        this.mousePos.y = event.clientY - rect.top;
    }
    
    startNextWave() {
        if (this.waveInProgress || this.gameIsOver) return;
        this.wave++; this.waveInProgress = true; this.ui.elements.startBtn.disabled = true;
        const waveInfo = this.WAVE_DATA[this.wave];
        if (!waveInfo) { this.gameWin(); return; }
        
        let enemiesToSpawn = [];
        for (const type in waveInfo) {
            for(let i = 0; i < waveInfo[type]; i++) enemiesToSpawn.push(type);
        }
        enemiesToSpawn.sort(() => Math.random() - 0.5); 
        
        let spawnCount = 0;
        const spawn = () => {
            if (this.gameIsOver || spawnCount >= enemiesToSpawn.length) return;
            const type = enemiesToSpawn[spawnCount];
            this.enemies.push(new Enemy(this, type));
            spawnCount++;
            setTimeout(spawn, 500);
        };
        spawn();
    }
    
    getSellValue(tower) { return tower.getSellValue(); }
    
    sellTower(towerToSell){
        this.money += this.getSellValue(towerToSell);
        this.towers = this.towers.filter(t => t !== towerToSell);
        this.ui.selectedTower = null;
        if(towerToSell.type === 'damage_amp') this.towers.forEach(t => t.recalculateBoost());
    }
    
    handlePlayerDefeat() {
        if (this.gameIsOver) return;
        this.gameIsOver = true; this.ui.showScoreModal(this.score);
    }
    
    gameWin() {
        if (this.gameIsOver) return;
        this.gameIsOver = true; this.score += this.lives * 50; this.ui.showScoreModal(this.score);
    }
}