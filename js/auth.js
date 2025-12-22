// SoloGenix Authentication Module
// Handles all Supabase authentication logic

// Initialize Supabase client
let supabase = null;

// Auth state
const authState = {
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true
};

// Initialize Supabase and check for existing session
async function initAuth() {
    try {
        // Initialize Supabase client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error getting session:', error);
            authState.loading = false;
            showAuthView('login');
            return;
        }

        if (session) {
            authState.isAuthenticated = true;
            authState.user = session.user;
            authState.session = session;
            updateUserUI(session.user);
            navigateTo('dashboard');
        } else {
            showAuthView('login');
        }

        authState.loading = false;

        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            handleAuthStateChange(event, session);
        });

    } catch (error) {
        console.error('Auth initialization error:', error);
        authState.loading = false;
        showAuthView('login');
    }
}

// Handle auth state changes
function handleAuthStateChange(event, session) {
    console.log('Auth event:', event);

    if (event === 'SIGNED_IN' && session) {
        authState.isAuthenticated = true;
        authState.user = session.user;
        authState.session = session;
        updateUserUI(session.user);
        hideAuthViews();
        navigateTo('dashboard');
        showToast('success', 'Welcome!', 'You have successfully signed in.');
    } else if (event === 'SIGNED_OUT') {
        authState.isAuthenticated = false;
        authState.user = null;
        authState.session = null;
        showAuthView('login');
        showToast('info', 'Signed Out', 'You have been signed out.');
    } else if (event === 'PASSWORD_RECOVERY') {
        showAuthView('reset');
    }
}

// Sign up with email and password
async function signUp(email, password, fullName) {
    try {
        showAuthLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (error) throw error;

        showAuthLoading(false);

        if (data.user && !data.session) {
            // Email confirmation required
            showToast('success', 'Check Your Email', 'We sent you a confirmation link. Please verify your email to continue.');
            showAuthView('login');
        } else if (data.session) {
            // Auto-confirmed (if email confirmation is disabled)
            showToast('success', 'Account Created!', 'Welcome to SoloGenix!');
        }

        return { success: true, data };
    } catch (error) {
        showAuthLoading(false);
        showToast('error', 'Sign Up Failed', error.message);
        return { success: false, error };
    }
}

// Sign in with email and password
async function signIn(email, password) {
    try {
        showAuthLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        showAuthLoading(false);
        return { success: true, data };
    } catch (error) {
        showAuthLoading(false);
        showToast('error', 'Sign In Failed', error.message);
        return { success: false, error };
    }
}

// Sign in with Google
async function signInWithGoogle() {
    try {
        showAuthLoading(true);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;

        // OAuth will redirect, so loading will be handled on return
        return { success: true, data };
    } catch (error) {
        showAuthLoading(false);
        showToast('error', 'Google Sign In Failed', error.message);
        return { success: false, error };
    }
}

// Sign in with Apple
async function signInWithApple() {
    try {
        showAuthLoading(true);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        showAuthLoading(false);
        showToast('error', 'Apple Sign In Failed', error.message);
        return { success: false, error };
    }
}

// Sign out
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        showToast('error', 'Sign Out Failed', error.message);
        return { success: false, error };
    }
}

// Send password reset email
async function resetPassword(email) {
    try {
        showAuthLoading(true);

        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '?reset=true'
        });

        if (error) throw error;

        showAuthLoading(false);
        showToast('success', 'Reset Link Sent', 'Check your email for a password reset link.');
        showAuthView('login');

        return { success: true, data };
    } catch (error) {
        showAuthLoading(false);
        showToast('error', 'Reset Failed', error.message);
        return { success: false, error };
    }
}

// Update password (for reset flow)
async function updatePassword(newPassword) {
    try {
        showAuthLoading(true);

        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        showAuthLoading(false);
        showToast('success', 'Password Updated', 'Your password has been changed successfully.');

        return { success: true, data };
    } catch (error) {
        showAuthLoading(false);
        showToast('error', 'Update Failed', error.message);
        return { success: false, error };
    }
}

// Update user profile
async function updateProfile(updates) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) throw error;

        authState.user = data.user;
        updateUserUI(data.user);
        showToast('success', 'Profile Updated', 'Your changes have been saved.');

        return { success: true, data };
    } catch (error) {
        showToast('error', 'Update Failed', error.message);
        return { success: false, error };
    }
}

