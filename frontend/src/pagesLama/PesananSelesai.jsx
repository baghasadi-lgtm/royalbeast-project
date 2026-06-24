import { useLocation, useNavigate } from "react-router-dom";
import "./PesananSelesai.css";

export default function PesananSelesai() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    service,
    kapster,
    price,
    paymentMethod,
    queueNumber,
    currentQueue,
  } = location.state || {};

  if (!service) {
    // Kalau user masuk langsung ke /selesai tanpa state, redirect balik
    navigate("/");
    return null;
  }

  const estimate =
    parseInt(queueNumber?.slice(1)) - parseInt(currentQueue?.slice(1));

  return (
    <div className="selesai-container">
      <h1 className="selesai-logo">ROYAL BEAST</h1>

      <div className="selesai-box">
        <h2 className="selesai-title">✅ Terimakasih atas pesanan anda!</h2>

        <p className="selesai-text">
          Nomor Antrian Anda: <strong>{queueNumber}</strong>
        </p>
        <p className="selesai-text">
          Nomor Antrian Saat Ini: <strong>{currentQueue}</strong>
        </p>
        <p className="selesai-text">
          Estimasi tunggu: {estimate} pelanggan
        </p>

        <div className="selesai-payment">
          {paymentMethod === "qris" ? (
            <>
              <h3>Metode Pembayaran: QRIS</h3>
              <div className="selesai-qris">
                <img src="/qris-sample.png" alt="QRIS Code" />
              </div>
              <p>Silakan scan QRIS dan bayar. kapster akan konfirmasi dan jangan lupa tunjukan bukti pembayaran ke kapster.</p>
            </>
          ) : (
            <>
              <h3>Metode Pembayaran: Tunai</h3>
              <p>Silakan bayar langsung ke kapster yang bersangkutan.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
