import { useNavigate } from 'react-router-dom';
import './KapsterCard.css';

export default function KapsterCard({ kapster }) {
  const navigate = useNavigate();

  return (
    <div className="kapster-card">
      <img 
        src={kapster.foto || 'https://via.placeholder.com/150'} 
        alt={kapster.nama} 
        className="kapster-card__foto"
      />
      
      <h3 className="kapster-card__nama">{kapster.nama}</h3>
      <p className="kapster-card__harga">Rp {kapster.harga.toLocaleString()}</p>
      
      <div className="kapster-card__status">
        {kapster.status === 'available' ? (
          <span className="available">✅ Available</span>
        ) : (
          <span className="busy">
            Antrian saat ini: {kapster.antrian_sekarang}
          </span>
        )}
      </div>

      {/* Tombol utama: pilih kapster */}
      <button 
        className="kapster-card__button"
        onClick={() => navigate(`/konfirmasi-pesanan/${kapster.id}`)}
      >
        Pilih Kapster
      </button>

      {/* Tombol tambahan: lihat profil */}
      <button 
        className= "kapster-card__link"
        onClick={() => navigate(`/profil-kapster/${kapster.id}`)}
      >
        Lihat Profil & Portofolio
      </button>
    </div>
  );
}
