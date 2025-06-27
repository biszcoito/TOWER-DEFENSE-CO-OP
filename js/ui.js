// js/ui.js

class UI {
    constructor(game){
        this.game = game;
        this.selectedTower = null;
        
        // ★ CO-OP ★ Lista de elementos simplificada, sem os modais de ranking/pontuação.
        this.elements = {
            lives: document.getElementById('lives'), 
            money: document.getElementById('money'),
            wave: document.getElementById('wave'), 
            buildPanel: document.getElementById('build-panel'),
            upgradePanel: document.getElementById('upgrade-panel'), 
            startBtn: document.getElementById('start-wave-btn'),
            
            // Elementos para status do Jogador 2
            player2Stats: document.getElementById('player2-stats'),
            p2Money: document.getElementById('p2-money'),

            // O painel do jogador 1 precisa de um ID para podermos mudar o título
            player1Title: document.querySelector('#player1-stats h3')
        };

        // ★ CO-OP ★ Apenas o listener do botão de iniciar onda.
        this.elements.startBtn.onclick = () => this.game.startNextWave();
        
        this.createBuildButtons();
        this.update();
    }
    
    // Função para criar os botões de construção das torres
    createBuildButtons() {
        this.elements.buildPanel.innerHTML = `<h2>Construir</h2>`;
        for(const type in TOWER_DATA){
            const data = TOWER_DATA[type];
            const btn = document.createElement('button');
            btn.className = 'build-button'; 
            btn.dataset.type = type;
            btn.innerHTML = `
                <div>${data.name}</div>
                <div class="cost">$${data.cost}</div>
            `;
            btn.onclick = () => this.game.setSelectedTowerToBuild(type);
            this.elements.buildPanel.appendChild(btn);
        }
    }

    // Função que atualiza toda a informação da interface
    update() {
        if (!this.game) return; // Checagem de segurança
        
        // Status principais do jogo (agora vêm do Firebase via game.js)
        this.elements.lives.textContent = this.game.lives;
        this.elements.money.textContent = this.game.money;
        this.elements.wave.textContent = this.game.wave;
        
        // Destaque do botão de construção
        this.elements.buildPanel.querySelectorAll('.build-button').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === this.game.selectedTowerToBuild);
        });
        
        // Painel de Upgrade (ainda não funcional no co-op, mas não quebra mais)
        if(this.selectedTower) {
            // Lógica de upgrade será adicionada aqui depois
            this.elements.upgradePanel.style.display = 'block';
        } else {
            this.elements.upgradePanel.style.display = 'none';
        }
    }

    // ★ CO-OP ★ Função para atualizar a UI com dados de ambos os jogadores
    updatePlayerStats(hostMoney, guestMoney, isHost, isGuestConnected) {
        const p2Stats = this.elements.player2Stats;

        if (isGuestConnected) { // Mostra o painel do P2 apenas se ele estiver conectado
            p2Stats.style.display = 'block';

            if (isHost) {
                // Eu sou o Host (Jogador 1)
                this.elements.player1Title.textContent = "Jogador 1 (Você)";
                this.elements.p2Money.textContent = guestMoney;
            } else {
                // Eu sou o Convidado (Jogador 2)
                this.elements.player1Title.textContent = "Jogador 2 (Você)";
                
                // O painel do "outro jogador" agora mostra o P1
                const p2Title = this.elements.player2Stats.querySelector('h3');
                p2Title.textContent = 'Jogador 1';
                this.elements.p2Money.textContent = hostMoney;
            }
        } else {
            p2Stats.style.display = 'none';
        }
    }

    // Função que desenha elementos da UI sobre o canvas
    draw() {
        this.update(); // Atualiza os textos da UI a cada frame
        
        // Desenha o preview da torre no cursor
        if(this.game.selectedTowerToBuild){
            const data = TOWER_DATA[this.game.selectedTowerToBuild];
            const {x,y} = this.game.mousePos;
            const ctx = this.game.ctx;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = data.color; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.arc(x, y, data.levels[0].range, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
        
        // Desenha o alcance da torre selecionada
        if(this.selectedTower){
             const {x,y,range} = this.selectedTower;
             const ctx = this.game.ctx;
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 2;
             ctx.beginPath(); ctx.arc(x, y, range, 0, Math.PI * 2); ctx.stroke();
        }
    }

    enableStartWaveButton(){ 
        if(this.elements.startBtn) this.elements.startBtn.disabled = false; 
    }
}