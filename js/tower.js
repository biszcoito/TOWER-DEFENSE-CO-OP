// --- DADOS CENTRAIS DAS TORRES ---
const TOWER_DATA = {
    gatling: { name: 'Metralhadora', cost: 100, color: '#3a86ff', projectile: { type:'bullet', color:'#fff', size:3}, levels:[
        {damage: 8, range: 150, fireRate: 8, cost:0},
        {damage:12, range: 170, fireRate: 6, cost:80},
        {damage:18, range: 190, fireRate: 4, cost:150, description:"Munição Perfurante"}]},
    cannon: { name: 'Canhão', cost: 250, color: '#ffbe0b', projectile: { type:'shell', color:'#ff9f1c', size:8}, levels:[
        {damage:40, range: 200, fireRate: 60, splashRadius:40, cost:0},
        {damage:65, range: 220, fireRate: 55, splashRadius:45, cost:200},
        {damage:90, range: 240, fireRate: 50, splashRadius:50, cost:350, description:"Chamas Residuais"}]},
    frost: { name: 'Torre de Gelo', cost: 175, color: '#00d4ff', levels:[
        {range: 130, slow: 0.3, cost:0},
        {range: 145, slow: 0.4, cost:150},
        {range: 160, slow: 0.5, cost:225, description:"Chance de Congelar"}]},
    drone_carrier: { name: 'Porta-Drone', cost: 400, color: '#ccc', projectile: { type:'bullet', color:'#f6e58d', size:3}, levels:[
        {cost:0, drones:1, orbitRadius: 80, droneDamage: 15, droneFireRate: 15, droneRange: 180},
        {cost:300, drones:1, orbitRadius: 80, droneDamage: 22, droneFireRate: 12, droneRange: 200},
        {cost:550, drones:3, orbitRadius: 90, droneDamage: 25, droneFireRate: 10, droneRange: 220, miniOrbitRadius: 50, description: "Asa-Mãe"}]},
};

// --- FÁBRICA DE TORRES ---
function createTower(game, x, y, type) {
    switch (type) {
        case 'gatling': return new GatlingTower(game, x, y);
        case 'cannon': return new CannonTower(game, x, y);
        case 'frost': return new FrostTower(game, x, y);
        case 'drone_carrier': return new DroneCarrier(game, x, y);
        default: return new Tower(game, x, y, type);
    }
}

// --- CLASSE BASE ---
class Tower {
    constructor(game, x, y, type) {
        this.game = game; this.x = x; this.y = y; this.type = type;
        const baseData = TOWER_DATA[type];
        this.name = baseData.name; this.color = baseData.color;
        this.levels = baseData.levels; this.level = 1;
        this.applyLevelAttributes();
        this.cooldown = 0; this.target = null;
    }
    applyLevelAttributes() {
        const data = this.levels[this.level - 1];
        Object.assign(this, data);
        this.upgradeCost = this.levels[this.level]?.cost || Infinity;
    }
    upgrade() {
        if(this.level >= this.levels.length || this.game.money < this.upgradeCost) return;
        this.game.money -= this.upgradeCost; this.level++; this.applyLevelAttributes();
        this.game.ui.update();
    }
    findTarget(enemies) {
        let closestDist = Infinity; this.target = null;
        for(const e of enemies){
            const dist = Math.hypot(this.x-e.x, this.y-e.y);
            if(dist <= this.range && dist < closestDist) {
                closestDist = dist; this.target = e;
            }
        }
    }
    drawBase(ctx){
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 18, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='gold'; ctx.font='12px Arial'; ctx.textAlign='center';
        ctx.fillText(this.level, this.x, this.y + 4); ctx.textAlign='left';
    }
    draw(ctx){ this.drawBase(ctx); }
    update(enemies, deltaTime){ this.cooldown -= deltaTime; }
}

