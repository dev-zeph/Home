import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Grid,
  Column,
  Button,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  NumberInput,
  Tile,
  Heading,
  InlineNotification,
  ToastNotification,
  FileUploader,
  Toggle,
  MultiSelect
} from '@carbon/react';
import { useAuth } from '../contexts/AuthContext';
import { propertyService } from '../services/propertyService';

const PostProperty = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    deposit_ngn: '',
    property_type: 'apartment',
    bedrooms: 1,
    bathrooms: 1,
    furnished: false,
    city: '',
    state: '',
    area: '',
    address_text: '',
    amenities: []
  });

  const [selectedFiles, setSelectedFiles] = useState([]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const amenityOptions = [
    { id: 'swimming_pool', text: 'Swimming Pool' },
    { id: 'gym', text: 'Gym/Fitness Center' },
    { id: 'security', text: '24/7 Security' },
    { id: 'parking', text: 'Parking Space' },
    { id: 'generator', text: 'Generator/Power Backup' },
    { id: 'wifi', text: 'Wi-Fi/Internet' },
    { id: 'ac', text: 'Air Conditioning' },
    { id: 'garden', text: 'Garden/Green Space' },
    { id: 'elevator', text: 'Elevator' },
    { id: 'balcony', text: 'Balcony/Terrace' },
    { id: 'kitchen', text: 'Modern Kitchen' },
    { id: 'laundry', text: 'Laundry Room' }
  ];

  const nigerianStates = [
    'Lagos State', 'FCT', 'Kano State', 'Rivers State', 'Oyo State',
    'Delta State', 'Imo State', 'Anambra State', 'Kaduna State', 'Ogun State',
    'Cross River State', 'Plateau State', 'Akwa Ibom State', 'Edo State',
    'Ondo State', 'Osun State', 'Katsina State', 'Kwara State', 'Enugu State',
    'Kebbi State', 'Sokoto State', 'Adamawa State', 'Borno State', 'Taraba State',
    'Yobe State', 'Gombe State', 'Bauchi State', 'Jigawa State', 'Zamfara State',
    'Niger State', 'Benue State', 'Kogi State', 'Nasarawa State', 'Abia State',
    'Ebonyi State', 'Bayelsa State', 'Ekiti State'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (e, name) => {
    setFormData(prev => ({
      ...prev,
      [name]: e.target.value
    }));
  };

  const handleAmenitiesChange = (selectedItems) => {
    setFormData(prev => ({
      ...prev,
      amenities: selectedItems.map(item => item.text)
    }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Property title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Property description is required');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      setError('Valid price is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!formData.state) {
      setError('State is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare property data
      const propertyData = {
        ...formData,
        user_id: user.id,
        price: parseInt(formData.price),
        deposit_ngn: formData.deposit_ngn ? parseInt(formData.deposit_ngn) : null,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        status: 'pending', // Will be reviewed by admin
        verified: false
      };

      // Create property
      const newProperty = await propertyService.createProperty(propertyData);

      // Upload images if any
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          await propertyService.uploadPropertyMedia(
            newProperty.id, 
            selectedFiles[i], 
            'image'
          );
        }
      }

      setSuccess('Property submitted successfully! 🎉 Your listing has been sent for review by our verification officers. You will receive an email notification once it has been approved and goes live on the platform.');
      setShowToast(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        deposit_ngn: '',
        property_type: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        furnished: false,
        city: '',
        state: '',
        area: '',
        address_text: '',
        amenities: []
      });
      setSelectedFiles([]);

      // Hide toast after 4 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);

      // Redirect to dashboard after success with a longer delay to show the message
      setTimeout(() => {
        navigate('/dashboard', { 
          state: { 
            message: 'Property submitted for verification! Check your dashboard to track its status.' 
          } 
        });
      }, 5000); // Increased to 5 seconds to give user time to read

    } catch (err) {
      setError('Failed to post property: ' + err.message);
      console.error('Error posting property:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{ padding: '2rem 0', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      {/* Toast Notification */}
      {showToast && (
        <div style={{ 
          position: 'fixed', 
          top: '100px', 
          right: '20px', 
          zIndex: 9999,
          maxWidth: '400px'
        }}>
          <ToastNotification
            kind="success"
            title="Property Submitted! 🎉"
            subtitle="Your listing is now being reviewed by our verification team. You'll be notified once it's approved!"
            timeout={4000}
            onCloseButtonClick={() => setShowToast(false)}
          />
        </div>
      )}

      <Grid>
        <Column sm={4} md={8} lg={12} xlg={12} max={16}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Tile style={{ padding: '2rem', marginBottom: '2rem' }}>
              <Heading style={{ marginBottom: '1.5rem' }}>
                Post Your Property
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
                <Grid>
                  {/* Basic Information */}
                  <Column sm={4} md={8} lg={16}>
                    <Heading size="4" style={{ marginBottom: '1rem' }}>
                      Basic Information
                    </Heading>
                  </Column>

                  <Column sm={4} md={8} lg={16}>
                    <TextInput
                      id="title"
                      name="title"
                      labelText="Property Title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Modern 3BR Apartment in Victoria Island"
                      required
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  <Column sm={4} md={8} lg={16}>
                    <TextArea
                      id="description"
                      name="description"
                      labelText="Description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your property, its features, and surroundings..."
                      rows={4}
                      required
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <Select
                      id="property_type"
                      name="property_type"
                      labelText="Property Type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      style={{ marginBottom: '1rem' }}
                    >
                      <SelectItem value="apartment" text="Apartment" />
                      <SelectItem value="house" text="House" />
                      <SelectItem value="shared" text="Shared Accommodation" />
                      <SelectItem value="land" text="Land" />
                    </Select>
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <Toggle
                      id="furnished"
                      labelText="Furnished"
                      toggled={formData.furnished}
                      onToggle={(checked) => setFormData(prev => ({ ...prev, furnished: checked }))}
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  {/* Pricing */}
                  <Column sm={4} md={8} lg={16}>
                    <Heading size="4" style={{ margin: '1.5rem 0 1rem 0' }}>
                      Pricing
                    </Heading>
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <NumberInput
                      id="price"
                      name="price"
                      label="Monthly Rent (₦)"
                      value={formData.price}
                      onChange={(e) => handleNumberChange(e, 'price')}
                      min={0}
                      required
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <NumberInput
                      id="deposit_ngn"
                      name="deposit_ngn"
                      label="Security Deposit (₦)"
                      value={formData.deposit_ngn}
                      onChange={(e) => handleNumberChange(e, 'deposit_ngn')}
                      min={0}
                      helperText="Optional"
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  {/* Property Details */}
                  <Column sm={4} md={8} lg={16}>
                    <Heading size="4" style={{ margin: '1.5rem 0 1rem 0' }}>
                      Property Details
                    </Heading>
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <NumberInput
                      id="bedrooms"
                      name="bedrooms"
                      label="Bedrooms"
                      value={formData.bedrooms}
                      onChange={(e) => handleNumberChange(e, 'bedrooms')}
                      min={1}
                      max={20}
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <NumberInput
                      id="bathrooms"
                      name="bathrooms"
                      label="Bathrooms"
                      value={formData.bathrooms}
                      onChange={(e) => handleNumberChange(e, 'bathrooms')}
                      min={1}
                      max={20}
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  <Column sm={4} md={8} lg={16}>
                    <MultiSelect
                      id="amenities"
                      titleText="Amenities"
                      label="Select amenities"
                      items={amenityOptions}
                      itemToString={(item) => (item ? item.text : '')}
                      onChange={({ selectedItems }) => handleAmenitiesChange(selectedItems)}
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  {/* Location */}
                  <Column sm={4} md={8} lg={16}>
                    <Heading size="4" style={{ margin: '1.5rem 0 1rem 0' }}>
                      Location
                    </Heading>
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <TextInput
                      id="city"
                      name="city"
                      labelText="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g., Lagos, Abuja"
                      required
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <Select
                      id="state"
                      name="state"
                      labelText="State"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      style={{ marginBottom: '1rem' }}
                    >
                      <SelectItem value="" text="Select a state" />
                      {nigerianStates.map(state => (
                        <SelectItem key={state} value={state} text={state} />
                      ))}
                    </Select>
                  </Column>

                  <Column sm={4} md={4} lg={8}>
                    <TextInput
                      id="area"
                      name="area"
                      labelText="Area/Neighborhood"
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="e.g., Victoria Island, Maitama"
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  <Column sm={4} md={8} lg={16}>
                    <TextArea
                      id="address_text"
                      name="address_text"
                      labelText="Full Address"
                      value={formData.address_text}
                      onChange={handleInputChange}
                      placeholder="Complete address with landmarks"
                      rows={2}
                      style={{ marginBottom: '1rem' }}
                    />
                  </Column>

                  {/* Images */}
                  <Column sm={4} md={8} lg={16}>
                    <Heading size="4" style={{ margin: '1.5rem 0 1rem 0' }}>
                      Property Images
                    </Heading>
                  </Column>

                  <Column sm={4} md={8} lg={16}>
                    <FileUploader
                      accept={['.jpg', '.jpeg', '.png']}
                      buttonLabel="Choose images"
                      filenameStatus="edit"
                      iconDescription="Upload images"
                      labelDescription="Upload up to 10 images (JPG, PNG)"
                      labelTitle="Property Images"
                      multiple
                      onChange={handleFileChange}
                      style={{ marginBottom: '2rem' }}
                    />
                  </Column>

                  {/* Submit Button */}
                  <Column sm={4} md={8} lg={16}>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      style={{ width: '100%' }}
                    >
                      {loading ? 'Posting Property...' : 'Post Property'}
                    </Button>
                  </Column>
                </Grid>
              </Form>
            </Tile>
          </div>
        </Column>
      </Grid>
    </div>
  );
};

export default PostProperty;
