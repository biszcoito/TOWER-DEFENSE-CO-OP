// enemy.js

const ENEMY_DATA = {
    // Inimigos Clássicos
    creep:    { health:100,  speed:1.5, bounty:5,  color:'#e63946' },
    sprinter: { health:70,   speed:4.5, bounty:8,  color:'#f72585' },
    brute:    { health:1500, speed:1,   bounty:25, color:'#7209b7' },
    mite:     { health:25,   speed:2.2, bounty:1,  color:'#f4a261' },
    guardian: { health:600,  speed:1.2, bounty:20, color:'#48cae4', shield: 300, shieldRegen: 15 },
    medic:    { health:250,  speed:1.6, bounty:18, color:'#90be6d', healRadius: 80, healAmount: 20, healRate: 2 },
    
    // === NOVOS INIMIGOS (SUA IDEIA!) ===
    centipede:{ health:150,  speed:1.8, bounty:10, color:'#b5e48c', segmentCount: 4, 
              dashSpeed: 8, dashDuration: 200, stunDuration: 1000,
              description: "CENTÍPEDE: Corpo segmentado. Cada segmento destruído causa um avanço rápido e uma breve parada." },
    
    nemesis:  { health:25000, speed:0.8, bounty:250,color:'#231942', isBoss: true,
              disableAuraRadius: 250, disableDuration: 3000, 
              description: "NÊMESIS: CHEFE. Sua aura maléfica desativa torres próximas temporariamente." },
};
const WAVE_DATA = [
    null, // Wave 0
    // Bloco 1 & 2 sem alterações...
    // === Bloco 1: O Básico ===
    { creep: 10 },                             // 1: Introduzindo o inimigo base.
    { creep: 15 },                             // 2: Um pouco mais do mesmo, fácil.
    { creep: 10, sprinter: 5 },                // 3: Introduzindo o Sprinter!
    { creep: 25 },                             // 4: Onda de Ritmo, só creeps.
    { brute: 1 },                              // 5: Introduzindo o Brute! Um mini-chefe.
    { creep: 15, sprinter: 10 },               // 6: Teste: Consegue lidar com velocidade e quantidade?
    { sprinter: 25 },                          // 7: Teste de velocidade pura. Canhões sofrem aqui.
    { creep: 20, brute: 1 },                   // 8: Teste: O Brute distrai enquanto os creeps passam.
    { sprinter: 15, brute: 2 },                // 9: Teste avançado.
    { brute: 5 },                              // 10: PAREDE! A primeira onda de Brutes.
    // === Bloco 2: Combinações e Economia ===
    { creep: 50 },                             // 11: Onda de Ritmo e dinheiro fácil.
    { mite: 40, creep: 10 },                   // 12: NOVO! Introduzindo o enxame de Mites. Dano em área é útil.
    { brute: 3, sprinter: 15 },                // 13: Agora o Brute vem com cobertura rápida.
    { sprinter: 40 },                          // 14: Outro teste de velocidade, mais intenso.
    { guardian: 4, creep: 15 },                // 15: NOVO! Introduzindo o Guardian e seus escudos. Foco é necessário.
    { brute: 2, sprinter: 30 },                // 16: Teste de prioridade. Quem focar?
    { mite: 100 },                             // 17: Onda de dinheiro massiva com Mites, mas longa e arriscada.
    { brute: 6, medic: 2 },                    // 18: NOVO! O Medic mantém os Brutes vivos. Priorize o curador!
    { brute: 5, guardian: 3, sprinter: 20 },   // 19: Onda bem difícil. Escudos e velocidade.
    { brute: 10, creep: 25 },                  // 20: PAREDE! Força o jogador a ter dano em área e focado.

    // === Bloco 3: Novos Desafios! ===
    { sprinter: 60 },                          // 21
    { creep: 100 },                            // 22
    { brute: 4, sprinter: 40, medic: 3 },      // 23
    { guardian: 10, creep: 20 },               // 24
    { centipede: 3, sprinter: 10 },            // 25: NOVO DESAFIO: Introduzindo o Centípede! Seu movimento é errático.
    { mite: 250 },                             // 26
    { sprinter: 90 },                          // 27
    { brute: 10, medic: 5 },                   // 28
    { centipede: 5, creep: 50 },               // 29: Teste de dano focado no Centípede em meio à multidão.
    { nemesis: 1 },                            // 30: CHEFE! O Nêmesis aparece sozinho para testar seu layout de torres.
    
    // As ondas subsequentes poderiam combinar esses inimigos de formas ainda mais diabólicas
    { sprinter: 120, centipede: 3 },           // 31: Velocidade e alvos que se movem rápido.
    { creep: 200, mite: 100 },                 // 32
    { guardian: 10, medic: 4, centipede: 2 },  // 33: Curandeiros e escudos protegendo os centípedes.
    { brute: 20 },                             // 34
    { centipede: 10 },                         // 35: Um enxame de centípedes. Caos total.
    //...etc
];


