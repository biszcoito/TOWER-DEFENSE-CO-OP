// js/ui.js

class UI {
    constructor(game){
        this.game = game; 
        this.selectedTower = null;
        
        this.elements = {
            lives: document.getElementById('lives'), 
            money: document.getElementById('money'),
            wave: document.getElementById('wave'), 
            score: document.getElementById('score'),
            buildPanel: document.getElementById('build-panel'),
            upgradePanel: document.getElementById('upgrade-panel'),
            upgradeTitle: document.getElementById('upgrade-title'),
            upgradeLevel: document.getElementById('upgrade-level'),
            upgradePath1Name: document.getElementById('upgrade-path1-name'),
            upgradePath1Btn: document.getElementById('upgrade-path1-btn'),
            upgradePath2Name: document.getElementById('upgrade-path2-name'),
            upgradePath2Btn: document.getElementById('upgrade-path2-btn'),
            // Elementos do Caminho 3
            upgradePath3Container: document.getElementById('upgrade-path3-container'),
            upgradePath3Name: document.getElementById('upgrade-path3-name'),
            upgradePath3Btn: document.getElementById('upgrade-path3-btn'),
            sellBtn: document.getElementById('sell-btn'),
            startBtn: document.getElementById('start-wave-btn'),
            scoreModal: document.getElementById('score-modal'),
            finalScore: document.getElementById('final-score'),
            playerNameInput: document.getElementById('player-name-input'),
            submitScoreBtn: document.getElementById('submit-score-btn'),
        };

        this.elements.startBtn.onclick = () => { this.game.startNextWave(); this.elements.startBtn.disabled = true; };
        this.elements.upgradePath1Btn.onclick = () => this.handleUpgradeClick(1);
        this.elements.upgradePath2Btn.onclick = () => this.handleUpgradeClick(2);
        this.elements.upgradePath3Btn.onclick = () => this.handleUpgradeClick(3);
        this.elements.sellBtn.onclick = () => this.handleSellClick();
        if(this.elements.submitScoreBtn) this.elements.submitScoreBtn.onclick = () => this.submitScore();
        
        this.createBuildButtons();
        this.update();
    }
    
    createBuildButtons() {
        this.elements.buildPanel.innerHTML = `<h2>Construir</h2>`;
        for(const type in TOWER_DATA){
            const data = TOWER_DATA[type];
            const btn = document.createElement('button');
            btn.className = 'build-button'; btn.dataset.type = type;
            btn.innerHTML = `<div>${data.name}</div><div class="cost">$${data.cost}</div>`;
            btn.onclick = () => this.game.setSelectedTowerToBuild(type);
            this.elements.buildPanel.appendChild(btn);
        }
    }

    handleUpgradeClick(pathId) { if (this.selectedTower) this.selectedTower.upgrade(pathId); }
    handleSellClick() { if (this.selectedTower) this.game.sellTower(this.selectedTower); }
    
