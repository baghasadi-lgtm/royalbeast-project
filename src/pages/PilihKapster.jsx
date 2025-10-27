import Header from '../components/Header';
import KapsterCard from '../components/KapsterCard';
import './PilihKapster.css';
import { useSearchParams } from 'react-router-dom';

// Data dummy (nanti diganti dengan API)
const dummyKapsters = [
  {
    id: 1,
    foto: 'https://via.placeholder.com/150',
    nama: 'Andi',
    harga: 75000,
    status: 'available',
    antrian_sekarang: 0,
    layanan_supported: [1, 3, 5]
  },
  {
    id: 2,
    foto: 'https://via.placeholder.com/150',
    nama: 'Budi',
    harga: 80000,
    status: 'busy',
    antrian_sekarang: 2,
    layanan_supported: [2, 4, 6]
  }
];

export default function PilihKapster() {
  const [searchParams] = useSearchParams();
  const serviceId = parseInt(searchParams.get('serviceId')); // Ambil parameter

  // Filter kapster berdasarkan serviceId
  const filteredKapsters = dummyKapsters.filter(kapster => 
    kapster.layanan_supported.includes(serviceId)
  );

  return (
    <div className="pilih-kapster">
      <Header showBackButton={true} />
      
      <h1 className="pilih-kapster__judul">
        Pilih kapster favorit lo (ID: {serviceId})
      </h1>
      
      <div className="pilih-kapster__daftar">
        {filteredKapsters.length > 0 ? (
          filteredKapsters.map((kapster) => (
            <KapsterCard key={kapster.id} kapster={kapster} />
          ))
        ) : (
          <p>Tidak ada kapster yang tersedia untuk layanan ini.</p>
        )}
      </div>
    </div>
  );
}