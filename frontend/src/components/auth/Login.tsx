import { useState } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, confirmSignIn } from 'aws-amplify/auth';
import { awsConfig } from '../../aws-config';

Amplify.configure(awsConfig);

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password,
      });

      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setNeedsPasswordChange(true);
      } else if (isSignedIn) {
        onLoginSuccess({ username: email });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await confirmSignIn({
        challengeResponse: newPassword,
      });
      onLoginSuccess({ username: email });
    } catch (err: any) {
      setError(err.message || 'Password change failed.');
      console.error('Password change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (needsPasswordChange) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>🔒</span>
            </div>
            <h1 style={styles.title}>Change Password</h1>
            <p style={styles.subtitle}>Please set a new password</p>
          </div>
          <form onSubmit={handlePasswordChange} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 12 chars)"
                style={styles.input}
                required
                minLength={12}
              />
              <small style={styles.hint}>Must be 12+ characters with uppercase, lowercase, number, and symbol</small>
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <button type="submit" disabled={isLoading} style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}}>
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>📊</span>
          </div>
          <h1 style={styles.title}>HR Analytics</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@company.com" style={styles.input} required />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" style={styles.input} required />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={isLoading} style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={styles.footer}>
          <p style={styles.footerText}>First time? Use your temporary password and you will be prompted to change it.</p>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' },
  card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', padding: '40px', width: '100%', maxWidth: '440px' },
  header: { textAlign: 'center', marginBottom: '32px' },
  iconContainer: { width: '64px', height: '64px', backgroundColor: '#667eea', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  icon: { fontSize: '32px' },
  title: { fontSize: '28px', fontWeight: 'bold', color: '#1a202c', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: '#718096', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#4a5568' },
  input: { padding: '12px 16px', fontSize: '14px', border: '1px solid #cbd5e0', borderRadius: '6px', outline: 'none' },
  hint: { fontSize: '12px', color: '#718096' },
  button: { padding: '12px 24px', fontSize: '16px', fontWeight: '600', color: 'white', backgroundColor: '#667eea', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  buttonDisabled: { backgroundColor: '#a0aec0', cursor: 'not-allowed' },
  error: { padding: '12px', backgroundColor: '#fed7d7', color: '#c53030', borderRadius: '6px', fontSize: '14px' },
  footer: { marginTop: '24px', textAlign: 'center' },
  footerText: { fontSize: '12px', color: '#718096' },
};
