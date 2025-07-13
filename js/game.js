// js/game.js
class Game {
    constructor(canvas, user, db) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentUser = user; 
        this.db = db;
        
        // Propriedades do jogo
        this.lastTime = 0;
        this.TOWER_DATA = TOWER_DATA; this.ENEMY_DATA = ENEMY_DATA; this.WAVE_DATA = WAVE_DATA;
        this.lives = 20; this.money = 6500000000000; this.wave = 0; this.score = 0;
        this.enemies = []; this.towers = []; this.projectiles = []; this.particles = [];
        this.gameIsOver = false; this.waveInProgress = false;
        this.selectedTowerToBuild = null; this.mousePos = { x: 0, y: 0 };
        this.isMouseOnPath = false;
        this.path = [];
        
        // A UI é criada no construtor
        this.ui = new UI(this);
        
        this.animationFrameId = null;
    }

    // Método de inicialização que controla quando o jogo realmente começa
    init() {
        console.log("[Game] O método init() foi chamado. Configurando listeners e iniciando o loop.");
        // Adiciona os event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Calcula o path com base no tamanho da tela
        this.resizeCanvas();
        
        // Inicia o loop de renderização/jogo
        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop(0); 
    }
    
    // O método start() é removido, pois sua lógica agora está no init().
    // O resto da classe (resizeCanvas, gameLoop, draw, etc.) permanece o mesmo.

    resizeCanvas() {
        const uiPanelWidth = 280;
        this.canvas.width = document.body.clientWidth - uiPanelWidth;
        this.canvas.height = document.body.clientHeight;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const topOffset = 50;
        this.path = [
            { x: -50, y: topOffset + (h - topOffset) * 0.15 }, { x: w * 0.2, y: topOffset + (h - topOffset) * 0.15 },
            { x: w * 0.2, y: topOffset + (h - topOffset) * 0.85 }, { x: w * 0.8, y: topOffset + (h - topOffset) * 0.85 },
            { x: w * 0.8, y: topOffset + (h - topOffset) * 0.15 }, { x: w * 0.5, y: topOffset + (h - topOffset) * 0.15 },
            { x: w * 0.5, y: topOffset + (h - topOffset) * 0.5 }, { x: w + 50, y: topOffset + (h - topOffset) * 0.5 },
        ];
    }

    isTooCloseToPath(x, y) {
        const minDistance = 45; 
        for (let i = 0; i < this.path.length - 1; i++) {
            const p1 = this.path[i]; const p2 = this.path[i + 1];
            const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
            if (l2 === 0) continue;
            let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            const projectionX = p1.x + t * (p2.x - p1.x);
            const projectionY = p1.y + t * (p2.y - p1.y);
            if (Math.hypot(x - projectionX, y - projectionY) < minDistance) return true;
        }
        return false;
    }

    gameLoop(timestamp) {
        if (this.gameIsOver) return;
        const deltaTime = (timestamp - this.lastTime) || (1000 / 60);
        this.lastTime = timestamp;
        this.update(deltaTime); this.draw();
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // (lógica de update sem alterações)
        if (this.lives <= 0 && !this.gameIsOver) { this.handlePlayerDefeat(); return; }
        this.towers.forEach(t => t.update(this.enemies, deltaTime));
        this.enemies.forEach(e => {
            e.update(deltaTime);
            if (e.hasReachedEnd && !e.isDead()) { this.lives--; e.health = 0; if(this.lives <= 0) this.lives = 0; }
        });
        for (let i = this.projectiles.length - 1; i >= 0; i--) if (this.projectiles[i].update(deltaTime)) this.projectiles.splice(i, 1);
        for (let i = this.particles.length - 1; i >= 0; i--) if (this.particles[i].update(deltaTime)) this.particles.splice(i, 1);
        this.handleEnemyDefeats();
        if (this.waveInProgress && this.enemies.length === 0) {
            this.waveInProgress = false; const waveBonus = 100 + this.wave; this.money += waveBonus;
            this.particles.push(new MoneyParticle(this, this.canvas.width / 2, this.canvas.height - 20, `+$${waveBonus}`));
            this.towers.forEach(t => { if(t.onWaveEnd) t.onWaveEnd(this) });
            this.ui.enableStartWaveButton(); if (this.wave >= this.WAVE_DATA.length - 1) this.gameWin();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawPath();
        this.towers.forEach(t => t.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.ui.draw();
    }

    drawPath() {
        this.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--path-color');
        this.ctx.lineWidth = 40; this.ctx.lineCap = "round"; this.ctx.lineJoin = "round";
        this.ctx.beginPath(); this.ctx.moveTo(this.path[0].x, this.path[0].y);
        for(let i = 1; i < this.path.length; i++) this.ctx.lineTo(this.path[i].x, this.path[i].y);
        this.ctx.stroke();
    }
        
    // ★★★ FIX: Lógica de clique refatorada para ser mais robusta e evitar fechamento instantâneo ★★★
    handleCanvasClick(event) {
        if (this.gameIsOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Se está construindo
        if (this.selectedTowerToBuild) {
            if (this.isMouseOnPath) { return; }
            const towerData = TOWER_DATA[this.selectedTowerToBuild];
            if (this.money >= towerData.cost) {
                this.money -= towerData.cost;
                this.towers.push(createTower(this, x, y, this.selectedTowerToBuild));
                this.setSelectedTowerToBuild(null); // Deseleciona após construir
            }
            return; // Termina a função aqui
        }

        // Se não está construindo, verifica se clicou em uma torre existente
        let foundTower = null;
        for (const tower of this.towers) {
            if (Math.hypot(tower.x - x, tower.y - y) < 20) {
                foundTower = tower;
                break;
            }
        }
        
        // Agora, toma a decisão UMA VEZ após verificar tudo.
        // Se `foundTower` não for nulo, abre/troca o pop-up.
        // Se `foundTower` for nulo (clicou no nada), fecha o pop-up.
        this.ui.selectTower(foundTower);
    }
    
    setSelectedTowerToBuild(type) {
    // Esta parte está correta. Garante que o painel de upgrade feche se o modo de construção for ativado.
    if (type !== null && this.ui.selectedTower) {
        this.ui.selectTower(null);
    }
    
    // O resto da lógica original permanece
    if (type && TOWER_DATA[type].cost > this.money) { 
        this.selectedTowerToBuild = null; 
        return; 
    }
    this.selectedTowerToBuild = (this.selectedTowerToBuild === type) ? null : type;
}

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = event.clientX - rect.left;
        this.mousePos.y = event.clientY - rect.top;
        if(this.selectedTowerToBuild) this.isMouseOnPath = this.isTooCloseToPath(this.mousePos.x, this.mousePos.y);
    }
    
    startNextWave() {
        // (sem alterações)
        if (this.waveInProgress || this.gameIsOver) return;
        this.wave++; this.waveInProgress = true; this.ui.elements.startBtn.disabled = true;
        const waveInfo = this.WAVE_DATA[this.wave];
        if (!waveInfo) { this.gameWin(); return; }
        let enemiesToSpawn = [];
        for (const type in waveInfo) for(let i = 0; i < waveInfo[type]; i++) enemiesToSpawn.push(type);
        enemiesToSpawn.sort(() => Math.random() - 0.5); 
        let spawnCount = 0;
        const spawn = () => {
            if (this.gameIsOver || spawnCount >= enemiesToSpawn.length) return;
            this.enemies.push(new Enemy(this, enemiesToSpawn[spawnCount]));
            spawnCount++; setTimeout(spawn, 500);
        };
        spawn();
    }
    
    sellTower(towerToSell){
        // (sem alterações)
        this.money += towerToSell.getSellValue();
        this.towers = this.towers.filter(t => t !== towerToSell);
        this.ui.selectTower(null);
        if(towerToSell.type === 'damage_amp') this.towers.forEach(t => t.recalculateBoost());
    }
    
    handlePlayerDefeat() {
        // (sem alterações)
        if (this.gameIsOver) return; this.gameIsOver = true;
        this.ui.showScoreModal(this.score);
    }
    
    gameWin() {
        // (sem alterações)
        if (this.gameIsOver) return; this.gameIsOver = true;
        this.score += this.lives * 50;
        this.ui.showScoreModal(this.score);
    }

    handleEnemyDefeats() {
        // (sem alterações)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.isDead()) {
                if (enemy.health <= 0 && !enemy.hasReachedEnd) {
                   this.money += enemy.bounty; this.score += enemy.bounty;
                }
                this.enemies.splice(i, 1);
            }
        }
    }
}