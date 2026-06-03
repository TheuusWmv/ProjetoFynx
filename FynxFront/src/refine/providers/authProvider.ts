import type { AuthProvider } from '@refinedev/core';

const TOKEN_STORAGE_KEY = 'fynx_token';
const USER_STORAGE_KEY = 'fynx_user';

export const authProvider: AuthProvider = {
  login: async ({ token, user } = {}) => {
    if (typeof token === 'string' && token.length > 0) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }

      return {
        success: true,
        redirectTo: '/dashboard',
      };
    }

    return {
      success: false,
      error: {
        name: 'LoginError',
        message: 'Credenciais invalidas',
      },
    };
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    return {
      success: true,
      redirectTo: '/login',
    };
  },

  check: async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (token) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: '/login',
    };
  },

  getIdentity: async () => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  },

  onError: async (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      return {
        logout: true,
        redirectTo: '/login',
        error,
      };
    }

    return { error };
  },
};
