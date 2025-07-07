
document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const authContainer = document.querySelector('#auth-container .modal-content');
    
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'game.html';
        } else {
            if (authContainer.innerHTML.includes('Verificando')) {
                restoreLoginForm();
            }
        }
    });

    function restoreLoginForm() {
        authContainer.innerHTML = `
            <h2 id="auth-title">Login</h2>
            <div id="auth-error" class="auth-error-message"></div>
            <input type="text" id="auth-display-name" placeholder="Nome de Jogador (único)" style="display: none;" maxlength="15">
            <input type="email" id="auth-email" placeholder="E-mail" autocomplete="email">
            <input type="password" id="auth-password" placeholder="Senha" autocomplete="current-password">
            <button type="button" id="auth-submit-btn">Entrar</button>
            <p id="auth-toggle-text">Não tem uma conta? <a href="#" id="auth-toggle-link">Cadastre-se</a></p>
        `;
        addFormListeners();
    }

    function addFormListeners() {
        const submitBtn = document.getElementById('auth-submit-btn');
        const toggleLink = document.getElementById('auth-toggle-link');
        submitBtn.addEventListener('click', handleAuthSubmit);
        toggleLink.addEventListener('click', e => { e.preventDefault(); toggleAuthMode(); });
    }

    let isLoginMode = true;
    function toggleAuthMode() {
        isLoginMode = !isLoginMode;
        restoreLoginForm();
        const title = document.getElementById('auth-title');
        const submitBtn = document.getElementById('auth-submit-btn');
        const displayNameInput = document.getElementById('auth-display-name');
        const toggleText = document.getElementById('auth-toggle-text');
        
        if (!isLoginMode) {
            title.textContent = 'Cadastro';
            submitBtn.textContent = 'Criar Conta';
            displayNameInput.style.display = 'block';
            toggleText.innerHTML = 'Já tem uma conta? <a href="#" id="auth-toggle-link">Faça Login</a>';
        }
        addFormListeners();
    }

    function handleAuthSubmit() {
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const displayName = document.getElementById('auth-display-name').value.trim();
        const errorEl = document.getElementById('auth-error');
        const submitBtn = document.getElementById('auth-submit-btn');
        
        errorEl.textContent = '';
        if (!email || !password) { errorEl.textContent = "Preencha e-mail e senha."; return; }
        
        submitBtn.disabled = true; submitBtn.textContent = 'Aguarde...';

        const onError = error => {
            let message = 'Ocorreu um erro.';
            switch (error.code) {
                case 'auth/invalid-email': message = 'Formato do e-mail é inválido.'; break;
                case 'auth/user-not-found': message = 'Conta não encontrada.'; break;
                case 'auth/wrong-password': message = 'Senha incorreta.'; break;
                case 'auth/weak-password': message = 'A senha deve ter no mínimo 6 caracteres.'; break;
                case 'auth/email-already-in-use': message = 'Este e-mail já está cadastrado.'; break;
            
             }
            errorEl.textContent = message;
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
        };

        if (isLoginMode) auth.signInWithEmailAndPassword(email, password).catch(onError);
        else {
            if (!displayName) { errorEl.textContent = "Preencha seu nome de jogador."; submitBtn.disabled = false; submitBtn.textContent = 'Criar Conta'; return; }
            auth.createUserWithEmailAndPassword(email, password)
                .then(cred => cred.user.updateProfile({ displayName: displayName }))
                .catch(onError);
        }
    }
});