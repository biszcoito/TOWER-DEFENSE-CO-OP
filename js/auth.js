class AuthManager {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;

        this.elements = {
            authContainer: document.getElementById('auth-container'),
            gameWrapper: document.getElementById('game-container'),
            authTitle: document.getElementById('auth-title'),
            displayNameInput: document.getElementById('auth-display-name'),
            emailInput: document.getElementById('auth-email'),
            passwordInput: document.getElementById('auth-password'),
            submitBtn: document.getElementById('auth-submit-btn'),
            toggleLink: document.getElementById('auth-toggle-link'),
            toggleText: document.getElementById('auth-toggle-text'),
            errorMessage: document.getElementById('auth-error'),
            userDisplayName: document.getElementById('user-display-name'),
            logoutBtn: document.getElementById('logout-btn'),
        };
        
        this.isLoginMode = true;
        this.init();
    }

    init() {
        this.elements.submitBtn.addEventListener('click', () => this.handleSubmit());
        this.elements.logoutBtn.addEventListener('click', () => this.logout());
        
        this.elements.toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMode();
        });

        this.auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.onLoginSuccess();
            } else {
                this.currentUser = null;
                this.onLogout();
            }
        });
    }

    handleSubmit() {
        const email = this.elements.emailInput.value.trim();
        const password = this.elements.passwordInput.value;
        const displayName = this.elements.displayNameInput.value.trim();
        this.setErrorMessage('');

        if (!email || !password) {
            this.setErrorMessage("Por favor, preencha e-mail e senha."); return;
        }

        this.elements.submitBtn.disabled = true;
        if (this.isLoginMode) {
            this.auth.signInWithEmailAndPassword(email, password)
                .catch(error => this.handleAuthError(error))
                .finally(() => { this.elements.submitBtn.disabled = false; });
        } else {
            if (!displayName) {
                this.setErrorMessage("Por favor, preencha seu nome de jogador.");
                this.elements.submitBtn.disabled = false;
                return;
            }
            this.auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => userCredential.user.updateProfile({ displayName: displayName }))
                .catch(error => this.handleAuthError(error))
                .finally(() => { this.elements.submitBtn.disabled = false; });
        }
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.setErrorMessage('');
        
        if (this.isLoginMode) {
            this.elements.authTitle.textContent = 'Login';
            this.elements.submitBtn.textContent = 'Entrar';
            this.elements.displayNameInput.style.display = 'none';
            this.elements.toggleText.innerHTML = 'Não tem uma conta? <a href="#" id="auth-toggle-link">Cadastre-se</a>';
        } else {
            this.elements.authTitle.textContent = 'Cadastro';
            this.elements.submitBtn.textContent = 'Criar Conta';
            this.elements.displayNameInput.style.display = 'block';
            this.elements.toggleText.innerHTML = 'Já tem uma conta? <a href="#" id="auth-toggle-link">Faça Login</a>';
        }
        
        document.getElementById('auth-toggle-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMode();
        });
    }

    onLoginSuccess() {
        this.elements.authContainer.style.display = 'none';
        this.elements.gameWrapper.style.display = 'flex'; // Use flex para layout

        if (this.currentUser && this.currentUser.displayName) {
            this.elements.userDisplayName.textContent = `Olá, ${this.currentUser.displayName}!`;
            this.elements.logoutBtn.style.display = 'inline-block';
        }
        
        if (!window.game) {
            const canvas = document.getElementById('gameCanvas');
            window.game = new Game(canvas, this);
        }
    }

    onLogout() {
        this.elements.authContainer.style.display = 'flex';
        this.elements.gameWrapper.style.display = 'none';
        
        this.elements.userDisplayName.textContent = '';
        this.elements.logoutBtn.style.display = 'none';

        if (window.game) {
            cancelAnimationFrame(window.game.animationFrameId);
            window.game = null; 
        }
    }
    
    handleAuthError(error) {
        let message = 'Ocorreu um erro. Tente novamente.';
        switch (error.code) {
            case 'auth/invalid-email': message = 'O formato do e-mail é inválido.'; break;
            case 'auth/user-not-found': message = 'Nenhuma conta encontrada com este e-mail.'; break;
            case 'auth/wrong-password': message = 'Senha incorreta. Tente novamente.'; break;
            case 'auth/weak-password': message = 'A senha precisa ter pelo menos 6 caracteres.'; break;
            case 'auth/email-already-in-use': message = 'Este e-mail já está cadastrado.'; break;
        }
        this.setErrorMessage(message);
    }

    setErrorMessage(message) { this.elements.errorMessage.textContent = message; }
    logout() { this.auth.signOut(); }
}