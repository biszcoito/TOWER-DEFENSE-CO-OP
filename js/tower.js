// js/tower.js

const TOWER_DATA = {
    gatling: { 
        name: 'Metralhadora', cost: 100, color: '#3a86ff',
        base: { damage: 8, range: 150, fireRate: 8 },
        levels: {
            path1: { name: "Alta Cadência", upgrades: [{cost:80, fireRate:6, description:"Canos Duplos"}, {cost:150, fireRate:4, description:"Alim. Automático"}, {cost:450, fireRate:2, description:"Modo Overdrive"}]},
            path2: { name: "Munição Pesada", upgrades: [{cost:90, damage:15, description:"Balas Cal. .50"}, {cost:180, damage:25, range:170, description:"Munição Perfurante"}, {cost:500, damage:50, description:"Balas de Urânio"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:2500, ability:"MAELSTROM", description:"Maelstrom: Dispara em todos os alvos no alcance"}]}
        }
    },
    cannon: { 
        name: 'Canhão', cost: 250, color: '#ffbe0b',
        base: { damage: 40, range: 200, fireRate: 60, splashRadius: 40 },
        levels: {
            path1: { name: "Explosão Maior", upgrades: [{cost:200, splashRadius:50, description:"Estilhaços Maiores"}, {cost:350, splashRadius:65, description:"Bomba Cluster"}, {cost:800, splashRadius:75, fireRate:45, description:"Grande Bombardeio"}]},
            path2: { name: "Impacto Focado", upgrades: [{cost:220, damage:70, description:"Projétil Pesado"}, {cost:400, damage:110, range:225, description:"Canhão Longo"}, {cost:950, damage:250, description:"Assassino de Brutes"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:3200, ability:"MOAB_SHREDDER", damage: 1000, description:"Bomba-Mãe: Dano massivo a um único alvo"}]}
        }
    },
    frost: {
        name: 'Torre de Gelo', cost: 175, color: '#00d4ff',
        base: { range: 130, slow: 0.3 },
        levels: {
            path1: { name: "Congelamento", upgrades: [{cost:150, slow:0.45, description:"Frio Intenso"}, {cost:225, slow:0.60, description:"Congelamento Rápido"}, {cost:600, slow:0.75, range:150, description:"Zero Absoluto"}]},
            path2: { name: "Gelo Afiado", upgrades: [{cost:180, range:145, description:"Expansão Ártica"}, {cost:300, hasDamageAura:true, damage:15, description:"Queimadura de Gelo"}, {cost:550, range:160, damage:40, description:"Tempestade de Gelo"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:2800, ability:"EMBRITTLEMENT", description:"Fragilizar: Alvos afetados recebem +50% de dano de todas as fontes"}]}
        }
    },
     interest_bank: {
        name: 'Banco', cost: 400, color: '#fca311',
        base: { income: 2, range: 0 },
        levels: {
            path1: { name: "Invest. Seguro", upgrades: [{cost:350, income:6, description:"Ações Blue Chip"}, {cost:700, income:15, description:"Títulos do Governo"}, {cost:2000, income:20, description:"Banco Central"}]},
            path2: { name: "Alto Risco", upgrades: [{cost:500, interestRate:0.1, description:"Juros 10%/onda"}, {cost:1500, interestRate:0.15, description:"Mercado Ações 15%"}, {cost:4000, interestRate:0.2, description:"Wall Street 20%"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:20000, ability:"INVESTMENT_SYNDICATE", description:"Sindicato: Gera +$2500 ao final de cada onda"}]}
        }
    },
    laser: {
        name: 'Laser', cost: 350, color: '#f94144',
        base: { damage: 50, range: 170 }, // Dano por segundo
        levels: {
            path1: { name: "Potência", upgrades: [{cost:275, damage:90, description:"Lente de Foco"}, {cost:450, damage:200, description:"Raio Superaquecido"}, {cost:1000, damage:500, description:"Raio Prismático"}]},
            path2: { name: "Alcance", upgrades: [{cost:200, range:190, description:"Lentes Longas"}, {cost:300, range:220, description:"Foco a Distância"}, {cost:600, range:260, description:"Raio de Satélite"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:4000, ability:"DEATH_RAY", description:"Raio da Morte: O raio atravessa e acerta múltiplos inimigos"}]}
        }
    },
    // ★★★ NOVA TORRE 1 ★★★
    damage_amp: {
        name: 'Amplificador', cost: 300, color: '#9d4edd',
        base: { range: 100, boost: 0.15 }, // Aumenta dano em 15%
        levels: {
            path1: { name: "Potência do Pulso", upgrades: [{cost:250, boost:0.5, description:"Aumento de 5%"}, {cost:700, boost:0.20, description:"Aumento de 20%"}, {cost:3500, boost:0.50, description:"Aumento de 50%"}]},
            path2: { name: "Área de Efeito", upgrades: [{cost:200, range:125, description:"Alcance +25%"}, {cost:500, range:150, description:"Alcance +50%"}, {cost:1500, range:180, description:"Alcance Global (Afeta todas as torres)"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:5000, ability:"OVERCLOCK", description:"Overclock: Fornece +50% de cadência de tiro às torres no alcance"}]}
        }
    },
    // ★★★ NOVA TORRE 2 ★★★
    drone_carrier: {
        name: 'Porta-Drones', cost: 700, color: '#e0c3fc',
        base: { range: 250, fireRate: 2000, droneCount: 1, droneDamage: 15, droneSpeed: 5, droneLifetime: 5000 }, // lança 1 drone a cada 2s
        levels: {
            path1: { name: "Enxame de Drones", upgrades: [{cost:500, droneCount: 2, description:"Compartimento Duplo"}, {cost:1200, droneCount: 3, description:"Baia de Drones Tripla"}, {cost:3000, droneCount: 5, description:"Enxame Massivo"}]},
            path2: { name: "Drones de Combate", upgrades: [{cost:600, droneDamage: 30, description:"Munição Superior"}, {cost:1500, droneSpeed: 7, droneLifetime: 7000, description:"Propulsores de Íon"}, {cost:3500, droneDamage: 80, droneSpeed: 9, description:"Drones Assassinos"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:8000, ability:"MOTHERSHIP", description:"Nave-Mãe: Lança um drone permanente e poderoso que orbita a torre"}]}
        }
    },
    // ★★★ NOVA TORRE 3 ★★★
    sniper: {
        name: 'Rifle de Precisão', cost: 650, color: '#495057',
        base: { damage: 80, range: 600, fireRate: 2500, targetPriority: 'strong' }, // Atira a cada 2.5s, prioriza o mais forte
        levels: {
            path1: { name: "Potência de Fogo", upgrades: [{cost:400, damage: 180, description:"Munição .50 BMG"}, {cost:1200, hasCrit: true, critChance: 0.1, critMultiplier: 3, description:"Tiro Certeiro (10% de chance de dano x3)"}, {cost:4000, damage: 400, critChance: 0.2, description:"Aniquilador de Chefes"}]},
            path2: { name: "Cadência e Controle", upgrades: [{cost:350, fireRate: 2000, description:"Ação de Ferrolho Rápido"}, {cost:900, fireRate: 1500, description:"Mira Avançada"}, {cost:3200, hasStun: true, stunDuration: 1000, description:"Projétil Atordoante (Atordoa por 1s)"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:12000, ability: "CHAIN_SHOT", description:"Tiro em Cadeia: O projétil ricocheteia para até 3 alvos próximos"}]}
        }
    },
    // ★★★ NOVA TORRE 4 ★★★
    fire_mage: {
        name: 'Mago do Fogo', cost: 450, color: '#e55934',
        base: { damage: 20, range: 120, fireRate: 900, splashRadius: 25, burnDamage: 10, burnDuration: 3000 }, // Dano inicial + dano de queimadura por 3s
        levels: {
            path1: { name: "Combustão Intensa", upgrades: [{cost:300, burnDamage: 25, description:"Brasas Vivas"}, {cost:800, burnDuration: 5000, description:"Inferno Duradouro"}, {cost:2500, burnDamage: 100, description:"Chama Azul"}]},
            path2: { name: "Magia Explosiva", upgrades: [{cost:400, damage: 35, splashRadius: 35, description:"Bola de Fogo Maior"}, {cost:1000, splashRadius: 50, description:"Grande Explosão"}, {cost:3800, ability:"METEOR", meteorDamage: 400, meteorRadius: 60, description:"Chuva de Meteoro"}]},
            path3: { name: "Super-Carga", upgrades: [{cost:10000, ability: "FIRE_WALL", description:"Muralha de Fogo: Conjura uma parede de fogo no caminho periodicamente"}]}
        }
    }
};

