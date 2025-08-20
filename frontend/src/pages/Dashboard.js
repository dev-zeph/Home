import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Grid,
  Column,
  SideNav,
  SideNavItems,
  SideNavLink,
  Search,
  Modal,
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Pagination,
  Tag,
  IconButton,
  Loading,
  Tile,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Checkbox,
  InlineNotification
} from '@carbon/react';
import { 
  Dashboard as DashboardIcon, 
  Building, 
  Document, 
  Email,
  Receipt,
  View,
  Edit,
  Calendar,
  UserFollow,
  Close
} from '@carbon/icons-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// User Search Modal Component
const UserSearchModal = ({ isOpen, onClose, onStartConversation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchUsers(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchUsers = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for:', term); // Debug log
      console.log('Current user:', user?.id); // Debug log
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          full_name,
          phone,
          bio,
          follows!follows_follower_id_fkey (
            following_id,
            created_at
          )
        `)
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
        .neq('id', user?.id) // Exclude current user
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        // Show error to user
        setSearchResults([]);
        return;
      }

      console.log('Search results:', data); // Debug log
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert([{
          follower_id: user.id,
          following_id: userId
        }]);

      if (error) {
        console.error('Error following user:', error);
        return;
      }

      // Update the search results to reflect the new follow status
      setSearchResults(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, follows: [{ following_id: userId, created_at: new Date().toISOString() }] }
            : u
        )
      );
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) {
        console.error('Error unfollowing user:', error);
        return;
      }

      // Update the search results to reflect the unfollow
      setSearchResults(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, follows: [] }
            : u
        )
      );
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleStartConversation = (selectedUser) => {
    onStartConversation?.(selectedUser);
    onClose();
  };

  const isFollowing = (userToCheck) => {
    return userToCheck.follows && userToCheck.follows.length > 0;
  };

  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading="Search Users"
      modalLabel="Find and connect with other users"
      size="md"
    >
      <div style={{ marginBottom: '1rem' }}>
        <Search
          placeholder="Search by username or name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          size="md"
        />
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loading description="Searching users..." />
          </div>
        ) : searchResults.length > 0 ? (
          <div>
            {searchResults.map((searchUser) => (
              <div 
                key={searchUser.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#f9f9f9',
                  marginBottom: '8px',
                  borderRadius: '4px'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, marginBottom: '4px' }}>
                    {searchUser.full_name || `@${searchUser.username}`}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    @{searchUser.username}
                  </p>
                  {searchUser.bio && (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#888', marginTop: '4px' }}>
                      {searchUser.bio}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isFollowing(searchUser) ? (
                    <Button
                      kind="secondary"
                      size="sm"
                      onClick={() => handleUnfollow(searchUser.id)}
                    >
                      Unfollow
                    </Button>
                  ) : (
                    <Button
                      kind="primary"
                      size="sm"
                      onClick={() => handleFollow(searchUser.id)}
                    >
                      Follow
                    </Button>
                  )}
                  <Button
                    kind="ghost"
                    size="sm"
                    onClick={() => handleStartConversation(searchUser)}
                  >
                    Message
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm.trim() ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No users found matching "{searchTerm}"
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            Start typing to search for users...
          </div>
        )}
      </div>
    </Modal>
  );
};

// Dashboard Home Component
const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalViews: 0,
    totalApplications: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      // Fetch user's properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch total views for user's properties
      const { data: viewsData } = await supabase
        .from('property_views')
        .select('property_id')
        .in('property_id', 
          await supabase
            .from('properties')
            .select('id')
            .eq('user_id', user.id)
            .then(({ data }) => data?.map(p => p.id) || [])
        );

      setStats(prev => ({
        ...prev,
        totalProperties: propertiesCount || 0,
        totalViews: viewsData?.length || 0
      }));
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Loading description="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div>
      <h2>Dashboard Overview</h2>
      <p>Welcome back! Here's a summary of your activity on NG Rentals.</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginTop: '2rem' 
      }}>
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#e8f4fd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Building size={32} style={{ marginBottom: '0.5rem', color: '#0f62fe' }} />
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#0f62fe' }}>
            {stats.totalProperties}
          </h3>
          <p style={{ margin: 0, color: '#161616' }}>Total Properties</p>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#e8f4fd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <View size={32} style={{ marginBottom: '0.5rem', color: '#0f62fe' }} />
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#0f62fe' }}>
            {stats.totalViews}
          </h3>
          <p style={{ margin: 0, color: '#161616' }}>Total Views</p>
        </div>
        
        <div style={{ 
          padding: '1.5rem', 
          backgroundColor: '#e8f4fd', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Document size={32} style={{ marginBottom: '0.5rem', color: '#0f62fe' }} />
          <h3 style={{ margin: 0, fontSize: '2rem', color: '#0f62fe' }}>
            {stats.totalApplications}
          </h3>
          <p style={{ margin: 0, color: '#161616' }}>Applications</p>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <Button 
            kind="primary"
            renderIcon={Building}
            onClick={() => navigate('/post-property')}
          >
            Add New Property
          </Button>
          {/* Messages button temporarily disabled
          <Button 
            kind="secondary"
            renderIcon={Email}
            onClick={() => navigate('/dashboard/messages')}
          >
            Check Messages
          </Button>
          */}
          <Button 
            kind="tertiary"
            renderIcon={Document}
            onClick={() => navigate('/dashboard/applications')}
          >
            View Applications
          </Button>
        </div>
      </div>
    </div>
  );
};
const MyListings = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [notification, setNotification] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const propertiesPerPage = 6;

  useEffect(() => {
    if (user) {
      fetchUserProperties();
    }
  }, [currentPage, user]);

  // Show success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        kind: 'success',
        title: 'Success',
        subtitle: location.state.message
      });
      
      // Clear the message from location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchUserProperties = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startIndex = (currentPage - 1) * propertiesPerPage;
      const endIndex = startIndex + propertiesPerPage - 1;

      const { data, error, count } = await supabase
        .from('properties')
        .select(`
          *,
          property_media (*),
          property_views (count)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }

      // Process properties to include view counts
      const processedProperties = data.map(property => ({
        ...property,
        viewCount: property.property_views?.length || 0
      }));

      setProperties(processedProperties);
      setTotalProperties(count);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const handleEditProperty = (propertyId) => {
    navigate(`/dashboard/listings/edit/${propertyId}`);
  };

  const handleViewingsManagement = (propertyId) => {
    navigate(`/dashboard/listings/viewings/${propertyId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusTag = (published) => {
    return published ? (
      <Tag type="green">Published</Tag>
    ) : (
      <Tag type="red">Draft</Tag>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Loading description="Loading your properties..." />
      </div>
    );
  }

  const headers = [
    { key: 'image', header: 'Image' },
    { key: 'title', header: 'Property Title' },
    { key: 'type', header: 'Type' },
    { key: 'price', header: 'Price' },
    { key: 'views', header: 'Views' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions' }
  ];

  const tableData = properties.map((property, index) => ({
    rowId: `property-${property.id}`, // Use rowId instead of id to avoid key conflicts
    image: (
      <img 
        src={property.property_media?.[0]?.url || '/placeholder-property.jpg'} 
        alt={property.title}
        style={{ 
          width: '60px', 
          height: '40px', 
          objectFit: 'cover', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={() => handlePropertyClick(property.id)}
      />
    ),
    title: (
      <span 
        style={{ cursor: 'pointer', textDecoration: 'underline' }}
        onClick={() => handlePropertyClick(property.id)}
      >
        {property.title}
      </span>
    ),
    type: property.property_type,
    price: formatPrice(property.price),
    views: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <View size={16} />
        {property.viewCount}
      </div>
    ),
    status: getStatusTag(property.status === 'active'),
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <IconButton
          kind="ghost"
          size="sm"
          label="Edit Property"
          onClick={() => handleEditProperty(property.id)}
        >
          <Edit size={16} />
        </IconButton>
        <IconButton
          kind="ghost"
          size="sm"
          label="Manage Viewings"
          onClick={() => handleViewingsManagement(property.id)}
        >
          <Calendar size={16} />
        </IconButton>
      </div>
    )
  }));

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>My Listings</h2>
          <p>Manage your property listings and track their performance.</p>
        </div>
        <Button 
          kind="primary"
          onClick={() => navigate('/post-property')}
        >
          Add New Property
        </Button>
      </div>

      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.title}
          subtitle={notification.subtitle}
          style={{ marginBottom: '1rem' }}
          onCloseButtonClick={() => setNotification(null)}
        />
      )}

      {properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f4f4f4', borderRadius: '8px' }}>
          <Building size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Properties Listed</h3>
          <p>You haven't listed any properties yet. Start by adding your first property!</p>
          <Button 
            kind="primary"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/post-property')}
          >
            List Your First Property
          </Button>
        </div>
      ) : (
        <>
          <DataTable 
            rows={tableData} 
            headers={headers}
            render={({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader key={header.key} {...getHeaderProps({ header })}>
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          />

          {totalProperties > propertiesPerPage && (
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                page={currentPage}
                totalItems={totalProperties}
                pageSize={propertiesPerPage}
                pageSizes={[6, 12, 18]}
                onChange={({ page }) => setCurrentPage(page)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const PropertyEdit = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    deposit_ngn: '',
    property_type: 'apartment',
    bedrooms: '',
    bathrooms: '',
    furnished: false,
    city: '',
    state: '',
    area: '',
    address_text: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user && propertyId) {
      fetchProperty();
    }
  }, [user, propertyId]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', user.id) // Ensure only owner can edit
        .single();

      if (error) {
        console.error('Error fetching property:', error);
        navigate('/dashboard/listings');
        return;
      }

      setProperty(data);
      // Initialize form with property data
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        deposit_ngn: data.deposit_ngn?.toString() || '',
        property_type: data.property_type || 'apartment',
        bedrooms: data.bedrooms?.toString() || '',
        bathrooms: data.bathrooms?.toString() || '',
        furnished: data.furnished || false,
        city: data.city || '',
        state: data.state || '',
        area: data.area || '',
        address_text: data.address_text || '',
        status: data.status || 'active'
      });
    } catch (error) {
      console.error('Error fetching property:', error);
      navigate('/dashboard/listings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Property title is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (formData.bedrooms && (parseInt(formData.bedrooms) < 0 || parseInt(formData.bedrooms) > 20)) {
      newErrors.bedrooms = 'Bedrooms must be between 0 and 20';
    }

    if (formData.bathrooms && (parseInt(formData.bathrooms) < 0 || parseInt(formData.bathrooms) > 20)) {
      newErrors.bathrooms = 'Bathrooms must be between 0 and 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseInt(formData.price),
        deposit_ngn: formData.deposit_ngn ? parseInt(formData.deposit_ngn) : null,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        furnished: formData.furnished,
        city: formData.city.trim(),
        state: formData.state.trim(),
        area: formData.area.trim(),
        address_text: formData.address_text.trim(),
        status: formData.status,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating property:', error);
        setErrors({ submit: 'Failed to update property. Please try again.' });
        return;
      }

      // Success - navigate back to listings
      navigate('/dashboard/listings', { 
        state: { message: 'Property updated successfully!' } 
      });
    } catch (error) {
      console.error('Error updating property:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Loading description="Loading property..." />
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h3>Property not found</h3>
        <Button onClick={() => navigate('/dashboard/listings')}>
          Back to Listings
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Edit Property</h2>
          <p>Update your property details and settings.</p>
        </div>
        <Button 
          kind="secondary"
          onClick={() => navigate('/dashboard/listings')}
        >
          Back to Listings
        </Button>
      </div>

      <Grid fullWidth>
        <Column lg={8} md={8} sm={4}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Error display for form submission */}
            {errors.submit && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#fdf2f2', 
                  border: '1px solid #f87171',
                  borderRadius: '4px',
                  color: '#b91c1c'
                }}>
                  <strong>Error:</strong> {errors.submit}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h4 style={{ marginBottom: '1rem' }}>Basic Information</h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <TextInput
                  id="title"
                  labelText="Property Title *"
                  placeholder="e.g., Beautiful 2BR Apartment in Victoria Island"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  invalid={!!errors.title}
                  invalidText={errors.title}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <TextArea
                  id="description"
                  labelText="Description"
                  placeholder="Describe your property, amenities, and neighborhood..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <Grid style={{ marginBottom: '1rem' }}>
                <Column lg={8} md={8} sm={4}>
                  <TextInput
                    id="price"
                    labelText="Monthly Rent (NGN) *"
                    placeholder="e.g., 500000"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    invalid={!!errors.price}
                    invalidText={errors.price}
                  />
                </Column>
                <Column lg={8} md={8} sm={4}>
                  <TextInput
                    id="deposit"
                    labelText="Security Deposit (NGN)"
                    placeholder="e.g., 1000000"
                    value={formData.deposit_ngn}
                    onChange={(e) => handleInputChange('deposit_ngn', e.target.value)}
                  />
                </Column>
              </Grid>
            </div>

            {/* Property Details */}
            <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h4 style={{ marginBottom: '1rem' }}>Property Details</h4>
              
              <Grid style={{ marginBottom: '1rem' }}>
                <Column lg={8} md={8} sm={4}>
                  <Select
                    id="property_type"
                    labelText="Property Type"
                    value={formData.property_type}
                    onChange={(e) => handleInputChange('property_type', e.target.value)}
                  >
                    <SelectItem value="apartment" text="Apartment" />
                    <SelectItem value="house" text="House" />
                    <SelectItem value="shared" text="Shared Accommodation" />
                    <SelectItem value="land" text="Land" />
                  </Select>
                </Column>
                <Column lg={8} md={8} sm={4}>
                  <Select
                    id="status"
                    labelText="Status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <SelectItem value="active" text="Active" />
                    <SelectItem value="inactive" text="Inactive" />
                    <SelectItem value="pending" text="Pending Review" />
                  </Select>
                </Column>
              </Grid>

              <Grid style={{ marginBottom: '1rem' }}>
                <Column lg={8} md={8} sm={4}>
                  <TextInput
                    id="bedrooms"
                    labelText="Bedrooms"
                    placeholder="e.g., 2"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    invalid={!!errors.bedrooms}
                    invalidText={errors.bedrooms}
                  />
                </Column>
                <Column lg={8} md={8} sm={4}>
                  <TextInput
                    id="bathrooms"
                    labelText="Bathrooms"
                    placeholder="e.g., 2"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    invalid={!!errors.bathrooms}
                    invalidText={errors.bathrooms}
                  />
                </Column>
              </Grid>

              <div style={{ marginBottom: '1rem' }}>
                <Checkbox
                  id="furnished"
                  labelText="Furnished"
                  checked={formData.furnished}
                  onChange={(checked) => handleInputChange('furnished', checked)}
                />
              </div>
            </div>

            {/* Location */}
            <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h4 style={{ marginBottom: '1rem' }}>Location</h4>
              
              <Grid style={{ marginBottom: '1rem' }}>
                <Column lg={8} md={8} sm={4}>
                  <TextInput
                    id="city"
                    labelText="City *"
                    placeholder="e.g., Lagos"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    invalid={!!errors.city}
                    invalidText={errors.city}
                  />
                </Column>
                <Column lg={8} md={8} sm={4}>
                  <TextInput
                    id="state"
                    labelText="State"
                    placeholder="e.g., Lagos State"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </Column>
              </Grid>

              <div style={{ marginBottom: '1rem' }}>
                <TextInput
                  id="area"
                  labelText="Area/Neighborhood"
                  placeholder="e.g., Victoria Island, Ikoyi"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                />
              </div>

              <div>
                <TextArea
                  id="address"
                  labelText="Full Address"
                  placeholder="Complete address for the property..."
                  value={formData.address_text}
                  onChange={(e) => handleInputChange('address_text', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', padding: '1rem 0' }}>
              <Button
                kind="secondary"
                onClick={() => navigate('/dashboard/listings')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                kind="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Column>

        <Column lg={8} md={8} sm={4}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f4f4f4', borderRadius: '8px', height: 'fit-content' }}>
            <h4 style={{ marginBottom: '1rem' }}>Property Preview</h4>
            <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <h5 style={{ margin: '0 0 0.5rem 0' }}>{formData.title || 'Property Title'}</h5>
              <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem' }}>
                {formData.area && formData.city ? `${formData.area}, ${formData.city}` : formData.city || 'Location'}
              </p>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#0f62fe' }}>
                ₦{formData.price ? parseInt(formData.price).toLocaleString() : '0'}/month
              </p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                {formData.bedrooms && <span>{formData.bedrooms} bed</span>}
                {formData.bathrooms && <span>{formData.bathrooms} bath</span>}
                <span style={{ textTransform: 'capitalize' }}>{formData.property_type}</span>
                {formData.furnished && <span>Furnished</span>}
              </div>
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{formData.status}</span></p>
              {formData.deposit_ngn && (
                <p><strong>Deposit:</strong> ₦{parseInt(formData.deposit_ngn).toLocaleString()}</p>
              )}
            </div>
          </div>
        </Column>
      </Grid>
    </div>
  );
};

const PropertyViewings = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [viewings, setViewings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && propertyId) {
      fetchProperty();
      fetchViewings();
    }
  }, [user, propertyId]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching property:', error);
        navigate('/dashboard/listings');
        return;
      }

      setProperty(data);
    } catch (error) {
      console.error('Error fetching property:', error);
      navigate('/dashboard/listings');
    }
  };

  const fetchViewings = async () => {
    try {
      const { data, error } = await supabase
        .from('property_views')
        .select(`
          *,
          viewer:users!property_views_viewer_id_fkey(id, full_name, email)
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching viewings:', error);
        return;
      }

      setViewings(data || []);
    } catch (error) {
      console.error('Error fetching viewings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Loading description="Loading viewings..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Property Viewings</h2>
          <p>{property?.title} - View history and manage inquiries</p>
        </div>
        <Button 
          kind="secondary"
          onClick={() => navigate('/dashboard/listings')}
        >
          Back to Listings
        </Button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Viewing Statistics</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <Tile style={{ textAlign: 'center' }}>
            <View size={32} style={{ marginBottom: '0.5rem', color: '#0f62fe' }} />
            <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#0f62fe' }}>
              {viewings.length}
            </h4>
            <p style={{ margin: 0 }}>Total Views</p>
          </Tile>
          <Tile style={{ textAlign: 'center' }}>
            <Calendar size={32} style={{ marginBottom: '0.5rem', color: '#0f62fe' }} />
            <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#0f62fe' }}>
              {viewings.filter(v => {
                const viewDate = new Date(v.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return viewDate > weekAgo;
              }).length}
            </h4>
            <p style={{ margin: 0 }}>This Week</p>
          </Tile>
        </div>
      </div>

      <div>
        <h3>Recent Viewers</h3>
        {viewings.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            backgroundColor: '#f4f4f4', 
            borderRadius: '8px' 
          }}>
            <View size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h4>No Views Yet</h4>
            <p>Your property hasn't been viewed yet. Share the link to get more visibility!</p>
          </div>
        ) : (
          <div>
            {viewings.map(viewing => (
              <Tile key={viewing.id} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: '4px' }}>
                      {viewing.viewer?.full_name || viewing.viewer?.email || 'Anonymous'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                      Viewed on {new Date(viewing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Button kind="ghost" size="sm">
                      Contact Viewer
                    </Button>
                  </div>
                </div>
              </Tile>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Messages = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [creatingNewThread, setCreatingNewThread] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount to prevent state updates after component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchMessageThreads();
    }
  }, [user]);

  useEffect(() => {
    if (selectedThread && user && !selectedThread.isNewConversation) {
      fetchMessagesForThread(selectedThread.id);
    }
  }, [selectedThread, user]);

  // Handle incoming selectedUser from navigation
  useEffect(() => {
    if (location.state?.selectedUser && user) {
      handleNewConversationWithUser(location.state.selectedUser);
    }
  }, [location.state, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewConversationWithUser = async (selectedUser) => {
    try {
      // Check if a thread already exists with this user
      const existingThread = threads.find(thread => 
        thread.otherUser?.id === selectedUser.id
      );

      if (existingThread) {
        // Select existing thread
        setSelectedThread(existingThread);
      } else {
        // Create a new conversation state
        const newConversation = {
          id: `new-${selectedUser.id}`, // Temporary ID
          otherUser: selectedUser,
          isNewConversation: true,
          messages: []
        };
        setSelectedThread(newConversation);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error setting up conversation:', error);
    }
  };

  const fetchMessageThreads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          property:properties(*),
          property_owner:users!message_threads_property_owner_id_fkey(id, username, full_name, email, display_name),
          tenant:users!message_threads_tenant_id_fkey(id, username, full_name, email, display_name),
          messages(body, created_at, sender_id)
        `)
        .or(`property_owner_id.eq.${user.id},tenant_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching message threads:', error);
        return;
      }

      // Process threads to get the latest message for each
      const processedThreads = data.map(thread => {
        const lastMessage = thread.messages?.[0];
        const otherUser = thread.property_owner_id === user.id ? thread.tenant : thread.property_owner;
        
        return {
          ...thread,
          otherUser,
          lastMessage: lastMessage ? {
            content: lastMessage.body,
            created_at: lastMessage.created_at,
            sender_id: lastMessage.sender_id
          } : null
        };
      });

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setThreads(processedThreads);
      }
    } catch (error) {
      console.error('Error fetching message threads:', error);
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchMessagesForThread = async (threadId) => {
    if (!user || !threadId || threadId.startsWith('new-')) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, full_name, email, display_name)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !user) return;

    const messageText = newMessage.trim();
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      body: messageText,
      created_at: new Date().toISOString(),
      sending: true
    };

    // Immediately show the message in UI and clear input (optimistic update)
    if (isMountedRef.current) {
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
    }

    try {
      let threadId = selectedThread.id;

      // If this is a new conversation, create the thread first
      if (selectedThread.isNewConversation) {
        const { data: newThread, error: threadError } = await supabase
          .from('message_threads')
          .insert([{
            property_id: null, // For direct messages, no property involved
            property_owner_id: user.id,
            tenant_id: selectedThread.otherUser.id
          }])
          .select()
          .single();

        if (threadError) {
          console.error('Error creating thread:', threadError);
          console.error('Thread error details:', {
            message: threadError.message,
            details: threadError.details,
            hint: threadError.hint,
            code: threadError.code
          });
          // Remove the temporary message on error
          if (isMountedRef.current) {
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            setNewMessage(messageText); // Restore the message text
          }
          return;
        }

        threadId = newThread.id;
        
        // Update the selected thread with the real ID
        if (isMountedRef.current) {
          setSelectedThread(prev => ({
            ...prev,
            id: threadId,
            isNewConversation: false
          }));
        }
      }

      const { data: sentMessage, error } = await supabase
        .from('messages')
        .insert([{
          thread_id: threadId,
          sender_id: user.id,
          body: messageText
        }])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        console.error('Message error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // Remove the temporary message and restore input on error
        if (isMountedRef.current) {
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
          setNewMessage(messageText);
        }
        return;
      }

      // Replace temporary message with real message
      if (isMountedRef.current) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...sentMessage, sending: false }
              : msg
          )
        );

        // Refresh threads to update the sidebar
        fetchMessageThreads();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temporary message and restore input on error
      if (isMountedRef.current) {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setNewMessage(messageText);
      }
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Loading description="Loading messages..." />
      </div>
    );
  }

  return (
    <div>
      <h2>Messages</h2>
      <div style={{ display: 'flex', height: '600px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        {/* Message Threads List */}
        <div style={{ 
          width: '300px', 
          borderRight: '1px solid #e0e0e0', 
          padding: '1rem',
          overflowY: 'auto'
        }}>
          <h4 style={{ marginBottom: '1rem' }}>Conversations</h4>
          {threads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <p>No conversations yet</p>
              <p style={{ fontSize: '0.875rem' }}>Message threads will appear here when you communicate about properties.</p>
            </div>
          ) : (
            threads.map(thread => (
              <Tile
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                style={{
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                  backgroundColor: selectedThread?.id === thread.id ? '#e8f4fd' : undefined,
                  border: selectedThread?.id === thread.id ? '1px solid #0f62fe' : undefined
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {thread.otherUser?.full_name || `@${thread.otherUser?.username}` || thread.otherUser?.display_name || thread.otherUser?.email}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '4px' }}>
                  @{thread.otherUser?.username} • {thread.property?.title}
                </div>
                {thread.lastMessage && (
                  <>
                    <div style={{ fontSize: '0.875rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {thread.lastMessage.content}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                      {formatMessageTime(thread.lastMessage.created_at)}
                    </div>
                  </>
                )}
              </Tile>
            ))
          )}
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div style={{ 
                padding: '1rem', 
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f9f9f9'
              }}>
                <h4 style={{ margin: 0, marginBottom: '4px' }}>
                  {selectedThread.otherUser?.full_name || `@${selectedThread.otherUser?.username}` || selectedThread.otherUser?.display_name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                  {selectedThread.isNewConversation 
                    ? `New conversation with @${selectedThread.otherUser?.username}`
                    : selectedThread.property?.title 
                      ? `About: ${selectedThread.property?.title}`
                      : 'Direct message'
                  }
                </p>
              </div>

              {/* Messages List */}
              <div style={{ 
                flex: 1, 
                padding: '1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {messages.map(message => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.sender_id === user.id ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        backgroundColor: message.sender_id === user.id ? '#0f62fe' : '#e0e0e0',
                        color: message.sender_id === user.id ? 'white' : 'black',
                        opacity: message.sending ? 0.7 : 1
                      }}
                    >
                      <div>{message.body}</div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        marginTop: '4px',
                        opacity: 0.8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{formatMessageTime(message.created_at)}</span>
                        {message.sending && (
                          <span style={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                            Sending...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{ 
                padding: '1rem', 
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666'
            }}>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Applications = () => (
  <div>
    <h2>Applications</h2>
    <p>View and manage rental applications.</p>
    <div style={{ 
      textAlign: 'center', 
      padding: '3rem', 
      backgroundColor: '#f4f4f4', 
      borderRadius: '8px',
      marginTop: '2rem'
    }}>
      <Document size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
      <h3>Applications Management</h3>
      <p>Application management functionality will be implemented here.</p>
      <p>Users will be able to view and respond to rental applications.</p>
    </div>
  </div>
);

const Invoices = () => (
  <div>
    <h2>Invoices</h2>
    <p>View and manage your invoices and payments.</p>
    <div style={{ 
      textAlign: 'center', 
      padding: '3rem', 
      backgroundColor: '#f4f4f4', 
      borderRadius: '8px',
      marginTop: '2rem'
    }}>
      <Receipt size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
      <h3>Invoice Management</h3>
      <p>Invoice and payment functionality will be implemented here.</p>
      <p>Users will be able to track payments and generate invoices.</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [userSearchModalOpen, setUserSearchModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleStartConversation = (selectedUser) => {
    // Close the search modal
    setUserSearchModalOpen(false);
    // Navigate to messages with the selected user
    navigate('/dashboard/messages', { state: { selectedUser } });
  };

  return (
    <div style={{ paddingTop: '3rem' }}> {/* Add top padding to account for fixed header */}
      <Grid className="dashboard" fullWidth>
        <Column lg={3} md={2} sm={4} style={{ position: 'relative' }}>
          <SideNav 
            aria-label="Dashboard navigation"
            expanded={true}
            isFixedNav={false}
            isChildOfHeader={true}
            style={{ 
              position: 'sticky',
              top: '3rem', // Start below the header
              height: 'calc(100vh - 3rem)', // Adjust height to account for header
              zIndex: 1
            }}
          >
            <SideNavItems>
              <SideNavLink 
                renderIcon={DashboardIcon}
                href="/dashboard"
              >
                Overview
              </SideNavLink>
              <SideNavLink 
                renderIcon={Building}
                href="/dashboard/listings"
              >
                My Listings
              </SideNavLink>
              <SideNavLink 
                renderIcon={Document}
                href="/dashboard/applications"
              >
                Applications
              </SideNavLink>
              {/* Messages temporarily disabled
              <SideNavLink 
                renderIcon={Email}
                href="/dashboard/messages"
              >
                Messages
              </SideNavLink>
              */}
              <SideNavLink 
                renderIcon={Receipt}
                href="/dashboard/invoices"
              >
                Invoices
              </SideNavLink>
              {/* User Search temporarily disabled
              <div style={{ padding: '1rem', borderTop: '1px solid #e0e0e0', marginTop: '1rem' }}>
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={UserFollow}
                  onClick={() => setUserSearchModalOpen(true)}
                  style={{ width: '100%' }}
                >
                  Find Users
                </Button>
              </div>
              */}
            </SideNavItems>
          </SideNav>
        </Column>

        <Column lg={13} md={6} sm={4}>
          <div className="dashboard-content" style={{ padding: '2rem' }}>
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/listings" element={<MyListings />} />
              <Route path="/listings/edit/:propertyId" element={<PropertyEdit />} />
              <Route path="/listings/viewings/:propertyId" element={<PropertyViewings />} />
              <Route path="/applications" element={<Applications />} />
              {/* Messages route temporarily disabled */}
              {/* <Route path="/messages" element={<Messages />} /> */}
              <Route path="/invoices" element={<Invoices />} />
            </Routes>
          </div>
        </Column>
      </Grid>

      {/* User Search Modal */}
      <UserSearchModal 
        isOpen={userSearchModalOpen} 
        onClose={() => setUserSearchModalOpen(false)} 
        onStartConversation={handleStartConversation}
      />
    </div>
  );
};

export default Dashboard;
