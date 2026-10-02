### **TÀI LIỆU THIẾT KẾ HỆ THỐNG**

**Tên Đề Tài:** Xây dựng nền tảng kết nối dịch vụ chăm sóc, sửa chữa xe tại nhà"

**Sinh viên 1:** Nguyễn Phạm Quỳnh Long - MSSV: 2174802010089

**Sinh viên 2:** Ngô Minh Hưởng - MSSV:

**Giảng viên hướng dẫn:** Nguyễn Trí Hải

**Phiên bản:** 1.0

**Ngày:** Tháng 10, 2026

**Người viết:** Đội phát triển

**Trạng thái:** Dự thảo

---

### 1.Mô tả đề tài

## 1.1 giới thiệu đề tài 

Nền tảng ** Sửa chữa, chăm sóc xe tại nhà ** là nền tảng kết nối dịch vụ chăm sóc, sửa chữa xe tại nhà, nhằm cung cấp hướng dẫn rõ ràng cho quá trình phát triển, kiểm thử và triển khai.

## 1.2 Phạm vi đề tài

* **Nền tảng bao gồm ứng dụng chính**
    * **Ứng dụng khách hàng (customer):** Ứng dụng cho chủ xe ôtô/xe máy
    * **Ứng dụng kỹ thuật viên (Technician)** Ứng dụng cho kỹ thuật viên nhận việc
    * **Trang web admin (doanh nghiệp)** Trang dành cho doanh nghiệp quản lý hoạt dộng

## 1.3 Các bên liên quan

* **Chủ xe (customer)** Người dùng sở hữu xe máy/ ôtô đặt lịch
* **Kỹ thuật viên (technician)** Là người chuyên sửa xe, bảo dưỡng xe.
* **Gara (doanh nghiệp):** Cơ sở kinh doánh sửa xe.
* **Quản trị viên (Admin):** người quản lý hệ thống cho doanh nghiệp.

---

### 2.Tổng quan về hệ thống
## 2.1 Mô tả chung
nền tảng kết nối trực tiếp với kỹ thuật viên/gara để cung cấp các dịch vụ chăm sóc, bảo dưỡng, sửa chữa tại nhà.Hệ thống sử dụng công nghệ định vị để tìm kỹ thuật viên gần nhất, thuật toán ghép cặp thông minh, theo dõi thời gian thực và thanh toán trực tuyến.

## 2.2 Các tính năng chính
**1. Đặt lịch dịch vụ:** chủ xe chọn loại dịch vụ, địa điểm, thới gian.
**2. Ghép cặp tự động (Macthing):** Hệ thống tìm kỹ thuật viên phù hợp dựa vào vị trí và tọa độ.
**3.Theo thời gian thực:** GPS tracking, cập nhậ trạng thái dịch vụ theo thời gian thực. 
**4. Đánh giá hai chiều:** Cả khách hàng và kỹ thuật viên có thể đánh giá nhau
**5. Thanh toán trực tuyến:** Hỗ trợ VNPay, Momo
**6. Quản lý doanh nghiệp:** Thống kê doanh thu, quản lý nhân sự, đơn hàng

---

### 3. Yêu cầu các chức năng (Functional Requirements)
Dưới đâu là các yêu cầu chi tiết của hệ thống, được mô tả dưới dạng User Stories

## 3.1 Quản lý tài khoản (Account Management)
* **ID:FR-001: Khách hàng đăng ký tài khoản**
    * **Mô tả:** Là một Người dùng, tôi muốn đăng ký tài khoản để sử dụng các dịch vụ
* **Yêu cầu**
    * Đăng ký tài khoản qua nhập tên tài khoản, số điện thoại hoặc email
    * Chọn hoặc tự động thuộc loại tài khoản (khách hàng/kỹ thuật viên)

* **ID:FR-002: Kỹ thuật viên đăng ký tài khoản**
    * **Mô tả:** Là một người dùng đã qua đào tạo sửa chữa xe, tôi muốn đăng ký tài khoản để tôi có thể trở thành nhân viên của doanh nghiệp.
* **Yêu cầu**
    * Có CV ứng tuyển doanh nghiệp
    * Phỏng vấn
    * Doanh nghiệp sẽ báo với Admin tạo tài khoản

## 3.2 Đăng nhập
* **ID:FR-003: Đăng nhập**
    * **Mô tả:** Là một Người dùng, tôi muốn đăng nhập để tôi sử dụng các dịch vụ
* **Yêu cầu**
    * Có tài khoản trên hê thống gồm Tên tài khoản, mật khẩu
    * Ghi nhớ đăng nhập tùy chọn
    * Khôi phục mật khẩu qua email/SĐT


