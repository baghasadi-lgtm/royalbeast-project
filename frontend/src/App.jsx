import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/Services/ServicesPage';
import { KapstersPage } from './pages/Kapster/KapstersPage';
import { KapsterProfilePage } from './pages/Kapster/KapsterProfilePage';
import { KapsterLayout } from './components/KapsterLayout';
import { KapsterHomePage } from './pages/Kapster/KapsterHomePage';
import { KapsterServicesPage } from './pages/Kapster/KapsterServicesPage';
import { ProductsPage } from './pages/Product/ProductsPage';
import { CartPage } from './pages/Cart/CartPage';
import { CheckoutPage } from './pages/Checkout/CheckoutPage';
import { SuccessPage } from './pages/SuccessPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { AdminPage } from './pages/Admin/AdminPage';
import { FinancePage } from './pages/Admin/FinancePage';
import { ManageOrdersPage } from './pages/Order/ManageOrdersPage';
import { OrdersHistoryPage } from './pages/Order/OrdersHistoryPage';
import { EditKapsterProfilePage } from './pages/Kapster/EditKapsterProfilePage';
import { QueueTrackPage } from './pages/Queue/QueueTrackPage';

const App = () => (
  <AuthProvider>
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-surface">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/antrian" element={<QueueTrackPage />} />
            <Route path="/antrian/:queueNumber" element={<QueueTrackPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/kapsters" element={<KapstersPage />} />
            <Route path="/kapster/:id" element={<KapsterProfilePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedRoute role="owner"><AdminPage /></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute role="owner"><FinancePage /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute roles={['owner', 'staff', 'kapster']}><ManageOrdersPage /></ProtectedRoute>} />
            <Route path="/admin/orders/history" element={<ProtectedRoute roles={['owner', 'staff', 'kapster']}><OrdersHistoryPage /></ProtectedRoute>} />
            <Route path="/staff-dashboard" element={<ProtectedRoute role="staff"><KapsterLayout /></ProtectedRoute>}>
              <Route index element={<KapsterHomePage />} />
              <Route path="layanan" element={<KapsterServicesPage />} />
              <Route path="profil" element={<EditKapsterProfilePage />} />
            </Route>
            <Route path="/kapster-dashboard" element={<ProtectedRoute role="staff"><KapsterLayout /></ProtectedRoute>}>
              <Route index element={<KapsterHomePage />} />
              <Route path="layanan" element={<KapsterServicesPage />} />
              <Route path="profil" element={<EditKapsterProfilePage />} />
            </Route>
            <Route path="/kapsters/:id/edit" element={<ProtectedRoute role="staff"><EditKapsterProfilePage /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
);

export default App;