class Enemy {
    constructor(game, type){
        this.game = game;
        this.type = type;
        Object.assign(this, ENEMY_DATA[type]);
        
        const waveScalar = (1 + (this.game.wave * 0.1));
        this.maxHealth = Math.floor((this.health || 0) * waveScalar);
        this.health = this.maxHealth;
        this.x = this.game.path[0].x;
        this.y = this.game.path[0].y;
        this.pathIndex = 0;
        this.slowEffect = {multiplier:1, duration:0};
        this.hasReachedEnd = false;

        // ★★★ NOVO: Propriedades para novos efeitos de status ★★★
        this.stunTimer = 0;
        this.burnDamage = 0;
        this.burnDuration = 0;
        this.burnTickTimer = 1000; // Aplica dano de queimadura a cada 1s
        this.damageDebuff = {multiplier: 1, duration: 0}; // Para a habilidade 'Fragilizar' do gelo

        this.initSpecialMechanics(waveScalar);
    }
    
    initSpecialMechanics(waveScalar) {
        if (this.shield) {
            this.maxShield = Math.floor(this.shield * waveScalar);
            this.shield = this.maxShield;
            this.shieldRegenCooldown = 0;
        }
        if (this.type === 'medic') this.healCooldown = 0;
        if (this.type === 'centipede') {
            this.segments = [];
            for (let i = 0; i < this.segmentCount; i++) {
                this.segments.push({
                    health: this.maxHealth, x: this.x - i * 15, y: this.y,
                });
            }
            this.isDashing = false; this.dashTimer = 0; this.stunTimer = 0;
        }
    }

    update(deltaTime) {
        if(this.slowEffect.duration > 0) this.slowEffect.duration -= deltaTime; else this.slowEffect.multiplier = 1;
        
        // Lógica de Stun, Burn e Debuffs
        if (this.stunTimer > 0) { this.stunTimer -= deltaTime; return; }

        if(this.burnDuration > 0) {
            this.burnDuration -= deltaTime;
            this.burnTickTimer -= deltaTime;
            if (this.burnTickTimer <= 0) {
                this.takeDamage(this.burnDamage, 'burn');
                this.burnTickTimer = 1000;
            }
        } else {
            this.burnDamage = 0;
        }

        if(this.damageDebuff.duration > 0) this.damageDebuff.duration -= deltaTime; else this.damageDebuff.multiplier = 1;
        
        let currentSpeed = this.speed * this.slowEffect.multiplier;
        if (this.isDashing) {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) { this.isDashing = false; this.stunTimer = this.stunDuration; }
            currentSpeed = this.dashSpeed;
        }

        if (this.type === 'centipede') this.updateCentipedeMovement(currentSpeed);
        else this.updateStandardMovement(currentSpeed);
        
