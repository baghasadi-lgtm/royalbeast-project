import { useNavigate } from 'react-router-dom';
import './Header.css'; // Import CSS

export default function Header({ showBackButton = false, showCartButton = true }) {
  const navigate = useNavigate();

  return (
    <header className="header">
      {/* Tombol Back */}
      {showBackButton ? (
        <button 
          onClick={() => navigate(-1)} 
          className="header__back-button"
        >
          ⬅️
        </button>
      ) : (
        <div className="header__empty-space"></div>
      )}

      {/* Logo */}
      <h1 className="header__logo">ROYAL BEAST</h1>

      {/* Tombol Keranjang */}
      {showCartButton ? (
        <div className="header__cart">🛒</div>
      ) : (
        <div className="header__empty-space"></div>
      )}
    </header>
  );
}
