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
