import React from 'react';
import { 
  Grid, 
  Column, 
  Button,
  Layer
} from '@carbon/react';
import { Search, ArrowRight } from '@carbon/icons-react';

const Home = () => {
  return (
    <Layer>
      <Grid className="landing-page" fullWidth>
        <Column lg={16} md={8} sm={4} className="landing-page__banner">
          <Button 
            kind="tertiary" 
            renderIcon={ArrowRight}
            onClick={() => window.location.href = '/listings'}
            className="search-properties-btn"
          >
            Search Properties
          </Button>
        </Column>
        
        <Column lg={16} md={8} sm={4} className="landing-page__features">
          <div className="feature-grid">
            <div className="feature-card">
              <Search size={32} />
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
      </Grid>
    </Layer>
  );
};

export default Home;
