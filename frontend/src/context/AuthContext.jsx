/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
} from 'react';

// ============================================================
// CONTEXTO GLOBAL DE AUTENTICACIÓN
// ============================================================

const AuthContext = createContext(null);

// ============================================================
// HOOK PARA ACCEDER AL USUARIO AUTENTICADO
// ============================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe usarse dentro de AuthProvider',
    );
  }

  return context;
}

// ============================================================
// PROVEEDOR DEL CONTEXTO DE AUTENTICACIÓN
// ============================================================

export function AuthProvider({ children }) {
  // El usuario se recupera una sola vez al iniciar la aplicación.
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  const login = (userData) => {
    // El token se almacena separado para enviarlo
    // en el encabezado Authorization.
    if (userData.access_token) {
      localStorage.setItem(
        'token',
        userData.access_token,
      );
    }

    setUser(userData);
    localStorage.setItem(
      'user',
      JSON.stringify(userData),
    );
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}