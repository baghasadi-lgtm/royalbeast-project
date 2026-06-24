import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Upload, Trash2 } from 'lucide-react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { assetUrl } from '../../utils/format';
import { Loading } from '../../components/Loading';
import { ChangePasswordForm } from '../../components/ChangePasswordForm';
import { NotificationToggle } from '../../components/NotificationToggle';

export const EditKapsterProfilePage = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const { user } = useAuth();
  const id = paramId || user?.kapsterId;

  const [kapster, setKapster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    if (id) loadKapster();
  }, [id]);

  const loadKapster = async () => {
    try {
      const data = await api.getKapsterById(id);
      setKapster({
        ...data,
        portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
      });
    } catch (err) {
      alert('Gagal load data');
      navigate(user?.role === 'staff' || user?.role === 'kapster' ? '/staff-dashboard' : '/services');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setKapster({ ...kapster, [e.target.name]: e.target.value });
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setKapster({
      ...kapster,
      image: URL.createObjectURL(file),
      imageFile: file,
    });
  };

  const handlePortfolioUpload = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map((file) => ({
      type: file.type.startsWith('video') ? 'video' : 'image',
      url: URL.createObjectURL(file),
      file,
    }));
    setKapster({
      ...kapster,
      portfolio: [...(kapster.portfolio || []), ...newItems],
    });
  };

  const removePortfolioItem = (index) => {
    setKapster({
      ...kapster,
      portfolio: kapster.portfolio.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', kapster.name);
      formData.append('experience', kapster.experience);

      const existingItems = (kapster.portfolio || [])
        .filter((item) => !item.file)
        .map(({ type, url }) => ({ type, url }));

      formData.append('existingPortfolio', JSON.stringify(existingItems));

      if (kapster.imageFile) {
        formData.append('image', kapster.imageFile);
      }

      (kapster.portfolio || []).forEach((item) => {
        if (item.file) formData.append('portfolio', item.file);
      });

      await api.updateKapster(id, formData);
      alert('Profil berhasil diupdate');
      navigate('/staff-dashboard');
    } catch (error) {
      console.error(error);
      alert(error.message || 'Gagal update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!kapster) return null;

  const profileSrc = kapster.imageFile ? kapster.image : assetUrl(kapster.image);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="section-title text-xl">Edit Profil</h2>
        <button onClick={() => navigate(-1)} className="btn-ghost text-xs">
          ← Kembali
        </button>
      </div>

      <div className="card p-5 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <img
            src={profileSrc || assetUrl('/uploads/placeholder.png')}
            alt="Profile"
            className="w-24 h-24 rounded-2xl object-cover border border-line"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop';
            }}
          />
          <label className="cursor-pointer btn-secondary text-xs gap-2">
            <Upload size={16} />
            Ganti Foto Profil
            <input type="file" accept="image/*" hidden onChange={handleProfileImageUpload} />
          </label>
        </div>

        <div className="space-y-3">
          <input
            name="name"
            value={kapster.name || ''}
            onChange={handleChange}
            className="input-field"
            placeholder="Nama"
          />
          <input
            name="experience"
            value={kapster.experience || ''}
            onChange={handleChange}
            className="input-field"
            placeholder="Pengalaman (mis. 3 tahun)"
          />
        </div>

        <div>
          <h4 className="text-sm font-medium text-ink mb-3">Portfolio</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {(kapster.portfolio || []).map((item, idx) => {
              const src = item.file ? item.url : assetUrl(item.url);
              return (
                <div key={idx} className="relative aspect-video bg-surface rounded-xl overflow-hidden border border-line">
                  <button
                    type="button"
                    onClick={() => removePortfolioItem(idx)}
                    className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/50 text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMedia({ ...item, url: src })}
                    className="w-full h-full"
                  >
                    {item.type === 'image' ? (
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={src} className="w-full h-full object-cover" muted />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <label className="cursor-pointer btn-secondary text-xs gap-2 inline-flex">
            <Upload size={16} />
            Upload Foto / Video
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={handlePortfolioUpload}
            />
          </label>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <ChangePasswordForm />
      <NotificationToggle />

      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button type="button" className="absolute top-4 right-4 text-white" onClick={() => setSelectedMedia(null)}>
            <X size={32} />
          </button>
          {selectedMedia.type === 'image' ? (
            <img src={selectedMedia.url} alt="" className="max-w-full max-h-full" />
          ) : (
            <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-full" />
          )}
        </div>
      )}
    </div>
  );
};
