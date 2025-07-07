// js/game-init.js

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const loader = document.getElementById('loader-overlay');
    const gameContainer = document.getElementById('game-container');
    const authContainer = document.querySelector('#auth-container'); // Presente no index.html

    // Se estivermos na página de login, o container do jogo não existe.
    if (!gameContainer) {
        return;
    }

    // A página do jogo SEMPRE começa com o loader visível
    loader.style.display = 'flex';
    gameContainer.style.display = 'none';

    auth.onAuthStateChanged(user => {
        if (user && user.uid) {
            // USUÁRIO ESTÁ LOGADO
            
            // Inicializa o jogo se ainda não foi inicializado
            if (!window.game) {
                const canvas = document.getElementById('gameCanvas');
                // Passa o objeto 'user' e 'db' para o jogo, como o construtor espera
                window.game = new Game(canvas, user, db);
            }
            
            // Esconde o loader e mostra o container do jogo
            loader.style.display = 'none';
            gameContainer.style.display = 'flex';

        } else {
            // USUÁRIO NÃO ESTÁ LOGADO
            // Se o usuário não está autenticado, ele não deveria estar em game.html.
            // Redireciona para a página de login.
            window.location.replace('index.html');
        }
    });
});