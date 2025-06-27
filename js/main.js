// main.js - Inicia tudo!

// Espera o DOM carregar para garantir que o canvas existe.
let myPlayerId = sessionStorage.getItem('playerId');
if (!myPlayerId) {
    myPlayerId = 'player_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('playerId', myPlayerId);
}
document.addEventListener('DOMContentLoaded', () => {
    new CoopManager(); 
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error("Canvas não encontrado!");
        return;
    }
    
    // O Jogo só começa quando o DOM estiver pronto
    const game = new Game(canvas);
    
    // Isso é útil para depuração no console do navegador
    window.game = game;
});