    update() {
        this.elements.lives.textContent = this.game.lives;
        this.elements.money.textContent = this.game.money;
        this.elements.wave.textContent = this.game.wave;
        this.elements.score.textContent = this.game.score;
        
        this.elements.buildPanel.querySelectorAll('.build-button').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === this.game.selectedTowerToBuild);
            const cost = TOWER_DATA[btn.dataset.type].cost;
            btn.classList.toggle('disabled', this.game.money < cost);
        });
        
        if (this.selectedTower) {
            this.elements.upgradePanel.style.display = 'block';
            this.updateUpgradePanel();
        } else {
            this.elements.upgradePanel.style.display = 'none';
        }
    }

    updateUpgradePanel() {
        const t = this.selectedTower;
        if (!t) return;
        const towerStaticData = TOWER_DATA[t.type];
        if (!towerStaticData) return;

        this.elements.upgradeTitle.textContent = t.name;
        const levelText = t.path3Level > 0 
            ? `Nível: ${t.path1Level}-${t.path2Level}-${t.path3Level}` 
            : `Nível: ${t.path1Level}-${t.path2Level}`;
        this.elements.upgradeLevel.textContent = levelText;

        const updateButton = (btn, pathNameEl, pathData, currentLevel, isLocked) => {
            if (!pathData || !pathData.upgrades[currentLevel]) {
                btn.disabled = true; 
                btn.innerHTML = "Nível Máximo";
                return;
            }

            pathNameEl.textContent = pathData.name;
            const upgrade = pathData.upgrades[currentLevel];
            
            if (isLocked) {
                btn.disabled = true;
                btn.innerHTML = "Caminho Bloqueado";
            } else {
                btn.disabled = this.game.money < upgrade.cost;
                btn.innerHTML = `${upgrade.description}<div class="cost">$${upgrade.cost}</div>`;
            }
        };
        
        const path3Data = towerStaticData.levels.path3;
        
        // Esconde ou mostra o container do Caminho 3
        if (path3Data && this.elements.upgradePath3Container) {
            this.elements.upgradePath3Container.style.display = 'block';
        } else if (this.elements.upgradePath3Container) {
            this.elements.upgradePath3Container.style.display = 'none';
        }

        const isPath1Locked = t.path2Level > 2 || t.path3Level > 0;
        const isPath2Locked = t.path1Level > 2 || t.path3Level > 0;
        
        updateButton(this.elements.upgradePath1Btn, this.elements.upgradePath1Name, towerStaticData.levels.path1, t.path1Level, isPath1Locked);
        updateButton(this.elements.upgradePath2Btn, this.elements.upgradePath2Name, towerStaticData.levels.path2, t.path2Level, isPath2Locked);
        
        if(path3Data){
             const isPath3LockedPreReq = t.path1Level < 3 && t.path2Level < 3;
             updateButton(this.elements.upgradePath3Btn, this.elements.upgradePath3Name, path3Data, t.path3Level, false);
             if (isPath3LockedPreReq) {
                 this.elements.upgradePath3Btn.disabled = true;
                 this.elements.upgradePath3Btn.innerHTML = "Requer Nível 3 em um caminho";
             }
        }
        
        this.elements.sellBtn.textContent = `Vender por $${t.getSellValue()}`;
    }
    
    draw() {
        this.update(); 
        if(this.game.selectedTowerToBuild){
            const data = TOWER_DATA[this.game.selectedTowerToBuild];
            const {x, y} = this.game.mousePos;
            const ctx = this.game.ctx;

            const canPlace = true; // Lógica futura de posicionamento aqui
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = canPlace ? data.color || '#888' : '#ff0000';
            ctx.beginPath(); ctx.arc(x,y,18,0,Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = '#fff'; ctx.lineWidth=2; ctx.beginPath();
            ctx.arc(x, y, data.base.range || 0, 0, Math.PI*2);
            ctx.stroke();
            
            ctx.globalAlpha = 1.0;
        }
        
        if(this.selectedTower){
             const {x, y, range} = this.selectedTower;
             const ctx = this.game.ctx;
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth=2;
             ctx.beginPath(); ctx.arc(x,y,range || 0,0,Math.PI*2); ctx.stroke();
        }
    }

    enableStartWaveButton(){ if(this.elements.startBtn) this.elements.startBtn.disabled = false; }
    
    showScoreModal(score){ if(this.elements.scoreModal) this.elements.scoreModal.style.display = 'flex'; if(this.elements.finalScore) this.elements.finalScore.textContent = score; }
    
    submitScore() {
        const playerName = this.elements.playerNameInput.value.trim();
        const score = this.game.score;
        if (!playerName) { alert('Por favor, digite um nome!'); return; }
        
        this.elements.submitScoreBtn.disabled = true;
        this.elements.submitScoreBtn.textContent = 'Enviando...';

        // Usa a variável global `db` inicializada em firebase-init.js
        db.collection("highscores").add({
            name: playerName, score: score, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log("Pontuação salva!");
            if(this.elements.scoreModal) this.elements.scoreModal.style.display = 'none';
        }).catch((error) => {
            console.error("Erro ao salvar pontuação: ", error);
            alert("Não foi possível enviar a pontuação. Verifique o console para mais detalhes.");
            this.elements.submitScoreBtn.disabled = false;
            this.elements.submitScoreBtn.textContent = 'Enviar Pontuação';
        });
    }
}