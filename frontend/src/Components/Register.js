import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import './Auth.css';

function Register({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters');
    return;
  }

  setLoading(true);

  const result = await register(email, name, password);

  if (!result.success) {
    setError(result.error);
    setLoading(false);  // Only set false on ERROR
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🐅 Register for TigerTix</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@clemson.edu"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="link-button">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;