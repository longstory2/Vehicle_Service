# Server API

## Đăng ký và phê duyệt kỹ thuật viên

Ứng viên gửi hồ sơ từ ứng dụng mobile bằng `POST /api/auth/register-technician` với
`fullName`, `phone`, `email` và `password`. Server tự đặt `role` thành `technician`
và trạng thái phê duyệt thành `pending`; ứng viên không thể tự chọn role và chưa
thể đăng nhập khi hồ sơ chưa được duyệt.

Admin Web dùng token quản trị để:

- `GET /api/technicians/pending`: lấy các hồ sơ đang chờ duyệt.
- `PUT /api/technicians/:id/approve`: phê duyệt một hồ sơ đang chờ.

Sau khi phê duyệt, kỹ thuật viên có thể đăng nhập từ màn hình đăng nhập kỹ thuật
viên trong ứng dụng mobile. Dữ liệu hồ sơ được lưu trong cơ sở dữ liệu của server;
Admin Web đọc và cập nhật dữ liệu qua API, không ghi vào thư mục `admin-web`.

## Luồng đơn sửa xe

Đơn hàng được lưu trong collection `orders`. Luồng trạng thái mới:

`PENDING` → `ACCEPTED` → `INSPECTING` → (`AWAITING_PARTS_APPROVAL` nếu có phụ tùng) → `REPAIRING` → `COMPLETED`.

Khách hàng chỉ hủy khi đơn ở `PENDING` hoặc `ACCEPTED`. Khi kỹ thuật viên đề xuất phụ tùng,
khách có thể đồng ý để phụ tùng được cộng vào hóa đơn hoặc từ chối để đơn trở về `INSPECTING`.
Hóa đơn chốt `totalPrice` và `completedAt` khi đơn hoàn thành; khách và kỹ thuật viên có thể
lưu đánh giá riêng một lần sau khi hoàn thành.

Các API chính (đều có tiền tố `/api` và yêu cầu Bearer token):

- `GET /orders/customer/mine`: lịch sử của khách hàng đang đăng nhập.
- `GET /orders/mine`: lịch sử/đơn của kỹ thuật viên đang đăng nhập.
- `PUT /orders/:id/cancel`: khách hủy trước khi bắt đầu kiểm tra.
- `PUT /orders/:id/inspect`, `PUT /orders/:id/repair`: kỹ thuật viên cập nhật tiến độ.
- `PUT /orders/:id/parts/propose`: kỹ thuật viên gửi `{ name, quantity, unitPrice }`.
- `PUT /orders/:id/parts/respond`: khách gửi `{ accepted: true|false }`.
- `PUT /orders/:id/complete`: kỹ thuật viên hoàn tất và chốt hóa đơn.
- `PUT /orders/:id/customer-rating`, `PUT /orders/:id/technician-rating`: lưu đánh giá sau hoàn thành.
