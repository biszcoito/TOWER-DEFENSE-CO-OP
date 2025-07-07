class UI {
    constructor(game) {
        this.game = game;
        this.selectedTower = null;

        // Mapeamento COMPLETO e preciso de todos os elementos interativos do game.html
        this.elements = {
            // Barra Superior
            userDisplayName: document.getElementById('user-display-name'),
            logoutBtn: document.getElementById('logout-btn'),
            themeMenuBtn: document.getElementById('theme-menu-btn'),
            themeMenu: document.getElementById('theme-menu'),
            brightnessSlider: document.getElementById('brightness-slider'),
            creditsBtn: document.getElementById('credits-btn'),

            // Painel Lateral Principal
            lives: document.getElementById('lives'),
            money: document.getElementById('money'),
            wave: document.getElementById('wave'),
            score: document.getElementById('score'),
            buildPanel: document.getElementById('build-panel'),
            startBtn: document.getElementById('start-wave-btn'),
            showRankingBtn: document.getElementById('show-ranking-btn'),

            // Painel de Upgrade (garantindo que todos os botões existam)
            upgradePanel: document.getElementById('upgrade-panel'),
            upgradeTitle: document.getElementById('upgrade-title'),
            upgradeLevel: document.getElementById('upgrade-level'),
            upgradePath1Btn: document.getElementById('upgrade-path1-btn'),
            upgradePath2Btn: document.getElementById('upgrade-path2-btn'),
            upgradePath3Btn: document.getElementById('upgrade-path3-btn'),
            sellBtn: document.getElementById('sell-btn'),
            
            // Modais e seus Botões
            scoreModal: document.getElementById('score-modal'),
            finalScore: document.getElementById('final-score'),
            closeScoreBtn: document.getElementById('close-score-btn'),
            rankingModal: document.getElementById('ranking-modal'),
            rankingList: document.getElementById('ranking-list'),
            closeRankingBtn: document.getElementById('close-ranking-btn'),
            myRankingDisplay: document.getElementById('my-ranking-display'),
            myRankText: document.getElementById('my-rank-text'),
            creditsModal: document.getElementById('credits-modal'),
            closeCreditsBtn: document.getElementById('close-credits-btn'),
        };

        this.init();
    }

    init() {
        this.addEventListeners();
        this.applySavedSettings();
        this.createBuildButtons();
        this.update();
    }
    
    addEventListeners() {
        this.elements.logoutBtn.addEventListener('click', () => firebase.auth().signOut());
        this.elements.themeMenuBtn.addEventListener('click', e => this.toggleThemeMenu(e));
        this.elements.creditsBtn.addEventListener('click', () => this.elements.creditsModal.style.display = 'flex');
        
        this.elements.themeMenu.querySelectorAll('[data-theme-value]').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); this.setTheme(e.target.dataset.themeValue); });
        });
        this.elements.brightnessSlider.addEventListener('input', e => this.setBrightness(e.target.value, true));
        this.elements.brightnessSlider.addEventListener('click', e => e.stopPropagation());
        window.addEventListener('click', () => { if (this.elements.themeMenu.style.display === 'flex') this.elements.themeMenu.style.display = 'none'; });

        this.elements.startBtn.addEventListener('click', () => { this.game.startNextWave(); this.elements.startBtn.disabled = true; });
        this.elements.showRankingBtn.addEventListener('click', () => this.showRanking());
        
        this.elements.closeScoreBtn.addEventListener('click', () => this.elements.scoreModal.style.display = 'none');
        this.elements.closeRankingBtn.addEventListener('click', () => this.elements.rankingModal.style.display = 'none');
        this.elements.closeCreditsBtn.addEventListener('click', () => this.elements.creditsModal.style.display = 'none');

        // ★★★ LISTENERS DE UPGRADE ★★★
        this.elements.upgradePath1Btn.addEventListener('click', e => this.handleUpgradeClick(1, e.target));
        this.elements.upgradePath2Btn.addEventListener('click', e => this.handleUpgradeClick(2, e.target));
        this.elements.upgradePath3Btn.addEventListener('click', e => this.handleUpgradeClick(3, e.target));
        this.elements.sellBtn.addEventListener('click', () => this.handleSellClick());
    }

    toggleThemeMenu(event) {
        event.stopPropagation();
        this.elements.themeMenu.style.display = this.elements.themeMenu.style.display === 'flex' ? 'none' : 'flex';
    }

    applySavedSettings() {
        this.elements.userDisplayName.textContent = `Olá, ${this.game.currentUser.displayName || 'Jogador'}`;
        this.elements.logoutBtn.style.display = 'inline-block';
        const savedTheme = localStorage.getItem('gameTheme') || 'dark';
        const savedBrightness = localStorage.getItem('gameBrightness') || 1;
        this.setTheme(savedTheme);
        this.setBrightness(parseFloat(savedBrightness) * 100, false);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gameTheme', theme);
    }

    setBrightness(level, save = true) {
        const brightnessValue = level / 100;
        document.documentElement.style.setProperty('--brightness', brightnessValue);
        this.elements.brightnessSlider.value = level;
        if (save) {
             localStorage.setItem('gameBrightness', brightnessValue);
        }
    }

    // ... (resto do arquivo ui.js continua igual ao que você já tinha)
    // createBuildButtons, handleUpgradeClick, handleSellClick, update, etc.
    // Todas as funções a partir daqui são as mesmas da versão anterior.
    createBuildButtons() {
        this.elements.buildPanel.innerHTML = `<h2>TORRES</h2>`;
        for(const type in TOWER_DATA){
            const data = TOWER_DATA[type];
            const btn = document.createElement('button');
            btn.className = 'build-button'; btn.dataset.type = type;
            btn.innerHTML = `<div>${data.name}</div><div class="cost">$${data.cost}</div>`;
            btn.onclick = () => this.game.setSelectedTowerToBuild(type);
            this.elements.buildPanel.appendChild(btn);
        }
    }

    handleUpgradeClick(pathId, buttonElement) { 
        if (this.selectedTower) {
            buttonElement.disabled = true;
            this.selectedTower.upgrade(pathId); 
        }
    }

    handleSellClick() { if (this.selectedTower) this.game.sellTower(this.selectedTower); }
    
    update() {
        this.elements.lives.textContent = this.game.lives; this.elements.money.textContent = this.game.money;
        this.elements.wave.textContent = this.game.wave; this.elements.score.textContent = this.game.score;
        
        this.elements.buildPanel.querySelectorAll('.build-button').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === this.game.selectedTowerToBuild);
            const cost = TOWER_DATA[btn.dataset.type].cost;
            btn.classList.toggle('disabled', this.game.money < cost);
        });
        
        if (this.selectedTower) {
            this.elements.upgradePanel.style.display = 'block'; this.updateUpgradePanel();
        } else {
            this.elements.upgradePanel.style.display = 'none';
        }
    }

    updateUpgradePanel() {
        const t = this.selectedTower; if (!t) return;
        const towerStaticData = TOWER_DATA[t.type]; if (!towerStaticData) return;
        this.elements.upgradeTitle.textContent = t.name;
        const levelText = t.path3Level > 0 ? `Nível: ${t.path1Level}-${t.path2Level}-${t.path3Level}` : `Nível: ${t.path1Level}-${t.path2Level}`;
        this.elements.upgradeLevel.textContent = levelText;

        const updateButton = (btn, pathNameEl, pathData, currentLevel, isLocked) => {
            if (!pathData || !pathData.upgrades[currentLevel]) {
                btn.disabled = true; btn.innerHTML = "Nível Máximo"; return;
            }
            pathNameEl.textContent = pathData.name;
            const upgrade = pathData.upgrades[currentLevel];
            if (isLocked) {
                btn.disabled = true; btn.innerHTML = "Caminho Bloqueado";
            } else {
                btn.disabled = this.game.money < upgrade.cost;
                btn.innerHTML = `${upgrade.description}<div class="cost">$${upgrade.cost}</div>`;
            }
        };
        const path3Data = towerStaticData.levels.path3;
        if (path3Data && this.elements.upgradePath3Container) this.elements.upgradePath3Container.style.display = 'block';
        else if (this.elements.upgradePath3Container) this.elements.upgradePath3Container.style.display = 'none';

        const isPath1Locked = t.path2Level >= 3 || t.path3Level > 0;
        const isPath2Locked = t.path1Level >= 3 || t.path3Level > 0;
        
        updateButton(this.elements.upgradePath1Btn, this.elements.upgradePath1Name, towerStaticData.levels.path1, t.path1Level, isPath1Locked);
        updateButton(this.elements.upgradePath2Btn, this.elements.upgradePath2Name, towerStaticData.levels.path2, t.path2Level, isPath2Locked);
        
        if(path3Data){
             const isPath3LockedPreReq = t.path1Level < 3 && t.path2Level < 3;
             updateButton(this.elements.upgradePath3Btn, this.elements.upgradePath3Name, path3Data, t.path3Level, false);
             if (isPath3LockedPreReq) {
                 this.elements.upgradePath3Btn.disabled = true; this.elements.upgradePath3Btn.innerHTML = "Requer Nível 3 em um caminho";
             }
        }
        this.elements.sellBtn.textContent = `Vender por $${t.getSellValue()}`;
    }
    
    draw() {
        this.update(); 
        if(this.game.selectedTowerToBuild){
            const data = TOWER_DATA[this.game.selectedTowerToBuild]; const {x, y} = this.game.mousePos; const ctx = this.game.ctx;
            ctx.globalAlpha = 0.5; ctx.fillStyle = data.color || '#888'; ctx.beginPath(); ctx.arc(x,y,18,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x, y, data.base.range || 0, 0, Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1.0;
        }
        if(this.selectedTower){
             const {x, y, range} = this.selectedTower; const ctx = this.game.ctx;
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,range || 0,0,Math.PI*2); ctx.stroke();
        }
    }

    enableStartWaveButton(){ if(this.elements.startBtn) this.elements.startBtn.disabled = false; }
    
     showScoreModal(score) {
        this.elements.finalScore.textContent = score.toLocaleString();
        this.elements.scoreModal.style.display = 'flex';
        this.submitScore(); // Submete a pontuação automaticamente
    }
    
    submitScore() {
        const user = this.game.currentUser;
        if (!user) return; // Se não houver usuário, não faz nada
        
        const newScore = this.game.score;
        if (newScore <= 0) return; // Não salva pontuação 0

        const userScoreRef = this.game.db.collection("highscores").doc(user.uid);
        
        // Usa uma transação para garantir a atomicidade da operação
        this.game.db.runTransaction(transaction => {
            return transaction.get(userScoreRef).then(doc => {
                const currentBestScore = doc.exists ? doc.data().score : 0;
                
                // SÓ ATUALIZA SE A NOVA PONTUAÇÃO FOR MAIOR
                if (newScore > currentBestScore) {
                    transaction.set(userScoreRef, {
                        name: user.displayName, // Usa o nome de jogador do perfil
                        score: newScore,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
        }).catch(error => console.error("Erro ao salvar pontuação: ", error));
    }
    
    async showRanking() {
        this.elements.rankingList.innerHTML = '<li>Carregando ranking...</li>';
        this.elements.myRankingDisplay.style.display = 'none';
        this.elements.rankingModal.style.display = 'flex';

        const currentUser = this.game.currentUser;
        
        try {
            const querySnapshot = await this.game.db.collection("highscores").orderBy("score", "desc").limit(50).get();
            let rankHtml = '';
            let rankCounter = 1;
            let playerInTop50 = false;
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                // Destaca a linha do jogador logado
                const isCurrentUser = doc.id === currentUser.uid;
                if (isCurrentUser) playerInTop50 = true;
                
                rankHtml += `<li class="${isCurrentUser ? 'current-user-rank' : ''}">
                                <span>#${rankCounter} ${data.name}</span>
                                <span class="score">${data.score.toLocaleString()}</span>
                             </li>`;
                rankCounter++;
            });
            this.elements.rankingList.innerHTML = rankHtml || '<li>Ninguém no ranking ainda!</li>';
            
            // Se o jogador não está no top 50, busca sua posição separadamente
            if (!playerInTop50) {
                const userDoc = await this.game.db.collection('highscores').doc(currentUser.uid).get();
                if (userDoc.exists) {
                    const userScore = userDoc.data().score;
                    // Conta quantos têm score maior para achar o rank
                    const higherScores = await this.game.db.collection('highscores').where('score', '>', userScore).get();
                    const userRank = higherScores.size + 1;

                    this.elements.myRankText.innerHTML = `Sua posição: <strong>#${userRank}</strong> com ${userScore.toLocaleString()} pontos.`;
                    this.elements.myRankingDisplay.style.display = 'block';
                }
            }

        } catch (error) {
            console.error("Erro ao carregar o ranking:", error);
            this.elements.rankingList.innerHTML = '<li>Ocorreu um erro ao carregar o ranking.</li>';
        }
    }};