import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout (kept eager — it renders on every page)
import Layout from './components/layout/Layout';

// Public pages (lazy)
const Home = lazy(() => import('./pages/Home'));
const Menu = lazy(() => import('./pages/Menu'));
const FoodDetail = lazy(() => import('./pages/FoodDetail'));
const Categories = lazy(() => import('./pages/Categories'));
const Cart = lazy(() => import('./pages/Cart'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Auth pages (lazy)
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
const OAuthCallback = lazy(() => import('./pages/auth/OAuthCallback'));

// Protected user pages (lazy)
import ProtectedRoute from './components/ProtectedRoute';
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Checkout = lazy(() => import('./pages/Checkout'));

// Admin pages (lazy)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminFoods = lazy(() => import('./pages/admin/AdminFoods'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// Delivery pages (lazy)
const DeliveryLayout = lazy(() => import('./pages/delivery/DeliveryLayout'));
const DeliveryDashboard = lazy(() => import('./pages/delivery/DeliveryDashboard'));
const DeliveryOrders = lazy(() => import('./pages/delivery/DeliveryOrders'));
const DeliveryOrderDetail = lazy(() => import('./pages/delivery/DeliveryOrderDetail'));

// Simple centered spinner shown while a route chunk loads
function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-center" toastOptions={{
        style: { borderRadius: '14px', fontSize: '14px', fontWeight: 500, background: '#0f172a', color: '#fff' },
        success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
        error: { style: { background: '#b91c1c' } },
      }} />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public site */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/food/:slug" element={<FoodDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/cart" element={<Cart />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/checkout" element={<Checkout />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Suspense fallback={<RouteFallback />}><AdminLayout /></Suspense></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="foods" element={<AdminFoods />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Delivery */}
          <Route path="/delivery" element={<ProtectedRoute roles={['delivery', 'admin']}><Suspense fallback={<RouteFallback />}><DeliveryLayout /></Suspense></ProtectedRoute>}>
            <Route index element={<DeliveryDashboard />} />
            <Route path="orders" element={<DeliveryOrders />} />
            <Route path="orders/:id" element={<DeliveryOrderDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
