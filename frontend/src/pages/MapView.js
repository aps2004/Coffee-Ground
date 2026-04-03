import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import { Star, MapPin, ArrowLeft, Coffee } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom coffee marker
const coffeeIcon = new L.DivIcon({
  html: `<div style="
    background: #B55B49;
    border: 3px solid #FDFBF7;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(44,26,18,0.3);
    color: white;
    font-size: 16px;
  ">&#9749;</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

export default function MapView() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await axios.get(`${API}/shops/map`);
      setShops(res.data);
    } catch (err) {
      console.error('Failed to fetch map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // UK center coordinates
  const ukCenter = [54.5, -2.5];

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="map-page">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-[#6B5744] hover:text-[#2C1A12] mb-4 transition-colors" data-testid="map-back-link">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Link>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-light text-[#2C1A12] tracking-tight mb-2" data-testid="map-title">
            Coffee Map of the UK
          </h1>
          <p className="text-[#6B5744] text-base">
            {shops.length} curated coffee shops across the United Kingdom
          </p>
        </motion.div>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-lg overflow-hidden border border-[#E8E3D9] shadow-[0_8px_32px_rgba(44,26,18,0.08)]"
          style={{ height: '70vh' }}
          data-testid="map-container"
        >
          {!loading && (
            <MapContainer
              center={ukCenter}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {shops.map(shop => (
                <Marker
                  key={shop.shop_id}
                  position={[shop.latitude, shop.longitude]}
                  icon={coffeeIcon}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#2C1A12] mb-1">{shop.name}</h3>
                      <p className="text-[#6B5744] text-xs flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" /> {shop.city}
                      </p>
                      <p className="text-[#6B5744] text-xs mb-3 line-clamp-2">{shop.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#D4B996] fill-[#D4B996]" />
                          <span className="text-xs font-medium text-[#2C1A12]">{shop.admin_rating}</span>
                        </div>
                        <Link to={`/shop/${shop.shop_id}`}>
                          <Button size="sm" className="h-7 text-xs bg-[#B55B49] hover:bg-[#9a4d3e] text-white">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </motion.div>

        {/* Shop List Below Map */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="map-shop-list">
          {shops.map(shop => (
            <Link key={shop.shop_id} to={`/shop/${shop.shop_id}`} className="group">
              <div className="border border-[#E8E3D9] rounded p-4 bg-white hover:shadow-[0_8px_32px_rgba(44,26,18,0.08)] transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-[#2C1A12] group-hover:text-[#B55B49] transition-colors">{shop.name}</h4>
                    <p className="text-xs text-[#6B5744] flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {shop.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#E8E3D9]/60 px-2 py-1 rounded">
                    <Star className="w-3 h-3 text-[#D4B996] fill-[#D4B996]" />
                    <span className="text-xs font-medium text-[#2C1A12]">{shop.admin_rating}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
