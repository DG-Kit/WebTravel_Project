'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Review {
  review_id: string;
  rating: number;
  comment: string;
  created_at: string;
  hotel: {
    hotel_id: number;
    name: string;
    address: string;
  };
}

export default function MyReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/users/reviews');
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (hotelId: number, reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/hotels/${hotelId}/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r.review_id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">My Reviews</h1>
        <p className="text-sm text-slate-500">The feedback you've shared with the community.</p>
      </div>

      {reviews.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
          <span className="material-symbols-outlined text-5xl mb-4 opacity-20">rate_review</span>
          <p>You haven't written any reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.review_id} className="glass-card bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Link href={`/hotels/${review.hotel.hotel_id}`} className="font-bold text-lg text-slate-900 hover:text-primary transition-colors">
                    {review.hotel.name}
                  </Link>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {review.hotel.address}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[18px]">
                        {i < review.rating ? 'star' : 'star_outline'}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm italic border-l-4 border-primary/20">
                "{review.comment}"
              </div>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleDelete(review.hotel.hotel_id, review.review_id)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