class Tower {
    constructor(game, x, y, type) {
        this.game = game; this.x = x; this.y = y; this.type = type;
        const data = TOWER_DATA[type];
        this.name = data.name; this.color = data.color || '#fff';
        
        Object.assign(this, data.base);
        this.initialCost = data.cost;
        
        this.path1Level = 0; this.path2Level = 0; this.path3Level = 0;
        this.chosenPath = 0; this.totalInvested = this.initialCost;
        
        this.cooldown = 0; this.target = null;
        this.damageBoost = 1.0; this.isDisabled = false; this.disabledTimer = 0;
    }
    
    upgrade(pathId) {
        if (this.isDisabled) return;

        const pathKey = `path${pathId}`;
        const currentLevel = this[`path${pathId}Level`];
        const pathData = TOWER_DATA[this.type].levels[pathKey];
        if (!pathData || currentLevel >= pathData.upgrades.length) return;
        
        // Regras de Bloqueio
        if (pathId === 1 && this.path2Level > 2) return;
        if (pathId === 2 && this.path1Level > 2) return;
        if (pathId === 3 && (this.path1Level < 3 && this.path2Level < 3)) return; // Bloqueia Path 3
        if ((pathId === 1 || pathId === 2) && this.path3Level > 0) return; // Bloqueia Path 1 e 2 se Path 3 foi comprado

        const upgradeData = pathData.upgrades[currentLevel];
        if (this.game.money < upgradeData.cost) return;

        this.game.money -= upgradeData.cost; this.totalInvested += upgradeData.cost;
        this[`path${pathId}Level`]++;
        
        Object.assign(this, upgradeData);
        this.recalculateBoost();

        this.game.ui.update();
    }
    
