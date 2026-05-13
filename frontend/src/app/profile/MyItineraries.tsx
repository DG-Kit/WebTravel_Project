'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

export default function MyItineraries() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const response = await api.get('/itineraries/my');
      if (response.data.success) {
        setItineraries(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch itineraries', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('profile.itineraryProfile.deleteConfirm'))) return;
    try {
      const response = await api.delete(`/itineraries/${id}`);
      if (response.data.success) {
        showToast(t('profile.itineraryProfile.deleteSuccess'), 'success');
        fetchItineraries();
        if (selectedItinerary?.itinerary_id === id) setSelectedItinerary(null);
      }
    } catch (error) {
      showToast(t('profile.itineraryProfile.deleteError'), 'error');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  if (itineraries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">event_note</span>
        <h3 className="text-lg font-bold text-slate-900">{t('profile.itineraryProfile.noItineraries')}</h3>
        <p className="text-slate-500">{t('profile.itineraryProfile.createPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {itineraries.map((it) => (
          <div key={it.itinerary_id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="h-32 relative">
               <img 
                 src={it.hotel?.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80'} 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedItinerary(it)}
                      className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span> {t('profile.itineraryProfile.view')}
                    </button>
                    <button 
                      onClick={() => handleDelete(it.itinerary_id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span> {t('profile.itineraryProfile.delete')}
                    </button>
                  </div>
               </div>
            </div>
            <div className="p-4">
               <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{it.location?.name}</p>
                    <h4 className="font-bold text-slate-900 line-clamp-1">{it.hotel?.name}</h4>
                  </div>
               </div>
               <p className="text-xs text-slate-500 line-clamp-2 italic">
                 "{it.itinerary_data?.destination_summary}"
               </p>
               <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                  <span>{t('profile.itineraryProfile.savedOn')} {new Date(it.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span> {it.itinerary_data?.days?.length} {t('profile.itineraryProfile.days')}
                  </span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Itinerary Modal (Similar to Explore page) */}
      {selectedItinerary && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedItinerary(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{t('profile.itineraryProfile.modalTitle')}</h3>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">{selectedItinerary.location?.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedItinerary(null)} className="size-10 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="p-4 bg-amber-50 rounded-2xl italic text-amber-900 text-sm">
                "{selectedItinerary.itinerary_data?.destination_summary}"
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">bed</span>
                  <h4 className="font-bold">{t('profile.itineraryProfile.hotelSuggestion')}</h4>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50">
                   <p className="font-bold text-slate-900">{selectedItinerary.hotel?.name}</p>
                </div>
              </div>

              {selectedItinerary.itinerary_data?.days.map((day: any) => (
                <div key={day.day} className="space-y-4">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-primary">calendar_today</span>
                    {t('profile.itineraryProfile.day')} {day.day}
                  </div>
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20 ml-3">
                    {day.activities.map((act: any, idx: number) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute left-[-11px] top-1.5 size-4 rounded-full bg-white border-4 border-primary"></div>
                        <div className="text-xs font-bold text-primary mb-1">{act.time}</div>
                        <p className="font-bold text-slate-900 text-sm">{act.activity}</p>
                        <p className="text-xs text-slate-500">@ {act.location}</p>
                        <p className="text-xs text-slate-400 mt-1">{act.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