        this.runSpecialAbilities(deltaTime);
    }

    updateStandardMovement(currentSpeed) {
        const targetPoint = this.game.path[this.pathIndex + 1];
        if(!targetPoint) { this.hasReachedEnd = true; return; }
        const angle = Math.atan2(targetPoint.y - this.y, targetPoint.x - this.x);
        this.x += Math.cos(angle) * currentSpeed; this.y += Math.sin(angle) * currentSpeed;
        if(Math.hypot(this.x - targetPoint.x, this.y - targetPoint.y) < currentSpeed) this.pathIndex++;
    }

    updateCentipedeMovement(currentSpeed) {
        const head = this.segments.find(s => s.health > 0);
        if (!head) { this.health = 0; return; }
        this.x = head.x; this.y = head.y;

        const targetPoint = this.game.path[this.pathIndex + 1];
        if(!targetPoint) { this.hasReachedEnd = true; return; }
        const angleToPath = Math.atan2(targetPoint.y - head.y, targetPoint.x - head.x);
        head.x += Math.cos(angleToPath) * currentSpeed; head.y += Math.sin(angleToPath) * currentSpeed;
        if(Math.hypot(head.x - targetPoint.x, head.y - targetPoint.y) < currentSpeed) this.pathIndex++;

        for (let i = 1; i < this.segments.length; i++) {
            const currentSeg = this.segments[i]; const prevSeg = this.segments[i-1];
            if (Math.hypot(currentSeg.x - prevSeg.x, currentSeg.y - prevSeg.y) > 15) {
                const angleToPrev = Math.atan2(prevSeg.y - currentSeg.y, prevSeg.x - currentSeg.x);
                currentSeg.x += Math.cos(angleToPrev) * currentSpeed * 1.1;
                currentSeg.y += Math.sin(angleToPrev) * currentSpeed * 1.1;
            }
        }
    }
    
    runSpecialAbilities(deltaTime) {
        if (this.shield && this.shield < this.maxShield) {
            if (this.shieldRegenCooldown > 0) this.shieldRegenCooldown -= deltaTime;
            else { this.shield += (this.shieldRegen || 0) * (deltaTime / 1000); if (this.shield > this.maxShield) this.shield = this.maxShield; }
        }
        if (this.type === 'medic') {
            this.healCooldown -= deltaTime;
            if (this.healCooldown <= 0) { this.performHeal(); this.healCooldown = 1000 / (this.healRate / 2); }
        }
        if (this.type === 'nemesis') {
            for (const tower of this.game.towers) {
                if (Math.hypot(this.x - tower.x, this.y - tower.y) <= this.disableAuraRadius) tower.applyDisable(this.disableDuration);
            }
        }
    }

     takeDamage(amount, damageType = 'direct') {
        amount *= this.damageDebuff.multiplier;

        if (damageType !== 'burn' && this.shield) this.shieldRegenCooldown = 3000;
        if (this.shield > 0) {
            const damageToShield = Math.min(this.shield, amount);
            this.shield -= damageToShield; amount -= damageToShield;
        }
        if (amount <= 0) return;
        
        if (this.type === 'centipede') {
            const head = this.segments.find(s => s.health > 0);
            if (head) {
                head.health -= amount;
                if (head.health <= 0) {
                    if (this.game) {
                        this.game.money += this.bounty; this.game.score += this.bounty;
                        this.game.particles.push(new MoneyParticle(this.game, head.x, head.y, `+$${this.bounty}`));
                    }
                    if (this.segments.filter(s => s.health > 0).length > 0) { this.isDashing = true; this.dashTimer = this.dashDuration; }
                }
            }
        } else { 
            this.health -= amount;
        }
    }
    
    draw(ctx){
        // Aura do Nêmesis
        if (this.type === 'nemesis') {
            ctx.fillStyle = 'rgba(60, 20, 100, 0.2)'; ctx.strokeStyle = 'rgba(120, 80, 200, 0.5)';
            ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, this.disableAuraRadius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        // Desenha o corpo do inimigo (normal ou segmentado)
        if (this.type === 'centipede') {
            this.segments.forEach(seg => { if (seg.health > 0) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(seg.x, seg.y, 8, 0, Math.PI * 2); ctx.fill(); }});
        } else {
            const size = this.isBoss ? 20 : 12;
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, size, 0, Math.PI*2); ctx.fill();
        }

        // Desenha Barras de Vida/Escudo
        const barWidth = this.isBoss ? 50 : 30; const barY = this.y - (this.isBoss ? 35 : 25);
        let currentHealth = this.health; let maximumHealth = this.maxHealth;
        if(this.type === 'centipede'){
            currentHealth = this.segments.reduce((sum, seg) => sum + Math.max(0, seg.health), 0);
            maximumHealth = this.maxHealth * this.segmentCount;
        }
        ctx.fillStyle='red'; ctx.fillRect(this.x-barWidth/2, barY, barWidth, 5);
        ctx.fillStyle='lime'; ctx.fillRect(this.x-barWidth/2, barY, barWidth*(currentHealth/maximumHealth),5);
        
        if(this.shield > 0) {
            const shieldY = barY - 7;
             ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(this.x - barWidth/2, shieldY, barWidth, 4);
             ctx.fillStyle='#48cae4'; ctx.fillRect(this.x - barWidth/2, shieldY, barWidth*(this.shield/this.maxShield), 4);
        }
        
        // Desenha Efeitos Visuais
        if(this.slowEffect.multiplier < 1){
            ctx.fillStyle = 'rgba(0, 150, 255, 0.5)'; ctx.beginPath(); ctx.arc(this.x,this.y,14,0,Math.PI*2); ctx.fill();
        }
        if (this.type === 'medic') {
            ctx.strokeStyle = 'rgba(144, 190, 109, 0.4)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.healRadius, 0, Math.PI * 2); ctx.stroke();
        }
        if (this.damageDebuff.duration > 0) {
            ctx.strokeStyle = '#aa4444'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(this.x, this.y, 16, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x, this.y, 16, -Math.PI * 0.3, Math.PI * 0.3); ctx.stroke();
        }
        if(this.burnDuration > 0) {
            ctx.fillStyle = `rgba(255, ${Math.random()*150}, 0, 0.7)`;
            const burnRadius = Math.random() * 4 + 4;
            ctx.beginPath();
            ctx.arc(this.x + (Math.random()*16 - 8), this.y + (Math.random()*16 - 8), burnRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        if (this.stunTimer > 0) {
            ctx.fillStyle = 'yellow'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('Zzz', this.x, this.y - 30);
        }
    }
    
    isDead() {
        if (this.type === 'centipede') {
            return this.segments.every(s => s.health <= 0);
        }
        return this.health <= 0;
    }

     performHeal() {
        let healed = false;
        if (!this.game) return;
        for (const enemy of this.game.enemies) {
            if (enemy !== this && enemy.health < enemy.maxHealth) {
                if (Math.hypot(this.x - enemy.x, this.y - enemy.y) <= this.healRadius) {
                    enemy.health += this.healAmount;
                    if (enemy.health > enemy.maxHealth) enemy.health = enemy.maxHealth;
                    this.game.particles.push(new Particle(this.game, enemy.x, enemy.y, 15, 'rgba(144, 190, 109, 0.7)', 500, true));
                    healed = true;
                }
            }
        }
        if(healed) this.game.particles.push(new Particle(this.game, this.x, this.y, 20, 'rgba(200, 255, 200, 0.5)', 300));
    }
    
    applyStun(duration) {
        if(this.isBoss) return; // Chefes são imunes a atordoamento
        if(duration > this.stunTimer) this.stunTimer = duration;
    }
    
    applyBurn(damage, duration) {
        if (damage > this.burnDamage) {
            this.burnDamage = damage;
            this.burnDuration = duration;
        } else if (damage === this.burnDamage) { // Se for a mesma queimadura, reinicia a duração
            this.burnDuration = Math.max(this.burnDuration, duration);
        }
    }

    applyDamageDebuff(multiplier, duration){
        this.damageDebuff.multiplier = 1 + multiplier;
        this.damageDebuff.duration = Math.max(this.damageDebuff.duration, duration);
    }
    
    applySlow(multiplier, duration){
        this.slowEffect.multiplier = 1 - multiplier;
        this.slowEffect.duration = Math.max(this.slowEffect.duration, duration);
    }
}