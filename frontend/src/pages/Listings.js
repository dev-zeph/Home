import React, { useState } from 'react';
import { 
  Grid, 
  Column, 
  Search,
  Select,
  SelectItem,
  NumberInput,
  Button,
  Tile,
  Tag
} from '@carbon/react';
import { Location, Currency } from '@carbon/icons-react';

const Listings = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    beds: '',
    baths: ''
  });

  // Mock data - will be replaced with API calls
  const mockListings = [
    {
      id: 1,
      title: "Modern 3BR Apartment in Victoria Island",
      price: 2500000,
      location: "Victoria Island, Lagos",
      beds: 3,
      baths: 2,
      type: "apartment",
      verified: true,
      images: ["/api/placeholder/400/300"]
    },
    {
      id: 2,
      title: "Luxury 4BR House in Lekki",
      price: 5000000,
      location: "Lekki, Lagos",
      beds: 4,
      baths: 3,
      type: "house",
      verified: true,
      images: ["/api/placeholder/400/300"]
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Grid className="listings-page" fullWidth>
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

          <Button kind="primary" style={{ marginTop: '1rem', width: '100%' }}>
            Apply Filters
          </Button>
        </div>
      </Column>

      {/* Listings Results */}
      <Column lg={12} md={8} sm={4}>
        <div className="listings-results">
          <h2>Properties for Rent</h2>
          <p>{mockListings.length} properties found</p>
          
          <div className="listings-grid">
            {mockListings.map((listing) => (
              <Tile 
                key={listing.id} 
                className="listing-card"
                onClick={() => window.location.href = `/listings/${listing.id}`}
              >
                <div className="listing-image">
                  <img src={listing.images[0]} alt={listing.title} />
                  {listing.verified && (
                    <Tag type="green" className="verified-badge">
                      Verified
                    </Tag>
                  )}
                </div>
                
                <div className="listing-content">
                  <h4>{listing.title}</h4>
                  <p className="listing-price">
                    <Currency size={16} />
                    {formatPrice(listing.price)}/year
                  </p>
                  <p className="listing-location">
                    <Location size={16} />
                    {listing.location}
                  </p>
                  <div className="listing-details">
                    <span>{listing.beds} beds</span>
                    <span>{listing.baths} baths</span>
                    <span>{listing.type}</span>
                  </div>
                </div>
              </Tile>
            ))}
          </div>
        </div>
      </Column>
    </Grid>
  );
};

export default Listings;
