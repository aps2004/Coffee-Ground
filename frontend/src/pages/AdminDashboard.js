import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Upload, X, Save, Image, MapPin, Star, Coffee } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ShopForm({ shop, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: shop?.name || '',
    description: shop?.description || '',
    detailed_description: shop?.detailed_description || '',
    city: shop?.city || '',
    address: shop?.address || '',
    latitude: shop?.latitude || 0,
    longitude: shop?.longitude || 0,
    admin_rating: shop?.admin_rating || 0,
    tags: shop?.tags?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        admin_rating: parseFloat(form.admin_rating) || 0,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      await onSave(data);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-[#2C1A12] text-sm">Shop Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-name-input" />
        </div>
        <div>
          <Label className="text-[#2C1A12] text-sm">City *</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-city-input" />
        </div>
      </div>
      <div>
        <Label className="text-[#2C1A12] text-sm">Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-address-input" />
      </div>
      <div>
        <Label className="text-[#2C1A12] text-sm">Brief Description *</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={2} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-description-input" />
      </div>
      <div>
        <Label className="text-[#2C1A12] text-sm">Detailed Description</Label>
        <Textarea value={form.detailed_description} onChange={(e) => setForm({ ...form, detailed_description: e.target.value })} rows={6} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-detailed-desc-input" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-[#2C1A12] text-sm">Latitude</Label>
          <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-lat-input" />
        </div>
        <div>
          <Label className="text-[#2C1A12] text-sm">Longitude</Label>
          <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-lng-input" />
        </div>
        <div>
          <Label className="text-[#2C1A12] text-sm">Admin Rating (1-5)</Label>
          <Input type="number" step="0.1" min="0" max="5" value={form.admin_rating} onChange={(e) => setForm({ ...form, admin_rating: e.target.value })} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-rating-input" />
        </div>
      </div>
      <div>
        <Label className="text-[#2C1A12] text-sm">Tags (comma separated)</Label>
        <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="specialty, pour-over, cozy" className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-tags-input" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2" data-testid="shop-save-btn">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Shop'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-[#E8E3D9] text-[#6B5744]" data-testid="shop-cancel-btn">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingShop, setEditingShop] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchShops();
  }, [user, navigate]);

  const fetchShops = async () => {
    try {
      const res = await axios.get(`${API}/shops`, { withCredentials: true });
      setShops(res.data);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    await axios.post(`${API}/shops`, data, { withCredentials: true });
    setShowAddForm(false);
    await fetchShops();
  };

  const handleUpdate = async (data) => {
    await axios.put(`${API}/shops/${editingShop.shop_id}`, data, { withCredentials: true });
    setEditingShop(null);
    await fetchShops();
  };

  const handleDelete = async (shopId) => {
    if (!window.confirm('Are you sure you want to delete this coffee shop?')) return;
    try {
      await axios.delete(`${API}/shops/${shopId}`, { withCredentials: true });
      await fetchShops();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleImageUpload = async (shopId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API}/shops/${shopId}/images`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchShops();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleImageDelete = async (shopId, imageId) => {
    try {
      await axios.delete(`${API}/shops/${shopId}/images/${imageId}`, { withCredentials: true });
      await fetchShops();
    } catch (err) {
      console.error('Image delete failed:', err);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="admin-dashboard">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-light text-[#2C1A12] tracking-tight" data-testid="admin-title">
              Admin Dashboard
            </h1>
            <p className="text-[#6B5744] text-sm mt-1">Manage your coffee shop listings</p>
          </div>
          <Button onClick={() => { setShowAddForm(true); setEditingShop(null); }} className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2" data-testid="add-shop-btn">
            <Plus className="w-4 h-4" /> Add Shop
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E3D9] rounded-lg p-6 mb-8">
            <h2 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-4">Add New Coffee Shop</h2>
            <ShopForm onSave={handleCreate} onCancel={() => setShowAddForm(false)} />
          </motion.div>
        )}

        {/* Edit Form */}
        {editingShop && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E3D9] rounded-lg p-6 mb-8">
            <h2 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-4">Edit: {editingShop.name}</h2>
            <ShopForm shop={editingShop} onSave={handleUpdate} onCancel={() => setEditingShop(null)} />
          </motion.div>
        )}

        {/* Shop List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="bg-[#E8E3D9]/40 animate-pulse rounded h-32" />)}
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-20">
            <Coffee className="w-12 h-12 text-[#D4B996] mx-auto mb-4" />
            <p className="text-[#6B5744]">No coffee shops yet. Add your first listing!</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="admin-shop-list">
            {shops.map(shop => (
              <div key={shop.shop_id} className="bg-white border border-[#E8E3D9] rounded-lg p-5" data-testid={`admin-shop-${shop.shop_id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-[#2C1A12] text-lg">{shop.name}</h3>
                      <Badge variant="secondary" className="bg-[#E8E3D9] text-[#6B5744] text-xs">
                        <MapPin className="w-3 h-3 mr-1" /> {shop.city}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#D4B996] fill-[#D4B996]" />
                        <span className="text-sm text-[#2C1A12]">{shop.admin_rating}</span>
                      </div>
                    </div>
                    <p className="text-[#6B5744] text-sm line-clamp-2">{shop.description}</p>

                    {/* Images */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {shop.images?.map(img => (
                        <div key={img.image_id} className="relative group w-16 h-16 rounded overflow-hidden border border-[#E8E3D9]">
                          <img src={`${API}/files/${img.storage_path}`} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleImageDelete(shop.shop_id, img.image_id)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            data-testid={`delete-image-${img.image_id}`}
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 rounded border-2 border-dashed border-[#E8E3D9] flex items-center justify-center cursor-pointer hover:border-[#B55B49] transition-colors" data-testid={`upload-image-${shop.shop_id}`}>
                        <Upload className="w-5 h-5 text-[#6B5744]" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0]) handleImageUpload(shop.shop_id, e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => { setEditingShop(shop); setShowAddForm(false); }} className="border-[#E8E3D9] text-[#6B5744] hover:bg-[#E8E3D9] gap-1" data-testid={`edit-shop-${shop.shop_id}`}>
                      <Edit2 className="w-3 h-3" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(shop.shop_id)} className="border-red-200 text-red-600 hover:bg-red-50 gap-1" data-testid={`delete-shop-${shop.shop_id}`}>
                      <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
