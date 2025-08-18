import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Header, 
  HeaderName, 
  HeaderNavigation, 
  HeaderMenuItem,
  Content,
  Theme
} from '@carbon/react';
import './App.css';

// Import pages (we'll create these)
import Home from './pages/Home';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Theme theme="white">
        <Router>
          <div className="App">
            <Header aria-label="NG Rentals">
              <HeaderName href="/" prefix="">
                NG Rentals
              </HeaderName>
              <HeaderNavigation aria-label="Main Navigation">
                <HeaderMenuItem href="/listings">
                  Search Properties
                </HeaderMenuItem>
                <HeaderMenuItem href="/dashboard">
                  Dashboard
                </HeaderMenuItem>
              </HeaderNavigation>
            </Header>
            
            <Content>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/listings/:id" element={<ListingDetail />} />
                <Route path="/dashboard/*" element={<Dashboard />} />
              </Routes>
            </Content>
          </div>
        </Router>
      </Theme>
    </QueryClientProvider>
  );
}

export default App;
