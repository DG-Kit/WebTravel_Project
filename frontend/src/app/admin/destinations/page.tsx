'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';

interface Location {
  location_id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  image_url?: string;
}

interface Attraction {
  attraction_id: number;
  name: string;
  category: string;
  description: string;
  popularity_score: number;
  location_id: number;
}

export default function AdminDestinationsPage() {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Location Modal State
  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locFormData, setLocFormData] = useState({ name: '', country: '', latitude: 0, longitude: 0, image_url: '' });
  
  // Attraction Sidebar State
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);
  
  // Attraction Modal State
  const [showAttModal, setShowAttModal] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);
  const [attFormData, setAttFormData] = useState({ name: '', category: '', description: '', popularity_score: 5 });
  
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/locations');
      if (response.data.success) {
        setLocations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttractions = async (locId: number) => {
    try {
      setLoadingAttractions(true);
      const response = await api.get(`/attractions?location_id=${locId}`);
      if (response.data.success) {
        setAttractions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch attractions:', error);
    } finally {
      setLoadingAttractions(false);
    }
  };

  const handleManageAttractions = (loc: Location) => {
    setSelectedLocation(loc);
    fetchAttractions(loc.location_id);
  };

  // Location CRUD
  const openAddLocModal = () => {
    setEditingLocation(null);
    setLocFormData({ name: '', country: '', latitude: 0, longitude: 0, image_url: '' });
    setShowLocModal(true);
  };

  const handleLocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.location_id}`, locFormData);
        setLocations(prev => prev.map(l => l.location_id === editingLocation.location_id ? { ...l, ...locFormData } : l));
        showToast('Location updated successfully', 'success');
      } else {
        const res = await api.post('/locations', locFormData);
        setLocations(prev => [...prev, res.data.data]);
        showToast('Location added successfully', 'success');
      }
      setShowLocModal(false);
    } catch (error) { showToast('Failed to save location', 'error'); } finally { setFormLoading(false); }
  };

  // Attraction CRUD
  const openAddAttModal = () => {
    setEditingAttraction(null);
    setAttFormData({ name: '', category: 'Sightseeing', description: '', popularity_score: 5 });
    setShowAttModal(true);
  };

  const handleAttSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    try {
      setFormLoading(true);
      const data = { ...attFormData, location_id: selectedLocation.location_id };
      if (editingAttraction) {
        await api.put(`/attractions/${editingAttraction.attraction_id}`, data);
        setAttractions(prev => prev.map(a => a.attraction_id === editingAttraction.attraction_id ? { ...a, ...attFormData } : a));
        showToast('Attraction updated successfully', 'success');
      } else {
        const res = await api.post('/attractions', data);
        setAttractions(prev => [...prev, res.data.data]);
        showToast('Attraction added successfully', 'success');
      }
      setShowAttModal(false);
    } catch (error) { showToast('Failed to save attraction', 'error'); } finally { setFormLoading(false); }
  };

  const handleDeleteAttraction = async (id: number) => {
    if (!confirm('Delete this attraction?')) return;
    try {
      const response = await api.delete(`/attractions/${id}`);
      if (response.data.success) {
        fetchDestinations();
        setAttractions(prev => prev.filter(a => a.attraction_id !== id));
      }
    } catch (error) { 
      showToast('Failed to delete attraction', 'error'); 
    }
  };

  if (loading) return <div className="animate-pulse bg-slate-200 h-64 rounded-2xl"></div>;

  return (
    <div className="relative min-h-screen">
      <div className={`space-y-6 transition-all duration-500 ${selectedLocation ? 'pr-[450px]' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Destinations & Attractions</h3>
            <p className="text-slate-500">Manage global locations and their points of interest.</p>
          </div>
          <button onClick={openAddLocModal} className="bg-rose-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">
            <span className="material-symbols-outlined">add_location</span>
            Add Location
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {locations.map(loc => (
            <div key={loc.location_id} className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden group ${selectedLocation?.location_id === loc.location_id ? 'border-rose-500 ring-4 ring-rose-500/10 shadow-xl' : 'border-slate-200 shadow-sm'}`}>
              <div className="h-40 bg-slate-100 relative">
                 <img src={loc.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'} className="w-full h-full object-cover" alt={loc.name} />
                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => handleManageAttractions(loc)} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all shadow-lg">Manage Attractions</button>
                 </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{loc.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{loc.country}</p>
                </div>
                <button onClick={() => { setEditingLocation(loc); setLocFormData({ name: loc.name, country: loc.country, latitude: loc.latitude, longitude: loc.longitude, image_url: loc.image_url || '' }); setShowLocModal(true); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attractions Sidebar */}
      {selectedLocation && (
        <aside className="fixed top-20 right-0 bottom-0 w-[450px] bg-white border-l border-slate-200 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <div>
                <h4 className="font-bold text-slate-900">Attractions in {selectedLocation.name}</h4>
                <p className="text-xs text-slate-400">Manage points of interest for this location</p>
             </div>
             <button onClick={() => setSelectedLocation(null)} className="size-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
               <span className="material-symbols-outlined">close</span>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
             <button onClick={openAddAttModal} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-rose-500 hover:text-rose-500 transition-all flex flex-col items-center gap-1">
                <span className="material-symbols-outlined">add_circle</span>
                <span className="text-xs font-bold uppercase tracking-widest">Add New Attraction</span>
             </button>

             {loadingAttractions ? (
               <div className="space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>)}</div>
             ) : attractions.length === 0 ? (
               <div className="text-center py-20 text-slate-300">
                  <span className="material-symbols-outlined text-5xl mb-2">map</span>
                  <p className="text-sm font-medium">No attractions found</p>
               </div>
             ) : (
               attractions.map(att => (
                 <div key={att.attraction_id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group">
                    <div className="flex items-start justify-between mb-2">
                       <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold text-rose-500 border border-rose-100 uppercase">{att.category}</span>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingAttraction(att); setAttFormData({ name: att.name, category: att.category, description: att.description, popularity_score: att.popularity_score }); setShowAttModal(true); }} className="size-7 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDeleteAttraction(att.attraction_id)} className="size-7 bg-white rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 shadow-sm transition-colors">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                       </div>
                    </div>
                    <h5 className="font-bold text-slate-900 mb-1">{att.name}</h5>
                    <p className="text-xs text-slate-500 line-clamp-2">{att.description}</p>
                    <div className="mt-3 flex items-center gap-1">
                       <span className="material-symbols-outlined text-[10px] text-amber-500">star</span>
                       <span className="text-[10px] font-bold text-slate-400">Score: {att.popularity_score}</span>
                    </div>
                 </div>
               ))
             )}
          </div>
        </aside>
      )}

      {/* Location Modal */}
      {showLocModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">{editingLocation ? 'Edit Destination' : 'Add New Destination'}</h4>
              <button onClick={() => setShowLocModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleLocSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Location Name" value={locFormData.name} onChange={v => setLocFormData({ ...locFormData, name: v })} />
                <InputGroup label="Country" value={locFormData.country} onChange={v => setLocFormData({ ...locFormData, country: v })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Latitude" type="number" value={locFormData.latitude.toString()} onChange={v => setLocFormData({ ...locFormData, latitude: parseFloat(v) })} />
                <InputGroup label="Longitude" type="number" value={locFormData.longitude.toString()} onChange={v => setLocFormData({ ...locFormData, longitude: parseFloat(v) })} />
              </div>
              <InputGroup label="Image URL" type="url" value={locFormData.image_url} onChange={v => setLocFormData({ ...locFormData, image_url: v })} />
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowLocModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attraction Modal */}
      {showAttModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">{editingAttraction ? 'Edit Attraction' : 'Add New Attraction'}</h4>
              <button onClick={() => setShowAttModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleAttSubmit} className="p-6 space-y-4">
              <InputGroup label="Attraction Name" value={attFormData.name} onChange={v => setAttFormData({ ...attFormData, name: v })} />
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                <select value={attFormData.category} onChange={e => setAttFormData({ ...attFormData, category: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm">
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Museum">Museum</option>
                  <option value="Beach">Beach</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                <textarea value={attFormData.description} onChange={e => setAttFormData({ ...attFormData, description: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none text-sm h-24 resize-none" />
              </div>
              <InputGroup label="Popularity Score (1-10)" type="number" value={attFormData.popularity_score.toString()} onChange={v => setAttFormData({ ...attFormData, popularity_score: parseFloat(v) })} />
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAttModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold">Cancel</button>
                <button type="submit" disabled={formLoading} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, value, onChange, type = 'text' }: { label: string, value: string, onChange: (v: string) => void, type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-sm" 
      />
    </div>
  );
}
