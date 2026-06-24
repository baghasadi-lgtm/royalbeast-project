import { useNavigate } from 'react-router-dom';
import './ServiceCard.css';

export default function ServiceCard({ id, image, name }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!id) {
      console.error("Service ID tidak ada!");
      return;
    }

    navigate(`/pilih-kapster?serviceId=${encodeURIComponent(id)}`);
  };

  return (
    <div className="service-card" onClick={handleClick}>
      <div className="service-card__circle">
        <span className="service-card__image">{image}</span>
      </div>
      <p className="service-card__name">{name}</p>
    </div>
  );
}
