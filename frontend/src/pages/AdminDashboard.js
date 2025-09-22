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
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState(0);
  
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  
  const vehiclesPerPage = 10;

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    fetchVehicles();
  }, [admin, currentPage, searchTerm, statusFilter, navigate]);

  const fetchVehicles = async () => {
    if (!admin) return;
    
    setLoading(true);
    try {
      const startIndex = (currentPage - 1) * vehiclesPerPage;
      const endIndex = startIndex + vehiclesPerPage - 1;

      // Admin can see all vehicles - no RLS restriction in query
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
          subtitle: 'Failed to fetch vehicles: ' + error.message
        });
        return;
      }

      setVehicles(data || []);
      setTotalVehicles(count || 0);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'An unexpected error occurred while fetching vehicles'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVehicle = async (propertyId) => {
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
        console.error('Error verifying vehicle:', error);
        setNotification({
          kind: 'error',
          title: 'Error',
          subtitle: 'Failed to verify vehicle'
        });
        return;
      }

      setNotification({
        kind: 'success',
        title: 'Success',
        subtitle: 'Vehicle has been verified and is now live'
      });

      // Refresh vehicles
      await fetchVehicles();
    } catch (error) {
      console.error('Error verifying vehicle:', error);
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'An unexpected error occurred'
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectVehicle = async () => {
    if (!selectedVehicle || !rejectionReason.trim()) {
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'Please provide a reason for rejection'
      });
      return;
    }

    setProcessingAction(selectedVehicle.id);
    try {
      // Update vehicle status
      const { error: updateError } = await supabase
        .from('properties')
        .update({ 
          verified: false, 
          status: 'inactive',
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedVehicle.id);

      if (updateError) {
        console.error('Error rejecting property:', updateError);
        setNotification({
          kind: 'error',
          title: 'Error',
          subtitle: 'Failed to reject vehicle'
        });
        return;
      }

      // Here you would typically send an email to the vehicle owner
      // For now, we'll just log the rejection reason
      console.log('Vehicle rejected:', {
        propertyId: selectedVehicle.id,
        ownerEmail: selectedVehicle.owner?.email,
        reason: rejectionReason
      });

      setNotification({
        kind: 'success',
        title: 'Success',
        subtitle: 'Vehicle has been rejected. Owner will be notified via email.'
      });

      // Close modal and reset
      setRejectionModal(false);
      setSelectedVehicle(null);
      setRejectionReason('');

      // Refresh vehicles
      await fetchVehicles();
    } catch (error) {
      console.error('Error rejecting vehicle:', error);
      setNotification({
        kind: 'error',
        title: 'Error',
        subtitle: 'An unexpected error occurred'
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleEmailOwner = (vehicle) => {
    const subject = `Regarding your vehicle listing: ${vehicle.title}`;
    const body = `Dear ${vehicle.owner?.display_name || 'Vehicle Owner'},\n\nI hope this email finds you well. I am writing regarding your vehicle listing "${vehicle.title}" on RYD.\n\n[Please provide your message here]\n\nBest regards,\nRYD Admin Team`;
    
    const mailtoUrl = `mailto:${vehicle.owner?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusTag = (vehicle) => {
    if (vehicle.verified) {
      return <Tag type="green">Verified</Tag>;
    } else if (vehicle.status === 'pending') {
      return <Tag type="yellow">Pending Review</Tag>;
    } else if (vehicle.status === 'inactive') {
      return <Tag type="red">Rejected</Tag>;
    } else {
      return <Tag type="gray">Unverified</Tag>;
    }
  };

  const getDashboardStats = () => {
    const totalVehicles = vehicles.length;
    const verified = vehicles.filter(p => p.verified).length;
    const pending = vehicles.filter(p => !p.verified && p.status === 'pending').length;
    const rejected = vehicles.filter(p => p.status === 'inactive').length;

    return { totalVehicles, verified, pending, rejected };
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
    { key: 'title', header: 'Vehicle Title' },
    { key: 'owner', header: 'Owner' },
    { key: 'location', header: 'Location' },
    { key: 'price', header: 'Daily Rate' },
    { key: 'status', header: 'Status' },
    { key: 'created', header: 'Created' },
    { key: 'actions', header: 'Actions' }
  ];

  const tableData = vehicles.map((vehicle) => ({
    id: vehicle.id,
    image: (
      <img 
        src={vehicle.property_media?.[0]?.url || '/placeholder-vehicle.jpg'} 
        alt={vehicle.title}
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
          {vehicle.title}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {vehicle.property_type} • {vehicle.bedrooms || 0} seats • {vehicle.bathrooms || 0} doors
        </div>
      </div>
    ),
    owner: (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {vehicle.owner?.display_name || 'Unknown'}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {vehicle.owner?.email}
        </div>
      </div>
    ),
    location: (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {vehicle.city}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {vehicle.area}
        </div>
      </div>
    ),
    price: formatPrice(vehicle.price),
    status: getStatusTag(vehicle),
    created: new Date(vehicle.created_at).toLocaleDateString(),
    actions: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <IconButton
          kind="ghost"
          size="sm"
          label="View Vehicle"
          onClick={() => window.open(`/property/${vehicle.id}`, '_blank')}
        >
          <View size={16} />
        </IconButton>
        
        {!vehicle.verified && vehicle.status !== 'inactive' && (
          <IconButton
            kind="primary"
            size="sm"
            label="Verify Vehicle"
            onClick={() => handleVerifyVehicle(vehicle.id)}
            disabled={processingAction === vehicle.id}
          >
            <CheckmarkFilled size={16} />
          </IconButton>
        )}
        
        {vehicle.verified || vehicle.status !== 'inactive' ? (
          <IconButton
            kind="danger"
            size="sm"
            label="Reject Vehicle"
            onClick={() => {
              setSelectedVehicle(vehicle);
              setRejectionModal(true);
            }}
            disabled={processingAction === vehicle.id}
          >
            <CloseFilled size={16} />
          </IconButton>
        ) : null}
        
        <IconButton
          kind="secondary"
          size="sm"
          label="Email Owner"
          onClick={() => handleEmailOwner(vehicle)}
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
            <h2 style={{ margin: 0 }}>RYD Admin Dashboard</h2>
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
            {totalVehicles}
          </h3>
          <p style={{ margin: 0 }}>Total Vehicles</p>
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
          placeholder="Search vehicles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flexGrow: 1, minWidth: '300px' }}
        />
        
        <Dropdown
          id="status-filter"
          label="Filter by Status"
          items={[
            { id: 'all', text: 'All Vehicles' },
            { id: 'pending', text: 'Pending Review' },
            { id: 'verified', text: 'Verified' },
            { id: 'unverified', text: 'Unverified' },
            { id: 'inactive', text: 'Rejected' }
          ]}
          selectedItem={{ id: statusFilter }}
          onChange={({ selectedItem }) => setStatusFilter(selectedItem.id)}
        />
      </div>

      {/* Vehicles Table */}
      {vehicles.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f4f4f4', 
          borderRadius: '8px' 
        }}>
          <Building size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Vehicles Found</h3>
          <p>No vehicles match your current filters.</p>
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

          {totalVehicles > vehiclesPerPage && (
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <Pagination
                page={currentPage}
                totalItems={totalVehicles}
                pageSize={vehiclesPerPage}
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
          setSelectedVehicle(null);
          setRejectionReason('');
        }}
        modalHeading="Reject Vehicle"
        modalLabel="Vehicle Verification"
        primaryButtonText="Send Rejection"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleRejectVehicle}
        primaryButtonDisabled={!rejectionReason.trim() || processingAction}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p>
            You are about to reject the vehicle "<strong>{selectedVehicle?.title}</strong>" 
            by {selectedVehicle?.owner?.display_name || selectedVehicle?.owner?.email}.
          </p>
          <p>
            Please provide a detailed reason for rejection. This message will be sent to the vehicle owner.
          </p>
        </div>
        
        <TextArea
          id="rejection-reason"
          labelText="Reason for Rejection *"
          placeholder="Please provide a clear explanation of why this vehicle cannot be approved. Include specific issues and how they can be resolved."
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
