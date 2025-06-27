// js/game.js

const ENEMY_DATA = {
    creep:    { health:100,  speed:1.5, bounty:5, color:'#e63946' },
    sprinter: { health:70,   speed:4.5, bounty:8, color:'#f72585' },
    brute:    { health:1500, speed:1,   bounty:25, color:'#7209b7' },
};
const WAVE_DATA = [null,
    {creep:10}, {creep:15}, {creep:10, sprinter:5}, {creep:20, sprinter:10},
    {brute:1, creep:15}, {brute:3, sprinter:10}, {sprinter:25}, {brute:5, creep:20},
    {brute:8, sprinter:15}, {creep:10, sprinter:10, brute:10}
];

class Game {
    constructor(canvas, gameId, isHost, myPlayerId) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameId = gameId;
        this.isHost = isHost;
        this.myPlayerId = myPlayerId;
        this.gameRef = db.collection('games').doc(gameId);
        this.towersRef = this.gameRef.collection('towers');
        this.enemiesRef = this.gameRef.collection('enemies');
        this.lastTime = 0;
        this.TOWER_DATA = TOWER_DATA;
        this.ENEMY_DATA = ENEMY_DATA;
        this.WAVE_DATA = WAVE_DATA;
        this.lives = 20;
        this.money = 500;
        this.wave = 0;
        this.enemies = [];
        this.towers = [];
        this.gameIsOver = false;
        this.projectiles = [];
        this.particles = [];
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
        this.startFirebaseListeners();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth - 280;
        this.canvas.height = window.innerHeight;
        this.path = [
            { x: -50, y: this.canvas.height * 0.4 },
            { x: this.canvas.width * 0.2, y: this.canvas.height * 0.4 },
            { x: this.canvas.width * 0.2, y: this.canvas.height * 0.8 },
            { x: this.canvas.width * 0.7, y: this.canvas.height * 0.8 },
            { x: this.canvas.width * 0.7, y: this.canvas.height * 0.2 },
            { x: this.canvas.width + 50, y: this.canvas.height * 0.2 }
        ];
    }

    startFirebaseListeners() {
        this.gameRef.onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            this.lives = data.lives;
            this.wave = data.wave;
            
            if(this.isHost) {
                this.money = data.hostMoney;
            } else {
                this.money = data.guestMoney;
            }
            
            this.ui.updatePlayerStats(data.hostMoney, data.guestMoney, this.isHost, data.guestPlayerId !== null);
            
            if (!this.animationFrameId) {
                this.gameLoop(0);
            }
        });
        
        this.towersRef.onSnapshot(snapshot => {
            this.towers = [];
            snapshot.forEach(doc => {
                this.towers.push({ ...doc.data(), id: doc.id });
            });
        });

        this.enemiesRef.onSnapshot(snapshot => {
             // Sincroniza inimigos para ambos, mas só o host os move
            const enemiesFromDb = [];
            snapshot.forEach(doc => {
                enemiesFromDb.push({ ...doc.data(), id: doc.id });
            });

            if (this.isHost) {
                // O host mescla a lista, preservando as instâncias de classe para `update`
                this.enemies = enemiesFromDb.map(dbEnemy => {
                    const existingEnemy = this.enemies.find(e => e.id === dbEnemy.id);
                    if(existingEnemy) {
                        // Atualiza dados da instância existente
                        existingEnemy.x = dbEnemy.x;
                        existingEnemy.y = dbEnemy.y;
                        existingEnemy.health = dbEnemy.health;
                        return existingEnemy;
                    }
                    // Cria nova instância para novo inimigo
                    return new Enemy(this, dbEnemy.type, dbEnemy.id, dbEnemy.x, dbEnemy.y, dbEnemy.health, dbEnemy.maxHealth, dbEnemy.pathIndex);
                });
            } else {
                 // O convidado apenas recebe a lista de dados
                 this.enemies = enemiesFromDb;
            }
        });
    }
    
    gameLoop(timestamp) {
        if (this.gameIsOver) return;

        const deltaTime = (timestamp - this.lastTime) || 16.6;
        this.lastTime = timestamp;

        if (this.isHost) {
            this.updateAsHost(deltaTime);
        } else {
            this.updateAsGuest(deltaTime);
        }
        
        this.draw();
        
        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
    
    async updateAsHost(deltaTime) {
        const batch = db.batch();
        const enemiesToDeleteLocally = [];
        
        for(const e of this.enemies) {
            e.update(deltaTime, this);
            const enemyRef = this.enemiesRef.doc(e.id);
            if (e.hasReachedEnd) {
                this.lives--;
                e.health = 0;
            }
            if (e.isDead()) {
                if (!e.hasReachedEnd) {
                    const moneyField = this.isHost ? 'hostMoney' : 'guestMoney'; // Simplificado
                    this.gameRef.update({ [moneyField]: firebase.firestore.FieldValue.increment(e.bounty) });
                }
                batch.delete(enemyRef);
                enemiesToDeleteLocally.push(e.id);
            } else {
                batch.update(enemyRef, { x: e.x, y: e.y, health: e.health, pathIndex: e.pathIndex });
            }
        };

        if(this.lives <= 0) this.gameRef.update({ lives: 0, status: 'finished' });

        await batch.commit();
        this.enemies = this.enemies.filter(e => !enemiesToDeleteLocally.includes(e.id));
        
        this.updateProjectilesAndTowers(deltaTime);
    }

    updateAsGuest(deltaTime) {
        this.updateProjectilesAndTowers(deltaTime);
    }
    
    updateProjectilesAndTowers(deltaTime) {
        this.towers.forEach(tData => {
            // Cria uma instância temporária para simular os ataques
            const towerInstance = createTower(this, tData.x, tData.y, tData.type);
            towerInstance.level = tData.level || 1;
            towerInstance.applyLevelAttributes();
            towerInstance.cooldown = this.projectiles.filter(p=>p.ownerId === tData.id).length * 100; // Workaround para cooldown
            towerInstance.update(this.enemies, deltaTime, tData.id); // Passa o ID da torre para o projétil
        });

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (this.projectiles[i].update(deltaTime)) {
                if (this.isHost) {
                   const enemyRef = this.enemiesRef.doc(this.projectiles[i].target.id);
                   if (enemyRef) {
                       enemyRef.update({ health: firebase.firestore.FieldValue.increment(-this.projectiles[i].damage) });
                   }
                }
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawPath();
        this.towers.forEach(t => {
            const towerInstance = createTower(this, t.x, t.y, t.type);
            towerInstance.level = t.level;
            towerInstance.applyLevelAttributes();
            towerInstance.draw(this.ctx);
        });
        this.enemies.forEach(e => {
            new Enemy(this, e.type, e.id, e.x, e.y, e.health, e.maxHealth, e.pathIndex).draw(this.ctx)
        });
        this.projectiles.forEach(p => p.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.ui.draw();
    }
    
    drawPath() {
        this.ctx.strokeStyle = '#0f3460'; this.ctx.lineWidth = 40;
        this.ctx.beginPath(); this.ctx.moveTo(this.path[0].x, this.path[0].y);
        for(let i=1; i<this.path.length; i++){ this.ctx.lineTo(this.path[i].x, this.path[i].y); }
        this.ctx.stroke();
    }
    
    setSelectedTowerToBuild(type) {
        this.selectedTowerToBuild = (this.selectedTowerToBuild === type) ? null : type;
        this.ui.update();
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = event.clientX - rect.left;
        this.mousePos.y = event.clientY - rect.top;
    }

    async handleCanvasClick(event) {
        if(this.gameIsOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (this.selectedTowerToBuild) {
            const towerData = this.TOWER_DATA[this.selectedTowerToBuild];
            if (this.money < towerData.cost) return;

            const moneyField = this.isHost ? 'hostMoney' : 'guestMoney';
            await this.gameRef.update({
                [moneyField]: firebase.firestore.FieldValue.increment(-towerData.cost)
            });
            
            await this.towersRef.add({
                type: this.selectedTowerToBuild,
                x: x, y: y,
                level: 1,
                owner: this.myPlayerId
            });
            this.setSelectedTowerToBuild(null);
        } else { /* Upgrade logic here */ }
    }
    
    async startNextWave() {
        if (!this.isHost) return alert("Apenas o Host pode iniciar a onda!");
        const newWave = this.wave + 1;
        await this.gameRef.update({ wave: newWave });
        const waveInfo = this.WAVE_DATA[newWave];
        if(!waveInfo) return;
        
        let enemiesToSpawn = [];
        for (const type in waveInfo) {
            for(let i=0; i < waveInfo[type]; i++){ enemiesToSpawn.push(type); }
        }
        
        let spawnIndex = 0;
        const spawnInterval = setInterval(() => {
            if (enemiesToSpawn.length === 0) { clearInterval(spawnInterval); return; }
            const type = enemiesToSpawn.shift();
            const enemyId = `w${newWave}_${spawnIndex++}`;
            const baseEnemyData = this.ENEMY_DATA[type];
            const maxHealth = baseEnemyData.health * (1 + (newWave * 0.2));

            this.enemiesRef.doc(enemyId).set({
                type: type,
                x: this.path[0].x, y: this.path[0].y,
                pathIndex: 0,
                health: maxHealth,
                maxHealth: maxHealth,
                bounty: baseEnemyData.bounty,
                speed: baseEnemyData.speed
            });
        }, 500);
    }
}

class Enemy {
    constructor(game, type, id, x, y, health, maxHealth, pathIndex = 0) {
        this.game = game;
        this.type = type;
        this.id = id;
        this.x = x; this.y = y;
        this.health = health;
        this.maxHealth = maxHealth;
        Object.assign(this, ENEMY_DATA[type]);
        this.pathIndex = pathIndex;
        this.hasReachedEnd = false;
    }
    update(deltaTime, gameInstance) {
        const speed = this.speed;
        const targetPoint = gameInstance.path[this.pathIndex + 1];
        if (!targetPoint) {
            this.hasReachedEnd = true;
            return;
        }
        const angle = Math.atan2(targetPoint.y - this.y, targetPoint.x - this.x);
        const distanceToMove = speed * (deltaTime / 16.6);
        this.x += Math.cos(angle) * distanceToMove;
        this.y += Math.sin(angle) * distanceToMove;
        if (Math.hypot(this.x - targetPoint.x, this.y - targetPoint.y) < distanceToMove) {
            this.pathIndex++;
        }
    }
    draw(ctx) {
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x,this.y,12,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='red'; ctx.fillRect(this.x-15, this.y-25, 30, 5);
        ctx.fillStyle='lime'; ctx.fillRect(this.x-15, this.y-25, 30*(this.health/this.maxHealth),5);
    }
    isDead() { return this.health <= 0; }
}