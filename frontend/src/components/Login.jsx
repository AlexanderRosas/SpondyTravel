import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@spondy.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Credenciales incorrectas');
      
      const userData = await response.json();
      onLogin(userData); // Pasamos los datos al componente padre
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-sky-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-sky-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sky-900 mb-2">Spondy Travel</h1>
          <p className="text-gray-500">Inicia sesión en tu cuenta de Proveedor</p>
        </div>

        {error && <div className="mb-4 p-3 text-red-700 bg-red-100 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>
          <button type="submit" className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition duration-200">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}