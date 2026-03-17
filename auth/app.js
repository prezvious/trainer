(function () {
    'use strict';

    var state = {
        mode: 'signin',
        loading: false,
        redirecting: false
    };
    var RECENT_SIGNIN_KEY = 'brainGymRecentSignInAt';

    var form = document.getElementById('auth-form');
    var emailInput = document.getElementById('email');
    var passwordInput = document.getElementById('password');
    var confirmInput = document.getElementById('confirm-password');
    var confirmField = document.getElementById('confirm-field');
    var submitBtn = document.getElementById('submit-btn');
    var statusEl = document.getElementById('status-message');
    var titleEl = document.getElementById('card-title');
    var subtitleEl = document.getElementById('card-subtitle');
    var modeButtons = document.querySelectorAll('.mode-btn');

    function setStatus(message, tone) {
        statusEl.textContent = message || '';
        statusEl.classList.remove('error', 'success');
        if (tone) statusEl.classList.add(tone);
    }

    function setLoading(isLoading) {
        state.loading = Boolean(isLoading);
        submitBtn.disabled = state.loading;
        submitBtn.textContent = state.loading
            ? (state.mode === 'signin' ? 'Signing in...' : 'Creating account...')
            : (state.mode === 'signin' ? 'Sign In' : 'Create Account');
    }

    function setMode(mode) {
        state.mode = mode === 'signup' ? 'signup' : 'signin';

        modeButtons.forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.mode === state.mode);
        });

        var isSignup = state.mode === 'signup';
        confirmField.classList.toggle('hidden', !isSignup);
        confirmInput.required = isSignup;
        confirmInput.autocomplete = isSignup ? 'new-password' : 'off';
        passwordInput.autocomplete = isSignup ? 'new-password' : 'current-password';

        titleEl.textContent = isSignup ? 'Create your account' : 'Welcome back';
        subtitleEl.textContent = isSignup
            ? 'Start syncing your progress across every trainer module.'
            : 'Sign in to continue your synced training.';

        setStatus('');
        setLoading(false);
    }

    async function getAuthClient() {
        if (!window.BrainGymAuth || !window.BrainGymAuth.ready) {
            throw new Error('Auth bootstrap is unavailable.');
        }

        var auth = await window.BrainGymAuth.ready;
        if (auth && auth.error) {
            throw auth.error;
        }
        if (!auth || !auth.client) {
            throw new Error('Unable to initialize Supabase client.');
        }
        return auth.client;
    }

    function redirectAfterAuth() {
        if (state.redirecting) return;
        state.redirecting = true;
        try {
            localStorage.setItem(RECENT_SIGNIN_KEY, String(Date.now()));
        } catch (_) {
            // Ignore storage failures.
        }

        if (window.BrainGymAuth && typeof window.BrainGymAuth.redirectAfterAuth === 'function') {
            window.BrainGymAuth.redirectAfterAuth();
            return;
        }
        window.location.replace('../index.html');
    }

    async function signIn(client, email, password) {
        var response = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (response.error) throw response.error;
        redirectAfterAuth();
    }

    async function signUp(client, email, password) {
        var response = await client.auth.signUp({
            email: email,
            password: password
        });

        if (response.error) throw response.error;

        if (response.data && response.data.session) {
            redirectAfterAuth();
            return;
        }

        setStatus('Account created. Check your email to confirm before signing in.', 'success');
    }

    modeButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (state.loading) return;
            setMode(btn.dataset.mode);
        });
    });

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (state.loading) return;

        var email = (emailInput.value || '').trim();
        var password = passwordInput.value || '';
        var confirmPassword = confirmInput.value || '';

        if (!email || !password) {
            setStatus('Please enter both email and password.', 'error');
            return;
        }

        if (state.mode === 'signup' && password !== confirmPassword) {
            setStatus('Passwords do not match.', 'error');
            return;
        }

        if (password.length < 8) {
            setStatus('Password must be at least 8 characters.', 'error');
            return;
        }

        try {
            setLoading(true);
            setStatus('');
            var client = await getAuthClient();

            if (state.mode === 'signin') {
                await signIn(client, email, password);
            } else {
                await signUp(client, email, password);
            }
        } catch (error) {
            setStatus(error && error.message ? error.message : 'Authentication failed.', 'error');
            setLoading(false);
        }
    });

    (async function init() {
        setMode('signin');
        try {
            var auth = await window.BrainGymAuth.ready;
            if (auth && auth.user) {
                redirectAfterAuth();
            }
        } catch (_) {
            setStatus('Unable to connect to authentication service.', 'error');
        }
    })();
})();
