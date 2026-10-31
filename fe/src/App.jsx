import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RomsProvider, useRoms } from './context/RomsContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import TableMapPage from './pages/TableMapPage';
import MenuOrderPage from './pages/MenuOrderPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { currentUser } = useRoms();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicLoginRoute({ children }) {
  const { currentUser } = useRoms();
  if (currentUser) {
    return <Navigate to="/tables" replace />;
  }
  return children;
}

export default function App() {
  return (
    <RomsProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicLoginRoute>
                <LoginPage />
              </PublicLoginRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/tables" replace />} />
            <Route path="tables" element={<TableMapPage />} />
            <Route path="menu" element={<MenuOrderPage />} />
            <Route path="menu/:tableId" element={<MenuOrderPage />} />
            <Route path="tracking" element={<OrderTrackingPage />} />
            <Route path="payment/:tableId" element={<PaymentPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/tables" replace />} />
        </Routes>
      </BrowserRouter>
    </RomsProvider>
  );
}

