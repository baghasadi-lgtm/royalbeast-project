import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CircleButton from '../components/CircleButton'; // Akan kita buat setelah ini
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home">
      <Header showBackButton={false} />

      <div className="home__welcome">
        <h1>SELAMAT DATANG DI ROYAL BEAST</h1>
      </div>

      <div className="home__buttons">
        <CircleButton 
          icon="✂️" 
          label="JASA" 
          onClick={() => navigate('/Jasa')} 
        />
        <CircleButton 
          icon="🛒" 
          label="BARANG" 
          onClick={() => console.log('Tombol Barang diklik')} 
        />
      </div>
    </div>
  );
}