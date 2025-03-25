// Initialize the Supabase client
const supabaseUrl = 'https://zxkvmgmcjuigfgevwdrc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4a3ZtZ21janVpZ2ZnZXZ3ZHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NTI2OTEsImV4cCI6MjA1ODQyODY5MX0.fTxsFd_NN4p2i2giUsY1FvFm8hlhrBJ-7ycso4ux8I8';
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
    localStorage.setItem('supabase.auth.token', JSON.stringify(session));
    updateAuthUI(true);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
    localStorage.removeItem('supabase.auth.token');
    updateAuthUI(false);
  }
});

// Update UI based on auth state
function updateAuthUI(isAuthenticated) {
  const authButtons = document.querySelectorAll('.auth-button');
  const protectedContent = document.querySelectorAll('.protected-content');
  const userNavItems = document.querySelectorAll('.user-nav-item');
  const guestNavItems = document.querySelectorAll('.guest-nav-item');

  if (isAuthenticated) {
    // Show authenticated content
    authButtons.forEach(btn => {
      if (btn.dataset.authState === 'authenticated') {
        btn.style.display = 'block';
      } else {
        btn.style.display = 'none';
      }
    });
    protectedContent.forEach(el => el.style.display = 'block');
    userNavItems.forEach(el => el.style.display = 'block');
    guestNavItems.forEach(el => el.style.display = 'none');
  } else {
    // Show unauthenticated content
    authButtons.forEach(btn => {
      if (btn.dataset.authState === 'unauthenticated') {
        btn.style.display = 'block';
      } else {
        btn.style.display = 'none';
      }
    });
    protectedContent.forEach(el => el.style.display = 'none');
    userNavItems.forEach(el => el.style.display = 'none');
    guestNavItems.forEach(el => el.style.display = 'block');
  }
}

// Check if user is already logged in on page load
async function checkAuthStatus() {
  const { data: { session } } = await supabase.auth.getSession();
  updateAuthUI(!!session);
  return session;
}

// Auth functions
async function signUpWithEmail(email, password) {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth-callback.html`,
    },
  });
}

async function signInWithEmail(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

async function signInWithMagicLink(email) {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth-callback.html`,
    },
  });
}

async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth-callback.html`,
    },
  });
}

async function resetPassword(email) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password.html`,
  });
}

async function updateUserPassword(password) {
  return await supabase.auth.updateUser({
    password,
  });
}

async function signOut() {
  return await supabase.auth.signOut();
}

// Get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAuthStatus);