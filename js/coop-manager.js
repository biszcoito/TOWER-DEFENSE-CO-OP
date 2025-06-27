// Crie o arquivo: js/coop-manager.js

class CoopManager {
    constructor() {
        // Elementos do Lobby
        this.createGameBtn = document.getElementById('create-game-btn');
        this.joinCodeInput = document.getElementById('join-code-input');
        this.joinGameBtn = document.getElementById('join-game-btn');
        
        // Containers de Tela
        this.lobbyContainer = document.getElementById('lobby-container');
        this.gameContainer = document.getElementById('game-container');
        
        // Listeners
        this.createGameBtn.addEventListener('click', () => this.createGame());
        this.joinGameBtn.addEventListener('click', () => this.joinGame());
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    startGame(gameId, isHost) {
        this.lobbyContainer.style.display = 'none';
        this.gameContainer.style.display = 'flex';
        
        // Exibe o código da sala na UI do jogo
        document.getElementById('room-code-display').textContent = gameId;

        // Inicia a classe principal do jogo, agora passando os parâmetros de co-op
        window.game = new Game(document.getElementById('gameCanvas'), gameId, isHost, myPlayerId);
    }

    async createGame() {
        this.createGameBtn.disabled = true;
        const gameId = this.generateRoomCode();
        
        try {
            // Cria a estrutura inicial do jogo no Firestore
            await db.collection('games').doc(gameId).set({
                status: 'waiting',
                hostPlayerId: myPlayerId,
                guestPlayerId: null,
                wave: 0,
                lives: 20,
                hostMoney: 500,
                guestMoney: 500,
                lastUpdateTime: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Inicia o jogo para este cliente como HOST
            this.startGame(gameId, true);

        } catch (error) {
            console.error("Erro ao criar o jogo:", error);
            alert("Não foi possível criar o jogo. Tente novamente.");
            this.createGameBtn.disabled = false;
        }
    }

    async joinGame() {
        const gameId = this.joinCodeInput.value.trim().toUpperCase();
        if (!gameId) {
            alert("Por favor, insira um código de jogo.");
            return;
        }

        this.joinGameBtn.disabled = true;
        const gameRef = db.collection('games').doc(gameId);

        try {
            const doc = await gameRef.get();
            if (!doc.exists) {
                throw new Error("Sala não encontrada.");
            }
            const gameData = doc.data();
            if (gameData.status !== 'waiting' || gameData.guestPlayerId !== null) {
                throw new Error("Esta sala não está mais aceitando jogadores.");
            }
            
            // Atualiza o documento para incluir o jogador convidado
            await gameRef.update({
                guestPlayerId: myPlayerId,
                status: 'in-progress'
            });

            // Inicia o jogo para este cliente como GUEST
            this.startGame(gameId, false);

        } catch (error) {
            console.error("Erro ao entrar no jogo:", error);
            alert(error.message);
            this.joinGameBtn.disabled = false;
        }
    }
}

// Inicia o nosso gerenciador de lobby assim que a página carrega
