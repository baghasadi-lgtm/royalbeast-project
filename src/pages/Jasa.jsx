import Header from '../components/Header';
import ServiceCard from '../components/ServiceCard';
import './Jasa.css';

export default function Jasa() {
  // Data dummy services (bisa diganti dengan data dari API)
  const services = [
    { id: 1, name: "Haircut", image: "✂️" },
    { id: 2, name: "Perming", image: "🌀" },
    { id: 3, name: "Smoothing", image: "💇‍♂️" },
    { id: 4, name: "Coloring", image: "🎨" },
    { id: 5, name: "Beard Trim", image: "🧔" },
    { id: 6, name: "Hair Spa", image: "💆‍♂️" },
  ];

  return (
    <div className="jasa-container">
      <Header showBackButton={true} />
      
      <h1 className="jasa-title">PILIH SERVICE YANG LO PENGEN</h1>
      
      <div className="jasa-grid">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            image={service.image}
            name={service.name}
          />
        ))}
      </div>
    </div>
  );
}