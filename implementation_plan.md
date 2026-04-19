# Kế hoạch triển khai Backend (Node.js & Express)

Nhằm tối ưu hóa luồng phát triển, chúng ta sẽ tạm gác phần AI Recommendation lại và tập trung xây dựng toàn bộ **Lõi Backend** trước. Backend sẽ cung cấp toàn bộ API cần thiết để Frontend hoạt động trơn tru.

## 1. Kiến trúc thư mục (Folder Structure)

Chúng ta sẽ áp dụng mô hình **3-tier Architecture (Controller - Service - Model)** để hệ thống dễ bảo trì và mở rộng sau này:

```text
backend/
├── prisma/               # Database Schema
├── src/
│   ├── config/           # Cấu hình (Environment, Prisma Client)
│   ├── controllers/      # Nhận request từ Router, validate dữ liệu, gọi Service
│   ├── services/         # Chứa Business Logic (gọi Prisma db, xử lý tính toán)
│   ├── routes/           # Định nghĩa các Endpoints (API URL)
│   ├── middlewares/      # Interceptor (Verify JWT, Xử lý lỗi tập trung)
│   ├── utils/            # Các hàm dùng chung (Băm Password, Tạo JWT, Format Date)
│   └── index.ts          # Entry point của App
```

## 2. Lộ trình phát triển API (Từng Phase)

Sẽ chia việc code Backend thành 4 Phase nhỏ từ dễ đến khó:

### Phase 1: Authentication & Users (Nền tảng bảo mật)
*Đây là phần bắt buộc phải có đầu tiên.*
- `POST /api/auth/register` - Đăng ký tài khoản (Băm mật khẩu bằng `bcryptjs`).
- `POST /api/auth/login` - Đăng nhập (Trả về JWT token).
- `GET /api/users/me` - Lấy thông tin user hiện tại (Yêu cầu JWT Middleware).
- `PUT /api/users/profile` - Cập nhật thông tin và `UserPreferences` (sở thích).

### Phase 2: Core Data (Locations, Attractions & Hotels)
*Cung cấp dữ liệu để hiển thị ra trang chủ Frontend.*
- `GET /api/locations` - Lấy danh sách địa điểm (Ví dụ: Đà Nẵng, Phú Quốc...).
- `GET /api/hotels` - Lấy danh sách khách sạn, (sau này có thể lọc, filter, pagination).
- `GET /api/hotels/:id` - Lấy chi tiết 1 khách sạn (bao gồm bảng Rooms, Images, Amenities...).
- `GET /api/attractions` - Lấy danh sách danh lam thắng cảnh.

### Phase 3: Booking System (Nghiệp vụ cốt lõi)
*Xử lý luồng khách hàng đặt phòng, thanh toán.*
- `POST /api/bookings` - Tạo đơn đặt phòng mới (Lưu vào bảng `Bookings` và `BookingDetails`).
- `GET /api/bookings/my-bookings` - Xem lịch sử đặt phòng của user.
- `PUT /api/bookings/:id/cancel` - Hủy đặt phòng.

### Phase 4: User Interactions & Promotions (Tương tác & Khuyến mãi)
- `POST /api/reviews` - Viết đánh giá khách sạn.
- `POST /api/favorites` - Lưu khách sạn yêu thích.
- `GET /api/coupons` - Lấy danh sách mã giảm giá.

## 3. Các Package bổ sung (Dependencies)

Để hỗ trợ lộ trình trên, Backend cần cài đặt thêm:
- `bcryptjs` (và `@types/bcryptjs`): Băm mật khẩu.
- `jsonwebtoken` (và `@types/jsonwebtoken`): Cấp phát và xác thực JWT.
- `joi` hoặc `zod`: Validate dữ liệu người dùng gửi lên.

## User Review Required
Bạn có đồng ý với Lộ trình phát triển API (4 Phase) và Kiến trúc thư mục phía trên không? 
Nếu bạn chốt, **tôi sẽ bắt tay vào cài đặt thư viện phụ thuộc và code Phase 1: Authentication & Users**.
