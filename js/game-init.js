// js/game-init.js
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-overlay');
    
    console.log("[game-init] Script iniciado.");
    const loggedInPlayerId = localStorage.getItem('loggedInPlayer');

    if (!loggedInPlayerId) {
        console.error("[game-init] Sessão não encontrada, redirecionando para login.");
        window.location.replace('index.html');
        return;
    }

    console.log(`[game-init] ID do jogador encontrado: ${loggedInPlayerId}`);
    
    db.collection('players').doc(loggedInPlayerId).get().then(doc => {
        if (doc.exists) {
            console.log("[game-init] Documento do jogador encontrado. Preparando para iniciar o jogo.");
            const playerData = doc.data();
            const userProfile = { uid: doc.id, ...playerData };
            
            if (!window.game) {
                const canvas = document.getElementById('gameCanvas');
                // Apenas CRIA a instância, não a inicia
                window.game = new Game(canvas, userProfile, db);
            }
            
            // Mostra a tela do jogo
            loader.style.display = 'none';
            document.getElementById('game-container').style.display = 'flex';

            // Garante que o layout da página esteja pronto e então chama nosso novo método `init`
            requestAnimationFrame(() => {
                window.game.init(); 
            });

        } else {
            console.error(`[game-init] Documento para o ID '${loggedInPlayerId}' não encontrado.`);
            alert("Não foi possível encontrar os dados da sua conta. Sua sessão será limpa.");
            localStorage.removeItem('loggedInPlayer');
            window.location.replace('index.html');
        }
    }).catch(error => {
        console.error("[game-init] O bloco .catch() foi acionado:", error);
        alert("Ocorreu um erro ao carregar o jogo. Verifique o console.");
        window.location.replace('main-menu.html');
    });
});