// --- TORRES ESPECÍFICAS (Gatling, Cannon, Frost sem alterações) ---
class GatlingTower extends Tower {
    constructor(game, x, y){ super(game,x,y,'gatling'); }
    update(enemies, deltaTime){
        super.update(enemies,deltaTime);
        this.findTarget(enemies);
        if(this.target && this.cooldown <= 0){
            this.game.projectiles.push(new Projectile(this.game, this.x, this.y, this.target, this.damage, TOWER_DATA.gatling.projectile));
            this.cooldown = 1000 / (60/this.fireRate);
        }
    }
    draw(ctx){
        super.draw(ctx);
        if(!this.target) return;
        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        ctx.strokeStyle='#333'; ctx.lineWidth=6; ctx.beginPath();
        ctx.moveTo(this.x, this.y); ctx.lineTo(this.x+20*Math.cos(angle), this.y+20*Math.sin(angle));
        ctx.stroke();
    }
}
class CannonTower extends Tower {
    constructor(game, x, y){ super(game,x,y,'cannon'); }
    update(enemies, deltaTime){
        super.update(enemies,deltaTime);
        this.findTarget(enemies);
        if(this.target && this.cooldown <= 0){
            this.game.projectiles.push(new Projectile(this.game, this.x, this.y, this.target, this.damage, TOWER_DATA.cannon.projectile, this.splashRadius));
            this.cooldown = 1000 / (60/this.fireRate);
        }
    }
}
class FrostTower extends Tower {
    constructor(game, x, y){ super(game,x,y,'frost'); }
    update(enemies, deltaTime){
        for(const e of enemies){
            if(Math.hypot(this.x-e.x, this.y-e.y) <= this.range){
                e.applySlow(this.slow, 100);
            }
        }
    }
    draw(ctx){
        super.draw(ctx);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2); ctx.fill();
    }
}

// --- VERSÃO CORRIGIDA DA DRONECARRIER ---
class DroneCarrier extends Tower {
    constructor(game, x, y) {
        // CORREÇÃO: A chamada super() DEVE ser a primeira linha de código executável.
        // É isso que estava causando o erro "Must call super constructor...".
        super(game, x, y, 'drone_carrier');
    }

    // Este método é crucial. Ele sobrescreve o da classe base `Tower`.
    applyLevelAttributes() {
        // Primeiro, chama a implementação da classe base para carregar os novos atributos.
        super.applyLevelAttributes();
        // Em seguida, (re)gera os drones com base nos atributos recém-carregados.
        this.spawnDrones();
    }

    spawnDrones() {
        // Inicializa/limpa o array de drones. Isso é seguro e necessário.
        this.droneObjects = [];
        const droneCount = this.drones; // `this.drones` é o NÚMERO de drones do TOWER_DATA.
        
        for (let i = 0; i < droneCount; i++) {
            const isMini = this.level === 3 && i > 0;
            
            this.droneObjects.push({
                isMain: !isMini,
                angle: (Math.PI * 2 / droneCount) * i,
                cooldown: 0,
                target: null,
                orbitR: isMini ? this.miniOrbitRadius : this.orbitRadius, 
                damage: isMini ? 10 : this.droneDamage,
                range: isMini ? 150 : this.droneRange,
                fireRate: isMini ? 30 : this.droneFireRate,
            });
        }
    }

    update(enemies, deltaTime) {
        // A lógica de update não mudou e estava correta.
        this.droneObjects.forEach(drone => {
            drone.angle += 0.01;
            drone.cooldown -= deltaTime;
            
            const x = this.x + drone.orbitR * Math.cos(drone.angle);
            const y = this.y + drone.orbitR * Math.sin(drone.angle);
            
            let target = null;
            let closestDist = Infinity;
            for (const enemy of enemies) {
                const dist = Math.hypot(x - enemy.x, y - enemy.y);
                if (dist <= drone.range && dist < closestDist) {
                    closestDist = dist;
                    target = enemy;
                }
            }
            
            if (target && drone.cooldown <= 0) {
                this.game.projectiles.push(new Projectile(this.game, x, y, target, drone.damage, TOWER_DATA.drone_carrier.projectile));
                drone.cooldown = 1000 / (60 / drone.fireRate);
            }
        });
    }

    draw(ctx) {
        // A lógica de draw não mudou e estava correta.
        super.draw(ctx);
        this.droneObjects.forEach(drone => {
            const x = this.x + drone.orbitR * Math.cos(drone.angle);
            const y = this.y + drone.orbitR * Math.sin(drone.angle);
            
            ctx.fillStyle = drone.isMain ? '#f0f0f0' : '#aaa';
            ctx.beginPath();
            ctx.arc(x, y, drone.isMain ? 8 : 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}