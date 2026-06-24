import { useNavigate } from "react-router-dom";
import "./KapsterCard.css";

export default function KapsterCard({ kapster }) {
  const navigate = useNavigate();

  return (
    <div className="kapster-card">
      <img
        src={kapster.avatar_url || "https://via.placeholder.com/150"}
        alt={kapster.name}
        className="kapster-card__foto"
      />

      <h3 className="kapster-card__nama">{kapster.name}</h3>

      {/* Harga dari kapster_service_prices */}
      <p className="kapster-card__harga">
        Rp {kapster.price?.toLocaleString() || "-"}
      </p>

      {/* Status (sementara dummy karena belum ada kolom status di DB) */}
      <div className="kapster-card__status">
        <span className="available">✨ Tersedia</span>
      </div>

      {/* Tombol pilih */}
      <button
        className="kapster-card__button"
        onClick={() => navigate(`/konfirmasi-pesanan/${kapster.id}`)}
      >
        Pilih Kapster
      </button>

      <button
        className="kapster-card__link"
        onClick={() => navigate(`/profil-kapster/${kapster.id}`)}
      >
        Lihat Profil & Portofolio
      </button>
    </div>
  );
}
