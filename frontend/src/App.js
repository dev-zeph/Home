import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Header, 
  HeaderName, 
  HeaderNavigation, 
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Content,
  Theme,
  Button
} from '@carbon/react';
import { User, Logout } from '@carbon/icons-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';

// Create a client for React Query
const queryClient = new QueryClient();

const AppHeader = () => {
  const { signOut, isAuthenticated } = useAuth();

  const scrollToSearch = () => {
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <>
      <Header aria-label="NG Rentals">
        <HeaderName as={Link} to="/" prefix="">
          NG Rentals
        </HeaderName>
        <HeaderNavigation aria-label="Main Navigation">
          <HeaderMenuItem as={Link} to="/">
            Home
          </HeaderMenuItem>
          <HeaderMenuItem onClick={scrollToSearch} style={{cursor: 'pointer'}}>
            Search Properties
          </HeaderMenuItem>
          {isAuthenticated && (
            <HeaderMenuItem as={Link} to="/dashboard">
              Dashboard
            </HeaderMenuItem>
          )}
        </HeaderNavigation>
        <HeaderGlobalBar>
          {isAuthenticated ? (
            <>
              <HeaderGlobalAction 
                aria-label="User account"
                tooltipAlignment="end"
              >
                <User size={20} />
              </HeaderGlobalAction>
              <HeaderGlobalAction 
                aria-label="Sign out"
                onClick={signOut}
                tooltipAlignment="end"
              >
                <Logout size={20} />
              </HeaderGlobalAction>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                <Button
                  as={Link}
                  to="/login"
                  kind="ghost"
                  size="sm"
                >
                  Log In
                </Button>
                <Button
                  as={Link}
                  to="/signup"
                  size="sm"
                >
                  Sign Up
                </Button>
              </div>
            </>
          )}
        </HeaderGlobalBar>
      </Header>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Theme theme="white">
          <Router>
            <div className="App">
              <AppHeader />
              
              <Content>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/listings" element={<Listings />} />
                  <Route path="/listings/:id" element={<ListingDetail />} />
                  <Route path="/dashboard/*" element={<Dashboard />} />
                </Routes>
              </Content>
            </div>
          </Router>
        </Theme>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
