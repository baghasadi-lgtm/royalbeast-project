// src/pages/KonfirmasiPesanan.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // NEW
import Header from "../components/Header";
import "./KonfirmasiPesanan.css";

export default function KonfirmasiPesanan() {
  const navigate = useNavigate(); // NEW

  const selectedService = "Haircut";
  const selectedKapster = "Budi";
  const basePrice = 75000;

  // Add-on data
  const addonList = [
    { id: 1, name: "Hairwash", price: 10000 },
    { id: 2, name: "Facemask", price: 10000 },
  ];

  // Produk data
  const [productQty, setProductQty] = useState(1);
  const productPrice = 50000;

  // Add-on state
  const [selectedAddons, setSelectedAddons] = useState([2]);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState("tunai");

  const toggleAddon = (id) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const totalAddon = addonList
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const totalProduct = productQty * productPrice;

  const totalPrice = basePrice + totalAddon + totalProduct;

  // NEW: tombol Bayar -> kirim data ke /selesai
  const handlePay = () => {
    // Dummy antrian: misal current A15, pesanan baru A16
    const currentQueue = "A15";
    const nextNumber = parseInt(currentQueue.slice(1), 10) + 1;
    const queueNumber = `A${nextNumber}`;

    navigate("/selesai", {
      state: {
        service: selectedService,
        kapster: selectedKapster,
        basePrice,
        addons: {
          list: addonList,
          selectedIds: selectedAddons,
        },
        product: {
          name: "Pomade",
          qty: productQty,
          unitPrice: productPrice,
        },
        paymentMethod,     // "qris" | "tunai"
        queueNumber,       // contoh: "A16"
        currentQueue,      // contoh: "A15"
        totalPrice,        // total yang sudah dihitung
      },
    });
  };

  return (
    <div className="konfirmasi-container">
      <Header showBackButton={true} showCartButton={false} />

      <h1 className="konfirmasi-title">Konfirmasi Pesanan</h1>

      <div className="konfirmasi-section">
        <h3>Layanan:</h3>
        <p>{selectedService}</p>
      </div>

      <div className="konfirmasi-section">
        <h3>Kapster:</h3>
        <p>{selectedKapster}</p>
      </div>

      <div className="konfirmasi-section">
        <h3>Harga:</h3>
        <p>Rp {basePrice.toLocaleString()}</p>
      </div>

      <div className="konfirmasi-section">
        <h3>Add-on:</h3>
        {addonList.map((addon) => (
          <label key={addon.id} className="addon-item">
            <input
              type="checkbox"
              checked={selectedAddons.includes(addon.id)}
              onChange={() => toggleAddon(addon.id)}
            />
            {addon.name} (Rp {addon.price.toLocaleString()})
          </label>
        ))}
      </div>

      <div className="konfirmasi-section">
        <h3>Produk:</h3>
        <div className="produk-row">
          <span>Pomade</span>
          <div className="produk-qty">
            <button onClick={() => setProductQty((prev) => Math.max(0, prev - 1))}>-</button>
            <span>{productQty}</span>
            <button onClick={() => setProductQty((prev) => prev + 1)}>+</button>
          </div>
          <span>= Rp {totalProduct.toLocaleString()}</span>
        </div>
      </div>

      <div className="konfirmasi-section">
        <h3>Pembayaran:</h3>
        <label>
          <input
            type="radio"
            name="payment"
            value="qris"
            checked={paymentMethod === "qris"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          QRIS
        </label>
        <label>
          <input
            type="radio"
            name="payment"
            value="tunai"
            checked={paymentMethod === "tunai"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          Tunai
        </label>
      </div>

      <div className="konfirmasi-section">
        <h3>Total:</h3>
        <p className="total-harga">Rp {totalPrice.toLocaleString()}</p>
      </div>

      <button className="confirm-button" onClick={handlePay}>Bayar</button> {/* NEW */}
    </div>
  );
}
