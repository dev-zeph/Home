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
    <div style={{ minHeight: '100vh', paddingTop: '4rem', backgroundColor: '#f4f4f4' }}>
      <Grid>
        <Column sm={4} md={6} lg={8} xlg={10} max={12}>
          <div style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '2rem' }}>
            <Tile style={{ padding: '2rem' }}>
              <Heading style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                Sign In to NG Rentals
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
                <div style={{ marginBottom: '1rem' }}>
                  <TextInput
                    id="email"
                    name="email"
                    labelText="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    invalid={error && error.includes('email')}
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
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <p>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: '#0f62fe', textDecoration: 'none' }}>
                      Sign up here
                    </Link>
                  </p>
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
