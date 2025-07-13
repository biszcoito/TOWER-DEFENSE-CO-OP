class UI {
    constructor(game) {
        this.game = game;
        this.selectedTower = null;

        // Mapeamento dos elementos (sem alterações na estrutura)
        this.elements = {
            userDisplayName: document.getElementById('user-display-name'), logoutBtn: document.getElementById('logout-btn'),
            themeMenuBtn: document.getElementById('theme-menu-btn'), themeMenu: document.getElementById('theme-menu'),
            brightnessSlider: document.getElementById('brightness-slider'), creditsBtn: document.getElementById('credits-btn'),
            lives: document.getElementById('lives'), money: document.getElementById('money'), wave: document.getElementById('wave'), score: document.getElementById('score'),
            buildPanel: document.getElementById('build-panel'), startBtn: document.getElementById('start-wave-btn'),
            showRankingBtn: document.getElementById('show-ranking-btn'),
            towerPopup: document.getElementById('tower-popup-menu'), popupTitle: document.getElementById('popup-title'),
            popupLevel: document.getElementById('popup-level'), popupPath1Btn: document.getElementById('popup-path1-btn'),
            popupPath2Btn: document.getElementById('popup-path2-btn'), popupPath3Container: document.getElementById('popup-path3-container'),
            popupPath3Btn: document.getElementById('popup-path3-btn'), popupSellBtn: document.getElementById('popup-sell-btn'),
            scoreModal: document.getElementById('score-modal'), finalScore: document.getElementById('final-score'),
            closeScoreBtn: document.getElementById('close-score-btn'), rankingModal: document.getElementById('ranking-modal'),
            rankingList: document.getElementById('ranking-list'), closeRankingBtn: document.getElementById('close-ranking-btn'),
            myRankingDisplay: document.getElementById('my-ranking-display'), myRankText: document.getElementById('my-rank-text'),
            creditsModal: document.getElementById('credits-modal'), closeCreditsBtn: document.getElementById('close-credits-btn'),
        };
        this.init();
    }

    init() { this.addEventListeners(); this.applySavedSettings(); this.createBuildButtons(); this.update(); }
    
    addEventListeners() {
        // Listeners da UI principal (sem alterações)
        this.elements.logoutBtn.addEventListener('click', () => { localStorage.removeItem('loggedInPlayer'); window.location.replace('index.html'); });
        this.elements.themeMenuBtn.addEventListener('click', e => { e.stopPropagation(); this.elements.themeMenu.style.display = 'flex'; });
        this.elements.creditsBtn.addEventListener('click', () => this.elements.creditsModal.style.display = 'flex');
        this.elements.themeMenu.querySelectorAll('[data-theme-value]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); this.setTheme(e.target.dataset.themeValue); }));
        this.elements.brightnessSlider.addEventListener('input', e => this.setBrightness(e.target.value, true));
        window.addEventListener('click', () => { if (this.elements.themeMenu.style.display === 'flex') this.elements.themeMenu.style.display = 'none'; });
        this.elements.startBtn.addEventListener('click', () => { this.game.startNextWave(); this.elements.startBtn.disabled = true; });
        this.elements.showRankingBtn.addEventListener('click', () => this.showRanking());
        this.elements.closeScoreBtn.addEventListener('click', () => this.elements.scoreModal.style.display = 'none');
        this.elements.closeRankingBtn.addEventListener('click', () => this.elements.rankingModal.style.display = 'none');
        this.elements.closeCreditsBtn.addEventListener('click', () => this.elements.creditsModal.style.display = 'none');
        
        // Listeners do Pop-up da Torre
        this.elements.towerPopup.addEventListener('click', e => e.stopPropagation());
        this.elements.popupPath1Btn.addEventListener('click', e => this.handleUpgradeClick(1, e.target));
        this.elements.popupPath2Btn.addEventListener('click', e => this.handleUpgradeClick(2, e.target));
        this.elements.popupPath3Btn.addEventListener('click', e => this.handleUpgradeClick(3, e.target));
        this.elements.popupSellBtn.addEventListener('click', () => this.handleSellClick());
    }

    // ★★★ FIX: Lógica de seleção agora é mais clara e robusta ★★★
    selectTower(tower) {
        // Se a torre a ser selecionada é a que já está selecionada, deseleciona.
        if (tower && this.selectedTower === tower) {
            this.selectedTower = null;
        } else {
            // Caso contrário, seleciona a nova torre (que pode ser nula, se clicou no nada)
            this.selectedTower = tower;
        }

        // Mostra ou esconde o pop-up com base no estado de `selectedTower`
        if (this.selectedTower) {
            this.showTowerPopup(this.selectedTower);
            this.game.setSelectedTowerToBuild(null); // Deseleciona qualquer construção
        } else {
            this.hideTowerPopup();
        }
    }
    
    // As funções restantes (applySavedSettings, setTheme, etc.) e a lógica dos popups
    // já estão corretas e não precisam de mais alterações.

    applySavedSettings() {
        this.elements.userDisplayName.textContent = `Olá, ${this.game.currentUser.name || 'Jogador'}`;
        const theme = localStorage.getItem('gameTheme') || 'dark'; const brightness = localStorage.getItem('gameBrightness') || 1;
        this.setTheme(theme); this.setBrightness(parseFloat(brightness) * 100, false);
    }
    
    setTheme(theme) { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('gameTheme', theme); }
    setBrightness(level, save) { const val = level / 100; document.documentElement.style.setProperty('--brightness', val); this.elements.brightnessSlider.value = level; if (save) localStorage.setItem('gameBrightness', val); }

    createBuildButtons() {
        for(const type in TOWER_DATA){
            const data = TOWER_DATA[type]; const btn = document.createElement('button'); btn.className = 'build-button'; btn.dataset.type = type;
            btn.innerHTML = `<div>${data.name}</div><div class="cost">$${data.cost}</div>`;
            btn.onclick = () => this.game.setSelectedTowerToBuild(type);
            this.elements.buildPanel.appendChild(btn);
        }
    }

    showTowerPopup(tower) {
        this.updateTowerPopup();
        this.elements.towerPopup.style.display = 'flex';
        requestAnimationFrame(() => {
            const canvasRect = this.game.canvas.getBoundingClientRect();
            const popupRect = this.elements.towerPopup.getBoundingClientRect();
            let left = canvasRect.left + tower.x - (popupRect.width / 2);
            let top = canvasRect.top + tower.y - popupRect.height - 30;
            if (left < 10) left = 10;
            if (left + popupRect.width > window.innerWidth - 10) left = window.innerWidth - popupRect.width - 10;
            if (top < 10) top = 10;
            this.elements.towerPopup.style.left = `${left}px`;
            this.elements.towerPopup.style.top = `${top}px`;
            this.elements.towerPopup.classList.add('visible');
        });
    }

    hideTowerPopup() { this.elements.towerPopup.classList.remove('visible'); setTimeout(() => { if (!this.selectedTower) this.elements.towerPopup.style.display = 'none'; }, 200); }
    handleUpgradeClick(path, btn) {
        if (this.selectedTower) {
            const moneyBefore = this.game.money;

            // Tenta fazer o upgrade
            this.selectedTower.upgrade(path);
            
            const moneyAfter = this.game.money;

            // Se o upgrade foi bem-sucedido (o dinheiro mudou), damos um feedback visual
            if (moneyBefore !== moneyAfter) {
                btn.classList.add('upgrade-success'); // Adiciona uma classe para feedback visual
                setTimeout(() => {
                    btn.classList.remove('upgrade-success');
                }, 300); // Remove a classe após 300ms
            }
            
            // Em vez de desabilitar o botão permanentemente, a gente simplesmente
            // atualiza o pop-up, que irá desabilitar o botão se for necessário 
            // (por falta de dinheiro ou nível máximo).
            this.updateTowerPopup(); 
        }
    }
    handleSellClick() { if (this.selectedTower) this.game.sellTower(this.selectedTower); }

    update() {
        this.elements.lives.textContent = this.game.lives; this.elements.money.textContent = this.game.money;
        this.elements.wave.textContent = this.game.wave; this.elements.score.textContent = this.game.score.toLocaleString();
        this.elements.buildPanel.querySelectorAll('.build-button').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === this.game.selectedTowerToBuild);
            btn.disabled = this.game.money < TOWER_DATA[btn.dataset.type].cost;
        });
        if (this.selectedTower && this.elements.towerPopup.style.display === 'flex') this.updateTowerPopup();
    }
    
    updateTowerPopup() {
        const t = this.selectedTower; if (!t) return;
        const data = TOWER_DATA[t.type]; if (!data) return;
        const unlocked = this.game.currentUser.unlocked_upgrades || {};

        this.elements.popupTitle.textContent = t.name;
        this.elements.popupLevel.textContent = `Nível: ${t.path1Level}-${t.path2Level}-${t.path3Level}`;

        const updateBtn = (btn, path, currentLvl, pathId, isLocked) => {
            btn.className = ''; if (!path || currentLvl >= path.upgrades.length) { btn.disabled = true; btn.innerHTML = "NÍVEL MÁXIMO"; return; }
            const up = path.upgrades[currentLvl]; const reqLvl = pathId === 3 ? 4 : currentLvl + 2;
            const upId = `${t.type}_level${reqLvl}`;
            if (isLocked) { btn.disabled = true; btn.innerHTML = "Caminho Bloqueado"; btn.classList.add('path-locked'); }
            else if (!unlocked[upId]) { btn.disabled = true; btn.innerHTML = `LIBERE NA LOJA<span class="cost">💎</span>`; btn.classList.add('path-locked');}
            else { btn.disabled = this.game.money < up.cost; btn.innerHTML = `${up.description}<span class="cost">$${up.cost}</span>`;}
        };

        const path3Data = data.levels.path3;
        this.elements.popupPath3Container.style.display = path3Data ? 'block' : 'none';
        updateBtn(this.elements.popupPath1Btn, data.levels.path1, t.path1Level, 1, t.path2Level >= 3 || t.path3Level > 0);
        updateBtn(this.elements.popupPath2Btn, data.levels.path2, t.path2Level, 2, t.path1Level >= 3 || t.path3Level > 0);
        if(path3Data) updateBtn(this.elements.popupPath3Btn, path3Data, t.path3Level, 3, t.path1Level < 3 && t.path2Level < 3);
        
        this.elements.popupSellBtn.textContent = `Vender por $${t.getSellValue()}`;
    }
    
    draw() {
        this.update(); const ctx = this.game.ctx;
        if(this.game.selectedTowerToBuild){
            const data = TOWER_DATA[this.game.selectedTowerToBuild]; const {x,y} = this.game.mousePos;
            const canPlace = !this.game.isMouseOnPath;
            ctx.globalAlpha = 0.5; ctx.fillStyle = data.color || '#888';
            ctx.beginPath(); ctx.arc(x,y,18,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle = canPlace ? '#fff' : 'var(--danger-color)'; ctx.lineWidth=2;
            ctx.beginPath(); ctx.arc(x, y, data.base.range || 0, 0, Math.PI*2); ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
        if(this.selectedTower){
             const {x, y, range} = this.selectedTower; ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth=2;
             ctx.beginPath(); ctx.arc(x,y,range || 0,0,Math.PI*2); ctx.stroke();
        }
    }

    enableStartWaveButton(){ if(this.elements.startBtn) this.elements.startBtn.disabled = false; }
    showScoreModal(score) {
        this.elements.finalScore.textContent = score.toLocaleString();
        this.elements.scoreModal.style.display = 'flex';
        this.submitScoreAndAwardCrystals();
    }
    
    submitScoreAndAwardCrystals() {
    const user = this.game.currentUser;
    const newScore = this.game.score;

    // Não faz nada se o usuário não estiver logado ou a pontuação for zero
    if (!user || !user.uid || newScore <= 0) {
        return;
    }

    const highscoreRef = this.game.db.collection("highscores").doc(user.uid);
    const playerRef = this.game.db.collection("players").doc(user.uid);

    // ★★★ LÓGICA DE RANKING E CRISTAIS APRIMORADA ★★★
    this.game.db.runTransaction(transaction => {
        return transaction.get(highscoreRef).then(highscoreDoc => {
            let currentHighscore = 0;
            if (highscoreDoc.exists) {
                currentHighscore = highscoreDoc.data().score || 0;
            }

            // Apenas atualiza o highscore se a nova pontuação for maior
            if (newScore > currentHighscore) {
                console.log(`Nova pontuação recorde! ${newScore} > ${currentHighscore}`);
                transaction.set(highscoreRef, {
                    name: user.name,
                    score: newScore,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                console.log(`A pontuação final (${newScore}) não superou o recorde de ${currentHighscore}.`);
            }

            // A lógica de premiar cristais continua a mesma, baseada na pontuação da partida atual
            const crystalsEarned = Math.floor(newScore / 500);
            if (crystalsEarned > 0) {
                console.log(`Premiando ${crystalsEarned} cristais.`);
                transaction.update(playerRef, {
                    crystals: firebase.firestore.FieldValue.increment(crystalsEarned)
                });
            }
        });
    }).then(() => {
        console.log("Transação de pontuação e cristais concluída com sucesso!");
    }).catch(error => {
        console.error("Erro na transação de pontuação:", error);
    });
}
    
    async showRanking() {
        this.elements.rankingList.innerHTML = '<li>Carregando...</li>';
        this.elements.rankingModal.style.display = 'flex'; const user = this.game.currentUser; if (!user.uid) return;
        try {
            const snap = await this.game.db.collection("highscores").orderBy("score", "desc").limit(50).get();
            this.elements.rankingList.innerHTML = snap.empty ? '<li>Ninguém no ranking ainda!</li>' : snap.docs.map((doc, i) => {
                const data = doc.data(); const isMe = doc.id === user.uid;
                return `<li class="${isMe ? 'current-user-rank' : ''}"><span>#${i + 1} ${data.name}</span><span class="score">${data.score.toLocaleString()}</span></li>`;
            }).join('');
        } catch (error) { this.elements.rankingList.innerHTML = '<li>Erro ao carregar ranking.</li>'; }
    }
}