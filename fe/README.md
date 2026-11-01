# ROMS — Giao diện Web Responsive Phân hệ Phục vụ Nhà hàng

Giao diện người dùng (Frontend UI) cho nhân viên phục vụ thuộc hệ thống quản lý đặt món nhà hàng **ROMS**, xây dựng bằng **ReactJS + Vite + Tailwind CSS + React Router**.

## 1. Hướng dẫn chạy dự án

```bash
cd fe
npm install
npm run dev
```

Sau khi chạy, mở trình duyệt tại địa chỉ: `http://localhost:5173`

## 2. Tài khoản đăng nhập giả lập (Mock Accounts)

| Nhân viên | Tên đăng nhập | Mật khẩu | Vai trò |
|---|---|---|---|
| **Nguyễn Văn A** | `nguyenvana` | `123456` | Phục vụ |
| **Trần Bích Ngọc** | `tranbichngoc` | `123456` | Phục vụ |

*(Trên trang đăng nhập có sẵn nút chọn điền nhanh tài khoản giả lập để thuận tiện kiểm thử).*

## 3. Cấu trúc thư mục

```text
fe/src/
├── main.jsx                         # Điểm khởi chạy ứng dụng React
├── App.jsx                          # Cấu hình định tuyến (React Router) & bảo vệ route
├── index.css                        # Thiết lập style chủ đạo & font Be Vietnam Pro
├── context/
│   └── RomsContext.jsx              # Quản lý trạng thái toàn cục & đồng bộ REST API (Auth, Bàn, Giỏ gọi món, Đơn hàng)
├── utils/
│   ├── constants.js                 # Hằng số trạng thái món ăn (DISH_STATUS) & trạng thái bàn (TABLE_STATUS)
│   └── formatters.js                # Hàm định dạng tiền tệ & tính toán quy tắc nghiệp vụ
├── components/
│   ├── common/
│   │   ├── TableIcon.jsx            # Biểu tượng bàn nhà hàng & Logo ROMS SVG
│   │   ├── DishStatusBadge.jsx      # Nhãn hiển thị 5 trạng thái món ăn nhất quán
│   │   └── ToastBanner.jsx          # Thông báo phản hồi thao tác trực quan
│   └── layout/
│       ├── AppLayout.jsx            # Bố cục Web Responsive (Desktop Sidebar + Mobile Bottom Nav)
│       ├── Header.jsx               # Thanh tiêu đề, thông báo & nút làm mới dữ liệu mẫu
│       ├── Sidebar.jsx              # Thanh điều hướng bên trái cho Desktop
│       └── MobileNav.jsx            # Thanh điều hướng dưới đáy cho Mobile/Tablet
└── pages/
    ├── LoginPage.jsx                # Trang đăng nhập (ẩn/hiện mật khẩu, kiểm tra lỗi)
    ├── TableMapPage.jsx             # Màn hình Sơ đồ bàn & Tóm tắt đơn hàng đang mở
    ├── MenuOrderPage.jsx            # Màn hình Thực đơn & Gọi món (tạo mới & gọi thêm món)
    ├── OrderTrackingPage.jsx        # Màn hình Theo dõi món (Chế độ Theo món & Tổng thể)
    ├── PaymentPage.jsx              # Luồng Thanh toán & Xác nhận gửi yêu cầu thu ngân
    └── ProfilePage.jsx              # Màn hình Thông tin cá nhân & Đăng xuất
```

