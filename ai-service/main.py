from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import uvicorn
import numpy as np

app = FastAPI(title="WebTravel AI Recommendation Service")

class HotelInput(BaseModel):
    id: int
    name: str
    price: float
    tags: List[str]
    rating: float

class RecommendRequest(BaseModel):
    user_interests: str  # Comma separated tags
    budget_level: int    # 1: Budget, 2: Mid, 3: Luxury
    hotels: List[HotelInput]

@app.get("/")
def read_root():
    return {"message": "AI Recommendation Service is online"}

@app.post("/recommend")
async def recommend(request: RecommendRequest):
    if not request.hotels:
        return {"success": True, "data": []}

    # 1. Prepare Data for Content-Based Filtering
    # Combine tags into a single string for each hotel
    hotel_data = []
    for h in request.hotels:
        hotel_data.append({
            "id": h.id,
            "tags_str": " ".join([t.replace("-", "").replace(" ", "") for t in h.tags]),
            "price": h.price,
            "rating": h.rating
        })
    
    df = pd.DataFrame(hotel_data)
    
    # Preprocess user interests
    user_interests_clean = request.user_interests.replace(",", " ").replace("-", "").replace(" ", " ")
    
    # 2. Calculate Content Similarity (Cosine Similarity)
    try:
        vectorizer = CountVectorizer()
        # Add user interests to the list of documents to vectorize together
        all_docs = df['tags_str'].tolist() + [user_interests_clean]
        matrix = vectorizer.fit_transform(all_docs)
        
        # Last row is the user vector
        user_vector = matrix[-1]
        hotel_matrix = matrix[:-1]
        
        # Calculate similarity between user and all hotels
        similarities = cosine_similarity(user_vector, hotel_matrix)[0]
    except Exception as e:
        print(f"Vectorization error: {e}")
        similarities = [0.0] * len(df)

    # 3. Calculate Rule-Based Scores (Budget & Rating)
    results = []
    for i, row in df.iterrows():
        sim_score = similarities[i]
        
        # Budget Score (0.0 to 1.0)
        # Budget 1 (<50), 2 (50-200), 3 (>200)
        h_budget = 1 if row['price'] < 50 else (2 if row['price'] <= 200 else 3)
        budget_score = 1.0 if h_budget == request.budget_level else (0.5 if abs(h_budget - request.budget_level) == 1 else 0.2)
        
        # Popularity/Rating Score (Normalized 0.0 to 1.0)
        rating_score = row['rating'] / 5.0
        
        # 4. Final Weighted Blend (Weights from README)
        # 0.4 Needs (Similarity) + 0.3 Rules (Budget) + 0.2 Popularity + 0.1 Rating
        # Simplified for now: 0.6 Similarity + 0.3 Budget + 0.1 Rating
        final_score = (sim_score * 0.6) + (budget_score * 0.3) + (rating_score * 0.1)
        
        results.append({
            "id": int(row['id']),
            "score": float(final_score)
        })

    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)

    return {
        "success": True,
        "data": results
    }

class ItineraryRequest(BaseModel):
    user_interests: str
    budget_level: int
    hotels: List[dict]
    attractions: List[dict]

@app.post("/generate-itinerary")
async def generate_itinerary(request: ItineraryRequest):
    try:
        if not request.hotels or not request.attractions:
             return {"success": False, "message": "Dữ liệu khách sạn hoặc địa điểm không đủ."}

        # 1. Rank Hotels
        hotel_data = []
        for h in request.hotels:
            hotel_data.append({
                "id": h["id"],
                "name": h["name"],
                "price": float(h["price"]),
                "tags_str": " ".join(h.get("tags", [])),
                "rating": float(h.get("rating", 0))
            })
        
        df_hotels = pd.DataFrame(hotel_data)
        user_interests_clean = request.user_interests.replace(",", " ").lower()
        
        vectorizer = CountVectorizer()
        all_h_tags = df_hotels['tags_str'].tolist() + [user_interests_clean]
        h_matrix = vectorizer.fit_transform(all_h_tags)
        h_sims = cosine_similarity(h_matrix[-1], h_matrix[:-1])[0]
        
        # Select best hotel
        best_hotel_idx = np.argmax(h_sims)
        best_hotel = request.hotels[best_hotel_idx]

        # 2. Rank Attractions
        attr_data = []
        for a in request.attractions:
            attr_data.append({
                "id": a["id"],
                "name": a["name"],
                "tags_str": " ".join(a.get("tags", [])),
                "popularity": float(a.get("popularity", 0))
            })
        
        df_attrs = pd.DataFrame(attr_data)
        all_a_tags = df_attrs['tags_str'].tolist() + [user_interests_clean]
        a_matrix = vectorizer.fit_transform(all_a_tags)
        a_sims = cosine_similarity(a_matrix[-1], a_matrix[:-1])[0]
        
        # Add sims to df and sort
        df_attrs['sim'] = a_sims
        top_attrs_indices = df_attrs.sort_values(by='sim', ascending=False).head(4).index.tolist()
        selected_attrs = [request.attractions[i] for i in top_attrs_indices]

        # 3. Build Daily Plan (Simulated for 2 days)
        itinerary = {
            "destination_summary": f"Một chuyến đi hoàn hảo kết hợp giữa {request.user_interests.split(',')[0]} và trải nghiệm địa phương.",
            "hotel": best_hotel,
            "days": [
                {
                    "day": 1,
                    "activities": [
                        {"time": "09:00", "activity": "Check-in & Khởi động", "location": best_hotel["name"], "desc": "Nhận phòng và nghỉ ngơi sau chuyến đi."},
                        {"time": "14:00", "activity": "Khám phá điểm đến", "location": selected_attrs[0]["name"] if len(selected_attrs) > 0 else "Điểm tham quan địa phương", "desc": "Bắt đầu hành trình khám phá nét đặc trưng nhất."},
                        {"time": "19:00", "activity": "Ăn tối & Dạo phố", "location": "Khu trung tâm", "desc": "Thưởng thức ẩm thực và không khí về đêm."}
                    ]
                },
                {
                    "day": 2,
                    "activities": [
                        {"time": "08:30", "activity": "Trải nghiệm văn hóa", "location": selected_attrs[1]["name"] if len(selected_attrs) > 1 else "Điểm tham quan thứ 2", "desc": "Tìm hiểu sâu hơn về con người và lịch sử."},
                        {"time": "13:30", "activity": "Thư giãn & Mua sắm", "location": selected_attrs[2]["name"] if len(selected_attrs) > 2 else "Khu mua sắm", "desc": "Mua quà lưu niệm và tận hưởng không gian thư giãn."},
                        {"time": "16:00", "activity": "Kết thúc hành trình", "location": "Điểm tập kết", "desc": "Chuẩn bị hành lý và chào tạm biệt."}
                    ]
                }
            ]
        }

        return {"success": True, "data": itinerary}
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
