import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          Shopwise
        </Link>
        <nav className="nav-links">
          <Link to="/">Shop</Link>
          {user && <Link to="/orders">My orders</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          <Link to="/cart" className="cart-link">
            Cart{count > 0 && <span className="badge">{count}</span>}
          </Link>
          {user ? (
            <>
              <span className="hello">Hi, {user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-small">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
