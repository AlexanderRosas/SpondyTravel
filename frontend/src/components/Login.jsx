import { useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('viajeroUno@spondytravel.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Para enviar cookies si el backend las utiliza
      });


      if (!response.ok) {
        throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
      
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      const userData = {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role
      };
      onLogin(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-xl">✈</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Spondy Travel</h1>
          <p className="text-gray-500 text-sm">Descubre destinos increíbles</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input 
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  disabled:bg-gray-50 disabled:cursor-not-allowed
                  text-gray-900 placeholder-gray-400
                  transition-all duration-200"
                aria-label="Correo Electrónico"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  disabled:bg-gray-50 disabled:cursor-not-allowed
                  text-gray-900 placeholder-gray-400
                  transition-all duration-200"
                aria-label="Contraseña"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                text-white font-medium rounded-xl transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                active:scale-95 shadow-sm hover:shadow-md"
              aria-label="Ingresar"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-xs font-semibold text-gray-600 mb-3">Credenciales de Prueba:</p>
          <div className="space-y-2 text-xs text-gray-600">
            <div><span className="font-medium">Viajero:</span> viajeroUno@spondytravel.com / 123456</div>
            <div><span className="font-medium">Admin:</span> admin@spondy.com / admin123</div>
            <div><span className="font-medium">Proveedor:</span> proveedorAprobado@spondytravel.com / 123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}