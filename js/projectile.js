// js/projectile.js

class Particle {
    constructor(game, x, y, radius, color, duration, expand = false) {
        this.game = game; this.x = x; this.y = y;
        this.initialRadius = radius; this.color = color;
        this.initialDuration = duration; this.duration = duration;
        this.expand = expand; this.radius = expand ? 0 : radius;
    }
    update(deltaTime) {
        this.duration -= deltaTime;
        if(this.duration < 0) this.duration = 0;
        const lifePercent = this.duration / this.initialDuration;
        this.radius = this.expand ? this.initialRadius * (1 - lifePercent) : this.initialRadius * lifePercent;
        return this.duration <= 0;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.duration / this.initialDuration;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Projectile {
    constructor(game, x, y, target, damage, config, splashRadius = 0) {
        this.game = game; this.x = x; this.y = y;
        this.target = target; this.damage = damage;
        this.speed = 10; this.splashRadius = splashRadius;
        
        // Propriedades para novas habilidades
        this.ricochetsLeft = 0;
        this.ricochetRange = 0;
        this.stunDuration = 0;
        this.alreadyHit = [target];
        
        Object.assign(this, config);
    }
    update(deltaTime) {
        if (!this.target || this.target.isDead()) return true; 
        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        if (Math.hypot(this.x - this.target.x, this.y - this.target.y) < 10) {
            this.hit();
            // Só é removido se não houver mais ricochetes
            return this.ricochetsLeft <= 0;
        }
        return false;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    hit() {
        if(!this.target || this.target.isDead()) return;

        this.target.takeDamage(this.damage);

        if(this.stunDuration > 0) {
            this.target.applyStun(this.stunDuration);
        }
        
        if (this.splashRadius > 0) { 
            this.game.particles.push(new Particle(this.game, this.x, this.y, this.splashRadius, 'rgba(255,159,28,0.5)', 300, true));
            for (const e of this.game.enemies) {
                if (e !== this.target && !e.isDead() && Math.hypot(this.x - e.x, this.y - e.y) <= this.splashRadius) {
                    e.takeDamage(this.damage * 0.5);
                }
            }
        }

        // Lógica de ricochete
        if (this.ricochetsLeft > 0) {
            this.ricochetsLeft--;
            let newTarget = null;
            let closestDist = Infinity;

            for(const e of this.game.enemies) {
                if(!e.isDead() && !this.alreadyHit.includes(e)) {
                    const dist = Math.hypot(this.target.x - e.x, this.target.y - e.y);
                    if(dist <= this.ricochetRange && dist < closestDist) {
                        closestDist = dist;
                        newTarget = e;
                    }
                }
            }
            if(newTarget){
                this.target = newTarget;
                this.alreadyHit.push(newTarget);
                this.damage *= 0.75;
            } else {
                this.ricochetsLeft = 0; // Para de ricochetear se não encontrar alvo
            }
        }
    }
}

class MoneyParticle extends Particle {
    constructor(game, x, y, text) {
        super(game, x, y, 0, '', 1000); 
        this.text = text; this.initialY = y;
    }
    update(deltaTime) { this.y -= 0.5; return super.update(deltaTime); }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.duration / this.initialDuration;
        ctx.fillStyle = '#fca311';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Drone extends Projectile {
    constructor(game, x, y, damage, speed, lifetime) {
        super(game, x, y, null, damage, {color: '#e0c3fc', size: 5}); 
        this.speed = speed;
        this.lifetime = lifetime;
        this.angle = Math.random() * Math.PI * 2;
    }

    findTarget() {
        let closestDist = Infinity;
        let bestTarget = null;
        for (const e of this.game.enemies) {
            if (e.isDead()) continue;
            const dist = Math.hypot(this.x - e.x, this.y - e.y);
            if (dist < closestDist) {
                closestDist = dist;
                bestTarget = e;
            }
        }
        this.target = bestTarget;
    }

    update(deltaTime) {
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) return true; 

        if (!this.target || this.target.isDead()) {
            this.findTarget();
            if(!this.target) {
                 // Vaga sem rumo se não encontrar alvo
                 this.x += Math.cos(this.angle) * this.speed * 0.5;
                 this.y += Math.sin(this.angle) * this.speed * 0.5;
                 return false;
            }
        }
        
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if (Math.hypot(this.x - this.target.x, this.y - this.target.y) < 10) {
            this.hit();
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class FireballProjectile extends Projectile {
    constructor(game, x, y, target, damage, config) {
        super(game, x, y, target, damage, config);
        this.color = '#e55934';
        this.size = 8;
        this.isMeteor = false; 
    }
    
    hit(){
        if(!this.target || this.target.isDead()) return;
        
        if(this.isMeteor) {
             this.game.particles.push(new Particle(this.game, this.target.x, this.target.y, this.splashRadius * 1.5, 'rgba(255, 100, 0, 0.8)', 500, true));
        } else {
             this.game.particles.push(new Particle(this.game, this.x, this.y, this.splashRadius, 'rgba(255,159,28,0.5)', 300, true));
        }

        for (const e of this.game.enemies) {
            if (!e.isDead() && Math.hypot(this.x - e.x, this.y - e.y) <= this.splashRadius) {
                const damageDealt = e === this.target ? this.damage : this.damage * 0.5;
                e.takeDamage(damageDealt);
                if (this.burnDamage > 0) {
                    e.applyBurn(this.burnDamage, this.burnDuration);
                }
            }
        }
        // Garante que o projétil seja destruído após o hit.
        this.ricochetsLeft = 0;
    }
    
    draw(ctx){
         super.draw(ctx);
         ctx.fillStyle = `rgba(255, ${Math.random()*150}, 0, 0.5)`;
         ctx.beginPath();
         ctx.arc(this.x, this.y, this.size * (Math.random() * 0.5 + 0.8), 0, Math.PI * 2);
         ctx.fill();
    }
}

class FireWallParticle extends Particle {
    constructor(game, x, y, duration, radius, dps){
        super(game, x, y, radius, 'rgba(255, 87, 51, 0.4)', duration);
        this.dps = dps; 
        this.hitCooldown = new Map(); 
    }

    update(deltaTime){
        for(const e of this.game.enemies) {
            if(!e.isDead() && Math.hypot(this.x - e.x, this.y - e.y) < this.radius) {
                if(!this.hitCooldown.has(e) || this.hitCooldown.get(e) <= 0){
                    e.takeDamage(this.dps * 0.2, 'burn'); 
                    this.hitCooldown.set(e, 200);
                }
            }
        }
        
        this.hitCooldown.forEach((value, key, map) => {
             if (key.isDead() || key.hasReachedEnd) {
                 map.delete(key);
             } else {
                 map.set(key, value - deltaTime);
             }
        });

        return super.update(deltaTime);
    }
}