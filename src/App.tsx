import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import SocketManager from './lib/socket';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthPage from './components/auth/AuthPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Services from './components/Services';
import Products from './components/Products';
import WorkOrders from './components/work-orders';
import Processes from './components/Processes';
import ProcessOrderManagement from './components/ProcessOrderManagement';
import Suppliers from './components/Suppliers';
import Clients from './components/Clients';
import Settings from './components/Settings';
import DeliveryNotes from './components/delivery-notes';
import UserProfile from './components/UserProfile';
import Quotes from './components/quotes'; // NOVO: Dodana komponenta za ponude
import DeviceManagement from './components/DeviceManagement';

function MainAppContent() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/:id" element={<Inventory />} />
        <Route path="services" element={<Services />} />
        <Route path="products" element={<Products />} />
        <Route path="work-orders" element={<WorkOrders />} />
        <Route path="work-orders/:id" element={<WorkOrders />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="quotes/:id" element={<Quotes />} />
        <Route path="processes" element={<Processes />} />
        <Route path="process-management" element={<ProcessOrderManagement />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="clients" element={<Clients />} />
        <Route path="delivery-notes" element={<DeliveryNotes />} />
        <Route path="delivery-notes/:id" element={<DeliveryNotes />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="device-management" element={<DeviceManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  // Ensure Socket.IO is connected once on app mount
  useEffect(() => {
    const socketManager = SocketManager.getInstance();
    socketManager.connect();
  }, []);

  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public auth route */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected application routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainAppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
