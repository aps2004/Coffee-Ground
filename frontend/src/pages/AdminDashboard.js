import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Upload, X, Save, Image, MapPin, Star, Coffee, Music, UserPlus, Users, Mail, Eye, FileText, Globe, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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
    playlist_url: shop?.playlist_url || '',
    highlighted: shop?.highlighted || false,
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
        playlist_url: form.playlist_url,
        highlighted: form.highlighted,
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
      <div>
        <Label className="text-[#2C1A12] text-sm">Spotify Playlist URL</Label>
        <Input value={form.playlist_url} onChange={(e) => setForm({ ...form, playlist_url: e.target.value })} placeholder="https://open.spotify.com/embed/playlist/..." className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="shop-playlist-input" />
        <p className="text-xs text-[#6B5744]/60 mt-1">Paste a Spotify embed URL for the shop's recommended playlist</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer" data-testid="shop-highlighted-toggle">
          <input
            type="checkbox"
            checked={form.highlighted}
            onChange={(e) => setForm({ ...form, highlighted: e.target.checked })}
            className="w-4 h-4 rounded border-[#E8E3D9] text-[#B55B49] focus:ring-[#B55B49]/30"
          />
          <span className="text-sm text-[#2C1A12]">Highlight in Spotlight (larger display)</span>
        </label>
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

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'blockquote', 'list', 'link', 'image',
];

const ARTICLE_CATEGORIES = ['Devices', 'Machines', 'Personas', 'Techniques'];

