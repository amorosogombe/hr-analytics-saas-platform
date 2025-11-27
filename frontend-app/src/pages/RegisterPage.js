import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { APP_CONFIG } from '../aws-config';
import axios from 'axios';

export default function RegisterPage() {
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Employees'); // Default to Employee
  
  // Organization detection
  const [detectedOrg, setDetectedOrg] = useState(null);
  const [detectingOrg, setDetectingOrg] = useState(false);
  const [orgNotFound, setOrgNotFound] = useState(false);
  
  // Registration flow
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Email verification
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Detect organization from email domain
  useEffect(() => {
    const detectOrganization = async () => {
      // Extract domain from email
      const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
      const match = email.match(emailRegex);
      
      if (!match) {
        setDetectedOrg(null);
        setOrgNotFound(false);
        return;
      }
      
      const domain = match[1].toLowerCase();
      
      // Skip common public email domains
      const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
      if (publicDomains.includes(domain)) {
        setDetectedOrg(null);
        setOrgNotFound(true);
        return;
      }
      
      try {
        setDetectingOrg(true);
        setOrgNotFound(false);
        
        // Call API to find organization by domain
        const response = await axios.get(
          `${APP_CONFIG.apiUrl}/auth/lookup-organization?domain=${domain}`
        );
        
        if (response.data.organization) {
          setDetectedOrg(response.data.organization);
          setOrgNotFound(false);
        } else {
          setDetectedOrg(null);
          setOrgNotFound(true);
        }
      } catch (err) {
        console.error('Error detecting organization:', err);
        setDetectedOrg(null);
        setOrgNotFound(true);
      } finally {
        setDetectingOrg(false);
      }
    };
    
    // Debounce - wait 500ms after user stops typing
    const timer = setTimeout(() => {
      if (email && email.includes('@')) {
        detectOrganization();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [email]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email || !password || !fullName || !role) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!detectedOrg) {
      setError('No organization found for your email domain. Please contact your administrator.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setIsRegistering(true);
      
      // Call registration API
      const response = await axios.post(`${APP_CONFIG.apiUrl}/auth/register-user`, {
        email,
        password,
        fullName,
        role,
        organizationId: detectedOrg.organizationId,
      });
      
      if (response.data.needsVerification) {
        setNeedsVerification(true);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setVerifying(true);
      
      const response = await axios.post(`${APP_CONFIG.apiUrl}/auth/verify-email`, {
        email,
        code: verificationCode,
      });
      
      if (response.data.success) {
        setSuccess(true);
        setNeedsVerification(false);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-green-500/20">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4">
                <svg className="h-10 w-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                Registration Successful!
              </h2>
              
              <div className="space-y-4 text-left">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <p className="text-slate-300 mb-2">
                    ✅ Email verified
                  </p>
                  <p className="text-slate-300 mb-2">
                    📧 Approval request sent to your organization administrator
                  </p>
                  <p className="text-slate-300">
                    ⏳ Your account is pending approval
                  </p>
                </div>
                
                <p className="text-slate-400 text-sm">
                  You'll receive an email notification once your account is approved by your organization administrator.
                </p>
                
                <p className="text-slate-300 font-medium">
                  Organization: <span className="text-purple-400">{detectedOrg?.name}</span>
                </p>
                <p className="text-slate-300 font-medium">
                  Role: <span className="text-purple-400">{role.replace('s', '')}</span>
                </p>
              </div>
              
              <button
                onClick={() => navigate('/login')}
                className="mt-6 w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Email verification screen
  if (needsVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-purple-500/20">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                Verify Your Email
              </h2>
              <p className="text-slate-400">
                We've sent a verification code to:
              </p>
              <p className="text-purple-400 font-medium mt-1">
                {email}
              </p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {verifying ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setNeedsVerification(false)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                ← Back to registration
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-4xl font-bold text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-center text-slate-400">
            Join your organization on HR Analytics
          </p>
        </div>

        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-purple-500/20">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Email Input with Organization Detection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Work Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              
              {/* Organization Detection Status */}
              {detectingOrg && (
                <div className="mt-2 flex items-center text-sm text-slate-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                  Detecting organization...
                </div>
              )}
              
              {detectedOrg && (
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-400">
                        Organization Detected
                      </p>
                      <p className="text-sm text-slate-300">
                        {detectedOrg.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {orgNotFound && email.includes('@') && !detectingOrg && (
                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-400">
                        Organization Not Found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Your email domain is not associated with any organization. Please contact your administrator or use your work email address.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Role Selection - Only show if org detected */}
            {detectedOrg && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="Employees">Employee</option>
                  <option value="Supervisors">Supervisor</option>
                  <option value="HRManagers">HR Manager</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Select your role within the organization
                </p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-slate-400">
                Minimum 8 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={isRegistering || !detectedOrg}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {isRegistering ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