    onWaveEnd(game) {
        // Lógica de juros para o Banco
        if (this.interestRate > 0) {
            const interest = Math.floor(game.money * this.interestRate);
            game.money += interest;
            game.particles.push(new MoneyParticle(game, this.x, this.y - 20, `+$${interest} Juros!`));
        }
    }

    getSellValue() { return Math.floor(this.totalInvested * 0.7); }
    
    findTarget(enemies) {
        let closestDist = Infinity; this.target = null;
        for(const e of enemies){
            if (e.isDead()) continue;
            const dist = Math.hypot(this.x-e.x, this.y-e.y);
            if(dist <= this.range && dist < closestDist) { this.target = e; closestDist = dist; }
        }
    }
    
    recalculateBoost() {
        this.damageBoost = 1.0;
        for (const t of this.game.towers) {
            if (t.type === 'damage_amp' && !t.isDisabled && (Math.hypot(this.x - t.x, this.y - t.y) <= t.range || t.range >= 1000) ) {
                this.damageBoost += t.boost;
            }
        }
    }

    // ★★★ ALTERAÇÃO CHAVE: IMUNIDADE DO MAGO ★★★
    applyDisable(duration) {
        if (this.type === 'fire_mage') return;
        this.isDisabled = true; if (duration > this.disabledTimer) this.disabledTimer = duration; 
    }

    drawBase(ctx){
        ctx.fillStyle = this.isDisabled ? '#555' : this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 18, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='gold'; ctx.font='bold 12px Arial'; ctx.textAlign='center';
        const levelText = this.path3Level > 0 ? `${this.path1Level}-${this.path2Level}-${this.path3Level}` : `${this.path1Level}-${this.path2Level}`;
        ctx.fillText(levelText, this.x, this.y + 4);
        ctx.textAlign='left';
        if (this.isDisabled) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
            ctx.fillText('X', this.x, this.y + 8); ctx.textAlign = 'left';
        }
    }

    draw(ctx){ this.drawBase(ctx); }
    
    update(enemies, deltaTime){
        if (this.disabledTimer > 0) this.disabledTimer -= deltaTime;
        else if (this.isDisabled) {
            this.isDisabled = false;
            if (this.type === 'damage_amp') { this.game.towers.forEach(t => t.recalculateBoost()); }
        }
        
        if (this.isDisabled) { this.target = null; return; }
        
        this.cooldown -= deltaTime;
    }
}

class GatlingTower extends Tower {
    constructor(game, x, y){ super(game,x,y,'gatling'); }
    update(enemies, deltaTime){
        super.update(enemies,deltaTime);
        if(this.isDisabled || this.cooldown > 0) return;
        this.findTarget(enemies);
        if(this.target){
            if(this.ability === 'MAELSTROM') {
                for (const enemy of enemies) {
                    if (!enemy.isDead() && Math.hypot(this.x - enemy.x, this.y - enemy.y) <= this.range) {
                        this.game.projectiles.push(new Projectile(this.game, this.x, this.y, enemy, this.damage * this.damageBoost, {color:'#fff', size:3}));
                    }
                }
            } else {
                 this.game.projectiles.push(new Projectile(this.game, this.x, this.y, this.target, this.damage * this.damageBoost, {color:'#fff', size:3}));
            }
            this.cooldown = 1000 / (60 / this.fireRate);
        }
    }
    draw(ctx) { super.draw(ctx); if(!this.target || this.isDisabled) return; const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x); ctx.strokeStyle='#333'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x+20*Math.cos(angle), this.y+20*Math.sin(angle)); ctx.stroke(); }
}

