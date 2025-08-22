import React, { useRef, useEffect } from 'react';
import { TextInput } from '@carbon/react';

const GooglePlacesAutocomplete = ({ 
  value, 
  onChange, 
  onPlaceSelect,
  labelText = "Address",
  placeholder = "Start typing your address...",
  id = "address-autocomplete",
  ...props 
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Check if Google Maps API is loaded
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps API not loaded');
      return;
    }

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'ng' }, // Restrict to Nigeria
        fields: [
          'formatted_address',
          'address_components',
          'geometry',
          'place_id',
          'name'
        ]
      }
    );

    // Add place changed listener
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (!place.geometry) {
        console.log("No details available for input: '" + place.name + "'");
        return;
      }

      // Extract address components
      const addressComponents = place.address_components || [];
      const extractComponent = (types) => {
        const component = addressComponents.find(comp => 
          types.some(type => comp.types.includes(type))
        );
        return component ? component.long_name : '';
      };

      const addressData = {
        formatted_address: place.formatted_address,
        street_number: extractComponent(['street_number']),
        route: extractComponent(['route']),
        locality: extractComponent(['locality', 'sublocality']),
        city: extractComponent(['administrative_area_level_2', 'locality']),
        state: extractComponent(['administrative_area_level_1']),
        country: extractComponent(['country']),
        postal_code: extractComponent(['postal_code']),
        place_id: place.place_id,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };

      // Update the input value
      if (inputRef.current) {
        inputRef.current.value = place.formatted_address;
      }

      // Call the callbacks
      onChange && onChange({ target: { value: place.formatted_address } });
      onPlaceSelect && onPlaceSelect(addressData);
    });

    // Cleanup
    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [onChange, onPlaceSelect]);

  return (
    <div style={{ position: 'relative' }}>
      <TextInput
        ref={inputRef}
        id={id}
        labelText={labelText}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          // Allow manual typing
          onChange && onChange(e);
        }}
        autoComplete="off"
        {...props}
      />
      <div style={{ 
        fontSize: '12px', 
        color: '#6f6f6f', 
        marginTop: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>📍</span>
        <span>Powered by Google Places - Start typing for suggestions</span>
      </div>
    </div>
  );
};

export default GooglePlacesAutocomplete;
