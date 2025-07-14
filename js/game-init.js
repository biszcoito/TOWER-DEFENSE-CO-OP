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
    
    db.collection('players').doc(loggedInPlayerId).get().then(doc => {
        if (doc.exists) {
            const playerData = doc.data();
            const userProfile = { uid: doc.id, ...playerData };
            
            // 1. Cria a instância do Jogo (e da UI), mas não inicia nada.
            if (!window.game) {
                const canvas = document.getElementById('gameCanvas');
                window.game = new Game(canvas, userProfile, db);
            }
            
            // 2. Torna o jogo visível
            loader.style.display = 'none';
            document.getElementById('game-container').style.display = 'flex';

            // 3. Pede ao navegador para chamar 'game.init()' no momento perfeito para renderização
            requestAnimationFrame(() => {
                window.game.init();
            });

        } else {
            console.error(`[game-init] Documento do jogador com ID '${loggedInPlayerId}' não encontrado.`);
            alert("Sua conta não foi encontrada no servidor.");
            localStorage.removeItem('loggedInPlayer');
            window.location.replace('index.html');
        }
    }).catch(error => {
        console.error("[game-init] Falha crítica ao buscar dados do jogador:", error);
        alert("Falha na comunicação com o servidor ao carregar seus dados. Tente novamente.");
        window.location.replace('main-menu.html');
    });
});