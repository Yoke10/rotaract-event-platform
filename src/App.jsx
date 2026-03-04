import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Events from './pages/Events';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/AdminLayout';
import CreateEvent from './pages/admin/CreateEvent';
import EventDashboard from './pages/admin/EventDashboard';
import ClubDashboard from './pages/admin/ClubDashboard';
import CheckInDashboard from './pages/admin/CheckInDashboard';
import EventDetails from './pages/EventDetails';
import Booking from './pages/Booking';
import BookingSuccess from './pages/BookingSuccess';
import MyTickets from './pages/MyTickets';
import QRScanner from './pages/QRScanner';
import ParticipantDetails from './pages/ParticipantDetails';
import Profile from './pages/Profile';
import HostLogin from './pages/HostLogin';
import HostLayout from './components/HostLayout';
import HostRoute from './components/HostRoute';

// Full layout with navbar + footer (all public pages)
const PublicLayout = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <div className="flex-grow">
      <Outlet />
    </div>
    <Footer />
  </div>
);

// Bare layout — no navbar, no footer (login / signup)
const AuthLayout = () => (
  <div className="min-h-screen">
    <Outlet />
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ── Auth pages — no navbar/footer ── */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/host-login" element={<HostLogin />} />
          </Route>

          {/* ── Standalone Admin Login (already bare) ── */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* ── Public pages with navbar + footer ── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="/booking/:id" element={
              <PrivateRoute><Booking /></PrivateRoute>
            } />
            <Route path="/booking-success" element={
              <PrivateRoute><BookingSuccess /></PrivateRoute>
            } />
            <Route path="/participant-details" element={
              <PrivateRoute><ParticipantDetails /></PrivateRoute>
            } />
            <Route path="/my-tickets" element={
              <PrivateRoute><MyTickets /></PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute><Profile /></PrivateRoute>
            } />
          </Route>

          {/* Admin Layout Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/create-event" element={
              <PrivateRoute requiredRole="admin">
                <CreateEvent />
              </PrivateRoute>
            } />
            <Route path="/admin/edit-event/:id" element={
              <PrivateRoute requiredRole="admin">
                <CreateEvent />
              </PrivateRoute>
            } />
            <Route path="/admin/scanner" element={
              <PrivateRoute requiredRole="admin">
                <QRScanner />
              </PrivateRoute>
            } />
            <Route path="/admin/event/:id" element={
              <PrivateRoute requiredRole="admin">
                <EventDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/event/:id/clubs" element={
              <PrivateRoute requiredRole="admin">
                <ClubDashboard />
              </PrivateRoute>
            } />
            <Route path="/admin/event/:id/checkin" element={
              <PrivateRoute requiredRole="admin">
                <CheckInDashboard />
              </PrivateRoute>
            } />
          </Route>

          {/* ── Host Layout Routes ── */}
          <Route element={<HostLayout />}>
            <Route path="/host/event/:id" element={
              <HostRoute>
                <EventDashboard isHostMode={true} />
              </HostRoute>
            } />
            <Route path="/host/event/:id/clubs" element={
              <HostRoute>
                <ClubDashboard isHostMode={true} />
              </HostRoute>
            } />
            <Route path="/host/event/:id/checkin" element={
              <HostRoute>
                <CheckInDashboard isHostMode={true} />
              </HostRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
