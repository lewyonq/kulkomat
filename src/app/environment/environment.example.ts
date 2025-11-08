export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_ANON_KEY',
  },
  auth: {
    redirectUri: 'http://localhost:4200/auth/callback',
    defaultRedirectAfterLogin: '/',
    defaultRedirectAfterLogout: '/login',
  },
};