class CannonTower extends Tower {
    constructor(game, x, y){ super(game,x,y,'cannon'); }
    update(enemies, deltaTime){
        super.update(enemies,deltaTime);
        if(this.isDisabled || this.cooldown > 0) return;
        this.findTarget(enemies);
        if(this.target){
            this.game.projectiles.push(new Projectile(this.game, this.x, this.y, this.target, this.damage * this.damageBoost, {color:'#ff9f1c', size:8}, this.splashRadius));
            this.cooldown = 1000 / (60 / this.fireRate);
        }
    }
}

class FrostTower extends Tower {
    constructor(game, x, y){ super(game,x,y,'frost'); }
    update(enemies, deltaTime){
        super.update(enemies,deltaTime);
        if(this.isDisabled) return;
        
        for(const e of enemies){
            if(Math.hypot(this.x - e.x, this.y - e.y) <= this.range) {
                e.applySlow(this.slow, 100);
                if(this.hasDamageAura) e.takeDamage(this.damage * this.damageBoost * (deltaTime / 1000));
                if(this.ability === "EMBRITTLEMENT") e.applyDamageDebuff(0.5, 100);
            }
        }
    }
    draw(ctx){ super.draw(ctx); if(!this.isDisabled){ ctx.fillStyle = 'rgba(0, 212, 255, 0.2)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2); ctx.fill(); } }
}

class LaserTower extends Tower {
    constructor(game, x, y){ super(game,x,y,'laser'); this.beamDuration = 0; }
    update(enemies, deltaTime){
        super.update(enemies, deltaTime);
        if (this.isDisabled) { this.beamDuration = 0; return; }
        
        if (!this.target || this.target.isDead() || Math.hypot(this.x - this.target.x, this.y - this.target.y) > this.range) { this.findTarget(enemies); }
        
        if (this.target) {
            this.target.takeDamage(this.damage * this.damageBoost * (deltaTime / 1000));
            this.beamDuration = 50; // Short duration for visual effect
        }

        if (this.beamDuration > 0) this.beamDuration -= deltaTime;
    }
    draw(ctx){ super.draw(ctx); if (this.target && this.beamDuration > 0 && !this.isDisabled) { ctx.save(); ctx.strokeStyle = '#fefee3'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.target.x, this.target.y); ctx.stroke(); ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.target.x, this.target.y); ctx.stroke(); ctx.restore(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.target.x, this.target.y, 5, 0, Math.PI * 2); ctx.fill(); } }
}

class InterestBank extends Tower {
    constructor(game, x, y){ super(game,x,y,'interest_bank'); this.incomeCooldown = 1000; }
    update(enemies, deltaTime){
        super.update(enemies, deltaTime);
        if (this.isDisabled) return;
        
        // Apenas a geração por segundo acontece aqui
        if (this.income > 0) {
            this.incomeCooldown -= deltaTime;
            if (this.incomeCooldown <= 0) {
                this.game.money += this.income;
                this.game.particles.push(new MoneyParticle(this.game, this.x, this.y-20, `+$${this.income}`));
                this.incomeCooldown = 1000;
            }
        }
    }
    draw(ctx){ super.drawBase(ctx); if(this.isDisabled) return; ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillText('$', this.x, this.y + 7); ctx.textAlign = 'left'; }
}

