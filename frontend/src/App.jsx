import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import TravelerServices from './components/TravelerServicesWithBudget';
import { ItineraryProvider } from './context/ItineraryContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// ============================================================
// COMPONENTE DE RUTA PROTEGIDA
// ============================================================

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // Redirige al inicio de sesión si no existe un usuario activo.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirige al módulo correspondiente cuando el rol
  // no tiene permiso para acceder a la ruta solicitada.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleRoutes = {
      ADMIN: '/admin/proveedores-pendientes',
      PROVIDER: '/proveedor/dashboard',
      TRAVELER: '/viajero/servicios',
    };

    return (
      <Navigate
        to={roleRoutes[user.role] || '/login'}
        replace
      />
    );
  }

  return children;
}

// ============================================================
// LAYOUT GENERAL
// ============================================================

function Layout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

// ============================================================
// RUTA DE INICIO DE SESIÓN
// ============================================================

function LoginRoute() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    login(userData);

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

    return (
      <Navigate
        to={roleRoutes[user.role] || '/login'}
        replace
      />
    );
  }

  return <Login onLogin={handleLogin} />;
}

// ============================================================
// RUTA DEL VIAJERO
// ============================================================

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
        <TravelerServices
          user={user}
          onLogout={handleLogout}
        />
      </ItineraryProvider>
    </ProtectedRoute>
  );
}

// ============================================================
// RUTA DEL ADMINISTRADOR
// ============================================================

function AdminPanelRoute() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminPanel
        user={user}
        onLogout={handleLogout}
      />
    </ProtectedRoute>
  );
}

// ============================================================
// RUTA DEL PROVEEDOR
// ============================================================

function DashboardRoute() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['PROVIDER']}>
      <Dashboard
        user={user}
        onLogout={handleLogout}
      />
    </ProtectedRoute>
  );
}

// ============================================================
// DEFINICIÓN DE RUTAS
// ============================================================

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        {/* Ruta pública de inicio de sesión. */}
        <Route
          path="/login"
          element={<LoginRoute />}
        />

        {/* Rutas del administrador. */}
        <Route
          path="/admin/proveedores-pendientes"
          element={<AdminPanelRoute />}
        />

        {/* Rutas del proveedor. */}
        <Route
          path="/proveedor/dashboard"
          element={<DashboardRoute />}
        />

        {/* Rutas del viajero. */}
        <Route
          path="/viajero/servicios"
          element={<TravelerServicesRoute />}
        />

        {/* Ruta inicial. */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Ruta para direcciones inexistentes. */}
        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="mb-4 text-4xl font-bold">
                  404
                </h1>

                <p className="mb-8 text-gray-600">
                  Página no encontrada
                </p>

                <a
                  href="/login"
                  className="rounded bg-blue-600 px-6 py-2 text-white"
                >
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

// ============================================================
// APLICACIÓN PRINCIPAL
// ============================================================

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