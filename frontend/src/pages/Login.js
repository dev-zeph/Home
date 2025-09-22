import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Form,
  Grid,
  Column,
  Button,
  TextInput,
  PasswordInput,
  Tile,
  Heading,
  InlineNotification
} from '@carbon/react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        setError(error.message);
      } else {
        // Redirect to home page or dashboard after successful login
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f4f4',
      padding: '1rem'
    }}>
      <Grid 
  fullWidth 
  style={{ 
    maxWidth: '1200px', 
    display: 'flex', 
    justifyContent: 'center' 
  }}
>
  <Column sm={4} md={6} lg={6} xlg={6}>
    <div style={{ 
      maxWidth: '450px', 
      margin: '0 auto',
      width: '100%'
    }}>
      <Tile style={{ 
        padding: '2.5rem',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e0e0e0'
      }}>
        <Heading style={{ 
          marginBottom: '2rem', 
          textAlign: 'center',
          color: '#161616'
        }}>
          Sign In to RYD
        </Heading>
        
        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            style={{ marginBottom: '1rem' }}
            hideCloseButton
          />
        )}

        <Form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <TextInput
              id="email"
              name="email"
              labelText="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              invalid={error && error.includes('email')}
              size="lg"
              placeholder="Enter your email address"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <PasswordInput
              id="password"
              name="password"
              labelText="Password"
              value={formData.password}
              onChange={handleChange}
              required
              invalid={error && error.includes('password')}
              size="lg"
              placeholder="Enter your password"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            style={{ 
              width: '100%', 
              marginBottom: '2rem',
              height: '48px'
            }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div style={{ 
            textAlign: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid #e0e0e0'
          }}>
            <p style={{ 
              margin: '0 0 1rem 0',
              color: '#525252',
              fontSize: '0.95rem'
            }}>
              Don't have an account?
            </p>
            <Link 
              to="/signup" 
              style={{ 
                color: '#0f62fe', 
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Create Account →
            </Link>
          </div>
        </Form>
      </Tile>
    </div>
  </Column>
</Grid>

    </div>
  );
};

export default Login;