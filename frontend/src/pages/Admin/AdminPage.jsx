import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { formatPrice, PRODUCT_CATEGORIES, assetUrl, businessToday } from '../../utils/format';
import { Loading } from '../../components/Loading';
import { ChangePasswordForm } from '../../components/ChangePasswordForm';
import { NotificationToggle } from '../../components/NotificationToggle';
import { QrisSettings } from '../../components/QrisSettings';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pengaturan', label: 'Pengaturan' },
  { id: 'services', label: 'Layanan' },
  { id: 'kapsters', label: 'Kapster' },
  { id: 'products', label: 'Produk' },
  { id: 'accounts', label: 'Akun Staf' },
  { id: 'approvals', label: 'Approval' },
];

export const AdminPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [services, setServices] = useState([]);
  const [kapsters, setKapsters] = useState([]);
  const [products, setProducts] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'staff', kapsterId: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    try {
      const [dash, svc, kap, prod, appr] = await Promise.all([
        api.getOwnerDashboard(),
        api.getServices(),
        api.getKapsters(),
        api.getProducts(),
        api.getPendingApprovals(),
      ]);
      setDashboard(dash);
      setServices(svc);
      setKapsters(kap);
      setProducts(prod);
      setApprovals(appr);
      await loadUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'service') setFormData(item || { name: '', description: '', price: '', duration: '' });
    if (type === 'kapster') setFormData(item ? { ...item, services: (item.services || []).join(', ') } : { name: '', experience: '', image: '', services: '' });
    if (type === 'product') setFormData(item || { name: '', description: '', category: 'hair_care', price: '', stock: '', image: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'service') {
        const data = { ...formData, price: parseInt(formData.price) };
        editingItem ? await api.updateService(editingItem.id, data) : await api.createService(data);
      }
      if (modalType === 'kapster') {
        const data = {
          name: formData.name,
          experience: formData.experience,
          image: formData.image || null,
          services: formData.services.split(',').map((s) => s.trim()).filter(Boolean),
        };
        if (editingItem) {
          await api.updateKapsterMeta(editingItem.id, data);
        } else {
          await api.createKapster({ ...data, portfolio: [] });
        }
      }
      if (modalType === 'product') {
        const data = {
          ...formData,
          price: parseInt(formData.price),
          stock: parseInt(formData.stock) || 0,
          status: (parseInt(formData.stock) || 0) > 0 ? 'available' : 'unavailable',
        };
        editingItem ? await api.updateProduct(editingItem.id, data) : await api.createProduct(data);
      }
      setShowModal(false);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Hapus item ini?')) return;
    if (type === 'service') await api.deleteService(id);
    if (type === 'kapster') await api.deleteKapster(id);
    if (type === 'product') await api.deleteProduct(id);
    loadAll();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser({
        username: userForm.username,
        password: userForm.password,
        role: userForm.role,
        kapsterId: userForm.kapsterId ? Number(userForm.kapsterId) : null,
      });
      setUserForm({ username: '', password: '', role: 'staff', kapsterId: '' });
      loadUsers();
      alert('Akun staf dibuat');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Hapus akun staf ini?')) return;
    try {
      await api.deleteUser(id);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetUserPassword = async (id) => {
    const newPassword = prompt('Password baru (min. 6 karakter):');
    if (!newPassword) return;
    try {
      await api.resetUserPassword(id, newPassword);
      alert('Password direset');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproval = async (a, approved) => {
    await api.approvePriceChange(a.kapster_id, a.service_id, approved);
    loadAll();
  };

  if (loading) return <Loading />;

  return (
    <div className="page-container max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">Admin Panel</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate('/admin/finance')} className="btn-primary py-2 text-xs">
            Keuangan
          </button>
          <button onClick={() => navigate('/admin/orders')} className="btn-secondary py-2 text-xs">
            Kelola Order
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-ink text-white' : 'bg-white border border-line text-muted'
            }`}
          >
            {t.label}
            {t.id === 'approvals' && approvals.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white rounded-full px-1.5">{approvals.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Order Hari Ini', value: dashboard.ordersToday },
            { label: 'Pendapatan Hari Ini', value: formatPrice(dashboard.revenueToday) },
            { label: 'Antrian Aktif', value: dashboard.pendingOrders },
            { label: 'Saldo Kas (Akun 1-1)', value: formatPrice(dashboard.kas) },
            { label: 'Approval Pending', value: dashboard.pendingPriceApprovals },
          ].map(({ label, value }) => (
            <div key={label} className="card p-4">
              <p className="text-xs text-muted">{label}</p>
              <p className="text-xl font-light text-ink mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'pengaturan' && (
        <div className="space-y-4 max-w-md">
          <QrisSettings />
          <NotificationToggle />
          <ChangePasswordForm />
        </div>
      )}

      {tab === 'services' && (
        <CrudList
          items={services}
          onAdd={() => openModal('service')}
          onEdit={(i) => openModal('service', i)}
          onDelete={(id) => handleDelete('service', id)}
          render={(s) => (
            <div>
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-muted">{formatPrice(s.price)} · {s.duration}</p>
            </div>
          )}
        />
      )}

      {tab === 'kapsters' && (
        <CrudList
          items={kapsters}
          onAdd={() => openModal('kapster')}
          onEdit={(i) => openModal('kapster', i)}
          onDelete={(id) => handleDelete('kapster', id)}
          render={(k) => (
            <div className="flex items-center gap-3">
              <img src={assetUrl(k.image)} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="font-medium text-sm">{k.name}</p>
                <p className="text-xs text-muted">{k.experience}</p>
              </div>
            </div>
          )}
        />
      )}

      {tab === 'products' && (
        <CrudList
          items={products}
          onAdd={() => openModal('product')}
          onEdit={(i) => openModal('product', i)}
          onDelete={(id) => handleDelete('product', id)}
          render={(p) => (
            <div>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-muted">
                {PRODUCT_CATEGORIES[p.category]} · {formatPrice(p.price)} · Stok {p.stock}
              </p>
            </div>
          )}
        />
      )}

      {tab === 'accounts' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateUser} className="card p-5 space-y-3">
            <h3 className="font-medium text-sm text-ink">Tambah Akun Staf</h3>
            <input
              placeholder="Username"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="password"
              placeholder="Password awal"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              className="input-field"
              required
            />
            <select
              value={userForm.kapsterId}
              onChange={(e) => setUserForm({ ...userForm, role: 'staff', kapsterId: e.target.value })}
              className="input-field"
            >
              <option value="">Pilih profil kapster (opsional)</option>
              {kapsters.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary w-full text-xs">
              Buat Akun
            </button>
          </form>

          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="card p-6 text-center text-muted text-sm">Belum ada akun staf</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm text-ink">{u.username}</p>
                    <p className="text-xs text-muted">
                      {u.role}
                      {u.kapster_name ? ` · ${u.kapster_name}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetUserPassword(u.id)}
                      className="btn-secondary py-2 px-3 text-xs"
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-xs text-red-500 hover:underline py-2 px-1"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'approvals' && (
        <div className="space-y-2">
          {approvals.length === 0 ? (
            <div className="card p-6 text-center text-muted text-sm">Tidak ada pengajuan</div>
          ) : approvals.map((a) => (
            <div key={`${a.kapster_id}-${a.service_id}`} className="card p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{a.kapster_name} — {a.service_name}</p>
                <p className="text-xs text-muted">
                  {formatPrice(a.harga_jual)} → <span className="text-ink">{formatPrice(a.pending_harga_jual)}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApproval(a, true)} className="btn-primary py-2 px-3 text-xs">Setuju</button>
                <button onClick={() => handleApproval(a, false)} className="btn-secondary py-2 px-3 text-xs">Tolak</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-medium text-ink mb-4">
              {editingItem ? 'Edit' : 'Tambah'} {modalType}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {modalType === 'service' && (
                <>
                  <input name="name" placeholder="Nama" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
                  <textarea name="description" placeholder="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={2} />
                  <input name="price" type="number" placeholder="Harga" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" required />
                  <input name="duration" placeholder="Durasi" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="input-field" required />
                </>
              )}
              {modalType === 'kapster' && (
                <>
                  <input placeholder="Nama" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
                  <input placeholder="Pengalaman" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="input-field" required />
                  <input placeholder="URL Foto" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="input-field" />
                  <input placeholder="Keahlian (pisah koma)" value={formData.services} onChange={(e) => setFormData({ ...formData, services: e.target.value })} className="input-field" />
                </>
              )}
              {modalType === 'product' && (
                <>
                  <input placeholder="Nama" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
                  <textarea placeholder="Deskripsi" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={2} />
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">
                    {Object.entries(PRODUCT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input type="number" placeholder="Harga" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input-field" required />
                  <input type="number" placeholder="Stok" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="input-field" required />
                  <input placeholder="URL Gambar" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="input-field" />
                </>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" className="btn-primary flex-1">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CrudList = ({ items, onAdd, onEdit, onDelete, render }) => (
  <div className="space-y-2">
    <button onClick={onAdd} className="btn-primary py-2 text-xs mb-2">+ Tambah</button>
    {items.map((item) => (
      <div key={item.id} className="card p-4 flex justify-between items-center">
        {render(item)}
        <div className="flex gap-2">
          <button onClick={() => onEdit(item)} className="btn-ghost text-xs">Edit</button>
          <button onClick={() => onDelete(item.id)} className="text-xs text-red-500 hover:underline">Hapus</button>
        </div>
      </div>
    ))}
  </div>
);
