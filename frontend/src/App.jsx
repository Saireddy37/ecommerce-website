import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import Admin from './pages/Admin.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RequireLogin({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { token, user } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user?.role !== 'admin') {
    return (
      <p className="notice error">
        This page is for admins only. If you were just made an admin, log out and log in again.
      </p>
    );
  }
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/checkout"
            element={
              <RequireLogin>
                <Checkout />
              </RequireLogin>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireLogin>
                <Orders />
              </RequireLogin>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<p className="notice">Page not found.</p>} />
        </Routes>
      </main>
      <footer className="footer">
        <img src="/logo.png" alt="" className="footer-logo" />
        <p className="footer-name">Sri Kumudha Trends</p>
        <p className="footer-tag">Sarees for every celebration</p>
        <p className="footer-copy">© {new Date().getFullYear()} Sri Kumudha Trends</p>
      </footer>
    </>
  );
}
