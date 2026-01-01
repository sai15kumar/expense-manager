(function () {
    const STORAGE_KEYS = {
        idToken: 'expenseManager_idToken',
        userEmail: 'expenseManager_userEmail',
        userName: 'expenseManager_userName'
    };

    // Use localStorage for persistence across sessions/tabs
    const storage = localStorage;

    function getEl(id) {
        return document.getElementById(id);
    }

    function showApp() {
        const appRoot = getEl('app-root');
        const authGate = getEl('auth-gate');
        if (appRoot) {
            appRoot.classList.add('visible');
            appRoot.classList.remove('hidden');
        }
        if (authGate) {
            authGate.classList.add('hidden');
            authGate.classList.remove('visible');
        }
    }

    function refreshAppData() {
        if (typeof window.fetchCategories === 'function') {
            window.fetchCategories().catch(err => console.error('[AUTH] fetchCategories after login failed', err));
        }
        if (typeof window.loadHomeData === 'function') {
            try {
                window.loadHomeData();
            } catch (err) {
                console.error('[AUTH] loadHomeData after login failed', err);
            }
        }
    }

    function hideApp() {
        const appRoot = getEl('app-root');
        const authGate = getEl('auth-gate');
        if (appRoot) {
            appRoot.classList.remove('visible');
            appRoot.classList.add('hidden');
        }
        if (authGate) {
            authGate.classList.remove('hidden');
        }
    }

    function clearSession() {
        storage.removeItem(STORAGE_KEYS.idToken);
        storage.removeItem(STORAGE_KEYS.userEmail);
        storage.removeItem(STORAGE_KEYS.userName);
        console.log('[AUTH] Session cleared');
    }

    function decodeJwtPayload(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        const payload = parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
        const decoded = atob(padded);
        return JSON.parse(decoded);
    }

    function initGoogleAuth() {
        if (!window.google || !google.accounts || !google.accounts.id) {
            console.warn('[AUTH] Google Identity Services not ready');
            return false;
        }

        google.accounts.id.initialize({
            client_id: '443549607958-j392cki6rankqqi597sav782hg80adon.apps.googleusercontent.com',
            callback: handleCredentialResponse
        });

        const button = getEl('gsi-button');
        if (button) {
            google.accounts.id.renderButton(button, {
                theme: 'outline',
                size: 'large',
                shape: 'pill',
                text: 'signin',
                width: 280
            });
        }

        return true;
    }

    function pollForGsiReady() {
        if (initGoogleAuth()) return;
        let attempts = 0;
        const maxAttempts = 25; // ~5s with 200ms interval
        const intervalId = setInterval(() => {
            attempts += 1;
            if (initGoogleAuth() || attempts >= maxAttempts) {
                clearInterval(intervalId);
            }
        }, 200);
    }

    function restoreSession() {
        const token = storage.getItem(STORAGE_KEYS.idToken);
        const email = storage.getItem(STORAGE_KEYS.userEmail);
        
        if (token && email) {
            console.log('[AUTH] Restoring session for', email);
            showApp();
            refreshAppData();
        } else {
            console.log('[AUTH] No valid session found');
            clearSession();
            hideApp();
        }
    }

    function logoutUser() {
        const email = storage.getItem(STORAGE_KEYS.userEmail);
        console.log('[AUTH] Logging out user:', email);
        
        clearSession();

        if (window.google?.accounts?.id && email) {
            try {
                google.accounts.id.revoke(email, () => {
                    console.log('[AUTH] Token revoked for', email);
                });
            } catch (err) {
                console.warn('[AUTH] Revoke failed', err);
            }
        }

        hideApp();
    }

    window.handleCredentialResponse = function handleCredentialResponse(response) {
        try {
            const credential = response && response.credential;
            if (!credential) {
                console.warn('[AUTH] Missing credential');
                return;
            }
            const payload = decodeJwtPayload(credential);
            const email = payload.email || '';
            const name = payload.name || '';

            if (!email) {
                console.error('[AUTH] No email in token');
                return;
            }

            storage.setItem(STORAGE_KEYS.idToken, credential);
            storage.setItem(STORAGE_KEYS.userEmail, email);
            storage.setItem(STORAGE_KEYS.userName, name);

            console.log('[AUTH] Signed in as', email);
            showApp();
            refreshAppData();
        } catch (error) {
            console.error('[AUTH] Failed to handle credential', error);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        // Ensure initial gate state is consistent before any auth checks
        hideApp();
        restoreSession();
        pollForGsiReady();
    });

    // Centralized unauthorized handler
    function handleUnauthorized(message) {
        console.warn('[AUTH] Unauthorized access detected');
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message || 'Access denied. Please sign in again.';
            toast.className = 'toast error show';
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        logoutUser();
    }

    // Expose minimal auth hooks for the app shell
    window.appAuth = {
        logout: logoutUser,
        showApp,
        hideApp,
        handleUnauthorized,
        getIdToken: () => storage.getItem(STORAGE_KEYS.idToken),
        getUserEmail: () => storage.getItem(STORAGE_KEYS.userEmail),
        getUserName: () => storage.getItem(STORAGE_KEYS.userName),
        isSignedIn: () => !!(storage.getItem(STORAGE_KEYS.idToken) && storage.getItem(STORAGE_KEYS.userEmail))
    };
})();
