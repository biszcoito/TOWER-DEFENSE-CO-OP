
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(user => {
        const loader = document.getElementById('loader-overlay');
        const gameContainer = document.getElementById('game-container');

        if (user) {
            if (!window.game) {
                window.game = new Game(document.getElementById('gameCanvas'), user, db);
            }
            loader.style.display = 'none';
            gameContainer.style.display = 'flex';
        } else {
            window.location.replace('index.html');
        }
    });
});