import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Grid,
  Column,
  Form,
  Stack,
  TextInput,
  Button,
  InlineNotification,
  Loading,
  Tile
} from '@carbon/react';
import { Login, Security } from '@carbon/icons-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, admin } = useAdminAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (admin) {
      navigate('/admin/dashboard');
    }
  }, [admin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid fullWidth className="admin-login">
      <Column lg={6} md={8} sm={4} className="admin-login__content">
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <Tile style={{ 
            width: '100%', 
            maxWidth: '400px', 
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Security size={48} style={{ marginBottom: '1rem', color: '#0f62fe' }} />
              <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Admin Portal</h2>
              <p style={{ margin: 0, color: '#666' }}>
                Sign in to access the NG Rentals admin dashboard
              </p>
            </div>

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
              <Stack gap={5}>
                <TextInput
                  id="email"
                  labelText="Admin Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  disabled={loading}
                  required
                />

                <TextInput
                  id="password"
                  labelText="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />

                <Button
                  type="submit"
                  kind="primary"
                  disabled={loading || !email || !password}
                  renderIcon={loading ? undefined : Login}
                  style={{ width: '100%' }}
                >
                  {loading ? <Loading description="Signing in..." /> : 'Sign In'}
                </Button>
              </Stack>
            </Form>

            <div style={{ 
              textAlign: 'center', 
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f4f4f4',
              borderRadius: '4px'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                Don't have admin access?
              </p>
              <Link 
                to="/admin/signup" 
                style={{ 
                  color: '#0f62fe', 
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                Request Admin Account
              </Link>
            </div>

            <div style={{ 
              textAlign: 'center', 
              marginTop: '1rem',
              fontSize: '0.75rem',
              color: '#888'
            }}>
              <p style={{ margin: 0 }}>
                ⚠️ Admin sessions expire after 30 minutes of inactivity
              </p>
            </div>
          </Tile>
        </div>
      </Column>

      <Column lg={10} md={8} sm={4} className="admin-login__background">
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f62fe 0%, #002d9c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '2rem'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', margin: 0 }}>
              NG Rentals
            </h1>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', margin: 0, fontWeight: 300 }}>
              Administrative Portal
            </h2>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, opacity: 0.9 }}>
              Manage property verifications, oversee platform operations, 
              and ensure quality standards across the marketplace.
            </p>
            
            <div style={{ 
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Admin Features
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                textAlign: 'left',
                fontSize: '0.9rem'
              }}>
                <li style={{ marginBottom: '0.5rem' }}>✓ Property verification and approval</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Content moderation tools</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ User communication management</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Platform analytics and reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </Column>
    </Grid>
  );
};

export default AdminLogin;
