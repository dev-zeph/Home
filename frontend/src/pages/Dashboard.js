import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Grid, 
  Column,
  SideNav,
  SideNavItems,
  SideNavLink
} from '@carbon/react';
import { 
  Dashboard as DashboardIcon, 
  Building, 
  Document, 
  Email,
  Receipt 
} from '@carbon/icons-react';

// Dashboard components (to be created)
const DashboardHome = () => (
  <div>
    <h2>Dashboard Overview</h2>
    <p>Welcome to your NG Rentals dashboard. This will show your activity summary.</p>
  </div>
);

const MyListings = () => (
  <div>
    <h2>My Listings</h2>
    <p>Manage your property listings here.</p>
  </div>
);

const Applications = () => (
  <div>
    <h2>Applications</h2>
    <p>View and manage rental applications.</p>
  </div>
);

const Messages = () => (
  <div>
    <h2>Messages</h2>
    <p>Your message threads with property owners/tenants.</p>
  </div>
);

const Invoices = () => (
  <div>
    <h2>Invoices</h2>
    <p>View and manage your invoices and payments.</p>
  </div>
);

const Dashboard = () => {
  return (
    <Grid className="dashboard" fullWidth>
      <Column lg={3} md={2} sm={4}>
        <SideNav 
          aria-label="Dashboard navigation"
          expanded={true}
          isFixedNav={false}
          isChildOfHeader={false}
        >
          <SideNavItems>
            <SideNavLink 
              renderIcon={DashboardIcon}
              href="/dashboard"
            >
              Overview
            </SideNavLink>
            <SideNavLink 
              renderIcon={Building}
              href="/dashboard/listings"
            >
              My Listings
            </SideNavLink>
            <SideNavLink 
              renderIcon={Document}
              href="/dashboard/applications"
            >
              Applications
            </SideNavLink>
            <SideNavLink 
              renderIcon={Email}
              href="/dashboard/messages"
            >
              Messages
            </SideNavLink>
            <SideNavLink 
              renderIcon={Receipt}
              href="/dashboard/invoices"
            >
              Invoices
            </SideNavLink>
          </SideNavItems>
        </SideNav>
      </Column>

      <Column lg={13} md={6} sm={4}>
        <div className="dashboard-content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/listings" element={<MyListings />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/invoices" element={<Invoices />} />
          </Routes>
        </div>
      </Column>
    </Grid>
  );
};

export default Dashboard;
