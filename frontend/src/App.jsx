import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import TravelerServices from './components/TravelerServicesWithBudget';

function App() {
  const [user, setUser] = useState(null);

  return (
    <>
      {user ? (
        user.role === 'ADMIN' ? (
          <AdminPanel user={user} onLogout={() => setUser(null)} />
        ) : user.role === 'PROVIDER' ? (
          <Dashboard user={user} onLogout={() => setUser(null)} />
        ) : (
          <TravelerServices user={user} onLogout={() => setUser(null)} />
        )
      ) : (
        <Login onLogin={(userData) => setUser(userData)} />
      )}
    </>
  );
}

export default App;