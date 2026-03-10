## WebTravel - Hệ thống web đặt vé du lịch kết hợp AI gợi ý

WebTravel là hệ thống web hỗ trợ người dùng **tìm kiếm và đặt vé du lịch** kèm theo **gợi ý địa điểm cá nhân hóa** dựa trên nhu cầu, sở thích, thời gian đi - về và mức độ phổ biến của điểm đến. Mục tiêu là giúp người dùng lựa chọn hành trình phù hợp một cách **nhanh chóng, tiện lợi và thông minh**.

## Mục tiêu & phạm vi

- **Mục tiêu**:
  - Xây dựng website đặt vé du lịch.
  - Phát triển hệ thống gợi ý địa điểm du lịch cá nhân hóa.
  - Ứng dụng AI để nâng cao chất lượng gợi ý và trải nghiệm người dùng.
  - Đánh giá hiệu quả hệ thống thông qua các chỉ số phù hợp.

- **Phạm vi**:
  - Người dùng cá nhân, gia đình, cặp đôi.
  - Dữ liệu địa điểm du lịch trong phạm vi mô phỏng.
  - Hệ thống triển khai dưới dạng web.

## Chức năng chính

- **Tài khoản người dùng**: đăng ký, đăng nhập, xác thực.
- **Nhập nhu cầu du lịch**: thời gian đi - về, sở thích, loại hình du lịch,...
- **Gợi ý địa điểm du lịch**: danh sách địa điểm phù hợp theo mức độ cá nhân hóa.
- **Đặt vé du lịch (mô phỏng)**: chọn địa điểm, nhập thông tin, lưu lịch sử đặt vé.
- **Xem lịch sử đặt vé**: tra cứu lại các giao dịch đã thực hiện.

## Công nghệ sử dụng

- **Frontend**: React / Next.js.
- **Backend**: Node.js (Express), JWT cho xác thực.
- **AI Service**: Python (FastAPI, Numpy, Pandas, Scikit-learn,...).
- **Cơ sở dữ liệu**: MSSQL.
- **Tích hợp API**: Map API, Weather API (phục vụ hiển thị bản đồ, thông tin thời tiết,...).

## Kiến trúc & luồng hoạt động

- **Thành phần hệ thống**:
  - `Frontend`: giao diện web cho người dùng.
  - `Backend API`: xử lý nghiệp vụ, xác thực, giao tiếp với AI Service và database.
  - `AI Recommendation Service`: tính toán điểm phù hợp và gợi ý địa điểm.
  - `Database`: lưu thông tin người dùng, địa điểm, lịch sử đặt vé,...

- **Luồng gợi ý cơ bản**:
  1. Người dùng nhập nhu cầu du lịch trên giao diện web.
  2. Frontend gửi dữ liệu lên Backend API.
  3. Backend gọi AI Service để tính toán gợi ý địa điểm.
  4. AI Service trả về danh sách địa điểm được xếp hạng theo độ phù hợp.
  5. Backend lưu lịch sử và trả kết quả cho Frontend hiển thị.

## Cá nhân hóa gợi ý

Hệ thống áp dụng các phương pháp:

- **Content-based Recommendation**: so sánh nhu cầu, sở thích người dùng với đặc trưng từng địa điểm.
- **Rule-based Scoring**: tính điểm dựa trên các luật (thời gian, loại hình, ngân sách,...).
- **Collaborative Filtering (nâng cao)**: gợi ý dựa trên hành vi, đánh giá của nhóm người dùng tương tự.

Ví dụ mô hình tính điểm (Personalization Score):

\[
Personalization\ Score = 0.4 \times Nhu\ cầu + 0.3 \times Phù\ hợp\ thời\ gian + 0.2 \times Mức\ độ\ phổ\ biến + 0.1 \times Đánh\ giá\ người\ dùng
\]

Trọng số có thể điều chỉnh linh hoạt theo yêu cầu hệ thống.

## Bảo mật, hiệu năng và mở rộng

- **Bảo mật & hiệu năng**:
  - Sử dụng JWT cho xác thực.
  - Mã hóa mật khẩu người dùng.
  - Phân quyền truy cập theo vai trò.
  - Cache các địa điểm phổ biến, giới hạn số lượng gợi ý.
  - Tối ưu truy vấn vào database.

- **Khả năng mở rộng**:
  - Tích hợp **chatbot AI tư vấn du lịch**.
  - Gợi ý theo thời gian thực dựa trên ngữ cảnh.
  - Kết hợp dữ liệu thời tiết để tinh chỉnh gợi ý.

---

README này chỉ mô tả **tổng quan ý tưởng và kiến trúc hệ thống**. Khi dự án phát triển thêm, có thể bổ sung:

- Hướng dẫn cài đặt & chạy dự án.
- Cấu trúc thư mục mã nguồn.
- API docs chi tiết cho Backend và AI Service.