class DamageAmpTower extends Tower {
    constructor(game, x, y) { super(game, x, y, 'damage_amp'); }
    update(enemies, deltaTime) {
        super.update(enemies, deltaTime);
        if (this.isDisabled) return;

        // A lógica desta torre é passiva (recalculateBoost) e está nas outras torres e na venda/compra
    }
    draw(ctx) {
        super.draw(ctx);
        if(!this.isDisabled) {
            ctx.strokeStyle = 'rgba(157, 78, 221, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

class DroneCarrierTower extends Tower {
    constructor(game, x, y) { super(game, x, y, 'drone_carrier'); }
    update(enemies, deltaTime) {
        super.update(enemies, deltaTime);
        if (this.isDisabled || this.cooldown > 0) return;

        if (enemies.length > 0) {
            for(let i=0; i < this.droneCount; i++) {
                this.game.projectiles.push(new Drone(this.game, this.x, this.y, this.droneDamage * this.damageBoost, this.droneSpeed, this.droneLifetime));
            }
            this.cooldown = this.fireRate;
        }
    }
    draw(ctx){ super.drawBase(ctx); ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(this.x,this.y, 10,0,Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('✈', this.x, this.y + 6); ctx.textAlign = 'left'; }
}

class SniperTower extends Tower {
    constructor(game, x, y) { super(game, x, y, 'sniper'); }
    
    findTarget(enemies) {
        let bestTarget = null;
        let maxHealth = 0;

        for(const e of enemies){
            if (e.isDead()) continue;
            
            const dist = Math.hypot(this.x - e.x, this.y - e.y);
            if(dist <= this.range) {
                const currentHealth = e.isBoss ? e.health * 10 : e.health;
                if (currentHealth > maxHealth) {
                    maxHealth = currentHealth;
                    bestTarget = e;
                }
            }
        }
        this.target = bestTarget;
    }

    update(enemies, deltaTime) {
        super.update(enemies, deltaTime);
        if (this.isDisabled || this.cooldown > 0) return;

        if (!this.target || this.target.isDead() || Math.hypot(this.x - this.target.x, this.y - this.target.y) > this.range) {
            this.findTarget(enemies);
        }

        if (this.target) {
            let shotDamage = this.damage;
            if(this.hasCrit && Math.random() < this.critChance) {
                shotDamage *= this.critMultiplier;
                this.game.particles.push(new MoneyParticle(this.game, this.target.x, this.target.y-30, 'CRÍTICO!'));
            }

            const proj = new Projectile(this.game, this.x, this.y, this.target, shotDamage * this.damageBoost, {color: '#fff', size: 5, speed: 25});
            
            if (this.ability === "CHAIN_SHOT") {
                proj.ricochetsLeft = 3;
                proj.ricochetRange = 150;
            }
            if(this.hasStun) {
                proj.stunDuration = this.stunDuration;
            }

            this.game.projectiles.push(proj);
            this.cooldown = this.fireRate;
        }
    }
    draw(ctx){ super.draw(ctx); if(!this.target || this.isDisabled) return; const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x); ctx.strokeStyle='#333'; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x+25*Math.cos(angle), this.y+25*Math.sin(angle)); ctx.stroke(); }
}

class FireMageTower extends Tower {
    constructor(game, x, y) {
        super(game, x, y, 'fire_mage');
        this.fireWallTimer = 5000; 
    }

    update(enemies, deltaTime) {
        super.update(enemies, deltaTime);
        if (this.isDisabled) return;

        if (this.cooldown <= 0) {
            this.findTarget(enemies);
            if (this.target) {
                const proj = new FireballProjectile(this.game, this.x, this.y, this.target, this.damage * this.damageBoost, {
                    splashRadius: this.splashRadius,
                    burnDamage: this.burnDamage,
                    burnDuration: this.burnDuration
                });
                
                if(this.ability === "METEOR" && Math.random() < 0.25) { 
                     proj.isMeteor = true;
                     proj.damage = this.meteorDamage;
                     proj.splashRadius = this.meteorRadius;
                }

                this.game.projectiles.push(proj);
                this.cooldown = this.fireRate;
            }
        }

        if (this.ability === 'FIRE_WALL') {
            this.fireWallTimer -= deltaTime;
            if (this.fireWallTimer <= 0) {
                const pathIndex = Math.floor(Math.random() * (this.game.path.length - 2)) + 1;
                const p1 = this.game.path[pathIndex];
                const p2 = this.game.path[pathIndex+1];
                const wallX = (p1.x + p2.x) / 2;
                const wallY = (p1.y + p2.y) / 2;
                this.game.particles.push(new FireWallParticle(this.game, wallX, wallY, 10000, 50, this.damage * 5)); 
                this.fireWallTimer = 15000; 
            }
        }
    }
     draw(ctx){ super.draw(ctx); ctx.fillStyle = 'orange'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillText('🔥', this.x, this.y + 7); ctx.textAlign = 'left';}
}

function createTower(game, x, y, type) {
    switch (type) {
        case 'gatling': return new GatlingTower(game, x, y);
        case 'cannon': return new CannonTower(game, x, y);
        case 'frost': return new FrostTower(game, x, y);
        case 'laser': return new LaserTower(game, x, y);
        case 'interest_bank': return new InterestBank(game, x, y);
        case 'damage_amp': return new DamageAmpTower(game, x, y);
        case 'drone_carrier': return new DroneCarrierTower(game, x, y);
        case 'sniper': return new SniperTower(game, x, y);
        case 'fire_mage': return new FireMageTower(game, x, y);
        default: console.error(`Tipo de torre desconhecido para criação: ${type}`); return null;
    }
}