import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RomsProvider, useRoms } from './context/RomsContext';
import AppLayout from './components/layout/AppLayout';
import ToastBanner from './components/common/ToastBanner';
import LoginPage from './pages/LoginPage';
import TableMapPage from './pages/TableMapPage';
import MenuOrderPage from './pages/MenuOrderPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import PaymentPage from './pages/PaymentPage';
import ProfilePage from './pages/ProfilePage';
import KitchenPage from './pages/KitchenPage';
import CashierPage from './pages/CashierPage';

function RoleProtectedRoute({ allowedRole, children }) {
  const { currentUser } = useRoms();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRole && currentUser.role !== allowedRole) {
    if (currentUser.role === 'KITCHEN') {
      return <Navigate to="/kitchen" replace />;
    }
    if (currentUser.role === 'CASHIER') {
      return <Navigate to="/cashier" replace />;
    }
    return <Navigate to="/tables" replace />;
  }
  return children;
}

function PublicLoginRoute({ children }) {
  const { currentUser } = useRoms();
  if (currentUser) {
    if (currentUser.role === 'KITCHEN') {
      return <Navigate to="/kitchen" replace />;
    }
    if (currentUser.role === 'CASHIER') {
      return <Navigate to="/cashier" replace />;
    }
    return <Navigate to="/tables" replace />;
  }
  return children;
}

function RoleDefaultRedirect() {
  const { currentUser } = useRoms();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'KITCHEN') {
    return <Navigate to="/kitchen" replace />;
  }
  if (currentUser.role === 'CASHIER') {
    return <Navigate to="/cashier" replace />;
  }
  return <Navigate to="/tables" replace />;
}

export default function App() {
  useEffect(() => {
    document.title = 'ROMS';
  }, []);

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
            path="/kitchen"
            element={
              <RoleProtectedRoute allowedRole="KITCHEN">
                <ToastBanner />
                <KitchenPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/cashier"
            element={
              <RoleProtectedRoute allowedRole="CASHIER">
                <ToastBanner />
                <CashierPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <RoleProtectedRoute allowedRole="WAITER">
                <AppLayout />
              </RoleProtectedRoute>
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

          <Route path="*" element={<RoleDefaultRedirect />} />
        </Routes>
      </BrowserRouter>
    </RomsProvider>
  );
}
