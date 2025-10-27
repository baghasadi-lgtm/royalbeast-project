import Header from '../components/Header';
import './ProfilKapster.css';
import { useParams } from 'react-router-dom';

export default function ProfilKapster() {
  const { id } = useParams(); // Ambil ID dari URL

  // Data dummy kapster dan portofolio (bisa diganti dari backend)
  const kapster = {
    id,
    nama: 'Andi Barber',
    umur: 28,
    ig: 'andibarber',
    tiktok: 'andi_trims',
    foto: 'https://via.placeholder.com/150',
    portofolio: [
      { id: 1, type: 'image', url: 'https://via.placeholder.com/300x200' },
      { id: 2, type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 3, type: 'image', url: 'https://via.placeholder.com/300x200' },
      { id: 4, type: 'video', url: 'https://www.w3schools.com/html/movie.mp4' },
    ]
  };

  return (
    <div className="profil-kapster">
      <Header showBackButton={true} />
      <h1 className="profil-kapster__judul">Profil & Portofolio Kapster</h1>

      <div className="profil-kapster__info">
        <img src={kapster.foto} alt={kapster.nama} className="profil-kapster__foto" />
        <div className="profil-kapster__detail">
          <p><strong>Nama:</strong> {kapster.nama}</p>
          <p><strong>Umur:</strong> {kapster.umur} tahun</p>
          <p><strong>Instagram:</strong> @{kapster.ig}</p>
          <p><strong>TikTok:</strong> @{kapster.tiktok}</p>
        </div>
      </div>

      <h2 className="profil-kapster__subjudul">Portofolio</h2>
      <div className="profil-kapster__portofolio">
        {kapster.portofolio.map((item) => (
          <div key={item.id} className="portfolio-item">
            {item.type === 'image' ? (
              <img src={item.url} alt="Portofolio" className="portfolio-image" />
            ) : (
              <video src={item.url} controls className="portfolio-video" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
