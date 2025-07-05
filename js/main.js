// main.js - Inicia tudo!

document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();

    // Isso é útil para depuração, para poder chamar authManager.logout() no console, por exemplo.
    window.authManager = authManager;
});