// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const elements = {
        title: document.getElementById('auth-title'),
        error: document.getElementById('auth-error'),
        displayNameInput: document.getElementById('auth-display-name'),
        emailInput: document.getElementById('auth-email'),
        passwordInput: document.getElementById('auth-password'),
        submitBtn: document.getElementById('auth-submit-btn'),
        toggleText: document.getElementById('auth-toggle-text'),
        toggleLink: document.getElementById('auth-toggle-link'),
    };

    let isLoginMode = true;

    // Redireciona para o jogo se o usuário já estiver logado
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'game.html';
        }
    });

    const setErrorMessage = (message) => {
        elements.error.textContent = message;
    };

    const toggleMode = (e) => {
        if (e) e.preventDefault();
        isLoginMode = !isLoginMode;
        setErrorMessage('');
        
        if (isLoginMode) {
            elements.title.textContent = 'Login';
            elements.submitBtn.textContent = 'Entrar';
            elements.displayNameInput.style.display = 'none';
            elements.toggleText.innerHTML = 'Não tem uma conta? <a href="#" id="auth-toggle-link">Cadastre-se</a>';
        } else {
            elements.title.textContent = 'Cadastro';
            elements.submitBtn.textContent = 'Criar Conta';
            elements.displayNameInput.style.display = 'block';
            elements.toggleText.innerHTML = 'Já tem uma conta? <a href="#" id="auth-toggle-link">Faça Login</a>';
        }
        // É crucial readicionar o listener ao novo link criado
        document.getElementById('auth-toggle-link').addEventListener('click', toggleMode);
    };

    const handleSubmit = () => {
        const email = elements.emailInput.value.trim();
        const password = elements.passwordInput.value;
        const displayName = elements.displayNameInput.value.trim();
        
        setErrorMessage('');
        
        if (!email || !password) {
            setErrorMessage("Por favor, preencha e-mail e senha.");
            return;
        }
        
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = 'Aguarde...';

        const handleAuthError = (error) => {
            let message = 'Ocorreu um erro. Tente novamente.';
            switch (error.code) {
                case 'auth/invalid-email': message = 'O formato do e-mail é inválido.'; break;
                case 'auth/user-not-found': message = 'Nenhuma conta encontrada com este e-mail.'; break;
                case 'auth/wrong-password': message = 'Senha incorreta. Tente novamente.'; break;
                case 'auth/weak-password': message = 'A senha precisa ter pelo menos 6 caracteres.'; break;
                case 'auth/email-already-in-use': message = 'Este e-mail já está cadastrado.'; break;
            }
            setErrorMessage(message);
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = isLoginMode ? 'Entrar' : 'Criar Conta';
        };

        if (isLoginMode) {
            auth.signInWithEmailAndPassword(email, password)
                .catch(handleAuthError);
        } else {
            if (!displayName) {
                setErrorMessage("Por favor, preencha seu nome de jogador.");
                elements.submitBtn.disabled = false;
                elements.submitBtn.textContent = 'Criar Conta';
                return;
            }
            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => userCredential.user.updateProfile({ displayName: displayName }))
                .catch(handleAuthError);
        }
    };

    elements.submitBtn.addEventListener('click', handleSubmit);
    elements.toggleLink.addEventListener('click', toggleMode);
});