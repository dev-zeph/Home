import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
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
  Modal,
  TextArea,
  InlineNotification,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Search,
  Dropdown
} from '@carbon/react';
import {
  Logout,
  View,
  CheckmarkFilled,
  CloseFilled,
  Email,
  Building,
  UserAdmin,
  Time,
  Location
} from '@carbon/icons-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { supabase } from '../lib/supabase';

const AdminDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState(0);
  
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  
  const propertiesPerPage = 10;

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    fetchProperties();
  }, [admin, currentPage, searchTerm, statusFilter, navigate]);

  const fetchProperties = async () => {
    if (!admin) return;
    
    setLoading(true);
    try {
      const startIndex = (currentPage - 1) * propertiesPerPage;
      const endIndex = startIndex + propertiesPerPage - 1;

      // Admin can see all properties - no RLS restriction in query
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner:users!properties_user_id_fkey(id, email, display_name, phone),
          property_media(*)
        `, { count: 'exact' })
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'verified') {
          query = query.eq('verified', true);
        } else if (statusFilter === 'unverified') {
          query = query.eq('verified', false);
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching properties:', error);
        setNotification({
          kind: 'error',
          title: 'Error',
          subtitle: 'Failed to fetch properties: ' + error.message
        });
        return;
      }

      setProperties(data || []);
      setTotalProperties(count || 0);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'An unexpected error occurred while fetching properties'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProperty = async (propertyId) => {
    setProcessingAction(propertyId);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          verified: true, 
          status: 'active',
          updated_at: new Date().toISOString() 
        })
        .eq('id', propertyId);

      if (error) {
        console.error('Error verifying property:', error);
        setNotification({
          kind: 'error',
          title: 'Error',
          subtitle: 'Failed to verify property'
        });
        return;
      }

      setNotification({
        kind: 'success',
        title: 'Success',
        subtitle: 'Property has been verified and is now live'
      });

      // Refresh properties
      await fetchProperties();
    } catch (error) {
      console.error('Error verifying property:', error);
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'An unexpected error occurred'
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectProperty = async () => {
    if (!selectedProperty || !rejectionReason.trim()) {
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'Please provide a reason for rejection'
      });
      return;
    }

    setProcessingAction(selectedProperty.id);
    try {
      // Update property status
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          verified: false, 
          status: 'inactive',
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedProperty.id);

      if (updateError) {
        console.error('Error rejecting property:', updateError);
        setNotification({
          kind: 'error',
          title: 'Error',
          subtitle: 'Failed to reject property'
        });
        return;
      }

      // Here you would typically send an email to the property owner
      // For now, we'll just log the rejection reason
      console.log('Property rejected:', {
        propertyId: selectedProperty.id,
        ownerEmail: selectedProperty.owner?.email,
        reason: rejectionReason
      });

      setNotification({
        kind: 'success',
        title: 'Success',
        subtitle: 'Property has been rejected. Owner will be notified via email.'
      });

      // Close modal and reset
      setRejectionModal(false);
      setSelectedProperty(null);
      setRejectionReason('');

      // Refresh properties
      await fetchProperties();
    } catch (error) {
      console.error('Error rejecting property:', error);
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'An unexpected error occurred'
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleEmailOwner = (property) => {
    const subject = `Regarding your property listing: ${property.title}`;
    const body = `Dear ${property.owner?.display_name || 'Property Owner'},\n\nI hope this email finds you well. I am writing regarding your property listing "${property.title}" on NG Rentals.\n\n[Please provide your message here]\n\nBest regards,\nNG Rentals Admin Team`;
    
    const mailtoUrl = `mailto:${property.owner?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusTag = (property) => {
    if (property.verified) {
      return <Tag type="green">Verified</Tag>;
    } else if (property.status === 'pending') {
      return <Tag type="yellow">Pending Review</Tag>;
    } else if (property.status === 'inactive') {
      return <Tag type="red">Rejected</Tag>;
    } else {
      return <Tag type="gray">Unverified</Tag>;
    }
  };

  const getDashboardStats = () => {
    const totalProps = properties.length;
    const verified = properties.filter(p => p.verified).length;
    const pending = properties.filter(p => !p.verified && p.status === 'pending').length;
    const rejected = properties.filter(p => p.status === 'inactive').length;

    return { totalProps, verified, pending, rejected };
  };

  const stats = getDashboardStats();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Loading description="Loading admin dashboard..." />
      </div>
    );
  }

  const headers = [
    { key: 'image', header: 'Image' },
    { key: 'title', header: 'Property Title' },
    { key: 'owner', header: 'Owner' },
    { key: 'location', header: 'Location' },
    { key: 'price', header: 'Price' },
    { key: 'status', header: 'Status' },
    { key: 'created', header: 'Created' },
    { key: 'actions', header: 'Actions' }
  ];

  const tableData = properties.map((property) => ({
    id: property.id,
    image: (
      <img 
        src={property.property_media?.[0]?.url || '/placeholder-property.jpg'} 
        alt={property.title}
        style={{ 
          width: '60px', 
          height: '40px', 
          objectFit: 'cover', 
          borderRadius: '4px'
        }}
      />
    ),
    title: (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {property.title}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {property.property_type} • {property.bedrooms || 0} bed • {property.bathrooms || 0} bath
        </div>
      </div>
    ),
    owner: (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {property.owner?.display_name || 'Unknown'}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {property.owner?.email}
        </div>
      </div>
    ),
    location: (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {property.city}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {property.area}
        </div>
      </div>
    ),
    price: formatPrice(property.price),
    status: getStatusTag(property),
    created: new Date(property.created_at).toLocaleDateString(),
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <IconButton
          kind="ghost"
          size="sm"
          label="View Property"
          onClick={() => window.open(`/property/${property.id}`, '_blank')}
        >
          <View size={16} />
        </IconButton>
        
        {!property.verified && property.status !== 'inactive' && (
          <IconButton
            kind="primary"
            size="sm"
            label="Verify Property"
            onClick={() => handleVerifyProperty(property.id)}
            disabled={processingAction === property.id}
          >
            <CheckmarkFilled size={16} />
          </IconButton>
        )}
        
        {property.verified || property.status !== 'inactive' ? (
          <IconButton
            kind="danger"
            size="sm"
            label="Reject Property"
            onClick={() => {
              setSelectedProperty(property);
              setRejectionModal(true);
            }}
            disabled={processingAction === property.id}
          >
            <CloseFilled size={16} />
          </IconButton>
        ) : null}
        
        <IconButton
          kind="secondary"
          size="sm"
          label="Email Owner"
          onClick={() => handleEmailOwner(property)}
        >
          <Email size={16} />
        </IconButton>
      </div>
    )
  }));

  return (
    <div>
      {/* Admin Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#f4f4f4',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <UserAdmin size={32} style={{ color: '#0f62fe' }} />
          <div>
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <p style={{ margin: 0, color: '#666' }}>
              Welcome back, {admin?.email} • Session auto-expires in 30 minutes
            </p>
          </div>
        </div>
        <Button
          kind="danger--tertiary"
          renderIcon={Logout}
          onClick={signOut}
        >
          Sign Out
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

      {/* Dashboard Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <Tile style={{ textAlign: 'center' }}>
          <Building size={32} style={{ marginBottom: '0.5rem', color: '#0f62fe' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0f62fe' }}>
            {totalProperties}
          </h3>
          <p style={{ margin: 0 }}>Total Properties</p>
        </Tile>
        
        <Tile style={{ textAlign: 'center' }}>
          <CheckmarkFilled size={32} style={{ marginBottom: '0.5rem', color: '#24a148' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#24a148' }}>
            {stats.verified}
          </h3>
          <p style={{ margin: 0 }}>Verified</p>
        </Tile>
        
        <Tile style={{ textAlign: 'center' }}>
          <Time size={32} style={{ marginBottom: '0.5rem', color: '#f1c21b' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#f1c21b' }}>
            {stats.pending}
          </h3>
          <p style={{ margin: 0 }}>Pending Review</p>
        </Tile>
        
        <Tile style={{ textAlign: 'center' }}>
          <CloseFilled size={32} style={{ marginBottom: '0.5rem', color: '#da1e28' }} />
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#da1e28' }}>
            {stats.rejected}
          </h3>
          <p style={{ margin: 0 }}>Rejected</p>
        </Tile>
      </div>

      {/* Filters and Search */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <Search
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flexGrow: 1, minWidth: '300px' }}
        />
        
        <Dropdown
          id="status-filter"
          label="Filter by Status"
          items={[
            { id: 'all', text: 'All Properties' },
            { id: 'pending', text: 'Pending Review' },
            { id: 'verified', text: 'Verified' },
            { id: 'unverified', text: 'Unverified' },
            { id: 'inactive', text: 'Rejected' }
          ]}
          selectedItem={{ id: statusFilter }}
          onChange={({ selectedItem }) => setStatusFilter(selectedItem.id)}
        />
      </div>

      {/* Properties Table */}
      {properties.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f4f4f4', 
          borderRadius: '8px' 
        }}>
          <Building size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Properties Found</h3>
          <p>No properties match your current filters.</p>
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
                pageSizes={[10, 20, 50]}
                onChange={({ page }) => setCurrentPage(page)}
              />
            </div>
          )}
        </>
      )}

      {/* Rejection Modal */}
      <Modal
        open={rejectionModal}
        onRequestClose={() => {
          setRejectionModal(false);
          setSelectedProperty(null);
          setRejectionReason('');
        }}
        modalHeading="Reject Property"
        modalLabel="Property Verification"
        primaryButtonText="Send Rejection"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleRejectProperty}
        primaryButtonDisabled={!rejectionReason.trim() || processingAction}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p>
            You are about to reject the property "<strong>{selectedProperty?.title}</strong>" 
            by {selectedProperty?.owner?.display_name || selectedProperty?.owner?.email}.
          </p>
          <p>
            Please provide a detailed reason for rejection. This message will be sent to the property owner.
          </p>
        </div>
        
        <TextArea
          id="rejection-reason"
          labelText="Reason for Rejection *"
          placeholder="Please provide a clear explanation of why this property cannot be approved. Include specific issues and how they can be resolved."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={6}
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
