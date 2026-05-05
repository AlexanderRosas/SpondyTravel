import React, { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const AdminPanel = ({ user, onLogout }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/pending-providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approveProvider = async (provider) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/verify-provider/${provider.id}`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to approve provider');
      // Remove from list
      setProviders(providers.filter(p => p.id !== provider.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-sky-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Spondy Travel - Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-sky-200">{user.email}</span>
            <button onClick={onLogout} className="text-sm bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition">
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6 mt-6">
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">Error: {error}</div>}
        {!loading && !error && (
          <>
            <h2 className="text-2xl font-bold mb-4">Pending Providers</h2>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b">Business Name</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Tax ID</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{provider.business_name}</td>
                    <td className="py-2 px-4 border-b">{provider.email}</td>
                    <td className="py-2 px-4 border-b">{provider.tax_id}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => approveProvider(provider)}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded flex items-center"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {providers.length === 0 && <p className="mt-4">No pending providers.</p>}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;