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

class Enemy {
    constructor(game, type){
        this.game = game;
        this.type = type;
        Object.assign(this, ENEMY_DATA[type]);
        this.maxHealth = this.health * (1 + (this.game.wave * 0.2));
        this.health = this.maxHealth;
        this.x = this.game.path[0].x;
        this.y = this.game.path[0].y;
        this.pathIndex = 0;
        
        this.slowEffect = {multiplier:1, duration:0};

        this.hasReachedEnd = false;
    }
    update(deltaTime){
        const speed = this.speed * this.slowEffect.multiplier;
        
        if(this.slowEffect.duration > 0) this.slowEffect.duration -= deltaTime;
        else this.slowEffect.multiplier = 1;
        
        const targetPoint = this.game.path[this.pathIndex+1];
        if(!targetPoint) {
            // MUDANÇA: Apenas sinaliza que chegou ao fim. Não altera mais o jogo.
            this.hasReachedEnd = true;
            return;
        }
        const angle = Math.atan2(targetPoint.y - this.y, targetPoint.x - this.x);
        this.x += Math.cos(angle) * speed;
        this.y += Math.sin(angle) * speed;
        
        if(Math.hypot(this.x - targetPoint.x, this.y-targetPoint.y) < speed) this.pathIndex++;
    }
    draw(ctx){
        ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x,this.y,12,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='red'; ctx.fillRect(this.x-15, this.y-25, 30, 5);
        ctx.fillStyle='lime'; ctx.fillRect(this.x-15, this.y-25, 30*(this.health/this.maxHealth),5);
        
        if(this.slowEffect.multiplier < 1){
            ctx.fillStyle = 'rgba(0, 150, 255, 0.5)';
            ctx.beginPath(); ctx.arc(this.x,this.y,14,0,Math.PI*2); ctx.fill();
        }
    }
    applySlow(multiplier, duration){ this.slowEffect = {multiplier: 1-multiplier, duration}; }
    isDead() { return this.health <= 0; }
}