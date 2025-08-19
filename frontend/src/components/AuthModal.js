import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  Button,
  Select,
  SelectItem,
  InlineNotification,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel
} from '@carbon/react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phone: '',
    role: 'tenant'
  });

  const { signIn, signUp } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      setError(error.message);
    } else {
      onClose();
      setLoginData({ email: '', password: '' });
    }
    
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUp(
      signupData.email, 
      signupData.password, 
      {
        displayName: signupData.displayName,
        phone: signupData.phone,
        role: signupData.role
      }
    );
    
    if (error) {
      setError(error.message);
    } else {
      onClose();
      setSignupData({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        phone: '',
        role: 'tenant'
      });
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setError('');
    setLoginData({ email: '', password: '' });
    setSignupData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      phone: '',
      role: 'tenant'
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      open={open}
      onRequestClose={handleClose}
      modalHeading="Welcome to NG Rentals"
      primaryButtonText=""
      secondaryButtonText=""
      size="sm"
    >
      <Tabs selectedIndex={selectedTab} onChange={setSelectedTab}>
        <TabList>
          <Tab>Sign In</Tab>
          <Tab>Sign Up</Tab>
        </TabList>
        
        <TabPanels>
          {/* Sign In Panel */}
          <TabPanel>
            <form onSubmit={handleLogin} style={{ marginTop: '1rem' }}>
              {error && (
                <InlineNotification
                  kind="error"
                  title="Error"
                  subtitle={error}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              
              <TextInput
                id="login-email"
                labelText="Email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                required
                style={{ marginBottom: '1rem' }}
              />
              
              <TextInput
                id="login-password"
                labelText="Password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
                style={{ marginBottom: '1.5rem' }}
              />
              
              <Button
                type="submit"
                kind="primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </TabPanel>
          
          {/* Sign Up Panel */}
          <TabPanel>
            <form onSubmit={handleSignup} style={{ marginTop: '1rem' }}>
              {error && (
                <InlineNotification
                  kind="error"
                  title="Error"
                  subtitle={error}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              
              <TextInput
                id="signup-name"
                labelText="Display Name"
                value={signupData.displayName}
                onChange={(e) => setSignupData({...signupData, displayName: e.target.value})}
                required
                style={{ marginBottom: '1rem' }}
              />
              
              <TextInput
                id="signup-email"
                labelText="Email"
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                required
                style={{ marginBottom: '1rem' }}
              />
              
              <TextInput
                id="signup-phone"
                labelText="Phone Number"
                type="tel"
                value={signupData.phone}
                onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                style={{ marginBottom: '1rem' }}
              />
              
              <Select
                id="signup-role"
                labelText="I am a"
                value={signupData.role}
                onChange={(e) => setSignupData({...signupData, role: e.target.value})}
                style={{ marginBottom: '1rem' }}
              >
                <SelectItem value="tenant" text="Tenant (Looking for property)" />
                <SelectItem value="owner" text="Property Owner/Agent" />
              </Select>
              
              <TextInput
                id="signup-password"
                labelText="Password"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                required
                style={{ marginBottom: '1rem' }}
              />
              
              <TextInput
                id="signup-confirm-password"
                labelText="Confirm Password"
                type="password"
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                required
                style={{ marginBottom: '1.5rem' }}
              />
              
              <Button
                type="submit"
                kind="primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Modal>
  );
};

export default AuthModal;
