import Header from "../components/Header";
import ServiceCard from "../components/ServiceCard";
import "./Jasa.css";
import { useEffect, useState } from "react";

export default function Jasa() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/services")
      .then((res) => res.json())
      .then((data) => {
        console.log("DATA DARI API:", data);
        setServices(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching services:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2 className="loading-text">Loading services...</h2>;
  }

  return (
    <div className="jasa-container">
      <Header showBackButton={true} />

      <h1 className="jasa-title">PILIH SERVICE YANG LO PENGEN</h1>

      <div className="jasa-grid">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            image="💇🏻"
            name={service.name}
          />
        ))}
      </div>
    </div>
  );
}
