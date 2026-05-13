'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface Hotel {
  hotel_id: number;
  name: string;
  address: string;
  star_rating: number;
  average_rating: number;
  is_active: boolean;
  owner: {
    user_id: number;
    full_name: string;
    email: string;
  };
  location: {
    name: string;
  };
  images: {
    image_id: number;
    image_url: string;
  }[];
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80';

export default function AdminHotelsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auxiliary data for form selection
  const [allLocations, setAllLocations] = useState<{location_id: number, name: string}[]>([]);
  const [allUsers, setAllUsers] = useState<{user_id: number, full_name: string, role: string}[]>([]);

  // Filter states
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterStars, setFilterStars] = useState('All');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    star_rating: 0,
    is_active: true,
    image_urls: [] as string[]
  });

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    address: '',
    location_id: 0,
    owner_id: 0,
    star_rating: 3,
    description: '',
    is_active: true,
    image_urls: [] as string[]
  });

  // Room Management Modal State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomHotel, setRoomHotel] = useState<Hotel | null>(null);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);

  const [newImageUrl, setNewImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHotels();
      fetchAuxData();
    }
  }, [user]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
      const url = isAdmin ? '/hotels' : `/hotels?owner_id=${user?.user_id}`;
      
      const response = await api.get(url);
      if (response.data.success) {
        setHotels(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
      const locRes = await api.get('/locations');
      if (locRes.data.success) setAllLocations(locRes.data.data);
      
      if (isAdmin) {
        const userRes = await api.get('/users');
        if (userRes.data.success) setAllUsers(userRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch auxiliary data:', error);
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setEditFormData({
      name: hotel.name,
      address: hotel.address,
      star_rating: hotel.star_rating,
      is_active: hotel.is_active,
      image_urls: hotel.images.map(img => img.image_url)
    });
    setShowEditModal(true);
  };

  const handleManageRooms = async (hotel: Hotel) => {
    try {
      setSubmitting(true);
      const response = await api.get(`/hotels/${hotel.hotel_id}`);
      if (response.data.success) {
        setRoomHotel(hotel);
        const rooms = response.data.data.rooms.map((r: any) => ({
          ...r,
          image_urls: r.images?.map((img: any) => img.image_url) || []
        }));
        setHotelRooms(rooms);
        setShowRoomModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addImageToEdit = () => {
    if (newImageUrl.trim()) {
      setEditFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const removeImageFromEdit = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index)
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;

    try {
      setSubmitting(true);
      const response = await api.put(`/hotels/${editingHotel.hotel_id}`, editFormData);
      if (response.data.success) {
        await fetchHotels();
        setShowEditModal(false);
        setEditingHotel(null);
      }
    } catch (error) {
      console.error('Update failed:', error);
      showToast('Failed to update hotel', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRooms = async () => {
    if (!roomHotel) return;
    try {
      setSubmitting(true);
      // Clean up rooms for submission
      const roomsToSubmit = hotelRooms.map(r => ({
        room_type: r.room_type,
        price: Number(r.price),
        capacity: Number(r.capacity),
        is_available: r.is_available,
        image_urls: r.image_urls
      }));

      const response = await api.put(`/hotels/${roomHotel.hotel_id}`, { rooms: roomsToSubmit });
      if (response.data.success) {
        showToast('Rooms updated successfully!', 'success');
        setShowRoomModal(false);
        fetchHotels();
      }
    } catch (error) {
      console.error('Room update failed:', error);
      showToast('Failed to update rooms', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const finalOwnerId = isAdmin ? addFormData.owner_id : user?.user_id;

    if (!addFormData.location_id || !finalOwnerId) {
      showToast('Please select a Location' + (isAdmin ? ' and an Owner' : ''), 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/hotels', {
        ...addFormData,
        owner_id: finalOwnerId
      });
      if (response.data.success) {
        await fetchHotels();
        setShowAddModal(false);
        setAddFormData({
          name: '',
          address: '',
          location_id: 0,
          owner_id: 0,
          star_rating: 3,
          description: '',
          is_active: true,
          image_urls: []
        });
      }
    } catch (error: any) {
      console.error('Add failed:', error);
      showToast(error.response?.data?.message || 'Failed to add hotel', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHotelStatus = async (hotelId: number, currentStatus: boolean) => {
    try {
      const response = await api.put(`/hotels/${hotelId}`, { is_active: !currentStatus });
      if (response.data.success) {
        setHotels(prev => prev.map(h => h.hotel_id === hotelId ? { ...h, is_active: !currentStatus } : h));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const locationsList = ['All', ...Array.from(new Set(hotels.map(h => h.location?.name).filter(Boolean)))];

  const filteredHotels = hotels.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === 'All' || h.location?.name === filterLocation;
    const matchesStatus = filterStatus === 'All' || (filterStatus === 'Active' ? h.is_active : !h.is_active);
    const matchesStars = filterStars === 'All' || h.star_rating.toString() === filterStars;
    
    return matchesSearch && matchesLocation && matchesStatus && matchesStars;
  });

  if (loading) {
    return <div className="animate-pulse space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">All Properties</h3>
          <p className="text-slate-500 text-sm">Monitor and manage all hotel listings on the platform.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined">add</span>
            Add Property
          </button>
           <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">location_on</span>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="outline-none text-xs font-medium bg-transparent">
              {locationsList.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">star</span>
            <select value={filterStars} onChange={e => setFilterStars(e.target.value)} className="outline-none text-xs font-medium bg-transparent">
              <option value="All">All Stars</option>
              {[1,2,3,4,5].map(s => <option key={s} value={s.toString()}>{s} Stars</option>)}
            </select>
          </div>
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">visibility</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="outline-none text-xs font-medium bg-transparent">
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Hidden">Hidden</option>
            </select>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input 
              type="text" 
              placeholder="Search name/address..." 
              className="outline-none text-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
              <th className="px-6 py-4">Hotel Info</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Ratings</th>
              <th className="px-6 py-4 text-center">Images</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHotels.map(hotel => (
              <tr key={hotel.hotel_id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                         <img 
                          src={hotel.images[0]?.image_url || FALLBACK_IMG} 
                          className="w-full h-full object-cover" 
                          alt="" 
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                         />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{hotel.name}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{hotel.address}</div>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{hotel.location?.name}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">{hotel.owner?.full_name}</div>
                  <div className="text-[10px] text-slate-400">{hotel.owner?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-[10px]">
                      <span className="material-symbols-outlined text-[10px]">star</span>
                      <span>{hotel.star_rating}★</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-bold text-[10px]">
                      <span className="material-symbols-outlined text-[10px]">reviews</span>
                      <span>{hotel.average_rating || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">
                     {hotel.images.length} Photos
                   </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleHotelStatus(hotel.hotel_id, hotel.is_active)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${hotel.is_active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {hotel.is_active ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleManageRooms(hotel)}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Manage Rooms"
                      >
                        <span className="material-symbols-outlined text-xl">bed</span>
                      </button>
                      <Link href={`/hotels/${hotel.hotel_id}`} target="_blank" className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </Link>
                      <button 
                        onClick={() => handleEdit(hotel)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredHotels.length === 0 && (
          <div className="py-20 text-center text-slate-400">
             <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
             <p className="text-sm font-medium">No properties found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Room Management Modal */}
      {showRoomModal && roomHotel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50 shrink-0">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">bed</span>
                  Manage Rooms: {roomHotel.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1">Configure room types, pricing, and availability.</p>
              </div>
              <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
               <div className="space-y-6">
                  {hotelRooms.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-white">
                      <span className="material-symbols-outlined text-5xl mb-3 text-slate-200">hotel_class</span>
                      <p className="text-sm font-medium">No rooms added yet. Add your first room below.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {hotelRooms.map((room, idx) => (
                        <div key={idx} className="p-5 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-sm relative group">
                          <button 
                            type="button"
                            onClick={() => setHotelRooms(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Room"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                          
                          <div className="flex flex-col sm:flex-row gap-6">
                            <div className="w-full sm:w-32 space-y-3 shrink-0">
                               <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden ring-1 ring-slate-200">
                                 <img src={room.image_urls[0] || FALLBACK_IMG} className="w-full h-full object-cover" alt="" 
                                   onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                               </div>
                               <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                  {room.image_urls.map((url: string, i: number) => (
                                    <div key={i} className="size-8 rounded-md border border-slate-200 overflow-hidden shrink-0 relative group/img">
                                      <img src={url} className="w-full h-full object-cover" alt="" />
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const newRooms = [...hotelRooms];
                                          newRooms[idx].image_urls = newRooms[idx].image_urls.filter((_: any, imgIdx: number) => imgIdx !== i);
                                          setHotelRooms(newRooms);
                                        }}
                                        className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[8px]"
                                      >
                                        <span className="material-symbols-outlined text-[10px]">close</span>
                                      </button>
                                    </div>
                                  ))}
                               </div>
                               <div className="flex gap-1">
                                  <input 
                                    type="text" 
                                    placeholder="Add Img URL" 
                                    className="w-full px-2 py-1 text-[10px] border border-slate-200 rounded-lg outline-none focus:border-indigo-300"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (val) {
                                          const newRooms = [...hotelRooms];
                                          newRooms[idx].image_urls = [...(newRooms[idx].image_urls || []), val];
                                          setHotelRooms(newRooms);
                                          (e.target as HTMLInputElement).value = '';
                                        }
                                      }
                                    }}
                                  />
                               </div>
                            </div>

                            <div className="flex-1 space-y-4">
                               <div>
                                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Room Type</label>
                                 <input 
                                   type="text" 
                                   value={room.room_type} 
                                   onChange={e => {
                                     const newRooms = [...hotelRooms];
                                     newRooms[idx].room_type = e.target.value;
                                     setHotelRooms(newRooms);
                                   }}
                                   placeholder="Room Type (e.g. Deluxe Suite)"
                                   className="w-full font-bold text-slate-900 border border-slate-100 bg-slate-50/50 rounded-xl px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                                 />
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Price/Night</label>
                                    <div className="flex items-center gap-2 bg-slate-50/50 rounded-xl px-3 py-2 border border-slate-100">
                                      <span className="text-indigo-600 font-bold">$</span>
                                      <input 
                                        type="number" 
                                        value={room.price} 
                                        onChange={e => {
                                          const newRooms = [...hotelRooms];
                                          newRooms[idx].price = e.target.value;
                                          setHotelRooms(newRooms);
                                        }}
                                        className="w-full bg-transparent border-none outline-none p-0 text-sm font-bold text-indigo-600 focus:ring-0"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Capacity</label>
                                    <div className="flex items-center gap-2 bg-slate-50/50 rounded-xl px-3 py-2 border border-slate-100">
                                      <span className="material-symbols-outlined text-sm text-slate-400">group</span>
                                      <input 
                                        type="number" 
                                        value={room.capacity} 
                                        onChange={e => {
                                          const newRooms = [...hotelRooms];
                                          newRooms[idx].capacity = e.target.value;
                                          setHotelRooms(newRooms);
                                        }}
                                        className="w-full bg-transparent border-none outline-none p-0 text-sm font-bold text-slate-600 focus:ring-0"
                                      />
                                    </div>
                                  </div>
                               </div>

                               <div className="flex items-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newRooms = [...hotelRooms];
                                      newRooms[idx].is_available = !newRooms[idx].is_available;
                                      setHotelRooms(newRooms);
                                    }}
                                    className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${room.is_available ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}
                                  >
                                    {room.is_available ? 'Available' : 'Booked/Hidden'}
                                  </button>
                               </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">add_circle</span>
                       Add New Room Type
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block ml-1">Type</label>
                        <input type="text" id="new-room-type" placeholder="Deluxe, Suite..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block ml-1">Price ($)</label>
                        <input type="number" id="new-room-price" placeholder="99" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block ml-1">Guests</label>
                        <input type="number" id="new-room-cap" placeholder="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all" />
                      </div>
                      <div className="flex items-end">
                        <button 
                          type="button"
                          onClick={() => {
                            const type = (document.getElementById('new-room-type') as HTMLInputElement).value;
                            const price = (document.getElementById('new-room-price') as HTMLInputElement).value;
                            const cap = (document.getElementById('new-room-cap') as HTMLInputElement).value;
                            if (type && price && cap) {
                              setHotelRooms([...hotelRooms, { room_type: type, price, capacity: cap, is_available: true, image_urls: [] }]);
                              (document.getElementById('new-room-type') as HTMLInputElement).value = '';
                              (document.getElementById('new-room-price') as HTMLInputElement).value = '';
                              (document.getElementById('new-room-cap') as HTMLInputElement).value = '';
                            } else {
                              showToast('Please fill all room fields', 'warning');
                            }
                          }}
                          className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                        >
                          <span className="material-symbols-outlined text-sm">add</span> Add Room
                        </button>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
            <div className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0">
              <button type="button" onClick={() => setShowRoomModal(false)} className="px-8 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors text-sm text-slate-600">Cancel</button>
              <button type="button" onClick={handleUpdateRooms} disabled={submitting} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm">
                {submitting ? (
                  <><span className="animate-spin material-symbols-outlined text-sm">sync</span> Saving Changes...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">save</span> Save All Rooms Configuration</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-primary/5">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_business</span>
                Add New Property
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="overflow-y-auto max-h-[80vh]">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hotel Name</label>
                        <input 
                          type="text" 
                          value={addFormData.name} 
                          onChange={e => setAddFormData({ ...addFormData, name: e.target.value })} 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm" 
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                        <textarea 
                          value={addFormData.address} 
                          onChange={e => setAddFormData({ ...addFormData, address: e.target.value })} 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm h-20 resize-none" 
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</label>
                          <select 
                            value={addFormData.location_id} 
                            onChange={e => setAddFormData({ ...addFormData, location_id: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                            required
                          >
                            <option value="0">Select Location</option>
                            {allLocations.map(loc => <option key={loc.location_id} value={loc.location_id}>{loc.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Owner</label>
                          {user?.role?.toUpperCase() === 'ADMIN' ? (
                            <select 
                              value={addFormData.owner_id} 
                              onChange={e => setAddFormData({ ...addFormData, owner_id: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                              required
                            >
                              <option value="0">Select Owner</option>
                              {allUsers.map(user => <option key={user.user_id} value={user.user_id}>{user.full_name} ({user.role})</option>)}
                            </select>
                          ) : (
                            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-600">
                              {user?.full_name} (Me)
                            </div>
                          )}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Star Rating</label>
                            <select 
                              value={addFormData.star_rating} 
                              onChange={e => setAddFormData({ ...addFormData, star_rating: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                            >
                              {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} Stars</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</label>
                            <select 
                              value={addFormData.is_active ? 'true' : 'false'} 
                              onChange={e => setAddFormData({ ...addFormData, is_active: e.target.value === 'true' })}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                            >
                              <option value="true">Active</option>
                              <option value="false">Hidden</option>
                            </select>
                          </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Images URLs (JSON Array or list)</label>
                         <div className="flex gap-2">
                           <input 
                              type="text" 
                              placeholder="Add image URL..." 
                              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-primary"
                              value={newImageUrl}
                              onChange={e => setNewImageUrl(e.target.value)}
                           />
                           <button 
                              type="button" 
                              onClick={() => {
                                if (newImageUrl.trim()) {
                                  setAddFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, newImageUrl.trim()] }));
                                  setNewImageUrl('');
                                }
                              }}
                              className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
                           >Add</button>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-2">
                            {addFormData.image_urls.map((url, i) => (
                              <div key={i} className="relative size-12 rounded-lg border overflow-hidden group">
                                <img src={url} className="w-full h-full object-cover" alt="" />
                                <button 
                                  type="button" 
                                  onClick={() => setAddFormData(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, idx) => idx !== i) }))}
                                  className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold hover:bg-white transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                  {submitting ? 'Creating...' : 'Create Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Edit Property Details
              </h4>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="overflow-y-auto max-h-[80vh]">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hotel Name</label>
                        <input 
                          type="text" 
                          value={editFormData.name} 
                          onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm" 
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Address</label>
                        <textarea 
                          value={editFormData.address} 
                          onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-sm h-20 resize-none" 
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Star Rating</label>
                          <select 
                            value={editFormData.star_rating} 
                            onChange={e => setEditFormData({ ...editFormData, star_rating: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                          >
                            {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} Stars</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visibility</label>
                          <select 
                            value={editFormData.is_active ? 'true' : 'false'} 
                            onChange={e => setEditFormData({ ...editFormData, is_active: e.target.value === 'true' })}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm"
                          >
                            <option value="true">Active</option>
                            <option value="false">Hidden</option>
                          </select>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Media Gallery</label>
                      <div className="grid grid-cols-3 gap-2">
                        {editFormData.image_urls.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                             <img src={url} className="w-full h-full object-cover" alt="" />
                             <button 
                               type="button" 
                               onClick={() => removeImageFromEdit(idx)}
                               className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                             >
                               <span className="material-symbols-outlined">delete</span>
                             </button>
                          </div>
                        ))}
                        <div className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                           <span className="material-symbols-outlined">image</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Paste new image URL..." 
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-primary"
                          value={newImageUrl}
                          onChange={e => setNewImageUrl(e.target.value)}
                        />
                        <button 
                          type="button" 
                          onClick={addImageToEdit}
                          className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
                        >Add</button>
                      </div>
                   </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold hover:bg-white transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
