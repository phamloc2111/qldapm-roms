# ROMS — Giao diện Web Responsive Phân hệ Phục vụ & Nhà bếp

Giao diện người dùng (Frontend UI) cho nhân viên **Phục vụ** và **Nhà bếp** thuộc hệ thống quản lý đặt món nhà hàng **ROMS**, xây dựng bằng **ReactJS + Vite + Tailwind CSS + React Router**, tích hợp trực tiếp với Backend Spring Boot qua REST API và xác thực bảo mật JWT.

---

## 1. Yêu cầu trước khi chạy

- **Node.js**: 18+ 
- **Backend API**: Đang chạy tại `http://localhost:8080` (sử dụng H2 in-memory hoặc PostgreSQL)

---

## 2. Quy trình khởi chạy

### B1: Khởi động Backend

```powershell
cd be
$env:AUTH_JWT_SECRET="MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="
$env:AUTH_BOOTSTRAP_USERNAME="admin"
$env:AUTH_BOOTSTRAP_PASSWORD="adminpassword123"
mvn spring-boot:run
```


---

### B2: Setup trước Dữ liệu (Tài khoản, Bàn ăn & Thực đơn)

> Database chưa có tài khoản Phục vụ, Nhà bếp, Bàn ăn hay Thực đơn. Ngoài ra, cơ sở dữ liệu mặc định là **H2 in-memory** (sẽ làm mới mỗi khi tắt backend).

Mở **PowerShell** mới:

```powershell
$baseUrl = "http://localhost:8080/api/v1"

function Post-Json($path, $obj, $headers = @{}) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Depth 5))
    return Invoke-RestMethod -Uri "$baseUrl$path" -Method POST -Headers $headers -ContentType "application/json; charset=utf-8" -Body $bytes
}

# 1. Đăng nhập Admin lấy JWT Token
$login = Post-Json "/auth/login" @{ username = "admin"; password = "adminpassword123" }
$auth = @{ Authorization = "Bearer $($login.accessToken)" }

# 2. Tạo tài khoản Phục vụ (WAITER) & Nhà bếp (KITCHEN)
try { Post-Json "/users" @{ username = "waiter01";  password = "password123456"; role = "WAITER" }  $auth | Out-Null } catch {}
try { Post-Json "/users" @{ username = "kitchen01"; password = "password123456"; role = "KITCHEN" } $auth | Out-Null } catch {}

# 3. Tạo 6 Bàn ăn
@(
    @{ name = "Bàn 01"; capacity = 2 },
    @{ name = "Bàn 02"; capacity = 2 },
    @{ name = "Bàn 03"; capacity = 4 },
    @{ name = "Bàn 04"; capacity = 4 },
    @{ name = "Bàn 05"; capacity = 6 },
    @{ name = "Bàn 06"; capacity = 8 }
) | ForEach-Object { try { Post-Json "/tables" $_ $auth | Out-Null } catch {} }

# 4. Tạo Danh mục món ăn
$catKhaiVi   = Post-Json "/categories" @{ name = "Khai vị" }   $auth
$catMonChinh = Post-Json "/categories" @{ name = "Món chính" } $auth
$catDoUong   = Post-Json "/categories" @{ name = "Đồ uống" }   $auth

# 5. Tạo Thực đơn món ăn
@(
    @{ categoryId = $catKhaiVi.id;   name = "Gỏi cuốn tôm thịt";   priceVnd = 45000; description = "Tôm tươi, thịt ba chỉ, rau sống."; imageUrl = "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80" },
    @{ categoryId = $catKhaiVi.id;   name = "Chả giò hải sản";     priceVnd = 55000; description = "Chả giò nhân tôm cua chiên giòn."; imageUrl = "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=400&q=80" },
    @{ categoryId = $catMonChinh.id; name = "Phở bò tái nạm";      priceVnd = 70000; description = "Nước dùng xương hầm, thịt bò tái."; imageUrl = "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=400&q=80" },
    @{ categoryId = $catMonChinh.id; name = "Cơm tấm sườn bì chả"; priceVnd = 65000; description = "Sườn nướng mật ong, bì, chả trứng."; imageUrl = "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80" },
    @{ categoryId = $catDoUong.id;   name = "Trà đào cam sả";      priceVnd = 35000; description = "Trà đen ủ lạnh với đào miếng và sả."; imageUrl = "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80" },
    @{ categoryId = $catDoUong.id;   name = "Cà phê sữa đá";       priceVnd = 29000; description = "Cà phê phin truyền thống đậm vị."; imageUrl = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80" }
) | ForEach-Object { Post-Json "/menu-items" $_ $auth | Out-Null }

Write-Host ">>> Đã nạp thành công Bàn ăn, Danh mục và Thực đơn!" -ForegroundColor Green
```

---

### B3: Khởi động Frontend

```bash
cd fe
npm install
npm run dev
```

Truy cập ứng dụng tại: **`http://localhost:5173`**


## 3. Tài khoản đăng nhập theo vai trò

| Phân hệ / Vai trò | Tên đăng nhập | Mật khẩu mẫu | Điều hướng mặc định | Mô tả chức năng |
| :--- | :--- | :--- | :--- | :--- |
| **Phục vụ** (`WAITER`) | `waiter01` | `password123456` | `/tables` (Sơ đồ bàn) | Xem trạng thái bàn, tạo đơn / gọi thêm món, theo dõi tiến độ món ăn, gửi yêu cầu thanh toán |
| **Nhà bếp** (`KITCHEN`) | `kitchen01` | `password123456` | `/kitchen` (Màn hình bếp) | Xem hàng đợi món theo thứ tự FIFO, chuyển trạng thái chế biến (*Chờ nấu ➔ Đang nấu ➔ Đã xong*), báo hết hàng / mở bán món |
| **Thu ngân** (`CASHIER`) | `cashier01` *(hoặc `cashier`)* | `password123456` | `/cashier` (Giao diện Thu Ngân) | 4 Tab: **Thanh toán POS**, **Quản lý Thực đơn**, **Quản lý Sơ đồ bàn**, **Báo cáo Doanh thu** & In hóa đơn |


---

## 4. Cấu hình cho Production

Thiết lập biến môi trường `VITE_API_BASE_URL` :

1. **C1 Cấu hình biến trên nền tảng Deploy:**
   - Cấu hình biến: `VITE_API_BASE_URL` = `api backend product`

2. **C2 Sử dụng file môi trường `.env.production`:**
   - Tạo file `fe/.env.production`:
     ```env
     VITE_API_BASE_URL= api product
     ```

> **Đồng bộ ở Backend:** Khi triển khai Production, Backend cần cấu hình biến môi trường `FRONTEND_URL` để mở quyền CORS cho phép Frontend truy cập API.

---

## 5. Cấu trúc thư mục dự án

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