// Helper: Show auth view
function showAuthView(view) {
    // Hide main app
    document.querySelector('.sidebar').style.display = 'none';
    document.querySelector('.main-content').style.display = 'none';

    // Hide all auth views
    document.querySelectorAll('.auth-view').forEach(v => v.style.display = 'none');

    // Show requested auth view
    const authView = document.getElementById('auth-' + view);
    if (authView) {
        authView.style.display = 'flex';
    }
}

// Helper: Hide auth views and show main app
function hideAuthViews() {
    document.querySelectorAll('.auth-view').forEach(v => v.style.display = 'none');
    document.querySelector('.sidebar').style.display = 'flex';
    document.querySelector('.main-content').style.display = 'flex';
}

// Helper: Show/hide auth loading state
function showAuthLoading(show) {
    const buttons = document.querySelectorAll('.auth-btn');
    buttons.forEach(btn => {
        btn.disabled = show;
        if (show) {
            btn.dataset.originalText = btn.textContent;
            btn.innerHTML = '<span class="auth-spinner"></span> Loading...';
        } else if (btn.dataset.originalText) {
            btn.textContent = btn.dataset.originalText;
        }
    });
}

// Helper: Update user UI elements
function updateUserUI(user) {
    if (!user) return;

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const initials = getInitials(fullName);
    const plan = user.user_metadata?.plan || 'Free Plan';

    // Update sidebar user profile
    const userNameEl = document.querySelector('.user-profile .user-name');
    const userPlanEl = document.querySelector('.user-profile .user-plan');
    const avatarEl = document.querySelector('.user-profile .avatar');

    if (userNameEl) userNameEl.textContent = fullName;
    if (userPlanEl) userPlanEl.textContent = plan;
    if (avatarEl) avatarEl.textContent = initials;

    // Update settings page if visible
    const settingsName = document.getElementById('settingsFullName');
    const settingsEmail = document.getElementById('settingsEmail');

    if (settingsName) settingsName.value = fullName;
    if (settingsEmail) settingsEmail.value = user.email || '';

    // Update dashboard greeting
    const dashboardGreeting = document.querySelector('.page-title h1');
    if (dashboardGreeting && dashboardGreeting.textContent.includes('Hello')) {
        dashboardGreeting.textContent = `Hello, ${fullName.split(' ')[0]} 👋`;
    }
}

// Helper: Get initials from name
function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Helper: Check if route requires auth
function requiresAuth(viewId) {
    const publicRoutes = ['login', 'signup', 'forgot', 'reset'];
    return !publicRoutes.includes(viewId);
}

// Modified navigateTo with auth check
function navigateToWithAuth(viewId) {
    if (requiresAuth(viewId) && !authState.isAuthenticated) {
        showAuthView('login');
        return;
    }

    if (!requiresAuth(viewId) && authState.isAuthenticated) {
        // Already logged in, redirect to dashboard
        viewId = 'dashboard';
    }

    // Call original navigateTo
    if (typeof originalNavigateTo === 'function') {
        originalNavigateTo(viewId);
    }
}

// Form handlers
function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    signIn(email, password);
}

function handleSignupSubmit(event) {
    event.preventDefault();
    const fullName = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('error', 'Password Mismatch', 'Passwords do not match.');
        return;
    }

    if (password.length < 6) {
        showToast('error', 'Weak Password', 'Password must be at least 6 characters.');
        return;
    }

    signUp(email, password, fullName);
}

function handleForgotSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    resetPassword(email);
}

function handleResetSubmit(event) {
    event.preventDefault();
    const password = document.getElementById('resetPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;

    if (password !== confirmPassword) {
        showToast('error', 'Password Mismatch', 'Passwords do not match.');
        return;
    }

    if (password.length < 6) {
        showToast('error', 'Weak Password', 'Password must be at least 6 characters.');
        return;
    }

    updatePassword(password);
}

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if Supabase is configured
    if (SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co') {
        console.warn('Supabase not configured. Please update js/config.js with your credentials.');
        // Show demo mode - skip auth for development
        hideAuthViews();
        return;
    }

    initAuth();
});
