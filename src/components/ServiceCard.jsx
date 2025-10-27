import { useNavigate } from 'react-router-dom';
import './ServiceCard.css';

export default function ServiceCard({ id, image, name }) {
  const navigate = useNavigate();

  return (
    <div 
      className="service-card"
      onClick={() => navigate(`/pilih-kapster?serviceId=${id}`)} // Navigasi ke detail service
    >
      <div className="service-card__circle">
        <span className="service-card__image">{image}</span>
      </div>
      <p className="service-card__name">{name}</p>
    </div>
  );
}