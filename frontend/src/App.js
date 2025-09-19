import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Grid,
  Column,
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  Content,
  Theme,
  Button,
  Loading
} from '@carbon/react';
import { User, Logout } from '@carbon/icons-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import './App.css';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PostProperty from './pages/PostProperty';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import Lagos from './pages/Lagos';
import Abuja from './pages/Abuja';
import Calabar from './pages/Calabar';
import PortHarcourt from './pages/PortHarcourt';
import Kano from './pages/Kano';
import Ibadan from './pages/Ibadan';

// Import admin pages
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import AdminDashboard from './pages/AdminDashboard';

// Create a client for React Query
const queryClient = new QueryClient();

// Wrapper component to handle loading state
const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Loading description="Loading NG Rentals..." />
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <Content>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/post-property" element={<PostProperty />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/property/:id" element={<ListingDetail />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/cities/lagos" element={<Lagos />} />
          <Route path="/cities/abuja" element={<Abuja />} />
          <Route path="/cities/calabar" element={<Calabar />} />
          <Route path="/cities/port-harcourt" element={<PortHarcourt />} />
          <Route path="/cities/kano" element={<Kano />} />
          <Route path="/cities/ibadan" element={<Ibadan />} />
        </Routes>
      </Content>
    </>
  );
};

const AppHeader = () => {
  const { signOut, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Don't render header while loading
  if (loading) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/'); // Redirect to homepage after logout
  };

  const handleSearchPropertiesClick = () => {
    // If we're not on the homepage, navigate there first
    if (window.location.pathname !== '/') {
      navigate('/', { state: { scrollToSearch: true } });
    } else {
      // If we're already on homepage, just scroll
      scrollToSearch();
    }
  };

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
          Home.NG
        </HeaderName>
        <HeaderNavigation aria-label="Main Navigation">
          <HeaderMenuItem as={Link} to="/">
            Home
          </HeaderMenuItem>
          <HeaderMenuItem onClick={handleSearchPropertiesClick} style={{cursor: 'pointer'}}>
            Search Properties
          </HeaderMenuItem>
          {isAuthenticated && (
            <>
              <HeaderMenuItem as={Link} to="/dashboard">
                Dashboard
              </HeaderMenuItem>
              <HeaderMenuItem as={Link} to="/post-property">
                Post Property
              </HeaderMenuItem>
            </>
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
                onClick={handleSignOut}
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
              <Routes>
                {/* Admin routes - wrapped with AdminAuthProvider only */}
                <Route path="/admin/*" element={
                  <AdminAuthProvider>
                    <Routes>
                      <Route path="/login" element={<AdminLogin />} />
                      <Route path="/signup" element={<AdminSignup />} />
                      <Route path="/dashboard" element={<AdminDashboard />} />
                    </Routes>
                  </AdminAuthProvider>
                } />
                
                {/* Main app routes with header and loading handling */}
                <Route path="/*" element={<AppContent />} />
              </Routes>
            </div>
          </Router>
        </Theme>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
