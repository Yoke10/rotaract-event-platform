import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';

// Lazy-loaded public pages
const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const Booking = lazy(() => import('./pages/Booking'));
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'));
const MyTickets = lazy(() => import('./pages/MyTickets'));
const QRScanner = lazy(() => import('./pages/QRScanner'));
const ParticipantDetails = lazy(() => import('./pages/ParticipantDetails'));
const Profile = lazy(() => import('./pages/Profile'));
const HostLogin = lazy(() => import('./pages/HostLogin'));

// Lazy-loaded admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const CreateEvent = lazy(() => import('./pages/admin/CreateEvent'));
const EventDashboard = lazy(() => import('./pages/admin/EventDashboard'));
const ClubDashboard = lazy(() => import('./pages/admin/ClubDashboard'));
const CheckInDashboard = lazy(() => import('./pages/admin/CheckInDashboard'));

// Eager-loaded layout components (tiny, needed immediately)
import AdminLayout from './components/AdminLayout';
import HostLayout from './components/HostLayout';
import HostRoute from './components/HostRoute';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#680b56', borderTopColor: 'transparent' }} />
  </div>
);

// Full layout with navbar + footer
const PublicLayout = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <div className="flex-grow">
      <Outlet />
    </div>
    <Footer />
  </div>
);

// Bare layout — no navbar, no footer
const AuthLayout = () => (
  <div className="min-h-screen">
    <Outlet />
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Auth pages ── */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/host-login" element={<HostLogin />} />
            </Route>

            {/* ── Standalone Admin Login ── */}
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* ── Public pages with navbar + footer ── */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/event/:id" element={<EventDetails />} />
              <Route path="/booking/:id" element={<PrivateRoute><Booking /></PrivateRoute>} />
              <Route path="/booking-success" element={<PrivateRoute><BookingSuccess /></PrivateRoute>} />
              <Route path="/participant-details" element={<PrivateRoute><ParticipantDetails /></PrivateRoute>} />
              <Route path="/my-tickets" element={<PrivateRoute><MyTickets /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            </Route>

            {/* ── Scanner — no navbar/footer (full-screen) ── */}
            <Route path="/scanner" element={<QRScanner />} />

            {/* ── Admin Layout Routes ── */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<PrivateRoute requiredRole="admin"><AdminDashboard /></PrivateRoute>} />
              <Route path="/admin/create-event" element={<PrivateRoute requiredRole="admin"><CreateEvent /></PrivateRoute>} />
              <Route path="/admin/edit-event/:id" element={<PrivateRoute requiredRole="admin"><CreateEvent /></PrivateRoute>} />
              <Route path="/admin/scanner" element={<PrivateRoute requiredRole="admin"><QRScanner /></PrivateRoute>} />
              <Route path="/admin/event/:id" element={<PrivateRoute requiredRole="admin"><EventDashboard /></PrivateRoute>} />
              <Route path="/admin/event/:id/clubs" element={<PrivateRoute requiredRole="admin"><ClubDashboard /></PrivateRoute>} />
              <Route path="/admin/event/:id/checkin" element={<PrivateRoute requiredRole="admin"><CheckInDashboard /></PrivateRoute>} />
            </Route>

            {/* ── Host Layout Routes ── */}
            <Route element={<HostLayout />}>
              <Route path="/host/event/:id" element={<HostRoute><EventDashboard isHostMode={true} /></HostRoute>} />
              <Route path="/host/event/:id/clubs" element={<HostRoute><ClubDashboard isHostMode={true} /></HostRoute>} />
              <Route path="/host/event/:id/checkin" element={<HostRoute><CheckInDashboard isHostMode={true} /></HostRoute>} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;
