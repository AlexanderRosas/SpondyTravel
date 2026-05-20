import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import TravelerServices from './components/TravelerServicesWithBudget';
import { ItineraryProvider } from './context/ItineraryContext';

// ============================================
// CONTEXT PARA AUTENTICACIÓN GLOBAL
// ============================================
const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
    // Guardar en localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Cargar usuario desde localStorage al montar
  if (!user && localStorage.getItem('user')) {
    try {
      setUser(JSON.parse(localStorage.getItem('user')));
    } catch (e) {
      localStorage.removeItem('user');
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// COMPONENTE DE RUTA PROTEGIDA
// ============================================
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirigir a la ruta correspondiente al rol si no tiene permiso
    const roleRoutes = {
      ADMIN: '/admin/proveedores-pendientes',
      PROVIDER: '/proveedor/dashboard',
      TRAVELER: '/viajero/servicios',
    };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  return children;
}

// ============================================
// LAYOUT SIN NAVEGACIÓN (deja que los componentes la manejen)
// ============================================
function Layout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

// ============================================
// COMPONENTES WRAPPER PARA RUTAS CON HOOKS
// ============================================
function LoginRoute() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    login(userData);
    // Redireccionar según el rol
    const roleRoutes = {
      ADMIN: '/admin/proveedores-pendientes',
      PROVIDER: '/proveedor/dashboard',
      TRAVELER: '/viajero/servicios',
    };
    navigate(roleRoutes[userData.role] || '/login');
  };

  if (user) {
    const roleRoutes = {
      ADMIN: '/admin/proveedores-pendientes',
      PROVIDER: '/proveedor/dashboard',
      TRAVELER: '/viajero/servicios',
    };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  return <Login onLogin={handleLogin} />;
}

function TravelerServicesRoute() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['TRAVELER']}>
      <ItineraryProvider travelerId={user?.id}>
        <TravelerServices user={user} onLogout={handleLogout} />
      </ItineraryProvider>
    </ProtectedRoute>
  );
}

function AdminPanelRoute() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminPanel user={user} onLogout={handleLogout} />
    </ProtectedRoute>
  );
}

function DashboardRoute() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['PROVIDER']}>
      <Dashboard user={user} onLogout={handleLogout} />
    </ProtectedRoute>
  );
}

// ============================================
// COMPONENTE PRINCIPAL CON RUTAS
// ============================================
function AppRoutes() {
  return (
    <Layout>
      <Routes>
        {/* Ruta de Login - Accesible solo si NO está autenticado */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Rutas Admin */}
        <Route path="/admin/proveedores-pendientes" element={<AdminPanelRoute />} />

        {/* Rutas Proveedor */}
        <Route path="/proveedor/dashboard" element={<DashboardRoute />} />

        {/* Rutas Viajero */}
        <Route path="/viajero/servicios" element={<TravelerServicesRoute />} />

        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas no encontradas */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-gray-600 mb-8">Página no encontrada</p>
                <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded">
                  Volver al inicio
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}

// ============================================
// APLICACIÓN PRINCIPAL
// ============================================
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;