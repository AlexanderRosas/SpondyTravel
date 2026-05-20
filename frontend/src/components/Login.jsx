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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white p-4">
      <div className="w-full max-w-md">
        {/* Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-xl">✈</span>
          </div>
          <h2 className="text-2xl font-bold">Bienvenido a Spondy Travel</h2>
          <p className="mt-2 text-gray-300">Planifica tus viajes de manera inteligente y personalizada.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 shadow-md rounded-lg p-6 space-y-4">
          {error && (
            <div className="flex items-center text-red-400 bg-red-900 p-3 rounded-md">
              <ExclamationCircleIcon className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white"
              placeholder="Ingresa tu correo"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white"
              placeholder="Ingresa tu contraseña"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Footer Section */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">¿No tienes una cuenta? <a href="#" className="text-indigo-400 hover:underline">Regístrate</a></p>
        </div>
      </div>
    </div>
  );
}