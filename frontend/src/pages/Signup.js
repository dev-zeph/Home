import React, { useState, useCallback, useMemo } from 'react';
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
  InlineNotification,
  ProgressIndicator,
  ProgressStep,
  Stack,
  Layer,
  ToastNotification
} from '@carbon/react';
import { ArrowRight, ArrowLeft, CheckmarkFilled } from '@carbon/icons-react';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'renter'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stepErrors, setStepErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Define form steps
  const steps = [
    {
      label: 'Personal Info',
      description: 'Tell us about yourself',
      fields: ['displayName', 'username']
    },
    {
      label: 'Contact Details',
      description: 'How can we reach you?',
      fields: ['email', 'phone']
    },
    {
      label: 'Account Type',
      description: 'What brings you here?',
      fields: ['role']
    },
    {
      label: 'Security',
      description: 'Create your password',
      fields: ['password', 'confirmPassword']
    }
  ];

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

  // Validate individual step
  const validateStep = useCallback((stepIndex) => {
    const step = steps[stepIndex];
    const errors = {};

    step.fields.forEach(field => {
      switch (field) {
        case 'displayName':
          if (!formData.displayName.trim()) {
            errors.displayName = 'Full name is required';
          }
          break;
        case 'username':
          if (!formData.username.trim()) {
            errors.username = 'Username is required';
          } else if (formData.username.length < 3) {
            errors.username = 'Username must be at least 3 characters long';
          } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.username = 'Username can only contain letters, numbers, and underscores';
          }
          break;
        case 'email':
          if (!formData.email.trim()) {
            errors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
          }
          break;
        case 'password':
          if (!formData.password) {
            errors.password = 'Password is required';
          } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters long';
          }
          break;
        case 'confirmPassword':
          if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
          } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
          }
          break;
        default:
          break;
      }
    });

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, steps]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setError('');
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  }, [currentStep, steps.length, validateStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  }, [currentStep]);

  const isStepCompleted = useCallback((stepIndex) => {
    const step = steps[stepIndex];
    return step.fields.every(field => {
      if (field === 'phone') return true; // Phone is optional
      return formData[field] && formData[field].toString().trim() !== '';
    });
  }, [formData, steps]);

  const canProceed = useMemo(() => {
    const step = steps[currentStep];
    const hasErrors = step.fields.some(field => {
      switch (field) {
        case 'displayName':
          return !formData.displayName.trim();
        case 'username':
          return !formData.username.trim() || 
                 formData.username.length < 3 || 
                 !/^[a-zA-Z0-9_]+$/.test(formData.username);
        case 'email':
          return !formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email);
        case 'password':
          return !formData.password || formData.password.length < 6;
        case 'confirmPassword':
          return !formData.confirmPassword || formData.password !== formData.confirmPassword;
        case 'phone':
          return false; // Phone is optional
        case 'role':
          return !formData.role;
        default:
          return false;
      }
    });
    return !hasErrors;
  }, [formData, currentStep, steps]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep < steps.length - 1) {
      handleNext();
      return;
    }

    // Final submission
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await signUp(
        formData.email, 
        formData.password, 
        {
          displayName: formData.displayName,
          username: formData.username,
          phone: formData.phone,
          role: formData.role
        },
        {
          emailRedirectTo: window.location.origin + '/login'
        }
      );
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Account created successfully!');
        setShowToast(true);
        // Redirect to login after showing toast for a bit
        setTimeout(() => {
          setShowToast(false);
          navigate('/login');
        }, 5000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Stack gap={5}>
            <TextInput
              id="displayName"
              name="displayName"
              labelText="Full Name *"
              value={formData.displayName}
              onChange={handleChange}
              invalid={!!stepErrors.displayName}
              invalidText={stepErrors.displayName}
              placeholder="Enter your full name"
              size="lg"
            />
            <TextInput
              id="username"
              name="username"
              labelText="Username *"
              value={formData.username}
              onChange={handleChange}
              invalid={!!stepErrors.username}
              invalidText={stepErrors.username}
              helperText="3+ characters, letters, numbers, and underscores only"
              placeholder="e.g., property_pro_lagos"
              size="lg"
            />
          </Stack>
        );
      
      case 1:
        return (
          <Stack gap={5}>
            <TextInput
              id="email"
              name="email"
              labelText="Email Address *"
              type="email"
              value={formData.email}
              onChange={handleChange}
              invalid={!!stepErrors.email}
              invalidText={stepErrors.email}
              placeholder="Enter your email address"
              size="lg"
            />
            <TextInput
              id="phone"
              name="phone"
              labelText="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              helperText="Optional - helps with property inquiries"
              placeholder="e.g., +234 801 234 5678"
              size="lg"
            />
          </Stack>
        );
      
      case 2:
        return (
          <Stack gap={5}>
            <Select
              id="role"
              name="role"
              labelText="I am a... *"
              value={formData.role}
              onChange={handleSelectChange}
              size="lg"
            >
              <SelectItem value="renter" text="Renter - Looking for cars to rent" />
              <SelectItem value="owner" text="Car Owner - Want to list my vehicle" />
            </Select>
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'var(--cds-layer-accent)', 
              borderRadius: '8px',
              border: '1px solid var(--cds-border-subtle)'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                color: 'var(--cds-text-secondary)' 
              }}>
                {formData.role === 'renter' 
                  ? '🚗 As a renter, you can search vehicles, save favorites, and book cars from verified owners.'
                  : '🚙 As a car owner, you can list your vehicles, manage bookings, and earn money from rentals.'
                }
              </p>
            </div>
          </Stack>
        );
      
      case 3:
        return (
          <Stack gap={5}>
            <PasswordInput
              id="password"
              name="password"
              labelText="Password *"
              value={formData.password}
              onChange={handleChange}
              invalid={!!stepErrors.password}
              invalidText={stepErrors.password}
              helperText="Must be at least 6 characters"
              placeholder="Create a secure password"
              size="lg"
            />
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              labelText="Confirm Password *"
              value={formData.confirmPassword}
              onChange={handleChange}
              invalid={!!stepErrors.confirmPassword}
              invalidText={stepErrors.confirmPassword}
              placeholder="Re-enter your password"
              size="lg"
            />
          </Stack>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          maxWidth: '400px'
        }}>
          <ToastNotification
            kind="success"
            title="Account Created Successfully!"
            subtitle="Please check your email and click the confirmation link to activate your account. You can then sign in to RYD."
            caption={new Date().toLocaleTimeString()}
            timeout={0}
            onCloseButtonClick={() => setShowToast(false)}
            style={{
              marginBottom: '1rem'
            }}
          />
        </div>
      )}

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
    minHeight: '100vh',         // vertical centering
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  }}
>
  <Column sm={4} md={6} lg={6} xlg={6}>
    <div
      style={{
        maxWidth: '560px',       // a bit wider, cleaner on large screens
        margin: '0 auto',
        width: '100%'
      }}
    >
      <Layer level={1}>
        <Tile
          style={{
            padding: 'clamp(2rem, 4vw, 3rem)',
            borderRadius: '8px',
            backgroundColor: 'var(--cds-layer)',
            border: '1px solid var(--cds-border-subtle, #e0e0e0)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.06)' // safer default token fallback
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Heading
              size="lg"
              style={{
                marginBottom: '0.5rem',
                color: 'var(--cds-text-primary)'
              }}
            >
              Join RYD
            </Heading>
            <p
              style={{
                color: 'var(--cds-text-secondary)',
                margin: 0,
                fontSize: '1rem'
              }}
            >
              Create your account in {steps.length} easy steps
            </p>
          </div>

          {/* Progress Indicator */}
          <div style={{ marginBottom: '2rem' }}>
            {/* <ProgressIndicator currentIndex={currentStep} spaceEqually>
              {steps.map((step, index) => (
                <ProgressStep
                  key={index}
                  label={step.label}
                  description={step.description}
                  complete={index < currentStep || isStepCompleted(index)}
                  current={index === currentStep}
                />
              ))}
            </ProgressIndicator> */}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div style={{ marginBottom: '1.5rem' }}>
              <InlineNotification
                kind="error"
                title="Error"
                subtitle={error}
                hideCloseButton
                lowContrast
              />
            </div>
          )}

          {success && (
            <div style={{ marginBottom: '1.5rem' }}>
              <InlineNotification
                kind="success"
                title="Success!"
                subtitle={success}
                hideCloseButton
                lowContrast
              />
            </div>
          )}

          {/* Form Content */}
          <Form onSubmit={handleSubmit}>
            <div style={{ minHeight: '220px', marginBottom: '2rem' }}>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem'
              }}
            >
              <Button
                kind="secondary"
                size="lg"
                onClick={handlePrev}
                disabled={currentStep === 0}
                renderIcon={ArrowLeft}
                style={{ minWidth: '128px' }}  // slightly larger for consistency
              >
                Previous
              </Button>

              <div
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--cds-text-secondary)',
                  textAlign: 'center',
                  minWidth: '120px'
                }}
              >
                Step {currentStep + 1} of {steps.length}
              </div>

              {currentStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  kind="primary"
                  size="lg"
                  disabled={loading || !canProceed}
                  renderIcon={CheckmarkFilled}
                  style={{ minWidth: '128px' }}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              ) : (
                <Button
                  type="submit"
                  kind="primary"
                  size="lg"
                  disabled={!canProceed}
                  renderIcon={ArrowRight}
                  style={{ minWidth: '128px' }}
                >
                  Next
                </Button>
              )}
            </div>
          </Form>

          {/* Footer */}
          <div
            style={{
              textAlign: 'center',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--cds-border-subtle, #e0e0e0)'
            }}
          >
            <p
              style={{
                color: 'var(--cds-text-secondary)',
                fontSize: '0.95rem',
                margin: '0 0 1rem 0'
              }}
            >
              Already have an account?
            </p>
            <Button as={Link} to="/login" kind="tertiary" size="lg">
              Sign In Instead
            </Button>
          </div>
        </Tile>
      </Layer>
    </div>
  </Column>        </Grid>

      </div>
    </>
  );
};

export default Signup;