function ArticleForm({ article, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: article?.title || '',
    summary: article?.summary || '',
    content: article?.content || '',
    category: article?.category || 'Devices',
    tags: article?.tags?.join(', ') || '',
    author_name: article?.author_name || '',
    author_bio: article?.author_bio || '',
    published: article?.published ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
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
          <Label className="text-[#2C1A12] text-sm">Title *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="article-title-input" />
        </div>
        <div>
          <Label className="text-[#2C1A12] text-sm">Category *</Label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1 w-full rounded-md border border-[#E8E3D9] bg-[#FDFBF7] px-3 py-2 text-sm text-[#2C1A12] focus:outline-none focus:ring-2 focus:ring-[#B55B49]/30"
            data-testid="article-category-select"
          >
            {ARTICLE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label className="text-[#2C1A12] text-sm">Summary</Label>
        <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="article-summary-input" />
      </div>
      <div>
        <Label className="text-[#2C1A12] text-sm">Content (Rich Text) *</Label>
        <div className="mt-1" data-testid="article-content-editor">
          <ReactQuill
            theme="snow"
            value={form.content}
            onChange={(val) => setForm({ ...form, content: val })}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Write your article content here..."
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-[#2C1A12] text-sm">Author Name</Label>
          <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="article-author-input" />
        </div>
        <div>
          <Label className="text-[#2C1A12] text-sm">Tags (comma separated)</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="pour-over, technique, v60" className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="article-tags-input" />
        </div>
      </div>
      <div>
        <Label className="text-[#2C1A12] text-sm">Author Bio</Label>
        <Input value={form.author_bio} onChange={(e) => setForm({ ...form, author_bio: e.target.value })} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="article-author-bio-input" />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer" data-testid="article-published-toggle">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="w-4 h-4 rounded border-[#E8E3D9] text-[#B55B49] focus:ring-[#B55B49]/30"
          />
          <span className="text-sm text-[#2C1A12]">Published</span>
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2" data-testid="article-save-btn">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Article'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="border-[#E8E3D9] text-[#6B5744]" data-testid="article-cancel-btn">
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
  const [activeTab, setActiveTab] = useState('shops');
  const [admins, setAdmins] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ login_name: '', password: '', name: '' });
  const [articles, setArticles] = useState([]);
  const [editingArticle, setEditingArticle] = useState(null);
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');

  const isAdmin = user?.role === 'admin';
  const isContributor = user?.role === 'contributor';

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'contributor')) {
      navigate('/auth');
      return;
    }
    fetchShops();
    if (isAdmin) {
      fetchAdmins();
      fetchContacts();
      fetchArticles();
      fetchAllUsers();
    }
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

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API}/auth/admins`, { withCredentials: true });
      setAdmins(res.data);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${API}/contact`, { withCredentials: true });
      setContacts(res.data);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await axios.get(`${API}/articles?published_only=false`, { withCredentials: true });
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  };

  const handleCreateArticle = async (data) => {
    await axios.post(`${API}/articles`, data, { withCredentials: true });
    setShowAddArticle(false);
    await fetchArticles();
  };

  const handleUpdateArticle = async (data) => {
    await axios.put(`${API}/articles/${editingArticle.article_id}`, data, { withCredentials: true });
    setEditingArticle(null);
    await fetchArticles();
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await axios.delete(`${API}/articles/${articleId}`, { withCredentials: true });
      await fetchArticles();
    } catch (err) {
      console.error('Delete article failed:', err);
    }
  };

  const handleCoverUpload = async (articleId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API}/articles/${articleId}/cover`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchArticles();
    } catch (err) {
      console.error('Cover upload failed:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API}/auth/users`, { withCredentials: true });
      setAllUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.put(`${API}/auth/users/${userId}/role`, { role: newRole }, { withCredentials: true });
      await fetchAllUsers();
      await fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role');
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

  const handleImageUpload = async (shopId, files) => {
    const fileList = Array.from(files).slice(0, 10);
    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('file', file);
        await axios.post(`${API}/shops/${shopId}/images`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
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

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/auth/admins`, newAdmin, { withCredentials: true });
      setNewAdmin({ login_name: '', password: '', name: '' });
      setShowAddAdmin(false);
      await fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create admin');
    }
  };

  const handleDeleteAdmin = async (userId) => {
    if (!window.confirm('Remove this admin?')) return;
    try {
      await axios.delete(`${API}/auth/admins/${userId}`, { withCredentials: true });
      await fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove admin');
    }
  };

  const handleMarkRead = async (contactId) => {
    try {
      await axios.put(`${API}/contact/${contactId}/read`, {}, { withCredentials: true });
      await fetchContacts();
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'contributor')) return null;

  const unreadCount = contacts.filter(c => !c.read).length;
  
  // Filter shops for contributors: only their own
  const displayShops = isContributor ? shops.filter(s => s.created_by === user.user_id) : shops;

  // Build tabs based on role
  const tabs = [];
  tabs.push({ key: 'shops', label: isContributor ? 'My Shops' : 'Shops', icon: Coffee });
  if (isAdmin) {
    tabs.push({ key: 'articles', label: 'Articles', icon: FileText });
    tabs.push({ key: 'users', label: 'Users', icon: Users });
    tabs.push({ key: 'admins', label: 'Admins', icon: Users });
    tabs.push({ key: 'messages', label: 'Messages', icon: Mail, badge: unreadCount });
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="admin-dashboard">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-light text-[#2C1A12] tracking-tight" data-testid="admin-title">
              {isAdmin ? 'Admin Dashboard' : 'Contributor Dashboard'}
            </h1>
            <p className="text-[#6B5744] text-sm mt-1">
              {isAdmin ? 'Manage shops, articles, users, and messages' : 'Manage your coffee shop listings'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-[#E8E3D9]" data-testid="admin-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-[#B55B49] text-[#B55B49]'
                  : 'border-transparent text-[#6B5744] hover:text-[#2C1A12]'
              }`}
              data-testid={`tab-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-[#B55B49] text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ============ SHOPS TAB ============ */}
        {activeTab === 'shops' && (
          <div>
            <div className="flex justify-end mb-6">
              <Button onClick={() => { setShowAddForm(true); setEditingShop(null); }} className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2" data-testid="add-shop-btn">
                <Plus className="w-4 h-4" /> Add Shop
              </Button>
            </div>

            {showAddForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E3D9] rounded-lg p-6 mb-8">
                <h2 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-4">Add New Coffee Shop</h2>
                <ShopForm onSave={handleCreate} onCancel={() => setShowAddForm(false)} />
              </motion.div>
            )}

            {editingShop && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E3D9] rounded-lg p-6 mb-8">
                <h2 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-4">Edit: {editingShop.name}</h2>
                <ShopForm shop={editingShop} onSave={handleUpdate} onCancel={() => setEditingShop(null)} />
              </motion.div>
            )}

            {loading ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="bg-[#E8E3D9]/40 animate-pulse rounded h-32" />)}</div>
            ) : displayShops.length === 0 ? (
              <div className="text-center py-20">
                <Coffee className="w-12 h-12 text-[#D4B996] mx-auto mb-4" />
                <p className="text-[#6B5744]">{isContributor ? 'You haven\'t added any shops yet.' : 'No coffee shops yet. Add your first listing!'}</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="admin-shop-list">
                {displayShops.map(shop => (
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
                          {shop.playlist_url && (
                            <Badge variant="secondary" className="bg-[#B55B49]/10 text-[#B55B49] text-xs">
                              <Music className="w-3 h-3 mr-1" /> Playlist
                            </Badge>
                          )}
                          {shop.highlighted && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                              <Star className="w-3 h-3 mr-1 fill-yellow-500" /> Spotlight
                            </Badge>
                          )}
                        </div>
                        <p className="text-[#6B5744] text-sm line-clamp-2">{shop.description}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {shop.images?.map(img => (
                            <div key={img.image_id} className="relative group w-16 h-16 rounded overflow-hidden border border-[#E8E3D9]">
                              <img src={`${API}/files/${img.storage_path}`} alt="" className="w-full h-full object-cover" />
                              <button onClick={() => handleImageDelete(shop.shop_id, img.image_id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" data-testid={`delete-image-${img.image_id}`}>
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ))}
                          <label className="w-16 h-16 rounded border-2 border-dashed border-[#E8E3D9] flex flex-col items-center justify-center cursor-pointer hover:border-[#B55B49] transition-colors" data-testid={`upload-image-${shop.shop_id}`}>
                            <Upload className="w-4 h-4 text-[#6B5744]" />
                            <span className="text-[9px] text-[#6B5744] mt-0.5">Up to 10</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files.length) handleImageUpload(shop.shop_id, e.target.files); }} />
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
        )}

        {/* ============ ARTICLES TAB ============ */}
        {activeTab === 'articles' && (
          <div data-testid="articles-section">
            <div className="flex justify-end mb-6">
              <Button onClick={() => { setShowAddArticle(true); setEditingArticle(null); }} className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2" data-testid="add-article-btn">
                <Plus className="w-4 h-4" /> New Article
              </Button>
            </div>

            {showAddArticle && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E3D9] rounded-lg p-6 mb-8">
                <h2 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-4">New Article</h2>
                <ArticleForm onSave={handleCreateArticle} onCancel={() => setShowAddArticle(false)} />
              </motion.div>
            )}

            {editingArticle && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E3D9] rounded-lg p-6 mb-8">
                <h2 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-4">Edit: {editingArticle.title}</h2>
                <ArticleForm article={editingArticle} onSave={handleUpdateArticle} onCancel={() => setEditingArticle(null)} />
              </motion.div>
            )}

            {articles.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 text-[#D4B996] mx-auto mb-4" />
                <p className="text-[#6B5744]">No articles yet. Write your first piece!</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="admin-article-list">
                {articles.map(article => (
                  <div key={article.article_id} className="bg-white border border-[#E8E3D9] rounded-lg p-5" data-testid={`admin-article-${article.article_id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium text-[#2C1A12] text-lg">{article.title}</h3>
                          <Badge variant="secondary" className="bg-[#E8E3D9] text-[#6B5744] text-xs">
                            {article.category}
                          </Badge>
                          {article.published ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs gap-1">
                              <Globe className="w-3 h-3" /> Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs gap-1">
                              <EyeOff className="w-3 h-3" /> Draft
                            </Badge>
                          )}
                        </div>
                        <p className="text-[#6B5744] text-sm line-clamp-2">{article.summary}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[#6B5744]/60">
                          {article.author_name && <span>By {article.author_name}</span>}
                          {article.created_at && <span>{new Date(article.created_at).toLocaleDateString()}</span>}
                        </div>
                        {/* Cover image */}
                        <div className="flex items-center gap-2 mt-3">
                          {article.cover_image ? (
                            <div className="w-16 h-16 rounded overflow-hidden border border-[#E8E3D9]">
                              <img src={`${API}/files/${article.cover_image}`} alt="cover" className="w-full h-full object-cover" />
                            </div>
                          ) : null}
                          <label className="w-16 h-16 rounded border-2 border-dashed border-[#E8E3D9] flex flex-col items-center justify-center cursor-pointer hover:border-[#B55B49] transition-colors text-[#6B5744]" data-testid={`upload-cover-${article.article_id}`}>
                            <Upload className="w-4 h-4" />
                            <span className="text-[9px] mt-0.5">Cover</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) handleCoverUpload(article.article_id, e.target.files[0]); }} />
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => { setEditingArticle(article); setShowAddArticle(false); }} className="border-[#E8E3D9] text-[#6B5744] hover:bg-[#E8E3D9] gap-1" data-testid={`edit-article-${article.article_id}`}>
                          <Edit2 className="w-3 h-3" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeleteArticle(article.article_id)} className="border-red-200 text-red-600 hover:bg-red-50 gap-1" data-testid={`delete-article-${article.article_id}`}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ USERS TAB (Admin only) ============ */}
        {activeTab === 'users' && isAdmin && (
          <div data-testid="users-section">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <p className="text-[#6B5744] text-sm">{allUsers.length} registered user{allUsers.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-1">
                  {['all', 'user', 'contributor', 'admin'].map(r => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        roleFilter === r
                          ? 'bg-[#B55B49] text-white'
                          : 'bg-[#E8E3D9]/50 text-[#6B5744] hover:bg-[#E8E3D9]'
                      }`}
                      data-testid={`role-filter-${r}`}
                    >
                      {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {allUsers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-[#D4B996] mx-auto mb-4" />
                <p className="text-[#6B5744]">No users registered yet.</p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="users-list">
                {allUsers
                  .filter(u => roleFilter === 'all' || u.role === roleFilter)
                  .map(u => (
                  <div key={u.user_id} className="bg-white border border-[#E8E3D9] rounded-lg p-4 flex items-center justify-between" data-testid={`user-row-${u.user_id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4B996]/30 flex items-center justify-center text-[#2C1A12] font-medium text-sm">
                        {(u.name || u.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2C1A12]">{u.name || 'Unnamed'}</p>
                        <p className="text-xs text-[#6B5744]">{u.email}</p>
                        <p className="text-xs text-[#6B5744]/50">
                          Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {u.user_id === user.user_id ? (
                        <Badge variant="secondary" className="bg-[#E8E3D9] text-[#6B5744] text-xs">You (Admin)</Badge>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.user_id, e.target.value)}
                          className="rounded-md border border-[#E8E3D9] bg-[#FDFBF7] px-3 py-1.5 text-xs text-[#2C1A12] focus:outline-none focus:ring-2 focus:ring-[#B55B49]/30"
                          data-testid={`role-select-${u.user_id}`}
                        >
                          <option value="user">User</option>
                          <option value="contributor">Contributor</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ ADMINS TAB ============ */}
        {activeTab === 'admins' && (
          <div data-testid="admins-section">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[#6B5744] text-sm">{admins.length} admin{admins.length !== 1 ? 's' : ''} registered</p>
              <Button onClick={() => setShowAddAdmin(true)} className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2" data-testid="add-admin-btn">
                <UserPlus className="w-4 h-4" /> Add Admin
              </Button>
            </div>

            {showAddAdmin && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E3D9] rounded-lg p-6 mb-6">
                <h3 className="font-['Cormorant_Garamond'] text-xl text-[#2C1A12] mb-4">Add New Admin</h3>
                <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[#2C1A12] text-sm">Login Name *</Label>
                    <Input value={newAdmin.login_name} onChange={(e) => setNewAdmin({ ...newAdmin, login_name: e.target.value })} required className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="new-admin-login" />
                  </div>
                  <div>
                    <Label className="text-[#2C1A12] text-sm">Display Name</Label>
                    <Input value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="new-admin-name" />
                  </div>
                  <div>
                    <Label className="text-[#2C1A12] text-sm">Password *</Label>
                    <Input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} required className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]" data-testid="new-admin-password" />
                  </div>
                  <div className="sm:col-span-3 flex gap-3">
                    <Button type="submit" className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2" data-testid="save-admin-btn">
                      <Save className="w-4 h-4" /> Create Admin
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddAdmin(false)} className="border-[#E8E3D9] text-[#6B5744]">Cancel</Button>
                  </div>
                </form>
              </motion.div>
            )}

            <div className="space-y-3">
              {admins.map(admin => (
                <div key={admin.user_id} className="bg-white border border-[#E8E3D9] rounded-lg p-4 flex items-center justify-between" data-testid={`admin-user-${admin.user_id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4B996]/30 flex items-center justify-center text-[#2C1A12] font-medium text-sm">
                      {(admin.name || admin.email || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2C1A12]">{admin.name || admin.email}</p>
                      <p className="text-xs text-[#6B5744]">Login: {admin.email}</p>
                    </div>
                  </div>
                  {admin.user_id !== user.user_id && (
                    <Button size="sm" variant="outline" onClick={() => handleDeleteAdmin(admin.user_id)} className="border-red-200 text-red-600 hover:bg-red-50 gap-1" data-testid={`remove-admin-${admin.user_id}`}>
                      <Trash2 className="w-3 h-3" /> Remove
                    </Button>
                  )}
                  {admin.user_id === user.user_id && (
                    <Badge variant="secondary" className="bg-[#E8E3D9] text-[#6B5744] text-xs">You</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ MESSAGES TAB ============ */}
        {activeTab === 'messages' && (
          <div data-testid="messages-section">
            <p className="text-[#6B5744] text-sm mb-6">{contacts.length} message{contacts.length !== 1 ? 's' : ''}{unreadCount > 0 ? ` (${unreadCount} unread)` : ''}</p>
            {contacts.length === 0 ? (
              <div className="text-center py-16">
                <Mail className="w-12 h-12 text-[#D4B996] mx-auto mb-4" />
                <p className="text-[#6B5744]">No messages yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map(msg => (
                  <div key={msg.contact_id} className={`bg-white border rounded-lg p-5 ${msg.read ? 'border-[#E8E3D9]' : 'border-[#B55B49]/30 bg-[#B55B49]/[0.02]'}`} data-testid={`message-${msg.contact_id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-[#2C1A12]">{msg.name}</p>
                          <span className="text-xs text-[#6B5744]">&lt;{msg.email}&gt;</span>
                          {!msg.read && <span className="w-2 h-2 rounded-full bg-[#B55B49]" />}
                        </div>
                        <p className="text-[#2C1A12]/80 text-sm leading-relaxed">{msg.message}</p>
                        <p className="text-xs text-[#6B5744]/50 mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                      {!msg.read && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkRead(msg.contact_id)} className="border-[#E8E3D9] text-[#6B5744] hover:bg-[#E8E3D9] gap-1 shrink-0 ml-4" data-testid={`mark-read-${msg.contact_id}`}>
                          <Eye className="w-3 h-3" /> Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
