import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Explore from './pages/Explore';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import HostManagement from './pages/admin/HostManagement';
import ListingsManagement from './pages/admin/ListingsManagement';
import BookingsManagement from './pages/admin/BookingsManagement';
import TransactionsScreen from './pages/admin/TransactionsScreen';
import AnalyticsScreen from './pages/admin/AnalyticsScreen';
import SearchFilter from './pages/SearchFilter';
import ListingDetail from './pages/ListingDetail';
import BookingScreen from './pages/BookingScreen';
import BookingSuccess from './pages/BookingSuccess';
import MyBookings from './pages/MyBookings';
import MyBookingDetail from './pages/MyBookingDetail';
import UserProfile from './pages/UserProfile';
import HostPublicProfile from './pages/HostPublicProfile';
import HowItWorks from './pages/HowItWorks';
import Visiting from './pages/Visiting';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';

import HostIntro from './pages/host/HostIntro';
import HostApply from './pages/host/HostApply';
import HostProfileSetup from './pages/host/HostProfileSetup';
import HostDashboard from './pages/host/HostDashboard';
import CreateListing from './pages/host/CreateListing';
import HostBookings from './pages/host/HostBookings';
import HostCalendar from './pages/host/HostCalendar';
import HostEarnings from './pages/host/HostEarnings';
import ConsentBanner from './components/ConsentBanner';

function App() {
  return (
    <Router>
      <ConsentBanner />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/search" element={<SearchFilter />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/book/:id" element={<BookingScreen />} />
        <Route path="/booking-success/:id" element={<BookingSuccess />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/my-bookings/:id" element={<MyBookingDetail />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/hosts/:id" element={<HostPublicProfile />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/visiting" element={<Visiting />} />
        <Route path="/communities" element={<Communities />} />
        <Route path="/communities/:id" element={<CommunityDetail />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Host Routes */}
        <Route path="/host/onboarding" element={<HostIntro />} />
        <Route path="/host/onboarding/apply" element={<HostApply />} />
        <Route path="/host/onboarding/profile" element={<HostProfileSetup />} />
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/host/create" element={<CreateListing />} />
        <Route path="/host/edit/:id" element={<CreateListing />} />
        <Route path="/host/bookings" element={<HostBookings />} />
        <Route path="/host/calendar" element={<HostCalendar />} />
        <Route path="/host/earnings" element={<HostEarnings />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/hosts" element={<HostManagement />} />
        <Route path="/admin/listings" element={<ListingsManagement />} />
        <Route path="/admin/bookings" element={<BookingsManagement />} />
        <Route path="/admin/transactions" element={<TransactionsScreen />} />
        <Route path="/admin/analytics" element={<AnalyticsScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
