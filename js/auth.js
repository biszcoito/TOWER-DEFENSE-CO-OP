// js/auth.js

class AuthManager {
    constructor() {
        // Inicializa os serviços do Firebase que vamos usar
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;

        // Mapeia todos os elementos HTML que vamos manipular
        this.elements = {
            authContainer: document.getElementById('auth-container'),
            gameWrapper: document.getElementById('game-container'), // Corrigido para o seu ID
            authTitle: document.getElementById('auth-title'),
            emailInput: document.getElementById('auth-email'),
            passwordInput: document.getElementById('auth-password'),
            submitBtn: document.getElementById('auth-submit-btn'),
            toggleLink: document.getElementById('auth-toggle-link'),
            toggleText: document.getElementById('auth-toggle-text'),
            errorMessage: document.getElementById('auth-error'),
        };
        
        // Controla se a tela está em modo Login ou Cadastro
        this.isLoginMode = true; 

        // Inicia todos os listeners de eventos
        this.init();
    }

    init() {
        // Listener para o botão principal (Entrar / Cadastrar)
        this.elements.submitBtn.addEventListener('click', () => this.handleSubmit());
        
        // Listener para o link de alternância (Login <-> Cadastro)
        this.elements.toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMode();
        });

        // Ouve o estado da autenticação em tempo real.
        // Esta é a função mais importante: ela reage a logins e logouts.
        this.auth.onAuthStateChanged(user => {
            if (user) {
                // Usuário está logado
                console.log("Usuário logado:", user.uid);
                this.currentUser = user;
                this.onLoginSuccess();
            } else {
                // Usuário está deslogado
                console.log("Nenhum usuário logado.");
                this.currentUser = null;
                this.onLogout();
            }
        });
    }

    handleSubmit() {
        const email = this.elements.emailInput.value.trim();
        const password = this.elements.passwordInput.value;
        this.setErrorMessage(''); // Limpa erros antigos

        if (!email || !password) {
            this.setErrorMessage("Por favor, preencha e-mail e senha.");
            return;
        }

        if (this.isLoginMode) {
            // Tentativa de Login
            this.auth.signInWithEmailAndPassword(email, password)
                .catch(error => this.handleAuthError(error));
        } else {
            // Tentativa de Cadastro
            this.auth.createUserWithEmailAndPassword(email, password)
                .catch(error => this.handleAuthError(error));
        }
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.setErrorMessage('');
        
        if (this.isLoginMode) {
            this.elements.authTitle.textContent = 'Login';
            this.elements.submitBtn.textContent = 'Entrar';
            this.elements.toggleText.innerHTML = 'Não tem uma conta? <a href="#" id="auth-toggle-link">Cadastre-se</a>';
        } else {
            this.elements.authTitle.textContent = 'Cadastro';
            this.elements.submitBtn.textContent = 'Criar Conta';
            this.elements.toggleText.innerHTML = 'Já tem uma conta? <a href="#" id="auth-toggle-link">Faça Login</a>';
        }
        
        // Re-adiciona o listener, pois o link interno foi recriado
        // A forma mais segura de fazer isso, para evitar listeners duplicados
        const newToggleLink = document.getElementById('auth-toggle-link');
        newToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMode();
        });
    }

    onLoginSuccess() {
        // Esconde a tela de login e mostra o jogo
        this.elements.authContainer.style.display = 'none';
        this.elements.gameWrapper.style.display = 'flex'; // Usando 'flex' pois seu layout parece usar

        // Inicia o jogo! A variável global `window.game` evita criar múltiplos jogos
        if (!window.game) {
            const canvas = document.getElementById('gameCanvas');
            window.game = new Game(canvas);
        }

        // Futuramente, aqui atualizaremos a UI com o nome do usuário e botão de logout.
    }

    onLogout() {
        // Esconde o jogo e mostra a tela de login
        this.elements.authContainer.style.display = 'flex';
        this.elements.gameWrapper.style.display = 'none';
        
        if (window.game) {
            // Lógica para parar e limpar o jogo quando o usuário desloga.
            // Isso evita que o jogo continue rodando em segundo plano.
            cancelAnimationFrame(window.game.animationFrameId);
            window.game = null; 
        }
    }
    
    // Mostra uma mensagem de erro amigável para o usuário
    handleAuthError(error) {
        console.error("Erro de autenticação:", error.code, error.message);
        let message = '';
        switch (error.code) {
            case 'auth/invalid-email':
                message = 'O formato do e-mail é inválido.';
                break;
            case 'auth/user-not-found':
                message = 'Nenhuma conta encontrada com este e-mail.';
                break;
            case 'auth/wrong-password':
                message = 'Senha incorreta. Tente novamente.';
                break;
            case 'auth/weak-password':
                message = 'A senha precisa ter pelo menos 6 caracteres.';
                break;
            case 'auth/email-already-in-use':
                message = 'Este e-mail já está cadastrado.';
                break;
            default:
                message = 'Ocorreu um erro. Verifique sua conexão e tente novamente.';
        }
        this.setErrorMessage(message);
    }

    setErrorMessage(message) {
        this.elements.errorMessage.textContent = message;
    }

    logout() {
        // Função pública para ser chamada por um botão de logout no futuro
        this.auth.signOut();
    }
}