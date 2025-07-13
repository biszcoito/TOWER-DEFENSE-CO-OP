// js/login.js
document.addEventListener('DOMContentLoaded', () => {
    // Usando o sistema original de login com Firestore e localStorage

    const loggedInPlayerId = localStorage.getItem('loggedInPlayer');
    if (loggedInPlayerId) {
        console.log("Sessão local encontrada. Redirecionando para o menu...");
        window.location.replace('main-menu.html');
        return;
    }

    const elements = {
        title: document.getElementById('auth-title'), error: document.getElementById('auth-error'),
        displayNameInput: document.getElementById('auth-display-name'), emailInput: document.getElementById('auth-email'),
        passwordInput: document.getElementById('auth-password'), submitBtn: document.getElementById('auth-submit-btn'),
        toggleText: document.getElementById('auth-toggle-text'),
    };
    
    let isLoginMode = true;

    const setErrorMessage = message => { elements.error.textContent = message; };

    const toggleMode = (e) => {
        if (e) e.preventDefault(); isLoginMode = !isLoginMode; setErrorMessage('');
        elements.title.textContent = isLoginMode ? 'Login' : 'Cadastro';
        elements.submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
        elements.displayNameInput.style.display = isLoginMode ? 'none' : 'block';
        elements.toggleText.innerHTML = isLoginMode ? 'Não tem uma conta? <a href="#" id="auth-toggle-link">Cadastre-se</a>' : 'Já tem uma conta? <a href="#" id="auth-toggle-link">Faça Login</a>';
        document.getElementById('auth-toggle-link').addEventListener('click', toggleMode);
    };

    const handleSubmit = () => {
        const email = elements.emailInput.value.trim().toLowerCase();
        const password = elements.passwordInput.value; const displayName = elements.displayNameInput.value.trim();
        setErrorMessage('');
        if (!email || !password) return setErrorMessage("Preencha e-mail e senha.");
        elements.submitBtn.disabled = true; elements.submitBtn.textContent = 'Aguarde...';

        if (isLoginMode) {
            db.collection('players').where('email', '==', email).get()
                .then(querySnapshot => {
                    if (querySnapshot.empty) { setErrorMessage('E-mail não encontrado.'); throw new Error("Login failed"); }
                    const userDoc = querySnapshot.docs[0]; const userData = userDoc.data();
                    if (userData.password !== password) { setErrorMessage('Senha incorreta.'); throw new Error("Login failed"); }
                    localStorage.setItem('loggedInPlayer', userDoc.id); // Salva o ID do documento
                    window.location.replace('main-menu.html');
                }).catch(() => { elements.submitBtn.disabled = false; elements.submitBtn.textContent = 'Entrar'; });
        } else {
            if (!displayName) { setErrorMessage("Por favor, preencha o nome de jogador."); elements.submitBtn.disabled = false; elements.submitBtn.textContent = 'Criar Conta'; return; }
            db.collection('players').where('email', '==', email).get()
                .then(querySnapshot => {
                    if (!querySnapshot.empty) { setErrorMessage('Este e-mail já está em uso.'); throw new Error("Register failed"); }
                    return db.collection('players').add({
                        name: displayName, email: email, password: password, crystals: 0, unlocked_upgrades: {}
                    });
                }).then(docRef => {
                    localStorage.setItem('loggedInPlayer', docRef.id); // Salva o ID do novo documento
                    window.location.replace('main-menu.html');
                }).catch(() => { elements.submitBtn.disabled = false; elements.submitBtn.textContent = 'Criar Conta'; });
        }
    };
    
    elements.submitBtn.addEventListener('click', handleSubmit);
    document.getElementById('auth-toggle-link').addEventListener('click', toggleMode);
});