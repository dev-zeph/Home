import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Column, 
  Button,
  Layer,
  Search,
  Select,
  SelectItem,
  NumberInput,
  Tile,
  Tag,
  Loading
} from '@carbon/react';
import { Search as SearchIcon, ArrowRight, Location, Currency } from '@carbon/icons-react';
import { propertyService } from '../services/propertyService';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
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
      ...(searchQuery && { city: searchQuery })
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

  const scrollToSearch = () => {
    document.getElementById('search-section').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };
  return (
    <Layer>
      <Grid className="landing-page" fullWidth>
        <Column lg={16} md={8} sm={4} className="landing-page__banner">
          <Button 
            kind="tertiary" 
            renderIcon={ArrowRight}
            onClick={scrollToSearch}
            className="search-properties-btn"
          >
            Search Properties
          </Button>
        </Column>
        
        <Column lg={16} md={8} sm={4} className="landing-page__features">
          <div className="feature-grid">
            <div className="feature-card">
              <SearchIcon size={32} />
              <h3>Smart Search</h3>
              <p>Filter by location, price, amenities and view properties on interactive maps with Plus Codes.</p>
            </div>
            <div className="feature-card">
              <h3>Virtual Tours</h3>
              <p>Experience properties through immersive Kuula virtual tours before scheduling visits.</p>
            </div>
            <div className="feature-card">
              <h3>Verified Listings</h3>
              <p>All properties undergo admin review with verified badges for trusted listings.</p>
            </div>
          </div>
        </Column>


        {/* Search Properties Section */}
        <Column lg={16} md={8} sm={4} id="search-section" className="search-properties-section">
          <h2>Find Your Perfect Property</h2>
          
          <Grid className="search-content" fullWidth>
            {/* Search and Filters */}
            <Column lg={4} md={8} sm={4} className="filters-column">
              <div className="filters-panel">
                <h3>Search & Filter</h3>
                
                <Search
                  placeholder="Search by location, property name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ marginBottom: '1rem' }}
                />

                <Select
                  id="city-select"
                  labelText="City"
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                >
                  <SelectItem value="" text="All Cities" />
                  <SelectItem value="lagos" text="Lagos" />
                  <SelectItem value="abuja" text="Abuja" />
                  <SelectItem value="ibadan" text="Ibadan" />
                  <SelectItem value="kano" text="Kano" />
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
                  <Loading description="Loading properties..." />
                ) : (
                  <>
                    <p>{properties.length} properties found</p>
                    
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
                              {property.city}, {property.state}
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
                          <p>No properties found. Try adjusting your search criteria.</p>
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
    </Layer>
  );
};

export default Home;
