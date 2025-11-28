const ADMIN_EMAIL = 'admin@minimalist.blog';
const ADMIN_PASSWORD = 'minimalist2024';

export const authService = {
  login(email, password) {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = 'admin-token-' + Date.now();
      localStorage.setItem('admin_token', token);
      return { success: true, token };
    }
    throw new Error('Invalid credentials');
  },

  logout() {
    localStorage.removeItem('admin_token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('admin_token');
  }
};
