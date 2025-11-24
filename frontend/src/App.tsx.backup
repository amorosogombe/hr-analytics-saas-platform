import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/Dashboard';
import { awsConfig } from './aws-config';

Amplify.configure(awsConfig);

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '18px', color: '#667eea' }}>Loading...</div>;
  }

  return user ? <Dashboard /> : <Login onLoginSuccess={setUser} />;
}

export default App;
