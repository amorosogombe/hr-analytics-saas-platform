import { useEffect, useState } from 'react';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';

export const Dashboard: React.FC = () => {
  const [userAttributes, setUserAttributes] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAttributes();
  }, []);

  const loadUserAttributes = async () => {
    try {
      const attributes = await fetchUserAttributes();
      setUserAttributes(attributes);
    } catch (error) {
      console.error('Error loading user attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <span style={styles.brandIcon}>📊</span>
          <span style={styles.brandText}>HR Analytics</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </nav>
      <main style={styles.main}>
        <div style={styles.welcomeCard}>
          <h1 style={styles.welcomeTitle}>Welcome, {userAttributes.name || userAttributes.email}! 🎉</h1>
          <p style={styles.welcomeSubtitle}>You have successfully logged into the HR Analytics Platform</p>
        </div>
        <div style={styles.infoCard}>
          <h3 style={styles.infoTitle}>🎯 Infrastructure Deployed Successfully!</h3>
          <p><strong>Email:</strong> {userAttributes.email}</p>
          <p><strong>Role:</strong> {userAttributes['custom:role'] || 'Not set'}</p>
          <p><strong>Organization:</strong> {userAttributes['custom:organizationId'] || 'Not set'}</p>
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', backgroundColor: '#f7fafc' },
  nav: { backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navBrand: { display: 'flex', alignItems: 'center', gap: '12px' },
  brandIcon: { fontSize: '24px' },
  brandText: { fontSize: '20px', fontWeight: 'bold', color: '#1a202c' },
  logoutButton: { padding: '8px 16px', fontSize: '14px', color: '#667eea', backgroundColor: 'white', border: '1px solid #667eea', borderRadius: '6px', cursor: 'pointer' },
  main: { maxWidth: '800px', margin: '0 auto', padding: '40px 24px' },
  welcomeCard: { backgroundColor: 'white', borderRadius: '12px', padding: '40px', marginBottom: '32px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  welcomeTitle: { fontSize: '32px', fontWeight: 'bold', color: '#1a202c', margin: '0 0 12px 0' },
  welcomeSubtitle: { fontSize: '16px', color: '#718096', margin: 0 },
  infoCard: { backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  infoTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1a202c', marginBottom: '16px' },
};
