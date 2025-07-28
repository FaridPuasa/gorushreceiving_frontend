import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    width: '100%',
    maxWidth: '28rem'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#111827'
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    padding: '0.75rem 1rem',
    borderRadius: '0.25rem',
    marginBottom: '1rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.25rem'
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    fontSize: '1rem',
    lineHeight: '1.5',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
  },
  inputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  button: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    cursor: 'pointer',
    outline: 'none',
    transition: 'background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
  },
  buttonHover: {
    backgroundColor: '#1d4ed8'
  },
  buttonFocus: {
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)'
  }
};

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(credentials);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputFocus = (inputName) => {
    setFocusedInput(inputName);
  };

  const handleInputBlur = () => {
    setFocusedInput(null);
  };

  const getInputStyle = (inputName) => {
    return {
      ...styles.input,
      ...(focusedInput === inputName ? styles.inputFocus : {})
    };
  };

  const getButtonStyle = () => {
    return {
      ...styles.button,
      ...(isButtonHovered ? styles.buttonHover : {})
    };
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>GR Scanning System</h1>
        
        {error && (
          <div style={styles.errorContainer}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldContainer}>
            <label htmlFor="username" style={styles.label}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              style={getInputStyle('username')}
              value={credentials.username}
              onChange={handleChange}
              onFocus={() => handleInputFocus('username')}
              onBlur={handleInputBlur}
            />
          </div>
          
          <div style={styles.fieldContainer}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              style={getInputStyle('password')}
              value={credentials.password}
              onChange={handleChange}
              onFocus={() => handleInputFocus('password')}
              onBlur={handleInputBlur}
            />
          </div>
          
          <div>
            <button
              type="submit"
              style={getButtonStyle()}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;