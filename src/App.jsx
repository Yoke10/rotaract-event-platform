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
import CreateEvent from './pages/admin/CreateEvent';
import EventDashboard from './pages/admin/EventDashboard';
import EventDetails from './pages/EventDetails';
import Booking from './pages/Booking';
import BookingSuccess from './pages/BookingSuccess';
import MyTickets from './pages/MyTickets';
import QRScanner from './pages/QRScanner';

// Layout component to include Navbar
const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/scanner" element={<QRScanner />} />
            <Route path="/booking/:id" element={
              <PrivateRoute>
                <Booking />
              </PrivateRoute>
            } />
            <Route path="/booking-success" element={
              <PrivateRoute>
                <BookingSuccess />
              </PrivateRoute>
            } />

            {/* Protected User Routes */}
            <Route path="/my-tickets" element={
              <PrivateRoute>
                <MyTickets />
              </PrivateRoute>
            } />

            {/* Protected Admin Routes */}
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
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
