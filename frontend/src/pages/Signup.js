import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Form,
  Grid,
  Column,
  Button,
  TextInput,
  PasswordInput,
  Select,
  SelectItem,
  Tile,
  Heading,
  InlineNotification
} from '@carbon/react';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'tenant'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (e) => {
    setFormData({
      ...formData,
      role: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!formData.displayName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(
        formData.email, 
        formData.password, 
        {
          displayName: formData.displayName,
          username: formData.username,
          phone: formData.phone,
          role: formData.role
        }
      );
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Account created successfully! Please check your email to verify your account.');
        // Optionally redirect after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
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
          <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '2rem' }}>
            <Tile style={{ padding: '2rem' }}>
              <Heading style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                Join NG Rentals
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
                <div style={{ marginBottom: '1rem' }}>
                  <TextInput
                    id="displayName"
                    name="displayName"
                    labelText="Full Name"
                    value={formData.displayName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <TextInput
                    id="username"
                    name="username"
                    labelText="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    helperText="3+ characters, letters, numbers, and underscores only"
                    placeholder="e.g., property_pro_lagos"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <TextInput
                    id="email"
                    name="email"
                    labelText="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <TextInput
                    id="phone"
                    name="phone"
                    labelText="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    helperText="Optional"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <Select
                    id="role"
                    name="role"
                    labelText="I am a..."
                    value={formData.role}
                    onChange={handleSelectChange}
                  >
                    <SelectItem value="tenant" text="Tenant (Looking for property)" />
                    <SelectItem value="owner" text="Property Owner (Listing property)" />
                  </Select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <PasswordInput
                    id="password"
                    name="password"
                    labelText="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    helperText="Must be at least 6 characters"
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    labelText="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <p>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#0f62fe', textDecoration: 'none' }}>
                      Sign in here
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

export default Signup;
