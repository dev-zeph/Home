import React from 'react';
import { useParams } from 'react-router-dom';
import { 
  Grid, 
  Column, 
  Button,
  Tag,
  Breadcrumb,
  BreadcrumbItem
} from '@carbon/react';
import { Location, Currency, Email, Phone } from '@carbon/icons-react';

const ListingDetail = () => {
  const { id } = useParams();
  
  // Mock data - will be replaced with API call
  const mockListing = {
    id: 1,
    title: "Modern 3BR Apartment in Victoria Island",
    description: "Beautiful modern apartment with stunning views of Lagos lagoon. Features include modern kitchen, spacious living area, and access to swimming pool and gym.",
    price: 2500000,
    deposit: 5000000,
    location: "Victoria Island, Lagos",
    plusCode: "6FR5R6QP+4Q", 
    beds: 3,
    baths: 2,
    type: "apartment",
    furnished: true,
    verified: true,
    amenities: ["Swimming Pool", "Gym", "Security", "Parking", "Generator", "Wi-Fi"],
    images: [
      "/api/placeholder/800/600",
      "/api/placeholder/400/300",
      "/api/placeholder/400/300",
      "/api/placeholder/400/300"
    ],
    kuulaUrl: "https://kuula.co/share/example",
    owner: {
      name: "John Property Manager",
      email: "john@example.com",
      phone: "+234 801 234 5678"
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Grid className="listing-detail" fullWidth>
      <Column lg={16}>
        <Breadcrumb>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem href="/listings">Listings</BreadcrumbItem>
          <BreadcrumbItem href={`/listings/${id}`} isCurrentPage>
            {mockListing.title}
          </BreadcrumbItem>
        </Breadcrumb>
      </Column>

      {/* Image Gallery */}
      <Column lg={10} md={6} sm={4}>
        <div className="image-gallery">
          <div className="main-image">
            <img src={mockListing.images[0]} alt={mockListing.title} />
            {mockListing.verified && (
              <Tag type="green" className="verified-badge">
                Verified Property
              </Tag>
            )}
          </div>
          <div className="thumbnail-gallery">
            {mockListing.images.slice(1).map((image, index) => (
              <img key={index} src={image} alt={`Property ${index + 2}`} />
            ))}
          </div>
        </div>

        {/* Virtual Tour */}
        {mockListing.kuulaUrl && (
          <div className="virtual-tour">
            <h3>Virtual Tour</h3>
            <div className="tour-embed">
              <iframe
                src={mockListing.kuulaUrl}
                width="100%"
                height="400"
                frameBorder="0"
                allowFullScreen
                title="Virtual Tour"
              />
            </div>
          </div>
        )}

        {/* Property Details */}
        <div className="property-details">
          <h2>{mockListing.title}</h2>
          <p className="description">{mockListing.description}</p>
          
          <div className="amenities">
            <h4>Amenities</h4>
            <div className="amenities-tags">
              {mockListing.amenities.map((amenity, index) => (
                <Tag key={index} type="outline">
                  {amenity}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Column>

      {/* Sidebar */}
      <Column lg={6} md={2} sm={4}>
        <div className="listing-sidebar">
          <div className="price-section">
            <div className="price">
              <Currency size={20} />
              <span className="amount">{formatPrice(mockListing.price)}</span>
              <span className="period">/year</span>
            </div>
            <p className="deposit">
              Deposit: {formatPrice(mockListing.deposit)}
            </p>
          </div>

          <div className="property-info">
            <div className="info-item">
              <Location size={16} />
              <span>{mockListing.location}</span>
            </div>
            <div className="plus-code">
              <strong>Plus Code:</strong> {mockListing.plusCode}
            </div>
            <div className="property-stats">
              <span>{mockListing.beds} Bedrooms</span>
              <span>{mockListing.baths} Bathrooms</span>
              <span>{mockListing.type}</span>
              {mockListing.furnished && <span>Furnished</span>}
            </div>
          </div>

          <div className="contact-section">
            <h4>Contact Owner</h4>
            <div className="owner-info">
              <p><strong>{mockListing.owner.name}</strong></p>
              <div className="contact-methods">
                <Button 
                  kind="primary" 
                  renderIcon={Email}
                  style={{ marginBottom: '0.5rem', width: '100%' }}
                >
                  Send Message
                </Button>
                <Button 
                  kind="secondary" 
                  renderIcon={Phone}
                  style={{ width: '100%' }}
                >
                  Call Owner
                </Button>
              </div>
            </div>
          </div>

          <div className="apply-section">
            <Button 
              kind="primary" 
              size="lg"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Apply for This Property
            </Button>
          </div>

          {/* Map Placeholder */}
          <div className="map-section">
            <h4>Location</h4>
            <div className="map-placeholder">
              <p>Interactive map will be displayed here</p>
              <p>Plus Code: {mockListing.plusCode}</p>
            </div>
          </div>
        </div>
      </Column>
    </Grid>
  );
};

export default ListingDetail;
