/**
 * Global guard:
 * 1) Auth/session guard backed by Supabase.
 * 2) UI hardening (non-security) for non-auth pages.
 */
(function () {
    'use strict';

    if (window.__brainGymGuardInstalled) return;
    window.__brainGymGuardInstalled = true;

    var SUPABASE_URL = 'https://surlnioadlpyfsjhxzam.supabase.co';
    var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_skd2WWv_y6TPyU-2qJ-v5A_fRmMriib';
    var SUPABASE_REMOTE_SOURCES = [
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
        'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js'
    ];
    var AUTH_CALLBACK_PARAM_KEYS = [
        'access_token',
        'refresh_token',
        'expires_in',
        'expires_at',
        'token_type',
        'provider_token',
        'provider_refresh_token',
        'token_hash',
        'code',
        'type',
        'error',
        'error_code',
        'error_description'
    ];
    var AUTH_CALLBACK_GRACE_MS = 4500;
    var AUTH_STATE_SETTLE_MS = 800;
    var AUTH_UNAUTH_REDIRECT_CHECK_MS = 900;
    var AUTH_RECENT_SIGNIN_MS = 15000;
    var SUPABASE_LOAD_TIMEOUT_MS = 12000;
    var AUTH_PAGE_FILE = 'auth/index.html';
    var RECENT_SIGNIN_KEY = 'brainGymRecentSignInAt';
    var hasPendingRedirect = false;
    var supabaseScriptLoadPromise = null;

    function normalizePath(pathname) {
        return String(pathname || '').replace(/\\/g, '/');
    }

    function currentPathLower() {
        return normalizePath(window.location.pathname).toLowerCase();
    }

    function isAuthPage() {
        return currentPathLower().indexOf('/auth/') !== -1;
    }

    function isFormulaNotesPage() {
        return currentPathLower().indexOf('/formula-notes/') !== -1;
    }

    function isFileProtocol() {
        return String(window.location.protocol || '').toLowerCase() === 'file:';
    }

    function detectGuardScriptPath() {
        var script = document.currentScript;
        if (!script || !script.src) {
            var scripts = document.querySelectorAll('script[src]');
            for (var i = scripts.length - 1; i >= 0; i -= 1) {
                var src = normalizePath(scripts[i].getAttribute('src') || scripts[i].src || '');
                if (/guard\.js(\?.*)?$/i.test(src)) {
                    script = scripts[i];
                    break;
                }
            }
        }

        if (!script || !script.src) return null;
        try {
            var url = new URL(script.src, window.location.href);
            return normalizePath(url.pathname);
        } catch (_) {
            return null;
        }
    }

    function getProjectRootPath() {
        var guardScriptPath = detectGuardScriptPath();
        if (guardScriptPath && /\/guard\.js$/i.test(guardScriptPath)) {
            return guardScriptPath.slice(0, guardScriptPath.length - 'guard.js'.length);
        }

        var normalized = normalizePath(window.location.pathname);
        var lower = normalized.toLowerCase();
        var marker = '/trainer/v3/';
        var idx = lower.indexOf(marker);
        if (idx === -1) return null;
        return normalized.slice(0, idx + marker.length);
    }

    function fallbackRelativePath(fileName) {
        var normalized = normalizePath(window.location.pathname);
        var segments = normalized.split('/').filter(Boolean);
        if (segments.length === 0) return fileName;

        var last = segments[segments.length - 1];
        var looksLikeFile = last.indexOf('.') !== -1;
        var depth = looksLikeFile ? segments.length - 1 : segments.length;
        var prefix = depth > 0 ? new Array(depth + 1).join('../') : '';
        return prefix + fileName.replace(/^\/+/, '');
    }

    function buildPathTo(fileName) {
        var fromRoot = getProjectRootPath();
        if (fromRoot) return fromRoot + fileName.replace(/^\/+/, '');
        return fallbackRelativePath(fileName);
    }

    function getHomePath() {
        return buildPathTo('index.html');
    }

    function getAuthPath() {
        return buildPathTo(AUTH_PAGE_FILE);
    }

    function getSupabaseScriptSources() {
        var sources = [buildPathTo('vendor/supabase.min.js')].concat(SUPABASE_REMOTE_SOURCES);
        var unique = [];

        for (var i = 0; i < sources.length; i += 1) {
            var source = sources[i];
            if (!source || unique.indexOf(source) !== -1) continue;
            unique.push(source);
        }

        return unique;
    }

    function getRawReturnTo() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            return params.get('returnTo');
        } catch (_) {
            return null;
        }
    }

    function removeAuthCallbackParams(params) {
        for (var i = 0; i < AUTH_CALLBACK_PARAM_KEYS.length; i += 1) {
            params.delete(AUTH_CALLBACK_PARAM_KEYS[i]);
        }
    }

    function createRelativePath(pathname, searchParams) {
        var query = searchParams.toString();
        return pathname + (query ? '?' + query : '');
    }

    function getCurrentReturnToPath() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            removeAuthCallbackParams(params);
            return createRelativePath(window.location.pathname, params);
        } catch (_) {
            return window.location.pathname || '';
        }
    }

    function sanitizeNavigationTarget(target) {
        var safe = sanitizeReturnTo(target);
        if (!safe) return null;

        var withoutHash = safe.split('#')[0];
        try {
            var parsed = new URL(withoutHash, window.location.href);
            var params = new URLSearchParams(parsed.search || '');
            removeAuthCallbackParams(params);
            return createRelativePath(parsed.pathname, params);
        } catch (_) {
            return withoutHash;
        }
    }

    function hasAuthCallbackParams() {
        try {
            var searchParams = new URLSearchParams(window.location.search || '');
            var hashRaw = window.location.hash || '';
            var hashParams = new URLSearchParams(hashRaw.charAt(0) === '#' ? hashRaw.slice(1) : hashRaw);

            for (var i = 0; i < AUTH_CALLBACK_PARAM_KEYS.length; i += 1) {
                var key = AUTH_CALLBACK_PARAM_KEYS[i];
                if (searchParams.has(key) || hashParams.has(key)) return true;
            }
        } catch (_) {
            return false;
        }

        return false;
    }

    function sanitizeReturnTo(target) {
        if (!target || typeof target !== 'string') return null;
        var trimmed = target.trim();
        if (!trimmed) return null;

        // Disallow full URL protocols and JS URLs.
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return null;
        if (trimmed.indexOf('//') === 0) return null;
        return trimmed;
    }

    function getSafeReturnTo() {
        var raw = getRawReturnTo();
        if (!raw) return null;
        try {
            return sanitizeReturnTo(decodeURIComponent(raw));
        } catch (_) {
            return sanitizeReturnTo(raw);
        }
    }

    function buildAuthRedirectUrl() {
        var authPath = getAuthPath();
        var returnTo = getCurrentReturnToPath();
        var separator = authPath.indexOf('?') === -1 ? '?' : '&';
        return authPath + separator + 'returnTo=' + encodeURIComponent(returnTo);
    }

    function replaceLocationOnce(target) {
        if (!target || hasPendingRedirect) return false;
        var current = window.location.pathname + window.location.search + window.location.hash;
        if (target === current) return false;
        hasPendingRedirect = true;
        window.location.replace(target);
        return true;
    }

    function markRecentSignIn() {
        try {
            localStorage.setItem(RECENT_SIGNIN_KEY, String(Date.now()));
        } catch (_) {
            // Ignore storage failures.
        }
    }

    function isRecentSignIn() {
        try {
            var raw = localStorage.getItem(RECENT_SIGNIN_KEY);
            if (!raw) return false;
            var value = Number(raw);
            if (!Number.isFinite(value)) return false;
            return Date.now() - value <= AUTH_RECENT_SIGNIN_MS;
        } catch (_) {
            return false;
        }
    }

    function clearRecentSignInMarker() {
        try {
            localStorage.removeItem(RECENT_SIGNIN_KEY);
        } catch (_) {
            // Ignore storage failures.
        }
    }

    function redirectToAuth() {
        if (isAuthPage()) return false;
        if (isFileProtocol()) {
            console.warn('Brain Gym auth: skipped protected-page redirect on file:// URL. Use an http://localhost server for auth flows.');
            return false;
        }
        return replaceLocationOnce(buildAuthRedirectUrl());
    }

    function redirectAfterAuth() {
        var rawTarget = getSafeReturnTo() || getHomePath();
        var target = sanitizeNavigationTarget(rawTarget) || getHomePath();
        if (typeof target === 'string' && normalizePath(target).toLowerCase().indexOf('/auth/') !== -1) {
            target = getHomePath();
        }
        replaceLocationOnce(target);
    }

    function stopEvent(event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }
    }

    function ensureAuthChipStyles() {
        if (document.getElementById('brain-gym-auth-chip-style')) return;
        var style = document.createElement('style');
        style.id = 'brain-gym-auth-chip-style';
        style.textContent =
            '#brain-gym-auth-chip {' +
            'display: inline-flex;' +
            'align-items: center;' +
            'gap: 8px;' +
            'padding: 8px 10px;' +
            'border-radius: 999px;' +
            'background: rgba(255, 255, 255, 0.92);' +
            'border: 1px solid rgba(20, 38, 69, 0.18);' +
            'box-shadow: 0 8px 18px rgba(23, 38, 69, 0.14);' +
            'font: 600 12px/1.2 "IBM Plex Mono", "SF Mono", Menlo, monospace;' +
            'color: #172645;' +
            'backdrop-filter: blur(6px);' +
            'max-width: min(100%, 430px);' +
            'min-width: 0;' +
            '}' +
            '#brain-gym-auth-chip[data-anchor="floating"] {' +
            'position: fixed;' +
            'right: 14px;' +
            'top: 14px;' +
            'z-index: 9999;' +
            '}' +
            '#brain-gym-auth-chip[data-anchor="top-bar"] {' +
            'position: relative;' +
            'right: auto;' +
            'top: auto;' +
            'z-index: 2;' +
            'margin-left: auto;' +
            '}' +
            '.top-bar.brain-gym-top-bar-has-auth {' +
            'display: flex;' +
            'flex-wrap: wrap;' +
            'row-gap: 10px;' +
            '}' +
            '#brain-gym-auth-chip .auth-email {' +
            'min-width: 0;' +
            'max-width: min(42vw, 270px);' +
            'overflow: hidden;' +
            'text-overflow: ellipsis;' +
            'white-space: nowrap;' +
            '}' +
            '#brain-gym-auth-chip .auth-logout {' +
            'border: 1px solid rgba(47, 103, 199, 0.38);' +
            'background: rgba(47, 103, 199, 0.12);' +
            'color: #17325d;' +
            'border-radius: 999px;' +
            'padding: 5px 10px;' +
            'cursor: pointer;' +
            'font: inherit;' +
            '}' +
            '#brain-gym-auth-chip .auth-logout:hover {' +
            'background: rgba(47, 103, 199, 0.22);' +
            '}' +
            '@media (max-width: 760px) {' +
            '#brain-gym-auth-chip[data-anchor="floating"] {' +
            'left: 12px;' +
            'right: 12px;' +
            'top: 10px;' +
            'justify-content: space-between;' +
            '}' +
            '.top-bar.brain-gym-top-bar-has-auth #brain-gym-auth-chip[data-anchor="top-bar"] {' +
            'width: 100%;' +
            'margin-left: 0;' +
            'justify-content: space-between;' +
            '}' +
            '#brain-gym-auth-chip .auth-email {' +
            'max-width: min(60vw, 100%);' +
            '}' +
            '}';
        document.head.appendChild(style);
    }

    var authChipObserver = null;
    var authChipSyncScheduled = false;

    function isElementVisible(element) {
        if (!element) return false;
        if (element.hidden) return false;
        var style = window.getComputedStyle(element);
        if (!style || style.display === 'none' || style.visibility === 'hidden') return false;
        return element.getClientRects().length > 0;
    }

    function findVisibleTopBar() {
        var topBars = document.querySelectorAll('.top-bar');
        var chosen = null;
        var bestTop = Infinity;

        for (var i = 0; i < topBars.length; i += 1) {
            var topBar = topBars[i];
            if (!isElementVisible(topBar)) continue;
            var rect = topBar.getBoundingClientRect();
            if (rect.bottom <= 0) continue;
            if (rect.top < bestTop) {
                chosen = topBar;
                bestTop = rect.top;
            }
        }
        return chosen;
    }

    function syncAuthChipPlacement() {
        var chip = document.getElementById('brain-gym-auth-chip');
        if (!chip) return;

        var topBarAnchor = findVisibleTopBar();
        var targetParent = topBarAnchor || document.body;
        var targetAnchor = topBarAnchor ? 'top-bar' : 'floating';

        var activeAnchors = document.querySelectorAll('.top-bar.brain-gym-top-bar-has-auth');
        for (var i = 0; i < activeAnchors.length; i += 1) {
            if (activeAnchors[i] !== topBarAnchor) {
                activeAnchors[i].classList.remove('brain-gym-top-bar-has-auth');
            }
        }

        if (topBarAnchor && !topBarAnchor.classList.contains('brain-gym-top-bar-has-auth')) {
            topBarAnchor.classList.add('brain-gym-top-bar-has-auth');
        }

        if (chip.dataset.anchor !== targetAnchor) {
            chip.dataset.anchor = targetAnchor;
        }

        if (targetParent && chip.parentNode !== targetParent) {
            targetParent.appendChild(chip);
        }
    }

    function scheduleAuthChipPlacementSync() {
        if (authChipSyncScheduled) return;
        authChipSyncScheduled = true;
        var runSync = function () {
            authChipSyncScheduled = false;
            if (!authState.user || authState.isAuthPage) return;
            syncAuthChipPlacement();
        };

        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(runSync);
        } else {
            window.setTimeout(runSync, 16);
        }
    }

    function startAuthChipPlacementObserver() {
        if (authChipObserver || typeof MutationObserver !== 'function' || !document.body) return;
        authChipObserver = new MutationObserver(function () {
            scheduleAuthChipPlacementSync();
        });
        authChipObserver.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });
        window.addEventListener('resize', scheduleAuthChipPlacementSync);
        window.addEventListener('orientationchange', scheduleAuthChipPlacementSync);
    }

    function mountAuthChip(user, client) {
        if (isAuthPage()) return;
        if (!user || !client) return;

        ensureAuthChipStyles();

        var chip = document.getElementById('brain-gym-auth-chip');
        if (!chip) {
            chip = document.createElement('div');
            chip.id = 'brain-gym-auth-chip';

            var email = document.createElement('span');
            email.className = 'auth-email';
            chip.appendChild(email);

            var logout = document.createElement('button');
            logout.type = 'button';
            logout.className = 'auth-logout';
            logout.textContent = 'Sign out';
            logout.addEventListener('click', async function () {
                try {
                    await client.auth.signOut();
                } finally {
                    redirectToAuth();
                }
            });

            chip.appendChild(logout);
        }

        var emailOnly = chip.querySelector('.auth-email');
        if (emailOnly) emailOnly.textContent = user.email || 'Signed in';

        syncAuthChipPlacement();
        startAuthChipPlacementObserver();
    }

    function removeAuthChip() {
        var chip = document.getElementById('brain-gym-auth-chip');
        if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
        var activeAnchors = document.querySelectorAll('.top-bar.brain-gym-top-bar-has-auth');
        for (var i = 0; i < activeAnchors.length; i += 1) {
            activeAnchors[i].classList.remove('brain-gym-top-bar-has-auth');
        }
    }

    function loadSupabaseScriptFromSource(source) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            var completed = false;
            var timeoutId = null;

            function cleanup() {
                window.clearTimeout(timeoutId);
                script.removeEventListener('load', onLoad);
                script.removeEventListener('error', onError);
            }

            function fail(message) {
                if (completed) return;
                completed = true;
                cleanup();
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                reject(new Error(message));
            }

            function onLoad() {
                if (completed) return;
                if (window.supabase && typeof window.supabase.createClient === 'function') {
                    completed = true;
                    cleanup();
                    resolve();
                    return;
                }
                fail('Supabase SDK loaded without createClient: ' + source);
            }

            function onError() {
                fail('Supabase SDK request failed: ' + source);
            }

            timeoutId = window.setTimeout(function () {
                fail('Supabase SDK timed out: ' + source);
            }, SUPABASE_LOAD_TIMEOUT_MS);

            script.src = source;
            script.async = true;
            script.defer = true;
            script.dataset.brainGymSupabase = '1';
            script.dataset.brainGymSupabaseSource = source;
            script.addEventListener('load', onLoad, { once: true });
            script.addEventListener('error', onError, { once: true });
            document.head.appendChild(script);
        });
    }

    function loadSupabaseScript() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            return Promise.resolve();
        }

        if (supabaseScriptLoadPromise) return supabaseScriptLoadPromise;

        var sources = getSupabaseScriptSources();
        supabaseScriptLoadPromise = new Promise(function (resolve, reject) {
            var index = 0;

            function tryNext(lastError) {
                if (window.supabase && typeof window.supabase.createClient === 'function') {
                    resolve();
                    return;
                }

                if (index >= sources.length) {
                    var details = lastError && lastError.message ? ' Last error: ' + lastError.message : '';
                    reject(new Error('Supabase SDK failed to load from all sources.' + details));
                    return;
                }

                var source = sources[index];
                index += 1;

                loadSupabaseScriptFromSource(source)
                    .then(resolve)
                    .catch(function (error) {
                        console.warn('Brain Gym auth: failed SDK source', source, error);
                        tryNext(error);
                    });
            }

            tryNext(null);
        }).catch(function (error) {
            supabaseScriptLoadPromise = null;
            throw error;
        });

        return supabaseScriptLoadPromise;
    }

    var authState = {
        client: null,
        user: null,
        isAuthPage: isAuthPage(),
        callbackGraceUntil: 0,
        callbackFallbackTimer: null,
        unauthCheckTimer: null,
        unauthCheckInFlight: false
    };

    var authReadyResolve;
    var authReadyResolved = false;
    var authReady = new Promise(function (resolve) {
        authReadyResolve = resolve;
    });

    function resolveAuthReady(payload) {
        if (authReadyResolved) return;
        authReadyResolved = true;
        authReadyResolve(payload);
    }

    function isInCallbackGraceWindow() {
        return authState.callbackGraceUntil > Date.now();
    }

    function clearCallbackGraceWindow() {
        authState.callbackGraceUntil = 0;
        if (authState.callbackFallbackTimer) {
            window.clearTimeout(authState.callbackFallbackTimer);
            authState.callbackFallbackTimer = null;
        }
    }

    function startCallbackGraceWindow() {
        authState.callbackGraceUntil = Date.now() + AUTH_CALLBACK_GRACE_MS;
    }

    function clearUnauthCheckTimer() {
        if (authState.unauthCheckTimer) {
            window.clearTimeout(authState.unauthCheckTimer);
            authState.unauthCheckTimer = null;
        }
    }

    async function verifySessionAndMaybeRedirect(client) {
        if (authState.isAuthPage || hasPendingRedirect) return;
        if (authState.user) {
            clearUnauthCheckTimer();
            return;
        }
        if (isInCallbackGraceWindow() || isRecentSignIn()) {
            scheduleUnauthenticatedRedirectCheck(client, AUTH_UNAUTH_REDIRECT_CHECK_MS);
            return;
        }
        if (authState.unauthCheckInFlight) return;

        authState.unauthCheckInFlight = true;
        try {
            var latestResponse = await client.auth.getSession();
            var latestSession = latestResponse && latestResponse.data ? latestResponse.data.session : null;
            authState.user = latestSession && latestSession.user ? latestSession.user : null;

            if (authState.user) {
                clearCallbackGraceWindow();
                clearUnauthCheckTimer();
                mountAuthChip(authState.user, client);
                broadcastAuthState();
                return;
            }

            if (!isInCallbackGraceWindow() && !isRecentSignIn() && !hasPendingRedirect) {
                clearRecentSignInMarker();
                redirectToAuth();
            } else {
                scheduleUnauthenticatedRedirectCheck(client, AUTH_UNAUTH_REDIRECT_CHECK_MS);
            }
        } catch (_) {
            scheduleUnauthenticatedRedirectCheck(client, AUTH_UNAUTH_REDIRECT_CHECK_MS);
        } finally {
            authState.unauthCheckInFlight = false;
        }
    }

    function scheduleUnauthenticatedRedirectCheck(client, delayMs) {
        if (authState.isAuthPage || hasPendingRedirect) return;
        if (authState.user) return;
        if (authState.unauthCheckInFlight) return;
        if (authState.unauthCheckTimer) return;

        var delay = typeof delayMs === 'number' ? delayMs : AUTH_UNAUTH_REDIRECT_CHECK_MS;
        authState.unauthCheckTimer = window.setTimeout(function () {
            authState.unauthCheckTimer = null;
            verifySessionAndMaybeRedirect(client);
        }, delay);
    }

    window.BrainGymAuth = {
        ready: authReady,
        isAuthPage: authState.isAuthPage,
        getClient: function () { return authState.client; },
        getUser: function () { return authState.user; },
        getSafeReturnTo: getSafeReturnTo,
        getHomePath: getHomePath,
        redirectAfterAuth: redirectAfterAuth
    };

    function broadcastAuthState() {
        try {
            window.dispatchEvent(new CustomEvent('brain-gym:auth-state', {
                detail: {
                    user: authState.user,
                    client: authState.client
                }
            }));
        } catch (_) {
            // Ignore CustomEvent errors in older browsers.
        }
    }

    function isSupabaseScriptLoadFailure(error) {
        var message = error && error.message ? String(error.message).toLowerCase() : '';
        return message.indexOf('supabase sdk') !== -1 && message.indexOf('load') !== -1;
    }

    function scheduleCallbackFallbackCheck(client) {
        if (authState.isAuthPage) return;
        if (!isInCallbackGraceWindow()) return;
        if (authState.callbackFallbackTimer) return;

        var delay = Math.max(authState.callbackGraceUntil - Date.now(), 0) + 60;
        authState.callbackFallbackTimer = window.setTimeout(function () {
            authState.callbackFallbackTimer = null;

            if (authState.isAuthPage || authState.user || hasPendingRedirect) {
                clearCallbackGraceWindow();
                return;
            }

            verifySessionAndMaybeRedirect(client);
            clearCallbackGraceWindow();
        }, delay);
    }

    async function initAuthGuard() {
        try {
            await loadSupabaseScript();
            var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });

            authState.client = client;

            var sessionResponse = await client.auth.getSession();
            var session = sessionResponse && sessionResponse.data ? sessionResponse.data.session : null;
            authState.user = session && session.user ? session.user : null;

            if (authState.user) {
                clearCallbackGraceWindow();
            } else if (!authState.isAuthPage) {
                if (hasAuthCallbackParams()) {
                    startCallbackGraceWindow();
                } else {
                    authState.callbackGraceUntil = Date.now() + AUTH_STATE_SETTLE_MS;
                }
            }

            client.auth.onAuthStateChange(function (event, nextSession) {
                authState.user = nextSession && nextSession.user ? nextSession.user : null;
                broadcastAuthState();

                if (authState.user) {
                    markRecentSignIn();
                    clearCallbackGraceWindow();
                    clearUnauthCheckTimer();

                    if (authState.isAuthPage) {
                        redirectAfterAuth();
                        return;
                    }

                    if (hasAuthCallbackParams()) {
                        replaceLocationOnce(getCurrentReturnToPath());
                        return;
                    }

                    mountAuthChip(authState.user, client);
                    return;
                }

                removeAuthChip();
                if (authState.isAuthPage) return;

                if (isInCallbackGraceWindow()) {
                    scheduleCallbackFallbackCheck(client);
                    return;
                }

                if (event === 'SIGNED_OUT') {
                    clearRecentSignInMarker();
                    clearUnauthCheckTimer();
                    redirectToAuth();
                    return;
                }

                scheduleUnauthenticatedRedirectCheck(client, AUTH_UNAUTH_REDIRECT_CHECK_MS);
            });

            if (authState.isAuthPage) {
                if (authState.user) {
                    resolveAuthReady({
                        client: authState.client,
                        user: authState.user,
                        isAuthPage: authState.isAuthPage
                    });
                    redirectAfterAuth();
                    return;
                }
            } else if (!authState.user) {
                resolveAuthReady({
                    client: authState.client,
                    user: null,
                    isAuthPage: authState.isAuthPage
                });
                if (isInCallbackGraceWindow()) {
                    scheduleCallbackFallbackCheck(client);
                    broadcastAuthState();
                    return;
                }
                scheduleUnauthenticatedRedirectCheck(client, AUTH_UNAUTH_REDIRECT_CHECK_MS);
                broadcastAuthState();
                return;
            }

            if (authState.user) {
                markRecentSignIn();
                clearUnauthCheckTimer();
                if (hasAuthCallbackParams()) {
                    replaceLocationOnce(getCurrentReturnToPath());
                }
                mountAuthChip(authState.user, client);
            }

            broadcastAuthState();
            resolveAuthReady({
                client: authState.client,
                user: authState.user,
                isAuthPage: authState.isAuthPage
            });
        } catch (error) {
            console.error('Brain Gym auth bootstrap failed:', error);
            resolveAuthReady({
                client: null,
                user: null,
                isAuthPage: authState.isAuthPage,
                error: error
            });

            if (!authState.isAuthPage && !isSupabaseScriptLoadFailure(error)) {
                redirectToAuth();
            }
        }
    }

    initAuthGuard();

    // UI hardening should not run on auth page or Formula Notes page.
    if (authState.isAuthPage || isFormulaNotesPage()) return;

    document.addEventListener('contextmenu', function (event) {
        stopEvent(event);
    }, true);

    document.addEventListener('keydown', function (event) {
        var key = (event.key || '').toLowerCase();
        var ctrlOrMeta = event.ctrlKey || event.metaKey;
        var inspectKey =
            key === 'f12' ||
            (ctrlOrMeta && event.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) ||
            (event.metaKey && event.altKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k'));
        var sourceKey = ctrlOrMeta && key === 'u';
        var contextMenuKey = key === 'contextmenu' || (event.shiftKey && key === 'f10');

        if (inspectKey || sourceKey || contextMenuKey) {
            stopEvent(event);
        }
    }, true);

    document.addEventListener('dragstart', function (event) {
        var target = event.target;
        if (target && target.tagName === 'IMG') {
            stopEvent(event);
        }
    }, true);
})();
