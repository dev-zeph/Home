import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Grid, 
  Column, 
  Button,
  Search,
  Select,
  SelectItem,
  NumberInput,
  Tile,
  Tag,
  Loading,
  Breadcrumb,
  BreadcrumbItem
} from '@carbon/react';
import { ArrowLeft, Location, Currency } from '@carbon/icons-react';
import { propertyService } from '../services/propertyService';
import AbujaImage from '../images/Abuja.jpg';

const Abuja = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: 'abuja',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    beds: '',
    baths: ''
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch properties on component mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) {
      handleSearch();
    }
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await propertyService.getProperties(filters);
      setProperties(data || []);
    } catch (err) {
      setError('Failed to fetch properties: ' + err.message);
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const searchFilters = {
      ...filters,
      ...(searchQuery && { area: searchQuery })
    };
    
    try {
      setLoading(true);
      setError('');
      const data = await propertyService.getProperties(searchFilters);
      setProperties(data || []);
    } catch (err) {
      setError('Search failed: ' + err.message);
      console.error('Error searching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const abujaAreas = [
    'Maitama', 'Asokoro', 'Wuse 2', 'Garki', 'Guzape', 'Jahi',
    'Katampe', 'Kubwa', 'Lugbe', 'Utako', 'Wuye', 'Lokogoma'
  ];

  return (
    <div className="city-page">
      <Grid fullWidth>
        {/* Hero Section */}
        <Column lg={16} md={8} sm={4} className="city-hero" style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 98, 254, 0.3) 0%, rgba(0, 45, 156, 0.3) 100%), url(${AbujaImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="city-hero-content">
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/">Home</Link>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <Link to="/">Explore Nigeria</Link>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>Abuja</BreadcrumbItem>
            </Breadcrumb>
            
            <h1>Abuja</h1>
            
            
            <Button 
              as={Link} 
              to="/"
              kind="ghost"
              renderIcon={ArrowLeft}
            >
              Back to Home
            </Button>
          </div>
        </Column>

        {/* Search and Listings Section */}
        <Column lg={16} md={8} sm={4} className="city-listings-section">
          <Grid className="search-content" fullWidth>
            {/* Search and Filters */}
            <Column lg={4} md={8} sm={4} className="filters-column">
              <div className="filters-panel">
                <h3>Search Abuja Properties</h3>
                
                <Search
                  placeholder="Search by area, property name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ marginBottom: '1rem' }}
                />

                <Select
                  id="area-select"
                  labelText="Area"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                >
                  <SelectItem value="" text="All Areas" />
                  {abujaAreas.map(area => (
                    <SelectItem key={area} value={area.toLowerCase()} text={area} />
                  ))}
                </Select>

                <Select
                  id="type-select"
                  labelText="Property Type"
                  value={filters.propertyType}
                  onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                >
                  <SelectItem value="" text="All Types" />
                  <SelectItem value="apartment" text="Apartment" />
                  <SelectItem value="house" text="House" />
                  <SelectItem value="shared" text="Shared Space" />
                  <SelectItem value="land" text="Land" />
                </Select>

                <NumberInput
                  id="min-price"
                  label="Min Price (NGN)"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  min={0}
                  step={100000}
                />

                <NumberInput
                  id="max-price"
                  label="Max Price (NGN)"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  min={0}
                  step={100000}
                />

                <Button 
                  kind="primary" 
                  style={{ marginTop: '1rem', width: '100%' }}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Apply Filters'}
                </Button>
              </div>
            </Column>

            {/* Listings Results */}
            <Column lg={12} md={8} sm={4}>
              <div className="listings-results">
                {error && (
                  <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}
                
                {loading ? (
                  <Loading description="Loading Abuja properties..." />
                ) : (
                  <>
                    <p>{properties.length} properties found in Abuja</p>
                    
                    <div className="listings-grid">
                      {properties.map((property) => (
                        <Tile 
                          key={property.id} 
                          className="listing-card"
                          onClick={() => window.location.href = `/listings/${property.id}`}
                        >
                          <div className="listing-image">
                            <img 
                              src={property.property_media?.[0]?.url || "/api/placeholder/400/300"} 
                              alt={property.title} 
                            />
                            {property.verified && (
                              <Tag type="green" className="verified-badge">
                                Verified
                              </Tag>
                            )}
                          </div>
                          
                          <div className="listing-content">
                            <h4>{property.title}</h4>
                            <p className="listing-price">
                              <Currency size={16} />
                              {formatPrice(property.price)}/year
                            </p>
                            <p className="listing-location">
                              <Location size={16} />
                              {property.area}, Abuja
                            </p>
                            <div className="listing-details">
                              <span>{property.bedrooms} beds</span>
                              <span>{property.bathrooms} baths</span>
                              <span>{property.property_type}</span>
                            </div>
                          </div>
                        </Tile>
                      ))}
                      
                      {properties.length === 0 && !loading && (
                        <div className="no-results">
                          <p>No properties found in Abuja. Try adjusting your search criteria.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Column>
          </Grid>
        </Column>
      </Grid>
    </div>
  );
};

export default Abuja;
