import React, { useState, useEffect } from 'react';
import { Loading } from '@carbon/react';

const GoogleMapsLoader = ({ children, apiKey }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Check if API key is provided
    if (!apiKey || apiKey === 'undefined') {
      setLoadError('Google Maps API key not found.');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Simple check - try to load Google Maps
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    // If not loaded, load it
    if (!checkGoogleMaps()) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Give it a moment to fully initialize
        setTimeout(() => {
          if (checkGoogleMaps()) {
            setIsLoaded(true);
          } else {
            setLoadError('Google Maps failed to initialize properly');
          }
        }, 100);
      };

      script.onerror = () => {
        setLoadError('Failed to load Google Maps API. Please check your API key and internet connection.');
      };

      document.head.appendChild(script);
    }
  }, [apiKey]);

  if (loadError) {
    return (
      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        marginBottom: '1rem'
      }}>
        <p style={{ margin: 0, color: '#856404' }}>
          ⚠️ {loadError}
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#856404' }}>
          Address autocomplete will fall back to regular text input.
        </p>
        {children}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <Loading small />
          <span>Loading Google Maps for address suggestions...</span>
        </div>
        {children}
      </div>
    );
  }

  return children;
};

export default GoogleMapsLoader;
