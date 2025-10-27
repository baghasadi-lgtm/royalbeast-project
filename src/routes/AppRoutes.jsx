

import { Routes, Route } from "react-router-dom"; // BrowserRouter sudah tidak perlu di sini
import Home from "../pages/Home";
import Jasa from "../pages/Jasa";
import PilihKapster from "../pages/PilihKapster";
import ProfilKapster from "../pages/ProfilKapster";
import KonfirmasiPesanan from "../pages/KonfirmasiPesanan";
import PesananSelesai from "../pages/PesananSelesai";

// import halaman lain nanti

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} /> {/* Gunakan path root '/' */}
      <Route path="/jasa" element={<Jasa />} />
      <Route path="/Pilih-Kapster" element={<PilihKapster />} />
      <Route path="/profil-kapster/:id" element={<ProfilKapster />} />
      <Route path="/konfirmasi-pesanan/:kapsterId" element={<KonfirmasiPesanan />} />
      <Route path="/selesai" element={<PesananSelesai />} />
      {/* Tambah route lain nanti */}
    </Routes>
  );
}




