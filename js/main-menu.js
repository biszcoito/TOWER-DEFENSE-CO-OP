document.addEventListener('DOMContentLoaded', () => {
    // Sistema simplificado usando o ID salvo no localStorage.
    
    // As instâncias 'db' e 'TOWER_DATA' estão disponíveis globalmente a partir de
    // 'firebase-init.js' e 'tower.js', respectivamente.

    let playerDataListener = null; // Para poder cancelar o listener ao sair

    // 1. Pega o ID do jogador salvo no login.
    const loggedInPlayerId = localStorage.getItem('loggedInPlayer');
    if (!loggedInPlayerId) {
        // Se não houver ID, não há sessão. Volta para o login.
        window.location.replace('index.html');
        return; // Encerra o script.
    }

    // 2. Mapeamento dos elementos da página.
    const elements = {
        loader: document.getElementById('loader-overlay'),
        menuContainer: document.getElementById('main-menu-container'),
        playerName: document.getElementById('player-name'),
        playerCrystals: document.getElementById('player-crystals'),
        logoutBtn: document.getElementById('logout-btn-menu'),
        showLevelsBtn: document.getElementById('show-levels-btn'),
        showStoreBtn: document.getElementById('show-store-btn'),
        levelsView: document.getElementById('levels-view'),
        storeView: document.getElementById('store-view'),
        level1Btn: document.getElementById('level1-btn'),
        storeGrid: document.getElementById('store-grid'),
    };

    // 3. Função para carregar dados do jogador e manter atualizados
    function loadPlayerData() {
        // 'onSnapshot' ouve as mudanças em tempo real (ex: quando o jogador gasta cristais)
        playerDataListener = db.collection('players').doc(loggedInPlayerId).onSnapshot(doc => {
            if (doc.exists) {
                // Se o documento existe, atualiza a UI com os dados.
                const playerData = doc.data();
                
                // Garante que os campos existam para evitar erros
                if (!playerData.crystals) playerData.crystals = 0;
                if (!playerData.unlocked_upgrades) playerData.unlocked_upgrades = {};
                
                updateUI(playerData);
                renderStore(playerData);

                // Mostra o conteúdo da página após os dados serem carregados.
                elements.loader.style.display = 'none';
                elements.menuContainer.style.display = 'block';
            } else {
                // Se o ID do jogador não corresponde a um documento, é um erro. Desloga.
                console.error("ID de jogador salvo é inválido. Deslogando.");
                logout();
            }
        }, error => {
            // Se houver erro de rede ou permissão, desloga para segurança.
            console.error("Erro ao carregar dados do jogador:", error);
            logout();
        });
    }

    // 4. Funções da UI
    function updateUI(playerData) {
        elements.playerName.textContent = `Olá, ${playerData.name}`;
        elements.playerCrystals.textContent = (playerData.crystals || 0).toLocaleString();
    }
    
    function renderStore(playerData) {
        elements.storeGrid.innerHTML = '';
        const upgradeCosts = { level2: 150, level3: 400, level4: 850 };
        for (const towerType in TOWER_DATA) {
            const tower = TOWER_DATA[towerType];
            const towerGroup = document.createElement('div');
            towerGroup.className = 'store-tower-group';
            towerGroup.innerHTML = `<h2>${tower.name}</h2>`;

            for (let level = 2; level <= 4; level++) {
                const upgradeId = `${towerType}_level${level}`;
                const cost = upgradeCosts[`level${level}`];
                const isUnlocked = playerData.unlocked_upgrades[upgradeId] === true;
                const canAfford = playerData.crystals >= cost;
                
                const card = document.createElement('div');
                card.className = `store-card ${isUnlocked ? 'unlocked' : ''} ${!canAfford && !isUnlocked ? 'cannot-afford' : ''}`;
                
                let buttonHtml = isUnlocked 
                    ? `<button class="unlocked-btn" disabled>DESBLOQUEADO</button>`
                    : `<button class="buy-btn" data-upgrade-id="${upgradeId}" data-cost="${cost}" ${!canAfford ? 'disabled' : ''}>${cost} 💎</button>`;
                
                card.innerHTML = `
                    <div>
                        <h4>Liberar Nível ${level === 4 ? 'Super-Carga' : level}</h4>
                        <p>${level === 4 ? "Acesso à habilidade final da torre." : "Permite evoluções deste nível."}</p>
                    </div>
                    ${buttonHtml}
                `;
                towerGroup.appendChild(card);
            }
            elements.storeGrid.appendChild(towerGroup);
        }
        document.querySelectorAll('.buy-btn').forEach(btn => btn.addEventListener('click', handlePurchase));
    }

    // 5. Funções de Ação do Usuário
    function handlePurchase(e) {
        const button = e.target;
        button.disabled = true;
        button.textContent = "Processando...";
        
        const upgradeId = button.dataset.upgradeId;
        const cost = parseInt(button.dataset.cost);
        const playerRef = db.collection('players').doc(loggedInPlayerId);

        // Transação para garantir compra segura
        db.runTransaction(transaction => {
            return transaction.get(playerRef).then(playerDoc => {
                if (!playerDoc.exists) throw "Jogador não encontrado!";
                const data = playerDoc.data();
                if ((data.crystals || 0) < cost) {
                    alert("Cristais insuficientes!");
                    throw "Cristais insuficientes!";
                }
                const newCrystals = data.crystals - cost;
                const newUnlocked = data.unlocked_upgrades || {};
                newUnlocked[upgradeId] = true;
                transaction.update(playerRef, { crystals: newCrystals, unlocked_upgrades: newUnlocked });
            });
        }).catch(error => {
            console.error("Erro na transação de compra: ", error);
            // A UI se corrigirá sozinha por causa do 'onSnapshot'.
        });
    }

    function logout() {
        if (playerDataListener) {
            playerDataListener(); // Cancela o listener do onSnapshot para evitar erros no console.
        }
        localStorage.removeItem('loggedInPlayer');
        window.location.replace('index.html');
    }

    // 6. Adiciona os Event Listeners da página
    elements.logoutBtn.addEventListener('click', logout);
    elements.level1Btn.addEventListener('click', () => { window.location.href = 'game.html'; });

    elements.showLevelsBtn.addEventListener('click', () => {
        elements.levelsView.classList.add('active-view');
        elements.storeView.classList.remove('active-view');
        elements.showLevelsBtn.classList.add('active');
        elements.showStoreBtn.classList.remove('active');
    });

    elements.showStoreBtn.addEventListener('click', () => {
        elements.storeView.classList.add('active-view');
        elements.levelsView.classList.remove('active-view');
        elements.showStoreBtn.classList.add('active');
        elements.showLevelsBtn.classList.remove('active');
    });

    // 7. Inicia o processo carregando os dados.
    loadPlayerData();
});