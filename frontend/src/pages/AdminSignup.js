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
import { UserAdmin, Security } from '@carbon/icons-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, admin } = useAdminAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (admin) {
      navigate('/admin/dashboard');
    }
  }, [admin, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.displayName) {
      return 'Please fill in all fields';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    // Check for admin email domain (you can customize this)
    if (!formData.email.includes('@') || formData.email.length < 5) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signUp(formData.email, formData.password, {
        display_name: formData.displayName
      });
      
      setSuccess('Admin account request submitted! Please check your email for verification.');
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: ''
      });
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);
      
    } catch (error) {
      console.error('Admin signup error:', error);
      setError(error.message || 'Failed to create admin account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid fullWidth className="admin-signup">
      <Column lg={6} md={8} sm={4} className="admin-signup__content">
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
              <UserAdmin size={48} style={{ marginBottom: '1rem', color: '#0f62fe' }} />
              <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Request Admin Access</h2>
              <p style={{ margin: 0, color: '#666' }}>
                Apply for administrative privileges on NG Rentals
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

            {success && (
              <InlineNotification
                kind="success"
                title="Success"
                subtitle={success}
                style={{ marginBottom: '1rem' }}
                hideCloseButton
              />
            )}

            <Form onSubmit={handleSubmit}>
              <Stack gap={5}>
                <TextInput
                  id="displayName"
                  labelText="Full Name"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Enter your full name"
                  disabled={loading}
                  required
                />

                <TextInput
                  id="email"
                  labelText="Admin Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  disabled={loading}
                  required
                />

                <TextInput
                  id="password"
                  labelText="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  disabled={loading}
                  required
                />

                <TextInput
                  id="confirmPassword"
                  labelText="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  disabled={loading}
                  required
                />

                <Button
                  type="submit"
                  kind="primary"
                  disabled={loading}
                  renderIcon={loading ? undefined : UserAdmin}
                  style={{ width: '100%' }}
                >
                  {loading ? <Loading description="Creating account..." /> : 'Request Admin Access'}
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
                Already have admin access?
              </p>
              <Link 
                to="/admin/login" 
                style={{ 
                  color: '#0f62fe', 
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                Sign In Here
              </Link>
            </div>

            <div style={{ 
              textAlign: 'center', 
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#856404'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                ⚠️ Admin Account Notice
              </p>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Admin accounts require approval and verification. 
                This is a demo feature - in production, admin access would be strictly controlled.
              </p>
            </div>
          </Tile>
        </div>
      </Column>

      <Column lg={10} md={8} sm={4} className="admin-signup__background">
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
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
              Join Our Admin Team
            </h2>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, opacity: 0.9 }}>
              Help us maintain high quality standards and ensure a safe, 
              reliable rental marketplace for all users.
            </p>
            
            <div style={{ 
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                Admin Responsibilities
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                textAlign: 'left',
                fontSize: '0.9rem'
              }}>
                <li style={{ marginBottom: '0.5rem' }}>✓ Review and verify property listings</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Ensure compliance with platform policies</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Communicate with property owners</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Maintain platform quality standards</li>
              </ul>
            </div>
          </div>
        </div>
      </Column>
    </Grid>
  );
};

export default AdminSignup;
