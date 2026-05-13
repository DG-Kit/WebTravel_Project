'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import Link from 'next/link';

interface Hotel {
  hotel_id: number;
  name: string;
  address: string;
  star_rating: number;
  average_rating: number;
  is_active: boolean;
  images: { image_url: string }[];
  rooms?: any[];
  location_id: number;
}

interface Location {
  location_id: number;
  name: string;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80';

export default function HostHotelsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location_id: 0,
    star_rating: 5,
    is_active: true,
    image_urls: [] as string[]
  });

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [managingRoomsHotel, setManagingRoomsHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMyHotels();
      fetchLocations();
    }
  }, [user]);

  const fetchMyHotels = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/hotels?owner_id=${user?.user_id}`);
      if (response.data.success) {
        setHotels(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/locations');
      if (response.data.success) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      location_id: locations[0]?.location_id || 0,
      star_rating: 5,
      is_active: true,
      image_urls: []
    });
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      address: hotel.address,
      location_id: hotel.location_id,
      star_rating: hotel.star_rating,
      is_active: hotel.is_active,
      image_urls: hotel.images.map((img: any) => img.image_url)
    });
    setShowEditModal(true);
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location_id) {
      showToast('Please select a location', 'warning');
      return;
    }
    try {
      const response = await api.post('/hotels', { ...formData, owner_id: user?.user_id });
      if (response.data.success) {
        setShowAddModal(false);
        resetForm();
        fetchMyHotels();
      }
    } catch (err) {
      console.error('Add failed:', err);
      showToast('Failed to add hotel', 'error');
    }
  };

  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    try {
      const response = await api.put(`/hotels/${editingHotel.hotel_id}`, formData);
      if (response.data.success) {
        setShowEditModal(false);
        fetchMyHotels();
      }
    } catch (err) {
      console.error('Update failed:', err);
      showToast('Failed to update hotel', 'error');
    }
  };

  const handleManageRooms = (hotel: Hotel) => {
    setManagingRoomsHotel(hotel);
    setRooms(hotel.rooms || []);
    setShowRoomModal(true);
  };

  const handleSaveRooms = async () => {
    if (!managingRoomsHotel) return;
    try {
      const response = await api.put(`/hotels/${managingRoomsHotel.hotel_id}`, { rooms });
      if (response.data.success) {
        setShowRoomModal(false);
        fetchMyHotels();
      }
    } catch (err) {
      console.error('Failed to save rooms:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-20 bg-slate-100 rounded-3xl animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i: number) => <div key={i} className="h-64 bg-slate-50 rounded-3xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">My Properties</h3>
          <p className="text-slate-500 font-medium mt-1">Manage your hotel listings and room availability.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">add_business</span>
          Add New Hotel
        </button>
      </div>

      {hotels.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 p-20 text-center">
          <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <span className="material-symbols-outlined text-6xl">hotel</span>
          </div>
          <h4 className="text-2xl font-black text-slate-900 mb-2">No properties yet</h4>
          <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">Start your journey by adding your first hotel listing to our platform.</p>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          >
            Create your first listing &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {hotels.map((hotel: Hotel) => (
            <div key={hotel.hotel_id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
              <div className="w-full md:w-96 h-64 md:h-auto bg-slate-50 relative shrink-0 overflow-hidden">
                <img 
                  src={hotel.images?.[0]?.image_url || FALLBACK_IMG} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                  alt={hotel.name}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-1.5 text-amber-500 font-black text-sm shadow-xl border border-white">
                  <span className="material-symbols-outlined text-base fill-current">star</span> {hotel.star_rating}
                </div>
              </div>
              <div className="p-10 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">{hotel.name}</h4>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${hotel.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                      {hotel.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="text-base text-slate-500 font-medium flex items-center gap-2 mb-8">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                    </div>
                    {hotel.address}
                  </div>
                  
                  <div className="flex gap-16">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rooms</p>
                        <p className="text-2xl font-black text-slate-900">{hotel.rooms?.length || 0}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Avg. Rating</p>
                        <p className="text-2xl font-black text-slate-900">{hotel.average_rating || 0}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Bookings</p>
                        <p className="text-2xl font-black text-slate-900">0</p>
                     </div>
                  </div>
                </div>

                <div className="mt-12 flex items-center justify-between border-t border-slate-50 pt-8">
                   <div className="flex gap-4">
                      <button 
                        onClick={() => handleEdit(hotel)}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 shadow-xl shadow-slate-900/10"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                        Edit Details
                      </button>
                      <button 
                        onClick={() => handleManageRooms(hotel)}
                        className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 border border-slate-200"
                      >
                        <span className="material-symbols-outlined text-xl">bed</span>
                        Manage Rooms
                      </button>
                   </div>
                   <Link href={`/hotels/${hotel.hotel_id}`} target="_blank" className="text-slate-400 text-sm font-bold hover:text-primary transition-all flex items-center gap-2 group/link">
                     <span className="hidden sm:inline">Preview Listing</span>
                     <div className="size-10 rounded-full border border-slate-100 flex items-center justify-center group-hover/link:border-primary/30 group-hover/link:bg-primary/5 transition-all">
                        <span className="material-symbols-outlined text-lg group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform">open_in_new</span>
                     </div>
                   </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">{showAddModal ? 'add_business' : 'edit'}</span>
                  </div>
                  {showAddModal ? 'Add New Property' : 'Edit Property'}
                </h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 ml-13">
                  {showAddModal ? 'Register your new hotel listing' : 'Update your listing information'}
                </p>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }} 
                className="size-12 hover:bg-white rounded-2xl transition-all text-slate-400 shadow-sm flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form 
              onSubmit={showAddModal ? handleAddHotel : handleUpdateHotel} 
              className="p-10 space-y-8 overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-2 gap-8">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Hotel Name</label>
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter hotel name"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Location Address</label>
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="Enter full address"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">City/Location</label>
                  <div className="relative">
                    <select
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-bold text-slate-900 transition-all appearance-none"
                      value={formData.location_id}
                      onChange={e => setFormData({ ...formData, location_id: parseInt(e.target.value) })}
                      required
                    >
                      <option value="0">Select City</option>
                      {locations.map(loc => <option key={loc.location_id} value={loc.location_id}>{loc.name}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Star Rating</label>
                  <div className="relative">
                    <select
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-bold text-slate-900 transition-all appearance-none"
                      value={formData.star_rating}
                      onChange={e => setFormData({ ...formData, star_rating: parseInt(e.target.value) })}
                    >
                      {[1, 2, 3, 4, 5].map((v: number) => <option key={v} value={v}>{v} Star Rating</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Listing Status</label>
                  <div className="relative">
                    <select
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none font-bold text-slate-900 transition-all appearance-none"
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={e => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    >
                      <option value="true">Active (Visible)</option>
                      <option value="false">Paused (Hidden)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                  </div>
                </div>
                <div className="col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex justify-between">
                    <span>Property Gallery</span>
                    <span className="text-primary lowercase tracking-widest">{formData.image_urls.length} images</span>
                  </label>
                  <div className="space-y-3">
                    {formData.image_urls.map((url: string, idx: number) => (
                      <div key={idx} className="flex gap-3 group animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex-1 relative">
                          <input
                            className="w-full px-6 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none text-sm font-bold text-slate-600 transition-all"
                            value={url}
                            onChange={e => {
                              const newUrls = [...formData.image_urls];
                              newUrls[idx] = e.target.value;
                              setFormData({ ...formData, image_urls: newUrls });
                            }}
                            placeholder="Paste image URL here..."
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormData({ ...formData, image_urls: formData.image_urls.filter((_: any, i: number) => i !== idx) })}
                          className="size-11 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_urls: [...formData.image_urls, ''] })}
                    className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                    Add New Image URL
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-8 border-t border-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="flex-1 px-8 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
                >
                  {showAddModal ? 'Create Listing' : 'Apply Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Rooms Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5 shrink-0">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">bed</span>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">Manage Rooms</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">{managingRoomsHotel?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowRoomModal(false)} className="size-12 hover:bg-white rounded-2xl transition-all text-slate-400 shadow-sm flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-8 bg-slate-50/50 flex-1">
              {rooms.map((room: any, idx: number) => (
                <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 group hover:shadow-xl transition-all relative">
                    <button 
                      onClick={() => setRooms(rooms.filter((_: any, i: number) => i !== idx))}
                      className="absolute top-6 right-6 size-10 rounded-full bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                    >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Room Type</label>
                      <input
                        className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold text-slate-900 transition-all"
                        value={room.room_type}
                        onChange={e => {
                          const newRooms = [...rooms];
                          newRooms[idx].room_type = e.target.value;
                          setRooms(newRooms);
                        }}
                        placeholder="e.g. Deluxe Suite"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Price per Night</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold text-slate-900 transition-all"
                          value={room.price}
                          onChange={e => {
                            const newRooms = [...rooms];
                            newRooms[idx].price = parseFloat(e.target.value);
                            setRooms(newRooms);
                          }}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Capacity</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold text-slate-900 transition-all"
                          value={room.capacity}
                          onChange={e => {
                            const newRooms = [...rooms];
                            newRooms[idx].capacity = parseInt(e.target.value);
                            setRooms(newRooms);
                          }}
                        />
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">group</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Availability</label>
                      <div className="relative">
                        <select
                          className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold text-slate-900 transition-all appearance-none"
                          value={room.is_available ? 'true' : 'false'}
                          onChange={e => {
                            const newRooms = [...rooms];
                            newRooms[idx].is_available = e.target.value === 'true';
                            setRooms(newRooms);
                          }}
                        >
                          <option value="true">Available</option>
                          <option value="false">Fully Booked</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</span>
                      </div>
                    </div>
                    <div className="col-span-full space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex justify-between">
                        <span>Room Gallery</span>
                        <span className="text-primary lowercase">{(room.images || room.image_urls || []).length} images</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {((room.images || room.image_urls || []).map((img: any) => typeof img === 'string' ? img : img.image_url)).map((url: string, imgIdx: number) => (
                          <div key={imgIdx} className="flex gap-2 group/img animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${imgIdx * 50}ms` }}>
                            <input
                              className="flex-1 px-5 py-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none text-[11px] font-bold text-slate-500 transition-all"
                              value={url}
                              onChange={e => {
                                const newRooms = [...rooms];
                                const currentRoom = newRooms[idx];
                                const currentUrls = (currentRoom.images || currentRoom.image_urls || []).map((img: any) => typeof img === 'string' ? img : img.image_url);
                                currentUrls[imgIdx] = e.target.value;
                                currentRoom.image_urls = currentUrls;
                                delete currentRoom.images;
                                setRooms(newRooms);
                              }}
                              placeholder="Image URL"
                            />
                            <button 
                              type="button" 
                              onClick={() => {
                                const newRooms = [...rooms];
                                const currentRoom = newRooms[idx];
                                const currentUrls = (currentRoom.images || currentRoom.image_urls || []).map((img: any) => typeof img === 'string' ? img : img.image_url);
                                currentRoom.image_urls = currentUrls.filter((_: any, i: number) => i !== imgIdx);
                                delete currentRoom.images;
                                setRooms(newRooms);
                              }}
                              className="size-9 rounded-lg bg-slate-50 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center shrink-0"
                            >
                              <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newRooms = [...rooms];
                          const currentRoom = newRooms[idx];
                          const currentUrls = (currentRoom.images || currentRoom.image_urls || []).map((img: any) => typeof img === 'string' ? img : img.image_url);
                          currentRoom.image_urls = [...currentUrls, ''];
                          delete currentRoom.images;
                          setRooms(newRooms);
                        }}
                        className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                        Add Room Image URL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => setRooms([...rooms, { room_type: '', price: 0, capacity: 2, is_available: true, image_urls: [] }])}
                className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-sm font-black text-slate-400 uppercase tracking-[0.2em] hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-3xl">add_circle</span>
                </div>
                Add New Room Category
              </button>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex gap-6 shrink-0">
              <button
                onClick={() => setShowRoomModal(false)}
                className="flex-1 px-8 py-4 rounded-3xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRooms}
                className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-3xl text-sm font-bold shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                Save All Room Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
