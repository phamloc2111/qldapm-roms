# ROMS — Giao diện Web Responsive Phân hệ Phục vụ & Nhà bếp

Giao diện người dùng (Frontend UI) cho nhân viên **Phục vụ** và **Nhà bếp** thuộc hệ thống quản lý đặt món nhà hàng **ROMS**, xây dựng bằng **ReactJS + Vite + Tailwind CSS + React Router**, tích hợp trực tiếp với Backend Spring Boot qua REST API và xác thực bảo mật JWT.

Ảnh của 50 món mẫu dùng link HTTPS trực tiếp trên web, ánh xạ theo đúng tên món trong `src/data/menuImages.json`; trang nguồn từng ảnh nằm trong `src/data/menuImageSources.json`. Các màn gọi món, nhà bếp, theo dõi và thu ngân dùng chung `src/utils/dishImages.js`: ưu tiên URL ảnh riêng đã nhập; nếu chưa nhập, còn dùng đường dẫn ảnh local cũ hoặc ảnh salad mặc định cũ thì lấy link web theo tên món. Món chưa có ảnh hoặc tải ảnh lỗi hiển thị ô “Chưa có ảnh”. Form thêm/sửa món để trống URL sẽ lưu `null`, không lưu ảnh mặc định. Ảnh món được tải trực tiếp từ website nguồn, không đóng gói file ảnh món trong frontend.


## 1. Cấu trúc thư mục dự án

```text
fe/src/
├── main.jsx                         # Điểm khởi chạy ứng dụng React
├── App.jsx                          # Cấu hình định tuyến (React Router) & bảo vệ route theo vai trò
├── index.css                        # Thiết lập style chủ đạo (Tailwind CSS v4 & font Be Vietnam Pro)
├── context/
│   └── RomsContext.jsx              # Quản lý trạng thái toàn cục & đồng bộ REST API (Auth, Bàn, Giỏ món, Đơn hàng)
├── utils/
│   ├── constants.js                 # Hằng số trạng thái món ăn (DISH_STATUS) & trạng thái bàn (TABLE_STATUS)
│   └── formatters.js                # Hàm định dạng tiền tệ & tính toán quy tắc nghiệp vụ
├── components/
│   ├── common/
│   │   ├── TableIcon.jsx            # Biểu tượng bàn nhà hàng & Logo ROMS SVG
│   │   ├── DishStatusBadge.jsx      # Nhãn hiển thị 5 trạng thái món ăn nhất quán
│   │   └── ToastBanner.jsx          # Thông báo phản hồi thao tác trực quan
│   └── layout/
│       ├── AppLayout.jsx            # Bố cục Responsive cho Phục vụ (Desktop Sidebar + Mobile Bottom Nav)
│       ├── Header.jsx               # Thanh tiêu đề, thông báo & trạng thái đồng bộ
│       ├── Sidebar.jsx              # Thanh điều hướng bên trái cho Desktop
│       └── MobileNav.jsx            # Thanh điều hướng dưới đáy cho Mobile/Tablet
└── pages/
    ├── LoginPage.jsx                # Trang đăng nhập xác thực JWT (ẩn/hiện mật khẩu, kiểm tra lỗi)
    ├── TableMapPage.jsx             # Sơ đồ bàn ăn & Tóm tắt đơn hàng đang mở
    ├── MenuOrderPage.jsx            # Thực đơn & Gọi món (tạo mới & gọi thêm món vào đơn)
    ├── OrderTrackingPage.jsx        # Theo dõi món theo bàn (xác nhận phục vụ / hủy món đang chờ)
    ├── PaymentPage.jsx              # Tóm tắt hóa đơn & gửi yêu cầu thanh toán sang thu ngân
    ├── KitchenPage.jsx              # Màn hình Nhà bếp KDS (hàng đợi FIFO, đổi trạng thái món, báo hết món)
    ├── CashierPage.jsx              # Màn hình Thu Ngân POS (4 tab: Thanh toán, Thực đơn, Sơ đồ bàn, Báo cáo)
    └── ProfilePage.jsx              # Thông tin tài khoản nhân viên & Đăng xuất
```
